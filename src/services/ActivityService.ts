import { CDM_VIEWS, readRef, readString, viewProps } from '../domain/cdm';
import { sortWorkOrders, type WorkOrder } from '../domain/workOrders';
import type { InstanceRef } from '../state/workspaceState';

import { listRelatedNodes, RELATED_LIMIT, type ListInstancesClient } from './relatedNodes';

export type WorkOrderList = { items: WorkOrder[]; hasMore: boolean };

/**
 * CDF cannot sort by our "most relevant date" fallback (endTime → scheduledEndTime → startTime),
 * so read up to this many orders, sort them here, and keep the RELATED_LIMIT most recent.
 */
const SCAN_LIMIT = 1000;

export interface ActivityService {
  listForAsset(asset: InstanceRef): Promise<WorkOrderList>;
}

class CdmActivityService implements ActivityService {
  constructor(private readonly client: ListInstancesClient) {}

  async listForAsset(asset: InstanceRef): Promise<WorkOrderList> {
    const { items, hasMore } = await listRelatedNodes(this.client, CDM_VIEWS.activity, asset, SCAN_LIMIT);

    const orders = items.map((item): WorkOrder => {
      const props = viewProps(item, CDM_VIEWS.activity);
      return {
        ref: { space: item.space, externalId: item.externalId },
        identifier: readString(props, 'sourceId') || item.externalId,
        name: readString(props, 'name') || item.externalId,
        description: readString(props, 'description'),
        startTime: readString(props, 'startTime'),
        endTime: readString(props, 'endTime'),
        scheduledStartTime: readString(props, 'scheduledStartTime'),
        scheduledEndTime: readString(props, 'scheduledEndTime'),
        source: readRef(props, 'source')?.externalId,
      };
    });

    return {
      items: sortWorkOrders(orders).slice(0, RELATED_LIMIT),
      hasMore: hasMore || orders.length > RELATED_LIMIT,
    };
  }
}

export function createActivityService(client: ListInstancesClient): ActivityService {
  return new CdmActivityService(client);
}
