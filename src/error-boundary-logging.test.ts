import { describe, expect, it } from "vitest";
import { toSafeErrorBoundaryLogPayload } from "./ErrorBoundary";

describe("ErrorBoundary safe logging", () => {
  it("nevystavuje message ani componentStack", () => {
    const payload = toSafeErrorBoundaryLogPayload(
      Object.assign(new Error("obsah formulare skoly"), { name: "CriticalError" }),
      "ComponentA > ComponentB",
    );

    expect(payload).toEqual({ name: "CriticalError" });
    expect("message" in payload).toBe(false);
    expect("componentStack" in payload).toBe(false);
  });
});
