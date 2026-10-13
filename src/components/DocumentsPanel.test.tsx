import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubLayoutSize } from '../__mocks__/layout';
import { makeFileService, makeHostApi, makeProviders, makeServices } from '../__mocks__/testProviders';
import type { DocumentItem } from '../domain/documents';
import type { HostApi } from '../host/HostApiContext';
import type { FileService } from '../services/FileService';

import { DocumentsPanel } from './DocumentsPanel';

const PDF: DocumentItem = {
  ref: { space: 'sp', externalId: 'pid' },
  name: 'P&ID 23-PC-9109.pdf',
  mimeType: 'application/pdf',
  isUploaded: true,
  updatedTime: '2019-01-18T10:00:00Z',
};
const XLS: DocumentItem = {
  ref: { space: 'sp', externalId: 'sheet' },
  name: 'Readings.xlsx',
  isUploaded: true,
  updatedTime: '2018-05-01T00:00:00Z',
};

describe('DocumentsPanel', () => {
  beforeEach(() => {
    stubLayoutSize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists documents with name, type, open action, and date', async () => {
    renderPanel(listing([PDF, XLS]));

    const grid = await screen.findByRole('table', { name: 'Documents' });
    expect(within(grid).getByText('P&ID 23-PC-9109.pdf')).toBeInTheDocument();
    expect(within(grid).getByText('PDF')).toBeInTheDocument();
    expect(within(grid).getByText('Preview')).toBeInTheDocument();
    expect(within(grid).getByText('XLSX')).toBeInTheDocument();
    expect(within(grid).getByText('Download')).toBeInTheDocument();
    expect(within(grid).getByText('2019-01-18')).toBeInTheDocument();
  });

  it('previews a PDF in a dialog', async () => {
    renderPanel(listing([PDF]));

    await userEvent.click(await screen.findByText('P&ID 23-PC-9109.pdf'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('file-preview')).toHaveTextContent('Preview of P&ID 23-PC-9109.pdf (pid)');
    expect(within(dialog).getByText('PDF · Updated 2019-01-18')).toBeInTheDocument();
  });

  it('downloads other file types through the host', async () => {
    const api = makeHostApi();
    renderPanel(
      listing([XLS], { getDownloadUrl: vi.fn(() => Promise.resolve('https://files.cognite.test/sheet')) }),
      api
    );

    await userEvent.click(await screen.findByText('Readings.xlsx'));

    await waitFor(() =>
      expect(api.navigateExternal).toHaveBeenCalledWith({ url: 'https://files.cognite.test/sheet', openInNewTab: true })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a download error', async () => {
    renderPanel(listing([XLS], { getDownloadUrl: vi.fn(() => Promise.reject(new Error('link expired'))) }));

    await userEvent.click(await screen.findByText('Readings.xlsx'));

    expect(await screen.findByText('Could not download the file: link expired')).toBeInTheDocument();
  });

  it('shows the empty state when the asset has no documents', async () => {
    renderPanel(listing([]));

    expect(await screen.findByText('No documents linked to this asset')).toBeInTheDocument();
  });

  it('shows the error state', async () => {
    renderPanel(makeFileService({ listForAsset: vi.fn(() => Promise.reject(new Error('boom'))) }));

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});

function listing(items: DocumentItem[], overrides: Partial<FileService> = {}): FileService {
  return makeFileService({ listForAsset: vi.fn(() => Promise.resolve({ items, hasMore: false })), ...overrides });
}

function renderPanel(fileService: FileService, api: HostApi = makeHostApi()) {
  const services = makeServices({ fileService });
  const initialState = JSON.stringify({ selectedAsset: { space: 'sp', externalId: 'pump-101' } });
  return render(<DocumentsPanel />, { wrapper: makeProviders({ services, api, initialState }) });
}
