import { createElement, type Dispatch, type SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppWhatsNewProvider } from "../AppWhatsNewContext";
import { AppWhatsNewProvider } from "../AppWhatsNewContext";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhmaxZsLitePage } from "./PhmaxZsLitePage";
import { ZS_LITE_LS_KEY } from "./phmax-zs-lite-snapshot";
import { computeZsLitePhmax } from "./phmax-zs-lite-logic";
import { createZsRowHandlers } from "./zs-row-handlers";
import { EMPTY_PHA1R_SCHOOL_FLAGS, type Pha1rClassRow, type Pha1rSchoolFlags } from "./zs-pha1r";
import { createEmptyPha1rRow } from "./zs-pha1r-ui";
import { presentZsLitePha1r, runZsLiteTransfer, ZS_LITE_PHA1R_NOT_ENTERED } from "./zs-lite-pha1r-result";
import { writeZsLiteHandoffToFullStorage } from "../phmax-lite-handoff";
import { ZS_AUTOSAVE_STORAGE_KEY } from "./zs-form-snapshot";

const flagsOff: Pha1rSchoolFlags = { ...EMPTY_PHA1R_SCHOOL_FLAGS };

function row(id: number, grade1Pupils: number, extra: Partial<Pha1rClassRow> = {}): Pha1rClassRow {
  return {
    id,
    grade1Pupils,
    grade1Par38: 0,
    grade1Par41: 0,
    establishedSec16_9: false,
    ...extra,
  };
}

function installStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
  return store;
}

