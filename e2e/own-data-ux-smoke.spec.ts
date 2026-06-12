import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";
import { CROSS_PHMAX_LS } from "./cross-phmax-seed";

const EMPTY_DASHBOARD_LS_KEYS = [
  "phmax-dash-last-active-product",
  CROSS_PHMAX_LS.pv,
  CROSS_PHMAX_LS.sd,
  CROSS_PHMAX_LS.zs,
  CROSS_PHMAX_LS.ssDraft,
  "edu-cz-nv75-deputy-bank-state",
] as const;

test.describe("UX: vlastní údaje a režimy", () => {
  test("PV – nápověda vlastních údajů a vysvětlení režimu", async ({ page }) => {
    await gotoProductView(page, "pv");
    const hintPanel = page.locator(".calculator-hero-collapsible-hint--workspace");
    await expect(hintPanel.getByText("Jak modul funguje")).toBeVisible();
    await hintPanel.locator("summary").click();
    await expect(page.locator(".own-data-hint--hero").first()).toBeVisible();
    await page.getByRole("button", { name: /Zobrazení/i }).click();
    await expect(page.getByRole("radio", { name: "Základní" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Expertní" })).toBeVisible();
    const viewHint = page.getByRole("button", { name: "Vysvětlení režimu práce" });
    await viewHint.click();
    await expect(page.locator(".calculator-hint-tooltip__bubble").first()).toContainText(/průvodce krok za krokem/i);
    await expect(page.getByRole("button", { name: "Začít od prázdného formuláře" })).toBeVisible();
  });

  test("Dashboard – checklist pro nového uživatele bez dat", async ({ page }) => {
    await clearLocalStorageKeys(page, [...EMPTY_DASHBOARD_LS_KEYS]);
    await page.goto("/?view=dash");
    const checklist = page.getByTestId("dash-new-user-checklist");
    await expect(checklist).toBeVisible();
    await expect(checklist.getByRole("heading", { name: "První kroky na Přehledu" })).toBeVisible();
    await expect(checklist.getByRole("button", { name: "K modulům níže" })).toBeVisible();
    await expect(checklist.locator("li").nth(1)).toContainText(/ukázky/i);
  });

  test("PV – badge v docku podle vašich vstupů", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoProductView(page, "pv");
    await expect(page.locator(".result-anchor-card__input-badge")).toContainText("Podle vašich vstupů");
  });
});
