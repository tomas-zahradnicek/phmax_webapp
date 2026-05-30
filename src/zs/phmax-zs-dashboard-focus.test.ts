import { describe, expect, it } from "vitest";
import { findFirstZsDashboardFocusSection } from "./phmax-zs-dashboard-focus";

describe("findFirstZsDashboardFocusSection", () => {
  it("vrátí první neúplnou sekci z autosave", () => {
    const raw = JSON.stringify({
      tab: "phmax",
      basic1Classes: 0,
      basic2Classes: 0,
      incl1Classes: 0,
      incl2Classes: 0,
      psychRows: [],
      healthRows: [],
      minority1Classes: 0,
      gymRows: [],
      mixedRows: [],
      special1Classes: 0,
      special2Classes: 0,
      specialIIClasses: 0,
      prepClasses: 0,
      prepSpecialClasses: 0,
      phaRows: [],
      phpYear1: 0,
      phpYear2: 0,
      phpYear3: 0,
      phpMethodMode: "three_year_avg",
    });
    expect(findFirstZsDashboardFocusSection(raw)).toBe("basic");
  });

  it("vrátí guide když nejsou validační chyby", () => {
    const raw = JSON.stringify({
      tab: "phmax",
      basic1Classes: 2,
      basic1Pupils: 40,
      basic2Classes: 0,
      basic2Pupils: 0,
      incl1Classes: 0,
      incl2Classes: 0,
      psychRows: [],
      healthRows: [],
      minority1Classes: 0,
      gymRows: [],
      mixedRows: [],
      special1Classes: 0,
      special2Classes: 0,
      specialIIClasses: 0,
      prepClasses: 0,
      prepSpecialClasses: 0,
      phaRows: [],
      phpYear1: 0,
      phpYear2: 0,
      phpYear3: 0,
      phpMethodMode: "three_year_avg",
    });
    expect(findFirstZsDashboardFocusSection(raw)).toBe("guide");
  });
});
