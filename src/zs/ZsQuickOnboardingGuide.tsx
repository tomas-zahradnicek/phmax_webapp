import React from "react";
import { QuickOnboarding } from "../QuickOnboarding";
import { ZsLegisRef } from "../PhmaxProductLegisUi";
import {
  CALCULATOR_GLOBAL_DISPLAY_HINT,
  CALCULATOR_LIMITS_NOTE,
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  HERO_ACTIONS_ICON_LEGEND_ZS_EXTRA,
  LAY_USER_QUICK_START_MOBILE_UX,
  LAY_USER_QUICK_START_ZS,
} from "../calculator-ui-constants";
import { ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER } from "./zs-export-rows";
import { MAX_NAMED_SNAPSHOTS } from "../zs-named-snapshots";

export type ZsQuickOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function ZsQuickOnboardingGuide({ open, onDismiss, returnFocusRef }: ZsQuickOnboardingGuideProps) {
  return (
    <QuickOnboarding
      title="Stručné pokyny"
      open={open}
      onDismiss={onDismiss}
      anchorId="zs-quick-guide"
      returnFocusRef={returnFocusRef}
    >
      <p>
        <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
      </p>
      <p>{LAY_USER_QUICK_START_ZS}</p>
      <p>{LAY_USER_QUICK_START_MOBILE_UX}</p>
      <p>{CALCULATOR_GLOBAL_DISPLAY_HINT}</p>
      <p>
        <strong>PHmax</strong> zadejte podle typu školy v rozbalovacím režimu; u specialit (psychiatrie, zdravotnické zařízení,
        menšina, gymnázia…) přepněte na odpovídající položku. <strong>PHAmax</strong> a <strong>PHPmax</strong> mají vlastní záložky.
        Žáky podle <strong>§ 38</strong> a <strong>§ 41</strong> školského zákona (navýšení PHmax o 0,25 / 0,5 h podle stupně) zadejte v sekci{" "}
        <strong>Samostatné položky PHmax</strong> – u většiny režimů ZŠ je přímo pod hlavními tabulkami; přípravné třídy a přípravný stupeň ZŠS
        jsou navíc v režimu „PHmax – přípravné třídy, přípravný stupeň, § 38 a § 41“.
      </p>
      <p>
        Průměry u škol při zdravotnickém zařízení a psychiatrii počítá aplikace jako vyšší z minulého roku a aktuálního sběru – doplňte oba sloupce, pokud je znáte.
        Pojmenované zálohy (max. {MAX_NAMED_SNAPSHOTS}) drží celý stav včetně záložky a pole „Označení pro export“.
        Srovnání aktuálního stavu se zálohou (JSON) používá uložené součty PHmax / PHAmax / PHPmax – u starších záloh z předchozí verze aplikace tuto položku znovu uložte.
      </p>
      <p>{EXPORT_ORIENTACNI_NOTE}</p>
      <p className="onboarding-hero-legend">
        {HERO_ACTIONS_ICON_LEGEND}
        {HERO_ACTIONS_ICON_LEGEND_ZS_EXTRA}
      </p>
      <p>
        V první skupině ukázek jsou čísla z modelových postupů PHmax v metodické příloze (včetně smíšených tříd 570 h).
        Model <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> a ZŠ speciální (AD1/AD2, řádky B35–B43) je v metodice v5 jako PHAmax – v rozbalovači ukázka „PHAmax“; po načtení se otevře záložka PHAmax.
        Ostatní ukázky doplňují typické situace; údaje můžete po načtení upravit.
      </p>
      <p>
        <strong>Právní a metodický podklad:</strong> metodika PHmax, PHAmax a PHPmax pro ZV (typicky verze 5 / 2026),{" "}
        <ZsLegisRef citeId="nv123-1" label="NV č. 123/2018 Sb." />, <ZsLegisRef citeId="vyhl48" label="vyhl. č. 48/2005 Sb." />.
        {ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER}
      </p>
    </QuickOnboarding>
  );
}
