export type NamedZsSnapshot = { id: string; name: string; savedAt: string; snapshot: Record<string, unknown> };

export const NAMED_SNAPSHOTS_LS_KEY = "edu-cz-zs-named-snapshots-v1";
export const MAX_NAMED_SNAPSHOTS = 10;

export function readNamedSnapshotsFromLs(): NamedZsSnapshot[] {
  try {
    const raw = localStorage.getItem(NAMED_SNAPSHOTS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: NamedZsSnapshot[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function writeNamedSnapshotsToLs(items: NamedZsSnapshot[]) {
  try {
    localStorage.setItem(NAMED_SNAPSHOTS_LS_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}
