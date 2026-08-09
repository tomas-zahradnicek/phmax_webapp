import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import { parseNamespacedStorageKey } from "../namespaced-storage-address";
import { NAMESPACED_STORAGE_V2_ROOT_PREFIX } from "../namespaced-storage-schema";
import { parseScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import {
  isScenarioLabelN3FenceKey,
  parseScenarioLabelN3FenceKey,
  SCENARIO_LABEL_N3_FENCE_KEY_ROOT_PREFIX,
  serializeScenarioLabelN3FenceKey,
  ScenarioLabelN3FenceKeyError,
} from "./scenario-label-n3-fence-key";

const SCHOOL_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;
const SCHOOL_UPPER = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";
const SCHOOL_MIXED = "aAaAaAaA-BbBb-4CcC-8DdD-EeEeEeEeEeEe";

describe("N3-FENCE-PROTO key grammar", () => {
  it("K1: canonical school key roundtrip", () => {
    const key = serializeScenarioLabelN3FenceKey({ kind: "school", schoolId: SCHOOL_ID });
    expect(key).toBe(
      `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${SCHOOL_ID}`,
    );
    expect(parseScenarioLabelN3FenceKey(key)).toEqual({ kind: "school", schoolId: SCHOOL_ID });
    expect(isScenarioLabelN3FenceKey(key)).toBe(true);
  });

  it("K2: uppercase schoolId reject (serialize + parse)", () => {
    expect(() =>
      serializeScenarioLabelN3FenceKey({
        kind: "school",
        schoolId: SCHOOL_UPPER as EntityId,
      }),
    ).toThrow(ScenarioLabelN3FenceKeyError);
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${SCHOOL_UPPER}`,
      ),
    ).toBeNull();
  });

  it("K3: mixed-case schoolId reject", () => {
    expect(() =>
      serializeScenarioLabelN3FenceKey({
        kind: "school",
        schoolId: SCHOOL_MIXED as EntityId,
      }),
    ).toThrow(ScenarioLabelN3FenceKeyError);
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${SCHOOL_MIXED}`,
      ),
    ).toBeNull();
  });

  it("K4: whitespace schoolId reject", () => {
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school: ${SCHOOL_ID} `,
      ),
    ).toBeNull();
  });

  it("K5: unbound reject", () => {
    expect(
      parseScenarioLabelN3FenceKey(
        "reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:unbound",
      ),
    ).toBeNull();
  });

  it("K6: schoolYear / year segment impossible/reject", () => {
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:year:2024-25:school:${SCHOOL_ID}`,
      ),
    ).toBeNull();
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:schoolYear:${SCHOOL_ID}`,
      ),
    ).toBeNull();
  });

  it("K7: unknown resource reject", () => {
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:main:school:${SCHOOL_ID}`,
      ),
    ).toBeNull();
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-pv:value:school:${SCHOOL_ID}`,
      ),
    ).toBeNull();
  });

  it("K8: extra segments / empty segments reject", () => {
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${SCHOOL_ID}:extra`,
      ),
    ).toBeNull();
    expect(
      parseScenarioLabelN3FenceKey(
        `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:`,
      ),
    ).toBeNull();
  });

  it("K9: fence key is not StorageAddress and not migration marker", () => {
    const key = serializeScenarioLabelN3FenceKey({ kind: "school", schoolId: SCHOOL_ID });
    expect(parseNamespacedStorageKey(key)).toBeNull();
    expect(parseScenarioLabelMigrationMarkerKey(key)).toBeNull();
  });

  it("K10: fence key under Full Reset v2 root prefix", () => {
    const key = serializeScenarioLabelN3FenceKey({ kind: "school", schoolId: SCHOOL_ID });
    expect(key.startsWith(NAMESPACED_STORAGE_V2_ROOT_PREFIX)).toBe(true);
    expect(key.startsWith(SCENARIO_LABEL_N3_FENCE_KEY_ROOT_PREFIX)).toBe(true);
    expect(SCENARIO_LABEL_N3_FENCE_KEY_ROOT_PREFIX.startsWith(NAMESPACED_STORAGE_V2_ROOT_PREFIX)).toBe(
      true,
    );
  });
});
