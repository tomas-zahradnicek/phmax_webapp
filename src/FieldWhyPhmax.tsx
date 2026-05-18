import React from "react";

type FieldWhyPhmaxDetailsProps = {
  /** Výchozí: jednotná formulace napříč produkty. */
  summary?: string;
  children: React.ReactNode;
};

/** Skládací orientační text k PHmax – společný vzor vedle řádkového „Proč?“ u SŠ. */
export function FieldWhyPhmaxDetails({
  summary = "Proč tyto vstupy ovlivní PHmax?",
  children,
}: FieldWhyPhmaxDetailsProps) {
  return (
    <details className="subcard muted field-why-phmax ux-semantic--info" style={{ marginTop: 12 }}>
      <summary className="field-why-phmax__summary" style={{ cursor: "pointer", fontWeight: 600 }}>
        {summary}
      </summary>
      <div className="field-why-phmax__body muted-text" style={{ marginTop: 10, lineHeight: 1.55, fontSize: "0.9rem" }}>
        {children}
      </div>
    </details>
  );
}
