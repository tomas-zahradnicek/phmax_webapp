import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection01Readiness, type Section01Readiness } from "./vyrocni-zprava-section01-data-logic";
import type { VyrocniZpravaSection01Data } from "./vyrocni-zprava-section01-types";
import { formatSchoolTypeForReport } from "./vyrocni-zprava-text-formatting-helpers";

export type Section01ProfileInput = {
  name?: string;
  ico?: string;
  redIzo?: string;
  izo?: string;
  address?: string;
  municipality?: string;
  region?: string;
  founder?: string;
  principalName?: string;
  website?: string;
  email?: string;
  phone?: string;
  dataBox?: string;
  schoolType?: string;
};

export type Section01OptionalInputs = {
  schoolCharacteristic?: string;
  schoolParts?: string;
  schoolCapacity?: string;
  materialTechnicalConditions?: string;
  schoolCouncilInfo?: string;
  leadershipInfo?: string;
  remoteAccessInfo?: string;
};

export type Section01GeneratorInput = {
  schoolYear: string;
  schoolProfile: Section01ProfileInput;
  sectionInputs: Section01OptionalInputs;
  missingData: string[];
  recommendedData: string[];
  readiness: Section01Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildProfileInput(profile: SchoolProfile): Section01ProfileInput {
  const input: Section01ProfileInput = {};
  const name = pickFilledString(profile.name);
  const ico = pickFilledString(profile.ico);
  const redIzo = pickFilledString(profile.redIzo);
  const izo = pickFilledString(profile.izo);
  const address = pickFilledString(profile.address);
  const municipality = pickFilledString(profile.municipality);
  const region = pickFilledString(profile.region);
  const founder = pickFilledString(profile.founder);
  const principalName = pickFilledString(profile.principalName);
  const website = pickFilledString(profile.website);
  const email = pickFilledString(profile.email);
  const phone = pickFilledString(profile.phone);
  const dataBox = pickFilledString(profile.dataBox);
  const schoolType = pickFilledString(profile.schoolType);

  if (name) input.name = name;
  if (ico) input.ico = ico;
  if (redIzo) input.redIzo = redIzo;
  if (izo) input.izo = izo;
  if (address) input.address = address;
  if (municipality) input.municipality = municipality;
  if (region) input.region = region;
  if (founder) input.founder = founder;
  if (principalName) input.principalName = principalName;
  if (website) input.website = website;
  if (email) input.email = email;
  if (phone) input.phone = phone;
  if (dataBox) input.dataBox = dataBox;
  if (schoolType) input.schoolType = formatSchoolTypeForReport(schoolType) ?? schoolType;

  return input;
}

function buildSectionInputs(section01Data: VyrocniZpravaSection01Data): Section01OptionalInputs {
  const input: Section01OptionalInputs = {};
  const schoolCharacteristic = pickFilledString(section01Data.schoolCharacteristic);
  const schoolParts = pickFilledString(section01Data.schoolParts);
  const schoolCapacity = pickFilledString(section01Data.schoolCapacity);
  const materialTechnicalConditions = pickFilledString(section01Data.materialTechnicalConditions);
  const schoolCouncilInfo = pickFilledString(section01Data.schoolCouncilInfo);
  const leadershipInfo = pickFilledString(section01Data.leadershipInfo);
  const remoteAccessInfo = pickFilledString(section01Data.remoteAccessInfo);

  if (schoolCharacteristic) input.schoolCharacteristic = schoolCharacteristic;
  if (schoolParts) input.schoolParts = schoolParts;
  if (schoolCapacity) input.schoolCapacity = schoolCapacity;
  if (materialTechnicalConditions) input.materialTechnicalConditions = materialTechnicalConditions;
  if (schoolCouncilInfo) input.schoolCouncilInfo = schoolCouncilInfo;
  if (leadershipInfo) input.leadershipInfo = leadershipInfo;
  if (remoteAccessInfo) input.remoteAccessInfo = remoteAccessInfo;

  return input;
}

/** Sestaví validovaný vstup pro generování kapitoly 01 – bez vymýšlení chybějících hodnot. */
export function buildSection01GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  sectionInputs: VyrocniZpravaSection01Data;
}): Section01GeneratorInput {
  const readiness = getSection01Readiness({
    schoolProfile: params.schoolProfile,
    section01Data: params.sectionInputs,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    schoolProfile: buildProfileInput(params.schoolProfile),
    sectionInputs: buildSectionInputs(params.sectionInputs),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    readiness: readiness.status,
  };
}

export { getSection01Readiness };
