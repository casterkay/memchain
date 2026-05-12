# MemChain: Onchain Registry for Trading Agent Memories

1. 一句话定位

MemChain 是 AI trading agent 的 Git + IPFS + Monad 记忆证明系统：在每次交易决策前，把 agent 的本地 memory 自动版本化、上链存证，使交易智能体的“过去所知、当时所想、如何决策”可审计、可回放、可验证、可交易。

⸻

2. 核心叙事

AI agent 正在从“工具”变成“经济参与者”。

它们会接任务、调用工具、管理资产、执行交易、参与治理、协作交付，甚至代表用户做出金融决策。但今天大多数 agent 的记忆系统仍然是中心化、本地化、不可验证的。

这带来一个根本问题：

当一个 agent 亏钱、误操作、被攻击、篡改策略、遗忘承诺，或者伪造历史时，我们如何知道它当时到底看到了什么、记住了什么、相信了什么、基于什么做出了决策？

Monad AI Blueprint 已经把 verifiable memory systems 列为 AI 方向之一，目标是让 AI reasoning 可审计、不可篡改。 ￼ Monad 文档对 ERC-8004 的介绍也明确提到，ERC-8004 为 agent identity、reputation、validation 提供链上注册机制，让 AI agents 拥有可携带身份、可验证历史和加密验证能力。 ￼ EIP-8004 的目标是让 agent 可以跨组织发现、选择和交互，而无需预先信任对方。 ￼

MemChain 补上 ERC-8004 之后最关键的一层：不是只证明“这个 agent 是谁、评分如何”，而是证明“这个 agent 在某个时间点到底记得什么”。

⸻

3. Problem

当前 AI trading agent 的信任断层

今天的交易 agent 通常有三类状态：

1. Prompt / strategy：策略、系统提示、风险偏好。
2. Memory：过往交易、市场观察、用户偏好、反思记录、失败经验。
3. Execution log：实际下单、调用工具、交易结果。

Execution log 可以通过交易所 API 或链上交易回溯。
但真正影响决策的 memory 往往不可验证。

这意味着：

* Agent 可以事后改写 memory。
* 项目方无法证明 agent 是否遵守策略。
* 用户无法知道亏损是否来自市场波动、记忆污染、模型幻觉、工具攻击，还是策略被偷偷改过。
* 其他 agent 无法可信复用它的历史经验。
* Reputation 只记录评分，却无法回溯评分对应的真实记忆状态。

没有可验证记忆，就没有可信的 agent reputation。

⸻

4. Insight

市场不缺 trading agent。
市场缺的是 可信 trading agent。

未来 agent economy 的核心资产不是单次交易信号，而是：

一个 agent 在长期交易中形成的、可验证的认知轨迹。

也就是：

* 它曾经如何理解市场？
* 它犯过哪些错？
* 它如何更新策略？
* 它是否遵守风险约束？
* 它的高收益是否来自稳定逻辑，还是偶然赌博？
* 它在某次关键交易前的 memory 状态是否可以被复现？

MemChain 把 agent memory 从“私有缓存”升级为：

可审计的行为证据、可复现的认知快照、可组合的链上数据资产。

⸻

5. Product

MemChain 是什么？

MemChain 是一个本地命令行工具，面向 AI trading agent 开发者和量化团队。

它会监控 agent 的 memories 文件夹，例如：

~/.openclaw/memories

在每次 agent 做交易决策之前，MemChain 自动执行：

git add .
git commit -m "pre-trade memory snapshot"
ipfs add
monad tx commit-memory-root

然后把以下信息记录到 Monad 链上：

* Agent ID
* Git commit hash
* IPFS CID
* Memory root hash
* Strategy version
* Trade intent hash
* Timestamp / block number
* Optional encrypted metadata
* Optional ERC-8004 identity / reputation / validation reference

最终形成一条链上可验证记录：

在某个区块高度、某次交易决策前，这个 agent 的 memory 状态对应某个 Git commit，并可通过 IPFS 取回、通过 hash 验证、通过 Git checkout 回放。

⸻

6. 核心用户体验

开发者安装

