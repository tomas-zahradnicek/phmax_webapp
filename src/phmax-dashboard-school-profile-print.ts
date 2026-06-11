import { CS_HOURS_PER_WEEK_SHORT, formatCsNumberOrDash } from "./cs-format";
import type { DashboardSchoolProfileModel } from "./dashboard/build-dashboard-school-profile";
import { openPrintHtmlWindow, type OpenPrintHtmlResult } from "./phmax-open-print-html";

export type SchoolProfilePrintInput = {
  generatedAt: string;
  appVersion: string;
  profile: DashboardSchoolProfileModel;
  coherenceWarnings: readonly string[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSchoolProfilePrintHtml(input: SchoolProfilePrintInput): string {
  const { profile } = input;
  const moduleRows = profile.moduleChips
    .map(
      (chip) =>
        `<tr><td>${escapeHtml(chip.label)}</td><td>${chip.active ? escapeHtml(chip.phmaxLabel) : "–"}</td><td>${chip.needsAttention ? "Vyžaduje pozornost" : chip.active ? "V pořádku" : "Bez dat"}</td></tr>`,
    )
    .join("");
  const warnings =
    input.coherenceWarnings.length > 0
      ? `<ul>${input.coherenceWarnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
      : "<p>Žádná metodická upozornění k nesouladu výpočtů.</p>";

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <title>Školní profil – PHmax</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; max-width: 720px; }
    h1 { font-size: 1.35rem; margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 14px 0; }
    .summary dt { font-size: 0.82rem; color: #555; margin: 0; }
    .summary dd { margin: 0 0 8px; font-weight: 600; }
    .muted { color: #555; font-size: 0.9rem; }
    .disclaimer { margin-top: 20px; padding: 12px; border: 1px solid #e5a; background: #fff8f0; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Školní profil (orientační)</h1>
  <p class="muted">Vygenerováno: ${escapeHtml(input.generatedAt)} · PHmax webapp ${escapeHtml(input.appVersion)}</p>
  <dl class="summary">
    <div><dt>Scénář</dt><dd>${escapeHtml(profile.scenarioLabel)}</dd></div>
    <div><dt>Celkem PHmax</dt><dd>${escapeHtml(formatCsNumberOrDash(profile.totalPhmax))} ${escapeHtml(CS_HOURS_PER_WEEK_SHORT)}${profile.totalPhmaxIncomplete ? " (neúplné)" : ""}</dd></div>
    <div><dt>Moduly v provozu</dt><dd>${profile.modulesInUse}</dd></div>
    <div><dt>Poslední export</dt><dd>${escapeHtml(profile.lastExportLabel)}</dd></div>
    <div><dt>Pojmenované zálohy</dt><dd>${profile.namedBackupsTotal}</dd></div>
    <div><dt>Stav</dt><dd>${profile.attentionCount > 0 ? `${profile.attentionCount} modul(ů) ke kontrole` : profile.modulesInUse === 0 ? "Začněte výpočtem" : "Bez kritických upozornění"}</dd></div>
  </dl>
  ${profile.lead ? `<p><strong>${escapeHtml(profile.lead)}</strong></p>` : ""}
  <h2>Moduly</h2>
  <table>
    <thead><tr><th>Modul</th><th>PHmax / banka</th><th>Stav</th></tr></thead>
    <tbody>${moduleRows}</tbody>
  </table>
  <h2>Upozornění</h2>
  ${warnings}
  <p class="disclaimer">Orientační výpočet z uložených dat v tomto prohlížeči – neoficiální podklad. NV75 není v součtu PHmax. Nevhodné jako závazný výstup pro zřizovatele.</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

export type OpenSchoolProfilePrintResult = OpenPrintHtmlResult;

export function openSchoolProfilePrintWindow(html: string): OpenSchoolProfilePrintResult {
  return openPrintHtmlWindow(html);
}
