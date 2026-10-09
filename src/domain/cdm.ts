import type { NodeOrEdge, ViewReference } from '@cognite/sdk';

import { isInstanceRef, type InstanceRef } from '../state/workspaceState';

function cdmView(externalId: string): ViewReference {
  return { type: 'view', space: 'cdf_cdm', externalId, version: 'v1' };
}

/** Core data model views this app reads (see SPEC.md → Data Models & CDF Integration). */
export const CDM_VIEWS = {
  asset: cdmView('CogniteAsset'),
  assetType: cdmView('CogniteAssetType'),
  timeSeries: cdmView('CogniteTimeSeries'),
  unit: cdmView('CogniteUnit'),
  activity: cdmView('CogniteActivity'),
  file: cdmView('CogniteFile'),
} as const;

export type ViewProps = Record<string, unknown>;

/** Properties of `node` that come from `view`; empty when the node has no data in that view. */
export function viewProps(node: NodeOrEdge, view: ViewReference): ViewProps {
  return node.properties?.[view.space]?.[`${view.externalId}/${view.version}`] ?? {};
}

export function readString(props: ViewProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === 'string' ? value : undefined;
}

export function readStringList(props: ViewProps, key: string): string[] {
  const value = props[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toRef(value: unknown): InstanceRef | undefined {
  return isInstanceRef(value) ? { space: value.space, externalId: value.externalId } : undefined;
}

export function readRef(props: ViewProps, key: string): InstanceRef | undefined {
  return toRef(props[key]);
}

export function readRefList(props: ViewProps, key: string): InstanceRef[] {
  const value = props[key];
  if (!Array.isArray(value)) return [];
  return value.map(toRef).filter((ref): ref is InstanceRef => ref !== undefined);
}

export function refKey(ref: InstanceRef): string {
  return `${ref.space}:${ref.externalId}`;
}
