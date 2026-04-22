import React from "react";
import { LegisTooltipRef } from "./LegisTooltipRef";
import { PV_LEGIS_PARAGRAPH_TOOLTIPS, PV_LEGIS_ZAKONY_URL } from "./phmax-pv-legislativa";
import { SD_LEGIS_PARAGRAPH_TOOLTIPS, SD_LEGIS_ZAKONY_URL } from "./phmax-sd-legislativa";
import { ZS_LEGIS_PARAGRAPH_TOOLTIPS, ZS_LEGIS_ZAKONY_URL } from "./phmax-zs-legislativa";

function LawLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="status-link ss-why-panel__link">
      {children}
    </a>
  );
}

export function ZsLegisRef({ citeId, label }: { citeId: string; label: string }) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={ZS_LEGIS_PARAGRAPH_TOOLTIPS} />;
}

export function PvLegisRef({ citeId, label }: { citeId: string; label: string }) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={PV_LEGIS_PARAGRAPH_TOOLTIPS} />;
}

export function SdLegisRef({ citeId, label }: { citeId: string; label: string }) {
  return <LegisTooltipRef citeId={citeId} label={label} tooltips={SD_LEGIS_PARAGRAPH_TOOLTIPS} />;
}

type ProductLegisVariant = "zs" | "pv" | "sd";

/**
 * Rozbalitelný blok s legislativním kontextem a tooltipy u citací (stejný vzor jako u SŠ).
 */
export function ProductLegisContextPanel({ variant }: { variant: ProductLegisVariant }) {
  if (variant === "zs") {
    return (
      <details className="methodology-strip methodology-strip--collapsible card muted" style={{ marginTop: 16 }}>
        <summary className="methodology-strip__summary">Legislativa a výklad (ZŠ)</summary>
        <div className="methodology-strip__panel">
          <ul className="methodology-strip__list">
            <li>
              <ZsLegisRef citeId="nv123-1" label="PHmax (NV § 1)" /> a pásma podle průměru žáků —{" "}
              <ZsLegisRef citeId="nv123-priloha1" label="příloha č. 1 NV 123/2018" />. Součet za školu:{" "}
              <ZsLegisRef citeId="nv123-1-3" label="§ 1 odst. 3 NV" />.
            </li>
            <li>
              Třídy <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9 školského zákona" /> a RVP:{" "}
              <ZsLegisRef citeId="vyhl48" label="vyhl. č. 48/2005 Sb." />. Rozsah přímé výuky učitele:{" "}
              <ZsLegisRef citeId="nv75" label="NV č. 75/2005 Sb." />. Obecný rámec:{" "}
              <ZsLegisRef citeId="skolsky-561" label="zákon č. 561/2004 Sb." />.
            </li>
          </ul>
          <p className="muted-text methodology-strip__note" style={{ marginTop: 10, fontSize: "0.88rem" }}>
            U citací použijte myš nebo klávesu Tab — zobrazí se stručný výklad. Úplné znění:{" "}
            <LawLink href={ZS_LEGIS_ZAKONY_URL.nv123}>NV 123/2018</LawLink>
            {" · "}
            <LawLink href={ZS_LEGIS_ZAKONY_URL.vyhl48}>vyhl. 48/2005</LawLink>
            {" · "}
            <LawLink href={ZS_LEGIS_ZAKONY_URL.nv75}>NV 75/2005</LawLink>
            {" · "}
            <LawLink href={ZS_LEGIS_ZAKONY_URL.skolsky561}>školský zákon</LawLink>.
          </p>
        </div>
      </details>
    );
  }

  if (variant === "pv") {
    return (
      <details className="methodology-strip methodology-strip--collapsible card muted" style={{ marginTop: 16 }}>
        <summary className="methodology-strip__summary">Legislativa a výklad (PV)</summary>
        <div className="methodology-strip__panel">
          <ul className="methodology-strip__list">
            <li>
              Rámec PHmax: <PvLegisRef citeId="pv-nv123" label="NV č. 123/2018 Sb." />. Organizace MŠ:{" "}
              <PvLegisRef citeId="pv-vyhl14" label="vyhl. č. 14/2005 Sb." />. Tabulky podle provozu:{" "}
              <PvLegisRef citeId="pv-metodika-t13" label="metodika MŠMT (tab. 1–3)" />. Zdravotnický kmen:{" "}
              <PvLegisRef citeId="pv-zdr31" label="31 h na třídu" />.
            </li>
            <li>
              Výjimky z nejnižšího počtu dětí a krácení PHmax: <PvLegisRef citeId="pv-1d3" label="§ 1d odst. 3 vyhl. 14" /> — v
              aplikaci se nevyhodnocuje automaticky.
            </li>
          </ul>
          <p className="muted-text methodology-strip__note" style={{ marginTop: 10, fontSize: "0.88rem" }}>
            <LawLink href={PV_LEGIS_ZAKONY_URL.nv123}>NV 123/2018</LawLink>
            {" · "}
            <LawLink href={PV_LEGIS_ZAKONY_URL.vyhl14}>vyhl. 14/2005</LawLink>
            {" · "}
            <LawLink href={PV_LEGIS_ZAKONY_URL.msmtPv}>Metodika MŠMT (PV)</LawLink>.
          </p>
        </div>
      </details>
    );
  }

  return (
    <details className="methodology-strip methodology-strip--collapsible card muted" style={{ marginTop: 16 }}>
      <summary className="methodology-strip__summary">Legislativa a výklad (ŠD)</summary>
      <div className="methodology-strip__panel">
        <ul className="methodology-strip__list">
          <li>
            PHmax podle počtu oddělení: <SdLegisRef citeId="sd-vyhl74-priloha" label="příloha vyhl. č. 74/2005 Sb." />. Krácení
            při nízké naplněnosti: <SdLegisRef citeId="sd-10-2" label="§ 10 odst. 2 vyhl. 74" />.
          </li>
          <li>
            Složité případy (např. <SdLegisRef citeId="sd-skolsky-16" label="§ 16 školského zákona" />, méně než čtyři oddělení)
            vyžadují úplné znění vyhlášky a metodiku — aplikace je neřeší v plné šíři.
          </li>
        </ul>
        <p className="muted-text methodology-strip__note" style={{ marginTop: 10, fontSize: "0.88rem" }}>
          <LawLink href={SD_LEGIS_ZAKONY_URL.vyhl74}>Vyhl. 74/2005</LawLink>
          {" · "}
          <LawLink href={SD_LEGIS_ZAKONY_URL.skolsky561}>Školský zákon</LawLink>.
        </p>
      </div>
    </details>
  );
}
