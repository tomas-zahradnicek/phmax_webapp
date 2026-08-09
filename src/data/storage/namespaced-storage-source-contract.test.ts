import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

const N1_SOURCE_FILES = [
  "src/data/storage/namespaced-storage-schema.ts",
  "src/data/storage/namespaced-storage-catalog.ts",
  "src/data/storage/namespaced-storage-address.ts",
] as const;

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("namespaced storage source contract (N1)", () => {
  const sources = N1_SOURCE_FILES.map((file) => ({ file, source: readSource(file) }));

  it("primitives never reference a storage or DOM global", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("localStorage");
      expect(source, file).not.toContain("sessionStorage");
      expect(source, file).not.toContain("window.");
      expect(source, file).not.toContain("document.");
      expect(source, file).not.toContain("globalThis.");
    }
  });

  it("primitives never import the backup or restore engine", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("/backup/");
      expect(source, file).not.toContain("backup-registry");
      expect(source, file).not.toContain("restore-owned-keys");
      expect(source, file).not.toContain("applyAppBackupRestore");
      expect(source, file).not.toContain("RestorePlan");
    }
  });

  it("primitives never import storage-touching identity or context modules", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("identity-registry");
      expect(source, file).not.toContain("app-context");
      expect(source, file).not.toContain("application-storage-registry");
    }
  });

  it("reuses the canonical UUID validator instead of a second regex", () => {
    const addressSource = readSource("src/data/storage/namespaced-storage-address.ts");
    expect(addressSource).toContain('import { isUuid } from "../identity/identity-uuid"');
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("[0-9a-f]{8}");
    }
  });

  it("physical storage version stays independent of the backup envelope version", () => {
    const schemaSource = readSource("src/data/storage/namespaced-storage-schema.ts");
    expect(schemaSource).toContain("NAMESPACED_STORAGE_SCHEMA_VERSION = 2");
    expect(schemaSource).not.toContain("APP_BACKUP_SCHEMA_VERSION");

    const backupTypes = readSource("src/backup/backup-types.ts");
    expect(backupTypes).toContain("APP_BACKUP_SCHEMA_VERSION = 1");
  });
});
