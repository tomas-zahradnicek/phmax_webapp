import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAppBackupEnvelope } from "../../../backup/backup-export";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";

describe("scenario-label backup N2-WRITE contracts", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("AM/AN/AO: backup payload unchanged; zero writes; schemaVersion 1", () => {
    localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "Backup Label");
    localStorage.setItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }), "SHADOW-IGNORED");
    const before = new Map(
      Array.from({ length: localStorage.length }, (_, i) => {
        const key = localStorage.key(i)!;
        return [key, localStorage.getItem(key)];
      }),
    );

    const result = buildAppBackupEnvelope();
    expect(result.envelope.schemaVersion).toBe(1);
    expect(result.envelope.modules["phmax-scenario-label"]?.data).toBe("Backup Label");

    const after = new Map(
      Array.from({ length: localStorage.length }, (_, i) => {
        const key = localStorage.key(i)!;
        return [key, localStorage.getItem(key)];
      }),
    );
    expect(after).toEqual(before);
  });
});
