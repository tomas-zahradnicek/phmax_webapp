/** Tooltipy a odkazy – školní družina (vyhl. č. 74/2005 Sb., zájmové vzdělávání). */
export const SD_LEGIS_PARAGRAPH_TOOLTIPS: Record<string, string> = {
  "sd-vyhl74-priloha":
    "Příloha k vyhlášce č. 74/2005 Sb. – souhrnný PHmax školní družiny podle celkového počtu oddělení; hodnoty v aplikaci odpovídají této tabulce (ověřte u konsolidovaného znění).",
  "sd-10-2":
    "§ 10 odst. 2 vyhl. č. 74/2005 Sb. – pokud průměr žáků 1. stupně ZŠ přihlášených k pravidelné denní docházce na oddělení nedosáhne 20, PHmax se krátí poměrem skutečný počet : (počet oddělení × 20).",
  "sd-skolsky-16":
    "Školský zákon § 16 – speciální školy a některé výjimky mění pravidla pro členění oddělení; aplikace předpokládá běžný režim bez těchto specialit.",
};

export const SD_LEGIS_ZAKONY_URL = {
  vyhl74: "https://www.zakonyprolidi.cz/cs/2005-74",
  skolsky561: "https://www.zakonyprolidi.cz/cs/2004-561",
} as const;
