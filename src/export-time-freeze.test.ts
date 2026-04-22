import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExportMetaRows } from "./export-metadata";
import { exportFilenameStamped } from "./export-utils";
import {
  createPvProductAuditProtocol,
  createSdProductAuditProtocol,
  createZsProductAuditProtocol,
} from "./phmax-product-audit";

describe("Export time freeze contract", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("freeze času drží stejný timestamp v metadatech pro PV/ŠD/ZŠ/SŠ", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T10:15:30.000Z"));
    const expectedLocal = new Date().toLocaleString("cs-CZ");

    for (const kind of ["pv", "sd", "zs", "ss"] as const) {
      const rows = buildExportMetaRows(kind);
      expect(rows[1][0]).toBe("Export vytvořen (místní čas)");
      expect(rows[1][1]).toBe(expectedLocal);
    }
  });

  it("freeze času drží datum ve filename stamp napříč moduly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T10:15:30.000Z"));

    expect(exportFilenameStamped("phmax-pv", "csv")).toBe("phmax-pv-2026-04-22.csv");
    expect(exportFilenameStamped("phmax-sd", "csv")).toBe("phmax-sd-2026-04-22.csv");
    expect(exportFilenameStamped("phmax-zs", "xlsx")).toBe("phmax-zs-2026-04-22.xlsx");
    expect(exportFilenameStamped("phmax-ss", "json")).toBe("phmax-ss-2026-04-22.json");
  });

  it("freeze času drží createdAtIso v audit exportech PV/ŠD/ZŠ", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T10:15:30.000Z"));
    const expectedIso = "2026-04-22T10:15:30.000Z";

    const pv = createPvProductAuditProtocol([
      {
        label: "A",
        provoz: "celodenni",
        classCount: 1,
        avgHoursPerDay: 10,
        sec16ClassCount: 0,
        languageGroupCount: 0,
      },
    ]);
    expect(pv.meta.createdAtIso).toBe(expectedIso);

    const sd = createSdProductAuditProtocol({
      pupilsFirstGrade: 80,
      manualDepts: true,
      departments: 4,
    });
    expect(sd.meta.createdAtIso).toBe(expectedIso);

    const zs = createZsProductAuditProtocol({
      formSnapshot: { mode: "full", tab: "phmax" },
      totals: { totalPhmax: 628, breakdown: { totalPha: 0, totalPhp: 12 } },
      narrative: "Freeze contract",
    });
    expect(zs.meta.createdAtIso).toBe(expectedIso);
  });
});
