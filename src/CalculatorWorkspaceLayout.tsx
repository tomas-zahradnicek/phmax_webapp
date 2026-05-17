import React from "react";

type CalculatorWorkspaceLayoutProps = {
  main: React.ReactNode;
  dock: React.ReactNode;
  dockLabel?: string;
  /** Vstupně náročné moduly (PV, SŠ): širší hlavní sloupec. */
  variant?: "default" | "input-heavy";
};

/**
 * Hlavní obsah vlevo (formuláře, tabulky), kontextový dock vpravo (souhrn, validace, workflow).
 */
export function CalculatorWorkspaceLayout({
  main,
  dock,
  dockLabel = "Živý výsledek výpočtu",
  variant = "default",
}: CalculatorWorkspaceLayoutProps) {
  return (
    <div
      className={`calculator-workspace${variant === "input-heavy" ? " calculator-workspace--input-heavy" : ""}`}
      aria-label="Pracovní plocha kalkulačky"
    >
      <div className="calculator-workspace__main">{main}</div>
      <aside className="calculator-workspace__dock" aria-label={dockLabel}>
        {dock}
      </aside>
    </div>
  );
}
