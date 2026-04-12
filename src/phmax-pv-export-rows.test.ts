import { describe, expect, it } from "vitest";
import { exportCsvLocalized } from "./export-utils";
import { buildPhmaxPvExportRows } from "./phmax-pv-export-rows";
import { computePvPhmaxTotal, getPhaMaxPv, getPvDurationBandLabel, representativeHoursForPvBand } from "./phmax-pv-logic";

describe("buildPhmaxPvExportRows (smoke / export)", () => {
  it("obsahuje druh provozu, PHmax celkem a CSV hlavičku", () => {
    const bandIdx = 7;
    const computed = computePvPhmaxTotal({
      provoz: "celodenni",
      classCount: 4,
      durationBandIndex: bandIdx,
      sec16ClassCount: 1,
      languageGroupCount: 0,
    });
    const phaMax = getPhaMaxPv(1, representativeHoursForPvBand("celodenni", bandIdx));

    const rows = buildPhmaxPvExportRows({
      provozLabel: "Celodenní provoz (tabulka 2)",
      provoz: "celodenni",
      classCount: 4,
      durationBandLabel: getPvDurationBandLabel("celodenni", bandIdx),
      sec16Count: 1,
      languageGroups: 0,
      computed,
      phaMax,
    });

    expect(rows[0][0]).toContain("předškolní");
    expect(rows.some(([k, v]) => k.includes("Druh provozu") && String(v).includes("Celodenní"))).toBe(true);
    expect(rows.some(([k, v]) => k.includes("PHmax celkem") && v === 240)).toBe(true);
    expect(rows.some(([k]) => k.includes("PHAmax"))).toBe(true);

    const csv = exportCsvLocalized(rows);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("Položka;Hodnota");
    expect(csv).toContain('"240"');
  });

  it("při neplatných vstupech exportuje řádky s upozorněním", () => {
    const computed = computePvPhmaxTotal({
      provoz: "celodenni",
      classCount: 0,
      durationBandIndex: 0,
      sec16ClassCount: 0,
      languageGroupCount: 0,
    });

    const rows = buildPhmaxPvExportRows({
      provozLabel: "Celodenní provoz (tabulka 2)",
      provoz: "celodenni",
      classCount: 0,
      durationBandLabel: getPvDurationBandLabel("celodenni", 0),
      sec16Count: 0,
      languageGroups: 0,
      computed,
      phaMax: null,
    });

    expect(computed.issues.length).toBeGreaterThan(0);
    expect(rows.some(([k]) => k.startsWith("Upozornění / chyba"))).toBe(true);
    const csv = exportCsvLocalized(rows);
    expect(csv).toContain("Upozornění / chyba");
  });

  it("u zdravotnického zařízení zobrazí pomlčku místo hodin v exportu", () => {
    const computed = computePvPhmaxTotal({
      provoz: "zdravotnicke",
      classCount: 2,
      durationBandIndex: 0,
      sec16ClassCount: 0,
      languageGroupCount: 0,
    });

    const rows = buildPhmaxPvExportRows({
      provozLabel: "MŠ při zdravotnickém zařízení",
      provoz: "zdravotnicke",
      classCount: 2,
      durationBandLabel: "",
      sec16Count: 0,
      languageGroups: 0,
      computed,
      phaMax: null,
    });

    expect(rows.some(([k, v]) => k.includes("Pásmo průměrné doby") && String(v).includes("31 h"))).toBe(true);
  });
});
