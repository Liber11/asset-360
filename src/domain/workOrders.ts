import type { InstanceRef } from '../state/workspaceState';

/** A CogniteActivity shown as a work order. Timestamps are ISO strings as returned by DMS. */
export type WorkOrder = {
  ref: InstanceRef;
  /** `sourceId` (e.g. the SAP order number), falling back to `externalId`. */
  identifier: string;
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  /** externalId of the source system, e.g. "SAP". */
  source?: string;
};

/** The date that best describes when the order happened (FR-007). */
export function workOrderDate(order: WorkOrder): string | undefined {
  return order.endTime ?? order.scheduledEndTime ?? order.startTime;
}

function timeOf(order: WorkOrder): number {
  const date = workOrderDate(order);
  const time = date ? Date.parse(date) : Number.NaN;
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

export function sortWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return [...orders].sort((a, b) => timeOf(b) - timeOf(a));
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatDate(value: string | undefined): string {
  return toDate(value)?.toISOString().slice(0, 10) ?? '—';
}

export function formatDateTime(value: string | undefined): string {
  const date = toDate(value);
  return date ? `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC` : '—';
}
