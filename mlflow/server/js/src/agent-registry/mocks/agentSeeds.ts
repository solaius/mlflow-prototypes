/**
 * Seed content for the Agent Registry prototype, in RFC-0011's shape.
 *
 * Every skill reference names a skill registered in the skills seeds at a version that
 * exists there; every plugin reference names a seeded plugin version; MCP server references
 * are soft, as the RFC makes them -- most resolve in the seeded MCP registry, a few do not,
 * and the chips show the difference. Agent identities and descriptions are synthesized to
 * exercise the model; they are not a claim about any shipped Red Hat agent.
 *
 * What the catalogue is built to show, agent by agent:
 *
 *   incident-commander   SemVer scheme, two source pointers on the current version (the
 *                        repo it is built from and the image it ships as), a name-level
 *                        reference to an independently managed agent, an alias-targeted
 *                        A2A binding kept current by platform sync.
 *   cve-remediation      The callee above. A version-targeted binding.
 *   model-deployer       Exposed as an MCP server as well as over A2A: two bindings.
 *   pipeline-builder     The default MONOTONIC scheme, and a version-pinned agent
 *                        reference to a sibling deployed with it.
 *   service-scaffolder   FREEFORM versions, mirroring a date-based release train.
 *   access-reviewer      Draft, anchored on source, no binding yet: the register journey
 *                        before deployment.
 *   automation-runner    An `other` binding: a REST endpoint the registry records without
 *                        claiming it can invoke.
 *   report-generator     Retired, with a binding nobody deleted, so the live-card fetch
 *                        has an unreachable endpoint to show.
 *   concierge            An INTERFACE-ONLY record: registered from a vendor's A2A card,
 *                        no anchor, composition undeclared -- the case the blast-radius
 *                        query has to count alongside its matches.
 *   oncall-helper        A HARNESS-BASED agent: no source repository, a harness reference
 *                        and a configuration snapshot as its anchor, two versions whose
 *                        snapshots differ so the compare view has content to diff.
 */
import { SkillSourceType } from '../../skills-registry/types';
import type { AgentAccessBinding, AgentBom, AgentConfigSnapshot, AgentHarnessRef, AgentSourcePointer } from '../types';
import { AgentBindingProtocol, AgentStatus, AgentVersionScheme } from '../types';

export interface AgentVersionSeed {
  version: string;
  status: AgentStatus;
  /** Days before the fixed "now" that this version was registered. */
  daysAgo: number;
  aliases: string[];
  createdBy: string;
  sources: AgentSourcePointer[];
  configSnapshot?: AgentConfigSnapshot;
  harness?: AgentHarnessRef;
  /** Absent means undeclared composition; present (even empty) means declared. */
  bom?: Partial<AgentBom>;
  tags?: { key: string; value: string }[];
  /** Lifecycle events to record, oldest first. The registration itself is not an event. */
  history?: { to: AgentStatus; daysAgo: number; actor: string; note?: string }[];
}

export type AgentBindingSeed = Omit<
  AgentAccessBinding,
  'id' | 'organization' | 'name' | 'creation_timestamp' | 'last_updated_timestamp'
> & { daysAgo: number };

export interface AgentSeed {
  organization: string;
  name: string;
  displayName?: string;
  description: string;
  iconUrl?: string;
  versionScheme: AgentVersionScheme;
  /** The agent's one default experiment. */
  experimentId: string;
  createdBy: string;
  tags: { key: string; value: string }[];
  versions: AgentVersionSeed[];
  bindings: AgentBindingSeed[];
}

const git = (url: string, ref?: string, subpath?: string): AgentSourcePointer => ({
  source_type: SkillSourceType.GIT,
  source: url,
  ...(ref ? { ref } : {}),
  ...(subpath ? { subpath } : {}),
});

const oci = (image: string): AgentSourcePointer => ({ source_type: SkillSourceType.OCI, source: image });

