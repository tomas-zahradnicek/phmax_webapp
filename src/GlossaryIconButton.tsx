import React, { forwardRef } from "react";

export const GlossaryIconButton = forwardRef<HTMLButtonElement, { onClick: () => void; className?: string }>(
  function GlossaryIconButton({ onClick, className }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={["glossary-icon-btn", className].filter(Boolean).join(" ")}
        onClick={onClick}
        title="Otevřít slovníček pojmů"
        aria-label="Otevřít slovníček pojmů"
      >
        <span className="glossary-icon-btn__book" aria-hidden="true">
          📘
        </span>
        <span className="glossary-icon-btn__label">Slovníček</span>
      </button>
    );
  },
);
