import { exportCsvLocalized, downloadTextFile } from "../export-utils";
import { BROWSER_ERROR_NEXT_STEP_HINT } from "../calculator-ui-constants";
import { buildZsExtendedCsvRows, buildZsXlsxContextRows, type ZsExportBuildInput } from "./zs-export-build";

export async function runZsExportCsv(
  input: ZsExportBuildInput,
  onNotice: (message: string) => void,
): Promise<void> {
  downloadTextFile("kalkulacka-zs-souhrn.csv", exportCsvLocalized(buildZsExtendedCsvRows(input)), "text/csv;charset=utf-8");
  onNotice("Rozšířený souhrn byl exportován do CSV (vstupy, výstupy, PHAmax a podrobné řádky dle potřeby).");
}

export async function runZsExportXlsx(
  input: ZsExportBuildInput,
  opts: {
    busy: boolean;
    setBusy: (value: boolean) => void;
    onNotice: (message: string) => void;
  },
): Promise<void> {
  if (opts.busy) return;
  opts.setBusy(true);
  try {
    const { downloadCalculatorXlsx } = await import("../export-xlsx");
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    await downloadCalculatorXlsx({
      contextRows: buildZsXlsxContextRows(input),
      valueRows: buildZsExtendedCsvRows(input),
      filename: `kalkulacka-zs-souhrn-${stamp}.xlsx`,
    });
    opts.onNotice("Byl stažen soubor Excel (XLSX): list „Kontext“ a list „Hodnoty“.");
  } catch (error) {
    console.error(error);
    opts.onNotice(`Export do Excelu se nepodařil. ${BROWSER_ERROR_NEXT_STEP_HINT}`);
  } finally {
    opts.setBusy(false);
  }
}
