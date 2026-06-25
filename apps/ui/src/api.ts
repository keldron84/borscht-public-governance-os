// Typed client for the Borscht Public Edition API.

export type RunStatus =
  | "draft"
  | "queued"
  | "running"
  | "awaiting_approval"
  | "blocked_by_policy"
  | "succeeded"
  | "failed"
  | "rolled_back"
  | "waived";

export interface RunBrief {
  id: string;
  workflow: string;
  title: string;
  status: RunStatus;
  verdict: string;
  owner: string;
  risk_class: string;
  evidence_count: number;
  updated_at: string;
  created_at: string;
}

export interface PolicyDecision {
  rule_id: string;
  pack: string;
  severity: string;
  effect: string;
  reason: string;
  scope: string;
  matched: boolean;
  simulated: boolean;
  at: string;
}

export interface EvidenceItem {
  id: string;
  kind: string;
  title: string;
  path: string;
  preview: string;
  at: string;
}

export interface TimelineStep {
  index: number;
  id: string;
  name: string;
  actor: string;
  outcome: string;
  detail: string;
  at: string;
  duration_ms: number;
  raw: Record<string, unknown>;
}

export interface RunDetail extends RunBrief {
  signal: Record<string, unknown>;
  task_contract: string;
  explanation: string;
  approver: string;
  tags: string[];
  tool_scopes: string[];
  steps: TimelineStep[];
  policy_decisions: PolicyDecision[];
  evidence: EvidenceItem[];
  timeline: TimelineStep[];
  requires_approval: boolean;
}

export interface Overview {
  kpis: {
    active_runs: number;
    awaiting_approvals: number;
    blocked_by_policy: number;
    success_rate: number;
    total_runs: number;
    rolled_back: number;
  };
  attention: RunBrief[];
  status_counts: Record<string, number>;
  recent: RunBrief[];
  events: Array<Record<string, unknown>>;
  emergency_pause: boolean;
}

export interface PolicyRule {
  id: string;
  severity: string;
  effect: string;
  reason: string;
  scope: string;
  match: Record<string, unknown>;
}

export interface PolicyPack {
  id: string;
  title: string;
  description: string;
  active: boolean;
  rules: PolicyRule[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  risk_class: string;
  actions: string[];
  tool_scopes: string[];
  tags: string[];
  requires_approval_hint: boolean;
  execution_plan: Array<Record<string, unknown>>;
  signal_fields: string[];
}

export interface EvalResult {
  summary: {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    blocking_failures: number;
    release_recommendation: string;
  };
  packs: Array<{
    id: string;
    title: string;
    type: string;
    blocking: boolean;
    passed: number;
    total: number;
    cases: Array<{ id: string; workflow: string; expected: string; actual: string; ok: boolean }>;
  }>;
}

export interface Observability {
  run_volume: Array<Record<string, number | string>>;
  status_counts: Record<string, number>;
  verdict_counts: Record<string, number>;
  denials_by_policy: Record<string, number>;
  approvals_by_policy: Record<string, number>;
  avg_approval_latency_s: number;
  rollback_events: number;
  top_failing_workflows: Array<{ workflow: string; failures: number }>;
}

export interface Actor {
  id: string;
  name: string;
  kind: string;
  roles: string[];
}

export interface Settings {
  environment: string;
  language: string;
  current_actor: string;
  storage_path: string;
  default_risk_class: string;
  providers: Record<string, string>;
  connectors: { http_allowlist: string[]; shell_enabled: boolean };
  notifications: { webhook_url: string };
  emergency_pause: boolean;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error((data && (data.error || data.detail)) || `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  overview: () => http<Overview>("/api/overview"),
  runs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http<{ runs: RunBrief[] }>(`/api/runs${qs ? "?" + qs : ""}`);
  },
  run: (id: string) => http<RunDetail>(`/api/runs/${id}`),
  createRun: (body: Record<string, unknown>) =>
    http<RunDetail>("/api/runs", { method: "POST", body: JSON.stringify(body) }),
  runAction: (id: string, action: string, extra: Record<string, unknown> = {}) =>
    http<RunDetail>(`/api/runs/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, ...extra }),
    }),
  approvals: () => http<{ runs: RunBrief[] }>("/api/approvals"),
  policies: () => http<{ packs: PolicyPack[] }>("/api/policies"),
  togglePolicy: (id: string, active: boolean) =>
    http<{ ok: boolean; packs: PolicyPack[] }>(`/api/policies/${id}/toggle`, {
      method: "POST",
      body: JSON.stringify({ active }),
    }),
  simulatePolicy: (body: Record<string, unknown>) =>
    http<{ effect: string; decisions: PolicyDecision[] }>("/api/policies/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  observability: () => http<Observability>("/api/observability"),
  evaluations: () => http<EvalResult>("/api/evaluations"),
  templates: () => http<{ templates: WorkflowTemplate[] }>("/api/templates"),
  identity: () => http<{ actors: Actor[] }>("/api/identity"),
  settings: () => http<Settings>("/api/settings"),
  saveSettings: (body: Partial<Settings>) =>
    http<Settings>("/api/settings", { method: "POST", body: JSON.stringify(body) }),
};
