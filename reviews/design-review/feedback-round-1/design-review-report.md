# Design Review — Asset 360 Investigation Workspace — round 1

Reviewed commit: `af4e7aa` (2026-10-13). Walkthrough done in Fusion development mode on `publicdatacdm`, desktop browser.

## User and tasks

- **Primary user:** Operations Analyst / Reliability Engineer at an industrial facility (Valhall data). Works at a desk on a laptop or desktop; investigates equipment flagged in shift reports or alarms and briefs the maintenance team.
- **Tasks evaluated:**
  1. Find the flagged equipment by tag and understand where it sits in the plant.
  2. Check how its sensors behave over time.
  3. Prepare a maintenance briefing: recent work orders and the equipment's documents.
- **Context:** Experienced plant user, time-pressured (success criterion: under 15 minutes per asset instead of opening 3–4 systems). Desktop only per the App Brief.

## Task walkthrough findings

- **Task 1 — Find the equipment.** Typing `23-HA-9114` or `23-PC` returns matching assets with description and parent; opening one shows the full ancestor breadcrumb (`VAL / 23 / 230900 / …`), name, external id and description. No confusion. Recently viewed assets restore the last investigations.
- **Task 2 — Sensor behaviour.** With *Include sub-assets* on, `23-PC-9109` shows 3 series and `23-HA-9114` 32. Selecting series draws one small chart each, anchored to the latest datapoint (the note above the list explains why). **Issue found and fixed during the walkthrough:** selecting 3 series in 7D/1Y returned "Sum of limits for aggregate data points can not exceed 10000" (CDF 400); the datapoint limit is now split across the selection (commit `83167d0`) and the charts load. The raw CDF error text was shown to the user, which is technical.
- **Task 3 — Maintenance briefing.** Work orders list the most recent first, with a "100 most recent" note when capped; clicking a row opens a readable detail dialog (description, start/end, scheduled dates, source). **Issue found and fixed:** in the half-width layout the Date column was clipped; the Name column was narrowed (commit `cb57eab`). Documents: `23-PC-9109` has none in CDF and shows a clear empty state; `23-HA-9114` shows its manual under "Matched by name — Not linked in CDF", and the PDF opens inline with a Download button (react-pdf 10.5 verified).

Screenshots of every step were captured for the submission (search, 360 overview, header, charts, work orders, work order detail, documents, PDF preview).

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 5 | 14 source files import Aura per subpath; 0 hard-coded hex/rgb colors; 0 `aura/no-overriding-styles` warnings; chart colors from `chart-*` tokens. | Keep custom search-result rows aligned with Aura if a list component ships. |
| Q2 Navigation & hierarchy | 4 | Single view with clear hierarchy (title → asset header with breadcrumb → time series → work orders / documents); "New search" returns home; state survives reload via the host URL. | Breadcrumb segments are not clickable to jump to an ancestor asset. |
| Q3 Labels & language | 5 | 0 vague button labels; specific actions ("New search", "Include sub-assets", "Refresh", "Download"); one placeholder on the search input, which also has an `aria-label`. | — |
| Q4 Feedback & validation | 4 | Every panel has loading skeletons, error alert with Retry, no-access and empty states; the one mutation (download) handles errors. | Error alerts show raw CDF messages (code, request id); add a plain-language sentence and keep the technical detail secondary. |
| Q5 Clickability | 4 | No `div`/`span` click handlers; rows, buttons and checkboxes are native/Aura interactive elements with hover/focus styles. | Work order rows open a dialog but give little visual hint before hover; consider a chevron or "View" affordance. |
| Q6 Error prevention | 5 | Read-only app: no destructive actions. | — |
| Q7 Responsive | 5 | Desktop-only by brief; panels go 2-column at `xl` and stack below, no fixed-px widths, no horizontal page scroll; viewport meta present. | — |
| Q8 Empty states | 5 | Every panel (search, recent, time series, chart, work orders, documents) has an explicit empty state with next-step copy; documents add a clearly labelled name-match fallback. | — |
| Q9 Performance | 4 | Main bundle ~319 kB gzip, PDF viewer lazy-loaded (~132 kB gzip); all lists capped; search debounced; React Query caching; charts refresh on demand. | Split the main bundle further (e.g. lazy-load the chart library). |
| Q10 Accessibility | 4 | 0 images without alt; 11 `aria-label`s on icon/unlabelled controls; native buttons and Aura dialogs give keyboard and focus handling; no `tabIndex` misuse. | No automated contrast/axe scan was run; run axe once on the deployed preview. |

## Summary

- Average score: 4.5
- Quality level: Excellent

## Must Fix (any score < 3)

- None.

## Should Fix (any score 3 – 3.7)

- None.

## Nice to Fix (any score 3.8 – 4.4)

- Q2: make breadcrumb ancestors clickable to open that asset.
- Q4: friendlier error copy above the raw CDF message.
- Q5: stronger visual hint that work order rows open a detail view.
- Q9: further code-splitting of the main bundle.
- Q10: run an axe/contrast scan on the deployed preview.
