import { describe, expect, it, vi, afterEach } from "vitest";
import { buildSchoolReviewPrintHtml, openSchoolReviewPrintWindow } from "./phmax-dashboard-school-review-print";

describe("phmax-dashboard-school-review-print", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildSchoolReviewPrintHtml obsahuje titul a tiskový skript", () => {
    const html = buildSchoolReviewPrintHtml({
      generatedAt: "1. 1. 2025",
      appVersion: "0.3.15",
      scenarioLabel: "Test",
      crossPhmax: {
        slices: [],
        modulesWithPhmax: 0,
        totalPhmax: 57.5,
        hasIncomplete: false,
      },
      modules: [],
      coherenceWarnings: [],
      disclaimer: "Orientační.",
    });
    expect(html).toContain("Kontrola před jednáním");
    expect(html).toContain("window.print");
  });

  it("openSchoolReviewPrintWindow otevře blob URL (ne prázdné about:blank)", () => {
    const openMock = vi.fn(() => ({ addEventListener: vi.fn(), focus: vi.fn(), print: vi.fn() }));
    vi.stubGlobal("window", { open: openMock });
    const createObjectURL = vi.fn(() => "blob:print-test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const result = openSchoolReviewPrintWindow("<!DOCTYPE html><html><body>ok</body></html>");

    expect(result.ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalled();
    expect(openMock).toHaveBeenCalledWith("blob:print-test", "_blank");
  });
});
