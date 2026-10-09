# Feature Specification: Asset 360 Investigation Workspace

<!--
  This is your app's living product spec. Edit it directly or ask your coding
  agent to collaborate with you on it.
-->

Source: [`App-Brief.md`](./App-Brief.md). Persona: Operations Analyst / Reliability
Engineer at an industrial facility, working at a desk on a desktop or laptop with a
large monitor, investigating a piece of equipment that was just flagged in a shift
report or alarm.

## User Scenarios & Testing

### User Stories

1. As an Operations Analyst, I want to search for a piece of equipment by its tag, name,
   or description, so that I can quickly find the asset flagged in a shift report or
   alarm without logging in to multiple systems.
2. As an Operations Analyst, I want to open a single 360° view for the selected asset, so
   that I can see its identity, time series, work orders, and related documents in one
   place.
3. As an Operations Analyst, I want to plot the time series linked to the selected asset
   over a recent time window, so that I can judge current behavior versus normal without
   opening the historian tool.
4. As an Operations Analyst, I want to see the recent work orders (activities) related to
   the selected asset, so that I can answer "has anyone already touched this?" without
   logging in to SAP.
5. As an Operations Analyst, I want to see and preview the documents (P&IDs, manuals,
   inspection reports) related to the selected asset, so that I do not have to dig
   through SharePoint to brief the maintenance team.
6. As an Operations Analyst, I want the selected asset to be kept in the URL, so that I
   can reload the page or send the link to a colleague and land on the same asset.
7. As an Operations Analyst who investigates the same handful of assets across a shift,
   I want the app to remember the assets I recently opened, so that I can jump back to
   them in one click.

### Acceptance Scenarios

- Given no asset is selected, when the analyst types the first few characters of an
  equipment tag, then they see a ranked list of matching assets showing identifier,
  name, and enough parent/location context to tell similar assets apart.
- Given a search term matches no assets, when the search completes, then the app shows
  an empty state explaining that nothing matched and how to refine the search.
- Given search results are shown, when the analyst selects one, then the 360 view for
  that asset opens with its identifier, name, description, and type at the top, and the
  selection is reflected in the shareable URL.
- Given the 360 view loads, then the time series panel lists every series linked to the
  asset but plots none by default; the analyst picks which series to chart.
- Given the analyst selects one or more series, when the chart renders, then the default
  time window ends at the most recent datapoint among the selected series (not at
  wall-clock "now"), and the chart updates when the selection or time range changes.
- Given the chart is shown, when the analyst uses the manual refresh control, then the
  chart re-fetches data for the current selection and range; the chart never auto-polls.
- Given the asset has related activities, then the work orders panel lists them most
  recent first with identifier, name, and dates; selecting one shows its full detail
  without leaving the 360 view.
- Given the asset has related files, then the documents panel lists them with name, type,
  and last-updated date; selecting a PDF or common image opens it inline; any other type
  offers a download / open-externally action.
- Given the asset has no time series, activities, or files, then each panel shows its own
  empty state and the rest of the page still renders.
- Given a request for one panel fails, then only that panel shows an inline error with a
  retry action and the other panels keep working.
- Given the user lacks access to a data type (for example files), then the affected panel
  shows a clear "no access" state instead of a generic error.
- Given the analyst has opened at least one asset on this device, when they return to the
  start screen, then they see up to 10 recently viewed assets and can open any of them in
  one click.
- Given an uncaught render error happens outside a panel, then an app-level error
  boundary shows a recovery action (reload) instead of a blank screen.

## Requirements

### Functional Requirements

- FR-001: System MUST provide a single search box that accepts a partial or full tag,
  name, or description and returns a ranked list of matching `CogniteAsset` instances.
- FR-002: Each search result MUST show the asset's identifier (`externalId`), `name`, and
  context to tell similar assets apart (`description` and parent name).
- FR-003: Selecting a result MUST open the 360 view for that asset. The selected asset
  (and chart selection/time range) MUST be synced to the Fusion host with
  `syncInternalState` and restored from `initialState`, so reloads and shared links land
  on the same asset.
