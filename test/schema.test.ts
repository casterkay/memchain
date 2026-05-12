import { describe, expect, it } from "vitest";

import { intentSchema } from "../src/core/schemas.js";

describe("intent schema", () => {
  it("requires explicit economic action intent", () => {
    expect(() =>
      intentSchema.parse({
        schema: "memchain.intent.v1",
        agent_id: "openclaw-demo",
        decision_id: "eth-long-001",
        action: "trade",
        summary: "Considering ETH long",
        symbols: ["ETH"],
        mode: "paper",
        strategy_version: "dual-momentum-v0"
      })
    ).not.toThrow();

    expect(() =>
      intentSchema.parse({
        schema: "memchain.intent.v1",
        agent_id: "openclaw-demo",
        decision_id: "missing-action",
        summary: "No action"
      })
    ).toThrow();
  });
});
