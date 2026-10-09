import type { NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it } from 'vitest';

import { CDM_VIEWS, readRef, readRefList, readString, readStringList, viewProps } from './cdm';

describe(viewProps.name, () => {
  it('returns the property group of the requested view', () => {
    const node = makeNode({ cdf_cdm: { 'CogniteAsset/v1': { name: 'Pump' } } });

    expect(viewProps(node, CDM_VIEWS.asset)).toEqual({ name: 'Pump' });
  });

  it('returns an empty object when the view has no data', () => {
    expect(viewProps(makeNode(undefined), CDM_VIEWS.asset)).toEqual({});
    expect(viewProps(makeNode({ other: {} }), CDM_VIEWS.asset)).toEqual({});
  });
});

describe(readString.name, () => {
  it('returns string values and undefined otherwise', () => {
    expect(readString({ a: 'x' }, 'a')).toBe('x');
    expect(readString({ a: 1 }, 'a')).toBeUndefined();
    expect(readString({}, 'a')).toBeUndefined();
  });
});

describe(readStringList.name, () => {
  it('keeps only string entries', () => {
    expect(readStringList({ a: ['x', 1, 'y'] }, 'a')).toEqual(['x', 'y']);
  });

  it('returns an empty list for non-arrays', () => {
    expect(readStringList({ a: 'x' }, 'a')).toEqual([]);
  });
});

describe(readRef.name, () => {
  it('returns a direct relation reference', () => {
    expect(readRef({ a: { space: 's', externalId: 'e' } }, 'a')).toEqual({ space: 's', externalId: 'e' });
  });

  it('returns undefined for invalid values', () => {
    expect(readRef({ a: null }, 'a')).toBeUndefined();
    expect(readRef({ a: { space: 's' } }, 'a')).toBeUndefined();
  });

  it('drops extra keys from the reference', () => {
    expect(readRef({ a: { space: 's', externalId: 'e', extra: 1 } }, 'a')).toEqual({ space: 's', externalId: 'e' });
  });
});

describe(readRefList.name, () => {
  it('keeps only valid references', () => {
    expect(readRefList({ a: [{ space: 's', externalId: 'e' }, 'bad'] }, 'a')).toEqual([{ space: 's', externalId: 'e' }]);
  });

  it('returns an empty list for non-arrays', () => {
    expect(readRefList({ a: 'x' }, 'a')).toEqual([]);
  });
});

function makeNode(properties: Record<string, Record<string, Record<string, unknown>>> | undefined): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp',
    externalId: 'ext',
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    properties,
  } as Partial<NodeOrEdge> as NodeOrEdge;
}
