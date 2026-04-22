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
  | "basic_b1b2"
  | "basic_b3b4"
  | "basic_b5"
  | "basic_b6"
  | "basic_b7"
  | "basic_b8"
  | "sec16"
  | "health"
  | "psych"
  | "minority_b17"
  | "minority_b18"
  | "minority_b19"
  | "minority_b20b21"
  | "gym"
  | "special_b26_28"
  | "special_combo"
  | "mixed_explain"
  | "prep_b29"
  | "prep_b30"
  | "par38"
  | "par41"
  | "pha_b35_38"
  | "pha_b39_45"
  | "php_b46";

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
const cls = (on: boolean) => "sd-phmax-breakdown__num" + (on ? ` ${ACTIVE}` : "");

function RefBandTable({ title, rows, active }: { title: string; rows: RefRow[]; active?: Partial<Record<string, string>> }) {
  if (rows.length === 0) return null;
  const colLabels = rows[0].bands.map((b) => b.label);
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>
        {title}
      </h4>
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
                <td>{r.code}</td>
                <td>{r.desc}</td>
                {r.bands.map((b) => (
                  <td key={b.label} className={cls(active?.[r.id] === b.label)}>
                    {b.value}
                  </td>
                ))}
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
  code,
  desc,
  bands,
  activeLabel,
}: {
  title: string;
  rowId: string;
  code: string;
  desc: string;
  bands: readonly Band[];
  activeLabel?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>
        {title}
      </h4>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown zs-methodology-ref">
          <thead>
            <tr>
              <th scope="col">Řádek</th>
              <th scope="col">Kód</th>
              <th scope="col">Popis</th>
              <th scope="col" className="sd-phmax-breakdown__head-num">
                PHmax
              </th>
              <th scope="col" className="sd-phmax-breakdown__head-num">
                PHAmax
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <span className="zs-methodology-ref__bid">{rowId}</span>
              </th>
              <td>{code}</td>
              <td>{desc}</td>
              {bands.map((b) => (
                <td key={b.label} className={cls(!!activeLabel && activeLabel === b.label)}>
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
  ids,
  active,
}: {
  title: string;
  categoryHeader: string;
  ids: [string, string];
  active?: { first?: boolean; second?: boolean };
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>
        {title}
      </h4>
      <table className="sd-phmax-breakdown zs-methodology-ref">
        <thead>
          <tr>
            <th scope="col">Řádek</th>
            <th scope="col">{categoryHeader}</th>
            <th scope="col" className="sd-phmax-breakdown__head-num">
              PHmax
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              <span className="zs-methodology-ref__bid">{ids[0]}</span>
            </th>
            <td>1 žák na 1. stupni</td>
            <td className={cls(!!active?.first)}>0,25</td>
          </tr>
          <tr>
            <th scope="row">
              <span className="zs-methodology-ref__bid">{ids[1]}</span>
            </th>
            <td>1 žák na 2. stupni</td>
            <td className={cls(!!active?.second)}>0,5</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ZsPhpB46Table({ activeLabel }: { activeLabel?: string | null }) {
  const row = { id: "B46", code: "79-01-C/01", desc: "PHPmax", bands: PHP_TABLE };
  const colLabels = row.bands.map((b) => b.label);
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>
        26) PHPmax — řádek B46 (tabulka přílohy k vyhlášce)
      </h4>
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
            <tr>
              <th scope="row">
                <span className="zs-methodology-ref__bid">{row.id}</span>
              </th>
              <td>{row.code}</td>
              <td>{row.desc}</td>
              {row.bands.map((b) => (
                <td key={b.label} className={cls(!!activeLabel && activeLabel === b.label)}>
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

const PHA_ORDER = [
  { id: "B35", code: "79-01-C/01", desc: "Základní škola — 1. stupeň", bands: PHA_TABLE.zs1 },
  { id: "B36", code: "79-01-C/01", desc: "Základní škola — 1. stupeň, těžší postižení", bands: PHA_TABLE.zs1Heavy },
  { id: "B37", code: "79-01-C/01", desc: "Základní škola — 2. stupeň", bands: PHA_TABLE.zs2 },
  { id: "B38", code: "79-01-C/01", desc: "Základní škola — 2. stupeň, těžší postižení", bands: PHA_TABLE.zs2Heavy },
  { id: "B39", code: "79-01-B/01", desc: "Základní škola speciální — I. díl, 1. stupeň", bands: PHA_TABLE.zss1 },
  { id: "B40", code: "79-01-B/01", desc: "Základní škola speciální — I. díl, 1. stupeň, těžší postižení", bands: PHA_TABLE.zss1Heavy },
  { id: "B41", code: "79-01-B/01", desc: "Základní škola speciální — I. díl, 2. stupeň", bands: PHA_TABLE.zss2 },
  { id: "B42", code: "79-01-B/01", desc: "Základní škola speciální — I. díl, 2. stupeň, těžší postižení", bands: PHA_TABLE.zss2Heavy },
  { id: "B43", code: "79-01-B/01", desc: "Základní škola speciální — II. díl", bands: PHA_TABLE.zssII },
  { id: "B44", code: "79-01-B/01", desc: "Základní škola speciální — II. díl, těžší postižení", bands: PHA_TABLE.zssIIHeavy },
  { id: "B45", code: "—", desc: "Přípravný stupeň základní školy speciální", bands: PHA_TABLE.zssPrep },
] as const;

function ZsPhaAnnexBlock({
  title,
  rowIds,
  active,
  showSec16,
  showZss,
}: {
  title: string;
  rowIds: readonly string[];
  active?: Partial<Record<string, string>>;
  showSec16: boolean;
  showZss: boolean;
}) {
  const rows = PHA_ORDER.filter((r) => rowIds.includes(r.id));
  if (rows.length === 0) return null;
  const colLabels = rows[0].bands.map((b) => b.label);
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>
        {title}
      </h4>
      <p className="muted-text" style={{ margin: "0 0 8px", fontSize: "0.82rem", lineHeight: 1.45 }}>
        Tabulka přílohy k vyhlášce — PHAmax pro základní školu / školu speciální. Sloupce odpovídají pásům průměrné doby
        výuky; u řádků B35–B38 se používá stejná struktura jako u PHmax u běžné ZŠ, u B39–B45 u ZŠ speciální a
        přípravného stupně.
      </p>
      {showSec16 ? (
        <p className="muted-text" style={{ margin: "0 0 8px", fontSize: "0.82rem", lineHeight: 1.45 }}>
          U škol dle § 16 odst. 9 zákona č. 561/2004 Sb. se v aplikaci používají řádky B35–B38 stejně jako u běžné ZŠ;
          samostatné řádky § 16/9 v této PHA tabulce nejsou.
        </p>
      ) : null}
      {showZss ? (
        <p className="muted-text" style={{ margin: "0 0 8px", fontSize: "0.82rem", lineHeight: 1.45 }}>
          Pro ZŠ speciální jsou v této tabulce řádky B39–B45 (I. díl / II. díl / přípravný stupeň).
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
                <td>{r.code}</td>
                <td>{r.desc}</td>
                {r.bands.map((b) => (
                  <td key={b.label} className={cls(active?.[r.id] === b.label)}>
                    {b.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

function ZsSpecialCombinationTable({ combo }: { combo?: { i1: boolean; i2: boolean; ii: boolean } | null }) {
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
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 6px" }}>
        20) Kombinace společné výuky — ZŠ speciální (B26–B28)
      </h4>
      <p className="muted-text" style={{ margin: "0 0 8px", fontSize: "0.82rem", lineHeight: 1.45 }}>
        Při současné výuce ve více částech ZŠ speciální se podle metodiky vybírá jeden z řádků B26–B28. Níže je přehled
        kombinací podle zapnutých částí (I. díl 1. st., I. díl 2. st., II. díl); zeleně je zvýrazněna shoda s aktuálním
        stavem ve formuláři.
      </p>
      <table className="sd-phmax-breakdown zs-methodology-ref">
        <thead>
          <tr>
            <th scope="col">I. díl, 1. st.</th>
            <th scope="col">I. díl, 2. st.</th>
            <th scope="col">II. díl</th>
            <th scope="col">Použije se PHmax pro</th>
            <th scope="col" className="sd-phmax-breakdown__head-num">
              PHmax z řádku
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const m =
              combo != null &&
              r.i1 === (combo.i1 ? "ano" : "ne") &&
              r.i2 === (combo.i2 ? "ano" : "ne") &&
              r.ii === (combo.ii ? "ano" : "ne");
            return (
              <tr key={i} className={m ? "zs-methodology-ref__row--combo-match" : undefined}>
                <td className={r.i1 === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.i1}</td>
                <td className={r.i2 === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.i2}</td>
                <td className={r.ii === "ano" ? "zs-ref-cell--combo-ano" : undefined}>{r.ii}</td>
                <td>{r.use}</td>
                <td className={cls(m)}>
                  <span className="zs-methodology-ref__bid">{r.row}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted-text" style={{ margin: "8px 0 0", fontSize: "0.78rem", lineHeight: 1.45 }}>
        Pozn.: při kombinaci více „ano“ metodika vede k jednomu cílovému řádku; aplikace volí řádek podle stejné logiky
        jako tato tabulka.
      </p>
    </div>
  );
}

function MixedNote({ note }: { note: { total: number; usesMethodTable: boolean } }) {
  const sourceLabel = note.usesMethodTable ? "metodická tabulka" : "zjednodušený seznam řádků";
  return (
    <div className="subcard" style={{ marginBottom: 20, borderLeft: "4px solid #0d9488", background: "rgba(13,148,136,.06)" }}>
      <p className="muted-text" style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5 }}>
        U smíšených tříd se PHmax neváže na jeden řádek Bx; používá se B9–B10 nebo B26–B28 podle převažujícího oboru.
        Pokud máte současně samostatné řádky § 16/9 nebo ZŠ speciální, tyto PHmax se sčítají zvlášť jako další položky
        součtu.
      </p>
      <p className="muted-text" style={{ margin: "6px 0 0", fontSize: "0.84rem" }}>
        Smíšené třídy celkem: <strong>{note.total.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })}</strong> (
        {sourceLabel})
      </p>
    </div>
  );
}

export function PhmaxZsMethodologyReferenceTables({ highlights }: { highlights?: PhmaxZsMethodologyHighlights }) {
  const h = highlights ?? {};
  const [showAll, setShowAll] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  const showPhaSec16 = show("sec16") || show("pha_b35_38");
  const showPhaZss = show("special_b26_28") || show("pha_b39_45");

  return (
    <details
      className="subcard sd-phmax-breakdown-wrap"
      style={{ marginTop: 18 }}
      onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        className="section-title"
        style={{ fontSize: "1.02rem", cursor: "pointer" }}
        aria-expanded={detailsOpen}
      >
        Referenční tabulky metodiky PHmax / PHAmax / PHPmax
      </summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 8, fontSize: "0.86rem" }}>
        Legenda: zelená aktivní buňka, žlutá „ano“ v kombinaci ZŠSp, tyrkysová vysvětlivka smíšených tříd.
      </p>
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 10 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          aria-label="Zobrazit všechny referenční tabulky metodiky"
        />
        Zobrazit všechny referenční tabulky
      </label>
      {filtered && (h.connectedBlocks?.length ?? 0) === 0 ? (
        <p className="muted-text" style={{ marginBottom: 10, fontSize: "0.84rem" }}>
          Zatím není vyplněný žádný navázaný vstup. Pro náhled struktury zapněte „Zobrazit všechny referenční tabulky“.
        </p>
      ) : null}

      {show("basic_b1b2") ? (
        <RefBandTable
          title="4) Základní škola — více než 2 třídy (řádky B1, B2)"
          rows={[
            { id: "B1", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B13_MORE_THAN_2.first },
            { id: "B2", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B13_MORE_THAN_2.second },
          ]}
          active={ac}
        />
      ) : null}
      {show("basic_b3b4") ? (
        <RefBandTable
          title="5) Základní škola — nejvýše 2 třídy (řádky B3, B4)"
          rows={[
            { id: "B3", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B34_MAX_2.first },
            { id: "B4", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B34_MAX_2.second },
          ]}
          active={ac}
        />
      ) : null}
      {show("basic_b5") ? (
        <RefBandTable title="6) Mateřská škola — řádek B5" rows={[{ id: "B5", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B5 }]} active={ac} />
      ) : null}
      {show("basic_b6") ? (
        <RefBandTable title="7) Speciální mateřská škola — řádek B6" rows={[{ id: "B6", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B6 }]} active={ac} />
      ) : null}
      {show("basic_b7") ? (
        <RefBandTable title="8) Speciální školka — řádek B7" rows={[{ id: "B7", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B7 }]} active={ac} />
      ) : null}
      {show("basic_b8") ? (
        <RefBandTable title="9) Praktická škola — řádek B8" rows={[{ id: "B8", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B8 }]} active={ac} />
      ) : null}
      {show("sec16") ? (
        <RefBandTable
          title="10) Škola dle § 16 odst. 9 zákona č. 561/2004 Sb. (řádky B9, B10)"
          rows={[
            { id: "B9", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B9_B10.first },
            { id: "B10", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B9_B10.second },
          ]}
          active={ac}
        />
      ) : null}
      {show("health") ? (
        <RefBandTable
          title="11) Zdravotnické zařízení školského typu (řádky B11–B13)"
          rows={[
            { id: "B11", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B11_B13.health1 },
            { id: "B12", code: "79-01-C/01", desc: "ZŠ (2. stupeň)", bands: B11_B13.health2 },
            { id: "B13", code: "79-01-C/01", desc: "ZŠ (1. a 2. stupeň)", bands: B11_B13.healthMix },
          ]}
          active={ac}
        />
      ) : null}
      {show("psych") ? (
        <RefBandTable
          title="12) Psychiatrické zařízení školského typu (řádky B14–B16)"
          rows={[
            { id: "B14", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B14_B16.psych1 },
            { id: "B15", code: "79-01-C/01", desc: "ZŠ (2. stupeň)", bands: B14_B16.psych2 },
            { id: "B16", code: "79-01-C/01", desc: "ZŠ (1. a 2. stupeň)", bands: B14_B16.psychMix },
          ]}
          active={ac}
        />
      ) : null}
      {show("minority_b17") ? (
        <RefBandTable title="13) Školy pro žáky národnostních menšin — řádek B17" rows={[{ id: "B17", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minority1 }]} active={ac} />
      ) : null}
      {show("minority_b18") ? (
        <RefBandTable title="14) Školy pro žáky národnostních menšin — řádek B18" rows={[{ id: "B18", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minority2 }]} active={ac} />
      ) : null}
      {show("minority_b19") ? (
        <RefBandTable title="15) Školy pro žáky národnostních menšin — řádek B19" rows={[{ id: "B19", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minority3 }]} active={ac} />
      ) : null}
      {show("minority_b20b21") ? (
        <RefBandTable
          title="16) Školy pro žáky národnostních menšin — řádky B20, B21"
          rows={[
            { id: "B20", code: "79-01-C/01", desc: "ZŠ (1. stupeň)", bands: B17_B21.minorityFull1 },
            { id: "B21", code: "79-01-C/01", desc: "ZŠ (2. stupeň)", bands: B17_B21.minorityFull2 },
          ]}
          active={ac}
        />
      ) : null}
      {show("gym") && gymVisible.length > 0 ? (
        <RefBandTable title="17) Gymnázia (řádky B22–B25)" rows={gymVisible} active={ac} />
      ) : null}
      {show("special_b26_28") ? (
        <RefBandTable
          title="18) Základní škola speciální — řádky B26–B28"
          rows={[
            { id: "B26", code: "79-01-B/01", desc: "I. díl, 1. stupeň", bands: B26_B28.special1 },
            { id: "B27", code: "79-01-B/01", desc: "I. díl, 2. stupeň", bands: B26_B28.special2 },
            { id: "B28", code: "79-01-B/01", desc: "II. díl", bands: B26_B28.specialII },
          ]}
          active={ac}
        />
      ) : null}
      {show("special_combo") ? <ZsSpecialCombinationTable combo={h.zsspCombo} /> : null}
      {show("mixed_explain") && h.mixedReferenceNote ? <MixedNote note={h.mixedReferenceNote} /> : null}
      {show("prep_b29") ? (
        <ZsTwoColPhTable
          title="21) Přípravná třída základní školy — řádek B29 (PHmax / PHAmax)"
          rowId="B29"
          code="—"
          desc="Přípravná třída ZŠ"
          bands={B29_PREP_CLASS}
          activeLabel={h.prepClassLabel}
        />
      ) : null}
      {show("prep_b30") ? (
        <ZsTwoColPhTable
          title="21) Přípravný stupeň základní školy speciální — řádek B30 (PHmax / PHAmax)"
          rowId="B30"
          code="—"
          desc="Přípravný stupeň ZŠS"
          bands={B30_PREP_SPECIAL}
          activeLabel={h.prepSpecialLabel}
        />
      ) : null}
      {show("par38") ? (
        <ZsParLawMiniTable title="22) § 38 zákona č. 561/2004 Sb. — řádky B31, B32" categoryHeader="Kategorie" ids={["B31", "B32"]} active={h.par38} />
      ) : null}
      {show("par41") ? (
        <ZsParLawMiniTable title="23) § 41 zákona č. 561/2004 Sb. — řádky B33, B34" categoryHeader="Kategorie" ids={["B33", "B34"]} active={h.par41} />
      ) : null}
      {show("pha_b35_38") ? (
        <ZsPhaAnnexBlock
          title="24) PHAmax — základní škola (řádky B35–B38, tabulka přílohy)"
          rowIds={["B35", "B36", "B37", "B38"]}
          active={ac}
          showSec16={showPhaSec16}
          showZss={false}
        />
      ) : null}
      {show("pha_b39_45") ? (
        <ZsPhaAnnexBlock
          title="25) PHAmax — základní škola speciální a přípravný stupeň (řádky B39–B45, tabulka přílohy)"
          rowIds={["B39", "B40", "B41", "B42", "B43", "B44", "B45"]}
          active={ac}
          showSec16={false}
          showZss={showPhaZss}
        />
      ) : null}
      {show("php_b46") ? <ZsPhpB46Table activeLabel={h.phpBandLabel} /> : null}
    </details>
  );
}
