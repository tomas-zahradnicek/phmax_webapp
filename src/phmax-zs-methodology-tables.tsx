import React from "react";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import type { Band } from "./phmax-zs-logic";
import {
  B11_B13,
  B13_MORE_THAN_2,
  B22_B25,
  B29_PREP_CLASS,
  B30_PREP_SPECIAL,
  B34_MAX_2,
  B5,
  B6,
  B7,
  B8,
  B9_B10,
  B14_B16,
  B17_B21,
  B26_B28,
  PHA_TABLE,
  PHP_TABLE,
} from "./phmax-zs-logic";

type RefRow = { id: string; code: string; desc: string; bands: readonly Band[] };

export type PhmaxZsMethodologyHighlights = {
  /** Řádek Bx → aktivní popisek sloupce (stejný text jako u `pickBand` v aplikaci). */
  activeColumnByRowId?: Partial<Record<string, string>>;
  /** Skupiny ZŠSp ve výpočtu (alespoň jedna třída) — zvýrazní řádek kombinační tabulky. */
  zsspCombo?: { i1: boolean; i2: boolean; ii: boolean } | null;
  prepClassLabel?: string;
  prepSpecialLabel?: string;
  par38?: { first?: boolean; second?: boolean };
  par41?: { first?: boolean; second?: boolean };
  /** Sloupec B46; `null` = nezvýrazňovat (např. vyloučená škola). */
  phpBandLabel?: string | null;
};

const ACTIVE = "sd-phmax-breakdown__cell--pv-active";

function cellClass(active: boolean, base = "sd-phmax-breakdown__num") {
  return base + (active ? ` ${ACTIVE}` : "");
}

