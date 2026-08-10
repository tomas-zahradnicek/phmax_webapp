import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const EXECUTOR = "establishScenarioLabelSchoolShadowFromLegacy";
const HELPER = "runScenarioLabelEstablishmentAfterSchoolReady";

const ALLOWED_FILES = new Set([
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime.test.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-prep.test.ts",
  "src/school-profile/profile-save-platform-binding.ts",
  "src/school-profile/profile-save-platform-binding.test.ts",
  "src/school-profile/profile-mount-platform-binding.test.ts",
  "src/vyrocni-zprava/vz-school-year-persist-binding.ts",
  "src/vyrocni-zprava/vz-school-year-persist-binding.test.ts",
  "src/backup/restore/apply-app-backup-restore.ts",
  "src/backup/restore/restore-platform-reconcile.test.ts",
  "src/backup/restore/restore-n2adopt-write.test.ts",
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-write-callsite.test.ts",
]);

const FORBIDDEN_SUBSTRINGS = [
  "Dashboard",
  "backup-export",
  "phmax-is-handoff",
  "phmax-local-storage-clear",
  "application-full-reset",
  "ensure-school-platform-binding.ts",
];

describe("N2-ADOPT-WRITE production call-site contract", () => {
  it("executor/helper only appear in allowed orchestration files", () => {
    const srcRoot = path.join(repoRoot, "src");
    const hits: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
        const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
        const text = fs.readFileSync(full, "utf8");
        if (text.includes(EXECUTOR) || text.includes(HELPER)) {
          hits.push(rel);
        }
      }
    }
    walk(srcRoot);

    for (const hit of hits) {
      expect(ALLOWED_FILES.has(hit), `unexpected call-site file: ${hit}`).toBe(true);
    }

    // Required production owners present
    expect(hits).toContain(
      "src/school-profile/profile-save-platform-binding.ts",
    );
    expect(hits).toContain("src/vyrocni-zprava/vz-school-year-persist-binding.ts");
    expect(hits).toContain("src/backup/restore/apply-app-backup-restore.ts");
  });

  it("ensureSchool / Dashboard / Backup / Handoff / clear / Full Reset stay free of establishment", () => {
    for (const needle of FORBIDDEN_SUBSTRINGS) {
      // Scan by walking and asserting files whose path contains needle do not import executor
      const srcRoot = path.join(repoRoot, "src");
      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
            continue;
          }
          if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
          const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
          if (!rel.includes(needle) && entry.name !== needle) continue;
          if (rel.includes("scenario-label-school-shadow-establishment")) continue;
          if (rel.includes("restore-n2adopt") || rel.includes("restore-platform-reconcile")) continue;
          const text = fs.readFileSync(full, "utf8");
          expect(text.includes(EXECUTOR), rel).toBe(false);
          expect(text.includes(HELPER), rel).toBe(false);
        }
      }
      walk(srcRoot);
    }
  });
});
