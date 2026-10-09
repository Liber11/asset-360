import { Badge } from '@cognite/aura/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';

import { refKey } from '../domain/cdm';
import { formatDate, formatDateTime, workOrderDate, type WorkOrder } from '../domain/workOrders';
import { RELATED_LIMIT } from '../services/relatedNodes';
import { useWorkOrdersViewModel } from '../viewmodels/useWorkOrdersViewModel';

import { PanelStatus } from './PanelStatus';

const COLUMNS: ColumnDef<WorkOrder>[] = [
  { id: 'identifier', header: 'ID', accessorFn: (order) => order.identifier, size: 140 },
  { id: 'name', header: 'Name', accessorFn: (order) => order.name, size: 320 },
  {
    id: 'date',
    header: 'Date',
    accessorFn: (order) => formatDate(workOrderDate(order)),
    size: 120,
  },
];

export function WorkOrdersPanel() {
  const { status, orders, hasMore, errorMessage, retry, openOrderDetail, openOrder, closeOrder } =
    useWorkOrdersViewModel();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          Work orders
          {status === 'success' && <Badge variant="gray">{hasMore ? `${RELATED_LIMIT}+` : orders.length}</Badge>}
        </CardTitle>
        {hasMore && <CardDescription>Showing the {RELATED_LIMIT} most recent work orders.</CardDescription>}
      </CardHeader>
      <CardContent>
        <PanelStatus status={status} errorMessage={errorMessage} onRetry={retry} />

        {status === 'success' && orders.length === 0 && (
          <EmptyState type="no-results">
            <EmptyStateTitle>No work orders linked to this asset</EmptyStateTitle>
            <EmptyStateDescription>No maintenance activities in CDF reference this asset.</EmptyStateDescription>
          </EmptyState>
        )}

        {status === 'success' && orders.length > 0 && (
          <DataGrid
            aria-label="Work orders"
            className="h-80"
            data={orders}
            columns={COLUMNS}
            getRowId={(order) => refKey(order.ref)}
            enableSorting={false}
            size="compact"
            onRowClick={(row) => openOrder(row.original)}
          />
        )}
      </CardContent>

      <Dialog open={openOrderDetail !== undefined} onOpenChange={(open) => !open && closeOrder()}>
        {openOrderDetail && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{openOrderDetail.name}</DialogTitle>
              <DialogDescription>Work order {openOrderDetail.identifier}</DialogDescription>
            </DialogHeader>
            <WorkOrderDetail order={openOrderDetail} />
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}

function WorkOrderDetail({ order }: { order: WorkOrder }) {
  const fields: [string, string][] = [
    ['Description', order.description || '—'],
    ['Start', formatDateTime(order.startTime)],
    ['End', formatDateTime(order.endTime)],
    ['Scheduled start', formatDateTime(order.scheduledStartTime)],
    ['Scheduled end', formatDateTime(order.scheduledEndTime)],
    ['Source', order.source ?? '—'],
  ];

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
      {fields.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
