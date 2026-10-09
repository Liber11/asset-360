import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useHostApi } from '../host/HostApiContext';

import { WorkspaceStateContext } from './useWorkspaceState';
import { parseWorkspaceState, serializeWorkspaceState, type WorkspaceState } from './workspaceState';

type WorkspaceStateProviderProps = { initialState?: string; children: ReactNode };

/** Single owner of host-synced UI state; seeds from initialState and mirrors every change to the host URL. */
export function WorkspaceStateProvider({ initialState, children }: WorkspaceStateProviderProps) {
  const api = useHostApi();
  const [state, setState] = useState(() => parseWorkspaceState(initialState));
  const latest = useRef(state);

  const update = useCallback(
    (patch: Partial<WorkspaceState>) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      setState(next);
      void api?.syncInternalState(serializeWorkspaceState(next));
    },
    [api]
  );

  const value = useMemo(() => ({ state, update }), [state, update]);

  return <WorkspaceStateContext.Provider value={value}>{children}</WorkspaceStateContext.Provider>;
}
