import React from "react";
import {
  BASIC_WIZARD_OWN_DATA_NOTE,
  FORM_OWN_DATA_LEAD,
  HERO_OWN_DATA_HINT,
  WORKFLOW_DOCK_OWN_DATA_HINT,
} from "./calculator-ui-constants";

type OwnDataHintVariant = "hero" | "form" | "wizard" | "dock";

type OwnDataHintProps = {
  variant?: OwnDataHintVariant;
  className?: string;
  id?: string;
};

const COPY: Record<OwnDataHintVariant, string> = {
  hero: HERO_OWN_DATA_HINT,
  form: FORM_OWN_DATA_LEAD,
  wizard: BASIC_WIZARD_OWN_DATA_NOTE,
  dock: WORKFLOW_DOCK_OWN_DATA_HINT,
};

/** Sjednocená věta: formulář je editovatelný, ukázka je volitelná (všechny režimy zobrazení). */
export function OwnDataHint({ variant = "hero", className, id }: OwnDataHintProps) {
  return (
    <p
      id={id}
      className={["own-data-hint", `own-data-hint--${variant}`, className].filter(Boolean).join(" ")}
      role="note"
    >
      {COPY[variant]}
    </p>
  );
}
