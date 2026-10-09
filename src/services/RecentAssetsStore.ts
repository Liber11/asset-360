import { isInstanceRef, type InstanceRef } from '../state/workspaceState';

export type RecentAsset = { ref: InstanceRef; name: string };

/** Per-device list of recently opened assets (FR-012); deliberately not host-synced. */
export interface RecentAssetsStore {
  list(): RecentAsset[];
  /** Records `asset` as the most recent one and returns the updated list. */
  add(asset: RecentAsset): RecentAsset[];
}

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'asset-360:recent-assets';
const MAX_RECENT = 10;

function isRecentAsset(value: unknown): value is RecentAsset {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    'name' in value &&
    isInstanceRef(value.ref) &&
    typeof value.name === 'string'
  );
}

class LocalRecentAssetsStore implements RecentAssetsStore {
  // In-memory copy so the list still works when storage is blocked (private mode, policies).
  private fallback: RecentAsset[] = [];

  constructor(private readonly storage: KeyValueStorage) {}

  list(): RecentAsset[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw === null) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isRecentAsset).slice(0, MAX_RECENT) : [];
    } catch {
      return this.fallback;
    }
  }

  add(asset: RecentAsset): RecentAsset[] {
    const isSame = (item: RecentAsset) =>
      item.ref.space === asset.ref.space && item.ref.externalId === asset.ref.externalId;
    const next = [asset, ...this.list().filter((item) => !isSame(item))].slice(0, MAX_RECENT);
    this.fallback = next;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: keep the in-memory fallback only.
    }
    return next;
  }
}

export function createRecentAssetsStore(storage: KeyValueStorage): RecentAssetsStore {
  return new LocalRecentAssetsStore(storage);
}
