import { describe, expect, it } from "vitest";
import { MSG_CONFIRM_CLEAR_AFTER_DASHBOARD_EXPORT } from "./phmax-dashboard-export-followup";

describe("phmax-dashboard-export-followup", () => {
  it("má text připomínky po exportu", () => {
    expect(MSG_CONFIRM_CLEAR_AFTER_DASHBOARD_EXPORT).toMatch(/sdíleném počítači/i);
    expect(MSG_CONFIRM_CLEAR_AFTER_DASHBOARD_EXPORT).toMatch(/Smazat nyní/i);
  });
});
