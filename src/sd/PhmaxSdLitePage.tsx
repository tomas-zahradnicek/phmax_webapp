import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HeroBrandLogoButton } from "../AppBrandLogo";
import { AuthorCreditFooter } from "../AuthorCreditFooter";
import { CALCULATOR_LIMITS_NOTE } from "../calculator-ui-constants";
import { LiteToFullHint } from "../LiteToFullHint";
import { IntegerInput } from "../IntegerInput";
import { ProductViewPills, type ProductView } from "../ProductViewPills";
import { writeSdLiteHandoffToFullStorage } from "../phmax-lite-handoff";
import { writeSdFullUrl } from "../phmax-lite-paths";
import { CS_HOURS_PER_WEEK_SHORT } from "../cs-format";
import { buildSdLiteStaffingPlainText } from "../phmax-sd-narrative";
import { computeSdLitePhmax, type SdLiteSchoolFirstStageClassCount } from "./phmax-sd-lite-logic";
import { suggestedDepartmentsFromPupils } from "../phmax-sd-logic";

const SD_LITE_LS_KEY = "phmax-sd-lite-v2";

type SdLiteSnapshot = {
  pupils: number;
  manualDepartments: boolean;
  departments: number;
  schoolFirstStageClassCount: SdLiteSchoolFirstStageClassCount;
};

function readSdLiteSnapshot(): SdLiteSnapshot {
  try {
    const raw = localStorage.getItem(SD_LITE_LS_KEY);
    if (!raw) {
      return { pupils: 0, manualDepartments: false, departments: 0, schoolFirstStageClassCount: null };
    }
    const p = JSON.parse(raw) as Partial<SdLiteSnapshot>;
    const classCount = p.schoolFirstStageClassCount;
    return {
      pupils: typeof p.pupils === "number" && p.pupils >= 0 ? Math.floor(p.pupils) : 0,
      manualDepartments: Boolean(p.manualDepartments),
      departments: typeof p.departments === "number" && p.departments >= 0 ? Math.floor(p.departments) : 0,
      schoolFirstStageClassCount:
        classCount === 1 || classCount === 2 || classCount === 3 ? classCount : null,
    };
  } catch {
    return { pupils: 0, manualDepartments: false, departments: 0, schoolFirstStageClassCount: null };
  }
}

