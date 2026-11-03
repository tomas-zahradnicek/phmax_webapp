import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";
import { NV75_BASIC_WIZARD_LS_KEY } from "../src/nv75-basic-wizard";
import { PHMAX_PV_LITE_PATH, PHMAX_SD_LITE_PATH, PHMAX_ZS_LITE_PATH } from "../src/phmax-lite-paths";
import { PV_BASIC_WIZARD_LS_KEY } from "../src/pv-basic-wizard";
import { SD_BASIC_WIZARD_LS_KEY } from "../src/sd-basic-wizard";
import { SS_BASIC_WIZARD_LS_KEY } from "../src/ss-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "../src/zs-basic-wizard";

const FOCUS_KEY = "phmax-calculator-focus";
const DENSITY_KEY = "phmax-display-density";
const COACHMARK_KEY = "phmax-calculator-hint-first-visit-v1";

const QUICK_TOUR_KEYS = [
  "phmax-pv-quick-tour-v1",
  "phmax-sd-quick-tour-v1",
  "phmax-ss-quick-tour-v1",
  "phmax-nv75-quick-tour-v1",
  "phmax-zs-quick-tour-v1",
] as const;

type ModuleCase = {
  id: "pv" | "sd" | "zs" | "ss" | "nv75";
  viewModeKey: string;
  wizardKey: string;
  storageKey: string;
  stepPrefix: string;
  inputStepName: RegExp;
  inputSection: string;
  input: (page: Page) => Locator;
};

const MODULES: readonly ModuleCase[] = [
  {
    id: "pv",
    viewModeKey: "phmax-pv-view-mode",
    wizardKey: PV_BASIC_WIZARD_LS_KEY,
    storageKey: "edu-cz-pv-calculator-state",
    stepPrefix: "pv-wizard-step",
    inputStepName: /^2\s+Vstupy$/,
    inputSection: "pv-vstupy",
    input: (page) => page.getByRole("textbox", { name: /Počet tříd pracoviště MŠ/ }),
  },
  {
    id: "sd",
    viewModeKey: "phmax-sd-view-mode",
    wizardKey: SD_BASIC_WIZARD_LS_KEY,
    storageKey: "edu-cz-sd-calculator-state",
    stepPrefix: "sd-wizard-step",
    inputStepName: /^2\s+Vstupy$/,
    inputSection: "sd-vstupy",
    input: (page) => page.getByRole("textbox", { name: /Počet přihlášených účastníků/ }),
  },
  {
    id: "zs",
    viewModeKey: "phmax-zs-view-mode",
    wizardKey: ZS_BASIC_WIZARD_LS_KEY,
    storageKey: "edu-cz-zs-calculator-state",
    stepPrefix: "zs-wizard-step",
    inputStepName: /^2\s+Třídy$/,
    inputSection: "basic",
    input: (page) => page.locator('[data-section="basic"]').getByRole("textbox", { name: "Počet tříd" }).first(),
  },
  {
    id: "ss",
    viewModeKey: "phmax-ss-view-mode",
    wizardKey: SS_BASIC_WIZARD_LS_KEY,
    storageKey: "phmax-ss-units-draft",
    stepPrefix: "ss-wizard-step",
    inputStepName: /^2\s+Vstupy$/,
    inputSection: "ss-vstupy",
    input: (page) => page.getByRole("textbox", { name: "Počet tříd, řádek 1" }),
  },
  {
    id: "nv75",
    viewModeKey: "phmax-nv75-view-mode",
    wizardKey: NV75_BASIC_WIZARD_LS_KEY,
    storageKey: "edu-cz-nv75-deputy-bank-state",
    stepPrefix: "nv75-wizard-step",
    inputStepName: /^2\s+Vstupy$/,
    inputSection: "nv75-vstupy",
    input: (page) => page.locator('[data-section="nv75-vstupy"] tbody tr').first().locator("td").nth(1).locator("input"),
  },
];

function shellStep(prefix: string, step: 1 | 2) {
  return `.calculator-shell.${prefix}-${step}`;
}

