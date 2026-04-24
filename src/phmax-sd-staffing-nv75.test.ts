import { describe, expect, it } from "vitest";
import {
  computeSdStaffingSplitNv75,
  getNv2005VedouciVychovatelHours,
} from "./phmax-sd-staffing-nv75";

describe("getNv2005VedouciVychovatelHours (NV 75/2005, příl. 1, tab. 7.2, školní družina)", () => {
  it("3 oddělení → 25 h", () => {
    expect(getNv2005VedouciVychovatelHours(3).hours).toBe(25);
  });
  it("9 oddělení → 21 h (pásmo 7–11)", () => {
    expect(getNv2005VedouciVychovatelHours(9).hours).toBe(21);
  });
  it("15+ oddělení → 17 h", () => {
    expect(getNv2005VedouciVychovatelHours(20).hours).toBe(17);
  });
  it("1–2 oddělení → 0 h a poznámka", () => {
    const a = getNv2005VedouciVychovatelHours(1);
    expect(a.hours).toBe(0);
    expect(a.note).toBeDefined();
  });
});

describe("computeSdStaffingSplitNv75", () => {
  it("242 / 9 oddělení, 28 h: stejná logika jako běžný metodický příklad (21 + 7×28 + 10,5)", () => {
    const s = computeSdStaffingSplitNv75({
      totalPhmax: 227.5,
      departmentCount: 9,
      vychovatelFullPpc: 28,
    });
    expect(s.inconsistent).toBe(false);
    expect(s.headVedouciHours).toBe(21);
    expect(s.forOthersPhmax).toBe(206.5);
    expect(s.fullTimeSlots).toBe(7);
    expect(s.partialHours).toBe(10.5);
  });
});