function ZsRefBandTable({
  title,
  intro,
  rows,
  activeColumnByRowId,
}: {
  title: string;
  intro?: string;
  rows: RefRow[];
  activeColumnByRowId?: Partial<Record<string, string>>;
}) {
  if (rows.length === 0) return null;
  const colLabels = rows[0].bands.map((b) => b.label);
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px", lineHeight: 1.35 }}>
        {title}
      </h4>
      {intro ? (
        <p className="muted-text" style={{ margin: "0 0 10px", fontSize: "0.82rem", lineHeight: 1.45 }}>
          {intro}
        </p>
      ) : null}
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead>
            <tr>
              <th scope="col">Řádek</th>
              <th scope="col">Kód</th>
              <th scope="col">Popis</th>
              {colLabels.map((lab) => (
                <th key={lab} scope="col" className="sd-phmax-breakdown__head-num" title={lab}>
                  {lab}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">
                  <span className="zs-methodology-ref__bid">{r.id}</span>
                </th>
                <td style={{ whiteSpace: "nowrap" }}>{r.code}</td>
                <td>{r.desc}</td>
                {r.bands.map((b) => {
                  const on = activeColumnByRowId?.[r.id] === b.label;
                  return (
                    <td key={`${r.id}-${b.label}`} className={cellClass(on)} title={b.label}>
                      {b.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

function ZsTwoColPhTable({
  title,
  rowId,
  label,
  headerLeft,
  bands,
  activeLabel,
}: {
  title: string;
  rowId: string;
  label: string;
  headerLeft: string;
  bands: readonly Band[];
  activeLabel?: string;
}) {
  const cols = bands.map((b) => b.label);
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 8px", lineHeight: 1.35 }}>
        {title}
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead>
            <tr>
              <th scope="col" className="zs-methodology-ref__head-accent">
                {headerLeft}
              </th>
              {cols.map((c) => (
                <th key={c} scope="col" className="sd-phmax-breakdown__head-num">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <span className="zs-methodology-ref__bid">{rowId}</span> {label}
              </th>
              {bands.map((b) => (
                <td key={b.label} className={cellClass(activeLabel === b.label)}>
                  {b.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

function ZsParLawMiniTable({
  title,
  categoryHeader,
  rows,
  activeFirst,
  activeSecond,
}: {
  title: string;
  categoryHeader: string;
  rows: { id: string; desc: string; value: string }[];
  activeFirst?: boolean;
  activeSecond?: boolean;
}) {
  const act = [activeFirst, activeSecond];
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 8px", lineHeight: 1.35 }}>
        {title}
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead>
            <tr>
              <th scope="col" className="zs-methodology-ref__head-accent">
                {categoryHeader}
              </th>
              <th scope="col" className="sd-phmax-breakdown__head-num">
                PHmax
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <th scope="row">
                  <span className="zs-methodology-ref__bid">{r.id}</span> {r.desc}
                </th>
                <td className={cellClass(!!act[i])}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

function ZsPhpB46Table({ activeLabel }: { activeLabel?: string | null }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 8px", lineHeight: 1.35 }}>
        26) Maximální počet hodin přímé pedagogické činnosti psychologa, speciálního pedagoga nebo sociálního pedagoga
        (PHPmax) — řádek B46
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead>
            <tr>
              <th scope="col">Průměrný počet žáků ve škole</th>
              {PHP_TABLE.map((b) => (
                <th key={b.label} scope="col" className="sd-phmax-breakdown__head-num" title={b.label}>
                  {b.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <span className="zs-methodology-ref__bid">B46</span> PHPmax
              </th>
              {PHP_TABLE.map((b) => (
                <td key={b.label} className={cellClass(activeLabel != null && activeLabel === b.label)}>
                  {b.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

const PHA_ORDER: { key: keyof typeof PHA_TABLE; id: string; code: string; desc: string }[] = [
  {
    key: "zs1",
    id: "B35",
    code: "79-01-C/01",
    desc: "Základní škola (1. stupeň)",
  },
  {
    key: "zs1Heavy",
    id: "B36",
    code: "79-01-C/01",
    desc: "Základní škola (1. stupeň) zřízená pro žáky s tělesným postižením, závažnými vývojovými poruchami chování, souběžným postižením více vadami nebo autismem",
  },
  {
    key: "zs2",
    id: "B37",
    code: "79-01-C/01",
    desc: "Základní škola (2. stupeň)",
  },
  {
    key: "zs2Heavy",
    id: "B38",
    code: "79-01-C/01",
    desc: "Základní škola (2. stupeň) zřízená pro žáky s tělesným postižením, závažnými vývojovými poruchami chování, souběžným postižením více vadami nebo autismem",
  },
  {
    key: "zss1",
    id: "B39",
    code: "79-01-B/01",
    desc: "Základní škola speciální (I. díl, 1. stupeň)",
  },
  {
    key: "zss1Heavy",
    id: "B40",
    code: "79-01-B/01",
    desc: "Základní škola speciální (I. díl, 1. stupeň) v případě vzdělávání žáků se závažnými vývojovými poruchami chování, tělesným postižením, souběžným postižením více vadami nebo autismem",
  },
  {
    key: "zss2",
    id: "B41",
    code: "79-01-B/01",
    desc: "Základní škola speciální (I. díl, 2. stupeň)",
  },
  {
    key: "zss2Heavy",
    id: "B42",
    code: "79-01-B/01",
    desc: "Základní škola speciální (I. díl, 2. stupeň) v případě vzdělávání žáků se závažnými vývojovými poruchami chování, tělesným postižením, souběžným postižením více vadami nebo autismem",
  },
  {
    key: "zssII",
    id: "B43",
    code: "79-01-B/01",
    desc: "Základní škola speciální (II. díl)",
  },
  {
    key: "zssIIHeavy",
    id: "B44",
    code: "79-01-B/01",
    desc: "Základní škola speciální (II. díl) v případě vzdělávání žáků se závažnými vývojovými poruchami chování, tělesným postižením, souběžným postižením více vadami nebo autismem",
  },
  {
    key: "zssPrep",
    id: "B45",
    code: "—",
    desc: "Třídy přípravného stupně základní školy speciální",
  },
];

function ZsPhaAnnexBlock({ activeColumnByRowId }: { activeColumnByRowId?: Partial<Record<string, string>> }) {
  const b35_b38: RefRow[] = PHA_ORDER.slice(0, 4).map((m) => ({
    id: m.id,
    code: m.code,
    desc: m.desc,
    bands: PHA_TABLE[m.key],
  }));
  const b39_b45: RefRow[] = PHA_ORDER.slice(4).map((m) => ({
    id: m.id,
    code: m.code,
    desc: m.desc,
    bands: PHA_TABLE[m.key],
  }));
  return (
    <>
      <ZsRefBandTable
        title="24) Základní škola zřízená podle § 16 odst. 9 školského zákona — PHAmax (B35–B38)"
        rows={b35_b38}
        activeColumnByRowId={activeColumnByRowId}
      />
      <ZsRefBandTable
        title="25) Základní škola speciální — PHAmax (B39–B44) a přípravný stupeň ZŠ speciální (B45)"
        intro="Poznámky 1–2 k většině žáků s těžšími diagnózami platí dle metodiky u řádků B40 a B44."
        rows={b39_b45}
        activeColumnByRowId={activeColumnByRowId}
      />
    </>
  );
}

/** Přehled kombinací ZŠSp — řádky B26–B28 (metodika). */
function ZsSpecialCombinationTable({ combo }: { combo?: { i1: boolean; i2: boolean; ii: boolean } | null }) {
  const rows = [
    { i1: "ano", i2: "ne", ii: "ne", use: "ZŠSp I. díl, 1. st.", row: "B26" as const },
    { i1: "ne", i2: "ano", ii: "ne", use: "ZŠSp I. díl, 2. st.", row: "B27" as const },
    { i1: "ne", i2: "ne", ii: "ano", use: "ZŠSp II. díl", row: "B28" as const },
    { i1: "ano", i2: "ano", ii: "ne", use: "ZŠSp I. díl, 2. st.", row: "B27" as const },
    { i1: "ano", i2: "ne", ii: "ano", use: "ZŠSp I. díl, 1. st.", row: "B26" as const },
    { i1: "ne", i2: "ano", ii: "ano", use: "ZŠSp I. díl, 2. st.", row: "B27" as const },
    { i1: "ano", i2: "ano", ii: "ano", use: "ZŠSp I. díl, 2. st.", row: "B27" as const },
  ];

  return (
    <div style={{ marginBottom: 22 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 8px", lineHeight: 1.35 }}>
        20) Přehled možných kombinací společné výuky žáků ZŠ speciální ve třídě (určení PHmax z řádku B26–B28)
      </h4>
      <p className="muted-text" style={{ margin: "0 0 10px", fontSize: "0.8rem", lineHeight: 1.45 }}>
        Sloupce I. díl / II. díl odpovídají skupinám, u kterých máte v kalkulačce zadané třídy (počet &gt; 0). Žlutě jsou
        vyznačena „ano“; zeleně buňka odpovídající vašemu stavu a cílovému řádku B26–B28.
      </p>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead>
            <tr>
              <th scope="col">I. díl, 1. st.</th>
              <th scope="col">I. díl, 2. st.</th>
              <th scope="col">II. díl</th>
              <th scope="col">Použije se PHmax pro</th>
              <th scope="col">PHmax z řádku</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rowMatch =
                target != null &&
                combo != null &&
                r.i1 === (combo.i1 ? "ano" : "ne") &&
                r.i2 === (combo.i2 ? "ano" : "ne") &&
                r.ii === (combo.ii ? "ano" : "ne");
              const rowCls = rowMatch ? "zs-methodology-ref__row--combo-match" : "";
              return (
                <tr key={i} className={rowCls}>
                  <td className={r.i1 === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.i1}</td>
                  <td className={r.i2 === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.i2}</td>
                  <td className={r.ii === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.ii}</td>
                  <td>{r.use}</td>
                  <th scope="row" className={cellClass(!!rowMatch, "sd-phmax-breakdown__num")}>
                    <span className="zs-methodology-ref__bid">{r.row}</span>
                  </th>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

/**
 * Referenční tabulky řádků B1–B46 podle metodiky ZV — při vyplnění kalkulačky se zvýrazní odpovídající buňky (jako u ŠD).
 */
export function PhmaxZsMethodologyReferenceTables({ highlights }: { highlights?: PhmaxZsMethodologyHighlights }) {
  const h = highlights ?? {};
  const ac = h.activeColumnByRowId;

  const b1b2: RefRow[] = [
    { id: "B1", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B13_MORE_THAN_2.first },
    { id: "B2", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B13_MORE_THAN_2.second },
  ];
  const b3b4: RefRow[] = [
    { id: "B3", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B34_MAX_2.first },
    { id: "B4", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B34_MAX_2.second },
  ];

  const gymRows: RefRow[] = [
    { id: "B22", code: "79-41-K/61", desc: "Gymnázium šestileté", bands: B22_B25.gym6 },
    { id: "B23", code: "79-41-K/81", desc: "Gymnázium osmileté", bands: B22_B25.gym8 },
    { id: "B24", code: "79-42-K/81", desc: "Gymnázium se sportovní přípravou (osmileté)", bands: B22_B25.sport8 },
    { id: "B25", code: "79-42-K/61", desc: "Gymnázium se sportovní přípravou (šestileté)", bands: B22_B25.sport6 },
  ];

  return (
    <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 18 }}>
      <summary className="section-title" style={{ fontSize: "1.02rem", cursor: "pointer" }}>
        Referenční tabulky metodiky PHmax / PHAmax / PHPmax (řádky B1–B46)
      </summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 14, fontSize: "0.86rem", lineHeight: 1.5 }}>
        Tabulky odpovídají kódům v <code className="methodology-strip__code">phmax-zs-logic.ts</code>. Po zadání údajů v
        kalkulačce se zvýrazní sloupce a řádky odpovídající vypočteným pásmům (stejná logika jako u přehledu ŠD).
      </p>

      <ZsRefBandTable title="4) ZŠ s 1. a 2. stupněm — více než 2 třídy v některém ročníku (B1, B2)" rows={b1b2} activeColumnByRowId={ac} />
      <ZsRefBandTable title="5) ZŠ s 1. a 2. stupněm — nejvýše 2 třídy v každém ročníku (B3, B4)" rows={b3b4} activeColumnByRowId={ac} />
      <ZsRefBandTable
        title="6) ZŠ tvořená 1 třídou 1. stupně (B5)"
        rows={[{ id: "B5", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B5 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="7) ZŠ tvořená 2 třídami 1. stupně (B6)"
        rows={[{ id: "B6", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B6 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="8) ZŠ tvořená 3 třídami 1. stupně (B7)"
        rows={[{ id: "B7", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B7 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="9) ZŠ tvořená 4 a více třídami 1. stupně (B8)"
        rows={[{ id: "B8", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B8 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="10) ZŠ zřízená podle § 16 odst. 9 školského zákona (B9, B10)"
        rows={[
          { id: "B9", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B9_B10.first },
          { id: "B10", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B9_B10.second },
        ]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="11) ZŠ při zdravotnickém zařízení mimo psychiatrickou nemocnici (B11–B13)"
        rows={[
          { id: "B11", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B11_B13.health1 },
          { id: "B12", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B11_B13.health2 },
          { id: "B13", code: "79-01-C/01", desc: "Základní škola (1. a 2. stupeň)", bands: B11_B13.healthMix },
        ]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="12) ZŠ při psychiatrické nemocnici (B14–B16)"
        rows={[
          { id: "B14", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B14_B16.psych1 },
          { id: "B15", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B14_B16.psych2 },
          { id: "B16", code: "79-01-C/01", desc: "Základní škola (1. a 2. stupeň)", bands: B14_B16.psychMix },
        ]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="13) ZŠ s jazykem národnostní menšiny — 1 třída 1. stupně (B17)"
        rows={[{ id: "B17", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minority1 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="14) ZŠ s jazykem národnostní menšiny — 2 třídy 1. stupně (B18)"
        rows={[{ id: "B18", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minority2 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="15) ZŠ s jazykem národnostní menšiny — 3 a více tříd 1. stupně (B19)"
        rows={[{ id: "B19", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minority3 }]}
        activeColumnByRowId={ac}
      />
      <ZsRefBandTable
        title="16) ZŠ s jazykem národnostní menšiny — 1. a 2. stupeň (B20, B21)"
        rows={[
          { id: "B20", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minorityFull1 },
          { id: "B21", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B17_B21.minorityFull2 },
        ]}
        activeColumnByRowId={ac}
      />

      <ZsRefBandTable
        title="17) Gymnázia — nižší stupeň / sportovní příprava (B22–B25)"
        rows={gymRows}
        activeColumnByRowId={ac}
      />

      <ZsRefBandTable
        title="18) Základní škola speciální — PHmax podle průměru ve třídě (B26–B28)"
        rows={[
          { id: "B26", code: "79-01-B/01", desc: "Základní škola speciální (I. díl, první stupeň)", bands: B26_B28.special1 },
          { id: "B27", code: "79-01-B/01", desc: "Základní škola speciální (I. díl, druhý stupeň)", bands: B26_B28.special2 },
          { id: "B28", code: "79-01-B/01", desc: "Základní škola speciální (II. díl)", bands: B26_B28.specialII },
        ]}
        activeColumnByRowId={ac}
      />

      <ZsSpecialCombinationTable combo={h.zsspCombo} />

      <ZsTwoColPhTable
        title="21) Přípravná třída základní školy (B29)"
        rowId="B29"
        label="PHmax"
        headerLeft="Přípravná třída základní školy"
        bands={B29_PREP_CLASS}
        activeLabel={h.prepClassLabel}
      />
      <ZsTwoColPhTable
        title="21) Třídy přípravného stupně základní školy speciální (B30)"
        rowId="B30"
        label="PHmax"
        headerLeft="Třídy přípravného stupně základní školy speciální"
        bands={B30_PREP_SPECIAL}
        activeLabel={h.prepSpecialLabel}
      />

      <ZsParLawMiniTable
        title="22) Žák vzdělávaný podle § 38 školského zákona"
        categoryHeader="Žák vzdělávaný podle § 38 školského zákona"
        rows={[
          { id: "B31", desc: "1 žák na 1. stupni základní školy", value: "0,25" },
          { id: "B32", desc: "1 žák na 2. stupni základní školy", value: "0,5" },
        ]}
        activeFirst={h.par38?.first}
        activeSecond={h.par38?.second}
      />
      <ZsParLawMiniTable
        title="23) Žák vzdělávaný podle § 41 školského zákona"
        categoryHeader="Žák vzdělávaný podle § 41 školského zákona"
        rows={[
          { id: "B33", desc: "1 žák na 1. stupni základní školy", value: "0,25" },
          { id: "B34", desc: "1 žák na 2. stupni základní školy", value: "0,5" },
        ]}
        activeFirst={h.par41?.first}
        activeSecond={h.par41?.second}
      />

      <ZsPhaAnnexBlock activeColumnByRowId={ac} />

      <ZsPhpB46Table activeLabel={h.phpBandLabel} />

      <p className="muted-text" style={{ marginTop: 12, fontSize: "0.82rem", lineHeight: 1.5 }}>
        Pravidla výpočtu (smíšené třídy, § 16/9, ZŠ speciální aj.) jsou v metodice u přílohy NV č. 123/2018 Sb. — text v
        aplikaci u jednotlivých sekcí odpovídá těmto ustanovením.
      </p>
    </details>
  );
}
