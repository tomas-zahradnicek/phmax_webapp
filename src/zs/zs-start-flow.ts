export function zsWizardOwnsEmptyStart(viewMode: "basic" | "expert", hasData: boolean): boolean {
  return viewMode === "basic" && !hasData;
}
