import { describe, expect, it } from "vitest";
import { calculateNv75DeputyBank } from "./nv75-deputy-bank";

describe("calculateNv75DeputyBank", () => {
  it("§4b odst. 1: 1 druh z přílohy 2 (MŠ 8 tříd) => 14 h", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ms", units: 8 }],
    });
    expect(r.appliedRule).toBe("4b1");
    expect(r.bankHoursBase4b).toBe(14);
    expect(r.bankHoursTotal).toBe(14);
  });

  it("§4b odst. 2 písm. a: ZŠ + ZUŠ(individual) => součet obou", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 39 },
        { kind: "zus_individual", units: 17 },
      ],
    });
    expect(r.appliedRule).toBe("4b2a");
    expect(r.bankHoursBase4b).toBe(58); // ZŠ 44 + ZUŠ 14
  });

  it("§4b odst. 2 písm. b: ZŠ + ZUŠ(group) + školní klub => 22 + 9 + 3 = 34", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 18 },
        { kind: "zus_group", units: 10 },
        { kind: "skolni_klub", units: 1 },
      ],
    });
    expect(r.appliedRule).toBe("4b2b");
    expect(r.bankHoursBase4b).toBe(34);
  });

  it("§4b odst. 3: více druhů z přílohy 2 (ZŠ+MŠ+ŠD) => bere se nejvyšší z druhu (bez ŠD) nad součtem jednotek", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 18 },
        { kind: "ms", units: 5 },
        { kind: "sd", units: 2 },
      ],
    });
    expect(r.appliedRule).toBe("4b3");
    expect(r.bankHoursBase4b).toBe(32); // total units=25 => max(zs=22, ms=32)
  });

  it("§4b odst. 5 písm. a: více p2 + 1 p3 => (4b3) + (4b1)", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 23 },
        { kind: "sd", units: 2 },
        { kind: "zus_individual", units: 16 },
      ],
    });
    expect(r.appliedRule).toBe("4b5a");
    expect(r.bankHoursBase4b).toBe(36); // p2:25=>22 + p3:14
  });

  it("§4b odst. 5 písm. b: více p2 + více p3 => (4b3) + (4b4)", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "zs", units: 18 },
        { kind: "ss_konz", units: 12 },
        { kind: "domov_mladeze", units: 7 },
        { kind: "skolni_klub", units: 1 },
      ],
    });
    expect(r.appliedRule).toBe("4b5b");
    expect(r.bankHoursBase4b).toBe(48); // p2 total=30 => 33, p3=12+3
  });

  it("§4d: bonifikace pracovišť (+2/+1) se přičte k bance", () => {
    const r = calculateNv75DeputyBank({
      activities: [
        { kind: "ms", units: 30, additionalWorkplacesEligible: 3 },
        { kind: "poradenske", units: 1, additionalWorkplacesEligible: 2 },
      ],
    });
    expect(r.bonus4dHours).toBe(8);
    expect(r.bankHoursBase4b).toBe(47); // ms(30)=35 + poradenske=12
    expect(r.bankHoursTotal).toBe(55);
  });

  it("§4c: praktické vyučování přidá 7 + 2*...", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ss_konz", units: 10 }],
      practicalStudentsGeneral: 121, // 7 + 2
      practicalStudentsSec16: 43, // 7 + 2
    });
    expect(r.bonus4cHours).toBe(18);
    expect(r.bankHoursTotal).toBe(29); // ss_konz(10)=11 + 18
  });

  it("OV E/H/L0: při 10+ skupinách se žáci OV nezapočítají do §4c", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ss_konz", units: 12 }],
      practicalStudentsGeneralNonOv: 120,
      practicalStudentsOvEhl0: 200,
      ovGroupsSchool: 10,
      ovGroupsInstructor: 0,
    });
    expect(r.ovGroupsEquivalent).toBe(10);
    expect(r.ovDeputyEntitlementCount).toBe(1);
    expect(r.practicalStudentsGeneralCounted).toBe(120);
    expect(r.bonus4cHours).toBe(7);
    expect(r.notes.some((n) => n.includes("nejsou započteni"))).toBe(true);
  });

  it("OV E/H/L0: při <10 skupinách se žáci OV započítají do §4c", () => {
    const r = calculateNv75DeputyBank({
      activities: [{ kind: "ss_konz", units: 12 }],
      practicalStudentsGeneralNonOv: 50,
      practicalStudentsOvEhl0: 70,
      ovGroupsSchool: 8,
      ovGroupsInstructor: 2, // +1 => 9
    });
    expect(r.ovGroupsEquivalent).toBe(9);
    expect(r.ovDeputyEntitlementCount).toBe(0);
    expect(r.practicalStudentsGeneralCounted).toBe(120);
    expect(r.bonus4cHours).toBe(7);
  });
});
