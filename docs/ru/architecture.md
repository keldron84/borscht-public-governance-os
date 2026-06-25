# Архитектура

Borscht Public Edition — это **пульт управления (control plane)**, а не чат-
песочница. Ядро — одна петля, обёрнутая в fail-closed governance и аудит.

```
Сигнал → Триаж → Решение → Выполнение → Evidence
            │        │           │
         политика  подтвержд.  трассировка
```

## Петля (packages/borscht/core/engine.py)

Каждая команда CLI и каждый эндпоинт API проходят через один оркестратор
(`Engine`), поэтому поведение одинаково на всех поверхностях и всегда аудируемо.

1. **Сигнал** — вход получен, записан как первый шаг.
2. **Триаж** — строится контракт задачи, вспоминаются похожие прошлые прогоны
   (memory-lite).
3. **Решение** — оценка политики; разрешение fail-closed:
   `deny > require_approval > allow`.
   - `deny` → `blocked_by_policy`, вердикт `STOP`
   - `require_approval` → `awaiting_approval`, вердикт `HOLD`
   - `allow` → выполнение, вердикт `GO`
4. **Выполнение** — план шаблона прогоняется через ограниченный исполнитель.
5. **Evidence** — пишутся артефакты (markdown/json) + добавляется журнал событий.

## Модули (packages/borscht/)

| Модуль | Ответственность |
|--------|-----------------|
| `core` | Модели Run/Step/PolicyDecision/Evidence + движок |
| `policy` | Декларативные fail-closed пакеты правил (P0/P1/P2) |
| `identity` | Акторы, роли, владение |
| `runs` | Явная машина состояний (таблица переходов) |
| `execution` | Ограниченные исполнители (markdown/json/http/file/handoff; shell выкл.) |
| `evidence` | SQLite-метаданные + `data/runs/*.json` + `data/evidence/**` + журнал |
| `trace` | Построитель хронологии решения |
| `observe` | Операционные метрики (здоровье, не BI) |
| `eval` | Гейты golden / adversarial / policy-correctness |
| `memory_lite` | Локальный recall по прошлым прогонам (без графовой БД) |
| `templates` | Пакеты процессов (движок онбординга) |

> О раскладке: спецификация перечисляет `packages/core/`, `packages/policy/` и
> т.д. Python нужен корень пакета, поэтому они лежат под `packages/borscht/` и
> импортируются как `borscht.core`, `borscht.policy`, …

## Локализация (i18n)

- UI: словари в `apps/ui/src/i18n.tsx`, провайдер `I18nProvider`, хук `useT`.
  Язык определяется по браузеру / localStorage и синхронизируется с бэкендом.
- Бэкенд: `packages/borscht/i18n.py` — `t(key, **kwargs)`, язык из
  `BORSCHT_LANG` → настройки `language` → `en`. Контент артефактов и шагов
  трассировки локализуется в момент создания; машинные токены (коды статусов,
  вердикты, имена действий, id правил) остаются каноническими.

## Приложения

- `apps/api/server.py` — HTTP-сервер на stdlib Python: JSON API + отдача
  собранного SPA.
- `apps/cli/borscht` — CLI `borscht`.
- `apps/ui/` — пульт на React 18 + Vite + TypeScript (10 экранов).

## Хранилище (всё локально)

- `data/borscht.sqlite` — метаданные прогонов для быстрых запросов.
- `data/runs/<id>.json` — полный документ прогона (источник правды).
- `data/evidence/<id>/*` — артефакты.
- `data/logs/events.jsonl` — append-only журнал событий для воспроизведения.

## Машина состояний

```
draft → queued → running → {awaiting_approval, blocked_by_policy, succeeded, failed}
awaiting_approval → {running, succeeded, failed, waived}
blocked_by_policy → {awaiting_approval, running, waived, failed}
succeeded/failed/waived → rolled_back
```

## Сознательно не включено в v1

Neo4j / graph brain, enterprise SSO, мультитенантный биллинг, сложная swarm-
оркестрация. Public v1 **полон, но не огромен**: монетизация строится сверху
(хостинг пульта, командные пространства, премиум-пакеты, enterprise-auth), а не
урезанием функциональности.
