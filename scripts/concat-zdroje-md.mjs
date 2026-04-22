/**
 * Sloučí všechny .md pod docs/zdroje/ (i v podadresářích) do jednoho .txt
 * → docs/zdroje/_concat_zdroje_md.txt
 *
 * Použití: npm run docs:concat-md
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFilesUnderZdroje } from "./lib/walk-docs-zdroje.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const zdroje = join(root, "docs", "zdroje");

const mdFiles = collectFilesUnderZdroje(
  zdroje,
  (_rel, _abs, name) => name.endsWith(".md") && !name.startsWith("_concat"),
);

const readme = join(zdroje, "README.md");
const norm = (p) => p.replace(/\\/g, "/");
const readmeNorm = norm(readme);
const rest = mdFiles.filter((p) => norm(p) !== readmeNorm);
const ordered = mdFiles.some((p) => norm(p) === readmeNorm) ? [readme, ...rest] : [...mdFiles];

if (ordered.length === 0) {
  console.error("V docs/zdroje/ (včetně podadresářů) nebyl nalezen žádný .md soubor.");
  process.exit(1);
}

const parts = [];
for (const abs of ordered) {
  const rel = relative(zdroje, abs).replace(/\\/g, "/");
  const body = readFileSync(abs, "utf8").trimEnd();
  parts.push(`\n\n${"=".repeat(72)}\n## ${rel}\n${"=".repeat(72)}\n\n${body}`);
}

const outPath = join(zdroje, "_concat_zdroje_md.txt");
writeFileSync(outPath, parts.join("\n").trimStart() + "\n", "utf8");
console.log("Uloženo:", outPath);
console.log("Sloučeno souborů:", ordered.length);
ordered.forEach((p) => console.log("  -", relative(zdroje, p).replace(/\\/g, "/")));
