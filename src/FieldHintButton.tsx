import React, { useEffect, useId, useRef, useState } from "react";

type FieldHintButtonProps = {
  text: string;
  className?: string;
};

/** Nápověda u pole – hover na PC, klepnutí na mobilu (popover). */
export function FieldHintButton({ text, className }: FieldHintButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
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
    <span ref={wrapRef} className={["field-hint", open ? "field-hint--open" : "", className].filter(Boolean).join(" ")}>
      <button
        ref={btnRef}
        type="button"
        className="help-hint help-hint--ui field-hint__trigger"
        aria-expanded={open}
        aria-describedby={open ? bubbleId : undefined}
        aria-label={text}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        i
      </button>
      <span
        id={bubbleId}
        className="field-hint__bubble"
        role="tooltip"
        aria-hidden={!open}
      >
        {text}
      </span>
    </span>
  );
}
