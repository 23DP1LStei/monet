import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "monet_favorites";
const EVENT_NAME = "monet:favorites:changed";

export function getFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => Number.isInteger(n) && n > 0) : [];
  } catch {
    return [];
  }
}

export function isFavorite(spaceId: number): boolean {
  return getFavorites().includes(Number(spaceId));
}

export function toggleFavorite(spaceId: number): boolean {
  if (typeof window === "undefined") return false;
  const numId = Number(spaceId);
  if (!numId) return false;

  const current = getFavorites();
  const exists = current.includes(numId);
  const updated = exists ? current.filter(id => id !== numId) : [...current, numId];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save favorites to localStorage", e);
  }

  // Broadcast custom event so all open components update immediately
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { favorites: updated, toggledId: numId, added: !exists } }));
  return !exists;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => getFavorites());

  useEffect(() => {
    const handleUpdate = () => {
      setFavorites(getFavorites());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const checkIsFavorite = useCallback((spaceId: number) => {
    return favorites.includes(Number(spaceId));
  }, [favorites]);

  const toggle = useCallback((spaceId: number) => {
    return toggleFavorite(spaceId);
  }, []);

  return {
    favorites,
    count: favorites.length,
    isFavorite: checkIsFavorite,
    toggleFavorite: toggle,
  };
}
