import { useWorkspaceState } from '../state/useWorkspaceState';

export type WorkspaceViewModel = {
  /** An asset is open: show the 360 view instead of the start screen. */
  hasSelectedAsset: boolean;
  /** Nothing typed yet: show recent assets and the getting-started hint. */
  showStartHint: boolean;
};

export function useWorkspaceViewModel(): WorkspaceViewModel {
  const { state } = useWorkspaceState();
  return {
    hasSelectedAsset: state.selectedAsset !== null,
    showStartHint: state.query.trim() === '',
  };
}
