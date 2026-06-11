import React, { forwardRef } from "react";

type GlossaryIconButtonProps = {
  onClick: () => void;
  className?: string;
  expanded?: boolean;
  /** inline = pilulka, tile = KPI dlaždice, icon = jen ikona v hlavičce. */
  layout?: "inline" | "tile" | "icon";
};

export const GlossaryIconButton = forwardRef<HTMLButtonElement, GlossaryIconButtonProps>(
  function GlossaryIconButton({ onClick, className, expanded = false, layout = "inline" }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={[
          "glossary-icon-btn",
          layout === "tile" ? "glossary-icon-btn--tile" : "",
          layout === "icon" ? "glossary-icon-btn--icon" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
        title="Slovníček"
        aria-label="Otevřít slovníček pojmů"
        aria-haspopup="dialog"
        aria-expanded={expanded}
      >
        <span className="glossary-icon-btn__book" aria-hidden="true">
          📘
        </span>
        {layout === "icon" ? null : <span className="glossary-icon-btn__label">Slovníček</span>}
      </button>
    );
  },
);
