import React, { useMemo, useState } from "react";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NumberField, ResultCard } from "./phmax-zs-ui";
import {
  SD_MAX_DEPARTMENTS_IN_TABLE,
  getPhmaxSdBase,
  reducedPhmaxIfUnderStaffed,
  suggestedDepartmentsFromPupils,
} from "./phmax-sd-logic";

type PhmaxSdPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

export function PhmaxSdPage({ productView, setProductView }: PhmaxSdPageProps) {
  const [pupils, setPupils] = useState(0);
  const [manualDepts, setManualDepts] = useState(false);
  const [departments, setDepartments] = useState(1);

  const suggested = useMemo(() => suggestedDepartmentsFromPupils(pupils), [pupils]);
  const effectiveDepts = manualDepts ? departments : suggested;

  const basePhmax = useMemo(() => getPhmaxSdBase(effectiveDepts), [effectiveDepts]);
  const reduction = useMemo(() => {
    if (basePhmax == null) return { adjusted: 0, factor: 1, applied: false };
    return reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: pupils,
      departmentCount: effectiveDepts,
      basePhmax,
    });
  }, [basePhmax, pupils, effectiveDepts]);

  const avgPerDept = effectiveDepts > 0 && pupils > 0 ? Math.round((pupils / effectiveDepts) * 100) / 100 : 0;

  const tableWarning =
    effectiveDepts > SD_MAX_DEPARTMENTS_IN_TABLE
      ? `Tabulka PHmax v této aplikaci končí ${SD_MAX_DEPARTMENTS_IN_TABLE} odděleními — u vyššího počtu použijte přílohu vyhlášky.`
      : null;

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <ProductViewPills productView={productView} setProductView={setProductView} />

        <h1 className="hero__title hero__title--sd">PHmax ve školní družině</h1>
        <p className="hero__text hero__text--sd">
          Orientační výpočet podle{" "}
          <strong>vyhlášky č. 74/2005 Sb., o zájmovém vzdělávání</strong> (zejména § 10 a{" "}
          <strong>přílohy s tabulkou</strong> týdenního nejvyššího rozsahu přímé pedagogické činnosti / PHmax podle
          počtu oddělení) a metodických pokynů MŠMT. U „speciálních“ oddělení dle § 16 školského zákona a u méně než
          čtyř oddělení platí další pravidla — vždy vycházejte z úplného znění vyhlášky a metodiky.
        </p>
      </header>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy</h2>
        <p className="section-lead muted-text">
          Počet účastníků = žáci 1. stupně ZŠ přihlášení k pravidelné denní docházce (pro krácení PHmax dle § 10 odst. 2).
          Počet oddělení pro nové oddělení nad první: průměr nad 27 účastníků → dělení počtem 27 a zaokrouhlení nahoru
          (u výjimek viz metodiku).
        </p>

        <div className="grid two">
          <div className="subcard">
            <h3>Účastníci</h3>
            <NumberField
              label="Počet přihlášených účastníků (žáci 1. st. ZŠ, pravidelná docházka)"
              value={pupils}
              onChange={setPupils}
            />
            <p className="muted-text" style={{ marginTop: 12, fontSize: "0.88rem" }}>
              Navržený počet oddělení (÷ 27, nahoru): <strong>{suggested}</strong>
              {pupils > 0 ? ` → průměr při ${suggested} odd.: ${(pupils / suggested).toFixed(2)} účastníků` : null}
            </p>
          </div>

          <div className="subcard">
            <h3>Oddělení</h3>
            <label className="checks" style={{ marginTop: 0 }}>
              <span>
                <input
                  type="checkbox"
                  checked={manualDepts}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setManualDepts(on);
                    if (on) setDepartments(Math.max(1, suggested));
                  }}
                />
                Zadat počet oddělení ručně (např. dle součtu řádků 0101 ve výkazu Z 2-01)
              </span>
            </label>
            {manualDepts ? (
              <NumberField label="Celkový počet oddělení školní družiny" value={departments} onChange={setDepartments} />
            ) : null}
          </div>
        </div>

        <div className="grid two section-results" style={{ marginTop: 18 }}>
          {basePhmax != null ? (
            <>
              <ResultCard
                label="Počet oddělení pro výpočet"
                value={effectiveDepts}
                tone="primary"
              />
              <ResultCard
                label="Průměr účastníků na oddělení"
                value={avgPerDept}
                tone="primary"
              />
              <ResultCard label="PHmax (základ z tabulky)" value={basePhmax} tone="success" />
              {reduction.applied ? (
                <ResultCard
                  label={`PHmax po krácení (koef. ${reduction.factor.toFixed(4)})`}
                  value={reduction.adjusted}
                  tone="success"
                />
              ) : (
                <ResultCard
                  label="PHmax po krácení"
                  value="neaplikuje se (průměr ≥ 20 na oddělení nebo nejsou údaje)"
                  tone="primary"
                />
              )}
            </>
          ) : (
            <p className="muted-text">Zadejte platný počet oddělení (1–{SD_MAX_DEPARTMENTS_IN_TABLE}).</p>
          )}
        </div>

        {tableWarning ? <p className="card card--warning" style={{ marginTop: 16, padding: 14 }}>{tableWarning}</p> : null}

        <p className="muted-text" style={{ marginTop: 20 }}>
          <strong>Právní podklad:</strong>{" "}
          <a
            href="https://www.zakonyprolidi.cz/cs/2005-74"
            target="_blank"
            rel="noopener noreferrer"
            className="status-link"
          >
            Vyhláška č. 74/2005 Sb., o zájmovém vzdělávání
          </a>{" "}
          (v platném znění; čísla PHmax v kalkulačce odpovídají tabulce v příloze této vyhlášky). Doplňující výklad
          poskytuje metodika MŠMT k PHmax školních družin. Aplikace nenahrazuje úřední výpočet ani výkazy (např. Z
          2-01); u složitých případů (§ 16, méně než čtyři oddělení, výjimky zřizovatele) použijte úplné znění předpisů.
        </p>
      </section>
    </>
  );
}
