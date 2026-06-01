import { describe, expect, it } from "vitest";
import { computePv1d3Reduction } from "./phmax-pv-1d3-reduction";

describe("computePv1d3Reduction", () => {
  it("vrací unimplemented dokud není právní model", () => {
    const result = computePv1d3Reduction(100, { minimumChildrenDecision: 10 });
    expect(result.status).toBe("unimplemented");
    if (result.status === "unimplemented") {
      expect(result.reason).toMatch(/§ 1d/);
    }
  });
});
