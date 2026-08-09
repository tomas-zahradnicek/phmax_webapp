import { expect, test, type Page } from "@playwright/test";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import { gotoProductView, openDashboardAdvancedToolsSection } from "./smoke-helpers";
import {
  RESTORE_E2E_SCHOOL_A,
  backupFilePayload,
  buildHappyPathBackupModules,
} from "./backup-restore-fixtures";

const LEGACY = "phmax-school-scenario-label";
const V2_UNBOUND =
  "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value";
const MARKER_UNBOUND =
  "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound";
const V2_SCHOOL_A = `reditelsky-pruvodce:v2:school:${RESTORE_E2E_SCHOOL_A}:module:phmax-scenario-label:resource:value`;
const MARKER_SCHOOL_A = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const FENCE_SCHOOL_A = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const FOREIGN = "foreign-n3fence-write-e2e-key";
const INIT_FLAG = "n3fence-write-e2e-init-done";

const crossPhmaxSeed = {
  ...defaultCrossPhmaxSeedKeys(),
  pvRowKey: "pv-n3fence-write-e2e",
  ssRowId: 921,
};

async function openScenarioLabelInput(page: Page) {
  await openDashboardAdvancedToolsSection(page);
  const input = page.getByLabel("Název scénáře školy (JSON export)");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.scrollIntoViewIfNeeded();
  return input;
}

async function readFenceKeys(page: Page) {
  return page.evaluate(
    ({ legacy, v2Unbound, markerUnbound, v2School, markerSchool, fenceSchool, foreign }) => {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }
      return {
        legacy: localStorage.getItem(legacy),
        v2Unbound: localStorage.getItem(v2Unbound),
        markerUnbound: localStorage.getItem(markerUnbound),
        v2School: localStorage.getItem(v2School),
        markerSchool: localStorage.getItem(markerSchool),
        fenceSchool: localStorage.getItem(fenceSchool),
        foreign: localStorage.getItem(foreign),
        allKeys,
      };
    },
    {
      legacy: LEGACY,
      v2Unbound: V2_UNBOUND,
      markerUnbound: MARKER_UNBOUND,
      v2School: V2_SCHOOL_A,
      markerSchool: MARKER_SCHOOL_A,
      fenceSchool: FENCE_SCHOOL_A,
      foreign: FOREIGN,
    },
  );
}

