import React from "react";
import {
  msmtMetodikaDownloadLabel,
  PHMAX_MSMT_METODIKA_BY_ID,
  type PhmaxMsmtMetodikaId,
} from "./phmax-msmt-metodiky";

type MsmtMetodikaDownloadLinkProps = {
  metodikaId: PhmaxMsmtMetodikaId;
  className?: string;
};

/** Odkaz na oficiální stažení metodiky MŠMT (PDF / DOCX). */
export function MsmtMetodikaDownloadLink({ metodikaId, className = "status-link" }: MsmtMetodikaDownloadLinkProps) {
  const doc = PHMAX_MSMT_METODIKA_BY_ID[metodikaId];
  return (
    <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {msmtMetodikaDownloadLabel(doc.format)}
    </a>
  );
}
