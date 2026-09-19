/**
 * Behaviour tests for the parts of the Skills Registry prototype that encode a
 * RFC-0008 rule rather than a rendering choice. These are the places a plausible-looking
 * change would silently reintroduce a defect the upstream reviewers already flagged,
 * so each test names the rule it is holding rather than the function it calls.
 */

import { describe, it, expect } from '@jest/globals';

import { EMPTY_SOURCE_INPUT, isSourceInputComplete } from './components/SkillSourceFields';
import { getGitBrowseUrl, getSkillQualifiedName, getSkillVersionUri, parseSkillQualifiedName } from './constants';
import { resolveSkillFiles } from './mocks/skillContent';
import { SKILLS, SKILL_VERSIONS } from './mocks/mockSkills';
import { createSkill, getLatestSkillVersion, getSkillVersionDeleteBlocker } from './mocks/skillsStore';
import { shouldIgnoreSkillFile, toSkillRelativePath } from './mocks/uploadedSkillContent';
import { SkillSourceType, SkillStatus } from './types';
import { groupVersionsByDigest, inferSourceType, parseProviderWebUrl } from './utils';

describe('organization is a field, not a name prefix', () => {
  it('renders the leading @ marker only when a skill is scoped', () => {
    expect(getSkillQualifiedName('rh-sre', 'playbook-generator')).toBe('@rh-sre/playbook-generator');
    expect(getSkillVersionUri('rh-sre', 'playbook-generator', 3)).toBe('skills:/@rh-sre/playbook-generator/3');
    // An unscoped skill omits the segment entirely rather than emitting an empty marker,
    // which is what keeps a bare first segment unambiguously a name.
    expect(getSkillQualifiedName('', 'code-review')).toBe('code-review');
    expect(getSkillVersionUri('', 'code-review', 1)).toBe('skills:/code-review/1');
  });

  it('round-trips through the routing form', () => {
    expect(parseSkillQualifiedName('@rh-sre/playbook-generator')).toEqual({
      organization: 'rh-sre',
      name: 'playbook-generator',
    });
    // Hyphens run through both segments; only the FIRST slash separates them.
    expect(parseSkillQualifiedName('@ocp-admin/network-policy-architect')).toEqual({
      organization: 'ocp-admin',
      name: 'network-policy-architect',
    });
    expect(parseSkillQualifiedName('code-review')).toEqual({ organization: '', name: 'code-review' });
  });

  it('splits every seeded skill into a real organization and a bare name', () => {
    for (const skill of SKILLS) {
      expect(skill.name).not.toContain('/');
      expect(skill).toHaveProperty('organization');
    }
  });
});

describe('a version has exactly one source', () => {
  it('never carries a separate artifact location beside a pointer', () => {
    for (const version of SKILL_VERSIONS) {
      expect(version).not.toHaveProperty('artifact_location');
      expect(typeof version.source.source).toBe('string');
      expect(version.source.source.length).toBeGreaterThan(0);
    }
  });

  it('sets a git ref only on git sources', () => {
    for (const version of SKILL_VERSIONS) {
      if (version.source.source_type !== SkillSourceType.GIT) {
        expect(version.source.ref).toBeUndefined();
      }
    }
  });

  it('uses the MLflow artifact path as the source for uploaded content', () => {
    const mlflowVersions = SKILL_VERSIONS.filter((version) => version.source.source_type === SkillSourceType.MLFLOW);
    expect(mlflowVersions.length).toBeGreaterThan(0);
    for (const version of mlflowVersions) {
      expect(version.source.source).toContain('mlflow-artifacts:/skills/');
    }
  });
});

describe('fields the backend does not have are absent', () => {
  it('stores no commit message and no manifest text on a version', () => {
    for (const version of SKILL_VERSIONS) {
      expect(version).not.toHaveProperty('commit_message');
      expect(version).not.toHaveProperty('manifest_content');
    }
  });
});

