/**
 * Two purpose-built skills that demonstrate the OCI and ZIP source types.
 *
 * WHY THEY EXIST, and why they are separate from `skillSeeds.ts`. The seeded catalogue is
 * real — every skill in it is published today in Red Hat's agentic collections — and those
 * collections distribute exclusively through git. Relabelling one of them as an OCI image
 * would misrepresent a real skill to fill a gap in the demo, so the gap is filled here
 * instead, with entries that are openly synthetic and say so.
 *
 * They also answer a question the seeded catalogue cannot. A git pointer's files are read
 * at the provider, so its listing links out and nothing renders in the page. An OCI image
 * and a ZIP archive have no provider to link to — but both carry an INDEX that enumerates
 * their contents without unpacking them: an image manifest for OCI, the central directory
 * for ZIP. A registry that resolved either at registration therefore knows the file list
 * and can hold the entry point, which is what these two show.
 *
 * That is a modelling claim, not something RFC-0008 states. It is the same open question
 * flagged in `skillFileTrees.ts` — where a registry gets a listing for content it does not
 * store — made concrete for two source types, so the working session has something to
 * react to rather than an abstraction.
 *
 * They are listed FIRST so the two file-browser behaviours are reachable without hunting
 * through eight pages of git-sourced skills.
 */

import { SkillSourceType, SkillStatus } from '../types';
import type { RegisteredSkillFile } from './skillFileTrees';
import type { SkillSeed } from './skillSeeds';

const SBOM_ATTESTOR_SKILL = `---
name: sbom-attestor
description: >
  Attach and verify SBOM attestations on container images. Use when a release gate needs
  proof that an image's bill of materials was signed by a trusted builder, or when an
  auditor asks which components shipped in a given digest.
license: Apache-2.0
allowed-tools: Read Bash
metadata:
  destructive: false
---

# SBOM Attestor

Attaches an SPDX or CycloneDX bill of materials to a container image as a signed
attestation, and verifies attestations already attached to an image.

## When to use this skill

- A release gate requires a signed SBOM before an image can be promoted.
- An auditor asks what shipped inside a specific image digest.
- A CVE report names a component and you need to know which images contain it.

## Instructions

1. Resolve the image reference to a digest. Attestations bind to digests, never to tags,
   so a tag that has moved will verify against the wrong content.
2. Generate the SBOM from the image filesystem rather than from the build manifest, so
   what is attested is what actually shipped.
3. Sign the attestation with the builder identity, not a personal key.
4. Verify by fetching the attestation for the digest and checking the signature chain
   against the expected issuer before trusting any component list.

## Notes

An unsigned SBOM is a claim, not evidence. Never promote an image on the strength of an
SBOM whose signature has not been checked against the expected builder identity.
`;

const SBOM_VERIFY = `#!/usr/bin/env bash
# Verify the SBOM attestation attached to an image digest.
set -euo pipefail

IMAGE="\${1:?usage: verify.sh <image@sha256:...>}"
EXPECTED_ISSUER="\${EXPECTED_ISSUER:?set EXPECTED_ISSUER to the builder identity}"

cosign verify-attestation \\
  --type spdxjson \\
  --certificate-oidc-issuer "\${EXPECTED_ISSUER}" \\
  "\${IMAGE}"
`;

const SBOM_REFERENCE = `# Attestation formats

| Format     | Predicate type                  | Use when |
|------------|---------------------------------|----------|
| SPDX JSON  | \`https://spdx.dev/Document\`     | The consumer is a compliance tool |
| CycloneDX  | \`https://cyclonedx.org/bom\`     | The consumer is a vulnerability scanner |

Both bind to an image DIGEST. An attestation attached to a tag is not portable: the tag
can be repointed, and the attestation then describes content nobody is running.
`;

const RELEASE_NOTES_SKILL = `---
name: release-notes-drafter
description: >
  Draft release notes from merged pull requests and closed issues between two refs. Use
  when cutting a release and the changelog has to be assembled from what actually merged
  rather than from what was planned.
license: Apache-2.0
allowed-tools: Read Bash
---

# Release Notes Drafter

Assembles a release note from the commits, merged pull requests and closed issues between
two refs, grouped by the labels the project already uses.

## When to use this skill

- A release is being cut and the changelog has to reflect what merged.
- A milestone closed and someone needs the user-facing summary of it.
- A hotfix needs a note describing only what changed since the previous patch.

## Instructions

1. Resolve both refs to commits, so a moving branch cannot change the range underneath the
   draft.
2. Collect merged pull requests in the range and group them by label, falling back to the
   commit type prefix when a pull request carries no label.
3. Write each entry from the user's point of view. "Fixed a crash when opening an empty
   project" beats "null check in ProjectLoader".
4. List breaking changes first, with the migration step beside each one.

## Notes

Entries without a linked issue or pull request are reported separately rather than
dropped: a direct push to the release branch is exactly the thing a reader needs to see.
`;

