<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Да, распиши состав Public Edition v1 по модулям и UI

Ниже — **Borscht Public Edition v1** как законченная open/free система: какие модули в неё входят, как они связаны и какие UI-экраны обязательны. Я исхожу из твоей логики Borscht как `Signal → Triage → Decision → Execution → Evidence` с fail-closed governance, а также из того, что рынок open agent control plane уже считает обязательными policy engine, audit, observe и test/eval layers.[^1][^2][^3][^4][^5]

## Принцип сборки

Public Edition v1 должна быть не «облегчённой демкой», а **маленькой полной ОС**: пользователь ставит её локально, создаёт workflow, подключает сигнал, прогоняет policy check, получает verdict, выполняет действие, видит trace и может откатить его. Это ближе к open-source control plane, чем к SaaS-дашборду: Microsoft Agent Governance Toolkit, Agent Control и похожие системы строят ценность вокруг runtime policy enforcement, audit trail, observability и test loop, а не вокруг «красивого чат-интерфейса».[^6][^7][^8][^3][^1]

## Модули v1

| Модуль | Что делает | Обязателен |
| :-- | :-- | :-- |
| `borscht-core` | Оркестрирует полный цикл run/job/session | Да |
| `borscht-policy` | Применяет allow/deny/approval/p0-p1 правила | Да |
| `borscht-identity` | Хранит роли, owners, agents, approval actors | Да |
| `borscht-runs` | Run state machine: queued/running/blocked/done/rolled_back | Да |
| `borscht-execution` | Tool runtime, connectors, sandboxed actions | Да |
| `borscht-evidence` | Артефакты, JSONL logs, markdown evidence, attachments | Да |
| `borscht-trace` | Timeline решения: signal → checks → verdict → action | Да |
| `borscht-observe` | Метрики, ошибки, latency, denials, approvals | Да |
| `borscht-eval` | Regression/golden tests/adversarial test packs | Да |
| `borscht-ui` | Web UI control plane | Да |
| `borscht-cli` | Локальная работа, init/run/replay/test/export | Да |
| `borscht-memory-lite` | Простая локальная память/registry/evidence index | Да |
| `borscht-graph-adapter` | Optional graph projection / Neo4j bridge | Нет |
| `borscht-templates` | Готовые workflow packs для marketing/ops/support | Желательно |

### 1. `borscht-core`

Это runtime-ядро, где любой процесс описывается как **Run** или **Case**. У него есть `input signal`, `context`, `policy gates`, `decision`, `execution`, `evidence`, `status`. Именно core держит state machine и связывает остальные модули в единый контракт, что соответствует общему рынку control-plane систем, где actions and spans связываются в один execution lifecycle.[^3][^4][^6]

**Что обязательно внутри:**

- Session / run model
- Step lifecycle
- Retry / hold / approve / rollback statuses
- JSON schema for all runs


### 2. `borscht-policy`

Это сердце governance-OS. Он должен поддерживать:

- `allow`
- `deny`
- `require_approval`
- `budget_limit`
- `risk_class`
- `human_required`
- `tool_scope`
- `data_scope`[^8][^9]

Политики должны быть **declarative**, чтобы пользователь менял правила без перепрошивки системы — это уже стандартный паттерн у open control plane решений.[^6][^8]

**Минимальные policy packs v1:**

- P0: destructive action / data exfil / secrets / outbound external message
- P1: spend increase / public publish / data mutation / campaign launch
- P2: low-risk internal drafts, analysis, summaries


### 3. `borscht-identity`

В public v1 не нужна enterprise-сложность, но нужна нормальная модель субъектов:

- User
- Agent
- Owner
- Approver
- Service account[^1][^8]

Каждый run и каждое действие подписываются actor-ом. Даже если это не криптографическая identity enterprise-класса, attribution должна быть жёсткой: **кто именно сделал и кто владеет риском**.[^7][^8]

### 4. `borscht-runs`

Отдельный модуль run management нужен, чтобы UI и CLI опирались на один язык состояний:

- `draft`
- `queued`
- `running`
- `awaiting_approval`
- `blocked_by_policy`
- `succeeded`
- `failed`
- `rolled_back`
- `waived`

Это очень важно для понятного control plane UX: без единой state model всё расползается в логи.[^3][^6]

### 5. `borscht-execution`

Execution v1 должен быть **ограниченным, но реальным**. То есть:

- File read/write
- HTTP request through allowlisted connectors
- Webhook/post action
- Markdown/json export
- Optional shell task in sandbox
- Manual task handoff to human

Это достаточно, чтобы делать настоящие workflows, и при этом не превращать public edition в рискованную autonomous platform.[^6][^1]

