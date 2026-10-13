import type { CogniteClient } from '@cognite/sdk';

import { CDM_VIEWS, readString, viewProps } from '../domain/cdm';
import type { DocumentItem } from '../domain/documents';
import type { InstanceRef } from '../state/workspaceState';

import { listRelatedNodes, type AssetScope } from './relatedNodes';

export type DocumentList = { items: DocumentItem[]; hasMore: boolean };

export interface FileService {
  listForAsset(asset: InstanceRef, scope?: AssetScope): Promise<DocumentList>;
  /** Short-lived signed URL to download the file content. */
  getDownloadUrl(ref: InstanceRef): Promise<string>;
}

export type FileClient = {
  instances: Pick<CogniteClient['instances'], 'list' | 'search'>;
  files: Pick<CogniteClient['files'], 'getDownloadUrls'>;
};

class CdmFileService implements FileService {
  constructor(private readonly client: FileClient) {}

  async listForAsset(asset: InstanceRef, scope?: AssetScope): Promise<DocumentList> {
    const { items, hasMore } = await listRelatedNodes(this.client, CDM_VIEWS.file, asset, {
      includeSubAssets: scope?.includeSubAssets,
    });

    const documents = items.map((item): DocumentItem => {
      const props = viewProps(item, CDM_VIEWS.file);
      return {
        ref: { space: item.space, externalId: item.externalId },
        name: readString(props, 'name') || item.externalId,
        mimeType: readString(props, 'mimeType'),
        isUploaded: props.isUploaded === true,
        updatedTime: readString(props, 'sourceUpdatedTime') ?? new Date(item.lastUpdatedTime).toISOString(),
      };
    });

    return { items: documents.sort((a, b) => a.name.localeCompare(b.name)), hasMore };
  }

  async getDownloadUrl(ref: InstanceRef): Promise<string> {
    const [link] = await this.client.files.getDownloadUrls([
      { instanceId: { space: ref.space, externalId: ref.externalId } },
    ]);
    if (!link?.downloadUrl) throw new Error('No download link for this file.');
    return link.downloadUrl;
  }
}

export function createFileService(client: FileClient): FileService {
  return new CdmFileService(client);
}
