import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HostApiContext, type HostApi } from '../host/HostApiContext';

import { useWorkspaceState } from './useWorkspaceState';
import { DEFAULT_WORKSPACE_STATE } from './workspaceState';
import { WorkspaceStateProvider } from './WorkspaceStateProvider';

describe(useWorkspaceState.name, () => {
  let api: HostApi;

  beforeEach(() => {
    api = { syncInternalState: vi.fn<HostApi['syncInternalState']>(() => Promise.resolve(true)) };
  });

  it('starts from the default state without initial state', () => {
    const { result } = renderHook(() => useWorkspaceState(), { wrapper: makeWrapper(api) });

    expect(result.current.state).toEqual(DEFAULT_WORKSPACE_STATE);
  });

  it('seeds the state from initialState', () => {
    const initialState = JSON.stringify({ query: 'pump', range: '1y' });

    const { result } = renderHook(() => useWorkspaceState(), { wrapper: makeWrapper(api, initialState) });

    expect(result.current.state.query).toBe('pump');
    expect(result.current.state.range).toBe('1y');
  });

  it('merges updates and syncs the full state to the host', () => {
    const { result } = renderHook(() => useWorkspaceState(), { wrapper: makeWrapper(api) });

    act(() => result.current.update({ query: 'compressor' }));
    act(() => result.current.update({ range: '1d' }));

    expect(result.current.state).toEqual({ ...DEFAULT_WORKSPACE_STATE, query: 'compressor', range: '1d' });
    expect(api.syncInternalState).toHaveBeenLastCalledWith(
      JSON.stringify({ ...DEFAULT_WORKSPACE_STATE, query: 'compressor', range: '1d' })
    );
  });

  it('shares one state between all consumers', () => {
    const { result } = renderHook(() => ({ a: useWorkspaceState(), b: useWorkspaceState() }), {
      wrapper: makeWrapper(api),
    });

    act(() => result.current.a.update({ query: 'valve' }));

    expect(result.current.b.state.query).toBe('valve');
  });

  it('still updates local state when there is no host api', () => {
    const { result } = renderHook(() => useWorkspaceState(), { wrapper: makeWrapper(null) });

    act(() => result.current.update({ query: 'pump' }));

    expect(result.current.state.query).toBe('pump');
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useWorkspaceState())).toThrow(/WorkspaceStateProvider/);
  });
});

function makeWrapper(api: HostApi | null, initialState?: string): ComponentType<{ children: ReactNode }> {
  return function Wrapper({ children }) {
    return (
      <HostApiContext.Provider value={api}>
        <WorkspaceStateProvider initialState={initialState}>{children}</WorkspaceStateProvider>
      </HostApiContext.Provider>
    );
  };
}
