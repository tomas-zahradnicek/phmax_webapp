import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type UseModalDialogA11yOptions = {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  /** První fokus po otevření (výchozí: první focusovatelný prvek v panelu). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Vrátit fokus po zavření (např. tlačítko slovníčku). */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function useModalDialogA11y({
  open,
  onClose,
  panelRef,
  initialFocusRef,
  returnFocusRef,
}: UseModalDialogA11yOptions): void {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, panelRef, initialFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open, panelRef]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      returnFocusRef?.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open, returnFocusRef]);
}
