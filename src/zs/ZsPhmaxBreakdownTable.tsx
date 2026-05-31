import React from "react";
import { ScrollGrabRegion } from "../ScrollGrabRegion";
import { ZsLegisRef } from "../PhmaxProductLegisUi";

export type ZsPhmaxBreakdownTableProps = {
  basicPhmax: number;
  inclPhmax: number;
  psychPhmax: number;
  healthPhmax: number;
  minorityPhmax: number;
  gymPhmax: number;
  mixedForTotal: number;
  specialPhmax: number;
  prepClassPhmax: number;
  prepSpecialPhmax: number;
  par38Phmax: number;
  par41Phmax: number;
  totalPhmax: number;
};

export function ZsPhmaxBreakdownTable({
  basicPhmax,
  inclPhmax,
  psychPhmax,
  healthPhmax,
  minorityPhmax,
  gymPhmax,
  mixedForTotal,
  specialPhmax,
  prepClassPhmax,
  prepSpecialPhmax,
  par38Phmax,
  par41Phmax,
  totalPhmax,
}: ZsPhmaxBreakdownTableProps) {
  return (
    <details className="subcard sd-phmax-breakdown-wrap" style={{ marginTop: 18 }}>
      <summary className="section-title" style={{ fontSize: "1.02rem", cursor: "pointer" }}>
        Rozpad / ověřovací tabulka PHmax
      </summary>
      <p className="muted-text" style={{ marginTop: 10, marginBottom: 12, fontSize: "0.86rem", lineHeight: 1.5 }}>
        Dílčí částky odpovídají kartám v souhrnu výše; součet řádků (včetně nul) má dát stejný výsledek jako „Výsledek
        PHmax“. Užitečné pro kontrolu výkazu a metodiky.
      </p>
      <ScrollGrabRegion className="sd-phmax-breakdown-scroll sd-phmax-breakdown-scroll--compact">
        <table className="sd-phmax-breakdown">
          <thead>
            <tr>
              <th scope="col">Položka</th>
              <th scope="col" className="sd-phmax-breakdown__head-num">
                Hodnota (h/týd.)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                Běžné třídy
              </th>
              <td className="sd-phmax-breakdown__num">{basicPhmax}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                <ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" />
              </th>
              <td className="sd-phmax-breakdown__num">{inclPhmax}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                Škola při psychiatrické nemocnici
              </th>
              <td className="sd-phmax-breakdown__num">{psychPhmax}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                ZŠ při zdrav. zař. (B11–B13)
              </th>
              <td className="sd-phmax-breakdown__num">{healthPhmax}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                Jazyk menšiny
              </th>
              <td className="sd-phmax-breakdown__num">{minorityPhmax}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                Víceletá gymnázia
              </th>
              <td className="sd-phmax-breakdown__num">{gymPhmax}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                Smíšené třídy
              </th>
              <td className="sd-phmax-breakdown__num">{mixedForTotal}</td>
            </tr>
            <tr>
              <th scope="row" className="sd-phmax-breakdown__label">
                ZŠ speciální
              </th>
              <td className="sd-phmax-breakdown__num">{specialPhmax}</td>
            </tr>
            {prepClassPhmax > 0 ? (
              <tr>
                <th scope="row" className="sd-phmax-breakdown__label">
                  Samostatné – přípravná třída
                </th>
                <td className="sd-phmax-breakdown__num">{prepClassPhmax}</td>
              </tr>
            ) : null}
            {prepSpecialPhmax > 0 ? (
              <tr>
                <th scope="row" className="sd-phmax-breakdown__label">
                  Samostatné – přípravný stupeň ZŠS
                </th>
                <td className="sd-phmax-breakdown__num">{prepSpecialPhmax}</td>
              </tr>
            ) : null}
            {par38Phmax > 0 ? (
              <tr>
                <th scope="row" className="sd-phmax-breakdown__label">
                  Samostatné – <ZsLegisRef citeId="zs-par38" label="§ 38" />
                </th>
                <td className="sd-phmax-breakdown__num">{par38Phmax}</td>
              </tr>
            ) : null}
            {par41Phmax > 0 ? (
              <tr>
                <th scope="row" className="sd-phmax-breakdown__label">
                  Samostatné – <ZsLegisRef citeId="zs-par41" label="§ 41" />
                </th>
                <td className="sd-phmax-breakdown__num">{par41Phmax}</td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="sd-phmax-breakdown__total">
              <th scope="row">Výsledek PHmax (součet modulu)</th>
              <td className="sd-phmax-breakdown__num">{totalPhmax}</td>
            </tr>
          </tfoot>
        </table>
      </ScrollGrabRegion>
    </details>
  );
}
