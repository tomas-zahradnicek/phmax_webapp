import { test, expect } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const MODULES: { view: "pv" | "sd" | "zs" | "ss"; label: string }[] = [
  { view: "pv", label: "PHmax celkem" },
  { view: "sd", label: "PHmax" },
  { view: "zs", label: "PHmax celkem" },
  { view: "ss", label: "Součet PHmax" },
];

test.describe("Popisky metrik – správné PHmax (ne PHMAX)", () => {
  for (const mod of MODULES) {
    test(`${mod.view} – dock zobrazí „${mod.label}“`, async ({ page }) => {
      await gotoProductView(page, mod.view);
      await expect(
        page.locator(".calculator-workspace-dock, .calculator-workspace__dock").first(),
      ).toBeVisible();
      const label = page
        .locator(".result-anchor-card__primary-label, .workflow-dock__mobile-fold-label")
        .first();
      await expect(label).toContainText(mod.label);
      await expect(label).not.toContainText("PHMAX");
    });
  }
});
