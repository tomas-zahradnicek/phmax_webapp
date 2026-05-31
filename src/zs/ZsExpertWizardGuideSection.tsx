import React from "react";
import { ZS_WIZARD_CHOICE_TITLES } from "./zs-wizard-choices";

type WizardChoice =
  | ""
  | "php_small"
  | "php_deductions"
  | "ph_inclusion"
  | "ph_psych"
  | "ph_health"
  | "ph_mixed"
  | "ph_prep";

type ZsExpertWizardGuideSectionProps = {
  wizardChoice: WizardChoice;
  onWizardChoiceChange: (choice: WizardChoice) => void;
  guideTooltipLegend: string;
  SectionLead: React.ComponentType<{ children: React.ReactNode }>;
};

export function ZsExpertWizardGuideSection({
  wizardChoice,
  onWizardChoiceChange,
  guideTooltipLegend,
  SectionLead,
}: ZsExpertWizardGuideSectionProps) {
  return (
    <section className="card card--accent section-card section-card--guide" data-section="guide">
      <h2 className="section-title">Rychlý rozcestník</h2>
      <SectionLead>
        Nejste si jistí, kde začít? Vyberte situaci, která se nejvíc blíží vaší škole. Aplikace vás přesměruje na
        správnou část kalkulačky a vyplní odpovídající ukázkový příklad.
      </SectionLead>
      <div className="grid two">
        <div className="field">
          <span id="zs-wizard-choice-label">Jakou situaci chcete řešit?</span>
          <select
            id="zs-wizard-choice-select"
            aria-labelledby="zs-wizard-choice-label"
            aria-describedby="zs-wizard-choice-legend"
            title="Rychlý rozcestník: po výběru se načte ukázka a přepne se záložka. Najeďte na řádek pro stručný popis situace."
            value={wizardChoice}
            onChange={(e) => onWizardChoiceChange(e.target.value as WizardChoice)}
          >
            <option value="">Vyberte situaci…</option>
            <option value="php_small" title={ZS_WIZARD_CHOICE_TITLES.php_small}>
              Máme menší školu a chceme zjistit PHPmax
            </option>
            <option value="php_deductions" title={ZS_WIZARD_CHOICE_TITLES.php_deductions}>
              Máme žáky, kteří se do PHPmax nezapočítávají
            </option>
            <option value="ph_inclusion" title={ZS_WIZARD_CHOICE_TITLES.ph_inclusion}>
              Jsme škola s inkluzí a třídami podle § 16
            </option>
            <option value="ph_psych" title={ZS_WIZARD_CHOICE_TITLES.ph_psych}>
              Jsme škola při psychiatrické nemocnici
            </option>
            <option value="ph_health" title={ZS_WIZARD_CHOICE_TITLES.ph_health}>
              Jsme ZŠ při zdravotnickém zařízení (ne psychiatrie)
            </option>
            <option value="ph_mixed" title={ZS_WIZARD_CHOICE_TITLES.ph_mixed}>
              Máme smíšené třídy
            </option>
            <option value="ph_prep" title={ZS_WIZARD_CHOICE_TITLES.ph_prep}>
              Máme přípravnou třídu nebo přípravný stupeň ZŠS
            </option>
          </select>
          <p id="zs-wizard-choice-legend" className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", lineHeight: 1.5 }}>
            {guideTooltipLegend}
          </p>
        </div>

        <div className="subcard">
          <h3>Co rozcestník udělá</h3>
          <p className="muted-text">
            Vybere vhodnou záložku a načte příklad, který odpovídá zvolené situaci. Potom můžete všechna data ručně
            upravit podle vlastní školy.
          </p>
        </div>
      </div>
    </section>
  );
}
