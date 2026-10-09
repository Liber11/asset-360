import { describe, expect, it } from 'vitest';

import { formatDate, formatDateTime, sortWorkOrders, workOrderDate, type WorkOrder } from './workOrders';

describe(workOrderDate.name, () => {
  it('prefers endTime, then scheduledEndTime, then startTime', () => {
    expect(workOrderDate(order({ endTime: 'E', scheduledEndTime: 'S', startTime: 'B' }))).toBe('E');
    expect(workOrderDate(order({ scheduledEndTime: 'S', startTime: 'B' }))).toBe('S');
    expect(workOrderDate(order({ startTime: 'B' }))).toBe('B');
    expect(workOrderDate(order({}))).toBeUndefined();
  });
});

describe(sortWorkOrders.name, () => {
  it('sorts most recent first and puts undated orders last', () => {
    const sorted = sortWorkOrders([
      order({ identifier: 'old', endTime: '2023-01-01T00:00:00Z' }),
      order({ identifier: 'none' }),
      order({ identifier: 'new', scheduledEndTime: '2024-05-01T00:00:00Z' }),
      order({ identifier: 'mid', startTime: '2023-06-01T00:00:00Z' }),
    ]);

    expect(sorted.map((item) => item.identifier)).toEqual(['new', 'mid', 'old', 'none']);
  });

  it('does not mutate the input', () => {
    const input = [order({ identifier: 'a' }), order({ identifier: 'b', endTime: '2024-01-01T00:00:00Z' })];

    sortWorkOrders(input);

    expect(input.map((item) => item.identifier)).toEqual(['a', 'b']);
  });
});

describe(formatDate.name, () => {
  it('formats ISO timestamps as UTC dates', () => {
    expect(formatDate('2024-03-18T23:30:00Z')).toBe('2024-03-18');
  });

  it('returns a dash for missing or invalid values', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });
});

describe(formatDateTime.name, () => {
  it('formats ISO timestamps as UTC date and time', () => {
    expect(formatDateTime('2024-03-18T23:30:00Z')).toBe('2024-03-18 23:30 UTC');
  });

  it('returns a dash for missing or invalid values', () => {
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('nope')).toBe('—');
  });
});

function order(extra: Partial<WorkOrder>): WorkOrder {
  return { ref: { space: 'sp', externalId: extra.identifier ?? 'x' }, identifier: 'x', name: 'Order', ...extra };
}
