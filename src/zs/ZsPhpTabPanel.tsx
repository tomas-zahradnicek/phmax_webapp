import React from "react";
import type { CalculatorViewMode } from "../calculator-view-mode";
import { sectionNeedsAttentionClass } from "../calculator-section-focus";
import { FieldHintButton } from "../FieldHintButton";
import { InputOutputLegend, NumberField, ResultCard } from "../phmax-zs-ui";
import { ZsModuleGate } from "../ZsModuleGate";
import type { ZsPhpMethodMode, ZsPhpWizardStep } from "./zs-form-snapshot";

function HelpHint({ text }: { text: string }) {
  return <FieldHintButton text={text} />;
}

export type ZsPhpBand = {
  label: string;
  value: number;
};

export type ZsPhpTabPanelProps = {
  viewMode: CalculatorViewMode;
  hasPhpIssue: boolean;
  phpWizardStep: ZsPhpWizardStep;
  phpMethodMode: ZsPhpMethodMode;
  phpYear1: number;
  phpYear2: number;
  phpYear3: number;
  phpExcludedAbroad: number;
  phpExcludedForeignSchoolCz: number;
  phpExcludedIndividual: number;
  phpExcludedSchool: boolean;
  phpBaseValue: number;
  phpExcludedTotal: number;
  phpAdjustedValue: number;
  phpBand: ZsPhpBand;
  totalPhp: number;
  onWizardStepChange: (step: ZsPhpWizardStep) => void;
  onMethodModeChange: (mode: ZsPhpMethodMode) => void;
  onYear1Change: (value: number) => void;
  onYear2Change: (value: number) => void;
  onYear3Change: (value: number) => void;
  onExcludedAbroadChange: (value: number) => void;
  onExcludedForeignSchoolCzChange: (value: number) => void;
  onExcludedIndividualChange: (value: number) => void;
  onExcludedSchoolChange: (checked: boolean) => void;
  onReset: () => void;
};

