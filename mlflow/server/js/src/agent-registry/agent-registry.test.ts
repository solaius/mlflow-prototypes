/**
 * Behaviour tests for the parts of the Agent Registry prototype that encode an RFC-0011
 * design position rather than a rendering choice.
 */
import { describe, expect, it } from '@jest/globals';

import {
  getAgentAliasUri,
  getAgentQualifiedName,
  getAgentRegisterSnippet,
  getAgentUri,
  getAgentVersionUri,
  getModelRefUri,
} from './constants';
import { AGENT_SEEDS } from './mocks/agentSeeds';
import { fetchAgentCard } from './mocks/agentCards';
import { getAgentVersionDeleteBlocker, getLatestAgentVersion, nextMonotonicVersion } from './mocks/agentsStore';
import { getAgentEvalRuns, getAgentTraces } from './mocks/experimentTrackingStore';
import { AgentStatus, AgentVersionScheme, EMPTY_BOM, getAnchorKind, parseAgentQualifiedName } from './types';
import { normalizeVersionForScheme, resolveBindingTarget, sortAgentVersionsNewestFirst } from './utils';
import { PLUGIN_VERSIONS } from '../agent-plugins/mocks/mockPlugins';
import { getPluginQualifiedName } from '../agent-plugins/constants';
import { SKILL_VERSIONS } from '../skills-registry/mocks/mockSkills';
import { getSkillQualifiedName, parseSkillQualifiedName } from '../skills-registry/constants';

describe('agent identity follows the skill grammar', () => {
  it('renders the organization as a leading @ segment and round-trips', () => {
    expect(getAgentQualifiedName('sre', 'incident-commander')).toBe('@sre/incident-commander');
    expect(parseAgentQualifiedName('@sre/incident-commander')).toEqual({
      organization: 'sre',
      name: 'incident-commander',
    });
    expect(parseAgentQualifiedName('sre/incident-commander')).toBeUndefined();
  });

  it('splits an @org/name typed into the create form the way it writes one back', () => {
    // The create form has no organization field: `@org/name` in Name is parsed with the
    // skills grammar, which only holds while agents write their qualified name the same way.
    expect(parseSkillQualifiedName(getAgentQualifiedName('sre', 'billing-agent'))).toEqual({
      organization: 'sre',
      name: 'billing-agent',
    });
    expect(parseSkillQualifiedName('billing-agent')).toEqual({ organization: '', name: 'billing-agent' });
  });

  it('builds the three URI forms', () => {
    expect(getAgentUri('sre', 'incident-commander')).toBe('agents:/@sre/incident-commander');
    expect(getAgentVersionUri('sre', 'incident-commander', '2.0.0')).toBe('agents:/@sre/incident-commander/2.0.0');
    expect(getAgentAliasUri('sre', 'incident-commander', 'champion')).toBe('agents:/@sre/incident-commander@champion');
  });

  it('writes model references as registry URIs or bare external identifiers', () => {
    expect(getModelRefUri({ name: 'acme-billing-llm', version: '3' })).toBe('models:/acme-billing-llm/3');
    expect(getModelRefUri({ name: 'gpt-4o' })).toBe('gpt-4o');
  });
});

describe('version schemes', () => {
  it('validates per scheme', () => {
    expect(normalizeVersionForScheme(AgentVersionScheme.MONOTONIC, '03')).toBe('3');
    expect(normalizeVersionForScheme(AgentVersionScheme.MONOTONIC, 'v3')).toBeUndefined();
    expect(normalizeVersionForScheme(AgentVersionScheme.SEMVER, '1.2')).toBe('1.2.0');
    expect(normalizeVersionForScheme(AgentVersionScheme.SEMVER, 'nope')).toBeUndefined();
    expect(normalizeVersionForScheme(AgentVersionScheme.FREEFORM, '2026.08')).toBe('2026.08');
  });

  it('mints the next serial for a monotonic agent', () => {
    expect(nextMonotonicVersion('platform', 'oncall-helper')).toBe('3');
  });

  it('orders free-form versions by registration time and monotonic ones numerically', () => {
    const versions = AGENT_SEEDS.find((seed) => seed.name === 'service-scaffolder')!.versions;
    const entities = versions.map((v, index) => ({
      organization: 'devex',
      name: 'service-scaffolder',
      version: v.version,
      status: v.status,
      sources: [],
      composition: 'declared' as const,
      bom: EMPTY_BOM,
      tags: [],
      aliases: [],
      status_history: [],
      created_by: 'x',
      creation_timestamp: index,
      last_updated_timestamp: index,
    }));
    expect(sortAgentVersionsNewestFirst(AgentVersionScheme.FREEFORM, entities).map((v) => v.version)).toEqual([
      '2026.08',
      '2026.07',
    ]);
  });
});

