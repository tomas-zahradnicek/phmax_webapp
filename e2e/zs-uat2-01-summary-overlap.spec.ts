import { expect, test, type Locator, type Page } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1366, height: 768 },
] as const;

function guide(page: Page) {
  return page.getByRole("region", { name: "Průvodce výpočtem PHmax" });
}

async function hitTarget(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return "missing";
    if (rect.bottom <= 4 || rect.top >= window.innerHeight - 4) return "offscreen";
    const x = Math.min(Math.max(rect.left + rect.width / 2, 1), window.innerWidth - 2);
    const y = Math.min(Math.max(rect.top + Math.min(rect.height / 2, rect.height - 2), 1), window.innerHeight - 2);
    const top = document.elementFromPoint(x, y);
    if (top && (top === el || el.contains(top))) return "ok";
    const name = top instanceof Element ? String(top.className || top.tagName).slice(0, 60) : "none";
    return `hit:${name}`;
  });
}

type OverlapProbe = {
  scrollY: number;
  overlapArea: number;
  buttonTop: number;
  buttonBottom: number;
  bandTop: number;
  bandBottom: number;
  visibility: string;
  opacity: string;
  pointerEvents: string;
  hit: string;
  yields: boolean;
};

async function overlapProbe(locator: Locator): Promise<OverlapProbe> {
  return locator.evaluate((el) => {
    const panel = document.querySelector(".calculator-mobile-scroll-results, .calculator-mobile-summary-chip");
    const button = el.getBoundingClientRect();
    const band = panel instanceof HTMLElement ? panel.getBoundingClientRect() : null;
    const style = panel instanceof HTMLElement ? getComputedStyle(panel) : null;
    const overlapWidth = band ? Math.max(0, Math.min(button.right, band.right) - Math.max(button.left, band.left)) : 0;
    const overlapHeight = band ? Math.max(0, Math.min(button.bottom, band.bottom) - Math.max(button.top, band.top)) : 0;
    const x = Math.min(Math.max(button.left + button.width / 2, 1), window.innerWidth - 2);
    const y = Math.min(Math.max(button.top + button.height / 2, 1), window.innerHeight - 2);
    const onScreen = button.bottom > 4 && button.top < window.innerHeight - 4 && button.width >= 8;
    const top = onScreen ? document.elementFromPoint(x, y) : null;
    const hit = !onScreen
      ? "offscreen"
      : top && (top === el || el.contains(top))
        ? "ok"
        : `hit:${top instanceof Element ? String(top.className || top.tagName).slice(0, 60) : "none"}`;
    return {
      scrollY: window.scrollY,
      overlapArea: overlapWidth * overlapHeight,
      buttonTop: button.top,
      buttonBottom: button.bottom,
      bandTop: band ? band.top : -1,
      bandBottom: band ? band.bottom : -1,
      visibility: style ? style.visibility : "missing",
      opacity: style ? style.opacity : "missing",
      pointerEvents: style ? style.pointerEvents : "missing",
      hit,
      yields: document.body.classList.contains("zs-mobile-summary-yields"),
    };
  });
}

async function pinWizardToTop(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(300);
  }
}

async function openWizardStep(page: Page, step: 2 | 3): Promise<void> {
  await clearLocalStorageKeys(page, [
    "phmax-zs-basic-wizard-step",
    "phmax-zs-view-mode",
    "edu-cz-zs-calculator-state",
    "phmax-zs-quick-tour-v1",
  ]);
  await page.addInitScript((wizardStep: number) => {
    localStorage.setItem("phmax-zs-view-mode", "basic");
    localStorage.setItem("phmax-zs-basic-wizard-step", String(wizardStep));
    localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    localStorage.setItem("phmax-zs-quick-tour-v1", "1");
  }, step);
  await gotoProductView(page, "zs");
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = "html, body { scroll-behavior: auto !important; }";
    document.head.appendChild(style);
  });
  await expect(
    guide(page).getByRole("heading", { name: step === 2 ? "Třídy" : "Výjimky", exact: true }),
  ).toBeVisible();
}

async function openClassesStep(page: Page): Promise<void> {
  await openWizardStep(page, 2);
}

/** Scrolls only when the control is outside the viewport. A covered on-screen control stays a hit failure. */
async function placeOnScreen(locator: Locator): Promise<string> {
  const initial = await hitTarget(locator);
  if (initial !== "offscreen") return initial;
  await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const top = window.scrollY + rect.top - Math.min(160, window.innerHeight * 0.35);
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "instant" });
    window.dispatchEvent(new Event("scroll"));
  });
  return hitTarget(locator);
}