describe('content digest', () => {
  it('groups versions that carry identical content', () => {
    // Some skill was re-registered with an unchanged tree, so two of its versions share a
    // digest. Found rather than hard-coded: which skill that is depends on the seeding.
    const pair = SKILL_VERSIONS.reduce<Record<string, string[]>>((acc, version) => {
      if (version.digest) {
        const key = `${version.organization}/${version.name}/${version.digest}`;
        (acc[key] ??= []).push(String(version.version));
      }
      return acc;
    }, {});
    const shared = Object.entries(pair).find(([, versions]) => versions.length > 1);
    expect(shared).toBeDefined();

    const [key] = shared!;
    const [organization, name] = key.split('/');
    const versions = SKILL_VERSIONS.filter((v) => v.organization === organization && v.name === name);
    const groups = groupVersionsByDigest(versions);
    const [a, b] = shared![1].map(Number);
    expect(groups.get(a)).toBeDefined();
    expect(groups.get(a)).toBe(groups.get(b));
  });

  it('leaves a version registered without content inspection ungrouped', () => {
    const versions = SKILL_VERSIONS.filter((version) => version.digest === undefined);
    const withoutDigest = versions.find((version) => version.digest === undefined);
    expect(withoutDigest).toBeDefined();
    // An absent digest must never be treated as a value that can match another absent
    // one: "not computed" is not a content identity.
    expect(groupVersionsByDigest(versions).get(withoutDigest!.version)).toBeUndefined();
  });
});

describe('withdrawn versions', () => {
  it('are held in the store so their numbers are never reused', () => {
    const withdrawn = SKILL_VERSIONS.filter((version) => version.status === SkillStatus.DELETED);
    expect(withdrawn.length).toBeGreaterThan(0);
  });

  it('do not count toward a skill advertised latest version', () => {
    for (const skill of SKILLS) {
      const live = SKILL_VERSIONS.filter(
        (version) =>
          version.organization === skill.organization &&
          version.name === skill.name &&
          version.status !== SkillStatus.DELETED,
      );
      if (!live.length) {
        continue;
      }
      expect(skill.latest_version).toBe(Math.max(...live.map((version) => version.version)));
    }
  });
});

describe('a file listing exists only where the registry actually has one', () => {
  const versionFor = (organization: string, name: string) =>
    SKILL_VERSIONS.filter((version) => version.organization === organization && version.name === name);

  /*
    The registry stores a pointer and never fetches it, so for a git source it does not know
    what the directory holds. Listing paths anyway would be inventing them, and rows nobody
    can open read as broken — which is exactly how it was reported in review.
  */
  it('lists nothing for a git pointer, and says why', () => {
    const versions = versionFor('rh-sre', 'playbook-generator');
    const resolution = resolveSkillFiles(versions[versions.length - 1], versions.length);
    expect(resolution.status).toBe('unlisted');
    expect(resolution.status === 'unlisted' && resolution.reason).toMatch(/read at its source/i);
  });

  // Same outcome, different reason. Separating them earns its keep because the next step
  // differs: browse it yourself, versus you will need credentials the browser lacks.
  it('names credentials as the obstacle for a private repository', () => {
    const versions = versionFor('rh-sre', 'cve-impact');
    const resolution = resolveSkillFiles(versions[0], versions.length);
    expect(resolution.status).toBe('unlisted');
    expect(resolution.status === 'unlisted' && resolution.reason).toMatch(/private git repository/i);
  });

  it('lists and renders MLflow-stored content, which the tracking server holds itself', () => {
    const versions = versionFor('rh-sre', 'remediation');
    const resolution = resolveSkillFiles(versions[0], versions.length);
    expect(resolution.status).toBe('available');
    if (resolution.status !== 'available') {
      return;
    }
    expect(resolution.rendersContent).toBe(true);
    expect(resolution.files[0].path).toBe('SKILL.md');
    expect(resolution.files[0].content).toBeDefined();
  });

  /*
    An OCI image and a ZIP archive each carry an index — an image manifest, a central
    directory — that enumerates contents without unpacking them. The two demo skills model
    a registry that resolved one at registration, which is the case that gives those source
    types a file browser at all.
  */
  it.each([
    ['acme-platform', 'sbom-attestor', SkillSourceType.OCI],
    ['acme-platform', 'release-notes-drafter', SkillSourceType.ZIP],
  ])('lists and renders a resolved index for %s/%s', (organization, name, sourceType) => {
    const versions = versionFor(organization, name);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions[0].source.source_type).toBe(sourceType);

    const resolution = resolveSkillFiles(versions[0], versions.length);
    expect(resolution.status).toBe('available');
    if (resolution.status !== 'available') {
      return;
    }
    expect(resolution.rendersContent).toBe(true);
    expect(resolution.files[0].path).toBe('SKILL.md');
    expect(resolution.files.length).toBeGreaterThan(1);
  });

  // Both demo skills lead the catalogue so the two behaviours are reachable immediately
  // rather than eight pages into a list of git-sourced skills.
  it('puts the source-type demos at the head of the list', () => {
    expect(SKILLS[0].organization).toBe('acme-platform');
    expect(SKILLS[1].organization).toBe('acme-platform');
  });
});

