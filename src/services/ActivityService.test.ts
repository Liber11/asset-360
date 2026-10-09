import type { NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { CDM_VIEWS } from '../domain/cdm';

import { createActivityService } from './ActivityService';
import type { ListInstancesClient } from './relatedNodes';

describe('ActivityService', () => {
  it('lists CogniteActivity nodes linked to the asset', async () => {
    const client = makeClient([]);

    await createActivityService(client).listForAsset({ space: 'sp', externalId: 'a1' });

    expect(client.instances.list).toHaveBeenCalledWith(
      expect.objectContaining({ sources: [{ source: CDM_VIEWS.activity }] })
    );
  });

  it('maps activities to work orders sorted most recent first', async () => {
    const client = makeClient([
      activity('old', {
        name: 'Lubrication',
        sourceId: '4001',
        endTime: '2023-01-01T00:00:00.000+00:00',
        source: { space: 'sp', externalId: 'SAP' },
      }),
      activity('new', { description: 'Replace bearing', scheduledEndTime: '2024-05-01T00:00:00.000+00:00' }),
    ]);

    const result = await createActivityService(client).listForAsset({ space: 'sp', externalId: 'a1' });

    expect(result.hasMore).toBe(false);
    expect(result.items).toEqual([
      {
        ref: { space: 'sp', externalId: 'new' },
        identifier: 'new',
        name: 'new',
        description: 'Replace bearing',
        startTime: undefined,
        endTime: undefined,
        scheduledStartTime: undefined,
        scheduledEndTime: '2024-05-01T00:00:00.000+00:00',
        source: undefined,
      },
      {
        ref: { space: 'sp', externalId: 'old' },
        identifier: '4001',
        name: 'Lubrication',
        description: undefined,
        startTime: undefined,
        endTime: '2023-01-01T00:00:00.000+00:00',
        scheduledStartTime: undefined,
        scheduledEndTime: undefined,
        source: 'SAP',
      },
    ]);
  });

  it('propagates API errors', async () => {
    const client = makeClient([]);
    vi.mocked(client.instances.list).mockRejectedValue({ status: 403 });

    await expect(createActivityService(client).listForAsset({ space: 'sp', externalId: 'a1' })).rejects.toEqual({
      status: 403,
    });
  });
});

function makeClient(items: NodeOrEdge[]): ListInstancesClient {
  return { instances: { list: vi.fn<ListInstancesClient['instances']['list']>(() => Promise.resolve({ items })) } };
}

function activity(externalId: string, props: Record<string, unknown>): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp',
    externalId,
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    properties: { cdf_cdm: { 'CogniteActivity/v1': props } },
  } as Partial<NodeOrEdge> as NodeOrEdge;
}
