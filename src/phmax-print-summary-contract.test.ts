import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

describe("phmax print summary contract", () => {
  const modulePages = [
    "src/PhmaxPvPage.tsx",
    "src/PhmaxSdPage.tsx",
    "src/PhmaxZsPage.tsx",
    "src/PhmaxNv75DeputyPage.tsx",
    "src/ss/use-phmax-ss-units.ts",
  ];

  it.each(modulePages)("%s nepoužívá document.write pro tisk shrnutí", (rel) => {
    expect(readSource(rel)).not.toContain("document.write");
    expect(readSource(rel)).toContain("printPlainSummaryDocument");
  });
});
