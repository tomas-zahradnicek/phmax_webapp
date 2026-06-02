import React, { useEffect, useId, useRef, useState } from "react";

export type CalculatorHintTooltipProps = {
  /** Pro čtečku obrazovky (např. „Vysvětlení režimu práce“). */
  label: string;
  text: string;
  className?: string;
};

/** Krátké vysvětlení u kompaktních přepínačů v hero – hover/focus, na mobilu klepnutí. */
export function CalculatorHintTooltip({ label, text, className }: CalculatorHintTooltipProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <span
      ref={wrapRef}
      className={["calculator-hint-tooltip", open ? "calculator-hint-tooltip--open" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="calculator-hint-tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? bubbleId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
