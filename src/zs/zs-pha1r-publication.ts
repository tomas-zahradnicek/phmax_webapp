import { computeZsPha1r, type Pha1rClassRow, type Pha1rSchoolFlags, EMPTY_PHA1R_SCHOOL_FLAGS } from "./zs-pha1r";

/** Veřejné označení verze metodiky ZŠ. */
export const ZS_METHODIKA_VERSION_LABEL = "verze 6 / říjen 2026";

export const ZS_METHODIKA_PAGE_URL =
  "https://edu.gov.cz/metodicke_materialy/metodiky-stanoveni-phmax-phamax-pha1rmax-a-phpmax/";

export const ZS_METHODIKA_PUBLIC_LABEL =
  "Metodika stanovení PHmax, PHAmax, PHA1Rmax a PHPmax pro základní vzdělávání – verze 6, říjen 2026";

export const ZS_PHA1R_PUBLIC_EXPLANATION =
  "PHA1Rmax se stanoví samostatně podle počtu žáků prvního ročníku v jednotlivých třídách. Při alespoň 15 relevantních žácích 1. ročníku v jedné třídě je PHA1Rmax 20 hodin týdně. Do rozhodného počtu se nezapočítávají žáci podle § 38 a § 41.";

export function buildZsPha1rShareLines(totalPha1r: number, eligibleClassCount: number): readonly string[] {
  return [
    `Výsledek PHA1Rmax: ${totalPha1r} hodin týdně`,
    "Asistent pedagoga v 1. ročníku",
    `Počet způsobilých tříd: ${eligibleClassCount}`,
  ];
}

export function buildZsPha1rSummaryRows(
  totalPha1r: number,
  eligibleClassCount: number,
): readonly (readonly [string, number])[] {
  return [
    ["Výsledek PHA1Rmax", totalPha1r],
    ["PHA1Rmax – způsobilé třídy", eligibleClassCount],
  ];
}

function anoNe(value: boolean): "ano" | "ne" {
  return value ? "ano" : "ne";
}

/** Aditivní blok exportu. Chybějící vstupy znamenají 0, ne pád. */
export function buildZsPha1rExportDetailRows(input: {
  classes?: readonly Pha1rClassRow[] | null;
  flags?: Pha1rSchoolFlags | null;
}): [string, string | number][] {
  const classes = input.classes ?? [];
  const flags = input.flags ?? EMPTY_PHA1R_SCHOOL_FLAGS;
  const result = computeZsPha1r({ classes, flags });
  const rows: [string, string | number][] = [
    ["=== PHA1Rmax – asistent pedagoga v 1. ročníku ===", ""],
    ["Výsledek PHA1Rmax", result.totalPha1r],
    ["PHA1Rmax – způsobilé třídy", result.eligibleClassCount],
    ["PHA1Rmax – škola zřízená podle § 16 odst. 9", anoNe(flags.schoolEstablishedSec16_9)],
    ["PHA1Rmax – škola při ústavní nebo ochranné výchově", anoNe(flags.schoolAtInstitutionalOrProtectiveCare)],
    ["PHA1Rmax – škola při zdravotnickém zařízení", anoNe(flags.schoolAtHealthcareFacility)],
  ];
  classes.forEach((row, index) => {
    const computed = result.classes[index];
    const n = index + 1;
    rows.push([`PHA1Rmax třída ${n} – počet žáků 1. ročníku`, row.grade1Pupils]);
    rows.push([`PHA1Rmax třída ${n} – žáci podle § 38`, row.grade1Par38]);
    rows.push([`PHA1Rmax třída ${n} – žáci podle § 41`, row.grade1Par41]);
    rows.push([`PHA1Rmax třída ${n} – relevantní žáci`, computed?.relevantGrade1Pupils ?? 0]);
    rows.push([`PHA1Rmax třída ${n} – třída podle § 16 odst. 9`, anoNe(row.establishedSec16_9)]);
    rows.push([`PHA1Rmax třída ${n} – hodiny`, computed?.hours ?? 0]);
  });
  return rows;
}

/** Narrative auditu. Bez čísla (starý snapshot) se text nezmění a nespadne. */
export function formatZsAuditPha1rSuffix(totalPha1r: number | undefined): string {
  if (typeof totalPha1r !== "number" || !Number.isFinite(totalPha1r)) return "";
  return `; PHA1Rmax: ${totalPha1r} hodin týdně`;
}
