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
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="ux-collapsible__summary">
        {summary}
        {count != null && count > 0 ? (
          <span className="ux-collapsible__count" aria-hidden>
            {" "}
            ({count})
          </span>
        ) : null}
      </summary>
      <div className="ux-collapsible__body">{children}</div>
    </details>
  );
}
