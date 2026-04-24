import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADVANCED_AUDIT_GROUP_LABEL,
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  BROWSER_ERROR_NEXT_STEP_HINT,
  CALCULATOR_LIMITS_NOTE,
  MSG_DATA_UNEXPECTED_SHAPE,
  MSG_NAMED_BACKUP_PICK_FIRST,
  MSG_NAMED_BACKUP_PICK_TO_COMPARE,
  MSG_NAMED_BACKUP_PICK_TO_DELETE,
  MSG_NO_LOCAL_AUTOSAVE_DATA,
  INLINE_VALIDATION_MSG_POSITIVE_INTEGER,
  LAY_USER_QUICK_START_SD,
  EXPORT_ORIENTACNI_NOTE,
  formatSdLayContextLine,
  HERO_ACTIONS_ICON_LEGEND,
  NAMED_BACKUPS_COMPARE_JSON_LABEL,
  NAMED_BACKUPS_DELETE_LABEL,
  NAMED_BACKUPS_NAME_LABEL,
  NAMED_BACKUPS_RESTORE_LABEL,
  NAMED_BACKUPS_SAVE_LABEL,
  NAMED_BACKUPS_SELECT_PLACEHOLDER,
  namedBackupsMicrocopy,
  namedBackupSavedNotice,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import { getAppAuthorPrintFooterHtml, stripAppAuthorCreditFromPlainSummary } from "./app-author-print";
import {
  confirmDestructive,
  MSG_CONFIRM_CLEAR_BROWSER_STORAGE,
  MSG_CONFIRM_RESET_FORM_ALL,
  msgConfirmDeleteNamedBackup,
} from "./confirm-destructive";
import { buildExportMetaRows, EXPORT_CSV_SEPARATOR_ROW } from "./export-metadata";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { HeroActionsDrawer } from "./HeroActionsDrawer";
import {
  HeroIconActionButton,
  IconClearStored,
  IconCopy,
  IconCsv,
  IconExcel,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconRestoreQuick,
  IconSaveQuick,
  IconSpinner,
} from "./HeroActionIconButton";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import { HeroStatusBar } from "./HeroStatusBar";
import { VerdictNextStepsPanel } from "./VerdictNextStepsPanel";
import { HeroStat } from "./HeroStat";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { CompareVariantsPanel } from "./CompareVariantsPanel";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel, SdLegisRef } from "./PhmaxProductLegisUi";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { GlossaryDialog, type GlossaryTerm } from "./GlossaryDialog";
import { GlossaryIconButton } from "./GlossaryIconButton";
import { InputOutputLegend, NumberField, ResultCard } from "./phmax-zs-ui";
import { round2 } from "./phmax-zs-logic";
import { buildPhmaxSdExportRows } from "./phmax-sd-export-rows";
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
        <strong>Detailní režim</strong> zapisuje každé oddělení zvlášť (typ, počet účastníků, výjimka u řádku) — interně
        se vždy převádí na model po odděleních.
      </>
    ),
  },
  {
    term: "Krácení PHmax (průměr pod 20)",
    description: (
      <>
        Orientační krácení celkového PHmax, pokud není splněn průměr účastníků 1. stupně na oddělení (typicky pod 20)
        — viz § 10 odst. 2 vyhlášky č. 74/2005 Sb. V aplikaci se zobrazí koeficient a upravený součet.
      </>
    ),
  },
];

type PhmaxSdPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const SD_HERO_EXAMPLE_SELECT_LEGEND =
  "Najeďte myší na řádek v seznamu pro stručný popis situace a orientační očekávaný výsledek. Čísla odpovídají výpočtu v této aplikaci (včetně přesných mezikroků; metodika někdy zaokrouhluje jinak).";

const SD_ONBOARDING_KEY = "phmax-sd-onboarding";
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

