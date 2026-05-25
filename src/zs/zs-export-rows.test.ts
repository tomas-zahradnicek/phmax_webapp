import { describe, expect, it } from "vitest";
import { exportCsvLocalized } from "../export-utils";
import {
  buildZsExtendedExportMetaRows,
  ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER,
  ZS_EXTENDED_EXPORT_TITLE,
} from "./zs-export-rows";

describe("zs-export-rows (acceptance Z5)", () => {
  it("rozšířený export má metadata a orientační rámec", () => {
    const rows = buildZsExtendedExportMetaRows({
      appVersion: "0.2.4-test",
      methodikaLabel: "Metodika PHmax v5",
      modeLabel: "ZŠ – plný rozsah",
      tabLabel: "PHmax",
      exportLabel: "Testovací škola",
      wizardChoice: "",
      dataMode: "own",
      selectedExample: "",
      exportIso: "2026-05-21T10:00:00.000Z",
      exportLocal: "21. 5. 2026 12:00:00",
    });
    expect(rows[0][0]).toBe(ZS_EXTENDED_EXPORT_TITLE);
    expect(rows.some(([k]) => k === "Verze aplikace")).toBe(true);
    expect(rows.some(([k, v]) => k === "Metodický podklad (orientačně)" && String(v).includes("Metodika"))).toBe(
      true,
    );
    expect(rows.some(([k]) => k === "Aktivní záložka při exportu")).toBe(true);
    const csv = exportCsvLocalized(rows);
    expect(csv).toContain("Položka;Hodnota");
    expect(csv).toContain("Testovací škola");
  });

  it("UI disclaimer zůstává orientační", () => {
    expect(ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER).toMatch(/orientačnímu výpočtu/i);
    expect(ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER).toMatch(/oficiální výstup/i);
  });
});
