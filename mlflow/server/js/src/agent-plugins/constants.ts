/**
 * URI grammar and consume-command builders for the Agent Plugins registry, per RFC-0008
 * §Skill and Agent Plugin URI formats and the CLI mapping in its implementation details.
 *
 * Agent plugins use their own scheme because their versions are SemVer strings rather than
 * the integers skills carry. The organization marker is the same leading `@` on the first
 * segment, omitted entirely when empty, so `agent-plugins:/pr-workflow/1.0.0` and
 * `agent-plugins:/@acme/pr-workflow/1.0.0` parse without inspecting whether a segment
 * looks like a version.
 */

import { getSkillQualifiedName } from '../skills-registry/constants';
import type { AgentPluginMember } from './types';
import { MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL } from './types';

export const AGENT_PLUGINS_URI_SCHEME = 'agent-plugins:/';

/** Proposed by RFC-0010 for MCP server references; RFC-0004 defines no scheme of its own. */
export const MCP_SERVERS_URI_SCHEME = 'mcp-servers:/';

/**
 * `@{organization}/{name}`, or plain `{name}` when unscoped -- the same grammar skills use,
 * and what the REST path `/@{organization}/{name}` and every URI form are built from.
 */
export const getPluginQualifiedName = (organization: string, name: string): string =>
  getSkillQualifiedName(organization, name);

/**
 * Kept under the name the cross-registry callers already use. It returns the qualified
 * form now: an `org/name` rendering without the `@` marker was the one place a plugin read
 * differently from the skill beside it in the same table.
 */
export const getPluginDisplayName = getPluginQualifiedName;

/** `agent-plugins:/@{org}/{name}` -- the parent; resolves to the latest active version. */
export const getAgentPluginUri = (organization: string, name: string) =>
  `${AGENT_PLUGINS_URI_SCHEME}${getPluginQualifiedName(organization, name)}`;

/** `agent-plugins:/@{org}/{name}/{version}` -- an exact, immutable version. */
export const getAgentPluginVersionUri = (organization: string, name: string, version: string) =>
  `${getAgentPluginUri(organization, name)}/${version}`;

/** `agent-plugins:/@{org}/{name}@{alias}` -- resolves through a mutable alias pointer. */
export const getAgentPluginAliasUri = (organization: string, name: string, alias: string) =>
  `${getAgentPluginUri(organization, name)}@${alias}`;

/** The member reference a plugin version stores, per member type. */
export const getMemberUri = (member: AgentPluginMember): string => {
  if (member.member_type === MEMBER_TYPE_SKILL) {
    return `skills:/${member.name}${member.version !== undefined ? `/${member.version}` : ''}`;
  }
  if (member.member_type === MEMBER_TYPE_MCP_SERVER) {
    return `${MCP_SERVERS_URI_SCHEME}${member.name}${member.version !== undefined ? `/${member.version}` : ''}`;
  }
  return `${member.member_type}:${member.name}`;
};

/** Default destination offered in the consume snippets. */
export const DEFAULT_PULL_DESTINATION = './plugins';

/** `mlflow agent-plugins pull <uri> --destination <dir>`, the CLI form from the RFC's mapping table. */
export const getPluginPullCommand = (uri: string, destination = DEFAULT_PULL_DESTINATION) =>
  `mlflow agent-plugins pull ${uri} \\\n    --destination ${destination}`;

/**
 * The `mlflow.genai.pull()` equivalent. One function serves both entity types in the RFC,
 * selected by `entity_type`, which is why the snippet names it explicitly.
 */
export const getPluginPullSnippet = ({
  organization,
  name,
  version,
  alias,
  destination = DEFAULT_PULL_DESTINATION,
}: {
  organization: string;
  name: string;
  version?: string;
  alias?: string;
  destination?: string;
}) => {
  const args = [`name="${name}"`];
  if (organization) {
    args.push(`organization="${organization}"`);
  }
  args.push('entity_type="agent_plugin"');
  if (alias) {
    args.push(`alias="${alias}"`);
  } else if (version) {
    args.push(`version="${version}"`);
  }
  args.push(`destination="${destination}"`);
  return `import mlflow.genai\n\nmlflow.genai.pull(\n    ${args.join(',\n    ')},\n)`;
};

/**
 * Fields the register snippets are built from: the same shape the create form holds, so the
 * CLI and Python arms show the registration the user is describing rather than an example.
 */
