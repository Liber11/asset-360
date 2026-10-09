/** Identifies a data modeling node (asset, time series, activity, file). */
export type InstanceRef = { space: string; externalId: string };

export const TIME_RANGE_KEYS = ['1d', '7d', '30d', '1y'] as const;
export type TimeRangeKey = (typeof TIME_RANGE_KEYS)[number];

/** Host-synced workspace state: survives reloads and shared links (see CLAUDE.md §2). */
export type WorkspaceState = {
  selectedAsset: InstanceRef | null;
  query: string;
  selectedSeries: InstanceRef[];
  range: TimeRangeKey;
  /** Work order whose detail dialog is open. */
  openWorkOrder: InstanceRef | null;
};

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  selectedAsset: null,
  query: '',
  selectedSeries: [],
  range: '7d',
  openWorkOrder: null,
};

export function isInstanceRef(value: unknown): value is InstanceRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'space' in value &&
    'externalId' in value &&
    typeof value.space === 'string' &&
    typeof value.externalId === 'string'
  );
}

function isTimeRangeKey(value: unknown): value is TimeRangeKey {
  return TIME_RANGE_KEYS.some((key) => key === value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Parses the host's initialState string, falling back to defaults field by field. */
export function parseWorkspaceState(raw: string | undefined): WorkspaceState {
  const parsed = raw ? parseJson(raw) : undefined;
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_WORKSPACE_STATE;

  const selectedAsset = 'selectedAsset' in parsed ? parsed.selectedAsset : undefined;
  const query = 'query' in parsed ? parsed.query : undefined;
  const selectedSeries = 'selectedSeries' in parsed ? parsed.selectedSeries : undefined;
  const range = 'range' in parsed ? parsed.range : undefined;
  const openWorkOrder = 'openWorkOrder' in parsed ? parsed.openWorkOrder : undefined;

  return {
    selectedAsset: isInstanceRef(selectedAsset) ? selectedAsset : DEFAULT_WORKSPACE_STATE.selectedAsset,
    query: typeof query === 'string' ? query : DEFAULT_WORKSPACE_STATE.query,
    selectedSeries: Array.isArray(selectedSeries) ? selectedSeries.filter(isInstanceRef) : [],
    range: isTimeRangeKey(range) ? range : DEFAULT_WORKSPACE_STATE.range,
    openWorkOrder: isInstanceRef(openWorkOrder) ? openWorkOrder : DEFAULT_WORKSPACE_STATE.openWorkOrder,
  };
}

export function serializeWorkspaceState(state: WorkspaceState): string {
  return JSON.stringify(state);
}
