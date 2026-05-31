import { describe, expect, it, vi, beforeEach } from "vitest";
import { createNv75ScrollToInputs } from "./create-nv75-scroll-to-inputs";

vi.mock("../calculator-section-focus", () => ({
  scrollToDataSection: vi.fn(),
  scrollToFirstNeedsAttentionSection: vi.fn(),
}));

import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";

describe("createNv75ScrollToInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preferuje sectionId", () => {
    createNv75ScrollToInputs()({ sectionId: "nv75-vysledek" });
    expect(scrollToDataSection).toHaveBeenCalledWith("nv75-vysledek");
  });

  it("bez hintu volá scrollToFirstNeedsAttentionSection", () => {
    createNv75ScrollToInputs()();
    expect(scrollToFirstNeedsAttentionSection).toHaveBeenCalledWith(["nv75-vstupy"]);
  });
});
