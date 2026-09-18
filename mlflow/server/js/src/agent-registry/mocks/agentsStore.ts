/**
 * Prototype-level session store for the Agent Registry, mirroring the skill and plugin
 * stores: seeds assembled once into module-level arrays, wrapped in `useSyncExternalStore`
 * so every screen shares a live view with no backend, reset on reload.
 *
 * What it enforces is RFC-0011's: a per-agent version scheme with monotonic numbers minted
 * by the registry, immutable versions (composition, anchors and sources never change after
 * creation), `draft` on registration, the auditable transition history, soft delete of
 * versions gated on unpublish-or-deprecate, bindings as separate mutable records, and the
 * agent's one default experiment.
 */
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { RegistryIcon } from '../../common/components/RegistryIcon';
import type { SkillTag } from '../../skills-registry/types';
import { getAgentQualifiedName } from '../constants';
import type {
  AgentAccessBinding,
  AgentBom,
  AgentConfigSnapshot,
  AgentEntity,
  AgentHarnessRef,
  AgentSourcePointer,
  AgentVersionEntity,
  StatusTransition,
} from '../types';
import type { AgentBindingProtocol } from '../types';
import { AgentStatus, AgentVersionScheme, EMPTY_BOM } from '../types';
import { normalizeVersionForScheme, resolveLatestAgentVersion } from '../utils';
import { AGENT_SEEDS } from './agentSeeds';
import type { AgentSeed } from './agentSeeds';

/** Fixed reference point so timestamps stay stable across runs: 2026-08-06T09:00:00Z. */
const REGISTRY_NOW = Date.UTC(2026, 7, 6, 9, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

let bindingSequence = 0;
const nextBindingId = () => {
  bindingSequence += 1;
  return `bnd-${bindingSequence.toString().padStart(4, '0')}`;
};

const buildAgent = (
  seed: AgentSeed,
): { agent: AgentEntity; versions: AgentVersionEntity[]; bindings: AgentAccessBinding[] } => {
  const versions: AgentVersionEntity[] = seed.versions.map((versionSeed) => {
    const registeredAt = REGISTRY_NOW - versionSeed.daysAgo * DAY_MS;
    const history: StatusTransition[] = [];
    let previous = AgentStatus.DRAFT;
    for (const event of versionSeed.history ?? []) {
      history.push({
        from: previous,
        to: event.to,
        timestamp: REGISTRY_NOW - event.daysAgo * DAY_MS,
        actor: event.actor,
        ...(event.note ? { note: event.note } : {}),
      });
      previous = event.to;
    }
    return {
      organization: seed.organization,
      name: seed.name,
      version: versionSeed.version,
      status: versionSeed.status,
      sources: versionSeed.sources,
      config_snapshot: versionSeed.configSnapshot,
      harness: versionSeed.harness,
      composition: versionSeed.bom ? 'declared' : 'undeclared',
      bom: { ...EMPTY_BOM, ...(versionSeed.bom ?? {}) },
      tags: versionSeed.tags ?? [],
      aliases: versionSeed.aliases,
      status_history: history,
      created_by: versionSeed.createdBy,
      last_updated_by: versionSeed.createdBy,
      creation_timestamp: registeredAt,
      last_updated_timestamp: history.length ? history[history.length - 1].timestamp : registeredAt,
    };
  });

  const latest = resolveLatestAgentVersion(seed.versionScheme, versions);
  const aliases = versions.flatMap((v) => v.aliases.map((alias) => ({ alias, version: v.version })));

  const agent: AgentEntity = {
    organization: seed.organization,
    name: seed.name,
    display_name: seed.displayName,
    description: seed.description,
    icons: seed.iconUrl ? [{ src: seed.iconUrl }] : undefined,
    version_scheme: seed.versionScheme,
    default_experiment_id: seed.experimentId,
    tags: seed.tags,
    aliases,
    latest_version: latest?.version,
    status: latest?.status,
    created_by: seed.createdBy,
    creation_timestamp: Math.min(...versions.map((v) => v.creation_timestamp)),
    last_updated_timestamp: Math.max(...versions.map((v) => v.last_updated_timestamp)),
  };

  const bindings: AgentAccessBinding[] = seed.bindings.map((bindingSeed) => {
    const { daysAgo, ...rest } = bindingSeed;
    const timestamp = REGISTRY_NOW - daysAgo * DAY_MS;
    return {
      id: nextBindingId(),
      organization: seed.organization,
      name: seed.name,
      ...rest,
      creation_timestamp: timestamp,
      last_updated_timestamp: timestamp,
    };
  });

  return { agent, versions, bindings };
};

const seeded = AGENT_SEEDS.map(buildAgent);

let agents: AgentEntity[] = seeded.map(({ agent }) => agent);
let agentVersions: AgentVersionEntity[] = seeded.flatMap(({ versions }) => versions);
let bindings: AgentAccessBinding[] = seeded.flatMap(({ bindings: entries }) => entries);
let experimentSequence = agents.length;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
};

