/**
 * N3-AWARE-WIRING E2E — preserve already-namespaced authority; no cutover.
 * Normal legacy remains legacy. Test fixture alone may seed namespaced.
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
import {
  seedBlockedScenarioAuthority,
  seedNamespacedScenarioDegraded,
  seedNamespacedScenarioReady,
} from "./scenario-label-n3-aware-wiring-helpers";
import { buildHandoffApplyConsoleSnippet } from "../src/phmax-is-handoff-apply";
import type { PhmaxIsHandoffPayload } from "../src/phmax-is-export-adapter";

const LEGACY = "phmax-school-scenario-label";
const V2 = `reditelsky-pruvodce:v2:school:${RESTORE_E2E_SCHOOL_A}:module:phmax-scenario-label:resource:value`;
const MARKER = `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const FENCE = `reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:${RESTORE_E2E_SCHOOL_A}`;
const INIT_FLAG = "n3aware-wiring-e2e-init";

const crossPhmaxSeed = {
  ...defaultCrossPhmaxSeedKeys(),
  pvRowKey: "pv-n3aware-wiring-e2e",
  ssRowId: 931,
};

async function openScenarioLabelInput(page: Page) {
  await openDashboardAdvancedToolsSection(page);
  const input = page.getByLabel("Název scénáře školy (JSON export)");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.scrollIntoViewIfNeeded();
  return input;
}

async function readScenarioKeys(page: Page) {
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

async function bootWithIdentity(page: Page) {
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

test.describe("N3-AWARE-WIRING", () => {
  test("E1: namespaced ready read shows v2 value", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "NS-READY");
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await expect(input).toHaveValue("NS-READY");
    await expect(input).toBeEnabled();
    const keys = await readScenarioKeys(page);
    expect(keys.marker).toContain('"schemaVersion":2');
    expect(keys.marker).toContain('"authority":"namespaced"');
  });

  test("E2: namespaced degraded shows v2, no legacy fallback", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioDegraded(
      page,
      RESTORE_E2E_SCHOOL_A,
      "V2 AUTHORITATIVE",
      "LEGACY STALE",
    );
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await expect(input).toHaveValue("V2 AUTHORITATIVE");
    await expect(input).not.toHaveValue("LEGACY STALE");
  });

  test("E3: namespaced edit A→B preserves schema2 + fence B", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "A");
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await input.fill("B");
    await input.blur();
    await expect.poll(async () => (await readScenarioKeys(page)).v2).toBe("B");
    const keys = await readScenarioKeys(page);
    expect(keys.legacy).toBe("B");
    expect(keys.marker).toContain('"schemaVersion":2');
    expect(keys.marker).toContain('"authority":"namespaced"');
    expect(keys.fence).toBeTruthy();
    expect(JSON.parse(keys.fence!).authority).toBe("namespaced");
    expect(JSON.parse(keys.fence!).committedRaw).toEqual({ exists: true, value: "B" });
    await page.reload({ waitUntil: "load" });
    const after = await openScenarioLabelInput(page);
    await expect(after).toHaveValue("B");
  });

  test("E4: namespaced clear preserves namespaced authority (absent)", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "CLEAR-ME");
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await input.fill("   ");
    await input.blur();
    await expect.poll(async () => (await readScenarioKeys(page)).v2).toBeNull();
    const keys = await readScenarioKeys(page);
    expect(keys.legacy).toBeNull();
    expect(keys.marker).toContain('"schemaVersion":2');
    expect(keys.marker).toContain('"authority":"namespaced"');
    expect(keys.marker).toContain('"authoritativePresence":"absent"');
    expect(keys.fence).toBeTruthy();
    expect(JSON.parse(keys.fence!).committedRaw).toEqual({ exists: false });
  });

  test("E5: namespaced Backup exports v2 logical value only", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "BACKUP-V2");
    await page.reload({ waitUntil: "load" });
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
    expect(json.modules["phmax-scenario-label"]?.data).toBe("BACKUP-V2");
    expect(raw).not.toContain("protocol-commit");
    expect(raw).not.toContain('"authority":"namespaced"');
  });

  test("E6: namespaced Restore A→B stays namespaced", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "A");
    await page.reload({ waitUntil: "load" });
    const modules = buildHappyPathBackupModules();
    modules["phmax-scenario-label"] = modulePayload("Label", "B");
    await applyRestoreFile(page, backupFilePayload(modules));
    await expect.poll(async () => (await readScenarioKeys(page)).v2).toBe("B");
    const keys = await readScenarioKeys(page);
    expect(keys.legacy).toBe("B");
    expect(keys.marker).toContain('"schemaVersion":2');
    expect(keys.marker).toContain('"authority":"namespaced"');
    expect(JSON.parse(keys.fence!).authority).toBe("namespaced");
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await expect(input).toHaveValue("B");
  });

  test("E7: fresh/empty Restore defaults legacy — no first schema2", async ({ page }) => {
    await bootWithIdentity(page);
    const modules = {
      "school-profile": modulePayload("Profil", sampleRestoreProfile(RESTORE_E2E_SCHOOL_A, "ZŠ")),
      "identity-registry": modulePayload("Identita", sampleRestoreIdentity(RESTORE_E2E_SCHOOL_A)),
      "phmax-scenario-label": modulePayload("Label", "FROM-BACKUP"),
    };
    await applyRestoreFile(page, backupFilePayload(modules));
    await expect.poll(async () => (await readScenarioKeys(page)).legacy).toBe("FROM-BACKUP");
    const keys = await readScenarioKeys(page);
    expect(keys.marker).toContain('"authority":"legacy"');
    expect(keys.marker).not.toContain('"schemaVersion":2');
  });

  test("E8: blocked authority → disabled input, no guessed value", async ({ page }) => {
    await bootWithIdentity(page);
    await seedBlockedScenarioAuthority(page, RESTORE_E2E_SCHOOL_A);
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue("");
    // Attempt fill should not mutate storage.
    const before = await readScenarioKeys(page);
    await input.evaluate((el) => {
      (el as HTMLInputElement).disabled = false;
      (el as HTMLInputElement).value = "HACK";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const after = await readScenarioKeys(page);
    expect(after.v2).toBe(before.v2);
    expect(after.legacy).toBe(before.legacy);
  });

  test("E9: old-writer violation stays blocked (no silent downgrade)", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "NS");
    // Simulate old writer legacy-only overwrite of legacy key.
    await page.evaluate(({ legacy }) => {
      localStorage.setItem(legacy, "OLD-WRITER");
    }, { legacy: LEGACY });
    await page.reload({ waitUntil: "load" });
    const input = await openScenarioLabelInput(page);
    // Degraded namespaced still shows v2 OR blocked if assessment escalates —
    // never silent legacy fallback as display truth from OLD-WRITER alone.
    const value = await input.inputValue();
    expect(value).not.toBe("OLD-WRITER");
  });

  test("E10 + no-cutover: normal legacy read/edit/reload stays v1", async ({ page }) => {
    await bootWithIdentity(page);
    const input = await openScenarioLabelInput(page);
    await input.fill("LEGACY-REGRESSION");
    await input.blur();
    await expect.poll(async () => (await readScenarioKeys(page)).legacy).toBe(
      "LEGACY-REGRESSION",
    );
    let keys = await readScenarioKeys(page);
    expect(keys.marker).toContain('"authority":"legacy"');
    expect(keys.marker).not.toContain('"schemaVersion":2');
    await page.reload({ waitUntil: "load" });
    const after = await openScenarioLabelInput(page);
    await expect(after).toHaveValue("LEGACY-REGRESSION");
    keys = await readScenarioKeys(page);
    expect(keys.marker).toContain('"authority":"legacy"');
    expect(keys.marker).not.toContain('"schemaVersion":2');
  });

  test("snippet: namespaced target refuses scenario mutation", async ({ page }) => {
    await bootWithIdentity(page);
    await seedNamespacedScenarioReady(page, RESTORE_E2E_SCHOOL_A, "NS-SNIPPET");
    const schoolId = RESTORE_E2E_SCHOOL_A;
    const handoff = {
      schema: "phmax-is-handoff-v1",
      appVersion: "e2e",
      exportedAt: "2026-01-01T00:00:00.000Z",
      disclaimer: "e2e",
      fieldMapVersion: "2026-05",
      schoolScenario: {
        schema: "phmax-school-scenario-v1",
        scenarioLabel: "SNIPPET-TRY",
        moduleSnapshots: {},
        summary: { totalPhmax: 0 },
        coherenceWarnings: [],
        appVersion: "e2e",
        exportedAt: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as PhmaxIsHandoffPayload;
    const snippet = buildHandoffApplyConsoleSnippet(handoff, { reload: false });
    expect(snippet).toContain("namespaced autoritu");
    const result = await page.evaluate(
      ({ code, schoolId: sid }) => {
        const el = document.createElement("script");
        el.textContent = code;
        document.documentElement.appendChild(el);
        el.remove();
        return {
          legacy: localStorage.getItem("phmax-school-scenario-label"),
          marker: localStorage.getItem(
            `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${sid}`,
          ),
        };
      },
      { code: snippet, schoolId },
    );
    expect(result.legacy).toBe("NS-SNIPPET");
    expect(result.marker).toContain('"authority":"namespaced"');
  });
});
