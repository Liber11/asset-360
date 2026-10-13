import type { NodeOrEdge } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CDM_VIEWS } from '../domain/cdm';

import { createTimeSeriesService, type TimeSeriesClient } from './TimeSeriesService';

type Mocked = {
  list: ReturnType<typeof vi.fn<TimeSeriesClient['instances']['list']>>;
  search: ReturnType<typeof vi.fn<TimeSeriesClient['instances']['search']>>;
  retrieve: ReturnType<typeof vi.fn<TimeSeriesClient['instances']['retrieve']>>;
  dpRetrieve: ReturnType<typeof vi.fn<TimeSeriesClient['datapoints']['retrieve']>>;
  latest: ReturnType<typeof vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>>;
};

describe('TimeSeriesService', () => {
  let mocks: Mocked;
  let client: TimeSeriesClient;

  beforeEach(() => {
    mocks = {
      list: vi.fn<TimeSeriesClient['instances']['list']>(() => Promise.resolve({ items: [] })),
      search: vi.fn<TimeSeriesClient['instances']['search']>(() => Promise.resolve({ items: [] })),
      retrieve: vi.fn<TimeSeriesClient['instances']['retrieve']>(() => Promise.resolve({ items: [] })),
      dpRetrieve: vi.fn<TimeSeriesClient['datapoints']['retrieve']>(() => Promise.resolve([])),
      latest: vi.fn<TimeSeriesClient['datapoints']['retrieveLatest']>(() => Promise.resolve([])),
    };
    client = {
      instances: { list: mocks.list, search: mocks.search, retrieve: mocks.retrieve },
      datapoints: { retrieve: mocks.dpRetrieve, retrieveLatest: mocks.latest },
    };
  });

  describe('listForAsset', () => {
    it('lists linked series sorted by name with unit symbols resolved', async () => {
      const unitRef = { space: 'cdf_cdm_units', externalId: 'pressure:bar' };
      mocks.list.mockResolvedValue({
        items: [
          node('ts-b', 'CogniteTimeSeries', { name: 'B temp', sourceUnit: 'degC', type: 'numeric' }),
          node('ts-a', 'CogniteTimeSeries', { name: 'A pressure', unit: unitRef, sourceUnit: 'BAR' }),
          node('ts-c', 'CogniteTimeSeries', { name: 'C state', type: 'state' }),
        ],
      });
      mocks.retrieve.mockResolvedValue({ items: [node('pressure:bar', 'CogniteUnit', { symbol: 'bar' }, 'cdf_cdm_units')] });

      const result = await createTimeSeriesService(client).listForAsset({ space: 'sp', externalId: 'a1' });

      expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ sources: [{ source: CDM_VIEWS.timeSeries }] }));
      expect(mocks.retrieve).toHaveBeenCalledWith({
        items: [{ instanceType: 'node', ...unitRef }],
        sources: [{ source: CDM_VIEWS.unit }],
      });
      expect(result.items.map((item) => [item.name, item.unit, item.isNumeric])).toEqual([
        ['A pressure', 'bar', true],
        ['B temp', 'degC', true],
        ['C state', undefined, false],
      ]);
    });

    it('passes the sub-asset scope to the query', async () => {
      await createTimeSeriesService(client).listForAsset({ space: 'sp', externalId: 'a1' }, { includeSubAssets: true });

      expect(mocks.search).toHaveBeenCalledWith(
        expect.objectContaining({ filter: expect.objectContaining({ or: expect.any(Array) }) })
      );
    });

    it('skips the unit request when no series has a unit', async () => {
      mocks.list.mockResolvedValue({ items: [node('ts-a', 'CogniteTimeSeries', { name: 'A' })] });

      await createTimeSeriesService(client).listForAsset({ space: 'sp', externalId: 'a1' });

      expect(mocks.retrieve).not.toHaveBeenCalled();
    });

    it('propagates API errors', async () => {
      mocks.list.mockRejectedValue({ status: 500 });

      await expect(createTimeSeriesService(client).listForAsset({ space: 'sp', externalId: 'a1' })).rejects.toEqual({
        status: 500,
      });
    });
  });

  describe('getLatest', () => {
    it('requests the latest datapoint by instance id and keys numeric results', async () => {
      mocks.latest.mockResolvedValue([
        { id: 1, isString: false, instanceId: ref('ts-a'), datapoints: [{ timestamp: new Date(1000), value: 4.2 }] },
        { id: 2, isString: false, instanceId: ref('ts-b'), datapoints: [] },
        { id: 3, isString: true, instanceId: ref('ts-c'), datapoints: [{ timestamp: new Date(1000), value: 'ON' }] },
      ]);

      const latest = await createTimeSeriesService(client).getLatest([ref('ts-a'), ref('ts-b'), ref('ts-c')]);

      expect(mocks.latest).toHaveBeenCalledWith(
        [
          { instanceId: ref('ts-a'), before: 'now' },
          { instanceId: ref('ts-b'), before: 'now' },
          { instanceId: ref('ts-c'), before: 'now' },
        ],
        { ignoreUnknownIds: true }
      );
      expect([...latest]).toEqual([['sp:ts-a', { timestamp: 1000, value: 4.2 }]]);
    });

    it('makes no request for an empty selection', async () => {
      await createTimeSeriesService(client).getLatest([]);

      expect(mocks.latest).not.toHaveBeenCalled();
    });
  });

  describe('getDatapoints', () => {
    it('requests average aggregates for the window and maps them per series', async () => {
      mocks.dpRetrieve.mockResolvedValue([
        {
          id: 1,
          isString: false,
          isStep: false,
          instanceId: ref('ts-a'),
          datapoints: [
            { timestamp: new Date(10), average: 1.5 },
            { timestamp: new Date(20), count: 3 },
          ],
        },
      ]);

      const result = await createTimeSeriesService(client).getDatapoints([ref('ts-a')], { start: 0, end: 100 }, '1h');

      expect(mocks.dpRetrieve).toHaveBeenCalledWith({
        items: [{ instanceId: ref('ts-a') }],
        start: 0,
        end: 100,
        aggregates: ['average'],
        granularity: '1h',
        limit: 10_000,
        ignoreUnknownIds: true,
      });
      expect(result.get('sp:ts-a')).toEqual([{ timestamp: 10, value: 1.5 }]);
    });

    it('splits the 10,000 aggregate limit across the selected series', async () => {
      mocks.dpRetrieve.mockResolvedValue([]);

      await createTimeSeriesService(client).getDatapoints(
        [ref('ts-a'), ref('ts-b'), ref('ts-c')],
        { start: 0, end: 100 },
        '1h'
      );

      expect(mocks.dpRetrieve).toHaveBeenCalledWith(expect.objectContaining({ limit: 3_333 }));
    });

    it('makes no request for an empty selection', async () => {
      await createTimeSeriesService(client).getDatapoints([], { start: 0, end: 1 }, '1h');

      expect(mocks.dpRetrieve).not.toHaveBeenCalled();
    });

    it('propagates API errors', async () => {
      mocks.dpRetrieve.mockRejectedValue({ status: 400 });

      await expect(
        createTimeSeriesService(client).getDatapoints([ref('ts-a')], { start: 0, end: 1 }, '1h')
      ).rejects.toEqual({ status: 400 });
    });
  });
});

function ref(externalId: string) {
  return { space: 'sp', externalId };
}

function node(externalId: string, view: string, props: Record<string, unknown>, space = 'sp'): NodeOrEdge {
  return {
    instanceType: 'node',
    space,
    externalId,
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    properties: { cdf_cdm: { [`${view}/v1`]: props } },
  } as Partial<NodeOrEdge> as NodeOrEdge;
}
