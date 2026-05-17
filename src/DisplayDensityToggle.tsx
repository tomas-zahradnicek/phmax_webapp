import React from "react";
import type { DisplayDensity } from "./display-density";

type DisplayDensityToggleProps = {
  density: DisplayDensity;
  onChange: (density: DisplayDensity) => void;
  name?: string;
  className?: string;
};

/** Přepínač komfortní / kompaktní hustoty rozhraní (paddingy, tabulky). */
export function DisplayDensityToggle({
  density,
  onChange,
  name = "display-density",
  className,
}: DisplayDensityToggleProps) {
  return (
    <div className={["display-density-toggle checks", className].filter(Boolean).join(" ")} role="group" aria-label="Hustota rozhraní">
      <label title="Větší mezery a přehlednější karty">
        <input
          type="radio"
          name={name}
          checked={density === "comfortable"}
          onChange={() => onChange("comfortable")}
        />
        Pohodlné
      </label>
      <label title="Menší paddingy a hustší tabulky pro intenzivní práci">
        <input
          type="radio"
          name={name}
          checked={density === "compact"}
          onChange={() => onChange("compact")}
        />
        Kompaktní
      </label>
    </div>
  );
}
