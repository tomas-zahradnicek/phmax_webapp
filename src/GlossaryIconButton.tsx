import React, { forwardRef } from "react";

type GlossaryIconButtonProps = {
  onClick: () => void;
  className?: string;
  expanded?: boolean;
};

export const GlossaryIconButton = forwardRef<HTMLButtonElement, GlossaryIconButtonProps>(
  function GlossaryIconButton({ onClick, className, expanded = false }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={["glossary-icon-btn", className].filter(Boolean).join(" ")}
        onClick={onClick}
        title="Otevřít slovníček pojmů"
        aria-label="Otevřít slovníček pojmů"
        aria-haspopup="dialog"
        aria-expanded={expanded}
      >
        <span className="glossary-icon-btn__book" aria-hidden="true">
          📘
        </span>
        <span className="glossary-icon-btn__label">Slovníček</span>
      </button>
    );
  },
);
