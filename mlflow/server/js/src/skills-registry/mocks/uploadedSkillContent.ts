/**
 * Reading a skill folder the user picked, and holding what was read.
 *
 * The upload flow is the one registration mode where the browser is a FULL client: a
 * directory picker hands the page real `File` objects, so it can list the tree, read the
 * bytes and hash them, exactly as `mlflow skills register` would from a checkout. Until
 * this module existed the form took the folder's NAME and dropped the rest, which left an
 * uploaded version with no file listing and a digest synthesized from its identity --
 * indistinguishable, on screen, from a pointer the registry never fetched.
 *
 * Two halves, both here because they are the same fact at two moments:
 *
 *   - Reading    `readUploadedSkillFolder` turns a `FileList` into the listing and the
 *                digest, at pick time, while the user is still looking at the form.
 *   - Holding    `recordUploadedSkillFiles` keeps that listing for the life of the tab, so
 *                `resolveSkillFiles` can return it for a version that has no seed.
 *
 * The listing is deliberately NOT a field on `SkillVersionEntity`. RFC-0008's version
 * entity has no file manifest, and the prototype's standing rule is that fields the
 * backend does not have are absent from the entity -- so this sits beside the store the
 * way `skillFileTrees.ts` sits beside the seeds, as something a client resolved rather
 * than something the registry returned.
 */

import { getSkillQualifiedName } from '../constants';
import type { RegisteredSkillFile } from './skillFileTrees';

/**
 * File bodies are carried up to this size and listed without content above it.
 *
 * `SkillFileEntry.content` is already optional for exactly this case, and the Files tab
 * already says "stored but too large to preview here" when it is missing, so a large
 * file degrades to a row with a size rather than to a blank modal.
 */
const MAX_CARRIED_TEXT_BYTES = 512 * 1024;

/**
 * Directory pickers report EVERYTHING under the chosen folder, including whatever the
 * user's tooling left there. None of it is part of the skill, and a listing led by
 * `.git/objects/...` would bury the files that are.
 */
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', '__pycache__', '.venv', '.idea', '.pytest_cache']);
const IGNORED_FILENAMES = new Set(['.DS_Store', 'Thumbs.db']);

/**
 * The path the registry addresses a file by: relative to the skill root, so the folder
 * the user happened to pick is not baked into every row.
 *
 * `webkitRelativePath` always leads with the picked directory (`my-skill/SKILL.md`), so
 * the first segment goes. A file with no relative path is not from a directory pick at
 * all; falling back to its own name keeps it addressable rather than dropping it.
 */
export const toSkillRelativePath = (webkitRelativePath: string, fallbackName: string): string => {
  const segments = webkitRelativePath.split('/').filter(Boolean);
  return segments.length > 1 ? segments.slice(1).join('/') : fallbackName;
};

