import { useMemo } from 'react';

import { useSkillNamesUsedByAgent } from '../../agent-registry/hooks/useCrossRegistryQueries';
import { useSkillNamesInPlugin } from '../../agent-plugins/hooks/useSkillsInPlugin';
import { getSkillQualifiedName } from '../constants';
import { useSkillsStore, useSkillVersionsStore } from '../mocks/skillsStore';
import { matchesSkillSearch } from '../skillSearchSyntax';
import type { SkillEntity, SkillSourceType, SkillVersionEntity } from '../types';
import { SkillStatus } from '../types';

/**
 * Data access for the Skills Registry prototype.
 *
 * These hooks stand in for the RFC-0008 read APIs (`search_skills`, `get_skill`,
 * `get_skill_version`). They resolve synchronously from the client-side mocks but
 * keep the `{ data, isLoading, error }` shape the real hooks would expose, so the
 * pages do not have to change when a backend arrives.
 *
 * One rule holds across every read path here: WITHDRAWN VERSIONS ARE NEVER RETURNED.
 * RFC-0008 soft-deletes a version so its number is never reused, but no read API
 * surfaces it. Filtering at this layer rather than in each component is deliberate:
 * it means no screen can accidentally render a version the real API would not have
 * handed it.
 */

interface QueryResult<T> {
  data: T;
  isLoading: boolean;
  error?: Error;
}

const isLive = (version: SkillVersionEntity) => version.status !== SkillStatus.DELETED;

/**
 * Structured filters: status, organization and source type. Each is left undefined when
 * unset, so an unset filter costs nothing rather than matching everything by string
 * comparison.
 *
 * Tags are NOT here. They are filtered through `search` using MLflow's simplified SQL
 * `WHERE` syntax (`tags.my_key = "my_value"`), because that is how every other registry in
 * this UI filters them and a second grammar for the same concept is worse than a less
 * discoverable one. See `skillSearchSyntax.ts`.
 *
 * Status and source type are properties of a VERSION, not of a skill, so both are
 * evaluated against the skill's latest live version: "show me active skills" means
 * "skills whose current version is active", which is the governance question actually
 * being asked.
 */
export interface SkillListFilters {
  search?: string;
  status?: SkillStatus;
  organization?: string;
  sourceType?: SkillSourceType;
  label?: string;
  /**
   * Cross-registry: narrow to skills pinned by this agent. Not one of the structured
   * filters RFC-0008 names; it is a reverse lookup over the pins agent versions record.
   */
  agent?: string;
  /** Narrows `agent` to one of its versions. */
  agentVersion?: string;
  /**
   * Cross-registry: narrow to skills contained by this agent plugin, addressed by its
   * display name. Added at the 2026-09-04 session; the reverse direction (filtering
   * plugins by skill) was ruled out there -- see `useSkillsInPlugin`.
   */
  plugin?: string;
}

