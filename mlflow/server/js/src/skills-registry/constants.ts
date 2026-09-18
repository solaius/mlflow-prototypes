/**
 * URI grammar and consume-command builders for the Skills Registry, per RFC-0008.
 *
 * The organization marker is a leading `@` on the FIRST segment. A skill with no
 * organization omits the segment entirely rather than rendering an empty marker, which
 * is what keeps `skills:/code-review/1` unambiguous: a bare first segment is always a
 * name, never an organization.
 */

/** Scheme for referencing registered skills, per RFC-0008. */
export const SKILLS_URI_SCHEME = 'skills:/';

/**
 * `@{organization}/{name}`, or plain `{name}` when unscoped. This is the identifier
 * that appears after the scheme in every URI form, in the REST path
 * `/@{organization}/{name}`, and in this prototype's route params.
 */
export const getSkillQualifiedName = (organization: string, name: string): string =>
  organization ? `@${organization}/${name}` : name;

/**
 * Inverse of `getSkillQualifiedName`. A leading `@` means the first segment is an
 * organization; anything else is a bare name, even if it contains slashes.
 */
export const parseSkillQualifiedName = (qualifiedName: string): { organization: string; name: string } => {
  if (!qualifiedName.startsWith('@')) {
    return { organization: '', name: qualifiedName };
  }
  const separator = qualifiedName.indexOf('/');
  if (separator === -1) {
    return { organization: '', name: qualifiedName };
  }
  return {
    organization: qualifiedName.slice(1, separator),
    name: qualifiedName.slice(separator + 1),
  };
};

/** `skills:/@{org}/{name}` - resolves to the newest active version. */
export const getSkillUri = (organization: string, name: string) =>
  `${SKILLS_URI_SCHEME}${getSkillQualifiedName(organization, name)}`;

/** `skills:/@{org}/{name}/{version}` - pins an exact version. */
export const getSkillVersionUri = (organization: string, name: string, version: number | string) =>
  `${getSkillUri(organization, name)}/${version}`;

/** `skills:/@{org}/{name}@{alias}` - resolves through a mutable alias pointer. */
export const getSkillAliasUri = (organization: string, name: string, alias: string) =>
  `${getSkillUri(organization, name)}@${alias}`;

/**
 * Root of the artifact namespace that content uploaded through the client-side upload
 * flow is stored under. Only `source_type = 'mlflow'` versions have one: the server
 * chooses the path, and it becomes that version's `source`.
 */
export const SKILL_ARTIFACT_ROOT = 'mlflow-artifacts:/skills';

export const getSkillArtifactPath = (organization: string, name: string, version: number) =>
  `${SKILL_ARTIFACT_ROOT}/${getSkillQualifiedName(organization, name)}/${version}/`;

/**
 * Turns a git clone URL plus ref and subpath back into a provider BROWSE url.
 *
 * The inverse of the paste correction in `parseProviderWebUrl`, and the reason both
 * exist: the 2026-09-01 UX review ruled that a git-sourced version links out to its
 * provider rather than having its content rendered in the page. So the clone URL the
 * user registered has to become a link a human can click.
 *
 * Only https provider URLs can be linearised this way. An `ssh://` or `git@` remote has
 * no browse equivalent that can be derived without knowing the provider's web host, so
 * this returns `undefined` and the caller shows the source as plain text instead of
 * fabricating a link that 404s.
 */
export const getGitBrowseUrl = ({
  source,
  ref,
  subpath,
}: {
  source: string;
  ref?: string;
  subpath?: string;
}): string | undefined => {
  if (!/^https?:\/\//i.test(source)) {
    return undefined;
  }
  const base = source.replace(/\.git$/i, '').replace(/\/$/, '');
  if (!ref) {
    return base;
  }
  // GitLab nests browse paths under `/-/`; GitHub and most others do not. Getting this
  // wrong produces a link that loads a wrong-looking 404 rather than failing loudly.
  const separator = /gitlab/i.test(base) ? '/-/tree/' : '/tree/';
  const path = subpath ? `/${subpath.replace(/^\/+/, '')}` : '';
  return `${base}${separator}${encodeURIComponent(ref)}${path}`;
};

/**
 * Provider URL for ONE file inside a registered git source.
 *
 * The file browser uses this so every row does something for a git-sourced skill. The
 * registry does not render that content — the 2026-09-01 review settled that it links out
 * instead — but a listing whose rows cannot be opened is the worst of both, so each row
 * opens the real file at the real ref.
 */
export const getGitFileUrl = ({
  source,
  ref,
  subpath,
  filePath,
}: {
  source: string;
  ref?: string;
  subpath?: string;
  filePath: string;
}): string | undefined => {
  if (!/^https?:\/\//i.test(source)) {
    return undefined;
  }
  const base = source.replace(/\.git$/i, '').replace(/\/$/, '');
  const separator = /gitlab/i.test(base) ? '/-/blob/' : '/blob/';
  const dir = subpath ? `/${subpath.replace(/^\/+|\/+$/g, '')}` : '';
  return `${base}${separator}${encodeURIComponent(ref ?? 'HEAD')}${dir}/${filePath}`;
};

