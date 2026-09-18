import { describe, expect, it } from '@jest/globals';

import { PLUGIN_VERSIONS } from './mocks/mockPlugins';
import { isMCPServerMember, isSkillMember } from './types';
import { SKILLS, SKILL_VERSIONS } from '../skills-registry/mocks/mockSkills';
import { getSkillQualifiedName } from '../skills-registry/constants';
import { MCP_SEEDS } from '../mcp-registry/mocks/mcpSeeds';

/**
 * Plugin membership is a cross-registry reference by string: a plugin version records
 * `@organization/name` plus an integer skill version, and nothing checks that the skill on
 * the other end exists.
 *
 * That gap shipped once: when the skills were reseeded from the real Red Hat collections,
 * the plugin fixtures kept pointing at the invented organizations they had been written
 * against, and every member list was empty with no test noticing. These are the assertions
 * that would have caught it, extended to RFC-0010's member types.
 */
describe('agent plugin membership', () => {
  const skillNames = new Set(SKILLS.map((skill) => getSkillQualifiedName(skill.organization, skill.name)));
  const versionKeys = new Set(
    SKILL_VERSIONS.map((v) => `${getSkillQualifiedName(v.organization, v.name)}@${v.version}`),
  );
  const members = PLUGIN_VERSIONS.flatMap((pluginVersion) =>
    pluginVersion.members.map((member) => ({ pluginVersion, member })),
  );
  const skillMembers = members.filter(({ member }) => isSkillMember(member));

  it('names a registered skill in every skill member reference', () => {
    const dangling = skillMembers
      .filter(({ member }) => !skillNames.has(member.name))
      .map(({ pluginVersion, member }) => `${pluginVersion.name}@${pluginVersion.version} -> ${member.name}`);
    expect(dangling).toEqual([]);
  });

  it('pins a version that skill actually has', () => {
    const unresolvable = skillMembers
      .filter(({ member }) => !versionKeys.has(`${member.name}@${member.version}`))
      .map(
        ({ pluginVersion, member }) =>
          `${pluginVersion.name}@${pluginVersion.version} -> ${member.name} v${member.version}`,
      );
    expect(unresolvable).toEqual([]);
  });

  it('keeps member names unique within a version, as the schema constraint requires', () => {
    for (const pluginVersion of PLUGIN_VERSIONS) {
      const names = pluginVersion.members.map((member) => `${member.member_type}:${member.name}`);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('carries enough membership for the reverse lookup to be worth showing', () => {
    expect(skillMembers.length).toBeGreaterThan(0);
  });

  it('shares at least one skill between two plugins, so the cascade block is reachable', () => {
    const pluginsBySkill = new Map<string, Set<string>>();
    for (const { pluginVersion, member } of skillMembers) {
      const owners = pluginsBySkill.get(member.name) ?? new Set<string>();
      owners.add(`${pluginVersion.organization}/${pluginVersion.name}`);
      pluginsBySkill.set(member.name, owners);
    }
    expect(Array.from(pluginsBySkill.values()).filter((owners) => owners.size > 1).length).toBeGreaterThan(0);
  });

  it('keeps a plugin that holds no skills at all', () => {
    // RFC-0008 allows a plugin of MCP servers alone; under RFC-0010 those servers are members.
    expect(PLUGIN_VERSIONS.some((pluginVersion) => !pluginVersion.members.some(isSkillMember))).toBe(true);
  });

  it('connects MCP server members that carry a version to a registered server', () => {
    // RFC-0010: a connected reference resolves in the MCP Server Registry. A member with no
    // version is discovered configuration, which is allowed to be unconnected.
    const registered = new Set(MCP_SEEDS.map((entry) => entry.server.name));
    const dangling = members
      .filter(({ member }) => isMCPServerMember(member) && member.version && !registered.has(member.name))
      .map(({ member }) => member.name);
    expect(dangling).toEqual([]);
  });

  it('seeds at least one member type beyond skills and MCP servers, so the generic path renders', () => {
    const types = new Set(members.map(({ member }) => member.member_type));
    expect([...types].some((type) => type !== 'skill' && type !== 'mcp-server')).toBe(true);
  });
});
