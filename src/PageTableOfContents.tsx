import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useMatchMedia } from "./useMatchMedia";

const TOC_DESKTOP_QUERY = "(min-width: 1200px)";

function readDefaultTocOpen(): boolean {
  return typeof window !== "undefined" && window.matchMedia(TOC_DESKTOP_QUERY).matches;
}

export type PageTocSection = {
  id: string;
  label: string;
};

type PageTableOfContentsProps = {
  sections: readonly PageTocSection[];
  /** Odsazení scrollu pod sticky lištu (px). */
  scrollOffset?: number;
};

function getSectionElement(sectionId: string): HTMLElement | null {
  const el =
    document.querySelector(`[data-section="${sectionId}"]`) ?? document.getElementById(sectionId);
  return el instanceof HTMLElement ? el : null;
}

function scrollToSection(sectionId: string, scrollOffset: number) {
  const el = getSectionElement(sectionId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

/**
 * Sticky obsah stránky: aktivní sekce (scroll spy), výrazná hierarchie, jen
 * mobilní panel s klávesnicí (Escape zavře, Tab cyklí uvnitř).
 */
export function PageTableOfContents({ sections, scrollOffset = 96 }: PageTableOfContentsProps) {
  const isDesktopToc = useMatchMedia(TOC_DESKTOP_QUERY);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(readDefaultTocOpen);
  const mobileNavId = useId().replace(/:/g, "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const updateActiveFromScroll = useCallback(() => {
    if (sections.length === 0) return;
    const anchorY = scrollOffset + 24;
    let best = sections[0]!.id;
    let bestScore = Infinity;
    for (const { id } of sections) {
      const el = getSectionElement(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < anchorY - 8) continue;
      const score = Math.abs(r.top - anchorY);
      if (score < bestScore) {
        bestScore = score;
        best = id;
      }
    }
    setActiveId((prev) => (prev === best ? prev : best));
  }, [sections, scrollOffset]);

  useEffect(() => {
    updateActiveFromScroll();
    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);
    return () => {
      window.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, [updateActiveFromScroll]);

  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeId)) {
      setActiveId(sections[0]!.id);
    }
  }, [sections, activeId]);

  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setTocOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tocOpen]);

  useEffect(() => {
    if (!tocOpen || isDesktopToc) return;
    const id = window.requestAnimationFrame(() => {
      const first = navRef.current?.querySelector<HTMLElement>(".page-toc__link");
      first?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [tocOpen, isDesktopToc]);

  useEffect(() => {
    if (!tocOpen) return;
    const nav = navRef.current;
    if (!nav) return;
    const selector = 'button, [href], [tabindex]:not([tabindex="-1"])';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(nav.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled"),
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
    nav.addEventListener("keydown", onKeyDown);
    return () => nav.removeEventListener("keydown", onKeyDown);
  }, [tocOpen]);

  if (sections.length === 0) return null;

  const closeToc = () => {
    setTocOpen(false);
    triggerRef.current?.focus();
  };

  const navBody = (
    <>
      <div className="page-toc__heading-row">
        <p className="page-toc__heading">Obsah</p>
        <button type="button" className="page-toc__toggle" onClick={closeToc}>
          Skrýt
        </button>
      </div>
      <hr className="page-toc__rule" aria-hidden="true" />
      <ul className="page-toc__list">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`page-toc__link${activeId === s.id ? " page-toc__link--active" : ""}`}
              aria-current={activeId === s.id ? "location" : undefined}
              onClick={() => {
                scrollToSection(s.id, scrollOffset);
                if (!isDesktopToc) {
                  setTocOpen(false);
                  triggerRef.current?.focus();
                }
              }}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="page-toc__btn page-toc__btn--top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        Nahoru
      </button>
    </>
  );

  return (
    <div className={`page-toc-shell${tocOpen ? "" : " page-toc-shell--collapsed"}`}>
      <button
        ref={triggerRef}
        type="button"
        className="page-toc-mobile-trigger"
        aria-expanded={tocOpen}
        aria-controls={mobileNavId}
        aria-label={tocOpen ? "Skrýt obsah stránky" : "Zobrazit obsah stránky"}
        onClick={() => setTocOpen((o) => !o)}
      >
        {tocOpen ? "Skrýt" : "Obsah"}
      </button>
      <nav
        ref={navRef}
        id={mobileNavId}
        className={`page-toc page-toc--rail${tocOpen ? " page-toc--open" : ""}`}
        aria-label="Obsah stránky"
        aria-hidden={!tocOpen}
      >
        {navBody}
      </nav>
    </div>
  );
}
