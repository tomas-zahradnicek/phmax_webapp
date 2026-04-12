import React from "react";
import { TABLE_SCROLL_HINT } from "./calculator-ui-constants";

type TableOuterProps = {
  children: React.ReactNode;
  "aria-label": string;
  variant?: "pha";
  className?: string;
};

/**
 * Obal pro široké tabulky ZŠ: horizontální posuv + krátká nápověda na užších displejích.
 */
export function TableOuter({ children, "aria-label": ariaLabel, variant, className }: TableOuterProps) {
  return (
    <div
      className={["table-outer", "table-outer--auto-wide", variant === "pha" ? "table-outer--pha" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label={ariaLabel}
    >
      <p className="table-outer__hint">{TABLE_SCROLL_HINT}</p>
      {children}
    </div>
  );
}
