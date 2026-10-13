# Vendored code

`cognite-file-viewer/` is copied verbatim from Cognite's `integrate-file-viewer` skill
(`.claude/skills/integrate-file-viewer/code/`), as that skill instructs. It is third-party
code, kept outside `src/` like a package in `node_modules`:

- Only one local change: `CogniteFileViewer.tsx` imports react-pdf's public `PageProps` type
  instead of a deep import path that react-pdf does not export.
- ESLint relaxes the React Compiler hook rules for this folder only (see `eslint.config.mjs`).
- It is not part of the app's coverage scope; the app's integration point is
  `src/components/filePreview/CdfFilePreview.tsx`.