npm install -g memchain

初始化 agent memory repo

memchain init ~/.openclaw/memories

绑定 Monad 钱包与 Agent ID

memchain agent register --name "ClawAlpha-01"

在交易前自动快照

memchain pretrade --agent clawalpha-01 --intent trade-intent.json

回溯某次交易前的 memory

memchain checkout 0xabc123...

验证某个 agent 当时是否真的拥有某段 memory

memchain verify --commit 0xabc123 --cid bafy...

出售某段 memory block

memchain list --commit 0xabc123 --price 5 MON

⸻

7. 为什么现在做？

三个趋势正在同时发生。

第一，AI agents 正在金融化。
它们不再只是聊天机器人，而是会管理资金、执行交易、调用 DeFi 合约、参与治理和协作完成任务。

第二，agent identity / reputation 正在标准化。
ERC-8004 已经把 agent identity、reputation、validation 作为核心注册层，用于支持 agent 的可发现、可评估和可验证交互。 ￼

第三，Monad 明确把 verifiable memory systems 作为 AI 基础设施方向之一。 ￼ 这说明市场正在从“让 agent 能行动”，进入“让 agent 的行动可信”的阶段。

MemChain 正好站在三者交叉点：AI trading agent × verifiable memory × on-chain agent reputation。

⸻

8. 产品架构

Layer 1：Local Memory Versioning

MemChain 不改变 agent 原有架构，而是接管 memories 文件夹的版本控制。

支持：

* Git commit
* Branch / tag
* Diff
* Checkout
* Rollback
* Memory redaction
* Memory schema validation

价值：

开发者不用重写 agent，只要把现有 memory 文件夹交给 MemChain 管。

⸻

Layer 2：Content Addressed Storage

每次 memory snapshot 会上传到 IPFS。

链上只存：

* CID
* Commit hash
* Merkle root
* Metadata hash

不直接存完整 memory，降低成本。

可选模式：

* Public memory：适合开源 agent、研究 agent、公开策略。
* Encrypted memory：memory 加密后上传 IPFS，只有购买者或授权验证者可解密。
* Redacted memory：隐藏 API keys、私钥、个人信息、交易账户信息。
* ZK proof mode：只证明某段 memory 存在于 snapshot 中，不公开原文。

⸻

Layer 3：Monad On-chain Registry

MemChain 在 Monad 上部署 Memory Registry 合约：

struct MemorySnapshot {
    address agent;
    bytes32 commitHash;
    string ipfsCid;
    bytes32 memoryRoot;
    bytes32 intentHash;
    uint256 blockNumber;
    uint256 timestamp;
    bytes32 strategyVersion;
}

核心函数：

commitSnapshot()
verifySnapshot()
linkTrade()
mintMemoryAsset()
slashInvalidSnapshot()

价值：

Monad 提供高性能链上记录，适合 agent 高频决策前的低成本存证。

⸻

Layer 4：ERC-8004 Compatibility

MemChain 不与 ERC-8004 竞争，而是成为 ERC-8004 agent 的 memory proof extension。

ERC-8004 解决：

* 这个 agent 是谁？
* 它的 reputation 是什么？
* 谁验证过它？
* 它是否支持某些验证方式？

MemChain 解决：

* 这次评分对应哪个 memory 版本？
* 这次交易前它到底知道什么？
* 它是否改写过 memory？
* 它的历史收益是否可回放？
* 它的策略演化是否可审计？

ERC-8004 是 agent 的身份与声誉层。MemChain 是 agent 的记忆证据层。

⸻

9. Killer Use Cases

Use Case 1：交易事故审计

用户问：

为什么我的 agent 昨天 3:42 做了一笔亏损交易？

MemChain 可以回答：

* 当时 memory 是哪个 commit。
* 当时策略版本是什么。
* 当时 agent 是否记录了风险限制。
* 当时是否已有相反信号。
* 交易前 memory 是否被修改。
* 下单后是否发生记忆篡改。

这让 agent trading 从黑盒变成可审计系统。

⸻

Use Case 2：Agent Reputation 证据化

