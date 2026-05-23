import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useModalDialogA11y } from "./modal-dialog-a11y";
import { useMatchMedia } from "./useMatchMedia";

export type HeroExampleSelectOption = {
  value: string;
  label: string;
  title?: string;
};

export type HeroExampleSelectGroup = {
  label: string;
  options: HeroExampleSelectOption[];
};

type HeroExampleSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  groups: HeroExampleSelectGroup[];
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  "aria-labelledby": string;
  "aria-describedby"?: string;
  title?: string;
};

function findSelectedLabel(groups: HeroExampleSelectGroup[], value: string): string {
  if (!value) return "";
  for (const group of groups) {
    const hit = group.options.find((o) => o.value === value);
    if (hit) return hit.label;
  }
  return "";
}

function findSelectedTitle(groups: HeroExampleSelectGroup[], value: string): string | undefined {
  if (!value) return undefined;
  for (const group of groups) {
    const hit = group.options.find((o) => o.value === value);
    if (hit?.title) return hit.title;
  }
  return undefined;
}

type HeroExamplePickerSheetProps = {
  open: boolean;
  onClose: () => void;
  groups: HeroExampleSelectGroup[];
  value: string;
  placeholder: string;
  onPick: (value: string) => void;
  sheetTitleId: string;
  returnFocusRef: React.RefObject<HTMLElement | null>;
};

function HeroExamplePickerSheet({
  open,
  onClose,
  groups,
  value,
  placeholder,
  onPick,
  sheetTitleId,
  returnFocusRef,
}: HeroExamplePickerSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useModalDialogA11y({
    open,
    onClose,
    panelRef,
    returnFocusRef,
  });

  if (!open) return null;

  const pick = (next: string) => {
    onPick(next);
    onClose();
  };

  return createPortal(
    <div className="hero-example-sheet" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="hero-example-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={sheetTitleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hero-example-sheet__head">
          <h3 id={sheetTitleId} className="hero-example-sheet__title">
            {placeholder}
          </h3>
          <button type="button" className="hero-example-sheet__close" onClick={onClose} aria-label="Zavřít výběr">
            ×
          </button>
        </div>
        <div className="hero-example-sheet__body">
          <button
            type="button"
            className={`hero-example-sheet__option${value === "" ? " hero-example-sheet__option--selected" : ""}`}
            onClick={() => pick("")}
          >
            <span className="hero-example-sheet__option-label">{placeholder}</span>
          </button>
          {groups.map((group) => (
            <section key={group.label} className="hero-example-sheet__group" aria-label={group.label}>
              <h4 className="hero-example-sheet__group-title">{group.label}</h4>
              <ul className="hero-example-sheet__list">
                {group.options.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`hero-example-sheet__option${
                        value === option.value ? " hero-example-sheet__option--selected" : ""
                      }`}
                      title={option.title}
                      onClick={() => pick(option.value)}
                    >
                      <span className="hero-example-sheet__option-label">{option.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Výběr ukázkového příkladu – na úzkém displeji kompaktní panel místo systémového seznamu. */
export function HeroExampleSelect({
  id,
  value,
  onChange,
  groups,
  placeholder = "Vyberte ukázkový příklad…",
  className,
  selectClassName = "input",
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  title,
}: HeroExampleSelectProps) {
  const useCompactPicker = useMatchMedia("(max-width: 560px)");
  const [sheetOpen, setSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const sheetTitleId = useId().replace(/:/g, "");

  const selectedLabel = useMemo(() => findSelectedLabel(groups, value), [groups, value]);
  const selectedTitle = useMemo(() => findSelectedTitle(groups, value), [groups, value]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openSheet = useCallback(() => {
    returnFocusRef.current = triggerRef.current;
    setSheetOpen(true);
  }, []);

  if (!useCompactPicker) {
    return (
      <select
        id={id}
        className={[selectClassName, "hero-example-select__native", className].filter(Boolean).join(" ")}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        title={title}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value} title={option.title}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={[selectClassName, "hero-example-select__trigger", className].filter(Boolean).join(" ")}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        title={selectedTitle ?? title}
        onClick={openSheet}
      >
        <span className="hero-example-select__trigger-text">{selectedLabel || placeholder}</span>
      </button>
      <HeroExamplePickerSheet
        open={sheetOpen}
        onClose={closeSheet}
        groups={groups}
        value={value}
        placeholder={placeholder}
        onPick={onChange}
        sheetTitleId={sheetTitleId}
        returnFocusRef={returnFocusRef}
      />
    </>
  );
}

/** Pomocník: položky ze seznamu klíčů a metadat. */
export function heroExampleOptionsFromKeys<K extends string>(
  keys: readonly K[],
  meta: Record<K, { label: string; title: string }>,
): HeroExampleSelectOption[] {
  return keys.map((key) => ({
    value: key,
    label: meta[key].label,
    title: meta[key].title,
  }));
}
