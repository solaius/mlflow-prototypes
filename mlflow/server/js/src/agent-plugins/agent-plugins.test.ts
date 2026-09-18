/**
 * Behaviour tests for the parts of the Agent Plugins prototype that encode an RFC-0008 rule
 * rather than a rendering choice, so a plausible-looking change cannot silently reintroduce
 * a defect the upstream reviewers already settled. Each test names the rule it holds.
 */
import { describe, expect, it } from '@jest/globals';

import {
  getAgentPluginAliasUri,
  getAgentPluginUri,
  getAgentPluginVersionUri,
  getMemberUri,
  getPluginQualifiedName,
} from './constants';
import { PLUGIN_VERSIONS } from './mocks/mockPlugins';
import { introspectPackage } from './mocks/pluginPackages';
import { getPluginVersionDeleteBlocker, resolveMembers } from './mocks/pluginsStore';
import { ASSEMBLED_SOURCE_TYPE, MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL } from './types';
import {
  compareSemver,
  getPluginVersionKind,
  normalizeSemver,
  resolveLatestPluginVersion,
  sortPluginVersionsNewestFirst,
} from './utils';
import { parseSkillQualifiedName } from '../skills-registry/constants';
import { SKILLS } from '../skills-registry/mocks/mockSkills';
import { SkillSourceType, SkillStatus } from '../skills-registry/types';

describe('URI grammar', () => {
  it('marks the organization with a leading @ and omits it when unscoped', () => {
    expect(getPluginQualifiedName('acme', 'pr-workflow')).toBe('@acme/pr-workflow');
    expect(getPluginQualifiedName('', 'pr-workflow')).toBe('pr-workflow');
    expect(getAgentPluginVersionUri('acme', 'pr-workflow', '1.0.0')).toBe('agent-plugins:/@acme/pr-workflow/1.0.0');
    expect(getAgentPluginAliasUri('', 'pr-workflow', 'production')).toBe('agent-plugins:/pr-workflow@production');
  });

  it('splits an @org/name typed into the create form the way it writes one back', () => {
    // The create form has no organization field in assemble mode: `@org/name` in Name is
    // parsed with the skills grammar, which only holds if the two registries write it alike.
    expect(parseSkillQualifiedName('@acme/pr-workflow')).toEqual({ organization: 'acme', name: 'pr-workflow' });
    expect(parseSkillQualifiedName(getPluginQualifiedName('acme', 'pr-workflow'))).toEqual({
      organization: 'acme',
      name: 'pr-workflow',
    });
    expect(parseSkillQualifiedName('pr-workflow')).toEqual({ organization: '', name: 'pr-workflow' });
  });

  it('pulls latest through the bare URI, not an alias, when no version is pinned', () => {
    // RFC-0008 resolves `agent-plugins:/@org/name` by SemVer precedence among active versions.
    expect(getAgentPluginUri('acme', 'pr-workflow')).toBe('agent-plugins:/@acme/pr-workflow');
  });

  it('writes member references in the scheme their registry defines', () => {
    expect(getMemberUri({ member_type: MEMBER_TYPE_SKILL, name: '@rh-sre/cve-impact', version: 1 })).toBe(
      'skills:/@rh-sre/cve-impact/1',
    );
    expect(
      getMemberUri({ member_type: MEMBER_TYPE_MCP_SERVER, name: 'com.redhat.openshift/cluster-mcp', version: '1.4.0' }),
    ).toBe('mcp-servers:/com.redhat.openshift/cluster-mcp/1.4.0');
  });
});

describe('kind is derived from source_type, per version', () => {
  it('reads assembled from the sentinel and packaged from every real source type', () => {
    expect(getPluginVersionKind({ source_type: ASSEMBLED_SOURCE_TYPE })).toBe('assembled');
    for (const sourceType of [SkillSourceType.GIT, SkillSourceType.OCI, SkillSourceType.ZIP, SkillSourceType.MLFLOW]) {
      expect(getPluginVersionKind({ source_type: sourceType })).toBe('packaged');
    }
  });

  it('gives an assembled version no plugin-level source', () => {
    for (const version of PLUGIN_VERSIONS.filter((v) => v.source.source_type === ASSEMBLED_SOURCE_TYPE)) {
      expect(version.source.source).toBeUndefined();
      expect(version.source.ref).toBeUndefined();
    }
  });
});

