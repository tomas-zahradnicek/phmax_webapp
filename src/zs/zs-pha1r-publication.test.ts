import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pickBand, PHA_TABLE, PHP_TABLE } from "../phmax-zs-logic";
import { PHMAX_MSMT_METODIKA_BY_ID } from "../phmax-msmt-metodiky";
import { exportCsvLocalized } from "../export-utils";
import { PRODUCT_VIEW_PATH } from "../product-view-paths";
import { PHMAX_DOCUMENT_HEAD } from "../phmax-document-head";
import {
  buildPhmaxHeadHtmlTags,
  listPhmaxPrerenderRoutes,
  listPhmaxSitemapUrls,
} from "../phmax-document-head";
import { KALKULACKY_PHMAX_PATH } from "../phmax-landing-paths";
import { PHMAX_SITE_ORIGIN_FALLBACK } from "../phmax-site-origin";
import { KALKULACKY_PHMAX_SEO_H1 } from "../phmax-landing-paths";
import { getRouteSeoContent } from "../phmax-route-seo-content";
import { renderRouteSeoHtml } from "../render-route-seo-html";
import { parseZsSnapshotAuditTotals } from "../phmax-product-audit";
import { zsOverviewOrientationTotal } from "./zs-pha1r-ui";
import { buildZsShareText } from "./zs-share-text";
import { buildZsSummaryRows } from "./zs-summary-rows";
import { buildZsExtendedCsvRows, ZS_EXPORT_METHODIKA_LABEL, type ZsExportBuildInput } from "./zs-export-build";
import { formatZsAuditPha1rSuffix, ZS_METHODIKA_PAGE_URL, ZS_METHODIKA_VERSION_LABEL } from "./zs-pha1r-publication";
import { EMPTY_PHA1R_SCHOOL_FLAGS, type Pha1rClassRow, type Pha1rSchoolFlags } from "./zs-pha1r";

const openSchool: Pha1rSchoolFlags = { ...EMPTY_PHA1R_SCHOOL_FLAGS };

function row(id: number, grade1Pupils: number, extras: Partial<Pha1rClassRow> = {}): Pha1rClassRow {
  return { id, grade1Pupils, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false, ...extras };
}

function share(totalPha1r: number, eligibleClassCount: number, totalPha = 24) {
  return buildZsShareText({
    modeLabel: "Úplná ZŠ",
    tab: "PHAmax",
    totalPhmax: 100,
    totalPha,
    totalPhp: 12,
    totalPha1r,
    eligiblePha1rClasses: eligibleClassCount,
    warnings: [],
    inputMode: "own",
  });
}

function exportInput(classes: Pha1rClassRow[], flags: Pha1rSchoolFlags = openSchool): ZsExportBuildInput {
  return {
    tab: "pha",
    modeLabel: "Úplná ZŠ",
    exportLabel: "",
    wizardChoice: "",
    dataMode: "own",
    selectedExample: "",
    warnings: [],
    basicType: "full_more_than_2",
    basic1Classes: 0,
    basic1Pupils: 0,
    basic2Classes: 0,
    basic2Pupils: 0,
    incl1Classes: 0,
    incl1Pupils: 0,
    incl2Classes: 0,
    incl2Pupils: 0,
    psychRows: [],
    healthRows: [],
    minorityType: "minority1",
    minority1Classes: 0,
    minority1Pupils: 0,
    minority2Classes: 0,
    minority2Pupils: 0,
    gymRows: [],
    mixedRows: [],
    mixedMethodFirstZsPupils: 0,
    mixedMethodFirstZsClasses: 0,
    mixedMethodFirstSpecialPupils: 0,
    mixedMethodFirstSpecialClasses: 0,
    mixedMethodSecondZsPupils: 0,
    mixedMethodSecondZsClasses: 0,
    mixedMethodSecondSpecialPupils: 0,
    mixedMethodSecondSpecialClasses: 0,
    special1Classes: 0,
    special1Pupils: 0,
    special2Classes: 0,
    special2Pupils: 0,
    specialIIClasses: 0,
    specialIIPupils: 0,
    prepClasses: 0,
    prepChildren: 0,
    prepSpecialClasses: 0,
    prepSpecialChildren: 0,
    p38First: 0,
    p38Second: 0,
    p41First: 0,
    p41Second: 0,
    phpMethodMode: "three_year_avg",
    phpYear1: 0,
    phpYear2: 0,
    phpYear3: 0,
    phpExcludedAbroad: 0,
    phpExcludedForeignSchoolCz: 0,
    phpExcludedIndividual: 0,
    phpExcludedSchool: false,
    phaRows: [{ id: 1, kind: "zs1", classes: 1, pupils: 6 }],
    psychComputedRows: [],
    healthComputedRows: [],
    gymComputedRows: [],
    summaryRows: buildZsSummaryRows({
      basic1Phmax: 0,
      basic2Phmax: 0,
      basicPhmax: 0,
      incl1Phmax: 0,
      incl2Phmax: 0,
      inclPhmax: 0,
      psychPhmax: 0,
      healthPhmax: 0,
      minority1Phmax: 0,
      minority2Phmax: 0,
      minorityPhmax: 0,
      gymPhmax: 0,
      mixedRows: [],
      mixedMethodFirstTotal: 0,
      mixedMethodSecondTotal: 0,
      mixedMethodTotal: 0,
      mixedPhmax: 0,
      special1PhmaxPart: 0,
      special2PhmaxPart: 0,
      specialIIPhmaxPart: 0,
      specialPhmax: 0,
      prepClassPhmax: 0,
      prepSpecialPhmax: 0,
      par38Phmax: 0,
      par41Phmax: 0,
      extrasPhmax: 0,
      totalPhmax: 100,
      totalPha: 24,
      phpBaseValue: 12,
      phpExcludedTotal: 0,
      phpAdjustedValue: 12,
      totalPhp: 12,
      totalPha1r: 0,
      eligiblePha1rClasses: 0,
    }),
    methodikaLabel: ZS_EXPORT_METHODIKA_LABEL,
    pha1rClasses: classes,
    pha1rFlags: flags,
  };
}