export interface PluginRegisterInput {
  organization: string;
  name: string;
  version: string;
  /** Frozen member references, in URI form. Assembled registrations only. */
  skillUris: string[];
  mcpServerUris: string[];
  status?: string;
}

export interface PluginImportInput {
  organization: string;
  /** `git`, `oci` or `zip`. */
  sourceType: string;
  sourceUri: string;
  ref?: string;
  subpath?: string;
  /** Only needed when the detected manifest declares no version. */
  version?: string;
}

/** `mlflow agent-plugins register --name ... --version ... --skill skills:/...`, per the RFC's first journey. */
export const getPluginRegisterCommand = ({
  organization,
  name,
  version,
  skillUris,
  mcpServerUris,
  status,
}: PluginRegisterInput): string => {
  const parts = [`mlflow agent-plugins register --name ${name || '<name>'}`];
  if (organization) {
    parts.push(`--organization ${organization}`);
  }
  parts.push(`--version ${version || '<version>'}`);
  for (const uri of skillUris) {
    parts.push(`--skill ${uri}`);
  }
  // RFC-0010's assembly journey: `--mcp-server mcp-servers:/name/version`.
  for (const uri of mcpServerUris) {
    parts.push(`--mcp-server ${uri}`);
  }
  if (status && status !== 'active') {
    parts.push(`--status ${status}`);
  }
  return parts.join(' \\\n    ');
};

/** The `mlflow.genai.register_agent_plugin()` equivalent, with the RFC's keyword arguments. */
export const getPluginRegisterSnippet = ({
  organization,
  name,
  version,
  skillUris,
  mcpServerUris,
  status,
}: PluginRegisterInput): string => {
  const args = [`name="${name || '<name>'}"`];
  if (organization) {
    args.push(`organization="${organization}"`);
  }
  args.push(`version="${version || '<version>'}"`);
  if (skillUris.length) {
    args.push(`skills=[\n        ${skillUris.map((uri) => `"${uri}"`).join(',\n        ')},\n    ]`);
  }
  if (mcpServerUris.length) {
    args.push(`mcp_servers=[\n        ${mcpServerUris.map((uri) => `"${uri}"`).join(',\n        ')},\n    ]`);
  }
  if (status && status !== 'active') {
    args.push(`status="${status}"`);
  }
  return ['import mlflow.genai', '', 'mlflow.genai.register_agent_plugin(', `    ${args.join(',\n    ')},`, ')'].join(
    '\n',
  );
};

/** `mlflow agent-plugins import --source ... --ref ... --subpath ...`, per the RFC's import journey. */
export const getPluginImportCommand = ({
  organization,
  sourceUri,
  ref,
  subpath,
  version,
}: PluginImportInput): string => {
  const parts = [`mlflow agent-plugins import --source ${sourceUri || '<location>'}`];
  if (organization) {
    parts.push(`--organization ${organization}`);
  }
  if (ref) {
    parts.push(`--ref ${ref}`);
  }
  if (subpath) {
    parts.push(`--subpath ${subpath}`);
  }
  if (version) {
    parts.push(`--version ${version}`);
  }
  return parts.join(' \\\n    ');
};

/** The `mlflow.genai.import_agent_plugin()` equivalent, using the typed source classes. */
export const getPluginImportSnippet = ({
  organization,
  sourceType,
  sourceUri,
  ref,
  subpath,
  version,
}: PluginImportInput): string => {
  const sourceClass = sourceType === 'git' ? 'GitSource' : sourceType === 'oci' ? 'OCISource' : 'ZipSource';
  const locationArg = sourceType === 'oci' ? 'image' : 'url';
  const sourceArgs = [`${locationArg}="${sourceUri || '<location>'}"`];
  if (ref) {
    sourceArgs.push(`ref="${ref}"`);
  }
  if (subpath) {
    sourceArgs.push(`subpath="${subpath}"`);
  }
  const callArgs = [`source=${sourceClass}(\n        ${sourceArgs.join(',\n        ')},\n    )`];
  if (organization) {
    callArgs.push(`organization="${organization}"`);
  }
  if (version) {
    callArgs.push(`version="${version}"`);
  }
  return [
    'import mlflow.genai',
    `from mlflow.genai import ${sourceClass}`,
    '',
    'result = mlflow.genai.import_agent_plugin(',
    `    ${callArgs.join(',\n    ')},`,
    ')',
    '# result.plugin_version and result.skill_versions carry what was registered',
  ].join('\n');
};
