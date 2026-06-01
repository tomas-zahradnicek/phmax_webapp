import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";

test.describe("PV § 1d odst. 3 – orientační krácení", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, ["phmax-pv-basic-wizard-step", PV_STORAGE_KEY]);
    await page.addInitScript((storageKey) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rows: [
            {
              id: "pv-1d-e2e",
              label: "Test MŠ",
              provoz: "celodenni",
              classCount: 2,
              avgHours: 8,
              sec16Count: 0,
              languageGroups: 0,
              pv1dActualChildren: 8,
              pv1dMinimumChildren: 16,
              pv1dKuPhmaxCap: 0,
              pv1dKuDecisionRef: "",
              pv1dExemption: false,
            },
          ],
        }),
      );
    }, PV_STORAGE_KEY);
    await gotoProductView(page, "pv");
  });

  test("poměrné krácení zobrazí orientační PHmax po krácení", async ({ page }) => {
    await expect(page.locator(".pv-row-method-hint")).toBeVisible();
    await expect(page.getByText(/Orientační PHmax po krácení/i)).toBeVisible();
    await expect(page.getByText(/Poměrné krácení/i)).toBeVisible();
  });
});
