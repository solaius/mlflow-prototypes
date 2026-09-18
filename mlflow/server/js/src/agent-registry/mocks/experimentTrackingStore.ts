/**
 * What MLflow experiment tracking holds for an agent, under RFC-0011's positions: the agent
 * has ONE default experiment, and every trace and evaluation run in it carries the agent and
 * the version as metadata. The version is an analysis dimension, never a destination -- which
 * is what keeps monitoring an agent's behaviour across upgrades in one place and makes
 * per-version filtering a filter rather than a different experiment.
 *
 * The data is synthetic but structurally faithful: it is what `search_traces` over the
 * agent's experiment and the evaluation runs in it would return. Generated from a small
 * spec per agent version so the compare view has real deltas and a regression to show.
 */

import { AGENT_SEEDS } from './agentSeeds';
import { getAgentQualifiedName } from '../constants';
import type { EvalRunSummary, TraceSpan, TraceSummary } from '../types';

const REGISTRY_NOW = Date.UTC(2026, 7, 6, 9, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

interface VersionActivitySpec {
  agent: string;
  version: string;
  /** How many traces the version has accumulated. */
  traceCount: number;
  errorRate: number;
  latencyMs: number;
  /** Latest eval run's scores, when the version has been evaluated. */
  scores?: Record<string, number>;
  dataset?: string;
  inputs: string[];
}

const INCIDENT_INPUTS = [
  'Alert: KubePodCrashLooping in namespace payments, pod checkout-7f9c',
  'Alert: NodeNotReady on worker-3 in cluster prod-east',
  'Alert: etcd leader changes above threshold on prod-west',
  'Correlate the 09:12 deploy of inventory-svc with the 09:20 latency spike',
  'Draft the timeline for INC-4412',
];
const CVE_INPUTS = [
  'Assess RHSA-2026:3391 against our OpenShift 4.19 fleet',
  'Which repositories pin log4j-core below 2.25?',
  'Open remediation for CVE-2026-21873 in the payments-api chart',
];
const DEPLOY_INPUTS = [
  'Deploy granite-3.3-8b-instruct v3 on the A100 pool with vLLM',
  'Validate GPU capacity for a 70B model in ai-serving',
  'Roll back the InferenceService for embeddings to the previous revision',
];
const DEVEX_INPUTS = [
  'Scaffold a pipeline for github.com/acme/orders-svc',
  'Wire GitOps promotion from staging to prod for orders-svc',
  'Generate a Helm chart for the notifications service',
];
const PLATFORM_INPUTS = [
  'Review role bindings in namespace payments against the baseline',
  'Run the disk-cleanup playbook on the logging nodes',
  'Assemble the reliability report for week 31',
  'Page received: ArgoCD sync failed for platform-ingress; what changed?',
];
const TRAVEL_INPUTS = [
  'Book DUB to BOS for 14 October, return 18 October, within policy',
  'My 07:10 to FRA was cancelled; rebook me before the 14:00 meeting',
  'Is a hotel above the city cap reimbursable during the conference?',
];

const SPECS: VersionActivitySpec[] = [
  {
    agent: '@sre/incident-commander',
    version: '1.0.0',
    traceCount: 312,
    errorRate: 0.09,
    latencyMs: 1380,
    inputs: INCIDENT_INPUTS,
    dataset: 'incident-response-golden-set',
    scores: { correctness: 0.82, safety: 0.95, hallucination: 0.12, latency_p50: 1.4 },
  },
  {
    agent: '@sre/incident-commander',
    version: '1.2.0',
    traceCount: 587,
    errorRate: 0.07,
    latencyMs: 1560,
    inputs: INCIDENT_INPUTS,
    dataset: 'incident-response-golden-set',
    scores: { correctness: 0.71, safety: 0.93, hallucination: 0.18, latency_p50: 1.6 },
  },
  {
    agent: '@sre/incident-commander',
    version: '2.0.0',
    traceCount: 241,
    errorRate: 0.03,
    latencyMs: 1210,
    inputs: INCIDENT_INPUTS,
    dataset: 'incident-response-golden-set',
    scores: { correctness: 0.87, safety: 0.96, hallucination: 0.08, latency_p50: 1.2 },
  },
  {
    agent: '@sre/cve-remediation',
    version: '0.9.0',
    traceCount: 96,
    errorRate: 0.11,
    latencyMs: 2100,
    inputs: CVE_INPUTS,
    dataset: 'cve-advisory-set',
    scores: { correctness: 0.74, safety: 0.9, hallucination: 0.15 },
  },
  {
    agent: '@sre/cve-remediation',
    version: '1.0.0',
    traceCount: 188,
    errorRate: 0.04,
    latencyMs: 1890,
    inputs: CVE_INPUTS,
    dataset: 'cve-advisory-set',
    scores: { correctness: 0.85, safety: 0.94, hallucination: 0.09 },
  },
  {
    agent: '@ai-platform/model-deployer',
    version: '1.0.0',
    traceCount: 74,
    errorRate: 0.14,
    latencyMs: 3400,
    inputs: DEPLOY_INPUTS,
    dataset: 'serving-tasks',
    scores: { correctness: 0.69, tool_call_correctness: 0.72 },
  },
  {
    agent: '@ai-platform/model-deployer',
    version: '1.1.0',
    traceCount: 143,
    errorRate: 0.08,
    latencyMs: 2950,
    inputs: DEPLOY_INPUTS,
    dataset: 'serving-tasks',
    scores: { correctness: 0.78, tool_call_correctness: 0.81 },
  },
  {
    agent: '@ai-platform/model-deployer',
    version: '2.0.0',
    traceCount: 61,
    errorRate: 0.05,
    latencyMs: 2600,
    inputs: DEPLOY_INPUTS,
    dataset: 'serving-tasks',
    scores: { correctness: 0.84, tool_call_correctness: 0.88 },
  },
  {
    agent: '@devex/pipeline-builder',
    version: '1',
    traceCount: 129,
    errorRate: 0.06,
    latencyMs: 4100,
    inputs: DEVEX_INPUTS,
    dataset: 'pipeline-scaffolds',
    scores: { correctness: 0.8, safety: 0.97 },
  },
  {
    agent: '@devex/service-scaffolder',
    version: '2026.07',
    traceCount: 58,
    errorRate: 0.1,
    latencyMs: 5200,
    inputs: DEVEX_INPUTS,
    dataset: 'scaffold-templates',
    scores: { correctness: 0.72 },
  },
  {
    agent: '@devex/service-scaffolder',
    version: '2026.08',
    traceCount: 91,
    errorRate: 0.04,
    latencyMs: 4700,
    inputs: DEVEX_INPUTS,
    dataset: 'scaffold-templates',
    scores: { correctness: 0.83 },
  },
  {
    agent: '@platform/access-reviewer',
    version: '1',
    traceCount: 12,
    errorRate: 0.0,
    latencyMs: 2200,
    inputs: PLATFORM_INPUTS,
  },
  {
    agent: '@platform/automation-runner',
    version: '1',
    traceCount: 7,
    errorRate: 0.14,
    latencyMs: 6100,
    inputs: PLATFORM_INPUTS,
  },
  {
    agent: '@platform/report-generator',
    version: '1',
    traceCount: 203,
    errorRate: 0.02,
    latencyMs: 8800,
    inputs: PLATFORM_INPUTS,
    dataset: 'weekly-reports',
    scores: { correctness: 0.77 },
  },
  {
    agent: '@acme-travel/concierge',
    version: '4.11.2',
    traceCount: 44,
    errorRate: 0.05,
    latencyMs: 1900,
    inputs: TRAVEL_INPUTS,
    dataset: 'travel-policy-qa',
    scores: { correctness: 0.79, safety: 0.98 },
  },
  {
    agent: '@platform/oncall-helper',
    version: '1',
    traceCount: 167,
    errorRate: 0.06,
    latencyMs: 3300,
    inputs: PLATFORM_INPUTS,
    dataset: 'oncall-pages',
    scores: { correctness: 0.81, safety: 0.96 },
  },
  {
    agent: '@platform/oncall-helper',
    version: '2',
    traceCount: 9,
    errorRate: 0.0,
    latencyMs: 3050,
    inputs: PLATFORM_INPUTS,
    dataset: 'oncall-pages',
    scores: { correctness: 0.84, safety: 0.96 },
  },
];

/** Deterministic pseudo-random sequence, so the listing is stable across reloads and screenshots. */
const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const hashString = (value: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

const experimentIdFor = new Map(
  AGENT_SEEDS.map((seed) => [getAgentQualifiedName(seed.organization, seed.name), seed.experimentId]),
);

const rootSpan = (traceId: string, latencyMs: number, status: 'OK' | 'ERROR', input: string): TraceSpan => ({
  span_id: `${traceId}-root`,
  name: 'agent.run',
  span_type: 'AGENT',
  latency_ms: latencyMs,
  status,
  input_preview: input,
  children: [
    {
      span_id: `${traceId}-plan`,
      name: 'plan',
      span_type: 'LLM',
      latency_ms: Math.round(latencyMs * 0.35),
      status: 'OK',
      children: [],
    },
    {
      span_id: `${traceId}-skill`,
      name: 'skill.execute',
      span_type: 'SKILL',
      latency_ms: Math.round(latencyMs * 0.4),
      status,
      children: [
        {
          span_id: `${traceId}-tool`,
          name: 'tool.call',
          span_type: 'TOOL',
          latency_ms: Math.round(latencyMs * 0.25),
          status,
          children: [],
        },
      ],
    },
    {
      span_id: `${traceId}-answer`,
      name: 'answer',
      span_type: 'LLM',
      latency_ms: Math.round(latencyMs * 0.2),
      status: 'OK',
      children: [],
    },
  ],
});

/** The most recent traces per version, newest first. The count is capped so the tab stays a listing, not a dump. */
const RENDERED_TRACES_PER_VERSION = 8;

const buildTraces = (): TraceSummary[] => {
  const traces: TraceSummary[] = [];
  for (const spec of SPECS) {
    const random = seeded(hashString(`${spec.agent}@${spec.version}`));
    const experimentId = experimentIdFor.get(spec.agent) ?? '0';
    const rendered = Math.min(spec.traceCount, RENDERED_TRACES_PER_VERSION);
    for (let index = 0; index < rendered; index += 1) {
      const isError = random() < spec.errorRate;
      const latency = Math.round(spec.latencyMs * (0.6 + random() * 0.9));
      const traceId = `tr-${hashString(`${spec.agent}@${spec.version}#${index}`).toString(16)}`;
      const input = spec.inputs[Math.floor(random() * spec.inputs.length)];
      traces.push({
        trace_id: traceId,
        experiment_id: experimentId,
        agent: spec.agent,
        agent_version: spec.version,
        timestamp: REGISTRY_NOW - Math.round(random() * 6 * DAY_MS) - index * HOUR_MS,
        status: isError ? 'ERROR' : 'OK',
        latency_ms: latency,
        span_count: 5,
        input_preview: input,
        output_preview: isError ? undefined : 'Completed. Summary posted to the response channel.',
        root_span: rootSpan(traceId, latency, isError ? 'ERROR' : 'OK', input),
      });
    }
  }
  return traces.sort((a, b) => b.timestamp - a.timestamp);
};

const TRACES = buildTraces();

/**
 * Specs are listed oldest version first per agent, so an eval run's age follows its
 * position: the newest version was evaluated most recently. That keeps "latest eval" on the
 * summary card pointing at the version a reader expects.
 */
const evalAgeDays = (spec: VersionActivitySpec): number =>
  SPECS.filter((other) => other.agent === spec.agent && SPECS.indexOf(other) > SPECS.indexOf(spec)).length * 9 + 1;

const EVAL_RUNS: EvalRunSummary[] = SPECS.filter((spec) => spec.scores).map((spec) => ({
  run_id: `eval-${hashString(`${spec.agent}@${spec.version}`).toString(16)}`,
  experiment_id: experimentIdFor.get(spec.agent) ?? '0',
  agent: spec.agent,
  agent_version: spec.version,
  dataset: spec.dataset ?? 'default',
  case_count: 150,
  timestamp: REGISTRY_NOW - evalAgeDays(spec) * DAY_MS,
  scorers: Object.keys(spec.scores ?? {}).map((key) =>
    key.replace(/(^|_)(\w)/g, (_m, _p, c: string) => c.toUpperCase()),
  ),
  scores: spec.scores ?? {},
}));

/** Trace volume per version, as the summary card reports it. */
export const getAgentTraceVolume = (qualifiedAgentName: string, version?: string): number =>
  SPECS.filter(
    (spec) => spec.agent === qualifiedAgentName && (version === undefined || spec.version === version),
  ).reduce((total, spec) => total + spec.traceCount, 0);

/** `search_traces` over the agent's default experiment, optionally narrowed by the version metadata. */
export const getAgentTraces = (qualifiedAgentName: string, version?: string): TraceSummary[] =>
  TRACES.filter(
    (trace) => trace.agent === qualifiedAgentName && (version === undefined || trace.agent_version === version),
  );

/** Evaluation runs in the agent's experiment, newest first, optionally narrowed by version. */
export const getAgentEvalRuns = (qualifiedAgentName: string, version?: string): EvalRunSummary[] =>
  EVAL_RUNS.filter(
    (run) => run.agent === qualifiedAgentName && (version === undefined || run.agent_version === version),
  ).sort((a, b) => b.timestamp - a.timestamp);

/** The summary card: latest eval score and trace volume, over the whole agent. */
export const getAgentSummary = (
  qualifiedAgentName: string,
): { traceVolume: number; latestEval?: EvalRunSummary; errorRate?: number } => {
  const specs = SPECS.filter((spec) => spec.agent === qualifiedAgentName);
  const traceVolume = specs.reduce((total, spec) => total + spec.traceCount, 0);
  const weightedErrors = specs.reduce((total, spec) => total + spec.traceCount * spec.errorRate, 0);
  return {
    traceVolume,
    latestEval: getAgentEvalRuns(qualifiedAgentName)[0],
    errorRate: traceVolume ? weightedErrors / traceVolume : undefined,
  };
};

export const getExperimentName = (qualifiedAgentName: string) => `/agents/${qualifiedAgentName}`;
