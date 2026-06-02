import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { LegisTooltipRef } from "./LegisTooltipRef";
import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  APP_AUTHOR_EXPORT_ROWS,
  CALCULATOR_WORKSPACE_DOCK_LABEL,
  PHMAX_NV75_ONBOARDING_LS_KEY,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { HeroExampleSelect } from "./HeroExampleSelect";
import { HERO_EXAMPLE_SELECT_PLACEHOLDER } from "./calculator-ui-constants";
import { OwnDataHint } from "./OwnDataHint";
import { CalculatorWorkflowDock } from "./CalculatorWorkflowDock";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
import { useDisplayDensity } from "./useDisplayDensity";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { buildExportMetaRows, buildOfficialArchiveRows, EXPORT_CSV_SEPARATOR_ROW } from "./export-metadata";
import {
  APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES,
  getAppAuthorPrintFooterHtml,
  stripAppAuthorCreditFromPlainSummary,
} from "./app-author-print";
import { HeroStatusBar } from "./HeroStatusBar";
import { type ProductView } from "./ProductViewPills";
import { ProductBasicWizard } from "./ProductBasicWizard";
import {
  NV75_BASIC_WIZARD_LS_KEY,
  NV75_BASIC_WIZARD_STEPS,
  NV75_HERO_EXAMPLE_SELECT_ID,
} from "./nv75-basic-wizard";
import { useProductBasicWizard } from "./use-product-basic-wizard";
import { sectionNeedsAttentionClass, scrollToFirstNeedsAttentionSection } from "./calculator-section-focus";
import { createNv75ScrollToInputs } from "./nv75/create-nv75-scroll-to-inputs";
import { calculatorInputIssueBannerFromVerdict } from "./calculator-verdict-ui";
import { useFocusExampleOnMount } from "./useFocusExampleOnMount";
import { useFocusInputsOnMount } from "./useFocusInputsOnMount";
import { BasicComparePreview } from "./BasicComparePreview";
import type { CompareProductVariantsResult } from "./phmax-product-compare";
import { useQuickOnboarding } from "./useQuickOnboarding";
import { Nv75HeroHeader } from "./nv75/Nv75HeroHeader";
import { Nv75QuickOnboardingGuide } from "./nv75/Nv75QuickOnboardingGuide";
import { NV75_DEPUTY_KIND_OPTIONS, NV75_KIND_LABEL } from "./nv75/nv75-deputy-kind-options";
import { Nv75ResultsSection } from "./nv75/Nv75ResultsSection";
import { useUiNotice } from "./useUiNotice";
import type { ResultAnchorTone } from "./ResultAnchorCard";
import { IntegerInput } from "./IntegerInput";
import { CalculatorInputIssueBanner } from "./CalculatorInputIssueBanner";
import { CalculatorProductShell } from "./CalculatorProductShell";
import { calculatorShellClassName, type CalculatorViewMode } from "./calculator-view-mode";
import { FieldWhyPhmaxDetails } from "./FieldWhyPhmax";
import { NV75_DEPUTY_LEGIS_TOOLTIPS } from "./nv75-deputy-legislativa";
import { calculateNv75DeputyBank, type Nv75DeputyKind } from "./nv75-deputy-bank";

type PhmaxNv75DeputyPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export type Nv75DeputyUiRow = {
  id: number;
  kind: Nv75DeputyKind;
  units: number;
  additionalWorkplaceUnits?: number[];
  /** Legacy autosave/preset field; new UI computes this from `additionalWorkplaceUnits`. */
  additionalWorkplacesEligible?: number;
};

function createDefaultNv75UiRow(): Nv75DeputyUiRow {
  return { id: Date.now(), kind: "zs", units: 0, additionalWorkplaceUnits: [] };
}
type Nv75ExampleKey =
  | ""
  | "a_ms"
  | "b_zs_zus"
  | "c_zs_zus_klub"
  | "d_zs_sd_ms"
  | "e_zus_jaz"
  | "f_zs_sd_zus"
  | "g_zs_ss_dm_klub"
  | "ss_vos_dm"
  | "bonus_p2_example1"
  | "bonus_p2_example2"
  | "bonus_poradenske"
  | "ss_mix_40"
  | "ss_bonus32"
  | "ov_16_37"
  | "ov_16_33"
  | "ov_28_42"
  | "ov_15_36";

const NV75_STORAGE_KEY = "edu-cz-nv75-deputy-bank-state";
const NV75_NAMED_SNAPSHOTS_KEY = "edu-cz-nv75-deputy-bank-named-snapshots";
const NV75_VIEW_MODE_LS_KEY = "phmax-nv75-view-mode";
const NV75_MAX_NAMED_SNAPSHOTS = 12;

type Nv75NamedSnapshot = {
  id: string;
  name: string;
  savedAt: string;
  snapshot: {
    rows: Nv75DeputyUiRow[];
    practicalGeneralNonOv: number;
    practicalOvEhl0: number;
    practicalSec16: number;
    ovGroupsSchool: number;
    ovGroupsInstructor: number;
  };
};

