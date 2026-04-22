/**
 * Sloučí všechny .ts pod docs/zdroje/ (i v podadresářích) do jednoho .txt
 * → docs/zdroje/_concat_zdroje_ts.txt
 *
 * Použití: npm run docs:concat-ts
 *
 * Pozn.: Soubory v docs/ nejsou součástí Vite buildu; slouží jako podklad.
 * Pro použití v aplikaci je potřeba zkopírovat / přenést logiku do src/ss/.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFilesUnderZdroje } from "./lib/walk-docs-zdroje.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const zdroje = join(root, "docs", "zdroje");

const tsFiles = collectFilesUnderZdroje(
  zdroje,
  (_rel, _abs, name) => name.endsWith(".ts") && !name.startsWith("_concat"),
);

if (tsFiles.length === 0) {
  console.error("V docs/zdroje/ (včetně podadresářů) nebyl nalezen žádný .ts soubor.");
  process.exit(1);
}

const parts = [];
for (const abs of tsFiles) {
  const rel = relative(zdroje, abs).replace(/\\/g, "/");
  const body = readFileSync(abs, "utf8").trimEnd();
  parts.push(`\n\n${"=".repeat(72)}\n## ${rel}\n${"=".repeat(72)}\n\n${body}`);
}

const outPath = join(zdroje, "_concat_zdroje_ts.txt");
writeFileSync(outPath, parts.join("\n").trimStart() + "\n", "utf8");
console.log("Uloženo:", outPath);
console.log("Sloučeno souborů:", tsFiles.length);
tsFiles.forEach((p) => console.log("  -", relative(zdroje, p).replace(/\\/g, "/")));
