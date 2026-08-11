import { expect, test, type Page } from "@playwright/test";
import { applyCrossPhmaxSeed, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import { gotoProductView, openDashboardAdvancedToolsSection } from "./smoke-helpers";

const LEGACY = "phmax-school-scenario-label";
const V2_UNBOUND =
  "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value";
const MARKER_UNBOUND =
  "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound";
const IDENTITY = "reditelsky-pruvodce-identity-registry-v1";
const INIT_FLAG = "n2adopt-e2e-init-done";
const LABEL = "ADOPT TEST";

const crossPhmaxSeed = {
  ...defaultCrossPhmaxSeedKeys(),
  pvRowKey: "pv-n2adopt-e2e",
  ssRowId: 911,
};

async function openScenarioLabelInput(page: Page) {
  await openDashboardAdvancedToolsSection(page);
  const input = page.getByLabel("Název scénáře školy (JSON export)");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.scrollIntoViewIfNeeded();
  return input;
}

async function readKeys(page: Page) {
  return page.evaluate(
    ({ legacy, v2Unbound, markerUnbound, identity }) => {
      const identityRaw = localStorage.getItem(identity);
      let schoolId: string | null = null;
      if (identityRaw) {
        try {
          const parsed = JSON.parse(identityRaw) as { schoolId?: string };
          schoolId = typeof parsed.schoolId === "string" ? parsed.schoolId : null;
        } catch {
          schoolId = null;
        }
      }
      const v2School = schoolId
        ? localStorage.getItem(
            `reditelsky-pruvodce:v2:school:${schoolId}:module:phmax-scenario-label:resource:value`,
          )
        : null;
      const markerSchool = schoolId
        ? localStorage.getItem(
            `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${schoolId}`,
          )
        : null;
      return {
        legacy: localStorage.getItem(legacy),
        v2Unbound: localStorage.getItem(v2Unbound),
        markerUnbound: localStorage.getItem(markerUnbound),
        identityRaw,
        schoolId,
        v2School,
        markerSchool,
      };
    },
    {
      legacy: LEGACY,
      v2Unbound: V2_UNBOUND,
      markerUnbound: MARKER_UNBOUND,
      identity: IDENTITY,
    },
  );
}

test.describe("N2-ADOPT-WRITE school-shadow establishment", () => {
  test("MUST: unbound scenario → Profile save → school shadow from legacy; unbound preserved", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ flag }) => {
        if (sessionStorage.getItem(flag)) return;
        sessionStorage.setItem(flag, "1");
        localStorage.clear();
      },
      { flag: INIT_FLAG },
    );
    await page.addInitScript(applyCrossPhmaxSeed, crossPhmaxSeed);

    await gotoProductView(page, "dash");
    const input = await openScenarioLabelInput(page);
    await input.fill(LABEL);
    await expect(input).toHaveValue(LABEL);

    const before = await readKeys(page);
    expect(before.legacy).toBe(LABEL);
    expect(before.v2Unbound).toBe(LABEL);
    expect(before.markerUnbound).toContain('"mirrorHealth":"synced"');
    expect(before.identityRaw).toBeNull();
    expect(before.v2School).toBeNull();

    await page.goto("/profil-skoly");
    await page.locator("#sp-name").fill("ZŠ N2-ADOPT E2E");
    await page.locator("#sp-ico").fill("12345678");
    await page.locator("#sp-redIzo").fill("600123456");
    await page.locator("#sp-izo").fill("102345678");
    await page.getByRole("button", { name: "Uložit profil školy" }).click();
    // Binding may complete silently; wait for Identity + school shadow.
    await expect
      .poll(async () => (await readKeys(page)).schoolId, { timeout: 15_000 })
      .toBeTruthy();
    await expect
      .poll(async () => (await readKeys(page)).v2School, { timeout: 15_000 })
      .toBe(LABEL);
    const after = await readKeys(page);
    expect(after.legacy).toBe(LABEL);
    expect(after.schoolId).toBeTruthy();
    expect(after.v2School).toBe(LABEL);
    expect(after.markerSchool).toContain('"mirrorHealth":"synced"');
    expect(after.markerSchool).toContain('"authoritativePresence":"present"');
    // N3-CUTOVER-ACTIVATE: Profile save owner same-run cutover → namespaced.
    expect(after.markerSchool).toContain('"authority":"namespaced"');
    expect(after.markerSchool).toContain('"schemaVersion":2');
    expect(after.v2Unbound).toBe(LABEL);
    expect(after.markerUnbound).toBe(before.markerUnbound);

    await page.reload({ waitUntil: "load" });
    await gotoProductView(page, "dash");
    const inputAfterReload = await openScenarioLabelInput(page);
    await expect(inputAfterReload).toHaveValue(LABEL);
    const reloaded = await readKeys(page);
    expect(reloaded.legacy).toBe(LABEL);
    expect(reloaded.v2School).toBe(LABEL);
    expect(reloaded.v2Unbound).toBe(LABEL);
  });
});
