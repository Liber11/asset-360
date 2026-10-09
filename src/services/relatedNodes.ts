import type { CogniteClient, NodeOrEdge, ViewReference } from '@cognite/sdk';

import type { InstanceRef } from '../state/workspaceState';

export type ListInstancesClient = { instances: Pick<CogniteClient['instances'], 'list'> };

/** Per-panel cap (FR-015) so assets with many related items do not freeze the page. */
export const RELATED_LIMIT = 100;

/** DMS list page size limit. */
const MAX_PAGE_SIZE = 1000;

/**
 * Filtered DMS lists may return short or even empty pages together with a cursor, so page
 * size says nothing about "done". Cap the number of requests instead to rule out endless loops.
 */
const MAX_PAGES = 20;

export type RelatedNodes = { items: NodeOrEdge[]; hasMore: boolean };

/**
 * Nodes of `view` linked to `asset` through the view's `assets` direct-relation list
 * (CogniteTimeSeries, CogniteActivity and CogniteFile all model the link this way).
 * Follows cursors until `maxItems` nodes are read; `hasMore` tells whether CDF has more.
 */
export async function listRelatedNodes(
  client: ListInstancesClient,
  view: ViewReference,
  asset: InstanceRef,
  maxItems: number = RELATED_LIMIT
): Promise<RelatedNodes> {
  const items: NodeOrEdge[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const response = await client.instances.list({
      instanceType: 'node',
      sources: [{ source: view }],
      filter: {
        containsAny: {
          property: [view.space, `${view.externalId}/${view.version}`, 'assets'],
          values: [{ space: asset.space, externalId: asset.externalId }],
        },
      },
      limit: Math.min(maxItems - items.length, MAX_PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
    });
    items.push(...response.items);
    cursor = response.nextCursor ?? undefined;
    pages += 1;
  } while (cursor && items.length < maxItems && pages < MAX_PAGES);

  return { items, hasMore: cursor !== undefined };
}
