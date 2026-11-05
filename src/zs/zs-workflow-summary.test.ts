import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CalculatorMode } from "../config/calculator-config";
import { computeZsPha1r, EMPTY_PHA1R_SCHOOL_FLAGS } from "./zs-pha1r";
import { computeZsPhmaxTotalFromFields, zsPhmaxFieldsFromFormState } from "./zs-compute-phmax-total-from-snapshot";
import { loadZsHeroExample } from "./zs-hero-example-load";
import { applyZsResetNv75, applyZsResetPha, applyZsResetPhmax, applyZsResetPhp } from "./zs-form-reset";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";
import { presentZsHeaderResults, type ZsHeaderFacts, type ZsHeaderTab } from "./zs-header-results";
import { ZS_DISPLAY_MODE_LABELS } from "./zs-display-mode";
import { ZsWorkflowDockPanel, type ZsWorkflowDockPanelProps } from "./ZsWorkflowDockPanel";
import { readMobileSummaryDismissed, writeMobileSummaryDismissed } from "../mobile-scroll-results-layout";

const repoRoot = resolve(__dirname, "../..");

function readSource(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), "utf8");
}

const emptyCounts = {
  basic1Classes: 0,
  basic1Pupils: 0,
  basic2Classes: 0,
  basic2Pupils: 0,
  incl1Classes: 0,
  incl2Classes: 0,
  psychRowCount: 0,
  healthRowCount: 0,
  minority1Classes: 0,
  gymRowCount: 0,
  mixedRowCount: 0,
  special1Classes: 0,
  special2Classes: 0,
  specialIIClasses: 0,
  prepClasses: 0,
  prepSpecialClasses: 0,
  phaRowCount: 0,
  phpYear1: 0,
  phpYear2: 0,
  phpYear3: 0,
  phpMethodMode: "three_year_avg",
  phpExcludedSchool: false,
  pha1rClassCount: 0,
  pha1rInvalid: false,
  pha1rSchoolExcluded: false,
} satisfies Omit<ZsHeaderFacts, "tab" | "totalPhmax" | "totalPha" | "totalPhp" | "totalPha1r">;

function facts(overrides: Partial<ZsHeaderFacts> & Pick<ZsHeaderFacts, "tab">): ZsHeaderFacts {
  return {
    totalPhmax: 0,
    totalPha: 0,
    totalPhp: 0,
    totalPha1r: 0,
    ...emptyCounts,
    ...overrides,
  };
}

function loadExample(example: "priloha_uplna_zs_sec16"): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  const setters = new Proxy({} as ZsFormSnapshotSetters, {
    get(_target, prop) {
      if (typeof prop !== "string" || !prop.startsWith("set")) return undefined;
      return (value: unknown) => {
        const key = prop.slice(3, 4).toLowerCase() + prop.slice(4);
        state[key] = value;
      };
    },
  });
  loadZsHeroExample(example, {
    setters,
    createEmptyGymRow: (id) => ({ id, kind: "gym8", classes: 0, pupils: 0 }),
    createEmptyMixedRow: (id) => ({ id, stage: "first", majority: "zs", classes: 0, pupils: 0 }),
    createEmptyPhaRow: (id) => ({ id, kind: "zs1", classes: 0, pupils: 0 }),
    applyResetPhmax: () => applyZsResetPhmax(setters),
    applyResetPha: () => applyZsResetPha(setters),
    applyResetPhp: () => applyZsResetPhp(setters),
    resetNv75: () => applyZsResetNv75(setters),
  });
  return state;
}

function resultAnchor(html: string): string {
  const start = html.indexOf('aria-label="Hlavní výsledek výpočtu"');
  expect(start).toBeGreaterThanOrEqual(0);
  const end = html.indexOf("</aside>", start);
  return html.slice(start, end);
}

