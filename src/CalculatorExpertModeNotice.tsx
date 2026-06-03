import React from "react";
import { CALCULATOR_EXPERT_FIRST_SWITCH_LS_KEY } from "./calculator-ui-constants";

type CalculatorExpertModeNoticeProps = {
  viewMode: "basic" | "expert";
  exampleSelectId?: string;
};

/** Jednorázový banner po prvním přepnutí na Expertní. */
export function CalculatorExpertModeNotice({ viewMode, exampleSelectId }: CalculatorExpertModeNoticeProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (viewMode !== "expert") {
      setVisible(false);
      return;
    }
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(CALCULATOR_EXPERT_FIRST_SWITCH_LS_KEY) === "1") return;
    setVisible(true);
  }, [viewMode]);

  const dismiss = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CALCULATOR_EXPERT_FIRST_SWITCH_LS_KEY, "1");
    }
    setVisible(false);
  };

  const focusExamples = () => {
    if (!exampleSelectId) return;
    const el = document.getElementById(exampleSelectId);
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="calculator-expert-notice" role="status" data-testid="calculator-expert-notice">
      <p className="calculator-expert-notice__text">
        Expertní režim: všechny panely a exporty v jedné liště. Ukázku zvolíte v comboboxu{" "}
        <strong>Příkladové výpočty</strong> v Akcích, nebo rovnou vyplňte formulář.
      </p>
      <div className="calculator-expert-notice__actions">
        {exampleSelectId ? (
          <button type="button" className="btn btn--sm ghost" onClick={focusExamples}>
            Přejít k ukázkám
          </button>
        ) : null}
        <button type="button" className="btn btn--sm primary" onClick={dismiss}>
          Rozumím
        </button>
      </div>
    </div>
  );
}
