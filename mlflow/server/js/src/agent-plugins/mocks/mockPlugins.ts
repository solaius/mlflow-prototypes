import { SkillStatus } from '../../skills-registry/types';
import type { AgentPluginEntity, AgentPluginVersionEntity, AgentPluginVersionSource } from '../types';
import { ASSEMBLED_SOURCE_TYPE } from '../types';
import { resolveLatestPluginVersion } from '../utils';
import type { PluginSeed, PluginVersionSeed } from './pluginSeeds';
import { PLUGIN_SEEDS } from './pluginSeeds';

/**
 * Fixed reference point so timestamps, and therefore screenshots, stay stable across runs.
 * Matches the skills registry's anchor: 2026-08-04T16:20:00Z.
 */
const REGISTRY_NOW = Date.UTC(2026, 7, 4, 16, 20, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The canonical manifest a version stores. Packaged versions carry the publisher's
 * `plugin.json`; assembled versions get the minimal manifest RFC-0008 synthesises from the
 * parent name and the supplied version. Note what is NOT in it: the organization, which
 * RFC-0008 keeps an MLflow namespace rather than writing into the manifest.
 */
export const buildPluginJson = (
  seed: Pick<PluginSeed, 'name' | 'description' | 'keywords' | 'author'>,
  version: string,
) => ({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name: seed.name,
  version,
  description: seed.description,
  ...(seed.keywords.length ? { keywords: seed.keywords } : {}),
  ...(seed.author ? { author: { name: seed.author } } : {}),
});

const buildSource = (seed: PluginSeed, versionSeed: PluginVersionSeed): AgentPluginVersionSource => {
  if (!versionSeed.packaged || !seed.sourceType || !seed.repo) {
    return { source_type: ASSEMBLED_SOURCE_TYPE };
  }
  return {
    source_type: seed.sourceType,
    source: seed.repo,
    ...(versionSeed.packaged.revision ? { ref: versionSeed.packaged.revision } : {}),
    ...(seed.path ? { subpath: seed.path } : {}),
  };
};

const buildPlugin = (seed: PluginSeed): { plugin: AgentPluginEntity; versions: AgentPluginVersionEntity[] } => {
  const versions: AgentPluginVersionEntity[] = seed.versions.map((versionSeed) => {
    const timestamp = REGISTRY_NOW - versionSeed.daysAgo * DAY_MS;
    return {
      organization: seed.organization,
      name: seed.name,
      version: versionSeed.version,
      plugin_json: buildPluginJson(seed, versionSeed.version),
      source: buildSource(seed, versionSeed),
      members: versionSeed.members,
      status: versionSeed.status ?? SkillStatus.ACTIVE,
      tags: versionSeed.tags ?? [],
      aliases: versionSeed.aliases,
      created_by: versionSeed.created_by,
      last_updated_by: versionSeed.created_by,
      creation_timestamp: timestamp,
      last_updated_timestamp: timestamp,
    };
  });

  const aliases = versions.flatMap((v) => v.aliases.map((alias) => ({ alias, version: v.version })));
  // Seeds carry no deleted members, so nothing is withdrawn at build time.
  const latest = resolveLatestPluginVersion(versions, () => false);

  const plugin: AgentPluginEntity = {
    organization: seed.organization,
    name: seed.name,
    description: seed.description,
    icons: seed.icons,
    tags: seed.tags,
    aliases,
    latest_version: latest?.version,
    status: latest?.status,
    created_by: versions[0].created_by,
    creation_timestamp: Math.min(...versions.map((v) => v.creation_timestamp)),
    last_updated_timestamp: Math.max(...versions.map((v) => v.creation_timestamp)),
  };

  return { plugin, versions };
};

const built = PLUGIN_SEEDS.map(buildPlugin);

export const PLUGINS: AgentPluginEntity[] = built.map(({ plugin }) => plugin);
export const PLUGIN_VERSIONS: AgentPluginVersionEntity[] = built.flatMap(({ versions }) => versions);
