import React, { useState } from "react";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import type { Band } from "./phmax-zs-logic";
import {
  B11_B13,
  B13_MORE_THAN_2,
  B14_B16,
  B17_B21,
  B22_B25,
  B26_B28,
  B29_PREP_CLASS,
  B30_PREP_SPECIAL,
  B34_MAX_2,
  B5,
  B6,
  B7,
  B8,
  B9_B10,
  PHA_TABLE,
  PHP_TABLE,
} from "./phmax-zs-logic";

type RefRow = { id: string; code: string; desc: string; bands: readonly Band[] };

export type ZsMethodologyConnectedBlock =
  | "basic_b1b2" | "basic_b3b4" | "basic_b5" | "basic_b6" | "basic_b7" | "basic_b8"
  | "sec16" | "health" | "psych"
  | "minority_b17" | "minority_b18" | "minority_b19" | "minority_b20b21"
  | "gym" | "special_b26_28" | "special_combo" | "mixed_explain"
  | "prep_b29" | "prep_b30" | "par38" | "par41" | "pha_b35_38" | "pha_b39_45" | "php_b46";

export type PhmaxZsMethodologyHighlights = {
  connectedBlocks?: readonly ZsMethodologyConnectedBlock[];
  activeColumnByRowId?: Partial<Record<string, string>>;
  zsspCombo?: { i1: boolean; i2: boolean; ii: boolean } | null;
  prepClassLabel?: string;
  prepSpecialLabel?: string;
  par38?: { first?: boolean; second?: boolean };
  par41?: { first?: boolean; second?: boolean };
  phpBandLabel?: string | null;
  visibleGymRowIds?: readonly string[];
  mixedReferenceNote?: { total: number; usesMethodTable: boolean };
};

const ACTIVE = "sd-phmax-breakdown__cell--pv-active";
const cn = (on: boolean) => "sd-phmax-breakdown__num" + (on ? ` ${ACTIVE}` : "");

function RefBandTable({ title, rows, active }: { title: string; rows: RefRow[]; active?: Partial<Record<string, string>> }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>{title}</h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead><tr><th>Řádek</th><th>Kód</th><th>Popis</th>{rows[0].bands.map((b) => <th key={b.label}>{b.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row"><span className="zs-methodology-ref__bid">{r.id}</span></th>
                <td>{r.code}</td>
                <td>{r.desc}</td>
                {r.bands.map((b) => <td key={b.label} className={cn(active?.[r.id] === b.label)}>{b.value}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

function ComboTable({ combo }: { combo?: { i1: boolean; i2: boolean; ii: boolean } | null }) {
  const rows = [
    { i1: "ano", i2: "ne", ii: "ne", use: "ZŠSp I. díl, 1. st.", row: "B26" },
    { i1: "ne", i2: "ano", ii: "ne", use: "ZŠSp I. díl, 2. st.", row: "B27" },
    { i1: "ne", i2: "ne", ii: "ano", use: "ZŠSp II. díl", row: "B28" },
    { i1: "ano", i2: "ano", ii: "ne", use: "ZŠSp I. díl, 2. st.", row: "B27" },
    { i1: "ano", i2: "ne", ii: "ano", use: "ZŠSp I. díl, 1. st.", row: "B26" },
    { i1: "ne", i2: "ano", ii: "ano", use: "ZŠSp I. díl, 2. st.", row: "B27" },
    { i1: "ano", i2: "ano", ii: "ano", use: "ZŠSp I. díl, 2. st.", row: "B27" },
  ] as const;
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>20) Kombinace společné výuky ZŠ speciální</h4>
      <table className="sd-phmax-breakdown zs-methodology-ref">
        <thead><tr><th>I. díl, 1. st.</th><th>I. díl, 2. st.</th><th>II. díl</th><th>Použije se PHmax pro</th><th>PHmax z řádku</th></tr></thead>
        <tbody>{rows.map((r, i) => { const m = combo != null && r.i1 === (combo.i1 ? "ano" : "ne") && r.i2 === (combo.i2 ? "ano" : "ne") && r.ii === (combo.ii ? "ano" : "ne"); return <tr key={i} className={m ? "zs-methodology-ref__row--combo-match" : undefined}><td className={r.i1 === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.i1}</td><td className={r.i2 === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.i2}</td><td className={r.ii === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.ii}</td><td>{r.use}</td><td className={cn(m)}><span className="zs-methodology-ref__bid">{r.row}</span></td></tr>; })}</tbody>
      </table>
    </div>
  );
}

function MixedNote({ note }: { note: { total: number; usesMethodTable: boolean } }) {
  return (
    <div className="subcard" style={{ marginBottom: 20, borderLeft: "4px solid #0d9488", background: "rgba(13,148,136,.06)" }}>
      <p className="muted-text" style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5 }}>
        U smíšených tříd se PHmax neváže na jeden řádek Bx; používá se B9–B10 nebo B26–B28 podle převažujícího oboru. Pokud máte současně samostatné řádky § 16/9 nebo ZŠ speciální, tyto PHmax se sčítají zvlášť jako další položky součtu.
      </p>
      <p className="muted-text" style={{ margin: "6px 0 0", fontSize: "0.84rem" }}>
        Smíšené třídy celkem: <strong>{note.total.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })}</strong> ({note.usesMethodTable ? "metodická tabulka" : "legacy řádky"})
      </p>
    </div>
  );
}

