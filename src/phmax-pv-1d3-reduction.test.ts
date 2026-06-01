import { describe, expect, it } from "vitest";
import { computePv1d3Reduction } from "./phmax-pv-1d3-reduction";

describe("computePv1d3Reduction", () => {
  it("poměrné krácení při nedostatku dětí", () => {
    const result = computePv1d3Reduction(100, { actualChildren: 5, minimumChildren: 10 });
    expect(result.status).toBe("reduced");
    if (result.status === "reduced") {
      expect(result.phmaxAfter).toBe(50);
      expect(result.method).toBe("proportional");
    }
  });

  it("PHmax z rozhodnutí KÚ má přednost", () => {
    const result = computePv1d3Reduction(100, { actualChildren: 5, minimumChildren: 10, kuPhmaxCap: 40 });
    expect(result.status).toBe("reduced");
    if (result.status === "reduced") {
      expect(result.phmaxAfter).toBe(40);
      expect(result.method).toBe("ku_cap");
    }
  });

  it("exemption vrací not_applicable", () => {
    expect(computePv1d3Reduction(100, { exemptionConfirmed: true }).status).toBe("not_applicable");
  });

  it("bez vstupů pro krácení vrací pending_ku", () => {
    const result = computePv1d3Reduction(100, {});
    expect(result.status).toBe("pending_ku");
  });
});
