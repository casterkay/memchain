Two-Phase Lifecycle
Phase A: Propagation (Decision Storage)

When a trading decision is made, the system stores it as a pending entry:

The store_decision() method appends a new block with a [pending] tag and the full decision text. memory.py:31-50 This is called at the end of propagate() in TradingAgentsGraph. trading_graph.py:336-340
Phase B: Reflection (Outcome Processing)

On the next run for the same ticker, pending entries are resolved:

The _resolve_pending_entries() method fetches realized returns (raw and alpha vs SPY), generates reflections via the Reflector class, and updates the log in a single atomic batch write. trading_graph.py:229-263 The Reflector uses the quick-thinking LLM to generate 2-4 sentence prose reflections covering directional correctness, thesis performance, and lessons learned. reflection.py:31-53
Context Injection in Portfolio Manager

The Portfolio Manager is the only agent that directly consumes the memory log. During initialization, it calls get_past_context() to retrieve historical performance data. portfolio_manager.py:35-40

The system retrieves two types of context:

    Same-Ticker Context: Last 5 analyses of the current ticker (full decisions and reflections)
    Cross-Ticker Lessons: Last 3 reflections from other tickers (general market wisdom) memory.py:71-96

This context is injected into the Portfolio Manager's prompt as "Lessons from prior decisions and outcomes." portfolio_manager.py:36-40
Entry Structure

A completed entry follows this format:

[2026-01-10 | NVDA | Buy | +5.2% | +1.1% | 5d]  
  
DECISION:  
Rating: Buy  
... (Full Portfolio Manager Output) ...  
  
REFLECTION:  
The decision to buy was correct as data center demand exceeded expectations.  
  
<!-- ENTRY_END -->