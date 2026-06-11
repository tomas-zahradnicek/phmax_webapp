import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HeroBrandLogoButton } from "../AppBrandLogo";
import { AuthorCreditFooter } from "../AuthorCreditFooter";
import { CALCULATOR_LIMITS_NOTE } from "../calculator-ui-constants";
import { LiteToFullHint } from "../LiteToFullHint";
import { IntegerInput } from "../IntegerInput";
import { NumericInput } from "../NumericInput";
import { ProductViewPills, type ProductView } from "../ProductViewPills";
import { writePvLiteHandoffToFullStorage } from "../phmax-lite-handoff";
import { writePvFullUrl } from "../phmax-lite-paths";
import { CS_HOURS_PER_WEEK_SHORT } from "../cs-format";
import { getPvSec2MinimumChildrenTotal, type PvProvozKind } from "../phmax-pv-logic";
import { computePvLitePhmax } from "./phmax-pv-lite-logic";
import { PV_PROVOZ_OPTIONS, pvAvgHoursField } from "./pv-workplace-shared";

const PV_LITE_LS_KEY = "phmax-pv-lite-v3";

type PvLiteSnapshot = {
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  soleMsInMunicipality: boolean;
  actualChildren: number;
  sec16ClassCount: number;
};

function readPvLiteSnapshot(): PvLiteSnapshot {
  try {
    const raw = localStorage.getItem(PV_LITE_LS_KEY);
    if (!raw) {
      return {
        provoz: "celodenni",
        classCount: 0,
        avgHours: 0,
        soleMsInMunicipality: false,
        actualChildren: 0,
        sec16ClassCount: 0,
      };
    }
    const p = JSON.parse(raw) as Partial<PvLiteSnapshot>;
    const provoz = PV_PROVOZ_OPTIONS.some((o) => o.value === p.provoz) ? (p.provoz as PvProvozKind) : "celodenni";
    return {
      provoz,
      classCount: typeof p.classCount === "number" && p.classCount >= 0 ? Math.floor(p.classCount) : 0,
      avgHours: typeof p.avgHours === "number" && Number.isFinite(p.avgHours) ? Math.max(0, p.avgHours) : 0,
      soleMsInMunicipality: Boolean(p.soleMsInMunicipality),
      actualChildren:
        typeof p.actualChildren === "number" && p.actualChildren >= 0 ? Math.floor(p.actualChildren) : 0,
      sec16ClassCount:
        typeof p.sec16ClassCount === "number" && p.sec16ClassCount >= 0 ? Math.floor(p.sec16ClassCount) : 0,
    };
  } catch {
    return {
      provoz: "celodenni",
      classCount: 0,
      avgHours: 0,
      soleMsInMunicipality: false,
      actualChildren: 0,
      sec16ClassCount: 0,
    };
  }
}

