<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# А вот допустим. Я хочу создать необходимую и достаточную версию своей системы, для публичного бесплатного распространения, без ограничения по функциям. Что в нее обязательно должно входить?

Если цель — сделать **необходимую и достаточную** публичную бесплатную версию Borscht **без урезания функций**, то в неё должен входить не «весь зоопарк системы», а **полный минимальный контур**, при котором пользователь может: подключить источники сигналов, прогнать их через triage, принять и зафиксировать решение, выполнить действие, сохранить evidence, увидеть trace и при необходимости откатиться. Иначе это будет либо демо, либо framework без value. Для Borscht ядро уже давно просматривается как `Signal → Triage → Decision → Execution → Evidence`, плюс fail-closed governance и owner-control discipline — именно это и должно стать public core, а не набор разрозненных утилит.[^1][^2][^3][^4]

## Обязательное ядро

Ниже — то, что **обязательно** должно войти в public edition.

- **1. Единая decision loop.**
Пользователь должен пройти полный цикл: принять входной сигнал, оценить его, выбрать `GO | HOLD | REVISE | STOP`, выполнить шаг и получить артефакт/лог/evidence.[^1][^2] Без этого Borscht перестаёт быть OS и становится просто governance-библиотекой.
- **2. Policy / governance engine.**
Нужны машиночитаемые правила: кто может запускать что, какие действия требуют HITL, какие запрещены, какие лимиты по риску/бюджету/доступам действуют. Именно runtime enforcement сейчас считается обязательной частью agent governance control plane, а не nice-to-have.[^5][^6][^7][^8]
- **3. Identity + roles + ownership.**
Должны быть agent/user IDs, роли, owner у каждого контура или workflow и separation of duties хотя бы в базовом виде. Для Borscht это особенно важно, потому что owner-accountability — один из его ключевых дифференциаторов.[^9][^8][^10][^1]
- **4. Structured audit trail.**
Все события должны логироваться в нормальной структуре: input, retrieved context, policy checks, tool calls, verdict, execution result, evidence links, timestamps, cost/latency, rollback ref. Если trace нет, то governance-OS не доказывает свою ценность.[^3][^4][^8]
- **5. Eval / release gate минимального уровня.**
Нужны хотя бы golden-set тесты, adversarial cases, regression threshold и блокировка релиза при деградации качества/безопасности. Это уже рыночный минимум для production-grade agent systems.[^11][^4]


## Что ещё должно войти

- **6. Execution harness с ограничениями.**
Не просто «приняли решение», а реально выполнили действие через tools/connectors, но с sandbox/rate-limit/approval hooks. Иначе нет бизнес-ценности.[^6][^5]
- **7. Evidence store и replay.**
Нужно хранить артефакты решения: markdown/json/jsonl/logs/files и уметь их переигрывать или хотя бы инспектировать постфактум. Для open-версии достаточно локального file-based или SQLite-backed режима.[^2][^3]
- **8. Observability dashboard.**
Минимум: runs, failures, approvals, policy denials, latency, token/cost, success rate, drift alerts. Public edition без обзора состояния быстро превращается в black box.[^4][^3]
- **9. Human override / rollback.**
Обязательна «красная кнопка»: pause, revoke, reroute to HITL, rollback last execution или mark-as-invalid. Без этого ты не выполняешь своё own promise как fail-closed system.[^7][^1][^6]
- **10. Portable packaging.**
Self-hosted install, Docker Compose, локальный режим, CLI + web UI, нормальные example flows и sample policies. Для бесплатного публичного распространения это критично: friction убивает adoption сильнее, чем отсутствие enterprise-фич.[^10][^6]


## Что не обязательно включать в public core

Вот что **не обязательно** тащить в первую публичную free-версию, даже если это есть у вас внутри:

- Neo4j / сложный Graph Brain как обязательную зависимость — рынок всё чаще строит governance вокруг policy + trace + eval, а не вокруг graph-first memory.[^3][^4]
- Узкоспециализированные marketing-only North Stars — public core должен быть domain-agnostic, а маркетинговые пакеты можно дать как templates.[^2]
- Сложный multi-agent swarm orchestration — для open-core достаточно 1–3 типовых agent roles и стандартного handoff.[^11]
- Тяжёлые enterprise функции: SSO/SAML, tenant billing, cryptographic attestations по умолчанию, хотя verifiable identity уже становится сильным направлением для advanced tier.[^8][^12]


## Минимальная сборка Borscht Public

Если собрать в один список, **necessary \& sufficient public build** для Borscht выглядит так:


| Блок | Обязателен | Зачем |
| :-- | :-- | :-- |
| Decision loop (`Signal → Triage → Decision → Execution → Evidence`) | Да | Это сам продукт, а не набор кусочков.[^1][^2] |
| Policy engine | Да | Governance без enforcement не работает.[^6][^8] |
| Roles / ownership / approvals | Да | Нужна подотчётность и HITL-модель.[^9][^10] |
| Audit trail / trace store | Да | Нужна объяснимость и доказуемость.[^3][^4] |
| Eval gates | Да | Иначе качество ломается уже в проде.[^4] |
| Execution harness | Да | Без действия нет business value.[^5][^6] |
| Rollback / override | Да | Это core trust layer.[^1][^7] |
| Basic observability UI | Да | Пользователь должен видеть состояние системы.[^3] |
| Local/self-hosted packaging | Да | Иначе free distribution не взлетит.[^6][^10] |
| Graph Brain advanced projection | Нет | Можно оставить optional adapter. |
| Вертикальные marketing templates | Нет, но желательно | Ускоряют adoption у ваших клиентов. |

## Принцип упаковки

Самый важный архитектурный принцип: **public edition должна быть complete, а не huge**. То есть не «всё, что умеет Borscht», а «всё, что нужно, чтобы Borscht был Borscht». Правильная open-версия — это маленькая, но законченная система с полным циклом и строгими контрактами; enterprise-монетизация потом строится не на отключённых функциях, а на удобстве: hosted control plane, managed connectors, verified packs, enterprise auth, premium templates, SLA и support.[^12][^6][^2]

Для Borscht я бы сформулировал это так: **если из public edition убрать decision loop, policy enforcement, trace, eval или rollback — это уже не Borscht; всё остальное может быть optional.**[^1][^4]

## Практический тест достаточности

Проверь public build по 5 вопросам:

- Может ли новый пользователь за 30–60 минут поставить систему локально и прогнать один реальный workflow end-to-end?[^6]
- Может ли он понять, **почему** система разрешила или заблокировала действие?[^8][^3]
- Может ли он увидеть полный trace и evidence после выполнения?[^4][^3]
- Может ли он безопасно дать агенту часть автономии и потом остановить/откатить её?[^7][^6]
- Может ли он заменить домен-шаблон, не переписывая платформу целиком?[^2]

Если ответ «да» на всё пять — это уже достаточная public версия.

Хочешь, я следующим сообщением соберу это в виде **конкретного состава Borscht Public Edition v1**: папки, модули, UI-экраны, CLI-команды и что именно оставить open, а что монетизировать сверху?
<span style="display:none">[^13][^14][^15][^16][^17]</span>

<div align="center">⁂</div>

[^1]: https://www.perplexity.ai/search/d1621f4e-ebb0-437a-a156-dbd67a068660

[^2]: https://www.perplexity.ai/search/4c748184-9c76-4193-b6e8-ba2c718a4b30

[^3]: https://atlan.com/know/ai-agent-observability/

[^4]: https://www.kmsitc.net/insights/agent-evaluation-loop-2026

[^5]: https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/

[^6]: https://www.globenewswire.com/news-release/2026/03/11/3253962/0/en/Galileo-Releases-Open-Source-AI-Agent-Control-Plane-to-Help-Enterprises-Govern-Agents-at-Scale.html

[^7]: https://techcommunity.microsoft.com/blog/linuxandopensourceblog/governing-ai-agents-against-every-owasp-agentic-risk-a-deep-dive-with-the-agent-/4523749

[^8]: https://www.reddit.com/r/LLMDevs/comments/1rjj1bg/we_opensourced_a_governance_spec_for_ai_agents/

[^9]: https://www.reddit.com/r/cybersecurity/comments/1s4azxv/open_source_governance_layer_for_ai_agent_actions/

[^10]: https://microsoft.github.io/agent-governance-toolkit/packages/agent-os/

[^11]: https://www.opensourceforu.com/2026/06/built-your-agentic-workflow-now-what/

[^12]: https://finance.yahoo.com/technology/ai/articles/opaque-extends-agent-governance-toolkit-164500252.html

[^13]: https://openagentgovernance.org

[^14]: https://www.digitalapplied.com/blog/agent-governance-framework-policy-compliance-access

[^15]: https://opendigitalproductfactory.com/architecture/2026-04-18-trusted-ai-agent-governance-white-paper/

[^16]: https://github.com/systempromptio/awesome-ai-agent-governance

[^17]: https://agenticcontrolplane.com/blog/microsoft-agent-governance-toolkit-coverage