function LawRows({ title, ids, active }: { title: string; ids: [string, string]; active?: { first?: boolean; second?: boolean } }) {
  return <div style={{ marginBottom: 20 }}><h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>{title}</h4><table className="sd-phmax-breakdown zs-methodology-ref"><tbody><tr><th scope="row"><span className="zs-methodology-ref__bid">{ids[0]}</span> 1 žák na 1. stupni</th><td className={cn(!!active?.first)}>0,25</td></tr><tr><th scope="row"><span className="zs-methodology-ref__bid">{ids[1]}</span> 1 žák na 2. stupni</th><td className={cn(!!active?.second)}>0,5</td></tr></tbody></table></div>;
}

export function PhmaxZsMethodologyReferenceTables({ highlights }: { highlights?: PhmaxZsMethodologyHighlights }) {
  const h = highlights ?? {};
  const [showAll, setShowAll] = useState(false);
  const filtered = h.connectedBlocks != null && !showAll;
  const show = (id: ZsMethodologyConnectedBlock) => showAll || !h.connectedBlocks || h.connectedBlocks.includes(id);
  const ac = h.activeColumnByRowId;

  const gymRows: RefRow[] = [
    { id: "B22", code: "79-41-K/61", desc: "Gymnázium šestileté", bands: B22_B25.gym6 },
    { id: "B23", code: "79-41-K/81", desc: "Gymnázium osmileté", bands: B22_B25.gym8 },
    { id: "B24", code: "79-42-K/81", desc: "Gymnázium se sportovní přípravou (osmileté)", bands: B22_B25.sport8 },
    { id: "B25", code: "79-42-K/61", desc: "Gymnázium se sportovní přípravou (šestileté)", bands: B22_B25.sport6 },
  ];
  const gymVisible = filtered && h.visibleGymRowIds?.length ? gymRows.filter((r) => h.visibleGymRowIds!.includes(r.id)) : gymRows;

  return (
    <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 18 }}>
      <summary className="section-title" style={{ fontSize: "1.02rem", cursor: "pointer" }}>Referenční tabulky metodiky PHmax / PHAmax / PHPmax</summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 8, fontSize: "0.86rem" }}>Legenda: zelená aktivní buňka, žlutá „ano“ v kombinaci ZŠSp, tyrkysová vysvětlivka smíšených tříd.</p>
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 10 }} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Zobrazit všechny referenční tabulky
      </label>
      {filtered && (h.connectedBlocks?.length ?? 0) === 0 ? <p className="muted-text" style={{ marginBottom: 10, fontSize: "0.84rem" }}>Zatím není vyplněný žádný navázaný vstup. Pro náhled struktury zapněte „Zobrazit všechny referenční tabulky“.</p> : null}

      {show("basic_b1b2") ? <RefBandTable title="4) ZŠ více než 2 třídy (B1, B2)" rows={[{ id: "B1", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B13_MORE_THAN_2.first }, { id: "B2", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B13_MORE_THAN_2.second }]} active={ac} /> : null}
      {show("basic_b3b4") ? <RefBandTable title="5) ZŠ max 2 třídy (B3, B4)" rows={[{ id: "B3", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B34_MAX_2.first }, { id: "B4", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B34_MAX_2.second }]} active={ac} /> : null}
      {show("basic_b5") ? <RefBandTable title="6) B5" rows={[{ id: "B5", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B5 }]} active={ac} /> : null}
      {show("basic_b6") ? <RefBandTable title="7) B6" rows={[{ id: "B6", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B6 }]} active={ac} /> : null}
      {show("basic_b7") ? <RefBandTable title="8) B7" rows={[{ id: "B7", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B7 }]} active={ac} /> : null}
      {show("basic_b8") ? <RefBandTable title="9) B8" rows={[{ id: "B8", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B8 }]} active={ac} /> : null}
      {show("sec16") ? <RefBandTable title="10) §16/9 (B9, B10)" rows={[{ id: "B9", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B9_B10.first }, { id: "B10", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B9_B10.second }]} active={ac} /> : null}
      {show("health") ? <RefBandTable title="11) Zdravotnické zařízení (B11–B13)" rows={[{ id: "B11", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B11_B13.health1 }, { id: "B12", code: "79-01-C/01", desc: "ZŠ (2. stupeň)", bands: B11_B13.health2 }, { id: "B13", code: "79-01-C/01", desc: "ZŠ (1. a 2. stupeň)", bands: B11_B13.healthMix }]} active={ac} /> : null}
      {show("psych") ? <RefBandTable title="12) Psychiatrie (B14–B16)" rows={[{ id: "B14", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B14_B16.psych1 }, { id: "B15", code: "79-01-C/01", desc: "ZŠ (2. stupeň)", bands: B14_B16.psych2 }, { id: "B16", code: "79-01-C/01", desc: "ZŠ (1. a 2. stupeň)", bands: B14_B16.psychMix }]} active={ac} /> : null}
      {show("minority_b17") ? <RefBandTable title="13) Menšina B17" rows={[{ id: "B17", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minority1 }]} active={ac} /> : null}
      {show("minority_b18") ? <RefBandTable title="14) Menšina B18" rows={[{ id: "B18", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minority2 }]} active={ac} /> : null}
      {show("minority_b19") ? <RefBandTable title="15) Menšina B19" rows={[{ id: "B19", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minority3 }]} active={ac} /> : null}
      {show("minority_b20b21") ? <RefBandTable title="16) Menšina B20, B21" rows={[{ id: "B20", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minorityFull1 }, { id: "B21", code: "79-01-C/01", desc: "ZŠ (2. stupeň)", bands: B17_B21.minorityFull2 }]} active={ac} /> : null}
      {show("gym") && gymVisible.length > 0 ? <RefBandTable title="17) Gymnázia (B22–B25)" rows={gymVisible} active={ac} /> : null}
      {show("special_b26_28") ? <RefBandTable title="18) ZŠ speciální (B26–B28)" rows={[{ id: "B26", code: "79-01-B/01", desc: "I. díl, 1. stupeň", bands: B26_B28.special1 }, { id: "B27", code: "79-01-B/01", desc: "I. díl, 2. stupeň", bands: B26_B28.special2 }, { id: "B28", code: "79-01-B/01", desc: "II. díl", bands: B26_B28.specialII }]} active={ac} /> : null}
      {show("special_combo") ? <ComboTable combo={h.zsspCombo} /> : null}
      {show("mixed_explain") && h.mixedReferenceNote ? <MixedNote note={h.mixedReferenceNote} /> : null}
      {show("prep_b29") ? <RefBandTable title="21) B29" rows={[{ id: "B29", code: "—", desc: "Přípravná třída ZŠ", bands: B29_PREP_CLASS }]} active={{ B29: h.prepClassLabel ?? "" }} /> : null}
      {show("prep_b30") ? <RefBandTable title="21) B30" rows={[{ id: "B30", code: "—", desc: "Přípravný stupeň ZŠS", bands: B30_PREP_SPECIAL }]} active={{ B30: h.prepSpecialLabel ?? "" }} /> : null}
      {show("par38") ? <LawRows title="22) § 38" ids={["B31", "B32"]} active={h.par38} /> : null}
      {show("par41") ? <LawRows title="23) § 41" ids={["B33", "B34"]} active={h.par41} /> : null}
      {show("pha_b35_38") ? <RefBandTable title="24) PHA B35–B38" rows={[{ id: "B35", code: "79-01-C/01", desc: "ZŠ 1. stupeň", bands: PHA_TABLE.zs1 }, { id: "B36", code: "79-01-C/01", desc: "ZŠ 1. stupeň těžší postižení", bands: PHA_TABLE.zs1Heavy }, { id: "B37", code: "79-01-C/01", desc: "ZŠ 2. stupeň", bands: PHA_TABLE.zs2 }, { id: "B38", code: "79-01-C/01", desc: "ZŠ 2. stupeň těžší postižení", bands: PHA_TABLE.zs2Heavy }]} active={ac} /> : null}
      {show("pha_b39_45") ? <RefBandTable title="25) PHA B39–B45" rows={[{ id: "B39", code: "79-01-B/01", desc: "ZŠS I/1", bands: PHA_TABLE.zss1 }, { id: "B40", code: "79-01-B/01", desc: "ZŠS I/1 těžší", bands: PHA_TABLE.zss1Heavy }, { id: "B41", code: "79-01-B/01", desc: "ZŠS I/2", bands: PHA_TABLE.zss2 }, { id: "B42", code: "79-01-B/01", desc: "ZŠS I/2 těžší", bands: PHA_TABLE.zss2Heavy }, { id: "B43", code: "79-01-B/01", desc: "ZŠS II", bands: PHA_TABLE.zssII }, { id: "B44", code: "79-01-B/01", desc: "ZŠS II těžší", bands: PHA_TABLE.zssIIHeavy }, { id: "B45", code: "—", desc: "Přípravný stupeň", bands: PHA_TABLE.zssPrep }]} active={ac} /> : null}
      {show("php_b46") ? <RefBandTable title="26) PHP B46" rows={[{ id: "B46", code: "79-01-C/01", desc: "PHPmax", bands: PHP_TABLE }]} active={{ B46: h.phpBandLabel ?? "" }} /> : null}
    </details>
  );
}
