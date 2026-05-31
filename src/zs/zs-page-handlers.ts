import type { Dispatch, SetStateAction } from "react";
import type { CalculatorMode } from "../config/calculator-config";
import {
  MSG_NAMED_BACKUP_PICK_TO_COMPARE,
  MSG_ZS_NAMED_BACKUP_NO_AUDIT_TOTALS,
} from "../calculator-ui-constants";
import type { CompareProductVariantsResult } from "../phmax-product-compare";
import {
  buildZsComparePreview,
  compareZsWithNamedSnapshot,
  exportZsAuditJson,
  type ZsNamedSnapshotItem,
} from "./zs-audit-actions";
import { runZsExportCsv, runZsExportXlsx } from "./zs-export-actions";
import type { ZsExportBuildInput } from "./zs-export-build";
import type { ZsTabKey } from "./zs-form-snapshot";
import type { ZsValidationIssue } from "./zs-form-validation";

export type ZsPageHandlersInput = {
  zsExportBuildInput: ZsExportBuildInput;
  setUiNotice: (message: string) => void;
  xlsxExportBusy: boolean;
  setXlsxExportBusy: Dispatch<SetStateAction<boolean>>;
  buildSnapshot: () => Record<string, unknown>;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  tab: ZsTabKey;
  mode: CalculatorMode;
  exportLabel: string;
  warnings: string[];
  validationIssues: ZsValidationIssue[];
  namedSnapshots: ZsNamedSnapshotItem[];
  selectedNamedId: string;
};

export function createZsPageHandlers(input: ZsPageHandlersInput) {
  return {
    handleExportCsv: () => {
      void runZsExportCsv(input.zsExportBuildInput, input.setUiNotice);
    },
    handleExportXlsx: async () => {
      await runZsExportXlsx(input.zsExportBuildInput, {
        busy: input.xlsxExportBusy,
        setBusy: input.setXlsxExportBusy,
        onNotice: input.setUiNotice,
      });
    },
    handleExportZsAuditJson: () => {
      exportZsAuditJson({
        buildSnapshot: input.buildSnapshot,
        totalPhmax: input.totalPhmax,
        totalPha: input.totalPha,
        totalPhp: input.totalPhp,
        tab: input.tab,
        mode: input.mode,
        exportLabel: input.exportLabel,
        warnings: input.warnings,
        validationIssues: input.validationIssues,
      });
      input.setUiNotice("Stažen auditní protokol (JSON).");
    },
    handleCompareZsWithNamedSnapshot: () => {
      const result = compareZsWithNamedSnapshot({
        buildSnapshot: input.buildSnapshot,
        totalPhmax: input.totalPhmax,
        totalPha: input.totalPha,
        totalPhp: input.totalPhp,
        warnings: input.warnings,
        namedSnapshots: input.namedSnapshots,
        selectedNamedId: input.selectedNamedId,
      });
      if (!result.ok) {
        input.setUiNotice(
          result.message === "pick-named" ? MSG_NAMED_BACKUP_PICK_TO_COMPARE : MSG_ZS_NAMED_BACKUP_NO_AUDIT_TOTALS,
        );
        return;
      }
      input.setUiNotice(result.message);
    },
  };
}

export function buildZsPageComparePreview(
  input: Pick<
    ZsPageHandlersInput,
    | "buildSnapshot"
    | "totalPhmax"
    | "totalPha"
    | "totalPhp"
    | "warnings"
    | "namedSnapshots"
    | "selectedNamedId"
  >,
): CompareProductVariantsResult | null {
  return buildZsComparePreview({
    buildSnapshot: input.buildSnapshot,
    totalPhmax: input.totalPhmax,
    totalPha: input.totalPha,
    totalPhp: input.totalPhp,
    warnings: input.warnings,
    namedSnapshots: input.namedSnapshots,
    selectedNamedId: input.selectedNamedId,
  });
}
