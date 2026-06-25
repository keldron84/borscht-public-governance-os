<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Спецификация экранов и пользовательского пути (UI/UX) для Public Edition v1

Ниже — спецификация **экранов и пользовательского пути** для **Borscht Public Edition v1**. Логика опирается на современный control-plane паттерн для агентных систем: identity + policy + approvals + traces + observability + eval gates, а не на «чат как главный экран». Для Borscht это особенно уместно, потому что его ценность — в управляемом решении и evidence loop, а не просто в генерации.[^1][^2][^3][^4][^5]

## UX-принципы v1

UI Public Edition должен решать три задачи: быстро показать first-run value, не прятать governance за абстракцией и не перегружать пользователя enterprise-сложностью. Поэтому UX должен быть построен вокруг **run/case**, где каждый объект имеет owner, risk, verdict, trace и actions; именно trace-based control plane сейчас считается базовым паттерном для production-grade agent UX.[^6][^7][^1]

Ключевые принципы:

- **Run-first UX**, не chat-first.
- **One primary action per screen**.
- **Policy and trace visible by default**, не в buried admin sections.[^2][^6]
- **Approval UX as inbox**, а не как скрытый модал.
- **Observability и eval** — отдельные поверхности, потому что рынок уже считает их частью control plane, а не внутренним dev-инструментом.[^7][^1]


## Информационная архитектура

Основная навигация слева:

- Overview
- Runs
- Approvals
- Policies
- Observability
- Evaluations
- Templates
- Settings

Верхняя панель:

- Global search
- Environment badge (`local`)
- Current role
- `New Run`
- `Pause all` / emergency toggle

Это соответствует паттерну control-plane интерфейсов, где оперативные объекты и governance-поверхности разделены, но видимы из первого уровня меню.[^8][^6]

## Экран 1: Overview

### Цель

Дать пользователю за 10 секунд понять: система работает или нет, что требует внимания и куда нажать дальше.[^6]

### Структура

1. **Hero KPIs**

- Active runs
- Awaiting approvals
- Blocked by policy
- Success rate 7d
- Avg run duration
- Last eval status

2. **Attention panel**

- Runs blocked by policy
- Failed runs
- Approval backlog
- Recent incidents

3. **Quick actions**

- New Run
- Import Template
- Run Demo Flow
- Open Last Failed Run

4. **Recent activity feed**

- Latest runs
- Latest approvals
- Latest policy denials
- Latest rollbacks


### Главный CTA

`Run demo workflow`

### UX-заметки

Overview не должен быть BI-дашбордом. Это **операционная входная дверь**, а не аналитическая свалка.[^1][^6]

## Экран 2: New Run

### Цель

Создать новый run/case максимально быстро и без перегруза.

### Структура

Шаговый мастер из 4 шагов:

**Step 1. Choose workflow**

- Marketing review
- Spend increase request
- Content publish
- Client change request
- Blank workflow

**Step 2. Provide signal**

- Text input
- File attachment
- URL
- JSON payload
- Manual note

**Step 3. Assign context**

- Owner
- Risk class
- Optional template variables
- Optional memory lookup toggle

**Step 4. Confirm**

- Summary card
- Expected approval path
- Expected tools
- Run button


### Главный CTA

`Start Run`

### UX-заметки

Нельзя заставлять пользователя думать в терминах internal architecture. Он должен думать: «какой кейс я запускаю» и «что я подаю на вход». Это соответствует best practice trace/eval systems, где task contract формулируется до запуска, а не после него.[^7]

## Экран 3: Runs List

### Цель

Дать единый operational inbox всех кейсов.

### Структура

Таблица или list view с колонками:

- Run ID
- Workflow
- Status
- Owner
- Risk
- Verdict
- Updated
- Policy badge
- Evidence count


### Фильтры

- My runs
- Awaiting approval
- Blocked
- Failed
- Succeeded
- Rolled back
- High risk
- By workflow
- By policy hit


### Bulk actions

- Export selected
- Retry selected low-risk drafts
- Archive completed


### Главный CTA

`Open Run`

### UX-заметки

По умолчанию сортировка — по freshest + requiring attention. В control-plane UX всегда важнее «что горит», чем «что завершилось красиво».[^6][^1]

## Экран 4: Run Detail

Это **центр всей системы**.

### Цель

Объяснить run полностью: что произошло, почему, что разрешили/запретили и что можно сделать дальше.[^2][^6]

### Layout

Двухколоночный:

- Левая: main content
- Правая sticky sidebar: status, risk, owner, actions


### Верхняя зона

- Run title
- Status badge
- Workflow
- Owner
- Risk class
- Started / updated
- Final verdict
- Primary action buttons


### Вкладки

#### 4.1 Summary

- Input summary
- Generated task contract
- Current status
- Final outcome
- Short explanation “why this verdict”


#### 4.2 Trace

Timeline:

1. Signal received
2. Context loaded
3. Policy checks
4. Decision step
5. Tool execution(s)
6. Evidence written
7. Final state / rollback

Каждый step:

- timestamp
- actor
- duration
- outcome
- expandable raw details

