import { useCallback, useMemo } from "react";
import type { ModuleInputsFocusHint } from "../phmax-focus-inputs-hint";
import { buildZsExportBuildInput, type ZsExportBuildInput, type ZsExportBuildInputParams } from "./zs-export-build";
import { buildZsPageComparePreview, type ZsPageHandlersInput } from "./zs-page-handlers";
import type { CompareProductVariantsResult } from "../phmax-product-compare";
import { buildZsValidationIssues, buildZsVerdict, buildZsWorkflow, type ZsFormValidationInput } from "./zs-form-validation";
import { buildZsSummaryRows, type ZsSummaryRowsInput } from "./zs-summary-rows";
import { useZsSectionScroll } from "./use-zs-section-scroll";

export type ZsPageCompareDerivedInput = Pick<
  ZsPageHandlersInput,
  "buildSnapshot" | "totalPhmax" | "totalPha" | "totalPhp" | "warnings" | "namedSnapshots" | "selectedNamedId"
>;

export type UseZsPageDerivedStateArgs = {
  tab: "phmax" | "pha" | "php";
  warnings: string[];
  validation: ZsFormValidationInput;
  summary: ZsSummaryRowsInput;
  exportParams: Omit<ZsExportBuildInputParams, "summaryRows">;
  compare: ZsPageCompareDerivedInput;
};

export function useZsPageDerivedState(args: UseZsPageDerivedStateArgs) {
  const { tab, warnings, validation, summary, exportParams, compare } = args;
  const { workspaceStickyRef, goToSection } = useZsSectionScroll(tab);

  const validationIssues = useMemo(() => buildZsValidationIssues(validation), [validation]);

  const incompleteSections = new Set(validationIssues.map((item) => item.section)).size;
  const zsVerdict = useMemo(
    () => buildZsVerdict(incompleteSections, warnings.length),
    [incompleteSections, warnings.length],
  );
  const zsWorkflow = useMemo(
    () => buildZsWorkflow(incompleteSections, warnings.length),
    [incompleteSections, warnings.length],
  );
  const firstIssueSection = validationIssues[0]?.section ?? "";
  const hasIssue = (sectionId: string) => validationIssues.some((item) => item.section === sectionId);

  const zsNeedsInputBanner = zsVerdict.tone !== "ok";
  const zsScrollToInputs = useCallback(
    (hint?: ModuleInputsFocusHint) => {
      const sectionId = hint?.sectionId ?? firstIssueSection;
      if (sectionId) goToSection(sectionId);
    },
    [firstIssueSection, goToSection],
  );
  const zsDockIssueSummaries = useMemo(
    () =>
      warnings.length > 0
        ? warnings.slice(0, 4).map((w) => (w.length > 80 ? `${w.slice(0, 77)}…` : w))
        : [],
    [warnings],
  );
  const validationHighlight = zsNeedsInputBanner;
  const zsInputBannerItems = useMemo(
    () => [
      ...validationIssues.map((item) => ({
        label: item.label,
        onFix: () => goToSection(item.section),
      })),
      ...warnings.map((w) => ({ label: w })),
    ],
    [validationIssues, warnings, goToSection],
  );
  const showZsInputBanner = zsInputBannerItems.length > 0;

  const summaryRows = useMemo(() => buildZsSummaryRows(summary), [summary]);

  const zsExportBuildInput = useMemo(
    () => buildZsExportBuildInput({ ...exportParams, summaryRows }),
    [exportParams, summaryRows],
  );

  const zsComparePreview = useMemo(
  (): CompareProductVariantsResult | null => buildZsPageComparePreview(compare),
    [compare],
  );

  return {
    workspaceStickyRef,
    goToSection,
    validationIssues,
    incompleteSections,
    firstIssueSection,
    zsVerdict,
    zsWorkflow,
    hasIssue,
    zsNeedsInputBanner,
    zsScrollToInputs,
    zsDockIssueSummaries,
    validationHighlight,
    zsInputBannerItems,
    showZsInputBanner,
    summaryRows,
    zsExportBuildInput,
    zsComparePreview,
  };
}

export type { ZsExportBuildInput };
