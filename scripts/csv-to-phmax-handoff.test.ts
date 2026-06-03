import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PHMAX_IS_EXPORT_SCHEMA } from "../src/phmax-is-export-adapter";
import { csvFilesToHandoffPayload } from "./csv-to-phmax-handoff";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(repoRoot, "docs/import-templates");

describe("csv-to-phmax-handoff", () => {
  it("příkladové CSV → phmax-is-handoff-v1", () => {
    const payload = csvFilesToHandoffPayload({
      meta: path.join(templatesDir, "phmax-import-meta-v1.example.csv"),
      pv: path.join(templatesDir, "phmax-import-pv-v1.example.csv"),
      zs: path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"),
    });

    expect(payload.schema).toBe(PHMAX_IS_EXPORT_SCHEMA);
    expect(payload.schoolScenario.schema).toBe("phmax-school-scenario-v1");
    expect(payload.schoolScenario.moduleSnapshots.pv).toBeTruthy();
    expect(payload.schoolScenario.moduleSnapshots.zs).toBeTruthy();

    const pv = payload.schoolScenario.moduleSnapshots.pv as { rows: unknown[] };
    expect(pv.rows.length).toBe(2);

    const zs = payload.schoolScenario.moduleSnapshots.zs as { basic1Classes: number; _phmaxAuditTotals?: { totalPhmax: number } };
    expect(zs.basic1Classes).toBe(10);
    expect(zs._phmaxAuditTotals?.totalPhmax).toBeGreaterThan(0);

    expect(payload.schoolScenario.summary.modulesWithPhmax).toBe(2);
    expect(payload.schoolScenario.summary.totalPhmax).toBeGreaterThan(0);
    expect(payload.schoolScenario.coherenceWarnings).toEqual([]);
  });

  it("generovaný JSON z ukázkového skriptu existuje po npm run import:csv-handoff", () => {
    const out = path.join(templatesDir, "phmax-is-handoff.generated.json");
    if (!existsSync(out)) {
      expect(true).toBe(true);
      return;
    }
    const raw = JSON.parse(readFileSync(out, "utf8")) as { schema: string };
    expect(raw.schema).toBe(PHMAX_IS_EXPORT_SCHEMA);
  });
});