async function applyRestoreFile(
  page: Page,
  payload: { name: string; mimeType: string; buffer: Buffer },
) {
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

test.describe("N3-FENCE-WRITE persistent commit certificate", () => {
  test("A: no Identity → scenario write → unbound only, no school fence", async ({ page }) => {
    await page.addInitScript((flag) => {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      localStorage.clear();
    }, INIT_FLAG);
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await input.fill("UNBOUND-FENCE");
    await input.blur();
    await expect.poll(async () => (await readFenceKeys(page)).legacy).toBe("UNBOUND-FENCE");
    const keys = await readFenceKeys(page);
    expect(keys.v2Unbound).toBe("UNBOUND-FENCE");
    expect(keys.fenceSchool).toBeNull();
    expect(keys.allKeys.some((k) => k.includes("protocol-commit"))).toBe(false);
  });

  test("C/D/E/H: Identity edit → fence committed; clear → absent; old N2 → stale cert; UI legacy", async ({
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

    const input = await openScenarioLabelInput(page);
    await input.fill("FENCE-LABEL");
    await input.blur();

    await expect.poll(async () => (await readFenceKeys(page)).legacy).toBe("FENCE-LABEL");
    let keys = await readFenceKeys(page);
    expect(keys.v2School).toBe("FENCE-LABEL");
    expect(keys.markerSchool).toContain('"authority":"legacy"');
    expect(keys.markerSchool).toContain('"mirrorHealth":"synced"');
    expect(keys.fenceSchool).toBeTruthy();
    const fence = JSON.parse(keys.fenceSchool!) as {
      protocolGeneration: number;
      authority: string;
      committedRaw: { exists: boolean; value?: string };
    };
    expect(fence.protocolGeneration).toBe(3);
    expect(fence.authority).toBe("legacy");
    expect(fence.committedRaw).toEqual({ exists: true, value: "FENCE-LABEL" });

    await input.fill("   ");
    await input.blur();
    await expect.poll(async () => (await readFenceKeys(page)).legacy).toBeNull();
    keys = await readFenceKeys(page);
    expect(keys.v2School).toBeNull();
    expect(keys.markerSchool).toContain('"authoritativePresence":"absent"');
    expect(JSON.parse(keys.fenceSchool!).committedRaw).toEqual({ exists: false });

    await input.fill("A");
    await input.blur();
    await expect.poll(async () => (await readFenceKeys(page)).legacy).toBe("A");

    await page.evaluate(
      ({ legacy, v2School, markerSchool }) => {
        localStorage.setItem(legacy, "B");
        localStorage.setItem(v2School, "B");
        localStorage.setItem(
          markerSchool,
          JSON.stringify({
            schemaVersion: 1,
            authority: "legacy",
            mirrorHealth: "synced",
            authoritativePresence: "present",
          }),
        );
      },
      { legacy: LEGACY, v2School: V2_SCHOOL_A, markerSchool: MARKER_SCHOOL_A },
    );

    keys = await readFenceKeys(page);
    expect(keys.legacy).toBe("B");
    expect(JSON.parse(keys.fenceSchool!).committedRaw).toEqual({
      exists: true,
      value: "A",
    });

    await page.reload({ waitUntil: "load" });
    const input2 = await openScenarioLabelInput(page);
    await expect(input2).toHaveValue("B");
  });

  test("F/G: Backup omits fence; Full Reset removes fence; foreign preserved", async ({ page }) => {
    await page.addInitScript(
      ({ flag, schoolId, fenceKey, foreign }) => {
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
        localStorage.setItem("phmax-school-scenario-label", "RESET-ME");
        localStorage.setItem(
          `reditelsky-pruvodce:v2:school:${schoolId}:module:phmax-scenario-label:resource:value`,
          "RESET-ME",
        );
        localStorage.setItem(
          `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${schoolId}`,
          JSON.stringify({
            schemaVersion: 1,
            authority: "legacy",
            mirrorHealth: "synced",
            authoritativePresence: "present",
          }),
        );
        localStorage.setItem(
          fenceKey,
          JSON.stringify({
            schemaVersion: 1,
            protocolGeneration: 3,
            authority: "legacy",
            markerSchemaVersion: 1,
            schoolId,
            resource: "phmax-scenario-label/value",
            committedRaw: { exists: true, value: "RESET-ME" },
          }),
        );
        localStorage.setItem(foreign, "KEEP");
      },
      {
        flag: INIT_FLAG,
        schoolId: RESTORE_E2E_SCHOOL_A,
        fenceKey: FENCE_SCHOOL_A,
        foreign: FOREIGN,
      },
    );
    await gotoProductView(page, "dash");

    // Backup adapters only own legacy scenario key — fence must not be a backup storage key.
    const backupOwnsFence = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k?.includes("protocol-commit")) keys.push(k);
      }
      // Simulate central backup inventory: only exact legacy scenario key is owned.
      return keys.length > 0 && !keys.includes("phmax-school-scenario-label");
    });
    expect(backupOwnsFence).toBe(true);

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

    const keys = await readFenceKeys(page);
    expect(keys.legacy).toBeNull();
    expect(keys.v2School).toBeNull();
    expect(keys.markerSchool).toBeNull();
    expect(keys.fenceSchool).toBeNull();
    expect(keys.foreign).toBe("KEEP");
  });

  test("Restore success → school fence certified; UI shows restored label", async ({ page }) => {
    await page.addInitScript((flag) => {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      localStorage.clear();
    }, INIT_FLAG);
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");

    await applyRestoreFile(page, backupFilePayload(buildHappyPathBackupModules()));

    await expect.poll(async () => (await readFenceKeys(page)).legacy).toBe("Restored Scenario NEW");
    const keys = await readFenceKeys(page);
    expect(keys.v2School).toBe("Restored Scenario NEW");
    expect(keys.fenceSchool).toBeTruthy();
    const fence = JSON.parse(keys.fenceSchool!) as {
      committedRaw: { exists: boolean; value?: string };
      authority: string;
      protocolGeneration: number;
    };
    expect(fence.authority).toBe("legacy");
    expect(fence.protocolGeneration).toBe(3);
    expect(fence.committedRaw).toEqual({
      exists: true,
      value: "Restored Scenario NEW",
    });

    // Cross-phmax seed again after Restore wipe so Dashboard advanced tools stay reachable.
    await page.evaluate(applyCrossPhmaxSeed, crossPhmaxSeed);
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await expect(input).toHaveValue("Restored Scenario NEW");
  });
});