const matches = (entity: { organization: string; name: string }, organization: string, name: string) =>
  entity.organization === organization && entity.name === name;

export const useAgentsStore = (): AgentEntity[] => useSyncExternalStore(subscribe, () => agents);
export const useAgentVersionsStore = (): AgentVersionEntity[] => useSyncExternalStore(subscribe, () => agentVersions);
export const useAgentBindingsStore = (): AgentAccessBinding[] => useSyncExternalStore(subscribe, () => bindings);

export const agentNameExists = (organization: string, name: string): boolean =>
  agents.some((agent) => matches(agent, organization.trim(), name.trim()));

export const agentVersionExists = (organization: string, name: string, version: string): boolean =>
  agentVersions.some((entry) => matches(entry, organization, name) && entry.version === version.trim());

export const getAgent = (organization: string, name: string): AgentEntity | undefined =>
  agents.find((agent) => matches(agent, organization, name));

/** Non-reactive read of the agent's latest-resolved version, for pre-filling the add-version form. */
export const getLatestAgentVersion = (organization: string, name: string): AgentVersionEntity | undefined => {
  const agent = getAgent(organization, name);
  if (!agent) {
    return undefined;
  }
  return resolveLatestAgentVersion(
    agent.version_scheme,
    agentVersions.filter((entry) => matches(entry, organization, name)),
  );
};

/** The next serial number under the monotonic scheme: one more than the highest ever allocated, deleted versions included. */
export const nextMonotonicVersion = (organization: string, name: string): string => {
  const highest = Math.max(
    ...agentVersions.filter((entry) => matches(entry, organization, name)).map((entry) => Number(entry.version) || 0),
    0,
  );
  return String(highest + 1);
};

const recomputeParent = (organization: string, name: string, timestamp = Date.now()) => {
  const agent = getAgent(organization, name);
  if (!agent) {
    return;
  }
  const forAgent = agentVersions.filter((entry) => matches(entry, organization, name));
  const latest = resolveLatestAgentVersion(agent.version_scheme, forAgent);
  const aliases = forAgent
    .filter((entry) => entry.status !== AgentStatus.DELETED)
    .flatMap((entry) => entry.aliases.map((alias) => ({ alias, version: entry.version })));
  agents = agents.map((entry) =>
    matches(entry, organization, name)
      ? {
          ...entry,
          latest_version: latest?.version,
          status: latest?.status,
          aliases,
          last_updated_timestamp: timestamp,
        }
      : entry,
  );
};

const normalizeTags = (tags?: SkillTag[]): SkillTag[] => {
  if (!tags?.length) {
    return [];
  }
  const byKey = new Map<string, string>();
  for (const tag of tags) {
    const key = tag.key.trim();
    if (key) {
      byKey.set(key, tag.value.trim());
    }
  }
  return [...byKey.entries()].map(([key, value]) => ({ key, value }));
};

/** The anchors and composition a version is registered with. */
export interface AgentVersionInput {
  sources: AgentSourcePointer[];
  configSnapshot?: AgentConfigSnapshot;
  harness?: AgentHarnessRef;
  /** Undefined means the registrant declared no composition (interface-only records only). */
  bom?: AgentBom;
  status: AgentStatus;
  tags?: SkillTag[];
  /** The endpoint given at registration: sugar for creating a binding. */
  endpoint?: { url: string; protocol: AgentBindingProtocol; description?: string };
}

