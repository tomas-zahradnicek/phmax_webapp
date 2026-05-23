import React, { useEffect, useId, useRef, useState } from "react";

export type LegisTooltipRefProps = {
  citeId: string;
  label: string;
  tooltips: Record<string, string>;
};

/**
 * Hover / focus na PC, klepnutí na mobilu – vysvětlení ustanovení (`.ss-legis-tooltip*`).
 */
export function LegisTooltipRef({ citeId, label, tooltips }: LegisTooltipRefProps) {
  const hint = tooltips[citeId];
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

  if (!hint) {
    return <span>{label}</span>;
  }
  return (
    <span
      ref={wrapRef}
      className={["ss-legis-tooltip", open ? "ss-legis-tooltip--open" : ""].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="ss-legis-tooltip__trigger"
        aria-expanded={open}
        aria-describedby={open ? bubbleId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {label}
      </button>
      <span id={bubbleId} className="ss-legis-tooltip__bubble" role="tooltip" aria-hidden={!open}>
        {hint}
      </span>
    </span>
  );
}
