import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { refKey } from '../domain/cdm';
import { isPreviewable, type DocumentItem } from '../domain/documents';
import { errorMessage } from '../domain/errors';
import { toLoadStatus, type LoadStatus } from '../domain/loadStatus';
import { useHostApi } from '../host/HostApiContext';
import { useServices } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

import { useSelectedAssetQuery } from './useSelectedAssetQuery';

export type DocumentsViewModel = {
  status: LoadStatus;
  /** Documents linked to the asset in the data model. */
  documents: DocumentItem[];
  /**
   * Fallback when nothing is linked: files whose name contains the asset tag. Not a modelled
   * relationship, so the UI must label it as such (FR-009a). `idle` while not needed.
   */
  nameMatchStatus: LoadStatus | 'idle';
  nameMatchTag?: string;
  nameMatches: DocumentItem[];
  hasMore: boolean;
  errorMessage?: string;
  retry: () => void;
  /** Document whose preview dialog is open (host-synced). */
  openDocumentDetail?: DocumentItem;
  /** Previews PDFs and images; downloads anything else (FR-010). */
  openDocument: (doc: DocumentItem) => void;
  closeDocument: () => void;
  download: (doc: DocumentItem) => void;
  isDownloading: boolean;
  downloadErrorMessage?: string;
};

export function useDocumentsViewModel(): DocumentsViewModel {
  const { state, update } = useWorkspaceState();
  const { fileService } = useServices();
  const api = useHostApi();
  const asset = state.selectedAsset;
  const { includeSubAssets } = state;

  const query = useQuery({
    queryKey: ['documents', asset ? refKey(asset) : null, includeSubAssets],
    queryFn: () =>
      asset ? fileService.listForAsset(asset, { includeSubAssets }) : Promise.resolve({ items: [], hasMore: false }),
    enabled: asset !== null,
  });

  const assetQuery = useSelectedAssetQuery();
  const tag = assetQuery.data?.name;
  const needsNameMatch = query.isSuccess && query.data.items.length === 0 && tag !== undefined;

  const nameMatch = useQuery({
    queryKey: ['documents-by-name', tag],
    queryFn: () => (tag ? fileService.searchByName(tag) : Promise.resolve([])),
    enabled: needsNameMatch,
  });

  const downloadMutation = useMutation({
    mutationFn: async (doc: DocumentItem) => {
      if (!api) throw new Error('Not connected to Fusion.');
      const url = await fileService.getDownloadUrl(doc.ref);
      // Leaving the app goes through the host, never window.open (CLAUDE.md §2).
      await api.navigateExternal({ url, openInNewTab: true });
    },
  });

  const { mutate } = downloadMutation;
  const download = useCallback((doc: DocumentItem) => mutate(doc), [mutate]);
  const openDocument = useCallback(
    (doc: DocumentItem) => (isPreviewable(doc) ? update({ openDocument: doc.ref }) : mutate(doc)),
    [update, mutate]
  );
  const closeDocument = useCallback(() => update({ openDocument: null }), [update]);
  const { refetch } = query;
  const retry = useCallback(() => void refetch(), [refetch]);

  const documents = query.data?.items ?? [];
  const nameMatches = needsNameMatch ? (nameMatch.data ?? []) : [];
  const openKey = state.openDocument ? refKey(state.openDocument) : null;

  return {
    status: toLoadStatus(query),
    documents,
    hasMore: query.data?.hasMore ?? false,
    errorMessage: query.isError ? errorMessage(query.error) : undefined,
    retry,
    nameMatchStatus: needsNameMatch ? toLoadStatus(nameMatch) : 'idle',
    nameMatchTag: needsNameMatch ? tag : undefined,
    nameMatches,
    openDocumentDetail: openKey
      ? [...documents, ...nameMatches].find((doc) => refKey(doc.ref) === openKey)
      : undefined,
    openDocument,
    closeDocument,
    download,
    isDownloading: downloadMutation.isPending,
    downloadErrorMessage: downloadMutation.isError ? errorMessage(downloadMutation.error) : undefined,
  };
}
