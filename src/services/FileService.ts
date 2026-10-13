import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { CDM_VIEWS, readString, viewProps } from '../domain/cdm';
import type { DocumentItem } from '../domain/documents';
import type { InstanceRef } from '../state/workspaceState';

import { listRelatedNodes, type AssetScope } from './relatedNodes';

export type DocumentList = { items: DocumentItem[]; hasMore: boolean };

export interface FileService {
  listForAsset(asset: InstanceRef, scope?: AssetScope): Promise<DocumentList>;
  /**
   * Files whose name contains `tag` (case-insensitive). A fallback for projects where files are
   * not linked to assets in the data model; results are NOT a modelled relationship.
   */
  searchByName(tag: string): Promise<DocumentItem[]>;
  /** Short-lived signed URL to download the file content. */
  getDownloadUrl(ref: InstanceRef): Promise<string>;
}

export type FileClient = {
  instances: Pick<CogniteClient['instances'], 'list' | 'search'>;
  files: Pick<CogniteClient['files'], 'getDownloadUrls'>;
};

const NAME_SEARCH_LIMIT = 50;
const MIN_TAG_LENGTH = 4;

function toDocument(item: NodeOrEdge): DocumentItem {
  const props = viewProps(item, CDM_VIEWS.file);
  return {
    ref: { space: item.space, externalId: item.externalId },
    name: readString(props, 'name') || item.externalId,
    mimeType: readString(props, 'mimeType'),
    isUploaded: props.isUploaded === true,
    updatedTime: readString(props, 'sourceUpdatedTime') ?? new Date(item.lastUpdatedTime).toISOString(),
  };
}

function byName(a: DocumentItem, b: DocumentItem): number {
  return a.name.localeCompare(b.name);
}

class CdmFileService implements FileService {
  constructor(private readonly client: FileClient) {}

  async listForAsset(asset: InstanceRef, scope?: AssetScope): Promise<DocumentList> {
    const { items, hasMore } = await listRelatedNodes(this.client, CDM_VIEWS.file, asset, {
      includeSubAssets: scope?.includeSubAssets,
    });

    return { items: items.map(toDocument).sort(byName), hasMore };
  }

  async searchByName(tag: string): Promise<DocumentItem[]> {
    const needle = tag.trim();
    if (needle.length < MIN_TAG_LENGTH) return [];
    const { items } = await this.client.instances.search({
      view: CDM_VIEWS.file,
      query: needle,
      instanceType: 'node',
      properties: ['name'],
      limit: NAME_SEARCH_LIMIT,
    });
    // Search is token-based and fuzzy; keep only names that really contain the tag.
    const upper = needle.toUpperCase();
    return items
      .map(toDocument)
      .filter((doc) => doc.name.toUpperCase().includes(upper))
      .sort(byName);
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
