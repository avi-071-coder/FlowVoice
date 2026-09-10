import { describe, expect, it } from "vitest";
import { GenerationController } from "./engine";

describe("GenerationController", () => {
  it("invalidates the previous generation when a new instruction arrives", () => {
    const controller = new GenerationController();
    const first = controller.create("session-1", "places.search", "Find restaurants");
    const second = controller.create("session-1", "places.search", "Make them vegetarian");

    expect(first.status).toBe("INVALIDATED");
    expect(second.status).toBe("ACTIVE");
    expect(second.parentGenerationId).toBe(first.id);
  });

  it("rejects late tool results from an invalidated generation", () => {
    const controller = new GenerationController();
    const first = controller.create("session-1", "places.search", "Find restaurants");
    const second = controller.create("session-1", "places.search", "Only open now");

    expect(controller.acceptResult(first.id)).toEqual({ accepted: false, reason: "INVALIDATED_GENERATION" });
    expect(controller.acceptResult(second.id)).toEqual({ accepted: true, reason: "CURRENT_GENERATION" });
  });

  it("never allows an unknown generation to reach the audio boundary", () => {
    const controller = new GenerationController();
    controller.create("session-1", "places.search", "Find restaurants");

    expect(controller.acceptResult(999)).toEqual({ accepted: false, reason: "INVALIDATED_GENERATION" });
  });
});
