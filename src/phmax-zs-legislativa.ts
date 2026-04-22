import { SS_LEGIS_PARAGRAPH_TOOLTIPS } from "./ss/phmax-ss-legislativa";

/**
 * Tooltipy pro ZŠ kalkulačku: sdílené NV 123 / příloha + specifika ZV (metodika v5).
 */
export const ZS_LEGIS_PARAGRAPH_TOOLTIPS: Record<string, string> = {
  ...SS_LEGIS_PARAGRAPH_TOOLTIPS,
  "zs-16-9":
    "Třídy zřízené podle § 16 odst. 9 školského zákona – zvláštní režim výuky; v metodice ZV samostatné řádky PHmax/PHAmax a smíšené třídy oproti běžné ZŠ.",
  "vyhl48":
    "Vyhláška č. 48/2005 Sb. o základním vzdělávání – RVP ZV / ZŠS jako podklad pro členění oborů a tabulky v metodice PHmax, PHAmax a PHPmax.",
  "nv75":
    "NV č. 75/2005 Sb. – průměrný týdenní rozsah přímé vyučovací a přímé výchovné činnosti učitele (včetně speciálních a § 16 odst. 9 tříd dle příloh).",
  "skolsky-561":
    "Zákon č. 561/2004 Sb., školský zákon – organizace škol, speciální a přípravné třídy, základ pro výjimky, které metodika ne vždy plně automatizuje.",
  "zs-par38":
    "§ 38 školského zákona – vzdělávání žáků se speciálními vzdělávacími potřebami; metodika navyšuje celkové PHmax školy o 0,25 h (1. st.) resp. 0,5 h (2. st.) na žáka, žák se nezapočítává do průměru tříd B1–B28.",
  "zs-par41":
    "§ 41 školského zákona – vzdělávání nadaných žáků; stejné navyšování PHmax jako u § 38 dle metodiky, žák se nezapočítává do průměru tříd B1–B28.",
};

export const ZS_LEGIS_ZAKONY_URL = {
  nv123: "https://www.zakonyprolidi.cz/cs/2018-123",
  vyhl48: "https://www.zakonyprolidi.cz/cs/2005-48",
  nv75: "https://www.zakonyprolidi.cz/cs/2005-75",
  skolsky561: "https://www.zakonyprolidi.cz/cs/2004-561",
} as const;
