export type VyrocniZpravaSeoFaqItem = {
  question: string;
  answer: string;
};

export const VYROCNI_ZPRAVA_SEO_H1 = "Výroční zpráva školy – příprava po kapitolách";

export const VYROCNI_ZPRAVA_SEO_LEAD =
  "Webový nástroj pro přípravu výroční zprávy školy po jednotlivých kapitolách, kontrolu údajů, import podkladů a export dokumentu.";

/** FAQ odpovídající skutečnému chování modulu – stejné texty jako v prerenderu a JSON-LD. */
export const VYROCNI_ZPRAVA_SEO_FAQ: VyrocniZpravaSeoFaqItem[] = [
  {
    question: "Kde se data ukládají?",
    answer:
      "Údaje o výroční zprávě a jednotlivých kapitolách zůstávají v tomto prohlížeči. Aplikace je automaticky neodesílá na server.",
  },
  {
    question: "Lze údaje později upravit?",
    answer:
      "Ano. Každou kapitolu můžete kdykoli doplnit nebo změnit. Průběh přípravy a stav vyplnění vidíte přímo v modulu.",
  },
  {
    question: "Jak vznikne výsledný dokument?",
    answer:
      "Po vyplnění kapitol přejdete do náhledu zprávy a odtud můžete exportovat dokument ve formátu DOCX.",
  },
  {
    question: "Je možné před exportem zobrazit náhled?",
    answer:
      "Ano. Interní náhled zobrazí sestavenou zprávu před exportem, abyste mohli zkontrolovat obsah a úplnost.",
  },
  {
    question: "Lze využít údaje z profilu školy?",
    answer:
      "Ano. Identifikační údaje z profilu školy se použijí v příslušných kapitolách a nemusíte je zadávat znovu.",
  },
];
