import type { Nv75DeputyBankResult } from "../nv75-deputy-bank";

/** Text odůvodnění použitého scénáře §4b pro panel výsledků. */
export function buildNv75RuleExplanation(appliedRule: Nv75DeputyBankResult["appliedRule"]): string {
  switch (appliedRule) {
    case "4b1":
      return "§4b odst. 1: právnická osoba vykonává 1 druh školy/zařízení (příloha č. 2 nebo č. 3).";
    case "4b2a":
      return "§4b odst. 2 písm. a): 1 druh z přílohy č. 2 + 1 druh z přílohy č. 3 => součet obou hodnot.";
    case "4b2b":
      return "§4b odst. 2 písm. b): 1 druh z přílohy č. 2 + více druhů z přílohy č. 3 => součet všech hodnot.";
    case "4b3":
      return "§4b odst. 3: více druhů z přílohy č. 2 => sčítají se jednotky, hodnota se určí podle nejvyššího druhu (mimo ŠD).";
    case "4b4":
      return "§4b odst. 4: více druhů z přílohy č. 3 => součet hodnot všech druhů.";
    case "4b5a":
      return "§4b odst. 5 písm. a): více druhů z přílohy č. 2 + 1 druh z přílohy č. 3.";
    case "4b5b":
      return "§4b odst. 5 písm. b): více druhů z přílohy č. 2 + více druhů z přílohy č. 3.";
    default:
      return "Nebyl rozpoznán použitelný scénář §4b – zkontrolujte vstupy.";
  }
}
