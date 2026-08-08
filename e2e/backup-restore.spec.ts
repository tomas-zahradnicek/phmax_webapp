import { expect, test, type Page } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";
import {
  RESTORE_E2E_KEYS,
  RESTORE_E2E_SCHOOL_A,
  RESTORE_E2E_SCHOOL_B,
  RESTORE_E2E_YEAR_ID,
  backupFilePayload,
  buildCrossSchoolBackupModules,
  buildHappyPathBackupModules,
  buildPartialBackupModules,
} from "./backup-restore-fixtures";

type StorageSnapshot = {
  profileName: string | null;
  identitySchoolId: string | null;
  identityYears: Array<{ id: string; startYear: number }>;
  appContextSchoolId: string | null;
  appContextYearId: string | null;
  scenario: string | null;
  calculator: string | null;
  foreign: string | null;
  vzSchoolYear: string | null;
};

async function readStorageSnapshot(page: Page): Promise<StorageSnapshot> {
  return page.evaluate((keys) => {
    const profileRaw = localStorage.getItem(keys.profile);
    const identityRaw = localStorage.getItem(keys.identity);
    const appContextRaw = localStorage.getItem(keys.appContext);
    const vzRaw = localStorage.getItem(keys.vzMain);

    let profileName: string | null = null;
    if (profileRaw) {
      try {
        profileName = (JSON.parse(profileRaw) as { name?: string }).name ?? null;
      } catch {
        profileName = null;
      }
    }

    let identitySchoolId: string | null = null;
    let identityYears: Array<{ id: string; startYear: number }> = [];
    if (identityRaw) {
      try {
        const identity = JSON.parse(identityRaw) as {
          schoolId?: string;
          schoolYears?: Array<{ id: string; startYear: number }>;
        };
        identitySchoolId = identity.schoolId ?? null;
        identityYears = identity.schoolYears ?? [];
      } catch {
        identitySchoolId = null;
      }
    }

    let appContextSchoolId: string | null = null;
    let appContextYearId: string | null = null;
    if (appContextRaw) {
      try {
        const ctx = JSON.parse(appContextRaw) as {
          activeSchoolId?: string | null;
          activeSchoolYearId?: string | null;
        };
        appContextSchoolId = ctx.activeSchoolId ?? null;
        appContextYearId = ctx.activeSchoolYearId ?? null;
      } catch {
        appContextSchoolId = null;
      }
    }

    let vzSchoolYear: string | null = null;
    if (vzRaw) {
      try {
        vzSchoolYear =
          (JSON.parse(vzRaw) as { report?: { schoolYear?: string } }).report?.schoolYear ?? null;
      } catch {
        vzSchoolYear = null;
      }
    }

    return {
      profileName,
      identitySchoolId,
      identityYears,
      appContextSchoolId,
      appContextYearId,
      scenario: localStorage.getItem(keys.scenario),
      calculator: localStorage.getItem(keys.calculator),
      foreign: localStorage.getItem(keys.foreign),
      vzSchoolYear,
    };
  }, RESTORE_E2E_KEYS);
}

const RESTORE_E2E_INIT_FLAG = "restore-e2e-init-done";

