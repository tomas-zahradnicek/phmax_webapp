import { describe, expect, it } from "vitest";
import {
  isNamespacedStorageKey,
  NamespacedStorageAddressError,
  parseNamespacedStorageKey,
  serializeStorageAddress,
  type StorageAddress,
} from "./namespaced-storage-address";
import {
  NAMESPACED_STORAGE_NAMESPACE,
  NAMESPACED_STORAGE_SEPARATOR,
  NAMESPACED_STORAGE_V2_ROOT_PREFIX,
  NAMESPACED_STORAGE_VERSION_SEGMENT,
} from "./namespaced-storage-schema";

const SCHOOL_ID = "550e8400-e29b-41d4-a716-446655440000";
const SCHOOL_ID_UPPER = "550E8400-E29B-41D4-A716-446655440000";
const SCHOOL_ID_MIXED = "550e8400-E29B-41d4-A716-446655440000";
const YEAR_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const YEAR_ID_UPPER = "6BA7B810-9DAD-11D1-80B4-00C04FD430C8";
const YEAR_ID_MIXED = "6ba7b810-9DAD-11d1-80b4-00c04fd430c8";
const OTHER_SCHOOL_ID = "11111111-2222-4333-8444-555555555555";

function key(...segments: string[]): string {
  return [NAMESPACED_STORAGE_NAMESPACE, NAMESPACED_STORAGE_VERSION_SEGMENT, ...segments].join(
    NAMESPACED_STORAGE_SEPARATOR,
  );
}

const unboundScenarioLabel: StorageAddress = {
  version: 2,
  scope: { kind: "unbound" },
  moduleId: "phmax-scenario-label",
  resourceId: "value",
};

const schoolScenarioLabel: StorageAddress = {
  version: 2,
  scope: { kind: "school", schoolId: SCHOOL_ID },
  moduleId: "phmax-scenario-label",
  resourceId: "value",
};

const schoolYearAnnualReportMain: StorageAddress = {
  version: 2,
  scope: { kind: "schoolYear", schoolId: SCHOOL_ID, schoolYearId: YEAR_ID },
  moduleId: "annual-report",
  resourceId: "main",
};

