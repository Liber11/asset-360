import { beforeEach, describe, expect, it } from 'vitest';

import { createRecentAssetsStore, type KeyValueStorage, type RecentAsset } from './RecentAssetsStore';

describe('RecentAssetsStore', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(createRecentAssetsStore(storage).list()).toEqual([]);
  });

  it('puts the newest asset first and persists it', () => {
    const store = createRecentAssetsStore(storage);

    store.add(recent('a'));
    const list = store.add(recent('b'));

    expect(list.map((item) => item.ref.externalId)).toEqual(['b', 'a']);
    expect(createRecentAssetsStore(storage).list()).toEqual(list);
  });

  it('moves a re-opened asset to the front without duplicating it', () => {
    const store = createRecentAssetsStore(storage);
    store.add(recent('a'));
    store.add(recent('b'));

    const list = store.add({ ...recent('a'), name: 'Renamed' });

    expect(list).toEqual([{ ...recent('a'), name: 'Renamed' }, recent('b')]);
  });

  it('keeps at most 10 assets, dropping the oldest', () => {
    const store = createRecentAssetsStore(storage);

    for (let i = 0; i < 12; i++) store.add(recent(`a${i}`));

    const list = store.list();
    expect(list).toHaveLength(10);
    expect(list[0].ref.externalId).toBe('a11');
    expect(list[9].ref.externalId).toBe('a2');
  });

  it('ignores corrupted or invalid stored data', () => {
    storage.setItem('asset-360:recent-assets', '{oops');
    expect(createRecentAssetsStore(storage).list()).toEqual([]);

    storage.setItem('asset-360:recent-assets', JSON.stringify([recent('ok'), { name: 'no ref' }, 'bad']));
    expect(createRecentAssetsStore(storage).list()).toEqual([recent('ok')]);

    storage.setItem('asset-360:recent-assets', JSON.stringify({ not: 'a list' }));
    expect(createRecentAssetsStore(storage).list()).toEqual([]);
  });

  it('keeps working when storage throws', () => {
    const store = createRecentAssetsStore(new ThrowingStorage());

    expect(store.list()).toEqual([]);
    expect(store.add(recent('a'))).toEqual([recent('a')]);
  });
});

function recent(externalId: string): RecentAsset {
  return { ref: { space: 'sp', externalId }, name: externalId.toUpperCase() };
}

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class ThrowingStorage implements KeyValueStorage {
  getItem(): string | null {
    throw new Error('blocked');
  }

  setItem(): void {
    throw new Error('blocked');
  }
}