export function ZsPhpTabPanel({
  viewMode,
  hasPhpIssue,
  phpWizardStep,
  phpMethodMode,
  phpYear1,
  phpYear2,
  phpYear3,
  phpExcludedAbroad,
  phpExcludedForeignSchoolCz,
  phpExcludedIndividual,
  phpExcludedSchool,
  phpBaseValue,
  phpExcludedTotal,
  phpAdjustedValue,
  phpBand,
  totalPhp,
  onWizardStepChange,
  onMethodModeChange,
  onYear1Change,
  onYear2Change,
  onYear3Change,
  onExcludedAbroadChange,
  onExcludedForeignSchoolCzChange,
  onExcludedIndividualChange,
  onExcludedSchoolChange,
  onReset,
}: ZsPhpTabPanelProps) {
  return (
    <ZsModuleGate sectionId="php" title="PHPmax – metodický výpočet" viewMode={viewMode} defaultOpenInBasic>
      <section
        className={`card section-card section-card--php${sectionNeedsAttentionClass(hasPhpIssue)}`}
        data-section="php"
      >
        <h2>
          PHPmax – metodický výpočet{" "}
          <HelpHint text="PHPmax se stanoví podle průměrného počtu žáků za předcházející tři roky. Do tohoto počtu se nezapočítávají žáci vzdělávaní v zahraničí, v zahraniční škole v ČR a v individuálním vzdělávání." />
        </h2>
        <p className="muted-text">
          Postup výpočtu (kroky A–D): rozhodné počty, očištění dat, výpočet a interpretace. Najeďte na ikonu „i“ u
          nadpisů pro stručnou metodickou nápovědu.
        </p>
        <InputOutputLegend compact />

        <div className="tabs tabs--compact">
          <button
            type="button"
            className={phpWizardStep === "a" ? "tab active" : "tab"}
            onClick={() => onWizardStepChange("a")}
          >
            A. Vstupy
          </button>
          <button
            type="button"
            className={phpWizardStep === "b" ? "tab active" : "tab"}
            onClick={() => onWizardStepChange("b")}
          >
            B. Očištění
          </button>
          <button
            type="button"
            className={phpWizardStep === "c" ? "tab active" : "tab"}
            onClick={() => onWizardStepChange("c")}
          >
            C. Výpočet
          </button>
          <button
            type="button"
            className={phpWizardStep === "d" ? "tab active" : "tab"}
            onClick={() => onWizardStepChange("d")}
          >
            D. Výklad
          </button>
        </div>

        <div className="toolbar">
          <button type="button" className="btn ghost" onClick={onReset}>
            Vymazat údaje PHPmax – metodický výpočet
          </button>
        </div>

        <div className="checks">
          <label>
            <input
              type="radio"
              checked={phpMethodMode === "three_year_avg"}
              onChange={() => onMethodModeChange("three_year_avg")}
            />
            Použít průměr za 3 roky
          </label>
          <label>
            <input
              type="radio"
              checked={phpMethodMode === "short_period"}
              onChange={() => onMethodModeChange("short_period")}
            />
            Použít kratší období než 3 roky
          </label>
        </div>

        {phpWizardStep === "a" && (
          <>
            <h3>
              Zadání počtu žáků{" "}
              <HelpHint text="Rozhodná hodnota pro PHPmax vychází zpravidla z průměru za tři předcházející roky." />
            </h3>
            <div className="grid three">
              <NumberField label="Počet žáků – rok 1" value={phpYear1} onChange={onYear1Change} />
              <NumberField label="Počet žáků – rok 2" value={phpYear2} onChange={onYear2Change} />
              <NumberField label="Počet žáků – rok 3" value={phpYear3} onChange={onYear3Change} />
            </div>
            <div className="grid three">
              <ResultCard
                label="Metoda"
                value={phpMethodMode === "three_year_avg" ? "Průměr za 3 roky" : "Kratší období"}
              />
              <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
              <ResultCard
                label="Stav školy"
                value={phpExcludedSchool ? "Vyloučená z PHPmax – metodický výpočet" : "Standardní posouzení"}
              />
            </div>
          </>
        )}

        {phpWizardStep === "b" && (
          <>
            <h3>
              Žáci nezapočítávaní do výpočtu{" "}
              <HelpHint text="Do rozhodného počtu se nezapočítávají žáci vzdělávaní v zahraničí, v zahraniční škole v ČR a v individuálním vzdělávání." />
            </h3>
            <div className="grid three">
              <NumberField label="Vzdělávání v zahraničí" value={phpExcludedAbroad} onChange={onExcludedAbroadChange} />
              <NumberField
                label="Zahraniční škola v ČR"
                value={phpExcludedForeignSchoolCz}
                onChange={onExcludedForeignSchoolCzChange}
              />
              <NumberField
                label="Individuální vzdělávání"
                value={phpExcludedIndividual}
                onChange={onExcludedIndividualChange}
              />
            </div>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={phpExcludedSchool}
                  onChange={(e) => onExcludedSchoolChange(e.target.checked)}
                />
                Tato škola se do PHPmax – metodický výpočet nezapočítává
              </label>
            </div>
            <div className="grid three">
              <ResultCard label="Součet vyloučených žáků" value={phpExcludedTotal} />
              <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
              <ResultCard label="Očištěná hodnota" value={phpAdjustedValue} />
            </div>
          </>
        )}

        {phpWizardStep === "c" && (
          <>
            <h3>Výpočet výsledné hodnoty PHPmax – metodický výpočet</h3>
            <div className="grid three">
              <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
              <ResultCard label="Součet nezapočítávaných žáků" value={phpExcludedTotal} />
              <ResultCard label="Očištěná hodnota" value={phpAdjustedValue} />
            </div>
            <div className="grid three">
              <ResultCard label="Zařazení do pásma" value={phpBand.label} />
              <ResultCard label="PHPmax – metodický výpočet" value={phpBand.value} />
              <ResultCard label="PHPmax – metodický výpočet celkem" value={totalPhp} />
            </div>
          </>
        )}

        {phpWizardStep === "d" && (
          <>
            <h3>
              Jak výsledek interpretovat v praxi{" "}
              <HelpHint text="Výsledkem je týdenní rozsah financované přímé pedagogické činnosti podle příslušného pásma PHPmax." />
            </h3>
            <div className="subcard">
              <p className="muted-text">1. Nejprve se určí rozhodná hodnota podle zvolené metody.</p>
              <p className="muted-text">2. Poté se odečtou žáci, kteří se do výpočtu nezapočítávají.</p>
              <p className="muted-text">3. Očištěná hodnota se porovná s pásmy PHP_TABLE.</p>
              <p className="muted-text">
                4. Pokud je škola vyloučená z PHPmax – metodický výpočet, výsledek je 0 bez ohledu na počty žáků.
              </p>
            </div>
            <div className="grid three">
              <ResultCard label="Rozhodná hodnota" value={phpBaseValue} />
              <ResultCard label="Očištěná hodnota" value={phpAdjustedValue} />
              <ResultCard label="Výsledek PHPmax – metodický výpočet" value={totalPhp} />
            </div>
          </>
        )}
      </section>
    </ZsModuleGate>
  );
}