const GRANITE_33_8B = { name: 'granite-3.3-8b-instruct', version: '3', provider: 'Red Hat', role: 'reasoning' };
const GRANITE_33_2B = { name: 'granite-3.3-2b-instruct', version: '2', provider: 'Red Hat', role: 'classification' };
const GRANITE_31_8B = { name: 'granite-3.1-8b-instruct', version: '4', provider: 'Red Hat', role: 'reasoning' };
const NOMIC_EMBED = { name: 'nomic-embed-text-v1.5', version: '1', provider: 'Nomic', role: 'embedding' };
const LLAMA_33_70B = { name: 'llama-3.3-70b-instruct', version: '2', provider: 'Meta', role: 'reasoning' };
const LLAMA_31_70B = { name: 'llama-3.1-70b-instruct', version: '5', provider: 'Meta', role: 'reasoning' };

export const AGENT_SEEDS: AgentSeed[] = [
  {
    organization: 'sre',
    name: 'incident-commander',
    displayName: 'Incident Commander',
    description:
      'Coordinates incident response across an OpenShift estate: triages alerts, correlates pod and cluster health with recent changes, drafts the incident timeline, and keeps the response channel updated.',
    versionScheme: AgentVersionScheme.SEMVER,
    experimentId: '1',
    createdBy: 'jdoyle',
    tags: [
      { key: 'team', value: 'sre' },
      { key: 'framework', value: 'langgraph' },
    ],
    versions: [
      {
        version: '1.0.0',
        status: AgentStatus.DEPRECATED,
        daysAgo: 132,
        aliases: [],
        createdBy: 'jdoyle',
        sources: [git('https://github.com/redhat-ai/agent-incident-commander.git', 'a41c0f2')],
        bom: {
          skills: [
            { name: '@rh-developer/incident-triage', version: 1 },
            { name: '@rh-developer/debug-pod', version: 1 },
          ],
          mcp_servers: [{ name: 'com.redhat.openshift/cluster-mcp', version: '1.0.0' }],
          models: [GRANITE_31_8B],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 130, actor: 'jdoyle', note: 'First production rollout' },
          { to: AgentStatus.DEPRECATED, daysAgo: 58, actor: 'jdoyle', note: 'Superseded by 1.2.0' },
        ],
      },
      {
        version: '1.2.0',
        status: AgentStatus.DEPRECATED,
        daysAgo: 58,
        aliases: ['staging'],
        createdBy: 'jdoyle',
        sources: [git('https://github.com/redhat-ai/agent-incident-commander.git', '7be93d1')],
        bom: {
          skills: [
            { name: '@rh-developer/incident-triage', version: 1 },
            { name: '@rh-developer/debug-pod', version: 1 },
            { name: '@rh-automation/job-failure-analyzer', version: 1 },
            { name: '@ocp-admin/cluster-report', version: 1 },
            { name: '@rh-sre/system-context', version: 1 },
          ],
          mcp_servers: [
            { name: 'com.redhat.openshift/cluster-mcp', version: '1.2.0' },
            { name: 'io.github.prometheus/prometheus-mcp', version: '0.5.0' },
          ],
          models: [GRANITE_31_8B, NOMIC_EMBED],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 56, actor: 'ci/incident-commander-release' },
          { to: AgentStatus.DEPRECATED, daysAgo: 9, actor: 'jdoyle', note: 'Superseded by 2.0.0' },
        ],
      },
      {
        version: '2.0.0',
        status: AgentStatus.ACTIVE,
        daysAgo: 9,
        aliases: ['champion', 'production'],
        createdBy: 'ci/incident-commander-release',
        sources: [
          git('https://github.com/redhat-ai/agent-incident-commander.git', '8f4e2a1'),
          oci('quay.io/redhat-ai/agent-incident-commander@sha256:9f2c1e4b'),
        ],
        bom: {
          skills: [
            { name: '@rh-developer/incident-triage', version: 1 },
            { name: '@rh-developer/debug-pod', version: 1 },
            { name: '@rh-automation/job-failure-analyzer', version: 2 },
            { name: '@ocp-admin/cluster-report', version: 2 },
            { name: '@rh-sre/system-context', version: 2 },
            { name: '@rh-basic/red-hat-cve-explainer', version: 1 },
          ],
          agent_plugins: [{ name: '@ai5-marketplace/rh-sre', version: '0.1.0' }],
          mcp_servers: [
            { name: 'com.redhat.openshift/cluster-mcp', version: '1.4.0' },
            { name: 'io.github.prometheus/prometheus-mcp', version: '0.5.0' },
            { name: 'io.github.slackapi/slack-mcp', version: '2.1.0' },
          ],
          models: [GRANITE_33_8B, NOMIC_EMBED],
          // Independently managed by another team: name-level, since this team does not
          // control which version of it is live.
          agents: [{ name: '@sre/cve-remediation' }],
        },
        tags: [{ key: 'release', value: '2026.08' }],
        history: [{ to: AgentStatus.ACTIVE, daysAgo: 7, actor: 'jdoyle', note: 'Correctness 0.87 on the golden set' }],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://incident-commander.apps.example.com/a2a',
        protocol: AgentBindingProtocol.A2A,
        target_alias: 'production',
        created_by: 'rhoai-registry-sync',
        last_updated_by: 'rhoai-registry-sync',
        daysAgo: 7,
      },
    ],
  },
  {
    organization: 'sre',
    name: 'cve-remediation',
    displayName: 'CVE Remediation',
    description:
      'End-to-end CVE handling: explains the advisory against Red Hat severity ratings, scans dependency manifests for affected versions, and opens the tracking issues and pull requests that carry the fix.',
    versionScheme: AgentVersionScheme.SEMVER,
    experimentId: '2',
    createdBy: 'awagner',
    tags: [
      { key: 'team', value: 'sre' },
      { key: 'framework', value: 'langgraph' },
    ],
    versions: [
      {
        version: '0.9.0',
        status: AgentStatus.DEPRECATED,
        daysAgo: 74,
        aliases: [],
        createdBy: 'awagner',
        sources: [git('https://github.com/redhat-ai/agent-cve-remediation.git', 'c2d8e40')],
        bom: {
          skills: [
            { name: '@rh-basic/red-hat-cve-explainer', version: 1 },
            { name: '@ocp-admin/image-inspect', version: 1 },
          ],
          mcp_servers: [{ name: 'com.github/github-mcp', version: '1.2.0' }],
          models: [GRANITE_31_8B],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 70, actor: 'awagner' },
          { to: AgentStatus.DEPRECATED, daysAgo: 16, actor: 'awagner', note: 'Superseded by 1.0.0' },
        ],
      },
      {
        version: '1.0.0',
        status: AgentStatus.ACTIVE,
        daysAgo: 16,
        aliases: ['champion'],
        createdBy: 'awagner',
        sources: [git('https://github.com/redhat-ai/agent-cve-remediation.git', 'e19a7b3')],
        bom: {
          skills: [
            { name: '@rh-basic/red-hat-cve-explainer', version: 1 },
            { name: '@ocp-admin/image-inspect', version: 2 },
            { name: '@rh-developer/debug-pod', version: 1 },
          ],
          agent_plugins: [{ name: '@red-hat-ai/cve-remediation', version: '1.0.0' }],
          mcp_servers: [
            { name: 'com.redhat.openshift/cluster-mcp', version: '1.4.0' },
            { name: 'com.github/github-mcp', version: '1.6.0' },
            { name: 'com.atlassian/jira-mcp', version: '0.9.0' },
          ],
          models: [GRANITE_33_8B, GRANITE_33_2B],
        },
        history: [{ to: AgentStatus.ACTIVE, daysAgo: 14, actor: 'awagner' }],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://cve-remediation.apps.example.com/a2a',
        protocol: AgentBindingProtocol.A2A,
        target_version: '1.0.0',
        created_by: 'awagner',
        daysAgo: 14,
      },
    ],
  },
  {
    organization: 'ai-platform',
    name: 'model-deployer',
    displayName: 'Model Deployer',
    description:
      'Deploys and tunes model serving on OpenShift AI: selects a runtime, validates GPU capacity, creates the InferenceService, and watches the rollout to completion.',
    versionScheme: AgentVersionScheme.SEMVER,
    experimentId: '3',
    createdBy: 'mprahl',
    tags: [
      { key: 'team', value: 'ai-platform' },
      { key: 'framework', value: 'llama-stack' },
    ],
    versions: [
      {
        version: '1.0.0',
        status: AgentStatus.DEPRECATED,
        daysAgo: 96,
        aliases: [],
        createdBy: 'mprahl',
        sources: [git('https://github.com/redhat-ai/agent-model-deployer.git', '3b7f210')],
        bom: {
          skills: [{ name: '@rh-ai-engineer/model-deploy', version: 2 }],
          mcp_servers: [{ name: 'com.redhat.openshift/cluster-mcp', version: '1.0.0' }],
          models: [LLAMA_31_70B],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 94, actor: 'mprahl' },
          { to: AgentStatus.DEPRECATED, daysAgo: 47, actor: 'mprahl' },
        ],
      },
      {
        version: '1.1.0',
        status: AgentStatus.DEPRECATED,
        daysAgo: 47,
        aliases: ['staging'],
        createdBy: 'mprahl',
        sources: [git('https://github.com/redhat-ai/agent-model-deployer.git', '9d02c5e')],
        bom: {
          skills: [
            { name: '@rh-ai-engineer/model-deploy', version: 3 },
            { name: '@rh-ai-engineer/serving-runtime-config', version: 1 },
          ],
          mcp_servers: [
            { name: 'com.redhat.openshift/cluster-mcp', version: '1.2.0' },
            { name: 'com.redhat.rhoai/model-registry-mcp', version: '1.1.0' },
          ],
          models: [LLAMA_31_70B],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 45, actor: 'mprahl' },
          { to: AgentStatus.DEPRECATED, daysAgo: 5, actor: 'mprahl', note: 'GPU validation moved to 2.0.0' },
        ],
      },
      {
        version: '2.0.0',
        status: AgentStatus.ACTIVE,
        daysAgo: 5,
        aliases: ['champion'],
        createdBy: 'mprahl',
        sources: [
          git('https://github.com/redhat-ai/agent-model-deployer.git', 'f61a0c9'),
          oci('quay.io/redhat-ai/agent-model-deployer@sha256:1b8e3d77'),
        ],
        bom: {
          skills: [
            { name: '@rh-ai-engineer/model-deploy', version: 3 },
            { name: '@rh-ai-engineer/serving-runtime-config', version: 2 },
            { name: '@rh-ai-engineer/nim-setup', version: 1 },
          ],
          agent_plugins: [{ name: '@ai5-marketplace/rh-ai-engineer', version: '0.1.0' }],
          mcp_servers: [
            { name: 'com.redhat.openshift/cluster-mcp', version: '1.4.0' },
            { name: 'com.redhat.rhoai/model-registry-mcp', version: '1.1.0' },
          ],
          models: [LLAMA_33_70B],
        },
        history: [{ to: AgentStatus.ACTIVE, daysAgo: 3, actor: 'mprahl' }],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://model-deployer.apps.example.com/a2a',
        protocol: AgentBindingProtocol.A2A,
        target_alias: 'champion',
        created_by: 'rhoai-registry-sync',
        last_updated_by: 'rhoai-registry-sync',
        daysAgo: 3,
      },
      {
        endpoint_url: 'https://model-deployer.apps.example.com/mcp',
        protocol: AgentBindingProtocol.MCP,
        target_version: '2.0.0',
        created_by: 'mprahl',
        daysAgo: 3,
      },
    ],
  },
  {
    organization: 'devex',
    name: 'pipeline-builder',
    displayName: 'Pipeline Builder',
    description:
      'Bootstraps delivery pipelines for a repository: generates the CI definition, wires GitOps promotion, and produces the Helm chart the pipeline deploys.',
    versionScheme: AgentVersionScheme.MONOTONIC,
    experimentId: '4',
    createdBy: 'kszabo',
    tags: [
      { key: 'team', value: 'devex' },
      { key: 'framework', value: 'langgraph' },
    ],
    versions: [
      {
        version: '1',
        status: AgentStatus.ACTIVE,
        daysAgo: 22,
        aliases: ['champion'],
        createdBy: 'kszabo',
        sources: [git('https://github.com/redhat-ai/delivery-tooling.git', 'v1.3.0', 'agents/pipeline-builder')],
        bom: {
          skills: [
            { name: '@rh-developer/debug-pipeline', version: 2 },
            { name: '@rh-developer/deploy', version: 1 },
            { name: '@rh-developer/helm-deploy', version: 2 },
          ],
          mcp_servers: [
            { name: 'com.github/github-mcp', version: '1.6.0' },
            { name: 'io.github.hashicorp/terraform-mcp', version: '0.4.2' },
          ],
          models: [GRANITE_33_8B],
          // Versioned and deployed together with this agent, so the pin is exact.
          agents: [{ name: '@devex/service-scaffolder', version: '2026.08' }],
        },
        history: [{ to: AgentStatus.ACTIVE, daysAgo: 20, actor: 'kszabo' }],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://pipeline-builder.apps.example.com/a2a',
        protocol: AgentBindingProtocol.A2A,
        target_alias: 'champion',
        created_by: 'kszabo',
        daysAgo: 20,
      },
    ],
  },
  {
    organization: 'devex',
    name: 'service-scaffolder',
    displayName: 'Service Scaffolder',
    description:
      'Generates a new service from the organization template set: Quarkus project layout, container build, and the Helm chart needed to deploy it.',
    versionScheme: AgentVersionScheme.FREEFORM,
    experimentId: '5',
    createdBy: 'kszabo',
    tags: [
      { key: 'team', value: 'devex' },
      { key: 'framework', value: 'bee-agent' },
    ],
    versions: [
      {
        version: '2026.07',
        status: AgentStatus.DEPRECATED,
        daysAgo: 63,
        aliases: [],
        createdBy: 'kszabo',
        sources: [
          git('https://github.com/redhat-ai/delivery-tooling.git', 'scaffolder-2026.07', 'agents/service-scaffolder'),
        ],
        bom: {
          skills: [{ name: '@rh-developer/detect-project', version: 1 }],
          mcp_servers: [{ name: 'com.github/github-mcp', version: '1.2.0' }],
          models: [GRANITE_31_8B],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 60, actor: 'kszabo' },
          { to: AgentStatus.DEPRECATED, daysAgo: 31, actor: 'kszabo' },
        ],
      },
      {
        version: '2026.08',
        status: AgentStatus.ACTIVE,
        daysAgo: 31,
        aliases: ['champion'],
        createdBy: 'kszabo',
        sources: [
          git('https://github.com/redhat-ai/delivery-tooling.git', 'scaffolder-2026.08', 'agents/service-scaffolder'),
        ],
        bom: {
          skills: [
            { name: '@rh-developer/detect-project', version: 2 },
            { name: '@rh-developer/helm-deploy', version: 2 },
          ],
          mcp_servers: [{ name: 'com.github/github-mcp', version: '1.5.0' }],
          models: [GRANITE_33_8B],
        },
        history: [{ to: AgentStatus.ACTIVE, daysAgo: 29, actor: 'kszabo' }],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://service-scaffolder.apps.example.com/a2a',
        protocol: AgentBindingProtocol.A2A,
        target_alias: 'champion',
        created_by: 'kszabo',
        daysAgo: 29,
      },
    ],
  },
  {
    organization: 'platform',
    name: 'access-reviewer',
    displayName: 'Access Reviewer',
    description:
      'Reviews RBAC across namespaces and reports over-broad bindings, unused service accounts, and role drift against the approved baseline.',
    versionScheme: AgentVersionScheme.MONOTONIC,
    experimentId: '6',
    createdBy: 'jdoyle',
    tags: [
      { key: 'team', value: 'platform' },
      { key: 'framework', value: 'langgraph' },
    ],
    versions: [
      {
        version: '1',
        status: AgentStatus.DRAFT,
        daysAgo: 4,
        aliases: [],
        createdBy: 'jdoyle',
        sources: [git('https://github.com/redhat-ai/agent-access-reviewer.git', 'main')],
        bom: {
          skills: [{ name: '@rh-developer/debug-rbac', version: 2 }],
          mcp_servers: [{ name: 'com.redhat.openshift/cluster-mcp', version: '1.2.0' }],
          models: [GRANITE_33_2B],
        },
      },
    ],
    bindings: [],
  },
  {
    organization: 'platform',
    name: 'automation-runner',
    displayName: 'Automation Runner',
    description:
      'Turns a described operational task into an Ansible playbook, launches it through the automation controller, and reports the job outcome.',
    versionScheme: AgentVersionScheme.MONOTONIC,
    experimentId: '7',
    createdBy: 'mprahl',
    tags: [
      { key: 'team', value: 'platform' },
      { key: 'framework', value: 'langgraph' },
    ],
    versions: [
      {
        version: '1',
        status: AgentStatus.DRAFT,
        daysAgo: 2,
        aliases: [],
        createdBy: 'mprahl',
        sources: [git('https://github.com/redhat-ai/agent-automation-runner.git', 'main')],
        bom: {
          skills: [{ name: '@rh-sre/playbook-generator', version: 3 }],
          mcp_servers: [{ name: 'com.redhat.ansible/automation-mcp', version: '0.1.0' }],
          models: [GRANITE_33_8B],
        },
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://automation-runner.apps.example.com/api/v1/run',
        protocol: AgentBindingProtocol.OTHER,
        target_version: '1',
        description: 'POST a task description as JSON; returns a job id. Auth: workspace OIDC bearer token.',
        created_by: 'mprahl',
        daysAgo: 2,
      },
    ],
  },
  {
    organization: 'platform',
    name: 'report-generator',
    displayName: 'Report Generator',
    description:
      'Assembles weekly reliability reports from log and dashboard data. Superseded by the reporting features built into the incident commander agent.',
    versionScheme: AgentVersionScheme.MONOTONIC,
    experimentId: '8',
    createdBy: 'awagner',
    tags: [{ key: 'team', value: 'platform' }],
    versions: [
      {
        version: '1',
        status: AgentStatus.DEPRECATED,
        daysAgo: 118,
        aliases: [],
        createdBy: 'awagner',
        sources: [git('https://github.com/redhat-ai/agent-report-generator.git', '0b6d9e2')],
        bom: {
          skills: [{ name: '@rh-automation/job-failure-analyzer', version: 2 }],
          mcp_servers: [{ name: 'io.github.grafana/grafana-mcp', version: '0.2.0' }],
          models: [{ name: 'granite-3.0-8b-instruct', provider: 'Red Hat', role: 'reasoning' }],
        },
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 116, actor: 'awagner' },
          { to: AgentStatus.DEPRECATED, daysAgo: 40, actor: 'awagner', note: 'Folded into incident-commander 2.0.0' },
        ],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://report-generator.apps.example.com/a2a',
        protocol: AgentBindingProtocol.A2A,
        target_version: '1',
        created_by: 'awagner',
        daysAgo: 116,
      },
    ],
  },
  {
    organization: 'acme-travel',
    name: 'concierge',
    displayName: 'ACME Travel Concierge',
    description:
      'Books and rebooks corporate travel against negotiated fares, and answers policy questions about what is reimbursable.',
    iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/expedia.svg',
    versionScheme: AgentVersionScheme.SEMVER,
    experimentId: '9',
    createdBy: 'partner-onboarding',
    tags: [
      { key: 'vendor', value: 'acme-travel' },
      { key: 'contract', value: 'msa-2026-014' },
    ],
    versions: [
      {
        version: '4.11.2',
        status: AgentStatus.ACTIVE,
        daysAgo: 11,
        aliases: ['production'],
        createdBy: 'partner-onboarding',
        // No anchor at all: registered from the vendor's card. Composition undeclared.
        sources: [],
        history: [
          { to: AgentStatus.ACTIVE, daysAgo: 10, actor: 'procurement-review', note: 'Vendor security review passed' },
        ],
      },
    ],
    bindings: [
      {
        endpoint_url: 'https://agents.acme-travel.example/concierge',
        protocol: AgentBindingProtocol.A2A,
        target_alias: 'production',
        created_by: 'partner-onboarding',
        daysAgo: 11,
      },
    ],
  },
  {
    organization: 'platform',
    name: 'oncall-helper',
    displayName: 'On-call Helper',
    description:
      'On-call assistant run in OpenCode: reads the runbooks, correlates the paging alert with recent automation jobs, and drafts the first response.',
    versionScheme: AgentVersionScheme.MONOTONIC,
    experimentId: '10',
    createdBy: 'nnarendrula',
    tags: [
      { key: 'team', value: 'platform' },
      { key: 'harness', value: 'opencode' },
    ],
    versions: [
      {
        version: '1',
        status: AgentStatus.ACTIVE,
        daysAgo: 18,
        aliases: ['production'],
        createdBy: 'nnarendrula',
        sources: [],
        harness: { name: 'opencode', version: '0.5.3' },
        configSnapshot: {
          artifact_path: 'mlflow-artifacts:/agents/@platform/oncall-helper/1/config/',
          files: [
            {
              path: 'opencode.json',
              size_bytes: 412,
              content: [
                '{',
                '  "$schema": "https://opencode.ai/config.json",',
                '  "model": "anthropic/claude-sonnet-5",',
                '  "permission": {',
                '    "bash": "ask",',
                '    "edit": "deny"',
                '  },',
                '  "shell": { "path": "/bin/bash" },',
                '  "instructions": ["AGENTS.md"]',
                '}',
              ].join('\n'),
            },
            {
              path: 'AGENTS.md',
              size_bytes: 618,
              content: [
                '# On-call helper',
                '',
                'You are the first responder for the platform on-call rotation.',
                '',
                '- Start from the paging alert. Name the affected service before anything else.',
                '- Correlate with the last 24h of automation jobs before proposing a cause.',
                '- Never run a remediation playbook; draft it and hand it to the human on call.',
              ].join('\n'),
            },
          ],
        },
        bom: {
          skills: [
            { name: '@rh-sre/system-context', version: 2 },
            { name: '@rh-automation/job-failure-analyzer', version: 2 },
          ],
          mcp_servers: [{ name: 'com.redhat.ansible/automation-mcp', version: '0.1.0' }],
          models: [{ name: 'claude-sonnet-5', provider: 'Anthropic', role: 'reasoning' }],
        },
        history: [{ to: AgentStatus.ACTIVE, daysAgo: 16, actor: 'nnarendrula' }],
      },
      {
        version: '2',
        status: AgentStatus.DRAFT,
        daysAgo: 3,
        aliases: [],
        createdBy: 'nnarendrula',
        sources: [],
        harness: { name: 'opencode', version: '0.6.0' },
        configSnapshot: {
          artifact_path: 'mlflow-artifacts:/agents/@platform/oncall-helper/2/config/',
          files: [
            {
              path: 'opencode.json',
              size_bytes: 447,
              content: [
                '{',
                '  "$schema": "https://opencode.ai/config.json",',
                '  "model": "anthropic/claude-sonnet-5",',
                '  "permission": {',
                '    "bash": "ask",',
                '    "edit": "deny",',
                '    "webfetch": "deny"',
                '  },',
                '  "shell": { "path": "/usr/bin/fish" },',
                '  "instructions": ["AGENTS.md"]',
                '}',
              ].join('\n'),
            },
            {
              path: 'AGENTS.md',
              size_bytes: 618,
              content: [
                '# On-call helper',
                '',
                'You are the first responder for the platform on-call rotation.',
                '',
                '- Start from the paging alert. Name the affected service before anything else.',
                '- Correlate with the last 24h of automation jobs before proposing a cause.',
                '- Never run a remediation playbook; draft it and hand it to the human on call.',
              ].join('\n'),
            },
          ],
        },
        bom: {
          skills: [
            { name: '@rh-sre/system-context', version: 2 },
            { name: '@rh-automation/job-failure-analyzer', version: 2 },
            { name: '@rh-sre/execution-summary', version: 4 },
          ],
          mcp_servers: [{ name: 'com.redhat.ansible/automation-mcp', version: '0.1.0' }],
          models: [{ name: 'claude-sonnet-5', provider: 'Anthropic', role: 'reasoning' }],
        },
      },
    ],
    bindings: [],
  },
];
