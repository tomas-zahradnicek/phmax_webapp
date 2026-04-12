import React, { useMemo, useState } from "react";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NumberField, ResultCard } from "./phmax-zs-ui";
import {
  computePvPhmaxTotal,
  getPhaMaxPv,
  type PvProvozKind,
} from "./phmax-pv-logic";

type PhmaxPvPageProps = {
  productView: ProductView;
  setProductView: (v: ProductView) => void;
};

const PROVOZ_OPTIONS: { value: PvProvozKind; label: string }[] = [
  { value: "polodenni", label: "Polodenní provoz (tabulka 1)" },
  { value: "celodenni", label: "Celodenní provoz (tabulka 2)" },
  { value: "internat", label: "Internátní provoz (tabulka 3)" },
  { value: "zdravotnicke", label: "Mateřská škola při zdravotnickém zařízení (S 4-01)" },
];

export function PhmaxPvPage({ productView, setProductView }: PhmaxPvPageProps) {
  const [provoz, setProvoz] = useState<PvProvozKind>("celodenni");
  const [classCount, setClassCount] = useState(4);
  const [avgHours, setAvgHours] = useState(10);
  const [sec16Count, setSec16Count] = useState(0);
  const [languageGroups, setLanguageGroups] = useState(0);

  const computed = useMemo(
    () =>
      computePvPhmaxTotal({
        provoz,
        classCount,
        avgHoursPerDay: avgHours,
        sec16ClassCount: sec16Count,
        languageGroupCount: languageGroups,
      }),
    [provoz, classCount, avgHours, sec16Count, languageGroups]
  );

  const phaMax = useMemo(() => {
    if (sec16Count <= 0) return null;
    return getPhaMaxPv(sec16Count, avgHours);
  }, [sec16Count, avgHours]);

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <ProductViewPills productView={productView} setProductView={setProductView} />

        <h1 className="hero__title hero__title--sd">PHmax a PHAmax – předškolní vzdělávání</h1>
        <p className="hero__text hero__text--sd">
          Orientační výpočet pro <strong>jedno pracoviště</strong> mateřské školy podle metodiky stanovení PHmax a
          PHAmax pro předškolní vzdělávání (verze 4, 2026) a{" "}
          <strong>vyhlášky č. 14/2005 Sb.</strong> Celková PHmax právnické osoby = součet přes pracoviště a druhy
          provozu. Údaje vycházejí z matrice M 1 (dříve S 1-01); u MŠ při zdravotnickém zařízení z výkazu S 4-01.
        </p>
      </header>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy (jedno pracoviště)</h2>

        <div className="grid two">
          <div className="subcard">
            <h3>Druh provozu</h3>
            <label className="field">
              <span>Typ</span>
              <select value={provoz} onChange={(e) => setProvoz(e.target.value as PvProvozKind)}>
                {PROVOZ_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Počet tříd (včetně běžných i speciálních v daném druhu provozu)"
              value={classCount}
              onChange={setClassCount}
              min={1}
              max={30}
            />
            {provoz !== "zdravotnicke" ? (
              <NumberField
                label="Průměrná denní doba provozu pracoviště (hodiny)"
                value={avgHours}
                onChange={setAvgHours}
                min={0}
                max={24}
                step={0.25}
                hint="Zaokrouhlit na desetinná místa podle reality; tabulka rozpozná pásmo."
              />
            ) : (
              <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
                U MŠ při zdravotnickém zařízení je PHmax <strong>31 hodin/třídu</strong> týdně — délka provozu se do
                této tabulky nezadává.
              </p>
            )}
          </div>

          <div className="subcard">
            <h3>Navýšení dle vyhlášky</h3>
            <NumberField
              label="Počet tříd (škol) zřízených podle § 16 odst. 9 školského zákona (+5 h PHmax / třídu)"
              value={sec16Count}
              onChange={setSec16Count}
              min={0}
              max={30}
            />
            <NumberField
              label="Počet skupin pro jazykovou přípravu (+1 h PHmax / skupinu, § 1d odst. 11)"
              value={languageGroups}
              onChange={setLanguageGroups}
              min={0}
              max={50}
            />
          </div>
        </div>

        {computed.issues.map((issue, i) => (
          <p key={`${issue.code}-${i}`} className="card card--warning" style={{ marginTop: 14, padding: 12 }}>
            {issue.message}
          </p>
        ))}

        <div className="grid two section-results" style={{ marginTop: 18 }}>
          {computed.base ? (
            <>
              <ResultCard label="PHmax ze základní tabulky" value={computed.base.basePhmax} tone="success" />
              <ResultCard label="Pásmo doby provozu" value={computed.base.durationColumnLabel} tone="primary" />
              <ResultCard label="Příplatek § 16 odst. 9 (5 h × třídy)" value={computed.sec16Bonus} tone="primary" />
              <ResultCard
                label="Příplatek jazyková příprava (1 h × skupiny)"
                value={computed.languageBonus}
                tone="primary"
              />
              {computed.totalPhmax != null ? (
                <ResultCard label="PHmax celkem (tomuto pracovišti)" value={computed.totalPhmax} tone="success" />
              ) : null}
            </>
          ) : (
            !computed.issues.length && (
              <p className="muted-text">Upravte vstupy pro výpočet základního PHmax.</p>
            )
          )}
        </div>

        {phaMax != null ? (
          <div className="grid two section-results" style={{ marginTop: 12 }}>
            <ResultCard
              label="PHAmax (asistenti pedagoga, § 16 třídy, toto pracoviště)"
              value={phaMax}
              tone="success"
              hint="Při provozu kratším než 8 h/den se krátí poměrem doba/8 (metodika v4)."
            />
          </div>
        ) : null}

        <p className="muted-text" style={{ marginTop: 22 }}>
          <strong>Právní podklad:</strong>{" "}
          <a
            href="https://www.zakonyprolidi.cz/cs/2005-14"
            target="_blank"
            rel="noopener noreferrer"
            className="status-link"
          >
            Vyhláška č. 14/2005 Sb., o předškolním vzdělávání
          </a>
          . <strong>Metodika:</strong>{" "}
          <a
            href="https://edu.gov.cz/methodology/metodika-stanoveni-phmax-a-phamax-pro-predskolni-vzdelavani/"
            target="_blank"
            rel="noopener noreferrer"
            className="status-link"
          >
            MŠMT – PHmax a PHAmax pro PV
          </a>
          . Krácení PHmax při výjimkách z nejnižšího počtu dětí (§ 1d odst. 3) v aplikaci neřešíme — nutno dopočítat
          dle vyhlášky.
        </p>
      </section>
    </>
  );
}
