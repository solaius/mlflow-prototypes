/**
 * Prototype-level session store for the Skills Registry.
 *
 * `mockSkills.ts` builds the seeded `SKILLS` / `SKILL_VERSIONS` arrays once from
 * `skillSeeds.ts`. This module wraps those seeds in a tiny mutable store so a skill
 * registered via the Create screen is visible after navigating back to the list:
 * there is no backend, so "persistence" here just means "held in a module-level
 * variable for the life of the tab." It intentionally resets on reload.
 *
 * `useSyncExternalStore` gives the list/detail/version hooks a live view without a
 * real client cache (react-query, etc.): the smallest thing that lets state cross
 * a page navigation.
 *
 * Identity note: skills are keyed on `(organization, name)`, matching RFC-0008's
 * primary key. Call sites that only have a routing string pass the qualified
 * `@org/name` form and let `parseSkillQualifiedName` in `../constants` split it.
 */
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { getSkillArtifactPath, getSkillQualifiedName } from '../constants';
import { SKILLS as SEEDED_SKILLS, SKILL_VERSIONS as SEEDED_SKILL_VERSIONS } from './mockSkills';
import type { RegisteredSkillFile } from './skillFileTrees';
import { recordUploadedSkillFiles } from './uploadedSkillContent';
import type { RegistryIcon } from '../../common/components/RegistryIcon';
import type { SkillEntity, SkillTag, SkillVersionEntity, SkillVersionSource } from '../types';
import { SkillSourceType, SkillStatus } from '../types';

let skills: SkillEntity[] = SEEDED_SKILLS;
let skillVersions: SkillVersionEntity[] = SEEDED_SKILL_VERSIONS;
const versionCounters = new Map<string, number>();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
};

/** Composite-key helper: everything internal keys on the qualified `@org/name` form. */
const keyOf = (entity: { organization: string; name: string }) =>
  getSkillQualifiedName(entity.organization, entity.name);

const matches = (entity: { organization: string; name: string }, organization: string, name: string) =>
  entity.organization === organization && entity.name === name;

/**
 * Initialize version counters from seeded data on module load. For each skill, track
 * the highest version number ever seen so new versions never reuse a number, including
 * numbers held by withdrawn versions.
 */
const initializeVersionCounters = () => {
  for (const version of skillVersions) {
    const key = keyOf(version);
    versionCounters.set(key, Math.max(versionCounters.get(key) ?? 0, version.version));
  }
};

initializeVersionCounters();

/**
 * Computes the next version number for a skill, respecting the high-water mark so
 * version numbers are never reused after deletion. Returns the value without mutating
 * the counter: the counter is updated only on actual `addSkillVersion` / `createSkill`.
 */
export const nextSkillVersionNumber = (organization: string, name: string): number => {
  const currentMax = Math.max(
    ...skillVersions.filter((version) => matches(version, organization, name)).map((version) => version.version),
    0,
  );
  const highWaterMark = versionCounters.get(getSkillQualifiedName(organization, name)) ?? 0;
  return Math.max(currentMax, highWaterMark) + 1;
};

/** Reactive read of every registered skill: re-renders the caller on create. */
export const useSkillsStore = (): SkillEntity[] => useSyncExternalStore(subscribe, () => skills);

/** Reactive read of every registered skill version: re-renders the caller on create. */
export const useSkillVersionsStore = (): SkillVersionEntity[] => useSyncExternalStore(subscribe, () => skillVersions);

/** Non-reactive duplicate-identity check, used by the create form's inline validation. */
export const skillNameExists = (organization: string, name: string): boolean =>
  skills.some((skill) => matches(skill, organization.trim(), name.trim()));

