import React from "react";

type CalculatorInputIssueBannerProps = {
  label: string;
  detail?: string;
  onFix?: () => void;
  fixLabel?: string;
};

/** Jednotný banner nahoře – chybějící nebo neúplné vstupy. */
export function CalculatorInputIssueBanner({
  label,
  detail,
  onFix,
  fixLabel = "Přejít k chybě",
}: CalculatorInputIssueBannerProps) {
  return (
    <div className="calculator-input-issue-banner" role="status">
      <div className="calculator-input-issue-banner__text">
        <strong className="calculator-input-issue-banner__label">{label}</strong>
        {detail ? <p className="calculator-input-issue-banner__detail">{detail}</p> : null}
      </div>
      {onFix ? (
        <button type="button" className="btn btn--sm ghost calculator-input-issue-banner__action" onClick={onFix}>
          {fixLabel}
        </button>
      ) : null}
    </div>
  );
}
