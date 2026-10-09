import type { CogniteClient, FilterDefinition, NodeOrEdge, ViewReference } from '@cognite/sdk';

import { CDM_VIEWS } from '../domain/cdm';
import type { InstanceRef } from '../state/workspaceState';

export type ListInstancesClient = { instances: Pick<CogniteClient['instances'], 'list' | 'search'> };

/** Per-panel cap (FR-015) so assets with many related items do not freeze the page. */
export const RELATED_LIMIT = 100;

/** DMS page size limit (list), and the maximum result size of the search endpoint. */
const MAX_PAGE_SIZE = 1000;

/**
 * Filtered DMS lists may return short or even empty pages together with a cursor, so page
 * size says nothing about "done". Cap the number of requests instead to rule out endless loops.
 */
const MAX_PAGES = 20;

export type RelatedNodes = { items: NodeOrEdge[]; hasMore: boolean };

/** Which items count as "related" to the open asset. */
export type AssetScope = { includeSubAssets: boolean };

export type RelatedOptions = {
  /** Stop after reading this many nodes. */
  maxItems?: number;
  /** Also match nodes linked to any asset below `asset` in the hierarchy. */
  includeSubAssets?: boolean;
};

function relatedFilter(view: ViewReference, asset: InstanceRef, includeSubAssets: boolean): FilterDefinition {
  const assetsProperty = [view.space, `${view.externalId}/${view.version}`, 'assets'];
  const value = { space: asset.space, externalId: asset.externalId };
  const direct: FilterDefinition = { containsAny: { property: assetsProperty, values: [value] } };
  if (!includeSubAssets) return direct;

  const assetView = CDM_VIEWS.asset;
  // A linked asset whose ancestor `path` contains `asset` is a descendant. `direct` is kept in the
  // `or` because the docs define `path` as the ancestors, so it may not include the asset itself.
  const viaDescendant: FilterDefinition = {
    nested: {
      scope: assetsProperty,
      filter: {
        containsAny: {
          property: [assetView.space, `${assetView.externalId}/${assetView.version}`, 'path'],
          values: [value],
        },
      },
    },
  };
  return { or: [direct, viaDescendant] };
}

/**
 * Nodes of `view` linked to `asset` through the view's `assets` direct-relation list
 * (CogniteTimeSeries, CogniteActivity and CogniteFile all model the link this way).
 * Follows cursors until `maxItems` nodes are read; `hasMore` tells whether CDF has more.
 */
export async function listRelatedNodes(
  client: ListInstancesClient,
  view: ViewReference,
  asset: InstanceRef,
  { maxItems = RELATED_LIMIT, includeSubAssets = false }: RelatedOptions = {}
): Promise<RelatedNodes> {
  const filter = relatedFilter(view, asset, includeSubAssets);

  if (includeSubAssets) {
    // The nested `assets → path` filter is only accepted by the search endpoint (not by list),
    // see docs: dm_search → "Nested filters are only supported for core data model assets".
    // Search has no cursor, so one request of at most MAX_PAGE_SIZE items.
    const limit = Math.min(maxItems, MAX_PAGE_SIZE);
    const { items } = await client.instances.search({ view, instanceType: 'node', limit, filter });
    return { items, hasMore: items.length >= limit };
  }
  const items: NodeOrEdge[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const response = await client.instances.list({
      instanceType: 'node',
      sources: [{ source: view }],
      filter,
      limit: Math.min(maxItems - items.length, MAX_PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
    });
    items.push(...response.items);
    cursor = response.nextCursor ?? undefined;
    pages += 1;
  } while (cursor && items.length < maxItems && pages < MAX_PAGES);

  return { items, hasMore: cursor !== undefined };
}
