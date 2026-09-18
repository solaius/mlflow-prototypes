import type { TagProps } from '@databricks/design-system';

import { SkillStatus } from '../skills-registry/types';
import type { AgentPluginKind, AgentPluginMember, AgentPluginVersionEntity, AgentPluginVersionSource } from './types';
import { ASSEMBLED_SOURCE_TYPE, MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL } from './types';

/**
 * Lifecycle helpers are the skill registry's, re-exported rather than restated: RFC-0008
 * types an agent plugin version's status as `SkillStatus` and gives both entities the same
 * transition table, and the MCP server registry draws the same map. One vocabulary, one
 * set of colours.
 */
export {
  CREATABLE_STATUSES,
  LATEST_ALIAS,
  OBSERVABLE_STATUSES,
  STATUS_TAG_COLOR,
  STATUS_TRANSITIONS,
  formatStatusLabel,
} from '../skills-registry/utils';

/**
 * Packaged or assembled, read off `source_type` exactly as RFC-0008 derives it. Kind is a
 * property of the VERSION: a plugin may be packaged in one version and assembled in the
 * next, and every consumer of kind reads the version it is operating on.
 */
export const getPluginVersionKind = (source: Pick<AgentPluginVersionSource, 'source_type'>): AgentPluginKind =>
  source.source_type === ASSEMBLED_SOURCE_TYPE ? 'assembled' : 'packaged';

export const KIND_LABELS: Record<AgentPluginKind, string> = {
  packaged: 'Packaged',
  assembled: 'Assembled',
};

export const KIND_TAG_COLOR: Record<AgentPluginKind, TagProps['color']> = {
  packaged: 'turquoise',
  assembled: 'lemon',
};

/**
 * Human labels for the member types the two RFCs name. Anything not listed is an
 * adapter-assigned label MLflow does not interpret, rendered as-is: RFC-0010 leaves the
 * vocabulary open on purpose, and a UI that only knew a fixed list would hide the types it
 * had not heard of.
 */
const MEMBER_TYPE_LABELS = new Map<string, string>([
  [MEMBER_TYPE_SKILL, 'Skill'],
  [MEMBER_TYPE_MCP_SERVER, 'MCP server'],
  ['agent', 'Agent'],
  ['hook', 'Hook'],
  ['command', 'Command'],
  ['instruction', 'Instruction'],
  ['lsp-server', 'LSP server'],
]);

export const formatMemberType = (memberType: string): string =>
  MEMBER_TYPE_LABELS.get(memberType) ??
  memberType.replace(/[-_]+/g, ' ').replace(/^\w/, (character) => character.toUpperCase());

/** Plural heading per type, for the grouped members view. */
export const formatMemberTypePlural = (memberType: string): string => {
  const label = formatMemberType(memberType);
  return label.endsWith('s') ? label : `${label}s`;
};

/**
 * Colour per member type. Skills and MCP servers reuse the colours their reference chips
 * already carry in the agent registry (purple, teal) so a member reads the same as a pin;
 * the generic types share one neutral colour because the registry treats them alike.
 */
export const memberTypeTagColor = (memberType: string): TagProps['color'] => {
  if (memberType === MEMBER_TYPE_SKILL) {
    return 'purple';
  }
  if (memberType === MEMBER_TYPE_MCP_SERVER) {
    return 'teal';
  }
  return 'charcoal';
};

/** The order member groups render in: the two registry-backed types first, then whatever else, alphabetically. */
export const MEMBER_TYPE_ORDER = [MEMBER_TYPE_SKILL, MEMBER_TYPE_MCP_SERVER];

export const compareMemberTypes = (a: string, b: string): number => {
  const indexA = MEMBER_TYPE_ORDER.indexOf(a);
  const indexB = MEMBER_TYPE_ORDER.indexOf(b);
  if (indexA !== -1 || indexB !== -1) {
    return (indexA === -1 ? MEMBER_TYPE_ORDER.length : indexA) - (indexB === -1 ? MEMBER_TYPE_ORDER.length : indexB);
  }
  return a.localeCompare(b);
};

/** Members grouped by type, in render order. */
export const groupMembersByType = (
  members: AgentPluginMember[],
): { memberType: string; members: AgentPluginMember[] }[] => {
  const groups = new Map<string, AgentPluginMember[]>();
  for (const member of members) {
    const bucket = groups.get(member.member_type) ?? [];
    bucket.push(member);
    groups.set(member.member_type, bucket);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compareMemberTypes(a, b))
    .map(([memberType, grouped]) => ({ memberType, members: grouped }));
};

/** Count per member type, for the card badges RFC-0010's gallery journey describes. */
export const countMembersByType = (members: AgentPluginMember[]): { memberType: string; count: number }[] =>
  groupMembersByType(members).map(({ memberType, members: grouped }) => ({ memberType, count: grouped.length }));

