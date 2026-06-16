import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PHMAX_MSMT_METODIKA_BY_ID,
  PHMAX_MSMT_METODIKY_HUB_URL,
} from "./phmax-msmt-metodiky";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("MŠMT metodiky PHmax – oficiální odkazy", () => {
  it("obsahuje platné URL ke stažení pro ZV, PV, SŠ a ŠD", () => {
    expect(PHMAX_MSMT_METODIKY_HUB_URL).toContain("metodiky-k-reforme-financovani-regionalniho-skolstvi");
    expect(PHMAX_MSMT_METODIKA_BY_ID.zv.downloadUrl).toContain("Metodika_vypoctu_PHmax_pro_ZV_2026_v5.pdf");
    expect(PHMAX_MSMT_METODIKA_BY_ID.pv.downloadUrl).toContain("Metodika_stanoveni_PHmax_pro_MS_2026_v4.pdf");
    expect(PHMAX_MSMT_METODIKA_BY_ID.ss.downloadUrl).toContain("Metodika_vypoctu_PHmax_pro_SS_2026_final_verze_3.docx");
    expect(PHMAX_MSMT_METODIKA_BY_ID.sd.downloadUrl).toContain("msmt.gov.cz/file/50972_1_1/");
  });

  it("MethodologyStrip a moduly odkazují na stažení metodik", () => {
    const strip = readSource("src/MethodologyStrip.tsx");
    expect(strip).toContain("MsmtMetodikaDownloadLink");
    expect(strip).toContain("PHMAX_MSMT_METODIKY_HUB_URL");
    expect(readSource("src/phmax-pv-legislativa.ts")).toContain("PHMAX_MSMT_METODIKA_BY_ID.pv.downloadUrl");
    expect(readSource("src/ss/phmax-ss-constants.ts")).toContain("PHMAX_MSMT_METODIKA_BY_ID.ss");
  });
});
