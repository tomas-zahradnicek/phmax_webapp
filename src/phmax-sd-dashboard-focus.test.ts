import { describe, expect, it } from "vitest";
import {
  findFirstSdDashboardFocusHint,
  parseSdDashboardSnapshot,
  sdDashboardNeedsAttention,
  sdDashboardVerdictFromSnapshot,
} from "./phmax-sd-dashboard-focus";

describe("phmax-sd-dashboard-focus", () => {
  it("parseSdDashboardSnapshot a varování u nulových účastníků", () => {
    const raw = JSON.stringify({ pupils: 0, manualDepts: false, departments: 2, inputMode: "summary" });
    const snap = parseSdDashboardSnapshot(raw);
    expect(snap?.pupils).toBe(0);
    expect(sdDashboardNeedsAttention(snap!)).toBe(true);
    expect(sdDashboardVerdictFromSnapshot(snap!).tone).toBe("warning");
  });

  it("findFirstSdDashboardFocusHint vrátí řádek detailního oddělení", () => {
    const raw = JSON.stringify({
      pupils: 40,
      manualDepts: false,
      departments: 2,
      inputMode: "detail",
      detailDepartments: [
        { kind: "regular", participants: 10 },
        { kind: "regular", participants: 0 },
      ],
    });
    expect(findFirstSdDashboardFocusHint(raw)).toEqual({ sectionId: "sd-vstupy", rowId: 1 });
  });
});
