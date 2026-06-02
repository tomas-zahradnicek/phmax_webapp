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
  namedBackupSavedNotice,
  CALCULATOR_WORKSPACE_DOCK_LABEL,
  PHMAX_PV_ONBOARDING_LS_KEY,
  PRODUCT_CALCULATOR_TITLES,
} from "./calculator-ui-constants";
import {
  APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES,
  getAppAuthorPrintFooterHtml,
  stripAppAuthorCreditFromPlainSummary,
} from "./app-author-print";
import {
  confirmDestructive,
  MSG_CONFIRM_CLEAR_BROWSER_STORAGE,
  MSG_CONFIRM_RESET_FORM_ALL,
  msgConfirmDeleteNamedBackup,
} from "./confirm-destructive";
import { buildExportMetaRows, EXPORT_CSV_SEPARATOR_ROW } from "./export-metadata";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { heroExampleOptionsFromKeys } from "./HeroExampleSelect";
import { HeroStatusBar } from "./HeroStatusBar";
import { CalculatorInputIssueBanner } from "./CalculatorInputIssueBanner";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
import { useDisplayDensity } from "./useDisplayDensity";
import { calculatorShellClassName, type CalculatorViewMode } from "./calculator-view-mode";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { GlossaryDialog, type GlossaryTerm } from "./GlossaryDialog";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel, PvLegisRef } from "./PhmaxProductLegisUi";
import { useQuickOnboarding } from "./useQuickOnboarding";
import { PvHeroHeader } from "./pv/PvHeroHeader";
import { PvQuickOnboardingGuide } from "./pv/PvQuickOnboardingGuide";
import { useUiNotice } from "./useUiNotice";
import { ProductBasicWizard } from "./ProductBasicWizard";
import {
  PV_BASIC_WIZARD_LS_KEY,
  PV_BASIC_WIZARD_STEPS,
  PV_HERO_EXAMPLE_SELECT_ID,
} from "./pv-basic-wizard";
import { useProductBasicWizard } from "./use-product-basic-wizard";
import { sectionNeedsAttentionClass, scrollToFirstNeedsAttentionSection } from "./calculator-section-focus";
import { createPvScrollToInputs } from "./pv/create-pv-scroll-to-inputs";
import { calculatorInputIssueBannerFromVerdict } from "./calculator-verdict-ui";
import { useFocusExampleOnMount } from "./useFocusExampleOnMount";
import { useFocusInputsOnMount } from "./useFocusInputsOnMount";
import type { ProductView } from "./ProductViewPills";
import { PvCalculatorShell } from "./pv/PvCalculatorShell";
import { InputOutputLegend } from "./phmax-zs-ui";
import { OwnDataHint } from "./OwnDataHint";
import { buildPhmaxPvMultiExportRows } from "./phmax-pv-export-rows";
import { createPvProductAuditProtocol } from "./phmax-product-audit";
import { comparePhmaxProductVariants } from "./phmax-product-compare";
import { downloadPhmaxProductAuditJson, downloadPhmaxProductCompareJson } from "./phmax-product-audit-download";
import {
  computePvPhmaxTotal,
  getPhaMaxPv,
  getPvAppendixBandLabels,
  getPvAppendixMatrixRow,
  type PvProvozKind,
} from "./phmax-pv-logic";
import {
  type PvHeroExampleKey,
  PV_HERO_EXAMPLE_ILL_KEYS,
  PV_HERO_EXAMPLE_METH_KEYS,
  PV_HERO_EXAMPLE_META,
  PV_HERO_EXAMPLE_SELECT_LEGEND,
  pvHeroExampleSnapshot,
} from "./phmax-pv-hero-examples";
import { computePv1d3Reduction } from "./phmax-pv-1d3-reduction";
import { PvResultsOverviewSection } from "./pv/PvResultsOverviewSection";
import { PvWorkplacesSummarySection } from "./pv/PvWorkplacesSummarySection";
import { PvWorkplaceRowsSection } from "./pv/PvWorkplaceRowsSection";
import {
  PV_PROVOZ_OPTIONS,
  type PvWorkplaceRowState,
} from "./pv/pv-workplace-shared";
import { round2 } from "./phmax-zs-logic";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import { FieldWhyPhmaxDetails } from "./FieldWhyPhmax";
import { PhmaxPvMethodologyTables123, type PvMethodologyActiveCell } from "./phmax-pv-methodology-tables";

type PhmaxPvPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const PV_GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    term: "PHmax (předškolní vzdělávání)",
    description: (
      <>
        Nejvyšší týdenní rozsah přímé pedagogické činnosti (hodiny) pro mateřskou školu / pracoviště podle tabulek v
        příloze k <strong>vyhlášce č. 14/2005 Sb.</strong> a metodiky PHmax/PHAmax pro PV (tabulky 1–3 podle druhu
        provozu a průměrné denní doby).
      </>
    ),
  },
  {
    term: "PHAmax (asistent pedagoga)",
    description: (
      <>
        Orientační strop týdenních hodin přímé pedagogické činnosti <strong>asistenta pedagoga</strong> u tříd zřízených
        podle § 16 odst. 9 školského zákona. Počítá se zvlášť od PHmax; přebytky jednoho nelze použít na druhé.
      </>
    ),
  },
  {
    term: "Pracoviště (řádek ve formuláři)",
    description: (
      <>
        Jedna kombinace <strong>místa (nebo jeho části) a druhu provozu</strong> – odpovídá jednomu dílčímu výpočtu v
        metodice. Při více provozech na stejném místě (např. celodenní i polodenní) přidejte další řádek; součet PHmax z
        řádků odpovídá celkovému PHmax.
      </>
    ),
  },
  {
    term: "Třída podle § 16 odst. 9 školského zákona",
    description: (
      <>
        Třída zřízená pro děti, na které se uplatní zvláštní pravidla; v kalkulačce zvyšuje PHmax o{" "}
        <strong>5 hodin týdně za každou takto označenou třídu</strong> (navíc k tabulkové hodnotě) a vstupuje do výpočtu
        PHAmax.
      </>
    ),
  },
  {
    term: "Skupina jazykové přípravy",
    description: (
      <>
        Dle metodiky v4: ke PHmax se přičítá <strong>+1 hodina týdně za každou skupinu</strong> jazykové přípravy dle §
        1d odst. 11 vyhlášky č. 14/2005 Sb., kterou zadáte u pracoviště.
      </>
    ),
  },
  {
    term: "MŠ při zdravotnickém zařízení",
    description: (
      <>
        Samostatný režim výpočtu podle výkazu S 4-01 (v aplikaci volba „Mateřská škola při zdravotnickém zařízení“) –
        základ PHmax se nečte z tabulek 1–3 podle hodin, ale podle pravidel metodiky pro tento typ zařízení.
      </>
    ),
  },
];

const PV_VIEW_MODE_LS_KEY = "phmax-pv-view-mode";
const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";
const PV_NAMED_SNAPSHOTS_LS_KEY = "edu-cz-pv-named-snapshots-v1";
const PV_MAX_NAMED_SNAPSHOTS = 10;

type NamedPvSnapshot = { id: string; name: string; savedAt: string; snapshot: { rows: PvWorkplaceRowState[] } };

