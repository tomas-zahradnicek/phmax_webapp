import React from "react";
import { ScrollGrabRegion } from "./ScrollGrabRegion";
import type { Band } from "./phmax-zs-logic";
import {
  B11_B13,
  B13_MORE_THAN_2,
  B34_MAX_2,
  B5,
  B6,
  B7,
  B8,
  B9_B10,
  B14_B16,
  B17_B21,
  B26_B28,
} from "./phmax-zs-logic";

type RefRow = { id: string; code: string; desc: string; bands: readonly Band[] };

function ZsRefBandTable({ title, intro, rows }: { title: string; intro?: string; rows: RefRow[] }) {
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
                <th scope="row">{r.id}</th>
                <td style={{ whiteSpace: "nowrap" }}>{r.code}</td>
                <td>{r.desc}</td>
                {r.bands.map((b) => (
                  <td key={`${r.id}-${b.label}`} className="sd-phmax-breakdown__num">
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

/** Přehled kombinací ZŠSp — řádky B26–B28 (metodika). */
function ZsSpecialCombinationTable() {
  const rows = [
    { i1: "ano", i2: "ne", ii: "ne", use: "ZŠSp I. díl, 1. st.", row: "B26" },
    { i1: "ne", i2: "ano", ii: "ne", use: "ZŠSp I. díl, 2. st.", row: "B27" },
    { i1: "ne", i2: "ne", ii: "ano", use: "ZŠSp II. díl", row: "B28" },
    { i1: "ano", i2: "ano", ii: "ne", use: "ZŠSp I. díl, 2. st.", row: "B27" },
    { i1: "ano", i2: "ne", ii: "ano", use: "ZŠSp I. díl, 1. st.", row: "B26" },
    { i1: "ne", i2: "ano", ii: "ano", use: "ZŠSp I. díl, 2. st.", row: "B27" },
    { i1: "ano", i2: "ano", ii: "ano", use: "ZŠSp I. díl, 2. st.", row: "B27" },
  ];
  return (
    <div style={{ marginBottom: 22 }}>
      <h4 className="section-title" style={{ fontSize: "0.96rem", margin: "0 0 8px", lineHeight: 1.35 }}>
        Přehled možných kombinací společné výuky žáků ZŠ speciální ve třídě (určení PHmax z řádku B26–B28)
      </h4>
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
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.i1}</td>
                <td>{r.i2}</td>
                <td>{r.ii}</td>
                <td>{r.use}</td>
                <th scope="row">{r.row}</th>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollGrabRegion>
    </div>
  );
}

/**
 * Statické referenční tabulky řádků B1–B28 podle metodiky ZV (stejná data jako výpočet v `phmax-zs-logic.ts`).
 */
export function PhmaxZsMethodologyReferenceTables() {
  const b1b2: RefRow[] = [
    { id: "B1", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B13_MORE_THAN_2.first },
    { id: "B2", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B13_MORE_THAN_2.second },
  ];
  const b3b4: RefRow[] = [
    { id: "B3", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B34_MAX_2.first },
    { id: "B4", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B34_MAX_2.second },
  ];

  return (
    <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 18 }}>
      <summary className="section-title" style={{ fontSize: "1.02rem", cursor: "pointer" }}>
        Referenční tabulky metodiky PHmax (řádky B1–B28, výňatek)
      </summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 14, fontSize: "0.86rem", lineHeight: 1.5 }}>
        Tabulky odpovídají kódům v <code className="methodology-strip__code">phmax-zs-logic.ts</code> a slouží k ručnímu
        ověření proti metodice. Průměr žáků ve třídě se zařadí do sloupce podle popisu pásma.
      </p>

      <ZsRefBandTable
        title="4) ZŠ s 1. a 2. stupněm — více než 2 třídy v některém ročníku (B1, B2)"
        rows={b1b2}
      />
      <ZsRefBandTable
        title="5) ZŠ s 1. a 2. stupněm — nejvýše 2 třídy v každém ročníku (B3, B4)"
        rows={b3b4}
      />
      <ZsRefBandTable
        title="6) ZŠ tvořená 1 třídou 1. stupně (B5)"
        rows={[{ id: "B5", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B5 }]}
      />
      <ZsRefBandTable
        title="7) ZŠ tvořená 2 třídami 1. stupně (B6)"
        rows={[{ id: "B6", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B6 }]}
      />
      <ZsRefBandTable
        title="8) ZŠ tvořená 3 třídami 1. stupně (B7)"
        rows={[{ id: "B7", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B7 }]}
      />
      <ZsRefBandTable
        title="9) ZŠ tvořená 4 a více třídami 1. stupně (B8)"
        rows={[{ id: "B8", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B8 }]}
      />
      <ZsRefBandTable
        title="10) ZŠ zřízená podle § 16 odst. 9 školského zákona (B9, B10)"
        rows={[
          { id: "B9", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B9_B10.first },
          { id: "B10", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B9_B10.second },
        ]}
      />
      <ZsRefBandTable
        title="11) ZŠ při zdravotnickém zařízení mimo psychiatrickou nemocnici (B11–B13)"
        rows={[
          { id: "B11", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B11_B13.health1 },
          { id: "B12", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B11_B13.health2 },
          { id: "B13", code: "79-01-C/01", desc: "Základní škola (1. a 2. stupeň)", bands: B11_B13.healthMix },
        ]}
      />
      <ZsRefBandTable
        title="12) ZŠ při psychiatrické nemocnici (B14–B16)"
        rows={[
          { id: "B14", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B14_B16.psych1 },
          { id: "B15", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B14_B16.psych2 },
          { id: "B16", code: "79-01-C/01", desc: "Základní škola (1. a 2. stupeň)", bands: B14_B16.psychMix },
        ]}
      />
      <ZsRefBandTable
        title="13) ZŠ s jazykem národnostní menšiny — 1 třída 1. stupně (B17)"
        rows={[{ id: "B17", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minority1 }]}
      />
      <ZsRefBandTable
        title="14) ZŠ s jazykem národnostní menšiny — 2 třídy 1. stupně (B18)"
        rows={[{ id: "B18", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minority2 }]}
      />
      <ZsRefBandTable
        title="15) ZŠ s jazykem národnostní menšiny — 3 a více tříd 1. stupně (B19)"
        rows={[{ id: "B19", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minority3 }]}
      />
      <ZsRefBandTable
        title="16) ZŠ s jazykem národnostní menšiny — 1. a 2. stupeň (B20, B21)"
        rows={[
          { id: "B20", code: "79-01-C/01", desc: "Základní škola (1. stupeň)", bands: B17_B21.minorityFull1 },
          { id: "B21", code: "79-01-C/01", desc: "Základní škola (2. stupeň)", bands: B17_B21.minorityFull2 },
        ]}
      />
      <ZsRefBandTable
        title="17) Základní škola speciální (B26–B28)"
        rows={[
          { id: "B26", code: "79-01-B/01", desc: "Základní škola speciální (I. díl, první stupeň)", bands: B26_B28.special1 },
          { id: "B27", code: "79-01-B/01", desc: "Základní škola speciální (I. díl, druhý stupeň)", bands: B26_B28.special2 },
          { id: "B28", code: "79-01-B/01", desc: "Základní škola speciální (II. díl)", bands: B26_B28.specialII },
        ]}
      />

      <ZsSpecialCombinationTable />

      <p className="muted-text" style={{ marginTop: 12, fontSize: "0.82rem", lineHeight: 1.5 }}>
        Tabulky pro víceletá gymnázia a související řádky (B22–B25) a další dílčí přílohy lze doplnit v navazující verzi
        stejným způsobem.
      </p>
    </details>
  );
}
