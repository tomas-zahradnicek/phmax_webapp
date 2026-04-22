import { describe, expect, it, vi, afterEach } from "vitest";
import { APP_AUTHOR_EXPORT_ROWS } from "./calculator-ui-constants";
import { buildExportMetaRows, EXPORT_CSV_SEPARATOR_ROW } from "./export-metadata";
import { exportCsvLocalized, exportFilenameStamped } from "./export-utils";

describe("Export metadata contract", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("buildExportMetaRows vrací stabilní 3řádkový blok pro všechny produkty", () => {
    for (const kind of ["pv", "sd", "zs", "ss"] as const) {
      const rows = buildExportMetaRows(kind);
      expect(rows).toHaveLength(3);
      expect(rows[0][0]).toBe("Verze aplikace");
      expect(rows[1][0]).toBe("Export vytvořen (místní čas)");
      expect(rows[2][0]).toBe("Metodický rámec (orientační)");
      expect(String(rows[2][1]).length).toBeGreaterThan(20);
    }
  });

  it("CSV blok metadata + separator + author rows drží hlavičku a pořadí", () => {
    const rows = [
      ...buildExportMetaRows("zs"),
      EXPORT_CSV_SEPARATOR_ROW,
      ["Výsledek PHmax", 628] as const,
      ...APP_AUTHOR_EXPORT_ROWS,
    ] as const;
    const csv = exportCsvLocalized(rows);

    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("Položka;Hodnota");
    expect(csv).toContain('"Verze aplikace"');
    expect(csv).toContain('"Výsledek PHmax";"628"');
    expect(csv).toContain('"Vytvořil:"');
  });

  it("exportFilenameStamped drží stabilní kontrakt názvu souboru", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T10:00:00.000Z"));

    expect(exportFilenameStamped("phmax-zs", "csv")).toBe("phmax-zs-2026-04-22.csv");
    expect(exportFilenameStamped("phmax-ss", "xlsx")).toBe("phmax-ss-2026-04-22.xlsx");
    expect(exportFilenameStamped("phmax-audit", "json")).toBe("phmax-audit-2026-04-22.json");
  });

  it("exportFilenameStamped drží nulové doplnění měsíce a dne", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T08:00:00.000Z"));

    expect(exportFilenameStamped("contract", "csv")).toBe("contract-2026-01-02.csv");
  });

  it("CSV export správně escapuje uvozovky a zachová český oddělovač", () => {
    const csv = exportCsvLocalized([["Poznámka", 'Řádek "A"']]);
    expect(csv).toContain('"Poznámka";"Řádek ""A"""');
    expect(csv).toContain("Položka;Hodnota");
  });

  it("metodický rámec pro všechny produkty obsahuje orientační disclaimer", () => {
    for (const kind of ["pv", "sd", "zs", "ss"] as const) {
      const rows = buildExportMetaRows(kind);
      expect(String(rows[2][1]).includes("orientační výpočet")).toBe(true);
    }
  });
});
