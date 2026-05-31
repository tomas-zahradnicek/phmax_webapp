import React from "react";
import { QuickOnboarding } from "../QuickOnboarding";
import {
  CALCULATOR_LIMITS_NOTE,
  EXPORT_ORIENTACNI_NOTE,
  HERO_ACTIONS_ICON_LEGEND,
  LAY_USER_QUICK_START_MOBILE_UX,
  LAY_USER_QUICK_START_SS,
} from "../calculator-ui-constants";
import { PHMAX_SS_MAX_NAMED_SNAPSHOTS, PHMAX_SS_MSMT_PAGE_URL } from "./phmax-ss-constants";

export type SsQuickOnboardingGuideProps = {
  open: boolean;
  onDismiss: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

export function SsQuickOnboardingGuide({ open, onDismiss, returnFocusRef }: SsQuickOnboardingGuideProps) {
  return (
    <QuickOnboarding
      title="Nápověda – střední školy (PHmax / PHAmax)"
      open={open}
      onDismiss={onDismiss}
      anchorId="ss-quick-onboarding"
      returnFocusRef={returnFocusRef}
    >
      <p>
        <strong>Co kalkulačka nedělá:</strong> {CALCULATOR_LIMITS_NOTE}
      </p>
      <p>{LAY_USER_QUICK_START_SS}</p>
      <p>{LAY_USER_QUICK_START_MOBILE_UX}</p>
      <p>
        Kalkulačka je orientační; výsledky ověřte vůči aktuální{" "}
        <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
          metodice MŠMT pro SŠ
        </a>{" "}
        a výkazům školy. Vedle tlačítka <strong>Nápověda</strong> je <strong>Slovníček</strong> s definicemi pojmů (PHmax,
        typ třídy, víceobor…).
      </p>
      <p>
        <strong>1. fáze – rámec vstupů a výstupů.</strong> Shrnuje, co metodika očekává jako vstupy školy a co dopočítá
        aplikace. Můžete si vést <strong>volitelné poznámky</strong> (ukládají se jen v tomto prohlížeči, odděleně od
        evidence řádků).
      </p>
      <p>
        <strong>2. fáze – evidence tříd a skupin.</strong> Každý <strong>řádek</strong> = jedna dílčí jednotka: přesný{" "}
        <strong>kód oboru z RVP</strong>, průměr žáků, počet tříd, forma studia, typ třídy. Sloupec <strong>Režim PHmax</strong>{" "}
        nechte na <em>Automaticky</em> (podle počtu oborů ve třídě a příznaku talentové 82) nebo režim ručně vynuťte. U
        více oborů ve stejné třídě vyplňte <strong>Další obory</strong> a volitelně <strong>Žáci / obor</strong> – níže
        proběhne kontrola pravidel. U každého řádku můžete řádek také <strong>Odstranit</strong> (konkrétní řádek).
      </p>
      <p>
        <strong>PHAmax v aplikaci.</strong> V horním přehledu se PHAmax dopočítává jen pro{" "}
        <strong>Praktickou školu</strong> (kódy <code className="methodology-strip__code">78-62-C/01</code>,{" "}
        <code className="methodology-strip__code">78-62-C/02</code>) v <strong>denní</strong> formě podle tabulky z
        metodiky. U ostatních oborů použijte plný postup MŠMT – PHAmax neinterpretujte z této verze jako úplný.
      </p>
      <p>
        <strong>Horní nástrojová lišta (pod ukázkovým příkladem).</strong> Zleva doprava typicky: <strong>tisk</strong>{" "}
        stránky, <strong>Přidat řádek</strong> a <strong>Odstranit poslední řádek</strong> (evidence v tabulce níže;
        vždy zůstane alespoň jeden řádek), rychlé <strong>uložení / obnovení</strong> průběhu v prohlížeči,{" "}
        <strong>vymazání uložených dat</strong> nebo <strong>vyčištění formuláře</strong>, pojmenované zálohy (max.{" "}
        {PHMAX_SS_MAX_NAMED_SNAPSHOTS}), export <strong>CSV</strong> a <strong>Excel</strong>, kopie a tisk textového
        shrnutí, <strong>auditní JSON</strong>. Řádky evidence se ukládají automaticky v tomto prohlížeči.
      </p>
      <p>{EXPORT_ORIENTACNI_NOTE}</p>
      <p className="onboarding-hero-legend">{HERO_ACTIONS_ICON_LEGEND}</p>
      <p>
        Po vyplnění sledujte sekci <strong>Orientační výpočet PHmax</strong> (řádek po řádku) a blok{" "}
        <strong>Kontrola pravidel</strong> u víceoborových tříd. U řádku lze rozbalit vysvětlení výpočtu („proč takto
        PHmax“) a vyhodnocení pravidel.
      </p>
    </QuickOnboarding>
  );
}
