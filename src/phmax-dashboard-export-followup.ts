import { confirmDestructive } from "./confirm-destructive";

export const MSG_CONFIRM_CLEAR_AFTER_DASHBOARD_EXPORT =
  "Export byl uložen. Na sdíleném počítači doporučujeme smazat lokální data kalkulaček v tomto prohlížeči. Smazat nyní?";

/** Volitelná připomínka po stažení JSON z dashboardu (bez druhého potvrzení u samotného mazání). */
export function offerClearBrowserDataAfterDashboardExport(clearLocalData: () => void): void {
  if (!confirmDestructive(MSG_CONFIRM_CLEAR_AFTER_DASHBOARD_EXPORT)) return;
  clearLocalData();
}
