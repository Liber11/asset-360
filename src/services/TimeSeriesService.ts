import type { CogniteClient } from '@cognite/sdk';

import { CDM_VIEWS, readRef, readString, refKey, viewProps } from '../domain/cdm';
import type { TimeWindow } from '../domain/timeRange';
import type { InstanceRef } from '../state/workspaceState';

import { listRelatedNodes, type AssetScope } from './relatedNodes';

export type SeriesInfo = {
  ref: InstanceRef;
  name: string;
  description?: string;
  /** Unit symbol from CogniteUnit, falling back to the source system's unit. */
  unit?: string;
  /** Only numeric series can be plotted. */
  isNumeric: boolean;
};

export type Point = { timestamp: number; value: number };

export type SeriesList = { items: SeriesInfo[]; hasMore: boolean };

export interface TimeSeriesService {
  listForAsset(asset: InstanceRef, scope?: AssetScope): Promise<SeriesList>;
  /** Newest datapoint per series, keyed by `refKey`. Series without datapoints are absent. */
  getLatest(refs: InstanceRef[]): Promise<Map<string, Point>>;
  /** Average aggregates per series in `window`, keyed by `refKey`. */
  getDatapoints(refs: InstanceRef[], window: TimeWindow, granularity: string): Promise<Map<string, Point[]>>;
}

export type TimeSeriesClient = {
  instances: Pick<CogniteClient['instances'], 'list' | 'retrieve'>;
  datapoints: Pick<CogniteClient['datapoints'], 'retrieve' | 'retrieveLatest'>;
};

/** Generous per-series cap; with GRANULARITY each chart needs a few hundred points. */
const DATAPOINT_LIMIT = 10_000;

function hasNumber<K extends string>(value: unknown, key: K): value is Record<K, number> {
  return typeof value === 'object' && value !== null && key in value && typeof Reflect.get(value, key) === 'number';
}

function hasDate(value: unknown): value is { timestamp: Date } {
  return typeof value === 'object' && value !== null && 'timestamp' in value && value.timestamp instanceof Date;
}

function toInstanceId(ref: InstanceRef) {
  return { instanceId: { space: ref.space, externalId: ref.externalId } };
}

class CdmTimeSeriesService implements TimeSeriesService {
  constructor(private readonly client: TimeSeriesClient) {}

  async listForAsset(asset: InstanceRef, scope?: AssetScope): Promise<SeriesList> {
    const { items, hasMore } = await listRelatedNodes(this.client, CDM_VIEWS.timeSeries, asset, {
      includeSubAssets: scope?.includeSubAssets,
    });

    const unitRefs = new Map<string, InstanceRef>();
    for (const item of items) {
      const unit = readRef(viewProps(item, CDM_VIEWS.timeSeries), 'unit');
      if (unit) unitRefs.set(refKey(unit), unit);
    }
    const symbols = await this.unitSymbols([...unitRefs.values()]);

    const series = items.map((item): SeriesInfo => {
      const props = viewProps(item, CDM_VIEWS.timeSeries);
      const unit = readRef(props, 'unit');
      const type = readString(props, 'type');
      return {
        ref: { space: item.space, externalId: item.externalId },
        name: readString(props, 'name') || item.externalId,
        description: readString(props, 'description'),
        unit: (unit && symbols.get(refKey(unit))) || readString(props, 'sourceUnit'),
        isNumeric: type === undefined || type === 'numeric',
      };
    });

    return { items: series.sort((a, b) => a.name.localeCompare(b.name)), hasMore };
  }

  async getLatest(refs: InstanceRef[]): Promise<Map<string, Point>> {
    if (refs.length === 0) return new Map();
    const response = await this.client.datapoints.retrieveLatest(
      refs.map((ref) => ({ ...toInstanceId(ref), before: 'now' })),
      { ignoreUnknownIds: true }
    );

    const latest = new Map<string, Point>();
    for (const series of response) {
      const point = series.datapoints[0];
      if (series.instanceId && hasDate(point) && hasNumber(point, 'value')) {
        latest.set(refKey(series.instanceId), { timestamp: point.timestamp.getTime(), value: point.value });
      }
    }
    return latest;
  }

  async getDatapoints(refs: InstanceRef[], window: TimeWindow, granularity: string): Promise<Map<string, Point[]>> {
    if (refs.length === 0) return new Map();
    const response = await this.client.datapoints.retrieve({
      items: refs.map(toInstanceId),
      start: window.start,
      end: window.end,
      aggregates: ['average'],
      granularity,
      limit: DATAPOINT_LIMIT,
      ignoreUnknownIds: true,
    });

    const result = new Map<string, Point[]>();
    for (const series of response) {
      if (!series.instanceId) continue;
      const points: Point[] = [];
      for (const point of series.datapoints) {
        if (hasDate(point) && hasNumber(point, 'average')) {
          points.push({ timestamp: point.timestamp.getTime(), value: point.average });
        }
      }
      result.set(refKey(series.instanceId), points);
    }
    return result;
  }

  private async unitSymbols(refs: InstanceRef[]): Promise<Map<string, string>> {
    if (refs.length === 0) return new Map();
    const { items } = await this.client.instances.retrieve({
      items: refs.map((ref) => ({ instanceType: 'node', ...ref })),
      sources: [{ source: CDM_VIEWS.unit }],
    });
    const symbols = new Map<string, string>();
    for (const item of items) {
      const symbol = readString(viewProps(item, CDM_VIEWS.unit), 'symbol');
      if (symbol) symbols.set(refKey({ space: item.space, externalId: item.externalId }), symbol);
    }
    return symbols;
  }
}

export function createTimeSeriesService(client: TimeSeriesClient): TimeSeriesService {
  return new CdmTimeSeriesService(client);
}
