import type { NodeOrEdge } from '@cognite/sdk';
import { assert, describe, expect, it, vi } from 'vitest';

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

  it('uses the search endpoint to also match items linked to descendants', async () => {
    // Regression: DMS rejects a nested filter on a list of direct relations (`assets`) in
    // instances.list; the search endpoint supports it for core data model assets.
    const client = makeClient({ items: [] });

    await listRelatedNodes(client, CDM_VIEWS.timeSeries, ref(), { includeSubAssets: true });

    expect(client.instances.list).not.toHaveBeenCalled();
    expect(client.instances.search).toHaveBeenCalledWith({
        view: CDM_VIEWS.timeSeries,
        instanceType: 'node',
        limit: RELATED_LIMIT,
        filter: {
          or: [
            {
              containsAny: {
                property: ['cdf_cdm', 'CogniteTimeSeries/v1', 'assets'],
                values: [{ space: 'sp', externalId: 'a1' }],
              },
            },
            {
              nested: {
                scope: ['cdf_cdm', 'CogniteTimeSeries/v1', 'assets'],
                filter: {
                  containsAny: {
                    property: ['cdf_cdm', 'CogniteAsset/v1', 'path'],
                    values: [{ space: 'sp', externalId: 'a1' }],
                  },
                },
              },
            },
          ],
        },
      });
  });

  it('reports hasMore from search when the result fills the limit', async () => {
    const client = makeClient({ items: [] });
    vi.mocked(client.instances.search).mockResolvedValue({ items: Array.from({ length: 3 }, () => makeNode()) });

    const full = await listRelatedNodes(client, CDM_VIEWS.activity, ref(), { includeSubAssets: true, maxItems: 3 });
    const partial = await listRelatedNodes(client, CDM_VIEWS.activity, ref(), { includeSubAssets: true, maxItems: 5 });

    expect(full.hasMore).toBe(true);
    expect(partial.hasMore).toBe(false);
    expect(client.instances.search).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 5 }));
  });

  it('caps search requests at the endpoint maximum of 1000', async () => {
    const client = makeClient({ items: [] });

    await listRelatedNodes(client, CDM_VIEWS.activity, ref(), { includeSubAssets: true, maxItems: 5000 });

    expect(client.instances.search).toHaveBeenCalledWith(expect.objectContaining({ limit: 1000 }));
  });

  it('reports whether more items exist beyond the limit', async () => {
    const full = Array.from({ length: RELATED_LIMIT }, () => makeNode());
    const more = await listRelatedNodes(makeClient({ items: full, nextCursor: 'c' }), CDM_VIEWS.file, ref());
    const done = await listRelatedNodes(makeClient({ items: [] }), CDM_VIEWS.file, ref());

    expect(more.hasMore).toBe(true);
    expect(done.hasMore).toBe(false);
  });

  it('follows cursors until maxItems is reached', async () => {
    const node = makeNode();
    const list = vi
      .fn<ListInstancesClient['instances']['list']>()
      .mockResolvedValueOnce({ items: [node, node], nextCursor: 'c1' })
      .mockResolvedValueOnce({ items: [node], nextCursor: 'c2' });

    const result = await listRelatedNodes({ instances: { list, search: unusedSearch() } }, CDM_VIEWS.activity, ref(), { maxItems: 3 });

    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenNthCalledWith(1, expect.objectContaining({ limit: 3 }));
    expect(list).toHaveBeenNthCalledWith(2, expect.objectContaining({ limit: 1, cursor: 'c1' }));
    expect(result).toEqual({ items: [node, node, node], hasMore: true });
  });

  it('stops when CDF has no more pages', async () => {
    const list = vi
      .fn<ListInstancesClient['instances']['list']>()
      .mockResolvedValueOnce({ items: [makeNode()], nextCursor: 'c1' })
      .mockResolvedValueOnce({ items: [makeNode()] });

    const result = await listRelatedNodes({ instances: { list, search: unusedSearch() } }, CDM_VIEWS.activity, ref(), { maxItems: 500 });

    expect(list).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ items: [makeNode(), makeNode()], hasMore: false });
  });

  it('keeps reading past empty pages while CDF returns a cursor', async () => {
    const list = vi
      .fn<ListInstancesClient['instances']['list']>()
      .mockResolvedValueOnce({ items: [], nextCursor: 'c1' })
      .mockResolvedValueOnce({ items: [makeNode()] });

    const result = await listRelatedNodes({ instances: { list, search: unusedSearch() } }, CDM_VIEWS.activity, ref(), { maxItems: 500 });

    expect(list).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ items: [makeNode()], hasMore: false });
  });

  it('gives up after 20 requests if the cursor never ends', async () => {
    const list = vi.fn<ListInstancesClient['instances']['list']>(() => Promise.resolve({ items: [], nextCursor: 'c' }));

    const result = await listRelatedNodes({ instances: { list, search: unusedSearch() } }, CDM_VIEWS.activity, ref(), { maxItems: 500 });

    expect(list).toHaveBeenCalledTimes(20);
    expect(result).toEqual({ items: [], hasMore: true });
  });

  it('propagates API errors', async () => {
    const client = makeClient({ items: [] });
    vi.mocked(client.instances.list).mockRejectedValue({ status: 400 });

    await expect(listRelatedNodes(client, CDM_VIEWS.file, ref())).rejects.toEqual({ status: 400 });
  });
});

function unusedSearch(): ListInstancesClient['instances']['search'] {
  return vi.fn(() => assert.fail('search not expected'));
}

function makeNode(): NodeOrEdge {
  return { instanceType: 'node', space: 'sp', externalId: 'n' } as Partial<NodeOrEdge> as NodeOrEdge;
}

function ref() {
  return { space: 'sp', externalId: 'a1' };
}

function makeClient(response: Awaited<ReturnType<ListInstancesClient['instances']['list']>>): ListInstancesClient {
  return {
    instances: {
      list: vi.fn<ListInstancesClient['instances']['list']>(() => Promise.resolve(response)),
      search: vi.fn<ListInstancesClient['instances']['search']>(() => Promise.resolve({ items: [] })),
    },
  };
}
