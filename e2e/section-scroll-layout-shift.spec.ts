import { expect, test } from "@playwright/test";

const ZS_STORAGE_KEY = "edu-cz-zs-calculator-state";
const ZS_WIZARD_KEY = "phmax-zs-basic-wizard-step";

test("pozdní posun cíle vrátí sekci do viewportu", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.scrollTo.bind(window);
    let positiveScrolls = 0;
    let scheduled = false;
    window.scrollTo = function scrollToWithLateShift(...args) {
      const result = original(...args);
      let top: number | null = null;
      const first: unknown = args[0];
      if (args.length === 1 && first != null && typeof first === "object" && "top" in first) {
        const value = (first as { top?: unknown }).top;
        if (typeof value === "number") top = value;
      } else if (args.length >= 2 && typeof args[1] === "number") {
        top = args[1];
      }
      if (top != null && top > 0) {
        positiveScrolls += 1;
        if (positiveScrolls === 2 && !scheduled) {
          scheduled = true;
          window.setTimeout(() => {
            const target = document.querySelector('[data-section="basic"]');
            if (!target || document.getElementById("e2e-layout-shift")) return;
            const spacer = document.createElement("div");
            spacer.id = "e2e-layout-shift";
            spacer.setAttribute("data-e2e-layout-shift", "1");
            spacer.style.display = "block";
            spacer.style.height = "900px";
            target.before(spacer);
          }, 50);
        }
      }
      return result;
    };
  });

  await page.addInitScript(
    ({ storageKey, wizardKey }) => {
      localStorage.setItem(wizardKey, "2");
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tab: "phmax",
          basic1Classes: 0,
          basic2Classes: 0,
          incl1Classes: 0,
          incl2Classes: 0,
          psychRows: [],
          healthRows: [],
          gymRows: [],
          mixedRows: [],
          phaRows: [],
          phpYear1: 0,
          phpYear2: 0,
          phpYear3: 0,
          phpMethodMode: "three_year_avg",
        }),
      );
    },
    { storageKey: ZS_STORAGE_KEY, wizardKey: ZS_WIZARD_KEY },
  );

  await page.goto("/phmax-zakladni-skola");
  const section = page.locator('[data-section="basic"]');
  await expect(section).toBeVisible({ timeout: 8000 });
  await page.locator(".calculator-input-issue-banner").getByRole("button", { name: "Přejít k chybě" }).click();
  await expect(page.locator("#e2e-layout-shift")).toHaveCount(1);
  await expect(section).toBeInViewport({ timeout: 8000 });
});
