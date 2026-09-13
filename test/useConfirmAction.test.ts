import { describe, expect, it } from "vitest";
import { useConfirmAction } from "../composables/useConfirmAction";

describe("useConfirmAction", () => {
  it("tracks confirming/processing ids around a successful action", async () => {
    const { confirmingId, processingId, ask, confirm } = useConfirmAction<string>();

    ask("item-1");
    expect(confirmingId.value).toBe("item-1");

    let resolveAction!: () => void;
    const promise = confirm(
      "item-1",
      () => new Promise<void>((resolve) => { resolveAction = resolve; }),
    );
    expect(processingId.value).toBe("item-1");

    resolveAction();
    await promise;

    expect(processingId.value).toBeNull();
    expect(confirmingId.value).toBeNull();
  });

  it("cancel clears the confirming id without running any action", () => {
    const { confirmingId, ask, cancel } = useConfirmAction<string>();

    ask("item-2");
    cancel();

    expect(confirmingId.value).toBeNull();
  });

  it("resets processing/confirming state even when the action throws", async () => {
    const { processingId, confirmingId, ask, confirm } = useConfirmAction<string>();

    ask("item-3");

    await expect(
      confirm("item-3", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(processingId.value).toBeNull();
    expect(confirmingId.value).toBeNull();
  });
});
