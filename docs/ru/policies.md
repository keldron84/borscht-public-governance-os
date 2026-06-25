# Политики

Политики — это декларативные JSON-пакеты. Они **fail-closed**: при конфликте
правил побеждает самый сильный эффект (`deny > require_approval > allow`).

## Поставляемые пакеты

| Пакет | Уровень | Эффект | Срабатывает на |
|-------|---------|--------|----------------|
| `secret-safety` | P0 | deny | сигнал упоминает секреты/учётные данные; деструктивные инструменты |
| `external-publish` | P1 | require_approval | `external_publish`, `outbound_message`, `content_publish` |
| `spend-controls` | P1 | require_approval | `spend_increase`, `campaign_launch`, `budget_change` |
| `data-access` | P1 | require_approval | изменения данных; любой прогон P0/P1 |
| `tool-scopes` | P2 | allow | низкорисковые внутренние анализ/черновик/резюме |

## Формат правила

```json
{
  "id": "external-publish",
  "title": "External publish",
  "description": "...",
  "active": true,
  "rules": [
    {
      "id": "p1-external-publish",
      "severity": "P1",
      "scope": "action",
      "effect": "require_approval",
      "reason": "Action publishes/sends externally; human approval required.",
      "match": { "action_in": ["external_publish", "outbound_message"] }
    }
  ]
}
```

> `reason` в пакете хранится канонически (на английском). В UI и CLI причина
> локализуется по `id` правила (см. `policy.reason.<rule_id>` в словарях
> `apps/ui/src/i18n.tsx` и `packages/borscht/i18n.py`); при отсутствии перевода
> показывается `reason` из пакета.

## Условия match (логическое И всех присутствующих ключей)

- `always: true`
- `risk_class_in: ["P0","P1"]`
- `workflow_in: ["marketing-review"]`
- `action_in: ["external_publish"]`
- `tool_in: ["shell.destructive"]`
- `tag_in: ["client"]`
- `signal_contains_any: ["api_key","password"]`

## Редактирование

- Включайте/выключайте пакет на экране **Политики** (сохраняется в
  `data/policies.local.json`; поставляемые пакеты не мутируются).
- Добавить новый пакет: положите JSON-файл в `packages/borscht/policy/packs/`.
- **Симулируйте** перед доверием: Политики → Симуляция, либо
  `borscht policy check <workflow> --text "..."`.
