import { describe, expect, it, vi } from 'vitest';

import { CDM_VIEWS } from '../domain/cdm';

import { listRelatedNodes, RELATED_LIMIT, type ListInstancesClient } from './relatedNodes';

describe(listRelatedNodes.name, () => {
  it('lists nodes of the view whose assets contain the asset', async () => {
    const client = makeClient({ items: [], nextCursor: undefined });

    await listRelatedNodes(client, CDM_VIEWS.activity, { space: 'sp', externalId: 'a1' });

    expect(client.instances.list).toHaveBeenCalledWith({
      instanceType: 'node',
      sources: [{ source: CDM_VIEWS.activity }],
      filter: {
        containsAny: {
          property: ['cdf_cdm', 'CogniteActivity/v1', 'assets'],
          values: [{ space: 'sp', externalId: 'a1' }],
        },
      },
      limit: RELATED_LIMIT,
    });
  });

  it('reports whether more items exist beyond the limit', async () => {
    const more = await listRelatedNodes(makeClient({ items: [], nextCursor: 'c' }), CDM_VIEWS.file, ref());
    const done = await listRelatedNodes(makeClient({ items: [] }), CDM_VIEWS.file, ref());

    expect(more.hasMore).toBe(true);
    expect(done.hasMore).toBe(false);
  });

  it('propagates API errors', async () => {
    const client = makeClient({ items: [] });
    vi.mocked(client.instances.list).mockRejectedValue({ status: 400 });

    await expect(listRelatedNodes(client, CDM_VIEWS.file, ref())).rejects.toEqual({ status: 400 });
  });
});

function ref() {
  return { space: 'sp', externalId: 'a1' };
}

function makeClient(response: Awaited<ReturnType<ListInstancesClient['instances']['list']>>): ListInstancesClient {
  return { instances: { list: vi.fn<ListInstancesClient['instances']['list']>(() => Promise.resolve(response)) } };
}
