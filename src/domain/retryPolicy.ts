import { classifyError } from './errors';

function statusOf(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;
}

/** Extra React Query attempts on top of the SDK's own retries. */
const MAX_QUERY_RETRIES = 1;

/**
 * The Cognite SDK already retries 429 and 5xx with exponential backoff and full jitter, so React
 * Query must not stack its own retries on those or on client errors (4xx): that would multiply
 * the load on CDF. Only network-level failures (no HTTP status) get one more attempt.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  if (classifyError(error) === 'no-access') return false;
  return statusOf(error) === undefined;
}
