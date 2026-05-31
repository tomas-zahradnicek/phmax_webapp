import React from "react";
import type { CalculatorMode } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";
import { InputOutputLegend } from "../phmax-zs-ui";

type ModeOption = {
  id: CalculatorMode;
  label: string;
  description: string;
};

type ZsSetupSectionProps = {
  mode: CalculatorMode;
  modeOptions: readonly ModeOption[];
  onModeChange: (mode: CalculatorMode) => void;
  SectionLead: React.ComponentType<{ children: React.ReactNode }>;
};

export function ZsSetupSection({ mode, modeOptions, onModeChange, SectionLead }: ZsSetupSectionProps) {
  return (
    <section className="card card--elevated section-card section-card--setup" data-section="setup" data-wizard-step="1">
      <h2 className="section-title">Typ školy a režim výpočtu</h2>
      <SectionLead>
        Tady vyberete, jaký typ výpočtu chcete zobrazit. Rozcestník výše vám může s výběrem pomoci.
      </SectionLead>
      <InputOutputLegend />
      <div className="grid two">
        <div className="field">
          <span id="zs-mode-select-label">Vyberte režim</span>
          <select
            id="zs-mode-select"
            aria-labelledby="zs-mode-select-label"
            aria-describedby="zs-mode-select-legend"
            title="Režim určuje viditelné části kalkulačky. U každé položky v seznamu je po najetí myší stručný popis; detail aktivního režimu je vpravo."
            value={mode}
            onChange={(e) => onModeChange(e.target.value as CalculatorMode)}
          >
            {modeOptions.map((item) => (
              <option key={item.id} value={item.id} title={item.description}>
                {item.label}
              </option>
            ))}
          </select>
          <p id="zs-mode-select-legend" className="muted-text" style={{ marginTop: 8, fontSize: "0.82rem", lineHeight: 1.5 }}>
            Každá položka seznamu má vlastní nápovědu (najetí na řádek). U předpisů lze použít i záložku „Legislativa a
            výklad (ZŠ)“.
          </p>
        </div>

        <div className="subcard">
          <h3>{MODE_CONFIG[mode].label}</h3>
          <p className="muted-text">{MODE_CONFIG[mode].description}</p>
        </div>
      </div>
    </section>
  );
}
