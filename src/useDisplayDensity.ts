import { useCallback, useState } from "react";
import { readDisplayDensity, writeDisplayDensity, type DisplayDensity } from "./display-density";

export function useDisplayDensity(): readonly [DisplayDensity, (density: DisplayDensity) => void] {
  const [density, setDensity] = useState<DisplayDensity>(() => readDisplayDensity());

  const setDisplayDensity = useCallback((next: DisplayDensity) => {
    setDensity(next);
    writeDisplayDensity(next);
  }, []);

  return [density, setDisplayDensity] as const;
}