/**
 * How a version's content was supplied at registration.
 *
 * RFC-0008 makes this a genuine fork rather than a formatting detail, because the two
 * halves put the client in different positions:
 *
 *   - `upload`  the client reads a local skill folder, computes the content digest, and
 *               uploads the bytes. The server assigns an artifact path and that path
 *               becomes the version's source (`source_type = 'mlflow'`).
 *   - `pointer` the client records where the content lives (git, OCI or ZIP) and
 *               submits metadata only. If it could not read the content, it submits no
 *               digest, which is legal: `digest` is nullable.
 */
export type SkillRegistrationMode = 'upload' | 'pointer';

export interface SkillSourceInput {
  /**
   * Undefined until the user picks one. The create form deliberately starts with neither
   * radio selected -- the two modes ask for completely different things, so defaulting to
   * one presents a half-filled form for a decision that was never made. `submit` is
   * unreachable in that state: `isSourceInputComplete` returns false without a mode.
   */
  mode?: SkillRegistrationMode;
  /** Pointer mode only: which of git / OCI / ZIP this points at. */
  sourceType: SkillSourceType;
  /** Pointer mode only: clone URL, image reference, or archive URL. */
  sourceUri: string;
  /** Git pointers only: branch, tag or commit. */
  ref: string;
  /** Path to the SKILL.md directory within the repository, image or archive. */
  subpath: string;
  /** Upload mode only: the folder name the user picked, shown back to them for confirmation. */
  uploadedFolderName?: string;
  /**
   * Upload mode only: the listing the browser read out of that folder.
   *
   * Filled asynchronously, a moment after the folder name: reading the tree takes long
   * enough to see on a large skill, and the name is what the form needs immediately to
   * infer the skill's name. So this being absent means either "still reading" or "read
   * nothing", and neither blocks submission -- an upload with no listing degrades to what
   * the flow did before it could read at all.
   */
  uploadedFiles?: RegisteredSkillFile[];
  /** Upload mode only: SHA-256 over the content just read, when the browser could hash it. */
  uploadedDigest?: string;
}

/**
 * Builds the single source a version points at, and the digest that goes with it.
 *
 * Upload mode always yields a digest, because the client just read the content. Pointer
 * mode never does: this UI cannot clone a repository, pull an image or expand an
 * archive, so it has nothing to hash and correctly submits none.
 *
 * The upload digest is the REAL SHA-256 over the bytes the picker read whenever the
 * browser could compute one. `synthesizeUploadDigest` remains as the fallback for a page
 * served outside a secure context, where `crypto.subtle` is absent: the field is better
 * filled with a stable stand-in than left empty, because empty means "nobody read the
 * content" and here somebody did.
 */
const buildSourceAndDigest = (
  input: SkillSourceInput,
  organization: string,
  name: string,
  version: number,
): { source: SkillVersionSource; digest?: string } => {
  if (input.mode === 'upload') {
    return {
      source: {
        source_type: SkillSourceType.MLFLOW,
        source: getSkillArtifactPath(organization, name, version),
        subpath: input.subpath.trim() || undefined,
      },
      digest: input.uploadedDigest ?? synthesizeUploadDigest(organization, name, version),
    };
  }

  return {
    source: {
      source_type: input.sourceType,
      source: input.sourceUri.trim(),
      ...(input.sourceType === SkillSourceType.GIT && input.ref.trim() ? { ref: input.ref.trim() } : {}),
      subpath: input.subpath.trim() || undefined,
    },
  };
};

/**
 * Hands the listing an upload read to the module that answers the Files tab.
 *
 * Called by both registration paths rather than folded into `buildSourceAndDigest`,
 * which is a pure function two callers rely on to stay one -- a write hidden inside it
 * would fire from anywhere it is ever reused.
 */
const recordUploadedContent = (input: SkillSourceInput, organization: string, name: string, version: number): void => {
  if (input.mode === 'upload' && input.uploadedFiles?.length) {
    recordUploadedSkillFiles(organization, name, version, input.uploadedFiles);
  }
};

/**
 * Stand-in for the content hash the client computes while reading the uploaded folder.
 * Distinct per version because each upload is its own tree.
 */
