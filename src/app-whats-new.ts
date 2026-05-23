export const PHMAX_WHATS_NEW_SEEN_LS_KEY = "phmax-app-whats-new-seen-version";

export function readWhatsNewSeenVersion(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(PHMAX_WHATS_NEW_SEEN_LS_KEY);
  } catch {
    return null;
  }
}

export function markWhatsNewSeen(version: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PHMAX_WHATS_NEW_SEEN_LS_KEY, version);
  } catch {
    /* ignore */
  }
}
