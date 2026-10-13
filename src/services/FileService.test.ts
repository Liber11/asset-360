import type { NodeOrEdge } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CDM_VIEWS } from '../domain/cdm';

import { createFileService, type FileClient } from './FileService';

describe('FileService', () => {
  let client: FileClient;

  beforeEach(() => {
    client = {
      instances: {
        list: vi.fn<FileClient['instances']['list']>(() => Promise.resolve({ items: [] })),
        search: vi.fn<FileClient['instances']['search']>(() => Promise.resolve({ items: [] })),
      },
      files: {
        getDownloadUrls: vi.fn<FileClient['files']['getDownloadUrls']>(() => Promise.resolve([])),
      },
    };
  });

  describe('listForAsset', () => {
    it('lists CogniteFile nodes linked to the asset, sorted by name', async () => {
      vi.mocked(client.instances.list).mockResolvedValue({
        items: [
          fileNode('f2', { name: 'Zeta.pdf', mimeType: 'application/pdf', isUploaded: true }, 2000),
          fileNode('f1', { name: 'Alpha.png', sourceUpdatedTime: '2019-01-18T10:00:00Z' }, 1000),
        ],
      });

      const result = await createFileService(client).listForAsset({ space: 'sp', externalId: 'a1' });

      expect(client.instances.list).toHaveBeenCalledWith(
        expect.objectContaining({ sources: [{ source: CDM_VIEWS.file }] })
      );
      expect(result).toEqual({
        hasMore: false,
        items: [
          {
            ref: { space: 'sp', externalId: 'f1' },
            name: 'Alpha.png',
            mimeType: undefined,
            isUploaded: false,
            updatedTime: '2019-01-18T10:00:00Z',
          },
          {
            ref: { space: 'sp', externalId: 'f2' },
            name: 'Zeta.pdf',
            mimeType: 'application/pdf',
            isUploaded: true,
            updatedTime: new Date(2000).toISOString(),
          },
        ],
      });
    });

    it('uses the search endpoint when sub-assets are included', async () => {
      await createFileService(client).listForAsset({ space: 'sp', externalId: 'a1' }, { includeSubAssets: true });

      expect(client.instances.search).toHaveBeenCalledWith(expect.objectContaining({ view: CDM_VIEWS.file }));
    });

    it('propagates API errors', async () => {
      vi.mocked(client.instances.list).mockRejectedValue({ status: 403 });

      await expect(createFileService(client).listForAsset({ space: 'sp', externalId: 'a1' })).rejects.toEqual({
        status: 403,
      });
    });
  });

  describe('getDownloadUrl', () => {
    it('requests a download link by instance id', async () => {
      vi.mocked(client.files.getDownloadUrls).mockResolvedValue([
        { downloadUrl: 'https://files.cognite.test/f1', instanceId: { space: 'sp', externalId: 'f1' } },
      ]);

      const url = await createFileService(client).getDownloadUrl({ space: 'sp', externalId: 'f1' });

      expect(client.files.getDownloadUrls).toHaveBeenCalledWith([{ instanceId: { space: 'sp', externalId: 'f1' } }]);
      expect(url).toBe('https://files.cognite.test/f1');
    });

    it('throws when CDF returns no link', async () => {
      await expect(createFileService(client).getDownloadUrl({ space: 'sp', externalId: 'f1' })).rejects.toThrow(
        'No download link for this file.'
      );
    });
  });
});

function fileNode(externalId: string, props: Record<string, unknown>, lastUpdatedTime: number): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp',
    externalId,
    version: 1,
    createdTime: 0,
    lastUpdatedTime,
    properties: { cdf_cdm: { 'CogniteFile/v1': props } },
  } as Partial<NodeOrEdge> as NodeOrEdge;
}
