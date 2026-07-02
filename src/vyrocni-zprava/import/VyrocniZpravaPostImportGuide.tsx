import React from "react";
import { VYROCNI_ZPRAVA_NAHLED_PATH } from "../../calculator-ui-constants";

export type VyrocniZpravaPostImportGuideData = {
  sourceLabel: string;
  setupItems: string[];
  chapterIds: string[];
};

type VyrocniZpravaPostImportGuideProps = {
  guide: VyrocniZpravaPostImportGuideData;
  onDismiss: () => void;
};

function scrollToWorkspace(): void {
  document.getElementById("vyrocni-zprava-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function VyrocniZpravaPostImportGuide({ guide, onDismiss }: VyrocniZpravaPostImportGuideProps) {
  const chaptersLabel =
    guide.chapterIds.length > 0 ? guide.chapterIds.join(", ") : "žádná kapitola (zkontrolujte jen nastavení nahoře)";

  return (
    <div className="vyrocni-zprava-import__preview vyrocni-zprava-import__guide" role="status">
      <h3 className="vyrocni-zprava-detail__block-title">Další postup po {guide.sourceLabel}</h3>
      <p className="muted-text">
        Import uložil pouze vstupní údaje. Text kapitol je potřeba znovu vygenerovat a schválit ručně.
      </p>

      <ol className="vyrocni-zprava-section04-form__list">
        {guide.setupItems.length > 0 ? (
          <li>
            V horní části stránky zkontrolujte: <strong>{guide.setupItems.join(", ")}</strong>.
          </li>
        ) : null}
        <li>
          V levém sloupci <strong>Kapitoly</strong> otevřete dotčené části: <strong>{chaptersLabel}</strong>.
        </li>
        <li>
          U každé kapitoly v pravém panelu postupně:
          <ol className="vyrocni-zprava-section04-form__list">
            <li>
              <strong>Zkontrolovat údaje</strong>
            </li>
            <li>
              <strong>Vygenerovat návrh</strong>
            </li>
            <li>
              (volitelně) upravte text a klikněte na <strong>Uložit úpravy textu</strong>
            </li>
            <li>
              <strong>Označit jako schválené</strong>
            </li>
          </ol>
        </li>
        <li>
          Po dokončení otevřete <strong>Náhled zprávy</strong> a stáhněte DOCX tlačítkem{" "}
          <strong>Exportovat pouze schválené kapitoly do Wordu</strong>.
        </li>
      </ol>

      <div className="vyrocni-zprava-page__actions">
        <button type="button" className="btn primary" onClick={scrollToWorkspace}>
          Přejít na kapitoly
        </button>
        <a className="btn ghost" href={VYROCNI_ZPRAVA_NAHLED_PATH}>
          Náhled zprávy
        </a>
        <button type="button" className="btn ghost" onClick={onDismiss}>
          Skrýt návod
        </button>
      </div>
    </div>
  );
}
