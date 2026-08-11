import { expect, test, type Page } from "@playwright/test";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import { gotoProductView, openDashboardAdvancedToolsSection } from "./smoke-helpers";
import {
  RESTORE_E2E_SCHOOL_A,
  sampleRestoreIdentity,
  sampleRestoreProfile,
} from "./backup-restore-fixtures";

const LEGACY = "phmax-school-scenario-label";
const V2_UNBOUND =
  "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value";
const V2_SCHOOL_A = `reditelsky-pruvodce:v2:school:${RESTORE_E2E_SCHOOL_A}:module:phmax-scenario-label:resource:value`;
const MARKER_SCHOOL_A = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const FENCE_SCHOOL_A = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const IDENTITY = "reditelsky-pruvodce-identity-registry-v1";
const PROFILE = "reditelsky-pruvodce-school-profile-v1";
const INIT_FLAG = "n3prep-e2e-init-done";
const LABEL_A = "PREP-LABEL-A";
const LABEL_B = "PREP-LABEL-B";

const syncedPresentMarker = JSON.stringify({
  schemaVersion: 1,
  authority: "legacy",
  mirrorHealth: "synced",
  authoritativePresence: "present",
});

const dirtyPresentMarker = JSON.stringify({
  schemaVersion: 1,
  authority: "legacy",
  mirrorHealth: "dirty",
  authoritativePresence: "present",
});

const crossPhmaxSeed = {
  ...defaultCrossPhmaxSeedKeys(),
  pvRowKey: "pv-n3prep-e2e",
  ssRowId: 931,
};

async function openScenarioLabelInput(page: Page) {
  await openDashboardAdvancedToolsSection(page);
  const input = page.getByLabel("Název scénáře školy (JSON export)");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.scrollIntoViewIfNeeded();
  return input;
}

async function readPrepKeys(page: Page) {
  return page.evaluate(
    ({ legacy, v2School, markerSchool, fenceSchool, v2Unbound }) => {
      return {
        legacy: localStorage.getItem(legacy),
        v2School: localStorage.getItem(v2School),
        markerSchool: localStorage.getItem(markerSchool),
        fenceSchool: localStorage.getItem(fenceSchool),
        v2Unbound: localStorage.getItem(v2Unbound),
      };
    },
    {
      legacy: LEGACY,
      v2School: V2_SCHOOL_A,
      markerSchool: MARKER_SCHOOL_A,
      fenceSchool: FENCE_SCHOOL_A,
      v2Unbound: V2_UNBOUND,
    },
  );
}

function seedHealthyUnestablishedInit(extra?: {
  fenceJson?: string | null;
  markerJson?: string;
  legacy?: string;
  v2School?: string;
  includeIdentity?: boolean;
  includeProfile?: boolean;
}) {
  const includeIdentity = extra?.includeIdentity !== false;
  const includeProfile = extra?.includeProfile !== false;
  return {
    flag: INIT_FLAG,
    schoolId: RESTORE_E2E_SCHOOL_A,
    profileJson: JSON.stringify(sampleRestoreProfile(RESTORE_E2E_SCHOOL_A, "ZŠ N3-PREP E2E")),
    identityJson: JSON.stringify(sampleRestoreIdentity(RESTORE_E2E_SCHOOL_A)),
    legacy: extra?.legacy ?? LABEL_A,
    v2School: extra?.v2School ?? LABEL_A,
    markerJson: extra?.markerJson ?? syncedPresentMarker,
    fenceJson: extra?.fenceJson === undefined ? null : extra.fenceJson,
    includeIdentity,
    includeProfile,
    keys: {
      legacy: LEGACY,
      v2School: V2_SCHOOL_A,
      markerSchool: MARKER_SCHOOL_A,
      fenceSchool: FENCE_SCHOOL_A,
      identity: IDENTITY,
      profile: PROFILE,
      v2Unbound: V2_UNBOUND,
    },
  };
}

