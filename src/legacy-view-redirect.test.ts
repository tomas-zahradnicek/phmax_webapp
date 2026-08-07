import { describe, expect, it } from "vitest";
import { resolveLegacyViewRedirect, ROOT_REDIRECT_PATH } from "../legacy-view-redirect.mjs";

describe("resolveLegacyViewRedirect", () => {
  it("přesměruje / bez query na landing /kalkulacky-phmax", () => {
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/")).toBe(ROOT_REDIRECT_PATH);
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?utm_source=test")).toBe(
      `${ROOT_REDIRECT_PATH}?utm_source=test`,
    );
  });

  it("ponechá /prehled bez query bez redirectu", () => {
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/prehled")).toBeNull();
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/prehled?utm_source=test")).toBeNull();
  });

  it("legacy ?view= přesměruje přímo na cílový modul (jeden hop)", () => {
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=pv")).toBe(
      "/phmax-predskolni-vzdelavani",
    );
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=sd")).toBe("/phmax-skolni-druzina");
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=zs")).toBe("/phmax-zakladni-skola");
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=ss")).toBe("/phmax-stredni-skola");
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=nv75")).toBe(
      "/banka-odpoctu-zastupcu-reditele",
    );
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=dash")).toBe("/prehled");
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/prehled?view=zs")).toBe(
      "/phmax-zakladni-skola",
    );
  });

  it("neznámý ?view= na / jde na landing, na /prehled bez redirectu", () => {
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/?view=unknown")).toBe(ROOT_REDIRECT_PATH);
    expect(resolveLegacyViewRedirect("https://app.reditelskypruvodce.cz/prehled?view=unknown")).toBeNull();
  });
});
