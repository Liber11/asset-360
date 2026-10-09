import type { CogniteClient, NodeOrEdge, ViewReference } from '@cognite/sdk';

import type { InstanceRef } from '../state/workspaceState';

export type ListInstancesClient = { instances: Pick<CogniteClient['instances'], 'list'> };

/** Per-panel cap (FR-015) so assets with many related items do not freeze the page. */
export const RELATED_LIMIT = 100;

export type RelatedNodes = { items: NodeOrEdge[]; hasMore: boolean };

/**
 * Nodes of `view` linked to `asset` through the view's `assets` direct-relation list
 * (CogniteTimeSeries, CogniteActivity and CogniteFile all model the link this way).
 */
export async function listRelatedNodes(
  client: ListInstancesClient,
  view: ViewReference,
  asset: InstanceRef
): Promise<RelatedNodes> {
  const response = await client.instances.list({
    instanceType: 'node',
    sources: [{ source: view }],
    filter: {
      containsAny: {
        property: [view.space, `${view.externalId}/${view.version}`, 'assets'],
        values: [{ space: asset.space, externalId: asset.externalId }],
      },
    },
    limit: RELATED_LIMIT,
  });
  return { items: response.items, hasMore: Boolean(response.nextCursor) };
}
