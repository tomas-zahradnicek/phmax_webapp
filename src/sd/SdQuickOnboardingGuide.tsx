import React from "react";
import { QuickOnboarding } from "../QuickOnboarding";
import {
  CALCULATOR_LIMITS_NOTE,
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  LAY_USER_QUICK_START_MOBILE_UX,
  LAY_USER_QUICK_START_SD,
} from "../calculator-ui-constants";

export type SdQuickOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function SdQuickOnboardingGuide({ open, onDismiss, returnFocusRef }: SdQuickOnboardingGuideProps) {
  return (
    <QuickOnboarding
      title="Jak s touto kalkulačkou pracovat"
      open={open}
      onDismiss={onDismiss}
      anchorId="sd-quick-onboarding"
      returnFocusRef={returnFocusRef}
    >
      <p>
        <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
      </p>
      <p>{LAY_USER_QUICK_START_SD}</p>
      <p>{LAY_USER_QUICK_START_MOBILE_UX}</p>
      <p>
        Vyplňte počet účastníků a případně počet oddělení (jinak se dopočítá dělením 27). Výsledek vychází z přílohy k
        vyhlášce č. 74/2005 Sb.; u průměru pod 20 na oddělení může aplikovat orientační krácení dle § 10 odst. 2.
        Složité případy (§ 16 školského zákona, méně než čtyři oddělení) musíte ověřit v plném znění předpisů.
      </p>
      <p>{EXPORT_ORIENTACNI_NOTE}</p>
      <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
      <p>Export do CSV a Excelu a kopírování shrnutí najdete v horní liště pod nadpisem stránky.</p>
      <p>
        Počet účastníků = žáci 1. stupně ZŠ přihlášení k pravidelné denní docházce (pro krácení PHmax dle § 10 odst. 2).
        Počet oddělení pro nové oddělení nad první: průměr nad 27 účastníků → dělení počtem 27 a zaokrouhlení nahoru
        (u výjimek viz metodiku).
      </p>
      <p>
        Krácení dle § 10 odst. 2 se nepoužívá mechanicky ve všech případech (např. specifická organizace oddělení nebo
        výjimky dle vyhlášky). Pokud je situace hraniční, proveďte ruční kontrolu podle plného znění vyhlášky a metodiky.
      </p>
    </QuickOnboarding>
  );
}
