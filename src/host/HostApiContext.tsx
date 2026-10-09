import type { HostAppAPI } from '@cognite/app-sdk';
import { createContext, useContext } from 'react';

/** Narrow slice of the Fusion host API the app depends on. */
export type HostApi = Pick<HostAppAPI, 'syncInternalState'>;

/** `null` until the host handshake completes (or when running outside Fusion). */
export const HostApiContext = createContext<HostApi | null>(null);

export function useHostApi(): HostApi | null {
  return useContext(HostApiContext);
}
