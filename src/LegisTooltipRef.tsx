import React from "react";

export type LegisTooltipRefProps = {
  citeId: string;
  label: string;
  tooltips: Record<string, string>;
};

/**
 * Hover / focus zobrazí vysvětlení ustanovení (sdílené styly `.ss-legis-tooltip*`).
 */
export function LegisTooltipRef({ citeId, label, tooltips }: LegisTooltipRefProps) {
  const hint = tooltips[citeId];
  if (!hint) {
    return <span>{label}</span>;
  }
  return (
    <span className="ss-legis-tooltip" tabIndex={0}>
      <span className="ss-legis-tooltip__trigger">{label}</span>
      <span className="ss-legis-tooltip__bubble" role="tooltip">
        {hint}
      </span>
    </span>
  );
}