function primaryValue(anchor: string): string {
  const match = anchor.match(/result-anchor-card__primary-value">([^<]*)</);
  expect(match).not.toBeNull();
  return match?.[1] ?? "";
}

function statMap(anchor: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const match of anchor.matchAll(/<dt>([^<]+)<\/dt><dd(?: title="[^"]*")?>([^<]*)<\/dd>/g)) {
    map[match[1] ?? ""] = match[2] ?? "";
  }
  return map;
}

function renderDock(
  input: ZsHeaderFacts,
  extras: Partial<ZsWorkflowDockPanelProps> = {},
): string {
  const presented = presentZsHeaderResults(input);
  const primaryLabel =
    input.tab === "phmax" ? "PHmax celkem" : input.tab === "pha" ? "PHAmax celkem" : "PHPmax celkem";
  const rawPrimary = input.tab === "phmax" ? input.totalPhmax : input.tab === "pha" ? input.totalPha : input.totalPhp;
  return renderToStaticMarkup(
    createElement(ZsWorkflowDockPanel, {
      tab: input.tab,
      setTab: () => {},
      mode: "phmax_full_zs",
      incompleteSections: 0,
      zsTabPrimaryLabel: primaryLabel,
      zsTabPrimaryValue: rawPrimary,
      totalPhmax: input.totalPhmax,
      totalPha: input.totalPha,
      totalPhp: input.totalPhp,
      totalPha1r: input.totalPha1r,
      zsVerdictTone: "ok",
      zsVerdictLabel: "Vstupy jsou kompletní",
      zsVerdictDetail: "Souhrn PHmax/PHAmax/PHPmax je připravený pro export, uložení varianty nebo porovnání scénářů.",
      zsDockIssueSummaries: [],
      zsBasicWizardActive: false,
      zsWorkflowSteps: [],
      viewMode: "basic",
      firstIssueSection: "",
      goToSection: () => {},
      saveSnapshotManually: () => {},
      handleExportCsv: () => {},
      handleCompareZsWithNamedSnapshot: () => {},
      presentedResults: {
        primary: presented.primaryText,
        phmax: presented.text.phmax,
        pha: presented.text.pha,
        php: presented.text.php,
        pha1r: presented.text.pha1r,
      },
      ...extras,
    }),
  );
}

const activeStatLabel: Record<ZsHeaderTab, string> = {
  phmax: "PHmax",
  pha: "PHAmax",
  php: "PHPmax",
};

describe("ZŠ pravý souhrn workflow", () => {
  it("A. aktivní výsledek je v kartě souhrnu jednou", () => {
    const html = renderDock(
      facts({
        tab: "phmax",
        totalPhmax: 934,
        totalPha: 12,
        totalPhp: 7,
        totalPha1r: 20,
        basic1Classes: 10,
        basic1Pupils: 250,
        phaRowCount: 1,
        phpYear1: 400,
        phpYear2: 400,
        phpYear3: 400,
        pha1rClassCount: 1,
      }),
    );
    const anchor = resultAnchor(html);
    expect(primaryValue(anchor)).toBe("934 h");
    expect(anchor.split("934 h").length - 1).toBe(1);
    expect(statMap(anchor)).not.toHaveProperty("PHmax");
    expect(html).toContain("workflow-dock--zs-summary");
    expect(html).toContain("workflow-dock__mobile-fold-value");
    expect(readSource("src/styles.css")).toContain(
      ".workflow-dock--zs-summary .workflow-dock__mobile-fold-body .result-anchor-card__primary-value",
    );
  });

  it("B. ostatní nezávislé metriky zůstávají v souhrnu", () => {
    const html = renderDock(
      facts({
        tab: "pha",
        totalPhmax: 54,
        totalPha: 54,
        totalPhp: 8,
        totalPha1r: 20,
        basic1Classes: 2,
        basic1Pupils: 40,
        phaRowCount: 1,
        phpYear1: 400,
        phpYear2: 400,
        phpYear3: 400,
        pha1rClassCount: 1,
      }),
    );
    const anchor = resultAnchor(html);
    expect(primaryValue(anchor)).toBe("54 h");
    expect(anchor).toContain("PHAmax celkem");
    const stats = statMap(anchor);
    expect(stats).not.toHaveProperty(activeStatLabel.pha);
    expect(stats.PHmax).toBe("54 h");
    expect(stats.PHA1Rmax).toBe("20 h");
    expect(stats.PHPmax).toBe("8 h");
    expect(stats).toHaveProperty("Režim");
  });

  it("C. prázdné vstupy ukazují Nezadáno", () => {
    const html = renderDock(facts({ tab: "phmax" }));
    const anchor = resultAnchor(html);
    expect(primaryValue(anchor)).toBe("Nezadáno");
    expect(statMap(anchor).PHAmax).toBe("Nezadáno");
    expect(statMap(anchor).PHA1Rmax).toBe("Nezadáno");
    expect(statMap(anchor).PHPmax).toBe("Nezadáno");
    expect(anchor).not.toContain(">0<");
    expect(anchor).not.toContain("0 h");
  });

  it("D. platná nula zůstane 0 h", () => {
    const html = renderDock(
      facts({
        tab: "php",
        phpExcludedSchool: true,
        totalPhp: 0,
        basic1Classes: 1,
        basic1Pupils: 20,
        totalPhmax: 10,
      }),
    );
    const anchor = resultAnchor(html);
    expect(primaryValue(anchor)).toBe("0 h");
    expect(statMap(anchor)).not.toHaveProperty("PHPmax");
    expect(statMap(anchor).PHmax).toBe("10 h");
    expect(anchor).not.toContain("Nezadáno</p>");
  });

  it("E. neplatný vstup se neukáže jako spočtená hodnota", () => {
    const html = renderDock(
      facts({
        tab: "phmax",
        basic1Classes: 2,
        basic1Pupils: 0,
        totalPhmax: 48,
        totalPha1r: 20,
        pha1rClassCount: 1,
      }),
    );
    const anchor = resultAnchor(html);
    expect(primaryValue(anchor)).toBe("Nelze spočítat");
    expect(anchor).not.toContain("48 h");
    expect(statMap(anchor).PHA1Rmax).toBe("20 h");
    expect(anchor).not.toContain("Nevztahuje se");
  });

  it("F. oficiální PHmax 934 h se v souhrnu nemění", () => {
    const state = loadExample("priloha_uplna_zs_sec16");
    const total = computeZsPhmaxTotalFromFields(
      zsPhmaxFieldsFromFormState(state as Parameters<typeof zsPhmaxFieldsFromFormState>[0]),
    );
    expect(total).toBe(934);
    const html = renderDock(
      facts({
        tab: "phmax",
        totalPhmax: total,
        basic1Classes: 10,
        basic1Pupils: 250,
        basic2Classes: 8,
        basic2Pupils: 225,
        incl1Classes: 5,
        incl2Classes: 4,
      }),
      { mode: "phmax_full_zs_sec16" satisfies CalculatorMode },
    );
    expect(primaryValue(resultAnchor(html))).toBe("934 h");
  });

  it("G. PHA1Rmax se nepřičítá k PHmax", () => {
    const state = loadExample("priloha_uplna_zs_sec16");
    const totalPhmax = computeZsPhmaxTotalFromFields(
      zsPhmaxFieldsFromFormState(state as Parameters<typeof zsPhmaxFieldsFromFormState>[0]),
    );
    const pha1r = computeZsPha1r({
      classes: [
        {
          id: 1,
          grade1Pupils: 20,
          grade1Par38: 0,
          grade1Par41: 0,
          establishedSec16_9: false,
        },
      ],
      flags: EMPTY_PHA1R_SCHOOL_FLAGS,
    });
    expect(pha1r.totalPha1r).toBe(20);
    expect(totalPhmax).toBe(934);
    expect(totalPhmax + pha1r.totalPha1r).toBe(954);
    const html = renderDock(
      facts({
        tab: "phmax",
        totalPhmax,
        totalPha1r: pha1r.totalPha1r,
        basic1Classes: 10,
        basic1Pupils: 250,
        basic2Classes: 8,
        basic2Pupils: 225,
        incl1Classes: 5,
        incl2Classes: 4,
        pha1rClassCount: 1,
      }),
    );
    const anchor = resultAnchor(html);
    expect(primaryValue(anchor)).toBe("934 h");
    expect(statMap(anchor).PHA1Rmax).toBe("20 h");
    expect(anchor).not.toContain("954");
  });

  it("H. Průvodce a Všechna pole mají stejný stav výsledku", () => {
    expect(ZS_DISPLAY_MODE_LABELS.basic).toBe("Průvodce");
    expect(ZS_DISPLAY_MODE_LABELS.expert).toBe("Všechna pole");
    const input = facts({
      tab: "phmax",
      totalPhmax: 934,
      totalPha1r: 20,
      basic1Classes: 10,
      basic1Pupils: 250,
      pha1rClassCount: 1,
    });
    const basic = resultAnchor(renderDock(input, { viewMode: "basic" }));
    const expert = resultAnchor(renderDock(input, { viewMode: "expert" }));
    expect(primaryValue(expert)).toBe(primaryValue(basic));
    expect(statMap(expert)).toEqual(statMap(basic));
    expect(primaryValue(basic)).toBe("934 h");
  });

  it("I. přechod k validační chybě zůstává v souhrnu", () => {
    const visited: string[] = [];
    const html = renderDock(facts({ tab: "phmax", basic1Classes: 2, basic1Pupils: 0, totalPhmax: 48 }), {
      zsVerdictTone: "warning",
      zsVerdictLabel: "Na hraně: zadání ještě není kompletní",
      zsVerdictDetail: "Doplňte poslední nevyplněnou část a znovu zkontrolujte souhrn.",
      incompleteSections: 1,
      firstIssueSection: "basic_first",
      goToSection: (section) => visited.push(section),
    });
    expect(html).toContain("Přejít k chybě");
    expect(html).toContain("Uložit scénář");
    expect(html).toContain("Export CSV");
    expect(resultAnchor(html)).not.toContain("Doplňte poslední nevyplněnou část");
    expect(html).toContain("zbývá doplnit údaje v 1 části");
    const withWarning = renderDock(facts({ tab: "phmax", basic1Classes: 1, basic1Pupils: 20, totalPhmax: 10 }), {
      zsDockIssueSummaries: ["Zkontrolujte výjimku podle metodiky."],
      zsVerdictLabel: "Pozor na hraniční pravidla",
    });
    expect(withWarning).toContain("Zkontrolujte výjimku podle metodiky.");
    expect(withWarning).not.toContain("Souhrn PHmax/PHAmax/PHPmax je připravený");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain('goToSection(firstIssueSection)');
    const clear = renderDock(facts({ tab: "phmax" }), { firstIssueSection: "" });
    expect(clear).not.toContain("Přejít k chybě");
    expect(visited).toEqual([]);
  });

  it("J. plovoucí souhrn jde skrýt a znovu otevřít", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    expect(readMobileSummaryDismissed()).toBe(false);
    writeMobileSummaryDismissed(true);
    expect(readMobileSummaryDismissed()).toBe(true);
    writeMobileSummaryDismissed(false);
    expect(readMobileSummaryDismissed()).toBe(false);
    vi.unstubAllGlobals();

    const floating = readSource("src/CalculatorMobileScrollResults.tsx");
    expect(floating).toContain('aria-label="Skrýt souhrn výsledků"');
    expect(floating).toContain('aria-label="Zobrazit souhrn výsledků"');
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain("writeMobileSummaryDismissed");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("CalculatorWorkflowDock");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("sticky={{");
  });

  it("K. PV, ŠD, SŠ a NV75 nemění svůj souhrn", () => {
    expect(readSource("src/pv/PvWorkflowDockPanel.tsx")).toContain('primaryLabel="PHmax celkem"');
    expect(readSource("src/sd/SdWorkflowDockPanel.tsx")).toContain("CalculatorWorkflowDock");
    expect(readSource("src/PhmaxSsPage.tsx")).toContain("CalculatorWorkflowDock");
    expect(readSource("src/PhmaxNv75DeputyPage.tsx")).toContain("CalculatorWorkflowDock");
    expect(readSource("src/pv/PvHeroHeader.tsx")).toContain(
      '{ label: "PHmax celkem", value: phmaxTotalDisplay, variant: "primary" }',
    );
    expect(readSource("src/sd/SdHeroHeader.tsx")).toContain('{ label: "PHmax", value: phmaxDisplay, variant: "primary" }');
    expect(readSource("src/ss/SsHeroHeader.tsx")).toContain('{ label: "PHmax", value: phmaxHeroValue, variant: "primary" }');
    expect(readSource("src/nv75/Nv75HeroHeader.tsx")).toContain(
      '{ label: "Banka celkem", value: formatCsHoursPerWeek(bankHoursTotal), variant: "primary" }',
    );
  });
});