function liteMarkup(): string {
  return renderToStaticMarkup(
    createElement(
      AppWhatsNewProvider,
      null,
      createElement(PhmaxZsLitePage, {
        productView: "zs",
        setProductView: () => {},
        onOpenFullVersion: () => {},
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ZŠ Lite PHA1Rmax UI", () => {
  it("volitelná sekce je zpočátku prázdná a sbalená", () => {
    installStorage();
    const html = liteMarkup();
    expect(html).toContain("PHA1Rmax – asistent pedagoga v 1. ročníku");
    expect(html).toContain(ZS_LITE_PHA1R_NOT_ENTERED);
    expect(html).not.toContain("PHA1Rmax: 0 hodin týdně");
    expect(html).toContain("Přenést údaje do plné kalkulačky");
    expect(html).toContain("Otevřít plnou kalkulačku bez přenosu");
    expect(html).toContain("V plné kalkulačce na záložce PHAmax.");
    const details = html.match(/<details\b[^>]*>/)?.[0] ?? "";
    expect(details).not.toContain("open");
  });

  it("přidání a odebrání řádku používá stejné handlery jako plná kalkulačka", () => {
    let rows: Pha1rClassRow[] = [];
    const setRows: Dispatch<SetStateAction<Pha1rClassRow[]>> = (update) => {
      rows = typeof update === "function" ? update(rows) : update;
    };
    const handlers = createZsRowHandlers(setRows, createEmptyPha1rRow);
    handlers.add();
    handlers.add();
    expect(rows).toHaveLength(2);
    const firstId = rows[0].id;
    handlers.remove(firstId);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).not.toBe(firstId);
    expect(rows[0]).toMatchObject({ grade1Pupils: 0, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false });
  });

  it("14 relevantních žáků je 0 h a 15 relevantních žáků je 20 h", () => {
    const under = presentZsLitePha1r({ classes: [row(1, 14)], flags: flagsOff });
    expect(under.status).toBe("computed");
    expect(under.headline).toBe("PHA1Rmax: 0 hodin týdně");
    expect(under.detail).toBe("Způsobilé třídy: 0.");
    expect(under.rowLines[0]).toContain("14 relevantních žáků");

    const eligible = presentZsLitePha1r({ classes: [row(1, 15)], flags: flagsOff });
    expect(eligible.headline).toBe("PHA1Rmax: 20 hodin týdně");
    expect(eligible.detail).toBe("Způsobilé třídy: 1.");
    expect(eligible.rowLines[0]).toContain("15 relevantních žáků");
  });

  it("dvě způsobilé třídy jsou 40 h", () => {
    const view = presentZsLitePha1r({ classes: [row(1, 15), row(2, 16)], flags: flagsOff });
    expect(view.headline).toBe("PHA1Rmax: 40 hodin týdně");
    expect(view.detail).toBe("Způsobilé třídy: 2.");
    expect(view.rowLines).toHaveLength(2);
  });

  it("odečty § 38 a § 41 snižují relevantní počet", () => {
    const view = presentZsLitePha1r({
      classes: [row(1, 18, { grade1Par38: 2, grade1Par41: 1 })],
      flags: flagsOff,
    });
    expect(view.headline).toBe("PHA1Rmax: 20 hodin týdně");
    expect(view.rowLines[0]).toContain("15 relevantních žáků");
  });

  it("výluka třídy i školy vysvětlí nulu", () => {
    const classExclusion = presentZsLitePha1r({
      classes: [row(1, 15, { establishedSec16_9: true })],
      flags: flagsOff,
    });
    expect(classExclusion.headline).toBe("PHA1Rmax: 0 hodin týdně");
    expect(classExclusion.detail).toBe("Způsobilé třídy: 0.");
    expect(classExclusion.rowLines[0]).toContain("§ 16 odst. 9");

    const schoolExclusion = presentZsLitePha1r({
      classes: [row(1, 20)],
      flags: {
        schoolEstablishedSec16_9: true,
        schoolAtInstitutionalOrProtectiveCare: true,
        schoolAtHealthcareFacility: true,
      },
    });
    expect(schoolExclusion.status).toBe("excluded");
    expect(schoolExclusion.headline).toBe("PHA1Rmax: 0 hodin týdně");
    expect(schoolExclusion.detail).toContain("§ 16 odst. 9");
    expect(schoolExclusion.detail).toContain("ústavní nebo ochranné výchovy");
    expect(schoolExclusion.detail).toContain("zdravotnickém zařízení");
  });

  it("neplatný vstup neoznačí výsledek jako platný", () => {
    const view = presentZsLitePha1r({
      classes: [row(1, 10, { grade1Par38: 6, grade1Par41: 6 })],
      flags: flagsOff,
    });
    expect(view.status).toBe("invalid");
    expect(view.headline).toBe("PHA1Rmax nelze vyhodnotit.");
    expect(view.headline).not.toContain("hodin týdně");
    expect(view.detail).toContain("§ 38");
  });

  it("starý Lite záznam bez PHA1R zůstane sbalený a bez výpočtu", () => {
    installStorage({
      [ZS_LITE_LS_KEY]: JSON.stringify({
        basicType: "full_more_than_2",
        basic1Classes: 2,
        basic1Pupils: 40,
        basic2Classes: 1,
        basic2Pupils: 20,
        hasSec16: true,
        incl1Classes: 1,
        incl1Pupils: 8,
      }),
    });
    const html = liteMarkup();
    expect(html).toContain(ZS_LITE_PHA1R_NOT_ENTERED);
    const details = html.match(/<details\b[^>]*>/)?.[0] ?? "";
    expect(details).not.toContain("open");
    expect(html).toContain('phmax-lite-result__label">PHmax');
    expect(html).toContain("phmax-lite-result__aside");
    expect(html).toContain("nesčítá se s PHmax");
    expect(html).not.toContain("PHA1Rmax: 20 hodin týdně");
  });

  it("úspěšný přenos naviguje a neúspěšný ne", () => {
    const store = installStorage();
    const previous = JSON.stringify({ marker: "keep" });
    store.set(ZS_AUTOSAVE_STORAGE_KEY, previous);
    let navigated = false;
    let notice = "";
    runZsLiteTransfer(
      writeZsLiteHandoffToFullStorage({
        basicType: "full_more_than_2",
        basic1Classes: 0,
        basic1Pupils: 10,
        basic2Classes: 1,
        basic2Pupils: 10,
        incl1Classes: 0,
        incl1Pupils: 0,
        incl2Classes: 0,
        incl2Pupils: 0,
      }),
      {
        navigate: () => {
          navigated = true;
        },
        notify: (message) => {
          notice = message;
        },
      },
    );
    expect(navigated).toBe(false);
    expect(notice).toContain("nepřenášejí");
    expect(store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe(previous);

    navigated = false;
    notice = "";
    runZsLiteTransfer(
      writeZsLiteHandoffToFullStorage({
        basicType: "full_more_than_2",
        basic1Classes: 2,
        basic1Pupils: 40,
        basic2Classes: 1,
        basic2Pupils: 20,
        incl1Classes: 0,
        incl1Pupils: 0,
        incl2Classes: 0,
        incl2Pupils: 0,
        pha1rClasses: [row(1, 10, { grade1Par38: 6, grade1Par41: 6 })],
      }),
      {
        navigate: () => {
          navigated = true;
        },
        notify: (message) => {
          notice = message;
        },
      },
    );
    expect(navigated).toBe(false);
    expect(notice).toContain("neprovedl");
    expect(store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe(previous);

    runZsLiteTransfer(
      { ok: false, reason: "storage_unavailable" },
      {
        navigate: () => {
          navigated = true;
        },
        notify: (message) => {
          notice = message;
        },
      },
    );
    expect(navigated).toBe(false);
    expect(notice).toContain("nezdařilo");

    navigated = false;
    runZsLiteTransfer(
      writeZsLiteHandoffToFullStorage({
        basicType: "full_more_than_2",
        basic1Classes: 2,
        basic1Pupils: 40,
        basic2Classes: 1,
        basic2Pupils: 20,
        incl1Classes: 0,
        incl1Pupils: 0,
        incl2Classes: 0,
        incl2Pupils: 0,
        pha1rClasses: [row(1, 15)],
      }),
      {
        navigate: () => {
          navigated = true;
        },
        notify: (message) => {
          notice = message;
        },
      },
    );
    expect(navigated).toBe(true);
    const stored = JSON.parse(store.get(ZS_AUTOSAVE_STORAGE_KEY) ?? "{}") as { tab?: string; pha1rClasses?: Pha1rClassRow[] };
    expect(stored.tab).toBe("phmax");
    expect(stored.pha1rClasses).toEqual([row(1, 15)]);
  });

  it("PHmax zůstává oddělený od PHA1Rmax", () => {
    const input = {
      basicType: "full_more_than_2" as const,
      basic1Classes: 2,
      basic1Pupils: 40,
      basic2Classes: 1,
      basic2Pupils: 20,
      incl1Classes: 0,
      incl1Pupils: 0,
      incl2Classes: 0,
      incl2Pupils: 0,
    };
    const phmax = computeZsLitePhmax(input);
    const pha1r = presentZsLitePha1r({ classes: [row(1, 15)], flags: flagsOff });
    expect(phmax.ok).toBe(true);
    if (!phmax.ok) return;
    installStorage({
      [ZS_LITE_LS_KEY]: JSON.stringify({
        ...input,
        hasSec16: false,
        pha1rClasses: [row(1, 15)],
        schoolEstablishedSec16_9: false,
        schoolAtInstitutionalOrProtectiveCare: false,
        schoolAtHealthcareFacility: false,
      }),
    });
    const html = liteMarkup();
    const phmaxText = phmax.phmaxHours.toLocaleString("cs-CZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(html).toContain('phmax-lite-result__hero');
    expect(html).toContain('phmax-lite-result__label">PHmax');
    expect(html).toContain(`${phmaxText} hodin týdně`);
    expect(html).toContain("phmax-lite-result__aside");
    expect(html).toContain(pha1r.headline);
    expect(html).toContain("nesčítá se s PHmax");
    expect(html).not.toContain(
      `${(phmax.phmaxHours + 20).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} hodin týdně`,
    );
    const phmaxAt = html.indexOf("phmax-lite-result__hero");
    const pha1rAt = html.indexOf("phmax-lite-result__aside");
    expect(phmaxAt).toBeGreaterThan(-1);
    expect(pha1rAt).toBeGreaterThan(phmaxAt);
  });

  it("výluka školy zůstane samostatný PHA1Rmax a neplatný vstup nemá hodinový výsledek", () => {
    installStorage({
      [ZS_LITE_LS_KEY]: JSON.stringify({
        basicType: "full_more_than_2",
        basic1Classes: 2,
        basic1Pupils: 40,
        basic2Classes: 1,
        basic2Pupils: 20,
        hasSec16: false,
        incl1Classes: 0,
        incl1Pupils: 0,
        incl2Classes: 0,
        incl2Pupils: 0,
        pha1rClasses: [row(1, 20)],
        schoolEstablishedSec16_9: true,
        schoolAtInstitutionalOrProtectiveCare: false,
        schoolAtHealthcareFacility: false,
      }),
    });
    const excluded = liteMarkup();
    expect(excluded).toContain("PHA1Rmax: 0 hodin týdně");
    expect(excluded).toContain("základní škola zřízená podle § 16 odst. 9");
    expect(excluded).toContain("Přenést údaje do plné kalkulačky");
    expect(excluded).toContain("Otevřít plnou kalkulačku bez přenosu");

    installStorage({
      [ZS_LITE_LS_KEY]: JSON.stringify({
        basicType: "full_more_than_2",
        basic1Classes: 2,
        basic1Pupils: 40,
        basic2Classes: 1,
        basic2Pupils: 20,
        hasSec16: false,
        incl1Classes: 0,
        incl1Pupils: 0,
        incl2Classes: 0,
        incl2Pupils: 0,
        pha1rClasses: [row(1, 10, { grade1Par38: 6, grade1Par41: 6 })],
        schoolEstablishedSec16_9: false,
        schoolAtInstitutionalOrProtectiveCare: false,
        schoolAtHealthcareFacility: false,
      }),
    });
    const invalid = liteMarkup();
    expect(invalid).toContain("PHA1Rmax nelze vyhodnotit.");
    expect(invalid).not.toContain('phmax-lite-result__value">PHA1Rmax nelze vyhodnotit.');
  });
});
