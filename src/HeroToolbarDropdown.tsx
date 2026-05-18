import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { HeroToolbarPortalContext } from "./hero-toolbar-portal-context";

type HeroToolbarDropdownProps = {
  summary: string;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
};

const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 480;

function panelWidth() {
  return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, window.innerWidth - 24));
}

/**
 * Rozbalovací panel toolbaru – na desktopu portal do body (nad kartami obsahu),
 * v mobilním draweru staticky v toku dokumentu.
 */
export function HeroToolbarDropdown({
  summary,
  children,
  className = "",
  panelClassName = "",
}: HeroToolbarDropdownProps) {
  const usePortal = useContext(HeroToolbarPortalContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = panelWidth();
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    setCoords({ top: rect.bottom + 6, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open || !usePortal) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, usePortal, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !usePortal) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, usePortal, panelId]);

  const panelClasses = [
    "hero-compact-toolbar__panel-body",
    panelClassName,
    usePortal ? "hero-toolbar-dropdown__panel--portal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelContent = open ? (
    <div id={panelId} className={panelClasses} role="region" aria-label={summary}>
      {children}
    </div>
  ) : null;

  if (!usePortal) {
    return (
      <details
        className={["hero-compact-toolbar__panel", className].filter(Boolean).join(" ")}
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="hero-compact-toolbar__panel-summary">{summary}</summary>
        {panelContent}
      </details>
    );
  }

  return (
    <div
      ref={rootRef}
      className={["hero-compact-toolbar__panel", "hero-toolbar-dropdown", className].filter(Boolean).join(" ")}
    >
      <button
        ref={triggerRef}
        type="button"
        className="hero-compact-toolbar__panel-summary hero-toolbar-dropdown__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          updatePosition();
          setOpen(true);
        }}
      >
        {summary}
      </button>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              className="hero-toolbar-dropdown-portal-root"
              style={{ top: coords.top, left: coords.left, width: coords.width }}
            >
              {panelContent}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
