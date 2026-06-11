import React from "react";

export type LiteModuleId = "pv" | "zs" | "sd";

const LITE_TO_FULL_SCOPE: Record<LiteModuleId, string> = {
  pv: "V plné verzi doplníte více pracovišť, plné § 1d/3, PHAmax a pojmenované scénáře.",
  zs: "V plné verzi doplníte gymnázia, PHAmax, PHPmax, školu při psychiatrické nemocnici a další výjimky metodiky.",
  sd: "V plné verzi doplníte speciální oddělení, detailní režim po odděleních a složitější krácení dle metodiky.",
};

type LiteToFullHintProps = {
  module: LiteModuleId;
  onOpenFull: () => void;
};

/** Sjednocená věta rychlý → plná verze u lite kalkulaček. */
export function LiteToFullHint({ module, onOpenFull }: LiteToFullHintProps) {
  return (
    <p className="muted-text phmax-lite-full-hint">
      {LITE_TO_FULL_SCOPE[module]}{" "}
      <button type="button" className="btn ghost phmax-lite-full-hint__btn" onClick={onOpenFull}>
        Otevřít plnou verzi metodiky
      </button>
    </p>
  );
}
