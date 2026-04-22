import type { PersistedPlaybackState } from '@/src/app/model/game-store';

const STORAGE_PREFIX = 'boa:battle-playback:';

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function loadPersistedPlaybackState(
  key: string,
): PersistedPlaybackState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(getStorageKey(key));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedPlaybackState;
  } catch {
    window.localStorage.removeItem(getStorageKey(key));
    return null;
  }
}

export function savePersistedPlaybackState(
  key: string,
  state: PersistedPlaybackState,
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getStorageKey(key), JSON.stringify(state));
}

export function clearPersistedPlaybackState(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getStorageKey(key));
}
