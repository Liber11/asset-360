import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LazyCdfFilePreview } from './LazyCdfFilePreview';

// vi.mock is unavoidable here: CdfFilePreview pulls in PDF.js, which cannot run in happy-dom.
vi.mock('./CdfFilePreview', () => ({
  CdfFilePreview: ({ name }: { name: string }) => <p>{`viewer for ${name}`}</p>,
}));

describe('LazyCdfFilePreview', () => {
  it('shows a loading state, then the lazily loaded viewer', async () => {
    render(<LazyCdfFilePreview file={{ space: 'sp', externalId: 'f1' }} name="manual.pdf" />);

    expect(screen.getByText('Loading viewer…')).toBeInTheDocument();
    expect(await screen.findByText('viewer for manual.pdf')).toBeInTheDocument();
  });
});
