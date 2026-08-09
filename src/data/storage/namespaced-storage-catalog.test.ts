import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  allowedScopeKindsFor,
  isNamespacedModuleId,
  isNamespacedResourcePair,
  isScopeKindAllowedFor,
  listNamespacedCatalogEntries,
  NAMESPACED_STORAGE_CATALOG,
  type StorageScopeKind,
} from "./namespaced-storage-catalog";

const root = path.resolve(__dirname, "../../..");
const SCOPE_KINDS: readonly StorageScopeKind[] = ["unbound", "school", "schoolYear"];

describe("namespaced storage catalog (N1)", () => {
  const entries = listNamespacedCatalogEntries();

  it("every module/resource pair is unique", () => {
    const pairs = entries.map((entry) => `${entry.moduleId}/${entry.resourceId}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("no catalog id contains a separator or is empty", () => {
    for (const entry of entries) {
      expect(entry.moduleId).not.toBe("");
      expect(entry.resourceId).not.toBe("");
      expect(entry.moduleId).not.toContain(":");
      expect(entry.resourceId).not.toContain(":");
      expect(entry.moduleId.trim()).toBe(entry.moduleId);
      expect(entry.resourceId.trim()).toBe(entry.resourceId);
    }
  });

  it("every resource declares at least one allowed scope kind", () => {
    for (const entry of entries) {
      expect(entry.allowedScopeKinds.length).toBeGreaterThan(0);
      expect(new Set(entry.allowedScopeKinds).size).toBe(entry.allowedScopeKinds.length);
      for (const scopeKind of entry.allowedScopeKinds) {
        expect(SCOPE_KINDS).toContain(scopeKind);
      }
    }
  });

  it("Identity Registry and AppContext are not namespaced resources", () => {
    expect(isNamespacedModuleId("identity-registry")).toBe(false);
    expect(isNamespacedModuleId("app-context")).toBe(false);
    expect(Object.keys(NAMESPACED_STORAGE_CATALOG)).not.toContain("identity-registry");
    expect(Object.keys(NAMESPACED_STORAGE_CATALOG)).not.toContain("app-context");
  });

  it("pair validation is not satisfied by globally valid ids", () => {
    expect(isNamespacedResourcePair("phmax-ss", "framework-notes")).toBe(true);
    expect(isNamespacedResourcePair("phmax-pv", "framework-notes")).toBe(false);
    expect(isNamespacedResourcePair("annual-report", "autosave")).toBe(false);
    expect(isNamespacedResourcePair("phmax-pv", "main")).toBe(false);
  });

  it("prototype members never resolve as catalog entries", () => {
    for (const polluted of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(isNamespacedModuleId(polluted)).toBe(false);
      expect(isNamespacedResourcePair("phmax-pv", polluted)).toBe(false);
      expect(allowedScopeKindsFor(polluted, "value")).toBeNull();
    }
  });

  it("scenario label is school level, never school-year level", () => {
    expect(allowedScopeKindsFor("phmax-scenario-label", "value")).toEqual(["unbound", "school"]);
    expect(isScopeKindAllowedFor("phmax-scenario-label", "value", "schoolYear")).toBe(false);
  });

  it("annual report resources are school-year level", () => {
    expect(isScopeKindAllowedFor("annual-report", "main", "schoolYear")).toBe(true);
    expect(isScopeKindAllowedFor("annual-report", "main", "school")).toBe(false);
  });

  it("named snapshot archives stay school level so they survive a year switch", () => {
    for (const moduleId of ["phmax-pv", "phmax-sd", "phmax-zs", "phmax-ss", "phmax-nv75"]) {
      expect(isScopeKindAllowedFor(moduleId, "named-snapshots", "school")).toBe(true);
      expect(isScopeKindAllowedFor(moduleId, "named-snapshots", "schoolYear")).toBe(false);
    }
  });

  it("annual report section resources match the real restore owned-key registry", () => {
    const ownedKeysSource = fs.readFileSync(
      path.join(root, "src/backup/restore/restore-owned-keys.ts"),
      "utf8",
    );
    const registrySections = [
      ...ownedKeysSource.matchAll(/^\s+"(\d{2})": VYROCNI_ZPRAVA_SECTION\d+_LS_KEY,$/gm),
    ].map((match) => match[1]);

    expect(registrySections.length).toBeGreaterThan(0);
    expect(registrySections).not.toContain("03");

    const catalogSections = entries
      .filter((entry) => entry.moduleId === "annual-report" && entry.resourceId.startsWith("section-"))
      .map((entry) => entry.resourceId.replace("section-", ""))
      .sort();

    expect(catalogSections).toEqual([...registrySections].sort());
    expect(isNamespacedResourcePair("annual-report", "personnel")).toBe(true);
    expect(isNamespacedResourcePair("annual-report", "section-03")).toBe(false);
  });

  it("catalog covers every restore-owned physical key except the identity registry", () => {
    const ownedKeysSource = fs.readFileSync(
      path.join(root, "src/backup/restore/restore-owned-keys.ts"),
      "utf8",
    );
    const registrySectionCount = [
      ...ownedKeysSource.matchAll(/^\s+"(\d{2})": VYROCNI_ZPRAVA_SECTION\d+_LS_KEY,$/gm),
    ].length;

    // school-profile 1 + annual-report (main + personnel + sections)
    // + pv/sd/zs/nv75 2 each + ss 3 + scenario-label 1
    const expectedResourceCount = 1 + (2 + registrySectionCount) + 2 * 4 + 3 + 1;
    expect(entries.length).toBe(expectedResourceCount);
  });
});