async function seedAndGotoProfile(
  page: Page,
  extra?: Parameters<typeof seedHealthyUnestablishedInit>[0],
) {
  const seed = seedHealthyUnestablishedInit(extra);
  await page.addInitScript((payload) => {
    if (sessionStorage.getItem(payload.flag)) return;
    sessionStorage.setItem(payload.flag, "1");
    localStorage.clear();
    if (payload.includeIdentity) {
      localStorage.setItem(payload.keys.identity, payload.identityJson);
    }
    if (payload.includeProfile) {
      localStorage.setItem(payload.keys.profile, payload.profileJson);
    }
    localStorage.setItem(payload.keys.legacy, payload.legacy);
    localStorage.setItem(payload.keys.v2School, payload.v2School);
    localStorage.setItem(payload.keys.markerSchool, payload.markerJson);
    localStorage.setItem(payload.keys.v2Unbound, "UNBOUND-RESIDUE");
    if (payload.fenceJson != null) {
      localStorage.setItem(payload.keys.fenceSchool, payload.fenceJson);
    }
  }, seed);
  await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
  await page.goto("/profil-skoly");
  await expect(page.locator("#sp-name")).toBeVisible({ timeout: 15_000 });
}

test.describe("N3-PREP healthy UNESTABLISHED fence preparation", () => {
  test("E1: healthy school no fence → Profile mount PREP → cutover NAMESPACED_COMMITTED", async ({
    page,
  }) => {
    await seedAndGotoProfile(page);
    await expect
      .poll(async () => (await readPrepKeys(page)).fenceSchool, { timeout: 15_000 })
      .toBeTruthy();
    const keys = await readPrepKeys(page);
    expect(keys.legacy).toBe(LABEL_A);
    expect(keys.v2School).toBe(LABEL_A);
    expect(keys.markerSchool).toContain('"authority":"namespaced"');
    expect(keys.markerSchool).toContain('"schemaVersion":2');
    expect(keys.markerSchool).toContain('"mirrorHealth":"synced"');
    const fence = JSON.parse(keys.fenceSchool!) as {
      protocolGeneration: number;
      authority: string;
      markerSchemaVersion: number;
      committedRaw: { exists: boolean; value?: string };
    };
    expect(fence.protocolGeneration).toBe(3);
    expect(fence.authority).toBe("namespaced");
    expect(fence.markerSchemaVersion).toBe(2);
    expect(fence.committedRaw).toEqual({ exists: true, value: LABEL_A });
    expect(keys.v2Unbound).toBe("UNBOUND-RESIDUE");
  });

  test("E2: valid legacy fence already exists → ACTIVATE cutover to namespaced", async ({ page }) => {
    const existingFence = JSON.stringify({
      schemaVersion: 1,
      protocolGeneration: 3,
      authority: "legacy",
      markerSchemaVersion: 1,
      schoolId: RESTORE_E2E_SCHOOL_A,
      resource: "phmax-scenario-label/value",
      committedRaw: { exists: true, value: LABEL_A },
    });
    await seedAndGotoProfile(page, { fenceJson: existingFence });
    await expect
      .poll(async () => {
        const keys = await readPrepKeys(page);
        return keys.markerSchool?.includes('"authority":"namespaced"') ?? false;
      }, { timeout: 15_000 })
      .toBe(true);
    const keys = await readPrepKeys(page);
    expect(keys.fenceSchool).not.toBe(existingFence);
    expect(JSON.parse(keys.fenceSchool!).authority).toBe("namespaced");
    expect(keys.legacy).toBe(LABEL_A);
    expect(keys.v2School).toBe(LABEL_A);
  });

  test("E3: VIOLATED fence → not replaced", async ({ page }) => {
    const violatedFence = JSON.stringify({
      schemaVersion: 1,
      protocolGeneration: 3,
      authority: "legacy",
      markerSchemaVersion: 1,
      schoolId: RESTORE_E2E_SCHOOL_A,
      resource: "phmax-scenario-label/value",
      committedRaw: { exists: true, value: "OLD-CERT" },
    });
    await seedAndGotoProfile(page, { fenceJson: violatedFence });
    await expect
      .poll(async () => (await readPrepKeys(page)).fenceSchool, { timeout: 10_000 })
      .toBe(violatedFence);
  });

  test("E4: INVALID fence → not replaced", async ({ page }) => {
    await seedAndGotoProfile(page, { fenceJson: "{broken-fence" });
    await expect
      .poll(async () => (await readPrepKeys(page)).fenceSchool, { timeout: 10_000 })
      .toBe("{broken-fence");
  });

  test("E5: legacy/v2 mismatch on Dashboard → no PREP fence invent", async ({ page }) => {
    const seed = seedHealthyUnestablishedInit({ legacy: LABEL_A, v2School: LABEL_B });
    await page.addInitScript((payload) => {
      if (sessionStorage.getItem(payload.flag)) return;
      sessionStorage.setItem(payload.flag, "1");
      localStorage.clear();
      localStorage.setItem(payload.keys.identity, payload.identityJson);
      localStorage.setItem(payload.keys.profile, payload.profileJson);
      localStorage.setItem(payload.keys.legacy, payload.legacy);
      localStorage.setItem(payload.keys.v2School, payload.v2School);
      localStorage.setItem(payload.keys.markerSchool, payload.markerJson);
    }, seed);
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");
    await openScenarioLabelInput(page);
    const keys = await readPrepKeys(page);
    expect(keys.fenceSchool).toBeNull();
    expect(keys.legacy).toBe(LABEL_A);
    expect(keys.v2School).toBe(LABEL_B);
  });

  test("E6: dirty marker on Dashboard → no PREP fence invent", async ({ page }) => {
    const seed = seedHealthyUnestablishedInit({ markerJson: dirtyPresentMarker });
    await page.addInitScript((payload) => {
      if (sessionStorage.getItem(payload.flag)) return;
      sessionStorage.setItem(payload.flag, "1");
      localStorage.clear();
      localStorage.setItem(payload.keys.identity, payload.identityJson);
      localStorage.setItem(payload.keys.profile, payload.profileJson);
      localStorage.setItem(payload.keys.legacy, payload.legacy);
      localStorage.setItem(payload.keys.v2School, payload.v2School);
      localStorage.setItem(payload.keys.markerSchool, payload.markerJson);
    }, seed);
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");
    await openScenarioLabelInput(page);
    const keys = await readPrepKeys(page);
    expect(keys.fenceSchool).toBeNull();
    expect(keys.markerSchool).toContain('"mirrorHealth":"dirty"');
  });

  test("E7: missing Identity → no school fence", async ({ page }) => {
    const seed = seedHealthyUnestablishedInit({
      includeIdentity: false,
      includeProfile: false,
    });
    await page.addInitScript((payload) => {
      if (sessionStorage.getItem(payload.flag)) return;
      sessionStorage.setItem(payload.flag, "1");
      localStorage.clear();
      localStorage.setItem(payload.keys.legacy, payload.legacy);
      localStorage.setItem(payload.keys.v2School, payload.v2School);
      localStorage.setItem(payload.keys.markerSchool, payload.markerJson);
    }, seed);
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);
    await gotoProductView(page, "dash");
    await openScenarioLabelInput(page);
    const keys = await readPrepKeys(page);
    expect(keys.fenceSchool).toBeNull();
  });

  test("E8 + old writer: after namespaced cutover, incompatible legacy mutation stays fail-closed", async ({
    page,
  }) => {
    await seedAndGotoProfile(page);
    await expect
      .poll(async () => {
        const keys = await readPrepKeys(page);
        return keys.markerSchool?.includes('"authority":"namespaced"') ?? false;
      }, { timeout: 15_000 })
      .toBe(true);

    await page.reload({ waitUntil: "load" });
    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await expect(input).toHaveValue(LABEL_A);

    // Emulate old N2 writer: overwrite legacy+v2+v1 marker without namespaced fence update.
    await page.evaluate(
      ({ legacy, v2School, markerSchool, labelB, marker }) => {
        localStorage.setItem(legacy, labelB);
        localStorage.setItem(v2School, labelB);
        localStorage.setItem(markerSchool, marker);
      },
      {
        legacy: LEGACY,
        v2School: V2_SCHOOL_A,
        markerSchool: MARKER_SCHOOL_A,
        labelB: LABEL_B,
        marker: JSON.stringify({
          schemaVersion: 1,
          authority: "legacy",
          mirrorHealth: "synced",
          authoritativePresence: "present",
        }),
      },
    );

    await page.reload({ waitUntil: "load" });
    await gotoProductView(page, "dash");
    const inputAfter = await openScenarioLabelInput(page);
    // AWARE fail-closed: must not silently treat old-writer B as healthy namespaced truth.
    const value = await inputAfter.inputValue();
    expect(value).not.toBe(LABEL_B);
    const keys = await readPrepKeys(page);
    expect(keys.fenceSchool).toBeTruthy();
    expect(JSON.parse(keys.fenceSchool!).authority).toBe("namespaced");
  });
});