export interface CreateAgentInput extends AgentVersionInput {
  organization: string;
  name: string;
  displayName?: string;
  description: string;
  icons?: RegistryIcon[];
  versionScheme: AgentVersionScheme;
  /** Required for semver and freeform; ignored for monotonic, which mints `1`. */
  version?: string;
}

const buildVersion = (
  organization: string,
  name: string,
  version: string,
  input: AgentVersionInput,
  now: number,
): AgentVersionEntity => ({
  organization,
  name,
  version,
  status: input.status,
  sources: input.sources,
  config_snapshot: input.configSnapshot,
  harness: input.harness,
  composition: input.bom ? 'declared' : 'undeclared',
  bom: input.bom ?? EMPTY_BOM,
  tags: normalizeTags(input.tags),
  aliases: [],
  status_history:
    input.status === AgentStatus.DRAFT
      ? []
      : [{ from: AgentStatus.DRAFT, to: input.status, timestamp: now, actor: 'you' }],
  created_by: 'you',
  last_updated_by: 'you',
  creation_timestamp: now,
  last_updated_timestamp: now,
});

/**
 * `register_agent`: creates the Agent (if new) and an AgentVersion. RFC-0011 registers the
 * version as `draft`; the form may ask for `active` instead, recorded as a transition.
 * An endpoint supplied here is sugar for creating a binding, and the A2A path creates an
 * `a2a` binding targeting the new version.
 */
export const createAgent = (input: CreateAgentInput): AgentEntity | undefined => {
  const organization = input.organization.trim();
  const name = input.name.trim();
  if (!name || agentNameExists(organization, name)) {
    return undefined;
  }
  const version =
    input.versionScheme === AgentVersionScheme.MONOTONIC
      ? '1'
      : normalizeVersionForScheme(input.versionScheme, input.version ?? '');
  if (!version) {
    return undefined;
  }
  const now = Date.now();
  experimentSequence += 1;

  agents = [
    {
      organization,
      name,
      display_name: input.displayName?.trim() || undefined,
      description: input.description.trim(),
      icons: input.icons?.length ? input.icons : undefined,
      version_scheme: input.versionScheme,
      default_experiment_id: String(experimentSequence),
      tags: [],
      aliases: [],
      created_by: 'you',
      creation_timestamp: now,
      last_updated_timestamp: now,
    },
    ...agents,
  ];
  agentVersions = [...agentVersions, buildVersion(organization, name, version, input, now)];
  if (input.endpoint?.url.trim()) {
    bindings = [
      ...bindings,
      {
        id: nextBindingId(),
        organization,
        name,
        endpoint_url: input.endpoint.url.trim(),
        protocol: input.endpoint.protocol,
        target_version: version,
        description: input.endpoint.description?.trim() || undefined,
        created_by: 'you',
        creation_timestamp: now,
        last_updated_timestamp: now,
      },
    ];
  }
  recomputeParent(organization, name, now);
  notify();
  return getAgent(organization, name);
};

export interface AddAgentVersionInput extends AgentVersionInput {
  organization: string;
  name: string;
  /** Required for semver and freeform; ignored for monotonic. */
  version?: string;
}

/** Registers a new immutable version on an existing agent. Each change to composition is a new version. */
export const addAgentVersion = (input: AddAgentVersionInput): AgentVersionEntity | undefined => {
  const agent = getAgent(input.organization, input.name);
  if (!agent) {
    return undefined;
  }
  const version =
    agent.version_scheme === AgentVersionScheme.MONOTONIC
      ? nextMonotonicVersion(input.organization, input.name)
      : normalizeVersionForScheme(agent.version_scheme, input.version ?? '');
  if (!version || agentVersionExists(input.organization, input.name, version)) {
    return undefined;
  }
  const now = Date.now();
  const created = buildVersion(input.organization, input.name, version, input, now);
  agentVersions = [...agentVersions, created];
  if (input.endpoint?.url.trim()) {
    bindings = [
      ...bindings,
      {
        id: nextBindingId(),
        organization: input.organization,
        name: input.name,
        endpoint_url: input.endpoint.url.trim(),
        protocol: input.endpoint.protocol,
        target_version: version,
        description: input.endpoint.description?.trim() || undefined,
        created_by: 'you',
        creation_timestamp: now,
        last_updated_timestamp: now,
      },
    ];
  }
  recomputeParent(input.organization, input.name, now);
  notify();
  return created;
};