export function PhmaxSdPage({ productView, setProductView }: PhmaxSdPageProps) {
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
  const [uiNotice, setUiNotice] = useState("");
  const [namedSnapshots, setNamedSnapshots] = useState<NamedSdSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(SD_ONBOARDING_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [selectedSdHeroExample, setSelectedSdHeroExample] = useState<SdHeroExampleKey>("");
  const [viewMode, setViewMode] = useState<"basic" | "expert">(() => {
    try {
      const stored = localStorage.getItem(SD_VIEW_MODE_LS_KEY);
      return stored === "expert" ? "expert" : "basic";
    } catch {
      return "basic";
    }
  });
  const selectedSdHeroExampleMeta =
    selectedSdHeroExample && selectedSdHeroExample in SD_HERO_EXAMPLE_META
      ? SD_HERO_EXAMPLE_META[selectedSdHeroExample as Exclude<SdHeroExampleKey, "">]
      : null;
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const glossaryTriggerRef = useRef<HTMLButtonElement>(null);

  const dismissGuide = useCallback(() => {
    try {
      localStorage.setItem(SD_ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setGuideOpen(false);
  }, []);

  const openGuide = useCallback(() => {
    try {
      localStorage.removeItem(SD_ONBOARDING_KEY);
    } catch {
      /* ignore */
    }
    setGuideOpen(true);
  }, []);

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

  const stickySummary = useMemo(() => {
    if (detailedResult != null) {
      const departmentsCount = detailedResult.totalDepartments;
      const phmax = detailedResult.finalPhmax;
      const phamax = detailedResult.specialDepartments > 0 ? detailedResult.finalPhaMax : null;
      let coefficientLabel = "Koef. krácení";
      let coefficientValue = "1,0000";

      if (detailedResult.regularDepartments > 0 && detailedResult.specialDepartments === 0) {
        coefficientLabel = "Koef. krácení (běžná)";
        coefficientValue = formatSdFactor(detailedResult.regularReductionFactor);
      } else if (detailedResult.regularDepartments === 0 && detailedResult.specialDepartments > 0) {
        coefficientLabel = "Koef. krácení (spec.)";
        coefficientValue = formatSdFactor(detailedResult.specialReductionFactor);
      } else if (detailedResult.regularDepartments > 0 && detailedResult.specialDepartments > 0) {
        coefficientLabel = "Koef. krácení (běž./spec.)";
        coefficientValue = `${formatSdFactor(detailedResult.regularReductionFactor)} / ${formatSdFactor(
          detailedResult.specialReductionFactor,
        )}`;
      }

      return {
        departmentsCount,
        phmax,
        phamax,
        coefficientLabel,
        coefficientValue,
      };
    }

    if (basePhmax != null) {
      return {
        departmentsCount: effectiveDepts,
        phmax: reduction.adjusted,
        phamax: null,
        coefficientLabel: "Koef. krácení",
        coefficientValue: formatSdFactor(reduction.factor),
      };
    }

    return null;
  }, [detailedResult, basePhmax, effectiveDepts, reduction.adjusted, reduction.factor]);

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
      setUiNotice("Byl stažen soubor Excel (XLSX).");
    } catch (e) {
      console.error(e);
      setUiNotice(`Export do Excelu se nepodařil. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  const buildSdSnapshot = useCallback(
    (): SdPersistedSnapshot => ({
      pupils,
      manualDepts,
      departments,
      inputMode,
      summarySpecialDepartments,
      regularExceptionGranted,
      specialExceptionGranted,
      detailDepartments,
      schoolFirstStageClassCount,
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
    ],
  );

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
    setSummaryHasSpecial((next.summarySpecialDepartments?.length ?? 0) > 0);
  }, []);

  const applySdSnapshot = useCallback(
    (data: unknown) => {
      const next = parseSdSnapshot(data);
      if (next) {
        setSelectedSdHeroExample("");
        applySdPersisted(next);
        setUiNotice("Data byla obnovena.");
      } else {
        setUiNotice(MSG_DATA_UNEXPECTED_SHAPE);
      }
    },
    [applySdPersisted],
  );

  const loadSdHeroExample = useCallback(
    (key: SdHeroExampleKey) => {
      setSelectedSdHeroExample(key);
      if (!key) return;
      applySdPersisted(sdHeroExampleSnapshot(key) as SdPersistedSnapshot);
      setUiNotice("Načten ukázkový příklad z metodiky.");
    },
    [applySdPersisted],
  );

  const saveSdSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(buildSdSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
      setUiNotice("Rozpracované údaje byly uloženy.");
    } catch {
      setUiNotice(`Uložení se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [buildSdSnapshot]);

  const restoreSdSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(SD_STORAGE_KEY);
      if (!raw) {
        setUiNotice(MSG_NO_LOCAL_AUTOSAVE_DATA);
        return;
      }
      applySdSnapshot(JSON.parse(raw));
    } catch {
      setUiNotice(`Obnovení uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [applySdSnapshot]);

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
    setUiNotice(namedBackupSavedNotice(name, SD_MAX_NAMED_SNAPSHOTS));
  }, [buildSdSnapshot, namedSaveName]);

  const restoreNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice(MSG_NAMED_BACKUP_PICK_FIRST);
      return;
    }
    applySdSnapshot(item.snapshot);
    setUiNotice(`Obnovena záloha „${item.name}“.`);
  }, [applySdSnapshot, namedSnapshots, selectedNamedId]);

  const deleteNamedSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNotice(MSG_NAMED_BACKUP_PICK_TO_DELETE);
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
    setUiNotice("Pojmenovaná záloha byla smazána.");
  }, [namedSnapshots, selectedNamedId]);

  const clearSdStoredSnapshot = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_CLEAR_BROWSER_STORAGE)) return;
    try {
      localStorage.removeItem(SD_STORAGE_KEY);
      setLastSavedAt("");
      setUiNotice("Uložená data v prohlížeči byla vymazána.");
    } catch {
      setUiNotice(`Vymazání uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
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
    setUiNotice("Všechna vstupní data kalkulačky byla vymazána.");
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
      "",
      APP_AUTHOR_CREDIT_LINE,
    ]
      .filter(Boolean)
      .join("\n");
  }, [pupils, effectiveDepts, manualDepts, suggested, basePhmax, reduction, detailedResult, inputMode]);

  const copySdSummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildSdSummaryText());
      setUiNotice("Shrnutí bylo zkopírováno do schránky.");
    } catch {
      setUiNotice(`Kopírování do schránky se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [buildSdSummaryText]);

  const printSdSummary = useCallback(() => {
    const plain = stripAppAuthorCreditFromPlainSummary(buildSdSummaryText());
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí PHmax ŠD</title>` +
        `<style>body{font-family:system-ui,Segoe UI,sans-serif;margin:16px;font-size:11pt;line-height:1.45;color:#0f172a}a{color:#1d4ed8}</style>` +
        `</head><body><h1 style="font-size:13pt">Shrnutí – školní družina</h1><p>${text}</p>${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
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
    setUiNotice("Stažen auditní protokol (JSON).");
  }, [buildSdAuditProtocol]);

  const handleCompareWithNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice(MSG_NAMED_BACKUP_PICK_TO_COMPARE);
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
    setUiNotice(`Staženo srovnání: aktuální stav vs „${item.name}“ (JSON).`);
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

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          <div className="hero__pills-row-trailing">
            <div className="checks" role="group" aria-label="Režim zobrazení ŠD">
              <label>
                <input
                  type="radio"
                  name="sd-view-mode"
                  checked={viewMode === "basic"}
                  onChange={() => setViewMode("basic")}
                />
                Základní
              </label>
              <label>
                <input
                  type="radio"
                  name="sd-view-mode"
                  checked={viewMode === "expert"}
                  onChange={() => setViewMode("expert")}
                />
                Expertní
              </label>
            </div>
            <GlossaryIconButton
              ref={glossaryTriggerRef}
              className="glossary-icon-btn--hero"
              onClick={() => setGlossaryOpen(true)}
            />
            <button
              type="button"
              className="btn btn--hero-help"
              onClick={() => (guideOpen ? dismissGuide() : openGuide())}
              aria-expanded={guideOpen}
            >
              {guideOpen ? "Skrýt nápovědu" : "Nápověda"}
            </button>
          </div>
        </div>

        <div className="grid two hero__grid">
          <div>
            <p className="hero-zone-label">A. Kontext výpočtu</p>
            <h1 className="hero__title hero__title--sd">PHmax ve školní družině</h1>
            <p className="hero__text hero__text--sd">
              Orientační výpočet podle{" "}
              <strong>vyhlášky č. 74/2005 Sb., o zájmovém vzdělávání</strong> (zejména § 10 a{" "}
              <strong>přílohy s tabulkou</strong> týdenního nejvyššího rozsahu přímé pedagogické činnosti / PHmax podle
              počtu oddělení) a metodických pokynů MŠMT. U „speciálních“ oddělení dle § 16 školského zákona a u méně než
              čtyř oddělení platí další pravidla – vždy vycházejte z úplného znění vyhlášky a metodiky.
            </p>
          </div>
          <div className="hero__stats hero__stats--compact hero__stats--sd">
            <p className="hero-zone-kpi">B. Hlavní KPI</p>
            <HeroStat compact label="Účastníci (1. st.)" value={pupils} />
            <HeroStat compact label="Oddělení" value={inputMode === "detail" ? detailDepartments.length : effectiveDepts} />
            <HeroStat
              compact
              label="PHmax"
              value={
                detailedResult != null
                  ? formatSdHours(detailedResult.finalPhmax)
                  : basePhmax != null
                    ? formatSdHours(reduction.adjusted)
                    : "–"
              }
            />
            <HeroStat
              compact
              label="Krácení § 10 odst. 2"
              value={
                reduction.applied
                  ? `ano (${(Math.round(reduction.factor * 1000) / 10).toLocaleString("cs-CZ")} %)`
                  : "ne"
              }
            />
          </div>
        </div>

        <p
          className="muted-text"
          style={{ marginTop: 6, fontSize: "0.86rem", lineHeight: 1.5, maxWidth: "48rem" }}
          aria-live="polite"
        >
          <strong>Průběh:</strong>{" "}
          {formatSdLayContextLine(
            inputMode,
            inputMode === "detail" ? detailDepartments.length : effectiveDepts,
          )}
        </p>
        <VerdictNextStepsPanel
          tone={sdVerdict.tone}
          verdictLabel={sdVerdict.label}
          verdictDetail={sdVerdict.detail}
          recommendedStep={sdWorkflow.recommendedStep}
          workflowSteps={sdWorkflow.steps}
          actions={[
            { label: "Uložit scénář", onClick: saveSdSnapshotManually },
            { label: "Export CSV", onClick: handleExportCsv },
            { label: "Porovnat se zálohou", onClick: handleCompareWithNamedSnapshot },
          ]}
        />

        <section className="hero-zone-actions" aria-label="Akce výpočtu">
          <p className="hero-zone-label">C. Akce</p>
          <div className="field field--hero-select hero-actions__example hero-sd-example-select" style={{ marginTop: 14 }}>
            <span className="field__label field__label--hero" id="sd-hero-example-label">
              Ukázkový příklad
            </span>
            <select
              id="sd-hero-example-select"
              className="input"
              aria-labelledby="sd-hero-example-label"
              aria-describedby="sd-hero-example-legend"
              title="Ukázkové příklady z metodiky k školní družině (PHmax / PHAmax). Najeďte na řádek pro detaily a očekávané hodnoty."
              value={selectedSdHeroExample}
              onChange={(e) => loadSdHeroExample(e.target.value as SdHeroExampleKey)}
            >
              <option value="">Vyberte ukázkový příklad…</option>
              <optgroup label="Metodika — školní družina (orientačně)">
                {SD_HERO_EXAMPLE_ORDER.map((k) => {
                  const m = SD_HERO_EXAMPLE_META[k];
                  return (
                    <option key={k} value={k} title={m.title}>
                      {m.label}
                    </option>
                  );
                })}
              </optgroup>
            </select>
            <p id="sd-hero-example-legend" className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "48rem", lineHeight: 1.5 }}>
              {SD_HERO_EXAMPLE_SELECT_LEGEND}
            </p>
            {selectedSdHeroExampleMeta ? (
              <p className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", maxWidth: "48rem", lineHeight: 1.5 }}>
                <strong>Očekávaný výsledek vybrané ukázky:</strong> {selectedSdHeroExampleMeta.title}
              </p>
            ) : null}
          </div>

          <div className="hero-actions hero-actions--stacked">
            <HeroActionsDrawer>
            <div className="hero-actions--stacked__row">
              <span className="hero-actions__cluster" role="group" aria-label="Tisk">
                <HeroIconActionButton
                  className="btn btn--light"
                  label="Tisk stránky"
                  icon={<IconPrint />}
                  onClick={() => window.print()}
                />
                <HeroIconActionButton
                  className="btn btn--light"
                  label="Tisk textového shrnutí"
                  icon={<IconPrintSummary />}
                  onClick={printSdSummary}
                />
              </span>
              <span className="hero-actions__cluster hero-actions__cluster--after" role="group" aria-label="Ukládání">
                <HeroIconActionButton
                  className="btn ghost"
                  label="Rychle uložit průběh do prohlížeče"
                  icon={<IconSaveQuick />}
                  onClick={saveSdSnapshotManually}
                />
                <HeroIconActionButton
                  className="btn ghost"
                  label="Rychle obnovit uložený průběh"
                  icon={<IconRestoreQuick />}
                  onClick={restoreSdSnapshot}
                />
              </span>
            </div>
            <div className="hero-actions--stacked__row hero-actions__group--meta">
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat uložená data v prohlížeči"
                icon={<IconClearStored />}
                onClick={clearSdStoredSnapshot}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Vymazat všechny údaje ve formuláři"
                icon={<IconResetAll />}
                onClick={resetSdAll}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions--stacked__row">
              <HeroIconActionButton
                className="btn ghost"
                label="Exportovat data jako CSV"
                icon={<IconCsv />}
                onClick={handleExportCsv}
              />
              <HeroIconActionButton
                className="btn ghost"
                label={xlsxExportBusy ? "Připravuji Excel…" : "Stáhnout shrnutí jako Excel (.xlsx)"}
                icon={xlsxExportBusy ? <IconSpinner /> : <IconExcel />}
                disabled={xlsxExportBusy}
                aria-busy={xlsxExportBusy}
                showLabel={xlsxExportBusy}
                onClick={() => void handleExportXlsx()}
              />
              <HeroIconActionButton
                className="btn ghost"
                label="Kopírovat textové shrnutí do schránky"
                icon={<IconCopy />}
                onClick={() => void copySdSummary()}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions__group hero-actions__group--named">
              <div className="hero-named-grid hero-named-grid--simple" aria-label="Pojmenované zálohy">
                <p className="muted-text" style={{ gridColumn: "1 / -1", margin: "0 0 6px", fontSize: "0.85rem", lineHeight: 1.45 }}>
                  {namedBackupsMicrocopy(SD_MAX_NAMED_SNAPSHOTS, "kompletní stav vstupů školní družiny")}
                </p>
                <label className="hero-named-field hero-named-field--backup-name">
                  <span className="field__label field__label--hero-named">
                    {NAMED_BACKUPS_NAME_LABEL}
                    <span
                      title={namedBackupsMicrocopy(SD_MAX_NAMED_SNAPSHOTS, "kompletní stav vstupů školní družiny")}
                      aria-label={namedBackupsMicrocopy(SD_MAX_NAMED_SNAPSHOTS, "kompletní stav vstupů školní družiny")}
                      className="help-hint"
                    >
                      i
                    </span>
                  </span>
                  <input
                    type="text"
                    className="input"
                    placeholder="např. varianta A"
                    value={namedSaveName}
                    onChange={(e) => setNamedSaveName(e.target.value)}
                    aria-label="Název pojmenované zálohy"
                  />
                </label>
                <div className="hero-named-field hero-named-field--save">
                  <span className="hero-named-field__btn-slot" aria-hidden="true" />
                  <button type="button" className="btn ghost btn--hero-named" onClick={saveNamedSnapshot}>
                    {NAMED_BACKUPS_SAVE_LABEL}
                  </button>
                </div>
                <div className="hero-named-field hero-named-field--select">
                  <select
                    className="input"
                    value={selectedNamedId}
                    onChange={(e) => setSelectedNamedId(e.target.value)}
                    aria-label="Vybrat uloženou zálohu"
                  >
                    <option value="">{NAMED_BACKUPS_SELECT_PLACEHOLDER}</option>
                    {namedSnapshots.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hero-named-field hero-named-field--restore-delete">
                  <button type="button" className="btn ghost btn--hero-named" onClick={restoreNamedSnapshot}>
                    {NAMED_BACKUPS_RESTORE_LABEL}
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={deleteNamedSnapshot}>
                    {NAMED_BACKUPS_DELETE_LABEL}
                  </button>
                </div>
                <div className="hero-named-field" style={{ gridColumn: "1 / -1" }}>
                  <p className="hero-actions__group-title">{ADVANCED_AUDIT_GROUP_LABEL}</p>
                  <button type="button" className="btn ghost btn--hero-named" onClick={handleCompareWithNamedSnapshot}>
                    {NAMED_BACKUPS_COMPARE_JSON_LABEL}
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={handleExportAuditJson}>
                    Stáhnout auditní protokol (JSON)
                  </button>
                </div>
                <div className="hero-named-field" style={{ gridColumn: "1 / -1" }}>
                  <CompareVariantsPanel
                    title="Porovnání 2 variant (náhled)"
                    result={sdComparePreview}
                    emptyHint="Vyberte pojmenovanou zálohu pro porovnání s aktuálním stavem."
                    exportSlug="sd"
                  />
                </div>
              </div>
            </div>
            </HeroActionsDrawer>
          </div>
        </section>

      </header>

      <QuickOnboarding
        title="Jak s touto kalkulačkou pracovat"
        open={guideOpen}
        onDismiss={dismissGuide}
        dismissButtonLabel="Skrýt nápovědu"
      >
        <p>
          <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
        </p>
        <p>{LAY_USER_QUICK_START_SD}</p>
        <p>
          Vyplňte počet účastníků a případně počet oddělení (jinak se dopočítá dělením 27). Výsledek vychází z přílohy k
          vyhlášce č. 74/2005 Sb.; u průměru pod 20 na oddělení může aplikovat orientační krácení dle § 10 odst. 2.
          Složité případy (§ 16 školského zákona, méně než čtyři oddělení) musíte ověřit v plném znění předpisů.
        </p>
        <p>{EXPORT_ORIENTACNI_NOTE}</p>
        <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
        <p>
          Export do CSV a Excelu a kopírování shrnutí najdete v horní liště pod nadpisem stránky.
        </p>
        <p>
          Počet účastníků = žáci 1. stupně ZŠ přihlášení k pravidelné denní docházce (pro krácení PHmax dle § 10 odst. 2).
          Počet oddělení pro nové oddělení nad první: průměr nad 27 účastníků → dělení počtem 27 a zaokrouhlení nahoru
          (u výjimek viz metodiku).
        </p>
        <p>
          Krácení dle § 10 odst. 2 se nepoužívá mechanicky ve všech případech (např. specifická organizace oddělení nebo
          výjimky dle vyhlášky). Pokud je situace hraniční, proveďte ruční kontrolu podle plného znění vyhlášky a metodiky.
        </p>
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy</h2>
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
              <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
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
                    value={departments}
                    onChange={(v) => setDepartments(Math.max(1, Math.round(v)))}
                  />
                ) : null}
                {manualDepts && departments <= 0 ? (
                  <p className="muted-text" style={{ marginTop: 8, color: "#9a3412", fontSize: "0.86rem" }}>
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
                    <tr key={i}>
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
                        <input
                          type="number"
                          className="input"
                          min={0}
                          step="1"
                          value={row.participants}
                          onChange={(e) =>
                            setDetailDepartments((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? { ...x, participants: Math.max(0, Math.round(Number(e.target.value) || 0)) }
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
                          "—"
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

        {stickySummary != null ? (
          <div className="sd-sticky-summary" role="status" aria-live="polite">
            <div className="sd-sticky-summary__item">
              <span className="sd-sticky-summary__label">Oddělení</span>
              <strong className="sd-sticky-summary__value">{stickySummary.departmentsCount}</strong>
            </div>
            <div className="sd-sticky-summary__item">
              <span className="sd-sticky-summary__label">PHmax</span>
              <strong className="sd-sticky-summary__value">{formatSdHours(stickySummary.phmax)} h</strong>
            </div>
            {stickySummary.phamax != null ? (
              <div className="sd-sticky-summary__item">
                <span className="sd-sticky-summary__label">PHAmax</span>
                <strong className="sd-sticky-summary__value">{formatSdHours(stickySummary.phamax)} h</strong>
              </div>
            ) : null}
            <div className="sd-sticky-summary__item">
              <span className="sd-sticky-summary__label">{stickySummary.coefficientLabel}</span>
              <strong className="sd-sticky-summary__value">{stickySummary.coefficientValue}</strong>
            </div>
          </div>
        ) : null}

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

        <div className="grid two section-results" style={{ marginTop: 18 }}>
          {detailedResult != null ? (
            <>
              <ResultCard label="Oddělení (celkem)" value={detailedResult.totalDepartments} tone="primary" />
              <ResultCard
                label="PHmax (základní tabulková hodnota)"
                hint="Dle přílohy vyhlášky č. 74/2005 Sb. podle celkového počtu oddělení."
                value={detailedResult.basePhmax}
                tone="success"
              />
              {detailedResult.regularDepartments > 0 ? (
                <ResultCard
                  label="PHmax – běžná oddělení (po krácení kvůli výjimce)"
                  hint="Právní opora: § 10 odst. 2 a 3 vyhlášky č. 74/2005 Sb."
                  value={detailedResult.regularSharePhmax}
                  tone="primary"
                />
              ) : null}
              {detailedResult.specialDepartments > 0 ? (
                <ResultCard
                  label="PHmax – speciální oddělení (po krácení kvůli výjimce)"
                  hint="Právní opora: § 10 odst. 7 vyhlášky č. 74/2005 Sb. ve vazbě na § 16 odst. 9 školského zákona."
                  value={detailedResult.specialSharePhmax}
                  tone="primary"
                />
              ) : null}
              <ResultCard
                label={
                  detailedResult.specialDepartments > 0
                    ? "PHmax celkem (součet běžných + speciálních oddělení)"
                    : "PHmax celkem (běžná oddělení)"
                }
                methodStepLabel={
                  detailedResult.specialDepartments > 0 && detailedResult.regularDepartments === 0
                    ? "Dílčí PHmax"
                    : undefined
                }
                value={detailedResult.finalPhmax}
                tone={detailedResult.specialDepartments > 0 && detailedResult.regularDepartments === 0 ? "primary" : "success"}
              />
              {detailedResult.specialDepartments > 0 ? (
                <ResultCard
                  label="PHAmax celkem – speciální oddělení (po krácení kvůli výjimce)"
                  hint="Právní opora: § 10 odst. 11 vyhlášky č. 74/2005 Sb. a § 16 odst. 9 školského zákona."
                  methodStepLabel="Výsledek PHAmax"
                  value={detailedResult.finalPhaMax}
                  tone="success"
                />
              ) : null}
            </>
          ) : basePhmax != null ? (
            <>
              <ResultCard
                label="Počet oddělení pro výpočet"
                value={effectiveDepts}
                tone="primary"
              />
              <ResultCard
                label="Průměr účastníků na oddělení"
                value={avgPerDept}
                tone="primary"
              />
              <ResultCard label="PHmax (základ z tabulky)" value={basePhmax} tone="success" />
              {reduction.applied ? (
                <ResultCard
                  label={`PHmax po krácení (koef. ${formatSdFactor(reduction.factor)})`}
                  value={reduction.adjusted}
                  tone="success"
                />
              ) : (
                <ResultCard
                  label="PHmax po krácení"
                  value="neaplikuje se (průměr ≥ 20 na oddělení nebo nejsou údaje)"
                  tone="primary"
                />
              )}
            </>
          ) : (
            <p className="muted-text">Zadejte platný počet oddělení (1–{SD_MAX_DEPARTMENTS_IN_TABLE}).</p>
          )}
        </div>
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
                        <td>{row.kind === "special" ? formatSdHours(row.finalPhaMax) : "—"}</td>
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
          <div className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 14 }}>
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
                    title="Týdenní maximální rozsah provozu školních družin — hodiny PHmax pro 1. až 21. oddělení dle přílohy vyhlášky č. 74/2005 Sb."
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

      {viewMode === "expert" ? <ProductLegisContextPanel variant="sd" /> : null}
      {viewMode === "expert" ? <MethodologyStrip /> : null}
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
      <ProductFloatingNav active={productView} setProductView={setProductView} />
      <GlossaryDialog
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        terms={SD_GLOSSARY_TERMS}
        triggerRef={glossaryTriggerRef}
      />
    </>
  );
}