/** Whether this path is tooling residue rather than part of the skill. */
export const shouldIgnoreSkillFile = (path: string): boolean => {
  const segments = path.split('/');
  const fileName = segments[segments.length - 1];
  // `._name` is the AppleDouble sidecar macOS writes onto non-HFS volumes.
  if (IGNORED_FILENAMES.has(fileName) || fileName.startsWith('._')) {
    return true;
  }
  return segments.slice(0, -1).some((segment) => IGNORED_DIRECTORIES.has(segment));
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * SHA-256, or nothing.
 *
 * `crypto.subtle` exists only in a secure context. Localhost counts as one, so the dev
 * server has it, but a prototype served over plain HTTP from another host would not --
 * and there the honest answer is no digest rather than a weaker hash wearing SHA-256's
 * shape. The caller falls back to the synthesized stand-in.
 */
const sha256Hex = async (data: Uint8Array<ArrayBuffer>): Promise<string | undefined> => {
  const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle;
  if (!subtle) {
    return undefined;
  }
  return toHex(await subtle.digest('SHA-256', data));
};

/**
 * Text if it decodes as text, bytes otherwise.
 *
 * Sniffed rather than matched against an extension allowlist: skills carry `SKILL.md`
 * beside shell scripts, `LICENSE`, `Makefile` and `.env.example`, and an allowlist would
 * silently blank whichever extension nobody thought of. The bytes are already in hand for
 * hashing, so asking them directly costs nothing.
 */
const decodeText = (bytes: Uint8Array<ArrayBuffer>): string | undefined => {
  if (bytes.byteLength > MAX_CARRIED_TEXT_BYTES) {
    return undefined;
  }
  // A NUL byte is the classic binary tell, and it is checked separately because plenty of
  // binary formats are also valid UTF-8.
  if (bytes.includes(0)) {
    return undefined;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
};

interface ReadFile {
  path: string;
  bytes: Uint8Array<ArrayBuffer>;
}

/**
 * A real content hash over the tree, not over the version's identity.
 *
 * Per-file hash, then a hash of the sorted `path hash` manifest, so the digest changes
 * when a file's CONTENT changes and when a file is added, removed or renamed. Sorting is
 * what makes it canonical: the picker's order is the filesystem's, and two picks of the
 * same folder must not disagree.
 *
 * RFC-0008 does not specify the serialization, so this is not compatible with whatever a
 * real client computes. What it does buy is the property the field exists for: upload the
 * same folder twice and the two versions group as identical content.
 */
const computeTreeDigest = async (entries: ReadFile[]): Promise<string | undefined> => {
  const lines = await Promise.all(
    entries.map(async (entry) => {
      const hash = await sha256Hex(entry.bytes);
      return hash === undefined ? undefined : `${entry.path} ${hash}`;
    }),
  );
  if (lines.some((line) => line === undefined)) {
    return undefined;
  }
  return sha256Hex(new TextEncoder().encode(lines.join('\n')));
};

export interface UploadedSkillFolder {
  /** The directory the user picked, shown back to them and used to infer the skill name. */
  folderName?: string;
  /** The listing, `SKILL.md`-relative and sorted by path. */
  files: RegisteredSkillFile[];
  /** SHA-256 over the tree, absent when `crypto.subtle` is unavailable. */
  digest?: string;
}

/** Reads every file under the picked directory into a listing plus a content digest. */
export const readUploadedSkillFolder = async (fileList: FileList): Promise<UploadedSkillFolder> => {
  const picked = Array.from(fileList);
  const folderName = picked[0]?.webkitRelativePath?.split('/')[0] || undefined;

  const read = await Promise.all(
    picked.map(async (file): Promise<ReadFile | undefined> => {
      const path = toSkillRelativePath(file.webkitRelativePath ?? '', file.name);
      if (shouldIgnoreSkillFile(path)) {
        return undefined;
      }
      return { path, bytes: new Uint8Array(await file.arrayBuffer()) };
    }),
  );

  const entries = read
    .filter((entry): entry is ReadFile => entry !== undefined)
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    folderName,
    files: entries.map((entry) => ({
      path: entry.path,
      size: entry.bytes.byteLength,
      content: decodeText(entry.bytes),
    })),
    digest: await computeTreeDigest(entries),
  };
};

/**
 * Listings for versions registered in this tab, keyed the way everything else here is:
 * `@org/name` plus the version number. Resets on reload along with the rest of the store.
 */
const uploadedFilesByVersion = new Map<string, RegisteredSkillFile[]>();

const versionKey = (organization: string, name: string, version: number) =>
  `${getSkillQualifiedName(organization, name)}/${version}`;

/** Keeps the listing an upload read, so the version's Files tab has something to show. */
export const recordUploadedSkillFiles = (
  organization: string,
  name: string,
  version: number,
  files: RegisteredSkillFile[],
): void => {
  if (files.length) {
    uploadedFilesByVersion.set(versionKey(organization, name, version), files);
  }
};

/** The listing read at registration, or undefined for a version that was not uploaded. */
export const getUploadedSkillFiles = (
  organization: string,
  name: string,
  version: number,
): RegisteredSkillFile[] | undefined => uploadedFilesByVersion.get(versionKey(organization, name, version));
