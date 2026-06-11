import { test, expect } from "@playwright/test";
import { applyCrossPhmaxSeed, CROSS_PHMAX_LS, defaultCrossPhmaxSeedKeys } from "./cross-phmax-seed";
import {
  confirmDashboardExportDisclaimer,
  expectDashboardExportButton,
  openDashboardAttentionModule,
  openDashboardKpiModule,
  gotoProductView,
} from "./smoke-helpers";

const SS_DRAFT_KEY = "phmax-ss-units-draft";
const SS_WIZARD_KEY = "phmax-ss-basic-wizard-step";
const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";
const PV_WIZARD_KEY = "phmax-pv-basic-wizard-step";
const ZS_STORAGE_KEY = "edu-cz-zs-calculator-state";
const ZS_WIZARD_KEY = "phmax-zs-basic-wizard-step";
const SD_STORAGE_KEY = "edu-cz-sd-calculator-state";
const SD_WIZARD_KEY = "phmax-sd-basic-wizard-step";
const NV75_STORAGE_KEY = "edu-cz-nv75-deputy-bank-state";
const NV75_WIZARD_KEY = "phmax-nv75-basic-wizard-step";
export const IS_ENDPOINT_LS_KEY = "phmax-is-handoff-endpoint";
export const E2E_IS_HANDOFF_URL = "https://e2e.phmax.local/is-handoff";

