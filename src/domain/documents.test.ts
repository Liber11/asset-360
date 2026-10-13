import { describe, expect, it } from 'vitest';

import { documentTypeLabel, isPreviewable, type DocumentItem } from './documents';

describe(isPreviewable.name, () => {
  it.each(['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'])(
    'previews uploaded %s files',
    (mimeType) => {
      expect(isPreviewable(doc({ mimeType }))).toBe(true);
    }
  );

  it('falls back to the file extension when the MIME type is missing', () => {
    expect(isPreviewable(doc({ name: 'P&ID-23.PDF' }))).toBe(true);
    expect(isPreviewable(doc({ name: 'photo.jpg' }))).toBe(true);
    expect(isPreviewable(doc({ name: 'model.dwg' }))).toBe(false);
  });

  it('does not preview other types', () => {
    expect(isPreviewable(doc({ mimeType: 'application/vnd.ms-excel' }))).toBe(false);
  });

  it('does not preview files whose content is not uploaded', () => {
    expect(isPreviewable(doc({ mimeType: 'application/pdf', isUploaded: false }))).toBe(false);
  });
});

describe(documentTypeLabel.name, () => {
  it('uses a short label for known types', () => {
    expect(documentTypeLabel(doc({ mimeType: 'application/pdf' }))).toBe('PDF');
    expect(documentTypeLabel(doc({ mimeType: 'image/png' }))).toBe('PNG');
  });

  it('falls back to the extension, then to a dash', () => {
    expect(documentTypeLabel(doc({ name: 'notes.docx' }))).toBe('DOCX');
    expect(documentTypeLabel(doc({ name: 'README' }))).toBe('—');
  });
});

function doc(extra: Partial<DocumentItem>): DocumentItem {
  return { ref: { space: 'sp', externalId: 'f1' }, name: 'file', isUploaded: true, ...extra };
}
