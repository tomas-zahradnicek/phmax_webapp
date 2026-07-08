import { expect, test } from "@playwright/test";

async function exportCreatesDownload(page: import("@playwright/test").Page, buttonLabel: string, timeoutMs = 2500): Promise<boolean> {
  const downloadPromise = page
    .waitForEvent("download", { timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
  await page.getByRole("button", { name: buttonLabel }).click();
  return downloadPromise;
}

async function waitForSectionFingerprint(
  page: import("@playwright/test").Page,
  sectionId: string,
  predicate: (value: string | undefined) => boolean,
) {
  await page.waitForFunction(
    ({ id }) => {
      const raw = window.localStorage.getItem("vyrocni-zprava-state-v1");
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as {
          report?: { sections?: Array<{ id?: string; generatedInputFingerprint?: string }> };
        };
        const section = parsed.report?.sections?.find((item) => item?.id === id);
        return typeof section?.generatedInputFingerprint === "string";
      } catch {
        return false;
      }
    },
    { id: sectionId },
  );
  const fingerprint = await page.evaluate((id) => {
    const raw = window.localStorage.getItem("vyrocni-zprava-state-v1");
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw) as {
        report?: { sections?: Array<{ id?: string; generatedInputFingerprint?: string }> };
      };
      const section = parsed.report?.sections?.find((item) => item?.id === id);
      return section?.generatedInputFingerprint;
    } catch {
      return undefined;
    }
  }, sectionId);
  expect(predicate(fingerprint)).toBe(true);
}

async function waitForSchoolNamePersist(page: import("@playwright/test").Page, schoolName: string) {
  await page.waitForFunction(
    ({ value }) => {
      const raw = window.localStorage.getItem("reditelsky-pruvodce-school-profile-v1");
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as { name?: string };
        return parsed.name === value;
      } catch {
        return false;
      }
    },
    { value: schoolName },
  );
}

async function fillMinimalSchoolProfile(page: import("@playwright/test").Page) {
  await page.getByRole("textbox", { name: "Název školy", exact: true }).fill("ZŠ Test");
  await page.getByRole("textbox", { name: "IČO", exact: true }).fill("12345678");
  await page.getByRole("textbox", { name: "RED IZO", exact: true }).fill("600000001");
  await page.getByRole("textbox", { name: "IZO", exact: true }).fill("102000001");
  await page.getByRole("textbox", { name: "Sídlo školy", exact: true }).fill("Testovací 1");
  await page.getByRole("textbox", { name: "Obec", exact: true }).fill("Praha");
  await page.getByRole("combobox", { name: "Kraj", exact: true }).selectOption("Hlavní město Praha");
  await page.getByRole("textbox", { name: "Zřizovatel", exact: true }).fill("Městská část");
  await page.getByRole("textbox", { name: "Ředitel školy", exact: true }).fill("Mgr. Test");
  await page.getByRole("textbox", { name: "Web školy", exact: true }).fill("https://test.example");
  await page.getByRole("textbox", { name: "E-mail školy", exact: true }).fill("test@example.cz");
}

async function generateSection01Draft(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /01\s+Základní údaje o škole/i }).click();
  await page.getByRole("button", { name: "Vygenerovat návrh" }).click();
  await expect(page.getByLabel("Návrh kapitoly k revizi a schválení")).toBeVisible();
}

test.describe("Výroční zpráva stale export guard", () => {
  const staleWarning = (page: import("@playwright/test").Page) =>
    page.getByRole("status").filter({ hasText: "Pozor: část textu vznikla podle starší verze údajů" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/vyrocni-zprava");
  });

  test("blokuje export zastaralého textu a po regeneraci export povolí", async ({ page }) => {
    await fillMinimalSchoolProfile(page);
    await generateSection01Draft(page);
    await waitForSectionFingerprint(page, "01", (fingerprint) => typeof fingerprint === "string" && fingerprint.length > 0);

    await page.goto("/vyrocni-zprava/nahled");
    await expect(staleWarning(page)).toHaveCount(0);

    await page.getByRole("link", { name: "Zpět na kapitoly" }).first().click();
    await page.getByRole("textbox", { name: "Název školy", exact: true }).fill("ZŠ Test aktualizace");
    await waitForSchoolNamePersist(page, "ZŠ Test aktualizace");
    await page.goto("/vyrocni-zprava/nahled");
    await expect(staleWarning(page)).toBeVisible();
    await expect(staleWarning(page)).toContainText("01 Základní údaje o škole");

    const blockedDownload = await exportCreatesDownload(page, "Exportovat do Wordu");
    expect(blockedDownload).toBe(false);
    await expect(
      page.getByText("Export je pozastaven: některé kapitoly byly vytvořeny ze starších údajů.").first(),
    ).toBeVisible();

    await page.getByRole("link", { name: "Aktualizovat text" }).click();
    await generateSection01Draft(page);
    await waitForSectionFingerprint(page, "01", (fingerprint) => typeof fingerprint === "string" && fingerprint.length > 0);
    await page.goto("/vyrocni-zprava/nahled");

    await expect(staleWarning(page)).toHaveCount(0);
    const downloadAllowed = await exportCreatesDownload(page, "Exportovat do Wordu", 8000);
    expect(downloadAllowed).toBe(true);
  });

  test("po reloadu zachová current a po změně vstupu přepne na stale", async ({ page }) => {
    await fillMinimalSchoolProfile(page);
    await generateSection01Draft(page);
    await waitForSectionFingerprint(page, "01", (fingerprint) => typeof fingerprint === "string" && fingerprint.length > 0);

    await page.reload();
    await page.goto("/vyrocni-zprava/nahled");
    await expect(staleWarning(page)).toHaveCount(0);

    await page.getByRole("link", { name: "Zpět na kapitoly" }).first().click();
    await page.getByRole("textbox", { name: "Název školy", exact: true }).fill("ZŠ Test aktualizace");
    await waitForSchoolNamePersist(page, "ZŠ Test aktualizace");

    await page.reload();
    await page.goto("/vyrocni-zprava/nahled");
    await expect(staleWarning(page)).toBeVisible();
  });
});
