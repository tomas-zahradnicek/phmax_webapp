import { confirmDestructive } from "./confirm-destructive";

/** Po exportu školního scénáře / IS handoff — jen pracovní autosave + label ze souboru. */
export const MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT =
  "Export byl uložen. Na sdíleném počítači doporučujeme smazat právě exportovaná pracovní data kalkulaček (rozpracované autosave modulů a pojmenování scénáře). Named snapshoty, profil školy a výroční zpráva zůstanou. Smazat nyní?";

/**
 * Volitelná připomínka po stažení JSON, který obsahuje `moduleSnapshots` + scenario label.
 * `clearWorkingData` musí mazat jen CLEAR_SCOPE ⊆ data v právě vytvořeném exportu.
 */
export function offerClearWorkingDataAfterSchoolScenarioExport(clearWorkingData: () => void): void {
  if (!confirmDestructive(MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT)) return;
  clearWorkingData();
}