/** Lists registered skills, narrowed by free text and the structured filters. */
export const useSkillsList = (filters: SkillListFilters = {}): QueryResult<SkillEntity[]> => {
  const skills = useSkillsStore();
  const skillVersions = useSkillVersionsStore();
  // Agent pins record skills by the qualified `@org/name` reference form.
  const skillNamesUsedByAgent = useSkillNamesUsedByAgent(filters.agent, filters.agentVersion);
  // Plugin members record skills by the same qualified reference form the pins use.
  const skillNamesInPlugin = useSkillNamesInPlugin(filters.plugin);

  const latestLiveByKey = useMemo(() => {
    const map = new Map<string, SkillVersionEntity>();
    for (const version of skillVersions) {
      if (!isLive(version)) {
        continue;
      }
      const key = `${version.organization}/${version.name}`;
      const current = map.get(key);
      if (!current || version.version > current.version) {
        map.set(key, version);
      }
    }
    return map;
  }, [skillVersions]);

  const data = useMemo(
    () =>
      skills.filter((skill) => {
        if (!matchesSkillSearch(skill, filters.search ?? '')) {
          return false;
        }
        if (filters.organization !== undefined && skill.organization !== filters.organization) {
          return false;
        }
        if (filters.agent && !skillNamesUsedByAgent.has(getSkillQualifiedName(skill.organization, skill.name))) {
          return false;
        }
        if (filters.plugin && !skillNamesInPlugin.has(getSkillQualifiedName(skill.organization, skill.name))) {
          return false;
        }
        if (filters.status !== undefined || filters.sourceType !== undefined) {
          const latest = latestLiveByKey.get(`${skill.organization}/${skill.name}`);
          if (!latest) {
            return false;
          }
          if (filters.status !== undefined && latest.status !== filters.status) {
            return false;
          }
          if (filters.sourceType !== undefined && latest.source.source_type !== filters.sourceType) {
            return false;
          }
        }
        if (filters.label !== undefined) {
          if (!skill.tags.some((tag) => tag.value === filters.label)) {
            return false;
          }
        }
        return true;
      }),
    [
      skills,
      latestLiveByKey,
      skillNamesUsedByAgent,
      skillNamesInPlugin,
      filters.search,
      filters.organization,
      filters.status,
      filters.sourceType,
      filters.label,
      filters.agent,
      filters.plugin,
    ],
  );

  return { data, isLoading: false };
};

/** Every organization currently represented in the registry, for the organization filter. */
export const useSkillOrganizations = (): string[] => {
  const skills = useSkillsStore();
  return useMemo(
    () => [...new Set(skills.map((skill) => skill.organization).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [skills],
  );
};

/** Every unique tag value across all skills, for the label filter combobox. */
export const useSkillLabels = (): string[] => {
  const skills = useSkillsStore();
  return useMemo(() => {
    const values = new Set<string>();
    for (const skill of skills) {
      for (const tag of skill.tags) {
        if (tag.value) {
          values.add(tag.value);
        }
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [skills]);
};

/**
 * Resolves one skill plus its live versions, newest first.
 *
 * `highestVersionNumber` is the largest number ever ALLOCATED for this skill, including
 * numbers now held by withdrawn versions. The rail needs it to tell "version 4 is the
 * newest" apart from "version 4 existed and is gone", which is the only honest way to
 * render a withdrawal once the API has stopped returning the row.
 */
export const useSkill = (
  organization?: string,
  name?: string,
): QueryResult<{ skill?: SkillEntity; versions: SkillVersionEntity[]; highestVersionNumber: number }> => {
  const skills = useSkillsStore();
  const skillVersions = useSkillVersionsStore();
  const data = useMemo(() => {
    if (organization === undefined || !name) {
      return { skill: undefined, versions: [], highestVersionNumber: 0 };
    }
    const forSkill = skillVersions.filter((version) => version.organization === organization && version.name === name);
    return {
      skill: skills.find((skill) => skill.organization === organization && skill.name === name),
      versions: forSkill.filter(isLive).sort((a, b) => b.version - a.version),
      highestVersionNumber: Math.max(...forSkill.map((version) => version.version), 0),
    };
  }, [skills, skillVersions, organization, name]);

  return { data, isLoading: false };
};

/**
 * Resolves a single live skill version by its integer version number. A withdrawn
 * version resolves to nothing, the same as a number that was never allocated: from a
 * client's side of the API those two cases are indistinguishable, and they should be.
 */
export const useSkillVersion = (
  organization?: string,
  name?: string,
  version?: number,
): QueryResult<{ skill?: SkillEntity; skillVersion?: SkillVersionEntity }> => {
  const skills = useSkillsStore();
  const skillVersions = useSkillVersionsStore();
  const data = useMemo(() => {
    if (organization === undefined || !name || version === undefined || Number.isNaN(version)) {
      return { skill: undefined, skillVersion: undefined };
    }
    return {
      skill: skills.find((skill) => skill.organization === organization && skill.name === name),
      skillVersion: skillVersions.find(
        (entry) =>
          entry.organization === organization && entry.name === name && entry.version === version && isLive(entry),
      ),
    };
  }, [skills, skillVersions, organization, name, version]);

  return { data, isLoading: false };
};
