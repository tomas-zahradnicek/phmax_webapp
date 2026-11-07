import { expect, test, type Page } from "@playwright/test";
import { ensureDisplayOption, gotoProductView } from "./smoke-helpers";

async function prepare(page: Page, mode: "basic" | "expert" = "basic") {
  await gotoProductView(page, "zs");
  await page.evaluate((nextMode) => {
    localStorage.removeItem("phmax-toc-open");
    localStorage.removeItem("phmax-zs-basic-wizard-step");
    localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    localStorage.setItem("phmax-zs-view-mode", nextMode);
  }, mode);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Zobrazení/ }).waitFor();
}

async function tocStored(page: Page) {
  return page.evaluate(() => localStorage.getItem("phmax-toc-open"));
}

async function hiddenLinkTakesFocus(page: Page) {
  return page.evaluate(() => {
    const rail = document.querySelector(".page-toc--rail");
    const trigger = document.querySelector<HTMLElement>(".page-toc-mobile-trigger");
    const link = rail?.querySelector<HTMLElement>(".page-toc__link");
    if (!rail || !trigger || !link) return true;
    trigger.focus();
    link.focus();
    return document.activeElement === link;
  });
}

async function tabEntersHiddenRail(page: Page) {
  await page.locator(".page-toc-mobile-trigger").focus();
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const rail = document.querySelector(".page-toc--rail");
    const active = document.activeElement;
    return Boolean(rail && active && rail.getAttribute("aria-hidden") === "true" && rail.contains(active));
  });
}

test.describe("ZŠ výchozí stav obsahu", () => {
  test("A. první Průvodce má obsah zavřený a jde otevřít", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await prepare(page, "basic");
    await expect(page.locator(".zs-basic-wizard")).toBeVisible();
    await expect(page.locator(".zs-basic-wizard__steps button")).toHaveCount(5);
    await expect(page.getByRole("button", { name: "Zpět" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Další krok" })).toBeVisible();
    const rail = page.locator(".page-toc--rail");
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await expect(rail).not.toHaveClass(/page-toc--open/);
    await page.getByRole("button", { name: "Zobrazit obsah stránky" }).click();
    await expect(rail).toHaveClass(/page-toc--open/);
    await expect(rail.getByRole("button", { name: "Běžné třídy" })).toBeVisible();
  });

  test("B. první Všechna pole mají obsah otevřený", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await prepare(page, "expert");
    await expect(page.locator(".zs-basic-wizard")).toHaveCount(0);
    const rail = page.locator(".page-toc--rail");
    await expect(rail).toHaveClass(/page-toc--open/);
    await expect(rail.getByRole("button", { name: "Běžné třídy" })).toBeVisible();
    await expect(rail.getByRole("button", { name: "Celkový přehled" })).toBeVisible();
  });

  test("C. přepnutí režimu bez uložené volby sleduje výchozí stav", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await prepare(page, "basic");
    const rail = page.locator(".page-toc--rail");
    await expect(rail).not.toHaveClass(/page-toc--open/);
    await (await ensureDisplayOption(page, "Všechna pole")).click();
    await expect(page.locator(".zs-basic-wizard")).toHaveCount(0);
    await expect(rail).toHaveClass(/page-toc--open/);
    expect(await tocStored(page)).toBeNull();
    await (await ensureDisplayOption(page, "Průvodce")).click();
    await expect(page.locator(".zs-basic-wizard")).toBeVisible();
    await expect(rail).not.toHaveClass(/page-toc--open/);
    expect(await tocStored(page)).toBeNull();
  });

  test("D. ruční otevření přežije obnovení a změnu režimu", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await prepare(page, "basic");
    const rail = page.locator(".page-toc--rail");
    await page.getByRole("button", { name: "Zobrazit obsah stránky" }).click();
    await expect(rail).toHaveClass(/page-toc--open/);
    await expect.poll(() => tocStored(page)).toBe("1");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(rail).toHaveClass(/page-toc--open/);
    await (await ensureDisplayOption(page, "Všechna pole")).click();
    await expect(rail).toHaveClass(/page-toc--open/);
    await (await ensureDisplayOption(page, "Průvodce")).click();
    await expect(rail).toHaveClass(/page-toc--open/);
    expect(await tocStored(page)).toBe("1");
  });

  test("E. ruční zavření zůstane zavřené i ve Všechna pole", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await prepare(page, "expert");
    const rail = page.locator(".page-toc--rail");
    await rail.locator(".page-toc__toggle").click();
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await expect.poll(() => tocStored(page)).toBe("0");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await (await ensureDisplayOption(page, "Průvodce")).click();
    await (await ensureDisplayOption(page, "Všechna pole")).click();
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    expect(await tocStored(page)).toBe("0");
  });

  test("F. NV75 bez uložené volby nechá obsah otevřený", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.addInitScript(() => {
      localStorage.removeItem("phmax-toc-open");
    });
    await gotoProductView(page, "nv75");
    await expect(page.locator(".page-toc--rail")).toHaveClass(/page-toc--open/);
    await expect(page.locator(".page-toc--rail")).toBeVisible();
  });

  test("G. mobil má obsah zavřený a přepínač funguje", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page, "basic");
    const rail = page.locator(".page-toc--rail");
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await page.getByRole("button", { name: "Zobrazit obsah stránky" }).click();
    await expect(rail).toHaveAttribute("aria-hidden", "false");
    await expect(rail.getByRole("button", { name: "Typ školy a režim" })).toBeVisible();
  });

  test("H. pět kroků, obnova a akce chyby zůstávají", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await prepare(page, "basic");
    const titles = ["Typ školy", "Třídy", "Výjimky", "Souhrn PHmax", "Celkový přehled"];
    for (const title of titles.slice(0, 4)) {
      await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText(title);
      await page.getByRole("button", { name: "Další krok" }).click();
    }
    await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Celkový přehled");
    await page.getByRole("button", { name: "Zpět" }).click();
    await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Souhrn PHmax");
    await page.locator(".zs-basic-wizard__steps").getByRole("button", { name: "Celkový přehled" }).click();
    await expect(page.locator(".zs-basic-wizard").getByRole("button", { name: "Přejít k chybě" })).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText("Celkový přehled");
  });

  test("I. zavřený obsah nepřebírá klávesový fokus", async ({ page }) => {
    const rail = page.locator(".page-toc--rail");
    const trigger = page.locator(".page-toc-mobile-trigger");

    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await prepare(page, "basic");
      await expect(rail).toHaveAttribute("aria-hidden", "true");
      expect(await hiddenLinkTakesFocus(page)).toBe(false);
      expect(await tabEntersHiddenRail(page)).toBe(false);

      await trigger.click();
      await expect(rail).toHaveAttribute("aria-hidden", "false");
      expect(await hiddenLinkTakesFocus(page)).toBe(true);
      await page.keyboard.press("Escape");
      await expect(rail).toHaveAttribute("aria-hidden", "true");
      await expect(trigger).toBeFocused();
    }
  });
});
