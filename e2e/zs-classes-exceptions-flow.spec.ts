import { expect, test, type Page } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1366, height: 768 },
] as const;

async function wizard(page: Page) {
  return page.getByRole("region", { name: "Průvodce výpočtem PHmax" });
}

test.describe("ZŠ kroky Třídy a Výjimky", () => {
  test("D–L. navigace, hodnoty, 934 h a ostatní kalkulačka", async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      const marker = "phmax-e2e-zs-classes-exceptions";
      if (sessionStorage.getItem(marker) === "1") return;
      sessionStorage.setItem(marker, "1");
      localStorage.setItem("phmax-zs-view-mode", "basic");
      localStorage.setItem("phmax-zs-basic-wizard-step", "2");
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
      localStorage.setItem(
        "edu-cz-zs-calculator-state",
        JSON.stringify({ tab: "phmax", basic1Classes: 2, basic1Pupils: 40, basic2Classes: 4, basic2Pupils: 80 }),
      );
    });
    await gotoProductView(page, "zs");
    await page.addStyleTag({ content: "html, body { scroll-behavior: auto !important; }" });

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      const guide = await wizard(page);
      await expect(guide.getByRole("heading", { name: "Třídy", exact: true })).toBeVisible();
      const category = page.getByRole("combobox", { name: "Kategorie běžných tříd" });
      await category.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
      await expect(category).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, String(viewport.width)).toBe(false);
      const next = guide.getByRole("button", { name: "Další krok" });
      await next.evaluate((el) => {
        el.scrollIntoView({ block: "center", inline: "nearest" });
        const panel = document.querySelector(".calculator-mobile-scroll-results");
        const panelTop = panel instanceof HTMLElement ? panel.getBoundingClientRect().top : window.innerHeight;
        const box = el.getBoundingClientRect();
        if (box.bottom > panelTop - 8) {
          window.scrollBy(0, box.bottom - panelTop + 16);
        }
      });
      const blocked = await next.evaluate((el) => {
        const panel = document.querySelector(".calculator-mobile-scroll-results");
        const box = el.getBoundingClientRect();
        const x = Math.min(Math.max(box.left + box.width / 2, 1), window.innerWidth - 2);
        const y = Math.min(Math.max(box.top + box.height / 2, 1), window.innerHeight - 2);
        const hit = document.elementFromPoint(x, y);
        const covered = panel instanceof HTMLElement && hit != null && (hit === panel || panel.contains(hit));
        return covered;
      });
      expect(blocked, `next ${viewport.width}`).toBe(false);
    }

    await page.setViewportSize({ width: 1366, height: 768 });
    const guide = await wizard(page);
    const category = page.getByRole("combobox", { name: "Kategorie běžných tříd" });
    await category.focus();
    await expect(category).toBeFocused();
    const focusRing = await category.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.outlineStyle !== "none" || style.boxShadow !== "none";
    });
    expect(focusRing).toBe(true);
    const classes = page.locator('[data-section="basic"]').getByRole("textbox", { name: "Počet tříd" }).first();
    await expect(classes).toHaveValue("2");
    await expect(page.getByRole("navigation", { name: "Části výpočtu PHmax" })).toHaveCount(0);

    await guide.getByRole("button", { name: "Další krok" }).click();
    await expect(page.locator(".app-shell.zs-wizard-step-3")).toBeVisible();
    await expect(guide.getByRole("heading", { name: "Výjimky", exact: true })).toBeVisible();
    await expect(guide.getByText("nechte zavřený")).toBeVisible();
    const exception = page.locator('details[data-wizard-step="3"] > summary').filter({ hasText: "Třídy podle" });
    await expect(exception).toBeVisible();

    await guide.getByRole("button", { name: "Zpět" }).click();
    await expect(page.locator(".app-shell.zs-wizard-step-2")).toBeVisible();
    await expect(classes).toHaveValue("2");

    await guide.getByRole("button", { name: "Další krok" }).click();
    await guide.getByRole("button", { name: "Další krok" }).click();
    await expect(page.locator(".app-shell.zs-wizard-step-4")).toBeVisible();
    await page.reload();
    await expect(page.locator(".app-shell.zs-wizard-step-4")).toBeVisible();
    await expect(page.locator('[data-section="basic"] input').first()).toHaveValue("2");

    await page.getByRole("button", { name: /Zobrazení/ }).click();
    await page.getByRole("radio", { name: "Všechna pole" }).check();
    await expect(page.locator(".calculator-shell--expert")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Části výpočtu PHmax" })).toBeVisible();
    await expect(page.locator('[data-section="zs-phmax-exceptions-note"]')).toBeVisible();
    const panes = page.getByRole("navigation", { name: "Části výpočtu PHmax" });
    await panes.getByRole("button", { name: "Výjimky", exact: true }).click();
    await expect(page.locator('[data-section="sec16"]')).toBeVisible();
    await panes.getByRole("button", { name: "Běžné třídy", exact: true }).click();
    await expect(page.locator('[data-section="basic"] input').first()).toHaveValue("2");

    const guideMode = page.getByRole("radio", { name: "Průvodce" });
    if (!(await guideMode.isVisible())) {
      await page.getByRole("button", { name: /Zobrazení/ }).click();
    }
    await guideMode.check();
    await expect(page.locator(".zs-basic-wizard-active")).toBeVisible();

    const example = page.locator("#zs-hero-example-select");
    await page.evaluate(() => window.scrollTo(0, 0));
    if ((await example.evaluate((el) => el.tagName)) === "SELECT") {
      await example.selectOption("priloha_uplna_zs_sec16");
    } else {
      await example.click();
      await page.locator(".hero-example-sheet__option").filter({ hasText: /934 h/ }).click();
    }
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("934 h");

    const allFields = page.getByRole("radio", { name: "Všechna pole" });
    if (!(await allFields.isVisible())) {
      await page.getByRole("button", { name: /Zobrazení/ }).click();
    }
    await allFields.check();
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("934 h");

    const dockTabs = page.locator(".calculator-workspace-dock .tabs");
    await dockTabs.getByRole("button", { name: "PHAmax", exact: true }).click();
    await expect(page.locator('[data-section="pha"], [data-section="pha_rvp"]').first()).toBeVisible();
    await dockTabs.getByRole("button", { name: "PHPmax", exact: true }).click();
    await expect(page.locator('[data-section="php"], [data-section="php_years"]').first()).toBeVisible();

    await gotoProductView(page, "pv");
    await expect(page.getByText("Začněte zde").first()).toBeVisible();
    await page.getByRole("button", { name: /Zobrazení/ }).click();
    await expect(page.getByRole("radio", { name: "Základní" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Kompaktní" })).toBeVisible();
  });
});
