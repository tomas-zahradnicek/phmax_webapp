import React from "react";

export type FillStatusKind = "empty" | "optional" | "ok" | "warning" | "danger";

const FILL_STATUS_LABEL: Record<FillStatusKind, string> = {
  empty: "Ještě nevyplněno",
  optional: "Nepoužíváte",
  ok: "V pořádku",
  warning: "Pozornost",
  danger: "Chyba",
};

type FillStatusBadgeProps = {
  kind: FillStatusKind;
  /** Přepíše výchozí krátký popisek (např. konkrétní verdikt). */
  label?: string;
  className?: string;
  /** Skryje text u ikony pro úzké dlaždice. */
  iconOnly?: boolean;
};

/** Jednotná ikonografie stavu – dashboard, dock, dlaždice. */
export function FillStatusBadge({ kind, label, className, iconOnly = false }: FillStatusBadgeProps) {
  const text = label ?? FILL_STATUS_LABEL[kind];
  return (
    <span
      className={["fill-status-badge", `fill-status-badge--${kind}`, className].filter(Boolean).join(" ")}
      title={text}
      aria-label={text}
    >
      <span className="fill-status-badge__icon" aria-hidden="true" />
      {iconOnly ? null : <span className="fill-status-badge__text">{text}</span>}
    </span>
  );
}

/** Modul na přehledu bez dat – škola ho nemusí provozovat (ne chyba). */
export function dashboardUnusedModuleFillStatusKind(): FillStatusKind {
  return "optional";
}

export function dashboardRowFillStatusKind(
  hasData: boolean,
  verdictTone?: "ok" | "warning" | "danger" | "neutral" | null,
): FillStatusKind {
  if (!hasData) return "empty";
  if (verdictTone === "danger") return "danger";
  if (verdictTone === "warning") return "warning";
  if (verdictTone === "ok") return "ok";
  return hasData ? "warning" : "empty";
}
