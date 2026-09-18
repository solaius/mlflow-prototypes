/**
 * URI grammar and register-snippet builders for the Agent Registry, per RFC-0011's basic
 * example and the `skills:/` grammar it inherits.
 */

import type { AgentBom, AgentVersionScheme, ModelRef } from './types';

/** Scheme for referencing registered agents, mirroring `skills:/` and `agent-plugins:/`. */
export const AGENTS_URI_SCHEME = 'agents:/';

/**
 * `@{organization}/{name}`, or plain `{name}` when unscoped -- the same grammar RFC-0008
 * gives skills, and for the same reason: organization is a field on the record, so the
 * leading `@` marks a real scope rather than decorating a slash inside a name.
 */
export const getAgentQualifiedName = (organization: string, name: string): string =>
  organization ? `@${organization}/${name}` : name;

/** `agents:/@{org}/{name}` -- resolves to the newest active version. */
export const getAgentUri = (organization: string, name: string) =>
  `${AGENTS_URI_SCHEME}${getAgentQualifiedName(organization, name)}`;

/** `agents:/@{org}/{name}/{version}` -- pins an exact, immutable version. */
export const getAgentVersionUri = (organization: string, name: string, version: string) =>
  `${getAgentUri(organization, name)}/${version}`;

/** `agents:/@{org}/{name}@{alias}` -- resolves through a mutable alias pointer. */
export const getAgentAliasUri = (organization: string, name: string, alias: string) =>
  `${getAgentUri(organization, name)}@${alias}`;

/** A model reference as RFC-0011 writes it: `models:/name/version` for registry models, a bare id otherwise. */
export const getModelRefUri = (ref: ModelRef): string =>
  ref.version ? `models:/${ref.name}/${ref.version}` : ref.name;

/** Fields the register snippets are built from: the same shape the form holds. */
export interface AgentRegisterInput {
  organization: string;
  name: string;
  description: string;
  versionScheme: AgentVersionScheme;
  version?: string;
  sources: { sourceType: string; sourceUri: string; ref?: string; subpath?: string }[];
  harness?: { name: string; version?: string };
  configSnapshotPath?: string;
  a2aEndpoint?: string;
  bom: AgentBom;
  status?: string;
}

const pythonList = (items: string[]) => `[\n        ${items.map((item) => `"${item}"`).join(',\n        ')},\n    ]`;

/**
 * The `mlflow.genai.register_agent()` call from RFC-0011's basic example, with the typed
 * source classes (`GitSource`, `OciSource`, `ZipSource`), the harness path
 * (`harness`, `harness_version`, `config_snapshot`) and the A2A path (`a2a_endpoint`).
 */
export const getAgentRegisterSnippet = (input: AgentRegisterInput): string => {
  const sourceClasses = new Set<string>();
  const sourceArgs = input.sources
    .filter((source) => source.sourceUri.trim())
    .map((source) => {
      const cls = source.sourceType === 'git' ? 'GitSource' : source.sourceType === 'oci' ? 'OciSource' : 'ZipSource';
      sourceClasses.add(cls);
      const parts = [`${source.sourceType === 'oci' ? 'image' : 'url'}="${source.sourceUri.trim()}"`];
      if (source.ref) {
        parts.push(`ref="${source.ref}"`);
      }
      if (source.subpath) {
        parts.push(`subpath="${source.subpath}"`);
      }
      return `${cls}(${parts.join(', ')})`;
    });

  const args = [`name="${getAgentQualifiedName(input.organization, input.name) || '<@org/name>'}"`];
  args.push(`description="${input.description || '<description>'}"`);
  if (sourceArgs.length) {
    args.push(`sources=[\n        ${sourceArgs.join(',\n        ')},\n    ]`);
  }
  if (input.harness?.name) {
    args.push(`harness="${input.harness.name}"`);
    if (input.harness.version) {
      args.push(`harness_version="${input.harness.version}"`);
    }
  }
  if (input.configSnapshotPath) {
    args.push(`config_snapshot="${input.configSnapshotPath}"`);
  }
  if (input.a2aEndpoint) {
    args.push(`a2a_endpoint="${input.a2aEndpoint}"`);
  }
  if (input.bom.skills.length) {
    args.push(`skills=${pythonList(input.bom.skills.map((ref) => `skills:/${ref.name}/${ref.version}`))}`);
  }
  if (input.bom.agent_plugins.length) {
    args.push(
      `agent_plugins=${pythonList(input.bom.agent_plugins.map((ref) => `agent-plugins:/${ref.name}/${ref.version}`))}`,
    );
  }
  if (input.bom.mcp_servers.length) {
    args.push(
      `mcp_servers=${pythonList(input.bom.mcp_servers.map((ref) => `mcp-servers:/${ref.name}/${ref.version}`))}`,
    );
  }
  if (input.bom.models.length) {
    args.push(`models=${pythonList(input.bom.models.map(getModelRefUri))}`);
  }
  if (input.bom.agents.length) {
    args.push(
      `agents=${pythonList(input.bom.agents.map((ref) => `agents:/${ref.name}${ref.version ? `/${ref.version}` : ''}`))}`,
    );
  }
  if (input.versionScheme !== 'monotonic') {
    args.push(`version_scheme="${input.versionScheme}"`);
    if (input.version) {
      args.push(`version="${input.version}"`);
    }
  }
  if (input.status && input.status !== 'draft') {
    args.push(`status="${input.status}"`);
  }

  const imports = ['import mlflow.genai'];
  if (sourceClasses.size) {
    imports.push(`from mlflow.genai import ${[...sourceClasses].sort().join(', ')}`);
  }
  return [...imports, '', 'mlflow.genai.register_agent(', `    ${args.join(',\n    ')},`, ')'].join('\n');
};

