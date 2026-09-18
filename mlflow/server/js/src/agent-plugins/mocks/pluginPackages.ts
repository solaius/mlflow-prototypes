/**
 * What a CLIENT would learn by fetching and inspecting a plugin package.
 *
 * RFC-0008 makes import a client-side operation: the CLI or SDK fetches the source, applies
 * the subpath, auto-detects the format (Agent Plugins v1, then Claude Code, then the generic
 * skill-directory layout), validates or constructs the canonical manifest, and discovers the
 * skills. The registry server never fetches a user-supplied URL. `introspect` is the
 * read-only preview of the same inspection.
 *
 * A browser is a client with no git, no OCI puller and no archive reader, so it cannot do
 * any of that for an arbitrary location. This module is the prototype's stand-in: a table of
 * packages it "knows", keyed by source and subpath, from which it can answer as the CLI
 * would. Anything else is reported as un-inspectable, and the form sends the user to the
 * CLI and Python arms, which is the honest answer rather than a registration with an
 * invented manifest.
 *
 * The seven Red Hat collections are known because their skills are already seeded; the
 * one Claude Code package is synthetic and exists to show RFC-0010's non-skill member types
 * being derived on import.
 */

import { SkillSourceType } from '../../skills-registry/types';
import { useSkillsStore } from '../../skills-registry/mocks/skillsStore';
import { getSkillQualifiedName } from '../../skills-registry/constants';
import type { AgentPluginMember } from '../types';
import { MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL } from '../types';
import { PLUGIN_SEEDS } from './pluginSeeds';
import { buildPluginJson } from './mockPlugins';

/** The formats RFC-0008's auto-detection recognises, in its priority order. */
export type DetectedPluginFormat = 'agent-plugins-v1' | 'claude-code' | 'skill-directory';

export const FORMAT_LABELS: Record<DetectedPluginFormat, string> = {
  'agent-plugins-v1': 'Agent Plugins v1',
  'claude-code': 'Claude Code plugin',
  'skill-directory': 'Skill directory layout',
};

/** A skill the inspection found: its directory name inside `skills/`, and the name SKILL.md declares. */
export interface DiscoveredSkill {
  name: string;
  subpath: string;
  description: string;
}

export interface PackageIntrospection {
  status: 'inspected';
  format: DetectedPluginFormat;
  /** The canonical manifest, as validated (v1) or constructed by the adapter (others). */
  pluginJson: Record<string, unknown>;
  /** Name the manifest declares. */
  name: string;
  /** Version the manifest declares, if it declares one. Otherwise the user must supply it. */
  manifestVersion?: string;
  skills: DiscoveredSkill[];
  /** Non-skill members the adapter recognised, per RFC-0010: `mcp-server` rows from `mcp.json`, plus harness types. */
  otherMembers: AgentPluginMember[];
  /** What the package carries that nothing registers, reported so the user understands the whole package. */
  warnings: string[];
}

export interface PackageNotInspectable {
  status: 'not-inspectable';
  reason: string;
}

export type PackageInspection = PackageIntrospection | PackageNotInspectable;

export interface PackageLocation {
  sourceType: SkillSourceType;
  source: string;
  ref?: string;
  subpath?: string;
}

const COLLECTIONS_REPO = 'https://github.com/RHEcosystemAppEng/agentic-plugins';

const normalizeGit = (url: string) =>
  url
    .trim()
    .replace(/\.git$/i, '')
    .replace(/\/$/, '')
    .toLowerCase();
const normalizePath = (path?: string) => (path ?? '').trim().replace(/^\/+|\/+$/g, '');

/** The MCP servers each collection's `mcp.json` declares, by collection directory. */
const COLLECTION_MCP_JSON = new Map<string, string[]>([
  ['rh-sre', ['red-hat-lightspeed-mcp-server', 'ansible-automation-platform']],
  ['ocp-admin', ['assisted-installer', 'openshift-mcp-server']],
  ['rh-basic', ['security-mcp-server']],
  ['rh-virt', ['openshift-mcp-server']],
  ['mcps', ['openshift-mcp-server', 'assisted-installer', 'ansible-automation-platform']],
]);

/**
 * Inspects a package location the way a client would, for the packages this prototype
 * knows. Reads the live skills store so a collection's discovered skills are the ones
 * currently registered under that organization, which is what makes re-import land new
 * versions on the right skills.
 */
