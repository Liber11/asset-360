import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { refKey } from '../domain/cdm';
import { isPreviewable, type DocumentItem } from '../domain/documents';
import { errorMessage } from '../domain/errors';
import { toLoadStatus, type LoadStatus } from '../domain/loadStatus';
import { useHostApi } from '../host/HostApiContext';
import { useServices } from '../services/ServicesContext';
import { useWorkspaceState } from '../state/useWorkspaceState';

export type DocumentsViewModel = {
  status: LoadStatus;
  documents: DocumentItem[];
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
  const openKey = state.openDocument ? refKey(state.openDocument) : null;

  return {
    status: toLoadStatus(query),
    documents,
    hasMore: query.data?.hasMore ?? false,
    errorMessage: query.isError ? errorMessage(query.error) : undefined,
    retry,
    openDocumentDetail: openKey ? documents.find((doc) => refKey(doc.ref) === openKey) : undefined,
    openDocument,
    closeDocument,
    download,
    isDownloading: downloadMutation.isPending,
    downloadErrorMessage: downloadMutation.isError ? errorMessage(downloadMutation.error) : undefined,
  };
}
