import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useMatchMedia } from "./useMatchMedia";

const TOC_DESKTOP_QUERY = "(min-width: 1200px)";
const TOC_OPEN_LS_KEY = "phmax-toc-open";

function readStoredTocOpen(): "0" | "1" | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(TOC_OPEN_LS_KEY);
    if (stored === "0" || stored === "1") return stored;
  } catch {
    /* ignore */
  }
  return null;
}

function resolveTocOpen(desktopDefaultOpen: boolean): boolean {
  const stored = readStoredTocOpen();
  if (stored === "1") return true;
  if (stored === "0") return false;
  if (typeof window === "undefined") return false;
  return desktopDefaultOpen && window.matchMedia(TOC_DESKTOP_QUERY).matches;
}

function persistTocOpen(open: boolean) {
  try {
    window.localStorage.setItem(TOC_OPEN_LS_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export type PageTocSection = {
  id: string;
  label: string;
};

type PageTableOfContentsProps = {
  sections: readonly PageTocSection[];
  /** Odsazení scrollu pod sticky lištu (px). */
  scrollOffset?: number;
  /**
   * Výchozí otevření na šířce od 1200 px, jen když uživatel ještě nemá phmax-toc-open.
   * Chybějící klíč není uložené zavření.
   */
  desktopDefaultOpen?: boolean;
  /**
   * true = volající převzal navigaci sekce a scrollToSection se nespustí.
   * false nebo chybějící callback ponechá stávající scroll.
   */
  onSectionSelect?: (sectionId: string) => boolean;
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
export function PageTableOfContents({
  sections,
  scrollOffset = 96,
  desktopDefaultOpen = true,
  onSectionSelect,
}: PageTableOfContentsProps) {
  const isDesktopToc = useMatchMedia(TOC_DESKTOP_QUERY);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(() => resolveTocOpen(desktopDefaultOpen));
  const setTocOpenFromUser = (open: boolean) => {
    persistTocOpen(open);
    setTocOpen(open);
  };
  const mobileNavId = useId().replace(/:/g, "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const returnFocusToTrigger = () => {
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

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
        setTocOpenFromUser(false);
        returnFocusToTrigger();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tocOpen]);

  useEffect(() => {
    const nav = navRef.current;
    if (nav) nav.inert = !tocOpen;
  }, [tocOpen]);

  useEffect(() => {
    if (readStoredTocOpen() !== null) return;
    setTocOpen(resolveTocOpen(desktopDefaultOpen));
  }, [desktopDefaultOpen]);

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
    setTocOpenFromUser(false);
    returnFocusToTrigger();
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
                const handled = onSectionSelect?.(s.id) === true;
                if (!handled) scrollToSection(s.id, scrollOffset);
                if (!isDesktopToc) {
                  setTocOpenFromUser(false);
                  returnFocusToTrigger();
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
        onClick={() => setTocOpenFromUser(!tocOpen)}
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