test.describe("Dashboard deep-link", () => {
  test("SŠ – problematický řádek", async ({ page }) => {
    await page.addInitScript(
      ({ storageKey, wizardKey }) => {
        localStorage.setItem(wizardKey, "2");
        localStorage.setItem(
          storageKey,
          JSON.stringify([
            {
              id: 42,
              label: "",
              educationField: "",
              studyForm: "denni",
              phmaxMode: "",
              oborCountInClass: "1",
              additionalOborCodes: "",
              oborStudentCountsRaw: "",
              isArt82TalentClass: false,
              classType: "",
              isPar16Class: false,
              isLegacyMultioborClass: false,
              legacyMaxOborCount: "",
              note: "",
              averageStudents: "",
              classCount: "1",
            },
          ]),
        );
      },
      { storageKey: SS_DRAFT_KEY, wizardKey: SS_WIZARD_KEY },
    );

    await openDashboardAttentionModule(page, "SŠ");

    const row = page.locator('[data-ss-row-id="42"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("PV – neúplné pracoviště", async ({ page }) => {
    await page.addInitScript(
      ({ storageKey, wizardKey, rowKey }) => {
        localStorage.setItem(wizardKey, "2");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            rows: [
              {
                id: rowKey,
                label: "",
                provoz: "celodenni",
                classCount: 0,
                avgHours: 10,
                sec16Count: 0,
                languageGroups: 0,
              },
            ],
          }),
        );
      },
      { storageKey: PV_STORAGE_KEY, wizardKey: PV_WIZARD_KEY, rowKey: "pv-incomplete-e2e" },
    );

    await openDashboardAttentionModule(page, "PV");

    const row = page.locator('[data-pv-row-id="pv-incomplete-e2e"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("ZŠ – první neúplná sekce", async ({ page }) => {
    await page.addInitScript(
      ({ storageKey, wizardKey }) => {
        localStorage.setItem(wizardKey, "2");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            tab: "phmax",
            basic1Classes: 0,
            basic2Classes: 0,
            incl1Classes: 0,
            incl2Classes: 0,
            psychRows: [],
            healthRows: [],
            gymRows: [],
            mixedRows: [],
            phaRows: [],
            phpYear1: 0,
            phpYear2: 0,
            phpYear3: 0,
            phpMethodMode: "three_year_avg",
          }),
        );
      },
      { storageKey: ZS_STORAGE_KEY, wizardKey: ZS_WIZARD_KEY },
    );

    await openDashboardAttentionModule(page, "ZŠ");

    const section = page.locator('[data-section="basic"]');
    await expect(section).toBeVisible({ timeout: 8000 });
    await expect(section).toBeInViewport({ timeout: 8000 });
  });

  test("ŠD – chybějící účastníci", async ({ page }) => {
    await page.addInitScript(
      ({ storageKey, wizardKey }) => {
        localStorage.setItem(wizardKey, "2");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            pupils: 0,
            manualDepts: false,
            departments: 1,
            inputMode: "summary",
          }),
        );
      },
      { storageKey: SD_STORAGE_KEY, wizardKey: SD_WIZARD_KEY },
    );

    await openDashboardAttentionModule(page, "ŠD");

    await expect(page.locator('[data-section="sd-vstupy"]')).toBeInViewport({ timeout: 8000 });
  });

  test("ŠD – detailní režim, prázdné oddělení", async ({ page }) => {
    await page.addInitScript(
      ({ storageKey, wizardKey }) => {
        localStorage.setItem(wizardKey, "2");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            pupils: 40,
            manualDepts: false,
            departments: 2,
            inputMode: "detail",
            detailDepartments: [
              { kind: "regular", participants: 20 },
              { kind: "regular", participants: 0 },
            ],
          }),
        );
      },
      { storageKey: SD_STORAGE_KEY, wizardKey: SD_WIZARD_KEY },
    );

    await openDashboardAttentionModule(page, "ŠD");

    const row = page.locator('[data-sd-dept-id="1"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("NV75 – řádek bez jednotek", async ({ page }) => {
    await page.addInitScript(
      ({ storageKey, wizardKey, rowId }) => {
        localStorage.setItem(wizardKey, "2");
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            rows: [{ id: rowId, kind: "ms", units: 0 }],
            practicalGeneralNonOv: 0,
            practicalOvEhl0: 0,
            practicalSec16: 0,
            ovGroupsSchool: 0,
            ovGroupsInstructor: 0,
          }),
        );
      },
      { storageKey: NV75_STORAGE_KEY, wizardKey: NV75_WIZARD_KEY, rowId: 88 },
    );

    await openDashboardAttentionModule(page, "NV75");

    const row = page.locator('[data-nv75-row-id="88"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("ŠD – ok stav z KPI dlaždice", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          pupils: 40,
          manualDepts: false,
          departments: 2,
          inputMode: "summary",
        }),
      );
    }, { storageKey: SD_STORAGE_KEY, wizardKey: SD_WIZARD_KEY });

    await openDashboardKpiModule(page, "ŠD");

    const section = page.locator('[data-section="sd-vstupy"]');
    await expect(section).toBeVisible({ timeout: 8000 });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeInViewport({ timeout: 8000 });
  });

  test("PV – ok stav z KPI dlaždice", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey, rowKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rows: [
            {
              id: rowKey,
              label: "",
              provoz: "zdravotnicke",
              classCount: 2,
              avgHours: 0,
              sec16Count: 0,
              languageGroups: 0,
            },
          ],
        }),
      );
    }, { storageKey: PV_STORAGE_KEY, wizardKey: PV_WIZARD_KEY, rowKey: "pv-ok-e2e" });

    await openDashboardKpiModule(page, "PV");

    const row = page.locator('[data-pv-row-id="pv-ok-e2e"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("ZŠ – ok stav z KPI dlaždice", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tab: "phmax",
          basic1Classes: 2,
          basic1Pupils: 40,
          basic2Classes: 0,
          basic2Pupils: 0,
        }),
      );
    }, { storageKey: ZS_STORAGE_KEY, wizardKey: ZS_WIZARD_KEY });

    await openDashboardKpiModule(page, "ZŠ");

    const section = page.locator('[data-section="basic"]');
    await expect(section).toBeVisible({ timeout: 8000 });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeInViewport({ timeout: 8000 });
  });

  test("SŠ – ok stav z KPI dlaždice", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey, rowId }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify([
          {
            id: rowId,
            label: "",
            educationField: "39-41-L/01",
            studyForm: "denni",
            phmaxMode: "",
            oborCountInClass: "1",
            additionalOborCodes: "",
            oborStudentCountsRaw: "",
            isArt82TalentClass: false,
            classType: "",
            isPar16Class: false,
            isLegacyMultioborClass: false,
            legacyMaxOborCount: "",
            note: "",
            averageStudents: "17",
            classCount: "1",
          },
        ]),
      );
    }, { storageKey: SS_DRAFT_KEY, wizardKey: SS_WIZARD_KEY, rowId: 77 });

    await openDashboardKpiModule(page, "SŠ");

    const row = page.locator('[data-ss-row-id="77"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("NV75 – ok stav z KPI dlaždice", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey, rowId }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rows: [{ id: rowId, kind: "ms", units: 2 }],
          practicalGeneralNonOv: 0,
          practicalOvEhl0: 0,
          practicalSec16: 0,
          ovGroupsSchool: 0,
          ovGroupsInstructor: 0,
        }),
      );
    }, { storageKey: NV75_STORAGE_KEY, wizardKey: NV75_WIZARD_KEY, rowId: 5 });

    await openDashboardKpiModule(page, "NV75");

    const row = page.locator('[data-nv75-row-id="5"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeInViewport({ timeout: 8000 });
  });

  test("ok modul není ve Vyžaduje pozornost", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-ok-attention-e2e",
      ssRowId: 88,
      zsAttentionEmpty: true,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: "Vyžaduje pozornost" })).toBeVisible();
    await expect(page.locator(".dash-attention-card__item").filter({ hasText: "ŠD" })).toHaveCount(0);
    await expect(page.locator(".dash-attention-card__item").filter({ hasText: "PV" })).toHaveCount(0);
    await expect(page.locator(".dash-attention-card__item").filter({ hasText: "SŠ" })).toHaveCount(0);
    await expect(page.locator(".dash-attention-card__item").filter({ hasText: "ZŠ" })).toHaveCount(1);
  });

  test("export JSON je bez potvrzení zakázán", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-export-gate-e2e",
      ssRowId: 97,
    });
    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await expectDashboardExportButton(page, "Stáhnout JSON součtu PHmax");
    await expect(page.getByRole("button", { name: "Stáhnout JSON součtu PHmax" })).toBeDisabled();
  });

  test("orientační součet PHmax napříč moduly", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-cross-phmax-e2e",
      ssRowId: 91,
    });
    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await expect(page.locator(".dash-cross-phmax")).toContainText(/PV:/);
    await expect(page.locator(".dash-cross-phmax")).toContainText(/ŠD:/);
    await expect(page.locator(".dash-cross-phmax")).toContainText(/ZŠ:/);
    await expect(page.locator(".dash-cross-phmax")).toContainText(/SŠ:/);
    await expectDashboardExportButton(page, "Stáhnout JSON součtu PHmax");
    await expectDashboardExportButton(page, "Scénář celá škola (JSON)");
  });

  test("export handoff IS školy stáhne phmax-is-handoff-v1", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-is-handoff-e2e",
      ssRowId: 92,
    });
    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await confirmDashboardExportDisclaimer(page);
    const exportBtn = page.getByRole("button", { name: "Export pro IS školy (JSON)" });
    await exportBtn.scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent("download");
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/phmax-is-handoff.*\.json$/i);
    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import("node:fs");
    const raw = fs.readFileSync(path!, "utf8");
    const json = JSON.parse(raw) as { schema?: string };
    expect(json.schema).toBe("phmax-is-handoff-v1");
  });

  test("POST handoff na mock endpoint IS", async ({ page }) => {
    let postedBody: unknown;
    await page.route(E2E_IS_HANDOFF_URL, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      postedBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-is-post-e2e",
      ssRowId: 93,
      isHandoffUrl: E2E_IS_HANDOFF_URL,
      isHandoffLsKey: CROSS_PHMAX_LS.isEndpoint,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await confirmDashboardExportDisclaimer(page);
    const postBtn = page.getByRole("button", { name: "Odeslat handoff na IS (POST)" });
    await postBtn.scrollIntoViewIfNeeded();
    await postBtn.click();
    await expect(page.locator(".ui-toast").filter({ hasText: /Handoff odeslán \(HTTP 200\)/i })).toBeVisible({
      timeout: 8000,
    });
    expect(postedBody).toMatchObject({ schema: "phmax-is-handoff-v1" });
    expect(postedBody).toMatchObject({
      schoolScenario: { coherenceWarnings: expect.any(Array) },
    });
  });

  test("stažení scénáře celá škola phmax-school-scenario-v1", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-scenario-e2e",
      ssRowId: 94,
      zsAuditTotalPhmax: 200,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await confirmDashboardExportDisclaimer(page);
    const scenarioBtn = page.getByRole("button", { name: "Scénář celá škola (JSON)" });
    await scenarioBtn.scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent("download");
    await scenarioBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/phmax-skola-scenar.*\.json$/i);
    const fs = await import("node:fs");
    const raw = fs.readFileSync((await download.path())!, "utf8");
    const json = JSON.parse(raw) as { schema?: string; coherenceWarnings?: string[] };
    expect(json.schema).toBe("phmax-school-scenario-v1");
    expect(Array.isArray(json.coherenceWarnings)).toBe(true);
    expect(json.coherenceWarnings!.some((w) => /ZŠ.*přepočet/i.test(w))).toBe(true);
  });

  test("stažení JSON součtu PHmax obsahuje coherenceWarnings", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-cross-json-e2e",
      ssRowId: 98,
      zsAuditTotalPhmax: 200,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await confirmDashboardExportDisclaimer(page);
    const jsonBtn = page.getByRole("button", { name: "Stáhnout JSON součtu PHmax" });
    await jsonBtn.scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent("download");
    await jsonBtn.click();
    const download = await downloadPromise;
    const fs = await import("node:fs");
    const raw = fs.readFileSync((await download.path())!, "utf8");
    const json = JSON.parse(raw) as { schema?: string; coherenceWarnings?: string[] };
    expect(json.schema).toBe("phmax-cross-phmax-v1");
    expect(Array.isArray(json.coherenceWarnings)).toBe(true);
    expect(json.coherenceWarnings!.some((w) => /ZŠ.*přepočet/i.test(w))).toBe(true);
  });

  test("varování nesouladu audit PV vs dashboard Σ", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-coherence-e2e",
      ssRowId: 95,
      pvAuditTotalPhmax: 1,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await expect(page.locator(".dash-cross-phmax")).toContainText("uložený součet 1 h/týd");
  });

  test("varování nesouladu audit ZŠ vs přepočet", async ({ page }) => {
    await page.addInitScript(applyCrossPhmaxSeed, {
      ...defaultCrossPhmaxSeedKeys(),
      pvRowKey: "pv-zs-coherence-e2e",
      ssRowId: 96,
      zsAuditTotalPhmax: 200,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: /Souhrnný PHmax/ })).toBeVisible();
    await expect(page.locator(".dash-cross-phmax")).toContainText(/ZŠ.*přepočet/i);
  });
});

