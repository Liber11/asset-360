import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WORKSPACE_STATE,
  isInstanceRef,
  parseWorkspaceState,
  serializeWorkspaceState,
  type WorkspaceState,
} from './workspaceState';

describe(isInstanceRef.name, () => {
  it('accepts an object with string space and externalId', () => {
    expect(isInstanceRef({ space: 'sp', externalId: 'ext' })).toBe(true);
  });

  it.each([null, undefined, 'x', 1, {}, { space: 'sp' }, { space: 1, externalId: 'ext' }])(
    'rejects %j',
    (value) => {
      expect(isInstanceRef(value)).toBe(false);
    }
  );
});

describe(parseWorkspaceState.name, () => {
  it('returns the default state when there is no initial state', () => {
    expect(parseWorkspaceState(undefined)).toEqual(DEFAULT_WORKSPACE_STATE);
  });

  it('returns the default state for malformed JSON', () => {
    expect(parseWorkspaceState('{not json')).toEqual(DEFAULT_WORKSPACE_STATE);
  });

  it('returns the default state when the JSON is not an object', () => {
    expect(parseWorkspaceState('42')).toEqual(DEFAULT_WORKSPACE_STATE);
  });

  it('restores every valid field', () => {
    const saved: WorkspaceState = {
      selectedAsset: { space: 'sp', externalId: 'PUMP-101' },
      query: 'pump',
      selectedSeries: [{ space: 'sp', externalId: 'ts-1' }],
      range: '30d',
    };

    expect(parseWorkspaceState(JSON.stringify(saved))).toEqual(saved);
  });

  it('falls back per field when values are invalid', () => {
    const raw = JSON.stringify({
      selectedAsset: { space: 'sp' },
      query: 7,
      selectedSeries: [{ space: 'sp', externalId: 'ok' }, 'bad'],
      range: '5y',
    });

    expect(parseWorkspaceState(raw)).toEqual({
      ...DEFAULT_WORKSPACE_STATE,
      selectedSeries: [{ space: 'sp', externalId: 'ok' }],
    });
  });

  it('ignores a selectedSeries value that is not an array', () => {
    const raw = JSON.stringify({ selectedSeries: 'ts-1' });

    expect(parseWorkspaceState(raw).selectedSeries).toEqual([]);
  });
});

describe(serializeWorkspaceState.name, () => {
  it('round-trips through parseWorkspaceState', () => {
    const state: WorkspaceState = {
      ...DEFAULT_WORKSPACE_STATE,
      selectedAsset: { space: 'sp', externalId: 'a' },
    };

    expect(parseWorkspaceState(serializeWorkspaceState(state))).toEqual(state);
  });
});
