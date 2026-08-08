import React from "react";
import type { AnnualReportPublicationBlock, SchoolProfile } from "./vyrocni-zprava-types";
import { VYROCNI_ZPRAVA_KRAJE } from "./vyrocni-zprava-types";
import {
  getSchoolTypeSelectValue,
  type SchoolTypeCode,
  SCHOOL_TYPE_SELECT_OPTIONS,
  toSchoolTypeStorageValue,
} from "../school-profile/school-profile-school-type";

type VyrocniZpravaSetupFormProps = {
  schoolYear: string;
  schoolProfile: SchoolProfile;
  publicationBlock?: AnnualReportPublicationBlock;
  onSchoolYearChange: (value: string) => void;
  onSchoolProfileChange: (patch: Partial<SchoolProfile>) => void;
  onPublicationBlockChange: (patch: Partial<AnnualReportPublicationBlock>) => void;
};

function SetupField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="vyrocni-zprava-field" htmlFor={id}>
      <span className="vyrocni-zprava-field__label">{label}</span>
      {children}
    </label>
  );
}

export function VyrocniZpravaSetupForm({
  schoolYear,
  schoolProfile,
  publicationBlock,
  onSchoolYearChange,
  onSchoolProfileChange,
  onPublicationBlockChange,
}: VyrocniZpravaSetupFormProps) {
  return (
    <section className="card section-card section-card--setup vyrocni-zprava-setup" aria-labelledby="vyrocni-zprava-setup-title">
      <h2 id="vyrocni-zprava-setup-title" className="section-title">
        Nastavení výroční zprávy
      </h2>
      <p className="muted-text vyrocni-zprava-setup__lead">
        Školní rok patří k výroční zprávě. Identifikační údaje školy se ukládají do sdíleného profilu školy a používají ve všech modulech.
      </p>

      <div className="vyrocni-zprava-setup__grid">
        <SetupField id="vz-skolni-rok" label="Školní rok">
          <input
            id="vz-skolni-rok"
            className="input"
            type="text"
            value={schoolYear}
            onChange={(e) => onSchoolYearChange(e.target.value)}
            placeholder="např. 2026/2027"
          />
        </SetupField>

        <SetupField id="vz-typ-skoly" label="Typ školy">
          <select
            id="vz-typ-skoly"
            className="input"
            value={getSchoolTypeSelectValue(schoolProfile.schoolType)}
            onChange={(e) => onSchoolProfileChange({ schoolType: toSchoolTypeStorageValue(e.target.value as SchoolTypeCode) })}
          >
            {SCHOOL_TYPE_SELECT_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </SetupField>

        <SetupField id="vz-nazev-skoly" label="Název školy">
          <input
            id="vz-nazev-skoly"
            className="input"
            type="text"
            value={schoolProfile.name}
            onChange={(e) => onSchoolProfileChange({ name: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-ico" label="IČO">
          <input
            id="vz-ico"
            className="input"
            type="text"
            inputMode="numeric"
            value={schoolProfile.ico}
            onChange={(e) => onSchoolProfileChange({ ico: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-red-izo" label="RED IZO">
          <input
            id="vz-red-izo"
            className="input"
            type="text"
            value={schoolProfile.redIzo}
            onChange={(e) => onSchoolProfileChange({ redIzo: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-izo" label="IZO">
          <input
            id="vz-izo"
            className="input"
            type="text"
            value={schoolProfile.izo}
            onChange={(e) => onSchoolProfileChange({ izo: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-sidlo" label="Sídlo školy">
          <input
            id="vz-sidlo"
            className="input"
            type="text"
            value={schoolProfile.address}
            onChange={(e) => onSchoolProfileChange({ address: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-obec" label="Obec">
          <input
            id="vz-obec"
            className="input"
            type="text"
            value={schoolProfile.municipality}
            onChange={(e) => onSchoolProfileChange({ municipality: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-kraj" label="Kraj">
          <select
            id="vz-kraj"
            className="input"
            value={schoolProfile.region}
            onChange={(e) => onSchoolProfileChange({ region: e.target.value })}
          >
            <option value="">— vyberte kraj —</option>
            {VYROCNI_ZPRAVA_KRAJE.map((kraj) => (
              <option key={kraj} value={kraj}>
                {kraj}
              </option>
            ))}
          </select>
        </SetupField>

        <SetupField id="vz-zrizovatel" label="Zřizovatel">
          <input
            id="vz-zrizovatel"
            className="input"
            type="text"
            value={schoolProfile.founder}
            onChange={(e) => onSchoolProfileChange({ founder: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-reditel" label="Ředitel školy">
          <input
            id="vz-reditel"
            className="input"
            type="text"
            value={schoolProfile.principalName}
            onChange={(e) => onSchoolProfileChange({ principalName: e.target.value })}
          />
        </SetupField>

        <SetupField id="vz-web" label="Web školy">
          <input
            id="vz-web"
            className="input"
            type="url"
            value={schoolProfile.website}
            onChange={(e) => onSchoolProfileChange({ website: e.target.value })}
            placeholder="https://"
          />
        </SetupField>

        <SetupField id="vz-email" label="E-mail školy">
          <input
            id="vz-email"
            className="input"
            type="email"
            value={schoolProfile.email}
            onChange={(e) => onSchoolProfileChange({ email: e.target.value })}
          />
        </SetupField>
      </div>

      <div className="vyrocni-zprava-setup__subsection">
        <h3 className="vyrocni-zprava-setup__subtitle">Schválení a zveřejnění (volitelné)</h3>
        <p className="muted-text">
          Tyto údaje se zobrazí u titulní strany ve Word exportu. Nevyplněná pole se do exportu nepromítnou a neovlivňují připravenost kapitol.
        </p>
        <div className="vyrocni-zprava-setup__grid">
          <SetupField id="vz-projednano-pr" label="Projednáno pedagogickou radou dne">
            <input
              id="vz-projednano-pr"
              className="input"
              type="text"
              value={publicationBlock?.discussedByPedagogicalCouncilDate ?? ""}
              onChange={(e) => onPublicationBlockChange({ discussedByPedagogicalCouncilDate: e.target.value })}
              placeholder="např. 15. 6. 2025"
            />
          </SetupField>
          <SetupField id="vz-schvaleno-sr" label="Schváleno školskou radou dne">
            <input
              id="vz-schvaleno-sr"
              className="input"
              type="text"
              value={publicationBlock?.approvedBySchoolCouncilDate ?? ""}
              onChange={(e) => onPublicationBlockChange({ approvedBySchoolCouncilDate: e.target.value })}
            />
          </SetupField>
          <SetupField id="vz-zaslano-zrizovateli" label="Zasláno zřizovateli dne">
            <input
              id="vz-zaslano-zrizovateli"
              className="input"
              type="text"
              value={publicationBlock?.sentToFounderDate ?? ""}
              onChange={(e) => onPublicationBlockChange({ sentToFounderDate: e.target.value })}
            />
          </SetupField>
          <SetupField id="vz-zverejneno" label="Zveřejněno způsobem umožňujícím dálkový přístup dne">
            <input
              id="vz-zverejneno"
              className="input"
              type="text"
              value={publicationBlock?.publishedRemotelyDate ?? ""}
              onChange={(e) => onPublicationBlockChange({ publishedRemotelyDate: e.target.value })}
            />
          </SetupField>
          <SetupField id="vz-misto-datum" label="Místo a datum">
            <input
              id="vz-misto-datum"
              className="input"
              type="text"
              value={publicationBlock?.placeAndDate ?? ""}
              onChange={(e) => onPublicationBlockChange({ placeAndDate: e.target.value })}
              placeholder="např. Praha, 20. 6. 2025"
            />
          </SetupField>
          <SetupField id="vz-reditel-podpis" label="Ředitel/ka školy">
            <input
              id="vz-reditel-podpis"
              className="input"
              type="text"
              value={publicationBlock?.principalSignature ?? ""}
              onChange={(e) => onPublicationBlockChange({ principalSignature: e.target.value })}
              placeholder="např. Mgr. Jan Novák"
            />
          </SetupField>
          <SetupField id="vz-predseda-sr" label="Předseda/předsedkyně školské rady">
            <input
              id="vz-predseda-sr"
              className="input"
              type="text"
              value={publicationBlock?.schoolCouncilChairSignature ?? ""}
              onChange={(e) => onPublicationBlockChange({ schoolCouncilChairSignature: e.target.value })}
              placeholder="např. Ing. Alena Králová"
            />
          </SetupField>
        </div>
      </div>
    </section>
  );
}
