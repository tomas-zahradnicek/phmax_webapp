import { describe, expect, it } from "vitest";
import { appendGeneratedRow, removeRowById, updateRowById } from "./zs-dynamic-rows";

type TestRow = { id: number; label: string };

describe("zs-dynamic-rows", () => {
  it("appendGeneratedRow přidá řádek s id z createRow", () => {
    let rows: TestRow[] = [];
    appendGeneratedRow(
      (next) => {
        rows = typeof next === "function" ? next(rows) : next;
      },
      (id) => ({ id, label: "new" }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.label).toBe("new");
    expect(rows[0]!.id).toBeGreaterThan(0);
  });

  it("updateRowById upraví jen cílený řádek", () => {
    let rows: TestRow[] = [
      { id: 1, label: "a" },
      { id: 2, label: "b" },
    ];
    updateRowById(
      (next) => {
        rows = typeof next === "function" ? next(rows) : next;
      },
      2,
      "label",
      "updated",
    );
    expect(rows).toEqual([
      { id: 1, label: "a" },
      { id: 2, label: "updated" },
    ]);
  });

  it("removeRowById odstraní řádek podle id", () => {
    let rows: TestRow[] = [
      { id: 1, label: "a" },
      { id: 2, label: "b" },
    ];
    removeRowById(
      (next) => {
        rows = typeof next === "function" ? next(rows) : next;
      },
      1,
    );
    expect(rows).toEqual([{ id: 2, label: "b" }]);
  });
});
