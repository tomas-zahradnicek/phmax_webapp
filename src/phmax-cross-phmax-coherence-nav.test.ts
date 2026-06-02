import { describe, expect, it } from "vitest";
import { coherenceWarningModuleId } from "./phmax-cross-phmax-coherence-nav";

describe("coherenceWarningModuleId", () => {
  it("parsuje prefix modulu z varování", () => {
    expect(coherenceWarningModuleId("ZŠ: audit ≠ přepočet")).toBe("zs");
    expect(coherenceWarningModuleId("PV: dashboard Σ (10) ≠ přepočet")).toBe("pv");
    expect(coherenceWarningModuleId("ŠD: audit autosave (5) ≠ přepočet")).toBe("sd");
    expect(coherenceWarningModuleId("SŠ: audit autosave (1) ≠ přepočet")).toBe("ss");
    expect(coherenceWarningModuleId("neznámé varování")).toBeNull();
  });
});
