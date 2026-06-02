import { describe, expect, it } from "vitest";
import { computeZsPhmaxTotalFromSnapshot } from "./zs-compute-phmax-total-from-snapshot";

describe("computeZsPhmaxTotalFromSnapshot", () => {
  it("přepočítá PHmax ze základního stupně (2 třídy, 40 žáků)", () => {
    const total = computeZsPhmaxTotalFromSnapshot({
      tab: "phmax",
      basic1Classes: 2,
      basic1Pupils: 40,
    });
    expect(total).not.toBeNull();
    expect(total).not.toBe(200);
    expect(total).toBeGreaterThan(0);
  });

  it("mimo záložku phmax vrací null", () => {
    expect(computeZsPhmaxTotalFromSnapshot({ tab: "pha", basic1Classes: 1, basic1Pupils: 20 })).toBeNull();
  });
});