describe("namespaced storage address (N1)", () => {
  it("A: canonical root prefix is exact", () => {
    expect(NAMESPACED_STORAGE_V2_ROOT_PREFIX).toBe("reditelsky-pruvodce:v2:");
  });

  it("B: serializes an unbound address", () => {
    expect(serializeStorageAddress(unboundScenarioLabel)).toBe(
      "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value",
    );
  });

  it("C: serializes a school-scoped address", () => {
    expect(serializeStorageAddress(schoolScenarioLabel)).toBe(
      `reditelsky-pruvodce:v2:school:${SCHOOL_ID}:module:phmax-scenario-label:resource:value`,
    );
  });

  it("D: serializes a school-year-scoped address", () => {
    expect(serializeStorageAddress(schoolYearAnnualReportMain)).toBe(
      `reditelsky-pruvodce:v2:school:${SCHOOL_ID}:year:${YEAR_ID}:module:annual-report:resource:main`,
    );
  });

  it("E: roundtrip unbound", () => {
    expect(parseNamespacedStorageKey(serializeStorageAddress(unboundScenarioLabel))).toEqual(
      unboundScenarioLabel,
    );
  });

  it("F: roundtrip school", () => {
    expect(parseNamespacedStorageKey(serializeStorageAddress(schoolScenarioLabel))).toEqual(
      schoolScenarioLabel,
    );
  });

  it("G: roundtrip schoolYear", () => {
    expect(
      parseNamespacedStorageKey(serializeStorageAddress(schoolYearAnnualReportMain)),
    ).toEqual(schoolYearAnnualReportMain);
  });

  it("G2: roundtrip holds for every resource of every module", () => {
    const address: StorageAddress = {
      version: 2,
      scope: { kind: "school", schoolId: OTHER_SCHOOL_ID },
      moduleId: "phmax-ss",
      resourceId: "framework-notes",
    };
    expect(parseNamespacedStorageKey(serializeStorageAddress(address))).toEqual(address);
  });

  it("H: rejects an invalid school UUID", () => {
    expect(
      parseNamespacedStorageKey(
        key("school", "not-a-uuid", "module", "phmax-scenario-label", "resource", "value"),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "school", schoolId: "not-a-uuid" },
        moduleId: "phmax-scenario-label",
        resourceId: "value",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H2: rejects a whitespace-padded UUID instead of repairing it", () => {
    expect(
      parseNamespacedStorageKey(
        key("school", ` ${SCHOOL_ID} `, "module", "phmax-scenario-label", "resource", "value"),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "school", schoolId: ` ${SCHOOL_ID} ` },
        moduleId: "phmax-scenario-label",
        resourceId: "value",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H3: accepts canonical lowercase schoolId", () => {
    expect(serializeStorageAddress(schoolScenarioLabel)).toContain(`school:${SCHOOL_ID}:`);
    expect(parseNamespacedStorageKey(serializeStorageAddress(schoolScenarioLabel))).toEqual(
      schoolScenarioLabel,
    );
  });

  it("H4: rejects uppercase schoolId", () => {
    expect(
      parseNamespacedStorageKey(
        key("school", SCHOOL_ID_UPPER, "module", "phmax-scenario-label", "resource", "value"),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "school", schoolId: SCHOOL_ID_UPPER },
        moduleId: "phmax-scenario-label",
        resourceId: "value",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H5: rejects mixed-case schoolId", () => {
    expect(
      parseNamespacedStorageKey(
        key("school", SCHOOL_ID_MIXED, "module", "phmax-scenario-label", "resource", "value"),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "school", schoolId: SCHOOL_ID_MIXED },
        moduleId: "phmax-scenario-label",
        resourceId: "value",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H6: rejects uppercase schoolYearId", () => {
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID,
          "year",
          YEAR_ID_UPPER,
          "module",
          "annual-report",
          "resource",
          "main",
        ),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "schoolYear", schoolId: SCHOOL_ID, schoolYearId: YEAR_ID_UPPER },
        moduleId: "annual-report",
        resourceId: "main",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H7: rejects mixed-case schoolYearId", () => {
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID,
          "year",
          YEAR_ID_MIXED,
          "module",
          "annual-report",
          "resource",
          "main",
        ),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "schoolYear", schoolId: SCHOOL_ID, schoolYearId: YEAR_ID_MIXED },
        moduleId: "annual-report",
        resourceId: "main",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H8: rejects noncanonical schoolId in schoolYear address", () => {
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID_UPPER,
          "year",
          YEAR_ID,
          "module",
          "annual-report",
          "resource",
          "main",
        ),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "schoolYear", schoolId: SCHOOL_ID_MIXED, schoolYearId: YEAR_ID },
        moduleId: "annual-report",
        resourceId: "main",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("H9: one domain identity produces exactly one accepted serialized key", () => {
    const canonicalKey = serializeStorageAddress(schoolScenarioLabel);
    expect(canonicalKey).toBe(
      `reditelsky-pruvodce:v2:school:${SCHOOL_ID}:module:phmax-scenario-label:resource:value`,
    );

    for (const aliasSchoolId of [SCHOOL_ID_UPPER, SCHOOL_ID_MIXED]) {
      expect(() =>
        serializeStorageAddress({
          version: 2,
          scope: { kind: "school", schoolId: aliasSchoolId },
          moduleId: "phmax-scenario-label",
          resourceId: "value",
        }),
      ).toThrow(NamespacedStorageAddressError);
    }

    expect(
      parseNamespacedStorageKey(
        key("school", SCHOOL_ID_UPPER, "module", "phmax-scenario-label", "resource", "value"),
      ),
    ).toBeNull();
  });

  it("I: rejects an invalid school year UUID", () => {
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID,
          "year",
          "2026",
          "module",
          "annual-report",
          "resource",
          "main",
        ),
      ),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "schoolYear", schoolId: SCHOOL_ID, schoolYearId: "2026" },
        moduleId: "annual-report",
        resourceId: "main",
      }),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("J: rejects a foreign prefix", () => {
    expect(
      parseNamespacedStorageKey(
        "some-other-app:v2:unbound:module:phmax-scenario-label:resource:value",
      ),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(
        "x:reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value",
      ),
    ).toBeNull();
  });

  it("K: rejects a wrong physical storage version", () => {
    for (const version of ["v1", "v3", "V2", "2", ""]) {
      expect(
        parseNamespacedStorageKey(
          [
            NAMESPACED_STORAGE_NAMESPACE,
            version,
            "unbound",
            "module",
            "phmax-scenario-label",
            "resource",
            "value",
          ].join(NAMESPACED_STORAGE_SEPARATOR),
        ),
      ).toBeNull();
    }
  });

  it("L: rejects an unknown module", () => {
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax-unknown", "resource", "value")),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "PHMAX-PV", "resource", "autosave")),
    ).toBeNull();
  });

  it("M: rejects an unknown resource", () => {
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax-pv", "resource", "unknown")),
    ).toBeNull();
  });

  it("N: rejects a valid resource under the wrong module", () => {
    expect(
      parseNamespacedStorageKey(
        key("unbound", "module", "phmax-pv", "resource", "framework-notes"),
      ),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax-scenario-label", "resource", "main")),
    ).toBeNull();
    expect(() =>
      serializeStorageAddress({
        version: 2,
        scope: { kind: "unbound" },
        moduleId: "phmax-pv",
        resourceId: "framework-notes",
      } as unknown as StorageAddress),
    ).toThrow(NamespacedStorageAddressError);
  });

  it("O: rejects a missing module segment", () => {
    expect(parseNamespacedStorageKey(key("unbound", "resource", "value"))).toBeNull();
    expect(
      parseNamespacedStorageKey(key("school", SCHOOL_ID, "resource", "value")),
    ).toBeNull();
  });

  it("P: rejects a missing resource segment", () => {
    expect(parseNamespacedStorageKey(key("unbound", "module", "phmax-scenario-label"))).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax-scenario-label", "resource")),
    ).toBeNull();
  });

  it("Q: rejects an extra segment", () => {
    expect(
      parseNamespacedStorageKey(
        key("unbound", "module", "phmax-scenario-label", "resource", "value", "extra"),
      ),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID,
          "year",
          YEAR_ID,
          "module",
          "annual-report",
          "resource",
          "main",
          "extra",
        ),
      ),
    ).toBeNull();
  });

  it("Q2: rejects a duplicated segment pair", () => {
    expect(
      parseNamespacedStorageKey(
        key(
          "unbound",
          "module",
          "phmax-scenario-label",
          "module",
          "phmax-scenario-label",
          "resource",
          "value",
        ),
      ),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID,
          "school",
          OTHER_SCHOOL_ID,
          "module",
          "phmax-scenario-label",
          "resource",
          "value",
        ),
      ),
    ).toBeNull();
  });

  it("R: rejects a wrong segment order", () => {
    expect(
      parseNamespacedStorageKey(key("unbound", "resource", "value", "module", "phmax-scenario-label")),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(
        key("year", YEAR_ID, "school", SCHOOL_ID, "module", "annual-report", "resource", "main"),
      ),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(
        key("module", "phmax-scenario-label", "resource", "value", "unbound"),
      ),
    ).toBeNull();
  });

  it("S: rejects an empty segment", () => {
    expect(
      parseNamespacedStorageKey(key("school", "", "module", "phmax-scenario-label", "resource", "value")),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "", "resource", "value")),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax-scenario-label", "resource", "")),
    ).toBeNull();
  });

  it("T: rejects a trailing separator", () => {
    expect(
      parseNamespacedStorageKey(
        `${serializeStorageAddress(unboundScenarioLabel)}${NAMESPACED_STORAGE_SEPARATOR}`,
      ),
    ).toBeNull();
    expect(parseNamespacedStorageKey(NAMESPACED_STORAGE_V2_ROOT_PREFIX)).toBeNull();
  });

  it("U: rejects colon injection and encoded pseudo segments", () => {
    expect(
      parseNamespacedStorageKey(
        key("unbound", "module", "phmax-pv:resource:autosave:module:phmax-zs", "resource", "value"),
      ),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax%3Apv", "resource", "autosave")),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "phmax-pv", "resource", "auto%2Dsave")),
    ).toBeNull();
  });

  it("U2: rejects non-string input", () => {
    for (const value of [null, undefined, 42, {}, [], true]) {
      expect(parseNamespacedStorageKey(value)).toBeNull();
    }
  });

  it("V: scenario label accepts unbound scope", () => {
    expect(isNamespacedStorageKey(serializeStorageAddress(unboundScenarioLabel))).toBe(true);
  });

  it("W: scenario label accepts school scope", () => {
    expect(isNamespacedStorageKey(serializeStorageAddress(schoolScenarioLabel))).toBe(true);
  });

  it("X: scenario label rejects schoolYear scope", () => {
    const yearScoped: StorageAddress = {
      version: 2,
      scope: { kind: "schoolYear", schoolId: SCHOOL_ID, schoolYearId: YEAR_ID },
      moduleId: "phmax-scenario-label",
      resourceId: "value",
    };
    expect(() => serializeStorageAddress(yearScoped)).toThrow(NamespacedStorageAddressError);
    expect(
      parseNamespacedStorageKey(
        key(
          "school",
          SCHOOL_ID,
          "year",
          YEAR_ID,
          "module",
          "phmax-scenario-label",
          "resource",
          "value",
        ),
      ),
    ).toBeNull();
  });

  it("X2: annual report main rejects plain school scope", () => {
    expect(
      parseNamespacedStorageKey(
        key("school", SCHOOL_ID, "module", "annual-report", "resource", "main"),
      ),
    ).toBeNull();
  });

  it("Y: Identity Registry and AppContext keys are rejected", () => {
    for (const platformKey of [
      "reditelsky-pruvodce-identity-registry-v1",
      "reditelsky-pruvodce-app-context-v1",
    ]) {
      expect(parseNamespacedStorageKey(platformKey)).toBeNull();
    }
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "identity-registry", "resource", "value")),
    ).toBeNull();
    expect(
      parseNamespacedStorageKey(key("unbound", "module", "app-context", "resource", "value")),
    ).toBeNull();
  });

  it("Z: existing legacy flat storage keys are rejected", () => {
    const legacyKeys = [
      "reditelsky-pruvodce-school-profile-v1",
      "edu-cz-pv-calculator-state",
      "edu-cz-pv-named-snapshots-v1",
      "edu-cz-sd-calculator-state",
      "edu-cz-zs-calculator-state",
      "edu-cz-zs-named-snapshots-v1",
      "phmax-ss-units-draft",
      "phmax-ss-named-snapshots-v1",
      "phmax-ss-framework-phase1-notes",
      "edu-cz-nv75-deputy-bank-state",
      "edu-cz-nv75-deputy-bank-named-snapshots",
      "phmax-school-scenario-label",
      "vyrocni-zprava-state-v1",
      "vyrocni-zprava-personnel-data-v1",
      "vyrocni-zprava-section01-data-v1",
      "vyrocni-zprava-diagnostic-backup-v1:2026-08-09T00:00:00.000Z",
      "phmax-dash-last-visit-pv",
      "phmax-is-handoff-endpoint",
    ];
    for (const legacyKey of legacyKeys) {
      expect(parseNamespacedStorageKey(legacyKey)).toBeNull();
    }
  });

  it("AA: address primitives never call a storage API", () => {
    const calls: string[] = [];
    const fake = {
      get length() {
        calls.push("length");
        return 0;
      },
      key: () => {
        calls.push("key");
        return null;
      },
      getItem: () => {
        calls.push("getItem");
        return null;
      },
      setItem: () => calls.push("setItem"),
      removeItem: () => calls.push("removeItem"),
      clear: () => calls.push("clear"),
    };

    const globalScope = globalThis as unknown as Record<string, unknown>;
    const hadLocal = "localStorage" in globalScope;
    const hadSession = "sessionStorage" in globalScope;
    const previousLocal = globalScope.localStorage;
    const previousSession = globalScope.sessionStorage;
    globalScope.localStorage = fake;
    globalScope.sessionStorage = fake;

    try {
      for (const address of [
        unboundScenarioLabel,
        schoolScenarioLabel,
        schoolYearAnnualReportMain,
      ]) {
        parseNamespacedStorageKey(serializeStorageAddress(address));
      }
      parseNamespacedStorageKey("edu-cz-pv-calculator-state");
    } finally {
      if (hadLocal) globalScope.localStorage = previousLocal;
      else delete globalScope.localStorage;
      if (hadSession) globalScope.sessionStorage = previousSession;
      else delete globalScope.sessionStorage;
    }

    expect(calls).toEqual([]);
  });
});
