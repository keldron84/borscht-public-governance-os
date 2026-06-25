import React from "react";
import { api } from "./api";

export type Lang = "en" | "ru";
export const SUPPORTED: Lang[] = ["en", "ru"];
const STORAGE_KEY = "borscht_lang";

type Dict = Record<string, string>;

const en: Dict = {
  // shell / nav
  "brand.subtitle": "Public Edition · control plane",
  "sidebar.pipeline": "Signal → Triage → Decision → Execution → Evidence",
  "nav.overview": "Overview",
  "nav.runs": "Runs",
  "nav.approvals": "Approvals",
  "nav.policies": "Policies",
  "nav.observability": "Observability",
  "nav.evaluations": "Evaluations",
  "nav.templates": "Templates",
  "nav.settings": "Settings",
  "top.search": "Search runs (id or text)…",
  "top.newRun": "+ New Run",
  "top.pauseTitle": "Emergency pause: blocks new runs",
  "top.paused": "Paused",
  "top.pauseAll": "Pause all",
  "lang.label": "Language",
  // shared
  "common.loading": "Loading…",
  "common.error": "Error",
  "common.none": "none",
  "common.dash": "—",
  "common.back": "Back",
  "common.next": "Next",
  // status labels
  "status.draft": "draft",
  "status.queued": "queued",
  "status.running": "running",
  "status.awaiting_approval": "awaiting approval",
  "status.blocked_by_policy": "blocked by policy",
  "status.succeeded": "succeeded",
  "status.failed": "failed",
  "status.rolled_back": "rolled back",
  "status.waived": "waived",
  // effect labels
  "effect.allow": "allow",
  "effect.deny": "deny",
  "effect.require_approval": "require approval",
  // Overview
  "ov.title": "Overview",
  "ov.subtitle": "Operational front door. Is the system healthy, what needs attention, where to click next.",
  "ov.runDemo": "Run demo workflow",
  "ov.pauseBanner": "Emergency pause is active — new runs are blocked.",
  "ov.emptyTitle": "Install a template and run your first governed workflow.",
  "ov.emptyHint": "Start with the marketing-review demo to see policy, approval, execution, evidence and trace.",
  "ov.newRun": "New Run",
  "ov.kpi.active": "Active runs",
  "ov.kpi.awaiting": "Awaiting approvals",
  "ov.kpi.blocked": "Blocked by policy",
  "ov.kpi.success": "Success rate",
  "ov.attention": "Needs attention",
  "ov.attentionEmpty": "Nothing needs human review.",
  "ov.recent": "Recent activity",
  "ov.allRuns": "All runs →",
  // NewRun
  "nr.title": "New Run",
  "nr.subtitle": "Think in terms of which case you are running and what you feed in — not internal architecture.",
  "nr.step.choose": "Choose workflow",
  "nr.step.signal": "Provide signal",
  "nr.step.context": "Assign context",
  "nr.step.confirm": "Confirm",
  "nr.mayNeedApproval": "may need approval",
  "nr.signalFor": "Signal for {name}",
  "nr.context": "Context",
  "nr.owner": "Owner (holds the risk)",
  "nr.riskClass": "Risk class",
  "nr.risk.p0": "P0 — destructive / secrets / outbound external",
  "nr.risk.p1": "P1 — spend / publish / data mutation",
  "nr.risk.p2": "P2 — low-risk internal",
  "nr.confirm": "Confirm",
  "nr.workflow": "Workflow",
  "nr.intendedActions": "Intended actions",
  "nr.approvalPath": "Expected approval path",
  "nr.starting": "Starting…",
  "nr.startRun": "Start Run",
  // Runs
  "runs.title": "Runs",
  "runs.subtitle": "One operational inbox for every case. Sorted by what needs attention first.",
  "runs.filter.all": "All",
  "runs.filter.awaiting": "Awaiting approval",
  "runs.filter.blocked": "Blocked",
  "runs.filter.failed": "Failed",
  "runs.filter.succeeded": "Succeeded",
  "runs.filter.rolled_back": "Rolled back",
  "runs.emptyTitle": "No runs yet.",
  "runs.emptyHint": "Create your first governed run.",
  "runs.col.run": "Run",
  "runs.col.workflow": "Workflow",
  "runs.col.status": "Status",
  "runs.col.owner": "Owner",
  "runs.col.risk": "Risk",
  "runs.col.verdict": "Verdict",
  "runs.col.evidence": "Evidence",
  "runs.col.updated": "Updated",
  // RunDetail
  "rd.tab.summary": "Summary",
  "rd.tab.trace": "Trace",
  "rd.tab.policy": "Policy",
  "rd.tab.evidence": "Evidence",
  "rd.tab.actions": "Actions",
  "rd.backRuns": "← Runs",
  "rd.whyVerdict": "Why this verdict",
  "rd.taskContract": "Task contract",
  "rd.signal": "Signal",
  "rd.timeline": "Timeline",
  "rd.rulesEvaluated": "Rules evaluated",
  "rd.noRules": "No policy rules matched.",
  "rd.col.severity": "Severity",
  "rd.col.pack": "Pack",
  "rd.col.rule": "Rule",
  "rd.col.effect": "Effect",
  "rd.col.reason": "Reason",
  "rd.inactive": "(inactive)",
  "rd.noEvidence": "No evidence yet.",
  "rd.approve": "Approve",
  "rd.reject": "Reject",
  "rd.hold": "Hold",
  "rd.waive": "Waive policy",
  "rd.retry": "Retry",
  "rd.rollback": "Rollback",
  "rd.exportJson": "Export JSON",
  "rd.state": "State",
  "rd.verdict": "Verdict",
  "rd.risk": "Risk",
  "rd.owner": "Owner",
  "rd.approver": "Approver",
  "rd.toolScopes": "Tool scopes",
  "rd.needsYou": "Needs you",
  "rd.waitingApproval": "This run is waiting for approval.",
  "rd.rejectedFromUi": "Rejected from UI",
  "rd.waivedFromUi": "Waived from UI",
  "rd.rolledBackFromUi": "Rolled back from UI",
  // Approvals
  "ap.title": "Approvals Inbox",
  "ap.subtitle": "Human-in-the-loop, fast and transparent. Every item explains why approval is required.",
  "ap.emptyTitle": "Nothing needs human review.",
  "ap.emptyHint": "Approval-gated runs will appear here.",
  "ap.col.run": "Run",
  "ap.col.risk": "Risk",
  "ap.col.owner": "Owner",
  "ap.col.waiting": "Waiting since",
  "ap.detail": "Approval detail",
  "ap.workflow": "Workflow",
  "ap.openDetail": "Open run detail →",
  "ap.selectRun": "Select a run to review.",
  // Policies
  "pol.title": "Policies",
  "pol.subtitle": "Change the rules without fear of breaking the system. Toggle packs, then simulate.",
  "pol.pack": "Policy pack",
  "pol.status": "Status",
  "pol.active": "Active",
  "pol.inactive": "Inactive",
  "pol.col.severity": "Severity",
  "pol.col.rule": "Rule",
  "pol.col.effect": "Effect",
  "pol.col.reason": "Reason",
  "pol.rawConfig": "Raw config (JSON)",
  "pol.packs": "Policy packs",
  "pol.off": "· off",
  "pol.simulation": "Simulation",
  "pol.workflow": "Workflow",
  "pol.signalText": "Signal text",
  "pol.risk": "Risk",
  "pol.simulate": "Simulate",
  "pol.result": "Result:",
  // Observability
  "obs.title": "Observability",
  "obs.subtitle": "System health and execution quality — operational, not decorative.",
  "obs.noData": "No data yet.",
  "obs.kpi.latency": "Avg approval latency",
  "obs.kpi.rollback": "Rollback events",
  "obs.kpi.succeeded": "Succeeded",
  "obs.kpi.failed": "Failed",
  "obs.volume": "Run volume (by day)",
  "obs.denials": "Denials by policy",
  "obs.statusBreakdown": "Status breakdown",
  "obs.topFailing": "Top failing workflows",
  "obs.noFailures": "No failures.",
  // Evaluations
  "ev.title": "Evaluations",
  "ev.subtitle": "Confidence that the system can be updated without breaking. Can we release, or not — and why.",
  "ev.run": "Run eval suite",
  "ev.running": "Running…",
  "ev.safe": "Safe to release — {passed}/{total} passed ({rate}%).",
  "ev.unsafe": "Do not release — {failed} failing, {blocking} blocking.",
  "ev.blocking": "· blocking",
  "ev.passedOf": "{passed}/{total} passed",
  "ev.col.case": "Case",
  "ev.col.workflow": "Workflow",
  "ev.col.expected": "Expected",
  "ev.col.actual": "Actual",
  "ev.col.result": "Result",
  "ev.pass": "PASS",
  "ev.fail": "FAIL",
  // Templates
  "tpl.title": "Templates",
  "tpl.subtitle": "Onboarding engine — installed workflow packs that get you to first value fast.",
  "tpl.actions": "Actions",
  "tpl.approval": "Approval",
  "tpl.likely": "likely required",
  "tpl.notRequired": "not required",
  "tpl.use": "Use template",
  "tpl.blank.name": "Blank workflow",
  "tpl.blank.desc": "Start from scratch: provide a signal and let policy decide.",
  "tpl.marketing-review.name": "Marketing review",
  "tpl.marketing-review.desc": "Review a marketing asset/campaign signal, then publish externally (approval-gated).",
  "tpl.client-change-request.name": "Client change request",
  "tpl.client-change-request.desc": "Process a client change request; data mutation requires approval.",
  "tpl.content-publish.name": "Content publish",
  "tpl.content-publish.desc": "Draft and publish content externally; approval-gated outbound action.",
  "tpl.incident-postmortem.name": "Incident postmortem",
  "tpl.incident-postmortem.desc": "Low-risk internal postmortem write-up; allowed without approval.",
  "tpl.spend-approval.name": "Spend increase request",
  "tpl.spend-approval.desc": "Request a budget/spend increase; requires human approval before applying.",
  "signal.text": "Text",
  "signal.url": "URL",
  "signal.amount": "Amount",
  // Settings
  "set.title": "Settings",
  "set.subtitle": "Essentials only. Frequently used controls live on the working screens, not here.",
  "set.save": "Save",
  "set.saved": "Settings saved.",
  "set.defaults": "Defaults",
  "set.defaultRisk": "Default risk class",
  "set.currentActor": "Current actor",
  "set.language": "Interface & content language",
  "set.providers": "Providers (optional)",
  "set.providersNote": "Public v1 runs deterministic triage by default. LLM keys are optional.",
  "set.llmProvider": "LLM provider",
  "set.llmKey": "LLM API key",
  "set.connectors": "Connectors",
  "set.httpAllowlist": "HTTP allowlist (comma-separated)",
  "set.shell": "Enable shell executor (sandboxed; off by default)",
  "set.safety": "Safety",
  "set.emergency": "Emergency pause — block all new runs",
  "set.webhook": "Notification webhook",
  // localized policy reasons (by rule id)
  "policy.reason.p0-secret-exfil": "Signal references secrets/credentials; outbound handling is denied (P0).",
  "policy.reason.p0-destructive-action": "Destructive tool requested without sandbox; denied by default (P0).",
  "policy.reason.p1-external-publish": "Action publishes/sends externally; human approval required before execution.",
  "policy.reason.p1-spend-increase": "Spend increase / budget mutation requires human approval (P1).",
  "policy.reason.p1-data-mutation": "Data mutation action requires human approval (P1).",
  "policy.reason.p1-high-risk-run": "Run is classified P0/P1 risk; human approval required before execution.",
  "policy.reason.p2-internal-allow": "Low-risk internal draft/analysis/summary; allowed.",
};

