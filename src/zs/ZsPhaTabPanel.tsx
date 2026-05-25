import React from "react";
import type { CalculatorViewMode } from "../calculator-view-mode";
import { sectionNeedsAttentionClass } from "../calculator-section-focus";
import { IntegerInput } from "../IntegerInput";
import { InputOutputLegend, ResultCard } from "../phmax-zs-ui";
import { TableOuter } from "../TableOuter";
import type { PhaRow } from "../phmax-zs-logic";
import { ZsLegisRef } from "../PhmaxProductLegisUi";
import { ZsModuleGate } from "../ZsModuleGate";

export type ZsPhaComputedRow = PhaRow & {
  avg: number;
  bandLabel: string;
  perClass: number;
  subtotal: number;
};

export type ZsPhaTabPanelProps = {
  viewMode: CalculatorViewMode;
  hasPhaIssue: boolean;
  phaComputedRows: ZsPhaComputedRow[];
  totalPha: number;
  onAdd: () => void;
  onReset: () => void;
  onUpdate: (id: number, key: keyof PhaRow, value: string | number) => void;
  onRemove: (id: number) => void;
};

export function ZsPhaTabPanel({
  viewMode,
  hasPhaIssue,
  phaComputedRows,
  totalPha,
  onAdd,
  onReset,
  onUpdate,
  onRemove,
}: ZsPhaTabPanelProps) {
  return (
    <ZsModuleGate sectionId="pha" title="PHAmax – asistenti pedagoga" viewMode={viewMode} defaultOpenInBasic>
      <section
        className={`card section-card section-card--pha${sectionNeedsAttentionClass(hasPhaIssue)}`}
        data-section="pha"
      >
        <h2>PHAmax – asistenti pedagoga</h2>
        <p className="muted-text">
          U tříd <ZsLegisRef citeId="zs-16-9" label="§ 16/9" /> a ZŠ speciální podle metodiky (
          <ZsLegisRef citeId="nv123-1" label="NV č. 123/2018 Sb." />, <ZsLegisRef citeId="vyhl48" label="vyhl. č. 48/2005 Sb." />
          ) rozlišujte příznak třídy: AD1 (ostatní zdravotní postižení dle{" "}
          <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" />) vs. AD2 (těžší varianty – tělesné postižení, PVCH,
          souběžné postižení, autismus). Typ řádku ve výběru odpovídá řádkům B35–B44 tabulky pro PHAmax v metodice v5;
          průměr žáků ve skupině stejného typu určí pásmo a hodnotu PHAmax na třídu. Přípravný stupeň ZŠ speciální je
          řádek B45 (samostatná volba).
        </p>
        <InputOutputLegend compact />
        <TableOuter variant="pha" aria-label="Tabulka PHAmax – asistenti pedagoga">
          <table className="table">
            <thead>
              <tr>
                <th>Typ třídy</th>
                <th>Třídy</th>
                <th>Žáci</th>
                <th>Průměr</th>
                <th>Pásmo</th>
                <th>PHAmax – asistenti pedagoga / třída</th>
                <th>Mezisoučet</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {phaComputedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted-text">
                    Zatím nemáte zadané žádné údaje. Klikněte na „Přidat třídu / řádek“.
                  </td>
                </tr>
              ) : (
                phaComputedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select value={row.kind} onChange={(e) => onUpdate(row.id, "kind", e.target.value)}>
                        <option value="zs1">ZŠ §16/9 – 1. stupeň (ř. B35)</option>
                        <option value="zs1Heavy">ZŠ §16/9 – 1. stupeň, těžší varianty (ř. B36)</option>
                        <option value="zs2">ZŠ §16/9 – 2. stupeň (ř. B37)</option>
                        <option value="zs2Heavy">ZŠ §16/9 – 2. stupeň, těžší varianty (ř. B38)</option>
                        <option value="zss1">ZŠ speciální I. díl – 1. stupeň (ř. B39)</option>
                        <option value="zss1Heavy">ZŠ speciální I. díl – 1. stupeň, těžší varianty (ř. B40)</option>
                        <option value="zss2">ZŠ speciální I. díl – 2. stupeň (ř. B41)</option>
                        <option value="zss2Heavy">ZŠ speciální I. díl – 2. stupeň, těžší varianty (ř. B42)</option>
                        <option value="zssII">ZŠ speciální II. díl (ř. B43)</option>
                        <option value="zssIIHeavy">ZŠ speciální II. díl, těžší varianty (ř. B44)</option>
                        <option value="zssPrep">Přípravný stupeň ZŠ speciální (ř. B45)</option>
                      </select>
                    </td>
                    <td>
                      <IntegerInput value={row.classes} onChange={(v) => onUpdate(row.id, "classes", v)} />
                    </td>
                    <td>
                      <IntegerInput value={row.pupils} onChange={(v) => onUpdate(row.id, "pupils", v)} />
                    </td>
                    <td>{row.avg}</td>
                    <td>{row.bandLabel}</td>
                    <td>{row.perClass}</td>
                    <td>{row.subtotal}</td>
                    <td>
                      <button type="button" className="icon-btn" onClick={() => onRemove(row.id)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableOuter>
        <div className="toolbar">
          <button type="button" className="btn ghost" onClick={onAdd}>
            Přidat třídu / řádek
          </button>
          <button type="button" className="btn ghost" onClick={onReset}>
            Vymazat údaje PHAmax – asistenti pedagoga
          </button>
          <ResultCard label="PHAmax – asistenti pedagoga celkem" value={totalPha} />
        </div>
      </section>
    </ZsModuleGate>
  );
}
