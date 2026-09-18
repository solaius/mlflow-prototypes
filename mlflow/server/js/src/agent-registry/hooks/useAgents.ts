import { useMemo } from 'react';

import { matchesRegistrySearch } from '../../common/utils/registrySearchSyntax';
import { getAgentQualifiedName } from '../constants';
import { useAgentBindingsStore, useAgentsStore, useAgentVersionsStore } from '../mocks/agentsStore';
import type { AgentAccessBinding, AgentBindingProtocol, AgentEntity, AgentVersionEntity } from '../types';
import { AgentStatus, getAnchorKind } from '../types';
import { resolveLatestAgentVersion, sortAgentVersionsNewestFirst } from '../utils';

/**
 * Data access for the Agent Registry prototype: stand-ins for `search_agents`, `get_agent`,
 * `search_agent_versions` and the binding reads, resolving synchronously from the session
 * store but keeping the `{ data, isLoading }` shape a real hook would expose.
 *
 * Withdrawn (deleted) versions are never returned by any read path here.
 */

interface QueryResult<T> {
  data: T;
  isLoading: boolean;
  error?: Error;
}

const isLive = (version: AgentVersionEntity) => version.status !== AgentStatus.DELETED;

/** One BOM axis, for the blast-radius filter. */
export type BomAxis = 'skill' | 'agent_plugin' | 'mcp_server' | 'model' | 'agent';

/**
 * Structured filters: status, organization, binding protocol, anchor kind, and the BOM
 * predicate RFC-0011's blast-radius journey runs (`bom.<axis>.name = ... AND version = ...`).
 * Tags ride in `search` through the shared `tags.key = "value"` syntax.
 */
export interface AgentListFilters {
  search?: string;
  status?: AgentStatus;
  organization?: string;
  /** Narrow to agents with at least one binding of this protocol; `any` for any binding at all. */
  bindingProtocol?: AgentBindingProtocol | 'any';
  /** `anchored` (source and/or config snapshot) or `interface-only`. */
  anchor?: 'anchored' | 'interface-only';
  bomAxis?: BomAxis;
  bomName?: string;
  bomVersion?: string;
  /** Narrow to agents carrying an entity tag with this value, whatever its key (the skills label filter). */
  label?: string;
}

/** Every version's BOM entries on one axis, as `{ name, version }` strings. */
const bomEntries = (version: AgentVersionEntity, axis: BomAxis): { name: string; version?: string }[] => {
  switch (axis) {
    case 'skill':
      return version.bom.skills.map((ref) => ({ name: ref.name, version: String(ref.version) }));
    case 'agent_plugin':
      return version.bom.agent_plugins.map((ref) => ({ name: ref.name, version: ref.version }));
    case 'mcp_server':
      return version.bom.mcp_servers.map((ref) => ({ name: ref.name, version: ref.version }));
    case 'model':
      return version.bom.models.map((ref) => ({ name: ref.name, version: ref.version }));
    case 'agent':
      return version.bom.agents.map((ref) => ({ name: ref.name, version: ref.version }));
    default:
      return [];
  }
};

export { bomEntries };

/** The latest-resolved version per agent, keyed `{organization}/{name}`. */
export const useLatestAgentVersionByKey = (): Map<string, AgentVersionEntity> => {
  const agents = useAgentsStore();
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    const result = new Map<string, AgentVersionEntity>();
    for (const agent of agents) {
      const latest = resolveLatestAgentVersion(
        agent.version_scheme,
        agentVersions.filter((entry) => entry.organization === agent.organization && entry.name === agent.name),
      );
      if (latest) {
        result.set(`${agent.organization}/${agent.name}`, latest);
      }
    }
    return result;
  }, [agents, agentVersions]);
};

/** Bindings grouped by agent key. */
export const useBindingsByAgentKey = (): Map<string, AgentAccessBinding[]> => {
  const bindings = useAgentBindingsStore();
  return useMemo(() => {
    const map = new Map<string, AgentAccessBinding[]>();
    for (const binding of bindings) {
      const key = `${binding.organization}/${binding.name}`;
      map.set(key, [...(map.get(key) ?? []), binding]);
    }
    return map;
  }, [bindings]);
};

export interface AgentListResult {
  agents: AgentEntity[];
  /**
   * RFC-0011: "results should surface [agents with undeclared composition] alongside
   * matches: 3 agents declare the compromised skill; 12 more have undeclared composition."
   * Counted only when a BOM predicate is active, because only then can a match be missed.
   */
  undeclaredCompositionCount: number;
}

