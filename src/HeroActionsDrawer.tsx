import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HERO_ACTIONS_DRAWER_TITLE, HERO_ACTIONS_TRIGGER_LABEL } from "./calculator-ui-constants";
import { useMatchMedia } from "./useMatchMedia";

type HeroActionsDrawerProps = {
  /** Text hlavního tlačítka v úzkém rozložení */
  triggerLabel?: string;
  /** Nadpis panelu (přístupnost) */
  drawerTitle?: string;
  /** Kdy zobrazit vysouvací panel místo vloženého obsahu */
  narrowQuery?: string;
  className?: string;
  children: React.ReactNode;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Na úzkých displejích skryje obsah za tlačítkem a zobrazí ho ve vysouvacím panelu zprava.
 * Na širších obrazovkách vykreslí children přímo (bez extra obalu).
 */
export function HeroActionsDrawer({
  triggerLabel = HERO_ACTIONS_TRIGGER_LABEL,
  drawerTitle = HERO_ACTIONS_DRAWER_TITLE,
  narrowQuery = "(max-width: 900px)",
  className,
  children,
}: HeroActionsDrawerProps) {
  const narrow = useMatchMedia(narrowQuery);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const headingId = useId();

  const closeDrawer = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!narrow) setOpen(false);
  }, [narrow]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeDrawer]);

  useLayoutEffect(() => {
    if (!open || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusables = getFocusableElements(drawer);
    const first = focusables[0];
    (first ?? drawer).focus();

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    drawer.addEventListener("keydown", onTab);
    return () => drawer.removeEventListener("keydown", onTab);
  }, [open]);

  if (!narrow) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={["hero-actions-panel-narrow", className].filter(Boolean).join(" ")}>
        <button
          ref={triggerRef}
          type="button"
          className="btn btn--light hero-actions-panel-narrow__toggle"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {triggerLabel}
        </button>
      </div>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="hero-actions-panel-portal-root">
              <div
                className="hero-actions-panel-backdrop"
                role="presentation"
                onClick={closeDrawer}
              />
              <aside
                ref={drawerRef}
                className="hero-actions-panel-drawer"
                role="dialog"
                aria-modal="true"
                aria-label={drawerTitle}
                tabIndex={-1}
              >
                <header className="hero-actions-panel-drawer__head">
                  <h2 className="hero-actions-panel-drawer__title" id={headingId}>
                    {drawerTitle}
                  </h2>
                  <button
                    type="button"
                    className="btn ghost btn--drawer-close"
                    onClick={closeDrawer}
                    aria-label="Zavřít panel akcí"
                  >
                    Zavřít
                  </button>
                </header>
                <div className="hero-actions-panel-drawer__body" aria-labelledby={headingId}>
                  {children}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
