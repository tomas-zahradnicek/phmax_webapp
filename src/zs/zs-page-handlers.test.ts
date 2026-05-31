import { describe, expect, it, vi } from "vitest";
import { createZsPageHandlers } from "./zs-page-handlers";

vi.mock("./zs-export-actions", () => ({
  runZsExportCsv: vi.fn(),
  runZsExportXlsx: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./zs-audit-actions", () => ({
  exportZsAuditJson: vi.fn(),
  compareZsWithNamedSnapshot: vi.fn(),
  buildZsComparePreview: vi.fn(),
}));

import { runZsExportCsv } from "./zs-export-actions";
import { compareZsWithNamedSnapshot, exportZsAuditJson } from "./zs-audit-actions";

function baseInput() {
  return {
    zsExportBuildInput: {} as never,
    setUiNotice: vi.fn(),
    xlsxExportBusy: false,
    setXlsxExportBusy: vi.fn(),
    buildSnapshot: () => ({}),
    totalPhmax: 100,
    totalPha: 0,
    totalPhp: 0,
    tab: "phmax" as const,
    mode: "phmax_full_zs_sec16" as const,
    exportLabel: "",
    warnings: [] as string[],
    validationIssues: [],
    namedSnapshots: [],
    selectedNamedId: "",
  };
}

describe("createZsPageHandlers", () => {
  it("handleExportCsv volá runZsExportCsv", () => {
    const input = baseInput();
    createZsPageHandlers(input).handleExportCsv();
    expect(runZsExportCsv).toHaveBeenCalledWith(input.zsExportBuildInput, input.setUiNotice);
  });

  it("handleExportZsAuditJson stáhne audit a nastaví notice", () => {
    const input = baseInput();
    createZsPageHandlers(input).handleExportZsAuditJson();
    expect(exportZsAuditJson).toHaveBeenCalled();
    expect(input.setUiNotice).toHaveBeenCalledWith("Stažen auditní protokol (JSON).");
  });

  it("handleCompareZsWithNamedSnapshot předá chybu pick-named", () => {
    vi.mocked(compareZsWithNamedSnapshot).mockReturnValue({ ok: false, message: "pick-named" });
    const input = baseInput();
    createZsPageHandlers(input).handleCompareZsWithNamedSnapshot();
    expect(input.setUiNotice).toHaveBeenCalled();
  });
});
