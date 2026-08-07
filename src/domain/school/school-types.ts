import type { EntityId } from "../shared/entity-id";
import type { DataSchemaVersion } from "../shared/data-schema-version";

/**
 * Global school identity (not tied to a school year).
 * Field set mirrors SchoolProfile plus domain schemaVersion.
 */
export type School = {
  id: EntityId;
  schemaVersion: DataSchemaVersion;
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
  createdAt: string;
  updatedAt: string;
};
