import { expect, test, type Page } from "@playwright/test";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import { gotoProductView, openDashboardAdvancedToolsSection } from "./smoke-helpers";
import {
  RESTORE_E2E_SCHOOL_A,
  backupFilePayload,
  buildHappyPathBackupModules,
  modulePayload,
} from "./backup-restore-fixtures";

const LEGACY = "phmax-school-scenario-label";
const V2_UNBOUND =
  "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value";
const MARKER_UNBOUND =
  "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound";
const V2_SCHOOL_A = `reditelsky-pruvodce:v2:school:${RESTORE_E2E_SCHOOL_A}:module:phmax-scenario-label:resource:value`;
const MARKER_SCHOOL_A = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const FOREIGN = "foreign-n2write-e2e-key";
const INIT_FLAG = "n2write-e2e-init-done";

const crossPhmaxSeed = {
  ...defaultCrossPhmaxSeedKeys(),
  pvRowKey: "pv-n2write-e2e",
  ssRowId: 901,
};

async function readN2Keys(page: Page) {
  return page.evaluate(
    ({ legacy, v2Unbound, markerUnbound, v2School, markerSchool, foreign }) => {
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
        foreign: localStorage.getItem(foreign),
        identity: localStorage.getItem("reditelsky-pruvodce-identity-registry-v1"),
        appContext: localStorage.getItem("reditelsky-pruvodce-app-context-v1"),
        allKeys,
      };
    },
    {
      legacy: LEGACY,
      v2Unbound: V2_UNBOUND,
      markerUnbound: MARKER_UNBOUND,
      v2School: V2_SCHOOL_A,
      markerSchool: MARKER_SCHOOL_A,
      foreign: FOREIGN,
    },
  );
}

async function openScenarioLabelInput(page: Page) {
  await openDashboardAdvancedToolsSection(page);
  const input = page.getByLabel("Název scénáře školy (JSON export)");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.scrollIntoViewIfNeeded();
  return input;
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

test.describe("N2-WRITE scenario-label v2 shadow", () => {
  test("E2E-1: Dashboard edit creates legacy + unbound shadow + marker", async ({ page }) => {
    await page.addInitScript(
      ({ flag, seed }) => {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, "1");
        localStorage.clear();
        // Seed applied by second init script; flag only gates clear.
        void seed;
      },
      { flag: INIT_FLAG, seed: crossPhmaxSeed },
    );
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await input.fill("N2WRITE NEW");
    await expect(input).toHaveValue("N2WRITE NEW");

    const keys = await readN2Keys(page);
    expect(keys.legacy).toBe("N2WRITE NEW");
    expect(keys.v2Unbound).toBe("N2WRITE NEW");
    expect(keys.markerUnbound).toContain('"mirrorHealth":"synced"');
    expect(keys.markerUnbound).toContain('"authoritativePresence":"present"');
    expect(keys.v2School).toBeNull();
  });

  test("E2E-2: backup/restore roundtrip keeps logical payload and physical triple", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ legacy, foreign, flag }) => {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, "1");
        localStorage.clear();
        localStorage.setItem(legacy, "Roundtrip OLD");
        localStorage.setItem(foreign, "KEEP");
      },
      { legacy: LEGACY, foreign: FOREIGN, flag: INIT_FLAG },
    );
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");

    const input = await openScenarioLabelInput(page);
    await input.fill("Roundtrip NEW");

    await page.getByTestId("dash-backup-export-card").scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("dash-backup-download").click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const fs = await import("node:fs");
    const envelope = JSON.parse(fs.readFileSync(downloadPath!, "utf8")) as {
      schemaVersion: number;
      modules: Record<string, { data?: unknown }>;
    };
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.modules["phmax-scenario-label"]?.data).toBe("Roundtrip NEW");

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "load" });

    await applyRestoreFile(page, {
      name: "n2write-roundtrip.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(envelope), "utf8"),
    });

    const keys = await readN2Keys(page);
    expect(keys.legacy).toBe("Roundtrip NEW");
    expect(keys.v2Unbound).toBe("Roundtrip NEW");
    expect(keys.markerUnbound).toContain('"mirrorHealth":"synced"');
  });

  test("E2E-3: scenario-only backup into empty browser → unbound, no Identity", async ({
    page,
  }) => {
    await page.addInitScript((flag) => {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      localStorage.clear();
    }, INIT_FLAG);
    await gotoProductView(page, "dash");

    await applyRestoreFile(
      page,
      backupFilePayload({
        "phmax-scenario-label": modulePayload("Scénář", "Scenario Only NEW"),
      }),
    );

    const keys = await readN2Keys(page);
    expect(keys.legacy).toBe("Scenario Only NEW");
    expect(keys.v2Unbound).toBe("Scenario Only NEW");
    expect(keys.markerUnbound).toContain('"authority":"legacy"');
    expect(keys.identity).toBeNull();
    expect(keys.appContext).toBeNull();
    expect(keys.v2School).toBeNull();
  });

  test("E2E-4: modern full backup Identity A → school:A, no unbound key", async ({ page }) => {
    await page.addInitScript((flag) => {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
      localStorage.clear();
    }, INIT_FLAG);
    await gotoProductView(page, "dash");

    await applyRestoreFile(page, backupFilePayload(buildHappyPathBackupModules()));

    const keys = await readN2Keys(page);
    expect(keys.legacy).toBe("Restored Scenario NEW");
    expect(keys.v2School).toBe("Restored Scenario NEW");
    expect(keys.markerSchool).toContain('"mirrorHealth":"synced"');
    expect(keys.v2Unbound).toBeNull();
    expect(keys.allKeys.some((k) => k.includes(":unbound:module:phmax-scenario-label:"))).toBe(
      false,
    );
  });

  test("E2E-5: Full Reset removes legacy/v2/marker; foreign preserved", async ({ page }) => {
    await page.addInitScript(
      ({ legacy, v2, marker, foreign, flag }) => {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, "1");
        localStorage.clear();
        localStorage.setItem(legacy, "RESET-ME");
        localStorage.setItem(v2, "RESET-ME");
        localStorage.setItem(
          marker,
          JSON.stringify({
            schemaVersion: 1,
            authority: "legacy",
            mirrorHealth: "synced",
            authoritativePresence: "present",
          }),
        );
        localStorage.setItem(foreign, "KEEP");
      },
      { legacy: LEGACY, v2: V2_UNBOUND, marker: MARKER_UNBOUND, foreign: FOREIGN, flag: INIT_FLAG },
    );
    await gotoProductView(page, "dash");

    await page.getByTestId("dash-full-reset-entry").scrollIntoViewIfNeeded();
    await page.getByTestId("full-reset-open").click();
    await expect(page.getByTestId("full-reset-dialog")).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("full-reset-backup").click();
    await downloadPromise;
    await page.getByTestId("full-reset-token").fill("SMAZAT");
    await expect(page.getByTestId("full-reset-confirm")).toBeEnabled();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.getByTestId("full-reset-confirm").click(),
    ]);

    const keys = await readN2Keys(page);
    expect(keys.legacy).toBeNull();
    expect(keys.v2Unbound).toBeNull();
    expect(keys.markerUnbound).toBeNull();
    expect(keys.foreign).toBe("KEEP");
  });
});