export const introspectPackage = (
  location: PackageLocation,
  registeredSkills: { organization: string; name: string; description: string }[],
): PackageInspection => {
  const subpath = normalizePath(location.subpath);

  if (location.sourceType === SkillSourceType.GIT && normalizeGit(location.source) === normalizeGit(COLLECTIONS_REPO)) {
    const seed = PLUGIN_SEEDS.find((entry) => entry.repo === COLLECTIONS_REPO && normalizePath(entry.path) === subpath);
    if (!seed) {
      return {
        status: 'not-inspectable',
        reason: subpath
          ? `No plugin.json was found under ${subpath} in that repository. The collections live one directory down: rh-sre, ocp-admin, rh-basic, rh-virt, rh-developer, rh-automation, rh-ai-engineer, mcps.`
          : 'That repository holds several collections, one per directory. Point the path at one of them.',
      };
    }
    const skills = registeredSkills
      .filter((entry) => entry.organization === subpath)
      .map((entry) => ({
        name: entry.name,
        subpath: `${subpath}/skills/${entry.name}`,
        description: entry.description,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const mcpServers = COLLECTION_MCP_JSON.get(subpath) ?? [];
    return {
      status: 'inspected',
      format: 'agent-plugins-v1',
      name: seed.name,
      manifestVersion: seed.versions[seed.versions.length - 1].version,
      pluginJson: buildPluginJson(seed, seed.versions[seed.versions.length - 1].version),
      skills,
      otherMembers: mcpServers.map((name) => ({ member_type: MEMBER_TYPE_MCP_SERVER, name })),
      warnings: mcpServers.length
        ? [
            `mcp.json declares ${mcpServers.length} MCP server${mcpServers.length === 1 ? '' : 's'}: recorded as members, not registered.`,
          ]
        : [],
    };
  }

  const isReleaseGate =
    (location.sourceType === SkillSourceType.OCI &&
      location.source.trim().toLowerCase().startsWith('oci://quay.io/acme-platform/plugins/release-gate')) ||
    (location.sourceType === SkillSourceType.GIT &&
      normalizeGit(location.source) === normalizeGit('https://github.com/acme-platform/claude-plugins') &&
      subpath === 'release-gate');
  if (isReleaseGate) {
    const seed = PLUGIN_SEEDS.find((entry) => entry.name === 'release-gate');
    const version =
      location.source.includes(':') && location.sourceType === SkillSourceType.OCI
        ? location.source.trim().split(':').pop()
        : undefined;
    return {
      status: 'inspected',
      format: 'claude-code',
      name: 'release-gate',
      manifestVersion: version && /^\d/.test(version) ? version : undefined,
      pluginJson: seed ? buildPluginJson(seed, version && /^\d/.test(version) ? version : '0.0.0') : {},
      skills: [
        {
          name: 'sbom-attestor',
          subpath: 'skills/sbom-attestor',
          description: 'Attach and verify SBOM attestations on container images.',
        },
      ],
      otherMembers: [
        { member_type: MEMBER_TYPE_MCP_SERVER, name: 'com.github/github-mcp' },
        { member_type: 'agent', name: 'security-auditor' },
        { member_type: 'hook', name: 'pre-commit-scan' },
        { member_type: 'command', name: 'release-check' },
      ],
      warnings: ['.claude-plugin/plugin.json was translated to a canonical Agent Plugins manifest.'],
    };
  }

  return {
    status: 'not-inspectable',
    reason:
      'This browser cannot fetch that location. Import runs in the client, which clones or pulls the package, detects its format and discovers its skills before anything is registered. Use the CLI or Python form of this import.',
  };
};

/** Reactive wrapper so the form's preview follows the skills store. */
export const usePackageIntrospection = (location: PackageLocation | undefined): PackageInspection | undefined => {
  const skills = useSkillsStore();
  if (!location || !location.source.trim()) {
    return undefined;
  }
  return introspectPackage(location, skills);
};

/** Qualified member reference for a discovered skill, once registered under `organization`. */
export const discoveredSkillMember = (
  organization: string,
  discovered: DiscoveredSkill,
  version: number,
): AgentPluginMember => ({
  member_type: MEMBER_TYPE_SKILL,
  name: getSkillQualifiedName(organization, discovered.name),
  version,
});
