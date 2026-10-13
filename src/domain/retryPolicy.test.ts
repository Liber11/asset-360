import { describe, expect, it } from 'vitest';

import { shouldRetryQuery } from './retryPolicy';

describe(shouldRetryQuery.name, () => {
  it('retries a network failure once', () => {
    expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetryQuery(1, new TypeError('Failed to fetch'))).toBe(false);
  });

  it.each([400, 403, 404, 429, 500, 503])('leaves HTTP %i to the SDK retry logic', (status) => {
    expect(shouldRetryQuery(0, { status })).toBe(false);
  });
});