/** Why a version cannot be deleted right now, or undefined when it can. The three reasons the skill registry names. */
export type AgentVersionDeleteBlocker = 'already-deleted' | 'is-active' | 'last-live-version';

export const getAgentVersionDeleteBlocker = (
  organization: string,
  name: string,
  version?: string,
): AgentVersionDeleteBlocker | undefined => {
  const forAgent = agentVersions.filter((entry) => matches(entry, organization, name));
  const target = version === undefined ? undefined : forAgent.find((entry) => entry.version === version);
  if (!target) {
    return undefined;
  }
  if (target.status === AgentStatus.DELETED) {
    return 'already-deleted';
  }
  if (target.status === AgentStatus.ACTIVE) {
    return 'is-active';
  }
  if (forAgent.filter((entry) => entry.status !== AgentStatus.DELETED).length <= 1) {
    return 'last-live-version';
  }
  return undefined;
};

export const canDeleteAgentVersion = (organization: string, name: string, version?: string): boolean =>
  getAgentVersionDeleteBlocker(organization, name, version) === undefined;

/**
 * Soft-deletes one version: the row stays with the terminal `deleted` status, its aliases
 * are dropped, bindings that targeted it by version are removed (a binding cannot point at
 * something the registry no longer returns), and the transition is recorded.
 */
export const deleteAgentVersion = (organization: string, name: string, version: string): void => {
  if (!canDeleteAgentVersion(organization, name, version)) {
    return;
  }
  const now = Date.now();
  agentVersions = agentVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? {
          ...entry,
          status: AgentStatus.DELETED,
          aliases: [],
          status_history: [
            ...entry.status_history,
            { from: entry.status, to: AgentStatus.DELETED, timestamp: now, actor: 'you' },
          ],
          last_updated_by: 'you',
          last_updated_timestamp: now,
        }
      : entry,
  );
  bindings = bindings.filter(
    (binding) => !(matches(binding, organization, name) && binding.target_version === version),
  );
  recomputeParent(organization, name, now);
  notify();
};

/** Deletes an agent, every version, and every binding. */
export const deleteAgent = (organization: string, name: string): void => {
  agents = agents.filter((agent) => !matches(agent, organization, name));
  agentVersions = agentVersions.filter((entry) => !matches(entry, organization, name));
  bindings = bindings.filter((binding) => !matches(binding, organization, name));
  notify();
};

/** Moves a version along the lifecycle and records the transition with its actor. */
export const setAgentVersionStatus = (
  organization: string,
  name: string,
  version: string,
  status: AgentStatus,
  note?: string,
): void => {
  const target = agentVersions.find((entry) => matches(entry, organization, name) && entry.version === version);
  if (!target || target.status === AgentStatus.DELETED || target.status === status) {
    return;
  }
  const now = Date.now();
  const transition: StatusTransition = {
    from: target.status,
    to: status,
    timestamp: now,
    actor: 'you',
    ...(note ? { note } : {}),
  };
  agentVersions = agentVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? {
          ...entry,
          status,
          status_history: [...entry.status_history, transition],
          last_updated_by: 'you',
          last_updated_timestamp: now,
        }
      : entry,
  );
  recomputeParent(organization, name, now);
  notify();
};

/** Sets the full alias list for one version; an alias claimed here moves off whichever version held it. */
export const setAgentVersionAliases = (
  organization: string,
  name: string,
  version: string,
  aliases: string[],
): void => {
  const target = agentVersions.find((entry) => matches(entry, organization, name) && entry.version === version);
  if (!target || target.status === AgentStatus.DELETED) {
    return;
  }
  const claimed = new Set(aliases);
  agentVersions = agentVersions.map((entry) => {
    if (!matches(entry, organization, name)) {
      return entry;
    }
    if (entry.version === version) {
      return { ...entry, aliases };
    }
    const remaining = entry.aliases.filter((alias) => !claimed.has(alias));
    return remaining.length === entry.aliases.length ? entry : { ...entry, aliases: remaining };
  });
  recomputeParent(organization, name);
  notify();
};

