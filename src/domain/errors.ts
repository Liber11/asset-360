export type ErrorKind = 'no-access' | 'error';

const GENERIC_MESSAGE = 'Something went wrong.';

function hasStatus(value: unknown): value is { status: number } {
  return typeof value === 'object' && value !== null && 'status' in value && typeof value.status === 'number';
}

/** CDF answers 401/403 when the user's token lacks the needed capability. */
export function classifyError(error: unknown): ErrorKind {
  return hasStatus(error) && (error.status === 401 || error.status === 403) ? 'no-access' : 'error';
}

export function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message || GENERIC_MESSAGE;
  }
  return GENERIC_MESSAGE;
}
