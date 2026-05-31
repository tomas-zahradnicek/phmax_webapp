import { test, expect } from "@playwright/test";
import { openDashboardAttentionModule } from "./smoke-helpers";

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
});
