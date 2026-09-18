/**
 * Client-side file resolution for the prototype.
 *
 * This module models a constraint that is easy to design past and expensive to discover
 * late: RFC-0008's registry stores metadata, not content. The server never fetches a
 * user-supplied source URL, and no read API returns file text. Anything that renders a
 * skill's files is either reading what the registry stored or acting as a CLIENT against
 * the source itself.
 *
 * The registry UI is a client with unusual limits. It has no filesystem to clone into, no
 * git, no OCI puller, and no credentials for a private source. So a version resolves to one
 * of two outcomes, and the UI has to be honest about which:
 *
 *   - `available`  The registry has a listing: content it stored itself, or an index it
 *                  resolved when the version was registered. `rendersContent` then says
 *                  whether it also holds the bytes.
 *   - `unlisted`   No listing. The reason varies and is stated, because "read it at the
 *                  provider", "you will need credentials" and "nothing was ever resolved"
 *                  imply different next steps.
 *
 * A public git repository is `unlisted` by DECISION rather than by capability. A browser
 * can fetch raw content from one, and an earlier revision of this prototype did. The
 * 2026-09-01 UX review chose to link out instead: the registry does not render third-party
 * content it never vetted, and the provider shows it better, at the exact ref, with history
 * beside it.
 *
 * Content is REAL throughout — the actual files from Red Hat's agentic collections for the
 * stored skills, and hand-written but self-declared for the two source-type demos in
 * `demoSourceSkills.ts`.
 */

import { getSkillQualifiedName } from '../constants';
import type { SkillVersionEntity } from '../types';
import { SkillSourceType } from '../types';
import { DEMO_SKILL_FILES, DEMO_SKILL_SEEDS } from './demoSourceSkills';
import type { RegisteredSkillFile } from './skillFileTrees';
import { REGISTERED_SKILL_FILES } from './skillFileTrees';
import type { SkillSeed } from './skillSeeds';
import { SKILL_SEEDS } from './skillSeeds';
import { getUploadedSkillFiles } from './uploadedSkillContent';

const seedByQualifiedName = new Map<string, SkillSeed>(
  [...DEMO_SKILL_SEEDS, ...SKILL_SEEDS].map((seed) => [getSkillQualifiedName(seed.organization, seed.name), seed]),
);

/**
 * The registered file listing for this skill, or undefined when the registry has none.
 *
 * `REGISTERED_SKILL_FILES` is declared with `satisfies` so its literal keys stay checked at
 * the definition, which also means it cannot be indexed by an arbitrary string. Widening it
 * here is the lookup half of that trade. The demo entries are a second map rather than
 * generated into the first, so hand-written and fetched data never blur together.
 */
const filesFor = (seed: SkillSeed | undefined): RegisteredSkillFile[] | undefined => {
  if (!seed) {
    return undefined;
  }
  const key = `${seed.organization}/${seed.name}`;
  return (
    (REGISTERED_SKILL_FILES as Record<string, RegisteredSkillFile[]>)[key] ??
    (DEMO_SKILL_FILES as Record<string, RegisteredSkillFile[]>)[key]
  );
};

/**
 * Why this version has no file listing.
 *
 * A generic "nothing here" would be true and useless. What a reader needs is which of the
 * several different reasons applies, because they imply different next steps: fetch it
 * yourself at the provider, pull it with credentials the browser does not have, or accept
 * that a bare pointer records a location and nothing else.
 */
