import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  BROWSER_ERROR_NEXT_STEP_HINT,
  MSG_DATA_UNEXPECTED_SHAPE,
  MSG_NAMED_BACKUP_PICK_FIRST,
  MSG_NAMED_BACKUP_PICK_TO_COMPARE,
  MSG_NAMED_BACKUP_PICK_TO_DELETE,
  MSG_NO_LOCAL_AUTOSAVE_DATA,
  INLINE_VALIDATION_MSG_POSITIVE_INTEGER,
  namedBackupSavedNotice,
  CALCULATOR_WORKSPACE_DOCK_LABEL,
  PHMAX_SD_ONBOARDING_LS_KEY,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { printPlainSummaryDocument, PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE } from "./app-author-print";
import {
  confirmDestructive,
  MSG_CONFIRM_CLEAR_BROWSER_STORAGE,
  MSG_CONFIRM_RESET_FORM_ALL,
  msgConfirmDeleteNamedBackup,
} from "./confirm-destructive";
import { buildExportMetaRows, EXPORT_CSV_SEPARATOR_ROW } from "./export-metadata";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { heroExampleOptionsFromKeys } from "./HeroExampleSelect";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import { FieldWhyPhmaxDetails } from "./FieldWhyPhmax";
import { HeroStatusBar } from "./HeroStatusBar";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
import { CalculatorInputIssueBanner } from "./CalculatorInputIssueBanner";
import { useDisplayDensity } from "./useDisplayDensity";
import { calculatorShellClassName, type CalculatorViewMode } from "./calculator-view-mode";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { PhmaxModuleSeoSection } from "./PhmaxModuleSeoSection";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel, SdLegisRef } from "./PhmaxProductLegisUi";
import { SD_LEGIS_ZAKONY_URL } from "./phmax-sd-legislativa";
import { useQuickOnboarding } from "./useQuickOnboarding";
import { SdHeroHeader } from "./sd/SdHeroHeader";
import { SdQuickOnboardingGuide } from "./sd/SdQuickOnboardingGuide";
import { SdResultsSection } from "./sd/SdResultsSection";
import { SdBasicWizard } from "./SdBasicWizard";
import {
  SD_BASIC_WIZARD_LS_KEY,
  SD_HERO_EXAMPLE_SELECT_ID,
  SD_BASIC_WIZARD_STEPS,
} from "./sd-basic-wizard";
import { useProductBasicWizard } from "./use-product-basic-wizard";
import { sectionNeedsAttentionClass, scrollToFirstNeedsAttentionSection } from "./calculator-section-focus";
import { createSdScrollToInputs } from "./sd/create-sd-scroll-to-inputs";
import { PHMAX_IMPORT_APPLIED_EVENT } from "./phmax-import-applied-event";
import { buildCalculatorNextAction } from "./calculator-next-action";
import { CalculatorNextActionStrip } from "./CalculatorNextActionStrip";
import { CalculatorModuleQuickTour } from "./CalculatorModuleQuickTour";
import { focusCalculatorElementById } from "./calculator-focus-element";
import { calculatorInputIssueBannerFromVerdict } from "./calculator-verdict-ui";
import { SD_QUICK_TOUR_LS_KEY, SD_QUICK_TOUR_STEPS } from "./phmax-module-quick-tour";
import { useFocusExampleOnMount } from "./useFocusExampleOnMount";
import { useFocusInputsOnMount } from "./useFocusInputsOnMount";
import { useUiNotice } from "./useUiNotice";
import { SdCalculatorShell } from "./sd/SdCalculatorShell";
import type { ProductView } from "./ProductViewPills";
import { GlossaryDialog, type GlossaryTerm } from "./GlossaryDialog";
import { InputOutputLegend, NumberField } from "./phmax-zs-ui";
import { OwnDataHint } from "./OwnDataHint";
import { IntegerInput } from "./IntegerInput";
import { round2 } from "./phmax-zs-logic";
import { buildPhmaxSdExportRows } from "./phmax-sd-export-rows";
import {
  computeSdPhmaxTotalFromSnapshot,
  computeSdPhaMaxFromSnapshot,
} from "./sd/sd-compute-phmax-total-from-snapshot";
import {
  PHMAX_SD_BY_DEPARTMENTS,
  SD_MAX_DEPARTMENTS_IN_TABLE,
  calculateSchoolDruzinaPhmaxDetailed,
  calculateSchoolDruzinaPhmaxFromSummary,
  normalizeSchoolDruzinaInput,
  type SdDepartmentInput,
  type SdDetailedResult,
  getPhmaxSdBase,
  getPhmaxSdBreakdown,
  reducedPhmaxIfUnderStaffed,
  suggestedDepartmentsFromPupils,
} from "./phmax-sd-logic";
import { buildSdPlainNarrativeText } from "./phmax-sd-narrative";
import { computeSdStaffingSplitNv75, type SdVychovatelPpcFullHours } from "./phmax-sd-staffing-nv75";
import { createSdProductAuditProtocol } from "./phmax-product-audit";
import { comparePhmaxProductVariants } from "./phmax-product-compare";
import { downloadPhmaxProductAuditJson, downloadPhmaxProductCompareJson } from "./phmax-product-audit-download";
import {
  SD_HERO_EXAMPLE_META,
  SD_HERO_EXAMPLE_ORDER,
  sdHeroExampleSnapshot,
  type SdHeroExampleKey,
} from "./phmax-sd-hero-examples";

function formatSdHours(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSdFactor(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

const SD_GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    term: "PHmax (školní družina)",
    description: (
      <>
        Nejvyšší týdenní rozsah přímé pedagogické činnosti (hodiny) pro družinu podle celkového počtu oddělení.
        Tabulkové hodnoty jsou v příloze k{" "}
        <strong>vyhlášce č. 74/2005 Sb., o zájmovém vzdělávání</strong>.
      </>
    ),
  },
  {
    term: "PHAmax (speciální oddělení)",
    description: (
      <>
        Orientační strop týdenních hodin přímé pedagogické činnosti <strong>asistenta pedagoga</strong> ve
        speciálních odděleních (§ 16 odst. 9 školského zákona). Počítá se zvlášť od PHmax a nelze ho na PHmax
        „přepočítat“.
      </>
    ),
  },
  {
    term: "Běžné oddělení",
    description: (
      <>
        Oddělení, které <strong>není</strong> tvořeno pouze účastníky uvedenými v § 16 odst. 9 školského zákona
        (zákona č. 561/2004 Sb.).
      </>
    ),
  },
  {
    term: "Speciální oddělení (§ 16/9)",
    description: (
      <>
        Oddělení tvořené pouze účastníky podle § 16 odst. 9 školského zákona. Na ně se uplatňují zvláštní pravidla
        krácení v rámci výpočtu (vyhláška č. 74/2005 Sb., zejména § 10 odst. 7 a pravidla k PHAmax).
      </>
    ),
  },
  {
    term: "Výjimka z nejnižšího počtu",
    description: (
      <>
        Rozhodnutí zřizovatele / souhlasné stanovisko, které umožní nižší počet účastníků, než stanoví obecná pravidla.
        V kalkulačce ji modelujete zaškrtnutím výjimky; u speciálních oddělení se podle počtu účastníků uplatní koeficient
        krácení (např. 0,95 / 0,90 / 0,40 dle metodiky).
      </>
    ),
  },
  {
    term: "Souhrnný vs. detailní režim",
    description: (
      <>
        <strong>Souhrnný režim</strong> zadáváte běžná oddělení souhrnně a speciální případně jako další položky.{" "}
        <strong>Detailní režim</strong> zapisuje každé oddělení zvlášť (typ, počet účastníků, výjimka u řádku) – interně
        se vždy převádí na model po odděleních.
      </>
    ),
  },
  {
    term: "Krácení PHmax (průměr pod 20)",
    description: (
      <>
        Orientační krácení celkového PHmax, pokud není splněn průměr účastníků 1. stupně na oddělení (typicky pod 20)
        – viz § 10 odst. 2 vyhlášky č. 74/2005 Sb. V aplikaci se zobrazí koeficient a upravený součet.
      </>
    ),
  },
];

type PhmaxSdPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
  onOpenRychlyPhmax?: () => void;
};

const SD_HERO_EXAMPLE_SELECT_LEGEND =
  "Najeďte myší na řádek v seznamu pro stručný popis situace a orientační očekávaný výsledek. Čísla odpovídají výpočtu v této aplikaci (včetně přesných mezikroků; metodika někdy zaokrouhluje jinak).";

const SD_VIEW_MODE_LS_KEY = "phmax-sd-view-mode";
const SD_STORAGE_KEY = "edu-cz-sd-calculator-state";
const SD_NAMED_SNAPSHOTS_LS_KEY = "edu-cz-sd-named-snapshots-v1";
const SD_MAX_NAMED_SNAPSHOTS = 10;

type SdPersistedSnapshot = {
  pupils: number;
  manualDepts: boolean;
  departments: number;
  inputMode?: "summary" | "detail";
  summarySpecialDepartments?: { participants: number; specialExceptionGranted?: boolean }[];
  regularExceptionGranted?: boolean;
  specialExceptionGranted?: boolean;
  detailDepartments?: SdDepartmentInput[];
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
  /** Zvolený týdenní rozsah PPV pro „plný slot“ vychovatele (NV č. 75/2005 Sb., tab. 7.1, pásma 28 až 30 h). */
  vychovatelPpcHours?: SdVychovatelPpcFullHours;
  /**
   * Zda v modelu nejdřív odečíst týdenní rozsah pro vedoucího dle tab. 7.2, pak dělit zbytek dle 7.1.
   * Při `false` není 7.2 uplatněna; výchozí a starší uložení: `true` (nebo pole chybí).
   */
  separateVedoucihoDleT72?: boolean;
};

type NamedSdSnapshot = { id: string; name: string; savedAt: string; snapshot: SdPersistedSnapshot };

