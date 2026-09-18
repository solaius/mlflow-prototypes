/**
 * Prototype-level session store for the Agent Plugins registry, mirroring the skills
 * registry's `skillsStore.ts`: seeds assembled once into module-level arrays, wrapped in
 * `useSyncExternalStore` so the list, detail and form screens share a live view with no
 * backend. It resets on reload.
 *
 * What it enforces is RFC-0008's, not its own: SemVer normalisation on ingest, member
 * references frozen to a concrete version at create time (name-only resolving to the latest
 * ACTIVE skill version and failing when there is none), one immutable manifest per version,
 * soft delete of versions gated on unpublish-or-deprecate, derived withdrawal when a member
 * skill version is deleted, hard delete of the parent with the atomic cascade check, latest
 * resolution by semantic precedence, and read-only parent status.
 */
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { getSkillQualifiedName, parseSkillQualifiedName } from '../../skills-registry/constants';
import {
  addSkillVersion,
  createSkill,
  deleteSkill,
  getLatestSkillVersion,
  getSkillVersionDeleteBlocker,
  skillNameExists,
} from '../../skills-registry/mocks/skillsStore';
import type { SkillSourceType, SkillTag } from '../../skills-registry/types';
import { SkillStatus } from '../../skills-registry/types';
import { getPluginQualifiedName } from '../constants';
import type {
  AgentPluginEntity,
  AgentPluginMember,
  AgentPluginVersionEntity,
  AgentPluginVersionSource,
} from '../types';
import { ASSEMBLED_SOURCE_TYPE, MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL, isSkillMember } from '../types';
import { getManifestDescription, normalizeSemver, resolveLatestPluginVersion } from '../utils';
import { PLUGINS as SEEDED_PLUGINS, PLUGIN_VERSIONS as SEEDED_PLUGIN_VERSIONS } from './mockPlugins';
import type { DiscoveredSkill, PackageIntrospection } from './pluginPackages';

let plugins: AgentPluginEntity[] = SEEDED_PLUGINS;
let pluginVersions: AgentPluginVersionEntity[] = SEEDED_PLUGIN_VERSIONS;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
};

const matches = (entity: { organization: string; name: string }, organization: string, name: string) =>
  entity.organization === organization && entity.name === name;

export const usePluginsStore = (): AgentPluginEntity[] => useSyncExternalStore(subscribe, () => plugins);

export const usePluginVersionsStore = (): AgentPluginVersionEntity[] =>
  useSyncExternalStore(subscribe, () => pluginVersions);

export const pluginExists = (organization: string, name: string): boolean =>
  plugins.some((plugin) => matches(plugin, organization.trim(), name.trim()));

export const pluginVersionExists = (organization: string, name: string, version: string): boolean =>
  pluginVersions.some((entry) => matches(entry, organization, name) && entry.version === version);

/**
 * Whether a plugin version is WITHDRAWN: it contains a skill member whose version has been
 * soft-deleted. RFC-0008 derives this rather than storing it -- the plugin version's own
 * status is untouched, so one owner's delete never rewrites another owner's record -- and
 * treats the version as `deleted` for resolution, discovery, aliases and pull.
 *
 * Read non-reactively here through the skills store's blocker check, which reports
 * `already-deleted` for a withdrawn skill version. Components that need to re-render when
 * a skill is deleted use `useWithdrawnPluginVersionKeys` in the hooks module instead.
 */
export const isPluginVersionWithdrawn = (pluginVersion: AgentPluginVersionEntity): boolean =>
  pluginVersion.members.some((member) => {
    if (!isSkillMember(member)) {
      return false;
    }
    const { organization, name } = parseSkillQualifiedName(member.name);
    return getSkillVersionDeleteBlocker(organization, name, member.version) === 'already-deleted';
  });

/** The members a withdrawal is caused by, for the UI to name. */
export const getWithdrawingMembers = (pluginVersion: AgentPluginVersionEntity): AgentPluginMember[] =>
  pluginVersion.members.filter((member) => {
    if (!isSkillMember(member)) {
      return false;
    }
    const { organization, name } = parseSkillQualifiedName(member.name);
    return getSkillVersionDeleteBlocker(organization, name, member.version) === 'already-deleted';
  });

