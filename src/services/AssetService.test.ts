import type { NodeOrEdge } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CDM_VIEWS } from '../domain/cdm';

import { createAssetService, type AssetInstancesClient } from './AssetService';

describe('AssetService', () => {
  let client: AssetInstancesClient;

  beforeEach(() => {
    client = {
      instances: {
        search: vi.fn<AssetInstancesClient['instances']['search']>(() => Promise.resolve({ items: [] })),
        retrieve: vi.fn<AssetInstancesClient['instances']['retrieve']>(() => Promise.resolve({ items: [] })),
      },
    };
  });

  describe('search', () => {
    it('searches CogniteAsset nodes on text properties', async () => {
      await createAssetService(client).search('pump 101');

      expect(client.instances.search).toHaveBeenCalledWith({
        view: CDM_VIEWS.asset,
        query: 'pump 101',
        instanceType: 'node',
        properties: ['name', 'description', 'aliases'],
        limit: 20,
      });
    });

    it('maps results and resolves parent names in one extra request', async () => {
      vi.mocked(client.instances.search).mockResolvedValue({
        items: [
          assetNode('a1', { name: 'PUMP-101', description: 'Feed pump', parent: { space: 'sp', externalId: 'p1' } }),
          assetNode('a2', { description: 'No name' }),
        ],
      });
      vi.mocked(client.instances.retrieve).mockResolvedValue({ items: [assetNode('p1', { name: 'Area 51' })] });

      const results = await createAssetService(client).search('pump');

      expect(client.instances.retrieve).toHaveBeenCalledWith({
        items: [{ instanceType: 'node', space: 'sp', externalId: 'p1' }],
        sources: [{ source: CDM_VIEWS.asset }],
      });
      expect(results).toEqual([
        { ref: { space: 'sp', externalId: 'a1' }, name: 'PUMP-101', description: 'Feed pump', parentName: 'Area 51' },
        { ref: { space: 'sp', externalId: 'a2' }, name: 'a2', description: 'No name', parentName: undefined },
      ]);
    });

    it('skips the parent request when no result has a parent', async () => {
      vi.mocked(client.instances.search).mockResolvedValue({ items: [assetNode('a1', { name: 'Root' })] });

      await createAssetService(client).search('root');

      expect(client.instances.retrieve).not.toHaveBeenCalled();
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.search).mockRejectedValue({ status: 500, message: 'boom' });

      await expect(createAssetService(client).search('x')).rejects.toEqual({ status: 500, message: 'boom' });
    });
  });

  describe('retrieve', () => {
    it('returns null when the asset does not exist', async () => {
      await expect(createAssetService(client).retrieve({ space: 'sp', externalId: 'gone' })).resolves.toBeNull();
    });

    it('returns details with ancestors in path order and the type name', async () => {
      const typeRef = { space: 'sp', externalId: 't1' };
      vi.mocked(client.instances.retrieve)
        .mockResolvedValueOnce({
          items: [
            assetNode('a1', {
              name: 'PUMP-101',
              description: 'Feed pump',
              tags: ['critical'],
              type: typeRef,
              path: [
                { space: 'sp', externalId: 'root' },
                { space: 'sp', externalId: 'area' },
                { space: 'sp', externalId: 'a1' },
              ],
            }),
          ],
        })
        .mockResolvedValueOnce({ items: [assetNode('area', { name: 'Area' }), assetNode('root', { name: 'Plant' })] })
        .mockResolvedValueOnce({ items: [node('t1', CDM_VIEWS.assetType.externalId, { name: 'Centrifugal pump' })] });

      const details = await createAssetService(client).retrieve({ space: 'sp', externalId: 'a1' });

      expect(client.instances.retrieve).toHaveBeenNthCalledWith(1, {
        items: [{ instanceType: 'node', space: 'sp', externalId: 'a1' }],
        sources: [{ source: CDM_VIEWS.asset }],
      });
      expect(client.instances.retrieve).toHaveBeenNthCalledWith(3, {
        items: [{ instanceType: 'node', ...typeRef }],
        sources: [{ source: CDM_VIEWS.assetType }],
      });
      expect(details).toEqual({
        ref: { space: 'sp', externalId: 'a1' },
        name: 'PUMP-101',
        description: 'Feed pump',
        tags: ['critical'],
        typeName: 'Centrifugal pump',
        ancestors: [
          { ref: { space: 'sp', externalId: 'root' }, name: 'Plant' },
          { ref: { space: 'sp', externalId: 'area' }, name: 'Area' },
        ],
      });
    });

    it('makes no extra requests for a root asset without a type', async () => {
      vi.mocked(client.instances.retrieve).mockResolvedValueOnce({ items: [assetNode('a1', { name: 'Root' })] });

      const details = await createAssetService(client).retrieve({ space: 'sp', externalId: 'a1' });

      expect(client.instances.retrieve).toHaveBeenCalledOnce();
      expect(details?.ancestors).toEqual([]);
      expect(details?.typeName).toBeUndefined();
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.retrieve).mockRejectedValue({ status: 403 });

      await expect(createAssetService(client).retrieve({ space: 'sp', externalId: 'a1' })).rejects.toEqual({
        status: 403,
      });
    });
  });
});

function node(externalId: string, viewExternalId: string, props: Record<string, unknown>): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp',
    externalId,
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    properties: { cdf_cdm: { [`${viewExternalId}/v1`]: props } },
  } as Partial<NodeOrEdge> as NodeOrEdge;
}

function assetNode(externalId: string, props: Record<string, unknown>): NodeOrEdge {
  return node(externalId, CDM_VIEWS.asset.externalId, props);
}
