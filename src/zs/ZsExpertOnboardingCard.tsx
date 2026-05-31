import React from "react";

/** Expertní režim – stručný onboarding krok za krokem (mimo základní průvodce). */
export function ZsExpertOnboardingCard() {
  return (
    <section className="card card--onboarding section-card section-card--onboarding">
      <div className="onboarding">
        <div className="onboarding__intro">
          <div className="pill pill--step">Začněte tady</div>
          <h2 className="section-title">Jak postupovat krok za krokem</h2>
          <p className="muted-text">
            Pokud aplikaci otevíráte poprvé, držte se tohoto pořadí. V každém kroku můžete použít ukázkový příklad nebo zadat vlastní údaje.
          </p>
        </div>

        <div className="onboarding__steps">
          <div className="onboarding-step">
            <div className="onboarding-step__number">1</div>
            <div className="onboarding-step__body">
              <div className="onboarding-step__title">Vyberte situaci školy</div>
              <div className="onboarding-step__text">Použijte rychlý rozcestník nebo ukázkový příklad v horní liště.</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step__number">2</div>
            <div className="onboarding-step__body">
              <div className="onboarding-step__title">Zvolte režim a modul</div>
              <div className="onboarding-step__text">Vyberte typ školy a potom přepněte na PHmax, PHAmax nebo PHPmax.</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step__number">3</div>
            <div className="onboarding-step__body">
              <div className="onboarding-step__title">Vyplňte údaje v kartách</div>
              <div className="onboarding-step__text">Zadávejte počty tříd a žáků v příslušných sekcích. Nápovědu najdete pod ikonou „i“.</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step__number">4</div>
            <div className="onboarding-step__body">
              <div className="onboarding-step__title">Zkontrolujte průběžný a závěrečný výsledek</div>
              <div className="onboarding-step__text">Sledujte „Aktuální přehled výsledků“, souhrn modulu a celkový přehled dole na stránce.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