Trace-first design полностью совпадает с текущим сдвигом рынка в сторону trace-based observability.[^9][^7]

#### 4.3 Policy

- Rules evaluated
- Result: pass / deny / approval required / waived
- Reason
- Risk tags
- Affected action/tool
- Simulation tab: “what if rule X were off?”


#### 4.4 Evidence

- Artifacts list
- Markdown evidence preview
- JSON preview
- File attachments
- Export bundle


#### 4.5 Actions

- Approve
- Reject
- Send back
- Retry
- Clone run
- Rollback
- Export report


### Правая sticky sidebar

- Current state
- Owner
- Approver
- Risk level
- Tool scopes used
- Policy summary
- Emergency actions


### UX-заметки

Run Detail должен отвечать на 4 вопроса без скролл-ада:

1. Что произошло?
2. Почему?
3. Что система сделала?
4. Что я могу сделать сейчас?

## Экран 5: Approvals Inbox

### Цель

Сделать HITL-слой быстрым, прозрачным и безопасным.[^10][^11]

### Структура

Список карточек/строк:

- Run title
- Risk
- Requested action
- Why approval is needed
- Owner
- Time waiting
- Evidence snippet


### Detail drawer

При открытии карточки справа:

- Proposed action
- Policy reason
- Supporting evidence
- Impact preview
- Approve / Reject / Escalate / Request changes


### Главный CTA

`Approve` или `Reject`

### UX-заметки

Approval нельзя прятать на экран Run Detail как единственный путь. Нужен отдельный inbox, иначе система плохо работает в реальном операционном режиме.

## Экран 6: Policies

### Цель

Дать пользователю менять правила без страха сломать систему.

### Структура

Левый список policy packs:

- Spend controls
- External publish
- Data access
- Human-required actions
- Secret safety
- Tool scopes
- Rollback requirements

Правая панель:

- Description
- Status
- Scope
- Severity
- Trigger frequency
- Last changed
- Editor


### Режимы

- **Simple mode** — формы/селекты/чекбоксы
- **Advanced mode** — YAML/JSON editor
- **Simulation mode** — прогон sample run against current policy set


### Главный CTA

`Save & simulate`

### UX-заметки

Policy UX должен быть explainable. Лучший паттерн — “rule + affected runs + last trigger count + simulation”, потому что это переводит governance из абстракции в управление последствиями.[^8][^2]

## Экран 7: Observability

### Цель

Показать не бизнес-аналитику, а здоровье системы и качество исполнения.[^1][^6]

### Блоки

1. Run volume over time
2. Success/fail/blocked trend
3. Approval latency
4. Policy denials by type
5. Tool error rate
6. Avg tokens/cost
7. Slowest workflows
8. Rollback events
9. Top recurring failure causes

### Drill-down

Клик по графику → filtered Runs list

### Главный CTA

`Investigate failures`

### UX-заметки

Observability должен быть operational, не decorative. Trace-to-metric linkage — уже best practice в agent observability.[^7][^6]

## Экран 8: Evaluations

### Цель

Дать уверенность, что систему можно обновлять и не сломать.

### Структура

- Last suite run
- Overall status
- Golden set pass rate
- Adversarial failures
- Policy regression failures
- Tool correctness score
- Cost regression
- Release recommendation


### Подразделы

- Test packs
- Historical runs
- Failed cases
- Promote/block release


### Главный CTA

`Run eval suite`

### UX-заметки

Eval должен быть понятен не только инженеру. Пользователь должен видеть: «можно обновлять» или «нельзя, вот почему».[^7]

## Экран 9: Templates

### Цель

Ускорить first value и показать use cases.

### Структура

Карточки шаблонов:

- Marketing review
- Spend approval
- Client escalation
- Content publish
- Incident postmortem
- Blank starter

На карточке:

- Что делает
- Какие tools/policies нужны
- Нужен ли approval
- Время first run


### Действия

- Preview
- Install
- Duplicate
- Edit variables


### UX-заметки

Для Public Edition v1 templates — это не nice-to-have, а onboarding engine.

## Экран 10: Settings

### Цель

Собрать essentials, не превратить UI в enterprise ERP.

### Разделы

- Providers / API keys
- Storage path
- Connectors
- Role bindings
- Default risk rules
- Notifications
- Import/export config
- Emergency pause


### UX-заметки

Settings должны быть редкими. Всё часто используемое — не тут, а в рабочих экранах.

***

## Пользовательский путь v1

Ниже — **основной happy path** первого пользователя.

### Flow 1: First-run demo

1. Пользователь открывает **Overview**.
Видит CTA `Run demo workflow`.
2. Переходит в **Templates** или сразу в **New Run**.
Выбирает `Marketing review`.
3. На **New Run**:

- вставляет текст/URL/файл как signal,
- назначает owner,
- видит, что workflow high-risk и может потребовать approval.

4. Нажимает `Start Run`.
Система создаёт run и переводит на **Run Detail**.
5. На **Run Detail** пользователь видит:

- timeline trace,
- policy checks,
- что action blocked pending approval.

6. Переходит в **Approvals Inbox**.
Видит запрос на approval, открывает detail drawer.
7. Нажимает `Approve`.
Система возвращает run в execution.
8. Run завершается.
В **Run Detail** доступны:

