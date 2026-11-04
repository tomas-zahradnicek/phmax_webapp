import { expect, test, type Page } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1366, height: 768 },
] as const;

async function openFreshZs(page: Page): Promise<void> {
  await clearLocalStorageKeys(page, [
    "phmax-zs-basic-wizard-step",
    "phmax-zs-view-mode",
    "edu-cz-zs-calculator-state",
    "phmax-zs-quick-tour-v1",
  ]);
  await gotoProductView(page, "zs");
  await expect(page.getByRole("region", { name: "Průvodce výpočtem PHmax" })).toBeVisible();
}

async function visibleInFirstViewport(page: Page, selector: string): Promise<string> {
  return page.locator(`.app-shell--zs ${selector}`).first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + Math.max(rect.width / 2, 1), 1), window.innerWidth - 2);
    const y = Math.min(Math.max(rect.top + Math.min(rect.height / 2, 12), 1), window.innerHeight - 2);
    const hit = document.elementFromPoint(x, y);
    const margin = 16;
    const inside = rect.width >= 2 && rect.height >= 2 && rect.top >= 0 && rect.bottom <= window.innerHeight - margin;
    const uncovered = Boolean(hit && (el === hit || el.contains(hit)));
    if (inside && uncovered) return "ok";
    const hitName = hit instanceof Element ? hit.tagName + "." + String(hit.className).slice(0, 40) : "none";
    return `top=${Math.round(rect.top)} bottom=${Math.round(rect.bottom)} h=${Math.round(rect.height)} vh=${window.innerHeight} hit=${hitName}`;
  });
}

test.describe("ZŠ první krok je hned vidět", () => {
  test("A–C. nadpis kroku a první vstup jsou ve výřezu a primární akce je jedna", async ({ page }) => {
    await openFreshZs(page);
    await page.evaluate(() => document.fonts.ready);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(async () => visibleInFirstViewport(page, ".zs-basic-wizard .section-title"), { timeout: 2000 }).toBe("ok");
      await expect.poll(async () => visibleInFirstViewport(page, "#zs-mode-select"), { timeout: 2000 }).toBe("ok");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const primary = await page.locator("button.btn.primary, a.btn.primary").evaluateAll((els) =>
        els
          .filter((el) => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.visibility !== "hidden" && style.display !== "none" && rect.height > 0;
          })
          .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()),
      );
      expect(overflow, `overflow ${viewport.width}`).toBe(false);
      expect(primary, `primary ${viewport.width}`).toEqual(["Další krok"]);
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    const mode = page.locator("#zs-mode-select");
    await mode.focus();
    await expect(mode).toBeFocused();
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toBeVisible();
    await expect(page.locator("#zs-hero-example-select")).toBeAttached();
    await expect(page.getByRole("button", { name: "Rychlý výpočet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Přejít na Profil školy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Uložit průběh" })).toBeVisible();
  });

  test("D–F. další, zpět, ukázka a režim drží hodnoty", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openFreshZs(page);
    const mode = page.locator("#zs-mode-select");
    await mode.selectOption("phmax_first_stage_only");
    await page.getByRole("region", { name: "Průvodce výpočtem PHmax" }).getByRole("button", { name: "Další krok" }).click();
    await expect(page.locator(".app-shell.zs-wizard-step-2")).toBeVisible();
    await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Třídy");
    await page.getByRole("region", { name: "Průvodce výpočtem PHmax" }).getByRole("button", { name: "Zpět" }).click();
    await expect(page.locator(".app-shell.zs-wizard-step-1")).toBeVisible();
    await expect(mode).toHaveValue("phmax_first_stage_only");

    const example = page.locator("#zs-hero-example-select");
    await example.scrollIntoViewIfNeeded();
    const tag = await example.evaluate((el) => el.tagName);
    if (tag === "SELECT") {
      await example.selectOption("priloha_uplna_zs_sec16");
    } else {
      await example.click();
      await page.locator(".hero-example-sheet__option").filter({ hasText: /934 h/ }).click();
    }
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("934 h");
    await page.getByRole("region", { name: "Průvodce výpočtem PHmax" }).getByRole("button", { name: "Další krok" }).click();
    await expect(page.locator('[data-section="basic"]').getByRole("textbox").first()).toHaveValue("10");
  });

  test("uložený krok průvodce se obnoví", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("phmax-zs-basic-wizard-step", "2"));
    await gotoProductView(page, "zs");
    await expect(page.locator(".app-shell.zs-wizard-step-2")).toBeVisible();
    await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Třídy");
  });

  test("G–H. expert, PHAmax, PHPmax a hlavička výsledků zůstávají", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openFreshZs(page);
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("Nezadáno");

    const dockTabs = page.locator(".calculator-workspace-dock .tabs");
    await dockTabs.getByRole("button", { name: "PHAmax", exact: true }).click();
    await expect(page.getByRole("region", { name: "Průvodce výpočtem PHmax – PHAmax" })).toBeVisible();
    await dockTabs.getByRole("button", { name: "PHPmax", exact: true }).click();
    await expect(page.getByRole("region", { name: "Průvodce výpočtem PHmax – PHPmax" })).toBeVisible();
    await dockTabs.getByRole("button", { name: "PHmax", exact: true }).click();
    await expect(page.getByRole("region", { name: "Průvodce výpočtem PHmax" })).toBeVisible();

    await page.getByRole("button", { name: /Zobrazení/ }).click();
    await page.getByRole("radio", { name: "Všechna pole" }).check();
    await expect(page.locator(".app-shell--zs")).not.toHaveClass(/zs-basic-wizard-active/);
    await expect(page.locator("#zs-mode-select")).toBeVisible();
    await expect(page.locator("#zs-hero-example-select")).toBeAttached();
    await expect(page.getByRole("button", { name: "Uložit průběh" })).toBeVisible();
  });

  test("I. PV, ŠD, SŠ, NV75 a rychlý výpočet se nemění", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    for (const view of ["pv", "sd", "ss"] as const) {
      await gotoProductView(page, view);
      await expect(page.getByText("Začněte zde").first()).toBeVisible();
    }
    await gotoProductView(page, "nv75");
    await expect(page.getByRole("region", { name: "Akce výpočtu NV75" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Přidat řádek" })).toBeVisible();

    await openFreshZs(page);
    await page.getByRole("button", { name: "Rychlý výpočet" }).click();
    await expect(page.locator(".phmax-lite-page--zs")).toBeVisible();
    await expect(page.locator(".phmax-lite-page--zs .hero-zone-label")).toHaveText("Rychlý výpočet");
  });
});
