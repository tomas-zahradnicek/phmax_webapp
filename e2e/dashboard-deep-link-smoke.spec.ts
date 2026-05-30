import { test, expect } from "@playwright/test";
import { openDashboardAttentionModule } from "./smoke-helpers";

const SS_DRAFT_KEY = "phmax-ss-units-draft";
const SS_WIZARD_KEY = "phmax-ss-basic-wizard-step";
const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";
const PV_WIZARD_KEY = "phmax-pv-basic-wizard-step";
const ZS_STORAGE_KEY = "edu-cz-zs-calculator-state";
const ZS_WIZARD_KEY = "phmax-zs-basic-wizard-step";

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
});