function formatPvLiteHours(value: number): string {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type PhmaxPvLitePageProps = {
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  onOpenFullVersion: () => void;
};

export function PhmaxPvLitePage({ productView, setProductView, onOpenFullVersion }: PhmaxPvLitePageProps) {
  const [provoz, setProvoz] = useState<PvProvozKind>(() => readPvLiteSnapshot().provoz);
  const [classCount, setClassCount] = useState(() => readPvLiteSnapshot().classCount);
  const [avgHours, setAvgHours] = useState(() => readPvLiteSnapshot().avgHours);
  const [soleMsInMunicipality, setSoleMsInMunicipality] = useState(
    () => readPvLiteSnapshot().soleMsInMunicipality,
  );
  const [actualChildren, setActualChildren] = useState(() => readPvLiteSnapshot().actualChildren);
  const [sec16ClassCount, setSec16ClassCount] = useState(() => readPvLiteSnapshot().sec16ClassCount);

  const avgMeta = useMemo(() => pvAvgHoursField(provoz), [provoz]);

  const minimumChildrenPreview = useMemo(
    () =>
      classCount >= 1
        ? getPvSec2MinimumChildrenTotal({ soleMsInMunicipality, classCount })
        : null,
    [soleMsInMunicipality, classCount],
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        PV_LITE_LS_KEY,
        JSON.stringify({
          provoz,
          classCount,
          avgHours,
          soleMsInMunicipality,
          actualChildren,
          sec16ClassCount,
        } satisfies PvLiteSnapshot),
      );
    } catch {
      /* ignore */
    }
  }, [provoz, classCount, avgHours, soleMsInMunicipality, actualChildren, sec16ClassCount]);

  const result = useMemo(
    () =>
      computePvLitePhmax({
        provoz,
        classCount,
        avgHours,
        soleMsInMunicipality,
        actualChildren,
        sec16ClassCount,
      }),
    [provoz, classCount, avgHours, soleMsInMunicipality, actualChildren, sec16ClassCount],
  );

  const openFull = useCallback(() => {
    if (classCount >= 1) {
      writePvLiteHandoffToFullStorage({
        provoz,
        classCount,
        avgHours,
        soleMsInMunicipality,
        actualChildren,
        sec16ClassCount,
      });
    }
    onOpenFullVersion();
    writePvFullUrl("push");
  }, [
    onOpenFullVersion,
    provoz,
    classCount,
    avgHours,
    soleMsInMunicipality,
    actualChildren,
    sec16ClassCount,
  ]);

  return (
    <div className="phmax-lite-page phmax-lite-page--pv">
      <header className="hero hero--feature phmax-lite-hero">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />
        <div className="hero__pills-row">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          <button type="button" className="btn ghost phmax-lite-hero__full-link" onClick={openFull}>
            Plná verze metodiky
          </button>
        </div>
        <div className="hero__grid dash-hero-brand">
          <HeroBrandLogoButton productView={productView} setProductView={setProductView} />
          <div className="dash-hero-brand__copy">
            <p className="hero-zone-label">Rychlý výpočet</p>
            <h1 className="hero__title">Rychlý PHmax – předškolní vzdělávání</h1>
            <p className="hero__text hero__text--compact">
              Pro jedno pracoviště MŠ – rychlý výpočet z tabulek včetně bonusu § 16/9 a orientačního krácení § 1d/3.{" "}
              {CALCULATOR_LIMITS_NOTE}
            </p>
          </div>
        </div>
      </header>

      <main className="phmax-lite-main" id="phmax-pv-lite-main" tabIndex={-1}>
        <section className="card section-card phmax-lite-form" aria-labelledby="pv-lite-form-heading">
          <h2 id="pv-lite-form-heading" className="section-title">
            Vstupy
          </h2>
          <p className="muted-text phmax-lite-form__lead">
            Zadejte druh provozu, počet tříd a průměrnou denní dobu provozu pracoviště. Aplikace zařadí hodnotu do příslušného
            pásma tabulky metodiky (tab. 1–3).
          </p>
          <label className="field phmax-lite-form__field">
            <span className="field__label">Druh provozu pracoviště</span>
            <select
              className="input"
              value={provoz}
              onChange={(e) => {
                const next = e.target.value as PvProvozKind;
                setProvoz(next);
                if (next === "zdravotnicke") setAvgHours(0);
              }}
            >
              {PV_PROVOZ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field phmax-lite-form__field">
            <span className="field__label">Počet tříd pracoviště</span>
            <IntegerInput className="input" min={0} value={classCount} onChange={setClassCount} />
          </label>
          {provoz !== "zdravotnicke" ? (
            <label className="field phmax-lite-form__field">
              <span className="field__label">Průměrná doba provozu pracoviště v hodinách za den</span>
              <NumericInput
                className="input"
                min={avgMeta.min}
                max={avgMeta.max}
                step={avgMeta.step}
                value={avgHours}
                onChange={setAvgHours}
              />
              <span className="muted-text" style={{ fontSize: "0.86rem", marginTop: 6, display: "block" }}>
                {avgMeta.hint}
              </span>
            </label>
          ) : null}
          <label className="field phmax-lite-form__field">
            <span className="field__label">Počet tříd dle § 16 odst. 9 (+5 h PHmax / třídu)</span>
            <IntegerInput className="input" min={0} value={sec16ClassCount} onChange={setSec16ClassCount} />
            <span className="muted-text" style={{ fontSize: "0.86rem", marginTop: 6, display: "block" }}>
              Volitelné. Nechte 0, pokud žádná třída není zřízena podle § 16 odst. 9 školského zákona.
            </span>
          </label>

          <div className="phmax-lite-form__subsection" aria-labelledby="pv-lite-sec2-heading">
            <h3 id="pv-lite-sec2-heading" className="phmax-lite-form__subtitle">
              Počty dětí a krácení § 1d odst. 3
            </h3>
            <p className="muted-text phmax-lite-form__lead" style={{ marginTop: 0 }}>
              Zaškrtněte, pokud je v obci jen tato mateřská škola – mění se nejnižší počet dětí dle § 2 vyhl. 14/2005 Sb.
              Po doplnění skutečného počtu dětí aplikace orientačně krátí PHmax.
            </p>
            <label className="field phmax-lite-form__check phmax-lite-form__check--prominent">
              <input
                type="checkbox"
                checked={soleMsInMunicipality}
                onChange={(e) => setSoleMsInMunicipality(e.target.checked)}
              />
              <span>
                <strong>Jediná mateřská škola v obci</strong> (§ 2 odst. 2 vyhl. 14/2005 Sb.)
              </span>
            </label>
            <label className="field phmax-lite-form__field">
              <span className="field__label">Počet dětí na pracovišti</span>
              <IntegerInput className="input" min={0} value={actualChildren} onChange={setActualChildren} />
              {minimumChildrenPreview != null ? (
                <span className="muted-text" style={{ fontSize: "0.86rem", marginTop: 6, display: "block" }}>
                  Nejnižší počet dětí dle § 2{soleMsInMunicipality ? " odst. 2 (jediná MŠ v obci)" : ""}:{" "}
                  <strong>{minimumChildrenPreview.toLocaleString("cs-CZ")}</strong>
                  {soleMsInMunicipality && classCount === 1 ? " (místo obecných 15)" : null}
                </span>
              ) : (
                <span className="muted-text" style={{ fontSize: "0.86rem", marginTop: 6, display: "block" }}>
                  Nejdřív zadejte počet tříd – pak se zobrazí příslušné minimum dle § 2.
                </span>
              )}
            </label>
          </div>
          <LiteToFullHint module="pv" onOpenFull={openFull} />
        </section>

        <section className="card section-card phmax-lite-result" aria-labelledby="pv-lite-result-heading">
          <h2 id="pv-lite-result-heading" className="section-title">
            Výsledek
          </h2>
          {!result.ok ? (
            <p className="muted-text" role="status">
              {result.message}
            </p>
          ) : (
            <>
              <div className="phmax-lite-result__hero" role="status">
                <span className="phmax-lite-result__label">PHmax celkem</span>
                <strong className="phmax-lite-result__value">
                  {formatPvLiteHours(result.phmaxHours)} {CS_HOURS_PER_WEEK_SHORT}
                </strong>
                <span className="muted-text phmax-lite-result__meta">
                  {result.classCount} {result.classCount === 1 ? "třída" : result.classCount < 5 ? "třídy" : "tříd"}
                  {result.provoz !== "zdravotnicke"
                    ? ` · ${result.avgHours.toLocaleString("cs-CZ")} h/den`
                    : ""}
                </span>
              </div>
              {result.reduction1d3?.status === "reduced" ? (
                <p className="phmax-lite-result__warn">
                  Aplikováno orientační krácení § 1d odst. 3 ({result.actualChildren} /{" "}
                  {result.minimumChildren?.toLocaleString("cs-CZ")} dětí). Závazný výsledek může určit jen krajský úřad
                  – v plné verzi doplníte číslo jednací rozhodnutí KÚ.
                </p>
              ) : null}
              {result.sec16Bonus > 0 ? (
                <p className="muted-text phmax-lite-result__meta" style={{ marginBottom: 8 }}>
                  Včetně bonusu § 16 odst. 9: +{result.sec16Bonus.toLocaleString("cs-CZ")} h
                </p>
              ) : null}
              {result.tableWarning ? <p className="phmax-lite-result__warn">{result.tableWarning}</p> : null}
              <div className="phmax-lite-narrative">
                <p>{result.narrative.p1}</p>
                <p>{result.narrative.p2}</p>
              </div>
              <p className="muted-text" style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>
                {result.narrative.disclaimer}
              </p>
            </>
          )}
        </section>

        <div className="phmax-lite-actions">
          <button type="button" className="btn primary" onClick={openFull}>
            Otevřít plnou verzi (přenese vstupy, PHAmax, export)
          </button>
        </div>
      </main>

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
