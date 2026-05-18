import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("README SŠ acceptance", () => {
  it("README odkazuje na SŠ checklist a rozsah 0.2", () => {
    const readme = readSource("README.md");
    expect(readme).toContain("## SŠ acceptance checklist");
    expect(readme).toContain("docs/ss-acceptance-checklist.md");
    expect(readme).toContain("## Rozsah modulu SŠ (verze 0.2)");
    expect(readme).toContain("§ 16 odst. 9");
  });

  it("detailní checklist obsahuje scénáře a golden smoke", () => {
    const doc = readSource("docs/ss-acceptance-checklist.md");
    expect(doc).toContain("### A – Běžný jednoobor");
    expect(doc).toContain("### C – Praktická škola + PHAmax");
    expect(doc).toContain("### E – § 16 odst. 9");
    expect(doc).toContain("PHmax celkem **100**");
    expect(doc).toContain("78-62-C/01");
  });
});
