import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const N3_PROTO_SOURCE_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-n3-authority-types.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-authority-marker.ts",
  "src/data/storage/scenario-label-migration/scenario-label-n3-authority-protocol.ts",
] as const;

/** Cutover / authority-routing symbols — still forbidden in all production runtime. */
const N3_PROTO_FORBIDDEN_RUNTIME_SYMBOLS = [
  "classifyScenarioLabelAuthorityState",
  "assessScenarioLabelN3CutoverReadiness",
  "planScenarioLabelAuthorityCutover",
  "decideScenarioLabelReadRoute",
  "planScenarioLabelNamespacedWrite",
  "decideScenarioLabelEstablishmentAction",
  "planScenarioLabelRestoreForAuthority",
  "planScenarioLabelClearForAuthority",
  "assessScenarioLabelN3ProductionCutoverEligibility",
] as const;

/**
 * Marker parse is needed by N3-FENCE-WRITE finalizer to refuse schema2 / certify v1.
 * Still forbidden everywhere else (no namespaced authority routing).
 */
const N3_PROTO_MARKER_PARSE_SYMBOLS = [
  "parseScenarioLabelN3AuthorityMarker",
  "parseScenarioLabelN3AuthorityMarkerJson",
] as const;

const N3_FENCE_WRITE_MARKER_PARSE_ALLOWLIST = new Set([
  "src/data/storage/scenario-label-migration/scenario-label-n3-fence-finalize.ts",
]);

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("N3-PROTO source contract", () => {
  const sources = N3_PROTO_SOURCE_FILES.map((file) => ({ file, source: readSource(file) }));

  it("zero storage / browser IO in N3-PROTO production files", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("localStorage");
      expect(source, file).not.toContain("sessionStorage");
      expect(source, file).not.toContain("window.");
      expect(source, file).not.toContain("document.");
      expect(source, file).not.toContain("globalThis");
      expect(source, file).not.toContain(".setItem(");
      expect(source, file).not.toContain(".removeItem(");
      expect(source, file).not.toMatch(/(?:localStorage|sessionStorage)\.clear\(/);
      expect(source, file).not.toContain(".getItem(");
    }
  });

  it("does not import runtime lifecycle / backup / restore / dashboard engines", () => {
    for (const { file, source } of sources) {
      expect(source, file).not.toContain("scenario-label-repository");
      expect(source, file).not.toContain("school-shadow-establishment-runtime");
      expect(source, file).not.toContain("profile-save-platform-binding");
      expect(source, file).not.toContain("vz-school-year-persist-binding");
      expect(source, file).not.toContain("apply-app-backup-restore");
      expect(source, file).not.toContain("phmax-is-handoff-apply");
      expect(source, file).not.toContain("PhmaxDashboardPage");
      expect(source, file).not.toContain("phmax-local-storage-clear");
      expect(source, file).not.toContain("application-storage-registry");
    }
  });

  it("zero production call sites for N3-PROTO cutover/routing symbols; marker parse only in fence finalizer", () => {
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
        if (entry.name.includes(".test.")) continue;
        if (entry.name.includes("n3-authority")) continue;
        const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
        const text = fs.readFileSync(full, "utf8");
        for (const symbol of N3_PROTO_FORBIDDEN_RUNTIME_SYMBOLS) {
          if (text.includes(symbol)) {
            hits.push(`${rel}:${symbol}`);
          }
        }
        for (const symbol of N3_PROTO_MARKER_PARSE_SYMBOLS) {
          // Prefer exact Json match before bare parse (substring overlap).
          if (symbol === "parseScenarioLabelN3AuthorityMarker") {
            const withoutJson = text.replaceAll(
              "parseScenarioLabelN3AuthorityMarkerJson",
              "",
            );
            if (withoutJson.includes(symbol) && !N3_FENCE_WRITE_MARKER_PARSE_ALLOWLIST.has(rel)) {
              hits.push(`${rel}:${symbol}`);
            }
            continue;
          }
          if (text.includes(symbol) && !N3_FENCE_WRITE_MARKER_PARSE_ALLOWLIST.has(rel)) {
            hits.push(`${rel}:${symbol}`);
          }
        }
      }
    }

    walk(srcRoot);
    expect(hits).toEqual([]);
  });

  it("does not silently widen N2 v1 authority union in existing marker payload module", () => {
    const v1Source = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-migration-marker-payload.ts",
    );
    expect(v1Source).toContain('ALLOWED_AUTHORITIES = new Set<ScenarioLabelMigrationAuthority>(["legacy"])');
    expect(v1Source).not.toContain("namespaced");
  });

  it("pins fence-required + school-only cutover semantics in protocol source", () => {
    const protocol = readSource(
      "src/data/storage/scenario-label-migration/scenario-label-n3-authority-protocol.ts",
    );
    expect(protocol).toContain("target_unbound");
    expect(protocol).toContain("SCENARIO_LABEL_N3_CUTOVER_REQUIRES_FENCE");
    expect(protocol).toContain("no_op_namespaced_authoritative");
    expect(protocol).toContain("replace_marker_only");
  });
});