今天的 reputation 可能只是一个分数。
MemChain 让 reputation 变成可验证证据链。

例如：

Agent A 最近 30 天收益率 18%，最大回撤 4%。

MemChain 可以附带证明：

* 每次交易前的 memory snapshot。
* 每次 strategy update 的 diff。
* 每次失败后的 reflection。
* 每个评分对应的交付版本。
* 每个收益结果对应的 memory state。

不是“相信评分”，而是“验证评分”。

⸻

Use Case 3：Memory Block Marketplace

优秀 trading agent 的历史记忆本身就是资产。

例如：

* “2026 年 5 月某次市场崩盘前的风险识别 memory”
* “某个 agent 连续盈利 30 天的策略演化记录”
* “某个 agent 对特定 meme coin 流动性陷阱的经验 memory”
* “某个 agent 失败后总结出的风控规则”

这些 memory snapshot 可以被打包成链上资产出售给其他 agent。

买家不是买一个 signal，而是买：

某个 agent 在某个时间点形成的可验证认知状态。

⸻

Use Case 4：Agent-to-Agent Trust

未来一个 trading agent 可能会雇佣另一个 research agent。

问题是：

我凭什么相信你的研究结果？

MemChain 可以让 research agent 提供：

* 研究过程 memory hash
* 数据来源版本
* 推理过程摘要
* 交付 commit
* 上链 validation record

Trading agent 可以自动判断是否接受这个研究结果。

这与 ERC-8004 的跨组织 agent discovery / interaction 方向高度一致。 ￼

⸻

10. 产品形态

MVP：CLI 工具

目标用户：AI trading agent 开发者、黑客松团队、DeFi quant builder。

功能：

* memchain init
* memchain pretrade
* memchain commit
* memchain verify
* memchain checkout
* memchain diff
* memchain link-trade
* memchain publish

⸻

V1：Agent Memory Dashboard

为每个 agent 生成一个可公开访问的 profile：

* Agent identity
* Memory timeline
* Commit graph
* Trading decisions
* Strategy diffs
* Reputation links
* Verification status
* Marketplace listings

⸻

V2：Memory Marketplace

支持：

* Memory block NFT / SBT / license
* Encrypted memory sale
* Pay-per-access
* Subscription
* Agent-to-agent purchase
* Revenue sharing
* Validation bounty

⸻

V3：Trust API

为交易平台、agent 框架、DeFi 协议提供 API：

memchain.verifyAgentMemory(agentId, tradeId)
memchain.getPreTradeSnapshot(agentId, txHash)
memchain.scoreMemoryIntegrity(agentId)
memchain.getReputationEvidence(agentId)

让任何协议都能读取 agent 的 memory integrity score。

⸻

11. 差异化

不是另一个 trading bot

MemChain 不预测市场。
MemChain 证明 trading bot 的历史状态。

不是普通日志系统

日志记录发生了什么。
MemChain 证明在决策之前，agent 记得什么、相信什么、承诺什么。

不是单纯 IPFS 存储

IPFS 存内容。
Git 存演化。
Monad 存不可篡改证明。
ERC-8004 连接身份与声誉。

不是 reputation 系统的替代品

MemChain 是 reputation 的证据底座。

⸻

12. 护城河

1. Memory Graph Network Effects

越多 agent 使用 MemChain，越多 memory snapshot 可以互相引用、购买、验证、评分。

最终形成：

Agent Memory Graph

其中每个节点是一个 agent memory state，每条边代表：

* 交易引用
* 研究引用
* 策略继承
* 购买关系
* 验证关系
* reputation update

⸻

2. Developer-first Distribution

CLI 是最快切入点。

不要求开发者迁移框架，不要求改 agent 架构，不要求使用新 memory DB。
只要已有 memories 文件夹，就可以接入。

⸻

3. ERC-8004 Extension Positioning

MemChain 可以成为 ERC-8004 agent 生态的默认 memory proof layer。

当 agent identity、reputation、validation 逐渐标准化后，下一步必然需要：

reputation evidence。

MemChain 就是这个 evidence layer。

⸻

4. High-value Vertical First

先做 trading agent，而不是泛 AI memory。

