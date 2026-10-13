import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeFileService, makeHostApi, makeProviders, makeServices } from '../__mocks__/testProviders';
import type { DocumentItem } from '../domain/documents';
import type { FileService } from '../services/FileService';

import { useDocumentsViewModel } from './useDocumentsViewModel';

const ASSET = { space: 'sp', externalId: 'pump-101' };
const PDF: DocumentItem = {
  ref: { space: 'sp', externalId: 'pid' },
  name: 'P&ID.pdf',
  mimeType: 'application/pdf',
  isUploaded: true,
};
const DWG: DocumentItem = { ref: { space: 'sp', externalId: 'cad' }, name: 'model.dwg', isUploaded: true };

describe(useDocumentsViewModel.name, () => {
  it('is loading while documents are fetched', () => {
    const { result } = renderVm(makeFileService({ listForAsset: vi.fn(() => new Promise<never>(() => undefined)) }));

    expect(result.current.status).toBe('loading');
  });

  it('lists the documents of the selected asset, including sub-assets by default', async () => {
    const service = listing([PDF, DWG]);
    const { result } = renderVm(service);

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(service.listForAsset).toHaveBeenCalledWith(ASSET, { includeSubAssets: true });
    expect(result.current.documents).toEqual([PDF, DWG]);
  });

  it('reports errors and no-access', async () => {
    const failing = renderVm(makeFileService({ listForAsset: vi.fn(() => Promise.reject(new Error('boom'))) }));
    const denied = renderVm(makeFileService({ listForAsset: vi.fn(() => Promise.reject({ status: 403 })) }));

    await waitFor(() => expect(failing.result.current.status).toBe('error'));
    expect(failing.result.current.errorMessage).toBe('boom');
    await waitFor(() => expect(denied.result.current.status).toBe('no-access'));
  });

  it('opens previewable documents in the dialog and syncs it to the host', async () => {
    const api = makeHostApi();
    const { result } = renderVm(listing([PDF]), api);
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.openDocument(PDF));

    expect(result.current.openDocumentDetail).toEqual(PDF);
    expect(api.syncInternalState).toHaveBeenLastCalledWith(expect.stringContaining('"openDocument":{"space":"sp"'));

    act(() => result.current.closeDocument());
    expect(result.current.openDocumentDetail).toBeUndefined();
  });

  it('downloads non-previewable documents through the host', async () => {
    const api = makeHostApi();
    const service = listing([DWG], { getDownloadUrl: vi.fn(() => Promise.resolve('https://files.cognite.test/cad')) });
    const { result } = renderVm(service, api);
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.openDocument(DWG));

    await waitFor(() =>
      expect(api.navigateExternal).toHaveBeenCalledWith({ url: 'https://files.cognite.test/cad', openInNewTab: true })
    );
    expect(service.getDownloadUrl).toHaveBeenCalledWith(DWG.ref);
    expect(result.current.openDocumentDetail).toBeUndefined();
  });

  it('reports download errors', async () => {
    const service = listing([DWG], { getDownloadUrl: vi.fn(() => Promise.reject(new Error('link expired'))) });
    const { result } = renderVm(service);
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.download(DWG));

    await waitFor(() => expect(result.current.downloadErrorMessage).toBe('link expired'));
  });

  it('restores an open document from the shared link once the list is loaded', async () => {
    const { result } = renderVm(listing([PDF]), makeHostApi(), { openDocument: PDF.ref });

    await waitFor(() => expect(result.current.openDocumentDetail).toEqual(PDF));
  });
});

function listing(items: DocumentItem[], overrides: Partial<FileService> = {}): FileService {
  return makeFileService({ listForAsset: vi.fn(() => Promise.resolve({ items, hasMore: false })), ...overrides });
}

function renderVm(fileService: FileService, api = makeHostApi(), extraState: Record<string, unknown> = {}) {
  const services = makeServices({ fileService });
  const initialState = JSON.stringify({ selectedAsset: ASSET, ...extraState });
  return renderHook(() => useDocumentsViewModel(), { wrapper: makeProviders({ services, api, initialState }) });
}