function csvOf(classes: Pha1rClassRow[], flags?: Pha1rSchoolFlags) {
  return exportCsvLocalized(buildZsExtendedCsvRows(exportInput(classes, flags)));
}

describe("PHA1Rmax publikace a výstupy", () => {
  it("1. a 10. share a tisk mají samostatný PHA1Rmax", () => {
    const text = share(40, 2);
    expect(text).toContain("Výsledek PHA1Rmax: 40 hodin týdně");
    expect(text).toContain("Asistent pedagoga v 1. ročníku");
    expect(text).toContain("Počet způsobilých tříd: 2");
    expect(text).not.toContain("Z 2 způsobilých tříd");
    expect(text.indexOf("Výsledek PHAmax:")).toBeLessThan(text.indexOf("Výsledek PHA1Rmax:"));
  });

  it("2. share nemění význam řádku PHAmax", () => {
    const text = share(40, 2, 24);
    expect(text).toContain("Výsledek PHmax: 100");
    expect(text).toContain("Výsledek PHAmax: 24");
    expect(text).toContain("Výsledek PHPmax: 12");
    expect(text).not.toContain("Výsledek PHAmax: 64");
  });

  it("3. souhrn obsahuje samostatný PHA1Rmax", () => {
    const rows = buildZsSummaryRows({
      basic1Phmax: 0,
      basic2Phmax: 0,
      basicPhmax: 0,
      incl1Phmax: 0,
      incl2Phmax: 0,
      inclPhmax: 0,
      psychPhmax: 0,
      healthPhmax: 0,
      minority1Phmax: 0,
      minority2Phmax: 0,
      minorityPhmax: 0,
      gymPhmax: 0,
      mixedRows: [],
      mixedMethodFirstTotal: 0,
      mixedMethodSecondTotal: 0,
      mixedMethodTotal: 0,
      mixedPhmax: 0,
      special1PhmaxPart: 0,
      special2PhmaxPart: 0,
      specialIIPhmaxPart: 0,
      specialPhmax: 0,
      prepClassPhmax: 0,
      prepSpecialPhmax: 0,
      par38Phmax: 0,
      par41Phmax: 0,
      extrasPhmax: 0,
      totalPhmax: 10,
      totalPha: 24,
      phpBaseValue: 0,
      phpExcludedTotal: 0,
      phpAdjustedValue: 0,
      totalPhp: 12,
      totalPha1r: 40,
      eligiblePha1rClasses: 2,
    });
    expect(rows).toContainEqual(["Výsledek PHA1Rmax", 40]);
    expect(rows).toContainEqual(["Výsledek PHAmax", 24]);
    expect(rows.find(([label]) => label === "Výsledek PHAmax")?.[1]).toBe(24);
  });

  it("4. CSV i zdroj XLSX obsahují PHA1Rmax", () => {
    const csv = csvOf([row(1, 15)]);
    expect(csv).toContain("PHA1Rmax");
    expect(csv).toContain("Výsledek PHA1Rmax");
    const actions = readFileSync("src/zs/zs-export-actions.ts", "utf8");
    expect(actions).toContain("valueRows: buildZsExtendedCsvRows(input)");
  });

  it("5. nezpůsobilá třída exportuje 0", () => {
    const csv = csvOf([row(1, 14)]);
    expect(csv).toContain('"Výsledek PHA1Rmax";"0"');
    expect(csv).toContain('"PHA1Rmax třída 1 – hodiny";"0"');
  });

  it("6. způsobilé třídy exportují 20 a 40", () => {
    expect(csvOf([row(1, 15)])).toContain('"Výsledek PHA1Rmax";"20"');
    expect(csvOf([row(1, 15), row(2, 16)])).toContain('"Výsledek PHA1Rmax";"40"');
  });

  it("7. § 38 a § 41 jsou ve výstupu", () => {
    const csv = csvOf([row(1, 16, { grade1Par38: 1, grade1Par41: 0 })]);
    expect(csv).toContain('"PHA1Rmax třída 1 – žáci podle § 38";"1"');
    expect(csv).toContain('"PHA1Rmax třída 1 – relevantní žáci";"15"');
    expect(csv).toContain('"PHA1Rmax třída 1 – hodiny";"20"');
    const under = csvOf([row(1, 15, { grade1Par41: 1 })]);
    expect(under).toContain('"PHA1Rmax třída 1 – žáci podle § 41";"1"');
    expect(under).toContain('"PHA1Rmax třída 1 – relevantní žáci";"14"');
    expect(under).toContain('"Výsledek PHA1Rmax";"0"');
  });

  it("8. školní výjimka exportuje 0", () => {
    const csv = csvOf([row(1, 20)], { ...openSchool, schoolAtHealthcareFacility: true });
    expect(csv).toContain('"Výsledek PHA1Rmax";"0"');
    expect(csv).toContain('"PHA1Rmax – škola při zdravotnickém zařízení";"ano"');
    expect(csv).toContain('"PHA1Rmax třída 1 – hodiny";"0"');
  });

  it("9. starý snapshot bez totalPha1r export nesrazí", () => {
    const legacy = exportInput([]);
    delete legacy.pha1rClasses;
    delete legacy.pha1rFlags;
    expect(() => buildZsExtendedCsvRows(legacy)).not.toThrow();
    expect(exportCsvLocalized(buildZsExtendedCsvRows(legacy))).toContain('"Výsledek PHA1Rmax";"0"');
    const totals = parseZsSnapshotAuditTotals({
      _phmaxAuditTotals: { totalPhmax: 10, totalPha: 4, totalPhp: 12, tab: "php" },
    });
    expect(totals?.totalPha).toBe(4);
    expect(totals?.totalPha1r).toBeUndefined();
    expect(formatZsAuditPha1rSuffix(totals?.totalPha1r)).toBe("");
    expect(formatZsAuditPha1rSuffix(40)).toBe("; PHA1Rmax: 40 hodin týdně");
  });

  it("11. a 12. ZŠ texty jsou verze 6 / říjen 2026", () => {
    expect(ZS_METHODIKA_VERSION_LABEL).toBe("verze 6 / říjen 2026");
    expect(ZS_EXPORT_METHODIKA_LABEL).toContain("verze 6");
    expect(ZS_EXPORT_METHODIKA_LABEL).toContain("říjen 2026");
    const publicFiles = [
      "src/zs/ZsHeroHeader.tsx",
      "src/zs/ZsQuickOnboardingGuide.tsx",
      "src/zs/zs-export-build.ts",
      "src/export-metadata.ts",
      "src/phmax-document-head.ts",
      "src/phmax-seo-module-content.ts",
      "src/zs/ZsPha1rSection.tsx",
    ];
    for (const file of publicFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain("verze 5");
      expect(source, file).not.toContain("březen 2026");
    }
  });

  it("13. metodiky MŠ, SŠ a ŠD zůstávají", () => {
    expect(PHMAX_MSMT_METODIKA_BY_ID.pv.versionLabel).toBe("verze 4 (2026)");
    expect(PHMAX_MSMT_METODIKA_BY_ID.pv.downloadUrl).toContain("Metodika_stanoveni_PHmax_pro_MS_2026_v4.pdf");
    expect(PHMAX_MSMT_METODIKA_BY_ID.ss.versionLabel).toBe("verze 3 (2026)");
    expect(PHMAX_MSMT_METODIKA_BY_ID.ss.downloadUrl).toContain("Metodika_vypoctu_PHmax_pro_SS_2026_final_verze_3.docx");
    expect(PHMAX_MSMT_METODIKA_BY_ID.sd.downloadUrl).toContain("msmt.gov.cz/file/50972_1_1/");
  });

  it("14. SEO text ZŠ obsahuje PHA1Rmax a odkaz EDU.CZ", () => {
    const route = getRouteSeoContent("/phmax-zakladni-skola");
    expect(route?.h1).toContain("PHA1Rmax");
    expect(renderRouteSeoHtml(route!).toLowerCase()).toContain("pha1rmax");
    expect(getRouteSeoContent("/phmax-predskolni-vzdelavani")?.h1).not.toContain("PHA1Rmax");
    expect(getRouteSeoContent("/phmax-stredni-skola")?.h1).not.toContain("PHA1Rmax");
    expect(getRouteSeoContent("/phmax-skolni-druzina")?.h1).not.toContain("PHA1Rmax");
    expect(PHMAX_DOCUMENT_HEAD.zs.description).toContain("PHA1Rmax");
    expect(PHMAX_MSMT_METODIKA_BY_ID.zv.versionLabel).toContain("verze 6");
    expect(PHMAX_MSMT_METODIKA_BY_ID.zv.downloadUrl).toBe(ZS_METHODIKA_PAGE_URL);
    expect(ZS_METHODIKA_PAGE_URL).toBe(
      "https://edu.gov.cz/metodicke_materialy/metodiky-stanoveni-phmax-phamax-pha1rmax-a-phpmax/",
    );
  });

  it("15. canonical ZŠ zůstává", () => {
    expect(PRODUCT_VIEW_PATH.zs).toBe("/phmax-zakladni-skola");
    const origin = PHMAX_SITE_ORIGIN_FALLBACK;
    const route = listPhmaxPrerenderRoutes(origin).find((item) => item.pathname === PRODUCT_VIEW_PATH.zs);
    expect(route?.canonicalPath ?? route?.pathname).toBe("/phmax-zakladni-skola");
  });

  it("16. a 18. robots a sitemap se nemění", () => {
    expect(readFileSync("public/robots.txt", "utf8").replace(/\r\n/g, "\n")).toBe(
      "User-agent: *\nAllow: /\n\nSitemap: https://app.reditelskypruvodce.cz/sitemap.xml\n",
    );
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    expect(sitemap).toContain("https://app.reditelskypruvodce.cz/phmax-zakladni-skola");
    expect(sitemap).not.toContain("PHA1Rmax");
    expect(listPhmaxSitemapUrls(PHMAX_SITE_ORIGIN_FALLBACK)).toContain(
      "https://app.reditelskypruvodce.cz/phmax-zakladni-skola",
    );
  });

  it("17. hub BreadcrumbList zůstává jedna položka", () => {
    const origin = PHMAX_SITE_ORIGIN_FALLBACK;
    const route = listPhmaxPrerenderRoutes(origin).find((item) => item.pathname === KALKULACKY_PHMAX_PATH);
    const canonical = new URL(route!.canonicalPath ?? route!.pathname, origin).href;
    const head = buildPhmaxHeadHtmlTags(route!.meta, origin, { canonical, ...route!.head });
    const blocks = [...head.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
      (match) => JSON.parse(match[1]!) as { "@type": string; itemListElement?: { item: string }[] },
    );
    const lists = blocks.filter((block) => block["@type"] === "BreadcrumbList");
    expect(lists).toHaveLength(1);
    expect(lists[0]?.itemListElement).toHaveLength(1);
    expect(lists[0]?.itemListElement?.[0]?.item).toBe(`${origin}${KALKULACKY_PHMAX_PATH}`);
    expect(KALKULACKY_PHMAX_SEO_H1.length).toBeGreaterThan(0);
  });

  it("19. a 20. společný součet a pásma PHmax/PHAmax/PHPmax zůstávají", () => {
    expect(zsOverviewOrientationTotal(10, 20, 30)).toBe(60);
    expect(pickBand(6, PHA_TABLE.zs1).value).toBe(24);
    expect(pickBand(250, PHP_TABLE).value).toBe(12);
  });
});