### 6. `borscht-evidence`

Это ключевой Borscht-модуль. Он хранит:

- Input snapshot
- Context bundle
- Policy decision record
- Tool outputs
- Final verdict
- Result artifacts
- Linked notes / markdown / logs[^5]

Хранилище может быть простым:

- SQLite для metadata
- `./data/runs/*.json`
- `./data/evidence/*.md`
- `./data/logs/*.jsonl`

Этого уже достаточно для audit-grade replay на локальной машине.

### 7. `borscht-trace`

Если evidence — это документы, то trace — это **временная линия**. Он показывает:

1. Что пришло
2. Что прочитали
3. Какие policy checks сработали
4. Какой verdict вынесли
5. Что реально выполнили
6. Что было результатом
7. Был ли rollback

Trace-first observability считается ядром нормального agent monitoring.[^10][^3]

### 8. `borscht-observe`

Нужен базовый operations layer:

- Runs per day
- Success / fail / blocked ratio
- Avg approval wait time
- Policy denials by type
- Latency per step
- Cost/tokens if LLM is connected
- Top failing workflows[^10][^3]

Без observe public edition не учит пользователя управлять системой.

### 9. `borscht-eval`

Public edition обязана иметь eval, иначе open users не смогут отличить working setup от красиво сломанного. Минимум:

- Golden flows
- Regression suite
- Adversarial suite
- Policy correctness checks
- “Canary workflow” before upgrade[^11][^8]

Это должно запускаться одной командой вроде `borscht test`.

### 10. `borscht-memory-lite`

Вместо тяжёлого Graph Brain в public v1 нужен memory-lite:

- local registry
- evidence index
- past runs retrieval
- reusable pattern cards
- tags / topic links

То есть не «умный граф ради графа», а полезная локальная память поверх прошлых решений. Graph/Neo4j — optional adapter later.[^5]

## UI v1

UI должен быть не “AI chat playground”, а **control plane**. Минимально обязательны 8 экранов.

### 1. Home / Overview

Главная страница:

- Total runs
- Active blocked runs
- Awaiting approvals
- Success rate
- Latest incidents
- Quick actions: New Run / Approve / Replay / Test

Это аналог ops dashboard, чтобы сразу понимать состояние системы.[^3][^6]

### 2. Runs

Список всех runs/cases:

- Status
- Workflow
- Owner
- Risk class
- Started / updated
- Verdict
- Evidence attached

Фильтры:

- blocked
- failed
- awaiting approval
- by owner
- by policy
- by workflow


### 3. Run Detail

Самый важный экран. Должен содержать 5 вкладок:

- **Summary** — что это за кейс
- **Trace** — пошаговая timeline
- **Policy** — какие правила проверились и с каким исходом
- **Evidence** — файлы, markdown, outputs
- **Actions** — retry, approve, hold, rollback, export

Именно этот экран доказывает ценность governance-OS.

### 4. Approvals Inbox

Отдельный экран всех кейсов, где нужен человек:

- Why approval is required
- Risk level
- Proposed action
- Supporting evidence
- Buttons: Approve / Reject / Send back / Escalate

Это обязательный HITL-слой.[^7]

### 5. Policies

Экран управления политиками:

- List of policy packs
- Severity / scope
- Toggle active/inactive
- Simulation mode
- Last triggered count
- Edit YAML/JSON rule

Желательно 2 режима:

- simple form
- raw config


### 6. Observability

Отдельный технический дашборд:

- Runs over time
- Failures by workflow
- Denials by policy
- Approval latency
- Retry loops
- LLM token/cost
- Tool error rate[^10][^3]


### 7. Evaluations

Экран test/eval:

- Last suite run
- Pass/fail by test pack
- Regression diffs
- Adversarial failures
- Recommended block/release status

Это делает public edition серьёзным инженерным продуктом, а не красивым UI.

### 8. Templates / Packs

Готовые стартовые наборы:

- Marketing review workflow
- Client change request workflow
- Content publish workflow
- Spend increase approval workflow
- Incident postmortem workflow

Твой market wedge для своих клиентов как раз здесь: templates дают быстрый вход в систему.

## Навигация UI

Левая навигация v1:

- Overview
- Runs
- Approvals
- Policies
- Observability
- Evaluations
- Templates
- Settings

Верхняя панель:

- search
- active environment
- current user/role
- New Run button
- emergency pause toggle


## Settings v1

В settings должны быть только essentials:

- Model/provider keys
- Tool connectors
- Risk defaults
- Storage path
- Notification hooks
- Role bindings
- Export/import config

