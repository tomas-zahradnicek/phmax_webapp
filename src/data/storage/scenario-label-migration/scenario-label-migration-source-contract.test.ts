import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

const N2_PROTO_SOURCE_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-migration-types.ts",
  "src/data/storage/scenario-label-migration/scenario-label-migration-raw.ts",
  "src/data/storage/scenario-label-migration/scenario-label-migration-target.ts",
  "src/data/storage/scenario-label-migration/scenario-label-migration-marker-key.ts",
  "src/data/storage/scenario-label-migration/scenario-label-migration-marker-payload.ts",
  "src/data/storage/scenario-label-migration/scenario-label-migration-protocol.ts",
] as const;

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("scenario-label migration source contract (N2-PROTO)", () => {
  const sources = N2_PROTO_SOURCE_FILES.map((file) => ({ file, source: readSource(file) }));

  it("protocol files never reference storage or DOM globals", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("localStorage");
      expect(source, file).not.toContain("sessionStorage");
      expect(source, file).not.toContain("window.");
      expect(source, file).not.toContain("document.");
      expect(source, file).not.toContain("globalThis.");
    }
  });

  it("protocol files never import backup, restore, or full reset engines", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("/backup/");
      expect(source, file).not.toContain("restore-owned-keys");
      expect(source, file).not.toContain("application-storage-registry");
      expect(source, file).not.toContain("applyAppBackupRestore");
      expect(source, file).not.toContain("executeFullApplicationReset");
    }
  });

  it("protocol files never bootstrap Identity or platform binding", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("getOrCreateSchoolId");
      expect(source, file).not.toContain("ensureSchoolPlatformBinding");
      expect(source, file).not.toContain("identity-registry-storage");
      expect(source, file).not.toContain("school-profile");
    }
  });

  it("target resolver only accepts Identity read result types", () => {
    const targetSource = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-migration-target.ts",
    );
    expect(targetSource).toContain("IdentityRegistryReadResult");
    expect(targetSource).not.toContain("SchoolProfile");
  });

  it("reuses N1 UUID canonical contract without a new regex", () => {
    const markerKeySource = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-migration-marker-key.ts",
    );
    expect(markerKeySource).toContain('from "../../identity/identity-uuid"');
    expect(markerKeySource).toContain("isUuid");
    expect(markerKeySource).toContain("normalizeUuid");
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("[0-9a-f]{8}");
    }
  });
});
