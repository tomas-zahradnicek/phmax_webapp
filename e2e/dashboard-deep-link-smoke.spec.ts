import { test, expect } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const SS_DRAFT_KEY = "phmax-ss-units-draft";
const SS_WIZARD_KEY = "phmax-ss-basic-wizard-step";

test.describe("Dashboard deep-link na SŠ řádek", () => {
  test("Vyžaduje pozornost → otevře modul u problematického řádku", async ({ page }) => {
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

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: "Vyžaduje pozornost" })).toBeVisible();
    await page.getByRole("button", { name: "Otevřít a přejít k chybě" }).first().click();

    const row = page.locator('[data-ss-row-id="42"]');
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row).toBeInViewport({ timeout: 8000 });
  });
});
