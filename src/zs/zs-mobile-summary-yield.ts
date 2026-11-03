import { useEffect, type RefObject } from "react";

export const ZS_MOBILE_SUMMARY_YIELD_CLASS = "zs-mobile-summary-yields";

/** Matches the mobile summary reserve: measured height, otherwise min(46vh, 320px), plus the bottom gap. */
export function zsMobileSummaryReservePx(viewportHeight: number, measuredHeight: number | null): number {
  const fallback = Math.min(viewportHeight * 0.46, 320);
  const height = measuredHeight != null && measuredHeight > 0 ? measuredHeight : fallback;
  const gap = Math.max(12, viewportHeight * 0.03);
  return height + gap + 12;
}

export function zsMobileSummaryShouldYield(heroBottom: number, viewportHeight: number, reservePx: number): boolean {
  return viewportHeight > 0 && heroBottom > viewportHeight - reservePx;
}

export function useZsMobileSummaryYield(heroRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const apply = () => {
      const hero = heroRef.current;
      const narrow = window.matchMedia("(max-width: 1099px)").matches;
      if (!hero || !narrow) {
        document.body.classList.remove(ZS_MOBILE_SUMMARY_YIELD_CLASS);
        return;
      }
      const measured = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--calculator-mobile-results-height"),
      );
      const reserve = zsMobileSummaryReservePx(window.innerHeight, Number.isFinite(measured) ? measured : null);
      document.body.classList.toggle(
        ZS_MOBILE_SUMMARY_YIELD_CLASS,
        zsMobileSummaryShouldYield(hero.getBoundingClientRect().bottom, window.innerHeight, reserve),
      );
    };

    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    const observer = typeof ResizeObserver !== "undefined" && heroRef.current ? new ResizeObserver(apply) : null;
    if (heroRef.current) observer?.observe(heroRef.current);

    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      observer?.disconnect();
      document.body.classList.remove(ZS_MOBILE_SUMMARY_YIELD_CLASS);
    };
  }, [heroRef]);
}
