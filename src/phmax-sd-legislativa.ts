/** Tooltipy a odkazy – školní družina (vyhl. č. 74/2005 Sb., zájmové vzdělávání). */
export const SD_LEGIS_PARAGRAPH_TOOLTIPS: Record<string, string> = {
  "sd-vyhl74-priloha":
    "Příloha k vyhlášce č. 74/2005 Sb. – souhrnný PHmax školní družiny podle celkového počtu oddělení; hodnoty v aplikaci odpovídají této tabulce (ověřte u konsolidovaného znění).",
  "sd-10-2":
    "§ 10 odst. 2 vyhl. č. 74/2005 Sb. – pokud průměr žáků 1. stupně ZŠ přihlášených k pravidelné denní docházce na oddělení nedosáhne 20, PHmax se krátí poměrem skutečný počet : (počet oddělení × 20).",
  "sd-skolsky-16":
    "Školský zákon § 16 – speciální školy a některé výjimky mění pravidla pro členění oddělení; aplikace předpokládá běžný režim bez těchto specialit.",
  "sd-nv75-nv":
    "Nařízení vlády č. 75/2005 Sb. stanoví rozsah přímé pedagogické činnosti; příloha č. 1 obsahuje mimo jiné tabulky 7.1 a 7.2 (vychovatel / vedoucí vychovatel u školní družiny). Ověřte u konsolidovaného znění.",
  "sd-nv75-7-1":
    "Příloha č. 1, tabulka 7.1 k nařízení vlády č. 75/2005 Sb. – týdenní rozsah PPV u vychovatele školní družiny (dle zákona obvykle pásma v řádu 28 až 30 h; nikoli výpočet mzdového nebo jmenovitého úvazku oproti dotačnímu modelu v aplikaci).",
  "sd-nv75-7-2":
    "Příloha č. 1, tabulka 7.2 k nařízení vlády č. 75/2005 Sb. – vedoucí vychovatel školní družiny dle počtu oddělení; pro velmi malý počet oddělení může tabulka být prázdná nebo rozsah nezahrnovat. Ověřte v aktuálním znění.",
};

export const SD_LEGIS_ZAKONY_URL = {
  vyhl74: "https://www.zakonyprolidi.cz/cs/2005-74",
  skolsky561: "https://www.zakonyprolidi.cz/cs/2004-561",
  /** Nařízení vlády č. 75/2005 Sb. – rozsah přímé pedagogické činnosti (příl. č. 1: vychovatel / vedoucí vychovatel ŠD). Konsolidované znění ověřte u úředního zdroje. */
  nv75_2005: "https://www.zakonyprolidi.cz/cs/2005-75",
} as const;
