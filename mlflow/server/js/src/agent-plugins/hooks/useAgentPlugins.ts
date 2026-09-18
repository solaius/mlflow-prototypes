import { useMemo } from 'react';

import { matchesRegistrySearch } from '../../common/utils/registrySearchSyntax';
import { parseSkillQualifiedName } from '../../skills-registry/constants';
import { useSkillVersionsStore } from '../../skills-registry/mocks/skillsStore';
import { SkillStatus } from '../../skills-registry/types';
import type { SkillSourceType } from '../../skills-registry/types';
import { usePluginsStore, usePluginVersionsStore } from '../mocks/pluginsStore';
import type { AgentPluginEntity, AgentPluginKind, AgentPluginVersionEntity } from '../types';
import { isSkillMember } from '../types';
import {
  getManifestAuthorName,
  getManifestDescription,
  getManifestKeywords,
  getPluginVersionKind,
  resolveLatestPluginVersion,
  sortPluginVersionsNewestFirst,
} from '../utils';

/**
 * Data access for the Agent Plugins registry prototype: stand-ins for `search_agent_plugins`,
 * `get_agent_plugin` and `search_agent_plugin_versions`, resolving synchronously from the
 * session store but keeping the `{ data, isLoading }` shape a real hook would expose.
 *
 * Two rules hold across every read path. WITHDRAWN VERSIONS ARE NEVER RETURNED: a version
 * that is `deleted`, or that contains a deleted skill member, is excluded exactly as the
 * RFC excludes it from default get/search/list. And the exclusion is REACTIVE to the skills
 * store, because withdrawal is derived from it -- deleting a skill version on the skill page
 * has to change what the plugin page shows without a reload.
 */

interface QueryResult<T> {
  data: T;
  isLoading: boolean;
  error?: Error;
}

const versionKey = (entry: { organization: string; name: string; version: string }) =>
  `${entry.organization}/${entry.name}@${entry.version}`;

/**
 * Keys of every plugin version currently withdrawn because a skill member was soft-deleted.
 * Computed from the live skills store so it re-evaluates when a skill version is deleted.
 */
export const useWithdrawnPluginVersionKeys = (): Set<string> => {
  const pluginVersions = usePluginVersionsStore();
  const skillVersions = useSkillVersionsStore();

  return useMemo(() => {
    const deletedSkillVersions = new Set(
      skillVersions
        .filter((entry) => entry.status === SkillStatus.DELETED)
        .map((entry) => `${entry.organization}/${entry.name}@${entry.version}`),
    );
    const withdrawn = new Set<string>();
    for (const pluginVersion of pluginVersions) {
      const hit = pluginVersion.members.some((member) => {
        if (!isSkillMember(member)) {
          return false;
        }
        const { organization, name } = parseSkillQualifiedName(member.name);
        return deletedSkillVersions.has(`${organization}/${name}@${member.version}`);
      });
      if (hit) {
        withdrawn.add(versionKey(pluginVersion));
      }
    }
    return withdrawn;
  }, [pluginVersions, skillVersions]);
};

/**
 * Structured filters, per RFC-0008's UI section: status, organization, source type, and
 * membership by member name; plus RFC-0010's member type. Tags ride in `search` through
 * the shared `tags.key = "value"` syntax, as on every other registry list.
 *
 * Status and source type are properties of a VERSION, evaluated against the plugin's
 * latest-resolved version: "show me active plugins" means plugins whose current version
 * is active.
 */
export interface AgentPluginListFilters {
  search?: string;
  status?: SkillStatus;
  organization?: string;
  /** `packaged` or `assembled`, or a specific packaged source type. */
  kind?: AgentPluginKind;
  sourceType?: SkillSourceType;
  /** Narrow to plugins any live version of which contains this member, by name. */
  memberName?: string;
  /** Narrow to plugins any live version of which contains a member of this type. */
  memberType?: string;
  /** Narrow to plugins carrying an entity tag with this value, whatever its key (the skills label filter). */
  label?: string;
}

/** The latest-resolved version per plugin, keyed `{organization}/{name}`, withdrawal-aware. */
export const useLatestPluginVersionByKey = (): Map<string, AgentPluginVersionEntity> => {
  const pluginVersions = usePluginVersionsStore();
  const withdrawn = useWithdrawnPluginVersionKeys();

  return useMemo(() => {
    const byPlugin = new Map<string, AgentPluginVersionEntity[]>();
    for (const entry of pluginVersions) {
      const key = `${entry.organization}/${entry.name}`;
      const bucket = byPlugin.get(key) ?? [];
      bucket.push(entry);
      byPlugin.set(key, bucket);
    }
    const result = new Map<string, AgentPluginVersionEntity>();
    for (const [key, versions] of byPlugin) {
      const latest = resolveLatestPluginVersion(versions, (entry) => withdrawn.has(versionKey(entry)));
      if (latest) {
        result.set(key, latest);
      }
    }
    return result;
  }, [pluginVersions, withdrawn]);
};

const isLive = (entry: AgentPluginVersionEntity, withdrawn: Set<string>) =>
  entry.status !== SkillStatus.DELETED && !withdrawn.has(versionKey(entry));

