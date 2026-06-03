/**
 * Vytiskne JS pro DevTools konzoli – zápis handoff JSON do localStorage.
 *
 *   npx --yes tsx scripts/print-phmax-handoff-apply-snippet.ts
 *   npx --yes tsx scripts/print-phmax-handoff-apply-snippet.ts --in ./handoff.json --no-reload
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PhmaxIsHandoffPayload } from "../src/phmax-is-export-adapter";
import { buildHandoffApplyConsoleSnippet } from "../src/phmax-is-handoff-apply";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv: string[]) {
  let input = path.join(repoRoot, "docs/import-templates/phmax-is-handoff.generated.json");
  let reload = true;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if ((a === "--in" || a === "-i") && next) {
      input = path.resolve(next);
      i++;
    } else if (a === "--no-reload") {
      reload = false;
    }
  }
  return { input, reload };
}

function main() {
  const { input, reload } = parseArgs(process.argv);
  const payload = JSON.parse(readFileSync(input, "utf8")) as PhmaxIsHandoffPayload;
  const snippet = buildHandoffApplyConsoleSnippet(payload, { reload });
  process.stdout.write(`${snippet}\n`);
}

main();
