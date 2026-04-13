import React from "react";
import { LegisTooltipRef } from "../LegisTooltipRef";
import { SS_LEGIS_PARAGRAPH_TOOLTIPS } from "./phmax-ss-legislativa";

type SsLegisRefProps = {
  /** Klíč do `SS_LEGIS_PARAGRAPH_TOOLTIPS`. */
  citeId: string;
  /** Zobrazený text (např. „§ 2a odst. 1“). */
  label: string;
};

/**
 * Hover / focus zobrazí vysvětlení ustanovení (tooltip).
 */
export function SsLegisRef({ citeId, label }: SsLegisRefProps) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={SS_LEGIS_PARAGRAPH_TOOLTIPS} />;
}
