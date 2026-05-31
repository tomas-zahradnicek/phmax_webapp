import { ZS_LEGIS_PARAGRAPH_TOOLTIPS } from "../phmax-zs-legislativa";
import type { FormSection } from "../config/calculator-config";

export type ZsWizardChoiceKey =
  | "php_small"
  | "php_deductions"
  | "ph_inclusion"
  | "ph_psych"
  | "ph_health"
  | "ph_mixed"
  | "ph_prep"
  | "ph_gym"
  | "ph_minority";

export const ZS_WIZARD_CHOICE_TITLES: Record<ZsWizardChoiceKey, string> = {
  php_small: "Menší škola – PHPmax se určí podle metodiky z průměrného počtu žáků a příslušných pásem.",
  php_deductions:
    "Žáci, kteří se do PHPmax nezapočítávají (zahraničí, individuální vzdělávání, školy v zahraničí v ČR apod.) – snížení vypočteného základu dle metodiky.",
  ph_inclusion: ZS_LEGIS_PARAGRAPH_TOOLTIPS["zs-16-9"],
  ph_psych:
    "Škola při psychiatrické nemocnici – přepne na režim s tabulkami PHmax pro psychiatrickou školu a načte ukázková data.",
  ph_health:
    "ZŠ při zdravotnickém zařízení (ne psychiatrie) – řádky B11–B13, průměr žáků jako u psychiatrie dle zvoleného režimu.",
  ph_mixed:
    "Smíšené třídy § 16 odst. 9 a ZŠ speciální – tabulky podle převažujícího oboru vzdělání (B9–B10 vs. B26–B28).",
  ph_prep:
    "Přípravná třída základní školy nebo přípravný stupeň ZŠ speciální – samostatné položky PHmax v metodice.",
  ph_gym:
    "Gymnázium – osmileté a čtyřleté obory (B23); načte ukázková data s gym_rows.",
  ph_minority:
    "Menšinová škola – samostatná tabulka PHmax (B17); načte ukázková data s režimem minority.",
};

export const ZS_WIZARD_CHOICE_OPTIONS = [
  { value: "php_small", label: "Menší škola – PHPmax", title: ZS_WIZARD_CHOICE_TITLES.php_small },
  { value: "php_deductions", label: "PHPmax – nezapočítávaní žáci", title: ZS_WIZARD_CHOICE_TITLES.php_deductions },
  { value: "ph_inclusion", label: "Inkluze a § 16/9", title: ZS_WIZARD_CHOICE_TITLES.ph_inclusion },
  { value: "ph_psych", label: "Škola při psychiatrii", title: ZS_WIZARD_CHOICE_TITLES.ph_psych },
  { value: "ph_health", label: "ZŠ při zdravotnickém zařízení", title: ZS_WIZARD_CHOICE_TITLES.ph_health },
  { value: "ph_mixed", label: "Smíšené třídy", title: ZS_WIZARD_CHOICE_TITLES.ph_mixed },
  { value: "ph_prep", label: "Přípravná třída / stupeň ZŠS", title: ZS_WIZARD_CHOICE_TITLES.ph_prep },
  { value: "ph_gym", label: "Gymnázium (B23)", title: ZS_WIZARD_CHOICE_TITLES.ph_gym },
  { value: "ph_minority", label: "Menšinová škola (B17)", title: ZS_WIZARD_CHOICE_TITLES.ph_minority },
] as const;

/** Viditelné výjimkové moduly PHmax pro průvodce (krok Výjimky). */
export function buildZsWizardVisibleExceptionIds(hasSection: (section: FormSection) => boolean): string[] {
  const ids: string[] = [];
  if (hasSection("sec16_first") || hasSection("sec16_second")) ids.push("sec16");
  if (hasSection("special_i_first") || hasSection("special_i_second") || hasSection("special_ii")) {
    ids.push("special");
  }
  if (hasSection("psych_groups")) ids.push("psych");
  if (hasSection("health_groups")) ids.push("health");
  if (hasSection("minority_first")) ids.push("minority");
  if (hasSection("gym_groups")) ids.push("gym");
  if (hasSection("dominant_c_first") || hasSection("dominant_b_first")) ids.push("mixed");
  if (hasSection("prep_class") || hasSection("prep_special") || hasSection("par38") || hasSection("par41")) {
    ids.push("extras");
  }
  return ids;
}