const RELEASE_NOTES_TEMPLATE = `## {{ version }} — {{ date }}

### Breaking changes
{{#each breaking}}
- {{ summary }} ({{ link }})
  - Migration: {{ migration }}
{{/each}}

### Added
{{#each added}}
- {{ summary }} ({{ link }})
{{/each}}

### Fixed
{{#each fixed}}
- {{ summary }} ({{ link }})
{{/each}}
`;

const bytes = (value: string): number => {
  let total = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    total += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return total;
};

const file = (path: string, content: string): RegisteredSkillFile => ({
  path,
  size: bytes(content),
  content,
});

/**
 * File listings for the two demo skills, keyed the same way the generated trees are.
 *
 * Both carry content, because both model a source whose index the registry resolved at
 * registration. Neither has a provider page to link a row out to, which is precisely the
 * difference from a git pointer that makes them worth showing.
 */
export const DEMO_SKILL_FILES = {
  'acme-platform/sbom-attestor': [
    file('SKILL.md', SBOM_ATTESTOR_SKILL),
    file('references/attestation-formats.md', SBOM_REFERENCE),
    file('scripts/verify.sh', SBOM_VERIFY),
  ],
  'acme-platform/release-notes-drafter': [
    file('SKILL.md', RELEASE_NOTES_SKILL),
    file('templates/release-notes.md.hbs', RELEASE_NOTES_TEMPLATE),
  ],
} satisfies Record<string, RegisteredSkillFile[]>;

/**
 * Seeds for the two demo skills.
 *
 * `acme-platform` is an obviously invented organization, and that is deliberate: it keeps
 * them visibly distinct from the real collections in the same list, so nobody reads them
 * as Red Hat's published skills.
 */
export const DEMO_SKILL_SEEDS: SkillSeed[] = [
  {
    organization: 'acme-platform',
    name: 'sbom-attestor',
    title: 'SBOM Attestor',
    description:
      'Attach and verify SBOM attestations on container images. Demo entry: shows how the file browser reads a skill delivered as an OCI image, where the image manifest lists the contents and there is no provider page to link out to.',
    category: 'security',
    tags: ['sbom', 'attestation', 'supply-chain', 'demo'],
    sourceType: SkillSourceType.OCI,
    repo: 'oci://quay.io/acme-platform/skills/sbom-attestor:1.4.0',
    path: '',
    author: 'acme-platform',
    versions: [
      {
        revision: '',
        daysAgo: 61,
        aliases: [],
        created_by: 'acme-platform',
      },
      {
        revision: '',
        daysAgo: 2,
        aliases: ['production'],
        created_by: 'acme-platform',
        tags: [{ key: 'registered_from', value: 'quay.io/acme-platform/skills/sbom-attestor:1.4.0' }],
      },
    ],
  },
  {
    organization: 'acme-platform',
    name: 'release-notes-drafter',
    title: 'Release Notes Drafter',
    description:
      "Draft release notes from merged pull requests between two refs. Demo entry: shows how the file browser reads a skill delivered as a ZIP archive, where the archive's central directory lists the contents without unpacking it.",
    category: 'documentation',
    tags: ['release', 'changelog', 'documentation', 'demo'],
    sourceType: SkillSourceType.ZIP,
    repo: 'https://artifacts.acme-platform.example/skills/release-notes-drafter-2.1.0.zip',
    path: '',
    author: 'acme-platform',
    versions: [
      {
        revision: '',
        daysAgo: 35,
        aliases: [],
        created_by: 'acme-platform',
        status: SkillStatus.DEPRECATED,
      },
      {
        revision: '',
        daysAgo: 6,
        aliases: ['staging'],
        created_by: 'acme-platform',
        tags: [{ key: 'registered_from', value: 'release-notes-drafter-2.1.0.zip' }],
      },
    ],
  },
];
