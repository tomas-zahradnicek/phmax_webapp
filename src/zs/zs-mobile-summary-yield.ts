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

/** Prefer the painted summary box. The CSS height variable lags behind when the chip expands. */
export function zsMobileSummaryBandTop(
  viewportHeight: number,
  reservePx: number,
  overlayTop: number | null,
): number {
  if (overlayTop != null && Number.isFinite(overlayTop)) return overlayTop;
  return viewportHeight - reservePx;
}

/** True when a control's vertical span crosses the painted summary box. */
export function zsMobileSummaryIntersects(
  top: number,
  bottom: number,
  bandTop: number,
  bandBottom: number,
): boolean {
  return bottom > bandTop && top < bandBottom;
}

const ZS_MOBILE_SUMMARY_OVERLAY = ".calculator-mobile-scroll-results, .calculator-mobile-summary-chip";
const ZS_MOBILE_SUMMARY_CONTROLS =
  ".container--app button, .container--app a, .container--app input, .container--app select, .container--app textarea, .container--app summary";

export function useZsMobileSummaryYield(heroRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    let observedBanner: HTMLElement | null = null;
    let observedOverlay: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    const watch = (next: HTMLElement | null, current: HTMLElement | null) => {
      if (!observer || next === current) return current;
      if (current) observer.unobserve(current);
      if (next) observer.observe(next);
      return next;
    };
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
      const viewport = window.innerHeight;
      const reserve = zsMobileSummaryReservePx(viewport, Number.isFinite(measured) ? measured : null);
      const heroBottom = hero.getBoundingClientRect().bottom;
      const banner = document.querySelector(".calculator-school-profile-banner");
      const bannerBottom = banner instanceof HTMLElement ? banner.getBoundingClientRect().bottom : null;
      const overlay = document.querySelector(ZS_MOBILE_SUMMARY_OVERLAY);
      const overlayEl = overlay instanceof HTMLElement && getComputedStyle(overlay).display !== "none" ? overlay : null;
      const overlayTop = overlayEl ? overlayEl.getBoundingClientRect().top : null;
      const bandTop = zsMobileSummaryBandTop(viewport, reserve, overlayTop);
      const bandReserve = viewport - bandTop;
      const yieldForHero = zsMobileSummaryShouldYield(heroBottom, viewport, bandReserve);
      const yieldForBanner = bannerBottom != null && zsMobileSummaryShouldYield(bannerBottom, viewport, bandReserve);
      const overlayRect = overlayEl ? overlayEl.getBoundingClientRect() : null;
      const bandBottom = overlayRect ? overlayRect.bottom : viewport;
      const bandLeft = overlayRect ? overlayRect.left : 0;
      const bandRight = overlayRect ? overlayRect.right : window.innerWidth;
      let yieldForControl = false;
      if (bandBottom > bandTop) {
        for (const node of document.querySelectorAll(ZS_MOBILE_SUMMARY_CONTROLS)) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.closest(".page-toc, .page-toc-mobile-trigger")) continue;
          const rect = node.getBoundingClientRect();
          if (rect.width < 8 || rect.height < 8) continue;
          if (rect.right <= bandLeft || rect.left >= bandRight) continue;
          if (!zsMobileSummaryIntersects(rect.top, rect.bottom, bandTop, bandBottom)) continue;
          yieldForControl = true;
          break;
        }
      }
      document.body.classList.toggle(
        ZS_MOBILE_SUMMARY_YIELD_CLASS,
        yieldForHero || yieldForBanner || yieldForControl,
      );
      observedBanner = watch(banner instanceof HTMLElement ? banner : null, observedBanner);
      observedOverlay = watch(overlayEl, observedOverlay);
    };

    let layoutFrame = 0;
    const scheduleLayoutApply = () => {
      if (layoutFrame) return;
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        apply();
      });
    };
    observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => {
          const layoutChanged = entries.some(
            (entry) => entry.target instanceof HTMLElement && entry.target.classList.contains("container--app"),
          );
          if (layoutChanged) scheduleLayoutApply();
          else apply();
        })
      : null;
    const overlayChanges = new MutationObserver(apply);
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    overlayChanges.observe(document.body, { childList: true });
    if (heroRef.current) observer?.observe(heroRef.current);
    const layoutRoot = document.querySelector(".container--app");
    if (layoutRoot) observer?.observe(layoutRoot);

    return () => {
      if (layoutFrame) cancelAnimationFrame(layoutFrame);
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      overlayChanges.disconnect();
      observer?.disconnect();
      document.body.classList.remove(ZS_MOBILE_SUMMARY_YIELD_CLASS);
    };
  }, [heroRef]);
}
