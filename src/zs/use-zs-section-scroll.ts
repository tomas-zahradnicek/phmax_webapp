import { useCallback, useEffect, useRef } from "react";

/** Scroll na sekci ZŠ s offsetem sticky docku; volitelně scroll po změně záložky. */
export function useZsSectionScroll(tab: "phmax" | "pha" | "php") {
  const workspaceStickyRef = useRef<HTMLDivElement>(null);
  const tabChangeSkipRef = useRef(true);

  const goToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (!element || !(element instanceof HTMLElement)) return;
    const dock = workspaceStickyRef.current;
    const offset = dock?.offsetHeight ?? 100;
    const top = element.getBoundingClientRect().top + window.scrollY - offset - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (tabChangeSkipRef.current) {
      tabChangeSkipRef.current = false;
      return;
    }
    const targetId = tab === "phmax" ? "basic" : tab;
    requestAnimationFrame(() => {
      const el = (document.querySelector(`[data-section="${targetId}"]`) ??
        document.querySelector(`[data-section="guide"]`)) as HTMLElement | null;
      if (!el) return;
      const dock = workspaceStickyRef.current;
      const offset = dock?.getBoundingClientRect().height ?? 100;
      const rect = el.getBoundingClientRect();
      if (rect.top < offset + 12 || rect.bottom > window.innerHeight - 32) {
        const top = rect.top + window.scrollY - offset - 12;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    });
  }, [tab]);

  return { workspaceStickyRef, goToSection };
}
