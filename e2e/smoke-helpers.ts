import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Vymaže klíče localStorage před načtením stránky (izolovaný smoke stav). */
export async function clearLocalStorageKeys(page: Page, keys: readonly string[]): Promise<void> {
  await page.addInitScript((storageKeys: string[]) => {
    for (const key of storageKeys) localStorage.removeItem(key);
  }, [...keys]);
}

export async function gotoProductView(page: Page, view: string): Promise<void> {
  await page.goto(`/?view=${view}`);
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

/** Dashboard – otevře modul přes KPI dlaždici (včetně ok stavu). */
export async function openDashboardKpiModule(page: Page, moduleLabel: string): Promise<void> {
  await gotoProductView(page, "dash");
  const tile = page.locator(".dash-kpi-tile").filter({
    has: page.locator(".dash-kpi-tile__module", { hasText: moduleLabel }),
  });
  await expect(tile).toBeVisible();
  await tile.click();
}
