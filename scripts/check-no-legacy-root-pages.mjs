import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Soubory, které patří jen do `src/` – duplicita v kořeni repa matoucí a není v buildu. */
const forbiddenRootPages = ["PhmaxSsPage.tsx"];

const found = forbiddenRootPages.filter((name) =>
  fs.existsSync(path.join(repoRoot, name)),
);

if (found.length > 0) {
  console.error("Legacy root page files must not exist (use src/ only):");
  for (const name of found) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

console.log("No legacy root product pages found.");
