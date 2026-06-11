import React, { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { QUICK_ONBOARDING_DISMISS_LABEL, QUICK_ONBOARDING_OPEN_LABEL } from "./calculator-ui-constants";
import { useModalDialogA11y } from "./modal-dialog-a11y";

type QuickOnboardingProps = {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onDismiss: () => void;
  /** Kotva pro scroll (např. z horního tlačítka „Stručné pokyny“). */
  anchorId?: string;
  /** Text tlačítka pro skrytí (ZŠ: „Skrýt nápovědu“, jinak výchozí „Skrýt návod“). */
  dismissButtonLabel?: string;
  /** Vrátit fokus po zavření (tlačítko Nápověda v hero). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export function QuickOnboarding({
  title,
  children,
  open,
  onDismiss,
  anchorId,
  dismissButtonLabel = QUICK_ONBOARDING_DISMISS_LABEL,
  returnFocusRef,
}: QuickOnboardingProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = anchorId ? `${anchorId}-title` : `quick-onboarding-title-${reactId.replace(/:/g, "")}`;

  useModalDialogA11y({
    open,
    onClose: onDismiss,
    panelRef,
    initialFocusRef: dismissRef,
    returnFocusRef,
  });

  if (!open) return null;

  const modal = (
    <div className="glossary-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="glossary-modal__backdrop" onClick={onDismiss} aria-hidden="true" />
      <div
        ref={panelRef}
        id={anchorId}
        className="glossary-modal__panel card card--onboarding onboarding--quick"
        tabIndex={-1}
      >
        <div className="onboarding-quick__head">
          <h2 id={titleId} className="section-title" style={{ marginBottom: 0 }}>
            {title}
          </h2>
          <button ref={dismissRef} type="button" className="btn ghost" onClick={onDismiss}>
            {dismissButtonLabel}
          </button>
        </div>
        <div className="onboarding-quick__body">{children}</div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
}

type QuickOnboardingHeroButtonProps = {
  guideOpen: boolean;
  onToggle: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** inline = pilulka, tile = KPI dlaždice, icon = jen ikona v hlavičce. */
  layout?: "inline" | "tile" | "icon";
};

/** Sjednocené tlačítko Nápověda / Skrýt nápovědu v hero liště. */
export function QuickOnboardingHeroButton({
  guideOpen,
  onToggle,
  buttonRef,
  layout = "inline",
}: QuickOnboardingHeroButtonProps) {
  const label = guideOpen ? QUICK_ONBOARDING_DISMISS_LABEL : QUICK_ONBOARDING_OPEN_LABEL;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={[
        "btn btn--hero-help",
        layout === "tile" ? "btn--hero-help--tile" : "",
        layout === "icon" ? "btn--hero-help--icon" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onToggle}
      aria-expanded={guideOpen}
      aria-haspopup="dialog"
      aria-label={layout === "icon" ? label : undefined}
      title={label}
    >
      {layout === "tile" ? (
        <>
          <span className="btn--hero-help__icon" aria-hidden>
            ?
          </span>
          <span className="btn--hero-help__label">{label}</span>
        </>
      ) : layout === "icon" ? (
        <span className="btn--hero-help__icon" aria-hidden>
          ?
        </span>
      ) : (
        label
      )}
    </button>
  );
}
