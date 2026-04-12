import React, { useCallback, useMemo, useState } from "react";
import { exportCsvLocalized, downloadTextFile, exportFilenameStamped } from "./export-utils";
import { MethodologyStrip } from "./MethodologyStrip";
import { ProductFloatingNav } from "./ProductFloatingNav";
import { QuickOnboarding } from "./QuickOnboarding";
import { ProductViewPills, type ProductView } from "./ProductViewPills";
import { NumberField } from "./phmax-zs-ui";
import { buildPhmaxPvExportRows } from "./phmax-pv-export-rows";
import {
  computePvPhmaxTotal,
  getPhaMaxPv,
  getPvDurationBandLabel,
  getPvMaxClassCount,
  PV_CELODENNI_BAND_OPTIONS,
  PV_INTERNAT_BAND_OPTIONS,
  PV_POLODENNI_BAND_OPTIONS,
  representativeHoursForPvBand,
  type PvProvozKind,
} from "./phmax-pv-logic";

function pvDurationBandTableNo(provoz: PvProvozKind): string {
  if (provoz === "polodenni") return "1";
  if (provoz === "celodenni") return "2";
  if (provoz === "internat") return "3";
  return "";
}

function pvBandSelectOptions(provoz: PvProvozKind): { value: number; label: string }[] {
  const arr =
    provoz === "polodenni"
      ? PV_POLODENNI_BAND_OPTIONS
      : provoz === "celodenni"
        ? PV_CELODENNI_BAND_OPTIONS
        : provoz === "internat"
          ? PV_INTERNAT_BAND_OPTIONS
          : [];
  return arr.map((label, value) => ({ value, label }));
}

