import { test, expect } from "@playwright/test";
import { clickHeroExportCsv, gotoProductView } from "./smoke-helpers";

const PV_STORAGE_KEY = "edu-cz-pv-calculator-state";
const PV_WIZARD_KEY = "phmax-pv-basic-wizard-step";

test.describe("Post-deploy smoke – Přehled → modul → export", () => {
  test("Přehled → Otevřít PV → export CSV", async ({ page }) => {
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
                classCount: 2,
                avgHours: 10,
                sec16Count: 0,
                languageGroups: 0,
              },
            ],
          }),
        );
      },
      { storageKey: PV_STORAGE_KEY, wizardKey: PV_WIZARD_KEY, rowKey: "pv-post-deploy-e2e" },
    );

    await gotoProductView(page, "dash");
    await expect(page.getByRole("heading", { name: "Školní profil" })).toBeVisible();
    const pvCard = page.locator(".dash-card").filter({
      has: page.getByRole("heading", { name: /předškolní vzdělávání/i }),
    });
    await pvCard.getByRole("button", { name: "Otevřít" }).click();
    await expect(page.locator("#pv-hero-example-select")).toBeAttached({ timeout: 10_000 });

    const downloadPromise = page.waitForEvent("download");
    await clickHeroExportCsv(page);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test("Začít u ukázky zobrazí toast s návodem", async ({ page }) => {
    await gotoProductView(page, "dash");
    const zsCard = page.locator(".dash-card").filter({
      has: page.getByRole("heading", { name: /základní školy/i }),
    });
    await zsCard.getByRole("button", { name: "Začít u ukázky" }).click();
    await expect(page.locator(".ui-toast")).toContainText(/Otevřen modul ZŠ/i);
    await expect(page.locator(".ui-toast")).toContainText(/Příkladové výpočty/i);
    await expect(page.locator("#zs-hero-example-select")).toBeAttached({ timeout: 10_000 });
  });

  test("návod k použití je v řádku záložek modulu PV", async ({ page }) => {
    await gotoProductView(page, "pv");
    const guide = page.locator(".calculator-hero-shell__nav-trailing .calculator-hero-shell__guide-btn");
    await expect(guide).toBeVisible();
    await expect(guide).toHaveAttribute("href", "/navod");
  });
});
