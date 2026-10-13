import type { InstanceRef } from '../state/workspaceState';

/** A CogniteFile shown in the documents panel. Dates are ISO strings. */
export type DocumentItem = {
  ref: InstanceRef;
  name: string;
  mimeType?: string;
  /** Whether the file content exists in CDF (CogniteFile.isUploaded). */
  isUploaded: boolean;
  /** `sourceUpdatedTime`, falling back to the node's `lastUpdatedTime`. */
  updatedTime?: string;
};

/** Inline preview scope for v1 (FR-010): PDFs and common images. */
const PREVIEW_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
};

const PREVIEW_EXTENSIONS: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function extensionOf(name: string): string | undefined {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : undefined;
}

function effectiveMimeType(doc: DocumentItem): string | undefined {
  if (doc.mimeType) return doc.mimeType.toLowerCase();
  const extension = extensionOf(doc.name);
  return extension ? PREVIEW_EXTENSIONS[extension] : undefined;
}

export function isPreviewable(doc: DocumentItem): boolean {
  const mimeType = effectiveMimeType(doc);
  return doc.isUploaded && mimeType !== undefined && mimeType in PREVIEW_TYPES;
}

export function documentTypeLabel(doc: DocumentItem): string {
  const mimeType = effectiveMimeType(doc);
  if (mimeType && mimeType in PREVIEW_TYPES) return PREVIEW_TYPES[mimeType];
  return extensionOf(doc.name)?.toUpperCase() ?? '—';
}
