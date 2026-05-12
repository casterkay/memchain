# Intent Schema

```json
{
  "schema": "memchain.intent.v1",
  "agent_id": "openclaw-demo",
  "decision_id": "eth-long-001",
  "action": "trade",
  "summary": "Considering ETH long after breakout confirmation",
  "symbols": ["ETH"],
  "mode": "paper",
  "strategy_version": "dual-momentum-v0",
  "external_reference": "optional-order-or-task-id"
}
```

`action` must be one of `trade`, `rebalance`, `strategy_update`, `commitment`, `research`, or `memory_block`.

The intent is not an order. It declares why the agent is proving memory now.
