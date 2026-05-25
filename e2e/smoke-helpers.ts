import type { Page } from "@playwright/test";

/** Vymaže klíče localStorage před načtením stránky (izolovaný smoke stav). */
export async function clearLocalStorageKeys(page: Page, keys: readonly string[]): Promise<void> {
  await page.addInitScript((storageKeys: string[]) => {
    for (const key of storageKeys) localStorage.removeItem(key);
  }, [...keys]);
}

export async function gotoProductView(page: Page, view: string): Promise<void> {
  await page.goto(`/?view=${view}`);
}
