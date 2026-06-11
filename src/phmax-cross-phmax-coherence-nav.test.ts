import { describe, expect, it } from "vitest";
import { coherenceWarningFocusHint, coherenceWarningModuleId } from "./phmax-cross-phmax-coherence-nav";

describe("coherenceWarningModuleId", () => {
  it("parsuje prefix modulu z varování", () => {
    expect(coherenceWarningModuleId("ZŠ: audit ≠ přepočet")).toBe("zs");
    expect(coherenceWarningModuleId("PV: v přehledu 10 h/týd., přepočet z řádků 5 h/týd. – otevřete modul a uložte znovu.")).toBe(
      "pv",
    );
    expect(coherenceWarningModuleId("ŠD: uložený součet (5) se liší od přepočtu z vstupů (4) – otevřete ŠD a uložte stav.")).toBe(
      "sd",
    );
    expect(coherenceWarningModuleId("SŠ: uložený součet (1) se liší od přepočtu z řádků (2) – otevřete SŠ a uložte stav.")).toBe(
      "ss",
    );
    expect(coherenceWarningModuleId("neznámé varování")).toBeNull();
  });
});

describe("coherenceWarningFocusHint", () => {
  it("vrací modul a sekci formuláře", () => {
    expect(coherenceWarningFocusHint("ZŠ: audit ≠ přepočet")).toEqual({ moduleId: "zs", sectionId: "basic" });
    expect(coherenceWarningFocusHint("PV: uložený součet (1) se liší")).toEqual({
      moduleId: "pv",
      sectionId: "pv-vstupy",
    });
  });
});