function formatSdLiteHours(value: number): string {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type PhmaxSdLitePageProps = {
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  onOpenFullVersion: () => void;
};

export function PhmaxSdLitePage({ productView, setProductView, onOpenFullVersion }: PhmaxSdLitePageProps) {
  const [pupils, setPupils] = useState(() => readSdLiteSnapshot().pupils);
  const [manualDepartments, setManualDepartments] = useState(() => readSdLiteSnapshot().manualDepartments);
  const [departments, setDepartments] = useState(() => readSdLiteSnapshot().departments);
  const [schoolFirstStageClassCount, setSchoolFirstStageClassCount] = useState<SdLiteSchoolFirstStageClassCount>(
    () => readSdLiteSnapshot().schoolFirstStageClassCount,
  );

  const effectiveDepartmentsPreview = useMemo(() => {
    if (pupils <= 0) return 0;
    if (manualDepartments && departments > 0) return Math.floor(departments);
    return suggestedDepartmentsFromPupils(pupils);
  }, [pupils, manualDepartments, departments]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SD_LITE_LS_KEY,
        JSON.stringify({ pupils, manualDepartments, departments, schoolFirstStageClassCount } satisfies SdLiteSnapshot),
      );
    } catch {
      /* ignore */
    }
  }, [pupils, manualDepartments, departments, schoolFirstStageClassCount]);

  const result = useMemo(
    () =>
      computeSdLitePhmax({
        pupils,
        manualDepartments,
        departments,
        schoolFirstStageClassCount,
      }),
    [pupils, manualDepartments, departments, schoolFirstStageClassCount],
  );

  const avgPerDeptPreview = useMemo(() => {
    if (pupils <= 0 || effectiveDepartmentsPreview <= 0) return null;
    return pupils / effectiveDepartmentsPreview;
  }, [pupils, effectiveDepartmentsPreview]);

  const staffingPlainText = useMemo(
    () => (result.ok ? buildSdLiteStaffingPlainText(result.staffing) : null),
    [result],
  );

  const openFull = useCallback(() => {
    if (pupils > 0) {
      writeSdLiteHandoffToFullStorage({
        pupils,
        manualDepartments,
        departments,
        schoolFirstStageClassCount,
      });
    }
    onOpenFullVersion();
    writeSdFullUrl("push");
  }, [onOpenFullVersion, pupils, manualDepartments, departments, schoolFirstStageClassCount]);

  return (
    <div className="phmax-lite-page phmax-lite-page--sd">
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
            <h1 className="hero__title">Rychlý PHmax – školní družina</h1>
            <p className="hero__text hero__text--compact">
              Pro běžnou školní družinu bez speciálních oddělení a bez složitého nastavení. {CALCULATOR_LIMITS_NOTE}
            </p>
          </div>
        </div>
      </header>

      <main className="phmax-lite-main" id="phmax-sd-lite-main" tabIndex={-1}>
        <section className="card section-card phmax-lite-form" aria-labelledby="sd-lite-form-heading">
          <h2 id="sd-lite-form-heading" className="section-title">
            Vstupy
          </h2>
          <p className="muted-text phmax-lite-form__lead">
            Zadejte počet přihlášených účastníků (žáci 1. stupně ZŠ s pravidelnou docházkou). Počet oddělení se dopočítá
            dělením 27 (nahoru), pokud ho nezadáte ručně.
          </p>
          <label className="field phmax-lite-form__field">
            <span className="field__label">Počet přihlášených účastníků</span>
            <IntegerInput className="input" min={0} value={pupils} onChange={setPupils} />
          </label>
          <label className="field phmax-lite-form__check">
            <input
              type="checkbox"
              checked={manualDepartments}
              onChange={(e) => setManualDepartments(e.target.checked)}
            />
            <span>Zadat počet oddělení ručně</span>
          </label>
          {manualDepartments ? (
            <label className="field phmax-lite-form__field">
              <span className="field__label">Počet běžných oddělení školní družiny</span>
              <IntegerInput className="input" min={1} value={departments || 1} onChange={setDepartments} />
            </label>
          ) : result.ok ? (
            <p className="muted-text">
              Navržený počet oddělení (÷ 27): <strong>{result.suggestedDepartments}</strong>
            </p>
          ) : pupils > 0 ? (
            <p className="muted-text">
              Navržený počet oddělení (÷ 27):{" "}
              <strong>{Math.ceil(pupils / 27)}</strong>
            </p>
          ) : null}
          {avgPerDeptPreview != null ? (
            <p className="muted-text phmax-lite-form__note" style={{ marginTop: 8 }}>
              Průměr na oddělení: <strong>{avgPerDeptPreview.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })}</strong>
              {avgPerDeptPreview < 20
                ? " – v rychlém režimu se automaticky posoudí orientační krácení § 10 odst. 2 (bez checkboxu z plné verze)."
                : " – krácení § 10 odst. 2 se v rychlém režimu neuplatní."}
            </p>
          ) : null}
          {effectiveDepartmentsPreview === 1 ? (
            <label className="field phmax-lite-form__field">
              <span className="field__label">
                Pokud má ŠD 1 běžné oddělení: škola má kolik tříd 1. stupně?
              </span>
              <select
                className="input"
                value={schoolFirstStageClassCount == null ? "" : String(schoolFirstStageClassCount)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSchoolFirstStageClassCount(v === "1" ? 1 : v === "2" ? 2 : v === "3" ? 3 : null);
                }}
              >
                <option value="">Nepoužít zvláštní minimum (obecně 20)</option>
                <option value="1">Škola s 1 třídou 1. stupně (minimum 5)</option>
                <option value="2">Škola se 2 třídami 1. stupně (minimum 15)</option>
                <option value="3">Škola se 3 třídami 1. stupně (minimum 18)</option>
              </select>
              <span className="muted-text" style={{ fontSize: "0.86rem", marginTop: 6, display: "block" }}>
                Platí jen při 1 oddělení. Mění minimum účastníků při automatickém krácení § 10 odst. 2 (viz průměr výše).
              </span>
            </label>
          ) : null}
          <LiteToFullHint module="sd" onOpenFull={openFull} />
        </section>

        <section className="card section-card phmax-lite-result" aria-labelledby="sd-lite-result-heading">
          <h2 id="sd-lite-result-heading" className="section-title">
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
                  {formatSdLiteHours(result.phmaxHours)} {CS_HOURS_PER_WEEK_SHORT}
                </strong>
                <span className="muted-text phmax-lite-result__meta">
                  {result.effectiveDepartments} oddělení · {result.pupils.toLocaleString("cs-CZ")} účastníků
                </span>
              </div>
              {result.reductionApplied ? (
                <p className="phmax-lite-result__warn">
                  Aplikováno orientační krácení dle § 10 odst. 2 (průměr pod 20 účastníky na oddělení), koeficient{" "}
                  {result.reductionFactor.toLocaleString("cs-CZ", { maximumFractionDigits: 4 })}.
                </p>
              ) : null}
              {result.tableWarning ? <p className="phmax-lite-result__warn">{result.tableWarning}</p> : null}
              <div className="sd-lay-narrative phmax-lite-narrative">
                <p>{result.narrative.p1}</p>
                <p>{result.narrative.p2}</p>
              </div>
              {staffingPlainText ? (
                <p className="phmax-lite-narrative" style={{ marginBottom: 12 }}>
                  <strong>Úvazky (orientačně):</strong> {staffingPlainText}
                </p>
              ) : null}
              {!result.staffing.inconsistent ? (
                <dl className="phmax-lite-staffing">
                  <div>
                    <dt>Vedoucí vychovatel (orientačně)</dt>
                    <dd>{formatSdLiteHours(result.staffing.headVedouciHours)} h</dd>
                  </div>
                  <div>
                    <dt>Plné úvazky ostatních (28 h)</dt>
                    <dd>{result.staffing.fullTimeSlots}×</dd>
                  </div>
                  <div>
                    <dt>Zkrácený úvazek (dopočet)</dt>
                    <dd>{formatSdLiteHours(result.staffing.partialHours)} h</dd>
                  </div>
                </dl>
              ) : null}
              <p className="muted-text" style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>
                {result.narrative.disclaimer}
              </p>
            </>
          )}
        </section>

        <div className="phmax-lite-actions">
          <button type="button" className="btn primary" onClick={openFull}>
            Otevřít plnou verzi (přenese vstupy, export, detail)
          </button>
        </div>
      </main>

      <footer className="zs-app-footer">
        <AuthorCreditFooter />
      </footer>
    </div>
  );
}
