import type { TagProps } from '@databricks/design-system';

import { compareSemver, normalizeSemver } from '../agent-plugins/utils';
import type { AgentAccessBinding, AgentAnchorKind, AgentBom, AgentVersionEntity } from './types';
import { AgentBindingProtocol, AgentStatus, AgentVersionScheme } from './types';

/**
 * Tag colour per lifecycle status. Identical to the skill and MCP registries' maps: the
 * same state reads the same in all three.
 */
export const STATUS_TAG_COLOR: Record<AgentStatus, TagProps['color']> = {
  [AgentStatus.DRAFT]: 'charcoal',
  [AgentStatus.ACTIVE]: 'lime',
  [AgentStatus.DEPRECATED]: 'lemon',
  [AgentStatus.DELETED]: 'coral',
};

/**
 * RFC-0011 §Manage an agent's lifecycle: the core `draft -> active -> deprecated` lifecycle
 * the MCP and skill registries use, with their transition rules carried over. `deleted`
 * is entered only through the explicit delete action, never picked from the status editor.
 */
export const STATUS_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  [AgentStatus.DRAFT]: [AgentStatus.ACTIVE],
  [AgentStatus.ACTIVE]: [AgentStatus.DRAFT, AgentStatus.DEPRECATED],
  [AgentStatus.DEPRECATED]: [AgentStatus.ACTIVE],
  [AgentStatus.DELETED]: [],
};

export const OBSERVABLE_STATUSES = [AgentStatus.DRAFT, AgentStatus.ACTIVE, AgentStatus.DEPRECATED];

/**
 * RFC-0011 registers a new version as `draft` -- promotion is a deliberate, recorded
 * decision informed by evaluations -- which is the reverse of RFC-0008's `active` default.
 * The form offers both, draft first.
 */
export const CREATABLE_STATUSES = [AgentStatus.DRAFT, AgentStatus.ACTIVE];

export const LATEST_ALIAS = 'latest';

export const formatStatusLabel = (status: AgentStatus): string => status.charAt(0).toUpperCase() + status.slice(1);

export const VERSION_SCHEME_LABELS: Record<AgentVersionScheme, string> = {
  [AgentVersionScheme.MONOTONIC]: 'Monotonic (1, 2, 3)',
  [AgentVersionScheme.SEMVER]: 'SemVer (1.2.0)',
  [AgentVersionScheme.FREEFORM]: 'Free-form',
};

export const PROTOCOL_LABELS: Record<AgentBindingProtocol, string> = {
  [AgentBindingProtocol.A2A]: 'A2A',
  [AgentBindingProtocol.MCP]: 'MCP',
  [AgentBindingProtocol.OTHER]: 'Other',
};

export const PROTOCOL_TAG_COLOR: Record<AgentBindingProtocol, TagProps['color']> = {
  [AgentBindingProtocol.A2A]: 'indigo',
  [AgentBindingProtocol.MCP]: 'teal',
  [AgentBindingProtocol.OTHER]: 'charcoal',
};

/** A binding MLflow can invoke: its protocol is self-describing. `other` is a documented pointer. */
export const isActionableProtocol = (protocol: AgentBindingProtocol): boolean =>
  protocol === AgentBindingProtocol.A2A || protocol === AgentBindingProtocol.MCP;

export const ANCHOR_KIND_LABELS: Record<AgentAnchorKind, string> = {
  source: 'Source',
  'config-snapshot': 'Configuration snapshot',
  'source-and-config': 'Source and configuration',
  'interface-only': 'Interface-only',
};

/** Validates a version string against the agent's scheme; returns the normalised value or undefined. */
export const normalizeVersionForScheme = (scheme: AgentVersionScheme, value: string): string | undefined => {
  const trimmed = value.trim();
  if (scheme === AgentVersionScheme.SEMVER) {
    return normalizeSemver(trimmed);
  }
  if (scheme === AgentVersionScheme.MONOTONIC) {
    return /^\d+$/.test(trimmed) ? String(Number(trimmed)) : undefined;
  }
  return trimmed || undefined;
};

/**
 * Newest first under the agent's scheme: numeric for monotonic, semantic precedence for
 * SemVer, registration time for free-form (where the RFC says versions "order by
 * registration time"). Creation time breaks ties everywhere.
 */
export const sortAgentVersionsNewestFirst = (
  scheme: AgentVersionScheme,
  versions: AgentVersionEntity[],
): AgentVersionEntity[] =>
  [...versions].sort((a, b) => {
    let byScheme = 0;
    if (scheme === AgentVersionScheme.MONOTONIC) {
      byScheme = Number(b.version) - Number(a.version);
    } else if (scheme === AgentVersionScheme.SEMVER) {
      byScheme = compareSemver(b.version, a.version);
    }
    return byScheme !== 0 && !Number.isNaN(byScheme) ? byScheme : b.creation_timestamp - a.creation_timestamp;
  });

/**
 * Latest resolution, the skill and plugin rule applied to agents: among `active`
 * versions the newest under the scheme; otherwise the newest non-deleted version.
 */
export const resolveLatestAgentVersion = (
  scheme: AgentVersionScheme,
  versions: AgentVersionEntity[],
): AgentVersionEntity | undefined => {
  const live = versions.filter((version) => version.status !== AgentStatus.DELETED);
  const active = live.filter((version) => version.status === AgentStatus.ACTIVE);
  return sortAgentVersionsNewestFirst(scheme, active.length ? active : live)[0];
};

/** Total number of references across every BOM axis. */
export const countBomEntries = (bom: AgentBom): number =>
  bom.skills.length + bom.agent_plugins.length + bom.mcp_servers.length + bom.models.length + bom.agents.length;

/** The version a binding currently resolves to, following its alias when it targets one. */
export const resolveBindingTarget = (
  binding: AgentAccessBinding,
  aliases: { alias: string; version: string }[],
): string | undefined => {
  if (binding.target_version) {
    return binding.target_version;
  }
  if (binding.target_alias) {
    return aliases.find((entry) => entry.alias === binding.target_alias)?.version;
  }
  return undefined;
};

/** `@production` or `v3`, for the binding row's target column. */
export const formatBindingTarget = (binding: AgentAccessBinding): string =>
  binding.target_alias
    ? `@${binding.target_alias}`
    : binding.target_version
      ? `version ${binding.target_version}`
      : 'latest';
