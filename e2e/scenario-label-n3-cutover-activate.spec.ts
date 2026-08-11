/**
 * N3-CUTOVER-ACTIVATE E2E — real production owner creates first schema2.
 * Fixture may seed legitimate legacy-committed tuple only — NEVER seed schema2.
 * Tests must NOT call executeScenarioLabelN3AuthorityCutover from browser/test hooks.
 */

import { expect, test, type Page } from "@playwright/test";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import { gotoProductView, openDashboardAdvancedToolsSection } from "./smoke-helpers";
import {
  RESTORE_E2E_SCHOOL_A,
  backupFilePayload,
  buildHappyPathBackupModules,
  modulePayload,
  sampleRestoreIdentity,
  sampleRestoreProfile,
} from "./backup-restore-fixtures";

const LEGACY = "phmax-school-scenario-label";
const V2 = `reditelsky-pruvodce:v2:school:${RESTORE_E2E_SCHOOL_A}:module:phmax-scenario-label:resource:value`;
const MARKER = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const FENCE = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const INIT_FLAG = "n3-cutover-activate-e2e-init";
const LABEL_A = "ACTIVATE-A";
const LABEL_B = "ACTIVATE-B";
const LABEL_C = "ACTIVATE-C";

const crossPhmaxSeed = {
  ...defaultCrossPhmaxSeedKeys(),
  pvRowKey: "pv-n3-cutover-activate-e2e",
  ssRowId: 941,
};

const legacyCommittedFence = JSON.stringify({
  schemaVersion: 1,
  protocolGeneration: 3,
  authority: "legacy",
  markerSchemaVersion: 1,
  schoolId: RESTORE_E2E_SCHOOL_A,
  resource: "phmax-scenario-label/value",
  committedRaw: { exists: true, value: LABEL_A },
});

const syncedLegacyMarker = JSON.stringify({
  schemaVersion: 1,
  authority: "legacy",
  mirrorHealth: "synced",
  authoritativePresence: "present",
});

async function openScenarioLabelInput(page: Page) {
  await openDashboardAdvancedToolsSection(page);
  const input = page.getByLabel("Název scénáře školy (JSON export)");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.scrollIntoViewIfNeeded();
  return input;
}

async function readKeys(page: Page) {
  return page.evaluate(
    ({ legacy, v2, marker, fence }) => ({
      legacy: localStorage.getItem(legacy),
      v2: localStorage.getItem(v2),
      marker: localStorage.getItem(marker),
      fence: localStorage.getItem(fence),
    }),
    { legacy: LEGACY, v2: V2, marker: MARKER, fence: FENCE },
  );
}

function seedLegacyCommittedInit(extra?: {
  fenceJson?: string | null;
  markerJson?: string;
  legacy?: string;
  v2?: string;
  includeProfile?: boolean;
}) {
  return {
    flag: INIT_FLAG,
    schoolId: RESTORE_E2E_SCHOOL_A,
    profileJson: JSON.stringify(sampleRestoreProfile(RESTORE_E2E_SCHOOL_A, "ZŠ ACTIVATE")),
    identityJson: JSON.stringify(sampleRestoreIdentity(RESTORE_E2E_SCHOOL_A)),
    legacy: extra?.legacy ?? LABEL_A,
    v2: extra?.v2 ?? LABEL_A,
    markerJson: extra?.markerJson ?? syncedLegacyMarker,
    fenceJson: extra?.fenceJson === undefined ? legacyCommittedFence : extra.fenceJson,
    includeProfile: extra?.includeProfile !== false,
    keys: {
      legacy: LEGACY,
      v2: V2,
      marker: MARKER,
      fence: FENCE,
      identity: "reditelsky-pruvodce-identity-registry-v1",
      profile: "reditelsky-pruvodce-school-profile-v1",
    },
  };
}

async function seedAndGotoProfile(
  page: Page,
  extra?: Parameters<typeof seedLegacyCommittedInit>[0],
) {
  const seed = seedLegacyCommittedInit(extra);
  await page.addInitScript((payload) => {
    if (sessionStorage.getItem(payload.flag)) return;
    sessionStorage.setItem(payload.flag, "1");
    localStorage.clear();
    localStorage.setItem(payload.keys.identity, payload.identityJson);
    if (payload.includeProfile) {
      localStorage.setItem(payload.keys.profile, payload.profileJson);
    }
    localStorage.setItem(payload.keys.legacy, payload.legacy);
    localStorage.setItem(payload.keys.v2, payload.v2);
    localStorage.setItem(payload.keys.marker, payload.markerJson);
    if (payload.fenceJson != null) {
      localStorage.setItem(payload.keys.fence, payload.fenceJson);
    }
  }, seed);
  await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
  await page.goto("/profil-skoly");
  await expect(page.locator("#sp-name")).toBeVisible({ timeout: 15_000 });
}

