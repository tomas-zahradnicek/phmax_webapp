import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { gotoProductView } from "./smoke-helpers";
import { SCHOOL_PROFILE_LS_KEY } from "../src/school-profile/school-profile-constants";

function seedSchoolProfile(page: import("@playwright/test").Page): Promise<void> {
  const profile = {
    id: "e2e-backup-profile",
    name: "ZŠ Záloha E2E",
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
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-08T10:00:00.000Z",
  };
  return page.addInitScript(
    ({ key, json }) => {
      localStorage.setItem(key, json);
      localStorage.setItem("phmax-school-scenario-label", "E2E záloha scénář");
      localStorage.setItem(
        "vyrocni-zprava-diagnostic-backup-v1:2026-07-08T10:00:00.000Z",
        "{corrupted-diagnostic",
      );
      localStorage.setItem("unknown-e2e-key", JSON.stringify({ shouldNotExport: true }));
    },
    { key: SCHOOL_PROFILE_LS_KEY, json: JSON.stringify(profile) },
  );
}

test.describe("Centrální záloha dat – export", () => {
  test("stáhne JSON zálohu se souhrnem modulů", async ({ page }) => {
    await seedSchoolProfile(page);
    await gotoProductView(page, "dash");

    const card = page.getByTestId("dash-backup-export-card");
    await card.scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Záloha a obnova dat" })).toBeVisible();

    await expect(page.getByTestId("dash-backup-module-school-profile")).toContainText("Obsahuje data");
    await expect(page.getByTestId("dash-backup-module-identity-registry")).toContainText("Bez uložených dat");
    await expect(page.getByTestId("dash-backup-module-phmax-scenario-label")).toContainText("Obsahuje data");
    await expect(page.getByTestId("dash-backup-export-summary")).toContainText(/zahrnuto 2 modul/);

    await expect(page.getByTestId("dash-backup-restore-entry")).toBeVisible();
    await expect(page.getByTestId("restore-open")).toContainText(/Obnovit ze zálohy/i);
    await expect(page.getByRole("button", { name: /importovat/i })).toHaveCount(0);

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("dash-backup-download").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^reditelsky-pruvodce-zaloha-\d{4}-\d{2}-\d{2}\.json$/);

    const raw = fs.readFileSync((await download.path())!, "utf8");
    const json = JSON.parse(raw) as {
      format: string;
      schemaVersion: number;
      exportedAt: string;
      modules: Record<string, { label: string; data: unknown }>;
    };

    expect(json.format).toBe("reditelsky-pruvodce-backup");
    expect(json.schemaVersion).toBe(1);
    expect(typeof json.exportedAt).toBe("string");
    expect(json.modules["school-profile"]?.data).toMatchObject({ name: "ZŠ Záloha E2E" });
    expect(json.modules["phmax-scenario-label"]?.data).toBe("E2E záloha scénář");
    expect(json.modules["identity-registry"]).toBeUndefined();
    expect(Object.keys(json.modules)).not.toContain("app-context");

    expect(raw).not.toContain("vyrocni-zprava-diagnostic-backup-v1:");
    expect(raw).not.toContain("unknown-e2e-key");
    expect(raw).not.toContain("shouldNotExport");

    await expect(page.getByTestId("dash-backup-export-status")).toContainText(/Záloha byla stažena/);
  });
});
