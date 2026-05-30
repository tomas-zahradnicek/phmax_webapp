import { describe, expect, it } from "vitest";
import { findFirstPvDashboardFocusRowKey } from "./phmax-pv-dashboard-focus";

describe("findFirstPvDashboardFocusRowKey", () => {
  it("vrátí id prvního neúplného pracoviště", () => {
    const raw = JSON.stringify({
      rows: [
        {
          id: "pv-complete",
          provoz: "celodenni",
          classCount: 4,
          avgHours: 10,
          sec16Count: 0,
          languageGroups: 0,
        },
        {
          id: "pv-incomplete",
          provoz: "celodenni",
          classCount: 0,
          avgHours: 10,
          sec16Count: 0,
          languageGroups: 0,
        },
      ],
    });
    expect(findFirstPvDashboardFocusRowKey(raw)).toBe("pv-incomplete");
  });

  it("vrátí undefined bez neúplného řádku", () => {
    const raw = JSON.stringify({
      rows: [
        {
          id: "pv-ok",
          provoz: "zdravotnicke",
          classCount: 2,
          avgHours: 0,
          sec16Count: 0,
          languageGroups: 0,
        },
      ],
    });
    expect(findFirstPvDashboardFocusRowKey(raw)).toBeUndefined();
  });
});
