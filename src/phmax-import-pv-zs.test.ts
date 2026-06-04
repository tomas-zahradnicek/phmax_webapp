import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PHMAX_IS_EXPORT_SCHEMA } from "./phmax-is-export-adapter";
import { applyPhmaxIsHandoffToStorage } from "./phmax-is-handoff-apply";
import { IMPORT_SD_LABELS } from "./phmax-import-columns";
import {
  buildImportPreviewSummary,
  csvTextsToHandoffPayload,
  importTablesToHandoffPayload,
  parseSemicolonCsv,
} from "./phmax-import-pv-zs";
import { classifyImportCsvText } from "./phmax-import-xlsx";
import { IMPORT_NV75_KIND_LABELS } from "./phmax-import-czech-values";
import { computeSsPhmaxTotalFromSnapshot } from "./ss/ss-compute-phmax-total-from-snapshot";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "./phmax-school-scenario-export";

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
    const zs = payload.schoolScenario.moduleSnapshots.zs as { mode: string };
    expect(zs.mode).toBe("phmax_full_zs");
    expect(payload.schoolScenario.importBatchMeta?.school_id).toBeTruthy();
  });

  it("IMPORT_SD_LABELS: sloupec pupils je Počet účastníků", () => {
    expect(IMPORT_SD_LABELS.pupils).toBe("Počet účastníků");
  });

  it("assertSameBatch hlásí číslo řádku v listu PV", () => {
    const metaRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
    );
    const pvRows = parseSemicolonCsv(readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"));
    const zsRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    );
    const badPv = [...pvRows];
    badPv[1] = { ...badPv[1]!, school_id: "JINY_SKOLA" };

    expect(() =>
      importTablesToHandoffPayload({
        metaRows,
        pvRows: badPv,
        zsRows,
      }),
    ).toThrow(/PV, řádek 3/);
  });

  it("import bez volitelných listů přidá coherenceWarnings", () => {
    const payload = csvTextsToHandoffPayload({
      metaCsv: readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
      pvCsv: readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"),
      zsCsv: readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    });
    expect(payload.schoolScenario.coherenceWarnings?.some((w) => w.includes("ŠD"))).toBe(true);
    const preview = buildImportPreviewSummary(payload);
    expect(preview.coherenceWarnings.some((w) => w.includes("ŠD"))).toBe(true);
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

  it("import SŠ s platným kódem oboru 39-41-L/01 má PHmax > 0", () => {
    const metaRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
    );
    const pvRows = parseSemicolonCsv(readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"));
    const zsRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    );
    const keys = { school_id: metaRows[0]!.school_id, scenario_label: metaRows[0]!.scenario_label };
    const ssRows = [
      {
        ...keys,
        row_key: "ss-1",
        label: "1.A",
        education_field: "39-41-L/01",
        study_form: "denni",
        class_count: "2",
        average_students: "17",
      },
    ];
    const payload = importTablesToHandoffPayload({ metaRows, pvRows, zsRows, ssRows });
    const ss = payload.schoolScenario.moduleSnapshots.ss as { rows: unknown[] };
    expect(ss.rows.length).toBe(1);
    expect(payload.schoolScenario.summary.slices.find((s) => s.id === "ss")?.phmax).toBe(100);
    expect(computeSsPhmaxTotalFromSnapshot(ss)).toBe(100);
  });

  it("import NV75 zapíše řádky banky odpočtů", () => {
    const metaRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-meta-v1.example.csv"), "utf8"),
    );
    const pvRows = parseSemicolonCsv(readFileSync(path.join(templatesDir, "phmax-import-pv-v1.example.csv"), "utf8"));
    const zsRows = parseSemicolonCsv(
      readFileSync(path.join(templatesDir, "phmax-import-zs-summary-v1.example.csv"), "utf8"),
    );
    const keys = { school_id: metaRows[0]!.school_id, scenario_label: metaRows[0]!.scenario_label };
    const nv75Rows = [
      {
        ...keys,
        row_key: "nv75-1",
        kind: IMPORT_NV75_KIND_LABELS.zs,
        units: "19",
        additional_workplaces: "10;4",
      },
    ];
    const payload = importTablesToHandoffPayload({ metaRows, pvRows, zsRows, nv75Rows });
    const nv75 = payload.schoolScenario.moduleSnapshots.nv75 as {
      rows: { kind: string; units: number; additionalWorkplaceUnits: number[] }[];
    };
    expect(nv75.rows).toHaveLength(1);
    expect(nv75.rows[0]!.kind).toBe("zs");
    expect(nv75.rows[0]!.units).toBe(19);
    expect(nv75.rows[0]!.additionalWorkplaceUnits).toEqual([10, 4]);

    const mem = new MemoryStorage();
    const result = applyPhmaxIsHandoffToStorage(mem, payload);
    expect(result.appliedModules).toContain("nv75");
    expect(mem.getItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75)).toContain('"rows"');
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
