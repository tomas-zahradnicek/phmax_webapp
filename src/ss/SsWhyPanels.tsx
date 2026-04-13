import React from "react";
import type { BusinessRulesResult, RuleMessage } from "./phmax-ss-business-rules";
import type { ExplainabilityMessage, ExplainabilityResult, ExplainabilityRow } from "./phmax-ss-explainability";
import { getBruleLegis, SS_LEGIS_CITE_LABELS, SS_LEGIS_ZAKONY_URL } from "./phmax-ss-legislativa";
import type { ServiceResolvedRow } from "./phmax-ss-service";
import { SsLegisRef } from "./SsLegisRef";

function LawLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="status-link ss-why-panel__link">
      {children}
    </a>
  );
}

function messageToneClass(severity: ExplainabilityMessage["severity"]): string {
  if (severity === "error") return "ss-explain-msg ss-explain-msg--error";
  if (severity === "warning") return "ss-explain-msg ss-explain-msg--warning";
  return "ss-explain-msg ss-explain-msg--info";
}

/** Strukturovaný výstup z `explainSingleRow` / `explainFullPhmaxDecision` (kroky, zprávy, právní opora). */
export function SsExplainabilityBlock({
  explanation,
  heading = "Postup výpočtu a právní opora",
}: {
  explanation: ExplainabilityRow["explanation"];
  heading?: string;
}) {
  return (
    <div className="ss-explain-block" style={{ marginTop: 14 }}>
      <p className="muted-text" style={{ margin: "0 0 8px", fontSize: "0.88rem", fontWeight: 700 }}>
        {heading}
      </p>
      <p className="muted-text" style={{ margin: "0 0 10px", fontSize: "0.88rem", lineHeight: 1.5 }}>
        <strong>Shrnutí:</strong> {explanation.shortSummary}
      </p>
      <ol className="ss-explain-steps muted-text" style={{ margin: "0 0 12px", paddingLeft: "1.2rem", lineHeight: 1.55, fontSize: "0.86rem" }}>
        {explanation.steps.map((step, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {step}
          </li>
        ))}
      </ol>
      <div style={{ marginBottom: 10 }}>
        {explanation.messages.map((m, i) => (
          <div key={i} className={messageToneClass(m.severity)} style={{ marginBottom: 8 }}>
            <strong style={{ display: "block", fontSize: "0.85rem" }}>{m.title}</strong>
            <span style={{ fontSize: "0.86rem", lineHeight: 1.5 }}>{m.body}</span>
            {m.legalBasis && m.legalBasis.length > 0 ? (
              <div className="muted-text" style={{ marginTop: 4, fontSize: "0.8rem" }}>
                Opora: {m.legalBasis.join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <p className="muted-text" style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.45 }}>
        <strong>Právní rámec řádku:</strong> {explanation.legalBasis.join(" · ")}
      </p>
    </div>
  );
}

export function SsSchoolExplainabilitySummary({ result }: { result: ExplainabilityResult }) {
  return (
    <div className="ss-explain-block" style={{ marginTop: 0 }}>
      <p className="muted-text" style={{ margin: "0 0 10px", fontSize: "0.9rem", lineHeight: 1.55 }}>
        {result.summary.narrative}
      </p>
      {result.summary.messages.map((m, i) => (
        <div key={i} className={messageToneClass(m.severity)} style={{ marginBottom: 10 }}>
          <strong style={{ display: "block", fontSize: "0.85rem" }}>{m.title}</strong>
          <span style={{ fontSize: "0.86rem", lineHeight: 1.5 }}>{m.body}</span>
          {m.legalBasis && m.legalBasis.length > 0 ? (
            <div className="muted-text" style={{ marginTop: 4, fontSize: "0.8rem" }}>
              Opora: {m.legalBasis.join(" · ")}
            </div>
          ) : null}
        </div>
      ))}
      <details className="ss-explain-school-details" style={{ marginTop: 8 }}>
        <summary className="muted-text" style={{ cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}>
          Rozpis po řádcích ({result.rows.length})
        </summary>
        <ul className="muted-text" style={{ margin: "8px 0 0", paddingLeft: "1.1rem", fontSize: "0.86rem", lineHeight: 1.5 }}>
          {result.rows.map((row, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {row.explanation.shortSummary}
            </li>
          ))}
        </ul>
      </details>
      <p className="muted-text" style={{ margin: "12px 0 0", fontSize: "0.8rem", lineHeight: 1.45 }}>
        <strong>Souhrnná právní opora (orientačně):</strong> {result.summary.legalBasis.join(" · ")}
      </p>
    </div>
  );
}

export function SsWhyPhmaxPanel({
  row,
  explanation,
}: {
  row: ServiceResolvedRow;
  explanation?: ExplainabilityRow["explanation"];
}) {
  const formLabel =
    row.form === "denni"
      ? "denní forma (koeficient 1)"
      : `forma „${row.form}“ (koeficient ${row.coefficient})`;

  return (
    <div className="ss-why-panel card muted" style={{ margin: 0, padding: "12px 14px", textAlign: "left" }}>
      <p className="ss-why-panel__title">
        <strong>Proč tento výsledek?</strong> — orientační výklad k řádku PHmax
      </p>
      <ul className="ss-why-panel__list muted-text" style={{ margin: "8px 0 0", paddingLeft: "1.2rem", lineHeight: 1.55 }}>
        <li>
          Základ PHmax na třídu vychází z tabulek podle průměru žáků —{" "}
          <SsLegisRef citeId="nv123-priloha1" label={SS_LEGIS_CITE_LABELS["nv123-priloha1"]} />. Definice PHmax:{" "}
          <SsLegisRef citeId="nv123-1" label={SS_LEGIS_CITE_LABELS["nv123-1"]} />.
        </li>
        <li>
          Pásmo „{row.intervalLabel}“ odpovídá zadanému průměru {row.averageStudents} žáků a zvolenému režimu výpočtu (
          <strong>{row.modeKey}</strong>) v interním datasetu oboru.
        </li>
        <li>
          {formLabel} — <SsLegisRef citeId="nv123-2" label={SS_LEGIS_CITE_LABELS["nv123-2"]} />.
        </li>
        <li>
          Součin upravené hodnoty a počtu tříd ({row.classCount}) dává PHmax celkem (srov.{" "}
          <SsLegisRef citeId="nv123-1-3" label={SS_LEGIS_CITE_LABELS["nv123-1-3"]} /> — součet za školu je součtem řádků).
        </li>
      </ul>
      <p className="muted-text" style={{ marginTop: 10, fontSize: "0.88rem" }}>
        Předpisy: <LawLink href={SS_LEGIS_ZAKONY_URL.nv123}>NV 123/2018 Sb.</LawLink>
        {" · "}
        <LawLink href={SS_LEGIS_ZAKONY_URL.vyhl13}>vyhl. 13/2005 Sb.</LawLink> (víceoborové třídy).
      </p>
      {explanation ? <SsExplainabilityBlock explanation={explanation} /> : null}
    </div>
  );
}

function RuleMessagesWithLegis({ messages }: { messages: RuleMessage[] }) {
  if (messages.length === 0) return null;
  return (
    <ul className="ss-why-panel__list" style={{ margin: "6px 0 0", paddingLeft: "1.1rem" }}>
      {messages.map((m, i) => {
        const leg = getBruleLegis(m.code);
        return (
          <li key={`${m.code}-${i}`} style={{ marginBottom: 8 }}>
            <strong>{m.code}:</strong> {m.message}
            {leg ? (
              <div className="muted-text" style={{ marginTop: 4, fontSize: "0.9rem" }}>
                {leg.note}
                {leg.citeIds.length > 0 ? (
                  <span>
                    {" "}
                    (
                    {leg.citeIds.map((id, j) => (
                      <React.Fragment key={id}>
                        {j > 0 ? ", " : null}
                        <SsLegisRef citeId={id} label={SS_LEGIS_CITE_LABELS[id] ?? id} />
                      </React.Fragment>
                    ))}
                    )
                  </span>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function SsWhyPhmaxErrorPanel({ error }: { error: string }) {
  return (
    <div className="ss-why-panel card muted" style={{ margin: 0, padding: "12px 14px", textAlign: "left" }}>
      <p className="ss-why-panel__title">
        <strong>Proč tento výsledek?</strong> — výpočet PHmax selhal
      </p>
      <p className="muted-text" style={{ marginTop: 8, lineHeight: 1.5 }}>
        {error}
      </p>
      <p className="muted-text" style={{ marginTop: 10, fontSize: "0.9rem", lineHeight: 1.5 }}>
        Typicky jde o neexistující kód v datasetu, průměr žáků mimo definovaná pásma pro zvolený režim, nebo nečíselné
        vstupy. Pásma vycházejí z <SsLegisRef citeId="nv123-priloha1" label={SS_LEGIS_CITE_LABELS["nv123-priloha1"]} /> (
        implementace v aplikaci = interní tabulky oboru).
      </p>
      <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
        <LawLink href={SS_LEGIS_ZAKONY_URL.nv123}>NV 123/2018 Sb.</LawLink>
      </p>
    </div>
  );
}

export function SsWhyBrulesEvalErrorPanel({ error }: { error: string }) {
  return (
    <div className="ss-why-panel card muted" style={{ margin: 0, padding: "12px 14px", textAlign: "left" }}>
      <p className="ss-why-panel__title">
        <strong>Proč tento výsledek?</strong> — kontrola pravidel selhala
      </p>
      <p className="muted-text" style={{ marginTop: 8, lineHeight: 1.5 }}>
        {error}
      </p>
      <p className="muted-text" style={{ marginTop: 10, fontSize: "0.9rem", lineHeight: 1.5 }}>
        Nejčastěji jde o neplatné kódy oborů, chybně vyplněné počty žáků podle oborů, nebo vnitřní chybu datasetu. Pravidla víceoborových tříd vycházejí z{" "}
        <SsLegisRef citeId="vyhl13-2a1" label="§ 2a" /> a souvisejících ustanovení vyhlášky.
      </p>
      <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
        <LawLink href={SS_LEGIS_ZAKONY_URL.vyhl13}>Vyhláška 13/2005 Sb.</LawLink>
      </p>
    </div>
  );
}

export function SsWhyBrulesPanel({ result }: { result: BusinessRulesResult }) {
  return (
    <div className="ss-why-panel card muted" style={{ margin: 0, padding: "12px 14px", textAlign: "left" }}>
      <p className="ss-why-panel__title">
        <strong>Proč tento výsledek?</strong> — kontrola pravidel a legislativa
      </p>
      <p className="muted-text" style={{ marginTop: 6, fontSize: "0.88rem" }}>
        U citací (např. <SsLegisRef citeId="vyhl13-2a1" label="§ 2a odst. 1" />) najeďte myší nebo použijte Tab + fokus — zobrazí se stručný výklad.
      </p>
      {result.errors.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <strong style={{ color: "var(--danger, #b91c1c)" }}>Chyby</strong>
          <RuleMessagesWithLegis messages={result.errors} />
        </div>
      ) : null}
      {result.warnings.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <strong style={{ color: "var(--warning, #b45309)" }}>Varování</strong>
          <RuleMessagesWithLegis messages={result.warnings} />
        </div>
      ) : null}
      {result.info.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <strong className="muted-text">Informace</strong>
          <RuleMessagesWithLegis messages={result.info} />
        </div>
      ) : null}
      <p className="muted-text" style={{ marginTop: 10, fontSize: "0.88rem" }}>
        <LawLink href={SS_LEGIS_ZAKONY_URL.vyhl13}>Vyhláška 13/2005 Sb.</LawLink>
        {" · "}
        <LawLink href={SS_LEGIS_ZAKONY_URL.nv123}>NV 123/2018 Sb.</LawLink>
      </p>
    </div>
  );
}
