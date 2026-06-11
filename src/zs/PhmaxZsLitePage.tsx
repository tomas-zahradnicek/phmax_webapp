import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HeroBrandLogoButton } from "../AppBrandLogo";
import { AuthorCreditFooter } from "../AuthorCreditFooter";
import { CALCULATOR_LIMITS_NOTE } from "../calculator-ui-constants";
import { LiteToFullHint } from "../LiteToFullHint";
import { IntegerInput } from "../IntegerInput";
import { ProductViewPills, type ProductView } from "../ProductViewPills";
import { writeZsLiteHandoffToFullStorage } from "../phmax-lite-handoff";
import { writeZsFullUrl } from "../phmax-lite-paths";
import { CS_HOURS_PER_WEEK_SHORT } from "../cs-format";
import type { BasicType } from "../phmax-zs-logic";
import { computeZsLitePhmax } from "./phmax-zs-lite-logic";

const ZS_LITE_LS_KEY = "phmax-zs-lite-v2";

const BASIC_TYPE_OPTIONS: ReadonlyArray<{ value: BasicType; label: string; firstOnly: boolean }> = [
  { value: "full_more_than_2", label: "Úplná ZŠ – více než 2 třídy v některém ročníku", firstOnly: false },
  { value: "full_max_2", label: "Úplná ZŠ – nejvýše 2 třídy v každém ročníku", firstOnly: false },
  { value: "first_only_1", label: "Neúplná ZŠ – 1 třída 1. stupně", firstOnly: true },
  { value: "first_only_2", label: "Neúplná ZŠ – 2 třídy 1. stupně", firstOnly: true },
  { value: "first_only_3", label: "Neúplná ZŠ – 3 třídy 1. stupně", firstOnly: true },
  { value: "first_only_4", label: "Neúplná ZŠ – 4 a více tříd 1. stupně", firstOnly: true },
];

type ZsLiteSnapshot = {
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  hasSec16: boolean;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
};

function isBasicType(v: unknown): v is BasicType {
  return BASIC_TYPE_OPTIONS.some((o) => o.value === v);
}

function readZsLiteSnapshot(): ZsLiteSnapshot {
  try {
    const raw = localStorage.getItem(ZS_LITE_LS_KEY);
    if (!raw) {
      return {
        basicType: "full_more_than_2",
        basic1Classes: 0,
        basic1Pupils: 0,
        basic2Classes: 0,
        basic2Pupils: 0,
        hasSec16: false,
        incl1Classes: 0,
        incl1Pupils: 0,
        incl2Classes: 0,
        incl2Pupils: 0,
      };
    }
    const p = JSON.parse(raw) as Partial<ZsLiteSnapshot>;
    return {
      basicType: isBasicType(p.basicType) ? p.basicType : "full_more_than_2",
      basic1Classes: typeof p.basic1Classes === "number" && p.basic1Classes >= 0 ? Math.floor(p.basic1Classes) : 0,
      basic1Pupils: typeof p.basic1Pupils === "number" && p.basic1Pupils >= 0 ? Math.floor(p.basic1Pupils) : 0,
      basic2Classes: typeof p.basic2Classes === "number" && p.basic2Classes >= 0 ? Math.floor(p.basic2Classes) : 0,
      basic2Pupils: typeof p.basic2Pupils === "number" && p.basic2Pupils >= 0 ? Math.floor(p.basic2Pupils) : 0,
      hasSec16: Boolean(p.hasSec16),
      incl1Classes: typeof p.incl1Classes === "number" && p.incl1Classes >= 0 ? Math.floor(p.incl1Classes) : 0,
      incl1Pupils: typeof p.incl1Pupils === "number" && p.incl1Pupils >= 0 ? Math.floor(p.incl1Pupils) : 0,
      incl2Classes: typeof p.incl2Classes === "number" && p.incl2Classes >= 0 ? Math.floor(p.incl2Classes) : 0,
      incl2Pupils: typeof p.incl2Pupils === "number" && p.incl2Pupils >= 0 ? Math.floor(p.incl2Pupils) : 0,
    };
  } catch {
    return {
      basicType: "full_more_than_2",
      basic1Classes: 0,
      basic1Pupils: 0,
      basic2Classes: 0,
      basic2Pupils: 0,
      hasSec16: false,
      incl1Classes: 0,
      incl1Pupils: 0,
      incl2Classes: 0,
      incl2Pupils: 0,
    };
  }
}