test.describe("ZŠ UAT2-01 plovoucí souhrn", () => {
  test("Zpět a Další krok jsou dosažitelné na 390, 768, 1024 a 1366", async ({ page }) => {
    test.setTimeout(90_000);
    await openClassesStep(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await pinWizardToTop(page);
      const back = guide(page).getByRole("button", { name: "Zpět" });
      const next = guide(page).getByRole("button", { name: "Další krok" });
      const summary = page.locator(".calculator-mobile-scroll-results");
      await expect(back).toBeEnabled();
      await expect(next).toBeEnabled();

      if (viewport.width <= 1099) {
        await expect(summary).toBeAttached();
      } else {
        await expect(summary).toHaveCount(0);
        await expect(page.locator("body")).not.toHaveClass(/zs-mobile-summary-yields/);
      }

      await expect.poll(async () => placeOnScreen(back), { timeout: 2000 }).toBe("ok");
      await expect.poll(async () => placeOnScreen(next), { timeout: 2000 }).toBe("ok");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `overflow ${viewport.width}`).toBe(false);

      if (viewport.width <= 1099) {
        const backOverlaps = await back.evaluate((el) => {
          const panel = document.querySelector(".calculator-mobile-scroll-results");
          if (!(panel instanceof HTMLElement)) return false;
          const button = el.getBoundingClientRect();
          const band = panel.getBoundingClientRect();
          return button.bottom > band.top + 8 && button.top < band.bottom - 8;
        });
        if (backOverlaps) {
          await expect(page.locator("body")).toHaveClass(/zs-mobile-summary-yields/);
          await expect(summary).toBeHidden();
        }
      }

      await next.click();
      await expect(guide(page).getByRole("heading", { name: "Výjimky", exact: true })).toBeVisible();
      const step3Back = guide(page).getByRole("button", { name: "Zpět" });
      const step3Next = guide(page).getByRole("button", { name: "Další krok" });
      await expect.poll(async () => placeOnScreen(step3Back), { timeout: 2000 }).toBe("ok");
      await expect.poll(async () => placeOnScreen(step3Next), { timeout: 2000 }).toBe("ok");
      await step3Back.click();
      await expect(guide(page).getByRole("heading", { name: "Třídy", exact: true })).toBeVisible();
    }
  });

  test("souhrn se skryje při překrytí a po odscrollování mimo průvodce se vrátí", async ({ page }) => {
    await openClassesStep(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await pinWizardToTop(page);
    const summary = page.locator(".calculator-mobile-scroll-results");
    await expect(summary).toBeAttached();
    await expect(page.locator("body")).toHaveClass(/zs-mobile-summary-yields/);
    await expect(summary).toBeHidden();

    const cleared = await page.evaluate(() => {
      const panel = document.querySelector(".calculator-mobile-scroll-results");
      const wizard = document.querySelector(".zs-basic-wizard");
      if (!(panel instanceof HTMLElement) || !(wizard instanceof HTMLElement)) return "missing";
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= max; y += 120) {
        window.scrollTo(0, y);
        window.dispatchEvent(new Event("scroll"));
        const band = panel.getBoundingClientRect();
        if (wizard.getBoundingClientRect().bottom >= band.top) continue;
        let covered = false;
        for (const node of document.querySelectorAll(
          ".container--app button, .container--app a, .container--app input, .container--app select, .container--app textarea, .container--app summary",
        )) {
          if (!(node instanceof HTMLElement) || node.closest(".page-toc, .page-toc-mobile-trigger")) continue;
          const rect = node.getBoundingClientRect();
          if (rect.width < 8 || rect.height < 8 || rect.right <= band.left || rect.left >= band.right) continue;
          if (rect.bottom > band.top && rect.top < band.bottom) {
            covered = true;
            break;
          }
        }
        if (!covered) {
          return document.body.classList.contains("zs-mobile-summary-yields") ? "still-hidden" : "shown";
        }
      }
      return "no-clear-band";
    });
    expect(cleared).toBe("shown");
    await expect(summary).toBeVisible();
    await page.mouse.wheel(0, -80);
    await expect(summary).toBeVisible();
  });

  test("hero-yield, klávesnice a fokus na průvodci", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await clearLocalStorageKeys(page, ["phmax-zs-basic-wizard-step", "phmax-zs-view-mode", "edu-cz-zs-calculator-state"]);
    await gotoProductView(page, "zs");
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent = "html, body { scroll-behavior: auto !important; }";
      document.head.appendChild(style);
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event("scroll"));
    });
    const preset = page.locator("#zs-basic-wizard-preset");
    await expect(preset).toBeVisible();
    await expect.poll(async () => hitTarget(preset), { timeout: 2000 }).toBe("ok");
    await expect(page.locator("body")).toHaveClass(/zs-mobile-summary-yields/);

    await openClassesStep(page);
    await page.setViewportSize({ width: 768, height: 900 });
    await pinWizardToTop(page);
    const next = guide(page).getByRole("button", { name: "Další krok" });
    const back = guide(page).getByRole("button", { name: "Zpět" });
    await expect.poll(async () => hitTarget(next), { timeout: 2000 }).toBe("ok");
    await next.focus();
    await expect(next).toBeFocused();
    await next.press("Enter");
    await expect(guide(page).getByRole("heading", { name: "Výjimky", exact: true })).toBeVisible();
    await back.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
    await expect.poll(async () => hitTarget(back), { timeout: 2000 }).toBe("ok");
    await back.focus();
    await expect(back).toBeFocused();
    await back.press("Enter");
    await expect(guide(page).getByRole("heading", { name: "Třídy", exact: true })).toBeVisible();
    await next.click();
    await expect(guide(page).getByRole("heading", { name: "Výjimky", exact: true })).toBeVisible();
  });

  test("768×900 krok 3 při scrollY 0: geometrie překrytí a elementFromPoint", async ({ page }) => {
    await openWizardStep(page, 3);
    await page.setViewportSize({ width: 768, height: 900 });
    await pinWizardToTop(page);
    const next = guide(page).getByRole("button", { name: "Další krok" });
    const back = guide(page).getByRole("button", { name: "Zpět" });
    const summary = page.locator(".calculator-mobile-scroll-results");
    await pinWizardToTop(page);
    const atScrollZero = await overlapProbe(next);
    expect(atScrollZero.scrollY).toBe(0);
    if (atScrollZero.hit !== "offscreen") {
      expect(atScrollZero.hit).toBe("ok");
      if (atScrollZero.overlapArea > 0) {
        expect(atScrollZero.yields).toBe(true);
        expect(atScrollZero.pointerEvents).toBe("none");
      }
    }

    const placed = await page.evaluate(() => {
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event("scroll"));
      const button = [...document.querySelectorAll(".zs-basic-wizard__nav button")].find((node) =>
        (node.textContent || "").includes("Další krok"),
      );
      const panel = document.querySelector(".calculator-mobile-scroll-results");
      if (!(button instanceof HTMLElement) || !(panel instanceof HTMLElement)) return false;
      const buttonBox = button.getBoundingClientRect();
      const band = panel.getBoundingClientRect();
      if (buttonBox.top >= band.top && buttonBox.bottom <= window.innerHeight) return true;
      const delta = buttonBox.top + buttonBox.height / 2 - (band.top + band.height / 2);
      window.scrollTo(0, Math.max(0, window.scrollY + delta));
      window.dispatchEvent(new Event("scroll"));
      return false;
    });
    if (placed) {
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
    await expect.poll(async () => (await overlapProbe(next)).hit, { timeout: 2000 }).toBe("ok");
    await expect.poll(async () => (await overlapProbe(back)).hit, { timeout: 2000 }).toBe("ok");

    const nextProbe = await overlapProbe(next);
    expect(nextProbe.overlapArea).toBeGreaterThan(0);
    expect(nextProbe.yields).toBe(true);
    expect(nextProbe.visibility).toBe("hidden");
    expect(nextProbe.opacity).toBe("0");
    expect(nextProbe.pointerEvents).toBe("none");
    expect(nextProbe.hit).toBe("ok");

    const stable = await page.evaluate(() => {
      const read = () => document.body.classList.contains("zs-mobile-summary-yields");
      const first = read();
      const samples = [first];
      const origin = window.scrollY;
      for (const delta of [0, 1, 0, -1, 0]) {
        window.scrollTo(0, Math.max(0, origin + delta));
        window.dispatchEvent(new Event("scroll"));
        samples.push(read());
      }
      window.scrollTo(0, origin);
      window.dispatchEvent(new Event("scroll"));
      return samples.every((sample) => sample === first);
    });
    expect(stable).toBe(true);

    const restored = await page.evaluate(() => {
      const panel = document.querySelector(".calculator-mobile-scroll-results");
      const wizard = document.querySelector(".zs-basic-wizard");
      if (!(panel instanceof HTMLElement) || !(wizard instanceof HTMLElement)) return "missing";
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= max; y += 80) {
        window.scrollTo(0, y);
        window.dispatchEvent(new Event("scroll"));
        const band = panel.getBoundingClientRect();
        if (wizard.getBoundingClientRect().bottom >= band.top - 24) continue;
        const blocked = [...document.querySelectorAll(
          ".container--app button, .container--app a, .container--app input, .container--app select, .container--app textarea, .container--app summary",
        )].some((node) => {
          if (!(node instanceof HTMLElement) || node.closest(".page-toc, .page-toc-mobile-trigger")) return false;
          const rect = node.getBoundingClientRect();
          return rect.width >= 8 && rect.height >= 8 && rect.bottom > band.top && rect.top < band.bottom && rect.right > band.left && rect.left < band.right;
        });
        if (!blocked) return document.body.classList.contains("zs-mobile-summary-yields") ? "still-hidden" : "shown";
      }
      return "no-clear-band";
    });
    expect(restored).toBe("shown");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveCSS("pointer-events", "auto");
    const dismiss = summary.getByRole("button", { name: "Skrýt souhrn výsledků" });
    await dismiss.click();
    await expect(page.getByRole("button", { name: "Zobrazit souhrn výsledků" })).toBeVisible();
  });

  test("PV souhrn nemá třídu ústupu ZŠ", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoProductView(page, "pv");
    await expect(page.locator("body")).not.toHaveClass(/zs-mobile-summary-yields/);
    const summary = page.locator(".calculator-mobile-scroll-results");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveCSS("visibility", "visible");
  });
});
