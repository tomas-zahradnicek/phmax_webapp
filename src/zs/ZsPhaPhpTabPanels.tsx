import React from "react";
import { ZsOverviewSection } from "./ZsOverviewSection";
import { ZsPha1rSection, type ZsPha1rSectionProps } from "./ZsPha1rSection";
import { ZsPhaTabPanel, type ZsPhaTabPanelProps } from "./ZsPhaTabPanel";
import { ZsPhpTabPanel, type ZsPhpTabPanelProps } from "./ZsPhpTabPanel";

export type ZsPhaPhpTabPanelsProps = {
  tab: "phmax" | "pha" | "php";
  pha: ZsPhaTabPanelProps | null;
  pha1r: ZsPha1rSectionProps | null;
  php: ZsPhpTabPanelProps | null;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  totalPha1r: number;
};

export function ZsPhaPhpTabPanels({
  tab,
  pha,
  pha1r,
  php,
  totalPhmax,
  totalPha,
  totalPhp,
  totalPha1r,
}: ZsPhaPhpTabPanelsProps) {
  return (
    <>
      {tab === "pha" && pha ? <ZsPhaTabPanel {...pha} /> : null}
      {tab === "pha" && pha1r ? <ZsPha1rSection {...pha1r} /> : null}
      {tab === "php" && php ? <ZsPhpTabPanel {...php} /> : null}
      <ZsOverviewSection totalPhmax={totalPhmax} totalPha={totalPha} totalPhp={totalPhp} totalPha1r={totalPha1r} />
    </>
  );
}
