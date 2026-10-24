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
 * Finální `window.scrollTo` top.
 * Krátký dock: `documentTop - (dock + mezera)`.
 * Když by tím začátek cíle spadl pod `viewport - 64 px`, scroll se posune dál,
 * i kdyby cíl částečně zajel pod vysoký sticky dock.
 * `maxScrollY` drží výsledek v rozsahu dokumentu.
 */
export function resolveCalculatorSectionScrollTop(
  elementViewportTop: number,
  scrollY: number,
  dockHeight: number | null,
  viewportHeight: number,
  maxScrollY?: number | null,
): number {
  if (!Number.isFinite(elementViewportTop) || !Number.isFinite(scrollY)) return 0;
  const documentTop = elementViewportTop + scrollY;
  const raw =
    dockHeight == null || !Number.isFinite(dockHeight)
      ? CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX
      : Math.max(0, dockHeight);
  const viewport = Number.isFinite(viewportHeight) ? viewportHeight : 0;
  const preferred = documentTop - (raw + CALCULATOR_SECTION_SCROLL_GAP_PX);
  const visibleTopLimit = Math.max(0, viewport - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
  const minimumForVisibility = documentTop - visibleTopLimit;
  let top = Math.max(preferred, minimumForVisibility);
  if (!Number.isFinite(top)) return 0;
  top = Math.max(0, top);
  if (maxScrollY != null && Number.isFinite(maxScrollY)) {
    top = Math.min(top, Math.max(0, maxScrollY));
  }
  return top;
}

function readMaxScrollY(): number {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return Number.isFinite(maxScroll) ? maxScroll : 0;
}

function scrollElementToSection(element: HTMLElement, readDockHeight: () => number | null) {
  const apply = () => {
    const top = resolveCalculatorSectionScrollTop(
      element.getBoundingClientRect().top,
      window.scrollY,
      readDockHeight(),
      window.innerHeight,
      readMaxScrollY(),
    );
    window.scrollTo({ top, behavior: "smooth" });
  };
  apply();
  requestAnimationFrame(() => {
    requestAnimationFrame(apply);
  });
}

/** Scroll na sekci s offsetem sticky docku; volitelně scroll po změně záložky. */
export function useCalculatorSectionScroll(tabKey: string, { resolveTabSection }: UseCalculatorSectionScrollOptions) {
  const workspaceStickyRef = useRef<HTMLDivElement>(null);
  const tabChangeSkipRef = useRef(true);

  const goToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (!element || !(element instanceof HTMLElement)) return;
    scrollElementToSection(element, () => {
      const dock = workspaceStickyRef.current;
      return dock ? dock.offsetHeight : null;
    });
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
      const dockHeight = dock ? dock.getBoundingClientRect().height : null;
      const rect = el.getBoundingClientRect();
      const raw =
        dockHeight == null || !Number.isFinite(dockHeight)
          ? CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX
          : Math.max(0, dockHeight);
      const clearance = Math.min(
        raw + CALCULATOR_SECTION_SCROLL_GAP_PX,
        Math.max(0, window.innerHeight - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX),
      );
      if (rect.top < clearance || rect.bottom > window.innerHeight - 32) {
        scrollElementToSection(el, () => dockHeight);
      }
    });
  }, [tabKey, resolveTabSection]);

  return { workspaceStickyRef, goToSection };
}
