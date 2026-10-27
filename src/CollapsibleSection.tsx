import React, { useState } from "react";

type CollapsibleSectionProps = {
  summary: string;
  children: React.ReactNode;
  /** Počáteční stav (kontrolovaný režim nepoužíváme – jen default). */
  defaultOpen?: boolean;
  className?: string;
  level?: "default" | "advanced";
  /** Volitelný počet v závorce v nadpisu (např. řádků auditu). */
  count?: number;
  /** Krok průvodce. Atribut na `<details>` skryje celý ovladač mimo aktivní krok. */
  wizardStep?: number;
  /** Krátký stav v zavřeném souhrnu (už spočtené hodnoty, ne vzorec). */
  statusText?: string;
};

/**
 * Sbalitelná sekce (vrstva 2 UI) – metodika, audit, detail výpočtu.
 */
export function CollapsibleSection({
  summary,
  children,
  defaultOpen = false,
  className = "",
  level = "default",
  count,
  wizardStep,
  statusText,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className={[
        "ux-collapsible",
        level === "advanced" ? "ux-collapsible--advanced" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      open={open}
      data-wizard-step={wizardStep}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="ux-collapsible__summary" aria-expanded={open}>
        <span>
          {summary}
          {count != null && count > 0 ? (
            <span className="ux-collapsible__count" aria-hidden>
              {" "}
              ({count})
            </span>
          ) : null}
        </span>
        {statusText ? <span className="ux-collapsible__status">{statusText}</span> : null}
        <span className="ux-collapsible__chevron" aria-hidden="true" />
      </summary>
      <div className="ux-collapsible__body">{children}</div>
    </details>
  );
}
