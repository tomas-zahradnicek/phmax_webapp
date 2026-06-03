import React, { useEffect, useId, useRef, useState } from "react";
import { dismissCalculatorHintCoachmark, shouldShowCalculatorHintCoachmark } from "./calculator-hint-first-visit";

export type CalculatorHintTooltipProps = {
  /** Pro čtečku obrazovky (např. „Vysvětlení režimu práce“). */
  label: string;
  text: string;
  className?: string;
  /** Jednorázový popisek u první návštěvy (localStorage). */
  firstVisitCoachmark?: boolean;
  firstVisitCoachmarkLabel?: string;
};

/** Krátké vysvětlení u kompaktních přepínačů v hero – hover/focus, na mobilu klepnutí. */
export function CalculatorHintTooltip({
  label,
  text,
  className,
  firstVisitCoachmark = false,
  firstVisitCoachmarkLabel = "Nápověda k režimu",
}: CalculatorHintTooltipProps) {
  const [open, setOpen] = useState(false);
  const [coachmark, setCoachmark] = useState(
    () => firstVisitCoachmark && shouldShowCalculatorHintCoachmark(),
  );
  const wrapRef = useRef<HTMLSpanElement>(null);
  const bubbleId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open]);

  const dismissCoachmark = () => {
    dismissCalculatorHintCoachmark();
    setCoachmark(false);
  };

  return (
    <span
      ref={wrapRef}
      className={[
        "calculator-hint-tooltip",
        open ? "calculator-hint-tooltip--open" : "",
        coachmark ? "calculator-hint-tooltip--coachmark" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {coachmark ? (
        <span className="calculator-hint-tooltip__coachmark-label">{firstVisitCoachmarkLabel}</span>
      ) : null}
      <button
        type="button"
        className="calculator-hint-tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? bubbleId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (coachmark) dismissCoachmark();
          setOpen((o) => !o);
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span id={bubbleId} className="calculator-hint-tooltip__bubble" role="tooltip" aria-hidden={!open}>
        {text}
      </span>
    </span>
  );
}
