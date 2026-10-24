import { useCallback, useEffect, useRef } from "react";

type UseCalculatorSectionScrollOptions = {
  /** Po změně klíče scroll na tuto sekci (nebo guide jako fallback). */
  resolveTabSection: (tabKey: string) => string;
};

/** Mezera mezi spodní hranou sticky offsetu a začátkem cílové sekce. */
export const CALCULATOR_SECTION_SCROLL_GAP_PX = 12;

/** Offset, když sticky dock není v DOM nebo nemá změřenou výšku. */
export const CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX = 100;

/**
 * Minimální část cíle, která musí zůstat ve viewportu,
 * i když je sticky dock vyšší než okno.
 */
export const CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX = 64;

/**
 * Efektivní horní offset. Krátký dock se nemění.
 * Vysoký dock se ořízne tak, aby začátek cíle zůstal nad spodním okrajem viewportu
 * aspoň o MIN_VISIBLE px (mezera 12 px je v tom limitu započtená).
 */
export function resolveCalculatorSectionScrollOffset(dockHeight: number | null, viewportHeight: number): number {
  const raw =
    dockHeight == null || !Number.isFinite(dockHeight) ? CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX : dockHeight;
  const viewport = Number.isFinite(viewportHeight) ? viewportHeight : 0;
  const maxOffset = Math.max(0, viewport - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX - CALCULATOR_SECTION_SCROLL_GAP_PX);
  return Math.min(Math.max(0, raw), maxOffset);
}

/** Dokumentová souřadnice `window.scrollTo` pro začátek sekce ve viewportu. */
export function resolveCalculatorSectionScrollTop(
  elementViewportTop: number,
  scrollY: number,
  offsetPx: number,
): number {
  const top = elementViewportTop + scrollY - offsetPx - CALCULATOR_SECTION_SCROLL_GAP_PX;
  return Number.isFinite(top) ? Math.max(0, top) : 0;
}

/** Scroll na sekci s offsetem sticky docku; volitelně scroll po změně záložky. */
export function useCalculatorSectionScroll(tabKey: string, { resolveTabSection }: UseCalculatorSectionScrollOptions) {
  const workspaceStickyRef = useRef<HTMLDivElement>(null);
  const tabChangeSkipRef = useRef(true);

  const goToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (!element || !(element instanceof HTMLElement)) return;
    const dock = workspaceStickyRef.current;
    const offset = resolveCalculatorSectionScrollOffset(
      dock ? dock.offsetHeight : null,
      window.innerHeight,
    );
    const top = resolveCalculatorSectionScrollTop(element.getBoundingClientRect().top, window.scrollY, offset);
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (tabChangeSkipRef.current) {
      tabChangeSkipRef.current = false;
      return;
    }
    const targetId = resolveTabSection(tabKey);
    requestAnimationFrame(() => {
      const el = (document.querySelector(`[data-section="${targetId}"]`) ??
        document.querySelector(`[data-section="guide"]`)) as HTMLElement | null;
      if (!el) return;
      const dock = workspaceStickyRef.current;
      const offset = resolveCalculatorSectionScrollOffset(
        dock ? dock.getBoundingClientRect().height : null,
        window.innerHeight,
      );
      const rect = el.getBoundingClientRect();
      if (rect.top < offset + CALCULATOR_SECTION_SCROLL_GAP_PX || rect.bottom > window.innerHeight - 32) {
        const top = resolveCalculatorSectionScrollTop(rect.top, window.scrollY, offset);
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  }, [tabKey, resolveTabSection]);

  return { workspaceStickyRef, goToSection };
}
