import { describe, expect, it } from 'vitest';

import { TIME_RANGE_KEYS } from '../state/workspaceState';

import { GRANULARITY, RANGE_MS, timeWindow } from './timeRange';

describe(timeWindow.name, () => {
  it('ends at the most recent datapoint, not at wall-clock time', () => {
    const latest = Date.UTC(2019, 0, 18, 10, 0);

    const window = timeWindow('7d', [Date.UTC(2018, 5, 1), latest, undefined]);

    expect(window).toEqual({ start: latest + 1 - RANGE_MS['7d'], end: latest + 1 });
  });

  it('returns null when no selected series has datapoints', () => {
    expect(timeWindow('1d', [])).toBeNull();
    expect(timeWindow('1d', [undefined, undefined])).toBeNull();
  });

  it.each(['1d', '7d', '30d', '1y'] as const)('spans exactly the %s range', (range) => {
    const window = timeWindow(range, [1_000_000_000_000]);

    expect(window && window.end - window.start).toBe(RANGE_MS[range]);
  });
});

describe('GRANULARITY', () => {
  it('keeps every range at a few hundred points at most', () => {
    const unitMs: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000 };
    for (const range of TIME_RANGE_KEYS) {
      const match = /^(\d+)([mhd])$/.exec(GRANULARITY[range]);
      expect(match).not.toBeNull();
      const stepMs = Number(match?.[1]) * unitMs[match?.[2] ?? 'd'];
      const points = RANGE_MS[range] / stepMs;
      expect(points).toBeLessThanOrEqual(400);
      expect(points).toBeGreaterThanOrEqual(50);
    }
  });
});
