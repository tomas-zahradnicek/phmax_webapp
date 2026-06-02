import React from "react";
import { QuickOnboarding } from "../QuickOnboarding";
import {
  CALCULATOR_GLOBAL_DISPLAY_HINT,
  CALCULATOR_LIMITS_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  LAY_USER_QUICK_START_MOBILE_UX,
  LAY_USER_QUICK_START_NV75,
} from "../calculator-ui-constants";

export type Nv75QuickOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function Nv75QuickOnboardingGuide({ open, onDismiss, returnFocusRef }: Nv75QuickOnboardingGuideProps) {
  return (
    <QuickOnboarding
      title="Nápověda – NV75 banka odpočtů"
      open={open}
      onDismiss={onDismiss}
      anchorId="nv75-quick-onboarding"
      returnFocusRef={returnFocusRef}
    >
      <p>
        <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
      </p>
      <p>{LAY_USER_QUICK_START_NV75}</p>
      <p>{LAY_USER_QUICK_START_MOBILE_UX}</p>
      <p>{CALCULATOR_GLOBAL_DISPLAY_HINT}</p>
      <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
      <p>
        Ukázka <strong>A</strong> v comboboxu Příkladové výpočty předvyplní typickou situaci banky odpočtů – po načtení ověřte §4b a bonusy §4c/§4d
        v pravém docku <strong>Kontext výpočtu</strong>.
      </p>
    </QuickOnboarding>
  );
}