describe('source type is inferred to preselect, never to override', () => {
  it('reads the obvious pointer types out of a location', () => {
    expect(inferSourceType('https://github.com/redhat-ai/skills.git')).toBe(SkillSourceType.GIT);
    expect(inferSourceType('git@github.com:redhat-ai/skills.git')).toBe(SkillSourceType.GIT);
    expect(inferSourceType('oci://ghcr.io/redhat-ai/skills:v1')).toBe(SkillSourceType.OCI);
    expect(inferSourceType('https://example.com/skills.zip')).toBe(SkillSourceType.ZIP);
  });

  /*
    RFC-0008 PR #44 documents `GitSource.url` as ANY clonable URL and demotes the `.git`
    suffix to an inference hint. A clone URL without the suffix is ordinary, so reading it
    as anything but git would reintroduce the misclassification that PR fixed.
  */
  it('does not require a .git suffix to recognise a clone URL', () => {
    expect(inferSourceType('https://github.com/redhat-ai/skills')).toBe(SkillSourceType.GIT);
    expect(inferSourceType('https://gitlab.cee.redhat.com/team/skills')).toBe(SkillSourceType.GIT);
  });

  // Suffix beats host: a release tarball served by a git provider is still an archive.
  it('prefers the archive suffix over the provider host', () => {
    expect(inferSourceType('https://github.com/redhat-ai/skills/archive/v1.zip')).toBe(SkillSourceType.ZIP);
  });

  it('returns nothing for a location it cannot place, leaving the choice alone', () => {
    expect(inferSourceType('')).toBeUndefined();
    expect(inferSourceType('not a url')).toBeUndefined();
  });
});

describe('a pasted browsing URL is corrected rather than registered', () => {
  it('splits a GitHub tree URL into clone URL, ref and path', () => {
    expect(
      parseProviderWebUrl('https://github.com/RHEcosystemAppEng/agentic-plugins/tree/main/rh-sre/skills/remediation'),
    ).toEqual({
      cloneUrl: 'https://github.com/RHEcosystemAppEng/agentic-plugins.git',
      ref: 'main',
      subpath: 'rh-sre/skills/remediation',
    });
  });

  it('handles GitLab dash-prefixed browse paths', () => {
    expect(parseProviderWebUrl('https://gitlab.cee.redhat.com/team/skills/-/tree/main/skills/triage')).toEqual({
      cloneUrl: 'https://gitlab.cee.redhat.com/team/skills.git',
      ref: 'main',
      subpath: 'skills/triage',
    });
  });

  // The registry addresses the DIRECTORY holding SKILL.md, so a blob URL pointing at the
  // file itself must not become a path with no SKILL.md under it.
  it('drops the filename from a blob URL so the path names a directory', () => {
    expect(parseProviderWebUrl('https://github.com/acme/skills/blob/main/skills/review/SKILL.md')?.subpath).toBe(
      'skills/review',
    );
  });

  it('leaves a real clone URL alone', () => {
    expect(parseProviderWebUrl('https://github.com/redhat-ai/skills.git')).toBeUndefined();
  });
});

