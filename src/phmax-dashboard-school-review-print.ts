import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

export type SchoolReviewPrintModuleRow = {
  label: string;
  status: string;
  phmax: string;
};

export type SchoolReviewPrintInput = {
  generatedAt: string;
  appVersion: string;
  scenarioLabel: string;
  crossPhmax: CrossPhmaxSummary;
  modules: SchoolReviewPrintModuleRow[];
  coherenceWarnings: readonly string[];
  disclaimer: string;
};

export function buildSchoolReviewPrintHtml(input: SchoolReviewPrintInput): string {
  const moduleRows = input.modules
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.label)}</td><td>${escapeHtml(m.status)}</td><td>${escapeHtml(m.phmax)}</td></tr>`,
    )
    .join("");
  const warnings =
    input.coherenceWarnings.length > 0
      ? `<ul>${input.coherenceWarnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
      : "<p>Žádná upozornění koherence.</p>";
  const slices = input.crossPhmax.slices
    .map((s) => `<li>${escapeHtml(s.label)}: ${s.phmax ?? "–"} h/týden${s.incomplete ? " (neúplný)" : ""}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <title>Kontrola před jednáním – PHmax</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 1.35rem; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    .muted { color: #555; font-size: 0.9rem; }
    .disclaimer { margin-top: 20px; padding: 12px; border: 1px solid #e5a; background: #fff8f0; }
  </style>
</head>
<body>
  <h1>Kontrola před jednáním (orientační)</h1>
  <p class="muted">Vygenerováno: ${escapeHtml(input.generatedAt)} · PHmax webapp ${escapeHtml(input.appVersion)}</p>
  <p><strong>Scénář:</strong> ${escapeHtml(input.scenarioLabel)}</p>
  <h2>Součet PHmax (PV + ŠD + ZŠ + SŠ)</h2>
  <p><strong>${input.crossPhmax.totalPhmax ?? "–"}</strong> h/týden
    ${input.crossPhmax.hasIncomplete ? " – některé moduly neúplné" : ""}</p>
  <ul>${slices}</ul>
  <h2>Stav modulů</h2>
  <table>
    <thead><tr><th>Modul</th><th>Stav</th><th>PHmax</th></tr></thead>
    <tbody>${moduleRows}</tbody>
  </table>
  <h2>Koherence a varování</h2>
  ${warnings}
  <p class="disclaimer">${escapeHtml(input.disclaimer)}</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openSchoolReviewPrintWindow(html: string): void {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