/**
 * Recomputes the parent's derived fields from its versions: `latest_version` and `status`
 * from the latest-resolved version (both absent when nothing resolves), and the alias map
 * from the versions' own alias lists.
 */
const recomputeParent = (organization: string, name: string, timestamp = Date.now()) => {
  const forPlugin = pluginVersions.filter((entry) => matches(entry, organization, name));
  const latest = resolveLatestPluginVersion(forPlugin, isPluginVersionWithdrawn);
  const aliases = forPlugin
    .filter((entry) => entry.status !== SkillStatus.DELETED)
    .flatMap((entry) => entry.aliases.map((alias) => ({ alias, version: entry.version })));
  plugins = plugins.map((plugin) =>
    matches(plugin, organization, name)
      ? {
          ...plugin,
          latest_version: latest?.version,
          status: latest?.status,
          aliases,
          last_updated_timestamp: timestamp,
        }
      : plugin,
  );
};

/** Non-reactive read of a plugin's latest-resolved version, used to pre-fill the add-version form. */
export const getLatestPluginVersion = (organization: string, name: string): AgentPluginVersionEntity | undefined =>
  resolveLatestPluginVersion(
    pluginVersions.filter((entry) => matches(entry, organization, name)),
    isPluginVersionWithdrawn,
  );

/**
 * Drops blank keys and de-duplicates by key, last write winning -- tags are a map in the
 * API, so two rows with one key is not a state the registry can hold.
 */
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

/** A skill reference as the form collects it, before resolution freezes it. */
export interface SkillMemberInput {
  /** Qualified `@org/name`. */
  name: string;
  /** Explicit pin. Absent means "latest active", resolved now and frozen. */
  version?: number;
}

export interface MCPServerMemberInput {
  name: string;
  version?: string;
}

/**
 * Resolves member references to concrete pins, per RFC-0008 §AgentPluginVersion.
 *
 * A name-only skill reference resolves to the skill's latest ACTIVE version and to nothing
 * else: it never freezes a draft or a deprecated version into a permanent pin, and if the
 * skill has no active version the create fails, directing the author to publish the skill
 * or pin an explicit version. Member names must also be unique within a version.
 */
export const resolveMembers = (
  skills: SkillMemberInput[],
  mcpServers: MCPServerMemberInput[],
): { members: AgentPluginMember[]; errors: string[] } => {
  const members: AgentPluginMember[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const input of skills) {
    const { organization, name } = parseSkillQualifiedName(input.name);
    if (seen.has(name)) {
      errors.push(`Member names must be unique within a version: ${name} appears twice.`);
      continue;
    }
    seen.add(name);
    if (input.version !== undefined) {
      members.push({ member_type: MEMBER_TYPE_SKILL, name: input.name, version: input.version });
      continue;
    }
    const latest = getLatestSkillVersion(organization, name);
    if (!latest || latest.status !== SkillStatus.ACTIVE) {
      errors.push(`${input.name} has no active version. Publish one, or pin a version explicitly.`);
      continue;
    }
    members.push({ member_type: MEMBER_TYPE_SKILL, name: input.name, version: latest.version });
  }

  for (const input of mcpServers) {
    members.push({
      member_type: MEMBER_TYPE_MCP_SERVER,
      name: input.name,
      ...(input.version ? { version: input.version } : {}),
    });
  }

  return { members, errors };
};

/** The minimal manifest RFC-0008 synthesises for an assembled plugin registered without one. */
const synthesizeManifest = (name: string, version: string, description: string) => ({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name,
  version,
  ...(description ? { description } : {}),
});

export interface CreateAssembledPluginInput {
  organization: string;
  name: string;
  description: string;
  version: string;
  members: AgentPluginMember[];
  status: SkillStatus;
  tags?: SkillTag[];
  icons?: RegistryIcon[];
}

const insertVersion = (version: AgentPluginVersionEntity) => {
  pluginVersions = [...pluginVersions, version];
};

const insertParent = (plugin: AgentPluginEntity) => {
  plugins = [plugin, ...plugins];
};

/**
 * `register_agent_plugin` for an assembled plugin: create or reuse the parent and register
 * one version whose content is defined entirely by its member references. The version has
 * no plugin-level source, so `source_type` is `assembled`.
 */
