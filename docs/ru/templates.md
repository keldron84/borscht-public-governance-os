# Шаблоны

Шаблон описывает процесс: его риск по умолчанию, **действия** (`actions`),
которые он намерен выполнить (используются движком политик), требуемые tool
scopes и план выполнения.

## Поставляемые шаблоны

| Шаблон | Риск | Подтверждение | Действия |
|--------|------|---------------|----------|
| `marketing-review` | P1 | да | analysis, content_publish |
| `spend-approval` | P1 | да | analysis, spend_increase |
| `content-publish` | P1 | да | draft, external_publish |
| `client-change-request` | P1 | да | analysis, data_mutation |
| `incident-postmortem` | P2 | нет | analysis, summary |
| `blank` | P2 | нет | analysis |

## Формат шаблона

```json
{
  "id": "marketing-review",
  "name": "Marketing review",
  "description": "...",
  "risk_class": "P1",
  "actions": ["analysis", "content_publish"],
  "tool_scopes": ["markdown_export"],
  "tags": ["marketing", "publish"],
  "requires_approval_hint": true,
  "signal_fields": ["text", "url"],
  "execution_plan": [
    { "action": "analysis", "title": "Marketing review notes" },
    { "action": "content_publish", "title": "Publish reviewed asset" }
  ]
}
```

> Поля `id` / `actions` / `tool_scopes` — машинные токены и остаются на
> английском. Для русского пользователя локализуются подписи интерфейса, статусы
> и сгенерированный контент, а не идентификаторы действий (от них зависит
> срабатывание гейтов политик).

## Установка своего шаблона

```bash
borscht import-template path/to/template.json
```

Пользовательские шаблоны сохраняются в `data/installed_templates.json`. Поле
`actions` связывает шаблон с governance — выбирайте имена действий, которые
распознают ваши пакеты политик, чтобы срабатывали нужные гейты.