const ru: Dict = {
  "brand.subtitle": "Public Edition · пульт управления",
  "sidebar.pipeline": "Сигнал → Триаж → Решение → Выполнение → Evidence",
  "nav.overview": "Обзор",
  "nav.runs": "Прогоны",
  "nav.approvals": "Подтверждения",
  "nav.policies": "Политики",
  "nav.observability": "Наблюдаемость",
  "nav.evaluations": "Оценки",
  "nav.templates": "Шаблоны",
  "nav.settings": "Настройки",
  "top.search": "Поиск прогонов (id или текст)…",
  "top.newRun": "+ Новый прогон",
  "top.pauseTitle": "Аварийная пауза: блокирует новые прогоны",
  "top.paused": "Пауза",
  "top.pauseAll": "Остановить всё",
  "lang.label": "Язык",
  "common.loading": "Загрузка…",
  "common.error": "Ошибка",
  "common.none": "нет",
  "common.dash": "—",
  "common.back": "Назад",
  "common.next": "Далее",
  "status.draft": "черновик",
  "status.queued": "в очереди",
  "status.running": "выполняется",
  "status.awaiting_approval": "ждёт подтверждения",
  "status.blocked_by_policy": "заблокировано политикой",
  "status.succeeded": "успешно",
  "status.failed": "ошибка",
  "status.rolled_back": "откатано",
  "status.waived": "политика отменена",
  "effect.allow": "разрешить",
  "effect.deny": "запретить",
  "effect.require_approval": "нужно подтверждение",
  "ov.title": "Обзор",
  "ov.subtitle": "Операционная витрина. Здорова ли система, что требует внимания и куда нажать дальше.",
  "ov.runDemo": "Запустить демо-процесс",
  "ov.pauseBanner": "Аварийная пауза активна — новые прогоны заблокированы.",
  "ov.emptyTitle": "Установите шаблон и запустите первый управляемый процесс.",
  "ov.emptyHint": "Начните с демо marketing-review, чтобы увидеть политику, подтверждение, выполнение, evidence и трассировку.",
  "ov.newRun": "Новый прогон",
  "ov.kpi.active": "Активные прогоны",
  "ov.kpi.awaiting": "Ждут подтверждения",
  "ov.kpi.blocked": "Заблокированы политикой",
  "ov.kpi.success": "Доля успешных",
  "ov.attention": "Требует внимания",
  "ov.attentionEmpty": "Ничего не требует проверки человеком.",
  "ov.recent": "Недавняя активность",
  "ov.allRuns": "Все прогоны →",
  "nr.title": "Новый прогон",
  "nr.subtitle": "Думайте в терминах «какой кейс запускаю и что подаю на вход», а не о внутренней архитектуре.",
  "nr.step.choose": "Выбор процесса",
  "nr.step.signal": "Ввод сигнала",
  "nr.step.context": "Назначение контекста",
  "nr.step.confirm": "Подтверждение",
  "nr.mayNeedApproval": "может требовать подтверждения",
  "nr.signalFor": "Сигнал для «{name}»",
  "nr.context": "Контекст",
  "nr.owner": "Владелец (несёт риск)",
  "nr.riskClass": "Класс риска",
  "nr.risk.p0": "P0 — деструктивные / секреты / исходящие наружу",
  "nr.risk.p1": "P1 — расходы / публикация / изменение данных",
  "nr.risk.p2": "P2 — низкорисковые внутренние",
  "nr.confirm": "Подтверждение",
  "nr.workflow": "Процесс",
  "nr.intendedActions": "Намеченные действия",
  "nr.approvalPath": "Ожидаемый путь подтверждения",
  "nr.starting": "Запуск…",
  "nr.startRun": "Запустить прогон",
  "runs.title": "Прогоны",
  "runs.subtitle": "Единый операционный inbox для всех кейсов. Сверху — что требует внимания.",
  "runs.filter.all": "Все",
  "runs.filter.awaiting": "Ждут подтверждения",
  "runs.filter.blocked": "Заблокированы",
  "runs.filter.failed": "С ошибкой",
  "runs.filter.succeeded": "Успешные",
  "runs.filter.rolled_back": "Откатанные",
  "runs.emptyTitle": "Прогонов пока нет.",
  "runs.emptyHint": "Создайте первый управляемый прогон.",
  "runs.col.run": "Прогон",
  "runs.col.workflow": "Процесс",
  "runs.col.status": "Статус",
  "runs.col.owner": "Владелец",
  "runs.col.risk": "Риск",
  "runs.col.verdict": "Вердикт",
  "runs.col.evidence": "Артефакты",
  "runs.col.updated": "Обновлён",
  "rd.tab.summary": "Сводка",
  "rd.tab.trace": "Трассировка",
  "rd.tab.policy": "Политика",
  "rd.tab.evidence": "Evidence",
  "rd.tab.actions": "Действия",
  "rd.backRuns": "← Прогоны",
  "rd.whyVerdict": "Почему такой вердикт",
  "rd.taskContract": "Контракт задачи",
  "rd.signal": "Сигнал",
  "rd.timeline": "Хронология",
  "rd.rulesEvaluated": "Проверенные правила",
  "rd.noRules": "Ни одно правило политики не сработало.",
  "rd.col.severity": "Уровень",
  "rd.col.pack": "Пакет",
  "rd.col.rule": "Правило",
  "rd.col.effect": "Эффект",
  "rd.col.reason": "Причина",
  "rd.inactive": "(неактивно)",
  "rd.noEvidence": "Evidence пока нет.",
  "rd.approve": "Подтвердить",
  "rd.reject": "Отклонить",
  "rd.hold": "Удержать",
  "rd.waive": "Отменить политику",
  "rd.retry": "Повторить",
  "rd.rollback": "Откатить",
  "rd.exportJson": "Экспорт JSON",
  "rd.state": "Состояние",
  "rd.verdict": "Вердикт",
  "rd.risk": "Риск",
  "rd.owner": "Владелец",
  "rd.approver": "Кто подтвердил",
  "rd.toolScopes": "Доступы инструментов",
  "rd.needsYou": "Требуется ваше решение",
  "rd.waitingApproval": "Этот прогон ждёт подтверждения.",
  "rd.rejectedFromUi": "Отклонено из UI",
  "rd.waivedFromUi": "Политика отменена из UI",
  "rd.rolledBackFromUi": "Откатано из UI",
  "ap.title": "Входящие подтверждения",
  "ap.subtitle": "Человек в цикле — быстро и прозрачно. Каждый пункт объясняет, почему нужно подтверждение.",
  "ap.emptyTitle": "Ничего не требует проверки человеком.",
  "ap.emptyHint": "Прогоны с обязательным подтверждением появятся здесь.",
  "ap.col.run": "Прогон",
  "ap.col.risk": "Риск",
  "ap.col.owner": "Владелец",
  "ap.col.waiting": "Ждёт с",
  "ap.detail": "Детали подтверждения",
  "ap.workflow": "Процесс",
  "ap.openDetail": "Открыть детали прогона →",
  "ap.selectRun": "Выберите прогон для проверки.",
  "pol.title": "Политики",
  "pol.subtitle": "Меняйте правила без страха сломать систему. Включайте пакеты, затем симулируйте.",
  "pol.pack": "Пакет политик",
  "pol.status": "Статус",
  "pol.active": "Активен",
  "pol.inactive": "Неактивен",
  "pol.col.severity": "Уровень",
  "pol.col.rule": "Правило",
  "pol.col.effect": "Эффект",
  "pol.col.reason": "Причина",
  "pol.rawConfig": "Сырой конфиг (JSON)",
  "pol.packs": "Пакеты политик",
  "pol.off": "· выкл",
  "pol.simulation": "Симуляция",
  "pol.workflow": "Процесс",
  "pol.signalText": "Текст сигнала",
  "pol.risk": "Риск",
  "pol.simulate": "Симулировать",
  "pol.result": "Результат:",
  "obs.title": "Наблюдаемость",
  "obs.subtitle": "Здоровье системы и качество выполнения — операционно, без украшательств.",
  "obs.noData": "Данных пока нет.",
  "obs.kpi.latency": "Средняя задержка подтверждения",
  "obs.kpi.rollback": "Событий отката",
  "obs.kpi.succeeded": "Успешно",
  "obs.kpi.failed": "Ошибки",
  "obs.volume": "Объём прогонов (по дням)",
  "obs.denials": "Запреты по политикам",
  "obs.statusBreakdown": "Разбивка по статусам",
  "obs.topFailing": "Чаще всего падающие процессы",
  "obs.noFailures": "Сбоев нет.",
  "ev.title": "Оценки",
  "ev.subtitle": "Уверенность, что систему можно обновлять без поломок. Можно ли релизить — и почему.",
  "ev.run": "Запустить набор оценок",
  "ev.running": "Выполняется…",
  "ev.safe": "Можно релизить — пройдено {passed}/{total} ({rate}%).",
  "ev.unsafe": "Не релизить — провалов {failed}, блокирующих {blocking}.",
  "ev.blocking": "· блокирующий",
  "ev.passedOf": "пройдено {passed}/{total}",
  "ev.col.case": "Кейс",
  "ev.col.workflow": "Процесс",
  "ev.col.expected": "Ожидалось",
  "ev.col.actual": "Получено",
  "ev.col.result": "Результат",
  "ev.pass": "PASS",
  "ev.fail": "FAIL",
  "tpl.title": "Шаблоны",
  "tpl.subtitle": "Движок онбординга — установленные пакеты процессов для быстрого первого результата.",
  "tpl.actions": "Действия",
  "tpl.approval": "Подтверждение",
  "tpl.likely": "скорее всего нужно",
  "tpl.notRequired": "не требуется",
  "tpl.use": "Использовать шаблон",
  "tpl.blank.name": "Пустой процесс",
  "tpl.blank.desc": "С нуля: задайте сигнал и дайте политике принять решение.",
  "tpl.marketing-review.name": "Маркетинговый обзор",
  "tpl.marketing-review.desc": "Проверка маркетингового материала/кампании с последующей внешней публикацией (через подтверждение).",
  "tpl.client-change-request.name": "Запрос изменения от клиента",
  "tpl.client-change-request.desc": "Обработка запроса на изменение; мутация данных требует подтверждения.",
  "tpl.content-publish.name": "Публикация контента",
  "tpl.content-publish.desc": "Черновик и публикация контента наружу; исходящее действие через подтверждение.",
  "tpl.incident-postmortem.name": "Postmortem инцидента",
  "tpl.incident-postmortem.desc": "Низкорисковый внутренний postmortem; без обязательного подтверждения.",
  "tpl.spend-approval.name": "Запрос увеличения расходов",
  "tpl.spend-approval.desc": "Запрос на увеличение бюджета/расходов; требуется подтверждение человеком.",
  "signal.text": "Текст",
  "signal.url": "URL",
  "signal.amount": "Сумма",
  "set.title": "Настройки",
  "set.subtitle": "Только важное. Часто используемые элементы — на рабочих экранах, а не здесь.",
  "set.save": "Сохранить",
  "set.saved": "Настройки сохранены.",
  "set.defaults": "Значения по умолчанию",
  "set.defaultRisk": "Класс риска по умолчанию",
  "set.currentActor": "Текущий актор",
  "set.language": "Язык интерфейса и контента",
  "set.providers": "Провайдеры (опционально)",
  "set.providersNote": "Public v1 по умолчанию использует детерминированный триаж. Ключи LLM — опциональны.",
  "set.llmProvider": "Провайдер LLM",
  "set.llmKey": "API-ключ LLM",
  "set.connectors": "Коннекторы",
  "set.httpAllowlist": "HTTP allowlist (через запятую)",
  "set.shell": "Включить shell-исполнитель (в песочнице; по умолчанию выкл.)",
  "set.safety": "Безопасность",
  "set.emergency": "Аварийная пауза — блокировать все новые прогоны",
  "set.webhook": "Webhook уведомлений",
  "policy.reason.p0-secret-exfil": "Сигнал упоминает секреты/учётные данные; исходящая обработка запрещена (P0).",
  "policy.reason.p0-destructive-action": "Запрошен деструктивный инструмент без песочницы; запрещено по умолчанию (P0).",
  "policy.reason.p1-external-publish": "Действие публикует/отправляет наружу; нужно подтверждение человеком.",
  "policy.reason.p1-spend-increase": "Увеличение расходов/бюджета требует подтверждения человеком (P1).",
  "policy.reason.p1-data-mutation": "Изменение данных требует подтверждения человеком (P1).",
  "policy.reason.p1-high-risk-run": "Прогон классифицирован как риск P0/P1; нужно подтверждение человеком.",
  "policy.reason.p2-internal-allow": "Низкорисковый внутренний черновик/анализ/резюме; разрешено.",
};