describe('versions are SemVer, normalized on ingest', () => {
  it('normalizes semverish input and rejects the rest', () => {
    expect(normalizeSemver('1.0')).toBe('1.0.0');
    expect(normalizeSemver('2')).toBe('2.0.0');
    expect(normalizeSemver('1.0.0-beta.11')).toBe('1.0.0-beta.11');
    expect(normalizeSemver('latest')).toBeUndefined();
  });

  it('keeps the registry version equal to the manifest version on every seeded row', () => {
    for (const version of PLUGIN_VERSIONS) {
      expect(version.plugin_json['version']).toBe(version.version);
    }
  });

  it('orders by semantic precedence, prereleases below the release they precede', () => {
    expect(compareSemver('1.0.0-beta.11', '1.0.0')).toBeLessThan(0);
    expect(compareSemver('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareSemver('0.1.0', '0.0.1')).toBeGreaterThan(0);
  });
});

describe('latest resolution', () => {
  const base = PLUGIN_VERSIONS[0];
  const make = (version: string, status: SkillStatus, creation = 0) => ({
    ...base,
    version,
    status,
    creation_timestamp: creation,
  });

  it('prefers the newest active version by precedence', () => {
    const versions = [
      make('0.1.0', SkillStatus.ACTIVE),
      make('0.2.0', SkillStatus.DRAFT),
      make('0.0.9', SkillStatus.ACTIVE),
    ];
    expect(resolveLatestPluginVersion(versions, () => false)?.version).toBe('0.1.0');
  });

  it('falls back to non-deleted non-active candidates when nothing is active', () => {
    const versions = [
      make('0.1.0', SkillStatus.DEPRECATED),
      make('0.2.0', SkillStatus.DRAFT),
      make('0.3.0', SkillStatus.DELETED),
    ];
    expect(resolveLatestPluginVersion(versions, () => false)?.version).toBe('0.2.0');
  });

  it('excludes a withdrawn version exactly as it excludes a deleted one', () => {
    const versions = [make('0.1.0', SkillStatus.ACTIVE), make('0.2.0', SkillStatus.ACTIVE)];
    expect(resolveLatestPluginVersion(versions, (v) => v.version === '0.2.0')?.version).toBe('0.1.0');
  });

  it('sorts the rail newest first', () => {
    const sorted = sortPluginVersionsNewestFirst([
      make('0.0.1', SkillStatus.ACTIVE),
      make('0.1.0', SkillStatus.ACTIVE),
    ]);
    expect(sorted.map((v) => v.version)).toEqual(['0.1.0', '0.0.1']);
  });
});

describe('member references are frozen at create time', () => {
  it('resolves a name-only reference to the latest ACTIVE version and never to a draft', () => {
    const activeSkill = SKILLS.find((skill) => skill.organization === 'rh-sre' && skill.name === 'cve-impact');
    expect(activeSkill).toBeDefined();
    const { members, errors } = resolveMembers([{ name: '@rh-sre/cve-impact' }], []);
    expect(errors).toEqual([]);
    expect(members[0].member_type).toBe(MEMBER_TYPE_SKILL);
    expect(typeof members[0].version).toBe('number');
  });

  it('fails the create when a name-only reference has no active version', () => {
    const { errors } = resolveMembers([{ name: '@nobody/nothing' }], []);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('no active version');
  });

  it('rejects duplicate member names within one version', () => {
    const { errors } = resolveMembers(
      [
        { name: '@rh-sre/cve-impact', version: 1 },
        { name: '@ocp-admin/cve-impact', version: 1 },
      ],
      [],
    );
    expect(errors.some((error) => error.includes('unique'))).toBe(true);
  });
});

describe('deleting a version is gated the way the skill registry gates it', () => {
  it('blocks an active version until it is unpublished or deprecated', () => {
    const active = PLUGIN_VERSIONS.find((v) => v.status === SkillStatus.ACTIVE);
    expect(active).toBeDefined();
    expect(getPluginVersionDeleteBlocker(active!.organization, active!.name, active!.version)).toBe('is-active');
  });

  it('blocks the last live version of a plugin', () => {
    const solo = PLUGIN_VERSIONS.filter(
      (v) =>
        PLUGIN_VERSIONS.filter((o) => o.organization === v.organization && o.name === v.name).length === 1 &&
        v.status !== SkillStatus.ACTIVE,
    )[0];
    if (solo) {
      expect(getPluginVersionDeleteBlocker(solo.organization, solo.name, solo.version)).toBe('last-live-version');
    }
  });
});

describe('import inspection', () => {
  const registered = SKILLS.map((skill) => ({
    organization: skill.organization,
    name: skill.name,
    description: skill.description,
  }));

  it('recognises a Red Hat collection and derives its skills and mcp.json members', () => {
    const result = introspectPackage(
      {
        sourceType: SkillSourceType.GIT,
        source: 'https://github.com/RHEcosystemAppEng/agentic-plugins.git',
        subpath: 'rh-sre',
      },
      registered,
    );
    expect(result.status).toBe('inspected');
    if (result.status === 'inspected') {
      expect(result.format).toBe('agent-plugins-v1');
      expect(result.skills.length).toBeGreaterThan(0);
      expect(result.otherMembers.every((member) => member.member_type === MEMBER_TYPE_MCP_SERVER)).toBe(true);
    }
  });

  it('derives non-skill member types from a Claude Code plugin', () => {
    const result = introspectPackage(
      { sourceType: SkillSourceType.OCI, source: 'oci://quay.io/acme-platform/plugins/release-gate:1.2.0' },
      registered,
    );
    expect(result.status).toBe('inspected');
    if (result.status === 'inspected') {
      expect(result.format).toBe('claude-code');
      expect(result.otherMembers.map((member) => member.member_type)).toEqual(
        expect.arrayContaining(['agent', 'hook', 'command']),
      );
    }
  });

  it('refuses to invent a manifest for a location it cannot inspect', () => {
    const result = introspectPackage(
      { sourceType: SkillSourceType.GIT, source: 'https://github.com/someone/else.git' },
      registered,
    );
    expect(result.status).toBe('not-inspectable');
  });
});
