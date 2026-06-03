import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("dashboard school import contract", () => {
  it("import dialog, šablona xlsx a sdílený parser", () => {
    expect(readSource("src/DashboardSchoolImportDialog.tsx")).toContain("dash-import-download-template-dialog");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("dash-import-download-template");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("DASH_IMPORT_TEMPLATE_LABEL");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("dash-school-import__steps");
    expect(readSource("src/phmax-import-template-xlsx.ts")).toContain("downloadPhmaxImportTemplateXlsx");
    expect(readSource("src/phmax-import-xlsx.ts")).toContain("parseImportXlsxArrayBuffer");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("DASH_IMPORT_LABEL");
  });
});
