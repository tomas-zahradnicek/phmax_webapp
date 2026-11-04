import { expect, test, type Page } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1366, height: 768 },
] as const;

async function summaryCovers(page: Page, selector: string): Promise<boolean> {
  return page.locator(selector).evaluate((el) => {
    const panel = document.querySelector(".calculator-mobile-scroll-results");
    if (!(panel instanceof HTMLElement)) return false;
    const style = getComputedStyle(panel);
    if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return false;
    const target = el.getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    return target.width > 0 && target.height > 0 && box.height > 0 && target.bottom > box.top && target.top < box.bottom;
  });
}

test.describe("ZŠ dva režimy zobrazení", () => {
  test("A–F. Průvodce a Všechna pole, bez hustoty a Fokusu", async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      localStorage.setItem("phmax-zs-view-mode", "basic");
      localStorage.removeItem("phmax-zs-basic-wizard-step");
      localStorage.removeItem("edu-cz-zs-calculator-state");
      localStorage.setItem("phmax-display-density", "compact");
      localStorage.setItem("phmax-calculator-focus", "on");
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    });
    await gotoProductView(page, "zs");

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.getByRole("button", { name: /Zobrazení/ })).toBeVisible();
      await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Typ školy");
      await expect(page.locator("#zs-mode-select")).toBeInViewport();
      expect(await summaryCovers(page, "#zs-mode-select")).toBe(false);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `${viewport.width}`).toBe(false);
    }

    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.locator(".calculator-shell--basic")).toBeVisible();
    await expect(page.locator(".calculator-shell--focus")).toHaveCount(0);
    await expect(page.locator(".calculator-shell--density-compact")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Zobrazení/ })).toContainText("Průvodce");

    await page.getByRole("button", { name: /Zobrazení/ }).click();
    const panel = page.getByRole("region", { name: "Nastavení zobrazení kalkulačky" });
    const guide = panel.getByRole("radio", { name: "Průvodce" });
    const allFields = panel.getByRole("radio", { name: "Všechna pole" });
    await expect(panel.getByRole("radio")).toHaveCount(2);
    await expect(guide).toBeChecked();
    await expect(panel.locator("label", { hasText: "Všechna pole" })).toHaveAttribute("title", /nezobrazují/);
    await expect(panel.getByRole("radio", { name: "Kompaktní" })).toHaveCount(0);
    await expect(panel.getByRole("radio", { name: "Pohodlné" })).toHaveCount(0);
    await expect(panel.getByRole("checkbox", { name: "Fokus na formulář" })).toHaveCount(0);
    await guide.focus();
    await expect(guide).toBeFocused();

    const mode = page.locator("#zs-mode-select");
    await mode.selectOption("phmax_first_stage_only");
    await allFields.check();
    await expect(page.locator(".app-shell--zs")).not.toHaveClass(/zs-basic-wizard-active/);
    await expect(page.locator(".calculator-shell--expert")).toBeVisible();
    await expect(page.locator(".calculator-shell--focus")).toHaveCount(0);
    await expect(mode).toHaveValue("phmax_first_stage_only");
    await expect(page.getByRole("button", { name: /Zobrazení/ })).toContainText("Všechna pole");

    const stored = await page.evaluate(() => ({
      density: localStorage.getItem("phmax-display-density"),
      focus: localStorage.getItem("phmax-calculator-focus"),
      mode: localStorage.getItem("phmax-zs-view-mode"),
    }));
    expect(stored).toEqual({ density: "compact", focus: "on", mode: "expert" });

    await gotoProductView(page, "pv");
    await expect(page.locator(".calculator-shell--density-compact.calculator-shell--focus")).toBeVisible();
    await page.getByRole("button", { name: /Zobrazení/ }).click();
    const pv = page.getByRole("region", { name: "Nastavení zobrazení kalkulačky" });
    await expect(pv.getByRole("radio", { name: "Základní" })).toBeVisible();
    await expect(pv.getByRole("radio", { name: "Expertní" })).toBeVisible();
    await expect(pv.getByRole("radio", { name: "Kompaktní" })).toBeVisible();
    await expect(pv.getByRole("checkbox", { name: "Fokus na formulář" })).toBeVisible();
  });

  test("G–I. krok, počty a PHAmax/PHPmax přežijí přepnutí", async ({ page }) => {
    await page.addInitScript(() => {
      const marker = "phmax-e2e-zs-display-step2";
      if (sessionStorage.getItem(marker) === "1") return;
      sessionStorage.setItem(marker, "1");
      localStorage.setItem("phmax-zs-view-mode", "basic");
      localStorage.setItem("phmax-zs-basic-wizard-step", "2");
      localStorage.setItem("phmax-display-density", "compact");
      localStorage.setItem("phmax-calculator-focus", "on");
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
      localStorage.setItem(
        "edu-cz-zs-calculator-state",
        JSON.stringify({ tab: "phmax", basic1Classes: 2, basic1Pupils: 40 }),
      );
    });
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoProductView(page, "zs");
    await expect(page.locator(".app-shell.zs-wizard-step-2")).toBeVisible();
    await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Třídy");
    const classes = page.locator('[data-section="basic"] input').nth(0);
    const pupils = page.locator('[data-section="basic"] input').nth(1);
    await expect(classes).toHaveValue("2");
    await expect(pupils).toHaveValue("40");

    const dockTabs = page.locator(".calculator-workspace-dock .tabs");
    await dockTabs.getByRole("button", { name: "PHAmax", exact: true }).click();
    await expect(page.getByRole("region", { name: "Průvodce výpočtem PHmax – PHAmax" })).toBeVisible();
    await dockTabs.getByRole("button", { name: "PHPmax", exact: true }).click();
    await expect(page.getByRole("region", { name: "Průvodce výpočtem PHmax – PHPmax" })).toBeVisible();
    await dockTabs.getByRole("button", { name: "PHmax", exact: true }).click();
    await expect(classes).toHaveValue("2");

    await page.getByRole("button", { name: /Zobrazení/ }).click();
    await page.getByRole("radio", { name: "Všechna pole" }).check();
    await expect(page.locator(".calculator-shell--expert")).toBeVisible();
    await expect(classes).toHaveValue("2");
    await expect(pupils).toHaveValue("40");
    await expect(page.locator(".calculator-shell--focus")).toHaveCount(0);

    await page.reload();
    await expect(page.locator(".calculator-shell--expert")).toBeVisible();
    await expect(page.locator('[data-section="basic"] input').nth(0)).toHaveValue("2");
    await expect(page.locator('[data-section="basic"] input').nth(1)).toHaveValue("40");
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toBeVisible();
  });
});