const describeMissingListing = (version: SkillVersionEntity, seed: SkillSeed | undefined): string => {
  switch (version.source.source_type) {
    case SkillSourceType.GIT:
      return seed?.private
        ? 'This skill lives in a private git repository. The registry server never fetches source URLs, and the registry UI has no credentials for this one, so neither has read the directory.'
        : 'Content in a git repository is read at its source. The registry recorded where this version lives, not what the directory contains, so there is nothing to list here.';
    case SkillSourceType.OCI:
      return 'No index was resolved for this image. Pulling an OCI image needs a registry client and an authenticated pull, which the registry server does not perform on your behalf.';
    case SkillSourceType.ZIP:
      return 'No index was resolved for this archive. It has to be downloaded and expanded before its contents can be listed.';
    case SkillSourceType.MLFLOW:
      // Reachable only where the upload could not be read: MLflow holds this version's
      // content by definition, so an empty listing is a gap in what the registering
      // client managed to send, not a property of the source.
      return 'MLflow stores this version, but no file listing was captured when it was registered. Register it again from the folder picker to record one.';
    default:
      return 'No file listing was recorded for this version.';
  }
};

/** One entry in a skill version's file listing. */
export interface SkillFileEntry {
  /** Path relative to the skill directory. `SKILL.md` is always first. */
  path: string;
  /** File text. Absent for a file too large or too binary to carry in the mock. */
  content?: string;
  /** Real byte size, as the source repository reports it. */
  sizeBytes: number;
  /** True for the SKILL.md entry point, which the UI selects by default. */
  isEntryPoint: boolean;
}

export type SkillFilesResolution =
  /**
   * A listing exists. `rendersContent` says whether the registry holds the file bodies and
   * may therefore show them in the page; when it does not, a git-sourced row links out to
   * its provider instead.
   */
  | { status: 'available'; rendersContent: boolean; files: SkillFileEntry[] }
  /** No listing was recorded at all, which is the state of a freshly registered pointer. */
  | { status: 'unlisted'; reason: string };

/**
 * The file listing for one version.
 *
 * A listing exists only where the registry actually has one, which today means content it
 * stored itself -- seeded, or uploaded through the folder picker in this tab -- or an
 * index it resolved at registration. A git pointer has neither: the server never fetched
 * it, so the registry does not know what the directory holds, and emitting paths anyway
 * would be inventing them.
 *
 * Whether a registry SHOULD carry a listing for a pointer is an open question -- the
 * registering client already inspects the content locally to compute a name and digest, so
 * a file manifest would be nearly free at that moment. That is a question for the RFC, not
 * something this module can decide, so the prototype demonstrates the browser on the cases
 * where a listing is unambiguous and leaves the rest honestly empty.
 */
export const resolveSkillFiles = (version: SkillVersionEntity, totalVersions: number): SkillFilesResolution => {
  const seed = seedByQualifiedName.get(getSkillQualifiedName(version.organization, version.name));
  /*
    A folder uploaded in this tab wins over the seeds, and is checked per VERSION rather
    than per skill: adding a second version by uploading a changed folder must show the
    tree that version carries, not the one its predecessor did. Seeded listings stay
    per-skill because a seed's versions are the same tree at different refs.
  */
  const files = getUploadedSkillFiles(version.organization, version.name, version.version) ?? filesFor(seed);

  if (!files?.length) {
    return { status: 'unlisted', reason: describeMissingListing(version, seed) };
  }

  /*
    Whether the page may show the file bodies comes down to one question -- does the
    registry hold them? -- and the listing answers it directly. A git pointer never carries
    content, so its rows link out to the provider; MLflow-stored content and a resolved
    OCI or ZIP index do carry it, so those open in the pane.

    Deriving this from the CONTENT rather than from the source type is what keeps the rule
    in one place. A source type test would have to be repeated everywhere and would go
    stale the moment a fifth type appears.
  */
  const rendersContent = files.some((file) => file.content !== undefined);

  // SKILL.md first -- it is the entry point, and the one file every skill has. The rest
  // keep the order the source lists them in.
  const entries: SkillFileEntry[] = files.map((file) => ({
    path: file.path,
    content: file.content,
    sizeBytes: file.size,
    isEntryPoint: file.path === 'SKILL.md',
  }));

  return {
    status: 'available',
    rendersContent,
    files: [...entries].sort((a, b) => Number(b.isEntryPoint) - Number(a.isEntryPoint)),
  };
};
