import { loadSchoolProfileFromStorage } from "./school-profile-storage";
import type { SchoolProfile } from "./school-profile-types";

export type SchoolProfileExportData = {
  name: string;
  ico: string;
  redIzo: string;
  izo: string;
  schoolType: string;
  address: string;
  municipality: string;
  region: string;
  founder: string;
  principalName: string;
  website: string;
  email: string;
  phone: string;
  dataBox: string;
};

export function getSchoolProfileForExport(profile?: SchoolProfile): SchoolProfileExportData {
  const source = profile ?? loadSchoolProfileFromStorage();
  return {
    name: source.name,
    ico: source.ico,
    redIzo: source.redIzo,
    izo: source.izo,
    schoolType: source.schoolType,
    address: source.address,
    municipality: source.municipality,
    region: source.region,
    founder: source.founder,
    principalName: source.principalName,
    website: source.website,
    email: source.email,
    phone: source.phone,
    dataBox: source.dataBox,
  };
}