describe('a registered git version links back to its exact ref', () => {
  it('builds a provider browse URL from the clone URL, ref and path', () => {
    expect(getGitBrowseUrl({ source: 'https://github.com/acme/skills.git', ref: 'v2', subpath: 'skills/review' })).toBe(
      'https://github.com/acme/skills/tree/v2/skills/review',
    );
  });

  it('uses GitLab dash-prefixed paths for GitLab remotes', () => {
    expect(getGitBrowseUrl({ source: 'https://gitlab.cee.redhat.com/team/skills.git', ref: 'main' })).toBe(
      'https://gitlab.cee.redhat.com/team/skills/-/tree/main',
    );
  });

  // An SSH remote has no derivable web host, and a fabricated link would 404.
  it('declines rather than guessing for an SSH remote', () => {
    expect(getGitBrowseUrl({ source: 'git@github.com:acme/skills.git', ref: 'main' })).toBeUndefined();
  });

  /*
    With no ref there is nowhere more precise to point, so the browse URL IS the source.
    Pinned because a caller that renders both unconditionally prints the same link twice --
    which is what the version pane did until it started comparing them.
  */
  it('returns the repository URL itself when the version carries no ref', () => {
    const source = 'https://gitlab.cee.redhat.com/uxd/prototypes/rhoai';
    expect(getGitBrowseUrl({ source })).toBe(source);
    expect(getGitBrowseUrl({ source, subpath: 'skills/triage' })).toBe(source);
  });
});

describe('an active version is retired before it can be deleted', () => {
  const activeVersion = SKILL_VERSIONS.find((version) => version.status === SkillStatus.ACTIVE);

  /*
    RFC-0008 §Per-version status: "Active versions must first be unpublished or deprecated
    before they can be deleted." The prototype previously gated delete only on "is this the
    last live version", which let an active version be deleted in one step.
  */
  it('blocks deletion of an active version and says why', () => {
    expect(activeVersion).toBeDefined();
    if (!activeVersion) {
      return;
    }
    expect(getSkillVersionDeleteBlocker(activeVersion.organization, activeVersion.name, activeVersion.version)).toBe(
      'is-active',
    );
  });

  it('reports an already-withdrawn version as such rather than as deletable', () => {
    const deleted = SKILL_VERSIONS.find((version) => version.status === SkillStatus.DELETED);
    expect(deleted).toBeDefined();
    if (!deleted) {
      return;
    }
    expect(getSkillVersionDeleteBlocker(deleted.organization, deleted.name, deleted.version)).toBe('already-deleted');
  });
});

describe('a skill is a directory, not a single file', () => {
  it('lists SKILL.md first, alongside the reference files and scripts beside it', () => {
    const versions = SKILL_VERSIONS.filter(
      (version) => version.organization === 'rh-sre' && version.name === 'remediation',
    );
    const resolution = resolveSkillFiles(versions[0], versions.length);
    expect(resolution.status).toBe('available');
    if (resolution.status !== 'available') {
      return;
    }
    expect(resolution.files[0].path).toBe('SKILL.md');
    expect(resolution.files[0].isEntryPoint).toBe(true);
    expect(resolution.files.length).toBeGreaterThan(1);
  });
});

