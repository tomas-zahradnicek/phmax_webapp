/**
 * N3-AWARE-WIRING — Czech user-facing notices for scenario label authority states.
 *
 * No UUID / schema / marker / fence / authority jargon.
 * No automatic destructive CTA.
 */

export type ScenarioLabelNoticeKind =
  | "blocked_authority"
  | "storage_unavailable"
  | "namespaced_degraded"
  | "fence_incomplete"
  | "fatal_partial"
  | "marker_incomplete_soft"
  | "not_saved";

export type ScenarioLabelNotice = {
  readonly kind: ScenarioLabelNoticeKind;
  readonly text: string;
  /** Soft = advisory; hard = blocks further mutation until reload/reassessment. */
  readonly severity: "soft" | "hard";
};

export const SCENARIO_LABEL_NOTICE_BLOCKED_AUTHORITY: ScenarioLabelNotice = {
  kind: "blocked_authority",
  severity: "hard",
  text:
    "Stav uložených dat scénáře nelze bezpečně ověřit. Údaj scénáře nyní nelze upravit.",
};

export const SCENARIO_LABEL_NOTICE_STORAGE_UNAVAILABLE: ScenarioLabelNotice = {
  kind: "storage_unavailable",
  severity: "hard",
  text: "Data scénáře v tomto prohlížeči nyní nelze načíst.",
};

export const SCENARIO_LABEL_NOTICE_NAMESPACED_DEGRADED: ScenarioLabelNotice = {
  kind: "namespaced_degraded",
  severity: "soft",
  text:
    "Scénář je uložen, ale jeho kompatibilní kopii se nepodařilo plně ověřit. Zobrazená hodnota je aktuální.",
};

export const SCENARIO_LABEL_NOTICE_FENCE_INCOMPLETE: ScenarioLabelNotice = {
  kind: "fence_incomplete",
  severity: "hard",
  text:
    "Hodnota scénáře byla zapsána, ale stav úložiště nelze plně potvrdit. Před další úpravou obnovte stránku.",
};

export const SCENARIO_LABEL_NOTICE_FATAL_PARTIAL: ScenarioLabelNotice = {
  kind: "fatal_partial",
  severity: "hard",
  text:
    "Uložení scénáře nebylo možné bezpečně dokončit. Před další prací obnovte stránku a zkontrolujte uložená data.",
};

export const SCENARIO_LABEL_NOTICE_MARKER_INCOMPLETE_SOFT: ScenarioLabelNotice = {
  kind: "marker_incomplete_soft",
  severity: "soft",
  text:
    "Scénář byl uložen, ale doplňkový stav úložiště se nepodařilo plně potvrdit.",
};

export const SCENARIO_LABEL_NOTICE_NOT_SAVED: ScenarioLabelNotice = {
  kind: "not_saved",
  severity: "hard",
  text: "Uložení názvu scénáře se nezdařilo.",
};
