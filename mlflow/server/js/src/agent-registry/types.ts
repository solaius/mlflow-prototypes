/**
 * Entity types for the Agent Registry prototype, mirroring RFC-0011 (mlflow/rfcs PR #39,
 * draft, design positions as of 2026-09-03) -- the third registry after MCP servers
 * (RFC-0004, merged) and skills (RFC-0008, merged), following the same two-tier
 * `Entity` + `VersionEntity` shape both use.
 *
 * The design positions this file encodes, each stated in the RFC:
 *
 *   Record-level, not runtime-aware.  Nothing here says whether an agent is running.
 *   Immutable versions.               An `AgentVersionEntity` is a snapshot of composition
 *                                     (the bill of materials) plus definitional anchors.
 *   Cards are fetched, not stored.    No `agent_card` field. An A2A card lives at the
 *                                     endpoint, and the UI fetches it through a binding.
 *   Endpoints are access bindings.    Mutable, protocol-typed records targeting a version
 *                                     or alias -- never fields on a version.
 *   Agents anchor traces and evals.   One default experiment per AGENT; the version is
 *                                     metadata on every trace and evaluation run.
 *
 * Scope note, as for the sibling registries: this models the upstream RFC only. Runtime
 * state, deployment, sync glue, shadow-agent detection, notifications and cost attribution
 * are the RFC's own out-of-scope list; `RuntimeBoundaryPanel` states it in the UI.
 */

import type { RegistryIcon } from '../common/components/RegistryIcon';
import type { SkillTag, SkillVersionSource } from '../skills-registry/types';

/** `draft -> active <-> deprecated -> deleted`: the core lifecycle the MCP and skill registries use, applied to the agent. */
export enum AgentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  DELETED = 'deleted',
}

/**
 * Per-agent version identity, chosen when the agent is created. `monotonic` is the
 * default: no standard agent artifact defines an inherent version, so registrants who
 * never think about versioning get serial numbers. An agent that already carries its own
 * versioning (a provider-versioned A2A agent) can keep it with `semver` or `freeform`.
 */
export enum AgentVersionScheme {
  MONOTONIC = 'monotonic',
  SEMVER = 'semver',
  FREEFORM = 'freeform',
}

/**
 * What a binding's URL speaks. Limited to values that tell a caller something actionable:
 * `a2a` and `mcp` are self-describing (an Agent Card at the well-known path; the MCP
 * handshake), so URL plus protocol is enough to connect. Everything else -- REST, gRPC, a
 * dashboard -- collapses into `other`, which records where an agent lives without claiming
 * MLflow can invoke it.
 */
export enum AgentBindingProtocol {
  A2A = 'a2a',
  MCP = 'mcp',
  OTHER = 'other',
}

/**
 * An approved endpoint for an agent, following RFC-0004's `MCPAccessBinding`: a separate
 * mutable record targeting a version OR an alias, created and deleted as connectivity
 * changes without touching version history. A binding that targets an alias follows the
 * alias as it moves.
 *
 * `experiment_id` is the RFC's proposal for deployments that override their trace
 * destination: recorded on the binding so overridden deployments stay findable from the
 * agent's page. It is a proposal rather than settled, and it is optional here.
 */
export interface AgentAccessBinding {
  id: string;
  organization: string;
  name: string;
  endpoint_url: string;
  protocol: AgentBindingProtocol;
  target_version?: string;
  target_alias?: string;
  experiment_id?: string;
  /** Free-text note for `other` bindings: how to reach the agent when the protocol does not say. */
  description?: string;
  created_by: string;
  last_updated_by?: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
}

/**
 * One typed source pointer. RFC-0011 allows a version to record SEVERAL -- the Git repo an
 * agent is built from and the OCI image it ships as -- diverging from RFC-0008's one source
 * per skill version, because agents have no defined content bundle to digest. The shape
 * itself is RFC-0008's, reused so the two registries render a pointer the same way.
 */