function formatZsLiteHours(value: number): string {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isFullSchoolType(basicType: BasicType): boolean {
  return basicType === "full_more_than_2" || basicType === "full_max_2";
}

function defaultFirstStageClasses(basicType: BasicType): number {
  if (basicType === "first_only_1") return 1;
  if (basicType === "first_only_2") return 2;
  if (basicType === "first_only_3") return 3;
  if (basicType === "first_only_4") return 4;
  return 0;
}

export type PhmaxZsLitePageProps = {
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  onOpenFullVersion: () => void;
};

export function PhmaxZsLitePage({ productView, setProductView, onOpenFullVersion }: PhmaxZsLitePageProps) {
  const [basicType, setBasicType] = useState<BasicType>(() => readZsLiteSnapshot().basicType);
  const [basic1Classes, setBasic1Classes] = useState(() => readZsLiteSnapshot().basic1Classes);
  const [basic1Pupils, setBasic1Pupils] = useState(() => readZsLiteSnapshot().basic1Pupils);
  const [basic2Classes, setBasic2Classes] = useState(() => readZsLiteSnapshot().basic2Classes);
  const [basic2Pupils, setBasic2Pupils] = useState(() => readZsLiteSnapshot().basic2Pupils);
  const [hasSec16, setHasSec16] = useState(() => readZsLiteSnapshot().hasSec16);
  const [incl1Classes, setIncl1Classes] = useState(() => readZsLiteSnapshot().incl1Classes);
  const [incl1Pupils, setIncl1Pupils] = useState(() => readZsLiteSnapshot().incl1Pupils);
  const [incl2Classes, setIncl2Classes] = useState(() => readZsLiteSnapshot().incl2Classes);
  const [incl2Pupils, setIncl2Pupils] = useState(() => readZsLiteSnapshot().incl2Pupils);
  const [firstOnlyMode, setFirstOnlyMode] = useState(() => {
    const t = readZsLiteSnapshot().basicType;
    return t.startsWith("first_only_");
  });

  const isFull = isFullSchoolType(basicType);

  useEffect(() => {
    try {
      localStorage.setItem(
        ZS_LITE_LS_KEY,
        JSON.stringify({
          basicType,
          basic1Classes,
          basic1Pupils,
          basic2Classes,
          basic2Pupils,
          hasSec16,
          incl1Classes,
          incl1Pupils,
          incl2Classes,
          incl2Pupils,
        } satisfies ZsLiteSnapshot),
      );
    } catch {
      /* ignore */
    }
  }, [
    basicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes,
    basic2Pupils,
    hasSec16,
    incl1Classes,
    incl1Pupils,
    incl2Classes,
    incl2Pupils,
  ]);

  const handleBasicTypeChange = useCallback((next: BasicType) => {
    setBasicType(next);
    const def = defaultFirstStageClasses(next);
    if (def > 0) {
      setBasic1Classes(def);
    }
  }, []);

  const handleFirstOnlyModeChange = useCallback(
    (checked: boolean) => {
      setFirstOnlyMode(checked);
      if (checked) {
        handleBasicTypeChange("first_only_1");
      } else {
        handleBasicTypeChange("full_more_than_2");
      }
    },
    [handleBasicTypeChange],
  );

  const result = useMemo(
    () =>
      computeZsLitePhmax({
        basicType,
        basic1Classes,
        basic1Pupils,
        basic2Classes,
        basic2Pupils,
        incl1Classes: hasSec16 ? incl1Classes : 0,
        incl1Pupils: hasSec16 ? incl1Pupils : 0,
        incl2Classes: hasSec16 && isFull ? incl2Classes : 0,
        incl2Pupils: hasSec16 && isFull ? incl2Pupils : 0,
      }),
    [
      basicType,
      basic1Classes,
      basic1Pupils,
      basic2Classes,
      basic2Pupils,
      hasSec16,
      incl1Classes,
      incl1Pupils,
      incl2Classes,
      incl2Pupils,
      isFull,
    ],
  );

  const openFull = useCallback(() => {
    if (basic1Classes >= 1 && basic1Pupils >= 1 && (!isFull || (basic2Classes >= 1 && basic2Pupils >= 1))) {
      writeZsLiteHandoffToFullStorage({
        basicType,
        basic1Classes,
        basic1Pupils,
        basic2Classes,
        basic2Pupils,
        incl1Classes: hasSec16 ? incl1Classes : 0,
        incl1Pupils: hasSec16 ? incl1Pupils : 0,
        incl2Classes: hasSec16 && isFull ? incl2Classes : 0,
        incl2Pupils: hasSec16 && isFull ? incl2Pupils : 0,
      });
    }
    onOpenFullVersion();
    writeZsFullUrl("push");
  }, [
    onOpenFullVersion,
    basicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes,
    basic2Pupils,
    hasSec16,
    incl1Classes,
    incl1Pupils,
    incl2Classes,
    incl2Pupils,
    isFull,
  ]);

  const visibleBasicOptions = useMemo(
    () => BASIC_TYPE_OPTIONS.filter((o) => o.firstOnly === firstOnlyMode),
    [firstOnlyMode],
  );

  return (
    <div className="phmax-lite-page phmax-lite-page--zs">
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
            <h1 className="hero__title">Rychlý PHmax – základní škola</h1>
            <p className="hero__text hero__text--compact">
              Pro běžné třídy ZŠ (B1–B8) a volitelně třídy zřízené podle § 16 odst. 9 (B9–B10). Bez školy při
              psychiatrické nemocnici, gymnázia, PHAmax a PHPmax. {CALCULATOR_LIMITS_NOTE}
            </p>
          </div>
        </div>
      </header>

      <main className="phmax-lite-main" id="phmax-zs-lite-main" tabIndex={-1}>
        <section className="card section-card phmax-lite-form" aria-labelledby="zs-lite-form-heading">
          <h2 id="zs-lite-form-heading" className="section-title">
            Vstupy
          </h2>
          <p className="muted-text phmax-lite-form__lead">
            Zadejte typ školy a počty tříd s žáky. Aplikace dopočítá průměr na třídu a zařadí hodnotu do příslušného pásma
            tabulky metodiky.
          </p>
          <label className="field phmax-lite-form__check">
            <input
              type="checkbox"
              checked={firstOnlyMode}
              onChange={(e) => handleFirstOnlyModeChange(e.target.checked)}
            />
            <span>Neúplná ZŠ (pouze 1. stupeň)</span>
          </label>
          <label className="field phmax-lite-form__field">
            <span className="field__label">Typ školy</span>
            <select
              className="input"
              value={basicType}
              onChange={(e) => handleBasicTypeChange(e.target.value as BasicType)}
            >
              {visibleBasicOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid two">
            <label className="field phmax-lite-form__field">
              <span className="field__label">1. stupeň – počet tříd</span>
              <IntegerInput className="input" min={0} value={basic1Classes} onChange={setBasic1Classes} />
            </label>
            <label className="field phmax-lite-form__field">
              <span className="field__label">1. stupeň – počet žáků</span>
              <IntegerInput className="input" min={0} value={basic1Pupils} onChange={setBasic1Pupils} />
            </label>
          </div>
          {basic1Classes > 0 && basic1Pupils > 0 ? (
            <p className="muted-text">
              Průměr na třídu (1. stupeň):{" "}
              <strong>
                {(basic1Pupils / basic1Classes).toLocaleString("cs-CZ", { maximumFractionDigits: 2 })}
              </strong>
            </p>
          ) : null}
          {isFull ? (
            <div className="grid two" style={{ marginTop: 12 }}>
              <label className="field phmax-lite-form__field">
                <span className="field__label">2. stupeň – počet tříd</span>
                <IntegerInput className="input" min={0} value={basic2Classes} onChange={setBasic2Classes} />
              </label>
              <label className="field phmax-lite-form__field">
                <span className="field__label">2. stupeň – počet žáků</span>
                <IntegerInput className="input" min={0} value={basic2Pupils} onChange={setBasic2Pupils} />
              </label>
            </div>
          ) : null}
          {isFull && basic2Classes > 0 && basic2Pupils > 0 ? (
            <p className="muted-text">
              Průměr na třídu (2. stupeň):{" "}
              <strong>
                {(basic2Pupils / basic2Classes).toLocaleString("cs-CZ", { maximumFractionDigits: 2 })}
              </strong>
            </p>
          ) : null}
          <label className="field phmax-lite-form__check phmax-lite-form__check--prominent" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={hasSec16}
              onChange={(e) => setHasSec16(e.target.checked)}
            />
            <span>Máme třídy zřízené podle § 16 odst. 9 (tabulky B9–B10)</span>
          </label>
          {hasSec16 ? (
            <>
              <p className="muted-text phmax-lite-form__note">
                Počty tříd a žáků v třídách podle § 16 odst. 9 – odděleně od běžných tříd výše.
              </p>
              <div className="grid two">
                <label className="field phmax-lite-form__field">
                  <span className="field__label">§ 16/9 – 1. stupeň, počet tříd</span>
                  <IntegerInput className="input" min={0} value={incl1Classes} onChange={setIncl1Classes} />
                </label>
                <label className="field phmax-lite-form__field">
                  <span className="field__label">§ 16/9 – 1. stupeň, počet žáků</span>
                  <IntegerInput className="input" min={0} value={incl1Pupils} onChange={setIncl1Pupils} />
                </label>
              </div>
              {isFull ? (
                <div className="grid two" style={{ marginTop: 8 }}>
                  <label className="field phmax-lite-form__field">
                    <span className="field__label">§ 16/9 – 2. stupeň, počet tříd</span>
                    <IntegerInput className="input" min={0} value={incl2Classes} onChange={setIncl2Classes} />
                  </label>
                  <label className="field phmax-lite-form__field">
                    <span className="field__label">§ 16/9 – 2. stupeň, počet žáků</span>
                    <IntegerInput className="input" min={0} value={incl2Pupils} onChange={setIncl2Pupils} />
                  </label>
                </div>
              ) : null}
            </>
          ) : null}
          <LiteToFullHint module="zs" onOpenFull={openFull} />
        </section>

        <section className="card section-card phmax-lite-result" aria-labelledby="zs-lite-result-heading">
          <h2 id="zs-lite-result-heading" className="section-title">
            Výsledek
          </h2>
          {!result.ok ? (
            <p className="muted-text">{result.message}</p>
          ) : (
            <>
              <p className="phmax-lite-result__total">
                PHmax celkem:{" "}
                <strong>
                  {formatZsLiteHours(result.phmaxHours)} {CS_HOURS_PER_WEEK_SHORT}
                </strong>
              </p>
              <p className="phmax-lite-narrative">{result.summaryText}</p>
              <dl className="phmax-lite-staffing">
                <div>
                  <dt>Běžné – 1. stupeň</dt>
                  <dd>
                    {result.firstBandLabel} ({result.firstBandValue} h/třída) →{" "}
                    {formatZsLiteHours(result.firstStagePhmax)} {CS_HOURS_PER_WEEK_SHORT}
                  </dd>
                </div>
                {result.secondBandLabel != null && result.secondBandValue != null ? (
                  <div>
                    <dt>Běžné – 2. stupeň</dt>
                    <dd>
                      {result.secondBandLabel} ({result.secondBandValue} h/třída) →{" "}
                      {formatZsLiteHours(result.secondStagePhmax)} {CS_HOURS_PER_WEEK_SHORT}
                    </dd>
                  </div>
                ) : null}
                {result.sec16FirstPhmax > 0 ? (
                  <div>
                    <dt>§ 16/9 – 1. stupeň</dt>
                    <dd>
                      {formatZsLiteHours(result.sec16FirstPhmax)} {CS_HOURS_PER_WEEK_SHORT}
                    </dd>
                  </div>
                ) : null}
                {result.sec16SecondPhmax > 0 ? (
                  <div>
                    <dt>§ 16/9 – 2. stupeň</dt>
                    <dd>
                      {formatZsLiteHours(result.sec16SecondPhmax)} {CS_HOURS_PER_WEEK_SHORT}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </>
          )}
          <button type="button" className="btn primary phmax-lite-result__full-btn" onClick={openFull}>
            Otevřít plnou verzi (přenese vstupy, PHAmax, PHPmax, export)
          </button>
        </section>
      </main>

      <AuthorCreditFooter />
    </div>
  );
}