function readNv75NamedSnapshots(): Nv75NamedSnapshot[] {
  try {
    const raw = localStorage.getItem(NV75_NAMED_SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: Nv75NamedSnapshot[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeNv75NamedSnapshots(items: Nv75NamedSnapshot[]) {
  try {
    localStorage.setItem(NV75_NAMED_SNAPSHOTS_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

function Nv75LegisRef({ citeId, label }: { citeId: string; label: string }) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={NV75_DEPUTY_LEGIS_TOOLTIPS} />;
}

function kindUsesUnits(kind: Nv75DeputyKind) {
  return kind !== "poradenske" && kind !== "skolni_klub";
}

function kindUsesAdditionalWorkplaces(kind: Nv75DeputyKind) {
  return kind === "ms" || kind === "zs" || kind === "ss_konz" || kind === "poradenske";
}

function clampNonNegativeInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function workplaceUnitsThreshold(kind: Nv75DeputyKind) {
  return kind === "poradenske" ? 1 : 3;
}

export function additionalWorkplaceUnitsForRow(row: Nv75DeputyUiRow) {
  if (!kindUsesAdditionalWorkplaces(row.kind)) return [];
  if (Array.isArray(row.additionalWorkplaceUnits)) return row.additionalWorkplaceUnits.map(clampNonNegativeInt);
  const legacyCount = clampNonNegativeInt(row.additionalWorkplacesEligible ?? 0);
  return Array.from({ length: legacyCount }, () => workplaceUnitsThreshold(row.kind));
}

export function eligibleAdditionalWorkplacesForRow(row: Nv75DeputyUiRow) {
  const workplaceUnits = additionalWorkplaceUnitsForRow(row);
  if (row.kind === "poradenske") return workplaceUnits.length;
  if (row.kind === "ms" || row.kind === "zs" || row.kind === "ss_konz") return workplaceUnits.filter((units) => units >= 3).length;
  return 0;
}

export function normalizeNv75UiRow(row: Nv75DeputyUiRow): Nv75DeputyUiRow {
  return {
    id: row.id,
    kind: row.kind,
    units: clampNonNegativeInt(row.units),
    additionalWorkplaceUnits: additionalWorkplaceUnitsForRow(row),
  };
}

function buildCalculationRows(rows: Nv75DeputyUiRow[]) {
  return rows.map((row) => ({
    kind: row.kind,
    units: row.units,
    additionalWorkplacesEligible: eligibleAdditionalWorkplacesForRow(row),
  }));
}

function formatAdditionalWorkplacesForExport(row: Nv75DeputyUiRow) {
  const units = additionalWorkplaceUnitsForRow(row);
  if (units.length === 0) return "";
  return units
    .map((u, idx) => {
      const eligible = row.kind === "poradenske" || u >= 3;
      return `#${idx + 1}=${u}j${eligible ? " (+§4d)" : " (bez)"}`;
    })
    .join("; ");
}

const NV75_EXAMPLES: readonly {
  id: Nv75ExampleKey;
  label: string;
  title: string;
  description: string;
  expected: string;
  rows: Nv75DeputyUiRow[];
  practicalGeneralNonOv: number;
  practicalOvEhl0: number;
  practicalSec16: number;
  ovGroupsSchool: number;
  ovGroupsInstructor: number;
}[] = [
  {
    id: "a_ms",
    label: "PŘÍKLAD 1: MŠ 8 tříd => banka 14 h",
    title: "1 druh školy nebo školského zařízení: Mateřská škola",
    description: "Mateřská škola má celkem 8 tříd (jednotek). Postupuje se podle §4b odst. 1 a přílohy č. 2 bodu 1 NV 75/2005 Sb.",
    expected: "Očekávaný výsledek: banka odpočtů 14 hodin týdně.",
    rows: [{ id: 1, kind: "ms", units: 8, additionalWorkplacesEligible: 0 }],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "b_zs_zus",
    label: "PŘÍKLAD b): ZŠ 39 + ZUŠ 17 (skup.) => 56 h",
    title: "1 druh z přílohy č. 2 a 1 druh z přílohy č. 3",
    description: "Právnickou osobu tvoří základní škola a základní umělecká škola; hodnoty se podle §4b odst. 2 písm. a) sčítají.",
    expected: "Očekávaný výsledek: ZŠ 44 h + ZUŠ 12 h = 56 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 39, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "zus_group", units: 17, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "c_zs_zus_klub",
    label: "PŘÍKLAD c): ZŠ 18 + ZUŠ 10 (skup.) + klub => 34 h",
    title: "1 druh z přílohy č. 2 a více druhů z přílohy č. 3",
    description: "Hodnoty za ZŠ, ZUŠ a školní klub se sčítají podle §4b odst. 2 písm. b).",
    expected: "Očekávaný výsledek: 22 + 9 + 3 = 34 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 18, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "zus_group", units: 10, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "skolni_klub", units: 1, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "d_zs_sd_ms",
    label: "PŘÍKLAD d): ZŠ + ŠD + MŠ, více druhů příl. 2 => 32 h",
    title: "Více druhů škol nebo zařízení podle přílohy č. 2",
    description: "Jednotky druhů z přílohy č. 2 se sečtou; rozhodne nejvyšší hodnota podle druhu školy, nikoli podle ŠD.",
    expected: "Očekávaný výsledek: 25 jednotek, výhodnější MŠ => 32 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 18, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "sd", units: 2, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "ms", units: 5, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "e_zus_jaz",
    label: "PŘÍKLAD e): ZUŠ 17 (ind.) + jazyková škola 12 => 23 h",
    title: "Více druhů škol nebo zařízení podle přílohy č. 3",
    description: "Hodnoty druhů z přílohy č. 3 se sčítají podle §4b odst. 4.",
    expected: "Očekávaný výsledek: ZUŠ 14 h + jazyková škola 9 h = 23 hodin týdně.",
    rows: [
      { id: 1, kind: "zus_individual", units: 17, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "jazykova", units: 12, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "f_zs_sd_zus",
    label: "PŘÍKLAD f): ZŠ + ŠD + ZUŠ 16 (ind.) => 36 h",
    title: "Více druhů z přílohy č. 2 a 1 druh z přílohy č. 3",
    description: "Nejprve se stanoví část za přílohu č. 2 podle §4b odst. 3, poté se přičte hodnota za ZUŠ.",
    expected: "Očekávaný výsledek: 22 + 14 = 36 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 23, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "sd", units: 2, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "zus_individual", units: 16, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "g_zs_ss_dm_klub",
    label: "PŘÍKLAD g): ZŠ + SŠ + DM + klub => 48 h",
    title: "Více druhů z přílohy č. 2 a více druhů z přílohy č. 3",
    description: "Část za přílohu č. 2 se stanoví ze součtu jednotek, část za přílohu č. 3 součtem hodnot jednotlivých druhů.",
    expected: "Očekávaný výsledek: 33 + 12 + 3 = 48 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 18, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "ss_konz", units: 12, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "domov_mladeze", units: 7, additionalWorkplacesEligible: 0 },
      { id: 4, kind: "skolni_klub", units: 1, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "ss_vos_dm",
    label: "SŠ/VOŠ/DM: SŠ 12 + VOŠ 6 + DM 8 + praxe 319 => 41 h",
    title: "Střední a vyšší odborná škola s domovem mládeže a praktickou přípravou",
    description: "Základní banka za SŠ, VOŠ a DM se sčítá; k ní se přičítá bonus §4c za 319 žáků/studentů praktického vyučování.",
    expected: "Očekávaný výsledek: 11 + 7 + 12 + 11 = 41 hodin týdně.",
    rows: [
      { id: 1, kind: "ss_konz", units: 12, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "vos", units: 6, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "domov_mladeze", units: 8, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 319,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "bonus_p2_example1",
    label: "§4d PŘÍKLAD 1: ZŠ+ŠD + MŠ, více pracovišť => 41 h",
    title: "Bonifikace dalšího pracoviště: příklad 1",
    description: "ZŠ+ŠD a MŠ sídlí ve více vzdálených budovách. Základ banky je 35 h; tři způsobilá další pracoviště přidají 3 x 2 h.",
    expected: "Očekávaný výsledek: 35 + 6 = 41 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 19, additionalWorkplaceUnits: [10, 4] },
      { id: 2, kind: "sd", units: 4, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "ms", units: 7, additionalWorkplaceUnits: [3, 2, 2] },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "bonus_p2_example2",
    label: "§4d PŘÍKLAD 2: ZŠ+ŠD + MŠ, 3 pracoviště => 42 h",
    title: "Bonifikace dalšího pracoviště: příklad 2",
    description: "ZŠ+ŠD a MŠ mají dvě způsobilá další pracoviště; základ banky je 38 h.",
    expected: "Očekávaný výsledek: 38 + 4 = 42 hodin týdně.",
    rows: [
      { id: 1, kind: "zs", units: 23, additionalWorkplaceUnits: [6] },
      { id: 2, kind: "sd", units: 4, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "ms", units: 4, additionalWorkplaceUnits: [4] },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "bonus_poradenske",
    label: "§4d PŘÍKLAD 3: ŠPZ + 2 další pracoviště => 14 h",
    title: "Školské poradenské zařízení s dalším pracovištěm",
    description: "U ŠPZ se podle §4d odst. 2 započítá +1 h za každé další pracoviště.",
    expected: "Očekávaný výsledek: 12 + 1 + 1 = 14 hodin týdně.",
    rows: [{ id: 1, kind: "poradenske", units: 0, additionalWorkplaceUnits: [1, 1] }],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "ss_mix_40",
    label: "SŠ PŘÍKLAD 2: SŠ + VOŠ + JŠ + DM => 40 h",
    title: "SŠ, VOŠ, jazyková škola a domov mládeže",
    description: "Střední škola je druh z přílohy č. 2, ostatní druhy jsou z přílohy č. 3; hodnoty se sčítají.",
    expected: "Očekávaný výsledek: 11 + 7 + 12 + 10 = 40 hodin týdně.",
    rows: [
      { id: 1, kind: "ss_konz", units: 12, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "vos", units: 8, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "jazykova", units: 29, additionalWorkplacesEligible: 0 },
      { id: 4, kind: "domov_mladeze", units: 4, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "ss_bonus32",
    label: "§4d SŠ: SŠ+VOŠ+DM, další pracoviště SŠ => 32 h",
    title: "Bonifikace dalšího pracoviště u SŠ, VOŠ a domova mládeže",
    description: "Základ za SŠ, VOŠ a DM je 30 h; další pracoviště SŠ se 4 třídami přidává +2 h.",
    expected: "Očekávaný výsledek: 30 + 2 = 32 hodin týdně.",
    rows: [
      { id: 1, kind: "ss_konz", units: 12, additionalWorkplaceUnits: [4] },
      { id: 2, kind: "vos", units: 6, additionalWorkplacesEligible: 0 },
      { id: 3, kind: "domov_mladeze", units: 7, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 0,
    ovGroupsInstructor: 0,
  },
  {
    id: "ov_16_37",
    label: "OV PŘÍKLAD 1: SŠ 16 tříd, 37 školních skupin OV",
    title: "Střední škola H/L0, odborný výcvik pouze na školním pracovišti",
    description: "Žáci OV se při 10 a více skupinách nezapočítají do §4c; samostatně se vyhodnotí funkce OV podle vyhl. 13/2005.",
    expected: "Očekávaný výsledek: banka 16 h; 37 skupin => 2 funkce OV.",
    rows: [{ id: 1, kind: "ss_konz", units: 16, additionalWorkplacesEligible: 0 }],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 331,
    practicalSec16: 0,
    ovGroupsSchool: 37,
    ovGroupsInstructor: 0,
  },
  {
    id: "ov_16_33",
    label: "OV PŘÍKLAD 2: SŠ 16 tříd, 16 školních + 34 instruktorských skupin",
    title: "Odborný výcvik na školním pracovišti a u fyzických/právnických osob",
    description: "Do ekvivalentu se započte 16 školních skupin a polovina 34 instruktorských skupin.",
    expected: "Očekávaný výsledek: 16 + 17 = 33 skupin; 2 vedoucí učitelé odborného výcviku.",
    rows: [{ id: 1, kind: "ss_konz", units: 16, additionalWorkplacesEligible: 0 }],
    practicalGeneralNonOv: 0,
    practicalOvEhl0: 331,
    practicalSec16: 0,
    ovGroupsSchool: 16,
    ovGroupsInstructor: 34,
  },
  {
    id: "ov_28_42",
    label: "OV PŘÍKLAD 3: SŠ 28 tříd + praxe 134 + 36 skupin OV",
    title: "Střední škola E/H/L0 a M, odborný výcvik na školním pracovišti",
    description: "Banka zahrnuje základ za SŠ a bonus §4c za praktické vyučování mimo OV; skupiny OV dávají samostatný výstup funkcí.",
    expected: "Očekávaný výsledek: 33 + 9 = 42 h; 36 skupin => 2 funkce OV.",
    rows: [{ id: 1, kind: "ss_konz", units: 28, additionalWorkplacesEligible: 0 }],
    practicalGeneralNonOv: 134,
    practicalOvEhl0: 0,
    practicalSec16: 0,
    ovGroupsSchool: 36,
    ovGroupsInstructor: 0,
  },
  {
    id: "ov_15_36",
    label: "OV PŘÍKLAD 4: SŠ 15 + VOŠ 6, OV jen 9 skupin => 36 h",
    title: "Střední škola H/M a VOŠ; OV pod hranicí 10 skupin",
    description: "Protože je OV jen v 9 skupinách, žáci OV se započítají do počtu žáků praktického vyučování podle §4c odst. 1.",
    expected: "Očekávaný výsledek: 16 + 7 + 13 = 36 hodin týdně.",
    rows: [
      { id: 1, kind: "ss_konz", units: 15, additionalWorkplacesEligible: 0 },
      { id: 2, kind: "vos", units: 6, additionalWorkplacesEligible: 0 },
    ],
    practicalGeneralNonOv: 319,
    practicalOvEhl0: 71,
    practicalSec16: 0,
    ovGroupsSchool: 9,
    ovGroupsInstructor: 0,
  },
];

function buildRowsForExport(
  rows: Nv75DeputyUiRow[],
  practicalGeneralNonOv: number,
  practicalOvEhl0: number,
  practicalSec16: number,
  ovGroupsSchool: number,
  ovGroupsInstructor: number,
) {
  const calculationRows = buildCalculationRows(rows);
  const result = calculateNv75DeputyBank({
    activities: calculationRows,
    practicalStudentsGeneralNonOv: practicalGeneralNonOv,
    practicalStudentsOvEhl0: practicalOvEhl0,
    practicalStudentsSec16: practicalSec16,
    ovGroupsSchool,
    ovGroupsInstructor,
  });
  const exportNow = new Date();
  const exportTimestamp = `${exportNow.toLocaleString("cs-CZ")} (ISO ${exportNow.toISOString()})`;
  const out: [string, string | number][] = [
    ["=== NV75 – banka odpočtů zástupců (orientačně) ===", ""],
    ["Pravidlo §4b", result.appliedRule],
    ["Banka – základ dle §4b (h/týden)", result.bankHoursBase4b],
    ["Banka – bonus dle §4c (h/týden)", result.bonus4cHours],
    ["Banka – bonus dle §4d (h/týden)", result.bonus4dHours],
    ["Banka – celkem (h/týden)", result.bankHoursTotal],
    ["§4c odst. 1 – žáci praktického vyučování (mimo OV E/H/L0)", practicalGeneralNonOv],
    ["OV E/H/L0 – žáci (pro posouzení §4c odst. 3)", practicalOvEhl0],
    ["OV – skupiny školní pracoviště", ovGroupsSchool],
    ["OV – skupiny u instruktora", ovGroupsInstructor],
    ["OV – ekvivalent skupin (školní + floor(instruktor/2))", result.ovGroupsEquivalent],
    ["OV – orientační počet funkcí OV dle vyhl. 13/2005", result.ovDeputyEntitlementCount],
    ["OV – metodický výstup funkcí", result.ovDeputyEntitlementText],
    ["§4c odst. 1 – žáci skutečně započtení", result.practicalStudentsGeneralCounted],
    ["§4c odst. 2 – žáci praktického vyučování §16/9", practicalSec16],
    ["", ""],
    ["=== Release notes NV75 ===", ""],
    ["Verze release notes", "NV75-RN-2026-04-28"],
    [
      "Verze metodiky (legislativní základ)",
      "NV č. 75/2005 Sb., kalkulace dle příloh č. 2 a 3; referenční účinnost 21. 2. 2005",
    ],
    ["Datum a čas exportu (archivní razítko)", exportTimestamp],
    ["RN-1", "Auditní mini-panel „Použitá pásma“ je nově přímo ve výsledkové tabulce po pracovištích."],
    ["RN-2", "U každého pracoviště je uvedeno metodické odůvodnění dle §4b (příloha/pásmo) a §4d (bonifikace)."],
    ["RN-3", "Celkový výsledek je explicitně součet: základ §4b + bonus §4c + bonus §4d."],
    ["", ""],
    ["=== Zadané řádky ===", ""],
  ];
  rows.forEach((row, idx) => {
    out.push([`Řádek ${idx + 1} – druh`, row.kind]);
    out.push([`Řádek ${idx + 1} – jednotky`, row.units]);
    out.push([`Řádek ${idx + 1} – další pracoviště (detail)`, formatAdditionalWorkplacesForExport(row)]);
    out.push([`Řádek ${idx + 1} – další pracoviště (způsobilá dle §4d)`, eligibleAdditionalWorkplacesForRow(row)]);
  });
  if (result.notes.length > 0) out.push(["Poznámky", result.notes.join(" | ")]);
  out.push(["", ""]);
  out.push(["=== Výsledek po pracovištích ===", ""]);
  result.breakdown.forEach((r, i) => {
    out.push([`Pracoviště ${i + 1} – druh`, NV75_KIND_LABEL[r.kind]]);
    out.push([`Pracoviště ${i + 1} – jednotky`, r.units]);
    out.push([`Pracoviště ${i + 1} – základ (h/týden)`, r.hoursByKind]);
    out.push([`Pracoviště ${i + 1} – bonifikace §4d`, r.bonus4dHours]);
    out.push([`Pracoviště ${i + 1} – mezisoučet`, r.hoursByKind + r.bonus4dHours]);
    out.push([
      `Pracoviště ${i + 1} – audit §4b`,
      `§ 4b NV 75/2005 Sb. ve vazbě na přílohu č. ${r.appendix === "p2" ? "2" : "3"}: použito pásmo ${r.reductionBand}.`,
    ]);
    out.push([`Pracoviště ${i + 1} – audit §4d`, r.bonus4dRule]);
  });
  for (const [k, v] of APP_AUTHOR_EXPORT_ROWS) out.push([k, v]);
  return out;
}

export function PhmaxNv75DeputyPage({ productView, setProductView }: PhmaxNv75DeputyPageProps) {
  const [rows, setRows] = useState<Nv75DeputyUiRow[]>([{ id: 1, kind: "zs", units: 0, additionalWorkplaceUnits: [] }]);
  const [practicalGeneralNonOv, setPracticalGeneralNonOv] = useState(0);
  const [practicalOvEhl0, setPracticalOvEhl0] = useState(0);
  const [practicalSec16, setPracticalSec16] = useState(0);
  const [ovGroupsSchool, setOvGroupsSchool] = useState(0);
  const [ovGroupsInstructor, setOvGroupsInstructor] = useState(0);
  const [selectedExample, setSelectedExample] = useState<Nv75ExampleKey>("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [uiNotice, setUiNotice] = useUiNotice();
  const setUiNoticeRef = useRef(setUiNotice);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const [namedSnapshots, setNamedSnapshots] = useState<Nv75NamedSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");
  const [displayDensity, setDisplayDensity] = useDisplayDensity();
  const [focusMode, setFocusMode] = useCalculatorFocusMode();
  const heroHeaderRef = useRef<HTMLElement>(null);
  const [viewMode, setViewMode] = useState<CalculatorViewMode>(() => {
    try {
      const stored = localStorage.getItem(NV75_VIEW_MODE_LS_KEY);
      return stored === "expert" ? "expert" : "basic";
    } catch {
      return "basic";
    }
  });
  const { guideOpen, dismissGuide, toggleGuide, helpButtonRef } = useQuickOnboarding(PHMAX_NV75_ONBOARDING_LS_KEY, {
    scrollAnchorId: "nv75-quick-onboarding",
  });

  useEffect(() => {
    setUiNoticeRef.current = setUiNotice;
  }, [setUiNotice]);
  const selectedExampleDetails = useMemo(() => NV75_EXAMPLES.find((x) => x.id === selectedExample), [selectedExample]);
  const nv75HeroExampleGroups = useMemo(
    () => [
      {
        label: "Příkladové výpočty (metodika §4b a SŠ/VOŠ/DM)",
        options: NV75_EXAMPLES.map((ex) => ({ value: ex.id, label: ex.label, title: ex.title })),
      },
    ],
    [],
  );

  useEffect(() => {
    setNamedSnapshots(readNv75NamedSnapshots());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NV75_VIEW_MODE_LS_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NV75_STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as {
        rows?: Nv75DeputyUiRow[];
        practicalGeneralNonOv?: number;
        practicalOvEhl0?: number;
        practicalSec16?: number;
        ovGroupsSchool?: number;
        ovGroupsInstructor?: number;
      };
      if (Array.isArray(s.rows) && s.rows.length > 0) setRows(s.rows.map(normalizeNv75UiRow));
      if (typeof s.practicalGeneralNonOv === "number") setPracticalGeneralNonOv(s.practicalGeneralNonOv);
      if (typeof s.practicalOvEhl0 === "number") setPracticalOvEhl0(s.practicalOvEhl0);
      if (typeof s.practicalSec16 === "number") setPracticalSec16(s.practicalSec16);
      if (typeof s.ovGroupsSchool === "number") setOvGroupsSchool(s.ovGroupsSchool);
      if (typeof s.ovGroupsInstructor === "number") setOvGroupsInstructor(s.ovGroupsInstructor);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        NV75_STORAGE_KEY,
        JSON.stringify({
          rows: rows.map(normalizeNv75UiRow),
          practicalGeneralNonOv,
          practicalOvEhl0,
          practicalSec16,
          ovGroupsSchool,
          ovGroupsInstructor,
        }),
      );
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    } catch {
      /* ignore */
    }
  }, [rows, practicalGeneralNonOv, practicalOvEhl0, practicalSec16, ovGroupsSchool, ovGroupsInstructor]);

  const calculationRows = useMemo(() => buildCalculationRows(rows), [rows]);
  const bank = useMemo(
    () =>
      calculateNv75DeputyBank({
        activities: calculationRows,
        practicalStudentsGeneralNonOv: practicalGeneralNonOv,
        practicalStudentsOvEhl0: practicalOvEhl0,
        practicalStudentsSec16: practicalSec16,
        ovGroupsSchool,
        ovGroupsInstructor,
      }),
    [calculationRows, practicalGeneralNonOv, practicalOvEhl0, practicalSec16, ovGroupsSchool, ovGroupsInstructor],
  );
  const hasPracticalContext = useMemo(() => rows.some((r) => r.kind === "ss_konz" || r.kind === "vos"), [rows]);
  const nv75InputWarnings = useMemo(() => {
    const messages: string[] = [];
    const noUnitsRows = rows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => kindUsesUnits(row.kind) && row.units <= 0)
      .map(({ idx }) => idx + 1);
    if (noUnitsRows.length > 0) {
      messages.push(`Řádky bez jednotek (vyplňte > 0): ${noUnitsRows.join(", ")}.`);
    }
    const ovRowsWithoutGroups = hasPracticalContext && practicalOvEhl0 > 0 && ovGroupsSchool === 0 && ovGroupsInstructor === 0;
    if (ovRowsWithoutGroups) {
      messages.push(
        "Jsou zadáni žáci OV (E/H/L0), ale nejsou vyplněny skupiny OV. Pro správné posouzení §4c odst. 3 doplňte skupiny na pracovišti školy nebo u instruktora.",
      );
    }
    const notEligibleWorkplaces = rows
      .flatMap((row, rowIdx) =>
        row.kind === "poradenske"
          ? []
          : additionalWorkplaceUnitsForRow(row)
              .map((units, workplaceIdx) => ({ row, rowIdx, units, workplaceIdx }))
              .filter((x) => kindUsesAdditionalWorkplaces(x.row.kind) && x.units > 0 && x.units < 3),
      )
      .map((x) => `ř.${x.rowIdx + 1}/#${x.workplaceIdx + 1}`);
    if (notEligibleWorkplaces.length > 0) {
      messages.push(`Další pracoviště bez nároku §4d (< 3 jednotky): ${notEligibleWorkplaces.join(", ")}.`);
    }
    return messages;
  }, [rows, hasPracticalContext, practicalOvEhl0, ovGroupsSchool, ovGroupsInstructor]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createDefaultNv75UiRow()]);
  }, []);
  const removeRow = useCallback((id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev));
  }, []);
  const updateRow = useCallback((id: number, patch: Partial<Nv75DeputyUiRow>) => {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);
  const addAdditionalWorkplace = useCallback((id: number) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              additionalWorkplaceUnits: [...additionalWorkplaceUnitsForRow(x), workplaceUnitsThreshold(x.kind)],
            }
          : x,
      ),
    );
  }, []);
  const updateAdditionalWorkplace = useCallback((id: number, workplaceIdx: number, units: number) => {
    setRows((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const nextUnits = additionalWorkplaceUnitsForRow(x);
        nextUnits[workplaceIdx] = clampNonNegativeInt(units);
        return { ...x, additionalWorkplaceUnits: nextUnits };
      }),
    );
  }, []);
  const removeAdditionalWorkplace = useCallback((id: number, workplaceIdx: number) => {
    setRows((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        return { ...x, additionalWorkplaceUnits: additionalWorkplaceUnitsForRow(x).filter((_, idx) => idx !== workplaceIdx) };
      }),
    );
  }, []);
  const resetAll = useCallback(() => {
    setRows([{ id: 1, kind: "zs", units: 0, additionalWorkplaceUnits: [] }]);
    setPracticalGeneralNonOv(0);
    setPracticalOvEhl0(0);
    setPracticalSec16(0);
    setOvGroupsSchool(0);
    setOvGroupsInstructor(0);
    setSelectedExample("");
    setUiNoticeRef.current("NV75 banka byla resetována.");
  }, []);
  const applyExample = useCallback((id: Nv75ExampleKey) => {
    setSelectedExample(id);
    const ex = NV75_EXAMPLES.find((x) => x.id === id);
    if (!ex) return;
    setRows(ex.rows.map((r, idx) => normalizeNv75UiRow({ ...r, id: Date.now() + idx + 1 })));
    setPracticalGeneralNonOv(ex.practicalGeneralNonOv);
    setPracticalOvEhl0(ex.practicalOvEhl0);
    setPracticalSec16(ex.practicalSec16);
    setOvGroupsSchool(ex.ovGroupsSchool);
    setOvGroupsInstructor(ex.ovGroupsInstructor);
    setUiNoticeRef.current("Načten metodický příklad NV75.");
  }, []);

  const exportRows = useMemo(
    () =>
      buildRowsForExport(
        rows,
        practicalGeneralNonOv,
        practicalOvEhl0,
        practicalSec16,
        ovGroupsSchool,
        ovGroupsInstructor,
      ),
    [rows, practicalGeneralNonOv, practicalOvEhl0, practicalSec16, ovGroupsSchool, ovGroupsInstructor],
  );

  const buildSnapshot = useCallback(
    () => ({
      rows: rows.map(normalizeNv75UiRow),
      practicalGeneralNonOv,
      practicalOvEhl0,
      practicalSec16,
      ovGroupsSchool,
      ovGroupsInstructor,
    }),
    [rows, practicalGeneralNonOv, practicalOvEhl0, practicalSec16, ovGroupsSchool, ovGroupsInstructor],
  );

  const handleExportCsv = useCallback(() => {
    const rowsCsv = [
      ...buildExportMetaRows("nv75"),
      ...buildOfficialArchiveRows("nv75"),
      EXPORT_CSV_SEPARATOR_ROW,
      ...exportRows,
    ];
    downloadTextFile(exportFilenameStamped("nv75-banka-odpoctu", "csv"), exportCsvLocalized(rowsCsv), "text/csv;charset=utf-8");
    setUiNoticeRef.current("Exportováno do CSV.");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", PRODUCT_CALCULATOR_TITLES.nv75],
          ...buildExportMetaRows("nv75"),
          ...buildOfficialArchiveRows("nv75"),
          ["Vytvořil", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
        ],
        valueRows: exportRows,
        filename: exportFilenameStamped("nv75-banka-odpoctu", "xlsx"),
      });
      setUiNoticeRef.current("Stažen soubor Excel (XLSX).");
    } catch {
      setUiNoticeRef.current("Export do Excelu se nepodařil.");
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  const saveNamedSnapshot = useCallback(() => {
    const name = namedSaveName.trim() || new Date().toLocaleString("cs-CZ");
    const item: Nv75NamedSnapshot = {
      id: `n-${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      snapshot: buildSnapshot(),
    };
    setNamedSnapshots((prev) => {
      const next = [item, ...prev].slice(0, NV75_MAX_NAMED_SNAPSHOTS);
      writeNv75NamedSnapshots(next);
      return next;
    });
    setNamedSaveName("");
    setUiNoticeRef.current(`Pojmenovaná záloha „${name}“ uložena.`);
  }, [buildSnapshot, namedSaveName]);

  const compareWithNamedSnapshot = useCallback(() => {
    const named = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!named) {
      setUiNoticeRef.current("Nejprve vyberte uloženou zálohu pro porovnání.");
      return;
    }
    const current = calculateNv75DeputyBank({
      activities: buildCalculationRows(rows),
      practicalStudentsGeneralNonOv: practicalGeneralNonOv,
      practicalStudentsOvEhl0: practicalOvEhl0,
      practicalStudentsSec16: practicalSec16,
      ovGroupsSchool,
      ovGroupsInstructor,
    });
    const namedResult = calculateNv75DeputyBank({
      activities: buildCalculationRows(named.snapshot.rows.map(normalizeNv75UiRow)),
      practicalStudentsGeneralNonOv: named.snapshot.practicalGeneralNonOv,
      practicalStudentsOvEhl0: named.snapshot.practicalOvEhl0,
      practicalStudentsSec16: named.snapshot.practicalSec16,
      ovGroupsSchool: named.snapshot.ovGroupsSchool,
      ovGroupsInstructor: named.snapshot.ovGroupsInstructor,
    });
    const diff = {
      comparedAt: new Date().toISOString(),
      namedSnapshot: { id: named.id, name: named.name, savedAt: named.savedAt },
      deltas: {
        bankHoursTotal: Number((current.bankHoursTotal - namedResult.bankHoursTotal).toFixed(2)),
        bankHoursBase4b: Number((current.bankHoursBase4b - namedResult.bankHoursBase4b).toFixed(2)),
        bonus4cHours: Number((current.bonus4cHours - namedResult.bonus4cHours).toFixed(2)),
        bonus4dHours: Number((current.bonus4dHours - namedResult.bonus4dHours).toFixed(2)),
      },
      current,
      named: namedResult,
    };
    downloadTextFile(
      exportFilenameStamped("nv75-compare", "json"),
      JSON.stringify(diff, null, 2),
      "application/json;charset=utf-8",
    );
    setUiNoticeRef.current(`Staženo porovnání: aktuální stav vs „${named.name}“ (JSON).`);
  }, [
    namedSnapshots,
    selectedNamedId,
    rows,
    practicalGeneralNonOv,
    practicalOvEhl0,
    practicalSec16,
    ovGroupsSchool,
    ovGroupsInstructor,
  ]);

  const restoreNamedSnapshot = useCallback(() => {
    const named = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!named) {
      setUiNoticeRef.current("Nejprve vyberte uloženou zálohu.");
      return;
    }
    setRows(named.snapshot.rows.map(normalizeNv75UiRow));
    setPracticalGeneralNonOv(named.snapshot.practicalGeneralNonOv);
    setPracticalOvEhl0(named.snapshot.practicalOvEhl0);
    setPracticalSec16(named.snapshot.practicalSec16);
    setOvGroupsSchool(named.snapshot.ovGroupsSchool);
    setOvGroupsInstructor(named.snapshot.ovGroupsInstructor);
    setUiNoticeRef.current(`Obnovena záloha „${named.name}“.`);
  }, [namedSnapshots, selectedNamedId]);

  const nv75ComparePreview = useMemo((): CompareProductVariantsResult | null => {
    const named = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!named) return null;
    const namedResult = calculateNv75DeputyBank({
      activities: buildCalculationRows(named.snapshot.rows.map(normalizeNv75UiRow)),
      practicalStudentsGeneralNonOv: named.snapshot.practicalGeneralNonOv,
      practicalStudentsOvEhl0: named.snapshot.practicalOvEhl0,
      practicalStudentsSec16: named.snapshot.practicalSec16,
      ovGroupsSchool: named.snapshot.ovGroupsSchool,
      ovGroupsInstructor: named.snapshot.ovGroupsInstructor,
    });
    return {
      variants: [],
      metrics: [
        {
          variantId: "current",
          variantLabel: "Aktuální stav",
          product: "ss",
          totalPrimary: bank.bankHoursTotal,
          totalSecondary: null,
          validationOk: nv75InputWarnings.length === 0,
        },
        {
          variantId: "named",
          variantLabel: named.name,
          product: "ss",
          totalPrimary: namedResult.bankHoursTotal,
          totalSecondary: null,
          validationOk: true,
        },
      ],
      comparison: { totalPrimary: [], totalSecondary: [] },
      differences: [],
      recommendation: "",
    };
  }, [
    bank.bankHoursTotal,
    namedSnapshots,
    nv75InputWarnings.length,
    selectedNamedId,
  ]);

  const summaryText = useMemo(() => {
    const lines = [
      "Shrnutí – NV75 banka odpočtů zástupců (orientačně)",
      "",
      `Pravidlo §4b: ${bank.appliedRule}`,
      `§4c odst. 1 – žáci započtení: ${bank.practicalStudentsGeneralCounted}`,
      `Základ banky (§4b): ${bank.bankHoursBase4b} h/týden`,
      `Bonus (§4c): ${bank.bonus4cHours} h/týden`,
      `Bonus (§4d): ${bank.bonus4dHours} h/týden`,
      `Banka odpočtů celkem: ${bank.bankHoursTotal} h/týden`,
      `OV ekvivalent skupin: ${bank.ovGroupsEquivalent}`,
      `OV orientační počet funkcí dle vyhl. 13/2005: ${bank.ovDeputyEntitlementCount}`,
      `OV metodický výstup funkcí: ${bank.ovDeputyEntitlementText}`,
      "",
      APP_AUTHOR_CREDIT_LINE,
    ];
    return lines.join("\n");
  }, [bank]);

  const copySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setUiNoticeRef.current("Shrnutí zkopírováno.");
    } catch {
      setUiNoticeRef.current("Kopírování shrnutí se nepodařilo.");
    }
  }, [summaryText]);
  const nv75Verdict = useMemo(() => {
    if (nv75InputWarnings.length > 0) {
      return {
        tone: "warning" as const,
        label: "Zkontrolujte vstupy",
        detail: nv75InputWarnings[0]!,
      };
    }
    if (!bank.appliedRule) {
      return {
        tone: "warning" as const,
        label: "Doplňte platné řádky",
        detail: "Každý řádek musí mít druh školy a u použitelných druhů kladný počet jednotek.",
      };
    }
    return {
      tone: "ok" as const,
      label: "Banka odpočtů vypočítána",
      detail: "Výsledek odpovídá aktuálním řádkům a volitelným údajům §4c/§4d. Uložte scénář nebo exportujte podklady.",
    };
  }, [bank.appliedRule, nv75InputWarnings]);

  const nv75Workflow = useMemo(() => {
    if (nv75InputWarnings.length > 0) {
      return {
        recommendedStep: "Opravte vstupy podle kontroly NV75.",
        steps: [
          { label: "Vyplnit řádky právnické osoby", state: "done" as const },
          { label: "Opravit varování u řádků", state: "active" as const },
          { label: "Uložit scénář nebo exportovat", state: "todo" as const },
        ],
      };
    }
    if (!bank.appliedRule) {
      return {
        recommendedStep: "Doplňte alespoň jeden platný řádek s jednotkami.",
        steps: [
          { label: "Vyplnit řádky právnické osoby", state: "active" as const },
          { label: "Zkontrolovat pravidlo §4b", state: "todo" as const },
          { label: "Uložit scénář nebo exportovat", state: "todo" as const },
        ],
      };
    }
    return {
      recommendedStep: "Banka je připravena k uložení scénáře nebo exportu.",
      steps: [
        { label: "Vyplnit řádky právnické osoby", state: "done" as const },
        { label: "Zkontrolovat pravidlo §4b", state: "done" as const },
        { label: "Uložit scénář nebo exportovat", state: "active" as const },
      ],
    };
  }, [bank.appliedRule, nv75InputWarnings]);

  const nv75AnchorTone: ResultAnchorTone = nv75Verdict.tone;

  const nv75TocSections = [
    { id: "nv75-vysledek", label: "Banka odpočtů" },
    { id: "nv75-vstupy", label: "Vstupy a řádky" },
  ] as const;

  const printSummary = useCallback(() => {
    const plain = stripAppAuthorCreditFromPlainSummary(summaryText);
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>NV75 banka odpočtů</title>` +
        `<style>${APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES}</style>` +
        `</head><body class="print-summary-doc"><main class="print-summary-doc__main">` +
        `<h1 style="font-size:12pt;margin:0 0 8px;font-weight:800">NV75 – banka odpočtů zástupců</h1><p>${text}</p></main>` +
        `${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }, [summaryText]);

  const nv75NeedsInputBanner = nv75Verdict.tone !== "ok";
  const nv75ScrollToInputs = useMemo(() => createNv75ScrollToInputs(), []);
  const nv75BasicWizardActive = viewMode === "basic";
  const { step: nv75WizardStep, goToStep: goToNv75WizardStep, handleBack: handleNv75WizardBack, handleNext: handleNv75WizardNext } =
    useProductBasicWizard({
      lsKey: NV75_BASIC_WIZARD_LS_KEY,
      steps: NV75_BASIC_WIZARD_STEPS,
      active: nv75BasicWizardActive,
    });

  useFocusExampleOnMount(NV75_HERO_EXAMPLE_SELECT_ID);
  useFocusInputsOnMount(nv75ScrollToInputs);

  return (
    <div className={`app-shell app-shell--gradient calculator-shell--nv75 ${calculatorShellClassName(viewMode, displayDensity, focusMode)} app-shell--with-toc${nv75BasicWizardActive ? ` product-basic-wizard-active nv75-wizard-step-${nv75WizardStep}` : ""}${nv75NeedsInputBanner ? " app-shell--validation-hint" : ""}`}>
      <div className="container container--app">
        <Nv75HeroHeader
          heroHeaderRef={heroHeaderRef}
          productView={productView}
          setProductView={setProductView}
          viewMode={viewMode}
          setViewMode={setViewMode}
          displayDensity={displayDensity}
          setDisplayDensity={setDisplayDensity}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          guideOpen={guideOpen}
          toggleGuide={toggleGuide}
          helpButtonRef={helpButtonRef}
          bankHoursTotal={bank.bankHoursTotal}
          rowCount={rows.length}
          appliedRule={bank.appliedRule}
          verdictLabel={nv75Verdict.label}
          toolbar={{
            onAddRow: addRow,
            onExportCsv: handleExportCsv,
            onExportXlsx: handleExportXlsx,
            xlsxExportBusy,
            onPrintSummary: printSummary,
            lastSavedAt,
            namedSaveName,
            setNamedSaveName,
            namedSnapshots,
            selectedNamedId,
            setSelectedNamedId,
            onSaveNamedSnapshot: saveNamedSnapshot,
            onRestoreNamedSnapshot: restoreNamedSnapshot,
            onCompareWithNamedSnapshot: compareWithNamedSnapshot,
            onCopySummary: copySummary,
            onResetAll: resetAll,
          }}
        />

        <Nv75QuickOnboardingGuide open={guideOpen} onDismiss={dismissGuide} returnFocusRef={helpButtonRef} />
        {nv75BasicWizardActive ? (
          <ProductBasicWizard
            productLabel="NV75"
            steps={NV75_BASIC_WIZARD_STEPS}
            step={nv75WizardStep}
            heroExampleSelectId={NV75_HERO_EXAMPLE_SELECT_ID}
            inputIssueFix={nv75NeedsInputBanner ? { onFix: nv75ScrollToInputs } : undefined}
            onStepChange={goToNv75WizardStep}
            onBack={handleNv75WizardBack}
            onNext={handleNv75WizardNext}
          />
        ) : null}

        {nv75NeedsInputBanner ? (
          <CalculatorInputIssueBanner {...calculatorInputIssueBannerFromVerdict(nv75Verdict, nv75ScrollToInputs)} />
        ) : null}

        <CalculatorProductShell
          sticky={{
            anchorRef: heroHeaderRef,
            primaryLabel: "Banka odpočtů",
            primaryValue: `${bank.bankHoursTotal} h/týden`,
            statusText: nv75Verdict.label,
            tone: nv75Verdict.tone,
            onSave: saveNamedSnapshot,
            onExport: handleExportCsv,
          }}
          workspaceVariant="input-heavy"
          workspaceDockLabel={CALCULATOR_WORKSPACE_DOCK_LABEL}
          dock={
            <CalculatorWorkflowDock
              tone={nv75AnchorTone}
              primaryLabel="Banka odpočtů celkem"
              primaryValue={`${bank.bankHoursTotal} h/týden`}
              stats={[
                { label: "Pravidlo §4b", value: bank.appliedRule || "–" },
                { label: "Základ §4b", value: `${bank.bankHoursBase4b} h` },
                { label: "Bonus §4c + §4d", value: `${bank.bonus4cHours + bank.bonus4dHours} h` },
              ]}
              statusBadge={nv75Verdict.label}
              verdictLabel={nv75Verdict.label}
              verdictDetail={nv75Verdict.detail}
              workflowSteps={nv75BasicWizardActive ? [] : nv75Workflow.steps}
              viewMode={viewMode}
              footer={
                viewMode === "basic" ? (
                  <BasicComparePreview
                    result={nv75ComparePreview}
                    inactive={!selectedNamedId}
                    emptyHint="Vyberte pojmenovanou zálohu v horní liště pro rychlé porovnání banky odpočtů."
                    metricLabel="Banka odpočtů"
                  />
                ) : null
              }
              actions={[
                ...(nv75NeedsInputBanner
                  ? [
                      {
                        label: "Přejít k chybě",
                        onClick: () => scrollToFirstNeedsAttentionSection(["nv75-vstupy"]),
                      },
                    ]
                  : []),
                { label: "Uložit scénář", onClick: saveNamedSnapshot },
                { label: "Export CSV", onClick: handleExportCsv },
                { label: "Porovnat se zálohou", onClick: compareWithNamedSnapshot },
              ]}
            />
          }
          main={
            <>

        <section
          className={`card muted section-card${sectionNeedsAttentionClass(nv75NeedsInputBanner)}`}
          data-section="nv75-vstupy"
          data-wizard-step="2"
        >
          <h2 className="section-title">Vstupy</h2>
          <OwnDataHint variant="form" />
          <label className="field" style={{ marginTop: 10, maxWidth: 760 }}>
            <span className="field__label" id="nv75-hero-example-label">
              Příkladové výpočty (metodika §4b a SŠ/VOŠ/DM)
            </span>
            <HeroExampleSelect
              id="nv75-hero-example-select"
              aria-labelledby="nv75-hero-example-label"
              placeholder={HERO_EXAMPLE_SELECT_PLACEHOLDER}
              value={selectedExample}
              groups={nv75HeroExampleGroups}
              onChange={(key) => applyExample(key as Nv75ExampleKey)}
            />
          </label>
          <p className="muted-text" style={{ marginTop: 6 }}>
            Doplněny i rozsáhlé scénáře: více pracovišť a bonifikace §4d, kombinace SŠ/VOŠ/JŠ/DM i varianty odborného výcviku (OV).
          </p>
          <FieldWhyPhmaxDetails summary="Proč jednotky v řádcích mění výsledek §4b?">
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              <li>
                Každý <strong>druh školy ze seznamu</strong> nese předepsaný orientační čas ze souhrnných částí příloh č. 2 a č. 3 NV č. 75/2005 Sb.; násobí jej počet jeho <strong>jednotek (třídy / skupiny)</strong>.
              </li>
              <li>
                Pro více řádků §4b vybírá aplikace <strong>užitatelné kombinační pravidlo</strong> (odstavce §4b) a sečtené hodiny tvoří <strong>banku odpočtů zástupců</strong>.
              </li>
              <li>
                Údaje v části <strong>§4c</strong> se promítají jen u příznakových řádků (kontext SŠ / VOŠ) a mění jen přírůstkovou část u odborného výcviku – ne mění automaticky řádek §4b samotný.
              </li>
              <li>
                <strong>Další pracoviště §4d</strong> zpřesňuje nárok na dílčí část banky jen tam, kde se podle počtu jednotek na jednotlivém pracovišti splní způsobilost pro §4d.
              </li>
            </ul>
          </FieldWhyPhmaxDetails>
          {selectedExampleDetails ? (
            <div className="card muted" style={{ marginTop: 10 }}>
              <h3 className="section-title" style={{ marginTop: 0 }}>{selectedExampleDetails.title}</h3>
              <p style={{ margin: 0 }}>{selectedExampleDetails.description}</p>
              <p className="muted-text" style={{ margin: "6px 0 0" }}>
                <strong>{selectedExampleDetails.expected}</strong>
              </p>
            </div>
          ) : null}

          {hasPracticalContext ? (
            <div className="grid two" style={{ marginTop: 10 }}>
              <label className="field">
                <span className="field__label">
                  <Nv75LegisRef citeId="nv75-4c1" label="§4c odst. 1" /> – žáci/stud. praktického vyučování (mimo OV E/H/L0)
                </span>
                <IntegerInput
                  className="input"
                  min={0}
                  value={practicalGeneralNonOv}
                  onChange={setPracticalGeneralNonOv}
                />
              </label>
              <label className="field">
                <span className="field__label">
                  OV E/H/L0 – žáci (započítání dle <Nv75LegisRef citeId="nv75-4c3" label="§4c odst. 3" />)
                </span>
                <IntegerInput
                  className="input"
                  min={0}
                  value={practicalOvEhl0}
                  onChange={setPracticalOvEhl0}
                />
              </label>
              <label className="field">
                <span className="field__label">OV – skupiny na školních pracovištích</span>
                <IntegerInput className="input" min={0} value={ovGroupsSchool} onChange={setOvGroupsSchool} />
              </label>
              <label className="field">
                <span className="field__label">OV – skupiny vedené instruktorem</span>
                <IntegerInput className="input" min={0} value={ovGroupsInstructor} onChange={setOvGroupsInstructor} />
              </label>
              <label className="field">
                <span className="field__label">
                  <Nv75LegisRef citeId="nv75-4c2" label="§4c odst. 2" /> – žáci prakt. vyučování ve škole dle{" "}
                  <Nv75LegisRef citeId="skolsky-16-9" label="§16 odst. 9" />
                </span>
                <IntegerInput className="input" min={0} value={practicalSec16} onChange={setPracticalSec16} />
              </label>
            </div>
          ) : (
            <p className="muted-text" style={{ marginTop: 10 }}>
              Pole §4c (praktické vyučování/OV) se zobrazují jen při volbě druhu s kontextem SŠ nebo VOŠ.
            </p>
          )}
          {nv75InputWarnings.length > 0 ? (
            <div className="card warning card--warning" style={{ marginTop: 10 }}>
              <h3 style={{ marginTop: 0 }}>Kontrola vstupů NV75</h3>
              {nv75InputWarnings.map((item, i) => (
                <div key={`nv75-w-${i}`}>• {item}</div>
              ))}
            </div>
          ) : null}

          <div className="sd-phmax-breakdown-scroll" style={{ marginTop: 10 }}>
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th>Druh školy/zařízení</th>
                  <th>Jednotky</th>
                  <th>Další pracoviště (§4d)</th>
                  <th>Výsledek pracoviště (h/týden)</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} data-nv75-row-id={row.id}>
                    <td>
                      <select className="input" value={row.kind} onChange={(e) => updateRow(row.id, { kind: e.target.value as Nv75DeputyKind })}>
                        {NV75_DEPUTY_KIND_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {kindUsesUnits(row.kind) ? (
                        <IntegerInput className="input" min={0} value={row.units} onChange={(units) => updateRow(row.id, { units })} />
                      ) : (
                        <span className="muted-text">nepoužívá se</span>
                      )}
                    </td>
                    <td>
                      {kindUsesAdditionalWorkplaces(row.kind) ? (
                        <div style={{ display: "grid", gap: 6 }}>
                          {additionalWorkplaceUnitsForRow(row).map((units, workplaceIdx) => {
                            const eligible = row.kind === "poradenske" || units >= 3;
                            return (
                              <div key={workplaceIdx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <span className="muted-text">#{workplaceIdx + 1}</span>
                                <IntegerInput
                                  className="input"
                                  min={0}
                                  value={units}
                                  onChange={(next) => updateAdditionalWorkplace(row.id, workplaceIdx, next)}
                                  style={{ width: 100 }}
                                  aria-label={`Jednotky dalšího pracoviště ${workplaceIdx + 1}`}
                                />
                                <span className="muted-text">{eligible ? "+ §4d" : "bez bonifikace"}</span>
                                <button type="button" className="btn ghost" onClick={() => removeAdditionalWorkplace(row.id, workplaceIdx)}>
                                  Odebrat
                                </button>
                              </div>
                            );
                          })}
                          <button type="button" className="btn ghost" onClick={() => addAdditionalWorkplace(row.id)}>
                            Přidat další pracoviště
                          </button>
                          <span className="muted-text">Způsobilá pracoviště: {eligibleAdditionalWorkplacesForRow(row)}</span>
                        </div>
                      ) : (
                        <span className="muted-text">nepoužívá se</span>
                      )}
                    </td>
                    <td className="sd-phmax-breakdown__num">
                      {(bank.breakdown[idx]?.hoursByKind ?? 0) + (bank.breakdown[idx]?.bonus4dHours ?? 0)}
                    </td>
                    <td>
                      <button type="button" className="btn ghost" onClick={() => removeRow(row.id)}>
                        Odebrat
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="nv75-units-add-row">
                  <td>
                    <button type="button" className="btn ghost nv75-units-add-row__btn" onClick={addRow}>
                      Vložit druh školy/zařízení
                    </button>
                  </td>
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Nv75ResultsSection
          bank={bank}
          viewMode={viewMode}
          rowCount={rows.length}
          ovGroupsSchool={ovGroupsSchool}
          ovGroupsInstructor={ovGroupsInstructor}
        />

          </>
          }
          footer={
            <footer className="zs-app-footer">
              <HeroStatusBar variant="nv75" placement="footer" productLabel={PRODUCT_CALCULATOR_TITLES.nv75} lastSavedAt={lastSavedAt} notice={uiNotice} />
              <AuthorCreditFooter />
            </footer>
          }
          tocSections={nv75TocSections}
        />
      </div>
    </div>
  );
}
