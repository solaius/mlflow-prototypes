import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { SkillSourceType, SkillStatus } from '../../skills-registry/types';
import type { AgentPluginMember, AgentPluginSourceType } from '../types';
import { ASSEMBLED_SOURCE_TYPE, MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL } from '../types';

/**
 * Seed catalogue for the Agent Plugins registry.
 *
 * REAL DATA, from the same source as the skills: the collections published at
 * github.com/RHEcosystemAppEng/agentic-plugins. That repository defines agent plugins
 * literally -- `<collection>/.catalog/collection.yaml` carries the id, name, description,
 * categories, personas and maturity of each pack, and four collections also ship a
 * Backstage `<collection>-plugin.yaml` with `spec.type: plugin`, its MCP server `dependsOn`
 * list, and its member skills as `dependencyOf`. The seven collection plugins below are
 * those definitions, and every skill member resolves to a skill in `skillSeeds.ts`.
 *
 * What changed against the previous seed, and why:
 *
 *   source        RFC-0008 gives a version ONE source column set (`source_type`, `source`,
 *                 `ref`, `subpath`) and derives its kind from `source_type`. An assembled
 *                 version has no plugin-level source at all. The old fixture carried a git
 *                 URL on every version, assembled ones included, and a separate kind field;
 *                 both are gone.
 *   members       RFC-0010's membership row: a free-form `member_type`, `mcp-server` rows
 *                 that reference the MCP Server Registry, and generic rows for the component
 *                 types a harness adds. The four collections whose Backstage descriptor
 *                 declares `dependsOn` MCP servers now carry those as members rather than as
 *                 a `mcp-servers` tag. Two of them map onto servers the seeded MCP registry
 *                 holds and are connected (pinned to a registered version); the rest are
 *                 recorded as discovered from `mcp.json` and not yet connected -- the state
 *                 RFC-0010 leaves as an open question.
 *   status        Lowercase `SkillStatus`, the enum RFC-0008 types the field with, replacing
 *                 an invented title-case vocabulary.
 *   icons         RFC-0008 PR #45 icons on the parent, per skill-registry parity.
 *
 * Three deliberate departures, each visible in a version's kind:
 *
 *   packaged    The seven collection plugins and the MCP-server pack. Real definitions.
 *   assembled   `@red-hat-ai/cve-remediation` and `@red-hat-ai/openshift-day-one`, which
 *               compose skills ACROSS collections. Synthetic, but not arbitrary: the
 *               remediation chain is the real `dependsOn` list that `rh-sre/remediation`
 *               declares in its own catalog entry, widened to the OpenShift CVE validators
 *               and the customer-facing explainer. They exist because the registry has to
 *               show a member shared by two live plugins -- that is the case the cascade
 *               delete refuses -- and because a catalogue where every plugin maps 1:1 to an
 *               organization would make the plugin filter a copy of the organization one.
 *   imported    `@acme-platform/release-gate`, a synthetic Claude Code plugin imported from
 *               an OCI image. It exists to exercise RFC-0010's generic member types (an
 *               agent, a hook, a command) beside a connected MCP server member. Its skill
 *               member points at the OCI-sourced demo skill so the reference resolves.
 *
 * `@ai5-marketplace/platform-mcp-servers` carries no skills at all. RFC-0008 lets a plugin
 * hold MCP servers alone, and the point was made directly in the 2026-09-04 session: agent
 * plugins are not one-to-one with skills, which is why the two registries stay separate
 * pages for now. Under RFC-0010 its servers are members rather than a tag.
 *
 * Version histories are synthetic, as they are for the skills. Upstream records one
 * current state per collection -- all seven sit at 0.1.0 -- so the current version carries
 * that real number and the earlier ones are modelled as the pre-releases that led to it.
 */

const COLLECTIONS_REPO = 'https://github.com/RHEcosystemAppEng/agentic-plugins';

/** The connected MCP members: servers the seeded MCP registry actually holds. */
const OPENSHIFT_MCP: AgentPluginMember = {
  member_type: MEMBER_TYPE_MCP_SERVER,
  name: 'com.redhat.openshift/cluster-mcp',
  version: '1.4.0',
};
const ANSIBLE_MCP: AgentPluginMember = {
  member_type: MEMBER_TYPE_MCP_SERVER,
  name: 'com.redhat.ansible/automation-mcp',
  version: '0.1.0',
};

