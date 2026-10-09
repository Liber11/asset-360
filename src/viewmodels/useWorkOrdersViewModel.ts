import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { refKey } from '../domain/cdm';
import { errorMessage } from '../domain/errors';
import { toLoadStatus, type LoadStatus } from '../domain/loadStatus';
import type { WorkOrder } from '../domain/workOrders';
import { useServices } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

export type WorkOrdersViewModel = {
  status: LoadStatus;
  orders: WorkOrder[];
  /** More orders exist than the panel cap. */
  hasMore: boolean;
  errorMessage?: string;
  retry: () => void;
  /** Order whose detail dialog is open (host-synced). */
  openOrderDetail?: WorkOrder;
  openOrder: (order: WorkOrder) => void;
  closeOrder: () => void;
};

export function useWorkOrdersViewModel(): WorkOrdersViewModel {
  const { state, update } = useWorkspaceState();
  const { activityService } = useServices();
  const asset = state.selectedAsset;
  const { includeSubAssets } = state;

  const query = useQuery({
    queryKey: ['work-orders', asset ? refKey(asset) : null, includeSubAssets],
    queryFn: () =>
      asset
        ? activityService.listForAsset(asset, { includeSubAssets })
        : Promise.resolve({ items: [], hasMore: false }),
    enabled: asset !== null,
  });

  const { refetch } = query;
  const retry = useCallback(() => void refetch(), [refetch]);
  const openOrder = useCallback((order: WorkOrder) => update({ openWorkOrder: order.ref }), [update]);
  const closeOrder = useCallback(() => update({ openWorkOrder: null }), [update]);

  const orders = query.data?.items ?? [];
  const openKey = state.openWorkOrder ? refKey(state.openWorkOrder) : null;

  return {
    status: toLoadStatus(query),
    orders,
    hasMore: query.data?.hasMore ?? false,
    errorMessage: query.isError ? errorMessage(query.error) : undefined,
    retry,
    openOrderDetail: openKey ? orders.find((order) => refKey(order.ref) === openKey) : undefined,
    openOrder,
    closeOrder,
  };
}
