import React from "react";
import type { AnnualReportSectionStatus } from "./vyrocni-zprava-types";
import { ANNUAL_REPORT_SECTION_STATUS_LABELS } from "./vyrocni-zprava-types";

const STATUS_CLASS: Record<AnnualReportSectionStatus, string> = {
  NEVYPLNENO: "vyrocni-zprava-status-badge--empty",
  CHYBI_UDAJE: "vyrocni-zprava-status-badge--warning",
  PRIPRAVENO: "vyrocni-zprava-status-badge--ready",
  VYGENEROVANO: "vyrocni-zprava-status-badge--generated",
  UPRAVENO_UZIVATELEM: "vyrocni-zprava-status-badge--edited",
  SCHVALENO: "vyrocni-zprava-status-badge--approved",
};

type VyrocniZpravaStatusBadgeProps = {
  status: AnnualReportSectionStatus;
  compact?: boolean;
};

export function VyrocniZpravaStatusBadge({ status, compact = false }: VyrocniZpravaStatusBadgeProps) {
  return (
    <span
      className={`vyrocni-zprava-status-badge ${STATUS_CLASS[status]}${compact ? " vyrocni-zprava-status-badge--compact" : ""}`}
    >
      {ANNUAL_REPORT_SECTION_STATUS_LABELS[status]}
    </span>
  );
}
