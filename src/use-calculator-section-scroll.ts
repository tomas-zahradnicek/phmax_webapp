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

/** Jedna oprava po usazení layoutu. Druhé měření už scroll nespouští. */
export const CALCULATOR_SECTION_SCROLL_CORRECTION_LIMIT = 1;

/** Pojistka, když prohlížeč neohlásí `scrollend`. Primární signál je událost. */
const SECTION_SCROLL_SETTLE_HANG_MS = 1500;

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

/**
 * Po dokončení plynulého scrollu: když pozdější layout posune cíl pod
 * `viewport - 64 px`, vrať nový scrollTop. Jinak null.
 * `correctionsAlreadyApplied` drží počet oprav na jedné.
 */
export function resolveSectionScrollCorrection(
  elementViewportTop: number,
  scrollY: number,
  dockHeight: number | null,
  viewportHeight: number,
  maxScrollY: number | null | undefined,
  correctionsAlreadyApplied: number,
): number | null {
  if (correctionsAlreadyApplied >= CALCULATOR_SECTION_SCROLL_CORRECTION_LIMIT) return null;
  if (!Number.isFinite(elementViewportTop) || !Number.isFinite(scrollY) || !Number.isFinite(viewportHeight)) {
    return null;
  }
  const visibleTopLimit = Math.max(0, viewportHeight - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
  if (elementViewportTop <= visibleTopLimit) return null;
  const scrollTop = resolveCalculatorSectionScrollTop(
    elementViewportTop,
    scrollY,
    dockHeight,
    viewportHeight,
    maxScrollY,
  );
  if (!Number.isFinite(scrollTop) || scrollTop <= scrollY + 0.5) return null;
  return scrollTop;
}

let sectionScrollGeneration = 0;

function browserSupportsScrollEnd(): boolean {
  return "onscrollend" in window;
}

function waitForProgrammaticScrollSettle(readRequestedTop: () => number): Promise<void> {
  return new Promise((resolve) => {
    let finished = false;
    let hang = 0;
    let quiet = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      document.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(hang);
      window.clearTimeout(quiet);
      resolve();
    };
    const scrollArrived = () => {
      const requested = readRequestedTop();
      if (!Number.isFinite(requested)) return false;
      if (window.scrollY >= requested - 1) return true;
      return window.scrollY >= readMaxScrollY() - 1;
    };
    const onScrollEnd = () => {
      if (!scrollArrived()) return;
      finish();
    };
    const onScroll = () => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        if (scrollArrived()) finish();
      }, 80);
    };
    hang = window.setTimeout(finish, SECTION_SCROLL_SETTLE_HANG_MS);
    if (browserSupportsScrollEnd()) {
      document.addEventListener("scrollend", onScrollEnd);
      return;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  });
}

function nextAnimationFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

function scrollElementToSection(element: HTMLElement, readDockHeight: () => number | null) {
  const generation = ++sectionScrollGeneration;
  let requestedTop = 0;
  const applySmooth = () => {
    if (generation !== sectionScrollGeneration) return;
    requestedTop = resolveCalculatorSectionScrollTop(
      element.getBoundingClientRect().top,
      window.scrollY,
      readDockHeight(),
      window.innerHeight,
      readMaxScrollY(),
    );
    window.scrollTo({ top: requestedTop, behavior: "smooth" });
  };
  applySmooth();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applySmooth();
      void correctSectionScrollAfterSettle(element, readDockHeight, generation, () => requestedTop);
    });
  });
}

function applySectionScrollCorrection(
  element: HTMLElement,
  readDockHeight: () => number | null,
  correctionsAlreadyApplied: number,
): number | null {
  const scrollTop = resolveSectionScrollCorrection(
    element.getBoundingClientRect().top,
    window.scrollY,
    readDockHeight(),
    window.innerHeight,
    readMaxScrollY(),
    correctionsAlreadyApplied,
  );
  if (scrollTop == null) return null;
  // `instant` nepřepíše CSS `scroll-behavior: smooth` druhou dlouhou animací.
  window.scrollTo({ top: scrollTop, behavior: "instant" });
  return scrollTop;
}

function watchSectionSlipOnce(
  element: HTMLElement,
  readDockHeight: () => number | null,
  generation: number,
): void {
  let done = false;
  let hang = 0;
  const finish = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    window.clearTimeout(hang);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry || entry.isIntersecting) return;
      finish();
      if (generation !== sectionScrollGeneration || !element.isConnected) return;
      applySectionScrollCorrection(element, readDockHeight, 0);
    },
    {
      root: null,
      rootMargin: `0px 0px -${CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX}px 0px`,
      threshold: 0,
    },
  );
  observer.observe(element);
  hang = window.setTimeout(finish, SECTION_SCROLL_SETTLE_HANG_MS);
}

async function correctSectionScrollAfterSettle(
  element: HTMLElement,
  readDockHeight: () => number | null,
  generation: number,
  readRequestedTop: () => number,
): Promise<void> {
  await waitForProgrammaticScrollSettle(readRequestedTop);
  if (generation !== sectionScrollGeneration || !element.isConnected) return;
  await nextAnimationFrames(2);
  if (generation !== sectionScrollGeneration || !element.isConnected) return;
  const corrected = applySectionScrollCorrection(element, readDockHeight, 0);
  if (corrected != null) {
    await nextAnimationFrames(2);
    return;
  }
  watchSectionSlipOnce(element, readDockHeight, generation);
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