- FR-004: The 360 view MUST show an asset header with identifier, `name`, `description`,
  and asset type (`type` → `CogniteAssetType` name, when set), plus its ancestor path.
- FR-005: The 360 view MUST include a time series panel listing every
  `CogniteTimeSeries` linked to the asset (via `CogniteTimeSeries.assets`), with name and
  unit (`unit` symbol, or `sourceUnit` when no unit is set). No series is plotted by
  default; the analyst explicitly picks which to chart. When at least one series is
  selected, the default time window MUST end at the latest datapoint of the selected
  series, not at wall-clock time, because historian data may be stale.
- FR-006: Users MUST be able to add or remove plotted series and change the time range
  without leaving the 360 view. Large ranges MUST use aggregates.
- FR-006a: When a selected series has no datapoints, the chart MUST show a clear empty
  state for it instead of an empty axis or an error.
- FR-006b: The chart MUST NOT auto-poll or stream. A manual refresh control MUST
  re-fetch data for the current selection and range.
- FR-007: The 360 view MUST include a work orders panel listing `CogniteActivity`
  instances linked to the asset (via `CogniteActivity.assets`), sorted by most recent
  first (`endTime`, falling back to `scheduledEndTime`, then `startTime`), showing
  identifier (`sourceId`, falling back to `externalId`), `name`, and the relevant date.
- FR-008: Users MUST be able to see the full detail of one work order (`description`,
  `startTime`, `endTime`, `scheduledStartTime`, `scheduledEndTime`, `source`) without
  leaving the 360 view.
