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

/** Dashboard – otevře modul přes KPI dlaždici (včetně ok stavu). */
export async function openDashboardKpiModule(page: Page, moduleLabel: string): Promise<void> {
  await gotoProductView(page, "dash");
  const tile = page.locator(".dash-kpi-compact__cell").filter({
    has: page.locator(".dash-kpi-compact__label", { hasText: moduleLabel }),
  });
  await expect(tile).toBeVisible();
  await tile.click();
}

/** Dashboard cross-PHmax – potvrzení orientačního exportu před stažením JSON. */
export async function confirmDashboardExportDisclaimer(page: Page): Promise<void> {
  const checkbox = page.getByTestId("dash-export-confirm");
  await expect(checkbox).toBeVisible();
  await checkbox.check();
}

const ZS_NAMED_SNAPSHOTS_LS_KEY = "edu-cz-zs-named-snapshots-v1";

/** Jedna pojmenovaná záloha ZŠ – zobrazí hint porovnání na dashboardu. */
export async function seedZsNamedSnapshot(page: Page): Promise<void> {
  const payload = JSON.stringify({
    items: [
      {
        id: "e2e-zs-named-1",
        name: "E2E záloha",
        savedAt: "2026-01-01T12:00:00.000Z",
        snapshot: {},
      },
    ],
  });
  await page.addInitScript(
    ({ key, json }) => {
      localStorage.setItem(key, json);
    },
    { key: ZS_NAMED_SNAPSHOTS_LS_KEY, json: payload },
  );
}
