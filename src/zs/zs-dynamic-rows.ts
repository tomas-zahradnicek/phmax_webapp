import type { Dispatch, SetStateAction } from "react";

export function appendGeneratedRow<TRow extends { id: number }>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  createRow: (id: number) => TRow,
) {
  setRows((prev) => [...prev, createRow(Date.now())]);
}

export function updateRowById<TRow extends { id: number }, TKey extends keyof TRow>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  id: number,
  key: TKey,
  value: TRow[TKey],
) {
  setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
}

export function removeRowById<TRow extends { id: number }>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  id: number,
) {
  setRows((prev) => prev.filter((row) => row.id !== id));
}
