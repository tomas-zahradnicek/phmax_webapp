import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  APP_AUTHOR_CREDIT_LINE,
  APP_AUTHOR_DISPLAY_NAME,
  APP_AUTHOR_EMAIL,
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
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
  IconJson,
  IconPrint,
  IconPrintSummary,
  IconResetAll,
  IconRestoreQuick,
  IconSaveQuick,
  IconSpinner,
} from "./HeroActionIconButton";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import { HeroStatusBar } from "./HeroStatusBar";
import { HeroStat } from "./HeroStat";
import { AuthorCreditFooter } from "./AuthorCreditFooter";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductLegisContextPanel, SdLegisRef } from "./PhmaxProductLegisUi";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
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

function formatSdHours(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type PhmaxSdPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const SD_ONBOARDING_KEY = "phmax-sd-onboarding";
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
          specialExceptionGranted,
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
      setUiNotice("Export do Excelu se nepodařil.");
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

  const applySdSnapshot = useCallback((data: unknown) => {
    const next = parseSdSnapshot(data);
    if (next) {
      setPupils(next.pupils);
      setManualDepts(next.manualDepts);
      setDepartments(next.departments);
      setInputMode(next.inputMode ?? "summary");
      setSummarySpecialDepartments(next.summarySpecialDepartments ?? []);
      setRegularExceptionGranted(next.regularExceptionGranted ?? false);
      setSpecialExceptionGranted(next.specialExceptionGranted ?? false);
      setDetailDepartments(next.detailDepartments ?? [{ kind: "regular", participants: 0 }]);
      setSchoolFirstStageClassCount(next.schoolFirstStageClassCount ?? null);
      setUiNotice("Data byla obnovena.");
    } else {
      setUiNotice("Uložená data nejsou ve očekávaném tvaru.");
    }
  }, []);

  const saveSdSnapshotManually = useCallback(() => {
    try {
      localStorage.setItem(SD_STORAGE_KEY, JSON.stringify(buildSdSnapshot()));
      setLastSavedAt(new Date().toLocaleString("cs-CZ"));
      setUiNotice("Rozpracované údaje byly uloženy.");
    } catch {
      setUiNotice("Uložení se nepodařilo.");
    }
  }, [buildSdSnapshot]);

  const restoreSdSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(SD_STORAGE_KEY);
      if (!raw) {
        setUiNotice("Nebyla nalezena žádná uložená data.");
        return;
      }
      applySdSnapshot(JSON.parse(raw));
    } catch {
      setUiNotice("Obnovení uložených dat se nepodařilo.");
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
    setUiNotice(`Záloha „${name}“ uložena do seznamu (max. ${SD_MAX_NAMED_SNAPSHOTS}).`);
  }, [buildSdSnapshot, namedSaveName]);

  const restoreNamedSnapshot = useCallback(() => {
    const item = namedSnapshots.find((x) => x.id === selectedNamedId);
    if (!item) {
      setUiNotice("Vyberte pojmenovanou zálohu v seznamu.");
      return;
    }
    applySdSnapshot(item.snapshot);
    setUiNotice(`Obnovena záloha „${item.name}“.`);
  }, [applySdSnapshot, namedSnapshots, selectedNamedId]);

  const deleteNamedSnapshot = useCallback(() => {
    if (!selectedNamedId) {
      setUiNotice("Vyberte zálohu ke smazání.");
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
      setUiNotice("Vymazání uložených dat se nepodařilo.");
    }
  }, []);

  const resetSdAll = useCallback(() => {
    if (!confirmDestructive(MSG_CONFIRM_RESET_FORM_ALL)) return;
    setPupils(0);
    setManualDepts(false);
    setDepartments(1);
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
      setUiNotice("Kopírování do schránky se nepodařilo.");
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
      setUiNotice("Vyberte v seznamu zálohu, kterou chcete porovnat s aktuálním stavem.");
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
              <HeroIconActionButton
                className="btn ghost"
                label="Stáhnout auditní protokol (JSON)"
                icon={<IconJson />}
                onClick={handleExportAuditJson}
              />
            </div>
            <hr className="hero-actions__divider" aria-hidden="true" />
            <div className="hero-actions__group hero-actions__group--named">
              <div className="hero-named-grid hero-named-grid--simple" aria-label="Pojmenované zálohy">
                <label className="hero-named-field hero-named-field--backup-name">
                  <span className="field__label field__label--hero-named">Název zálohy</span>
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
                    Uložit do seznamu
                  </button>
                </div>
                <div className="hero-named-field hero-named-field--select">
                  <select
                    className="input"
                    value={selectedNamedId}
                    onChange={(e) => setSelectedNamedId(e.target.value)}
                    aria-label="Vybrat uloženou zálohu"
                  >
                    <option value="">Vyberte uloženou zálohu…</option>
                    {namedSnapshots.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({new Date(n.savedAt).toLocaleString("cs-CZ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hero-named-field hero-named-field--restore-delete">
                  <button type="button" className="btn ghost btn--hero-named" onClick={restoreNamedSnapshot}>
                    Obnovit zálohu
                  </button>
                  <button type="button" className="btn ghost btn--hero-named" onClick={deleteNamedSnapshot}>
                    Smazat zálohu
                  </button>
                </div>
                <div className="hero-named-field" style={{ gridColumn: "1 / -1" }}>
                  <button type="button" className="btn ghost btn--hero-named" onClick={handleCompareWithNamedSnapshot}>
                    Porovnat aktuální stav se zálohou (JSON)…
                  </button>
                </div>
              </div>
            </div>
          </HeroActionsDrawer>
        </div>

      </header>

      <QuickOnboarding
        title="Jak s touto kalkulačkou pracovat"
        open={guideOpen}
        onDismiss={dismissGuide}
        dismissButtonLabel="Skrýt nápovědu"
      >
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
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy</h2>
        <InputOutputLegend />
        <p className="muted-text" style={{ marginTop: 10 }}>
          Postupujte po krocích: 1) zvolte režim, 2) zadejte běžná oddělení/účastníky, 3) případně zapněte speciální
          oddělení a výjimky, 4) zkontrolujte výsledky.
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
              onChange={setPupils}
            />
            <p className="muted-text" style={{ marginTop: 12, fontSize: "0.88rem" }}>
              Navržený počet oddělení (÷ 27, nahoru): <strong>{suggested}</strong>
              {pupils > 0 ? ` → průměr při ${suggested} odd.: ${(pupils / suggested).toFixed(2)} účastníků` : null}
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
                    onChange={setDepartments}
                  />
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
            <h3>Speciální oddělení (§ 16 odst. 9)</h3>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={summaryHasSpecial}
                  onChange={(e) => setSummaryHasSpecial(e.target.checked)}
                />
                Družina obsahuje speciální oddělení (§ 16/9)
              </label>
            </div>
            <div className="checks" style={{ marginTop: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={regularExceptionGranted}
                  onChange={(e) => setRegularExceptionGranted(e.target.checked)}
                />
                Povolená výjimka u běžných oddělení (PHmax)
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
                    Povolená výjimka u speciálních oddělení (§ 16/9, PHmax i PHAmax)
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
                              prev.map((x, idx) => (idx === i ? { ...x, participants: v } : x)),
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
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={regularExceptionGranted}
                  onChange={(e) => setRegularExceptionGranted(e.target.checked)}
                />
                Povolená výjimka u běžných oddělení (PHmax)
              </label>
              {detailHasSpecial ? (
                <label>
                  <input
                    type="checkbox"
                    checked={specialExceptionGranted}
                    onChange={(e) => setSpecialExceptionGranted(e.target.checked)}
                  />
                  Povolená výjimka u speciálních oddělení (§ 16/9, PHmax i PHAmax)
                </label>
              ) : null}
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
                    <th>Výjimka (spec.)</th>
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
                          step="0.1"
                          value={row.participants}
                          onChange={(e) =>
                            setDetailDepartments((prev) =>
                              prev.map((x, idx) =>
                                idx === i ? { ...x, participants: Math.max(0, Number(e.target.value) || 0) } : x,
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

        <div className="grid two section-results" style={{ marginTop: 18 }}>
          {detailedResult != null ? (
            <>
              <ResultCard label="Oddělení (celkem)" value={detailedResult.totalDepartments} tone="primary" />
              <ResultCard
                label="PHmax (základ z přílohy vyhl. 74/2005 Sb.)"
                value={detailedResult.basePhmax}
                tone="success"
              />
              <ResultCard
                label="PHmax – běžná oddělení (§ 10 odst. 2/3, po případném poměrném krácení)"
                value={detailedResult.regularSharePhmax}
                tone="primary"
              />
              {detailedResult.specialDepartments > 0 ? (
                <ResultCard
                  label="PHmax – speciální oddělení (odst. 7, § 16/9; krácení poměrné části)"
                  value={detailedResult.specialSharePhmax}
                  tone="primary"
                />
              ) : null}
              <ResultCard
                label="PHmax celkem (součet běžných + speciálních oddělení)"
                value={detailedResult.finalPhmax}
                tone="success"
              />
              {detailedResult.specialDepartments > 0 ? (
                <ResultCard
                  label="PHAmax – speciální oddělení (odst. 7, § 16/9; po krácení výjimky)"
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
                  label={`PHmax po krácení (koef. ${reduction.factor.toFixed(4)})`}
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

        {detailedResult != null ? (
          <div className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
            <h3 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 8 }}>
              Rozpad PHmax/PHAmax po odděleních
            </h3>
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th>Oddělení</th>
                    <th>Typ</th>
                    <th>Účastníci</th>
                    <th>PHmax základ</th>
                    <th>Koef. krácení</th>
                    <th>PHmax po krácení</th>
                    <th>PHAmax (spec.)</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedResult.breakdown.map((row) => (
                    <tr key={row.index1Based}>
                      <td>{row.index1Based}</td>
                      <td>{row.kind === "regular" ? "Běžné" : "Speciální"}</td>
                      <td>{formatSdHours(row.participants)}</td>
                      <td>{formatSdHours(row.basePhmax)}</td>
                      <td>{row.reductionFactor.toFixed(4)}</td>
                      <td>{formatSdHours(row.finalPhmax)}</td>
                      <td>{row.kind === "special" ? formatSdHours(row.finalPhaMax) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollGrabRegion>
          </div>
        ) : breakdown != null && breakdown.length > 0 && basePhmax != null ? (
          <div className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
            <h3 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 8 }}>
              Rozpad PHmax podle oddělení
            </h3>
            <p className="muted-text" style={{ marginBottom: 12, fontSize: "0.88rem" }}>
              Hodiny podle přílohy k vyhlášce č. 74/2005 Sb. (stejně jako ve sloupcích tabulky pro váš počet oddělení).
              Pořadí odpovídá 1. až n-tému oddělení v této tabulce.
            </p>
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th scope="col" className="sd-phmax-breakdown__corner" />
                    <th scope="col" className="sd-phmax-breakdown__head-num">
                      PHmax
                    </th>
                    {reduction.applied ? (
                      <th scope="col" className="sd-phmax-breakdown__head-num">
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
                Koeficient krácení: {reduction.factor.toFixed(4)}. Jako celkový strop po krácení platí součet v řádku
                Celkem ({formatSdHours(reduction.adjusted)} h); rozpad sloupců je poměrný podklad.
              </p>
            ) : null}
          </div>
        ) : null}

        {tableWarning ? <p className="card card--warning" style={{ marginTop: 16, padding: 14 }}>{tableWarning}</p> : null}

        {activeMethodikaRow != null ? (
          <div className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 14 }}>
            <h3 className="section-title" style={{ fontSize: "1.05rem", marginBottom: 8 }}>
              Aktivní řádek metodiky pro {activeMethodikaRow.deptCount} oddělení
            </h3>
            <p className="muted-text" style={{ marginBottom: 10, fontSize: "0.86rem" }}>
              Zobrazen je pouze aktuální řádek „Týdenní maximální rozsah provozu školních družin“.
            </p>
            <ScrollGrabRegion className="sd-phmax-breakdown-scroll">
              <table className="sd-phmax-breakdown">
                <thead>
                  <tr>
                    <th>Počet oddělení</th>
                    {Array.from({ length: 21 }, (_, i) => (
                      <th key={`active-h-${i + 1}`}>{i + 1}</th>
                    ))}
                    <th>Celkový PHmax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{activeMethodikaRow.deptCount}</th>
                    {Array.from({ length: 21 }, (_, i) => {
                      const val = i < activeMethodikaRow.rowHours.length ? activeMethodikaRow.rowHours[i] : null;
                      return (
                        <td key={`active-r-${i + 1}`}>
                          {val == null ? "" : formatSdHours(val)}
                        </td>
                      );
                    })}
                    <td>{formatSdHours(activeMethodikaRow.total)}</td>
                  </tr>
                </tbody>
              </table>
            </ScrollGrabRegion>
          </div>
        ) : null}

        <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 20 }}>
          <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
            Ověřovací tabulka metodiky (1 speciální oddělení s výjimkou)
          </summary>
          <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.88rem" }}>
            Kontrolní scénář 1:1 s metodikou: při jednom výjimkovém oddělení § 16/9 se odečítá 0,05 / 0,10 / 0,60
            průměrného PHmax na oddělení. Sloupce odpovídají variantě 5 dětí, 4 děti, méně než 4 děti.
          </p>
          <ScrollGrabRegion className="sd-phmax-breakdown-scroll">
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th>Počet oddělení ŠD</th>
                  <th>PHmax</th>
                  <th>Průměr PHmax na 1 odd.</th>
                  <th>Varianta 5 dětí (0,95)</th>
                  <th>Varianta 4 děti (0,90)</th>
                  <th>Varianta &lt; 4 děti (0,40)</th>
                </tr>
              </thead>
              <tbody>
                {methodikaVariantRows.map((r) => (
                  <tr key={r.deptCount}>
                    <td>{r.deptCount}</td>
                    <td>{formatSdHours(r.base)}</td>
                    <td>{formatSdHours(r.avg)}</td>
                    <td>{formatSdHours(r.v5)}</td>
                    <td>{formatSdHours(r.v4)}</td>
                    <td>{formatSdHours(r.vUnder4)}</td>
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

        <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 14 }}>
          <summary className="section-title" style={{ fontSize: "1.05rem", cursor: "pointer" }}>
            Ověřovací tabulka: Týdenní maximální rozsah provozu školních družin
          </summary>
          <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.88rem" }}>
            Referenční matice přílohy vyhlášky 74/2005 Sb. pro 1 až 21 oddělení. Sloupce 1–21 ukazují hodinové hodnoty
            pro jednotlivá oddělení, poslední sloupec uvádí celkový PHmax za družinu.
          </p>
          <ScrollGrabRegion className="sd-phmax-breakdown-scroll">
            <table className="sd-phmax-breakdown">
              <thead>
                <tr>
                  <th rowSpan={3}>Celkový počet oddělení</th>
                  <th colSpan={21}>TÝDENNÍ MAXIMÁLNÍ ROZSAH PROVOZU ŠKOLNÍCH DRUŽIN</th>
                  <th rowSpan={3}>Celkový PHmax za školní družinu</th>
                </tr>
                <tr>
                  <th colSpan={21}>pro jednotlivá oddělení</th>
                </tr>
                <tr>
                  {Array.from({ length: 21 }, (_, i) => (
                    <th key={`hd-${i + 1}`}>{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {methodikaBaseGridRows.map((row) => (
                  <tr key={`row-${row.deptCount}`}>
                    <th scope="row">{row.deptCount}</th>
                    {Array.from({ length: 21 }, (_, i) => {
                      const val = i < row.rowHours.length ? row.rowHours[i] : null;
                      return <td key={`row-${row.deptCount}-c-${i + 1}`}>{val == null ? "" : formatSdHours(val)}</td>;
                    })}
                    <td>{formatSdHours(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollGrabRegion>
        </details>

        <p className="muted-text" style={{ marginTop: 20 }}>
          Aplikace nenahrazuje úřední výpočet ani výkazy (např. Z 2-01). U složitých případů (
          <SdLegisRef citeId="sd-skolsky-16" label="§ 16 školského zákona" />, méně než čtyři oddělení, výjimky zřizovatele)
          vycházejte z úplného znění vyhlášky a metodiky – odkazy níže. Krácení PHmax dle{" "}
          <SdLegisRef citeId="sd-10-2" label="§ 10 odst. 2 vyhl. 74" /> je v souhrnu výše.
        </p>
      </section>

      <ProductLegisContextPanel variant="sd" />
      <MethodologyStrip />
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
    </>
  );
}