function readNamedPvSnapshotsFromLs(): NamedPvSnapshot[] {
  try {
    const raw = localStorage.getItem(PV_NAMED_SNAPSHOTS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: NamedPvSnapshot[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeNamedPvSnapshotsToLs(items: NamedPvSnapshot[]) {
  try {
    localStorage.setItem(PV_NAMED_SNAPSHOTS_LS_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

const PROVOZ_OPTIONS = PV_PROVOZ_OPTIONS;

function newPvRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialPvRow(): PvWorkplaceRowState {
  const provoz: PvProvozKind = "celodenni";
  return {
    id: newPvRowId(),
    label: "",
    provoz,
    classCount: 0,
    avgHours: 0,
    sec16Count: 0,
    languageGroups: 0,
    pv1dActualChildren: 0,
    pv1dMinimumChildren: 0,
    pv1dKuPhmaxCap: 0,
    pv1dKuDecisionRef: "",
    pv1dExemption: false,
  };
}

function renderBandLabelWithBreak(label: string) {
  const splitToken = " do ";
  const idx = label.indexOf(splitToken);
  if (idx < 0) return label;
  const first = label.slice(0, idx).trimEnd();
  const second = `do ${label.slice(idx + splitToken.length).trimStart()}`;
  return (
    <>
      {first}
      <br />
      {second}
    </>
  );
}

function normalizePvRow(item: unknown): PvWorkplaceRowState | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const provoz = r.provoz;
  if (!PROVOZ_OPTIONS.some((x) => x.value === provoz)) return null;
  return {
    id: typeof r.id === "string" ? r.id : newPvRowId(),
    label: typeof r.label === "string" ? r.label : "",
    provoz: provoz as PvProvozKind,
    classCount: typeof r.classCount === "number" && Number.isFinite(r.classCount) ? Math.max(0, r.classCount) : 0,
    avgHours: typeof r.avgHours === "number" && Number.isFinite(r.avgHours) ? Math.max(0, r.avgHours) : 0,
    sec16Count: typeof r.sec16Count === "number" && Number.isFinite(r.sec16Count) ? Math.max(0, r.sec16Count) : 0,
    languageGroups:
      typeof r.languageGroups === "number" && Number.isFinite(r.languageGroups) ? Math.max(0, r.languageGroups) : 0,
    pv1dActualChildren:
      typeof r.pv1dActualChildren === "number" && Number.isFinite(r.pv1dActualChildren)
        ? Math.max(0, r.pv1dActualChildren)
        : 0,
    pv1dMinimumChildren:
      typeof r.pv1dMinimumChildren === "number" && Number.isFinite(r.pv1dMinimumChildren)
        ? Math.max(0, r.pv1dMinimumChildren)
        : 0,
    pv1dKuPhmaxCap:
      typeof r.pv1dKuPhmaxCap === "number" && Number.isFinite(r.pv1dKuPhmaxCap) ? Math.max(0, r.pv1dKuPhmaxCap) : 0,
    pv1dKuDecisionRef: typeof r.pv1dKuDecisionRef === "string" ? r.pv1dKuDecisionRef : "",
    pv1dExemption: r.pv1dExemption === true,
  };
}

function parsePvSnapshot(data: unknown): PvWorkplaceRowState[] | null {
  if (!data || typeof data !== "object") return null;
  const rowsRaw = (data as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return null;
  const out: PvWorkplaceRowState[] = [];
  for (const item of rowsRaw) {
    const row = normalizePvRow(item);
    if (row) out.push(row);
  }
  return out.length ? out : null;
}

function loadPvRowsFromStorage(): PvWorkplaceRowState[] {
  try {
    const raw = localStorage.getItem(PV_STORAGE_KEY);
    if (!raw) return [createInitialPvRow()];
    const parsed = parsePvSnapshot(JSON.parse(raw));
    return parsed ?? [createInitialPvRow()];
  } catch {
    return [createInitialPvRow()];
  }
}

/** Mimo komponentu kvůli stabilnímu odkazu v JSX (částečné mergy nemohou „ztratit“ handler uvnitř hooků). */
function applyPvHeroExampleSelection(
  key: PvHeroExampleKey,
  setters: {
    setSelected: (k: PvHeroExampleKey) => void;
    setRows: (rows: PvWorkplaceRowState[]) => void;
    setNotice: (msg: string) => void;
  },
) {
  setters.setSelected(key);
  if (!key) return;
  const snap = pvHeroExampleSnapshot(key);
  const next = parsePvSnapshot({ rows: snap.rows });
  if (next) {
    setters.setRows(next);
    setters.setNotice("Načten ukázkový příklad z metodiky nebo z přílohy.");
  } else {
    setters.setNotice("Ukázkový příklad se nepodařilo načíst.");
  }
}

export function PhmaxPvPage({ productView, setProductView }: PhmaxPvPageProps) {
  const [rows, setRows] = useState<PvWorkplaceRowState[]>(() => loadPvRowsFromStorage());
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [uiNotice, setUiNotice] = useUiNotice();
  const setUiNoticeRef = useRef(setUiNotice);
  const [namedSnapshots, setNamedSnapshots] = useState<NamedPvSnapshot[]>([]);
  const [selectedNamedId, setSelectedNamedId] = useState("");
  const [namedSaveName, setNamedSaveName] = useState("");
  const [selectedPvHeroExample, setSelectedPvHeroExample] = useState<PvHeroExampleKey>("");
  const [displayDensity, setDisplayDensity] = useDisplayDensity();
  const [focusMode, setFocusMode] = useCalculatorFocusMode();
  const heroHeaderRef = useRef<HTMLElement>(null);
  const [viewMode, setViewMode] = useState<CalculatorViewMode>(() => {
    try {
      const stored = localStorage.getItem(PV_VIEW_MODE_LS_KEY);
      return stored === "expert" ? "expert" : "basic";
    } catch {
      return "basic";
    }
  });
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const glossaryTriggerRef = useRef<HTMLButtonElement>(null);
  const { guideOpen, dismissGuide, toggleGuide, helpButtonRef } = useQuickOnboarding(PHMAX_PV_ONBOARDING_LS_KEY, {
    scrollAnchorId: "pv-quick-onboarding",
  });

  useEffect(() => {
    setUiNoticeRef.current = setUiNotice;
  }, [setUiNotice]);
  const selectedPvHeroExampleMeta =
    selectedPvHeroExample && selectedPvHeroExample in PV_HERO_EXAMPLE_META
      ? PV_HERO_EXAMPLE_META[selectedPvHeroExample as Exclude<PvHeroExampleKey, "">]
      : null;

  const pvHeroExampleGroups = useMemo(
    () => [
      {
        label: "Metodika – výkladové příklady",
        options: heroExampleOptionsFromKeys(PV_HERO_EXAMPLE_METH_KEYS, PV_HERO_EXAMPLE_META),
      },
      {
        label: "Příloha – ilustrace MŠ (bez § 16/9)",
        options: heroExampleOptionsFromKeys(PV_HERO_EXAMPLE_ILL_KEYS, PV_HERO_EXAMPLE_META),
      },
    ],
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(PV_VIEW_MODE_LS_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    setNamedSnapshots(readNamedPvSnapshotsFromLs());
  }, []);

  const patchRow = useCallback((id: string, patch: Partial<PvWorkplaceRowState>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createInitialPvRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const rowComputations = useMemo(() => {
    return rows.map((row) => {
      const computed = computePvPhmaxTotal({
        provoz: row.provoz,
        classCount: row.classCount,
        avgHoursPerDay: row.avgHours,
        sec16ClassCount: row.sec16Count,
        languageGroupCount: row.languageGroups,
      });
      const hoursForPha = row.provoz === "zdravotnicke" ? 8 : row.avgHours;
      const phaMax = row.sec16Count > 0 ? getPhaMaxPv(row.sec16Count, hoursForPha) : null;
      const provozLabel = PROVOZ_OPTIONS.find((o) => o.value === row.provoz)?.label ?? row.provoz;
      const basePhmax = computed.totalPhmax;
      const reduction1d3 =
        basePhmax != null
          ? computePv1d3Reduction(basePhmax, {
              actualChildren: row.pv1dActualChildren > 0 ? row.pv1dActualChildren : undefined,
              minimumChildren: row.pv1dMinimumChildren > 0 ? row.pv1dMinimumChildren : undefined,
              kuPhmaxCap: row.pv1dKuPhmaxCap > 0 ? row.pv1dKuPhmaxCap : undefined,
              kuDecisionRef: row.pv1dKuDecisionRef.trim() || undefined,
              exemptionConfirmed: row.pv1dExemption,
            })
          : null;
      const effectivePhmax =
        reduction1d3?.status === "reduced" ? reduction1d3.phmaxAfter : basePhmax;
      return { row, computed, phaMax, provozLabel, reduction1d3, effectivePhmax };
    });
  }, [rows]);

  const pvMethodologyActiveCells: PvMethodologyActiveCell[] = useMemo(() => {
    const out: PvMethodologyActiveCell[] = [];
    for (const c of rowComputations) {
      const base = c.computed.base;
      if (!base || base.durationColumnIndex < 0) continue;
      const provoz = c.row.provoz;
      if (provoz === "zdravotnicke") continue;
      const table = provoz === "polodenni" ? 1 : provoz === "celodenni" ? 2 : 3;
      out.push({ table, rowIndex: c.row.classCount - 1, colIndex: base.durationColumnIndex });
    }
    return out;
  }, [rowComputations]);

  const aggregate = useMemo(() => {
    let phmaxSum = 0;
    let phaSum = 0;
    let incomplete = false;
    for (const c of rowComputations) {
      if (c.effectivePhmax != null) phmaxSum += c.effectivePhmax;
      else incomplete = true;
      if (c.phaMax != null) phaSum += c.phaMax;
    }
    return {
      phmaxSum: round2(phmaxSum),
      phaSum: round2(phaSum),
      incomplete,
    };
  }, [rowComputations]);

  const pvVerdict = useMemo(() => {
    if (rows.length === 0) {
      return {
        tone: "warning" as const,
        label: "Pro smysluplný součet PHmax doplňte pracoviště",
        detail: "Přidejte alespoň jedno pracoviště (kód provozu, počet tříd, průměrná denní doba).",
      };
    }
    const invalidRows = rowComputations.filter((c) => c.computed.totalPhmax == null).length;
    if (invalidRows > 0) {
      return {
        tone: "warning" as const,
        label: "Na hraně: část pracovišť ještě není dopočtená",
        detail: `Doplňte ${invalidRows} pracovišť (kód provozu, počet tříd, hodiny, případně § 16). Pak bude součet PHmax kompletní.`,
      };
    }
    return {
      tone: "ok" as const,
      label: "Vstupy jsou kompletní",
      detail: "Součet PHmax je vypočítaný pro všechna zadaná pracoviště. Pokračujte uložením scénáře nebo exportem.",
    };
  }, [rowComputations, rows.length]);

  const pvWorkflow = useMemo(() => {
    const invalidRows = rowComputations.filter((c) => c.computed.totalPhmax == null).length;
    if (rows.length === 0) {
      return {
        recommendedStep: "Vyplňte alespoň jedno pracoviště.",
        steps: [
          { label: "Vyplnit vstupní řádky pracovišť", state: "active" as const },
          { label: "Zkontrolovat součet PHmax/PHAmax", state: "todo" as const },
          { label: "Uložit nebo exportovat výsledek", state: "todo" as const },
        ],
      };
    }
    if (invalidRows > 0) {
      return {
        recommendedStep: "Opravte neplatné řádky, které nejsou započítané do součtu.",
        steps: [
          { label: "Vyplnit vstupní řádky pracovišť", state: "done" as const },
          { label: "Opravit neplatné řádky", state: "active" as const },
          { label: "Uložit nebo exportovat výsledek", state: "todo" as const },
        ],
      };
    }
    return {
      recommendedStep: "Výpočet je připraven k uložení nebo exportu.",
      steps: [
        { label: "Vyplnit vstupní řádky pracovišť", state: "done" as const },
        { label: "Zkontrolovat součet PHmax/PHAmax", state: "done" as const },
        { label: "Uložit nebo exportovat výsledek", state: "active" as const },
      ],
    };
  }, [rowComputations, rows.length]);

  const exportRows = useMemo(() => {
    const items = rowComputations.map((c, i) => ({
      index: i + 1,
      label: c.row.label,
      provozLabel: c.provozLabel,
      provoz: c.row.provoz,
      classCount: c.row.classCount,
      avgHoursPerDay: c.row.avgHours,
      sec16Count: c.row.sec16Count,
      languageGroups: c.row.languageGroups,
      computed: c.computed,
      phaMax: c.phaMax,
      reduction1d3: c.reduction1d3,
    }));
    return buildPhmaxPvMultiExportRows(items, aggregate);
  }, [rowComputations, aggregate]);

  const handleExportCsv = useCallback(() => {
    const rows = [...buildExportMetaRows("pv"), EXPORT_CSV_SEPARATOR_ROW, ...exportRows];
    downloadTextFile(
      exportFilenameStamped("phmax-pv", "csv"),
      exportCsvLocalized(rows),
      "text/csv;charset=utf-8",
    );
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace (produkt)", "PHmax / PHAmax – předškolní vzdělávání"],
          ...buildExportMetaRows("pv"),
          ["Vytvořil", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
        ],
        valueRows: exportRows,
        filename: exportFilenameStamped("phmax-pv", "xlsx"),
      });
      setUiNoticeRef.current("Byl stažen soubor Excel (XLSX).");
    } catch (e) {
      console.error(e);
      setUiNoticeRef.current(`Export do Excelu se nepodařil. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  const buildPvSnapshot = useCallback(() => {
    let totalPhmax = 0;
    let any = false;
    for (const c of rowComputations) {
      if (c.computed.totalPhmax != null) {
        totalPhmax += c.computed.totalPhmax;
        any = true;
      }
    }
    return {
      rows,
      ...(any ? { _phmaxAuditTotals: { totalPhmax: round2(totalPhmax), tab: "phmax" as const } } : {}),
    };
  }, [rows, rowComputations]);

  const applyPvSnapshot = useCallback((data: unknown) => {
    const next = parsePvSnapshot(data);
    if (next) {
      setSelectedPvHeroExample("");
      setRows(next);
      setUiNoticeRef.current("Data byla obnovena.");
    } else {
      setUiNoticeRef.current(MSG_DATA_UNEXPECTED_SHAPE);
    }
  }, []);

  const savePvSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(PV_STORAGE_KEY, JSON.stringify(buildPvSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
      setUiNoticeRef.current("Rozpracované údaje byly uloženy.");
    } catch {
      setUiNoticeRef.current(`Uložení se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [buildPvSnapshot]);

  const restorePvSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(PV_STORAGE_KEY);
      if (!raw) {
        setUiNoticeRef.current(MSG_NO_LOCAL_AUTOSAVE_DATA);
        return;
      }
      applyPvSnapshot(JSON.parse(raw));
    } catch {
      setUiNoticeRef.current(`Obnovení uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [applyPvSnapshot]);

  const saveNamedSnapshot = useCallback(() => {
    const name = namedSaveName.trim() || new Date().toLocaleString("cs-CZ");
    const id = `n-${Date.now()}`;
    const item: NamedPvSnapshot = { id, name, savedAt: new Date().toISOString(), snapshot: buildPvSnapshot() };
    setNamedSnapshots((prev) => {
      const next = [item, ...prev].slice(0, PV_MAX_NAMED_SNAPSHOTS);
      writeNamedPvSnapshotsToLs(next);
      return next;
    });
    setNamedSaveName("");
    setUiNoticeRef.current(namedBackupSavedNotice(name, PV_MAX_NAMED_SNAPSHOTS));
  }, [buildPvSnapshot, namedSaveName]);

  const restoreNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_FIRST);
      return;
    }
    applyPvSnapshot(item.snapshot);
    setUiNoticeRef.current(`Obnovena záloha „${item.name}“.`);
  }, [applyPvSnapshot, namedSnapshots, selectedNamedId]);

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
      writeNamedPvSnapshotsToLs(next);
      return next;
    });
    setSelectedNamedId("");
    setUiNoticeRef.current("Pojmenovaná záloha byla smazána.");
  }, [namedSnapshots, selectedNamedId]);

  const clearPvStoredSnapshot = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_CLEAR_BROWSER_STORAGE)) return;
    try {
      localStorage.removeItem(PV_STORAGE_KEY);
      setLastSavedAt("");
      setUiNoticeRef.current("Uložená data v prohlížeči byla vymazána.");
    } catch {
      setUiNoticeRef.current(`Vymazání uložených dat se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, []);

  const resetPvAll = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_RESET_FORM_ALL)) return;
    setSelectedPvHeroExample("");
    setRows([createInitialPvRow()]);
    setUiNoticeRef.current("Všechna vstupní data kalkulačky byla vymazána.");
  }, []);

  const buildPvSummaryText = useCallback(() => {
    return [
      "Shrnutí – PHmax a PHAmax, předškolní vzdělávání",
      "",
      `Čas: ${new Date().toLocaleString("cs-CZ")}`,
      `Počet pracovišť ve výpočtu: ${rows.length}`,
      `PHmax celkem: ${aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum}`,
      `PHAmax celkem: ${aggregate.phaSum > 0 ? aggregate.phaSum : "–"}`,
      "",
      aggregate.incomplete ? "* PHmax nezahrnuje pracoviště s neplatným vstupem." : "",
      "",
      APP_AUTHOR_CREDIT_LINE,
    ]
      .filter(Boolean)
      .join("\n");
  }, [rows.length, aggregate]);

  const copyPvSummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildPvSummaryText());
      setUiNoticeRef.current("Shrnutí bylo zkopírováno do schránky.");
    } catch {
      setUiNoticeRef.current(`Kopírování do schránky se nepodařilo. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
    }
  }, [buildPvSummaryText]);

  const printPvSummary = useCallback(() => {
    const plain = stripAppAuthorCreditFromPlainSummary(buildPvSummaryText());
    const text = plain.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><title>Shrnutí PHmax PV</title>` +
        `<style>${APP_AUTHOR_PRINT_SUMMARY_DOC_STYLES}</style>` +
        `</head><body class="print-summary-doc"><main class="print-summary-doc__main">` +
        `<h1 style="font-size:12pt;margin:0 0 8px;font-weight:800">Shrnutí – předškolní vzdělávání</h1><p>${text}</p></main>` +
        `${getAppAuthorPrintFooterHtml()}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }, [buildPvSummaryText]);

  const buildPvAuditProtocol = useCallback(() => {
    return createPvProductAuditProtocol(
      rows.map((r) => ({
        label: r.label.trim() || undefined,
        provoz: r.provoz,
        classCount: r.classCount,
        avgHoursPerDay: r.avgHours,
        sec16ClassCount: r.sec16Count,
        languageGroupCount: r.languageGroups,
      })),
    );
  }, [rows]);

  const handleExportAuditJson = useCallback(() => {
    downloadPhmaxProductAuditJson(buildPvAuditProtocol(), "pv");
    setUiNoticeRef.current("Stažen auditní protokol (JSON).");
  }, [buildPvAuditProtocol]);

  const handleCompareWithNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNoticeRef.current(MSG_NAMED_BACKUP_PICK_TO_COMPARE);
      return;
    }
    const protocolNamed = createPvProductAuditProtocol(
      item.snapshot.rows.map((r) => ({
        label: r.label.trim() || undefined,
        provoz: r.provoz,
        classCount: r.classCount,
        avgHoursPerDay: r.avgHours,
        sec16ClassCount: r.sec16Count,
        languageGroupCount: r.languageGroups,
      })),
    );
    const cmp = comparePhmaxProductVariants([
      { id: "current", label: "Aktuální stav", protocol: buildPvAuditProtocol() },
      { id: "named", label: item.name, protocol: protocolNamed },
    ]);
    downloadPhmaxProductCompareJson(cmp, "pv");
    setUiNoticeRef.current(`Staženo srovnání: aktuální stav vs „${item.name}“ (JSON).`);
  }, [namedSnapshots, selectedNamedId, buildPvAuditProtocol]);

  const pvComparePreview = useMemo(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) return null;
    const protocolNamed = createPvProductAuditProtocol(
      item.snapshot.rows.map((r) => ({
        label: r.label.trim() || undefined,
        provoz: r.provoz,
        classCount: r.classCount,
        avgHoursPerDay: r.avgHours,
        sec16ClassCount: r.sec16Count,
        languageGroupCount: r.languageGroups,
      })),
    );
    return comparePhmaxProductVariants([
      { id: "current", label: "Aktuální stav", protocol: buildPvAuditProtocol() },
      { id: "named", label: item.name, protocol: protocolNamed },
    ]);
  }, [namedSnapshots, selectedNamedId, buildPvAuditProtocol]);

  useEffect(() => {
    try {
      localStorage.setItem(PV_STORAGE_KEY, JSON.stringify(buildPvSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
    } catch {
      /* ignore */
    }
  }, [buildPvSnapshot]);

  const pvTocSections = [
    { id: "pv-vysledek", label: "Souhrn a výsledek" },
    { id: "pv-vstupy", label: "Vstupy (pracoviště)" },
  ] as const;

  const pvBasicWizardActive = viewMode === "basic";
  const pvHasInputIssue = pvVerdict.tone !== "ok";
  const pvScrollToInputs = useMemo(() => createPvScrollToInputs(), []);
  const { step: pvWizardStep, goToStep: goToPvWizardStep, handleBack: handlePvWizardBack, handleNext: handlePvWizardNext } =
    useProductBasicWizard({
      lsKey: PV_BASIC_WIZARD_LS_KEY,
      steps: PV_BASIC_WIZARD_STEPS,
      active: pvBasicWizardActive,
    });

  useFocusExampleOnMount(PV_HERO_EXAMPLE_SELECT_ID);
  useFocusInputsOnMount(pvScrollToInputs);

  return (
    <div
      className={`${calculatorShellClassName(viewMode, displayDensity, focusMode)} app-shell--with-toc${pvBasicWizardActive ? ` product-basic-wizard-active pv-wizard-step-${pvWizardStep}` : ""}${pvHasInputIssue ? " app-shell--validation-hint" : ""}`}
    >
      <PvHeroHeader
        heroHeaderRef={heroHeaderRef}
        productView={productView}
        setProductView={setProductView}
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
        phmaxTotalDisplay={aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum}
        phaMaxDisplay={aggregate.phaSum > 0 ? aggregate.phaSum : "–"}
        workplaceCount={rows.length}
        verdictLabel={pvVerdict.label}
        aggregateIncomplete={aggregate.incomplete}
        toolbar={{
          selectedExample: selectedPvHeroExample,
          exampleGroups: pvHeroExampleGroups,
          exampleLegend: PV_HERO_EXAMPLE_SELECT_LEGEND,
          selectedExampleMetaTitle: selectedPvHeroExampleMeta?.title ?? null,
          onExampleChange: (key) =>
            applyPvHeroExampleSelection(key, {
              setSelected: setSelectedPvHeroExample,
              setRows,
              setNotice: setUiNotice,
            }),
          maxNamedSnapshots: PV_MAX_NAMED_SNAPSHOTS,
          onSaveSnapshot: savePvSnapshotManually,
          onExportCsv: handleExportCsv,
          onExportXlsx: handleExportXlsx,
          xlsxExportBusy,
          onPrintSummary: printPvSummary,
          onRestoreSnapshot: restorePvSnapshot,
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
          comparePreview: pvComparePreview,
          onCopySummary: copyPvSummary,
          onClearStored: clearPvStoredSnapshot,
          onResetAll: resetPvAll,
        }}
      />

      <PvQuickOnboardingGuide open={guideOpen} onDismiss={dismissGuide} returnFocusRef={helpButtonRef} />
      {pvBasicWizardActive ? (
        <ProductBasicWizard
          productLabel="PV"
          steps={PV_BASIC_WIZARD_STEPS}
          step={pvWizardStep}
          heroExampleSelectId={PV_HERO_EXAMPLE_SELECT_ID}
          onStartEmptyForm={resetPvAll}
          inputIssueFix={pvHasInputIssue ? { onFix: pvScrollToInputs } : undefined}
          onStepChange={goToPvWizardStep}
          onBack={handlePvWizardBack}
          onNext={handlePvWizardNext}
        />
      ) : null}

      {pvHasInputIssue ? (
        <CalculatorInputIssueBanner
          {...calculatorInputIssueBannerFromVerdict(pvVerdict, pvScrollToInputs)}
        />
      ) : null}

      <PvCalculatorShell
        workspaceDockLabel={CALCULATOR_WORKSPACE_DOCK_LABEL}
        sticky={{
          anchorRef: heroHeaderRef,
          primaryLabel: "PHmax celkem",
          primaryValue: aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum,
          statusText: pvVerdict.label,
          tone: pvVerdict.tone,
          onSave: savePvSnapshotManually,
          onExport: handleExportCsv,
        }}
        dock={{
          pvVerdictTone: pvVerdict.tone,
          phmaxTotalDisplay: aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum,
          phaSum: aggregate.phaSum,
          workplaceCount: rows.length,
          pvVerdictLabel: pvVerdict.label,
          pvVerdictDetail: pvVerdict.detail,
          pvBasicWizardActive,
          pvWorkflowSteps: pvWorkflow.steps,
          viewMode,
          pvComparePreview,
          selectedNamedId,
          pvHasInputIssue,
          onGoToIssue: () => scrollToFirstNeedsAttentionSection(["pv-vstupy"]),
          savePvSnapshotManually,
          handleExportCsv,
          handleCompareWithNamedSnapshot,
        }}
        main={
          <>

      <PvResultsOverviewSection rows={rowComputations} aggregate={aggregate} />

      <section
        className={`card section-card section-card--pv${sectionNeedsAttentionClass(pvHasInputIssue)}`}
        data-section="pv-vstupy"
        data-wizard-step="2"
      >
        <h2 className="section-title">Vstupy (pracoviště)</h2>
        <OwnDataHint variant="form" />
        <InputOutputLegend />
        <p className="section-lead muted-text print-hide" style={{ marginTop: 0 }}>
          Export a tisk najdete v horní liště u nadpisu stránky.
        </p>

        {rows.length === 0 ? (
          <div className="card card--warning pv-empty-workplace-hint" style={{ marginBottom: 14, padding: 12 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Kdy přidat další pracoviště</p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.5 }}>
              <li>odloučené místo školy (jiná adresa nebo provoz);</li>
              <li>jiný druh provozu na stejném místě (celodenní / polodenní / internátní);</li>
              <li>samostatná situace, kterou potřebujete vykázat zvlášť v souhrnu.</li>
            </ul>
            <p className="muted-text" style={{ margin: "10px 0 0", fontSize: "0.86rem" }}>
              Začněte tlačítkem <strong>Přidat pracoviště</strong> níže – každá kombinace místa a druhu provozu je jeden řádek.
            </p>
          </div>
        ) : null}

        <FieldWhyPhmaxDetails summary="Proč se PHmax počítá po pracovištích?">
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              Každé <strong>pracoviště</strong> = jedna kombinace místa (nebo jeho části) a <strong>druhu provozu</strong> – odpovídá jednomu dílčímu výpočtu v metodice; součet řádků v souhrnné tabulce nahoře odpovídá součtu PHmax z pracovišť.
            </li>
            <li>
              U každého pracoviště níže najdete totéž vysvětlení u konkrétních vstupů – tabulky 1–3 přílohy, případně zvláštní režim MŠ u zdravotnického zařízení.
            </li>
            <li>
              Po úpravách vždy ověřte <strong>součtový přehled pracoviští</strong> i případné upozornění u řádků s neúplnými vstupy.
            </li>
          </ul>
        </FieldWhyPhmaxDetails>

        <PvWorkplaceRowsSection
          rows={rowComputations}
          workplaceCount={rows.length}
          onPatchRow={patchRow}
          onRemoveRow={removeRow}
        />

        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn btn--pv-add-workplace" onClick={addRow}>
            Přidat pracoviště (další kombinace místo / druhu provozu)
          </button>
        </div>

        {rowComputations.some((c) => c.computed.issues.length > 0) ? (
          <div className="card card--warning" style={{ marginTop: 20, padding: 14 }}>
            {rowComputations.flatMap((c, i) =>
              c.computed.issues.map((issue, j) => ({ issue, i, j, id: c.row.id }))
            ).map((x, idx) => (
              <p key={`${x.id}-warn-${x.issue.code}-${x.j}`} style={{ margin: idx === 0 ? 0 : "10px 0 0" }}>
                <strong>Pracoviště {x.i + 1}:</strong> {x.issue.message}
              </p>
            ))}
          </div>
        ) : null}

        <PvWorkplacesSummarySection rows={rowComputations} aggregate={aggregate} />

        {viewMode === "expert" ? (
        <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
          <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
            Rozpad / ověření vůči tabulkám přílohy (PV)
          </summary>
          <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.86rem", lineHeight: 1.5 }}>
            U každého pracoviště s platným základem z tabulky 1–3 je zobrazen celý řádek matice pro váš počet tříd.
            Názvy sloupců odpovídají <strong>pásmům průměrné denní doby provozu</strong> ze stejné přílohové mřížky jako
            tabulky 1–3 níže. Sloupec odpovídající zadané průměrné době provozu je zvýrazněn – hodnota musí souhlasit se
            základním PHmax před navýšeními § 16/9 a jazykovou přípravou. U MŠ při zdravotnickém zařízení se tabulky 1–3
            nepoužívají.
          </p>
          {rowComputations.map((c, i) => {
            const { row, computed, provozLabel } = c;
            if (row.provoz === "zdravotnicke") {
              return (
                <div key={row.id} style={{ marginBottom: 18 }}>
                  <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
                    Pracoviště {i + 1}
                    {row.label.trim() ? ` – ${row.label.trim()}` : ""} ({provozLabel})
                  </h4>
                  <p className="muted-text" style={{ fontSize: "0.84rem", margin: 0 }}>
                    PHmax se nečte z tabulky podle sloupců doby – používá se 31 h/třídu dle metodiky (S 4-01).
                  </p>
                </div>
              );
            }
            if (!computed.base) {
              return (
                <div key={row.id} style={{ marginBottom: 18 }}>
                  <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
                    Pracoviště {i + 1}
                    {row.label.trim() ? ` – ${row.label.trim()}` : ""}
                  </h4>
                  <p className="muted-text" style={{ fontSize: "0.84rem", margin: 0 }}>
                    Bez platného základu z tabulky (upravte vstupy výše).
                  </p>
                </div>
              );
            }
            const matrix = getPvAppendixMatrixRow(row.provoz, row.classCount);
            const bandLabels = getPvAppendixBandLabels(row.provoz);
            const col = computed.base.durationColumnIndex;
            if (!matrix || !bandLabels) return null;
            const segmentSize = 6;
            const columnSegments: number[][] = [];
            for (let start = 0; start < bandLabels.length; start += segmentSize) {
              columnSegments.push(
                Array.from(
                  { length: Math.min(segmentSize, bandLabels.length - start) },
                  (_, i) => start + i,
                ),
              );
            }
            return (
              <div key={row.id} style={{ marginBottom: 22 }}>
                <h4 className="section-title" style={{ fontSize: "0.98rem", margin: "0 0 8px" }}>
                  Pracoviště {i + 1}
                  {row.label.trim() ? ` – ${row.label.trim()}` : ""} – {provozLabel}, {row.classCount}{" "}
                  {row.classCount === 1 ? "třída" : row.classCount < 5 ? "třídy" : "tříd"}
                </h4>
                {columnSegments.length > 1 ? (
                  <p className="muted-text" style={{ marginTop: 0, marginBottom: 8, fontSize: "0.82rem", lineHeight: 1.45 }}>
                    Tabulka je rozdělena do navazujících bloků pro lepší čitelnost – druhý a další blok navazuje v pořadí
                    sloupců (pásem).
                  </p>
                ) : null}
                <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
                  <table className="sd-phmax-breakdown pv-appendix-verify-matrix">
                    <thead>
                      {columnSegments.map((segment, segmentIndex) => (
                        <tr key={`${row.id}-h-seg-${segmentIndex}`}>
                          <th scope="col" className="sd-phmax-breakdown__corner">
                            {segmentIndex === 0 ? "Sloupec (pásmo)" : "Pokračování"}
                          </th>
                          {segment.map((j) => (
                            <th
                              key={`${row.id}-h-${j}`}
                              scope="col"
                              className="sd-phmax-breakdown__head-num"
                              title={bandLabels[j]}
                            >
                              {renderBandLabelWithBreak(bandLabels[j])}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {columnSegments.map((segment, segmentIndex) => (
                        <tr key={`${row.id}-c-seg-${segmentIndex}`}>
                          <th scope="row" className="sd-phmax-breakdown__label">
                            {segmentIndex === 0 ? "PHmax základ (h/týd.)" : "Pokračování"}
                          </th>
                          {segment.map((j) => (
                            <td
                              key={`${row.id}-c-${j}`}
                              className={
                                "sd-phmax-breakdown__num" +
                                (j === col ? " sd-phmax-breakdown__cell--pv-active" : "")
                              }
                              title={bandLabels[j]}
                            >
                              {matrix[j]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollGrabRegion>
                <p className="muted-text" style={{ marginTop: 8, fontSize: "0.8rem", lineHeight: 1.45 }}>
                  Sloupec {col + 1}: {computed.base.durationColumnLabel}. Kontrola: základ tabulky{" "}
                  <strong>{computed.base.basePhmax}</strong> + § 16/9 ({computed.sec16Bonus}) + jazyková příprava (
                  {computed.languageBonus}) = <strong>{computed.totalPhmax ?? "–"}</strong>.
                </p>
              </div>
            );
          })}
        </details>
        ) : null}

        {viewMode === "expert" ? <PhmaxPvMethodologyTables123 activeCells={pvMethodologyActiveCells} /> : null}

        {aggregate.incomplete ? (
          <p className="muted-text" style={{ marginTop: 10, fontSize: "0.9rem" }}>
            * Do součtu PHmax jsou započítána jen pracoviště bez chyby vstupu. Ostatní opravte nebo příslušné pracoviště
            odstraňte, pokud ho nepotřebujete.
          </p>
        ) : null}

        <p className="muted-text" style={{ marginTop: 22 }}>
          Krácení PHmax při výjimkách z nejnižšího počtu dětí (<PvLegisRef citeId="pv-1d3" label="§ 1d odst. 3" />) v aplikaci
          neřešíme – nutno dopočítat dle vyhlášky. Odkazy na předpisy a metodiku jsou v přehledu níže.
        </p>
      </section>

          </>
        }
        afterWorkspace={
          <>
            {viewMode === "expert" ? <ProductLegisContextPanel variant="pv" /> : null}
            {viewMode === "expert" ? <MethodologyStrip /> : null}
          </>
        }
        footer={
          <footer className="zs-app-footer">
            <HeroStatusBar
              productLabel={PRODUCT_CALCULATOR_TITLES.pv}
              lastSavedAt={lastSavedAt}
              notice={uiNotice}
              variant="pv"
              placement="footer"
            />
            <AuthorCreditFooter />
          </footer>
        }
        tocSections={pvTocSections}
      />
      <GlossaryDialog
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        terms={PV_GLOSSARY_TERMS}
        triggerRef={glossaryTriggerRef}
      />
    </div>
  );
}