test.describe("ZŠ hero – pojmenované zálohy", () => {
  test("panel pojmenovaných záloh je viditelný", async ({ page }, testInfo) => {
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tab: "phmax",
          basic1Classes: 2,
          basic1Pupils: 40,
          _phmaxAuditTotals: { totalPhmax: 100, totalPha: 0, totalPhp: 0, tab: "phmax" },
        }),
      );
    }, { storageKey: ZS_STORAGE_KEY, wizardKey: ZS_WIZARD_KEY });

    await gotoProductView(page, "zs");
    const backupsToggle = page.getByText("Scénáře a zálohy", { exact: true });
    if (testInfo.project.use.isMobile) {
      const drawerTrigger = page.getByRole("button", { name: /Akce, tisk, uložení a export/ });
      await expect(drawerTrigger).toBeVisible({ timeout: 15_000 });
      await drawerTrigger.click();
      const dialog = page.getByRole("dialog", { name: "Akce a export" });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByText("Scénáře a zálohy", { exact: true }).click();
    } else {
      await backupsToggle.scrollIntoViewIfNeeded();
      await backupsToggle.click();
    }
    await expect(page.getByLabel("Název pojmenované zálohy")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("ZŠ wizard scroll", () => {
  test("krok 2 → 3 posune na první modul výjimek", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tab: "phmax",
          basic1Classes: 2,
          basic1Pupils: 40,
        }),
      );
    }, { storageKey: ZS_STORAGE_KEY, wizardKey: ZS_WIZARD_KEY });

    await gotoProductView(page, "zs");
    await page.getByRole("button", { name: "3 Výjimky" }).click({ force: true });

    await expect(page.locator(".phmax-zs-pane-active-exceptions")).toBeVisible({ timeout: 8000 });
    const target = page.locator('[data-section="zs-phmax-exceptions"]');
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport({ timeout: 8000 });
  });
});
