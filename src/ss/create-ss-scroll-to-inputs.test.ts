import { describe, expect, it, vi, beforeEach } from "vitest";
import { createSsScrollToInputs } from "./create-ss-scroll-to-inputs";

vi.mock("../calculator-section-focus", () => ({
  scrollToDataSection: vi.fn(),
  scrollToFirstNeedsAttentionSection: vi.fn(),
}));

import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";

describe("createSsScrollToInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preferuje sectionId", () => {
    createSsScrollToInputs()({ sectionId: "ss-vysledek" });
    expect(scrollToDataSection).toHaveBeenCalledWith("ss-vysledek");
  });

  it("bez hintu volá scrollToFirstNeedsAttentionSection", () => {
    createSsScrollToInputs()();
    expect(scrollToFirstNeedsAttentionSection).toHaveBeenCalledWith(["ss-vstupy"]);
  });
});
