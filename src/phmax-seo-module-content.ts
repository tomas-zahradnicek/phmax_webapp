import type { ProductViewCode } from "./calculator-ui-constants";

export type PhmaxSeoFaqItem = {
  question: string;
  answer: string;
};

export type PhmaxSeoRelatedLink = {
  view: ProductViewCode;
  label: string;
  teaser: string;
};

export type PhmaxModuleSeoContent = {
  howItWorksTitle: string;
  howItWorksParagraphs: readonly string[];
  whenToUseTitle: string;
  whenToUseParagraphs: readonly string[];
  faq: readonly PhmaxSeoFaqItem[];
  related: readonly PhmaxSeoRelatedLink[];
  methodologyNote: string;
};

export const PHMAX_SEO_MODULE_CONTENT: Record<ProductViewCode, PhmaxModuleSeoContent> = {
  dash: {
    howItWorksTitle: "Jak funguje ředitelský přehled",
    howItWorksParagraphs: [
      "Přehled načítá uložený stav kalkulaček v tomto prohlížeči (autosave). U každého modulu vidíte hlavní metriku, stav vstupů a případná upozornění.",
      "Orientační součet PHmax slučuje moduly PV, ŠD, ZŠ a SŠ, které mají dopočtený výsledek. Banka odpočtů NV75 a některá krácení v metodice v tomto součtu nejsou.",
      "Jde o pomocný nástroj pro řízení školy – výsledky před jednáním ověřte v příslušných modulech a v metodice MŠMT.",
    ],
    whenToUseTitle: "Kdy použít přehled",
    whenToUseParagraphs: [
      "Na začátku práce: zjistíte, které moduly jsou vyplněné a zda něco vyžaduje opravu vstupů.",
      "Před jednáním o úvazcích nebo scénáři: rychlý souhrn PHmax a poslední práce v modulu.",
    ],
    faq: [
      {
        question: "Proč se liší součet a modul ZŠ?",
        answer:
          "Cross-součet bere autosave z více modulů. Pokud audit v modulu hlásí nesoulad nebo neúplný výpočet, součet může být podhodnocený – otevřete modul a opravte vstupy.",
      },
      {
        question: "Ukládá se stav na server?",
        answer:
          "Ne – data zůstávají v tomto prohlížeči. Pro přenos mezi zařízeními použijte export/import v pokročilých nástrojích (role IT).",
      },
      {
        question: "Je výsledek oficiální?",
        answer:
          "Ne. Jde o orientační výpočet podle metodiky v aplikaci pro kontrolu scénářů, ne o vydaný úřední dokument.",
      },
    ],
    related: [
      { view: "pv", label: "PHmax PV", teaser: "Mateřská škola a předškolní vzdělávání." },
      { view: "sd", label: "PHmax ŠD", teaser: "Školní družina a její účastníci." },
      { view: "zs", label: "PHmax ZŠ", teaser: "Základní škola – PHmax, PHAmax, PHPmax." },
      { view: "ss", label: "PHmax SŠ", teaser: "Střední škola podle oborů a tříd." },
      { view: "nv75", label: "NV75", teaser: "Banka odpočtů zástupců ředitele." },
    ],
    methodologyNote: "Metodické podklady a vyhlášky jsou v jednotlivých modulech v sekci legislativy a nápovědy.",
  },
  pv: {
    howItWorksTitle: "Jak funguje výpočet PHmax pro předškolní vzdělávání",
    howItWorksParagraphs: [
      "Zadáváte pracoviště (provoz), počet tříd nebo skupin, průměrnou týdenní dotaci a další parametry podle metodiky. Aplikace dopočítá orientační PHmax v hodinách týdně.",
      "Výpočet probíhá průběžně při úpravě vstupů; stav se ukládá v prohlížeči. Můžete začít u ukázkového příkladu a upravit ho na vlastní školu.",
      "Krácení při výjimkách z nejnižšího počtu dětí (§ 1d odst. 3) v této verzi neřešíme – nutno dopočítat podle vyhlášky mimo kalkulačku.",
    ],
    whenToUseTitle: "Kdy použít kalkulačku PV",
    whenToUseParagraphs: [
      "Při plánování úvazků v mateřské škole nebo zařízení pro předškolní vzdělávání.",
      "Při porovnání scénářů (celodenní vs. zkrácený provoz, jazykové skupiny apod.).",
    ],
    faq: [
      {
        question: "Jak se počítá PHmax v PV?",
        answer:
          "Podle pravidel v metodice MŠMT pro předškolní vzdělávání – součet z pracovišť a parametrů, které zadáte ve formuláři. Aplikace zobrazuje průběžný souhrn a upozornění na neúplné vstupy.",
      },
      {
        question: "Je výsledek závazný?",
        answer:
          "Ne – jde o orientační pomocný výpočet. Závazný dokument vydává až příslušný proces školy a kontrola podle platných předpisů.",
      },
      {
        question: "Mohu použít ukázku?",
        answer:
          "Ano. Ukázka je volitelná; pole jsou editovatelná a můžete je přepsat údaji vlastní školy.",
      },
      {
        question: "Jak souvisí PV a ZŠ?",
        answer:
          "Jsou to samostatné moduly. Pokud provozujete i základní školu, spočítejte oba moduly a v přehledu školy zkontrolujte orientační součet.",
      },
    ],
    related: [
      { view: "dash", label: "Přehled školy", teaser: "Stav všech modulů a souhrnný PHmax." },
      { view: "zs", label: "PHmax ZŠ", teaser: "Základní škola na stejném pracovišti." },
      { view: "sd", label: "PHmax ŠD", teaser: "Školní družina navázaná na ZŠ." },
    ],
    methodologyNote: "Odkazy na vyhlášku a § jsou v panelu legislativy a v nápovědě u polí ve formuláři.",
  },
  sd: {
    howItWorksTitle: "Jak funguje výpočet PHmax pro školní družinu",
    howItWorksParagraphs: [
      "Zadáte počet účastníků, režim vstupů (souhrnný nebo po odděleních) a parametry oddělení. Kalkulačka dopočítá orientační PHmax podle metodiky pro školní družiny.",
      "Kontrola vstupů upozorní na chybějící údaje nebo prázdná oddělení v detailním režimu. Výsledek se ukládá lokálně v prohlížeči.",
    ],
    whenToUseTitle: "Kdy použít kalkulačku ŠD",
    whenToUseParagraphs: [
      "Při návrhu úvazků vedoucích a dalších pedagogů školní družiny.",
      "Když porovnáváte varianty počtu oddělení nebo účastníků.",
    ],
    faq: [
      {
        question: "Jak se liší souhrnný a detailní režim?",
        answer:
          "Souhrnný režim pracuje s celkovým počtem účastníků. Detailní rozepíše oddělení – vhodné, pokud má družina více oddělení s různým počtem dětí.",
      },
      {
        question: "Počítáte také ZŠ?",
        answer:
          "Školní družina je samostatný modul. Pro základní školu použijte kalkulačku ZŠ; v přehledu školy lze výsledky sloučit orientačně.",
      },
      {
        question: "Je PHmax oficiální?",
        answer:
          "Ne – orientační výpočet pro interní kontrolu scénářů podle metodiky v aplikaci.",
      },
    ],
    related: [
      { view: "zs", label: "PHmax ZŠ", teaser: "Základní škola, ke které družina patří." },
      { view: "dash", label: "Přehled školy", teaser: "Souhrn modulů a upozornění." },
      { view: "pv", label: "PHmax PV", teaser: "Mateřská škola na společném pracovišti." },
    ],
    methodologyNote: "Metodické texty u polí a legislativní odkazy jsou v modulu ŠD v režimu nápovědy a expert panelu.",
  },
  zs: {
    howItWorksTitle: "Jak funguje výpočet PHmax pro základní školu",
    howItWorksParagraphs: [
      "Modul pracuje s třídami základního vzdělávání, výjimkami (psycholog, zdravotní třídy, tělocvik apod.) a volitelně s PHAmax a PHPmax. Výpočet je orientační podle aktuální metodiky v aplikaci.",
      "Zadáváte počty tříd a žáků, parametry výjimek a režim PHPmax. Aplikace průběžně přepočítává souhrn v hodinách týdně a upozorňuje na neúplné sekce.",
      "PHAmax a PHPmax mají vlastní záložky – vhodné při plánování úvazků asistentů pedagoga a dalších rolí podle metodiky.",
    ],
    whenToUseTitle: "Kdy použít kalkulačku ZŠ",
    whenToUseParagraphs: [
      "Při přípravě rozpočtu úvazků, kontrole scénáře školy nebo před jednáním s zřizovatelem.",
      "Když potřebujete porovnat varianty (více tříd, výjimky, jiný režim PHPmax).",
    ],
    faq: [
      {
        question: "Jak se počítá PHmax?",
        answer:
          "Z vámi zadaných tříd a parametrů podle pravidel v metodice MŠMT implementovaných v kalkulačce. Výsledek je souhrn hodin týdně; detaily uvidíte po sekcích formuláře.",
      },
      {
        question: "Co je PHAmax a PHPmax?",
        answer:
          "PHAmax souvisí s asistenty pedagoga a podpůrnými opatřeními dle metodiky. PHPmax pracuje s průměrným počtem žáků ve třídě podle zvoleného režimu (tříletý průměr apod.).",
      },
      {
        question: "Jaký je rozdíl mezi PHmax a PHAmax?",
        answer:
          "PHmax je hlavní pedagogická norma pro organizaci výuky. PHAmax a PHPmax doplňují plánování dalších úvazků – v aplikaci mají samostatné záložky a souhrny.",
      },
      {
        question: "Počítáte také školní družinu?",
        answer:
          "Školní družina má vlastní modul ŠD. Po jeho vyplnění zkontrolujte orientační součet v přehledu školy.",
      },
      {
        question: "Je výsledek garantovaný?",
        answer:
          "Ne. Kalkulačka není oficiální nástroj MŠMT; slouží jako orientační kontrola podle metodiky v aplikaci.",
      },
    ],
    related: [
      { view: "sd", label: "PHmax ŠD", teaser: "Školní družina při ZŠ." },
      { view: "nv75", label: "NV75", teaser: "Po výpočtu odpočtů zástupců ověřte PHmax školy." },
      { view: "dash", label: "Přehled školy", teaser: "Souhrn všech modulů." },
      { view: "pv", label: "PHmax PV", teaser: "Mateřská škola na společném území." },
    ],
    methodologyNote: "Pásma PHAmax/PHPmax a legislativní odkazy jsou v nápovědách u polí a v panelu metodiky.",
  },
  ss: {
    howItWorksTitle: "Jak funguje výpočet PHmax pro střední školu",
    howItWorksParagraphs: [
      "Evidence probíhá po třídách a oborech vzdělávání – zadáváte kódy oborů, počty žáků, režim PHmax a příznaky (např. § 16, umělecké obory).",
      "Kalkulačka dopočítá orientační PHmax podle pravidel pro střední školy v metodice aplikace. Neúplné řádky označí ve výpočtu.",
    ],
    whenToUseTitle: "Kdy použít kalkulačku SŠ",
    whenToUseParagraphs: [
      "Při plánování úvazků na střední škole a kontrole vícero oborů ve třídě.",
      "Při přípravě scénáře s praktickým vyučováním nebo kombinovanými obory.",
    ],
    faq: [
      {
        question: "Jak zadat vícero oborů ve třídě?",
        answer:
          "Použijte sloupce pro hlavní obor a doplňkové kódy podle nápovědy u řádku. Aplikace validuje konzistenci počtů žáků.",
      },
      {
        question: "Je výpočet oficiální?",
        answer:
          "Ne – orientační pomocný výpočet pro kontrolu scénáře; závazný postup je mimo tuto aplikaci.",
      },
      {
        question: "Souvisí SŠ s přehledem školy?",
        answer:
          "Ano – vyplněný modul se započítá do orientačního součtu PHmax v přehledu (bez NV75).",
      },
    ],
    related: [
      { view: "dash", label: "Přehled školy", teaser: "Sloučení modulů školy." },
      { view: "zs", label: "PHmax ZŠ", teaser: "Pokud máte i základní školu v organizaci." },
    ],
    methodologyNote: "Kódy oborů a metodické poznámky jsou v nápovědách u řádků tabulky.",
  },
  nv75: {
    howItWorksTitle: "Jak funguje banka odpočtů zástupců (NV75)",
    howItWorksParagraphs: [
      "Modul eviduje zástupce ředitele a jejich nárok na odpočet podle jednotek (vyšší pásma § 4b apod.). Zadáváte typ pracoviště a počet jednotek.",
      "Výsledek je orientační banka odpočtů – ne náhrada celého výpočtu PHmax školy. Po dokončení ověřte modul ZŠ nebo přehled školy.",
    ],
    whenToUseTitle: "Kdy použít modul NV75",
    whenToUseParagraphs: [
      "Při plánování úvazků zástupců a kontrole, zda odpočty odpovídají metodice.",
      "Po změně počtu zástupců nebo pracovišť (MŠ, ZŠ, SŠ) v organizaci.",
    ],
    faq: [
      {
        question: "Jak se počítá odpočet zástupce?",
        answer:
          "Podle pravidel NV75 v metodice aplikace – z jednotek a typu pracoviště u každého řádku. Upozornění signalizuje chybějící jednotky.",
      },
      {
        question: "Započítává se NV75 do součtu PHmax?",
        answer:
          "Ne – orientační součet PHmax v přehledu školy zahrnuje PV, ŠD, ZŠ a SŠ. NV75 je samostatná banka odpočtů.",
      },
      {
        question: "Po výpočtu co dál?",
        answer:
          "Ověřte PHmax základní školy nebo celkový přehled – odpočty zástupců ovlivňují plánování úvazků, ale nejsou náhradou výpočtu školy.",
      },
    ],
    related: [
      { view: "zs", label: "PHmax ZŠ", teaser: "Ověření PHmax školy po NV75." },
      { view: "dash", label: "Přehled školy", teaser: "Stav modulů na jedné obrazovce." },
      { view: "pv", label: "PHmax PV", teaser: "Zástupce na mateřské škole." },
    ],
    methodologyNote: "Nápovědy k vyššímu pásmu § 4b a jednotkám jsou u příslušných polí v modulu.",
  },
};
