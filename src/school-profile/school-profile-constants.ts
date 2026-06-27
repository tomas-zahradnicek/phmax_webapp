import type { SchoolProfileFieldKey } from "./school-profile-types";
import { SCHOOL_TYPE_SELECT_OPTIONS } from "./school-profile-school-type";

export const SCHOOL_PROFILE_LS_KEY = "reditelsky-pruvodce-school-profile-v1";

export const SCHOOL_PROFILE_SCHOOL_TYPES = [
  ...SCHOOL_TYPE_SELECT_OPTIONS.map((item) => item.label),
] as const;

export const SCHOOL_PROFILE_KRAJE = [
  "Hlavní město Praha",
  "Středočeský",
  "Jihočeský",
  "Plzeňský",
  "Karlovarský",
  "Ústecký",
  "Liberecký",
  "Královéhradecký",
  "Pardubický",
  "Vysočina",
  "Jihomoravský",
  "Olomoucký",
  "Zlínský",
  "Moravskoslezský",
] as const;

/** Povinná pole profilu školy pro kapitolu 01 výroční zprávy. */
export const SCHOOL_PROFILE_SECTION_01_REQUIRED_FIELDS: SchoolProfileFieldKey[] = [
  "name",
  "ico",
  "redIzo",
  "address",
  "municipality",
  "region",
  "founder",
  "principalName",
  "website",
  "email",
  "schoolType",
];

export const SCHOOL_PROFILE_FIELD_LABELS: Record<SchoolProfileFieldKey, string> = {
  name: "Název školy",
  ico: "IČO",
  redIzo: "RED IZO",
  izo: "IZO",
  schoolType: "Typ školy",
  address: "Sídlo školy",
  municipality: "Obec",
  region: "Kraj",
  founder: "Zřizovatel",
  principalName: "Ředitel školy",
  website: "Web školy",
  email: "E-mail školy",
  phone: "Telefon",
  dataBox: "Datová schránka",
};
