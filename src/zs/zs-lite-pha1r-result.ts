import {
  evaluateZsLiteHandoff,
  inspectZsFullAutosaveForLiteHandoff,
  type ZsLiteHandoffInput,
  type ZsLiteHandoffWriteResult,
} from "../phmax-lite-handoff";
import { computeZsPha1r, validateZsPha1rClasses, type Pha1rClassRow, type Pha1rSchoolFlags, type Pha1rValidationIssue } from "./zs-pha1r";
import { buildPha1rRowViews, PHA1R_SEC16_CLASS_NOTE, pha1rExclusionMessage } from "./zs-pha1r-ui";

export const ZS_LITE_PHA1R_NOT_ENTERED = "PHA1Rmax nebyl zadán";
export const ZS_LITE_PHA1R_FULL_TAB_NOTE = "V plné kalkulačce na záložce PHAmax.";
export const ZS_LITE_HANDOFF_REPLACE_CONFIRM =
  "V plné kalkulačce již máte uložené údaje. Přenosem z rychlé kalkulačky budou nahrazeny. Chcete pokračovat?";
export const ZS_LITE_HANDOFF_UNREADABLE =
  "Uložené údaje plné kalkulačky nelze bezpečně přečíst. Přenos se neprovedl.";

export type ZsLitePha1rPresentation = {
  status: "not-entered" | "invalid" | "excluded" | "computed";
  headline: string;
  detail: string;
  rowLines: string[];
  issues: readonly Pha1rValidationIssue[];
};

export function presentZsLitePha1r(input: {
  classes: readonly Pha1rClassRow[];
  flags: Pha1rSchoolFlags;
}): ZsLitePha1rPresentation {
  const issues = validateZsPha1rClasses(input.classes);
  if (issues.length > 0) {
    return {
      status: "invalid",
      headline: "PHA1Rmax nelze vyhodnotit.",
      detail: issues.map((issue) => issue.label).join(" "),
      rowLines: [],
      issues,
    };
  }
  const computed = computeZsPha1r(input);
  if (computed.schoolExcluded) {
    return {
      status: "excluded",
      headline: "PHA1Rmax: 0 hodin týdně",
      detail: pha1rExclusionMessage(computed.exclusionReasons),
      rowLines: [],
      issues: [],
    };
  }
  if (input.classes.length === 0) {
    return {
      status: "not-entered",
      headline: ZS_LITE_PHA1R_NOT_ENTERED,
      detail: "",
      rowLines: [],
      issues: [],
    };
  }
  const views = buildPha1rRowViews(input);
  return {
    status: "computed",
    headline: `PHA1Rmax: ${computed.totalPha1r} hodin týdně`,
    detail: `Způsobilé třídy: ${computed.eligibleClassCount}.`,
    rowLines: views.map((view) => {
      const pupils = `Třída ${view.rowNumber}: ${view.relevantGrade1Pupils} relevantních žáků`;
      return view.statusText === PHA1R_SEC16_CLASS_NOTE ? `${pupils}. ${view.statusText}` : pupils;
    }),
    issues: [],
  };
}

export function zsLiteTransferFeedback(result: ZsLiteHandoffWriteResult): { navigate: boolean; message: string } {
  if (result.ok) return { navigate: true, message: "" };
  if (result.reason === "incomplete_phmax") {
    return {
      navigate: false,
      message:
        "Údaje se nepřenášejí. Pro přenos doplňte počty tříd a žáků PHmax. U úplné školy jsou potřeba oba stupně.",
    };
  }
  if (result.reason === "invalid_pha1r") {
    const detail = result.issues.map((issue) => issue.label).join(" ");
    return {
      navigate: false,
      message: detail
        ? `Údaje PHA1Rmax jsou neplatné, přenos se neprovedl. ${detail}`
        : "Údaje PHA1Rmax jsou neplatné, přenos se neprovedl.",
    };
  }
  return {
    navigate: false,
    message: "Uložení do plné kalkulačky se nezdařilo. Údaje se nepřenášejí.",
  };
}

export function runZsLiteTransfer(
  result: ZsLiteHandoffWriteResult,
  actions: { navigate: () => void; notify: (message: string) => void },
): void {
  const feedback = zsLiteTransferFeedback(result);
  if (!feedback.navigate) {
    actions.notify(feedback.message);
    return;
  }
  actions.navigate();
}

export function runZsLiteGuardedTransfer(actions: {
  input: ZsLiteHandoffInput;
  write: () => ZsLiteHandoffWriteResult;
  confirm: (message: string) => boolean;
  navigate: () => void;
  notify: (message: string) => void;
}): void {
  const evaluated = evaluateZsLiteHandoff(actions.input);
  if (!evaluated.ok) {
    runZsLiteTransfer(evaluated, actions);
    return;
  }
  const guard = inspectZsFullAutosaveForLiteHandoff();
  if (guard === "unreadable") {
    actions.notify(ZS_LITE_HANDOFF_UNREADABLE);
    return;
  }
  if (guard === "replace" && !actions.confirm(ZS_LITE_HANDOFF_REPLACE_CONFIRM)) return;
  runZsLiteTransfer(actions.write(), actions);
}
