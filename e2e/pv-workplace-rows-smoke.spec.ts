import { test, expect } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";
const PV_WIZARD_KEY = "phmax-pv-basic-wizard-step";

test.describe("PV – řádky pracovišť", () => {
  test("Přidat pracoviště vytvoří druhý řádek", async ({ page }) => {
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rows: [
            {
              id: "pv-row-1-e2e",
              label: "MŠ A",
              provoz: "celodenni",
              classCount: 1,
              avgHours: 8,
              sec16Count: 0,
              languageGroups: 0,
            },
          ],
        }),
      );
    }, { storageKey: PV_STORAGE_KEY, wizardKey: PV_WIZARD_KEY });

    await gotoProductView(page, "pv");
    await expect(page.locator('[data-pv-row-id="pv-row-1-e2e"]')).toBeVisible();
    const addBtn = page.getByRole("button", {
      name: /Přidat pracoviště \(další kombinace místo \/ druhu provozu\)/i,
    });
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();
    await expect(page.locator("[data-pv-row-id]")).toHaveCount(2, { timeout: 8000 });
  });
});
