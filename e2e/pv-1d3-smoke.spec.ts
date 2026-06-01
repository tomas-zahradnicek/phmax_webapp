import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";
const PV_WIZARD_KEY = "phmax-pv-basic-wizard-step";

test.describe("PV § 1d odst. 3 – orientační krácení", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, [PV_WIZARD_KEY, PV_STORAGE_KEY]);
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
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
    }, { storageKey: PV_STORAGE_KEY, wizardKey: PV_WIZARD_KEY });
    await gotoProductView(page, "pv");
  });

  test("poměrné krácení zobrazí orientační PHmax po krácení", async ({ page }) => {
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    const hint = page.locator(".pv-row-method-hint");
    await hint.scrollIntoViewIfNeeded();
    await expect(hint).toBeVisible();
    const reduced = page.getByText(/Orientační PHmax po krácení/i);
    await reduced.scrollIntoViewIfNeeded();
    await expect(reduced).toBeVisible();
    await expect(page.getByText(/Poměrné krácení/i)).toBeVisible();
  });

  test("bez údajů o dětech zobrazí pending_ku upozornění", async ({ page }) => {
    await clearLocalStorageKeys(page, [PV_WIZARD_KEY, PV_STORAGE_KEY]);
    await page.addInitScript(({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rows: [
            {
              id: "pv-1d-pending-e2e",
              label: "Pending KÚ",
              provoz: "celodenni",
              classCount: 2,
              avgHours: 8,
              sec16Count: 0,
              languageGroups: 0,
              pv1dActualChildren: 0,
              pv1dMinimumChildren: 0,
              pv1dKuPhmaxCap: 0,
              pv1dKuDecisionRef: "",
              pv1dExemption: false,
            },
          ],
        }),
      );
    }, { storageKey: PV_STORAGE_KEY, wizardKey: PV_WIZARD_KEY });
    await gotoProductView(page, "pv");
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    const pending = page.locator(".pv-row-method-hint .ux-semantic--warning");
    await pending.scrollIntoViewIfNeeded();
    await expect(pending).toBeVisible();
    await expect(pending).toContainText(/Doplňte skutečný.*nejnižší počet dětí/i);
  });
});
