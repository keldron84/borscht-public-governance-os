# Borscht Public Edition v1

> 🌐 **Язык / Language:** Русский (этот файл) · [English](README.md). Веб-UI и
> CLI автоматически определяют язык (английский / русский); переключить можно в
> **Настройках** либо флагом `--lang` / переменной `BORSCHT_LANG`.

Небольшой, но **полноценный** пульт управления (control plane) для governance
агентов. Не демо и не чат-песочница — локальная ОС для петли:

```
Сигнал → Триаж → Решение → Выполнение → Evidence
```

…с fail-closed governance (политики + подтверждения), аудит-следом (трассировка +
evidence), наблюдаемостью и eval-гейтами. Без внешних сервисов, без графовой БД,
без enterprise-джунглей. Просто пульт, который работает.

## Зачем

Ценность агентной системы — в **управляемом решении и петле evidence**, а не в
генерации. Borscht Public Edition даёт всю петлю целиком на вашей машине:
подключить сигнал, провести триаж, упереться в политику, получить вердикт,
подтвердить, выполнить, увидеть трассировку и откатить.

## Быстрый старт

```bash
# 1. Инициализировать локальные данные
python3 apps/cli/borscht init

# 2. Прогнать петлю целиком
python3 apps/cli/borscht run marketing-review --file examples/marketing-review/signal.json
python3 apps/cli/borscht approve <run-id>
python3 apps/cli/borscht trace  <run-id>

# 3. Eval-гейты
python3 apps/cli/borscht test

# 4. Веб-пульт (10 экранов)
./scripts/serve.sh   # → http://127.0.0.1:8799/
```

Полный разбор: [docs/ru/quickstart.md](docs/ru/quickstart.md).

## Что внутри

- **Engine** — один оркестратор для CLI + API + UI ([архитектура](docs/ru/architecture.md)).
- **Policy** — декларативные fail-closed пакеты P0/P1/P2 ([политики](docs/ru/policies.md)).
- **Identity** — акторы, роли, владение (каждое действие атрибутировано).
- **Runs** — явная машина состояний.
- **Execution** — ограниченные, но настоящие исполнители (shell по умолчанию выключен).
- **Evidence** — SQLite + JSON/markdown-файлы + append-only журнал событий.
- **Trace** — хронология решения.
- **Observe** — операционные метрики здоровья.
- **Eval** — golden / adversarial / policy-correctness гейты с вердиктом релиза.
- **Memory-lite** — recall по прошлым прогонам (без графовой БД).
- **Templates** — пакеты процессов ([шаблоны](docs/ru/templates.md)).
- **UI** — пульт на React 18 + Vite: Обзор, Новый прогон, Прогоны, Детали
  прогона, Подтверждения, Политики, Наблюдаемость, Оценки, Шаблоны, Настройки.

## Языки (i18n)

Системой могут полноценно пользоваться люди без английского — в v1 поставляются
**английский** и **русский**.

- **Web UI** определяет язык браузера; переключение — в верхней панели или в
  **Настройки → Язык интерфейса и контента**. Выбор хранится локально и
  синхронизируется с бэкендом.
- **CLI**: `borscht --lang ru run …` либо `export BORSCHT_LANG=ru`. Порядок:
  `--lang` / `BORSCHT_LANG` → настройка `language` → `en`.
- **Сгенерированный контент** (тела артефактов, текст шагов трассировки,
  пояснения) пишется на активном языке; причины политик локализуются при выводе.
- Добавить язык = добавить один словарь в `apps/ui/src/i18n.tsx` (UI) и
  `packages/borscht/i18n.py` (бэкенд), без новых зависимостей.

## CLI

```
borscht init | dev | run | approve | reject | hold | waive | retry
        | rollback | trace | runs | test | export | policy check | import-template
```

Глобальный флаг `--lang {en,ru}` доступен для всех команд.

## Стек

- Бэкенд: **только стандартная библиотека Python** (HTTP API, SQLite, JSON/JSONL).
- Фронтенд: **React 18 + Vite + TypeScript**.
- Упаковка: локальный CLI + `./scripts/serve.sh` + Docker Compose.

## Работает с любым агент-инструментом

Контрибьюторы могут использовать **Cursor**, **OpenAI Codex** или **Google
Antigravity** — проект содержит единый tool-agnostic гайд [`AGENTS.md`](AGENTS.md)
(читается всеми тремя) плюс тонкие шимы со ссылкой на него:
[`GEMINI.md`](GEMINI.md) для Antigravity и `.cursor/rules/` для Cursor. Команды
сборки, тестов и запуска используют стандартные `python3` / `npm`.

## Структура

```
apps/      ui (React)  ·  api (stdlib server)  ·  cli (borscht)
packages/borscht/  core policy identity runs execution evidence
                   trace observe eval memory_lite templates
examples/  marketing-review · spend-approval · content-publish
data/      runs · evidence · logs  (создаётся в рантайме, в .gitignore)
docs/      quickstart · architecture · policies · templates · specs/ · ru/
```

## Критерии готовности (v1)

Новый пользователь может локально и без созвона: создать прогон, понять, почему
он разрешён/заблокирован, пройти подтверждение, увидеть трассировку, получить
evidence, откатить, проверить здоровье системы и прогнать eval-набор. Всё это
работает в этой сборке.

## Лицензия

MIT — см. [LICENSE](LICENSE). Copyright (c) 2026 [Nikita Grigorovich](https://github.com/keldron84) and [Kirr Simakovs](https://github.com/kirr-simakovs).

## Авторы

- **Nikita Grigorovich**  
  [GitHub](https://github.com/keldron84) · [LinkedIn](https://www.linkedin.com/in/nikita-grigorovich/) · [nikita@borscht.mobi](mailto:nikita@borscht.mobi)

- **Kirr Simakovs**  
  [GitHub](https://github.com/kirr-simakovs) · [LinkedIn](https://www.linkedin.com/in/kirr-simakovs/) · [kired.simakov@gmail.com](mailto:kired.simakov@gmail.com)

См. также [AUTHORS](AUTHORS) и [CONTRIBUTORS.md](CONTRIBUTORS.md).