export const createAssembledPlugin = (input: CreateAssembledPluginInput): AgentPluginEntity | undefined => {
  const organization = input.organization.trim();
  const name = input.name.trim();
  const version = normalizeSemver(input.version);
  if (!version || pluginVersionExists(organization, name, version)) {
    return undefined;
  }
  const now = Date.now();
  const description = input.description.trim();

  insertVersion({
    organization,
    name,
    version,
    plugin_json: synthesizeManifest(name, version, description),
    source: { source_type: ASSEMBLED_SOURCE_TYPE },
    members: input.members,
    status: input.status,
    tags: [],
    aliases: [],
    created_by: 'you',
    last_updated_by: 'you',
    creation_timestamp: now,
    last_updated_timestamp: now,
  });

  if (!pluginExists(organization, name)) {
    insertParent({
      organization,
      name,
      description,
      icons: input.icons?.length ? input.icons : undefined,
      tags: normalizeTags(input.tags),
      aliases: [],
      created_by: 'you',
      creation_timestamp: now,
      last_updated_timestamp: now,
    });
  }
  recomputeParent(organization, name, now);
  notify();
  return plugins.find((plugin) => matches(plugin, organization, name));
};

export interface ImportPluginInput {
  organization: string;
  /** Overrides the manifest's name when the adapter could not derive one. */
  pluginName?: string;
  /** Required when the manifest declares no version. */
  version?: string;
  source: { sourceType: SkillSourceType; source: string; ref?: string; subpath?: string };
  introspection: PackageIntrospection;
  status: SkillStatus;
  tags?: SkillTag[];
  icons?: RegistryIcon[];
}

/**
 * `import_agent_plugin`: the client has already inspected the package (`introspection`);
 * this is the atomic registration the server does from the prepared payload.
 *
 * Every discovered skill gets a NEW skill version whose source is derived from the package
 * -- the package's source type and location, plus the subpath locating the skill within it.
 * Import never reuses an existing skill version. A name already registered in the
 * organization becomes a new version of that skill; a free name becomes a new skill.
 * (RFC-0008 rejects a name held by a different plugin's member; this mock keeps the seeded
 * collections importable by their own organization, which is the common case.)
 */
export const importPackagedPlugin = (input: ImportPluginInput): AgentPluginEntity | undefined => {
  if (input.introspection.status !== 'inspected') {
    return undefined;
  }
  const organization = input.organization.trim();
  const name = (input.pluginName?.trim() || input.introspection.name).trim();
  const version = normalizeSemver(input.version?.trim() || input.introspection.manifestVersion || '');
  if (!name || !version || pluginVersionExists(organization, name, version)) {
    return undefined;
  }
  const now = Date.now();

  const members: AgentPluginMember[] = [];
  for (const discovered of input.introspection.skills) {
    const memberVersion = registerDerivedSkillVersion(organization, discovered, input.source, input.status);
    members.push({
      member_type: MEMBER_TYPE_SKILL,
      name: getSkillQualifiedName(organization, discovered.name),
      version: memberVersion,
    });
  }
  members.push(...input.introspection.otherMembers);

  const pluginJson = { ...input.introspection.pluginJson, name, version };

  const source: AgentPluginVersionSource = {
    source_type: input.source.sourceType,
    source: input.source.source.trim(),
    ...(input.source.ref?.trim() ? { ref: input.source.ref.trim() } : {}),
    ...(input.source.subpath?.trim() ? { subpath: input.source.subpath.trim() } : {}),
  };

  insertVersion({
    organization,
    name,
    version,
    plugin_json: pluginJson,
    source,
    members,
    status: input.status,
    tags: [],
    aliases: [],
    created_by: 'you',
    last_updated_by: 'you',
    creation_timestamp: now,
    last_updated_timestamp: now,
  });

  if (!pluginExists(organization, name)) {
    insertParent({
      organization,
      name,
      description: getManifestDescription(input.introspection.pluginJson) ?? '',
      icons: input.icons?.length ? input.icons : undefined,
      tags: normalizeTags(input.tags),
      aliases: [],
      created_by: 'you',
      creation_timestamp: now,
      last_updated_timestamp: now,
    });
  }
  recomputeParent(organization, name, now);
  notify();
  return plugins.find((plugin) => matches(plugin, organization, name));
};

