export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsvLocalized(rows: readonly (readonly [string, string | number])[]) {
  const escapeCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const body = rows.map(([label, value]) => [escapeCell(label), escapeCell(value)].join(";")).join("\r\n");
  return "\ufeff" + ["Položka;Hodnota", body].join("\r\n");
}

export function exportFilenameStamped(prefix: string, ext: "csv" | "xlsx" | "json") {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix}-${stamp}.${ext}`;
}
