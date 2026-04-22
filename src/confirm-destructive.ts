/** Vrací true, pokud má uživatel akci provést (nativní dialog kvůli jednoduchosti na všech zařízeních). */
export function confirmDestructive(message: string): boolean {
  return window.confirm(message);
}

export const MSG_CONFIRM_CLEAR_BROWSER_STORAGE =
  "Opravdu chcete vymazat uložená data v tomto prohlížeči? Rozpracovaný stav z rychlé zálohy už nepůjde obnovit tímto tlačítkem.";

export const MSG_CONFIRM_RESET_FORM_ALL =
  "Opravdu chcete vymazat všechny údaje ve formuláři této kalkulačky? Akci nelze vrátit.";

export function msgConfirmDeleteNamedBackup(backupName: string): string {
  return `Opravdu chcete smazat zálohu „${backupName}“? Tuto akci nelze vrátit.`;
}

export const MSG_CONFIRM_ZS_RESET_ALL =
  "Opravdu chcete vymazat všechny údaje ve všech záložkách (PHmax, PHAmax, PHPmax a související režimy)? Akci nelze vrátit.";

export const MSG_CONFIRM_ZS_RESET_PHMAX =
  "Opravdu chcete vymazat všechny údaje v záložce PHmax (včetně specialit a gymnázií)? Akci nelze vrátit.";

export const MSG_CONFIRM_ZS_RESET_PHA =
  "Opravdu chcete vymazat všechny údaje v záložce PHAmax (asistenti pedagoga)? Akci nelze vrátit.";

export const MSG_CONFIRM_ZS_RESET_PHP =
  "Opravdu chcete vymazat všechny údaje v záložce PHPmax? Akci nelze vrátit.";
