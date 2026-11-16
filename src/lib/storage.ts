"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Mini-store persistant (localStorage) compatible SSR.
 * Toutes les préférences visiteur (favoris, recherches, QR sauvegardés…) passent par ici.
 */
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();
const PREFIX = "kanifo:";

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(PREFIX + key); } catch { return fallback; }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value = fallback;
  if (raw !== null) {
    try { value = JSON.parse(raw) as T; } catch { value = fallback; }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStore<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    return false; // quota dépassé ou stockage indisponible
  }
  listeners.get(key)?.forEach((l) => l());
  return true;
}

function subscribe(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === PREFIX + key) cb(); };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.get(key)?.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => boolean] {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (v: T | ((prev: T) => T)) =>
      writeStore(key, typeof v === "function" ? (v as (p: T) => T)(read(key, fallback)) : v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}

/** Vrai uniquement après hydratation, pour éviter les écarts serveur/client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

const EMPTY: string[] = [];
export function useFavorites() {
  const [favorites, setFavorites] = useStored<string[]>("favorites", EMPTY);
  const toggle = useCallback((slug: string) => {
    let added = false;
    setFavorites((prev) => {
      added = !prev.includes(slug);
      return added ? [slug, ...prev] : prev.filter((s) => s !== slug);
    });
    return added;
  }, [setFavorites]);
  return { favorites, toggle, isFavorite: (slug: string) => favorites.includes(slug) };
}

export function useRecentSearches() {
  const [recent, setRecent] = useStored<string[]>("recent-tools", EMPTY);
  const push = useCallback((slug: string) => {
    setRecent((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, 6));
  }, [setRecent]);
  const clear = useCallback(() => { setRecent([]); }, [setRecent]);
  return { recent, push, clear };
}