Не надо тащить enterprise admin jungle в v1.

## CLI v1

Public edition обязательно должен иметь CLI, потому что open-source adoption часто начинается не с UI, а с терминала.[^8]

Минимальные команды:

- `borscht init`
- `borscht dev`
- `borscht run <workflow>`
- `borscht approve <run-id>`
- `borscht hold <run-id>`
- `borscht rollback <run-id>`
- `borscht trace <run-id>`
- `borscht test`
- `borscht export <run-id>`
- `borscht policy check <input>`
- `borscht import-template <name>`


## Каталог проекта v1

Практичная структура:

```text
borscht-public/
  apps/
    ui/
    cli/
  packages/
    core/
    policy/
    identity/
    runs/
    execution/
    evidence/
    trace/
    observe/
    eval/
    memory-lite/
    templates/
  examples/
    marketing-review/
    spend-approval/
    content-publish/
  data/
    runs/
    evidence/
    logs/
  docs/
    quickstart.md
    policies.md
    templates.md
    architecture.md
```


## Что показать пользователю в first-run

Первый запуск должен за 10–15 минут показать **полный end-to-end сценарий**:

1. Импорт шаблона `marketing-review`
2. Подача сигнала
3. Автоматический triage
4. Policy hit: approval required
5. Approve in UI
6. Execute action
7. See evidence + trace
8. Replay / rollback

Если first-run не делает этого, public edition не объясняет себя сама.

## Что оставить optional

Не включай в v1 как обязательное:

- Neo4j dependency
- Multi-tenant billing
- Enterprise SSO
- Complex swarm orchestration
- Heavy analytics / BI
- Vertical-specific causal MMM
- Advanced cryptographic attestation

Это всё может быть later/pro tier. В v1 нужен **control plane that works**, а не enterprise museum.[^8]

## Рамка монетизации поверх Public Edition

Открытая версия должна оставаться полной по циклу, а монетизация идти сверху:

- Managed cloud control plane
- Team collaboration / shared workspaces
- Premium templates packs
- Hosted observability retention
- Enterprise auth / SSO / RBAC+
- Verified connectors
- Compliance packs
- SLA support[^8]


## Критерий готовности v1

Public Edition v1 готова, если новый пользователь может:

- локально поставить систему,
- запустить один реальный workflow,
- увидеть policy decision,
- пройти approval,
- получить evidence,
- посмотреть trace,
- сделать rollback,
- прогнать eval suite.

Если всё это работает — у тебя уже есть настоящая открытая версия Borscht, а не просто репозиторий с сильными идеями.

Могу следующим сообщением собрать это в ещё более прикладной форме: **экран-за-экраном wireframe spec + user flow первого релиза**.
<span style="display:none">[^12][^13][^14][^15][^16][^17][^18][^19]</span>

<div align="center">⁂</div>

[^1]: https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/

[^2]: https://github.com/agentcontrol

[^3]: https://www.braintrust.dev/articles/agent-observability-complete-guide-2026

[^4]: https://www.perplexity.ai/search/d1621f4e-ebb0-437a-a156-dbd67a068660

[^5]: https://www.perplexity.ai/search/4c748184-9c76-4193-b6e8-ba2c718a4b30

[^6]: https://www.youtube.com/watch?v=uaDK42eALGo

[^7]: https://microsoft.github.io/agent-governance-toolkit/tutorials/04-audit-and-compliance/

[^8]: https://happycapyguide.com/blog/microsoft-agent-governance-toolkit-open-source-2026

[^9]: https://github.com/microsoft/agent-governance-toolkit/blob/main/docs/specs/AGENT-OS-POLICY-ENGINE-1.0.md

[^10]: https://atlan.com/know/ai-agent-observability/

[^11]: https://www.kmsitc.net/insights/agent-evaluation-loop-2026

[^12]: https://github.com/msaad00/agent-bom

[^13]: https://www.marktechpost.com/2026/05/31/an-implementation-of-the-microsoft-agent-governance-toolkit-for-safe-ai-agent-tool-use-with-policies-approvals-audit-logs-and-risk-controls/

[^14]: https://github.com/Agent-Field/agentfield

[^15]: https://drizzle.systems/resources/references/multi-agent-oss-reference-architecture/

[^16]: https://github.com/microsoft/agent-governance-toolkit/blob/main/CHANGELOG.md

[^17]: https://effloow.com/articles/microsoft-agent-governance-toolkit-guide-2026

[^18]: https://github.com/systempromptio/awesome-ai-agent-governance

[^19]: https://github.com/sattyamjjain/agent-audit-kit/blob/main/docs/comparisons.md

