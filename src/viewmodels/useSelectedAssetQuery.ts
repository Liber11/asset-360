import { useQuery } from '@tanstack/react-query';

import { refKey } from '../domain/cdm';
import { useServices } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

/** Details of the selected asset; one shared React Query cache entry for every consumer. */
export function useSelectedAssetQuery() {
  const { state } = useWorkspaceState();
  const { assetService } = useServices();
  const selected = state.selectedAsset;

  return useQuery({
    queryKey: ['asset', selected ? refKey(selected) : null],
    queryFn: () => (selected ? assetService.retrieve(selected) : Promise.resolve(null)),
    enabled: selected !== null,
  });
}