/**
 * A CLI form following the shape of the skill and plugin CLIs (`mlflow agents register`).
 * RFC-0011 names the CLI as a surface without spelling its flags, so this is illustrative
 * in the same way the RFC's own API sketches are.
 */
export const getAgentRegisterCommand = (input: AgentRegisterInput): string => {
  const parts = [`mlflow agents register --name ${input.name || '<name>'}`];
  if (input.organization) {
    parts.push(`--organization ${input.organization}`);
  }
  parts.push(`--description "${input.description || '<description>'}"`);
  for (const source of input.sources.filter((s) => s.sourceUri.trim())) {
    const flag = source.sourceType === 'oci' ? '--oci-image' : source.sourceType === 'zip' ? '--zip-url' : '--git-url';
    parts.push(
      `${flag} ${source.sourceUri.trim()}${source.ref ? ` --ref ${source.ref}` : ''}${source.subpath ? ` --subpath ${source.subpath}` : ''}`,
    );
  }
  if (input.harness?.name) {
    parts.push(`--harness ${input.harness.name}${input.harness.version ? `@${input.harness.version}` : ''}`);
  }
  if (input.configSnapshotPath) {
    parts.push(`--config-snapshot ${input.configSnapshotPath}`);
  }
  if (input.a2aEndpoint) {
    parts.push(`--a2a-endpoint ${input.a2aEndpoint}`);
  }
  for (const ref of input.bom.skills) {
    parts.push(`--skill skills:/${ref.name}/${ref.version}`);
  }
  for (const ref of input.bom.agent_plugins) {
    parts.push(`--agent-plugin agent-plugins:/${ref.name}/${ref.version}`);
  }
  for (const ref of input.bom.mcp_servers) {
    parts.push(`--mcp-server mcp-servers:/${ref.name}/${ref.version}`);
  }
  for (const ref of input.bom.models) {
    parts.push(`--model ${getModelRefUri(ref)}`);
  }
  for (const ref of input.bom.agents) {
    parts.push(`--agent agents:/${ref.name}${ref.version ? `/${ref.version}` : ''}`);
  }
  if (input.versionScheme !== 'monotonic') {
    parts.push(`--version-scheme ${input.versionScheme}`);
    if (input.version) {
      parts.push(`--version ${input.version}`);
    }
  }
  if (input.status && input.status !== 'draft') {
    parts.push(`--status ${input.status}`);
  }
  return parts.join(' \\\n    ');
};

/** `mlflow.genai.set_active_agent(...)` plus the separable pieces, from the RFC's trace journey. */
export const getAgentTraceSnippet = (organization: string, name: string, version: string): string =>
  [
    'import mlflow.genai',
    '',
    `mlflow.genai.set_active_agent("${getAgentQualifiedName(organization, name)}", version="${version}")`,
    '',
    '# Equivalent, as two separable pieces:',
    `# mlflow.set_experiment(mlflow.genai.get_default_experiment_id("${getAgentQualifiedName(organization, name)}"))`,
    '# ...and the agent and version recorded as trace metadata.',
    '',
    'with mlflow.start_span(name="answer-question"):',
    '    result = agent.run(question)',
  ].join('\n');

export const getAgentEvaluateSnippet = (organization: string, name: string, version: string): string =>
  [
    'import mlflow.genai',
    '',
    'mlflow.genai.evaluate(',
    '    data=eval_dataset,',
    '    scorers=[correctness_scorer],',
    `    agent_id="${getAgentQualifiedName(organization, name)}",`,
    `    agent_version="${version}",`,
    ')',
  ].join('\n');
