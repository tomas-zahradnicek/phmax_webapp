import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
import { CalculatorHintTooltip } from "./CalculatorHintTooltip";
import { CalculatorViewModeToggle } from "./CalculatorViewModeToggle";
import { DisplayDensityToggle } from "./DisplayDensityToggle";
import { CalculatorExpertModeNotice } from "./CalculatorExpertModeNotice";
import {
  CALCULATOR_LAYOUT_HINT_TOOLTIP,
  CALCULATOR_VIEW_MODE_HINT_TOOLTIP,
} from "./calculator-ui-constants";
import type { CalculatorFocusMode } from "./calculator-focus-mode";
import type { CalculatorViewMode } from "./calculator-view-mode";
import type { DisplayDensity } from "./display-density";

const PANEL_MIN_WIDTH = 300;
const PANEL_MAX_WIDTH = 360;

function panelWidth() {
  return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, window.innerWidth - 24));
}

export type CalculatorHeroSettingsMenuProps = {
  moduleLabel: string;
  viewModeName: string;
  viewMode: CalculatorViewMode;
  setViewMode: (mode: CalculatorViewMode) => void;
  displayDensityName: string;
  displayDensity: DisplayDensity;
  setDisplayDensity: (density: DisplayDensity) => void;
  focusMode: CalculatorFocusMode;
  setFocusMode: (mode: CalculatorFocusMode) => void;
  expertExampleSelectId?: string;
  /** header = tmavá hlavička shellu, hero = modrý gradient. */
  tone?: "hero" | "header";
};

/** Režim, rozložení a fokus – mimo hlavní hero řádek (variant A). */
export function CalculatorHeroSettingsMenu({
  moduleLabel,
  viewModeName,
  viewMode,
  setViewMode,
  displayDensityName,
  displayDensity,
  setDisplayDensity,
  focusMode,
  setFocusMode,
  expertExampleSelectId,
  tone = "hero",
}: CalculatorHeroSettingsMenuProps) {
  const viewLegendId = useId();
  const layoutLegendId = useId();
  const panelId = useId();
  const viewBadge = viewMode === "expert" ? "Expertní" : "Základní";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const coordsRef = useRef<{ top: number; left: number; width: number } | null>(null);
  const [positionTick, setPositionTick] = useState(0);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const width = panelWidth();
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    const next = { top: rect.bottom + 6, left, width };
    coordsRef.current = next;
    setPositionTick((tick) => tick + 1);
    return next;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    const timer = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, panelId]);

  const panelContent = (
    <div
      id={panelId}
      className="calculator-hero-settings__panel calculator-hero-settings__panel--portal"
      role="region"
      aria-label="Nastavení zobrazení kalkulačky"
    >
      <section
        className="calculator-hero-settings__group calculator-hero-settings__group--view"
        aria-labelledby={viewLegendId}
      >
        <span id={viewLegendId} className="calculator-hero-settings__legend">
          Režim
        </span>
        <CalculatorViewModeToggle
          name={viewModeName}
          moduleLabel={moduleLabel}
          viewMode={viewMode}
          setViewMode={setViewMode}
          compact
        />
        <CalculatorHintTooltip
          label="Vysvětlení režimu práce"
          text={CALCULATOR_VIEW_MODE_HINT_TOOLTIP}
          firstVisitCoachmark
        />
      </section>
      <section className="calculator-hero-settings__group" aria-labelledby={layoutLegendId}>
        <span id={layoutLegendId} className="calculator-hero-settings__legend">
          Rozložení
        </span>
        <div className="calculator-hero-settings__layout-toggles">
          <DisplayDensityToggle
            density={displayDensity}
            onChange={setDisplayDensity}
            name={displayDensityName}
          />
          <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />
        </div>
        <CalculatorHintTooltip label="Vysvětlení rozložení obrazovky" text={CALCULATOR_LAYOUT_HINT_TOOLTIP} />
      </section>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={["calculator-hero-settings", tone === "header" ? "calculator-hero-settings--header" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="calculator-hero-settings__details calculator-hero-settings__details--portal">
        <button
          ref={triggerRef}
          type="button"
          className="calculator-hero-settings__trigger btn ghost"
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          onClick={() => {
            if (open) {
              setOpen(false);
              return;
            }
            flushSync(() => {
              updatePosition();
              setOpen(true);
            });
          }}
        >
          <span className="calculator-hero-settings__icon" aria-hidden>
            {tone === "header" ? "👁" : "⚙"}
          </span>
          <span className="calculator-hero-settings__label">Zobrazení</span>
          <span className="calculator-hero-settings__badge">{viewBadge}</span>
        </button>
      </div>
      {open && coordsRef.current && typeof document !== "undefined"
        ? createPortal(
            <div
              key={positionTick}
              className="hero-toolbar-dropdown-portal-root calculator-hero-settings-portal-root"
              style={{
                top: coordsRef.current.top,
                left: coordsRef.current.left,
                width: coordsRef.current.width,
              }}
            >
              {panelContent}
            </div>,
            document.body,
          )
        : null}
      <CalculatorExpertModeNotice viewMode={viewMode} exampleSelectId={expertExampleSelectId} />
    </div>
  );
}
