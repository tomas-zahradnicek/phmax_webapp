import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPvScrollToInputs } from "./create-pv-scroll-to-inputs";

vi.mock("../calculator-section-focus", () => ({
  scrollToDataSection: vi.fn(),
  scrollToFirstNeedsAttentionSection: vi.fn(),
}));

import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";

describe("createPvScrollToInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preferuje sectionId", () => {
    createPvScrollToInputs()({ sectionId: "pv-vysledek" });
    expect(scrollToDataSection).toHaveBeenCalledWith("pv-vysledek");
  });

  it("bez hintu volá scrollToFirstNeedsAttentionSection", () => {
    createPvScrollToInputs()();
    expect(scrollToFirstNeedsAttentionSection).toHaveBeenCalledWith(["pv-vstupy"]);
  });
});
