/**
 * Transformace CSV šablony PV+ZŠ → JSON phmax-is-handoff-v1 (ukázka pro IT).
 *
 *   tsx scripts/csv-to-phmax-handoff.ts
 *   tsx scripts/csv-to-phmax-handoff.ts --out ./handoff.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHMAX_IS_EXPORT_SCHEMA } from "../src/phmax-is-export-adapter";
import { csvTextsToHandoffPayload } from "../src/phmax-import-pv-zs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv: string[]) {
  const opts = {
    meta: path.join(repoRoot, "docs/import-templates/phmax-import-meta-v1.example.csv"),
    pv: path.join(repoRoot, "docs/import-templates/phmax-import-pv-v1.example.csv"),
    zs: path.join(repoRoot, "docs/import-templates/phmax-import-zs-summary-v1.example.csv"),
    out: path.join(repoRoot, "docs/import-templates/phmax-is-handoff.generated.json"),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--meta" && next) {
      opts.meta = path.resolve(next);
      i++;
    } else if (a === "--pv" && next) {
      opts.pv = path.resolve(next);
      i++;
    } else if (a === "--zs" && next) {
      opts.zs = path.resolve(next);
      i++;
    } else if (a === "--out" && next) {
      opts.out = path.resolve(next);
      i++;
    }
  }
  return opts;
}

function readAppVersion(): string {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as { version?: string };
  return typeof pkg.version === "string" ? pkg.version : "0.0.0";
}

export function csvFilesToHandoffPayload(paths: { meta: string; pv: string; zs: string }) {
  return csvTextsToHandoffPayload({
    metaCsv: readFileSync(paths.meta, "utf8"),
    pvCsv: readFileSync(paths.pv, "utf8"),
    zsCsv: readFileSync(paths.zs, "utf8"),
    appVersion: readAppVersion(),
  });
}

function main() {
  const opts = parseArgs(process.argv);
  const payload = csvFilesToHandoffPayload(opts);
  writeFileSync(opts.out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Handoff JSON: ${opts.out}`);
  console.log(`  schema: ${PHMAX_IS_EXPORT_SCHEMA}`);
  console.log(`  school: ${payload.schoolScenario.scenarioLabel}`);
  console.log(
    `  cross-PHmax: ${payload.schoolScenario.summary.totalPhmax ?? "–"} (PV ${payload.schoolScenario.summary.slices.find((s) => s.id === "pv")?.phmax ?? "–"}, ZŠ ${payload.schoolScenario.summary.slices.find((s) => s.id === "zs")?.phmax ?? "–"})`,
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
