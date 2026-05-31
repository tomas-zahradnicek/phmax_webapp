import React from "react";
import { QuickOnboarding } from "../QuickOnboarding";
import {
  CALCULATOR_LIMITS_NOTE,
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  LAY_USER_QUICK_START_MOBILE_UX,
  LAY_USER_QUICK_START_PV,
} from "../calculator-ui-constants";

export type PvQuickOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function PvQuickOnboardingGuide({ open, onDismiss, returnFocusRef }: PvQuickOnboardingGuideProps) {
  return (
    <QuickOnboarding
      title="Nápověda – předškolní vzdělávání"
      open={open}
      onDismiss={onDismiss}
      anchorId="pv-quick-onboarding"
      returnFocusRef={returnFocusRef}
    >
      <p>
        <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
      </p>
      <p>{LAY_USER_QUICK_START_PV}</p>
      <p>{LAY_USER_QUICK_START_MOBILE_UX}</p>
      <p>
        Orientační výpočet podle metodiky PHmax a PHAmax pro předškolní vzdělávání (verze 4, 2026) a vyhlášky č.
        14/2005 Sb. Každé <strong>číslované pracoviště</strong> ve formuláři (Pracoviště 1, 2…) odpovídá jedné
        kombinaci <strong>místa (nebo jeho části) a druhu provozu</strong> – stejně jako jeden řádek v tabulkové
        pomůcce MŠMT. U právnické osoby s více skutečnými pracovišti nebo více druhy provozu přidejte další položku;
        součet PHmax z pracovišť odpovídá celkovému PHmax (po sečtení dílčích výpočtů dle metodiky). Údaje vycházejí z
        matrice M 1 (dříve S 1-01); u MŠ při zdravotnickém zařízení z výkazu S 4-01.
      </p>
      <p>{EXPORT_ORIENTACNI_NOTE}</p>
      <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
      <p>
        U každého pracoviště zadáváte <strong>druh provozu</strong>, počet tříd, případně navýšení dle vyhlášky a{" "}
        <strong>průměrnou denní dobu provozu v hodinách</strong> (zařadí se do sloupce tabulky 1–3 přílohy). Máte-li{" "}
        <strong>odloučená pracoviště</strong> nebo na jednom místě např. celodenní i polodenní provoz, přidejte další
        pracoviště pro každou kombinaci – v souhrnné tabulce uvidíte dílčí PHmax i <strong>součet</strong>. Krácení PHmax
        dle § 1d odst. 3 vyhl. 14/2005 zde neřešíme.
      </p>
      <p>
        <strong>Checklist – kdy přidat další pracoviště:</strong> odloučené místo školy; jiný druh provozu na stejném
        místě (celodenní/polodenní/internátní); nebo oddělená situace, kterou potřebujete vykázat samostatně.
      </p>
    </QuickOnboarding>
  );
}