export type AgentSourcePointer = SkillVersionSource;

/**
 * An immutable configuration snapshot stored as a version artifact: the definitional
 * anchor for an agent that runs as a configuration of a packaged harness and has no source
 * repository of its own. Captures only configuration the registry does not otherwise
 * represent; content BOM references already govern stays out.
 */
export interface AgentConfigSnapshot {
  artifact_path: string;
  files: { path: string; size_bytes: number; content?: string }[];
}

/** The proposed harness axis: an external identifier, like an external model reference. */
export interface AgentHarnessRef {
  name: string;
  version?: string;
}

/** Registered skill, pinned to its integer version. `name` is the qualified `@org/name`. */
export interface SkillRef {
  name: string;
  version: number;
}

/** Registered agent plugin, pinned to its SemVer version. `name` is the qualified `@org/name`. */
export interface PluginRef {
  name: string;
  version: string;
}

/** Registered MCP server (reverse-DNS name), pinned to its SemVer version. */
export interface MCPServerRef {
  name: string;
  version: string;
}

/**
 * A model reference: a registry model (`models:/name/version`) when `version` is set, or an
 * external identifier such as `gpt-4o` when it is not. `provider` and `role` are
 * enrichment the agent registry carries for the composition view, not RFC fields.
 */
export interface ModelRef {
  name: string;
  version?: string;
  provider?: string;
  role?: string;
}

/**
 * Another agent this one calls. Pinned to a version when the referencing team controls the
 * callee (agents versioned and deployed together); name-level when the callee is
 * independently managed, since the referencing team does not control which version is
 * live. `name` is the qualified `@org/name`.
 */
export interface AgentRef {
  name: string;
  version?: string;
}

/** The bill of materials: soft references, valid whether or not the target is registered. */
export interface AgentBom {
  skills: SkillRef[];
  agent_plugins: PluginRef[];
  mcp_servers: MCPServerRef[];
  models: ModelRef[];
  agents: AgentRef[];
}

export const EMPTY_BOM: AgentBom = { skills: [], agent_plugins: [], mcp_servers: [], models: [], agents: [] };

/**
 * Whether a version's composition was declared at all. An interface-only record (an A2A
 * endpoint with no anchor) may leave it `undeclared`: the registry knows the agent's claim
 * surface, not its contents, and an absent BOM is recorded as undeclared rather than as an
 * empty dependency list, so blast-radius queries can say "12 more have undeclared
 * composition" instead of silently missing them.
 */
export type CompositionDeclaration = 'declared' | 'undeclared';

/** An auditable record of a lifecycle transition, with its actor (human or CI identity). */
export interface StatusTransition {
  from: AgentStatus;
  to: AgentStatus;
  timestamp: number;
  actor: string;
  /** Free-text reason, when the actor gave one (a deprecation advisory, a promotion note). */
  note?: string;
}

/** An immutable registered version: a BOM snapshot plus its definitional anchors. */
export interface AgentVersionEntity {
  organization: string;
  name: string;
  /** Per the agent's version scheme: `"3"`, `"2.0.0"`, or an opaque string. */
  version: string;
  status: AgentStatus;
  sources: AgentSourcePointer[];
  config_snapshot?: AgentConfigSnapshot;
  harness?: AgentHarnessRef;
  composition: CompositionDeclaration;
  bom: AgentBom;
  tags: SkillTag[];
  /** Aliases currently pointing at this specific version. */
  aliases: string[];
  status_history: StatusTransition[];
  created_by: string;
  last_updated_by?: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
}

/** A mutable, named pointer from an alias to a version. */
export interface AgentAlias {
  alias: string;
  version: string;
}

/**
 * The logical agent. Organization is a first-class field and part of the key, the same
 * treatment RFC-0008 gives skills and the one the hub settled on for agents: the A2A card
 * has no mechanism forcing global uniqueness the way MCP's reverse-DNS `server.json` name
 * does, so `@org/name` is the reference form.
 */