原因：

* 交易结果客观。
* 损失可量化。
* 审计需求强。
* 用户愿意付费。
* Memory 的价值可以被收益、回撤、风险控制验证。
* Agent 间购买 memory 的动机更强。

⸻

13. 商业模式

1. SaaS / Pro CLI

面向开发者和小团队：

* 免费：本地 Git + 手动上链。
* Pro：自动 IPFS pinning、dashboard、alerts、diff viewer。
* Team：多 agent 管理、权限控制、审计导出。

⸻

2. On-chain Protocol Fee

每次 memory asset 交易抽成：

* 2.5% marketplace fee
* 0.5% validation fee
* 可引入 validator / curator 激励

⸻

3. Verification API

面向：

* DeFi 协议
* agent launchpad
* trading agent marketplace
* DAO treasury managers
* hedge fund / quant teams

按调用量收费。

⸻

4. Memory Data Licensing

高质量 agent memory 可以形成数据资产：

* 训练数据
* 策略回测数据
* agent behavior dataset
* risk model dataset

⸻

14. Go-to-Market

Phase 1：Monad AI / Agent Hackathon 切入

定位：

The verifiable memory layer for Monad AI agents.

目标：

* 做一个可 demo 的 CLI。
* 接入一个开源 trading agent。
* 每次交易前自动 commit memory。
* 在 Monad testnet 上存证。
* Dashboard 展示 memory timeline。
* 支持 checkout 回放某次交易前的 agent memory。

⸻

Phase 2：集成 Agent Framework

优先集成：

* OpenClaw
* ElizaOS 类 agent 框架
* LangChain / LangGraph memory folder
* AutoGen / CrewAI 本地状态
* 自研 DeFi trading bot

策略：

不要求框架适配 MemChain，而是 MemChain 适配它们的 memory path。

⸻

Phase 3：推出 Public Agent Memory Leaderboard

排行榜不只看 PnL，还看：

* Memory integrity score
* Strategy consistency
* Audit completeness
* Drawdown explanation quality
* Reflection quality
* Reproducibility score

让“可信 agent”成为新的竞争维度。

⸻

15. Demo 脚本

Demo 标题

From Black-box Trading Agent to Verifiable Economic Actor

Demo 流程

1. 启动一个 AI trading agent。
2. Agent 读取 memory，准备做交易。
3. MemChain 自动捕获 pre-trade memory snapshot。
4. Snapshot 被 Git commit。
5. Commit 上传 IPFS。
6. CID + commit hash 写入 Monad。
7. Agent 执行交易。
8. 交易亏损或盈利。
9. 用户点击 dashboard 回溯该交易。
10. 页面展示：

* 决策前 memory
* 决策后 memory diff
* strategy version
* trade intent
* Monad proof
* IPFS proof
* Git checkout command

11. 另一个 agent 购买该 memory block，用于学习或验证。

Demo 金句

“We don’t just show what the agent did. We prove what the agent remembered before it acted.”

⸻

16. Pitch Deck 结构

Slide 1：Title

MemChain
Verifiable Memory Infrastructure for AI Trading Agents

副标题：

Git-versioned, IPFS-stored, Monad-verified memory for accountable agent economies.

⸻

Slide 2：The Shift

AI agents are becoming economic actors.

They trade, spend, earn, promise, deliver, and collaborate.
But their memory is still centralized, mutable, and unverifiable.

⸻

Slide 3：The Problem

When an AI trading agent loses money, nobody can answer:

* What did it know before the trade?
* Did it change its memory afterward?
* Which strategy version was active?
* Which result produced its reputation score?
* Can another agent verify its track record?

⸻

Slide 4：The Missing Layer

ERC-8004 gives agents identity, reputation, and validation.
Monad AI Blueprint calls for verifiable memory systems.

But reputation needs evidence.

MemChain is the evidence layer for agent memory.

⸻

Slide 5：The Product

MemChain is a local CLI that versions an agent’s memory folder with Git, stores snapshots on IPFS, and commits proofs to Monad before every trading decision.

⸻

Slide 6：How It Works

