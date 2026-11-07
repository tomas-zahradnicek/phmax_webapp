import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

type ZsOpenOptions = {
  mode?: "basic" | "expert";
  step?: string;
  toc?: "0" | "1" | null;
  width?: number;
  height?: number;
};

async function openZs(page: Page, options: ZsOpenOptions = {}) {
  const { mode = "basic", step = "1", toc = null, width = 1366, height = 768 } = options;
  await page.setViewportSize({ width, height });
  await gotoProductView(page, "zs");
  await page.evaluate(
    ({ nextMode, nextStep, nextToc }) => {
      localStorage.setItem("phmax-zs-view-mode", nextMode);
      localStorage.setItem("phmax-zs-basic-wizard-step", nextStep);
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
      if (nextToc == null) localStorage.removeItem("phmax-toc-open");
      else localStorage.setItem("phmax-toc-open", nextToc);
    },
    { nextMode: mode, nextStep: step, nextToc: toc },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Zobrazení/ }).waitFor();
}

async function openToc(page: Page): Promise<Locator> {
  const rail = page.locator(".page-toc--rail");
  const open = await rail.evaluate((el) => el.classList.contains("page-toc--open"));
  if (!open) {
    await page.getByRole("button", { name: "Zobrazit obsah stránky" }).click();
  }
  await expect(rail).toHaveClass(/page-toc--open/);
  await expect(rail).toHaveAttribute("aria-hidden", "false");
  return rail;
}

async function clickToc(page: Page, name: string) {
  const rail = await openToc(page);
  await rail.getByRole("button", { name, exact: true }).click();
}

async function expectWizardStep(page: Page, step: number) {
  await expect(page.locator(`.app-shell.zs-basic-wizard-active.zs-wizard-step-${step}`)).toBeVisible();
  await expect(page.locator(".zs-basic-wizard .section-title")).toHaveText(
    ["Typ školy", "Třídy", "Výjimky", "Souhrn PHmax", "Celkový přehled"][step - 1]!,
  );
}

async function storedWizardStep(page: Page) {
  return page.evaluate(() => localStorage.getItem("phmax-zs-basic-wizard-step"));
}

async function focusIsOutsideHiddenUi(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return true;
    if (active.closest('[aria-hidden="true"]')) return false;
    const stepped = active.closest<HTMLElement>("[data-wizard-step]");
    if (stepped && getComputedStyle(stepped).display === "none") return false;
    return true;
  });
}

