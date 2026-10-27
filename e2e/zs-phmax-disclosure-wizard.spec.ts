import { expect, test, type Locator, type Page } from "@playwright/test";
import { clearLocalStorageKeys, dismissMobileFloatingSummaryIfVisible, gotoProductView } from "./smoke-helpers";

const EXAMPLE_934 = "priloha_uplna_zs_sec16";
const COMPOSITION = "Běžné třídy 668 h + § 16/9 266 h = PHmax 934 h";

const OTHER_MODULES: { example: string; summary: string }[] = [
  { example: "psychiatricka_nemocnice", summary: "Škola při psychiatrické nemocnici" },
  { example: "zdravotnicke_zs", summary: "ZŠ při zdravotnickém zařízení" },
  { example: "mensina_phmax", summary: "ZŠ s jazykem národnostní menšiny" },
  { example: "gymnazium_phmax", summary: "Nižší ročníky víceletých gymnázií" },
  { example: "smisene_tridy", summary: "Smíšené třídy a ZŠ speciální" },
  { example: "pripravna_trida", summary: "Samostatné položky PHmax" },
];

async function loadExample(page: Page, example: string, label: RegExp) {
  await dismissMobileFloatingSummaryIfVisible(page);
  const control = page.locator("#zs-hero-example-select");
  await control.scrollIntoViewIfNeeded();
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await control.selectOption(example);
    return;
  }
  await control.click();
  await page.locator(".hero-example-sheet__option").filter({ hasText: label }).click();
}

async function goToWizardStep(page: Page, step: 2 | 3 | 4, label: string) {
  const button = page.getByRole("button", { name: new RegExp(`^${step}\\s+${label}$`) });
  await button.click({ force: true });
  await expect(page.locator(`.app-shell.zs-wizard-step-${step}`)).toBeVisible();
}

function moduleDetails(page: Page, summaryText: string): Locator {
  return page.locator('details[data-wizard-step="3"]').filter({
    has: page.locator("summary").filter({ hasText: summaryText }),
  });
}

async function deadSummaries(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    for (const summary of document.querySelectorAll("summary")) {
      const style = getComputedStyle(summary);
      const rect = summary.getBoundingClientRect();
      const visible =
        style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      if (!visible) continue;
      const details = summary.parentElement;
      if (!(details instanceof HTMLDetailsElement)) continue;
      const detailsHidden = getComputedStyle(details).display === "none";
      const hidesWizardBody = [...details.querySelectorAll("[data-wizard-step]")].some(
        (el) => getComputedStyle(el).display === "none",
      );
      if (hidesWizardBody && !detailsHidden) {
        found.push((summary.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120));
      }
    }
    return found;
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const box = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
}

async function assertVerticalScroll(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const canScroll = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight + 40,
  );
  expect(canScroll).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(20);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
}

async function expectDisclosure(details: Locator, open: boolean) {
  const summary = details.locator(":scope > summary");
  await expect(summary).toHaveAttribute("aria-expanded", open ? "true" : "false");
  await expect(details).toHaveJSProperty("open", open);
}

async function toggleByClick(details: Locator) {
  const summary = details.locator(":scope > summary");
  const open = await details.evaluate((el) => (el as HTMLDetailsElement).open);
  await summary.click();
  await expectDisclosure(details, !open);
}

async function toggleByKey(details: Locator, key: "Enter" | "Space") {
  const summary = details.locator(":scope > summary");
  const open = await details.evaluate((el) => (el as HTMLDetailsElement).open);
  await summary.focus();
  await summary.press(key);
  await expectDisclosure(details, !open);
}