export const useAgentPluginsList = (filters: AgentPluginListFilters = {}): QueryResult<AgentPluginEntity[]> => {
  const plugins = usePluginsStore();
  const pluginVersions = usePluginVersionsStore();
  const withdrawn = useWithdrawnPluginVersionKeys();
  const latestByKey = useLatestPluginVersionByKey();

  const data = useMemo(
    () =>
      plugins.filter((plugin) => {
        const key = `${plugin.organization}/${plugin.name}`;
        const latest = latestByKey.get(key);
        const liveVersions = pluginVersions.filter(
          (entry) =>
            entry.organization === plugin.organization && entry.name === plugin.name && isLive(entry, withdrawn),
        );

        // RFC-0008 scopes free text to name, parent description, resolved manifest
        // description, keywords, author name and organization.
        if (
          !matchesRegistrySearch(
            {
              ...plugin,
              extraSearchText: latest
                ? [
                    getManifestDescription(latest.plugin_json) ?? '',
                    ...getManifestKeywords(latest.plugin_json),
                    getManifestAuthorName(latest.plugin_json) ?? '',
                  ]
                : [],
            },
            filters.search ?? '',
          )
        ) {
          return false;
        }
        if (filters.organization !== undefined && plugin.organization !== filters.organization) {
          return false;
        }
        if (filters.status !== undefined || filters.kind !== undefined || filters.sourceType !== undefined) {
          if (!latest) {
            return false;
          }
          if (filters.status !== undefined && latest.status !== filters.status) {
            return false;
          }
          if (filters.kind !== undefined && getPluginVersionKind(latest.source) !== filters.kind) {
            return false;
          }
          if (filters.sourceType !== undefined && latest.source.source_type !== filters.sourceType) {
            return false;
          }
        }
        if (filters.memberName && !liveVersions.some((v) => v.members.some((m) => m.name === filters.memberName))) {
          return false;
        }
        if (
          filters.memberType &&
          !liveVersions.some((v) => v.members.some((m) => m.member_type === filters.memberType))
        ) {
          return false;
        }
        if (filters.label !== undefined && !plugin.tags.some((tag) => tag.value === filters.label)) {
          return false;
        }
        return true;
      }),
    [plugins, pluginVersions, withdrawn, latestByKey, filters],
  );

  return { data, isLoading: false };
};

export const usePluginOrganizations = (): string[] => {
  const plugins = usePluginsStore();
  return useMemo(
    () => [...new Set(plugins.map((plugin) => plugin.organization).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [plugins],
  );
};

/** Every entity tag value across plugins, for the label filter. */
export const usePluginLabels = (): string[] => {
  const plugins = usePluginsStore();
  return useMemo(
    () =>
      [...new Set(plugins.flatMap((plugin) => plugin.tags.map((tag) => tag.value)).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [plugins],
  );
};

/** Every member name across live plugin versions, for the membership filter. */
export const usePluginMemberNames = (): string[] => {
  const pluginVersions = usePluginVersionsStore();
  const withdrawn = useWithdrawnPluginVersionKeys();
  return useMemo(
    () =>
      [
        ...new Set(
          pluginVersions
            .filter((entry) => isLive(entry, withdrawn))
            .flatMap((entry) => entry.members.map((m) => m.name)),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [pluginVersions, withdrawn],
  );
};

/** Every member type in use, for RFC-0010's member-type filter. Appears automatically as plugins carrying new types are imported. */
export const usePluginMemberTypes = (): string[] => {
  const pluginVersions = usePluginVersionsStore();
  return useMemo(
    () => [...new Set(pluginVersions.flatMap((entry) => entry.members.map((m) => m.member_type)))],
    [pluginVersions],
  );
};

/** One plugin plus its live versions, newest first by semantic precedence. */
export const useAgentPlugin = (
  organization?: string,
  name?: string,
): QueryResult<{ plugin?: AgentPluginEntity; versions: AgentPluginVersionEntity[]; withdrawnKeys: Set<string> }> => {
  const plugins = usePluginsStore();
  const pluginVersions = usePluginVersionsStore();
  const withdrawn = useWithdrawnPluginVersionKeys();

  const data = useMemo(() => {
    if (organization === undefined || !name) {
      return { plugin: undefined, versions: [], withdrawnKeys: withdrawn };
    }
    const forPlugin = pluginVersions.filter((entry) => entry.organization === organization && entry.name === name);
    return {
      plugin: plugins.find((plugin) => plugin.organization === organization && plugin.name === name),
      // Withdrawn versions stay LISTED here, marked, unlike deleted ones: RFC-0008 leaves
      // the stored status untouched, so the owner can still see the version and read why
      // it no longer resolves. Deleted versions are gone from every read API.
      versions: sortPluginVersionsNewestFirst(forPlugin.filter((entry) => entry.status !== SkillStatus.DELETED)),
      withdrawnKeys: withdrawn,
    };
  }, [plugins, pluginVersions, withdrawn, organization, name]);

  return { data, isLoading: false };
};

export const isPluginVersionKeyWithdrawn = (
  withdrawnKeys: Set<string>,
  entry: { organization: string; name: string; version: string },
) => withdrawnKeys.has(versionKey(entry));