const synthesizeUploadDigest = (organization: string, name: string, version: number): string => {
  const key = `${getSkillQualifiedName(organization, name)}@upload@${version}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  let digest = '';
  let state = hash;
  while (digest.length < 64) {
    state = Math.imul(state ^ digest.length, 0x01000193) >>> 0;
    digest += state.toString(16).padStart(8, '0');
  }
  return digest.slice(0, 64);
};

export interface CreateSkillInput {
  organization: string;
  name: string;
  description: string;
  source: SkillSourceInput;
  /** Lifecycle status the first version is registered with. RFC-0008 defaults to `active`. */
  status: SkillStatus;
  /**
   * Skill-level tags. Modelled as part of the create input even though RFC-0008's
   * `create_skill(name, organization, description, icons)` does NOT accept tags: tags
   * are set through `set_skill_tag`, so a real client issues follow-up calls after the
   * create returns. The form offers them together because that is the useful moment to
   * type them; this store collapses what would be several requests into one write.
   */
  tags?: SkillTag[];
  /** Presentation icons. RFC-0008 accepts these on `create_skill`, unlike tags. */
  icons?: RegistryIcon[];
}

/**
 * Drops blank keys and de-duplicates by key, last write winning.
 *
 * Tags are a `(key, value)` MAP in RFC-0008 — `set_skill_tag` upserts one key — so two
 * rows sharing a key is not a state the registry can hold, and letting the form submit
 * one would make the UI disagree with the API on the very next read.
 */
const normalizeTags = (tags?: SkillTag[]): SkillTag[] => {
  if (!tags?.length) {
    return [];
  }
  const byKey = new Map<string, string>();
  for (const tag of tags) {
    const key = tag.key.trim();
    if (key) {
      byKey.set(key, tag.value.trim());
    }
  }
  return [...byKey.entries()].map(([key, value]) => ({ key, value }));
};

/**
 * Upserts one skill-level tag, mirroring `set_skill_tag`
 * (`POST /@{org}/{name}/tags`).
 */
export const setSkillTag = (organization: string, name: string, key: string, value: string): void => {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return;
  }
  skills = skills.map((skill) =>
    matches(skill, organization, name)
      ? {
          ...skill,
          tags: normalizeTags([...skill.tags, { key: trimmedKey, value }]),
          last_updated_timestamp: Date.now(),
        }
      : skill,
  );
  notify();
};

/** Removes one skill-level tag, mirroring `delete_skill_tag`. */
export const deleteSkillTag = (organization: string, name: string, key: string): void => {
  skills = skills.map((skill) =>
    matches(skill, organization, name)
      ? { ...skill, tags: skill.tags.filter((tag) => tag.key !== key), last_updated_timestamp: Date.now() }
      : skill,
  );
  notify();
};

/**
 * Upserts one VERSION-level tag
 * (`POST /@{org}/{name}/versions/{version}/tags`).
 *
 * RFC-0008 carries tags at both levels, with separate endpoints for each. The
 * distinction is real and worth keeping visible: a skill-level tag describes the asset
 * ("team: platform"), while a version-level tag describes one registration of it
 * ("reviewed-by: …"), and only the latter can differ between two versions.
 */
export const setSkillVersionTag = (
  organization: string,
  name: string,
  version: number,
  key: string,
  value: string,
): void => {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return;
  }
  skillVersions = skillVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? {
          ...entry,
          tags: normalizeTags([...entry.tags, { key: trimmedKey, value }]),
          last_updated_timestamp: Date.now(),
        }
      : entry,
  );
  notify();
};

/** Removes one version-level tag. */
export const deleteSkillVersionTag = (organization: string, name: string, version: number, key: string): void => {
  skillVersions = skillVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, tags: entry.tags.filter((tag) => tag.key !== key), last_updated_timestamp: Date.now() }
      : entry,
  );
  notify();
};

/**
 * Registers a new skill with a single v1, matching what the RFC's `create_skill` plus
 * an implicit first `create_skill_version` would produce: server-assigned version 1,
 * one source, a digest only when the client actually read the content, and the status
 * the form was submitted with.
 */
export const createSkill = (input: CreateSkillInput): SkillEntity => {
  const organization = input.organization.trim();
  const name = input.name.trim();
  const description = input.description.trim();
  const now = Date.now();

  const { source, digest } = buildSourceAndDigest(input.source, organization, name, 1);
  recordUploadedContent(input.source, organization, name, 1);

  const version: SkillVersionEntity = {
    organization,
    name,
    version: 1,
    source,
    digest,
    tags: [],
    aliases: [],
    created_by: 'you',
    last_updated_by: 'you',
    creation_timestamp: now,
    last_updated_timestamp: now,
    status: input.status,
  };

  const skill: SkillEntity = {
    organization,
    name,
    description,
    tags: normalizeTags(input.tags),
    icons: input.icons?.length ? input.icons : undefined,
    aliases: [],
    latest_version: 1,
    creation_timestamp: now,
    last_updated_timestamp: now,
  };

  // New skill leads the list, mirroring "most recently registered first".
  skills = [skill, ...skills];
  skillVersions = [...skillVersions, version];
  versionCounters.set(keyOf(skill), 1);
  notify();

  return skill;
};

/**
 * Updates a skill's mutable presentation metadata, mirroring RFC-0008's `update_skill`.
 *
 * Description and icons are the parent-level fields the RFC lets a curator change after
 * registration; the name, the organization and every version's source are not. Tags are
 * mutable too but do not travel here: the RFC gives them their own per-tag endpoints and
 * no replace-all call, so `setSkillTag` / `deleteSkillTag` own that write.
 */
export const updateSkill = (
  organization: string,
  name: string,
  changes: { description?: string; icons?: RegistryIcon[] },
): void => {
  skills = skills.map((skill) =>
    matches(skill, organization, name)
      ? {
          ...skill,
          description: changes.description ?? skill.description,
          // An explicitly empty list clears the icons; `undefined` leaves them alone.
          icons: changes.icons === undefined ? skill.icons : changes.icons.length ? changes.icons : undefined,
          last_updated_timestamp: Date.now(),
        }
      : skill,
  );
  notify();
};

/**
 * Recomputes a skill's `latest_version` from its live versions. Withdrawn versions are
 * out of resolution, so they can't be what a name-only reference lands on; the newest
 * non-deleted version wins, falling back to the newest overall when every version has
 * been withdrawn.
 */
const computeLatestVersion = (organization: string, name: string): number => {
  const versionsForSkill = skillVersions.filter((entry) => matches(entry, organization, name));
  if (!versionsForSkill.length) {
    return 0;
  }
  const live = versionsForSkill.filter((entry) => entry.status !== SkillStatus.DELETED);
  return Math.max(...(live.length ? live : versionsForSkill).map((entry) => entry.version));
};

/** Why a version cannot be deleted right now, or undefined when it can. */
export type SkillVersionDeleteBlocker = 'already-deleted' | 'is-active' | 'last-live-version';

/**
 * Whether a version can be deleted, and if not, which rule stops it.
 *
 * Returns the REASON rather than a boolean because the three reasons need three
 * different things said to the user, and the most important of them is actionable:
 * RFC-0008 requires that "active versions must first be unpublished or deprecated
 * before they can be deleted", so a blocked active version is a two-step operation the
 * UI should name, not a dead end. The 2026-09-01 review's ask to explain delete
 * behaviour is unanswerable while the button just sits there disabled.
 */
export const getSkillVersionDeleteBlocker = (
  organization: string,
  name: string,
  version?: number,
): SkillVersionDeleteBlocker | undefined => {
  const versionsForSkill = skillVersions.filter((entry) => matches(entry, organization, name));
  const target = version === undefined ? undefined : versionsForSkill.find((entry) => entry.version === version);
  if (!target) {
    return undefined;
  }
  if (target.status === SkillStatus.DELETED) {
    return 'already-deleted';
  }
  // RFC-0008 §Per-version status. Deliberately checked BEFORE the last-live-version
  // rule: an active sole version fails both, and "unpublish or deprecate it first" is
  // the more useful of the two things to say.
  if (target.status === SkillStatus.ACTIVE) {
    return 'is-active';
  }
  const live = versionsForSkill.filter((entry) => entry.status !== SkillStatus.DELETED);
  if (live.length <= 1) {
    return 'last-live-version';
  }
  return undefined;
};

/**
 * Whether a version can still be deleted: it must not already be withdrawn, it must not
 * be `active` (RFC-0008 requires unpublish or deprecate first), and it can't be the
 * skill's last remaining live version, since a skill with nothing resolvable left is a
 * state the registry shouldn't be able to reach from this screen.
 */
export const canDeleteSkillVersion = (organization: string, name: string, version?: number): boolean =>
  getSkillVersionDeleteBlocker(organization, name, version) === undefined;

/**
 * Soft-deletes one version, per RFC-0008 §Deletion semantics: the row STAYS so its
 * number is never reused, but the status becomes the terminal `deleted` and the version
 * is withdrawn from resolution, discovery and pull. Any alias pointing at it is dropped,
 * and `latest_version` is recomputed over what is still live.
 *
 * Because no read API returns withdrawn versions, the effect a user sees is the version
 * leaving the rail and its number becoming a gap. That is not a rendering shortcut: it
 * is what the API would show.
 */
export const deleteSkillVersion = (organization: string, name: string, version: number): void => {
  if (!canDeleteSkillVersion(organization, name, version)) {
    return;
  }

  const now = Date.now();

  skillVersions = skillVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, status: SkillStatus.DELETED, aliases: [], last_updated_timestamp: now, last_updated_by: 'you' }
      : entry,
  );

  const latestVersion = computeLatestVersion(organization, name);

  skills = skills.map((skill) =>
    matches(skill, organization, name)
      ? {
          ...skill,
          aliases: skill.aliases.filter((alias) => alias.version !== version),
          latest_version: latestVersion,
          last_updated_timestamp: now,
        }
      : skill,
  );

  notify();
};

/**
 * Moves a version along the lifecycle. The caller is expected to have offered only
 * transitions legal under `STATUS_TRANSITIONS`; this refuses only to touch an already
 * withdrawn version, which is terminal.
 *
 * Promoting or retiring a version can change which version a name-only reference
 * resolves to, so `latest_version` is recomputed here too.
 */
export const setSkillVersionStatus = (
  organization: string,
  name: string,
  version: number,
  status: SkillStatus,
): void => {
  const target = skillVersions.find((entry) => matches(entry, organization, name) && entry.version === version);
  if (!target || target.status === SkillStatus.DELETED) {
    return;
  }

  const now = Date.now();

  skillVersions = skillVersions.map((entry) =>
    matches(entry, organization, name) && entry.version === version
      ? { ...entry, status, last_updated_timestamp: now, last_updated_by: 'you' }
      : entry,
  );

  const latestVersion = computeLatestVersion(organization, name);
  skills = skills.map((skill) =>
    matches(skill, organization, name)
      ? { ...skill, latest_version: latestVersion, last_updated_timestamp: now }
      : skill,
  );

  notify();
};

/**
 * Sets the full alias list for one version. Aliases are mutable pointers owned by the
 * skill, not by the version, so assigning one that currently sits on another version
 * MOVES it rather than duplicating it: two versions can never answer the same alias.
 * A withdrawn version accepts no aliases.
 */
export const setSkillVersionAliases = (
  organization: string,
  name: string,
  version: number,
  aliases: string[],
): void => {
  const target = skillVersions.find((entry) => matches(entry, organization, name) && entry.version === version);
  if (!target || target.status === SkillStatus.DELETED) {
    return;
  }

  const claimed = new Set(aliases);

  skillVersions = skillVersions.map((entry) => {
    if (!matches(entry, organization, name)) {
      return entry;
    }
    if (entry.version === version) {
      return { ...entry, aliases };
    }
    // Strip anything this version just claimed from whichever version held it before.
    const remaining = entry.aliases.filter((alias) => !claimed.has(alias));
    return remaining.length === entry.aliases.length ? entry : { ...entry, aliases: remaining };
  });

  const rebuiltAliases = skillVersions
    .filter((entry) => matches(entry, organization, name))
    .flatMap((entry) => entry.aliases.map((alias) => ({ alias, version: entry.version })));

  skills = skills.map((skill) =>
    matches(skill, organization, name)
      ? { ...skill, aliases: rebuiltAliases, last_updated_timestamp: Date.now() }
      : skill,
  );

  notify();
};

/**
 * Deletes a skill and every one of its versions. Unlike the per-version delete, this is
 * a hard removal: RFC-0008's soft delete withdraws a *version* so references to it keep
 * resolving to a meaningful record, which has no analogue once the whole skill and its
 * namespace are gone.
 */
export const deleteSkill = (organization: string, name: string): void => {
  skills = skills.filter((skill) => !matches(skill, organization, name));
  skillVersions = skillVersions.filter((version) => !matches(version, organization, name));
  versionCounters.delete(getSkillQualifiedName(organization, name));
  notify();
};

/**
 * Non-reactive read of a skill's newest live version, used to prefill the Add Version
 * form. Prefers the newest non-withdrawn version: a new version realistically starts
 * from the last source that was actually resolvable.
 */
export const getLatestSkillVersion = (organization: string, name: string): SkillVersionEntity | undefined => {
  const versionsForSkill = skillVersions.filter((version) => matches(version, organization, name));
  if (!versionsForSkill.length) {
    return undefined;
  }
  const live = versionsForSkill.filter((version) => version.status !== SkillStatus.DELETED);
  return (live.length ? live : versionsForSkill).reduce((latest, entry) =>
    entry.version > latest.version ? entry : latest,
  );
};

export interface AddSkillVersionInput {
  organization: string;
  name: string;
  source: SkillSourceInput;
  /** Lifecycle status the new version is registered with. RFC-0008 defaults to `active`. */
  status: SkillStatus;
}

/**
 * Registers a new version on an existing skill: server-assigned `latest + 1`, the
 * status chosen on the form, `created_by: 'you'`.
 *
 * The new version supplies its own source. Nothing constrains it to the previous
 * version's location: the backend, the CLI and the SDK all allow a skill's versions to
 * live in different places, and a UI that silently forbade it would be describing a
 * restriction the registry does not have.
 */
export const addSkillVersion = (input: AddSkillVersionInput): SkillVersionEntity | undefined => {
  const latest = getLatestSkillVersion(input.organization, input.name);
  if (!latest) {
    return undefined;
  }

  const now = Date.now();
  const newVersionNumber = nextSkillVersionNumber(input.organization, input.name);
  const { source, digest } = buildSourceAndDigest(input.source, input.organization, input.name, newVersionNumber);
  recordUploadedContent(input.source, input.organization, input.name, newVersionNumber);

  const newVersion: SkillVersionEntity = {
    organization: input.organization,
    name: input.name,
    version: newVersionNumber,
    source,
    digest,
    tags: [],
    aliases: [],
    created_by: 'you',
    last_updated_by: 'you',
    creation_timestamp: now,
    last_updated_timestamp: now,
    status: input.status,
  };

  skillVersions = [...skillVersions, newVersion];
  skills = skills.map((skill) =>
    matches(skill, input.organization, input.name)
      ? { ...skill, latest_version: newVersionNumber, last_updated_timestamp: now }
      : skill,
  );
  versionCounters.set(getSkillQualifiedName(input.organization, input.name), newVersionNumber);
  notify();

  return newVersion;
};