Agent memory folder
        ↓
Git commit
        ↓
IPFS CID
        ↓
Monad memory registry
        ↓
Auditable pre-trade memory proof

⸻

Slide 7：Why Trading First

Trading agents have:

* High financial stakes
* Objective outcomes
* Strong audit needs
* Clear reputation signals
* Valuable historical memory

⸻

Slide 8：Use Cases

* Post-loss audit
* Reputation evidence
* Strategy rollback
* Agent-to-agent trust
* Memory block marketplace
* Compliance-grade decision history

⸻

Slide 9：Memory Becomes an Asset

A profitable agent’s historical memory is not just a log.

It is:

* Strategy evolution
* Market interpretation
* Risk learning
* Failure reflection
* Verifiable alpha history

MemChain turns memory blocks into tradable on-chain assets.

⸻

Slide 10：Market Position

ERC-8004: Who is this agent?
Reputation: How has it performed?
Validation: Who verified it?
MemChain: What did it remember when it acted?

⸻

Slide 11：Business Model

* Pro CLI / hosted dashboard
* IPFS pinning and storage
* Verification API
* Marketplace transaction fee
* Enterprise audit tools
* Memory data licensing

⸻

Slide 12：Vision

The future agent economy needs more than autonomous agents.

It needs accountable agents.

MemChain makes AI memory verifiable, portable, auditable, and monetizable.

⸻

17. 推荐 Pitch 版本

30 秒版本

MemChain is a verifiable memory layer for AI trading agents.

Today, agents can trade, manage funds, and interact on-chain, but their memory is still mutable and centralized. If an agent loses money or changes strategy, users cannot verify what it knew before acting.

MemChain solves this by turning the agent’s local memory folder into a Git-versioned, IPFS-stored, Monad-verified audit trail. Before every trading decision, MemChain commits the memory state, uploads it to IPFS, and records the proof on-chain.

This lets users audit losses, verify reputation, replay historical decision states, and even sell valuable memory blocks to other trading agents.

ERC-8004 gives agents identity and reputation. MemChain gives that reputation evidence.

⸻

2 分钟版本

AI agents are becoming economic actors. They trade, spend, earn, collaborate, and make commitments on behalf of users. But there is a trust gap: their memory is still controlled by centralized systems or local files.

For trading agents, this is dangerous. If an agent loses money, makes a bad trade, or gets attacked, users need to know what happened. Not just what transaction was executed, but what the agent remembered before it acted, what strategy version it used, and whether its memory was modified afterward.

MemChain is a verifiable memory system for AI trading agents. It is a local CLI tool that watches an agent’s memory folder, versions it with Git, stores snapshots on IPFS, and records the commit hash and CID on Monad before every trading decision.

With MemChain, anyone can go back to a specific trade, checkout the exact memory state before the decision, inspect the strategy context, verify the hash against Monad, and prove whether the agent’s history is authentic.

This is especially powerful in the context of ERC-8004. ERC-8004 gives agents portable identity, reputation, and validation. But reputation is only useful if the underlying evidence is verifiable. MemChain provides that evidence layer.

Over time, agent memory becomes more than an audit trail. It becomes an asset. A profitable agent’s historical memories — its market observations, strategy evolution, and failure reflections — can be packaged and sold to other agents as verified memory blocks.

MemChain starts with trading agents because the pain is sharp, the outcomes are measurable, and the willingness to pay is high. But the long-term vision is broader: every serious AI agent that handles money, governance, contracts, or mission-critical workflows will need verifiable memory.

MemChain makes AI agents accountable economic actors.

⸻

18. 最强定位语

可选：

1. MemChain: The verifiable memory layer for AI trading agents.
2. Git for agent memory. Proof for agent reputation.
3. Before an AI agent trades, MemChain proves what it remembered.
4. From black-box bots to accountable economic agents.
5. ERC-8004 tells you who the agent is. MemChain tells you what the agent knew.

我建议主标语使用：

MemChain: The verifiable memory layer for AI trading agents.

副标语使用：

ERC-8004 tells you who the agent is. MemChain proves what the agent remembered when it acted.