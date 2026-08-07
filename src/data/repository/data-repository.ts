import type { EntityId } from "../../domain/shared/entity-id";
import type { School } from "../../domain/school/school-types";
import type { SchoolYear } from "../../domain/school-year/school-year-types";

/**
 * Read-oriented persistence port for School / SchoolYear domain entities.
 * Write APIs and module records are intentionally out of scope (YAGNI / PR 0C).
 */
export interface DataRepository {
  getSchool(id: EntityId): Promise<School | null>;
  getSchoolYear(id: EntityId): Promise<SchoolYear | null>;
  listSchoolYears(schoolId: EntityId): Promise<SchoolYear[]>;
}

export class DataRepositoryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DataRepositoryError";
    this.code = code;
  }
}