describe('an uploaded folder is actually read', () => {
  /*
    The upload flow is the one mode where the browser holds the content, so what it reads
    has to survive registration: a version whose files the client had, listed as though
    nobody ever looked, is the same empty state a pointer produces for a completely
    different reason. Registering through the store rather than asserting on the reader
    because the FileList half needs a DOM and this half is where the defect was.
  */
  const upload = (name: string, files: { path: string; size: number; content?: string }[], digest?: string) => {
    createSkill({
      organization: 'test-org',
      name,
      description: '',
      status: SkillStatus.ACTIVE,
      source: {
        ...EMPTY_SOURCE_INPUT,
        mode: 'upload',
        uploadedFolderName: name,
        uploadedFiles: files,
        uploadedDigest: digest,
      },
    });
    return getLatestSkillVersion('test-org', name)!;
  };

  it('lists and renders what the browser read, for a skill no seed describes', () => {
    const version = upload('uploaded-listing', [
      { path: 'scripts/run.sh', size: 12, content: 'echo hello\n' },
      { path: 'SKILL.md', size: 30, content: '---\nname: uploaded\n---\n' },
    ]);

    const resolution = resolveSkillFiles(version, 1);
    expect(resolution.status).toBe('available');
    if (resolution.status !== 'available') {
      return;
    }
    // Content was uploaded, so the pane may show it rather than linking out.
    expect(resolution.rendersContent).toBe(true);
    expect(resolution.files[0].path).toBe('SKILL.md');
    expect(resolution.files.map((file) => file.path)).toEqual(['SKILL.md', 'scripts/run.sh']);
  });

  it('prefers the digest computed over the content to the identity-derived stand-in', () => {
    const realDigest = 'a'.repeat(64);
    expect(upload('uploaded-digest', [{ path: 'SKILL.md', size: 4, content: 'hi\n' }], realDigest).digest).toBe(
      realDigest,
    );
    // No hash available -- an insecure context, where `crypto.subtle` is absent -- still
    // fills the field, because the client DID read the content and an empty digest means
    // the opposite.
    expect(upload('uploaded-no-hash', [{ path: 'SKILL.md', size: 4, content: 'hi\n' }]).digest).toHaveLength(64);
  });

  it('says the listing is missing rather than blaming the source when an upload read nothing', () => {
    const resolution = resolveSkillFiles(upload('uploaded-empty', []), 1);
    expect(resolution.status).toBe('unlisted');
    // Not the git wording: MLflow holds this content, so "read it at its source" would be
    // pointing at the registry itself.
    expect(resolution.status === 'unlisted' && resolution.reason).toMatch(/no file listing was captured/i);
  });

  it('addresses files relative to the skill root, not to the folder that was picked', () => {
    expect(toSkillRelativePath('arena-research-skill-main/SKILL.md', 'SKILL.md')).toBe('SKILL.md');
    expect(toSkillRelativePath('arena-research-skill-main/scripts/run.sh', 'run.sh')).toBe('scripts/run.sh');
    // A file with no relative path did not come from a directory pick; it keeps its name.
    expect(toSkillRelativePath('', 'SKILL.md')).toBe('SKILL.md');
  });

  it('drops tooling residue the picker reports alongside the skill', () => {
    expect(shouldIgnoreSkillFile('.git/objects/ab/cdef')).toBe(true);
    expect(shouldIgnoreSkillFile('scripts/__pycache__/run.cpython-312.pyc')).toBe(true);
    expect(shouldIgnoreSkillFile('.DS_Store')).toBe(true);
    expect(shouldIgnoreSkillFile('reference/._notes.md')).toBe(true);
    // A dotfile the skill genuinely ships is not residue.
    expect(shouldIgnoreSkillFile('SKILL.md')).toBe(false);
    expect(shouldIgnoreSkillFile('.env.example')).toBe(false);
  });
});

describe('the registration mode is chosen, never assumed', () => {
  it('starts with no mode and refuses to submit until one is picked', () => {
    expect(EMPTY_SOURCE_INPUT.mode).toBeUndefined();
    // Not merely "no content yet": with no mode there is no question to have answered,
    // and a form that let this through would register whichever mode the code fell back to.
    expect(isSourceInputComplete(EMPTY_SOURCE_INPUT)).toBe(false);
    expect(isSourceInputComplete({ ...EMPTY_SOURCE_INPUT, sourceUri: 'https://github.com/acme/skills' })).toBe(false);
    expect(isSourceInputComplete({ ...EMPTY_SOURCE_INPUT, uploadedFolderName: 'my-skill' })).toBe(false);
  });

  it('completes once a mode is picked and that mode has what it needs', () => {
    expect(
      isSourceInputComplete({ ...EMPTY_SOURCE_INPUT, mode: 'pointer', sourceUri: 'https://github.com/acme/skills' }),
    ).toBe(true);
    expect(isSourceInputComplete({ ...EMPTY_SOURCE_INPUT, mode: 'pointer' })).toBe(false);
    expect(isSourceInputComplete({ ...EMPTY_SOURCE_INPUT, mode: 'upload', uploadedFolderName: 'my-skill' })).toBe(true);
    // Each mode is judged on its own field: an uploaded folder does not satisfy a pointer.
    expect(isSourceInputComplete({ ...EMPTY_SOURCE_INPUT, mode: 'pointer', uploadedFolderName: 'my-skill' })).toBe(
      false,
    );
  });
});