async function seedModule(page: Page, module: ModuleCase, wizardStep: "1" | "2", focus: "on" | "off") {
  await page.addInitScript(
    ({ module: item, wizardStep: step, focus: focusMode, focusKey, densityKey, coachmarkKey, tourKeys }) => {
      const marker = `phmax-e2e-seed:${item.wizardKey}:${step}:${focusMode}`;
      if (sessionStorage.getItem(marker) === "1") return;
      sessionStorage.setItem(marker, "1");
      localStorage.removeItem(item.storageKey);
      localStorage.setItem(item.viewModeKey, "basic");
      localStorage.setItem(item.wizardKey, step);
      localStorage.setItem(focusKey, focusMode);
      localStorage.setItem(densityKey, "comfortable");
      localStorage.setItem(coachmarkKey, "1");
      for (const key of tourKeys) localStorage.setItem(key, "1");
    },
    {
      module: {
        storageKey: module.storageKey,
        viewModeKey: module.viewModeKey,
        wizardKey: module.wizardKey,
      },
      wizardStep,
      focus,
      focusKey: FOCUS_KEY,
      densityKey: DENSITY_KEY,
      coachmarkKey: COACHMARK_KEY,
      tourKeys: QUICK_TOUR_KEYS,
    },
  );
}

async function expectHitTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  const hit = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 1), window.innerWidth - 2);
    const y = Math.min(Math.max(rect.top + Math.min(rect.height / 2, 18), 1), window.innerHeight - 2);
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (el === top || el.contains(top)));
  });
  expect(hit).toBe(true);
}

function wizardNav(page: Page) {
  return page.locator(".zs-basic-wizard__nav");
}

function inputSection(page: Page, section: string) {
  return page.locator(`[data-section="${section}"]`);
}

async function activateByKeyboard(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.focus();
  await expect(locator).toBeFocused();
  await locator.press("Enter");
}

async function activateByPointer(locator: Locator) {
  await expectHitTarget(locator);
  await locator.click();
}

