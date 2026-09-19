/**
 * Client-side mock registry backing the Skills Registry prototype.
 *
 * There is no server component: `SKILLS` and `SKILL_VERSIONS` are assembled once
 * from `skillSeeds.ts` and read through the hooks in `../hooks/useSkills.ts`.
 *
 * Note what is NOT built here: SKILL.md text. The registry stores metadata about
 * skills, not the skills themselves, so manifest content is modelled separately in
 * `skillContent.ts` as something a CLIENT fetches from the source, with the same
 * success and failure modes a browser would actually have.
 */

import { getSkillArtifactPath, getSkillQualifiedName } from '../constants';
import type { SkillEntity, SkillTag, SkillVersionEntity, SkillVersionSource } from '../types';
import { SkillSourceType, SkillStatus } from '../types';
import type { SkillSeed, SkillVersionSeed } from './skillSeeds';
import { DEMO_SKILL_SEEDS } from './demoSourceSkills';
import { SKILL_SEEDS } from './skillSeeds';

/**
 * Fixed reference point so timestamps, and therefore screenshots, stay stable
 * across runs. Corresponds to 2026-08-04T16:20:00Z.
 */
const REGISTRY_NOW = Date.UTC(2026, 7, 4, 16, 20, 0);

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic stand-in for the content hash a real client computes over the fetched
 * skill tree. It is derived from the identity of the content (skill plus the version
 * whose content this is), never from the version number alone, so two versions seeded
 * as carrying the same tree produce the same digest.
 *
 * Real digests are SHA-256 over a canonical serialization of the tree. This is not
 * that, and does not pretend to be: it exists so the UI has 64 stable hex characters
 * to group and truncate.
 */
const synthesizeDigest = (organization: string, name: string, contentVersion: number): string => {
  const key = `${getSkillQualifiedName(organization, name)}@${contentVersion}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // Expand the 32-bit value into 64 hex characters by rehashing with a counter, so the
  // rendered digest has the length and shape of a real SHA-256.
  let digest = '';
  let state = hash;
  while (digest.length < 64) {
    state = Math.imul(state ^ digest.length, 0x01000193) >>> 0;
    digest += state.toString(16).padStart(8, '0');
  }
  return digest.slice(0, 64);
};

/**
 * Builds the one source a version points at. Exactly one of git, OCI, ZIP or MLflow,
 * with `ref` set only for git: the other three have no notion of a branch or commit,
 * and carrying an empty one would be the same modelling mistake as pairing a git URL
 * with an artifact location.
 */
/**
 * Registry tags for a skill, set by whoever curates the entry.
 *
 * Deliberately NOT the catalogue's keywords: RFC-0008 keeps manifest keywords as
 * immutable publisher metadata and out of mutable MLflow tags. What lands here is what a
 * curator would actually record and later filter on -- the category, the collection's
 * publication lifecycle, and the skill's own declaration that it performs destructive
 * operations, which is precisely the sort of fact a governed registry exists to surface.
 */
/**
 * The catalogue the prototype registers: the two source-type demo skills first, then the
 * real collections. Demo first so both file-browser behaviours are on the first page.
 */
const ALL_SKILL_SEEDS = [...DEMO_SKILL_SEEDS, ...SKILL_SEEDS];

const buildSkillTags = (seed: SkillSeed): SkillTag[] => {
  const tags: SkillTag[] = [{ key: 'category', value: seed.category }];
  if (seed.lifecycle) {
    tags.push({ key: 'lifecycle', value: seed.lifecycle });
  }
  if (seed.destructive) {
    tags.push({ key: 'destructive', value: 'true' });
  }
  return tags;
};

const buildSource = (seed: SkillSeed, versionSeed: SkillVersionSeed, version: number): SkillVersionSource => {
  const sourceType = seed.sourceType ?? SkillSourceType.GIT;

  if (sourceType === SkillSourceType.MLFLOW) {
    // Uploaded through the client-side upload flow: the server chose this path and it
    // IS the source. There is no second location field.
    return {
      source_type: SkillSourceType.MLFLOW,
      source: getSkillArtifactPath(seed.organization, seed.name, version),
    };
  }

  return {
    source_type: sourceType,
    source: seed.repo,
    ...(sourceType === SkillSourceType.GIT ? { ref: versionSeed.revision } : {}),
    subpath: seed.path,
  };
};

const buildSkill = (seed: SkillSeed): { skill: SkillEntity; versions: SkillVersionEntity[] } => {
  const versions: SkillVersionEntity[] = seed.versions.map((versionSeed, index) => {
    const version = index + 1;
    const creationTimestamp = REGISTRY_NOW - versionSeed.daysAgo * DAY_MS;
    return {
      organization: seed.organization,
      name: seed.name,
      version,
      source: buildSource(seed, versionSeed, version),
      digest: versionSeed.noDigest
        ? undefined
        : synthesizeDigest(seed.organization, seed.name, versionSeed.sameContentAs ?? version),
      /*
        Registry tags, set by whoever curates the entry. Deliberately NOT the catalogue's
        keywords: RFC-0008 keeps manifest keywords as immutable publisher metadata and out
        of mutable MLflow tags, so what lands here is the category and the plugin that
        ships the skill -- both facts a curator would record and later filter on.
      */
      tags: [...buildSkillTags(seed), ...(versionSeed.tags ?? [])],
      aliases: versionSeed.aliases,
      created_by: versionSeed.created_by,
      last_updated_by: versionSeed.created_by,
      creation_timestamp: creationTimestamp,
      last_updated_timestamp: creationTimestamp,
      status: versionSeed.status ?? SkillStatus.ACTIVE,
    };
  });

  // Aliases live on the Skill as pointers into its versions.
  const aliases = versions.flatMap((version) => version.aliases.map((alias) => ({ alias, version: version.version })));

  // A withdrawn version can't be what a name-only reference resolves to, so the
  // skill's advertised latest is the newest version that is still live.
  const liveVersions = versions.filter((version) => version.status !== SkillStatus.DELETED);
  const latestVersion = Math.max(...(liveVersions.length ? liveVersions : versions).map((version) => version.version));

  const skill: SkillEntity = {
    organization: seed.organization,
    name: seed.name,
    description: seed.description,
    tags: buildSkillTags(seed),
    // Parent-level, per RFC-0008: one icon identifies the skill across all its versions.
    icons: seed.iconSrc ? [{ src: seed.iconSrc }] : undefined,
    aliases,
    latest_version: latestVersion,
    creation_timestamp: versions[0].creation_timestamp,
    last_updated_timestamp: versions[versions.length - 1].creation_timestamp,
  };

  return { skill, versions };
};

const built = ALL_SKILL_SEEDS.map(buildSkill);

/**
 * Seeded base data. `mocks/skillsStore.ts` is the live read path: it wraps these
 * arrays in a mutable store so skills created via the Create screen can be added on
 * top. Nothing in the app should import `SKILLS` / `SKILL_VERSIONS` directly other
 * than that store's initialization.
 */
export const SKILLS: SkillEntity[] = built.map(({ skill }) => skill);

export const SKILL_VERSIONS: SkillVersionEntity[] = built.flatMap(({ versions }) => versions);
