import React, { useEffect, useState } from "react";
import { useMatchMedia } from "./useMatchMedia";

type HeroActionsDrawerProps = {
  /** Text hlavního tlačítka v úzkém rozložení */
  triggerLabel: string;
  /** Nadpis panelu (přístupnost) */
  drawerTitle: string;
  /** Kdy zobrazit vysouvací panel místo vloženého obsahu */
  narrowQuery?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Na úzkých displejích skryje obsah za tlačítkem a zobrazí ho ve vysouvacím panelu zprava.
 * Na širších obrazovkách vykreslí children přímo (bez extra obalu).
 */
export function HeroActionsDrawer({
  triggerLabel,
  drawerTitle,
  narrowQuery = "(max-width: 900px)",
  className,
  children,
}: HeroActionsDrawerProps) {
  const narrow = useMatchMedia(narrowQuery);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!narrow) setOpen(false);
  }, [narrow]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!narrow) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={["hero-actions-panel-narrow", className].filter(Boolean).join(" ")}>
        <button
          type="button"
          className="btn btn--light hero-actions-panel-narrow__toggle"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          {triggerLabel}
        </button>
      </div>
      {open ? (
        <>
          <div
            className="hero-actions-panel-backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <aside
            className="hero-actions-panel-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={drawerTitle}
          >
            <header className="hero-actions-panel-drawer__head">
              <h2 className="hero-actions-panel-drawer__title">{drawerTitle}</h2>
              <button type="button" className="btn ghost btn--drawer-close" onClick={() => setOpen(false)}>
                Zavřít
              </button>
            </header>
            <div className="hero-actions-panel-drawer__body">{children}</div>
          </aside>
        </>
      ) : null}
    </>
  );
}
