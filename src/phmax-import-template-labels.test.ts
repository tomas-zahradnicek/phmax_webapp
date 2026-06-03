import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { IMPORT_SD_LABELS } from "./phmax-import-columns";

const srcDir = path.dirname(fileURLToPath(import.meta.url));

describe("phmax-import-template-labels", () => {
  it("šablona Excel používá český sloupec Počet účastníků pro ŠD", () => {
    const columnsSource = readFileSync(path.join(srcDir, "phmax-import-columns.ts"), "utf8");
    expect(columnsSource).toContain('pupils: "Počet účastníků"');

    const templateSource = readFileSync(path.join(srcDir, "phmax-import-template-xlsx.ts"), "utf8");
    expect(templateSource).toContain("IMPORT_SD_LABELS");
    expect(templateSource).toContain("phmax-import-skola-v2.xlsx");
    expect(IMPORT_SD_LABELS.pupils).toBe("Počet účastníků");
  });
});