function defaultDurationBandIndex(provoz: PvProvozKind): number {
  if (provoz === "celodenni") return 7;
  return 0;
}

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
  const [durationBandIndex, setDurationBandIndex] = useState(() => defaultDurationBandIndex("celodenni"));
  const [sec16Count, setSec16Count] = useState(0);
  const [languageGroups, setLanguageGroups] = useState(0);
  const [xlsxExportBusy, setXlsxExportBusy] = useState(false);

  const maxClasses = getPvMaxClassCount(provoz);
  const durationBandLabel = getPvDurationBandLabel(provoz, durationBandIndex);
  const hoursForPha = representativeHoursForPvBand(provoz, durationBandIndex);

  const computed = useMemo(
    () =>
      computePvPhmaxTotal({
        provoz,
        classCount,
        durationBandIndex,
        sec16ClassCount: sec16Count,
        languageGroupCount: languageGroups,
      }),
    [provoz, classCount, durationBandIndex, sec16Count, languageGroups]
  );

  const phaMax = useMemo(() => {
    if (sec16Count <= 0) return null;
    return getPhaMaxPv(sec16Count, hoursForPha);
  }, [sec16Count, hoursForPha]);

  const provozLabel = useMemo(() => PROVOZ_OPTIONS.find((o) => o.value === provoz)?.label ?? provoz, [provoz]);

  const exportRows = useMemo(
    () =>
      buildPhmaxPvExportRows({
        provozLabel,
        provoz,
        classCount,
        durationBandLabel: provoz === "zdravotnicke" ? "" : durationBandLabel,
        sec16Count,
        languageGroups,
        computed,
        phaMax,
      }),
    [provozLabel, classCount, durationBandLabel, provoz, sec16Count, languageGroups, computed, phaMax]
  );

  const handleExportCsv = useCallback(() => {
    downloadTextFile(exportFilenameStamped("phmax-pv", "csv"), exportCsvLocalized(exportRows), "text/csv;charset=utf-8");
  }, [exportRows]);

  const handleExportXlsx = useCallback(async () => {
    if (xlsxExportBusy) return;
    setXlsxExportBusy(true);
    try {
      const { downloadCalculatorXlsx } = await import("./export-xlsx");
      await downloadCalculatorXlsx({
        contextRows: [
          ["Aplikace", "PHmax / PHAmax předškolní vzdělávání"],
          ["Čas exportu", new Date().toLocaleString("cs-CZ")],
        ],
        valueRows: exportRows,
        filename: exportFilenameStamped("phmax-pv", "xlsx"),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setXlsxExportBusy(false);
    }
  }, [exportRows, xlsxExportBusy]);

  return (
    <>
      <header className="hero hero--feature">
        <div className="hero__orb hero__orb--one" />
        <div className="hero__orb hero__orb--two" />

        <ProductViewPills productView={productView} setProductView={setProductView} />

        <h1 className="hero__title hero__title--sd">PHmax a PHAmax – předškolní vzdělávání</h1>
        <p className="hero__text hero__text--sd">
          Orientační výpočet pro <strong>jedno pracoviště</strong> mateřské školy a <strong>jeden druh provozu</strong>{" "}
          (řádek výpočtu dle metodiky) podle metodiky PHmax a PHAmax pro předškolní vzdělávání (verze 4, 2026) a{" "}
          <strong>vyhlášky č. 14/2005 Sb.</strong> U MŠ s <strong>odloučenými pracovišti</strong> nebo s více druhy
          provozu na různých místech platí: PHmax se stanoví zvlášť pro každé pracoviště a příslušný druh provozu,
          celkové PHmax právnické osoby je <strong>součet</strong> těchto dílčích výpočtů — ten součet si zde musíte
          vést ručně (každý průchod kalkulačkou = jeden řádek jako v tabulkové pomůcce MŠMT). Údaje vycházejí z matrice
          M 1 (dříve S 1-01); u MŠ při zdravotnickém zařízení z výkazu S 4-01.
        </p>
      </header>

      <QuickOnboarding storageKey="phmax-pv-onboarding" title="Jedno pracoviště MŠ">
        <p>
          Jeden průchod formulářem = jeden řádek podle metodiky: vybraný <strong>druh provozu</strong>, počet tříd v něm
          a <strong>pásmo průměrné denní doby provozu</strong> (sloupec tabulky 1–3 z přílohy). Máte-li{" "}
          <strong>odloučená pracoviště</strong> nebo na jednom místě
          současně např. celodenní i polodenní provoz, každou kombinaci zadejte zvlášť a dílčí PHmax sečtěte (jako
          součet řádků „Pracoviště 1 / 2 …“ v metodické tabulce). Krácení PHmax dle § 1d odst. 3 vyhl. 14/2005 zde
          neřešíme.
        </p>
      </QuickOnboarding>

      <section className="card section-card section-card--sd">
        <h2 className="section-title">Vstupy (jedno pracoviště)</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <button type="button" className="btn ghost" onClick={handleExportCsv}>
            CSV
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={xlsxExportBusy}
            aria-busy={xlsxExportBusy}
            onClick={() => void handleExportXlsx()}
          >
            {xlsxExportBusy ? "Připravuji Excel…" : "Stáhnout Excel"}
          </button>
        </div>

        <div className="card muted pv-workplaces-note" style={{ marginBottom: 18, padding: "14px 16px" }}>
          <p className="muted-text" style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.55 }}>
            <strong>Rozsah výpočtu:</strong> aplikace neobsahuje mřížku „všechna pracoviště najednou“ — odpovídá jedné
            buňce výpočtu z metodiky (jedno pracoviště + jeden typ provozu). Postup při více pracovištích odpovídá
            vyhlášce a metodice MŠMT: opakovaný výpočet a součet; náš přehled tabulkou níže to jen zpřehledňuje.
          </p>
        </div>

        <div className="grid two">
          <div className="subcard">
            <h3>Druh provozu</h3>
            <label className="field">
              <span>Typ</span>
              <select
                value={provoz}
                onChange={(e) => {
                  const next = e.target.value as PvProvozKind;
                  setProvoz(next);
                  setDurationBandIndex(defaultDurationBandIndex(next));
                  setClassCount((c) => Math.min(Math.max(1, c), getPvMaxClassCount(next)));
                }}
              >
                {PROVOZ_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label={`Počet tříd pracoviště MŠ v tomto druhu provozu (1–${maxClasses} dle přílohy)`}
              value={classCount}
              onChange={setClassCount}
              min={1}
              max={maxClasses}
            />
            {provoz !== "zdravotnicke" ? (
              <label className="field">
                <span>
                  Průměrná doba provozu pracoviště v hodinách za den — sloupec tabulky {pvDurationBandTableNo(provoz)}{" "}
                  přílohy metodiky
                </span>
                <select
                  value={durationBandIndex}
                  onChange={(e) => setDurationBandIndex(Number(e.target.value))}
                  aria-label="Pásmo průměrné doby provozu podle přílohy"
                >
                  {pvBandSelectOptions(provoz).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="muted-text" style={{ marginTop: 8, fontSize: "0.88rem" }}>
                U MŠ při zdravotnickém zařízení je PHmax <strong>31 hodin/třídu</strong> týdně — tabulky 1–3 se
                nepoužívají.
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

        <div className="app-table-wrap" role="region" aria-label="Přehled zadaných vstupů">
          <table className="app-data-table">
            <caption className="app-data-table__caption">Vstupy — jeden řádek výpočtu (jedno pracoviště, jeden druh provozu)</caption>
            <thead>
              <tr>
                <th scope="col">Položka</th>
                <th scope="col">Hodnota</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Druh provozu</td>
                <td>{provozLabel}</td>
              </tr>
              <tr>
                <td>Počet tříd v tomto druhu provozu</td>
                <td className="app-data-table__num">{classCount}</td>
              </tr>
              <tr>
                <td>Pásmo průměrné doby provozu (sloupec přílohy)</td>
                <td>
                  {provoz === "zdravotnicke" ? (
                    <span className="muted-text">— (31 h/třídu, bez výběru pásma)</span>
                  ) : (
                    durationBandLabel
                  )}
                </td>
              </tr>
              <tr>
                <td>Třídy zřízené podle § 16 odst. 9 školského zákona (+5 h PHmax / třídu)</td>
                <td className="app-data-table__num">{sec16Count}</td>
              </tr>
              <tr>
                <td>Skupiny jazykové přípravy (+1 h PHmax / skupinu, § 1d odst. 11 vyhl. 14/2005)</td>
                <td className="app-data-table__num">{languageGroups}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {computed.issues.map((issue, i) => (
          <p key={`${issue.code}-${i}`} className="card card--warning" style={{ marginTop: 14, padding: 12 }}>
            {issue.message}
          </p>
        ))}

        {computed.base ? (
          <div className="app-table-wrap app-table-wrap--spaced" role="region" aria-label="Výsledek výpočtu PHmax">
            <table className="app-data-table app-data-table--results">
              <caption className="app-data-table__caption">
                Výpočet PHmax pro tento řádek — toto pracoviště a tento druh provozu (hodiny týdně)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Složka</th>
                  <th scope="col">Hodnota</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PHmax ze základní tabulky metodiky (příslušná tabulka 1–3 / MŠ u zdrav. zařízení)</td>
                  <td className="app-data-table__num">{computed.base.basePhmax}</td>
                </tr>
                <tr>
                  <td>Pásmo / sloupec průměrné denní doby provozu</td>
                  <td>{computed.base.durationColumnLabel}</td>
                </tr>
                <tr>
                  <td>Navýšení § 16 odst. 9 školského zákona (5 h × počet tříd)</td>
                  <td className="app-data-table__num">{computed.sec16Bonus}</td>
                </tr>
                <tr>
                  <td>Navýšení jazyková příprava (1 h × počet skupin)</td>
                  <td className="app-data-table__num">{computed.languageBonus}</td>
                </tr>
              </tbody>
              {computed.totalPhmax != null ? (
                <tfoot>
                  <tr className="app-data-table__total-row">
                    <th scope="row">PHmax celkem (tomuto pracovišti, tento druh provozu)</th>
                    <td className="app-data-table__num app-data-table__num--emph">{computed.totalPhmax}</td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        ) : (
          !computed.issues.length && <p className="muted-text section-results">Upravte vstupy pro výpočet základního PHmax.</p>
        )}

        {phaMax != null ? (
          <div className="app-table-wrap app-table-wrap--spaced" role="region" aria-label="Výpočet PHAmax">
            <table className="app-data-table app-data-table--pha">
              <caption className="app-data-table__caption">PHAmax — asistenti pedagoga (§ 16 třídy, toto pracoviště)</caption>
              <thead>
                <tr>
                  <th scope="col">Položka</th>
                  <th scope="col">Hodnota (h/týden)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    PHAmax dle metodiky v4
                    <span className="app-data-table__hint">
                      Pro krácení se použije střed zvoleného pásma doby ({hoursForPha.toLocaleString("cs-CZ")} h/den);
                      při provozu pod 8 h/den poměrem doba/8 (metodika v4).
                    </span>
                  </td>
                  <td className="app-data-table__num app-data-table__num--emph">{phaMax}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        <p className="muted-text" style={{ marginTop: 22 }}>
          Krácení PHmax při výjimkách z nejnižšího počtu dětí (§ 1d odst. 3) v aplikaci neřešíme — nutno dopočítat dle
          vyhlášky. Odkazy na předpisy a metodiku jsou v přehledu níže.
        </p>
      </section>

      <MethodologyStrip />
      <ProductFloatingNav active={productView} setProductView={setProductView} />
    </>
  );
}