- final verdict,
- evidence bundle,
- export,
- rollback button.

9. Пользователь открывает **Observability**.
Видит, что появился новый successful run.
10. Переходит в **Evaluations** и жмёт `Run eval suite`.
Видит, что система тестируема и управляемая.

### Ценность этого пути

Он демонстрирует весь Borscht-цикл: signal → policy → approval → execution → evidence → observe → eval.[^4][^7]

***

## Второй пользовательский путь: Incident / blocked run

1. Пользователь заходит в Overview и видит blocked run.
2. Переходит в Runs → фильтр `Blocked`.
3. Открывает Run Detail.
4. Во вкладке Policy видит, какая именно policy запретила действие.
5. Во вкладке Trace понимает, на каком шаге всё остановилось.
6. Делает одно из трёх:

- approve,
- send back,
- change policy in simulation and retry.

7. Проверяет outcome в Observability.

Это очень важный путь, потому что governance-OS должна лучше всего работать именно в «проблемных» сценариях.

## Третий пользовательский путь: Policy tuning

1. Пользователь идёт в Policies.
2. Открывает `External publish requires approval`.
3. Видит, сколько раз правило сработало и на какие runs повлияло.
4. Меняет rule threshold или scope.
5. Запускает simulation.
6. Сохраняет.
7. Смотрит effect в future runs и observability.

Это превращает Borscht из «набора запретов» в **операционный регулятор поведения системы**.[^12][^2]

***

## Состояния интерфейса

Для каждого экрана обязательны 4 состояния:

- Loading
- Empty
- Error
- Success

Особенно важно:

- Overview empty state: “Install a template and run your first governed workflow.”
- Runs empty state: “No runs yet.”
- Approvals empty state: “Nothing needs human review.”
- Evaluations empty state: “Run your first test suite.”

Control-plane UX без честных empty/error states быстро ощущается как недоделанная dev-console.

## Микрокопия и тон

Тон интерфейса должен быть:

- ясный,
- спокойный,
- операционный,
- без AI-hype.

Примеры:

- Не `AI magic complete`
- А `Run completed with evidence`
- Не `Smart guardrail blocked action`
- А `Policy blocked external publish: human approval required`

Это сильно влияет на доверие.

## Приоритет реализации экранов

Если идти по MVP-порядку:

1. Overview
2. New Run
3. Runs List
4. Run Detail
5. Approvals Inbox
6. Policies
7. Observability
8. Evaluations
9. Templates
10. Settings

Именно первые 6 экранов уже дают usable Public Edition v1.

## Критерий UX-готовности

UI/UX v1 готов, если новый пользователь без созвона и без чтения документации может:

- создать run,
- понять, почему он blocked/allowed,
- пройти approval,
- увидеть trace,
- получить evidence,
- откатить действие,
- проверить system health,
- прогнать eval.

Если хочешь, следующим сообщением я могу сделать ещё более прикладной слой: **wireframe-spec по каждому экрану с блоками, кнопками, полями, таблицами и состояниями “пиксельного” уровня**.
<span style="display:none">[^13][^14][^15][^16][^17][^18][^19]</span>

<div align="center">⁂</div>

[^1]: https://icmd.app/article/the-ai-agent-control-plane-how-2026-s-best-teams-ship-autonomy-without-losing-se-1778721683363

[^2]: https://blog.tobira.ai/microsoft-agent-governance-toolkit-runtime-shift/

[^3]: https://github.com/microsoft/agent-governance-toolkit

[^4]: https://www.perplexity.ai/search/d1621f4e-ebb0-437a-a156-dbd67a068660

[^5]: https://www.perplexity.ai/search/4c748184-9c76-4193-b6e8-ba2c718a4b30

[^6]: https://www.arthur.ai/column/agentic-ai-observability-playbook-2026

[^7]: https://www.kmsitc.net/insights/agent-evaluation-loop-2026

[^8]: https://www.youtube.com/watch?v=uaDK42eALGo

[^9]: https://www.braintrust.dev/articles/agent-observability-complete-guide-2026

[^10]: https://microsoft.github.io/agent-governance-toolkit/tutorials/04-audit-and-compliance/

[^11]: https://www.idlen.io/news/microsoft-agent-governance-toolkit-open-source-ai-agents-security-eu-ai-act/

[^12]: https://www.helpnetsecurity.com/2026/04/03/microsoft-ai-agent-governance-toolkit/

[^13]: https://effloow.com/articles/microsoft-agent-governance-toolkit-guide-2026

[^14]: https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/

[^15]: https://www.paulserban.eu/blog/post/architecting-the-ai-agent-control-plane-3-design-patterns-for-2026/

[^16]: https://microsoft.github.io/agent-governance-toolkit/compliance/owasp-agentic-top10-architecture/

[^17]: https://datafi.co/resources/full-ai-observability-the-control-plane-for-autonomous-enterprise-agents

[^18]: https://github.com/sattyamjjain/agent-audit-kit/blob/main/docs/comparisons.md

[^19]: https://agenticaudit.dev

