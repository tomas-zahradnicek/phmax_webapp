export type DisplayDensity = "comfortable" | "compact";

const STORAGE_KEY = "phmax-display-density";

export function readDisplayDensity(): DisplayDensity {
  if (typeof window === "undefined") return "comfortable";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function writeDisplayDensity(density: DisplayDensity): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, density);
  } catch {
    /* ignore */
  }
}