export const useAgentsList = (filters: AgentListFilters = {}): QueryResult<AgentListResult> => {
  const agents = useAgentsStore();
  const agentVersions = useAgentVersionsStore();
  const latestByKey = useLatestAgentVersionByKey();
  const bindingsByKey = useBindingsByAgentKey();

  const data = useMemo(() => {
    const bomActive = Boolean(filters.bomAxis && filters.bomName);
    let undeclaredCompositionCount = 0;

    const matched = agents.filter((agent) => {
      const key = `${agent.organization}/${agent.name}`;
      const latest = latestByKey.get(key);
      const liveVersions = agentVersions.filter(
        (entry) => entry.organization === agent.organization && entry.name === agent.name && isLive(entry),
      );

      if (
        !matchesRegistrySearch(
          { ...agent, extraSearchText: agent.display_name ? [agent.display_name] : [] },
          filters.search ?? '',
        )
      ) {
        return false;
      }
      if (filters.organization !== undefined && agent.organization !== filters.organization) {
        return false;
      }
      if (filters.label !== undefined && !agent.tags.some((tag) => tag.value === filters.label)) {
        return false;
      }
      if (filters.status !== undefined && latest?.status !== filters.status) {
        return false;
      }
      if (filters.bindingProtocol) {
        const agentBindings = bindingsByKey.get(key) ?? [];
        const hit =
          filters.bindingProtocol === 'any'
            ? agentBindings.length > 0
            : agentBindings.some((binding) => binding.protocol === filters.bindingProtocol);
        if (!hit) {
          return false;
        }
      }
      if (filters.anchor && latest) {
        const kind = getAnchorKind(latest);
        if (filters.anchor === 'interface-only' ? kind !== 'interface-only' : kind === 'interface-only') {
          return false;
        }
      }
      if (bomActive) {
        // Exact-match semantics; the name and version predicates bind to the same entry.
        const hit = liveVersions.some((version) =>
          bomEntries(version, filters.bomAxis as BomAxis).some(
            (entry) => entry.name === filters.bomName && (!filters.bomVersion || entry.version === filters.bomVersion),
          ),
        );
        if (!hit) {
          if (liveVersions.some((version) => version.composition === 'undeclared')) {
            undeclaredCompositionCount += 1;
          }
          return false;
        }
      }
      return true;
    });

    return { agents: matched, undeclaredCompositionCount };
  }, [agents, agentVersions, latestByKey, bindingsByKey, filters]);

  return { data, isLoading: false };
};

/** Every entity tag value across agents, for the label filter. */
export const useAgentLabels = (): string[] => {
  const agents = useAgentsStore();
  return useMemo(
    () =>
      [...new Set(agents.flatMap((agent) => agent.tags.map((tag) => tag.value)).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [agents],
  );
};

export const useAgentOrganizations = (): string[] => {
  const agents = useAgentsStore();
  return useMemo(
    () => [...new Set(agents.map((agent) => agent.organization).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [agents],
  );
};

/** Distinct names on one BOM axis across live versions: the options for the blast-radius filter. */
export const useBomAxisOptions = (axis?: BomAxis): string[] => {
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    if (!axis) {
      return [];
    }
    const names = new Set<string>();
    for (const version of agentVersions) {
      if (!isLive(version)) {
        continue;
      }
      for (const entry of bomEntries(version, axis)) {
        names.add(entry.name);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [agentVersions, axis]);
};

/** Versions referenced for one name on one axis, for the optional version predicate. */
export const useBomAxisVersions = (axis?: BomAxis, name?: string): string[] => {
  const agentVersions = useAgentVersionsStore();
  return useMemo(() => {
    if (!axis || !name) {
      return [];
    }
    const versions = new Set<string>();
    for (const version of agentVersions) {
      for (const entry of bomEntries(version, axis)) {
        if (entry.name === name && entry.version) {
          versions.add(entry.version);
        }
      }
    }
    return [...versions].sort();
  }, [agentVersions, axis, name]);
};

/** One agent plus its live versions (newest first under its scheme) and its bindings. */
export const useAgent = (
  organization?: string,
  agentName?: string,
): QueryResult<{ agent?: AgentEntity; versions: AgentVersionEntity[]; bindings: AgentAccessBinding[] }> => {
  const agents = useAgentsStore();
  const agentVersions = useAgentVersionsStore();
  const bindings = useAgentBindingsStore();
  const data = useMemo(() => {
    if (organization === undefined || !agentName) {
      return { agent: undefined, versions: [], bindings: [] };
    }
    const isThis = (entry: { organization: string; name: string }) =>
      entry.organization === organization && entry.name === agentName;
    const agent = agents.find(isThis);
    return {
      agent,
      versions: agent
        ? sortAgentVersionsNewestFirst(agent.version_scheme, agentVersions.filter(isThis).filter(isLive))
        : [],
      bindings: bindings.filter(isThis),
    };
  }, [agents, agentVersions, bindings, organization, agentName]);

  return { data, isLoading: false };
};

/** Qualified names of agents with at least one binding, and the protocols on each. */
export const useAgentProtocolsByKey = (): Map<string, Set<AgentBindingProtocol>> => {
  const bindings = useAgentBindingsStore();
  return useMemo(() => {
    const map = new Map<string, Set<AgentBindingProtocol>>();
    for (const binding of bindings) {
      const key = getAgentQualifiedName(binding.organization, binding.name);
      const set = map.get(key) ?? new Set<AgentBindingProtocol>();
      set.add(binding.protocol);
      map.set(key, set);
    }
    return map;
  }, [bindings]);
};
