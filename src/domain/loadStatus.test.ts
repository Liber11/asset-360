import { describe, expect, it } from 'vitest';

import { toLoadStatus } from './loadStatus';

describe(toLoadStatus.name, () => {
  it('is loading while pending', () => {
    expect(toLoadStatus({ isPending: true, isError: false, error: null })).toBe('loading');
  });

  it('is no-access for 403 errors', () => {
    expect(toLoadStatus({ isPending: false, isError: true, error: { status: 403 } })).toBe('no-access');
  });

  it('is error for other errors', () => {
    expect(toLoadStatus({ isPending: false, isError: true, error: new Error('x') })).toBe('error');
  });

  it('is success otherwise', () => {
    expect(toLoadStatus({ isPending: false, isError: false, error: null })).toBe('success');
  });
});
