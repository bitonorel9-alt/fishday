import { useCallback, useState } from "preact/hooks";
import { readJson, writeJson } from "../data/storage";

const KEY = "fishday.favorites.v1";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readJson<string[]>(KEY) ?? []);
  const toggle = useCallback((id: string) => {
    setFavorites((list) => {
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      writeJson(KEY, next);
      return next;
    });
  }, []);
  return { favorites, toggle };
}