describe('definitional anchors', () => {
  it('classifies the seeded records', () => {
    expect(getAnchorKind({ sources: [{ source_type: 'git' as never, source: 'x' }], config_snapshot: undefined })).toBe(
      'source',
    );
    expect(getAnchorKind({ sources: [], config_snapshot: { artifact_path: 'p', files: [] } })).toBe('config-snapshot');
    expect(getAnchorKind({ sources: [], config_snapshot: undefined })).toBe('interface-only');
  });

  it('seeds an interface-only record with undeclared composition', () => {
    const concierge = AGENT_SEEDS.find((seed) => seed.name === 'concierge');
    expect(concierge).toBeDefined();
    expect(concierge!.versions[0].sources).toEqual([]);
    expect(concierge!.versions[0].bom).toBeUndefined();
  });

  it('seeds a harness-based record with a configuration snapshot and no source', () => {
    const helper = AGENT_SEEDS.find((seed) => seed.name === 'oncall-helper');
    expect(helper!.versions.every((v) => v.sources.length === 0 && v.harness && v.configSnapshot)).toBe(true);
  });
});

describe('cross-registry references resolve', () => {
  const skillKeys = new Set(SKILL_VERSIONS.map((v) => `${getSkillQualifiedName(v.organization, v.name)}@${v.version}`));
  const pluginKeys = new Set(
    PLUGIN_VERSIONS.map((v) => `${getPluginQualifiedName(v.organization, v.name)}@${v.version}`),
  );
  const agentNames = new Set(AGENT_SEEDS.map((seed) => getAgentQualifiedName(seed.organization, seed.name)));

  it('pins skill versions that exist', () => {
    const dangling = AGENT_SEEDS.flatMap((seed) =>
      seed.versions.flatMap((v) =>
        (v.bom?.skills ?? [])
          .filter((ref) => !skillKeys.has(`${ref.name}@${ref.version}`))
          .map((ref) => `${seed.name} -> ${ref.name}@${ref.version}`),
      ),
    );
    expect(dangling).toEqual([]);
  });

  it('pins plugin versions that exist', () => {
    const dangling = AGENT_SEEDS.flatMap((seed) =>
      seed.versions.flatMap((v) =>
        (v.bom?.agent_plugins ?? [])
          .filter((ref) => !pluginKeys.has(`${ref.name}@${ref.version}`))
          .map((ref) => `${seed.name} -> ${ref.name}@${ref.version}`),
      ),
    );
    expect(dangling).toEqual([]);
  });

  it('names registered agents as callees, both pinned and name-level', () => {
    const refs = AGENT_SEEDS.flatMap((seed) => seed.versions.flatMap((v) => v.bom?.agents ?? []));
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every((ref) => agentNames.has(ref.name))).toBe(true);
    expect(refs.some((ref) => ref.version)).toBe(true);
    expect(refs.some((ref) => !ref.version)).toBe(true);
  });
});

describe('lifecycle and bindings', () => {
  it('gates delete on the unpublish-or-deprecate rule', () => {
    const latest = getLatestAgentVersion('sre', 'incident-commander');
    expect(latest?.status).toBe(AgentStatus.ACTIVE);
    expect(getAgentVersionDeleteBlocker('sre', 'incident-commander', latest!.version)).toBe('is-active');
  });

  it('follows an alias-targeted binding to the version the alias points at', () => {
    const resolved = resolveBindingTarget(
      {
        id: 'b',
        organization: 'sre',
        name: 'incident-commander',
        endpoint_url: 'https://x',
        protocol: 'a2a' as never,
        target_alias: 'production',
        created_by: 'x',
        creation_timestamp: 0,
        last_updated_timestamp: 0,
      },
      [{ alias: 'production', version: '2.0.0' }],
    );
    expect(resolved).toBe('2.0.0');
  });

  it('fetches a card at view time and reports an unreachable endpoint honestly', () => {
    expect(fetchAgentCard('https://incident-commander.apps.example.com/a2a').status).toBe('ok');
    expect(fetchAgentCard('https://report-generator.apps.example.com/a2a').status).toBe('unreachable');
  });
});

describe('agents anchor traces and evaluations', () => {
  it('records the version as metadata on every trace in the agent experiment', () => {
    const traces = getAgentTraces('@sre/incident-commander');
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.every((trace) => trace.agent === '@sre/incident-commander' && trace.agent_version)).toBe(true);
    expect(new Set(traces.map((trace) => trace.experiment_id)).size).toBe(1);
  });

  it('narrows evaluation runs by version', () => {
    expect(getAgentEvalRuns('@sre/incident-commander', '2.0.0').every((run) => run.agent_version === '2.0.0')).toBe(
      true,
    );
  });

  it('renders the RFC register_agent call from the form input', () => {
    const snippet = getAgentRegisterSnippet({
      organization: 'acme',
      name: 'billing-agent',
      description: 'Answers billing questions.',
      versionScheme: AgentVersionScheme.MONOTONIC,
      sources: [{ sourceType: 'git', sourceUri: 'https://github.com/acme/billing-agent.git', ref: '8f4e2a1' }],
      bom: { ...EMPTY_BOM, skills: [{ name: '@acme/billing-policy', version: 1 }] },
    });
    expect(snippet).toContain('mlflow.genai.register_agent(');
    expect(snippet).toContain('GitSource(url="https://github.com/acme/billing-agent.git", ref="8f4e2a1")');
    expect(snippet).toContain('skills:/@acme/billing-policy/1');
  });
});
