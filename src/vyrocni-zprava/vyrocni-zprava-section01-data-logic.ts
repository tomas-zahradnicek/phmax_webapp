import type { SchoolProfile } from "../school-profile/school-profile-types";
import type { VyrocniZpravaSection01Data } from "./vyrocni-zprava-section01-types";

export const VYROCNI_ZPRAVA_SECTION01_LS_KEY = "vyrocni-zprava-section01-data-v1";

const REQUIRED_PROFILE_FIELDS: { key: keyof SchoolProfile; label: string }[] = [
  { key: "name", label: "Název školy" },
  { key: "address", label: "Sídlo školy" },
  { key: "municipality", label: "Obec" },
  { key: "region", label: "Kraj" },
  { key: "founder", label: "Zřizovatel" },
  { key: "principalName", label: "Ředitel školy" },
  { key: "website", label: "Web školy" },
  { key: "email", label: "E-mail školy" },
  { key: "schoolType", label: "Typ školy" },
];

const RECOMMENDED_PROFILE_FIELDS: { key: keyof SchoolProfile; label: string }[] = [
  { key: "ico", label: "IČO" },
  { key: "redIzo", label: "RED IZO" },
  { key: "izo", label: "IZO" },
  { key: "phone", label: "Telefon" },
  { key: "dataBox", label: "Datová schránka" },
];

const RECOMMENDED_SECTION_FIELDS: { key: keyof VyrocniZpravaSection01Data; label: string }[] = [
  { key: "schoolCouncilInfo", label: "Údaje o školské radě" },
  { key: "schoolCharacteristic", label: "Charakteristika školy" },
  { key: "schoolParts", label: "Součásti školy" },
  { key: "schoolCapacity", label: "Kapacita školy" },
];

export type Section01Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? pickFilledString(value) : undefined;
}

export function createDefaultSection01Data(): VyrocniZpravaSection01Data {
  return {
    schoolCharacteristic: "",
    schoolParts: "",
    schoolCapacity: "",
    schoolCouncilInfo: "",
    leadershipInfo: "",
    remoteAccessInfo: "",
  };
}

export function normalizeSection01Data(raw: unknown): VyrocniZpravaSection01Data | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    schoolCharacteristic: sanitizeOptionalText(o.schoolCharacteristic) ?? "",
    schoolParts: sanitizeOptionalText(o.schoolParts) ?? "",
    schoolCapacity: sanitizeOptionalText(o.schoolCapacity) ?? "",
    schoolCouncilInfo: sanitizeOptionalText(o.schoolCouncilInfo) ?? "",
    leadershipInfo: sanitizeOptionalText(o.leadershipInfo) ?? "",
    remoteAccessInfo: sanitizeOptionalText(o.remoteAccessInfo) ?? "",
  };
}

export function getSection01Readiness(params: {
  schoolProfile: SchoolProfile;
  section01Data: VyrocniZpravaSection01Data;
}): Section01Readiness {
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];

  for (const field of REQUIRED_PROFILE_FIELDS) {
    const value = pickFilledString(params.schoolProfile[field.key]);
    if (value) {
      availableData.push(`${field.label}: ${value}`);
    } else {
      missingData.push(field.label);
    }
  }

  for (const field of RECOMMENDED_PROFILE_FIELDS) {
    const value = pickFilledString(params.schoolProfile[field.key]);
    if (value) {
      availableData.push(`${field.label}: ${value}`);
    } else {
      recommendedData.push(field.label);
    }
  }

  for (const field of RECOMMENDED_SECTION_FIELDS) {
    const value = pickFilledString(params.section01Data[field.key]);
    if (value) {
      availableData.push(`${field.label}: ${value}`);
    } else {
      recommendedData.push(field.label);
    }
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
  };
}