/** Registers the derived-source skill version import creates for one discovered skill. */
const registerDerivedSkillVersion = (
  organization: string,
  discovered: DiscoveredSkill,
  packageSource: ImportPluginInput['source'],
  status: SkillStatus,
): number => {
  const sourceInput = {
    mode: 'pointer' as const,
    sourceType: packageSource.sourceType,
    sourceUri: packageSource.source.trim(),
    ref: packageSource.ref?.trim() ?? '',
    subpath: discovered.subpath,
  };
  if (skillNameExists(organization, discovered.name)) {
    const created = addSkillVersion({ organization, name: discovered.name, source: sourceInput, status });
    return created?.version ?? getLatestSkillVersion(organization, discovered.name)?.version ?? 1;
  }
  createSkill({
    organization,
    name: discovered.name,
    description: discovered.description,
    source: sourceInput,
    status,
  });
  return 1;
};

/** Why a version cannot be deleted right now, or undefined when it can. Same three reasons as skills. */
export type PluginVersionDeleteBlocker = 'already-deleted' | 'is-active' | 'last-live-version';

export const getPluginVersionDeleteBlocker = (
  organization: string,
  name: string,
  version?: string,
): PluginVersionDeleteBlocker | undefined => {
  const forPlugin = pluginVersions.filter((entry) => matches(entry, organization, name));
  const target = version === undefined ? undefined : forPlugin.find((entry) => entry.version === version);
  if (!target) {
    return undefined;
  }
  if (target.status === SkillStatus.DELETED) {
    return 'already-deleted';
  }
  if (target.status === SkillStatus.ACTIVE) {
    return 'is-active';
  }
  if (forPlugin.filter((entry) => entry.status !== SkillStatus.DELETED).length <= 1) {
    return 'last-live-version';
  }
  return undefined;
};

export const canDeletePluginVersion = (organization: string, name: string, version?: string): boolean =>
  getPluginVersionDeleteBlocker(organization, name, version) === undefined;

/**
 * Soft-deletes one version: the row stays, its status becomes the terminal `deleted`, its
 * aliases are dropped, and no read API returns it again. Affects only this version -- a
 * plugin version's deletion withdraws nothing else, unlike a skill version's.
 */
export const deletePluginVersion = (organization: string, name: string, version: string): void => {
  if (!canDeletePluginVersion(organization, name, version)) {
    return;
  }
  const now = Date.now();
  pluginVersions = pluginVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, status: SkillStatus.DELETED, aliases: [], last_updated_by: 'you', last_updated_timestamp: now }
      : entry,
  );
  recomputeParent(organization, name, now);
  notify();
};

/** Moves a version along the lifecycle. A withdrawn (deleted) version is terminal and refuses. */
export const setPluginVersionStatus = (
  organization: string,
  name: string,
  version: string,
  status: SkillStatus,
): void => {
  const target = pluginVersions.find((entry) => matches(entry, organization, name) && entry.version === version);
  if (!target || target.status === SkillStatus.DELETED) {
    return;
  }
  const now = Date.now();
  pluginVersions = pluginVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, status, last_updated_by: 'you', last_updated_timestamp: now }
      : entry,
  );
  recomputeParent(organization, name, now);
  notify();
};

/**
 * Sets the full alias list for one version. An alias claimed here is stripped from whichever
 * version held it before: two versions can never answer the same alias. A deleted or
 * withdrawn version accepts none, per RFC-0008's rule that an alias can never dangle onto
 * a version the kill switch has withdrawn.
 */
