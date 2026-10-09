import type { TimeRangeKey } from '../state/workspaceState';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export const RANGE_MS: Record<TimeRangeKey, number> = {
  '1d': DAY_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
  '1y': 365 * DAY_MS,
};

/** Aggregate step per range: keeps each chart at roughly 100–400 points (FR-006). */
export const GRANULARITY: Record<TimeRangeKey, string> = {
  '1d': '15m',
  '7d': '1h',
  '30d': '6h',
  '1y': '1d',
};

export const RANGE_LABELS: Record<TimeRangeKey, string> = {
  '1d': '1D',
  '7d': '7D',
  '30d': '30D',
  '1y': '1Y',
};

export type TimeWindow = { start: number; end: number };

/**
 * Window of `range` ending at the newest datapoint among the selected series (FR-005).
 * Historian data can be stale, so anchoring to "now" would often plot an empty chart.
 * Returns null when none of the series has any datapoint.
 */
export function timeWindow(range: TimeRangeKey, latestTimestamps: (number | undefined)[]): TimeWindow | null {
  const known = latestTimestamps.filter((value): value is number => value !== undefined);
  if (known.length === 0) return null;
  // The datapoints API treats `end` as exclusive; +1 ms keeps the newest point in view.
  const end = Math.max(...known) + 1;
  return { start: end - RANGE_MS[range], end };
}
