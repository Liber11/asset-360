import { classifyError } from './errors';

export type LoadStatus = 'loading' | 'error' | 'no-access' | 'success';

type QueryLike = { isPending: boolean; isError: boolean; error: unknown };

/** Collapses a React Query result into the states every panel renders (FR-011). */
export function toLoadStatus(query: QueryLike): LoadStatus {
  if (query.isError) return classifyError(query.error);
  if (query.isPending) return 'loading';
  return 'success';
}