export const setPluginVersionAliases = (
  organization: string,
  name: string,
  version: string,
  aliases: string[],
): void => {
  const target = pluginVersions.find((entry) => matches(entry, organization, name) && entry.version === version);
  if (!target || target.status === SkillStatus.DELETED || isPluginVersionWithdrawn(target)) {
    return;
  }
  const claimed = new Set(aliases);
  pluginVersions = pluginVersions.map((entry) => {
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

export const setPluginTag = (organization: string, name: string, key: string, value: string): void => {
  if (!key.trim()) {
    return;
  }
  plugins = plugins.map((plugin) =>
    matches(plugin, organization, name)
      ? {
          ...plugin,
          tags: normalizeTags([...plugin.tags, { key: key.trim(), value }]),
          last_updated_timestamp: Date.now(),
        }
      : plugin,
  );
  notify();
};

export const deletePluginTag = (organization: string, name: string, key: string): void => {
  plugins = plugins.map((plugin) =>
    matches(plugin, organization, name)
      ? { ...plugin, tags: plugin.tags.filter((tag) => tag.key !== key), last_updated_timestamp: Date.now() }
      : plugin,
  );
  notify();
};

export const setPluginVersionTag = (
  organization: string,
  name: string,
  version: string,
  key: string,
  value: string,
): void => {
  if (!key.trim()) {
    return;
  }
  pluginVersions = pluginVersions.map((entry) =>
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

export const deletePluginVersionTag = (organization: string, name: string, version: string, key: string): void => {
  pluginVersions = pluginVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, tags: entry.tags.filter((tag) => tag.key !== key), last_updated_timestamp: Date.now() }
      : entry,
  );
  notify();
};

/** `update_agent_plugin`: the parent's mutable presentation metadata, description and icons. */
export const updatePlugin = (
  organization: string,
  name: string,
  changes: { description?: string; icons?: RegistryIcon[] },
): void => {
  plugins = plugins.map((plugin) =>
    matches(plugin, organization, name)
      ? {
          ...plugin,
          description: changes.description ?? plugin.description,
          icons: changes.icons === undefined ? plugin.icons : changes.icons.length ? changes.icons : undefined,
          last_updated_timestamp: Date.now(),
        }
      : plugin,
  );
  notify();
};

/** Which member skills a cascade would take with the plugin, and which it cannot. */
export interface PluginCascadeImpact {
  removable: string[];
  /** Members a LIVE version of another plugin still references. RFC-0008 blocks the whole operation on these. */
  blocked: { skillName: string; heldBy: string }[];
}

/**
 * What `delete_agent_plugin` with `cascade` would do.
 *
 * A member still referenced by a live (non-`deleted`) version of a different plugin blocks
 * the cascade, and blocks the WHOLE delete atomically rather than deleting around it.
 * Membership rows held only by soft-deleted plugin versions do not count: they are purged
 * with the member. Naming the blocker is what lets someone clear it.
 */
export const getPluginCascadeImpact = (organization: string, name: string): PluginCascadeImpact => {
  const ownMembers = [
    ...new Set(
      pluginVersions
        .filter((entry) => matches(entry, organization, name))
        .flatMap((entry) => entry.members.filter(isSkillMember).map((member) => member.name)),
    ),
  ];
  const removable: string[] = [];
  const blocked: { skillName: string; heldBy: string }[] = [];
  for (const skillName of ownMembers) {
    const holder = pluginVersions.find(
      (entry) =>
        !matches(entry, organization, name) &&
        entry.status !== SkillStatus.DELETED &&
        entry.members.some((member) => isSkillMember(member) && member.name === skillName),
    );
    if (holder) {
      blocked.push({ skillName, heldBy: getPluginQualifiedName(holder.organization, holder.name) });
    } else {
      removable.push(skillName);
    }
  }
  return { removable, blocked };
};

/**
 * Hard-deletes a plugin: the parent and every version, tag and alias go. With `cascade`,
 * the member skills go too, unless the referential-integrity check above refuses -- in
 * which case nothing is removed.
 */
export const deletePlugin = (organization: string, name: string, options?: { cascade?: boolean }): void => {
  if (options?.cascade) {
    const { blocked, removable } = getPluginCascadeImpact(organization, name);
    if (blocked.length) {
      return;
    }
    for (const qualifiedName of removable) {
      const { organization: memberOrg, name: memberName } = parseSkillQualifiedName(qualifiedName);
      deleteSkill(memberOrg, memberName);
    }
  }
  plugins = plugins.filter((plugin) => !matches(plugin, organization, name));
  pluginVersions = pluginVersions.filter((entry) => !matches(entry, organization, name));
  notify();
};
