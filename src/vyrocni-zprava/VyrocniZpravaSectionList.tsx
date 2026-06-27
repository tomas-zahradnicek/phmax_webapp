import React from "react";
import { getSectionListTitle } from "./vyrocni-zprava-logic";
import type { AnnualReportSectionTreeNode } from "./vyrocni-zprava-types";
import { VyrocniZpravaStatusBadge } from "./VyrocniZpravaStatusBadge";

type VyrocniZpravaSectionListProps = {
  sections: AnnualReportSectionTreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function SectionRow({
  item,
  depth,
  selectedId,
  onSelect,
}: {
  item: AnnualReportSectionTreeNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const isParent = item.children.length > 0;
  const isSelected = selectedId === item.id;

  return (
    <li className={`vyrocni-zprava-section-list__item vyrocni-zprava-section-list__item--depth-${depth}`}>
      <button
        type="button"
        className={`vyrocni-zprava-section-list__button${isSelected ? " vyrocni-zprava-section-list__button--active" : ""}`}
        onClick={() => onSelect(item.id)}
        aria-current={isSelected ? "true" : undefined}
      >
        <span className="vyrocni-zprava-section-list__code">{item.number}</span>
        <span className="vyrocni-zprava-section-list__title">{getSectionListTitle(item)}</span>
        <VyrocniZpravaStatusBadge status={item.status} compact />
      </button>

      {isParent ? (
        <ul className="vyrocni-zprava-section-list__children">
          {item.children.map((child) => (
            <SectionRow key={child.id} item={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function VyrocniZpravaSectionList({ sections, selectedId, onSelect }: VyrocniZpravaSectionListProps) {
  return (
    <section className="card vyrocni-zprava-section-list" aria-labelledby="vyrocni-zprava-sections-title">
      <h2 id="vyrocni-zprava-sections-title" className="section-title">
        Kapitoly výroční zprávy
      </h2>
      <p className="muted-text vyrocni-zprava-section-list__lead">
        Struktura podle § 7 vyhlášky č. 15/2005 Sb. Vyberte kapitolu pro detail a práci s textem.
      </p>

      <ul className="vyrocni-zprava-section-list__root">
        {sections.map((item) => (
          <SectionRow key={item.id} item={item} depth={0} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  );
}