/** Default destination offered in the consume snippets. */
export const DEFAULT_PULL_DESTINATION = './skills';

/**
 * `mlflow skills pull <uri> --destination <dir>` - the CLI form from RFC-0008's user
 * journeys, verbatim. Flag name is `--destination`, matching the SDK parameter.
 */
export const getSkillPullCommand = (uri: string, destination = DEFAULT_PULL_DESTINATION) =>
  `mlflow skills pull ${uri} \\\n    --destination ${destination}`;

/**
 * Fields the register snippets are built from. Deliberately the same shape the create
 * form holds, so the snippets track what the user has typed rather than showing a
 * generic example: the point of offering CLI and Python alongside the form is that the
 * three are the SAME registration expressed three ways.
 */
export interface SkillRegisterInput {
  organization: string;
  name: string;
  /** `git`, `oci` or `zip` — the CLI's subcommand and the SDK's source class. */
  sourceType: string;
  sourceUri: string;
  ref?: string;
  subpath?: string;
  status?: string;
}

/**
 * `mlflow skills register <type> --url ... ` — the CLI form RFC-0008's user journeys
 * use verbatim, including its minimal shape: the RFC's own example omits `--name`
 * because the CLI infers it from SKILL.md after cloning. This builder emits `--name`
 * only when the user actually typed one, so the snippet stays honest about what is
 * required rather than padding every flag in.
 */
export const getSkillRegisterCommand = ({
  organization,
  name,
  sourceType,
  sourceUri,
  ref,
  subpath,
  status,
}: SkillRegisterInput): string => {
  const urlFlag = sourceType === 'git' ? '--url' : sourceType === 'oci' ? '--image' : '--url';
  const parts = [`mlflow skills register ${sourceType}`];
  if (name) {
    parts.push(`--name ${name}`);
  }
  if (organization) {
    parts.push(`--organization ${organization}`);
  }
  parts.push(`${urlFlag} ${sourceUri || '<location>'}`);
  if (ref) {
    parts.push(`--ref ${ref}`);
  }
  if (subpath) {
    parts.push(`--subpath ${subpath}`);
  }
  if (status && status !== 'active') {
    parts.push(`--status ${status}`);
  }
  return parts.join(' \\\n    ');
};

/**
 * The `mlflow.genai.register_skill()` equivalent, using the typed source classes the
 * RFC's examples use (`GitSource`, `OCISource`, `ZipSource`) rather than a loose dict.
 */
export const getSkillRegisterSnippet = ({
  organization,
  name,
  sourceType,
  sourceUri,
  ref,
  subpath,
  status,
}: SkillRegisterInput): string => {
  const sourceClass = sourceType === 'git' ? 'GitSource' : sourceType === 'oci' ? 'OCISource' : 'ZipSource';
  // Each source class names its location argument after what the location IS, so an
  // image reference is not passed as a `url`.
  const locationArg = sourceType === 'oci' ? 'image' : 'url';

  const sourceArgs = [`${locationArg}="${sourceUri || '<location>'}"`];
  if (ref) {
    sourceArgs.push(`ref="${ref}"`);
  }
  if (subpath) {
    sourceArgs.push(`subpath="${subpath}"`);
  }

  const callArgs: string[] = [];
  if (name) {
    callArgs.push(`name="${name}"`);
  }
  if (organization) {
    callArgs.push(`organization="${organization}"`);
  }
  callArgs.push(`source=${sourceClass}(\n        ${sourceArgs.join(',\n        ')},\n    )`);
  if (status && status !== 'active') {
    callArgs.push(`status="${status}"`);
  }

  return [
    'import mlflow.genai',
    `from mlflow.genai import ${sourceClass}`,
    '',
    'mlflow.genai.register_skill(',
    `    ${callArgs.join(',\n    ')},`,
    ')',
  ].join('\n');
};

/**
 * The `mlflow.genai.pull()` equivalent. The SDK addresses a skill by its parts rather
 * than by URI, so an unscoped skill simply omits `organization`.
 */
export const getSkillPullSnippet = ({
  organization,
  name,
  version,
  alias,
  destination = DEFAULT_PULL_DESTINATION,
}: {
  organization: string;
  name: string;
  version?: number;
  alias?: string;
  destination?: string;
}) => {
  const args = [`name="${name}"`];
  if (organization) {
    args.push(`organization="${organization}"`);
  }
  if (alias) {
    args.push(`alias="${alias}"`);
  } else if (version !== undefined) {
    args.push(`version=${version}`);
  }
  args.push(`destination="${destination}"`);
  return `import mlflow.genai\n\nmlflow.genai.pull(\n    ${args.join(',\n    ')},\n)`;
};