const TABLES: Record<Lang, Dict> = { en, ru };

function detect(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;
  policyReason: (ruleId: string, fallback: string) => string;
  templateName: (id: string, fallback: string) => string;
  templateDesc: (id: string, fallback: string) => string;
  signalField: (field: string) => string;
}

const Ctx = React.createContext<I18nCtx | null>(null);

function interpolate(tpl: string, vars?: Record<string, string | number>): string {
  if (!vars) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(detect);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
    // sync to backend so generated content (artifacts/trace) matches
    api.saveSettings({ language: l }).catch(() => {});
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
    api.saveSettings({ language: lang }).catch(() => {});
    // run once on mount to align backend with detected language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = React.useCallback<Translate>(
    (key, vars) => {
      const table = TABLES[lang] || en;
      const tpl = table[key] ?? en[key] ?? key;
      return interpolate(tpl, vars);
    },
    [lang],
  );

  const policyReason = React.useCallback(
    (ruleId: string, fallback: string) => {
      const table = TABLES[lang] || en;
      return table["policy.reason." + ruleId] ?? fallback;
    },
    [lang],
  );

  const templateName = React.useCallback(
    (id: string, fallback: string) => {
      const table = TABLES[lang] || en;
      return table["tpl." + id + ".name"] ?? en["tpl." + id + ".name"] ?? fallback;
    },
    [lang],
  );

  const templateDesc = React.useCallback(
    (id: string, fallback: string) => {
      const table = TABLES[lang] || en;
      return table["tpl." + id + ".desc"] ?? en["tpl." + id + ".desc"] ?? fallback;
    },
    [lang],
  );

  const signalField = React.useCallback(
    (field: string) => {
      const key = "signal." + field;
      const table = TABLES[lang] || en;
      return table[key] ?? en[key] ?? field;
    },
    [lang],
  );

  const value = React.useMemo<I18nCtx>(
    () => ({ lang, setLang, t, policyReason, templateName, templateDesc, signalField }),
    [lang, setLang, t, policyReason, templateName, templateDesc, signalField],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT(): Translate {
  return useI18n().t;
}
