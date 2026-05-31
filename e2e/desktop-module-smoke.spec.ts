import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

const MODULES = [
  { view: "pv", label: "PV", exampleSelectId: "pv-hero-example-select" },
  { view: "sd", label: "ŠD", exampleSelectId: "sd-hero-example-select" },
  { view: "zs", label: "ZŠ", exampleSelectId: "zs-hero-example-select" },
  { view: "ss", label: "SŠ", exampleSelectId: "ss-hero-example-select" },
  { view: "nv75", label: "NV75", exampleSelectId: "nv75-hero-example-select" },
] as const;

test.describe("Desktop modulový smoke", () => {
  for (const mod of MODULES) {
    test(`${mod.label} – banner neúplných vstupů a Přejít k chybě`, async ({ page }) => {
      if (mod.view === "zs") {
        await clearLocalStorageKeys(page, [
          "phmax-zs-basic-wizard-step",
          "phmax-zs-view-mode",
          "edu-cz-zs-calculator-state",
        ]);
      }
      await gotoProductView(page, mod.view);
      const issueBanner = page.locator(".calculator-input-issue-banner");
      await expect(issueBanner).toBeVisible({ timeout: 10_000 });
      await expect(issueBanner).toContainText(/PHmax|pracovišt|vstup|banka|řádk|kompletní|vyplňte/i);
      await expect(page.getByRole("button", { name: "Přejít k chybě" }).first()).toBeVisible();
    });

    test(`${mod.label} – combobox Příkladové výpočty a workflow dock`, async ({ page }) => {
      await gotoProductView(page, mod.view);
      await expect(page.locator(`#${mod.exampleSelectId}`)).toBeAttached();
      await expect(page.locator(".calculator-workspace-dock, .calculator-workspace__dock").first()).toBeVisible();
    });
  }

  test("ZŠ – průvodce krok Třídy a Přejít k chybě", async ({ page }) => {
    await clearLocalStorageKeys(page, [
      "phmax-zs-basic-wizard-step",
      "phmax-zs-view-mode",
      "edu-cz-zs-calculator-state",
    ]);
    await gotoProductView(page, "zs");
    await page.getByRole("button", { name: "2 Třídy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
  });

  test("PV – průvodce krok Vstupy a Přejít k chybě", async ({ page }) => {
    await gotoProductView(page, "pv");
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="pv-vstupy"]')).toBeInViewport();
  });

  test("ŠD – průvodce krok Vstupy a Přejít k chybě", async ({ page }) => {
    await clearLocalStorageKeys(page, ["phmax-sd-basic-wizard-step", "edu-cz-sd-calculator-state"]);
    await gotoProductView(page, "sd");
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="sd-vstupy"]')).toBeInViewport();
  });

  test("SŠ – průvodce krok Vstupy a Přejít k chybě", async ({ page }) => {
    await clearLocalStorageKeys(page, ["phmax-ss-basic-wizard-step", "phmax-ss-units-draft"]);
    await gotoProductView(page, "ss");
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="ss-vstupy"]')).toBeInViewport();
  });

  test("NV75 – průvodce krok Vstupy a Přejít k chybě", async ({ page }) => {
    await gotoProductView(page, "nv75");
    await page.getByRole("button", { name: "2 Vstupy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="nv75-vstupy"]')).toBeInViewport();
  });
});
