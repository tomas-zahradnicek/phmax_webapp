import React from "react";

export type CalculatorInputIssueItem = {
  label: string;
  onFix?: () => void;
  fixLabel?: string;
};

type CalculatorInputIssueBannerProps = {
  label: string;
  detail?: string;
  items?: readonly CalculatorInputIssueItem[];
  onFix?: () => void;
  fixLabel?: string;
};

/** Jednotný banner nahoře – chybějící nebo neúplné vstupy. */
export function CalculatorInputIssueBanner({
  label,
  detail,
  items,
  onFix,
  fixLabel = "Přejít k chybě",
}: CalculatorInputIssueBannerProps) {
  const issueItems: CalculatorInputIssueItem[] =
    items && items.length > 0
      ? [...items]
      : detail
        ? [{ label: detail, onFix, fixLabel }]
        : [];

  const showPrimaryAction =
    onFix != null && (issueItems.length === 0 || (issueItems.length === 1 && !items));

  return (
    <div className="calculator-input-issue-banner" role="status">
      <div className="calculator-input-issue-banner__text">
        <strong className="calculator-input-issue-banner__label">{label}</strong>
        {issueItems.length === 1 && !items ? (
          <p className="calculator-input-issue-banner__detail">{issueItems[0]!.label}</p>
        ) : issueItems.length > 0 ? (
          <ul className="calculator-input-issue-banner__list">
            {issueItems.map((item, index) => (
              <li key={`${index}-${item.label}`} className="calculator-input-issue-banner__list-item">
                <span>{item.label}</span>
                {item.onFix ? (
                  <button
                    type="button"
                    className="status-link calculator-input-issue-banner__list-action"
                    onClick={item.onFix}
                  >
                    {item.fixLabel ?? fixLabel}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {showPrimaryAction ? (
        <button type="button" className="btn btn--sm ghost calculator-input-issue-banner__action" onClick={onFix}>
          {fixLabel}
        </button>
      ) : onFix && issueItems.length > 1 ? (
        <button type="button" className="btn btn--sm ghost calculator-input-issue-banner__action" onClick={onFix}>
          {fixLabel}
        </button>
      ) : null}
    </div>
  );
}
