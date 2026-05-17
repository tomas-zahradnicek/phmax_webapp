import React, { useCallback, useEffect, useState } from "react";

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
 * Sticky obsah stránky: aktivní sekce (scroll spy), výrazná hierarchie, jen „Nahoru“ navíc.
 */
export function PageTableOfContents({ sections, scrollOffset = 96 }: PageTableOfContentsProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  if (sections.length === 0) return null;

  const navBody = (
    <>
      <p className="page-toc__heading">Obsah</p>
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
                setMobileOpen(false);
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
    <>
      <button
        type="button"
        className="page-toc-mobile-trigger"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        {mobileOpen ? "Skrýt obsah" : "Obsah stránky"}
      </button>
      <nav
        className={`page-toc page-toc--rail${mobileOpen ? " page-toc--mobile-open" : ""}`}
        aria-label="Obsah stránky"
      >
        {navBody}
      </nav>
    </>
  );
}
