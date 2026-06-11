import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { ProductView } from "../src/ProductViewPills";
import { PRODUCT_VIEW_PATH } from "../src/product-view-paths";

/** Vymaže klíče localStorage před načtením stránky (izolovaný smoke stav). */
export async function clearLocalStorageKeys(page: Page, keys: readonly string[]): Promise<void> {
  await page.addInitScript((storageKeys: string[]) => {
    for (const key of storageKeys) localStorage.removeItem(key);
  }, [...keys]);
}

export async function gotoProductView(page: Page, view: string): Promise<void> {
  const path = PRODUCT_VIEW_PATH[view as ProductView];
  await page.goto(path ?? `/?view=${view}`);
}

/** Dashboard – otevře modul ze sekce Vyžaduje pozornost (PV, ZŠ, SŠ, …). */
export async function openDashboardAttentionModule(page: Page, moduleLabel: string): Promise<void> {
  await gotoProductView(page, "dash");
  await expect(page.getByRole("heading", { name: "Vyžaduje pozornost" })).toBeVisible();
  const item = page.locator(".dash-attention-card__item").filter({
    has: page.locator("strong", { hasText: moduleLabel }),
  });
  await item.getByRole("button", { name: "Otevřít a přejít k chybě" }).click();
}

/** Dashboard – otevře modul přes čip v školním profilu (včetně ok stavu). */
export async function openDashboardKpiModule(page: Page, moduleLabel: string): Promise<void> {
  await gotoProductView(page, "dash");
  const chip = page.locator(".dash-school-profile__chip").filter({
    has: page.locator(".dash-school-profile__chip-label", { hasText: moduleLabel }),
  });
  await expect(chip).toBeVisible();
  await chip.click();
}

/** Dashboard – otevře modul tlačítkem Otevřít na kartě v sekci Moje kalkulačky. */
export async function openDashboardModuleCard(page: Page, cardTitle: string | RegExp): Promise<void> {
  await gotoProductView(page, "dash");
  await expect(page.getByRole("heading", { name: "Moje kalkulačky" })).toBeVisible();
  const card = page.locator(".dash-card").filter({
    has: page.getByRole("heading", { name: cardTitle }),
  });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Otevřít" }).click();
}

async function openDashboardDetails(page: Page, selector: string): Promise<void> {
  const details = page.locator(selector);
  await details.scrollIntoViewIfNeeded();
  const isOpen = await details.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!isOpen) {
    await details.locator("summary").first().click();
  }
}

async function openDashboardAdvancedTools(page: Page): Promise<void> {
  await openDashboardDetails(page, "#dash-advanced-tools");
}

async function scrollDashboardExportSection(page: Page): Promise<void> {
  await openDashboardAdvancedTools(page);
  await openDashboardDetails(page, ".dash-export-checklist");
}

/** Dashboard cross-PHmax – potvrzení orientačního exportu před stažením JSON. */
export async function confirmDashboardExportDisclaimer(page: Page): Promise<void> {
  await scrollDashboardExportSection(page);
  const checkbox = page.getByTestId("dash-export-confirm");
  await expect(checkbox).toBeVisible();
  await checkbox.check();
}

/** Modul – na úzkém displeji otevře panel akcí před exportem. */
export async function openHeroActionsDrawerIfNeeded(page: Page): Promise<void> {
  const toggle = page.getByRole("button", { name: /Akce, tisk, uložení a export/i });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.getByRole("dialog", { name: /Akce a export/i })).toBeVisible();
  }
}

/** Modul – export CSV (včetně panelu Akce na mobilu). */
export async function clickHeroExportCsv(page: Page): Promise<void> {
  await openHeroActionsDrawerIfNeeded(page);
  const exportBtn = page.getByRole("button", { name: "Export CSV" });
  await exportBtn.scrollIntoViewIfNeeded();
  await exportBtn.click();
}

/** Dashboard – exportní tlačítka v pokročilých nástrojích. */
export async function expectDashboardExportButton(page: Page, name: string | RegExp): Promise<void> {
  await openDashboardAdvancedTools(page);
  const btn = page.getByRole("button", { name });
  await btn.scrollIntoViewIfNeeded();
  await expect(btn).toBeVisible();
}

const ZS_NAMED_SNAPSHOTS_LS_KEY = "edu-cz-zs-named-snapshots-v1";

function buildZsNamedSnapshotsJson(count: number): string {
  const items = Array.from({ length: count }, (_, index) => ({
    id: `e2e-zs-named-${index + 1}`,
    name: index === 0 ? "E2E záloha" : `E2E záloha ${index + 1}`,
    savedAt: "2026-01-01T12:00:00.000Z",
    snapshot: {},
  }));
  return JSON.stringify({ items });
}

/** Pojmenované zálohy ZŠ – karta porovnání na Přehledu se zobrazí od 2 záloh. */
export async function seedZsNamedSnapshot(page: Page, count = 1): Promise<void> {
  const json = buildZsNamedSnapshotsJson(count);
  await page.addInitScript(
    ({ key, json: payload }) => {
      localStorage.setItem(key, payload);
    },
    { key: ZS_NAMED_SNAPSHOTS_LS_KEY, json },
  );
}