test.describe("ZŠ PHmax disclosure wizard", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, [
      "phmax-zs-basic-wizard-step",
      "phmax-zs-view-mode",
      "edu-cz-zs-calculator-state",
    ]);
    await gotoProductView(page, "zs");
  });

  test("BASIC kroky 2–4, 934 h, disclosure a klávesnice", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1366, height: 900 });
    await loadExample(page, EXAMPLE_934, /934 h/);
    await goToWizardStep(page, 2, "Třídy");

    const classes = page.locator('[data-section="basic"]').getByRole("textbox", { name: "Počet tříd" }).first();
    await expect(classes).toBeVisible();
    await expect(classes).toBeEditable();
    await expect(classes).toHaveValue("10");
    await classes.fill("11");
    await expect(classes).toHaveValue("11");
    await classes.fill("10");
    await expect(classes).toHaveValue("10");
    await expect(page.getByText(COMPOSITION)).toBeVisible();
    expect(await deadSummaries(page)).toEqual([]);
    await assertNoHorizontalOverflow(page);

    await goToWizardStep(page, 3, "Výjimky");
    expect(await deadSummaries(page)).toEqual([]);
    const sec16 = moduleDetails(page, "Třídy podle");
    const extras = moduleDetails(page, "§ 38 a § 41");
    await expect(sec16.locator(":scope > summary")).toContainText("9 tříd · 72 žáků · 266 h");
    await expect(extras.locator(":scope > summary")).toContainText("bez navýšení");
    await expectDisclosure(sec16, false);
    await expectDisclosure(extras, false);

    await toggleByClick(sec16);
    const sec16Body = sec16.locator(".ux-collapsible__body");
    await expect(sec16Body.getByRole("textbox", { name: "1. stupeň – třídy" })).toHaveValue("5");
    await expect(sec16Body.getByRole("textbox", { name: "1. stupeň – žáci" })).toHaveValue("40");
    await expect(sec16Body.getByRole("textbox", { name: "2. stupeň – třídy" })).toHaveValue("4");
    await expect(sec16Body.getByRole("textbox", { name: "2. stupeň – žáci" })).toHaveValue("32");
    await toggleByKey(sec16, "Enter");
    await toggleByKey(sec16, "Space");
    await toggleByKey(sec16, "Enter");
    await expectDisclosure(sec16, false);

    await toggleByClick(extras);
    await toggleByKey(extras, "Space");
    await expectDisclosure(extras, false);

    await goToWizardStep(page, 4, "Souhrn PHmax");
    expect(await deadSummaries(page)).toEqual([]);
    await expect(page.getByText("934", { exact: true }).first()).toBeVisible();
    await assertVerticalScroll(page);

    await goToWizardStep(page, 2, "Třídy");
    await expect(page.getByText(COMPOSITION)).toBeVisible();
    await expect(page.getByText("934", { exact: true }).first()).toBeVisible();
    expect(await deadSummaries(page)).toEqual([]);
    await assertVerticalScroll(page);
  });

  test("ostatní PHmax moduly kroku 3 se rozbalí", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const module of OTHER_MODULES) {
      await loadExample(page, module.example, new RegExp(module.summary.split(" ")[0]!));
      await goToWizardStep(page, 3, "Výjimky");
      const details = moduleDetails(page, module.summary);
      await expect(details).toBeVisible();
      await expectDisclosure(details, false);
      await toggleByClick(details);
      await toggleByClick(details);
      expect(await deadSummaries(page)).toEqual([]);
    }
  });

  test("expertní režim nebalí moduly do disclosure", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loadExample(page, EXAMPLE_934, /934 h/);
    await page.getByRole("button", { name: /Zobrazení/ }).click();
    await page.getByRole("radio", { name: "Expertní" }).check();
    const shell = page.locator(".app-shell.calculator-shell");
    await expect(shell).not.toHaveClass(/zs-basic-wizard-active/);
    await expect(shell).toHaveClass(/phmax-zs-pane-active-classes/);
    const basic = page.locator('[data-section="basic"]');
    await expect(basic).toBeVisible();
    expect(await basic.evaluate((el) => Boolean(el.closest("details.ux-collapsible")))).toBe(false);
    const panes = page.getByRole("navigation", { name: "Části výpočtu PHmax" });

    const sec16 = page.locator('[data-section="sec16"]');
    await expect(sec16).toBeHidden();
    await panes.getByRole("button", { name: "Výjimky", exact: true }).click();
    await expect(shell).toHaveClass(/phmax-zs-pane-active-exceptions/);
    for (const section of ["sec16", "extras"]) {
      const card = page.locator(`[data-section="${section}"]`);
      await expect(card).toBeVisible();
      expect(await card.evaluate((el) => Boolean(el.closest("details.ux-collapsible")))).toBe(false);
    }
    await expect(sec16.getByRole("textbox", { name: "1. stupeň – třídy" })).toHaveValue("5");
    await expect(page.getByText("934", { exact: true }).first()).toBeVisible();
  });

  test("šířky 1920, 1366, 1280, 1024 a 390 nemají vodorovný přetok", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1366, height: 900 });
    await loadExample(page, EXAMPLE_934, /934 h/);
    await goToWizardStep(page, 3, "Výjimky");

    for (const width of [1920, 1366, 1280, 1024, 390]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
      await dismissMobileFloatingSummaryIfVisible(page);
      const summary = moduleDetails(page, "Třídy podle").locator(":scope > summary");
      await summary.scrollIntoViewIfNeeded();
      await expect(summary).toBeVisible();
      await expect(summary).toContainText("9 tříd");
      const overlap = await summary.evaluate((node) => {
        const title = node.querySelector("span");
        const chevron = node.querySelector(".ux-collapsible__chevron");
        if (!(title instanceof HTMLElement) || !(chevron instanceof HTMLElement)) return "missing";
        const titleBox = title.getBoundingClientRect();
        const chevronBox = chevron.getBoundingClientRect();
        const fontSize = Number.parseFloat(getComputedStyle(node).fontSize);
        const overlaps =
          titleBox.left < chevronBox.right - 1 &&
          titleBox.right > chevronBox.left + 1 &&
          titleBox.top < chevronBox.bottom - 1 &&
          titleBox.bottom > chevronBox.top + 1;
        return {
          overlaps,
          fontSize,
          chevronWidth: chevronBox.width,
          chevronHeight: chevronBox.height,
          chevronInView: chevronBox.left >= 0 && chevronBox.right <= window.innerWidth + 1,
        };
      });
      expect(overlap).not.toBe("missing");
      if (typeof overlap === "object") {
        expect(overlap.overlaps).toBe(false);
        expect(overlap.fontSize).toBeGreaterThanOrEqual(12);
        expect(overlap.chevronWidth).toBeGreaterThanOrEqual(8);
        expect(overlap.chevronHeight).toBeGreaterThanOrEqual(8);
        expect(overlap.chevronInView).toBe(true);
      }
      await assertNoHorizontalOverflow(page);
      expect(await deadSummaries(page)).toEqual([]);
    }
  });
});
