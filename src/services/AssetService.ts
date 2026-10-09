import type { CogniteClient, NodeOrEdge, ViewReference } from '@cognite/sdk';

import { CDM_VIEWS, readRef, readRefList, readString, readStringList, refKey, viewProps } from '../domain/cdm';
import type { InstanceRef } from '../state/workspaceState';

export type AssetSummary = {
  ref: InstanceRef;
  name: string;
  description?: string;
  parentName?: string;
};

export type AssetDetails = {
  ref: InstanceRef;
  name: string;
  description?: string;
  tags: string[];
  typeName?: string;
  ancestors: { ref: InstanceRef; name: string }[];
};

export interface AssetService {
  search(query: string): Promise<AssetSummary[]>;
  retrieve(ref: InstanceRef): Promise<AssetDetails | null>;
}

export type AssetInstancesClient = { instances: Pick<CogniteClient['instances'], 'search' | 'retrieve'> };

const SEARCH_LIMIT = 20;

function nodeRef(node: NodeOrEdge): InstanceRef {
  return { space: node.space, externalId: node.externalId };
}

function nameOf(node: NodeOrEdge, view: ViewReference): string {
  return readString(viewProps(node, view), 'name') || node.externalId;
}

class CdmAssetService implements AssetService {
  constructor(private readonly client: AssetInstancesClient) {}

  async search(query: string): Promise<AssetSummary[]> {
    const { items } = await this.client.instances.search({
      view: CDM_VIEWS.asset,
      query,
      instanceType: 'node',
      properties: ['name', 'description', 'aliases'],
      limit: SEARCH_LIMIT,
    });

    const parents = new Map<string, InstanceRef>();
    for (const item of items) {
      const parent = readRef(viewProps(item, CDM_VIEWS.asset), 'parent');
      if (parent) parents.set(refKey(parent), parent);
    }
    const parentNames = await this.retrieveNames([...parents.values()], CDM_VIEWS.asset);

    return items.map((item) => {
      const props = viewProps(item, CDM_VIEWS.asset);
      const parent = readRef(props, 'parent');
      return {
        ref: nodeRef(item),
        name: nameOf(item, CDM_VIEWS.asset),
        description: readString(props, 'description'),
        parentName: parent ? parentNames.get(refKey(parent)) : undefined,
      };
    });
  }

  async retrieve(ref: InstanceRef): Promise<AssetDetails | null> {
    const [asset] = (await this.retrieveNodes([ref], CDM_VIEWS.asset)).values();
    if (!asset) return null;

    const props = viewProps(asset, CDM_VIEWS.asset);
    const ancestorRefs = readRefList(props, 'path').filter((item) => refKey(item) !== refKey(ref));
    const typeRef = readRef(props, 'type');

    const [ancestorNames, typeNames] = await Promise.all([
      this.retrieveNames(ancestorRefs, CDM_VIEWS.asset),
      this.retrieveNames(typeRef ? [typeRef] : [], CDM_VIEWS.assetType),
    ]);

    return {
      ref,
      name: nameOf(asset, CDM_VIEWS.asset),
      description: readString(props, 'description'),
      tags: readStringList(props, 'tags'),
      typeName: typeRef ? typeNames.get(refKey(typeRef)) : undefined,
      ancestors: ancestorRefs.map((item) => ({
        ref: item,
        name: ancestorNames.get(refKey(item)) ?? item.externalId,
      })),
    };
  }

  private async retrieveNodes(refs: InstanceRef[], view: ViewReference): Promise<Map<string, NodeOrEdge>> {
    if (refs.length === 0) return new Map();
    const { items } = await this.client.instances.retrieve({
      items: refs.map((item) => ({ instanceType: 'node', ...item })),
      sources: [{ source: view }],
    });
    return new Map(items.map((item) => [refKey(nodeRef(item)), item]));
  }

  private async retrieveNames(refs: InstanceRef[], view: ViewReference): Promise<Map<string, string>> {
    const nodes = await this.retrieveNodes(refs, view);
    return new Map([...nodes].map(([key, item]) => [key, nameOf(item, view)]));
  }
}

export function createAssetService(client: AssetInstancesClient): AssetService {
  return new CdmAssetService(client);
}
