import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { LegisTooltipRef } from "./LegisTooltipRef";
import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  APP_AUTHOR_EXPORT_ROWS,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { exportCsvLocalized, downloadTextFile } from "./export-utils";
import { getAppAuthorPrintFooterHtml, stripAppAuthorCreditFromPlainSummary } from "./app-author-print";
import { HeroStatusBar } from "./HeroStatusBar";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NV75_DEPUTY_LEGIS_TOOLTIPS, NV75_DEPUTY_LEGIS_URL } from "./nv75-deputy-legislativa";
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

const NV75_DEPUTY_KIND_OPTIONS: readonly { value: Nv75DeputyKind; label: string }[] = [
  { value: "ms", label: "MŠ (příl. 2)" },
  { value: "ms_internat", label: "MŠ internátní / SPC (příl. 2)" },
  { value: "zs", label: "ZŠ (příl. 2)" },
  { value: "ss_konz", label: "SŠ a konzervatoř (příl. 2)" },
  { value: "sd", label: "Školní družina (příl. 2)" },
  { value: "internat", label: "Internát (příl. 3)" },
  { value: "zus_individual", label: "ZUŠ – zástupce (individuální výuka) (příl. 3)" },
  { value: "zus_group", label: "ZUŠ – zástupce (skupinová/kolektivní) (příl. 3)" },
  { value: "jazykova", label: "Jazyková škola s právem SJZ (příl. 3)" },
  { value: "ustavni", label: "ŠZ pro ústavní/ochrannou výchovu (příl. 3)" },
  { value: "domov_mladeze", label: "Domov mládeže (příl. 3)" },
  { value: "poradenske", label: "Školské poradenské zařízení (příl. 3)" },
  { value: "vos", label: "Vyšší odborná škola (příl. 3)" },
  { value: "skolni_klub", label: "Školní klub (příl. 3)" },
];

function Nv75LegisRef({ citeId, label }: { citeId: string; label: string }) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={NV75_DEPUTY_LEGIS_TOOLTIPS} />;
}
const NV75_KIND_LABEL: Record<Nv75DeputyKind, string> = Object.fromEntries(
  NV75_DEPUTY_KIND_OPTIONS.map((x) => [x.value, x.label]),
) as Record<Nv75DeputyKind, string>;

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

