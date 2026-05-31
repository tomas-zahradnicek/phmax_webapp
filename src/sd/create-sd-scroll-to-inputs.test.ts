import { describe, expect, it, vi, beforeEach } from "vitest";
import { createSdScrollToInputs } from "./create-sd-scroll-to-inputs";

vi.mock("../calculator-section-focus", () => ({
  scrollToDataSection: vi.fn(),
  scrollToFirstNeedsAttentionSection: vi.fn(),
}));

import { scrollToDataSection, scrollToFirstNeedsAttentionSection } from "../calculator-section-focus";

describe("createSdScrollToInputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preferuje sectionId", () => {
    createSdScrollToInputs()({ sectionId: "sd-vysledek" });
    expect(scrollToDataSection).toHaveBeenCalledWith("sd-vysledek");
  });

  it("bez hintu volá scrollToFirstNeedsAttentionSection", () => {
    createSdScrollToInputs()();
    expect(scrollToFirstNeedsAttentionSection).toHaveBeenCalledWith(["sd-vstupy"]);
  });
});
