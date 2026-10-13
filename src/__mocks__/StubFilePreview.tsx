import type { FilePreviewProps } from '../components/filePreview/FilePreviewContext';

/** Lightweight stand-in for the PDF.js-based viewer. */
export function StubFilePreview({ file, name }: FilePreviewProps) {
  return <div data-testid="file-preview">{`Preview of ${name} (${file.externalId})`}</div>;
}
