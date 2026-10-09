import { describe, expect, it } from 'vitest';

import { formatAxisTick, formatValue, seriesSummary } from './seriesFormat';

describe(formatValue.name, () => {
  it('keeps up to 3 significant decimals and appends the unit', () => {
    expect(formatValue(3.14159, 'bar')).toBe('3.14 bar');
    expect(formatValue(1234.5)).toBe('1,234.5');
    expect(formatValue(0.000123, 'm')).toBe('0.000123 m');
  });
});

describe(formatAxisTick.name, () => {
  const ts = Date.UTC(2019, 0, 18, 9, 5);

  it('shows the time of day for 1 day windows', () => {
    expect(formatAxisTick('1d', ts)).toBe('09:05');
  });

  it('shows month and day for 7 and 30 day windows', () => {
    expect(formatAxisTick('7d', ts)).toBe('01-18');
    expect(formatAxisTick('30d', ts)).toBe('01-18');
  });

  it('shows year and month for 1 year windows', () => {
    expect(formatAxisTick('1y', ts)).toBe('2019-01');
  });
});

describe(seriesSummary.name, () => {
  it('describes the latest value and the min/max in the window', () => {
    const summary = seriesSummary(
      [
        { timestamp: 1, value: 2 },
        { timestamp: 2, value: 5 },
      ],
      { timestamp: Date.UTC(2019, 0, 18, 10), value: 4.5 },
      'bar'
    );

    expect(summary).toBe('Latest 4.5 bar on 2019-01-18 10:00 UTC. In this window: min 2 bar, max 5 bar.');
  });

  it('handles a series without datapoints in the window', () => {
    expect(seriesSummary([], undefined)).toBe('No datapoints in this window.');
  });

  it('omits the latest value when it is unknown', () => {
    expect(seriesSummary([{ timestamp: 1, value: 2 }], undefined)).toBe('In this window: min 2, max 2.');
  });
});
