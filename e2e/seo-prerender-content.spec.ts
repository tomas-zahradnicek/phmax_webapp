import { test, expect } from "@playwright/test";

const ZS_PATH = "/phmax-zakladni-skola/";
const ZS_H1 = "Kalkulačka PHmax, PHAmax a PHPmax pro základní školu";
const LANDING_PATH = "/kalkulacky-phmax/";
const LANDING_H1 = "Kalkulačky PHmax a nástroje pro ředitele škol";
const VYROCNI_PATH = "/vyrocni-zprava/";
const VYROCNI_H1 = "Výroční zpráva školy – příprava po kapitolách";

const PHMAX_ZS_LINK = "PHmax kalkulačka pro základní školy";

test.describe("SEO prerender obsah – s JavaScriptem", () => {
  test("po mountu odstraní #seo-prerender-content a ponechá jeden H1", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(ZS_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("základní škol", { timeout: 15_000 });
    await expect(page.locator("#seo-prerender-content")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('[data-testid="phmax-module-seo"]')).toHaveCount(1);
    await expect(page.locator(".calculator-hero-shell").first()).toBeVisible();
    expect(consoleErrors, `console errors: ${consoleErrors.join("; ")}`).toEqual([]);
  });

  test("landing page po mountu zobrazí React obsah", async ({ page }) => {
    await page.goto(LANDING_PATH);
    await expect(page.getByRole("heading", { level: 1, name: LANDING_H1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#seo-prerender-content")).toHaveCount(0);
    await expect(page.locator("#kalkulacky-phmax-main")).toHaveCount(1);
    await expect(page.getByRole("link", { name: PHMAX_ZS_LINK })).toBeVisible();
  });

  test("výroční zpráva po mountu odstraní prerender a zobrazí modul", async ({ page }) => {
    await page.goto(VYROCNI_PATH);
    await expect(page.getByRole("heading", { level: 1, name: VYROCNI_H1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#seo-prerender-content")).toHaveCount(0);
    await expect(page.locator("#vyrocni-zprava-main")).toBeVisible();
  });

  test("klientská navigace mezi moduly funguje", async ({ page }) => {
    await page.goto(ZS_PATH);
    await page.getByRole("link", { name: "PHmax ŠD" }).first().click();
    await expect(page).toHaveURL(/\/phmax-skolni-druzina\/?$/);
    await expect(page.locator("#seo-prerender-content")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

test.describe("SEO prerender obsah – bez JavaScriptu", () => {
  test.use({ javaScriptEnabled: false });

  test("zobrazí route-specific H1, FAQ a interní odkazy", async ({ page }) => {
    await page.goto(ZS_PATH);
    await expect(page.locator("#seo-prerender-content")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: ZS_H1 })).toBeVisible();
    await expect(page.getByText("Nejčastější otázky")).toBeVisible();
    await expect(page.getByRole("link", { name: "Návod k použití" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rychlý PHmax pro základní školu" })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
  });

  test("landing page bez JS zobrazí odkazy na kalkulačky", async ({ page }) => {
    await page.goto(LANDING_PATH);
    await expect(page.locator("#seo-prerender-content")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: LANDING_H1 })).toBeVisible();
    await expect(page.getByRole("link", { name: PHMAX_ZS_LINK })).toBeVisible();
    await expect(page.getByRole("link", { name: "PHmax kalkulačka pro předškolní vzdělávání" })).toBeVisible();
    await expect(page.locator('a[href="/navod"]')).toHaveCount(1);
  });

  test("výroční zpráva bez JS má route-specific FAQ a bez dash FAQ", async ({ page }) => {
    await page.goto(VYROCNI_PATH);
    await expect(page.locator("#seo-prerender-content")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: VYROCNI_H1 })).toBeVisible();
    await expect(page.getByText("Kde se data ukládají?")).toBeVisible();
    await expect(page.getByText("Proč se liší součet a modul ZŠ?")).toHaveCount(0);
    expect(await page.locator("h2").count()).toBeGreaterThanOrEqual(4);
  });
});

test.describe("SEO indexační politika D2", () => {
  test("noindex dashboard a profil, index landing a výroční zpráva", async ({ page }) => {
    await page.goto("/prehled");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex,\s*follow/i);

    await page.goto("/profil-skoly");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex,\s*follow/i);

    await page.goto("/vyrocni-zprava/nahled");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex,\s*follow/i);

    await page.goto(LANDING_PATH);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/i);

    await page.goto(VYROCNI_PATH);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/i);

    await page.goto("/navod");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/navod$/,
    );
    const navodHead = await page.content();
    expect(navodHead).not.toMatch(/"@type"\s*:\s*"SoftwareApplication"/);
    expect(navodHead).toMatch(/"@type"\s*:\s*"WebPage"/);
    expect(navodHead).toMatch(/"@type"\s*:\s*"BreadcrumbList"/);
  });
});
