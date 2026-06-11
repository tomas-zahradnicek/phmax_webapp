import React from "react";

type DashboardNewUserChecklistProps = {
  onScrollToModules?: () => void;
};

/** Trvalý 3krokový checklist pro nového uživatele – nezávislý na tour v localStorage. */
export function DashboardNewUserChecklist({ onScrollToModules }: DashboardNewUserChecklistProps) {
  return (
    <section
      className="card section-card dash-new-user-checklist"
      aria-labelledby="dash-new-user-checklist-heading"
      data-testid="dash-new-user-checklist"
    >
      <h2 id="dash-new-user-checklist-heading" className="section-title">
        První kroky na Přehledu
      </h2>
      <ol className="dash-new-user-checklist__steps">
        <li>
          <strong>Vyberte modul</strong>, který vaše škola provozuje (např. PV nebo ZŠ).
        </li>
        <li>
          <strong>Začněte u ukázky</strong> nebo vyplňte vlastní data v kartě modulu.
        </li>
        <li>
          <strong>Vraťte se na Přehled</strong> – školní profil ukáže souhrnný PHmax a stav školy.
        </li>
      </ol>
      {onScrollToModules ? (
        <button type="button" className="btn ghost dash-new-user-checklist__cta" onClick={onScrollToModules}>
          K modulům níže
        </button>
      ) : null}
    </section>
  );
}
