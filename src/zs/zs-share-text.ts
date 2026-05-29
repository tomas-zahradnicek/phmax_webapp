import { APP_AUTHOR_CREDIT_LINE } from "../calculator-ui-constants";

export type ZsShareTextInput = {
  modeLabel: string;
  tab: string;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  warnings: readonly string[];
  inputMode: "own" | "example";
  exportLabel?: string;
};

export function buildZsShareText(data: ZsShareTextInput): string {
  const rows = [
    "Shrnutí kalkulačky ZŠ",
    "",
    ...(data.exportLabel?.trim()
      ? [`Označení / škola: ${data.exportLabel.trim()}`, ""]
      : []),
    `Režim: ${data.modeLabel}`,
    `Aktivní modul: ${data.tab}`,
    `Práce s údaji: ${data.inputMode === "example" ? "ukázkový příklad" : "vlastní škola"}`,
    "",
    `Výsledek PHmax: ${data.totalPhmax}`,
    `Výsledek PHAmax: ${data.totalPha}`,
    `Výsledek PHPmax: ${data.totalPhp}`,
  ];
  if (data.warnings.length) {
    rows.push("", "Upozornění:");
    data.warnings.forEach((item) => rows.push(`- ${item}`));
  }
  rows.push("", APP_AUTHOR_CREDIT_LINE);
  return rows.join("\n");
}
