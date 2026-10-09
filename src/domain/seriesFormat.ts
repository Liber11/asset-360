import type { Point } from '../services/TimeSeriesService';
import type { TimeRangeKey } from '../state/workspaceState';

import { formatDateTime } from './workOrders';

// Large values: 2 decimals. Small values (|v| < 1): 3 significant digits so 0.000123 is not shown as 0.
const largeFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const smallFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 });

export function formatValue(value: number, unit?: string): string {
  const text = (Math.abs(value) >= 1 ? largeFormat : smallFormat).format(value);
  return unit ? `${text} ${unit}` : text;
}

/** Compact UTC axis labels sized to the visible window. */
export function formatAxisTick(range: TimeRangeKey, timestamp: number): string {
  const iso = new Date(timestamp).toISOString();
  if (range === '1d') return iso.slice(11, 16);
  if (range === '1y') return iso.slice(0, 7);
  return iso.slice(5, 10);
}

/** Text alternative for each chart (accessibility: never rely on the plot alone). */
export function seriesSummary(points: Point[], latest: Point | undefined, unit?: string): string {
  const parts: string[] = [];
  if (latest) {
    parts.push(`Latest ${formatValue(latest.value, unit)} on ${formatDateTime(new Date(latest.timestamp).toISOString())}.`);
  }
  if (points.length === 0) {
    parts.push('No datapoints in this window.');
  } else {
    const values = points.map((point) => point.value);
    parts.push(
      `In this window: min ${formatValue(Math.min(...values), unit)}, max ${formatValue(Math.max(...values), unit)}.`
    );
  }
  return parts.join(' ');
}
