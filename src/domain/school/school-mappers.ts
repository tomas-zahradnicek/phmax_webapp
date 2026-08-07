import type { SchoolProfile } from "../../school-profile/school-profile-types";
import { DOMAIN_DATA_SCHEMA_VERSION } from "../shared/data-schema-version";
import type { School } from "./school-types";

/**
 * Map persisted SchoolProfile into the domain School model.
 * Does not touch localStorage. Does not alter existing field values.
 */
export function fromSchoolProfile(profile: SchoolProfile): School {
  return {
    id: profile.id,
    schemaVersion: DOMAIN_DATA_SCHEMA_VERSION,
    name: profile.name,
    ico: profile.ico,
    redIzo: profile.redIzo,
    izo: profile.izo,
    schoolType: profile.schoolType,
    address: profile.address,
    municipality: profile.municipality,
    region: profile.region,
    founder: profile.founder,
    principalName: profile.principalName,
    website: profile.website,
    email: profile.email,
    phone: profile.phone,
    dataBox: profile.dataBox,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Map domain School back to SchoolProfile for existing UI / storage shapes.
 * Drops schemaVersion only; all shared field values are preserved as-is.
 */
export function toSchoolProfile(school: School): SchoolProfile {
  return {
    id: school.id,
    name: school.name,
    ico: school.ico,
    redIzo: school.redIzo,
    izo: school.izo,
    schoolType: school.schoolType,
    address: school.address,
    municipality: school.municipality,
    region: school.region,
    founder: school.founder,
    principalName: school.principalName,
    website: school.website,
    email: school.email,
    phone: school.phone,
    dataBox: school.dataBox,
    createdAt: school.createdAt,
    updatedAt: school.updatedAt,
  };
}