async function openDisplaySettings(page: Page) {
  const trigger = page.getByRole("button", { name: /Zobrazení/ });
  if ((await trigger.getAttribute("aria-expanded")) === "true") {
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  }
  await trigger.evaluate((el) => {
    el.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await trigger.click();
  await expect(page.getByRole("region", { name: "Nastavení zobrazení kalkulačky" })).toBeVisible();
}

async function expectValueSurvivesDisplayChanges(page: Page, input: Locator, value: string) {
  const panel = () => page.getByRole("region", { name: "Nastavení zobrazení kalkulačky" });

  await openDisplaySettings(page);
  await panel().getByRole("radio", { name: "Expertní" }).check();
  await expect(page.locator(".calculator-shell--expert")).toBeVisible();
  await expect(input).toHaveValue(value);

  await openDisplaySettings(page);
  await panel().getByRole("radio", { name: "Základní" }).check();
  await expect(page.locator(".calculator-shell--basic")).toBeVisible();
  await expect(input).toHaveValue(value);

  await openDisplaySettings(page);
  await panel().getByRole("radio", { name: "Kompaktní" }).check();
  await expect(page.locator(".calculator-shell--density-compact")).toBeVisible();
  await expect(input).toHaveValue(value);

  await openDisplaySettings(page);
  await panel().getByRole("checkbox", { name: "Fokus na formulář" }).uncheck();
  await expect(page.locator(".calculator-shell--focus")).toHaveCount(0);
  await expect(input).toHaveValue(value);

  await openDisplaySettings(page);
  await panel().getByRole("checkbox", { name: "Fokus na formulář" }).check();
  await expect(page.locator(".calculator-shell--focus")).toBeVisible();
  await openDisplaySettings(page);
  await panel().getByRole("radio", { name: "Pohodlné" }).check();
  await expect(input).toHaveValue(value);
  await page.keyboard.press("Escape");
}

test.describe("Basic + Focus – přístup k průvodci", () => {
  for (const module of MODULES) {
    test(`${module.id}: z prvního kroku se jde na vstupy a zpět, hodnoty přežijí zobrazení`, async ({ page }) => {
      test.setTimeout(90_000);
      await seedModule(page, module, "1", "on");
      await gotoProductView(page, module.id);

      const shell = page.locator(".calculator-shell--basic.calculator-shell--focus");
      await expect(shell).toBeVisible();
      await expect(page.locator(shellStep(module.stepPrefix, 1))).toBeVisible();
      await expect(inputSection(page, module.inputSection)).toBeHidden();
      await expect(page.locator(".page-toc").first()).toBeHidden();

      const nextStep = page.getByRole("button", { name: module.inputStepName });
      const back = wizardNav(page).getByRole("button", { name: "Zpět" });
      await expect(back).toBeDisabled();
      await activateByPointer(nextStep);

      await expect(page.locator(shellStep(module.stepPrefix, 2))).toBeVisible();
      const field = module.input(page);
      await expect(inputSection(page, module.inputSection)).toBeVisible();
      await expectHitTarget(field);
      await field.fill("4");
      await expect(field).toHaveValue("4");

      await activateByKeyboard(back);
      await expect(page.locator(shellStep(module.stepPrefix, 1))).toBeVisible();
      await expect(inputSection(page, module.inputSection)).toBeHidden();

      await activateByKeyboard(nextStep);
      await expect(page.locator(shellStep(module.stepPrefix, 2))).toBeVisible();
      await expect(field).toHaveValue("4");
      await expectValueSurvivesDisplayChanges(page, field, "4");

      await page.reload();
      await expect(page.locator(shellStep(module.stepPrefix, 2))).toBeVisible();
      await expect(page.locator(".calculator-shell--focus")).toBeVisible();
      await expect(module.input(page)).toHaveValue("4");
    });
  }

  test("uložený krok 2 obnoví vstupy i při zapnutém Focus", async ({ page }) => {
    test.setTimeout(90_000);
    for (const module of MODULES) {
      await seedModule(page, module, "2", "on");
      await gotoProductView(page, module.id);
      await expect(page.locator(shellStep(module.stepPrefix, 2))).toBeVisible();
      await expect(inputSection(page, module.inputSection)).toBeVisible();
      await expectHitTarget(wizardNav(page).getByRole("button", { name: "Zpět" }));
      await expectHitTarget(module.input(page));
    }
  });

  test("Basic bez Focus dál otevře vstupy a vrátí se zpět", async ({ page }) => {
    test.setTimeout(90_000);
    for (const module of MODULES) {
      await seedModule(page, module, "1", "off");
      await gotoProductView(page, module.id);
      await expect(page.locator(".calculator-shell--basic")).toBeVisible();
      await expect(page.locator(".calculator-shell--focus")).toHaveCount(0);
      await activateByPointer(page.getByRole("button", { name: module.inputStepName }));
      await expect(inputSection(page, module.inputSection)).toBeVisible();
      await activateByKeyboard(wizardNav(page).getByRole("button", { name: "Zpět" }));
      await expect(page.locator(shellStep(module.stepPrefix, 1))).toBeVisible();
      await expect(inputSection(page, module.inputSection)).toBeHidden();
    }
  });

  test("Expert + Focus nechá vstupy dostupné a schová onboarding", async ({ page }) => {
    test.setTimeout(90_000);
    for (const module of MODULES) {
      await page.addInitScript(
        ({ item, focusKey, coachmarkKey, tourKeys }) => {
          localStorage.setItem(item.viewModeKey, "expert");
          localStorage.setItem(item.wizardKey, "1");
          localStorage.setItem(focusKey, "on");
          localStorage.setItem(coachmarkKey, "1");
          for (const key of tourKeys) localStorage.setItem(key, "1");
        },
        {
          item: { viewModeKey: module.viewModeKey, wizardKey: module.wizardKey },
          focusKey: FOCUS_KEY,
          coachmarkKey: COACHMARK_KEY,
          tourKeys: QUICK_TOUR_KEYS,
        },
      );
      await gotoProductView(page, module.id);
      await expect(page.locator(".calculator-shell--expert.calculator-shell--focus")).toBeVisible();
      await expect(page.locator(".product-basic-wizard, .zs-basic-wizard")).toHaveCount(0);
      await expect(page.locator(".card--onboarding")).toBeHidden();
      await expect(inputSection(page, module.inputSection)).toBeVisible();
      await expect(page.locator(".methodology-strip, .ux-methodology").first()).toBeHidden();
    }
  });

  test("Lite stránky nemají wizard a vstupy zůstávají dostupné", async ({ page }) => {
    await page.addInitScript((focusKey) => {
      localStorage.setItem(focusKey, "on");
    }, FOCUS_KEY);
    for (const path of [PHMAX_PV_LITE_PATH, PHMAX_SD_LITE_PATH, PHMAX_ZS_LITE_PATH]) {
      await page.goto(path);
      await expect(page.locator(".phmax-lite-form")).toBeVisible();
      await expect(page.locator(".product-basic-wizard, .zs-basic-wizard, .product-basic-wizard-active")).toHaveCount(0);
      await expect(page.locator(".phmax-lite-form input, .phmax-lite-form select").first()).toBeVisible();
    }
  });
});
