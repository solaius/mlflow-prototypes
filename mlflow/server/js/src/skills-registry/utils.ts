import type { TagProps } from '@databricks/design-system';

import { SkillSourceType, SkillStatus } from './types';
import type { SkillVersionEntity } from './types';

/** Leading YAML frontmatter block of a SKILL.md, plus the markdown body that follows it. */
export interface ParsedManifest {
  /** Raw frontmatter body, without the surrounding `---` fences. Undefined when absent. */
  frontmatter?: string;
  /** Everything after the closing fence: the part that should be rendered as markdown. */
  body: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Splits a SKILL.md into its frontmatter and its markdown body.
 *
 * Rendering the whole file through a markdown renderer would misread the `---`
 * fences as horizontal rules and promote the frontmatter into a heading, so the
 * two halves are presented separately.
 */
export const parseManifest = (manifestContent: string): ParsedManifest => {
  const match = FRONTMATTER_PATTERN.exec(manifestContent);
  if (!match) {
    return { body: manifestContent };
  }
  return {
    frontmatter: match[1],
    body: manifestContent.slice(match[0].length),
  };
};

/**
 * Tag color per lifecycle status. Deliberately identical to the MCP server
 * registry's `STATUS_TAG_COLOR` (`mcp-registry/utils.ts`) so the same state reads
 * the same in both registries.
 */
export const STATUS_TAG_COLOR: Record<SkillStatus, TagProps['color']> = {
  [SkillStatus.DRAFT]: 'charcoal',
  [SkillStatus.ACTIVE]: 'lime',
  [SkillStatus.DEPRECATED]: 'lemon',
  [SkillStatus.DELETED]: 'coral',
};

/**
 * The legal transition table from RFC-0008 §Per-version status: a draft is promoted
 * to active, an active version can be demoted back to draft or retired to deprecated,
 * a deprecated version can be reinstated, and `deleted` is terminal.
 *
 * `deleted` is not reachable from this map on purpose: it is entered through the
 * explicit "Delete version" action (a kill switch), not by picking it from the status
 * dropdown. The MCP registry draws the same line.
 */
export const STATUS_TRANSITIONS: Record<SkillStatus, SkillStatus[]> = {
  [SkillStatus.DRAFT]: [SkillStatus.ACTIVE],
  [SkillStatus.ACTIVE]: [SkillStatus.DRAFT, SkillStatus.DEPRECATED],
  [SkillStatus.DEPRECATED]: [SkillStatus.ACTIVE],
  [SkillStatus.DELETED]: [],
};

/**
 * The statuses a client can ever observe, in lifecycle order: the order the status
 * dropdown and the status filter list them in.
 *
 * `deleted` is absent by design. No read API returns a deleted version, so it is not a
 * state any list or detail view can display, and offering it as a filter would promise
 * a query the registry cannot answer.
 */
export const OBSERVABLE_STATUSES = [SkillStatus.DRAFT, SkillStatus.ACTIVE, SkillStatus.DEPRECATED];

/**
 * Statuses a version may be created with. RFC-0008 defaults a new version to `active`;
 * `draft` is offered so a version can be registered for review before it is preferred
 * by discovery.
 */
export const CREATABLE_STATUSES = [SkillStatus.ACTIVE, SkillStatus.DRAFT];

/** `latest` is reserved by RFC-0008 §Aliases and always resolves to the newest active version. */
export const LATEST_ALIAS = 'latest';

/** Status values are stored lowercase; labels are title-cased for display. */
export const formatStatusLabel = (status: SkillStatus): string => status.charAt(0).toUpperCase() + status.slice(1);

/** Human label per source type, used by the source filter and the version pane. */
export const SOURCE_TYPE_LABELS: Record<SkillSourceType, string> = {
  [SkillSourceType.GIT]: 'Git',
  [SkillSourceType.OCI]: 'OCI image',
  [SkillSourceType.ZIP]: 'ZIP archive',
  [SkillSourceType.MLFLOW]: 'MLflow artifacts',
};

/** Every source type, in the order the source filter lists them. */
export const SOURCE_TYPE_OPTIONS = [
  SkillSourceType.GIT,
  SkillSourceType.OCI,
  SkillSourceType.ZIP,
  SkillSourceType.MLFLOW,
];

/**
 * Source types a client can register a bare pointer to. MLflow-stored content is not
 * on this list because it is not a pointer the user types: it is produced by uploading
 * a local skill folder, and the server assigns the path.
 */
export const POINTER_SOURCE_TYPES = [SkillSourceType.GIT, SkillSourceType.OCI, SkillSourceType.ZIP];

/** Only a git source carries a branch, tag or commit. */
export const sourceTypeSupportsRef = (sourceType: SkillSourceType): boolean => sourceType === SkillSourceType.GIT;

/**
 * Best guess at which pointer type a typed location is, used to PRE-SELECT the type
 * selector rather than to replace it.
 *
 * RFC-0008 PR #44 settled the division of labour this mirrors: the server accepts an
 * explicit `source_type`, validates it against the source, and infers only when none
 * is sent. The 2026-09-01 UX review reached the same place for the UI — the selector
 * stays and stays required, because a UI client always knows what it is registering;
 * inference just saves the user a click when the location makes the answer obvious.
 *
 * Returns `undefined` rather than guessing when nothing matches, so an unrecognised
 * location leaves whatever the user already chose alone instead of resetting it.
 *
 * Note what is deliberately NOT here: a `.git` suffix requirement. PR #44 made the
 * suffix matter only to the server's inference fallback and never to fetching, and
 * explicitly documents `GitSource.url` as any clonable URL. An HTTPS clone URL without
 * the suffix is ordinary, so it must not be misread as an archive.
 */
const GIT_PROVIDER_HOSTS = ['github.com', 'gitlab.com', 'gitlab.cee.redhat.com', 'bitbucket.org', 'codeberg.org'];

export const inferSourceType = (location: string): SkillSourceType | undefined => {
  const trimmed = location.trim();
  if (!trimmed) {
    return undefined;
  }
  const lower = trimmed.toLowerCase();

  // An explicit scheme is unambiguous, so it is checked before any host or suffix rule.
  if (lower.startsWith('oci://')) {
    return SkillSourceType.OCI;
  }
  if (lower.startsWith('git@') || lower.startsWith('git://') || lower.startsWith('ssh://')) {
    return SkillSourceType.GIT;
  }
  // Suffix wins over host: a GitHub release tarball is a ZIP source that happens to be
  // hosted on a git provider, and reading it as git would point the puller at a clone
  // that does not exist.
  if (/\.(zip|tar\.gz|tgz)(\?.*)?$/.test(lower)) {
    return SkillSourceType.ZIP;
  }
  if (/\.git(\?.*)?$/.test(lower)) {
    return SkillSourceType.GIT;
  }
  if (GIT_PROVIDER_HOSTS.some((host) => lower.includes(host))) {
    return SkillSourceType.GIT;
  }
  // A registry-shaped reference with a tag or digest but no scheme, e.g.
  // `ghcr.io/acme/skills:v1`. Guarded on a dot in the first segment so a bare
  // `owner/repo:branch` is not mistaken for an image.
  if (/^[^/\s]+\.[^/\s]+\/\S+[:@]\S+$/.test(trimmed)) {
    return SkillSourceType.OCI;
  }
  return undefined;
};

/**
 * A provider WEB url — a `/tree/`, `/blob/` or `/-/tree/` browsing page — rather than a
 * clone URL.
 *
 * This is the single most likely thing a user pastes, because it is what the address
 * bar holds when they are looking at the skill they want. RFC-0008 PR #44 documents the
 * fix explicitly: use the clone URL plus the `ref` and `path` fields. Detecting the
 * paste lets the form say that at the moment it is useful instead of failing later at
 * pull time.
 */
export interface ProviderWebUrlParts {
  cloneUrl: string;
  ref?: string;
  subpath?: string;
}

const WEB_URL_PATTERN = /^(https?:\/\/[^/]+\/[^/]+\/[^/]+)\/(?:-\/)?(?:tree|blob)\/([^/]+)(?:\/(.*))?$/;

/**
 * Splits a pasted provider web URL into the three fields that actually register it.
 * Returns `undefined` for anything that is already a usable clone URL, so callers can
 * treat "no parts" as "nothing to correct".
 */
export const parseProviderWebUrl = (location: string): ProviderWebUrlParts | undefined => {
  const match = WEB_URL_PATTERN.exec(location.trim());
  if (!match) {
    return undefined;
  }
  const [, base, ref, subpath] = match;
  return {
    cloneUrl: `${base}.git`,
    ref: ref || undefined,
    // A `/blob/` URL ends at a file; the registry wants the DIRECTORY holding SKILL.md,
    // so the trailing filename is dropped rather than registered as a path that has no
    // SKILL.md under it.
    subpath: subpath ? subpath.replace(/\/SKILL\.md$/i, '') || undefined : undefined,
  };
};

/** Placeholder shown in the source input, per type: the shapes RFC-0008 uses in its examples. */
export const SOURCE_PLACEHOLDERS: Record<SkillSourceType, string> = {
  [SkillSourceType.GIT]: 'https://github.com/redhat-ai/skills-developer.git',
  [SkillSourceType.OCI]: 'oci://ghcr.io/redhat-ai/skills-developer:v1',
  [SkillSourceType.ZIP]: 'https://example.com/skills-developer.zip',
  [SkillSourceType.MLFLOW]: 'Assigned by the server on upload',
};

/**
 * Groups a skill's versions by content digest so "which of these are identical?" can be
 * answered at a glance.
 *
 * Only digests shared by more than one version are returned: a digest held by exactly
 * one version says nothing a reader needs a badge for. Versions with no digest are
 * excluded entirely rather than grouped together as if they matched, because an absent
 * digest means "the registering client could not read the content", not "empty content".
 *
 * The returned map is version number -> a stable group index, so the UI can label
 * matching versions consistently within one skill.
 */
export const groupVersionsByDigest = (versions: SkillVersionEntity[]): Map<number, number> => {
  const byDigest = new Map<string, number[]>();
  for (const version of versions) {
    if (!version.digest) {
      continue;
    }
    const bucket = byDigest.get(version.digest);
    if (bucket) {
      bucket.push(version.version);
    } else {
      byDigest.set(version.digest, [version.version]);
    }
  }

  const groups = new Map<number, number>();
  let groupIndex = 0;
  // Sorted so the group index is stable across renders regardless of Map iteration order.
  for (const [, versionNumbers] of [...byDigest.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (versionNumbers.length < 2) {
      continue;
    }
    groupIndex += 1;
    for (const versionNumber of versionNumbers) {
      groups.set(versionNumber, groupIndex);
    }
  }

  return groups;
};

/** Short, readable rendering of a 64-character content hash. */
export const formatDigest = (digest: string): string => digest.slice(0, 12);