export interface AgentEntity {
  organization: string;
  name: string;
  /** Mutable MLflow-managed display name; seeded from a card's free-form name on A2A import. */
  display_name?: string;
  description: string;
  /** MLflow-managed presentation icons; seeded from a card's `iconUrl` on A2A import. */
  icons?: RegistryIcon[];
  version_scheme: AgentVersionScheme;
  /** The agent's one default experiment: where traces and evaluation runs land unless a deployment overrides it. */
  default_experiment_id: string;
  tags: SkillTag[];
  aliases: AgentAlias[];
  /** Derived from the latest-resolved version; absent when nothing resolves. */
  latest_version?: string;
  status?: AgentStatus;
  created_by: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
}

/** What a version is anchored on. Interface-only records carry no anchor at all. */
export type AgentAnchorKind = 'source' | 'config-snapshot' | 'source-and-config' | 'interface-only';

export const getAnchorKind = (version: Pick<AgentVersionEntity, 'sources' | 'config_snapshot'>): AgentAnchorKind => {
  const hasSource = version.sources.length > 0;
  const hasConfig = Boolean(version.config_snapshot);
  if (hasSource && hasConfig) {
    return 'source-and-config';
  }
  if (hasSource) {
    return 'source';
  }
  if (hasConfig) {
    return 'config-snapshot';
  }
  return 'interface-only';
};

/**
 * The A2A Agent Card, as FETCHED from an endpoint. Never persisted: the endpoint is the
 * card's system of record, and the UI renders it read-only by fetching through the binding
 * at view time, so what MLflow shows can never drift from what the agent serves.
 */
export interface A2AAgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  preferredTransport?: string;
  provider?: { organization: string; url?: string };
  version: string;
  documentationUrl?: string;
  iconUrl?: string;
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
    extendedAgentCard?: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: { id: string; name: string; description?: string; tags?: string[]; examples?: string[] }[];
  securitySchemes?: Record<string, { type: string; description?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** Span types in a trace execution tree. `SKILL` is RFC-0009's proposed addition. */
export type SpanType = 'AGENT' | 'LLM' | 'TOOL' | 'RETRIEVAL' | 'CHAIN' | 'SKILL';

export interface TraceSpan {
  span_id: string;
  name: string;
  span_type: SpanType;
  latency_ms: number;
  status: 'OK' | 'ERROR';
  model?: string;
  input_preview?: string;
  output_preview?: string;
  children: TraceSpan[];
}

/** A trace as the agent's experiment holds it, carrying the agent and version as metadata. */
export interface TraceSummary {
  trace_id: string;
  experiment_id: string;
  /** Qualified `@org/name`, recorded as trace metadata by `set_active_agent`. */
  agent: string;
  agent_version: string;
  timestamp: number;
  status: 'OK' | 'ERROR';
  latency_ms: number;
  span_count: number;
  input_preview: string;
  output_preview?: string;
  root_span?: TraceSpan;
}

/** An evaluation run, carrying the agent version it was scored against. */
export interface EvalRunSummary {
  run_id: string;
  experiment_id: string;
  agent: string;
  agent_version: string;
  dataset: string;
  case_count: number;
  timestamp: number;
  scorers: string[];
  scores: Record<string, number>;
}

/**
 * Splits `@{organization}/{name}` into its parts. Returns `undefined` for anything that
 * would not pass the same server-side validation, so callers can use it for live
 * create-form feedback.
 */
export const parseAgentQualifiedName = (qualifiedName: string): { organization: string; name: string } | undefined => {
  if (!qualifiedName.startsWith('@')) {
    return undefined;
  }
  const separator = qualifiedName.indexOf('/');
  if (separator === -1) {
    return undefined;
  }
  const organization = qualifiedName.slice(1, separator);
  const name = qualifiedName.slice(separator + 1);
  if (!organization || !name || name.includes('/')) {
    return undefined;
  }
  return { organization, name };
};