async function seedHappyPathLocalState(page: Page): Promise<void> {
  await page.addInitScript(
    ({ keys, schoolA, schoolB, staleYearId, initFlag }) => {
      if (sessionStorage.getItem(initFlag)) return;
      sessionStorage.setItem(initFlag, "1");
      localStorage.clear();
      localStorage.setItem(
        keys.profile,
        JSON.stringify({
          id: schoolA,
          name: "ZŠ Local OLD",
          ico: "12345678",
          redIzo: "600123456",
          izo: "102345678",
          schoolType: "Základní škola",
          address: "Hlavní 1",
          municipality: "Praha",
          region: "Hlavní město Praha",
          founder: "Město",
          principalName: "Jan Novák",
          website: "https://skola.cz",
          email: "a@b.cz",
          phone: "123",
          dataBox: "abcdefg",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        }),
      );
      localStorage.setItem(
        keys.identity,
        JSON.stringify({
          schemaVersion: 1,
          schoolId: schoolA,
          schoolYears: [{ id: staleYearId, schoolId: schoolA, startYear: 2024 }],
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      );
      localStorage.setItem(
        keys.appContext,
        JSON.stringify({
          schemaVersion: 1,
          activeSchoolId: schoolB,
          activeSchoolYearId: staleYearId,
        }),
      );
      localStorage.setItem(keys.scenario, "Local Scenario OLD");
      localStorage.setItem(keys.foreign, "KEEP");
    },
    {
      keys: RESTORE_E2E_KEYS,
      schoolA: RESTORE_E2E_SCHOOL_A,
      schoolB: RESTORE_E2E_SCHOOL_B,
      staleYearId: "dddddddd-eeee-4fff-8000-111111111111",
      initFlag: RESTORE_E2E_INIT_FLAG,
    },
  );
}

async function seedPartialLocalState(page: Page): Promise<void> {
  await page.addInitScript(
    ({ keys, schoolA, staleYearId, initFlag }) => {
      if (sessionStorage.getItem(initFlag)) return;
      sessionStorage.setItem(initFlag, "1");
      localStorage.clear();
      localStorage.setItem(
        keys.profile,
        JSON.stringify({
          id: schoolA,
          name: "KEEP_LOCAL Profile",
          ico: "12345678",
          redIzo: "600123456",
          izo: "102345678",
          schoolType: "Základní škola",
          address: "Hlavní 1",
          municipality: "Praha",
          region: "Hlavní město Praha",
          founder: "Město",
          principalName: "Jan Novák",
          website: "",
          email: "a@b.cz",
          phone: "",
          dataBox: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        }),
      );
      localStorage.setItem(
        keys.identity,
        JSON.stringify({
          schemaVersion: 1,
          schoolId: schoolA,
          schoolYears: [{ id: staleYearId, schoolId: schoolA, startYear: 2024 }],
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      );
      localStorage.setItem(keys.scenario, "Partial Scenario OLD");
      localStorage.setItem(keys.calculator, JSON.stringify({ autosave: { rows: [{ id: "keep-local" }] } }));
      localStorage.setItem(keys.foreign, "KEEP");
    },
    {
      keys: RESTORE_E2E_KEYS,
      schoolA: RESTORE_E2E_SCHOOL_A,
      staleYearId: "dddddddd-eeee-4fff-8000-111111111111",
      initFlag: RESTORE_E2E_INIT_FLAG,
    },
  );
}

async function seedCrossSchoolLocalState(page: Page): Promise<void> {
  await page.addInitScript(
    ({ keys, schoolA, staleYearId, initFlag }) => {
      if (sessionStorage.getItem(initFlag)) return;
      sessionStorage.setItem(initFlag, "1");
      localStorage.clear();
      localStorage.setItem(
        keys.profile,
        JSON.stringify({
          id: schoolA,
          name: "ZŠ Local A",
          ico: "12345678",
          redIzo: "600123456",
          izo: "102345678",
          schoolType: "Základní škola",
          address: "Hlavní 1",
          municipality: "Praha",
          region: "Hlavní město Praha",
          founder: "Město",
          principalName: "Jan Novák",
          website: "",
          email: "a@b.cz",
          phone: "",
          dataBox: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        }),
      );
      localStorage.setItem(
        keys.identity,
        JSON.stringify({
          schemaVersion: 1,
          schoolId: schoolA,
          schoolYears: [{ id: staleYearId, schoolId: schoolA, startYear: 2024 }],
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      );
      localStorage.setItem(keys.scenario, "Cross-school local scenario");
      localStorage.setItem(keys.foreign, "KEEP");
    },
    {
      keys: RESTORE_E2E_KEYS,
      schoolA: RESTORE_E2E_SCHOOL_A,
      staleYearId: "dddddddd-eeee-4fff-8000-111111111111",
      initFlag: RESTORE_E2E_INIT_FLAG,
    },
  );
}

async function openRestoreDialog(page: Page): Promise<void> {
  await page.getByTestId("dash-backup-restore-entry").scrollIntoViewIfNeeded();
  await page.getByTestId("restore-open").click();
  await expect(page.getByTestId("restore-dialog")).toBeVisible();
}

async function uploadBackupFile(
  page: Page,
  payload: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  await page.getByTestId("restore-file-input").setInputFiles(payload);
  await expect(page.getByTestId("restore-preview")).toBeVisible({ timeout: 15_000 });
}

async function confirmAndApplyRestore(page: Page): Promise<void> {
  const apply = page.getByTestId("restore-apply");
  await expect(apply).toBeDisabled();
  await page.getByTestId("restore-confirmation-token").fill("OBNOVIT");
  await expect(apply).toBeEnabled();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    apply.click(),
  ]);
}

test.describe("Centrální obnova ze zálohy", () => {
  test("E2E-1: same-school restore projde preview, apply a reload", async ({ page }) => {
    await seedHappyPathLocalState(page);
    await gotoProductView(page, "dash");
    await openRestoreDialog(page);

    await uploadBackupFile(page, backupFilePayload(buildHappyPathBackupModules()));

    await expect(page.getByTestId("restore-preview")).toContainText("ZŠ Restored B");
    await expect(page.getByTestId("restore-preview")).toContainText("Scénář školy");
    await expect(page.getByTestId("restore-apply")).toBeDisabled();

    await confirmAndApplyRestore(page);

    await expect(page.getByTestId("restore-dialog")).toHaveCount(0);
    await expect(page.getByTestId("dash-backup-export-card")).toBeVisible();

    const storage = await readStorageSnapshot(page);
    expect(storage.foreign).toBe("KEEP");
    expect(storage.identitySchoolId).toBe(RESTORE_E2E_SCHOOL_A);
    expect(storage.profileName).toBe("ZŠ Restored B");
    expect(storage.scenario).toBe("Restored Scenario NEW");
    expect(storage.vzSchoolYear).toBe("2026/2027");
    expect(storage.appContextSchoolId).toBe(RESTORE_E2E_SCHOOL_A);
    expect(storage.appContextYearId).toBe(RESTORE_E2E_YEAR_ID);
    expect(storage.identityYears.some((year) => year.startYear === 2026 && year.id === RESTORE_E2E_YEAR_ID)).toBe(
      true,
    );

    await expect(page.locator(".dash-school-profile__scenario")).toContainText("Restored Scenario NEW");
  });

  test("E2E-2: partial backup nahradí scénář a zachová chybějící modul", async ({ page }) => {
    await seedPartialLocalState(page);
    await gotoProductView(page, "dash");
    await openRestoreDialog(page);

    await uploadBackupFile(page, backupFilePayload(buildPartialBackupModules()));
    await confirmAndApplyRestore(page);

    const storage = await readStorageSnapshot(page);
    expect(storage.scenario).toBe("Partial Scenario NEW");
    expect(storage.profileName).toBe("KEEP_LOCAL Profile");
    expect(storage.calculator).toContain("keep-local");
    expect(storage.foreign).toBe("KEEP");
  });

  test("E2E-3: cross-school backup je blocked bez apply a bez storage změn", async ({ page }) => {
    await seedCrossSchoolLocalState(page);
    await gotoProductView(page, "dash");
    await openRestoreDialog(page);

    const before = await readStorageSnapshot(page);
    await page.getByTestId("restore-file-input").setInputFiles(
      backupFilePayload(buildCrossSchoolBackupModules()),
    );

    await expect(page.getByTestId("restore-preview-blocked")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("restore-preview-blocked")).toContainText(/jiné škole/i);
    await expect(page.getByTestId("restore-full-reset-soft-cta")).toBeVisible();
    await expect(page.getByTestId("restore-confirmation")).toHaveCount(0);
    await expect(page.getByTestId("restore-apply")).toHaveCount(0);

    const blockedText = await page.getByTestId("restore-preview-blocked").innerText();
    expect(blockedText).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
    expect(blockedText).not.toContain(RESTORE_E2E_SCHOOL_A);
    expect(blockedText).not.toContain(RESTORE_E2E_SCHOOL_B);

    const after = await readStorageSnapshot(page);
    expect(after).toEqual(before);
  });

  test("E2E-4: invalid JSON a následný validní soubor", async ({ page }) => {
    await seedHappyPathLocalState(page);
    await gotoProductView(page, "dash");
    await openRestoreDialog(page);

    const before = await readStorageSnapshot(page);

    await page.getByTestId("restore-file-input").setInputFiles({
      name: "invalid-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from("{not-json"),
    });

    await expect(page.getByTestId("restore-dialog-error")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("restore-apply")).toHaveCount(0);
    expect(await readStorageSnapshot(page)).toEqual(before);

    await uploadBackupFile(page, backupFilePayload(buildHappyPathBackupModules()));
    await expect(page.getByTestId("restore-preview")).toContainText("ZŠ Restored B");
    await expect(page.getByTestId("restore-confirmation")).toBeVisible();
  });
});
