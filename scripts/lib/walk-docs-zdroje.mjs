import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Složky, které při procházení přeskočit. */
const SKIP_DIR_NAMES = new Set(["node_modules", ".git"]);

/**
 * Rekurzivně projde `docs/zdroje` a vrátí absolutní cesty k souborům odpovídajícím `filterFn`.
 * @param {string} zdrojeRoot absolutní cesta k docs/zdroje
 * @param {(relPath: string, absPath: string, name: string) => boolean} filterFn
 */
export function collectFilesUnderZdroje(zdrojeRoot, filterFn) {
  const out = [];
  if (!existsSync(zdrojeRoot)) return out;

  function walk(absDir, relDir) {
    let entries;
    try {
      entries = readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const name = ent.name;
      if (name.startsWith(".")) continue;
      const abs = join(absDir, name);
      const rel = relDir ? join(relDir, name) : name;
      if (ent.isDirectory()) {
        if (SKIP_DIR_NAMES.has(name)) continue;
        walk(abs, rel);
      } else if (ent.isFile() && filterFn(rel, abs, name)) {
        out.push(abs);
      }
    }
  }

  walk(zdrojeRoot, "");
  return out.sort((a, b) => a.localeCompare(b, "cs"));
}

export function findPreferredDocx(zdrojeRoot) {
  const all = collectFilesUnderZdroje(
    zdrojeRoot,
    (_rel, _abs, name) => name.endsWith(".docx") && !name.startsWith("~$"),
  );
  if (all.length === 0) return null;
  const basePreferred = all.find((p) => /ss|SS|střed|stred|Střed|Stred|metodika/i.test(p));
  return basePreferred ?? all[0];
}
