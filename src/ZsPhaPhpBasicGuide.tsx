import React from "react";

type ZsPhaPhpTab = "pha" | "php";

type ZsPhaPhpBasicGuideProps = {
  tab: ZsPhaPhpTab;
  totalValue: number;
  onOpenPhmaxWizard: () => void;
};

const COPY: Record<
  ZsPhaPhpTab,
  { title: string; lead: string; steps: readonly { title: string; text: string }[] }
> = {
  pha: {
    title: "PHAmax v základním režimu",
    lead:
      "Průvodce krok za krokem (5 kroků) je na záložce PHmax. Zde vyplňte řádky asistentů pedagoga a sledujte souhrn vpravo.",
    steps: [
      {
        title: "Zkontrolujte typ školy",
        text: "V sekci „Typ školy a režim výpočtu“ musí být zvolen režim, který zobrazuje PHAmax (např. úplná ZŠ).",
      },
      {
        title: "Vyplňte třídy a žáky",
        text: "U každého typu třídy zadejte počet tříd a žáků – aplikace dopočítá PHAmax z tabulky metodiky.",
      },
      {
        title: "§ 16/9 a ZŠ speciální",
        text: "Třídy podle § 16 odst. 9 a přípravný stupeň mají vlastní pravidla – ověřte nápovědu u řádků.",
      },
    ],
  },
  php: {
    title: "PHPmax v základním režimu",
    lead:
      "Průvodce krok za krokem (5 kroků) je na záložce PHmax. Zde zadejte průměr žáků za tři roky a případné odečty.",
    steps: [
      {
        title: "Průměr za tři školní roky",
        text: "Vyplňte počty žáků v jednotlivých rocích – aplikace dopočítá průměr a pásmo PHPmax.",
      },
      {
        title: "Odečty žáků",
        text: "Žáci, kteří se do průměru nezapočítávají (zahraničí, individuální vzdělávání apod.), snižují základ dle metodiky.",
      },
      {
        title: "Menší škola",
        text: "U škol pod limitem metodiky může být PHPmax nulové – sledujte upozornění u výsledku.",
      },
    ],
  },
};

/** Základní režim na záložkách PHAmax / PHPmax – bez 5krokového průvodce PHmax. */
export function ZsPhaPhpBasicGuide({ tab, totalValue, onOpenPhmaxWizard }: ZsPhaPhpBasicGuideProps) {
  const copy = COPY[tab];
  const moduleLabel = tab === "pha" ? "PHAmax" : "PHPmax";

  return (
    <section
      className="card card--onboarding section-card zs-pha-php-basic-guide"
      aria-label={`Průvodce ${moduleLabel}`}
    >
      <div className="zs-pha-php-basic-guide__intro">
        <div className="pill pill--step">Základní režim · {moduleLabel}</div>
        <h2 className="section-title">{copy.title}</h2>
        <p className="muted-text">{copy.lead}</p>
        <p className="zs-pha-php-basic-guide__phmax-hint">
          Potřebujete průvodce krok za krokem pro běžné třídy a výjimky PHmax?{" "}
          <button type="button" className="btn ghost btn--sm" onClick={onOpenPhmaxWizard}>
            Přejít na PHmax a průvodce
          </button>
        </p>
        <p className="muted-text zs-pha-php-basic-guide__preview">
          Aktuální souhrn {moduleLabel}: <strong>{totalValue}</strong> h (viz také panel Kontext výpočtu).
        </p>
      </div>
      <ol className="zs-pha-php-basic-guide__steps">
        {copy.steps.map((step, idx) => (
          <li key={step.title} className="zs-pha-php-basic-guide__step">
            <span className="zs-pha-php-basic-guide__step-num">{idx + 1}</span>
            <div>
              <div className="zs-pha-php-basic-guide__step-title">{step.title}</div>
              <p className="muted-text">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
