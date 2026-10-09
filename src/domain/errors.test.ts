import { describe, expect, it } from 'vitest';

import { classifyError, errorMessage } from './errors';

describe(classifyError.name, () => {
  it.each([401, 403])('classifies HTTP %i as no-access', (status) => {
    expect(classifyError({ status, message: 'denied' })).toBe('no-access');
  });

  it('classifies other HTTP statuses as error', () => {
    expect(classifyError({ status: 500 })).toBe('error');
  });

  it('classifies values without a status as error', () => {
    expect(classifyError(new Error('boom'))).toBe('error');
    expect(classifyError('boom')).toBe('error');
    expect(classifyError(null)).toBe('error');
  });
});

describe(errorMessage.name, () => {
  it('uses the message of an Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('uses a string message property on plain objects', () => {
    expect(errorMessage({ message: 'from api' })).toBe('from api');
  });

  it('falls back to a generic message', () => {
    expect(errorMessage(42)).toBe('Something went wrong.');
    expect(errorMessage(new Error(''))).toBe('Something went wrong.');
  });
});