function normalizeNv75UiRow(row: Nv75DeputyUiRow): Nv75DeputyUiRow {
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
  const [uiNotice, setUiNotice] = useState("");
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const selectedExampleDetails = useMemo(() => NV75_EXAMPLES.find((x) => x.id === selectedExample), [selectedExample]);

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
  const ovInstructorGroupsCounted = Math.floor(Math.max(0, Math.floor(ovGroupsInstructor)) / 2);
  const hasOvGroups = ovGroupsSchool > 0 || ovGroupsInstructor > 0 || bank.ovGroupsEquivalent > 0;

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: Date.now(), kind: "zs", units: 0, additionalWorkplaceUnits: [] }]);
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
    setUiNotice("NV75 banka byla resetována.");
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
    setUiNotice("Načten metodický příklad NV75.");
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

  const handleExportCsv = useCallback(() => {
    downloadTextFile("nv75-banka-odpoctu.csv", exportCsvLocalized(exportRows), "text/csv;charset=utf-8");
    setUiNotice("Exportováno do CSV.");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", PRODUCT_CALCULATOR_TITLES.nv75],
          ["Datum a čas exportu", new Date().toLocaleString("cs-CZ")],
          ["Vytvořil", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
        ],
        valueRows: exportRows,
        filename: "nv75-banka-odpoctu.xlsx",
      });
      setUiNotice("Stažen soubor Excel (XLSX).");
    } catch {
      setUiNotice("Export do Excelu se nepodařil.");
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

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
      setUiNotice("Shrnutí zkopírováno.");
    } catch {
      setUiNotice("Kopírování shrnutí se nepodařilo.");
    }
  }, [summaryText]);
  const ruleExplanation = useMemo(() => {
    switch (bank.appliedRule) {
      case "4b1":
        return "§4b odst. 1: právnická osoba vykonává 1 druh školy/zařízení (příloha č. 2 nebo č. 3).";
      case "4b2a":
        return "§4b odst. 2 písm. a): 1 druh z přílohy č. 2 + 1 druh z přílohy č. 3 => součet obou hodnot.";
      case "4b2b":
        return "§4b odst. 2 písm. b): 1 druh z přílohy č. 2 + více druhů z přílohy č. 3 => součet všech hodnot.";
      case "4b3":
        return "§4b odst. 3: více druhů z přílohy č. 2 => sčítají se jednotky, hodnota se určí podle nejvyššího druhu (mimo ŠD).";
      case "4b4":
        return "§4b odst. 4: více druhů z přílohy č. 3 => součet hodnot všech druhů.";
      case "4b5a":
        return "§4b odst. 5 písm. a): více druhů z přílohy č. 2 + 1 druh z přílohy č. 3.";
      case "4b5b":
        return "§4b odst. 5 písm. b): více druhů z přílohy č. 2 + více druhů z přílohy č. 3.";
      default:
        return "Nebyl rozpoznán použitelný scénář §4b – zkontrolujte vstupy.";
    }
  }, [bank.appliedRule]);

  const printSummary = useCallback(() => {
    const plain = stripAppAuthorCreditFromPlainSummary(summaryText);
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>NV75 banka odpočtů</title>` +
        `<style>body{font-family:system-ui,Segoe UI,sans-serif;margin:16px;font-size:11pt;line-height:1.45;color:#0f172a}</style>` +
        `</head><body><h1 style="font-size:13pt">NV75 – banka odpočtů zástupců</h1><p>${text}</p>${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }, [summaryText]);

  return (
    <div className="app-shell app-shell--gradient">
      <div className="container container--app">
        <header className="hero hero--feature">
          <div className="hero__content">
            <ProductViewPills productView={productView} setProductView={setProductView} />
            <h1 className="hero__title">NV75 – banka odpočtů zástupců</h1>
            <p className="hero__subtitle">
              Samostatná kalkulačka dle §4b až §4d NV č. 75/2005 Sb. pro orientační výpočet celkového snížení PPČ
              zástupců ředitele.
            </p>
          </div>
        </header>

        <section className="card muted section-card">
          <h2 className="section-title">Vstupy</h2>
          <div className="toolbar">
            <button type="button" className="btn ghost" onClick={addRow}>
              Přidat řádek
            </button>
            <button type="button" className="btn ghost" onClick={resetAll}>
              Reset
            </button>
            <button type="button" className="btn ghost" onClick={handleExportCsv}>
              Export CSV
            </button>
            <button type="button" className="btn ghost" onClick={() => void handleExportXlsx()} disabled={xlsxExportBusy}>
              {xlsxExportBusy ? "Exportuji…" : "Export XLSX"}
            </button>
            <button type="button" className="btn ghost" onClick={() => void copySummary()}>
              Kopírovat shrnutí
            </button>
            <button type="button" className="btn ghost" onClick={printSummary}>
              Tisk shrnutí
            </button>
          </div>
          <label className="field" style={{ marginTop: 10, maxWidth: 760 }}>
            <span className="field__label">Příkladové výpočty (metodika §4b a SŠ/VOŠ/DM)</span>
            <select
              className="input"
              value={selectedExample}
              onChange={(e) => applyExample(e.target.value as Nv75ExampleKey)}
            >
              <option value="">Vyberte příklad…</option>
              {NV75_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.label}
                </option>
              ))}
            </select>
          </label>
          <p className="muted-text" style={{ marginTop: 6 }}>
            Doplněny i rozsáhlé scénáře: více pracovišť a bonifikace §4d, kombinace SŠ/VOŠ/JŠ/DM i varianty odborného výcviku (OV).
          </p>
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
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={practicalGeneralNonOv}
                  onChange={(e) => setPracticalGeneralNonOv(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field__label">
                  OV E/H/L0 – žáci (započítání dle <Nv75LegisRef citeId="nv75-4c3" label="§4c odst. 3" />)
                </span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={practicalOvEhl0}
                  onChange={(e) => setPracticalOvEhl0(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field__label">OV – skupiny na školních pracovištích</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={ovGroupsSchool}
                  onChange={(e) => setOvGroupsSchool(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field__label">OV – skupiny vedené instruktorem</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={ovGroupsInstructor}
                  onChange={(e) => setOvGroupsInstructor(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field__label">
                  <Nv75LegisRef citeId="nv75-4c2" label="§4c odst. 2" /> – žáci prakt. vyučování ve škole dle{" "}
                  <Nv75LegisRef citeId="skolsky-16-9" label="§16 odst. 9" />
                </span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={practicalSec16}
                  onChange={(e) => setPracticalSec16(Number(e.target.value))}
                />
              </label>
            </div>
          ) : (
            <p className="muted-text" style={{ marginTop: 10 }}>
              Pole §4c (praktické vyučování/OV) se zobrazují jen při volbě druhu s kontextem SŠ nebo VOŠ.
            </p>
          )}

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
                  <tr key={row.id}>
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
                        <input className="input" type="number" min={0} step={1} value={row.units} onChange={(e) => updateRow(row.id, { units: Number(e.target.value) })} />
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
                                <input
                                  className="input"
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={units}
                                  onChange={(e) => updateAdditionalWorkplace(row.id, workplaceIdx, Number(e.target.value))}
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
              </tbody>
            </table>
          </div>
        </section>

        <section className="card muted section-card section-card--overview">
          <h2 className="section-title">Výsledek banky odpočtů</h2>
          <div className="grid four">
            <div className="result-card"><p className="result-card__label">Pravidlo <Nv75LegisRef citeId="nv75-4b" label="§4b" /></p><p className="result-card__value">{bank.appliedRule}</p></div>
            <div className="result-card"><p className="result-card__label">Základ <Nv75LegisRef citeId="nv75-4b" label="§4b" /></p><p className="result-card__value">{bank.bankHoursBase4b}</p></div>
            <div className="result-card"><p className="result-card__label">Bonus <Nv75LegisRef citeId="nv75-4c1" label="§4c" /> + <Nv75LegisRef citeId="nv75-4d" label="§4d" /></p><p className="result-card__value">{bank.bonus4cHours + bank.bonus4dHours}</p></div>
            <div className="result-card" style={{ border: "2px solid #0f766e", background: "#ecfeff" }}>
              <p className="result-card__label">Banka odpočtů celkem (h/týden)</p>
              <p className="result-card__value" style={{ color: "#0f766e", fontWeight: 800 }}>{bank.bankHoursTotal}</p>
            </div>
            <div className="result-card"><p className="result-card__label"><Nv75LegisRef citeId="nv75-4c1" label="§4c odst. 1" /> – žáci započtení</p><p className="result-card__value">{bank.practicalStudentsGeneralCounted}</p></div>
            <div className="result-card"><p className="result-card__label">OV ekvivalent skupin</p><p className="result-card__value">{bank.ovGroupsEquivalent}</p></div>
            <div className="result-card"><p className="result-card__label">OV funkce dle <Nv75LegisRef citeId="vyhl13-7" label="vyhl. 13/2005" /></p><p className="result-card__value">{bank.ovDeputyEntitlementCount}</p></div>
          </div>
          <div className="sd-phmax-breakdown-scroll" style={{ marginTop: 12 }}>
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th>Pracoviště</th>
                  <th>Počet jednotek</th>
                  <th>Počet hodin do banky odpočtů</th>
                </tr>
              </thead>
              <tbody>
                {bank.breakdown.map((row, idx) => (
                  <tr key={`${row.kind}-${idx}`}>
                    <td>{NV75_KIND_LABEL[row.kind]}</td>
                    <td>{row.units}</td>
                    <td>{row.hoursByKind + row.bonus4dHours} hodin týdně</td>
                  </tr>
                ))}
                <tr>
                  <th>Bonus §4c</th>
                  <td>—</td>
                  <td>{bank.bonus4cHours} hodin týdně</td>
                </tr>
                <tr>
                  <th>Banka odpočtů celkem</th>
                  <td>—</td>
                  <td>{bank.bankHoursTotal} hodin týdně</td>
                </tr>
                {hasOvGroups ? (
                  <>
                    <tr>
                      <th>Počet skupin odborného výcviku na školních pracovištích</th>
                      <td>{ovGroupsSchool} skupin</td>
                      <td>započítáno plně</td>
                    </tr>
                    <tr>
                      <th>Počet skupin odborného výcviku u instruktora / ve firmách</th>
                      <td>{ovGroupsInstructor} skupin</td>
                      <td>započteno {ovInstructorGroupsCounted} skupin (floor({ovGroupsInstructor} / 2))</td>
                    </tr>
                    <tr>
                      <th>Počet skupin odborného výcviku celkem</th>
                      <td>{bank.ovGroupsEquivalent} skupin</td>
                      <td>školní skupiny + započtená polovina instruktorských skupin</td>
                    </tr>
                    <tr>
                      <th>Výstup dle §13 odst. 7 vyhl. 13/2005</th>
                      <td>{bank.ovDeputyEntitlementCount} funkcí</td>
                      <td>{bank.ovDeputyEntitlementText}</td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="card muted" style={{ marginTop: 12 }}>
            <h3 className="section-title" style={{ marginTop: 0 }}>Odůvodnění výsledku (metodika + NV75)</h3>
            <ul className="methodology-strip__list">
              <li>{ruleExplanation}</li>
              <li>
                Základ banky: <strong>{bank.bankHoursBase4b} h/týden</strong> podle <Nv75LegisRef citeId="nv75-4b" label="§4b" />.
              </li>
              <li>
                Bonus praktického vyučování: <strong>{bank.bonus4cHours} h/týden</strong> podle <Nv75LegisRef citeId="nv75-4c1" label="§4c" />.
              </li>
              <li>
                Bonus dalších pracovišť: <strong>{bank.bonus4dHours} h/týden</strong> podle <Nv75LegisRef citeId="nv75-4d" label="§4d" />.
                Způsobilost se počítá z detailu dalších pracovišť (MŠ/ZŠ/SŠ nejméně 3 jednotky; ŠPZ každé další pracoviště).
              </li>
              <li>
                Celkem: <strong>{bank.bankHoursTotal} h/týden</strong>.
              </li>
              {hasOvGroups ? (
                <li>
                  OV: <strong>{ovGroupsSchool} školních skupin</strong> +{" "}
                  <strong>{ovInstructorGroupsCounted} započtených instruktorských skupin</strong> = ekvivalent{" "}
                  <strong>{bank.ovGroupsEquivalent} skupin</strong> {"=>"}{" "}
                  <strong>{bank.ovDeputyEntitlementText}</strong> podle <Nv75LegisRef citeId="vyhl13-7" label="vyhl. 13/2005" />.
                </li>
              ) : null}
            </ul>
            <p className="muted-text" style={{ marginTop: 8 }}>
              Odkazy:{" "}
              <a href={NV75_DEPUTY_LEGIS_URL.nv75} target="_blank" rel="noopener noreferrer" className="status-link ss-why-panel__link">
                NV 75/2005
              </a>
              {" · "}
              <a href={NV75_DEPUTY_LEGIS_URL.vyhl13} target="_blank" rel="noopener noreferrer" className="status-link ss-why-panel__link">
                vyhl. 13/2005
              </a>
              {" · "}
              <a href={NV75_DEPUTY_LEGIS_URL.skolsky561} target="_blank" rel="noopener noreferrer" className="status-link ss-why-panel__link">
                školský zákon 561/2004
              </a>
            </p>
          </div>
          {bank.notes.length > 0 ? <p className="muted-text" style={{ marginTop: 10 }}>{bank.notes.join(" | ")}</p> : null}
        </section>

        <footer className="zs-app-footer">
          <HeroStatusBar variant="nv75" placement="footer" productLabel={PRODUCT_CALCULATOR_TITLES.nv75} lastSavedAt={lastSavedAt} notice={uiNotice} />
          <AuthorCreditFooter />
        </footer>
      </div>
      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </div>
  );
}