/**
 * SemVer, as far as latest-resolution needs it: major.minor.patch plus an optional
 * prerelease. RFC-0008 normalises semverish input (`1.0` -> `1.0.0`) on ingest and rejects
 * anything else, so the parser accepts the same and returns undefined otherwise.
 */
export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

const SEMVER_PATTERN = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export const parseSemver = (value: string): ParsedSemver | undefined => {
  const match = SEMVER_PATTERN.exec(value.trim());
  if (!match) {
    return undefined;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    prerelease: match[4] ? match[4].split('.') : [],
  };
};

/** `1.0` -> `1.0.0`; a full SemVer string is returned unchanged; anything invalid returns undefined. */
export const normalizeSemver = (value: string): string | undefined => {
  const parsed = parseSemver(value);
  if (!parsed) {
    return undefined;
  }
  const core = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  return parsed.prerelease.length ? `${core}-${parsed.prerelease.join('.')}` : core;
};

const comparePrereleaseIdentifiers = (a: string, b: string): number => {
  const numericA = /^\d+$/.test(a);
  const numericB = /^\d+$/.test(b);
  if (numericA && numericB) {
    return Number(a) - Number(b);
  }
  if (numericA) {
    return -1;
  }
  if (numericB) {
    return 1;
  }
  return a.localeCompare(b);
};

/** Semantic precedence, per the SemVer spec: a prerelease sorts BELOW the release it precedes. */
export const compareSemver = (a: string, b: string): number => {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) {
    return a.localeCompare(b);
  }
  if (parsedA.major !== parsedB.major) {
    return parsedA.major - parsedB.major;
  }
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor - parsedB.minor;
  }
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch - parsedB.patch;
  }
  if (!parsedA.prerelease.length && !parsedB.prerelease.length) {
    return 0;
  }
  if (!parsedA.prerelease.length) {
    return 1;
  }
  if (!parsedB.prerelease.length) {
    return -1;
  }
  const length = Math.max(parsedA.prerelease.length, parsedB.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const identifierA = parsedA.prerelease[index];
    const identifierB = parsedB.prerelease[index];
    if (identifierA === undefined) {
      return -1;
    }
    if (identifierB === undefined) {
      return 1;
    }
    const result = comparePrereleaseIdentifiers(identifierA, identifierB);
    if (result !== 0) {
      return result;
    }
  }
  return 0;
};

/**
 * Newest first by semantic precedence, creation time breaking ties -- the order the rail
 * shows and the order latest-resolution walks.
 */
export const sortPluginVersionsNewestFirst = (versions: AgentPluginVersionEntity[]): AgentPluginVersionEntity[] =>
  [...versions].sort((a, b) => {
    const byPrecedence = compareSemver(b.version, a.version);
    return byPrecedence !== 0 ? byPrecedence : b.creation_timestamp - a.creation_timestamp;
  });

/**
 * RFC-0008 §`latest_version` resolution for agent plugins: among eligible `active`
 * versions, semantic precedence picks latest, creation time breaking ties; when there is
 * no active version the same rule runs over non-`deleted` non-`active` candidates. A
 * version withdrawn because it contains a `deleted` member is excluded exactly as a
 * `deleted` one is, which is why the caller supplies that predicate: the plugin store does
 * not own the skill versions that decide it.
 */
export const resolveLatestPluginVersion = (
  versions: AgentPluginVersionEntity[],
  isWithdrawn: (version: AgentPluginVersionEntity) => boolean,
): AgentPluginVersionEntity | undefined => {
  const eligible = versions.filter((version) => version.status !== SkillStatus.DELETED && !isWithdrawn(version));
  const active = eligible.filter((version) => version.status === SkillStatus.ACTIVE);
  const candidates = active.length ? active : eligible;
  return sortPluginVersionsNewestFirst(candidates)[0];
};

/** The manifest description, used when the parent's mutable description is unset. */
export const getManifestDescription = (pluginJson: Record<string, unknown>): string | undefined =>
  typeof pluginJson['description'] === 'string' ? pluginJson['description'] : undefined;

export const getManifestKeywords = (pluginJson: Record<string, unknown>): string[] =>
  Array.isArray(pluginJson['keywords']) ? pluginJson['keywords'].filter((k): k is string => typeof k === 'string') : [];

export const getManifestAuthorName = (pluginJson: Record<string, unknown>): string | undefined => {
  const author = pluginJson['author'];
  if (typeof author === 'string') {
    return author;
  }
  if (author && typeof author === 'object' && typeof (author as { name?: unknown }).name === 'string') {
    return (author as { name: string }).name;
  }
  return undefined;
};
