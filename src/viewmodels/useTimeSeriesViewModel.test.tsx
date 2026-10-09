import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeHostApi, makeProviders, makeServices, makeTimeSeriesService } from '../__mocks__/testProviders';
import { RANGE_MS } from '../domain/timeRange';
import type { SeriesInfo, TimeSeriesService } from '../services/TimeSeriesService';

import { useTimeSeriesViewModel } from './useTimeSeriesViewModel';

const ASSET = { space: 'sp', externalId: 'pump-101' };
const PRESSURE: SeriesInfo = { ref: { space: 'sp', externalId: 'ts-p' }, name: 'Pressure', unit: 'bar', isNumeric: true };
const STATE: SeriesInfo = { ref: { space: 'sp', externalId: 'ts-s' }, name: 'State', isNumeric: false };
const LATEST = Date.UTC(2019, 0, 18);

describe(useTimeSeriesViewModel.name, () => {
  it('lists the series of the selected asset without plotting any by default', async () => {
    const service = makeTimeSeriesService({
      listForAsset: vi.fn(() => Promise.resolve({ items: [PRESSURE, STATE], hasMore: false })),
    });
    const { result } = renderVm(service);

    await waitFor(() => expect(result.current.listStatus).toBe('success'));
    expect(service.listForAsset).toHaveBeenCalledWith(ASSET);
    expect(result.current.series).toEqual([PRESSURE, STATE]);
    expect(result.current.chartStatus).toBe('idle');
    expect(service.getLatest).not.toHaveBeenCalled();
  });

  it('reports list errors', async () => {
    const { result } = renderVm(
      makeTimeSeriesService({ listForAsset: vi.fn(() => Promise.reject(new Error('boom'))) })
    );

    await waitFor(() => expect(result.current.listStatus).toBe('error'));
    expect(result.current.listErrorMessage).toBe('boom');
  });

  it('plots a selected series in a window anchored to its latest datapoint', async () => {
    const service = plottingService();
    const api = makeHostApi();
    const { result } = renderVm(service, {}, api);
    await waitFor(() => expect(result.current.listStatus).toBe('success'));

    act(() => result.current.toggleSeries(PRESSURE));

    await waitFor(() => expect(result.current.chartStatus).toBe('success'));
    expect(result.current.isSelected(PRESSURE)).toBe(true);
    expect(api.syncInternalState).toHaveBeenLastCalledWith(expect.stringContaining('"selectedSeries":[{"space":"sp"'));
    expect(service.getDatapoints).toHaveBeenCalledWith(
      [PRESSURE.ref],
      { start: LATEST + 1 - RANGE_MS['7d'], end: LATEST + 1 },
      '1h'
    );
    expect(result.current.charts).toEqual([
      { series: PRESSURE, points: [{ timestamp: LATEST, value: 3 }], latest: { timestamp: LATEST, value: 3 } },
    ]);
  });

  it('ignores selections that are not numeric or not on this asset', async () => {
    const service = plottingService();
    const { result } = renderVm(service, {
      selectedSeries: [STATE.ref, { space: 'sp', externalId: 'other-asset-series' }],
    });

    await waitFor(() => expect(result.current.listStatus).toBe('success'));
    expect(result.current.chartStatus).toBe('idle');
    expect(service.getLatest).not.toHaveBeenCalled();
  });

  it('reports no-data when the selected series have no datapoints at all', async () => {
    const service = plottingService({ getLatest: vi.fn(() => Promise.resolve(new Map())) });
    const { result } = renderVm(service, { selectedSeries: [PRESSURE.ref] });

    await waitFor(() => expect(result.current.chartStatus).toBe('no-data'));
    expect(service.getDatapoints).not.toHaveBeenCalled();
  });

  it('reports datapoint errors, including no-access', async () => {
    const failing = renderVm(
      plottingService({ getDatapoints: vi.fn(() => Promise.reject(new Error('dp failed'))) }),
      { selectedSeries: [PRESSURE.ref] }
    );
    const denied = renderVm(plottingService({ getLatest: vi.fn(() => Promise.reject({ status: 403 })) }), {
      selectedSeries: [PRESSURE.ref],
    });

    await waitFor(() => expect(failing.result.current.chartStatus).toBe('error'));
    expect(failing.result.current.chartErrorMessage).toBe('dp failed');
    await waitFor(() => expect(denied.result.current.chartStatus).toBe('no-access'));
  });

  it('changes the range and refetches with the matching granularity', async () => {
    const service = plottingService();
    const { result } = renderVm(service, { selectedSeries: [PRESSURE.ref] });
    await waitFor(() => expect(result.current.chartStatus).toBe('success'));

    act(() => result.current.setRange('1y'));

    await waitFor(() =>
      expect(service.getDatapoints).toHaveBeenLastCalledWith(
        [PRESSURE.ref],
        { start: LATEST + 1 - RANGE_MS['1y'], end: LATEST + 1 },
        '1d'
      )
    );
    expect(result.current.range).toBe('1y');
  });

  it('refreshes only on demand', async () => {
    const service = plottingService();
    const { result } = renderVm(service, { selectedSeries: [PRESSURE.ref] });
    await waitFor(() => expect(result.current.chartStatus).toBe('success'));
    expect(service.getDatapoints).toHaveBeenCalledTimes(1);

    act(() => result.current.refresh());

    await waitFor(() => expect(service.getDatapoints).toHaveBeenCalledTimes(2));
    expect(service.getLatest).toHaveBeenCalledTimes(2);
  });

  it('deselects a series', async () => {
    const { result } = renderVm(plottingService(), { selectedSeries: [PRESSURE.ref] });
    await waitFor(() => expect(result.current.chartStatus).toBe('success'));

    act(() => result.current.toggleSeries(PRESSURE));

    expect(result.current.chartStatus).toBe('idle');
  });
});

function plottingService(overrides: Partial<TimeSeriesService> = {}): TimeSeriesService {
  const point = { timestamp: LATEST, value: 3 };
  return makeTimeSeriesService({
    listForAsset: vi.fn(() => Promise.resolve({ items: [PRESSURE, STATE], hasMore: false })),
    getLatest: vi.fn(() => Promise.resolve(new Map([['sp:ts-p', point]]))),
    getDatapoints: vi.fn(() => Promise.resolve(new Map([['sp:ts-p', [point]]]))),
    ...overrides,
  });
}

function renderVm(service: TimeSeriesService, extraState: Record<string, unknown> = {}, api = makeHostApi()) {
  const services = makeServices({ timeSeriesService: service });
  const initialState = JSON.stringify({ selectedAsset: ASSET, ...extraState });
  return renderHook(() => useTimeSeriesViewModel(), { wrapper: makeProviders({ services, api, initialState }) });
}