test.describe("ZŠ TOC navigace v průvodci PHmax", () => {
  test("A. Běžné třídy z kroku 1 otevře krok 2", async ({ page }) => {
    await openZs(page, { step: "1" });
    await clickToc(page, "Běžné třídy");
    await expectWizardStep(page, 2);
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
  });

  test("B. Výjimky PHmax z kroku 2 otevře krok 3", async ({ page }) => {
    await openZs(page, { step: "2" });
    await clickToc(page, "Výjimky PHmax");
    await expectWizardStep(page, 3);
    await expect(page.locator(".app-shell.phmax-zs-pane-active-exceptions")).toBeVisible();
    await expect(page.locator('details[data-wizard-step="3"]').first()).toBeVisible();
    await expect(page.locator('[data-section="basic"]')).toBeHidden();
  });

  test("C. Souhrn PHmax z kroku 3 otevře krok 4", async ({ page }) => {
    await openZs(page, { step: "3" });
    await clickToc(page, "Souhrn PHmax");
    await expectWizardStep(page, 4);
    await expect(page.locator('[data-section="phmax-summary"]')).toBeVisible();
  });

  test("D. Celkový přehled z kroku 4 otevře krok 5", async ({ page }) => {
    await openZs(page, { step: "4" });
    await clickToc(page, "Celkový přehled");
    await expectWizardStep(page, 5);
    await expect(page.locator('[data-section="overview"]')).toBeVisible();
  });

  test("E. TOC umí krok 5 na 2 a krok 2 na 1", async ({ page }) => {
    await openZs(page, { step: "5" });
    await clickToc(page, "Běžné třídy");
    await expectWizardStep(page, 2);
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
    await clickToc(page, "Typ školy a režim");
    await expectWizardStep(page, 1);
    await expect(page.locator('[data-section="setup"]')).toBeVisible();
  });

  test("F. po TOC skoku zůstane Zpět a Další", async ({ page }) => {
    await openZs(page, { step: "1" });
    await clickToc(page, "Běžné třídy");
    await expectWizardStep(page, 2);
    await page.getByRole("button", { name: "Další krok" }).click();
    await expectWizardStep(page, 3);
    await page.getByRole("button", { name: "Zpět" }).click();
    await expectWizardStep(page, 2);
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
  });

  test("G. obnova stránky podrží krok zvolený z TOC", async ({ page }) => {
    await openZs(page, { step: "1" });
    await clickToc(page, "Souhrn PHmax");
    await expectWizardStep(page, 4);
    await expect.poll(() => storedWizardStep(page)).toBe("4");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectWizardStep(page, 4);
    expect(await storedWizardStep(page)).toBe("4");
  });

  test("H. Všechna pole dál jen scrollují a krok nemění", async ({ page }) => {
    await openZs(page, { mode: "expert", step: "2" });
    await expect(page.locator(".app-shell--zs")).not.toHaveClass(/zs-basic-wizard-active/);
    const basic = page.locator('[data-section="basic"]');
    await expect(basic).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await clickToc(page, "Běžné třídy");
    await expect(page.locator(".app-shell--zs")).not.toHaveClass(/zs-wizard-step-/);
    await expect(basic).toBeInViewport();
    expect(await storedWizardStep(page)).toBe("2");
  });

  test("I. mobil zavře obsah, vrátí fokus a změní krok", async ({ page }) => {
    await openZs(page, { step: "1", width: 390, height: 844 });
    const rail = page.locator(".page-toc--rail");
    const trigger = page.locator(".page-toc-mobile-trigger");
    await clickToc(page, "Běžné třídy");
    await expectWizardStep(page, 2);
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await expect(trigger).toBeFocused();
    expect(await focusIsOutsideHiddenUi(page)).toBe(true);
    const linkTakesFocus = await page.evaluate(() => {
      const nav = document.querySelector(".page-toc--rail");
      const link = nav?.querySelector<HTMLElement>(".page-toc__link");
      if (!nav || !link) return true;
      link.focus();
      return document.activeElement === link;
    });
    expect(linkTakesFocus).toBe(false);
  });

  test("J. Enter, Space a Escape u odkazů obsahu", async ({ page }) => {
    await openZs(page, { step: "1" });
    const rail = await openToc(page);
    const classes = rail.getByRole("button", { name: "Běžné třídy", exact: true });
    await classes.focus();
    await page.keyboard.press("Enter");
    await expectWizardStep(page, 2);
    await expect(page.locator('[data-section="basic"]')).toBeVisible();

    const exceptions = rail.getByRole("button", { name: "Výjimky PHmax", exact: true });
    await exceptions.focus();
    await page.keyboard.press("Space");
    await expectWizardStep(page, 3);
    await expect(page.locator(".app-shell.phmax-zs-pane-active-exceptions")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(rail).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".page-toc-mobile-trigger")).toBeFocused();
    expect(await focusIsOutsideHiddenUi(page)).toBe(true);
  });

  test("K. desktopový skok nepřepíše phmax-toc-open", async ({ page }) => {
    await openZs(page, { step: "1", toc: "1" });
    const rail = page.locator(".page-toc--rail");
    await expect(rail).toHaveClass(/page-toc--open/);
    await clickToc(page, "Běžné třídy");
    await expectWizardStep(page, 2);
    await expect(rail).toHaveClass(/page-toc--open/);
    expect(await page.evaluate(() => localStorage.getItem("phmax-toc-open"))).toBe("1");
  });

  test("L. NV75 dál scrolluje bez kroku průvodce ZŠ", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoProductView(page, "nv75");
    await page.evaluate(() => {
      localStorage.setItem("phmax-nv75-view-mode", "expert");
      localStorage.removeItem("phmax-toc-open");
      localStorage.removeItem("phmax-zs-basic-wizard-step");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const target = page.locator('[data-section="nv75-vstupy"]');
    await expect(target).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    const rail = page.locator(".page-toc--rail");
    await expect(rail).toHaveClass(/page-toc--open/);
    await rail.getByRole("button", { name: "Vstupy a řádky", exact: true }).click();
    await expect(target).toBeInViewport();
    await expect(page.locator(".calculator-shell--nv75")).not.toHaveClass(/zs-wizard-step-/);
    expect(await page.evaluate(() => localStorage.getItem("phmax-zs-basic-wizard-step"))).toBeNull();
  });
});
