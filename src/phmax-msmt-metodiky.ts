/** Přehled metodik PHmax na MŠMT – reforma financování regionálního školství. */
export const PHMAX_MSMT_METODIKY_HUB_URL =
  "https://msmt.gov.cz/vzdelavani/skolstvi-v-cr/ekonomika-skolstvi/metodiky-k-reforme-financovani-regionalniho-skolstvi";

export type PhmaxMsmtMetodikaId = "zv" | "pv" | "ss" | "sd";

export type PhmaxMsmtMetodikaDoc = {
  id: PhmaxMsmtMetodikaId;
  label: string;
  versionLabel: string;
  downloadUrl: string;
  /** Volitelná vstupní stránka MŠMT (u SŠ). */
  pageUrl?: string;
  format: "pdf" | "docx" | "page";
};

/** Oficiální soubory metodik MŠMT k výpočtu PHmax (2026). */
export const PHMAX_MSMT_METODIKA_BY_ID: Record<PhmaxMsmtMetodikaId, PhmaxMsmtMetodikaDoc> = {
  zv: {
    id: "zv",
    label: "Metodika stanovení PHmax, PHAmax, PHA1Rmax a PHPmax pro základní vzdělávání",
    versionLabel: "verze 6 / říjen 2026",
    pageUrl: "https://edu.gov.cz/metodicke_materialy/metodiky-stanoveni-phmax-phamax-pha1rmax-a-phpmax/",
    downloadUrl: "https://edu.gov.cz/metodicke_materialy/metodiky-stanoveni-phmax-phamax-pha1rmax-a-phpmax/",
    format: "page",
  },
  pv: {
    id: "pv",
    label: "Metodika stanovení PHmax a PHAmax pro předškolní vzdělávání (MŠ)",
    versionLabel: "verze 4 (2026)",
    downloadUrl: "https://msmt.gov.cz/uploads/210/Metodika_stanoveni_PHmax_pro_MS_2026_v4.pdf",
    format: "pdf",
  },
  ss: {
    id: "ss",
    label: "Metodika výpočtu PHmax pro střední vzdělávání (SŠ)",
    versionLabel: "verze 3 (2026)",
    downloadUrl: "https://msmt.gov.cz/uploads/231/Metodika_vypoctu_PHmax_pro_SS_2026_final_verze_3.docx",
    pageUrl:
      "https://msmt.gov.cz/vzdelavani/skolstvi-v-cr/ekonomika-skolstvi/metodika-vypoctu-phmax-pro-ss-2026/",
    format: "docx",
  },
  sd: {
    id: "sd",
    label: "Metodické pokyny k výpočtu PHmax pro školní družinu",
    versionLabel: "MŠMT",
    downloadUrl: "https://msmt.gov.cz/file/50972_1_1/",
    format: "pdf",
  },
};

export function msmtMetodikaDownloadLabel(format: PhmaxMsmtMetodikaDoc["format"]): string {
  if (format === "docx") return "Stáhnout DOCX (MŠMT)";
  if (format === "page") return "Metodická stránka EDU.CZ";
  return "Stáhnout PDF (MŠMT)";
}
