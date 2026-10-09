import type { NodeOrEdge } from '@cognite/sdk';
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

    const result = await listRelatedNodes({ instances: { list } }, CDM_VIEWS.activity, ref(), 3);

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

    const result = await listRelatedNodes({ instances: { list } }, CDM_VIEWS.activity, ref(), 500);

    expect(list).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ items: [makeNode(), makeNode()], hasMore: false });
  });

  it('stops on an empty page even if CDF returns a cursor', async () => {
    const list = vi.fn<ListInstancesClient['instances']['list']>(() => Promise.resolve({ items: [], nextCursor: 'c' }));

    const result = await listRelatedNodes({ instances: { list } }, CDM_VIEWS.activity, ref(), 500);

    expect(list).toHaveBeenCalledOnce();
    expect(result).toEqual({ items: [], hasMore: true });
  });

  it('propagates API errors', async () => {
    const client = makeClient({ items: [] });
    vi.mocked(client.instances.list).mockRejectedValue({ status: 400 });

    await expect(listRelatedNodes(client, CDM_VIEWS.file, ref())).rejects.toEqual({ status: 400 });
  });
});

function makeNode(): NodeOrEdge {
  return { instanceType: 'node', space: 'sp', externalId: 'n' } as Partial<NodeOrEdge> as NodeOrEdge;
}

function ref() {
  return { space: 'sp', externalId: 'a1' };
}

function makeClient(response: Awaited<ReturnType<ListInstancesClient['instances']['list']>>): ListInstancesClient {
  return { instances: { list: vi.fn<ListInstancesClient['instances']['list']>(() => Promise.resolve(response)) } };
}
