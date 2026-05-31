import { test, expect } from "@playwright/test";
import { openDashboardAttentionModule, openDashboardKpiModule, gotoProductView } from "./smoke-helpers";

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
    await page.addInitScript(({ sdKey, zsKey, sdWizard, zsWizard }) => {
      localStorage.setItem(sdWizard, "2");
      localStorage.setItem(
        sdKey,
        JSON.stringify({
          pupils: 30,
          manualDepts: false,
          departments: 1,
          inputMode: "summary",
        }),
      );
      localStorage.setItem(zsWizard, "2");
      localStorage.setItem(
        zsKey,
        JSON.stringify({
          tab: "phmax",
          basic1Classes: 0,
          basic2Classes: 0,
        }),
      );
    }, {
      sdKey: SD_STORAGE_KEY,
      zsKey: ZS_STORAGE_KEY,
      sdWizard: SD_WIZARD_KEY,
      zsWizard: ZS_WIZARD_KEY,
    });

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: "Vyžaduje pozornost" })).toBeVisible();
    await expect(page.locator(".dash-attention-card__item").filter({ hasText: "ŠD" })).toHaveCount(0);
    await expect(page.locator(".dash-attention-card__item").filter({ hasText: "ZŠ" })).toHaveCount(1);
  });
});

test.describe("ZŠ hero – pojmenované zálohy", () => {
  test("panel pojmenovaných záloh je viditelný", async ({ page }) => {
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
    await page.getByRole("button", { name: /Akce, tisk, uložení a export/ }).click();
    await page.getByRole("dialog", { name: "Akce a export" }).getByText("Scénáře a zálohy").click();
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