/** Discovered from the collections' `mcp.json`, not yet connected to a registered server. */
const LIGHTSPEED_MCP: AgentPluginMember = {
  member_type: MEMBER_TYPE_MCP_SERVER,
  name: 'red-hat-lightspeed-mcp-server',
};
const ASSISTED_INSTALLER_MCP: AgentPluginMember = { member_type: MEMBER_TYPE_MCP_SERVER, name: 'assisted-installer' };
const SECURITY_MCP: AgentPluginMember = { member_type: MEMBER_TYPE_MCP_SERVER, name: 'security-mcp-server' };

const skill = (name: string, version: number): AgentPluginMember => ({ member_type: MEMBER_TYPE_SKILL, name, version });

const OPENSHIFT_ICON: RegistryIcon[] = [
  { src: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg' },
];
const REDHAT_ICON: RegistryIcon[] = [{ src: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhat.svg' }];
const ANSIBLE_ICON: RegistryIcon[] = [{ src: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg' }];

export interface PluginVersionSeed {
  version: string;
  /** Days before the fixed "now" that this version was registered. */
  daysAgo: number;
  aliases: string[];
  created_by: string;
  members: AgentPluginMember[];
  tags?: { key: string; value: string }[];
  /** Lifecycle status per RFC-0008. Defaults to `active` when omitted. */
  status?: SkillStatus;
  /**
   * Packaged versions carry a resolved commit (git) and inherit the plugin's repository and
   * path; assembled versions carry none of it. Absent means assembled.
   */
  packaged?: { revision: string };
}

export interface PluginSeed {
  organization: string;
  name: string;
  description: string;
  keywords: string[];
  /** Manifest author, as the Agent Plugins schema carries it. */
  author?: string;
  icons?: RegistryIcon[];
  /** Package location for packaged versions. Unused by assembled ones. */
  sourceType?: AgentPluginSourceType;
  repo?: string;
  path?: string;
  /**
   * Skill-level tags carried on the parent. The old `category` tag is kept; the
   * `mcp-servers` tag is gone because its content became members.
   */
  tags: { key: string; value: string }[];
  versions: PluginVersionSeed[];
}

export const PLUGIN_SEEDS: PluginSeed[] = [
  {
    organization: 'ai5-marketplace',
    name: 'rh-sre',
    description: 'Site reliability engineering tools and automation for managing Red Hat platforms and infrastructure.',
    keywords: ['site-reliability', 'security'],
    author: 'Red Hat Ecosystem Engineering',
    icons: REDHAT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'rh-sre',
    tags: [{ key: 'category', value: 'site-reliability' }],
    versions: [
      {
        version: '0.0.1',
        daysAgo: 58,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        packaged: { revision: '4f1c9a2e77b0d3856ac41e9f20b7d6c85a3e0f19' },
        members: [
          skill('@rh-sre/fleet-inventory', 1),
          skill('@rh-sre/cve-impact', 1),
          skill('@rh-sre/cve-validation', 1),
          skill('@rh-sre/system-context', 1),
          skill('@rh-sre/playbook-generator', 1),
          skill('@rh-sre/playbook-executor', 1),
        ],
      },
      {
        version: '0.1.0',
        daysAgo: 5,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.ACTIVE,
        packaged: { revision: 'b83d5e1a04c927f6ae30b8d514c7f92a6e0d3b47' },
        tags: [
          { key: 'maturity', value: 'GREEN' },
          { key: 'persona', value: 'Site Reliability Engineer' },
        ],
        members: [
          skill('@rh-sre/fleet-inventory', 1),
          skill('@rh-sre/cve-impact', 1),
          skill('@rh-sre/cve-validation', 1),
          skill('@rh-sre/system-context', 2),
          skill('@rh-sre/playbook-generator', 3),
          skill('@rh-sre/playbook-executor', 4),
          skill('@rh-sre/remediation-verifier', 3),
          skill('@rh-sre/mcp-lightspeed-validator', 4),
          skill('@rh-sre/mcp-aap-validator', 2),
          skill('@rh-sre/execution-summary', 4),
          skill('@rh-sre/job-template-creator', 2),
          skill('@rh-sre/job-template-remediation-validator', 1),
          skill('@rh-sre/remediation', 3),
          LIGHTSPEED_MCP,
          ANSIBLE_MCP,
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'ocp-admin',
    description: 'Automation capabilities for OpenShift Container Platform cluster management, workload orchestration,',
    keywords: ['red-hat', 'openshift', 'administration', 'management'],
    author: 'Red Hat Ecosystem Engineering',
    icons: OPENSHIFT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'ocp-admin',
    tags: [{ key: 'category', value: 'red-hat' }],
    versions: [
      {
        version: '0.0.1',
        daysAgo: 44,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        packaged: { revision: '2a7e4c1b93f05d68ba27e4109c8d3f5b71a0e6d2' },
        members: [
          skill('@ocp-admin/cluster-creator', 1),
          skill('@ocp-admin/cluster-inventory', 1),
          skill('@ocp-admin/cluster-report', 1),
          skill('@ocp-admin/container-cve-validator', 1),
          skill('@ocp-admin/coreos-cve-validator', 1),
        ],
      },
      {
        version: '0.1.0',
        daysAgo: 9,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.ACTIVE,
        packaged: { revision: '9c1f7a25e83b04d6f19ae72c05b8d431f6e02a97' },
        tags: [
          { key: 'maturity', value: 'GREEN' },
          { key: 'persona', value: 'OpenShift Administrator' },
        ],
        members: [
          skill('@ocp-admin/cluster-creator', 2),
          skill('@ocp-admin/cluster-inventory', 4),
          skill('@ocp-admin/cluster-report', 2),
          skill('@ocp-admin/container-cve-validator', 3),
          skill('@ocp-admin/coreos-cve-validator', 4),
          skill('@ocp-admin/cve-recon', 3),
          skill('@ocp-admin/image-inspect', 2),
          skill('@ocp-admin/network-policy-architect', 3),
          ASSISTED_INSTALLER_MCP,
          OPENSHIFT_MCP,
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'rh-basic',
    description:
      'Essential Red Hat skills for IT professionals: CVE explanation, diagnostics, product lifecycle, and support severity guidance.',
    keywords: ['security', 'operations', 'support'],
    author: 'Red Hat Ecosystem Engineering',
    icons: REDHAT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'rh-basic',
    tags: [{ key: 'category', value: 'security' }],
    versions: [
      {
        version: '0.0.1',
        daysAgo: 61,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        packaged: { revision: '7d3b0e91a45c2f86bd10e7395a2c4f0b83e9d165' },
        members: [
          skill('@rh-basic/red-hat-cve-explainer', 1),
          skill('@rh-basic/red-hat-diagnostics', 1),
          skill('@rh-basic/red-hat-get-started', 1),
          skill('@rh-basic/red-hat-product-lifecycle', 1),
        ],
      },
      {
        version: '0.1.0',
        daysAgo: 12,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.ACTIVE,
        packaged: { revision: '5ae3bab564cf87d8b11483aab8df60fc77fcc075' },
        tags: [
          { key: 'maturity', value: 'GREEN' },
          { key: 'persona', value: 'IT Professional' },
        ],
        members: [
          skill('@rh-basic/red-hat-cve-explainer', 1),
          skill('@rh-basic/red-hat-diagnostics', 4),
          skill('@rh-basic/red-hat-get-started', 3),
          skill('@rh-basic/red-hat-product-lifecycle', 3),
          skill('@rh-basic/red-hat-support-severity', 4),
          skill('@rh-basic/red-hat-security-mcp-setup', 1),
          SECURITY_MCP,
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'rh-virt',
    description: 'Virtual machine management and automation for OpenShift Virtualization and KubeVirt workloads.',
    keywords: ['red-hat', 'kubevirt', 'openshift', 'virtualization'],
    author: 'Red Hat Ecosystem Engineering',
    icons: OPENSHIFT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'rh-virt',
    tags: [{ key: 'category', value: 'red-hat' }],
    versions: [
      {
        version: '0.0.1',
        daysAgo: 39,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        packaged: { revision: 'c40e8b17f92a5d3618be07c249a1f5d038b7e6c2' },
        members: [
          skill('@rh-virt/vm-clone', 1),
          skill('@rh-virt/vm-create', 1),
          skill('@rh-virt/vm-delete', 1),
          skill('@rh-virt/vm-inventory', 1),
          skill('@rh-virt/vm-lifecycle-manager', 1),
          skill('@rh-virt/vm-rebalance', 1),
        ],
      },
      {
        version: '0.1.0',
        daysAgo: 7,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.ACTIVE,
        packaged: { revision: 'e72a15c9048bf3d6a15e83029c7b4f16d80a5e93' },
        tags: [
          { key: 'maturity', value: 'GREEN' },
          { key: 'persona', value: 'Red Hat platform engineer' },
        ],
        members: [
          skill('@rh-virt/vm-clone', 1),
          skill('@rh-virt/vm-create', 4),
          skill('@rh-virt/vm-delete', 3),
          skill('@rh-virt/vm-inventory', 2),
          skill('@rh-virt/vm-lifecycle-manager', 1),
          skill('@rh-virt/vm-rebalance', 2),
          skill('@rh-virt/vm-snapshot-create', 3),
          skill('@rh-virt/vm-snapshot-delete', 2),
          skill('@rh-virt/vm-snapshot-list', 1),
          skill('@rh-virt/vm-snapshot-restore', 4),
          OPENSHIFT_MCP,
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'rh-developer',
    description: 'Plugins for building and deploying applications on Red Hat platforms.',
    keywords: ['application-development', 'openshift', 'containers', 'automation'],
    author: 'Red Hat Ecosystem Engineering',
    icons: OPENSHIFT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'rh-developer',
    tags: [{ key: 'category', value: 'application-development' }],
    versions: [
      {
        version: '0.0.1',
        daysAgo: 52,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        packaged: { revision: '1b9d6f30ae82c574f0a3b19d62c8e074a5f31b08' },
        members: [
          skill('@rh-developer/detect-project', 1),
          skill('@rh-developer/recommend-image', 1),
          skill('@rh-developer/s2i-build', 1),
          skill('@rh-developer/deploy', 1),
          skill('@rh-developer/helm-deploy', 1),
          skill('@rh-developer/rhel-deploy', 1),
          skill('@rh-developer/validate-environment', 1),
          skill('@rh-developer/debug-build', 1),
          skill('@rh-developer/debug-pod', 1),
        ],
      },
      {
        version: '0.1.0',
        daysAgo: 3,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
        packaged: { revision: 'd06b3e9128fa47c5b93e05a7f142d6098c3b7e51' },
        tags: [
          { key: 'maturity', value: 'ORANGE' },
          { key: 'persona', value: 'Application developer' },
        ],
        members: [
          skill('@rh-developer/detect-project', 4),
          skill('@rh-developer/recommend-image', 2),
          skill('@rh-developer/s2i-build', 1),
          skill('@rh-developer/deploy', 1),
          skill('@rh-developer/helm-deploy', 3),
          skill('@rh-developer/rhel-deploy', 1),
          skill('@rh-developer/validate-environment', 4),
          skill('@rh-developer/debug-build', 3),
          skill('@rh-developer/debug-pod', 1),
          skill('@rh-developer/debug-pipeline', 2),
          skill('@rh-developer/debug-network', 3),
          skill('@rh-developer/debug-container', 4),
          skill('@rh-developer/debug-scc', 1),
          skill('@rh-developer/debug-rbac', 3),
          skill('@rh-developer/debug-rhel', 4),
          skill('@rh-developer/containerize-deploy', 2),
          skill('@rh-developer/incident-triage', 1),
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'rh-automation',
    description:
      'Ansible Automation Platform governance, execution safety, and forensic troubleshooting tools for Red Hat automation engineers.',
    keywords: ['ansible', 'aap', 'automation', 'red-hat'],
    author: 'Red Hat Ecosystem Engineering',
    icons: ANSIBLE_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'rh-automation',
    tags: [{ key: 'category', value: 'ansible' }],
    versions: [
      {
        version: '0.0.1',
        daysAgo: 47,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        packaged: { revision: '8f25a0c73b19e46d05fa28b3c917e6d40a2b85f3' },
        members: [
          skill('@rh-automation/aap-mcp-validator', 1),
          skill('@rh-automation/execution-risk-analyzer', 1),
          skill('@rh-automation/execution-summary', 1),
          skill('@rh-automation/governance-readiness-assessor', 1),
          skill('@rh-automation/governed-job-launcher', 1),
          skill('@rh-automation/host-fact-inspector', 1),
          skill('@rh-automation/job-failure-analyzer', 1),
        ],
      },
      {
        version: '0.1.0',
        daysAgo: 16,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
        packaged: { revision: 'a91e47d0b25c86f3a09e14d72b5c803f6e91d472' },
        tags: [
          { key: 'maturity', value: 'ORANGE' },
          { key: 'persona', value: 'Red Hat platform engineer' },
        ],
        members: [
          skill('@rh-automation/aap-mcp-validator', 3),
          skill('@rh-automation/execution-risk-analyzer', 3),
          skill('@rh-automation/execution-summary', 1),
          skill('@rh-automation/governance-readiness-assessor', 1),
          skill('@rh-automation/governed-job-launcher', 4),
          skill('@rh-automation/host-fact-inspector', 3),
          skill('@rh-automation/job-failure-analyzer', 2),
          skill('@rh-automation/resolution-advisor', 2),
          skill('@rh-automation/forensic-troubleshooter', 4),
          skill('@rh-automation/governance-assessor', 1),
          skill('@rh-automation/governance-executor', 2),
          ANSIBLE_MCP,
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'rh-ai-engineer',
    description:
      'Skills for OpenShift AI (RHOAI)—data science projects, workbenches, KServe and NIM model serving, pipelines,',
    keywords: ['ai-engineer', 'openshift-ai', 'rhoai', 'kserve'],
    author: 'Red Hat Ecosystem Engineering',
    icons: OPENSHIFT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'rh-ai-engineer',
    tags: [{ key: 'category', value: 'ai-engineer' }],
    versions: [
      {
        version: '0.1.0',
        daysAgo: 21,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
        packaged: { revision: '3e08d5b16a94c72f0be31d859a7c40f2b6e85d19' },
        tags: [
          { key: 'maturity', value: 'ORANGE' },
          { key: 'persona', value: 'Red Hat platform engineer' },
        ],
        members: [
          skill('@rh-ai-engineer/ai-observability', 1),
          skill('@rh-ai-engineer/debug-inference', 4),
          skill('@rh-ai-engineer/ds-project-setup', 4),
          skill('@rh-ai-engineer/model-deploy', 3),
          skill('@rh-ai-engineer/model-monitor', 2),
          skill('@rh-ai-engineer/model-registry', 4),
          skill('@rh-ai-engineer/nim-setup', 1),
          skill('@rh-ai-engineer/pipeline-manage', 2),
          skill('@rh-ai-engineer/serving-runtime-config', 2),
          skill('@rh-ai-engineer/workbench-manage', 4),
          skill('@rh-ai-engineer/guardrails-config', 4),
        ],
      },
    ],
  },
  {
    organization: 'red-hat-ai',
    name: 'cve-remediation',
    description:
      'End-to-end CVE remediation across OpenShift and RHEL: explain the CVE, scope its impact, validate the finding, generate and execute a playbook, then verify the fix.',
    keywords: ['security', 'vulnerability-management', 'remediation'],
    author: 'mprahl',
    tags: [
      { key: 'category', value: 'security' },
      { key: 'assembled-from', value: 'rh-sre, ocp-admin, rh-basic' },
    ],
    versions: [
      {
        version: '0.1.0',
        daysAgo: 34,
        aliases: [],
        created_by: 'mprahl',
        status: SkillStatus.DEPRECATED,
        members: [
          skill('@rh-sre/cve-impact', 1),
          skill('@rh-sre/cve-validation', 1),
          skill('@rh-sre/system-context', 1),
          skill('@rh-sre/playbook-generator', 1),
        ],
      },
      {
        version: '1.0.0',
        daysAgo: 6,
        aliases: ['production'],
        created_by: 'mprahl',
        status: SkillStatus.ACTIVE,
        members: [
          skill('@rh-sre/cve-impact', 1),
          skill('@rh-sre/cve-validation', 1),
          skill('@rh-sre/system-context', 2),
          skill('@rh-sre/playbook-generator', 3),
          skill('@rh-sre/playbook-executor', 4),
          skill('@rh-sre/remediation-verifier', 3),
          skill('@rh-sre/remediation', 3),
          skill('@rh-sre/mcp-lightspeed-validator', 4),
          skill('@rh-sre/mcp-aap-validator', 2),
          skill('@ocp-admin/container-cve-validator', 3),
          skill('@ocp-admin/coreos-cve-validator', 4),
          skill('@ocp-admin/cve-recon', 3),
          skill('@rh-basic/red-hat-cve-explainer', 1),
          // RFC-0010's assembly journey: an assembled plugin references a registered MCP
          // server version explicitly, the same way it references skill versions.
          OPENSHIFT_MCP,
          ANSIBLE_MCP,
        ],
      },
    ],
  },
  {
    organization: 'red-hat-ai',
    name: 'openshift-day-one',
    description:
      'Getting a first workload onto OpenShift: orient the user, detect the project, pick a base image, build, deploy, and check the cluster it landed on.',
    keywords: ['getting-started', 'application-development', 'openshift'],
    author: 'jwm4',
    tags: [
      { key: 'category', value: 'getting-started' },
      { key: 'assembled-from', value: 'rh-basic, rh-developer, ocp-admin' },
    ],
    versions: [
      {
        version: '0.2.0',
        daysAgo: 19,
        aliases: ['staging'],
        created_by: 'jwm4',
        status: SkillStatus.ACTIVE,
        members: [
          skill('@rh-basic/red-hat-get-started', 3),
          skill('@rh-developer/detect-project', 4),
          skill('@rh-developer/recommend-image', 2),
          skill('@rh-developer/s2i-build', 1),
          skill('@rh-developer/deploy', 1),
          skill('@rh-developer/validate-environment', 4),
          skill('@ocp-admin/cluster-inventory', 4),
          OPENSHIFT_MCP,
        ],
      },
    ],
  },
  {
    organization: 'ai5-marketplace',
    name: 'platform-mcp-servers',
    description:
      'The MCP servers the Red Hat collections connect through: OpenShift, the Assisted Installer, and Ansible Automation Platform. Servers only, no skills.',
    keywords: ['mcp', 'platform', 'connectivity'],
    author: 'Red Hat Ecosystem Engineering',
    icons: REDHAT_ICON,
    sourceType: SkillSourceType.GIT,
    repo: COLLECTIONS_REPO,
    path: 'mcps',
    tags: [{ key: 'category', value: 'mcp' }],
    versions: [
      {
        version: '0.1.0',
        daysAgo: 25,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.ACTIVE,
        packaged: { revision: 'ab417e60d9c25813fa07be24c9d5301f7e68b4a2' },
        members: [OPENSHIFT_MCP, ASSISTED_INSTALLER_MCP, ANSIBLE_MCP],
      },
    ],
  },
  {
    organization: 'acme-platform',
    name: 'release-gate',
    description:
      'Release gating for container images: attests the SBOM, runs the security audit subagent before a tag is promoted, and blocks the commit hook on an unsigned image. Demo entry imported from a Claude Code plugin to show the member types a harness adds.',
    keywords: ['release', 'supply-chain', 'claude-code'],
    author: 'ACME Platform Engineering',
    sourceType: SkillSourceType.OCI,
    repo: 'oci://quay.io/acme-platform/plugins/release-gate:1.2.0',
    path: '',
    tags: [
      { key: 'category', value: 'supply-chain' },
      { key: 'harness', value: 'claude-code' },
    ],
    versions: [
      {
        version: '1.2.0',
        daysAgo: 8,
        aliases: ['production'],
        created_by: 'acme-ci',
        status: SkillStatus.ACTIVE,
        packaged: { revision: '' },
        members: [
          skill('@acme-platform/sbom-attestor', 2),
          { member_type: MEMBER_TYPE_MCP_SERVER, name: 'com.github/github-mcp', version: '1.6.0' },
          { member_type: 'agent', name: 'security-auditor' },
          { member_type: 'hook', name: 'pre-commit-scan' },
          { member_type: 'command', name: 'release-check' },
        ],
      },
    ],
  },
];
