import React from "react";
import { ZsOverviewSection } from "./ZsOverviewSection";
import { ZsPhaTabPanel, type ZsPhaTabPanelProps } from "./ZsPhaTabPanel";
import { ZsPhpTabPanel, type ZsPhpTabPanelProps } from "./ZsPhpTabPanel";

export type ZsPhaPhpTabPanelsProps = {
  tab: "phmax" | "pha" | "php";
  pha: ZsPhaTabPanelProps | null;
  php: ZsPhpTabPanelProps | null;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
};

export function ZsPhaPhpTabPanels({ tab, pha, php, totalPhmax, totalPha, totalPhp }: ZsPhaPhpTabPanelsProps) {
  return (
    <>
      {tab === "pha" && pha ? <ZsPhaTabPanel {...pha} /> : null}
      {tab === "php" && php ? <ZsPhpTabPanel {...php} /> : null}
      <ZsOverviewSection totalPhmax={totalPhmax} totalPha={totalPha} totalPhp={totalPhp} />
    </>
  );
}
