import { expect, test } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const PROFILE_KEY = "reditelsky-pruvodce-school-profile-v1";
const CALCULATOR_KEY = "edu-cz-pv-calculator-state";
const SESSION_KEY = "phmax-focus-example-select";
const FOREIGN_LOCAL_KEY = "third-party-full-reset-e2e";
const FOREIGN_SESSION_KEY = "third-party-session-full-reset-e2e";
const RESET_ATTEMPTS_KEY = "third-party-full-reset-attempts-e2e";

async function seedResetData(page: import("@playwright/test").Page) {
  await page.evaluate(
    ({ profileKey, calculatorKey, sessionKey, foreignLocalKey, foreignSessionKey }) => {
      localStorage.setItem(
        profileKey,
        JSON.stringify({
          id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          name: "School A",
          ico: "12345678",
          redIzo: "600000001",
          izo: "000000001",
          schoolType: "Základní škola",
          address: "Testovací 1",
          municipality: "Praha",
          region: "Hlavní město Praha",
          founder: "Město Praha",
          principalName: "Jan Novák",
          website: "",
          email: "skola@example.cz",
          phone: "",
          dataBox: "",
          createdAt: "2026-08-08T10:00:00.000Z",
          updatedAt: "2026-08-08T10:00:00.000Z",
        }),
      );
      localStorage.setItem(calculatorKey, '{"rows":[{"id":"old"}]}');
      localStorage.setItem(foreignLocalKey, "KEEP");
      sessionStorage.setItem(sessionKey, "1");
      sessionStorage.setItem(foreignSessionKey, "KEEP");
    },
    {
      profileKey: PROFILE_KEY,
      calculatorKey: CALCULATOR_KEY,
      sessionKey: SESSION_KEY,
      foreignLocalKey: FOREIGN_LOCAL_KEY,
      foreignSessionKey: FOREIGN_SESSION_KEY,
    },
  );
}

async function openResetDialog(page: import("@playwright/test").Page) {
  const entry = page.getByTestId("dash-full-reset-entry");
  await entry.scrollIntoViewIfNeeded();
  await page.getByTestId("full-reset-open").click();
  await expect(page.getByTestId("full-reset-dialog")).toBeVisible();
}

test.describe("Full Application Reset", () => {
  test("cancel, exact token a success hard reload", async ({ page }) => {
    await gotoProductView(page, "dash");
    await seedResetData(page);
    await openResetDialog(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("full-reset-backup").click();
    await downloadPromise;
    await expect(page.getByTestId("full-reset-backup-status")).toHaveText(
      "Stažení centrální zálohy bylo zahájeno.",
    );

    await page.getByRole("button", { name: "Zrušit" }).click();
    await expect(page.getByTestId("full-reset-dialog")).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), PROFILE_KEY)).not.toBeNull();

    await openResetDialog(page);
    const confirm = page.getByTestId("full-reset-confirm");
    const token = page.getByTestId("full-reset-token");
    await expect(confirm).toBeDisabled();
    await token.fill("smazat");
    await expect(confirm).toBeDisabled();
    await token.fill(" SMAZAT ");
    await expect(confirm).toBeDisabled();
    await token.fill("SMAZAT");
    await expect(confirm).toBeEnabled();

    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      confirm.click(),
    ]);

    const storage = await page.evaluate(
      ({ profileKey, calculatorKey, sessionKey, foreignLocalKey, foreignSessionKey }) => ({
        profile: localStorage.getItem(profileKey),
        calculator: localStorage.getItem(calculatorKey),
        session: sessionStorage.getItem(sessionKey),
        foreignLocal: localStorage.getItem(foreignLocalKey),
        foreignSession: sessionStorage.getItem(foreignSessionKey),
      }),
      {
        profileKey: PROFILE_KEY,
        calculatorKey: CALCULATOR_KEY,
        sessionKey: SESSION_KEY,
        foreignLocalKey: FOREIGN_LOCAL_KEY,
        foreignSessionKey: FOREIGN_SESSION_KEY,
      },
    );

    expect(storage).toEqual({
      profile: null,
      calculator: null,
      session: null,
      foreignLocal: "KEEP",
      foreignSession: "KEEP",
    });
  });

  test("partial backup zobrazí varování nad stejným staženým envelope", async ({ page }) => {
    await gotoProductView(page, "dash");
    await page.evaluate(() => {
      localStorage.setItem("reditelsky-pruvodce-school-profile-v1", "{invalid-json");
      localStorage.setItem("phmax-school-scenario-label", "Zachovaný modul");
    });
    await openResetDialog(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("full-reset-backup").click();
    await downloadPromise;

    await expect(page.getByTestId("full-reset-backup-status")).toHaveText(
      "Stažení centrální zálohy bylo zahájeno, ale některá data se do ní nepodařilo zahrnout.",
    );
  });

  test("partial reset uzamkne dialog a třetí pokus po dvou selháních reloaduje", async ({ page }) => {
    await gotoProductView(page, "dash");
    await seedResetData(page);
    await openResetDialog(page);
    await page.getByTestId("full-reset-token").fill("SMAZAT");

    await page.evaluate(({ failedKey, attemptsKey }) => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Object.defineProperty(window, "__fullResetRemoveAttempts", {
        configurable: true,
        writable: true,
        value: 0,
      });
      Storage.prototype.removeItem = function removeItem(key: string) {
        if (key === failedKey) {
          const state = window as typeof window & {
            __fullResetRemoveAttempts?: number;
          };
          state.__fullResetRemoveAttempts = (state.__fullResetRemoveAttempts ?? 0) + 1;
          localStorage.setItem(attemptsKey, String(state.__fullResetRemoveAttempts));
          if (state.__fullResetRemoveAttempts <= 2) {
            throw new Error("simulated remove failure");
          }
        }
        return originalRemoveItem.call(this, key);
      };
    }, { failedKey: PROFILE_KEY, attemptsKey: RESET_ATTEMPTS_KEY });

    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>(
        '[data-testid="full-reset-confirm"]',
      );
      button?.click();
      button?.click();
    });
    await expect(page.getByTestId("full-reset-error")).toContainText(
      "Část dat již mohla být odstraněna",
    );
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __fullResetRemoveAttempts?: number;
            }
          ).__fullResetRemoveAttempts,
      ),
    ).toBe(1);
    await expect(page.getByRole("button", { name: "Zavřít" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("full-reset-dialog")).toBeVisible();

    await page.locator(".glossary-modal__backdrop").click({ position: { x: 5, y: 5 } });
    await expect(page.getByTestId("full-reset-dialog")).toBeVisible();

    await page.getByTestId("full-reset-retry").click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __fullResetRemoveAttempts?: number;
              }
            ).__fullResetRemoveAttempts,
        ),
      )
      .toBe(2);
    await expect(page.getByTestId("full-reset-error")).toBeVisible();

    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.getByTestId("full-reset-retry").click(),
    ]);
    expect(await page.evaluate((key) => localStorage.getItem(key), PROFILE_KEY)).toBeNull();
    expect(await page.evaluate((key) => localStorage.getItem(key), RESET_ATTEMPTS_KEY)).toBe("3");
  });
});