function readNamedSdSnapshotsFromLs(): NamedSdSnapshot[] {
  try {
    const raw = localStorage.getItem(SD_NAMED_SNAPSHOTS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: NamedSdSnapshot[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeNamedSdSnapshotsToLs(items: NamedSdSnapshot[]) {
  try {
    localStorage.setItem(SD_NAMED_SNAPSHOTS_LS_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

function parseSdSnapshot(data: unknown): SdPersistedSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const pupils = r.pupils;
  const manualDepts = r.manualDepts;
  const departments = r.departments;
  if (typeof pupils !== "number" || !Number.isFinite(pupils) || pupils < 0) return null;
  if (typeof manualDepts !== "boolean") return null;
  if (typeof departments !== "number" || !Number.isFinite(departments) || departments < 1) return null;
  const inputMode = r.inputMode === "detail" ? "detail" : "summary";
  const regularExceptionGranted = typeof r.regularExceptionGranted === "boolean" ? r.regularExceptionGranted : false;
  const specialExceptionGranted = typeof r.specialExceptionGranted === "boolean" ? r.specialExceptionGranted : false;
  const summarySpecialDepartments: { participants: number; specialExceptionGranted?: boolean }[] = Array.isArray(
    r.summarySpecialDepartments,
  )
    ? r.summarySpecialDepartments.reduce<{ participants: number; specialExceptionGranted?: boolean }[]>((acc, x) => {
        if (!x || typeof x !== "object") return acc;
        const o = x as Record<string, unknown>;
        if (typeof o.participants !== "number" || !Number.isFinite(o.participants) || o.participants < 0) return acc;
        acc.push({
          participants: o.participants,
          specialExceptionGranted:
            typeof o.specialExceptionGranted === "boolean" ? o.specialExceptionGranted : undefined,
        });
        return acc;
      }, [])
    : [];
  const detailDepartments = Array.isArray(r.detailDepartments)
    ? r.detailDepartments
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const o = x as Record<string, unknown>;
          if (o.kind !== "regular" && o.kind !== "special") return null;
          if (typeof o.participants !== "number" || !Number.isFinite(o.participants) || o.participants < 0) return null;
          return {
            kind: o.kind,
            participants: o.participants,
            participantsFirstStage:
              typeof o.participantsFirstStage === "number" && Number.isFinite(o.participantsFirstStage)
                ? o.participantsFirstStage
                : undefined,
            specialExceptionGranted:
              typeof o.specialExceptionGranted === "boolean" ? o.specialExceptionGranted : undefined,
          } as SdDepartmentInput;
        })
        .filter((x): x is SdDepartmentInput => x != null)
    : [];
  const schoolFirstStageClassCount =
    r.schoolFirstStageClassCount === 1 || r.schoolFirstStageClassCount === 2 || r.schoolFirstStageClassCount === 3
      ? r.schoolFirstStageClassCount
      : null;
  const vph = r.vychovatelPpcHours;
  const vychovatelPpcHours: SdVychovatelPpcFullHours | undefined =
    vph === 28 || vph === 29 || vph === 30 ? vph : undefined;
  const separateVedoucihoDleT72 = r.separateVedoucihoDleT72 === false ? false : true;
  return {
    pupils,
    manualDepts,
    departments,
    inputMode,
    summarySpecialDepartments,
    regularExceptionGranted,
    specialExceptionGranted,
    detailDepartments,
    schoolFirstStageClassCount,
    vychovatelPpcHours,
    separateVedoucihoDleT72,
  };
}

function loadSdStateFromStorage(): SdPersistedSnapshot {
  try {
    const raw = localStorage.getItem(SD_STORAGE_KEY);
    if (!raw) return { pupils: 0, manualDepts: false, departments: 1 };
    const parsed = parseSdSnapshot(JSON.parse(raw));
    return parsed ?? { pupils: 0, manualDepts: false, departments: 1 };
  } catch {
    return { pupils: 0, manualDepts: false, departments: 1 };
  }
}

export function PhmaxSdPage({ productView, setProductView, onOpenRychlyPhmax }: PhmaxSdPageProps) {
  const initial = loadSdStateFromStorage();
  const [pupils, setPupils] = useState(() => initial.pupils);
  const [manualDepts, setManualDepts] = useState(() => initial.manualDepts);
  const [departments, setDepartments] = useState(() => initial.departments);
  const [inputMode, setInputMode] = useState<"summary" | "detail">(() => initial.inputMode ?? "summary");
  const [regularExceptionGranted, setRegularExceptionGranted] = useState<boolean>(
    () => initial.regularExceptionGranted ?? false,
  );
  const [specialExceptionGranted, setSpecialExceptionGranted] = useState<boolean>(
    () => initial.specialExceptionGranted ?? false,
  );
  const [summarySpecialDepartments, setSummarySpecialDepartments] = useState<
    { participants: number; specialExceptionGranted?: boolean }[]
  >(() => initial.summarySpecialDepartments ?? []);
  const [summaryHasSpecial, setSummaryHasSpecial] = useState<boolean>(
    () => (initial.summarySpecialDepartments?.length ?? 0) > 0,
  );
  const [detailDepartments, setDetailDepartments] = useState<SdDepartmentInput[]>(
    () =>
      initial.detailDepartments ?? [
        { kind: "regular", participants: 0 },
      ],
  );
  const [schoolFirstStageClassCount, setSchoolFirstStageClassCount] = useState<1 | 2 | 3 | null>(
    () => initial.schoolFirstStageClassCount ?? null,
  );
  const detailHasSpecial = useMemo(() => detailDepartments.some((d) => d.kind === "special"), [detailDepartments]);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [uiNotice, setUiNotice] = useUiNotice();
  const setUiNoticeRef = useRef(setUiNotice);
  const [namedSnapshots, setNamedSnapshots] = useState<NamedSdSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");
  const { guideOpen, dismissGuide, toggleGuide, helpButtonRef } = useQuickOnboarding(PHMAX_SD_ONBOARDING_LS_KEY, {
    scrollAnchorId: "sd-quick-onboarding",
  });

  useEffect(() => {
    setUiNoticeRef.current = setUiNotice;
  }, [setUiNotice]);
  const [selectedSdHeroExample, setSelectedSdHeroExample] = useState<SdHeroExampleKey>("");
  const [displayDensity, setDisplayDensity] = useDisplayDensity();
  const [focusMode, setFocusMode] = useCalculatorFocusMode();
  const heroHeaderRef = useRef<HTMLElement>(null);
  const [viewMode, setViewMode] = useState<CalculatorViewMode>(() => {
    try {
      const stored = localStorage.getItem(SD_VIEW_MODE_LS_KEY);
      return stored === "expert" ? "expert" : "basic";
    } catch {
      return "basic";
    }
  });
  const [vychovatelPpcHours, setVychovatelPpcHours] = useState<SdVychovatelPpcFullHours>(() => {
    const v = initial.vychovatelPpcHours;
    return v === 28 || v === 29 || v === 30 ? v : 28;
  });
  const [separateVedoucihoDleT72, setSeparateVedoucihoDleT72] = useState(() => initial.separateVedoucihoDleT72 !== false);
  const selectedSdHeroExampleMeta =
    selectedSdHeroExample && selectedSdHeroExample in SD_HERO_EXAMPLE_META
      ? SD_HERO_EXAMPLE_META[selectedSdHeroExample as Exclude<SdHeroExampleKey, "">]
      : null;
  const sdHeroExampleGroups = useMemo(
    () => [
      {
        label: "Metodika – školní družina (orientačně)",
        options: heroExampleOptionsFromKeys(SD_HERO_EXAMPLE_ORDER, SD_HERO_EXAMPLE_META),
      },
    ],
    [],
  );
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const glossaryTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setNamedSnapshots(readNamedSdSnapshotsFromLs());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SD_VIEW_MODE_LS_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const suggested = useMemo(() => suggestedDepartmentsFromPupils(pupils), [pupils]);
  const effectiveDepts = manualDepts ? departments : suggested;

  const basePhmax = useMemo(() => getPhmaxSdBase(effectiveDepts), [effectiveDepts]);
  const reduction = useMemo(() => {
    if (basePhmax == null) return { adjusted: 0, factor: 1, applied: false };
    return reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: pupils,
      departmentCount: effectiveDepts,
      basePhmax,
    });
  }, [basePhmax, pupils, effectiveDepts]);

  const avgPerDept = effectiveDepts > 0 && pupils > 0 ? Math.round((pupils / effectiveDepts) * 100) / 100 : 0;

  const breakdown = useMemo(() => getPhmaxSdBreakdown(effectiveDepts), [effectiveDepts]);

  const detailedResult = useMemo<SdDetailedResult | null>(() => {
    try {
      if (inputMode === "summary") {
        return calculateSchoolDruzinaPhmaxFromSummary({
          regularDepartments: effectiveDepts,
          regularParticipantsTotal: pupils,
          regularExceptionGranted,
          specialExceptionGranted,
          schoolFirstStageClassCount,
          specialDepartments: summarySpecialDepartments,
        });
      }
      return calculateSchoolDruzinaPhmaxDetailed(
        normalizeSchoolDruzinaInput({
          departments: detailDepartments,
          regularExceptionGranted,
          // V detailním režimu řídíme výjimku pouze po řádcích (sloupec "Výjimka (spec.)").
          specialExceptionGranted: false,
          schoolFirstStageClassCount,
        }),
      );
    } catch {
      return null;
    }
  }, [
    inputMode,
    effectiveDepts,
    pupils,
    regularExceptionGranted,
    specialExceptionGranted,
    summarySpecialDepartments,
    detailDepartments,
    schoolFirstStageClassCount,
  ]);

  const sdAutosaveCore = useMemo(
    () => ({
      pupils,
      manualDepts,
      departments,
      inputMode,
      summarySpecialDepartments,
      regularExceptionGranted,
      specialExceptionGranted,
      detailDepartments,
      schoolFirstStageClassCount,
      vychovatelPpcHours,
      separateVedoucihoDleT72,
    }),
    [
      pupils,
      manualDepts,
      departments,
      inputMode,
      summarySpecialDepartments,
      regularExceptionGranted,
      specialExceptionGranted,
      detailDepartments,
      schoolFirstStageClassCount,
      vychovatelPpcHours,
      separateVedoucihoDleT72,
    ],
  );

  const sdPhmaxTotalFromEngine = useMemo(
    () => computeSdPhmaxTotalFromSnapshot(sdAutosaveCore),
    [sdAutosaveCore],
  );

  const tableWarning =
    effectiveDepts > SD_MAX_DEPARTMENTS_IN_TABLE
      ? `Tabulka PHmax v této aplikaci končí ${SD_MAX_DEPARTMENTS_IN_TABLE} odděleními – u vyššího počtu použijte přílohu vyhlášky.`
      : null;

  const methodikaVariantRows = useMemo(
    () =>
      PHMAX_SD_BY_DEPARTMENTS.map((base, idx) => {
        const deptCount = idx + 1;
        const avg = base / deptCount;
        return {
          deptCount,
          base,
          avg,
          v5: round2(base - avg * 0.05),
          v4: round2(base - avg * 0.1),
          vUnder4: round2(base - avg * 0.6),
        };
      }),
    [],
  );

  const methodikaBaseGridRows = useMemo(
    () =>
      PHMAX_SD_BY_DEPARTMENTS.map((total, idx) => {
        const deptCount = idx + 1;
        const rowHours = getPhmaxSdBreakdown(deptCount) ?? [];
        return { deptCount, total, rowHours };
      }),
    [],
  );
  const activeDeptCount = detailedResult?.totalDepartments ?? effectiveDepts;
  const activeMethodikaRow = useMemo(
    () => methodikaBaseGridRows.find((r) => r.deptCount === activeDeptCount) ?? null,
    [methodikaBaseGridRows, activeDeptCount],
  );
  const activeVariantColumn = useMemo<"v5" | "v4" | "vUnder4" | null>(() => {
    const pickFromParticipants = (p: number): "v5" | "v4" | "vUnder4" | null => {
      if (p >= 5 && p < 6) return "v5";
      if (p >= 4 && p < 5) return "v4";
      if (p < 4) return "vUnder4";
      return null;
    };

    if (inputMode === "summary") {
      const oneSpecial = summarySpecialDepartments.length === 1 ? summarySpecialDepartments[0] : null;
      if (!oneSpecial) return null;
      const hasExc =
        typeof oneSpecial.specialExceptionGranted === "boolean"
          ? oneSpecial.specialExceptionGranted
          : specialExceptionGranted;
      if (!hasExc) return null;
      return pickFromParticipants(oneSpecial.participants);
    }

    const specialRows = detailDepartments.filter((d) => d.kind === "special");
    if (specialRows.length !== 1) return null;
    const r = specialRows[0];
    const hasExc = typeof r.specialExceptionGranted === "boolean" ? r.specialExceptionGranted : specialExceptionGranted;
    if (!hasExc) return null;
    return pickFromParticipants(r.participants);
  }, [
    inputMode,
    summarySpecialDepartments,
    specialExceptionGranted,
    detailDepartments,
  ]);

  const sdPlainNarrative = useMemo(() => {
    if (pupils <= 0) return null;
    const phmaxHours = sdPhmaxTotalFromEngine;
    if (phmaxHours == null) return null;
    const totalDepartments = detailedResult != null ? detailedResult.totalDepartments : effectiveDepts;
    if (totalDepartments < 1) return null;
    const hasSpecialDepartments =
      detailedResult != null ? detailedResult.specialDepartments > 0 : Boolean(summaryHasSpecial);
    return buildSdPlainNarrativeText({
      pupils,
      hasSpecialDepartments,
      totalDepartments,
      phmaxHours,
    });
  }, [pupils, sdPhmaxTotalFromEngine, detailedResult, effectiveDepts, summaryHasSpecial]);

  const sdStaffingModel = useMemo(() => {
    if (pupils <= 0) return null;
    const phmaxHours = sdPhmaxTotalFromEngine;
    if (phmaxHours == null) return null;
    const depts = detailedResult != null ? detailedResult.totalDepartments : effectiveDepts;
    if (depts < 1) return null;
    return computeSdStaffingSplitNv75({
      totalPhmax: phmaxHours,
      departmentCount: depts,
      vychovatelFullPpc: vychovatelPpcHours,
      separateVedoucihoDleT72,
    });
  }, [pupils, sdPhmaxTotalFromEngine, detailedResult, effectiveDepts, vychovatelPpcHours, separateVedoucihoDleT72]);

  const sdVerdict = useMemo(() => {
    const activeDeptCount = inputMode === "detail" ? detailDepartments.length : effectiveDepts;
    if (pupils <= 0 || activeDeptCount <= 0) {
      return {
        tone: "warning" as const,
        label: "Doplňte základní vstupy",
        detail: "Pro výpočet zadejte počet účastníků a počet oddělení (nebo detailní oddělení).",
      };
    }
    if (tableWarning) {
      return {
        tone: "warning" as const,
        label: "Na hraně metodické tabulky",
        detail: tableWarning,
      };
    }
    return {
      tone: "ok" as const,
      label: "Výpočet je připravený",
      detail: "PHmax je spočtený pro aktuální režim. Další krok: uložte variantu nebo exportujte podklady.",
    };
  }, [detailDepartments.length, effectiveDepts, inputMode, pupils, tableWarning]);

  const sdWorkflow = useMemo(() => {
    const activeDeptCount = inputMode === "detail" ? detailDepartments.length : effectiveDepts;
    if (pupils <= 0 || activeDeptCount <= 0) {
      return {
        recommendedStep: "Doplňte počet účastníků a oddělení.",
        steps: [
          { label: "Vyplnit základní vstupy", state: "active" as const },
          { label: "Zkontrolovat výsledek PHmax", state: "todo" as const },
          { label: "Uložit nebo exportovat výsledek", state: "todo" as const },
        ],
      };
    }
    if (tableWarning) {
      return {
        recommendedStep: "Upravte vstupy tak, aby odpovídaly metodické tabulce.",
        steps: [
          { label: "Vyplnit základní vstupy", state: "done" as const },
          { label: "Opravit vstupy mimo tabulku", state: "active" as const },
          { label: "Uložit nebo exportovat výsledek", state: "todo" as const },
        ],
      };
    }
    return {
      recommendedStep: "Výpočet je připraven k uložení nebo exportu.",
      steps: [
        { label: "Vyplnit základní vstupy", state: "done" as const },
        { label: "Zkontrolovat výsledek PHmax", state: "done" as const },
        { label: "Uložit nebo exportovat výsledek", state: "active" as const },
      ],
    };
  }, [detailDepartments.length, effectiveDepts, inputMode, pupils, tableWarning]);

  const exportRows = useMemo(
    () =>
      buildPhmaxSdExportRows({
        pupils,
        effectiveDepts,
        manualDepts,
        suggested,
        avgPerDept,
        basePhmax,
        reduction,
        breakdown,
        tableWarning,
        detailed: detailedResult,
        staffingNv75:
          sdStaffingModel != null
            ? { vychovatelPpc: vychovatelPpcHours, model: sdStaffingModel }
            : null,
      }),
    [
      pupils,
      effectiveDepts,
      manualDepts,
      suggested,
      avgPerDept,
      basePhmax,
      reduction,
      breakdown,
      tableWarning,
      detailedResult,
      sdStaffingModel,
      vychovatelPpcHours,
    ]
  );

  const handleExportCsv = useCallback(() => {
    const rows = [...buildExportMetaRows("sd"), EXPORT_CSV_SEPARATOR_ROW, ...exportRows];
    downloadTextFile(exportFilenameStamped("phmax-sd", "csv"), exportCsvLocalized(rows), "text/csv;charset=utf-8");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", "PHmax – školní družina"],
          ...buildExportMetaRows("sd"),
          ["Vytvořil", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
        ],
        valueRows: exportRows,
        filename: exportFilenameStamped("phmax-sd", "xlsx"),
      });
      setUiNoticeRef.current("Byl stažen soubor Excel (XLSX).");
    } catch (e) {
      console.error(e);
      setUiNoticeRef.current(`Export do Excelu se nepodařil. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  const buildSdSnapshot = useCallback((): SdPersistedSnapshot & {
    _phmaxAuditTotals?: { totalPhmax: number; totalPha: number; tab: "phmax" };
  } => {
    const totalPhmax = computeSdPhmaxTotalFromSnapshot(sdAutosaveCore);
    const totalPha = computeSdPhaMaxFromSnapshot(sdAutosaveCore);
    if (totalPhmax == null) return sdAutosaveCore;
    return {
      ...sdAutosaveCore,
      _phmaxAuditTotals: { totalPhmax, totalPha: totalPha ?? 0, tab: "phmax" },
    };
  }, [sdAutosaveCore]);

  const applySdPersisted = useCallback((next: SdPersistedSnapshot) => {
    setPupils(next.pupils);
    setManualDepts(next.manualDepts);
    setDepartments(next.departments);
    setInputMode(next.inputMode ?? "summary");
    setSummarySpecialDepartments(next.summarySpecialDepartments ?? []);
    setRegularExceptionGranted(next.regularExceptionGranted ?? false);
    setSpecialExceptionGranted(next.specialExceptionGranted ?? false);
    setDetailDepartments(next.detailDepartments ?? [{ kind: "regular", participants: 0 }]);
    setSchoolFirstStageClassCount(next.schoolFirstStageClassCount ?? null);
    setVychovatelPpcHours(
      next.vychovatelPpcHours === 28 || next.vychovatelPpcHours === 29 || next.vychovatelPpcHours === 30
        ? next.vychovatelPpcHours
        : 28,
    );
    setSeparateVedoucihoDleT72(next.separateVedoucihoDleT72 !== false);
    setSummaryHasSpecial((next.summarySpecialDepartments?.length ?? 0) > 0);
  }, []);

  const applySdSnapshot = useCallback(
    (data: unknown) => {
      const next = parseSdSnapshot(data);
      if (next) {
        setSelectedSdHeroExample("");
        applySdPersisted(next);
        setUiNoticeRef.current("Data byla obnovena.");
      } else {
        setUiNoticeRef.current(MSG_DATA_UNEXPECTED_SHAPE);
      }
    },
    [applySdPersisted],
  );

  const loadSdHeroExample = useCallback(
    (key: SdHeroExampleKey) => {
      setSelectedSdHeroExample(key);
      if (!key) return;
      applySdPersisted(sdHeroExampleSnapshot(key) as SdPersistedSnapshot);
      setUiNoticeRef.current("Načten ukázkový příklad z metodiky.");
    },
    [applySdPersisted],
  );

  const saveSdSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(buildSdSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
      setUiNoticeRef.current("Rozpracované údaje byly uloženy.");
    } catch {
      setUiNoticeRef.current(`Uložení se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [buildSdSnapshot]);

  const restoreSdSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(SD_STORAGE_KEY);
      if (!raw) {
        setUiNoticeRef.current(MSG_NO_LOCAL_AUTOSAVE_DATA);
        return;
      }
      applySdSnapshot(JSON.parse(raw));
    } catch {
      setUiNoticeRef.current(`Obnovení uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [applySdSnapshot]);

  useEffect(() => {
    const onImport = () => restoreSdSnapshot();
    window.addEventListener(PHMAX_IMPORT_APPLIED_EVENT, onImport);
    return () => window.removeEventListener(PHMAX_IMPORT_APPLIED_EVENT, onImport);
  }, [restoreSdSnapshot]);

  const saveNamedSnapshot = useCallback(() => {
    const name = namedSaveName.trim() || new Date().toLocaleString("cs-CZ");
    const id = `n-${Date.now()}`;
    const item: NamedSdSnapshot = { id, name, savedAt: new Date().toISOString(), snapshot: buildSdSnapshot() };
    setNamedSnapshots((prev) => {
      const next = [item, ...prev].slice(0, SD_MAX_NAMED_SNAPSHOTS);
      writeNamedSdSnapshotsToLs(next);
      return next;
    });
    setNamedSaveName("");
    setUiNoticeRef.current(namedBackupSavedNotice(name, SD_MAX_NAMED_SNAPSHOTS));
  }, [buildSdSnapshot, namedSaveName]);

  const restoreNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_FIRST);
      return;
    }
    applySdSnapshot(item.snapshot);
    setUiNoticeRef.current(`Obnovena záloha „${item.name}“.`);
  }, [applySdSnapshot, namedSnapshots, selectedNamedId]);

  const deleteNamedSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_TO_DELETE);
      return;
    }
    const toDelete = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!toDelete) return;
    if (!confirmDestructive(msgConfirmDeleteNamedBackup(toDelete.name))) return;
    setNamedSnapshots((prev) => {
      const next = prev.filter((x) => x.id !== selectedNamedId);
      writeNamedSdSnapshotsToLs(next);
      return next;
    });
    setSelectedNamedId("");
    setUiNoticeRef.current("Pojmenovaná záloha byla smazána.");
  }, [namedSnapshots, selectedNamedId]);

  const clearSdStoredSnapshot = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_CLEAR_BROWSER_STORAGE)) return;
    try {
      localStorage.removeItem(SD_STORAGE_KEY);
      setLastSavedAt("");
      setUiNoticeRef.current("Uložená data v prohlížeči byla vymazána.");
    } catch {
      setUiNoticeRef.current(`Vymazání uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, []);

  const resetSdAll = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_RESET_FORM_ALL)) return;
    setPupils(0);
    setManualDepts(false);
    setDepartments(1);
    setInputMode("summary");
    setSummarySpecialDepartments([]);
    setRegularExceptionGranted(false);
    setSpecialExceptionGranted(false);
    setDetailDepartments([{ kind: "regular", participants: 0 }]);
    setSchoolFirstStageClassCount(null);
    setSummaryHasSpecial(false);
    setSelectedSdHeroExample("");
    setVychovatelPpcHours(28);
    setSeparateVedoucihoDleT72(true);
    setUiNoticeRef.current("Všechna vstupní data kalkulačky byla vymazána.");
  }, []);

  const buildSdSummaryText = useCallback(() => {
    const phmaxLine =
      detailedResult != null
        ? `PHmax (detailní model): ${formatSdHours(detailedResult.finalPhmax)}`
        : basePhmax != null
          ? `PHmax (po krácení): ${formatSdHours(reduction.adjusted)}`
          : "PHmax: –";
    const baseLine =
      detailedResult != null
        ? `PHmax (základ z tabulky): ${formatSdHours(detailedResult.basePhmax)}`
        : basePhmax != null
          ? `PHmax (základ z tabulky): ${formatSdHours(basePhmax)}`
          : "";
    const kraceni = reduction.applied
      ? `ano (${(Math.round(reduction.factor * 1000) / 10).toLocaleString("cs-CZ")} %)`
      : "ne";
    const staffingBlock =
      sdStaffingModel != null
        ? (() => {
            const m = sdStaffingModel;
            return [
              "",
              "Model úvazků dle nařízení vlády č. 75/2005 (příl. č. 1, orientačně):",
              `Vedoucí vychovatel dle tab. 7.2 v modelu: ${
                m.separateVedoucihoDleT72 ? "ano (před dělením ostatním podle 7.1)" : "ne (dělí se jen dle 7.1, bez kroku 7.2)"
              }`,
              `Zvolený plný týdenní rozsah PPV (tab. 7.1): ${vychovatelPpcHours} h/týd.`,
              m.headNote ? m.headNote : null,
              m.inconsistent && m.inconsistencyMessage ? m.inconsistencyMessage : null,
              `Vedoucí vychovatel (tab. 7.2): ${formatSdHours(m.headVedouciHours)} h/týd.`,
              m.separateVedoucihoDleT72
                ? `PHmax pro ostatní vychovatele: ${formatSdHours(m.forOthersPhmax)} h/týd.`
                : `Celé PHmax pro vychovatele (PPV, tab. 7.1): ${formatSdHours(m.forOthersPhmax)} h/týd.`,
              m.separateVedoucihoDleT72
                ? `Ostatní: plné úvazky: ${m.fullTimeSlots}×${vychovatelPpcHours} h`
                : `Vychovatelé: plné úvazky: ${m.fullTimeSlots}×${vychovatelPpcHours} h`,
              `${m.separateVedoucihoDleT72 ? "Ostatní" : "Vychovatelé"}: zkrácený úvazek: ${formatSdHours(
                m.partialHours,
              )} h (${m.partialPercentOfFull.toLocaleString("cs-CZ", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} % vůči ${vychovatelPpcHours} h)`,
            ] as (string | null)[];
          })()
        : [];

    return [
      "Shrnutí – PHmax, školní družina",
      "",
      `Čas: ${new Date().toLocaleString("cs-CZ")}`,
      `Režim vstupu: ${inputMode === "summary" ? "souhrnný" : "detailní po odděleních"}`,
      `Účastníci (1. st.): ${pupils}`,
      `Oddělení (výpočet): ${
        detailedResult != null ? detailedResult.totalDepartments : effectiveDepts
      }${manualDepts ? " (ruční zadání)" : ` (navrženo ${suggested})`}`,
      baseLine,
      phmaxLine,
      detailedResult != null
        ? `PHAmax speciální oddělení (orientačně): ${formatSdHours(detailedResult.finalPhaMax)}`
        : "",
      `Krácení § 10 odst. 2: ${kraceni}`,
      ...staffingBlock,
      "",
      APP_AUTHOR_CREDIT_LINE,
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    pupils,
    effectiveDepts,
    manualDepts,
    suggested,
    basePhmax,
    reduction,
    detailedResult,
    inputMode,
    sdStaffingModel,
    vychovatelPpcHours,
  ]);

  const copySdSummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildSdSummaryText());
      setUiNoticeRef.current("Shrnutí bylo zkopírováno do schránky.");
    } catch {
      setUiNoticeRef.current(`Kopírování do schránky se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [buildSdSummaryText]);

  const printSdSummary = useCallback(() => {
    const result = printPlainSummaryDocument({
      pageTitle: "Shrnutí PHmax ŠD",
      heading: "Shrnutí – školní družina",
      plainSummary: buildSdSummaryText(),
    });
    if (!result.ok) {
      setUiNoticeRef.current(
        result.reason === "blocked" ? PRINT_SUMMARY_POPUP_BLOCKED_MESSAGE : "Tisk shrnutí se nepodařil otevřít.",
      );
    }
  }, [buildSdSummaryText]);

  const buildSdAuditProtocol = useCallback(() => {
    return createSdProductAuditProtocol({
      pupilsFirstGrade: pupils,
      manualDepts,
      departments,
    });
  }, [pupils, manualDepts, departments]);

  const handleExportAuditJson = useCallback(() => {
    downloadPhmaxProductAuditJson(buildSdAuditProtocol(), "sd");
    setUiNoticeRef.current("Stažen auditní protokol (JSON).");
  }, [buildSdAuditProtocol]);

  const handleCompareWithNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_TO_COMPARE);
      return;
    }
    const protocolNamed = createSdProductAuditProtocol({
      pupilsFirstGrade: item.snapshot.pupils,
      manualDepts: item.snapshot.manualDepts,
      departments: item.snapshot.departments,
    });
    const cmp = comparePhmaxProductVariants([
      { id: "current", label: "Aktuální stav", protocol: buildSdAuditProtocol() },
      { id: "named", label: item.name, protocol: protocolNamed },
    ]);
    downloadPhmaxProductCompareJson(cmp, "sd");
    setUiNoticeRef.current(`Staženo srovnání: aktuální stav vs „${item.name}“ (JSON).`);
  }, [namedSnapshots, selectedNamedId, buildSdAuditProtocol]);

  const sdComparePreview = useMemo(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) return null;
    const protocolNamed = createSdProductAuditProtocol({
      pupilsFirstGrade: item.snapshot.pupils,
      manualDepts: item.snapshot.manualDepts,
      departments: item.snapshot.departments,
    });
    return comparePhmaxProductVariants([
      { id: "current", label: "Aktuální stav", protocol: buildSdAuditProtocol() },
      { id: "named", label: item.name, protocol: protocolNamed },
    ]);
  }, [namedSnapshots, selectedNamedId, buildSdAuditProtocol]);

  useEffect(() => {
    if (!summaryHasSpecial && summarySpecialDepartments.length > 0) {
      setSummarySpecialDepartments([]);
      setSpecialExceptionGranted(false);
    }
  }, [summaryHasSpecial, summarySpecialDepartments.length]);

  useEffect(() => {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(buildSdSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    } catch {
      /* ignore */
    }
  }, [buildSdSnapshot]);

  const sdPhmaxDisplay = sdPhmaxTotalFromEngine != null ? formatSdHours(sdPhmaxTotalFromEngine) : "–";

  const sdBasicWizardActive = viewMode === "basic";
  const sdHasInputIssue = sdVerdict.tone !== "ok";
  const sdScrollToInputs = useMemo(() => createSdScrollToInputs(), []);
  const sdHasData = sdPhmaxTotalFromEngine != null;
  const sdNextAction = useMemo(
    () =>
      buildCalculatorNextAction({
        verdict: sdVerdict,
        hasData: sdHasData,
        onFix: sdHasInputIssue ? sdScrollToInputs : undefined,
        onExport: sdHasData ? handleExportCsv : undefined,
        onOpenExamples: () => focusCalculatorElementById(SD_HERO_EXAMPLE_SELECT_ID),
      }),
    [sdVerdict, sdHasData, sdHasInputIssue, sdScrollToInputs, handleExportCsv],
  );
  const { step: sdWizardStep, goToStep: goToSdWizardStep, handleBack: handleSdWizardBack, handleNext: handleSdWizardNext } =
    useProductBasicWizard({
      lsKey: SD_BASIC_WIZARD_LS_KEY,
      steps: SD_BASIC_WIZARD_STEPS,
      active: sdBasicWizardActive,
    });

  useFocusExampleOnMount(SD_HERO_EXAMPLE_SELECT_ID);
  useFocusInputsOnMount(sdScrollToInputs);

  const sdTocSections = [
    { id: "sd-vysledek", label: "Výsledek PHmax" },
    { id: "sd-vstupy", label: "Vstupy a oddělení" },
  ] as const;

  return (
    <div className={`${calculatorShellClassName(viewMode, displayDensity, focusMode)} app-shell--with-toc${sdBasicWizardActive ? ` product-basic-wizard-active sd-wizard-step-${sdWizardStep}` : ""}${sdHasInputIssue ? " app-shell--validation-hint" : ""}`}>
      <SdHeroHeader
        heroHeaderRef={heroHeaderRef}
        productView={productView}
        setProductView={setProductView}
        onOpenRychlyPhmax={onOpenRychlyPhmax}
        viewMode={viewMode}
        setViewMode={setViewMode}
        displayDensity={displayDensity}
        setDisplayDensity={setDisplayDensity}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        glossaryTriggerRef={glossaryTriggerRef}
        glossaryOpen={glossaryOpen}
        setGlossaryOpen={setGlossaryOpen}
        guideOpen={guideOpen}
        toggleGuide={toggleGuide}
        helpButtonRef={helpButtonRef}
        phmaxDisplay={sdPhmaxDisplay}
        pupils={pupils}
        departmentCount={inputMode === "detail" ? detailDepartments.length : effectiveDepts}
        verdictLabel={sdVerdict.label}
        verdictTone={sdVerdict.tone}
        toolbar={{
          selectedExample: selectedSdHeroExample,
          exampleGroups: sdHeroExampleGroups,
          exampleLegend: SD_HERO_EXAMPLE_SELECT_LEGEND,
          selectedExampleMetaTitle: selectedSdHeroExampleMeta?.title ?? null,
          onExampleChange: (key) => loadSdHeroExample(key),
          maxNamedSnapshots: SD_MAX_NAMED_SNAPSHOTS,
          onSaveSnapshot: saveSdSnapshotManually,
          onExportCsv: handleExportCsv,
          onExportXlsx: handleExportXlsx,
          xlsxExportBusy,
          onPrintSummary: printSdSummary,
          onRestoreSnapshot: restoreSdSnapshot,
          namedSaveName,
          setNamedSaveName,
          namedSnapshots,
          selectedNamedId,
          setSelectedNamedId,
          onSaveNamedSnapshot: saveNamedSnapshot,
          onRestoreNamedSnapshot: restoreNamedSnapshot,
          onDeleteNamedSnapshot: deleteNamedSnapshot,
          onCompareWithNamedSnapshot: handleCompareWithNamedSnapshot,
          onExportAuditJson: handleExportAuditJson,
          comparePreview: sdComparePreview,
          onCopySummary: copySdSummary,
          onClearStored: clearSdStoredSnapshot,
          onResetAll: resetSdAll,
        }}
      />

      <SdQuickOnboardingGuide open={guideOpen} onDismiss={dismissGuide} returnFocusRef={helpButtonRef} />
      {sdBasicWizardActive ? (
        <SdBasicWizard
          step={sdWizardStep}
          onStartEmptyForm={resetSdAll}
          inputIssueFix={sdHasInputIssue ? { onFix: sdScrollToInputs } : undefined}
          onStepChange={goToSdWizardStep}
          onBack={handleSdWizardBack}
          onNext={handleSdWizardNext}
        />
      ) : null}

      {sdHasInputIssue ? (
        <CalculatorInputIssueBanner {...calculatorInputIssueBannerFromVerdict(sdVerdict, sdScrollToInputs)} />
      ) : null}

      {sdBasicWizardActive ? (
        <CalculatorModuleQuickTour
          moduleLabel="ŠD"
          storageKey={SD_QUICK_TOUR_LS_KEY}
          steps={SD_QUICK_TOUR_STEPS}
          exampleSelectId={SD_HERO_EXAMPLE_SELECT_ID}
        />
      ) : null}
      <CalculatorNextActionStrip action={sdNextAction} />

      <SdCalculatorShell
        workspaceDockLabel={CALCULATOR_WORKSPACE_DOCK_LABEL}
        sticky={{
          anchorRef: heroHeaderRef,
          primaryLabel: "PHmax",
          primaryValue: sdPhmaxDisplay,
          statusText: sdVerdict.label,
          tone: sdVerdict.tone,
          onSave: saveSdSnapshotManually,
          onExport: handleExportCsv,
        }}
        dock={{
          sdVerdictTone: sdVerdict.tone,
          sdPhmaxDisplay,
          pupils,
          inputMode,
          detailDepartments,
          effectiveDepts,
          reductionApplied: reduction.applied,
          reductionFactor: reduction.factor,
          sdVerdictLabel: sdVerdict.label,
          sdVerdictDetail: sdVerdict.detail,
          sdBasicWizardActive,
          sdWorkflowSteps: sdWorkflow.steps,
          viewMode,
          sdComparePreview,
          selectedNamedId,
          sdHasInputIssue,
          onGoToIssue: () => scrollToFirstNeedsAttentionSection(["sd-vstupy"]),
          saveSdSnapshotManually,
          handleExportCsv,
          handleCompareWithNamedSnapshot,
        }}
        main={
          <>

      <section className={`card section-card section-card--sd${sectionNeedsAttentionClass(sdHasInputIssue)}`} data-section="sd-vstupy" data-wizard-step="2">
        <h2 className="section-title">Vstupy</h2>
        <OwnDataHint variant="form" />
        <InputOutputLegend />
        <p className="muted-text" style={{ marginTop: 10 }}>
          Postup 1–2–3: <strong>1)</strong> zvolte režim (souhrnný/detailní), <strong>2)</strong> vyplňte vstupy
          (účastníci, oddělení, výjimky), <strong>3)</strong> zkontrolujte výsledek a případné krácení.
        </p>

        <div className="checks" style={{ marginTop: 12 }}>
          <label>
            <input
              type="radio"
              name="sd-input-mode"
              checked={inputMode === "summary"}
              onChange={() => setInputMode("summary")}
            />
            Souhrnný režim
          </label>
          <label>
            <input
              type="radio"
              name="sd-input-mode"
              checked={inputMode === "detail"}
              onChange={() => setInputMode("detail")}
            />
            Detailní režim po odděleních
          </label>
        </div>

        <div className="grid two">
          <div className="subcard">
            <h3>Účastníci</h3>
            <NumberField
              label="Počet přihlášených účastníků (žáci 1. st. ZŠ, pravidelná docházka)"
              value={pupils}
              onChange={(v) => setPupils(Math.max(0, Math.round(v)))}
            />
            {pupils <= 0 ? (
              <p className="muted-text field-validation-warning">
                {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} Bez počtu účastníků nelze spočítat PHmax.
              </p>
            ) : null}
            <p className="muted-text" style={{ marginTop: 12, fontSize: "0.88rem" }}>
              Navržený počet oddělení (÷ 27, nahoru): <strong>{suggested}</strong>
              {pupils > 0
                ? ` → průměr při ${suggested} odd.: ${(pupils / suggested).toLocaleString("cs-CZ", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} účastníků`
                : null}
            </p>
          </div>

          <div className="subcard">
            <h3>Oddělení</h3>
            {inputMode === "summary" ? (
              <>
                <p className="muted-text sd-summary-dept-hint" style={{ margin: "0 0 10px", lineHeight: 1.45 }}>
                  V souhrnném režimu zadáváte, <strong>pro kolik běžných oddělení</strong> školní družiny počítáte PHmax
                  (automaticky z účastníků ÷ 27, nebo ručně zaškrtnutím níže).
                </p>
                <label className="checks" style={{ marginTop: 0 }}>
                  <span>
                    <input
                      type="checkbox"
                      checked={manualDepts}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setManualDepts(on);
                        if (on) setDepartments(Math.max(1, suggested));
                      }}
                    />
                    Zadat počet oddělení ručně (v souhrnném režimu = počet běžných oddělení)
                  </span>
                </label>
                {manualDepts ? (
                  <NumberField
                    label="Počet běžných oddělení školní družiny"
                    min={1}
                    value={departments}
                    onChange={(v) => setDepartments(Math.max(1, Math.round(v)))}
                  />
                ) : null}
                {manualDepts && departments <= 0 ? (
                  <p className="muted-text field-validation-warning">
                    {INLINE_VALIDATION_MSG_POSITIVE_INTEGER} V souhrnném režimu musí být aspoň jedno běžné oddělení.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="muted-text" style={{ marginTop: 0 }}>
                V detailním režimu se celkový počet oddělení určí automaticky podle počtu řádků v tabulce oddělení.
              </p>
            )}
            <label className="field" style={{ marginTop: 12 }}>
              <span className="field__label">Pokud má ŠD 1 běžné oddělení: škola má kolik tříd 1. stupně?</span>
              <select
                className="input"
                value={schoolFirstStageClassCount == null ? "" : String(schoolFirstStageClassCount)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSchoolFirstStageClassCount(v === "1" ? 1 : v === "2" ? 2 : v === "3" ? 3 : null);
                }}
              >
                <option value="">Nepoužít zvláštní minimum (obecně 20)</option>
                <option value="1">Škola s 1 třídou 1. stupně (minimum 5)</option>
                <option value="2">Škola se 2 třídami 1. stupně (minimum 15)</option>
                <option value="3">Škola se 3 třídami 1. stupně (minimum 18)</option>
              </select>
            </label>
          </div>
        </div>

        <FieldWhyPhmaxDetails>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              <strong>Počet účastníků</strong> a rozdělení do oddělení vstupuje do orientačního výpočtu podle přílohy k vyhlášce č. 74/2005 Sb. – určuje se z nich počet skupin vedených pedagogem.
            </li>
            <li>
              Průměr účastníků na oddělení pod levelem z metodiky může spustit <strong>orientační krácení PHmax podle § 10 odst. 2</strong> téže vyhlášky.
            </li>
            <li>
              <strong>Volby u jednoho oddělení a počtu tříd 1. stupně školy</strong> mění použité minimum skupin při hodnocení plnění.
            </li>
          </ul>
        </FieldWhyPhmaxDetails>

        {inputMode === "summary" ? (
          <div className="subcard" style={{ marginTop: 16 }}>
            <h3>Speciální oddělení</h3>
            <p className="muted-text" style={{ marginTop: 4, fontSize: "0.82rem" }}>
              Režim pro oddělení tvořená pouze účastníky se speciálními vzdělávacími potřebami.
            </p>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={summaryHasSpecial}
                  onChange={(e) => setSummaryHasSpecial(e.target.checked)}
                />
                <span title="Dle § 16 odst. 9 školského zákona">Družina obsahuje speciální oddělení</span>
              </label>
            </div>
            <div className="checks" style={{ marginTop: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={regularExceptionGranted}
                  onChange={(e) => setRegularExceptionGranted(e.target.checked)}
                />
                <span title="Pravidla krácení PHmax dle § 10 odst. 2 a 3 vyhlášky č. 74/2005 Sb.">
                  Výjimka u běžných oddělení (krácení PHmax)
                </span>
              </label>
            </div>
            {summaryHasSpecial ? (
              <>
                <div className="checks" style={{ marginTop: 8 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={specialExceptionGranted}
                      onChange={(e) => setSpecialExceptionGranted(e.target.checked)}
                    />
                    <span title="Pravidla pro oddělení dle § 10 odst. 7 vyhlášky č. 74/2005 Sb. a § 16 odst. 9 školského zákona">
                      Výjimka u speciálních oddělení (krácení PHmax i PHAmax)
                    </span>
                  </label>
                </div>
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() =>
                      setSummarySpecialDepartments((prev) => [...prev, { participants: 0, specialExceptionGranted: undefined }])
                    }
                  >
                    Přidat speciální oddělení
                  </button>
                </div>
                {summarySpecialDepartments.length > 0 ? (
                  <div className="stack" style={{ marginTop: 12 }}>
                    {summarySpecialDepartments.map((row, i) => (
                      <div key={i} className="grid two" style={{ gap: 10, alignItems: "end" }}>
                        <NumberField
                          label={`Speciální oddělení ${i + 1} – počet účastníků`}
                          value={row.participants}
                          onChange={(v) =>
                            setSummarySpecialDepartments((prev) =>
                              prev.map((x, idx) =>
                                idx === i ? { ...x, participants: Math.max(0, Math.round(v)) } : x,
                              ),
                            )
                          }
                        />
                        <div className="checks">
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(row.specialExceptionGranted)}
                              onChange={(e) =>
                                setSummarySpecialDepartments((prev) =>
                                  prev.map((x, idx) =>
                                    idx === i ? { ...x, specialExceptionGranted: e.target.checked } : x,
                                  ),
                                )
                              }
                            />
                            Lokální výjimka pro toto oddělení
                          </label>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setSummarySpecialDepartments((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            Odstranit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text" style={{ marginTop: 10 }}>
                    Zatím bez zadaného speciálního oddělení.
                  </p>
                )}
              </>
            ) : (
              <p className="muted-text" style={{ marginTop: 10 }}>
                Speciální oddělení nejsou aktivní. Pokud je nepoužíváte, další varianty se skryjí.
              </p>
            )}
          </div>
        ) : (
          <div className="subcard" style={{ marginTop: 16 }}>
            <h3>Detailní evidence oddělení</h3>
            <div style={{ marginTop: 8 }}>
              <div className="sd-dept-templates" role="group" aria-label="Rychlé šablony oddělení">
                <button
                  type="button"
                  className="btn sd-dept-templates__btn"
                  onClick={() => {
                    setInputMode("detail");
                    setDetailDepartments([{ kind: "regular", participants: 0 }]);
                  }}
                  title="Předvyplní 1 běžné oddělení"
                >
                  Jen běžná
                </button>
                <button
                  type="button"
                  className="btn sd-dept-templates__btn"
                  onClick={() => {
                    setInputMode("detail");
                    setDetailDepartments([{ kind: "special", participants: 0, specialExceptionGranted: false }]);
                  }}
                  title="Předvyplní 1 speciální oddělení (§ 16 odst. 9 školského zákona)"
                >
                  Jen speciální
                </button>
                <button
                  type="button"
                  className="btn sd-dept-templates__btn"
                  onClick={() => {
                    setInputMode("detail");
                    setDetailDepartments([
                      { kind: "regular", participants: 0 },
                      { kind: "special", participants: 0, specialExceptionGranted: false },
                    ]);
                  }}
                  title="Předvyplní kombinaci běžného a speciálního oddělení"
                >
                  Kombinace
                </button>
              </div>
              <p className="muted-text" style={{ marginTop: 8, fontSize: "0.84rem" }}>
                Šablony předvyplní strukturu oddělení; počty účastníků a výjimky pak upravte podle skutečnosti.
              </p>
            </div>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={regularExceptionGranted}
                  onChange={(e) => setRegularExceptionGranted(e.target.checked)}
                />
                <span title="Pravidla krácení PHmax dle § 10 odst. 2 a 3 vyhlášky č. 74/2005 Sb.">
                  Výjimka u běžných oddělení (krácení PHmax)
                </span>
              </label>
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setDetailDepartments((prev) => [...prev, { kind: "regular", participants: 0 }])}
              >
                Přidat oddělení
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <ScrollGrabRegion className="app-table-wrap app-table-wrap--spaced">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Oddělení</th>
                    <th>Typ</th>
                    <th>Účastníci</th>
                    <th>Výjimka (spec., pro řádek)</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {detailDepartments.map((row, i) => (
                    <tr key={i} data-sd-dept-id={i}>
                      <td>{i + 1}</td>
                      <td>
                        <select
                          className="input"
                          value={row.kind}
                          onChange={(e) =>
                            setDetailDepartments((prev) =>
                              prev.map((x, idx) =>
                                idx === i ? { ...x, kind: e.target.value as "regular" | "special" } : x,
                              ),
                            )
                          }
                        >
                          <option value="regular">Běžné</option>
                          <option value="special">Speciální (§ 16/9)</option>
                        </select>
                      </td>
                      <td>
                        <IntegerInput
                          className="input"
                          min={0}
                          value={row.participants}
                          onChange={(participants) =>
                            setDetailDepartments((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? { ...x, participants: Math.max(0, Math.round(participants)) }
                                  : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>
                        {row.kind === "special" ? (
                          <input
                            type="checkbox"
                            checked={Boolean(row.specialExceptionGranted)}
                            onChange={(e) =>
                              setDetailDepartments((prev) =>
                                prev.map((x, idx) =>
                                  idx === i ? { ...x, specialExceptionGranted: e.target.checked } : x,
                                ),
                              )
                            }
                          />
                        ) : (
                          "–"
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() =>
                            setDetailDepartments((prev) =>
                              prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
                            )
                          }
                        >
                          Odstranit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </ScrollGrabRegion>
            </div>
            {!detailHasSpecial ? (
              <p className="muted-text" style={{ marginTop: 10 }}>
                Tip: přepněte některý řádek na „Speciální (§ 16/9)“, pokud chcete počítat i speciální režim.
              </p>
            ) : null}
          </div>
        )}


        {viewMode === "expert" && detailedResult != null ? (
          <div
            className="subcard"
            style={{ marginTop: 14, borderLeft: "5px solid #22c55e", background: "rgba(34, 197, 94, 0.06)" }}
          >
            {detailedResult.regularDepartments > 0 && detailedResult.specialDepartments === 0 ? (
              <p style={{ margin: 0 }}>
                <strong>Hlavní výsledek (jen běžná oddělení):</strong> PHmax{" "}
                <strong>{formatSdHours(detailedResult.finalPhmax)} h</strong>
              </p>
            ) : null}
            {detailedResult.regularDepartments === 0 && detailedResult.specialDepartments > 0 ? (
              <p style={{ margin: 0 }}>
                <strong>Hlavní výsledek (jen speciální oddělení):</strong> PHAmax{" "}
                <strong>{formatSdHours(detailedResult.finalPhaMax)} h</strong>{" "}
                <span className="muted-text">
                  (PHmax pro provoz: {formatSdHours(detailedResult.finalPhmax)} h)
                </span>
              </p>
            ) : null}
            {detailedResult.regularDepartments > 0 && detailedResult.specialDepartments > 0 ? (
              <p style={{ margin: 0 }}>
                <strong>Hlavní výsledek (kombinace):</strong> PHmax{" "}
                <strong>{formatSdHours(detailedResult.finalPhmax)} h</strong> a PHAmax{" "}
                <strong>{formatSdHours(detailedResult.finalPhaMax)} h</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        <SdResultsSection
          detailedResult={detailedResult}
          basePhmax={basePhmax}
          effectiveDepts={effectiveDepts}
          avgPerDept={avgPerDept}
          reduction={reduction}
          formatSdFactor={formatSdFactor}
          maxDepartments={SD_MAX_DEPARTMENTS_IN_TABLE}
        />

        {sdPlainNarrative != null ? (
          <div className="sd-lay-narrative" role="region" aria-label="Slovní souhrn výsledku (orientačně)">
            <p className="sd-lay-narrative__label">Slovní souhrn (orientačně)</p>
            <p>{sdPlainNarrative.p1}</p>
            <p>{sdPlainNarrative.p2}</p>
            <p className="muted-text" style={{ marginTop: 8, fontSize: "0.8rem", lineHeight: 1.45 }}>
              {sdPlainNarrative.disclaimer}
            </p>
          </div>
        ) : null}

        {sdStaffingModel != null ? (
          <details
            className="subcard sd-lay-staffing-nv75"
            style={{ marginTop: 12 }}
          >
            <summary className="section-title" style={{ fontSize: "0.95rem", cursor: "pointer" }}>
              Model úvazků dle nařízení vlády č. 75/2005 Sb. (příl. č. 1) – orientačně
            </summary>
            <p className="muted-text" style={{ marginTop: 10, marginBottom: 10, fontSize: "0.84rem", lineHeight: 1.5 }}>
              Rozsah přímé pedagogické činnosti (PPV) u školní družiny je v rámci NV uveden v <strong>tab. 7.1 a 7.2</strong>{" "}
              v příloze č. 1. Tento blok umí buď <strong>nejdřív vyčlenit</strong> modelový týdenní rozsah dle 7.2 a zbytek
              dělit mezi ostatní vychovatele, nebo <strong>celé PHmax</strong> dělit jen dle 7.1, pokud ve vaší praxi
              tento krok nechcete v modelu. Údaje ověřte u konsolidovaného znění.{" "}
              <a
                href={SD_LEGIS_ZAKONY_URL.nv75_2005}
                rel="noreferrer"
                target="_blank"
                style={{ color: "#1d4ed8", fontWeight: 600 }}
              >
                Znění na zakonyprolidi.cz (NV 75/2005, orientačně)
              </a>
            </p>
            <div className="field" style={{ marginBottom: 12, maxWidth: 520 }} role="group" aria-label="Rozdělení dle tabulky 7.2">
              <span className="field__label" id="sd-staff-vedouci-legend">
                V modelu dříve odečíst rozsah pro vedoucího dle tab. 7.2 (a teprve pak dělit zbylé PHmax dle 7.1)?
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", marginTop: 8, alignItems: "center" }}>
                <label className="muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="sd-staff-vedouci"
                    checked={separateVedoucihoDleT72}
                    onChange={() => setSeparateVedoucihoDleT72(true)}
                    aria-describedby="sd-staff-vedouci-legend"
                  />
                  Ano (7.2 před 7.1, výchozí)
                </label>
                <label className="muted-text" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="sd-staff-vedouci"
                    checked={!separateVedoucihoDleT72}
                    onChange={() => setSeparateVedoucihoDleT72(false)}
                    aria-describedby="sd-staff-vedouci-legend"
                  />
                  Ne (dělí se jen 7.1, bez 7.2 v modelu)
                </label>
              </div>
            </div>
            <label className="field" style={{ marginBottom: 12, maxWidth: 420 }}>
              <span className="field__label">Plný týdenní rozsah PPV vychovatele dle modelu (tab. 7.1: 28 až 30 h týdně)</span>
              <select
                className="input"
                value={vychovatelPpcHours}
                onChange={(e) => setVychovatelPpcHours(Number(e.target.value) as SdVychovatelPpcFullHours)}
                aria-label="Délka PPV u plného úvazku vychovatele pro dělení zbylého PHmax (28, 29 nebo 30 h týdně dle NV)"
              >
                <option value={28}>28,00 h / týden</option>
                <option value={29}>29,00 h / týden</option>
                <option value={30}>30,00 h / týden</option>
              </select>
            </label>
            {sdStaffingModel.headNote ? (
              <p className="muted-text" style={{ marginBottom: 10, fontSize: "0.84rem" }}>
                {sdStaffingModel.headNote}
              </p>
            ) : null}
            {sdStaffingModel.inconsistent && sdStaffingModel.inconsistencyMessage ? (
              <p className="muted-text" style={{ color: "#b91c1c", marginBottom: 10, fontSize: "0.88rem" }}>
                {sdStaffingModel.inconsistencyMessage}
              </p>
            ) : null}
            <table className="app-data-table" style={{ maxWidth: 480 }}>
              <tbody>
                <tr>
                  <th scope="row">PHmax celkem (váš výpočet)</th>
                  <td className="app-data-table__num">{formatSdHours(sdStaffingModel.totalPhmax)} h</td>
                </tr>
                <tr>
                  <th scope="row">Vedoucí vychovatel (příl. 1, tab. 7.2)</th>
                  <td className="app-data-table__num">{formatSdHours(sdStaffingModel.headVedouciHours)} h</td>
                </tr>
                <tr>
                  <th scope="row">
                    {sdStaffingModel.separateVedoucihoDleT72
                      ? "Na ostatní vychovatele (zbývá z PHmax)"
                      : "Celé PHmax pro vychovatele (dělení dle tab. 7.1)"}
                  </th>
                  <td className="app-data-table__num">{formatSdHours(sdStaffingModel.forOthersPhmax)} h</td>
                </tr>
                <tr>
                  <th scope="row">
                    {sdStaffingModel.separateVedoucihoDleT72
                      ? `Ostatní vychovatelé: plné úvazky (×${vychovatelPpcHours} h)`
                      : `Vychovatelé: plné úvazky (×${vychovatelPpcHours} h)`}
                  </th>
                  <td className="app-data-table__num">{sdStaffingModel.fullTimeSlots}</td>
                </tr>
                <tr>
                  <th scope="row">
                    {sdStaffingModel.separateVedoucihoDleT72 ? "Zkrácený úvazek ostatních (dopočet)" : "Zkrácený úvazek (dopočet)"}
                  </th>
                  <td className="app-data-table__num">{formatSdHours(sdStaffingModel.partialHours)} h</td>
                </tr>
                <tr>
                  <th scope="row">Zkrácený úvazek v % vůči plnému {vychovatelPpcHours} h</th>
                  <td className="app-data-table__num">
                    {sdStaffingModel.partialPercentOfFull.toLocaleString("cs-CZ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    %
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="muted-text" style={{ marginTop: 10, fontSize: "0.8rem", lineHeight: 1.45 }}>
              Týdenní i dlouhodobé rozvržení PPV, odpočinky a sjednání s pracovníkem stanovuje ředitel/ka ve vazbě na ZP, NV
              a vnitřní předpisy. Nejedná se o mzdový a personální výkaz, jen o orientační mechanický dělič součtového PHmax
              a tabulek 7.1 / 7.2.
            </p>
          </details>
        ) : null}

        <p className="muted-text" style={{ marginTop: 8, fontSize: "0.84rem", lineHeight: 1.45 }}>
          Pozn.: metodika v příkladech často zaokrouhluje mezikroky (např. průměr na oddělení), proto se může lišit
          mezivýsledek v tabulce oproti kalkulačce. V aplikaci počítáme přesnou hodnotu a zaokrouhlujeme až výsledné
          částky.
        </p>

        {detailedResult != null ? (
          <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
            <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
              {detailedResult.specialDepartments > 0
                ? "Rozpad po odděleních: PHmax a PHAmax (pro kontrolu)"
                : "Rozpad po odděleních: PHmax (pro kontrolu)"}
            </summary>
            <p className="muted-text" style={{ marginTop: 10, marginBottom: 10, fontSize: "0.84rem" }}>
              Technický přehled po řádcích. Pro běžné použití stačí souhrn nahoře a tabulka „Tabulková hodnota PHmax“.
            </p>
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th>Oddělení</th>
                    <th>Typ</th>
                    <th>Účastníci</th>
                    <th title="Základní (tabulková) část PHmax pro oddělení před krácením kvůli výjimce.">
                      Základ PHmax
                    </th>
                    <th title="Koeficient krácení podle výjimky (běžná nebo speciální oddělení).">Krácení</th>
                    <th title="PHmax po uplatnění krácení u daného oddělení.">PHmax po krácení</th>
                    {detailedResult.specialDepartments > 0 ? (
                      <th title="PHAmax u speciálního oddělení po krácení kvůli výjimce.">PHAmax</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {detailedResult.breakdown.map((row) => (
                    <tr key={row.index1Based}>
                      <td>{row.index1Based}</td>
                      <td>{row.kind === "regular" ? "Běžné" : "Speciální"}</td>
                      <td>{formatSdHours(row.participants)}</td>
                      <td>{formatSdHours(row.basePhmax)}</td>
                      <td>{formatSdFactor(row.reductionFactor)}</td>
                      <td>{formatSdHours(row.finalPhmax)}</td>
                      {detailedResult.specialDepartments > 0 ? (
                        <td>{row.kind === "special" ? formatSdHours(row.finalPhaMax) : "–"}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollGrabRegion>
          </details>
        ) : viewMode === "expert" && breakdown != null && breakdown.length > 0 && basePhmax != null ? (
          <div className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
            <h3 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 8 }}>
              Rozpad PHmax po odděleních
            </h3>
            <p className="muted-text" style={{ marginBottom: 12, fontSize: "0.88rem" }}>
              Hodiny podle tabulky pro váš počet oddělení (pořadí 1. až n-té oddělení). Právní opora: příloha vyhlášky
              č. 74/2005 Sb.
            </p>
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th scope="col" className="sd-phmax-breakdown__corner" />
                    <th scope="col" className="sd-phmax-breakdown__head-num" title="Tabulkové PHmax pro dané oddělení.">
                      Základ PHmax
                    </th>
                    {reduction.applied ? (
                      <th
                        scope="col"
                        className="sd-phmax-breakdown__head-num"
                        title="Orientační rozklad po krácení kvůli výjimce dle § 10 odst. 2 vyhlášky č. 74/2005 Sb."
                      >
                        Po krácení (orient.)
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((hours, index) => (
                    <tr key={index}>
                      <th scope="row" className="sd-phmax-breakdown__label">
                        Oddělení {index + 1}
                      </th>
                      <td className="sd-phmax-breakdown__num">{formatSdHours(hours)}</td>
                      {reduction.applied ? (
                        <td className="sd-phmax-breakdown__num">
                          {formatSdHours(round2(hours * reduction.factor))}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                  <tr className="sd-phmax-breakdown__total">
                    <th scope="row">Celkem</th>
                    <td className="sd-phmax-breakdown__num">{formatSdHours(basePhmax)}</td>
                    {reduction.applied ? (
                      <td className="sd-phmax-breakdown__num">{formatSdHours(reduction.adjusted)}</td>
                    ) : null}
                  </tr>
                </tbody>
              </table>
            </ScrollGrabRegion>
            {reduction.applied ? (
              <p className="muted-text" style={{ marginTop: 10, fontSize: "0.82rem" }}>
                Koeficient krácení: {formatSdFactor(reduction.factor)}. Jako celkový strop po krácení platí součet v
                řádku Celkem ({formatSdHours(reduction.adjusted)} h); rozpad sloupců je jen orientační podklad.
              </p>
            ) : null}
          </div>
        ) : null}

        {tableWarning ? <p className="card card--warning" style={{ marginTop: 16, padding: 14 }}>{tableWarning}</p> : null}

        {viewMode === "expert" && activeMethodikaRow != null ? (
          <div className="subcard sd-phmax-breakdown-wrap">
            <h3 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 8 }}>
              Tabulková hodnota PHmax pro {activeMethodikaRow.deptCount} oddělení
            </h3>
            <p className="muted-text" style={{ marginBottom: 10, fontSize: "0.86rem" }}>
              Řádek z přehledu týdenního maxima provozu školní družiny. Právní opora: příloha vyhlášky č. 74/2005 Sb.
            </p>
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th title="Počet oddělení, ke kterému se řádek vztahuje.">Počet oddělení</th>
                    {Array.from({ length: 11 }, (_, i) => (
                      <th key={`active-h-a-${i + 1}`} title={`PHmax pro ${i + 1}. oddělení (tabulkový rozpad).`}>
                        {i + 1}
                      </th>
                    ))}
                    <th title="Součet tabulkových hodin PHmax pro zvolený počet oddělení.">Celkový PHmax</th>
                  </tr>
                  <tr>
                    <th title="Pokračování rozpadu pro vyšší pořadí oddělení.">Pokračování</th>
                    {Array.from({ length: 10 }, (_, i) => (
                      <th
                        key={`active-h-b-${i + 12}`}
                        title={`PHmax pro ${i + 12}. oddělení (tabulkový rozpad).`}
                      >
                        {i + 12}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{activeMethodikaRow.deptCount} (1–11)</th>
                    {Array.from({ length: 11 }, (_, i) => {
                      const val = i < activeMethodikaRow.rowHours.length ? activeMethodikaRow.rowHours[i] : null;
                      return (
                        <td key={`active-r-a-${i + 1}`}>
                          {val == null ? "" : formatSdHours(val)}
                        </td>
                      );
                    })}
                    <td
                      style={{
                        background: "rgba(34, 197, 94, 0.14)",
                        borderColor: "rgba(22, 163, 74, 0.45)",
                        fontWeight: 800,
                      }}
                    >
                      {formatSdHours(activeMethodikaRow.total)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">{activeMethodikaRow.deptCount} (12–21)</th>
                    {Array.from({ length: 10 }, (_, i) => {
                      const idx = i + 11;
                      const val = idx < activeMethodikaRow.rowHours.length ? activeMethodikaRow.rowHours[idx] : null;
                      return (
                        <td key={`active-r-b-${idx + 1}`}>
                          {val == null ? "" : formatSdHours(val)}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tbody>
              </table>
            </ScrollGrabRegion>
            {detailedResult != null ? (
              <p className="muted-text" style={{ marginTop: 10, fontSize: "0.84rem" }}>
                Vaše výsledky z aktuálního zadání:{" "}
                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 8px",
                    borderRadius: 999,
                    background: "rgba(34, 197, 94, 0.14)",
                    border: "1px solid rgba(22, 163, 74, 0.45)",
                    color: "#166534",
                    fontWeight: 800,
                  }}
                >
                  PHmax {formatSdHours(detailedResult.finalPhmax)}
                </span>
                {detailedResult.specialDepartments > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "1px 8px",
                        borderRadius: 999,
                        background: "rgba(59, 130, 246, 0.12)",
                        border: "1px solid rgba(59, 130, 246, 0.35)",
                        color: "#1d4ed8",
                        fontWeight: 700,
                      }}
                    >
                      PHAmax {formatSdHours(detailedResult.finalPhaMax)}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        ) : null}

        {viewMode === "expert" ? (
          <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
          <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
            Ověřovací tabulka metodiky (1 speciální oddělení s výjimkou)
          </summary>
          <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.88rem" }}>
            Kontrolní scénář 1:1 s metodikou: při jednom výjimkovém oddělení § 16/9 se odečítá 0,05 / 0,10 / 0,60
            průměrného PHmax na oddělení. Sloupce odpovídají variantě 5 dětí, 4 děti, méně než 4 děti.
          </p>
          <p className="muted-text" style={{ marginTop: -4, marginBottom: 12, fontSize: "0.84rem", lineHeight: 1.45 }}>
            Pozn.: metodika zaokrouhluje mezikroky. Aplikace ponechává plnou přesnost mezivýpočtu a zaokrouhluje
            výsledné hodnoty, proto mohou vznikat malé rozdíly v desetinných místech.
          </p>
          <p className="muted-text" style={{ marginTop: -4, marginBottom: 12, fontSize: "0.82rem", lineHeight: 1.45 }}>
            Legenda: zeleně je zvýrazněná aktivní buňka podle aktuálního výpočtu.
          </p>
          <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th title="Počet oddělení školní družiny">Odd.</th>
                  <th title="Celkový PHmax z přílohy pro daný počet oddělení">PHmax</th>
                  <th title="Průměrný PHmax na 1 oddělení (základ pro výjimku u 1 speciálním oddělení)">Prům.</th>
                  <th title="Varianta: 1 speciální oddělení s výjimkou, 5 účastníků (koeficient 0,95)">5 (0,95)</th>
                  <th title="Varianta: 1 speciální oddělení s výjimkou, 4 účastníci (koeficient 0,90)">4 (0,90)</th>
                  <th title="Varianta: 1 speciální oddělení s výjimkou, méně než 4 účastníci (koeficient 0,40 dle textu metodiky)">
                    &lt;4 (0,40)
                  </th>
                </tr>
              </thead>
              <tbody>
                {methodikaVariantRows.map((r) => (
                  <tr
                    key={r.deptCount}
                    style={
                      r.deptCount === activeDeptCount
                        ? { background: "rgba(37, 99, 235, 0.06)" }
                        : undefined
                    }
                  >
                    <td style={r.deptCount === activeDeptCount ? { fontWeight: 800 } : undefined}>{r.deptCount}</td>
                    <td>{formatSdHours(r.base)}</td>
                    <td>{formatSdHours(r.avg)}</td>
                    <td
                      style={
                        r.deptCount === activeDeptCount && activeVariantColumn === "v5"
                          ? {
                              background: "rgba(34, 197, 94, 0.14)",
                              borderColor: "rgba(22, 163, 74, 0.45)",
                              fontWeight: 800,
                            }
                          : undefined
                      }
                    >
                      {formatSdHours(r.v5)}
                    </td>
                    <td
                      style={
                        r.deptCount === activeDeptCount && activeVariantColumn === "v4"
                          ? {
                              background: "rgba(34, 197, 94, 0.14)",
                              borderColor: "rgba(22, 163, 74, 0.45)",
                              fontWeight: 800,
                            }
                          : undefined
                      }
                    >
                      {formatSdHours(r.v4)}
                    </td>
                    <td
                      style={
                        r.deptCount === activeDeptCount && activeVariantColumn === "vUnder4"
                          ? {
                              background: "rgba(34, 197, 94, 0.14)",
                              borderColor: "rgba(22, 163, 74, 0.45)",
                              fontWeight: 800,
                            }
                          : undefined
                      }
                    >
                      {formatSdHours(r.vUnder4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollGrabRegion>
          <p className="muted-text" style={{ marginTop: 10, fontSize: "0.82rem", lineHeight: 1.45 }}>
            Výpočet v aplikaci je veden podle textu metodiky (nikoli striktně podle tabulkového přepisu): při
            účastnících &lt; 4 se snižuje o 0,6násobek (tj. použije se faktor 0,4). V metodických podkladech je
            evidován tiskový překlep hodnoty 58,1; správná hodnota je 8,1.
          </p>
          </details>
        ) : null}

        {viewMode === "expert" ? (
          <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 14 }}>
          <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
            Ověřovací tabulka: Týdenní maximální rozsah provozu školních družin
          </summary>
          <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.88rem" }}>
            Referenční matice přílohy vyhlášky 74/2005 Sb. pro 1 až 21 oddělení. Sloupce 1–21 ukazují hodinové hodnoty
            pro jednotlivá oddělení, poslední sloupec uvádí celkový PHmax za družinu.
          </p>
          <p className="muted-text" style={{ marginTop: -4, marginBottom: 12, fontSize: "0.82rem", lineHeight: 1.45 }}>
            Legenda: zeleně je zvýrazněná aktivní hodnota pro aktuální počet oddělení.
          </p>
          <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th rowSpan={2} title="Celkový počet oddělení školní družiny">
                    Odd.
                  </th>
                  <th
                    colSpan={21}
                    title="Týdenní maximální rozsah provozu školních družin – hodiny PHmax pro 1. až 21. oddělení dle přílohy vyhlášky č. 74/2005 Sb."
                  >
                    PHmax na oddělení 1–21 (h)
                  </th>
                  <th rowSpan={2} title="Součet tabulkového PHmax za družinu pro daný počet oddělení">
                    Σ PHmax
                  </th>
                </tr>
                <tr>
                  {Array.from({ length: 21 }, (_, i) => (
                    <th key={`hd-${i + 1}`} title={`${i + 1}. oddělení`}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {methodikaBaseGridRows.map((row) => (
                  <tr
                    key={`row-${row.deptCount}`}
                    style={
                      row.deptCount === activeDeptCount
                        ? { background: "rgba(37, 99, 235, 0.06)" }
                        : undefined
                    }
                  >
                    <th scope="row" style={row.deptCount === activeDeptCount ? { fontWeight: 800 } : undefined}>
                      {row.deptCount}
                    </th>
                    {Array.from({ length: 21 }, (_, i) => {
                      const val = i < row.rowHours.length ? row.rowHours[i] : null;
                      return <td key={`row-${row.deptCount}-c-${i + 1}`}>{val == null ? "" : formatSdHours(val)}</td>;
                    })}
                    <td
                      style={
                        row.deptCount === activeDeptCount
                          ? {
                              background: "rgba(34, 197, 94, 0.14)",
                              borderColor: "rgba(22, 163, 74, 0.45)",
                              fontWeight: 800,
                            }
                          : undefined
                      }
                    >
                      {formatSdHours(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollGrabRegion>
          </details>
        ) : null}

        <p className="muted-text" style={{ marginTop: 20 }}>
          Aplikace nenahrazuje úřední výpočet ani výkazy (např. Z 2-01). U složitých případů (
          <SdLegisRef citeId="sd-skolsky-16" label="§ 16 školského zákona" />, méně než čtyři oddělení, výjimky zřizovatele)
          vycházejte z úplného znění vyhlášky a metodiky – odkazy níže. Krácení PHmax dle{" "}
          <SdLegisRef citeId="sd-10-2" label="§ 10 odst. 2 vyhl. 74" /> je v souhrnu výše.
        </p>
      </section>

          </>
        }
        afterWorkspace={
          <>
            <PhmaxModuleSeoSection view="sd" setProductView={setProductView} />
            {viewMode === "expert" ? <ProductLegisContextPanel variant="sd" /> : null}
            {viewMode === "expert" ? <MethodologyStrip /> : null}
          </>
        }
        footer={
          <footer className="zs-app-footer">
            <HeroStatusBar
              productLabel={PRODUCT_CALCULATOR_TITLES.sd}
              lastSavedAt={lastSavedAt}
              notice={uiNotice}
              variant="sd"
              placement="footer"
            />
            <AuthorCreditFooter />
          </footer>
        }
        tocSections={sdTocSections}
      />
      <GlossaryDialog
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        terms={SD_GLOSSARY_TERMS}
        triggerRef={glossaryTriggerRef}
      />
    </div>
  );
}
