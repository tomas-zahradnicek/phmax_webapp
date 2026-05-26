import type { Dispatch, SetStateAction } from "react";

export function appendGeneratedRow<TRow extends { id: number }>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  createRow: (id: number) => TRow,
) {
  setRows((prev) => [...prev, createRow(Date.now())]);
}

/** Stejné volání jako dřív v PhmaxZsPage: key + string | number (union polí řádku). */
export function updateRowById<TRow extends { id: number }>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  id: number,
  key: keyof TRow,
  value: string | number,
) {
  setRows((prev) =>
    prev.map((row) => (row.id === id ? ({ ...row, [key]: value } as TRow) : row)),
  );
}

export function removeRowById<TRow extends { id: number }>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  id: number,
) {
  setRows((prev) => prev.filter((row) => row.id !== id));
}
