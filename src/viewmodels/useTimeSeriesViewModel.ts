import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { refKey } from '../domain/cdm';
import { classifyError, errorMessage } from '../domain/errors';
import { toLoadStatus, type LoadStatus } from '../domain/loadStatus';
import { GRANULARITY, timeWindow, type TimeWindow } from '../domain/timeRange';
import { useServices } from '../services/ServicesContext';
import type { Point, SeriesInfo } from '../services/TimeSeriesService';
import { useWorkspaceState } from '../state/useWorkspaceState';
import type { TimeRangeKey } from '../state/workspaceState';

export type SeriesChart = { series: SeriesInfo; points: Point[]; latest?: Point };

export type TimeSeriesViewModel = {
  listStatus: LoadStatus;
  series: SeriesInfo[];
  hasMore: boolean;
  listErrorMessage?: string;
  retryList: () => void;
  isSelected: (series: SeriesInfo) => boolean;
  toggleSeries: (series: SeriesInfo) => void;
  range: TimeRangeKey;
  setRange: (range: TimeRangeKey) => void;
  /** `idle`: nothing selected. `no-data`: the selected series have no datapoints at all. */
  chartStatus: LoadStatus | 'idle' | 'no-data';
  chartErrorMessage?: string;
  charts: SeriesChart[];
  window: TimeWindow | null;
  /** Manual refresh only; the chart never polls (FR-006b). */
  refresh: () => void;
  isRefreshing: boolean;
};

export function useTimeSeriesViewModel(): TimeSeriesViewModel {
  const { state, update } = useWorkspaceState();
  const { timeSeriesService } = useServices();
  const asset = state.selectedAsset;
  const { includeSubAssets } = state;

  const list = useQuery({
    queryKey: ['time-series', asset ? refKey(asset) : null, includeSubAssets],
    queryFn: () =>
      asset
        ? timeSeriesService.listForAsset(asset, { includeSubAssets })
        : Promise.resolve({ items: [], hasMore: false }),
    enabled: asset !== null,
  });

  const series = useMemo(() => list.data?.items ?? [], [list.data]);
  const selectedKeys = useMemo(() => new Set(state.selectedSeries.map(refKey)), [state.selectedSeries]);
  // Only plot selections that belong to this asset and are numeric.
  const selected = useMemo(
    () => series.filter((item) => item.isNumeric && selectedKeys.has(refKey(item.ref))),
    [series, selectedKeys]
  );
  const refs = useMemo(() => selected.map((item) => item.ref), [selected]);
  const keys = useMemo(() => refs.map(refKey), [refs]);

  const latest = useQuery({
    queryKey: ['time-series-latest', keys],
    queryFn: () => timeSeriesService.getLatest(refs),
    enabled: refs.length > 0,
  });

  const window = useMemo(
    () => (latest.data ? timeWindow(state.range, keys.map((key) => latest.data.get(key)?.timestamp)) : null),
    [latest.data, keys, state.range]
  );

  const data = useQuery({
    queryKey: ['time-series-data', keys, state.range, window?.start, window?.end],
    queryFn: () =>
      window ? timeSeriesService.getDatapoints(refs, window, GRANULARITY[state.range]) : Promise.resolve(new Map()),
    enabled: window !== null,
  });

  const toggleSeries = useCallback(
    (item: SeriesInfo) => {
      const key = refKey(item.ref);
      const next = selectedKeys.has(key)
        ? state.selectedSeries.filter((ref) => refKey(ref) !== key)
        : [...state.selectedSeries, item.ref];
      update({ selectedSeries: next });
    },
    [selectedKeys, state.selectedSeries, update]
  );
  const isSelected = useCallback((item: SeriesInfo) => selectedKeys.has(refKey(item.ref)), [selectedKeys]);
  const setRange = useCallback((range: TimeRangeKey) => update({ range }), [update]);

  const { refetch: refetchList } = list;
  const retryList = useCallback(() => void refetchList(), [refetchList]);
  const { refetch: refetchLatest } = latest;
  const { refetch: refetchData } = data;
  const refresh = useCallback(() => {
    // A newer latest datapoint moves the window (new query key → automatic fetch);
    // otherwise re-fetch the same window explicitly.
    void refetchLatest().then(() => refetchData());
  }, [refetchLatest, refetchData]);

  const chartError = latest.isError ? latest.error : data.isError ? data.error : undefined;

  return {
    listStatus: toLoadStatus(list),
    series,
    hasMore: list.data?.hasMore ?? false,
    listErrorMessage: list.isError ? errorMessage(list.error) : undefined,
    retryList,
    isSelected,
    toggleSeries,
    range: state.range,
    setRange,
    chartStatus: chartStatusOf(refs.length, latest, window, data, chartError),
    chartErrorMessage: chartError === undefined ? undefined : errorMessage(chartError),
    charts: selected.map((item) => ({
      series: item,
      points: data.data?.get(refKey(item.ref)) ?? [],
      latest: latest.data?.get(refKey(item.ref)),
    })),
    window,
    refresh,
    isRefreshing: latest.isFetching || data.isFetching,
  };
}

type QueryState = { isPending: boolean; isError: boolean; error: unknown };

function chartStatusOf(
  selectedCount: number,
  latest: QueryState,
  window: TimeWindow | null,
  data: QueryState,
  error: unknown
): TimeSeriesViewModel['chartStatus'] {
  if (selectedCount === 0) return 'idle';
  if (error !== undefined) return classifyError(error);
  if (latest.isPending) return 'loading';
  if (window === null) return 'no-data';
  return toLoadStatus(data);
}