export const setAgentTag = (organization: string, name: string, key: string, value: string): void => {
  if (!key.trim()) {
    return;
  }
  agents = agents.map((agent) =>
    matches(agent, organization, name)
      ? {
          ...agent,
          tags: normalizeTags([...agent.tags, { key: key.trim(), value }]),
          last_updated_timestamp: Date.now(),
        }
      : agent,
  );
  notify();
};

export const deleteAgentTag = (organization: string, name: string, key: string): void => {
  agents = agents.map((agent) =>
    matches(agent, organization, name)
      ? { ...agent, tags: agent.tags.filter((tag) => tag.key !== key), last_updated_timestamp: Date.now() }
      : agent,
  );
  notify();
};

export const setAgentVersionTag = (
  organization: string,
  name: string,
  version: string,
  key: string,
  value: string,
): void => {
  if (!key.trim()) {
    return;
  }
  agentVersions = agentVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? {
          ...entry,
          tags: normalizeTags([...entry.tags, { key: key.trim(), value }]),
          last_updated_timestamp: Date.now(),
        }
      : entry,
  );
  notify();
};

export const deleteAgentVersionTag = (organization: string, name: string, version: string, key: string): void => {
  agentVersions = agentVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, tags: entry.tags.filter((tag) => tag.key !== key), last_updated_timestamp: Date.now() }
      : entry,
  );
  notify();
};

/** The agent's mutable MLflow-managed presentation metadata: description, display name, icons. */
export const updateAgent = (
  organization: string,
  name: string,
  changes: { description?: string; displayName?: string; icons?: RegistryIcon[] },
): void => {
  agents = agents.map((agent) =>
    matches(agent, organization, name)
      ? {
          ...agent,
          description: changes.description ?? agent.description,
          display_name:
            changes.displayName === undefined ? agent.display_name : changes.displayName.trim() || undefined,
          icons: changes.icons === undefined ? agent.icons : changes.icons.length ? changes.icons : undefined,
          last_updated_timestamp: Date.now(),
        }
      : agent,
  );
  notify();
};

export interface BindingInput {
  endpoint_url: string;
  protocol: AgentBindingProtocol;
  target_version?: string;
  target_alias?: string;
  experiment_id?: string;
  description?: string;
}

/** `create_agent_access_binding`: a mutable record beside the immutable versions. */
export const createAgentBinding = (
  organization: string,
  name: string,
  input: BindingInput,
): AgentAccessBinding | undefined => {
  if (!getAgent(organization, name) || !input.endpoint_url.trim()) {
    return undefined;
  }
  const now = Date.now();
  const binding: AgentAccessBinding = {
    id: nextBindingId(),
    organization,
    name,
    endpoint_url: input.endpoint_url.trim(),
    protocol: input.protocol,
    target_version: input.target_version,
    target_alias: input.target_alias,
    experiment_id: input.experiment_id?.trim() || undefined,
    description: input.description?.trim() || undefined,
    created_by: 'you',
    creation_timestamp: now,
    last_updated_timestamp: now,
  };
  bindings = [...bindings, binding];
  notify();
  return binding;
};

/** The deployment moved: update the binding; no version record changes. */
export const updateAgentBinding = (id: string, input: BindingInput): void => {
  bindings = bindings.map((binding) =>
    binding.id === id
      ? {
          ...binding,
          endpoint_url: input.endpoint_url.trim(),
          protocol: input.protocol,
          target_version: input.target_version,
          target_alias: input.target_alias,
          experiment_id: input.experiment_id?.trim() || undefined,
          description: input.description?.trim() || undefined,
          last_updated_by: 'you',
          last_updated_timestamp: Date.now(),
        }
      : binding,
  );
  notify();
};

/** The deployment was retired: delete the binding; the agent and its history remain untouched. */
export const deleteAgentBinding = (id: string): void => {
  bindings = bindings.filter((binding) => binding.id !== id);
  notify();
};

export const getAgentBindings = (organization: string, name: string): AgentAccessBinding[] =>
  bindings.filter((binding) => matches(binding, organization, name));

export const qualifiedNameOf = (entity: { organization: string; name: string }) =>
  getAgentQualifiedName(entity.organization, entity.name);
