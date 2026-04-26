import { describe, expect, it } from "vitest";
import { calculateNv75DeputyBank } from "./nv75-deputy-bank";

describe("NV75 deputy bank: golden examples from methodology", () => {
  it("§4d příklad 1: ZŠ+ŠD+MŠ více pracovišť => 41 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 19, additionalWorkplacesEligible: 2 },
        { kind: "sd", units: 4 },
        { kind: "ms", units: 7, additionalWorkplacesEligible: 1 },
      ],
    });

    expect(r.appliedRule).toBe("4b3");
    expect(r.bankHoursBase4b).toBe(35);
    expect(r.bonus4dHours).toBe(6);
    expect(r.bankHoursTotal).toBe(41);
  });

  it("§4d příklad 2: ZŠ+ŠD+MŠ tři pracoviště => 42 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 23, additionalWorkplacesEligible: 1 },
        { kind: "sd", units: 4 },
        { kind: "ms", units: 4, additionalWorkplacesEligible: 1 },
      ],
    });

    expect(r.appliedRule).toBe("4b3");
    expect(r.bankHoursBase4b).toBe(38);
    expect(r.bonus4dHours).toBe(4);
    expect(r.bankHoursTotal).toBe(42);
  });

  it("§4d příklad 3: školské poradenské zařízení + 2 pracoviště => 14 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "poradenske", units: 0, additionalWorkplacesEligible: 2 }],
    });

    expect(r.bankHoursBase4b).toBe(12);
    expect(r.bonus4dHours).toBe(2);
    expect(r.bankHoursTotal).toBe(14);
  });

  it("SŠ/VOŠ/DM: 12 tříd + 6 skupin + 8 výchovných skupin => 30 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "ss_konz", units: 12 },
        { kind: "vos", units: 6 },
        { kind: "domov_mladeze", units: 8 },
      ],
    });

    expect(r.appliedRule).toBe("4b2b");
    expect(r.bankHoursBase4b).toBe(30);
    expect(r.bankHoursTotal).toBe(30);
  });

  it("SŠ/VOŠ/JŠ/DM: 12 + 8 + 29 + 4 => 40 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "ss_konz", units: 12 },
        { kind: "vos", units: 8 },
        { kind: "jazykova", units: 29 },
        { kind: "domov_mladeze", units: 4 },
      ],
    });

    expect(r.appliedRule).toBe("4b2b");
    expect(r.bankHoursBase4b).toBe(40);
    expect(r.bankHoursTotal).toBe(40);
  });

  it("SŠ/VOŠ praktická výuka: 319 žáků => +11 h, celkem 29 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "ss_konz", units: 12 },
        { kind: "vos", units: 6 },
      ],
      practicalStudentsGeneralNonOv: 319,
    });

    expect(r.bankHoursBase4b).toBe(18);
    expect(r.bonus4cHours).toBe(11);
    expect(r.bankHoursTotal).toBe(29);
  });

  it("OV příklad 1: 37 školních skupin => 2 funkce a banka 16 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ss_konz", units: 16 }],
      practicalStudentsOvEhl0: 331,
      ovGroupsSchool: 37,
    });

    expect(r.bankHoursTotal).toBe(16);
    expect(r.practicalStudentsGeneralCounted).toBe(0);
    expect(r.ovGroupsEquivalent).toBe(37);
    expect(r.ovDeputyEntitlementCount).toBe(2);
    expect(r.ovDeputyEntitlementText).toContain("2 zástupci ředitele školy pro odborný výcvik");
  });

  it("OV příklad 2: 16 školních + 34 instruktorských skupin => ekv. 33 a 2 vedoucí učitelé OV", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ss_konz", units: 16 }],
      practicalStudentsOvEhl0: 331,
      ovGroupsSchool: 16,
      ovGroupsInstructor: 34,
    });

    expect(r.bankHoursTotal).toBe(16);
    expect(r.ovGroupsEquivalent).toBe(33);
    expect(r.ovDeputyEntitlementCount).toBe(2);
    expect(r.ovDeputyEntitlementText).toBe("2 vedoucí učitelé odborného výcviku");
  });

  it("OV příklad 3: SŠ 28 tříd + 134 praktických žáků + 36 OV skupin => banka 42 h a 2 funkce", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ss_konz", units: 28 }],
      practicalStudentsGeneralNonOv: 134,
      ovGroupsSchool: 36,
    });

    expect(r.bankHoursBase4b).toBe(33);
    expect(r.bonus4cHours).toBe(9);
    expect(r.bankHoursTotal).toBe(42);
    expect(r.ovDeputyEntitlementCount).toBe(2);
  });
});

describe("NV75 deputy bank: appendix boundary guards", () => {
  it.each([
    ["ms", 3, 0],
    ["ms", 4, 11],
    ["ms", 9, 14],
    ["ms", 10, 17],
    ["zs", 4, 0],
    ["zs", 5, 9],
    ["zs", 14, 11],
    ["zs", 15, 15],
    ["ss_konz", 3, 0],
    ["ss_konz", 4, 7],
    ["ss_konz", 14, 11],
    ["ss_konz", 15, 16],
    ["sd", 1, 0],
    ["sd", 2, 3],
    ["sd", 15, 11],
  ] as const)("příloha 2: %s při %i jednotkách => %i h", (kind, units, expected) => {
    const r = calculateNv75DeputyBank({ activities: [{ kind, units }] });
    expect(r.bankHoursBase4b).toBe(expected);
  });

  it.each([
    ["zus_individual", 0, 0],
    ["zus_individual", 14, 11],
    ["zus_individual", 15, 14],
    ["zus_group", 0, 0],
    ["zus_group", 14, 9],
    ["zus_group", 15, 12],
    ["jazykova", 0, 0],
    ["jazykova", 14, 9],
    ["jazykova", 15, 12],
    ["domov_mladeze", 0, 0],
    ["domov_mladeze", 5, 10],
    ["domov_mladeze", 6, 12],
    ["vos", 0, 0],
    ["vos", 8, 7],
    ["vos", 9, 11],
  ] as const)("příloha 3: %s při %i jednotkách => %i h", (kind, units, expected) => {
    const r = calculateNv75DeputyBank({ activities: [{ kind, units }] });
    expect(r.bankHoursBase4b).toBe(expected);
  });
});

