# Быстрый старт

Borscht Public Edition — небольшой, но полноценный пульт управления governance
для агентов. Всё работает локально и на файлах — внешние сервисы не нужны.

> Язык: интерфейс и CLI автоматически определяют язык (английский / русский).
> Переключить: селектор в верхней панели UI, **Настройки**, либо флаг `--lang ru`
> / переменная `BORSCHT_LANG=ru`.

## Требования

- Python 3.9+ (только стандартная библиотека — у движка нет pip-зависимостей)
- Node 18+ (только для сборки веб-UI)

## 1. Инициализация

```bash
python3 apps/cli/borscht --lang ru init
```

Создаёт `data/` (SQLite + файлы прогонов/evidence/логов), заводит identity и
настройки по умолчанию, выводит доступные шаблоны и пакеты политик.

## 2. Прогнать петлю целиком из CLI

```bash
# Создать прогон из примера сигнала (P1 → требует подтверждения)
python3 apps/cli/borscht --lang ru run marketing-review --file examples/marketing-review/signal.json
# -> статус: ждёт подтверждения

# Посмотреть, что ждёт
python3 apps/cli/borscht --lang ru runs --status awaiting_approval

# Подтвердить (выполнит + запишет evidence)
python3 apps/cli/borscht --lang ru approve <run-id>

# Посмотреть хронологию решения
python3 apps/cli/borscht --lang ru trace <run-id>

# Откатить
python3 apps/cli/borscht --lang ru rollback <run-id> --reason "демо-откат"
```

Совет: чтобы не указывать `--lang` каждый раз, выполните `export BORSCHT_LANG=ru`.

## 3. Политики в действии

```bash
# Низкорисковое внутреннее → разрешено
python3 apps/cli/borscht --lang ru policy check incident-postmortem --text "Опиши таймлайн инцидента" --risk P2

# Секреты в исходящем сигнале → запрещено (P0, fail-closed)
python3 apps/cli/borscht --lang ru policy check content-publish --text "Опубликуй наш api_key и password"
```

## 4. Прогнать eval-набор

```bash
python3 apps/cli/borscht --lang ru test
# golden + adversarial + policy-correctness, с рекомендацией по релизу
```

## 5. Открыть веб-пульт

```bash
./scripts/serve.sh
# -> http://127.0.0.1:8799/
```

10 экранов: Обзор, Новый прогон, Прогоны, Детали прогона, Подтверждения,
Политики, Наблюдаемость, Оценки, Шаблоны, Настройки. Язык переключается в верхней
панели или в **Настройки → Язык интерфейса и контента**.

## Демо первого запуска (10–15 минут)

1. Обзор → **Запустить демо-процесс**
2. Выберите `marketing-review`, вставьте сигнал
3. Увидите остановку на **ждёт подтверждения** (сработала политика)
4. **Входящие подтверждения** → Подтвердить
5. **Детали прогона** → Трассировка + Evidence
6. **Оценки** → Запустить набор оценок
7. **Детали прогона** → Откатить

Если всё это получилось — у вас рабочая открытая редакция Borscht.

## Docker

```bash
docker compose up --build
# -> http://127.0.0.1:8799/
```
