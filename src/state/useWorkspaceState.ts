import { createContext, useContext } from 'react';

import type { WorkspaceState } from './workspaceState';

export type WorkspaceStateContextValue = {
  state: WorkspaceState;
  update: (patch: Partial<WorkspaceState>) => void;
};

export const WorkspaceStateContext = createContext<WorkspaceStateContextValue | null>(null);

export function useWorkspaceState(): WorkspaceStateContextValue {
  const value = useContext(WorkspaceStateContext);
  if (!value) throw new Error('useWorkspaceState must be used inside WorkspaceStateProvider');
  return value;
}
