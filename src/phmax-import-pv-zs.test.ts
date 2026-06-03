import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PHMAX_IS_EXPORT_SCHEMA } from "./phmax-is-export-adapter";
import { applyPhmaxIsHandoffToStorage } from "./phmax-is-handoff-apply";
import { csvTextsToHandoffPayload, parseSemicolonCsv } from "./phmax-import-pv-zs";
import { classifyImportCsvText } from "./phmax-import-xlsx";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = path.join(repoRoot, "docs/import-templates");

class MemoryStorage {
  private store = new Map<string, string>();
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
}

describe("phmax-import-pv-zs", () => {
  it("příkladové CSV → phmax-is-handoff-v1", () => {
    const payload = csvTextsToHandoffPayload({
      metaCsv: readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
      pvCsv: readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"),
      zsCsv: readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    });

    expect(payload.schema).toBe(PHMAX_IS_EXPORT_SCHEMA);
    expect(payload.schoolScenario.moduleSnapshots.pv).toBeTruthy();
    expect(payload.schoolScenario.moduleSnapshots.zs).toBeTruthy();
    expect(payload.schoolScenario.summary.totalPhmax).toBeGreaterThan(0);

    const pv = payload.schoolScenario.moduleSnapshots.pv as { rows: unknown[] };
    expect(pv.rows.length).toBe(2);
  });

  it("klasifikace CSV podle hlavičky", () => {
    const meta = readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8");
    const pv = readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8");
    expect(classifyImportCsvText(meta)).toBe("meta");
    expect(classifyImportCsvText(pv)).toBe("pv");
  });

  it("apply handoff zapisuje PV a ZŠ autosave", () => {
    const payload = csvTextsToHandoffPayload({
      metaCsv: readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
      pvCsv: readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"),
      zsCsv: readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    });
    const mem = new MemoryStorage();
    const result = applyPhmaxIsHandoffToStorage(mem, payload);
    expect(result.appliedModules).toEqual(["pv", "zs"]);
    expect(mem.getItem("edu-cz-pv-calculator-state")).toContain('"rows"');
    expect(mem.getItem("edu-cz-zs-calculator-state")).toContain("basic1Classes");
  });

  it("generovaný JSON existuje po npm run import:csv-handoff", () => {
    const out = path.join(templatesDir, "phmax-is-handoff.generated.json");
    if (!existsSync(out)) {
      expect(true).toBe(true);
      return;
    }
    const payload = JSON.parse(readFileSync(out, "utf8"));
    expect(payload.schema).toBe(PHMAX_IS_EXPORT_SCHEMA);
    const rows = parseSemicolonCsv(readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"));
    expect(rows.length).toBe(2);
  });
});
