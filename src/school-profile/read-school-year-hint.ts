/** Školní rok z modulu výroční zprávy (pokud je uložen) – pouze pro zobrazení v kalkulačkách. */
export function readSchoolYearHintFromStorage(): string {
  if (typeof localStorage === "undefined") return "";
  try {
    const raw = localStorage.getItem("vyrocni-zprava-state-v1");
    if (!raw) return "";
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return "";
    const report = (parsed as { report?: { schoolYear?: string } }).report;
    return report?.schoolYear?.trim() ?? "";
  } catch {
    return "";
  }
}
