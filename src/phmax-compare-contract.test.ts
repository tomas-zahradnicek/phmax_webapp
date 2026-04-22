import { describe, expect, it } from "vitest";
import { comparePhmaxProductVariants } from "./phmax-product-compare";
import { createPvProductAuditProtocol, createSdProductAuditProtocol } from "./phmax-product-audit";

describe("Compare contract", () => {
  it("pro prázdný vstup vrátí stabilní fallback recommendation", () => {
    const out = comparePhmaxProductVariants([]);
    expect(out.variants).toEqual([]);
    expect(out.metrics).toEqual([]);
    expect(out.comparison.totalPrimary).toEqual([]);
    expect(out.comparison.totalSecondary).toEqual([]);
    expect(out.differences).toEqual([]);
    expect(out.recommendation).toBe("Nebyla předána žádná varianta.");
  });

  it("vrací stabilní strukturu výsledku", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: b },
    ]);

    expect(out.variants).toHaveLength(2);
    expect(out.metrics).toHaveLength(2);
    expect(out.comparison.totalPrimary).toHaveLength(2);
    expect(out.comparison.totalSecondary).toHaveLength(2);
    expect(typeof out.recommendation).toBe("string");
  });

  it("pro identické vstupy nevyrábí falešné rozdíly", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: b },
    ]);
    expect(out.differences).toEqual([]);
  });

  it("hlásí rozdíl totalPrimary i validačního stavu", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const bInvalid = {
      ...b,
      validation: { ...b.validation, ok: false },
    };

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: bInvalid },
    ]);

    expect(out.differences.some((line) => line.includes("PHmax (primární metrika)"))).toBe(true);
    expect(out.differences.some((line) => line.includes("Validace"))).toBe(true);
  });

  it("u mixu produktů vrací orientační varování", () => {
    const pv = createPvProductAuditProtocol([
      { label: "PV", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const sd = createSdProductAuditProtocol({
      pupilsFirstGrade: 80,
      manualDepts: true,
      departments: 4,
    });

    const out = comparePhmaxProductVariants([
      { id: "pv", label: "PV", protocol: pv },
      { id: "sd", label: "ŠD", protocol: sd },
    ]);

    expect(out.differences.some((line) => line.includes("Produkt se liší"))).toBe(true);
  });

  it("recommendation pro jednu variantu obsahuje název varianty", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([{ id: "a", label: "Varianta A", protocol: a }]);
    expect(out.recommendation).toContain("Jediná varianta");
    expect(out.recommendation).toContain("Varianta A");
  });

  it("recommendation při shodném PHmax vrací text o stejné nejvyšší metrice", () => {
    const a = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const b = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([
      { id: "a", label: "Varianta A", protocol: a },
      { id: "b", label: "Varianta B", protocol: b },
    ]);
    expect(out.recommendation).toContain("stejnou nejvyšší primární metriku");
  });

  it("recommendation preferuje validačně OK variantu před nevalidní", () => {
    const betterButInvalidBase = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const betterButInvalid = {
      ...betterButInvalidBase,
      validation: { ...betterButInvalidBase.validation, ok: false },
    };
    const validLower = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const validLowest = createPvProductAuditProtocol([
      { label: "C", provoz: "polodenni", classCount: 1, avgHoursPerDay: 4, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);

    const out = comparePhmaxProductVariants([
      { id: "a", label: "Nevalidní vyšší", protocol: betterButInvalid },
      { id: "b", label: "Validní nižší", protocol: validLower },
      { id: "c", label: "Validní nejnižší", protocol: validLowest },
    ]);
    expect(out.recommendation).toContain("Validní nižší");
    expect(out.recommendation).not.toContain("Nevalidní vyšší");
  });

  it("differences pro PHmax drží formát +/− a dvě desetinná místa (cs-CZ)", () => {
    const lower = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const higher = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([
      { id: "a", label: "Nižší", protocol: lower },
      { id: "b", label: "Vyšší", protocol: higher },
    ]);
    const phLine = out.differences.find((line) => line.startsWith("PHmax (primární metrika):"));
    expect(phLine).toBeDefined();
    expect(phLine).toContain("+57,50 h");
    expect(phLine).toContain("120,00");
    expect(phLine).toContain("62,50");
  });

  it("differences pro validaci drží text OK/chyby", () => {
    const ok = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const errBase = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const err = { ...errBase, validation: { ...errBase.validation, ok: false } };
    const out = comparePhmaxProductVariants([
      { id: "a", label: "A", protocol: ok },
      { id: "b", label: "B", protocol: err },
    ]);
    const validationLine = out.differences.find((line) => line.startsWith("Validace:"));
    expect(validationLine).toBe('Validace: „A“ OK, „B“ chyby.');
  });

  it("differences pro secondary metriku hlásí hodnoty variant", () => {
    const left = createSdProductAuditProtocol({
      pupilsFirstGrade: 40,
      manualDepts: true,
      departments: 2,
    });
    const right = createSdProductAuditProtocol({
      pupilsFirstGrade: 60,
      manualDepts: true,
      departments: 3,
    });
    const out = comparePhmaxProductVariants([
      { id: "left", label: "Levá", protocol: left },
      { id: "right", label: "Pravá", protocol: right },
    ]);
    const secondaryLine = out.differences.find((line) => line.startsWith("Sekundární metrika"));
    expect(secondaryLine).toContain("„Pravá“ 3 vs „Levá“ 2");
  });

  it("comparison zachová pořadí variant podle vstupu", () => {
    const first = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const second = createPvProductAuditProtocol([
      { label: "B", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([
      { id: "v2", label: "Druhá", protocol: second },
      { id: "v1", label: "První", protocol: first },
    ]);

    expect(out.comparison.totalPrimary.map((x) => x.variantId)).toEqual(["v2", "v1"]);
    expect(out.comparison.totalSecondary.map((x) => x.variantId)).toEqual(["v2", "v1"]);
  });

  it("comparison přenese variantId i variantLabel beze změny", () => {
    const p = createPvProductAuditProtocol([
      { label: "A", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([{ id: "custom-id", label: "Moje varianta", protocol: p }]);

    expect(out.comparison.totalPrimary[0]).toMatchObject({
      variantId: "custom-id",
      variantLabel: "Moje varianta",
    });
    expect(out.comparison.totalSecondary[0]).toMatchObject({
      variantId: "custom-id",
      variantLabel: "Moje varianta",
    });
  });

  it("comparison vrací null totalPrimary/totalSecondary pro neúspěšný výpočet", () => {
    const invalid = createPvProductAuditProtocol([
      { label: "Bad", provoz: "celodenni", classCount: 0, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([{ id: "bad", label: "Neplatná", protocol: invalid }]);

    expect(out.comparison.totalPrimary[0].value).toBeNull();
    expect(out.comparison.totalSecondary[0].value).toBeNull();
  });

  it("když žádná varianta nemá totalPrimary, recommendation vrátí fallback text", () => {
    const invalidA = createPvProductAuditProtocol([
      { label: "Bad A", provoz: "celodenni", classCount: 0, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const invalidB = createPvProductAuditProtocol([
      { label: "Bad B", provoz: "celodenni", classCount: 0, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([
      { id: "a", label: "Neplatná A", protocol: invalidA },
      { id: "b", label: "Neplatná B", protocol: invalidB },
    ]);
    expect(out.recommendation).toBe(
      "U žádné varianty není k dispozici primární metrika (PHmax) — zkontrolujte vstupy.",
    );
  });

  it("u jedné nevalidní varianty vrátí recommendation bez primární metriky", () => {
    const invalid = createPvProductAuditProtocol([
      { label: "Bad", provoz: "celodenni", classCount: 0, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([{ id: "single-bad", label: "Single bad", protocol: invalid }]);
    expect(out.recommendation).toBe("Jediná varianta „Single bad“: primární metrika není k dispozici.");
  });

  it("u jedné varianty zůstává differences prázdné i při nevalidním stavu", () => {
    const invalid = createPvProductAuditProtocol([
      { label: "Bad", provoz: "celodenni", classCount: 0, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([{ id: "bad", label: "Neplatná", protocol: invalid }]);
    expect(out.differences).toEqual([]);
  });

  it("PHmax difference umí zápornou deltu ve stabilním formátu", () => {
    const higher = createPvProductAuditProtocol([
      { label: "High", provoz: "celodenni", classCount: 2, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const lower = createPvProductAuditProtocol([
      { label: "Low", provoz: "celodenni", classCount: 1, avgHoursPerDay: 10, sec16ClassCount: 0, languageGroupCount: 0 },
    ]);
    const out = comparePhmaxProductVariants([
      { id: "h", label: "Vyšší", protocol: higher },
      { id: "l", label: "Nižší", protocol: lower },
    ]);
    const phLine = out.differences.find((line) => line.startsWith("PHmax (primární metrika):"));
    expect(phLine).toContain("-57,50 h");
    expect(phLine).toContain("62,50 vs 120,00");
  });
});
