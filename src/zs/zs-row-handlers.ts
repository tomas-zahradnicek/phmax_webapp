import type { Dispatch, SetStateAction } from "react";
import { appendGeneratedRow, removeRowById, updateRowById } from "./zs-dynamic-rows";

export function createZsRowHandlers<TRow extends { id: number }, K extends keyof TRow>(
  setRows: Dispatch<SetStateAction<TRow[]>>,
  createEmpty: (id: number) => TRow,
) {
  return {
    add: () => appendGeneratedRow(setRows, createEmpty),
    update: (id: number, key: K, value: string | number) => updateRowById(setRows, id, key, value),
    remove: (id: number) => removeRowById(setRows, id),
  };
}