async function waitNamespaced(page: Page) {
  await expect
    .poll(async () => {
      const keys = await readKeys(page);
      return keys.marker?.includes('"authority":"namespaced"') ?? false;
    }, { timeout: 15_000 })
    .toBe(true);
}

async function applyRestoreFile(
  page: Page,
  payload: { name: string; mimeType: string; buffer: Buffer },
) {
  await openDashboardAdvancedToolsSection(page);
  await page.getByTestId("dash-backup-restore-entry").scrollIntoViewIfNeeded();
  await page.getByTestId("restore-open").click();
  await expect(page.getByTestId("restore-dialog")).toBeVisible();
  await page.getByTestId("restore-file-input").setInputFiles(payload);
  await expect(page.getByTestId("restore-preview")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("restore-confirmation-token").fill("OBNOVIT");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByTestId("restore-apply").click(),
  ]);
}

test.describe("N3-CUTOVER-ACTIVATE real owner", () => {
  test("E1–E2: Profile mount creates first schema2; business A unchanged; reload keeps A", async ({
    page,
  }) => {
    // Fixture seeds schema1/legacy only (see seedLegacyCommittedInit — never schema2).
    await seedAndGotoProfile(page);
    await waitNamespaced(page);
    const after = await readKeys(page);
    expect(after.legacy).toBe(LABEL_A);
    expect(after.v2).toBe(LABEL_A);
    expect(after.marker).toContain('"schemaVersion":2');
    expect(after.marker).toContain('"authority":"namespaced"');
    const fence = JSON.parse(after.fence!) as {
      authority: string;
      markerSchemaVersion: number;
      committedRaw: { exists: boolean; value?: string };
    };
    expect(fence.authority).toBe("namespaced");
    expect(fence.markerSchemaVersion).toBe(2);
    expect(fence.committedRaw).toEqual({ exists: true, value: LABEL_A });

    await page.reload({ waitUntil: "load" });
    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await expect(input).toHaveValue(LABEL_A);
    const reloaded = await readKeys(page);
    expect(reloaded.marker).toContain('"authority":"namespaced"');
    expect(reloaded.legacy).toBe(LABEL_A);
  });

  test("E3: namespaced edit A→B; reload B", async ({ page }) => {
    await seedAndGotoProfile(page);
    await waitNamespaced(page);
    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await input.fill(LABEL_B);
    await input.blur();
    await expect.poll(async () => (await readKeys(page)).v2).toBe(LABEL_B);
    const keys = await readKeys(page);
    expect(keys.legacy).toBe(LABEL_B);
    expect(keys.marker).toContain('"authority":"namespaced"');
    expect(JSON.parse(keys.fence!).authority).toBe("namespaced");
    expect(JSON.parse(keys.fence!).committedRaw).toEqual({
      exists: true,
      value: LABEL_B,
    });
    await page.reload({ waitUntil: "load" });
    const after = await openScenarioLabelInput(page);
    await expect(after).toHaveValue(LABEL_B);
  });

  test("E4: Backup exports logical B; no authority metadata in backup module", async ({
    page,
  }) => {
    await seedAndGotoProfile(page);
    await waitNamespaced(page);
    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await input.fill(LABEL_B);
    await input.blur();
    await expect.poll(async () => (await readKeys(page)).v2).toBe(LABEL_B);

    await openDashboardAdvancedToolsSection(page);
    await page.getByTestId("dash-backup-export-card").scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("dash-backup-download").click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs");
    const raw = fs.readFileSync(path!, "utf8");
    const json = JSON.parse(raw) as {
      modules: Record<string, { data?: unknown }>;
    };
    expect(json.modules["phmax-scenario-label"]?.data).toBe(LABEL_B);
    expect(raw).not.toContain("protocol-commit");
    expect(raw).not.toContain("migration-state");
    expect(raw).not.toContain('"authority":"namespaced"');
  });

  test("E5: Restore C preserves namespaced authority", async ({ page }) => {
    await seedAndGotoProfile(page);
    await waitNamespaced(page);
    await gotoProductView(page, "dash");
    const modules = buildHappyPathBackupModules();
    modules["phmax-scenario-label"] = modulePayload("Scénář", LABEL_C);
    await applyRestoreFile(page, backupFilePayload(modules));
    await expect.poll(async () => (await readKeys(page)).v2).toBe(LABEL_C);
    const keys = await readKeys(page);
    expect(keys.legacy).toBe(LABEL_C);
    expect(keys.marker).toContain('"schemaVersion":2');
    expect(keys.marker).toContain('"authority":"namespaced"');
    expect(JSON.parse(keys.fence!).authority).toBe("namespaced");
    expect(JSON.parse(keys.fence!).committedRaw).toEqual({
      exists: true,
      value: LABEL_C,
    });
  });

  test("E6: Level B / Full Reset clears business + schema2; fence absent", async ({ page }) => {
    await seedAndGotoProfile(page);
    await waitNamespaced(page);
    await gotoProductView(page, "dash");
    await page.getByTestId("dash-full-reset-entry").scrollIntoViewIfNeeded();
    await page.getByTestId("full-reset-open").click();
    await expect(page.getByTestId("full-reset-dialog")).toBeVisible();
    await page.getByTestId("full-reset-backup").click();
    await page.getByTestId("full-reset-token").fill("SMAZAT");
    await expect(page.getByTestId("full-reset-confirm")).toBeEnabled();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.getByTestId("full-reset-confirm").click(),
    ]);
    const keys = await readKeys(page);
    expect(keys.legacy).toBeNull();
    expect(keys.v2).toBeNull();
    expect(keys.marker).toBeNull();
    expect(keys.fence).toBeNull();
  });

  test("E7: post-cutover Profile remount is namespaced no-op", async ({ page }) => {
    await seedAndGotoProfile(page);
    await waitNamespaced(page);
    const before = await readKeys(page);
    await page.goto("/profil-skoly");
    await expect(page.locator("#sp-name")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);
    const after = await readKeys(page);
    expect(after.marker).toBe(before.marker);
    expect(after.fence).toBe(before.fence);
    expect(after.legacy).toBe(LABEL_A);
    expect(after.marker).toContain('"authority":"namespaced"');
  });

  test("E8: ineligible violated fence (already_ready, no finalize) → no schema2", async ({
    page,
  }) => {
    // Matching legacy/v2 + synced marker, but fence certifies stale raw → VIOLATED.
    // Gate permits establishment; plan is already_ready → early return → 0 cutover.
    await seedAndGotoProfile(page, {
      fenceJson: JSON.stringify({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: RESTORE_E2E_SCHOOL_A,
        resource: "phmax-scenario-label/value",
        committedRaw: { exists: true, value: "STALE-CERT" },
      }),
    });
    await page.waitForTimeout(800);
    const keys = await readKeys(page);
    expect(keys.marker).not.toContain('"schemaVersion":2');
    expect(keys.marker).toContain('"authority":"legacy"');
    expect(keys.marker).toContain('"schemaVersion":1');
    expect(keys.legacy).toBe(LABEL_A);
    expect(keys.fence).toContain("STALE-CERT");
  });

  test("E9: Restore-first-creator ban — Restore keeps legacy; Profile owner may cut over later", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ flag, schoolId }) => {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, "1");
        localStorage.clear();
        localStorage.setItem(
          "reditelsky-pruvodce-identity-registry-v1",
          JSON.stringify({
            schemaVersion: 1,
            schoolId,
            schoolYears: [],
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        );
      },
      { flag: INIT_FLAG, schoolId: RESTORE_E2E_SCHOOL_A },
    );
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");

    const modules = {
      "school-profile": modulePayload(
        "Profil",
        sampleRestoreProfile(RESTORE_E2E_SCHOOL_A, "ZŠ Restore Ban"),
      ),
      "identity-registry": modulePayload(
        "Identita",
        sampleRestoreIdentity(RESTORE_E2E_SCHOOL_A),
      ),
      "phmax-scenario-label": modulePayload("Scénář", "RESTORE-LEGACY"),
    };
    await applyRestoreFile(page, backupFilePayload(modules));
    await expect.poll(async () => (await readKeys(page)).legacy).toBe("RESTORE-LEGACY");
    let keys = await readKeys(page);
    expect(keys.marker).toContain('"schemaVersion":1');
    expect(keys.marker).toContain('"authority":"legacy"');
    expect(keys.marker).not.toContain('"schemaVersion":2');

    // Only normal Profile owner may later create schema2.
    await page.goto("/profil-skoly");
    await expect(page.locator("#sp-name")).toBeVisible({ timeout: 15_000 });
    await waitNamespaced(page);
    keys = await readKeys(page);
    expect(keys.legacy).toBe("RESTORE-LEGACY");
    expect(keys.v2).toBe("RESTORE-LEGACY");
    expect(keys.marker).toContain('"authority":"namespaced"');
  });

  test("E10: Dashboard-only open does not create first schema2", async ({ page }) => {
    const seed = seedLegacyCommittedInit();
    await page.addInitScript((payload) => {
      if (sessionStorage.getItem(payload.flag)) return;
      sessionStorage.setItem(payload.flag, "1");
      localStorage.clear();
      localStorage.setItem(payload.keys.identity, payload.identityJson);
      localStorage.setItem(payload.keys.profile, payload.profileJson);
      localStorage.setItem(payload.keys.legacy, payload.legacy);
      localStorage.setItem(payload.keys.v2, payload.v2);
      localStorage.setItem(payload.keys.marker, payload.markerJson);
      localStorage.setItem(payload.keys.fence, payload.fenceJson!);
    }, seed);
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");
    await openScenarioLabelInput(page);
    await page.waitForTimeout(500);
    const keys = await readKeys(page);
    expect(keys.marker).toContain('"schemaVersion":1');
    expect(keys.marker).toContain('"authority":"legacy"');
    expect(keys.fence).toContain('"authority":"legacy"');
  });
});