- FR-009: The 360 view MUST include a documents panel listing `CogniteFile` instances
  linked to the asset (via `CogniteFile.assets`), with `name`, `mimeType`, and last-updated
  date (`sourceUpdatedTime`, falling back to the node's `lastUpdatedTime`).
- FR-010: Users MUST be able to preview PDFs and common images (PNG, JPEG, GIF, WEBP)
  inline when the file content is uploaded (`isUploaded = true`). Other types MUST offer
  a download / open-externally action. Files without uploaded content MUST be shown as
  not available.
- FR-011: Each panel (header, time series, work orders, documents) MUST render its own
  loading, empty, error (with retry), and no-access states independently.
- FR-012: The app MUST keep a list of the analyst's 10 most recently viewed assets in
  browser-local storage on the device (oldest dropped first), shown on the start screen.
  It is not synced across devices in v1.
- FR-013: The app MUST authenticate against CDF through the Fusion host and only show
  data the signed-in user is authorized to see.
- FR-014: All data MUST be read live from CDF. The app MUST be read-only and MUST NOT
  create, update, or delete CDF data.
- FR-015: Lists MUST be bounded (paged with cursors, capped per panel) so an asset with
  many related items does not freeze the page.
- FR-016: The app MUST be usable from a 13" laptop up to a large monitor without
  horizontal scrolling.
- FR-017: Routed app content MUST be wrapped in an app-level error boundary with a
  reload action.

## Success Criteria

- SC-001: An analyst can go from "I have an equipment tag" to seeing that asset's
  header, time series, work orders, and documents on one page in under 30 seconds for a
  typical asset.
- SC-002: For a typical investigation, the analyst completes the task without opening
  any other tool (no SAP, historian, or SharePoint tab) in at least 80% of sessions.
- SC-003: Median end-to-end investigation time (asset flagged → ready to brief
  maintenance) drops from 1-2 hours with the multi-tool workflow to under 15 minutes
  with this app (from `App-Brief.md`).
- SC-004: On a representative asset, all four panels show usable content, or a correct
  empty or error state, within 3 seconds on a standard office network.
- SC-005: At least 90% of weekly sessions include at least one search and at least one
  opened document, showing the flow is used end to end.
- SC-006: When one data source is unavailable (for example documents), at least 95% of
  sessions still render the remaining panels.

## Clarifications

- The chart's default time window is anchored to the latest datapoint of the selected
  series (not wall-clock "now"), because historian data may be stale.
- No series is plotted by default; the analyst picks which series to chart.
- The chart refreshes only on manual refresh; no auto-polling or streaming.
- Recently viewed assets live in browser-local storage per device (last 10). This is a
  per-device convenience, so it is not host-synced. The selected asset is host-synced.
- Inline preview is limited to PDFs and PNG/JPEG/GIF/WEBP images in v1.
- `CogniteActivity` has no `status` property in the core data model, so v1 does not show
  a work order status. The `publicdatacdm` project may also hold `CogniteMaintenanceOrder`
  instances (which do have a status); supporting those is out of scope for v1 and should
  be revisited after checking the live data.
- `CogniteAsset` has no dedicated "tag" property; v1 uses `externalId` as the identifier
  and searches `name`, `description`, and `aliases`. This should be checked against the
  live data.

## Assumptions

- Desktop or laptop in an office or control room; mobile and tablet are out of scope for
  v1.
- The analyst already has a CDF identity; the app uses the standard Flows authentication
  through the Fusion host. User provisioning is out of scope.
- Data in `publicdatacdm` already exists as core data model instances: time series,
  activities, and files hold direct relations to their assets.
- SAP, historian, and SharePoint data reach the app only through CDF; the app does not
  call those systems directly.
- The app follows the workspace's standard auth, design (Aura), and data-modeling
  practices.

---

## Data Models & CDF Integration *(mandatory)*

Reference: [Core data model](https://docs.cognite.com/cdf/dm/dm_reference/dm_core_data_model)
(verified through the Cognite Docs MCP).

### Existing views

| View | Used for | Key properties read |
| --- | --- | --- |
| `cdf_cdm.CogniteAsset:v1` | Search and asset header | `name`, `description`, `aliases`, `tags`, `parent`, `path`, `type` |
| `cdf_cdm.CogniteAssetType:v1` | Asset type label in header | `name` |
| `cdf_cdm.CogniteTimeSeries:v1` | Time series panel and chart | `name`, `description`, `type`, `isStep`, `sourceUnit`, `unit`, `assets` |
| `cdf_cdm.CogniteUnit:v1` | Unit label on time series | `symbol` |
| `cdf_cdm.CogniteActivity:v1` | Work orders panel and detail | `name`, `description`, `assets`, `sourceId`, `source`, `startTime`, `endTime`, `scheduledStartTime`, `scheduledEndTime` |
| `cdf_cdm.CogniteFile:v1` | Documents panel and preview | `name`, `mimeType`, `isUploaded`, `sourceUpdatedTime`, `assets` |

Relationships. All direct relations point **to** the asset; the asset holds the
automatically updated reverse lists:

```
CogniteTimeSeries.assets ──► CogniteAsset   (reverse: CogniteAsset.timeSeries)
CogniteActivity.assets   ──► CogniteAsset   (reverse: CogniteAsset.activities)
CogniteFile.assets       ──► CogniteAsset   (reverse: CogniteAsset.files)
CogniteAsset.parent      ──► CogniteAsset   (reverse: CogniteAsset.children)
CogniteAsset.type        ──► CogniteAssetType
CogniteTimeSeries.unit   ──► CogniteUnit
```

Datapoints and file content are not stored in the views. Datapoints are read from the
time series datapoints API and file content from the files API, both addressed by the
node's `instanceId` (`space` + `externalId`).

### New views

None. The app does not create or change any views, containers, or data models.

### Spaces

- `cdf_cdm`: system space with the core data model views listed above (schema only;
  read-only for this app).
- `cdf_cdm_units`: system space with `CogniteUnit` instances.
- Instance spaces in `publicdatacdm` that hold the asset, time series, activity, and file
  nodes. The app does not hard-code them; it queries the views across all instance spaces
  the user can read. The app creates no spaces and writes no data. The only client-side
  persistence is `localStorage` for the recently viewed list.
