/**
 * Seed catalogue for the Skills Registry prototype.
 *
 * REAL DATA, from Red Hat's own published skills: the Ecosystem Engineering agentic
 * collections at github.com/RHEcosystemAppEng/agentic-plugins. Every skill below exists
 * there today. Its organization (the collection it ships in), name, title, description,
 * category, tags and path are read from that repository — the description and title come
 * from the skill's own SKILL.md frontmatter or its `catalog-info.yaml`, whichever the
 * skill publishes — and every path was verified to resolve, so the links out open the
 * real skill at the real ref.
 *
 * That matters more here than it usually would. The prototype's whole subject is a
 * registry of POINTERS, so a catalogue of invented repositories demonstrates the layout
 * while proving nothing about whether the shapes it assumes survive contact with real
 * content — and every link in it 404s the moment a reviewer clicks one. The real
 * collections also turn out to be far more varied than a hand-written fixture set: skill
 * directories here run from a single SKILL.md to twenty-nine files, which is exactly the
 * range the file browser has to cope with.
 *
 * Three deliberate departures, each visible in `sourceType`:
 *
 *   MLFLOW   Three skills are modelled as uploaded into MLflow rather than pointed at, so
 *            the in-app file viewer has real text to render. Their file trees and file
 *            contents are the real ones — see `skillFileTrees.ts`.
 *   OCI/ZIP  One of each, because RFC-0008 defines four source types and both the source
 *            filter and the "cannot be read from a browser" state need something to show.
 *            The collections publish exclusively through git today, so these model a
 *            capability the registry has and the catalogue has not yet used.
 *
 * One skill is marked `private` for the same reason: to exercise the state where a CLI
 * could read the source and the browser cannot.
 *
 * Version histories are synthetic, and unavoidably so: the repository records one current
 * state per skill, while the registry's subject is the sequence of registrations over
 * time. The NEWEST version of each git skill carries the real ref; earlier versions carry
 * resolved commit SHAs, which is what RFC-0008 stores once a branch has been dereferenced.
 */

import { SkillSourceType, SkillStatus } from '../types';

export interface SkillVersionSeed {
  /**
   * Ref the content was registered from: the real branch on the newest version, a
   * resolved commit on earlier ones. Git-sourced skills only.
   */
  revision: string;
  /** Days before the fixed "now" that this version was registered. */
  daysAgo: number;
  /** Aliases pointing at this version. */
  aliases: string[];
  created_by: string;
  /** Version-scoped tags, on top of the skill-level ones. */
  tags?: { key: string; value: string }[];
  /** Lifecycle status per RFC-0008. Defaults to `active` when omitted. */
  status?: SkillStatus;
  /**
   * Marks this version as registered by a client that could not read the content, so it
   * carries no digest. RFC-0008 makes `digest` nullable precisely for this case.
   */
  noDigest?: boolean;
  /**
   * Declares this version's content identical to the version number given: both get the
   * same synthesized digest, which is what the "identical content" grouping keys off.
   */
  sameContentAs?: number;
}

export interface SkillSeed {
  /** The collection this skill ships in, used as the registry organization scope. */
  organization: string;
  /** Real skill directory name, which is also its SKILL.md `name`. */
  name: string;
  /** Real title from the skill's catalog entry, or its directory name. */
  title: string;
  /** Real description from SKILL.md frontmatter or the skill's catalog entry. */
  description: string;
  /** Real category from the skill's or its collection's catalog entry. */
  category: string;
  /** Real keywords from the skill's or its collection's catalog entry. */
  tags: string[];
  /** Real publication lifecycle (e.g. `beta`) where the skill declares one. */
  lifecycle?: string;
  /**
   * Declared by the skill's own frontmatter as performing destructive operations. Real,
   * and exactly the kind of fact a governed registry should surface.
   */
  destructive?: boolean;
  /**
   * Presentation icon URL, if the entry has one. Parent-level and MLflow-managed: no
   * upstream format defines an icon field, so this is the registry's own metadata.
   */
  iconSrc?: string;
  /** Where the content lives. Defaults to git when omitted. */
  sourceType?: SkillSourceType;
  /** Real clone URL, or the modelled image reference / archive URL. */
  repo: string;
  /** Real directory inside the repository holding SKILL.md. */
  path: string;
  author: string;
  /**
   * Whether a browser could reach this source. A private repository is reachable by a CLI
   * carrying the user's credentials but not by the registry UI.
   */
  private?: boolean;
  versions: SkillVersionSeed[];
}

export const SKILL_SEEDS: SkillSeed[] = [
  {
    organization: 'ocp-admin',
    name: 'cluster-creator',
    title: 'OpenShift Cluster Creator',
    description:
      'End-to-end OpenShift cluster creation using Red Hat Assisted Installer. Handles Single-Node OpenShift (SNO) and HA multi-node clusters on baremetal, vsphere, oci, nutanix. Use when: - "Create a new OpenShift cluster" - "Install OpenShift on my servers" - "Set up a single-node cluster for edge deployment" - "Deploy a production HA cluster" Complete workflow: cluster definition, ISO generation, host discovery/validation, role assignment, network configuration (VIPs, static networking), installation monitoring, credential retrieval. NOT for: - Listing existing clusters → Use `/cluster-inventory` skill - Modifying running clusters → Out of scope (Day-2 operations require direct cluster access) - Cluster upgrades (not yet supported)',
    category: 'automation',
    tags: ['openshift', 'cluster-management', 'assisted-installer', 'provisioning'],
    lifecycle: 'beta',
    destructive: true,
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/cluster-creator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '5ae3bab564cf87d8b11483aab8df60fc77fcc075',
        daysAgo: 27,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
        noDigest: true,
      },
      {
        revision: 'main',
        daysAgo: 4,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'cluster-inventory',
    title: 'OpenShift Cluster Inventory',
    description:
      'List and inspect OpenShift clusters across self-managed (OCP, SNO) and managed service (ROSA, ARO, OSD) deployments. Returns cluster name, ID, version, status, platform, and creation date. Use when: - "List all clusters" - "Show cluster status" - "What clusters are available?" - "Get details of cluster [name]" - "Show cluster events for diagnostics" Read-only operations. Does NOT modify clusters.',
    category: 'monitoring',
    tags: ['openshift', 'cluster-management', 'inventory', 'monitoring'],
    lifecycle: 'beta',
    sourceType: SkillSourceType.MLFLOW,
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/cluster-inventory',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '729db41f3e189b93e52ba61e21be6eb8d97ef772',
        daysAgo: 157,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'd8346cba9d52283ce523c11f28cdc223fbb07e4e',
        daysAgo: 123,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'eccbb025eeeb45e02a9e11e2cfc3e048c0266b63',
        daysAgo: 56,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'e44d3886f2c2c54c0a28dc7c0bef66290dee5b28',
        daysAgo: 15,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'cluster-report',
    title: 'OpenShift Cluster Health Report',
    description:
      'Generate a consolidated health report across multiple OpenShift clusters. Verifies each kubeconfig context is a genuine OpenShift cluster before reporting. Non-OpenShift contexts are skipped by default. Collects node resources (CPU, memory, GPUs), namespace counts, and pod status into a single comparison view. Use when: - "Show me a report across all clusters" - "Compare cluster health" - "Multi-cluster status overview" - "How are my clusters doing?" - "Include all clusters including non-OpenShift" (override default filter) NOT for single-cluster deep-dives or troubleshooting specific pods.',
    category: 'monitoring',
    tags: ['openshift', 'cluster-management', 'health-check', 'reporting'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/cluster-report',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '4c52ccb5585be25eebe8ac26cba7915e32702966',
        daysAgo: 93,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 26,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'container-cve-validator',
    title: 'Container CVE Validator',
    description:
      'Validate a CVE against a Red Hat container image using official SBOM attestations, Red Hat VEX data, and CVE metadata from MITRE/OSV.dev.',
    category: 'security',
    tags: ['openshift', 'security', 'cve', 'sbom', 'container'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/container-cve-validator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '1466625fcff71b6af613de0d8d756b59e1ec8629',
        daysAgo: 123,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'd1f00c83fe630e2ea638e9a9eb69436192dae49b',
        daysAgo: 71,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 37,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'coreos-cve-validator',
    title: 'CoreOS CVE Validator',
    description:
      'Validate a CVE against Red Hat Enterprise Linux CoreOS (RHCOS) in a specific OCP release by extracting RPM packages and checking Red Hat VEX data.',
    category: 'security',
    tags: ['openshift', 'security', 'cve', 'coreos', 'rhcos'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/coreos-cve-validator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '978f7699e21db692d97555c0759008cf34fbd2b5',
        daysAgo: 174,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'a06434074446c2f296566b88e87ea9cf76a362bb',
        daysAgo: 129,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'bd638b0d2783e8af0212518b3e68099229146f32',
        daysAgo: 100,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 48,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'cve-recon',
    title: 'CVE Reconnaissance',
    description:
      'Query MITRE, OSV.dev, and Go vulnerability database to produce a structured report of affected packages, ecosystems, and vulnerable version ranges for a CVE.',
    category: 'security',
    tags: ['security', 'cve', 'reconnaissance', 'vulnerability'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/cve-recon',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '5212d4b1c57c0e6601fa173caf562cd2c1092f37',
        daysAgo: 86,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: 'ae538839e3b8ddbf3c5c7dd9c30d8e4ac3e1ca76',
        daysAgo: 41,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 12,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'image-inspect',
    title: 'Container Image Inspector',
    description:
      'Fetch container image labels, validate registry ownership, resolve tag/digest via SBOM, and report the SBOM artifact reference for a Red Hat container image.',
    category: 'security',
    tags: ['security', 'container', 'sbom', 'image-inspection'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/image-inspect',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '035586e791c4fddbfc4cf040a89baa5bf59a2e2d',
        daysAgo: 68,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 23,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'ocp-admin',
    name: 'network-policy-architect',
    title: 'Network Policy Architect',
    description:
      'Design and validate Kubernetes NetworkPolicies following Zero Trust principles (NIST SP 800-207). Two-tier analysis — architecture review then live cluster verification — produces a verified implementation plan with apply-and-verify results. Use when: - "Create NetworkPolicies for my namespace" - "Audit network isolation for this workload" - "Design network segmentation for a new application" - "Verify NetworkPolicies implement Zero Trust" - User mentions "network policy", "microsegmentation", "default-deny" NOT for Admin Network Policy (ANP) cluster-wide rules — those are cluster-admin infrastructure guardrails, not application-level microsegmentation. NOT for CNI plugin configuration or Multus secondary networks.',
    category: 'cluster-management',
    tags: ['openshift', 'cluster-management', 'administration'],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhatopenshift.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'ocp-admin/skills/network-policy-architect',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'cc1ae984e5eb9ee17afc903483336aa55fc670da',
        daysAgo: 95,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'dc3faded4d1c067f34edb68a5b5507120b862d76',
        daysAgo: 72,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 34,
        aliases: ['champion', 'production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'ai-observability',
    title: 'Ai Observability',
    description:
      'Analyze AI model performance, GPU utilization, and cluster health on OpenShift AI. Use when: - "How is my model performing?" - "What GPUs are available in the cluster?" - "Show me inference latency for Llama" - "Check OpenShift cluster health metrics" - "Trace a slow inference request" - "Correlate errors across my inference stack" Query-driven, read-only analysis. Routes to the appropriate observability domain based on user intent. NOT for deploying models (use /model-deploy). NOT for debugging failed deployments (use /debug-inference).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/ai-observability',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 45,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'debug-inference',
    title: 'Debug Inference',
    description:
      'Troubleshoot failed or slow InferenceService deployments on OpenShift AI. Use when: - "My InferenceService won\'t start" - "Model deployment is stuck" - "Inference endpoint returns errors" - "Model is slow / high latency" - "GPU scheduling failed for my model" Progressive diagnosis: status conditions, events, pod logs, GPU health, and observability analysis. NOT for deploying models (use /model-deploy). NOT for creating runtimes (use /serving-runtime-config).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/debug-inference',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'd86e654e4f12afa66dccd738c6b0fc175b48c9c8',
        daysAgo: 151,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '38ba5287725c22bb8944bedf73f973fc8aba814b',
        daysAgo: 117,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        sameContentAs: 1,
      },
      {
        revision: 'd14a23f00609b6ec6b5723901b08958bf715c91c',
        daysAgo: 50,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 9,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'ds-project-setup',
    title: 'Ds Project Setup',
    description:
      'Create and configure Data Science Projects on OpenShift AI with namespace setup, S3 data connections, pipeline server, and model serving enablement. Use when: - "Create a data science project" - "Set up a new namespace for ML work" - "Add an S3 data connection to my project" - "Configure the pipeline server" - "Enable model serving on my project" Bootstraps an RHOAI Data Science Project with proper labels, data connections, pipeline infrastructure, and model serving configuration. NOT for deploying models (use /model-deploy). NOT for creating workbenches (use /workbench-manage). NOT for managing pipelines after setup (use /pipeline-manage).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/ds-project-setup',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '68c9b9aedd3efdbfd4cec167e117300b0bd18568',
        daysAgo: 173,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: 'e3a6cb8216d620ae88e0be1817d06c64e98358d3',
        daysAgo: 121,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '7f1e5d5098477cbdd7e68e4f471de713cb43ff03',
        daysAgo: 87,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 20,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'guardrails-config',
    title: 'Guardrails Config',
    description:
      'Configure TrustyAI Guardrails Orchestrator for LLM input/output content safety on OpenShift AI. Use when: - "Add guardrails to my LLM endpoint" - "Set up content safety for my model" - "Configure PII detection on my inference endpoint" - "Block prompt injection attacks" - "I need a guarded endpoint for my deployed model" Handles GuardrailsOrchestrator CR deployment, detector configuration (content safety, PII, prompt injection, toxicity), orchestration policies, and guarded endpoint validation. NOT for deploying models (use /model-deploy first). NOT for bias/drift monitoring (use /model-monitor). NOT for infrastructure observability (use /ai-observability).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/guardrails-config',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'e0e99217de94dea34db976e4ab2a0daa219afc66',
        daysAgo: 146,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
      },
      {
        revision: '1b92729fbd582582151aacb66125b2d0996822c0',
        daysAgo: 117,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '7a5367580f90bf69cbbe169e0c8f32210258a498',
        daysAgo: 65,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 31,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'model-deploy',
    title: 'Model Deploy',
    description:
      'Deploy AI/ML models on OpenShift AI using KServe with vLLM, NVIDIA NIM, or Caikit+TGIS runtimes. Use when: - "Deploy Llama 3 on my cluster" - "Set up a vLLM inference endpoint" - "Deploy a model with NIM" - "Create an InferenceService for Granite" - "I need to serve a model on OpenShift AI" Handles runtime selection, GPU validation, InferenceService CR creation, and rollout monitoring. NOT for NIM platform setup (use /nim-setup first). NOT for custom runtime creation (use /serving-runtime-config).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/model-deploy',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '9a7b2626c8339961fc94b1511636fc82780cf973',
        daysAgo: 123,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '8d248a15aeb6840c9f6c0d9f946251eed954bce9',
        daysAgo: 94,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 42,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'model-monitor',
    title: 'Model Monitor',
    description:
      'Configure TrustyAI model monitoring for bias detection and data drift on deployed InferenceServices. Use when: - "Monitor my model for bias" - "Set up drift detection on my inference endpoint" - "Configure TrustyAI for my deployed model" - "Check if my model has fairness issues" - "I need SPD / DIR metrics for my model" Handles TrustyAIService deployment, bias metric configuration (SPD, DIR), drift metric configuration (MeanShift, FourierMMD, KS-Test, Jensen-Shannon), threshold tuning, and monitoring validation. NOT for deploying models (use /model-deploy first). NOT for input/output content safety guardrails (use /guardrails-config). NOT for infrastructure-level observability (use /ai-observability).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/model-monitor',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '6eae3d68aebf7e2c04ea58f28451c1c7606f4b47',
        daysAgo: 35,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 6,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'model-registry',
    title: 'Model Registry',
    description:
      'Register, version, and manage ML models in the OpenShift AI Model Registry. Browse the Model Catalog, track model metadata, and promote models across environments. Use when: - "Register a new model in the registry" - "List registered models" - "What versions exist for my model?" - "Promote a model from dev to production" - "Show model artifacts and storage URIs" Handles model registration, versioning, metadata management, artifact tracking, and cross-environment promotion. NOT for deploying models (use /model-deploy). NOT for model performance monitoring (use /ai-observability).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/model-registry',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '8a54c0e2dda937412423f65fa0a5c598c6827db1',
        daysAgo: 123,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '948790e7eafb3bfc319bf67c37bf121811b97c76',
        daysAgo: 100,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'fc227023d2a2edef08972dacec48188b31031c4e',
        daysAgo: 62,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 17,
        aliases: ['champion', 'production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'nim-setup',
    title: 'Nim Setup',
    description:
      'Configure NVIDIA NIM platform on OpenShift AI for optimized model inference. Use when: - "Set up NIM on my cluster" - "Configure NGC credentials for NIM" - "I want to deploy a NIM model but haven\'t set up the platform" - "Create the NIM Account CR" One-time prerequisite before deploying models with NVIDIA NIM runtime via /model-deploy. NOT for deploying models (use /model-deploy instead). NOT for vLLM or Caikit deployments (NIM-specific only).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/nim-setup',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 28,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'pipeline-manage',
    title: 'Pipeline Manage',
    description:
      'Create, run, schedule, and monitor Data Science Pipelines (Kubeflow Pipelines 2.0) on OpenShift AI. Use when: - "Run a pipeline in my project" - "Schedule a recurring pipeline" - "Check my pipeline run status" - "List pipeline runs and their logs" - "Set up the pipeline server" - "Delete a pipeline or pipeline run" Handles pipeline server setup, pipeline run submission from YAML, scheduling recurring runs, monitoring execution, and viewing step logs. NOT for creating data science projects (use /ds-project-setup). NOT for deploying models (use /model-deploy). NOT for model training jobs (use training skills).',
    category: 'rh-ai-engineer',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/pipeline-manage',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'e9ae4d7a6eb92383d12429577218e3475481120e',
        daysAgo: 62,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 39,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'serving-runtime-config',
    title: 'Serving Runtime Config',
    description:
      'Configure custom ServingRuntime CRs on OpenShift AI for model serving frameworks not covered by built-in runtimes. Use when: - "Create a custom serving runtime" - "I need a runtime for ONNX / Triton / custom framework" - "Customize vLLM runtime parameters" - "What serving runtimes are available?" - "Add a custom container image for model serving" Handles listing existing runtimes, creating new ServingRuntime CRs, and validating compatibility with target models. NOT for deploying models (use /model-deploy after runtime is configured). NOT for NIM platform setup (use /nim-setup).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/serving-runtime-config',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'd44379e20d17cedec41595b6724c533f486318ba',
        daysAgo: 91,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        noDigest: true,
      },
      {
        revision: 'main',
        daysAgo: 50,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-ai-engineer',
    name: 'workbench-manage',
    title: 'Workbench Manage',
    description:
      'Create and manage Jupyter notebook workbenches on OpenShift AI with image selection, resource configuration, PVC storage, and lifecycle management. Use when: - "Create a notebook workbench" - "Spin up a Jupyter environment for data science" - "Start / stop my workbench" - "What notebook images are available?" - "Delete a workbench I no longer need" Handles Notebook CR lifecycle: create with configurable images and resources, start/stop, attach storage, and delete with data loss warnings. NOT for deploying models (use /model-deploy). NOT for creating projects (use /ds-project-setup). NOT for managing pipelines (use /pipeline-manage).',
    category: 'rh-ai-engineer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/pytorch.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-ai-engineer/skills/workbench-manage',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '078207c9f9df738600dcfc967a99904edfd6595e',
        daysAgo: 167,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'c6eae1b16122de1389c432e520a9585718ec1a90',
        daysAgo: 115,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        sameContentAs: 1,
      },
      {
        revision: '8aaf29bf748e0af9759edb66e02b79593d9e3b19',
        daysAgo: 81,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 14,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'aap-mcp-validator',
    title: 'Aap Mcp Validator',
    description:
      'Validate that required AAP MCP servers are accessible before executing automation skills. Use when: - Before any skill that requires AAP MCP access - "Validate AAP MCP", "Check if AAP is configured" - "Verify AAP connection", "Test AAP MCP servers" NOT for: actual automation tasks (use specialized skills instead).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/aap-mcp-validator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '2f3dc604d118dbdb7477703df063bee1bd3c6b65',
        daysAgo: 111,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '0359d54683bf071145fbd228bf3b7c0c789b8761',
        daysAgo: 59,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 25,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'execution-risk-analyzer',
    title: 'Execution Risk Analyzer',
    description:
      'Analyze execution risk by classifying inventory, scanning extra_vars for secrets, and assessing scope. Use when: - "Execute on production", "Deploy to production" (as first step before launch) - "Is this execution safe?" - "Check execution risk" - "Validate the execution target" NOT for: launching jobs (use governed-job-launcher) or troubleshooting failures (use job-failure-analyzer).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/execution-risk-analyzer',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'da1ca3c92a5fa2f0f7c13d1f357ec0cf8d102dd4',
        daysAgo: 117,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: '405f3d9ac60ad37132c78602f2b88ce2c082497b',
        daysAgo: 88,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 36,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'execution-summary',
    title: 'Execution Summary',
    description:
      'Generate concise execution audit reports tracking documents consulted, MCP tools used, decisions made, and outcomes. Use when: - "Generate execution summary" - "Create execution report" - "Show workflow audit trail" - After completing any governance workflow (assessment, execution, troubleshooting) NOT for: starting a new workflow (use the appropriate skill instead).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/execution-summary',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 47,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'forensic-troubleshooter',
    title: 'Forensic Troubleshooter',
    description:
      'Orchestrates forensic analysis of failed jobs with event extraction, host correlation, and resolution advisory. Use when: - "Job #X failed", "Why did the execution fail?" - "Analyze the failure", "What went wrong?" - "Root cause analysis of job #X" NOT for execution (use governance-executor) or platform assessment (use governance-assessor).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/forensic-troubleshooter',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'a80cb16deb70e218b48c9cc21e0cb668549d97c8',
        daysAgo: 117,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
      },
      {
        revision: '831b5b8e46b5c557b195b26619a73145f6685505',
        daysAgo: 94,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '4f8edb1b9c9e3c5ee0657eb069d50835de557f3e',
        daysAgo: 56,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 11,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'governance-assessor',
    title: 'Governance Assessor',
    description:
      'Orchestrates AAP governance readiness assessments -- full platform audit or scoped to specific domains. Assesses 7 governance domains + 1 bonus: 1. Workflow Governance (approval gates, workflow coverage) 2. Notification Coverage (failure alerting, notification bindings) 3. Access Control / RBAC (teams, roles, least privilege) 4. Credential Security (separation of duties, credential hygiene) 5. Execution Environments (custom EEs, image provenance) 6. Workload Isolation (instance groups, capacity separation) 7. Audit Trail (activity stream, change tracking) Bonus: External Authentication (LDAP, SAML, SSO) Use when: - Full: "Is my AAP ready for production?", "Audit my platform governance" - Scoped: "Assess my credentials setup", "Check my RBAC", "How are my notifications?" - "What should I fix before executing jobs?" - Any question about specific AAP governance domains above NOT for job execution (use governance-executor) or troubleshooting (use forensic-troubleshooter).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/governance-assessor',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 22,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'governance-executor',
    title: 'Governance Executor',
    description:
      'Orchestrates governed job execution with risk analysis, check mode, approval, and rollback. Use when: - "Execute job template X", "Deploy to production", "Push to prod", "Launch job template" - Any execution request targeting sensitive environments - Job template launches requiring governance controls NOT for platform assessment (use governance-assessor) or troubleshooting (use forensic-troubleshooter).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/governance-executor',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '2cda704ce648b55a48f9163d9b15d22775923ccd',
        daysAgo: 56,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 33,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'governance-readiness-assessor',
    title: 'Governance Readiness Assessor',
    description:
      'Assess AAP platform governance readiness -- full 7-domain audit or scoped to specific domains. Use when: - Full assessment: "Is my AAP ready for production?", "Audit my platform governance" - Scoped assessment: "Assess my credentials setup", "Check my RBAC", "How are my notifications configured?" - "What should I fix before executing jobs?" - "Assess my AAP configuration" - Any question about a specific governance domain (credentials, RBAC, workflows, notifications, EEs, instance groups, audit, auth) NOT for: executing jobs (use governance-executor) or troubleshooting failures (use forensic-troubleshooter).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/governance-readiness-assessor',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 44,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'governed-job-launcher',
    title: 'Governed Job Launcher',
    description:
      'Execute governed job launches with check mode, approval gates, phased rollout, and rollback. Use when: - After execution-risk-analyzer has classified the execution risk - "Launch with check mode first", "Run the dry run" - "Execute the job" (after risk analysis) - "Rollback the failed job" NOT for: risk analysis (use execution-risk-analyzer first) or troubleshooting (use job-failure-analyzer).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/governed-job-launcher',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '7aa3a0a562c57043eeba14d88f3bd0dc43d6196c',
        daysAgo: 161,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '0d0fb67ada49d7d0f05254bbe6d49ed928f50530',
        daysAgo: 109,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '9d00c177d29c7b73331570adaa5a60fbaceed57a',
        daysAgo: 75,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 8,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'host-fact-inspector',
    title: 'Host Fact Inspector',
    description:
      'Correlate job failures with host system facts to determine platform drift and resource issues. Use when: - After job failure analysis identifies affected hosts - "Check the system facts for failed hosts" - "Is the host healthy?", "Check disk space on server-01" - "Why is the service failing on this host?" NOT for: analyzing job events (use job-failure-analyzer first) or resolution guidance (use resolution-advisor after).',
    category: 'rh-automation',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/host-fact-inspector',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '82895da840a35abc361431e27ee00c0f3c4a07f0',
        daysAgo: 105,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'bd6883bf348b9797cf79763358981040d9640652',
        daysAgo: 53,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        sameContentAs: 1,
      },
      {
        revision: 'main',
        daysAgo: 19,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'job-failure-analyzer',
    title: 'Job Failure Analyzer',
    description:
      'Extract and analyze failure events from AAP jobs to classify errors and reconstruct failure timelines. Use when: - "Job #X failed", "Why did the execution fail?" - "Analyze the failed job", "What went wrong?" - "Show me the failure details" NOT for: host fact correlation (use host-fact-inspector) or resolution recommendations (use resolution-advisor).',
    category: 'rh-automation',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/job-failure-analyzer',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '92435efe01a64c37698f24388ee456365bab4287',
        daysAgo: 82,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 30,
        aliases: ['champion', 'production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-automation',
    name: 'resolution-advisor',
    title: 'Resolution Advisor',
    description:
      'Provide Red Hat documentation-backed resolution recommendations for classified job errors. Use when: - After failure analysis and host fact inspection: "How do I fix this?" - "What does Red Hat recommend for this error?" - "What\'s the fix for privilege escalation timeout?" - "Is this a known AAP issue?" NOT for: analyzing events (use job-failure-analyzer first) or checking host facts (use host-fact-inspector first).',
    category: 'rh-automation',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-automation/skills/resolution-advisor',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '6c224c22a9143492033891850ed01c96f10738f1',
        daysAgo: 70,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 41,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-basic',
    name: 'red-hat-cve-explainer',
    title: 'Red Hat CVE Explainer',
    description:
      "Explain a CVE using Red Hat's severity rating system. Looks up the CVE, explains the rating, and suggests a course of action.",
    category: 'vulnerability-management',
    tags: ['red-hat', 'security', 'cve', 'vulnerability'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhat.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-basic/skills/red-hat-cve-explainer',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 5,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-basic',
    name: 'red-hat-diagnostics',
    title: 'Red Hat Diagnostics',
    description:
      'Explain how to gather diagnostic information for Red Hat products (RHEL, OpenShift, Ansible Automation Platform, Satellite) to share with Red Hat Technical Support.',
    category: 'diagnostics',
    tags: ['red-hat', 'diagnostics', 'support', 'troubleshooting'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhat.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-basic/skills/red-hat-diagnostics',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '03acb198b454257e583dd7eee93bbd01f84b4522',
        daysAgo: 118,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '6e6501ff03b00c88dce6501553051cbaaacd869e',
        daysAgo: 77,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '9563e0bc33cfdefd9653a551f91a0e940f489fc7',
        daysAgo: 54,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 16,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-basic',
    name: 'red-hat-get-started',
    title: 'Red Hat Get Started',
    description: 'Bootstrap installer. Fetches and installs all Red Hat agent skills into this project.',
    category: 'setup',
    tags: ['red-hat', 'installer', 'bootstrap', 'onboarding'],
    lifecycle: 'beta',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-basic/skills/red-hat-get-started',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '6d4d8d976a7d3c58442f148c411ddd4373b43d78',
        daysAgo: 91,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'd9f3671a07a4144ad9bd3acaf1afaa00e51b152d',
        daysAgo: 50,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 27,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-basic',
    name: 'red-hat-product-lifecycle',
    title: 'Red Hat Product Lifecycle',
    description:
      'Explain a Red Hat product\'s lifecycle status, support phases, and recommended action. Answers questions like "Is RHEL 8.6 still supported?" or "When does OpenShift 4.14 reach end of maintenance?"',
    category: 'lifecycle-management',
    tags: ['red-hat', 'lifecycle', 'support', 'product-management'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhat.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-basic/skills/red-hat-product-lifecycle',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '79007df3cbfdda476bdd3b6deca436e9f2130901',
        daysAgo: 146,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DEPRECATED,
      },
      {
        revision: '95b529552a3798281eb08a2030420083e5adf87f',
        daysAgo: 79,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 38,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-basic',
    name: 'red-hat-security-mcp-setup',
    title: 'Red Hat Security MCP Setup',
    description:
      'Add the Red Hat Security MCP server to this project. Configures the HTTP transport endpoint and explains the Red Hat Customer Portal SSO browser login flow.',
    category: 'configuration',
    tags: ['red-hat', 'mcp', 'security', 'configuration'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/redhat.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-basic/skills/red-hat-security-mcp-setup',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 49,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        noDigest: true,
      },
    ],
  },
  {
    organization: 'rh-basic',
    name: 'red-hat-support-severity',
    title: 'Red Hat Support Severity',
    description:
      'Help determine the correct severity level for a Red Hat support ticket, explain SLAs, and guide what information to include.',
    category: 'ticket-management',
    tags: ['red-hat', 'support', 'severity', 'sla'],
    lifecycle: 'beta',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-basic/skills/red-hat-support-severity',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '2b4dbc24e92a9a878cea0653b32240eb400e4935',
        daysAgo: 128,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: '131e4da8bc18b3649e41f8f4328aba791d003607',
        daysAgo: 99,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '8aa847f481605ff4ea3ed4920c10c0399af797ac',
        daysAgo: 47,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 13,
        aliases: ['champion', 'production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'containerize-deploy',
    title: 'Containerize Deploy',
    description:
      'Complete end-to-end workflow for containerizing and deploying applications to OpenShift or standalone RHEL systems. Orchestrates /detect-project, /s2i-build, /deploy, /helm-deploy, and /rhel-deploy skills with user confirmation checkpoints at each phase. Supports S2I, Podman, Helm deployment strategies for OpenShift, and Podman/native deployments for RHEL hosts. Use this skill when user wants to go from source code to running application in one guided workflow. Supports resume after interruption and rollback on failure. Triggers on /containerize-deploy command.',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/containerize-deploy',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'b6529b9429f5a11c4d3e69db27245d55646d6000',
        daysAgo: 76,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 24,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-build',
    title: 'Debug Build',
    description:
      'Diagnose OpenShift build failures including S2I builds, Docker/Podman builds, and BuildConfig issues. Automates multi-step diagnosis: BuildConfig validation, build pod logs, registry authentication, and source repository access. Use this skill when builds fail, hang, or produce unexpected results. Triggers on /debug-build command or phrases like "build failed", "S2I error", "can\'t pull builder image", "can\'t push to registry", "build timeout".',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-build',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '697b66198137a8c6eacf2f75669f7fb1369df1ce',
        daysAgo: 109,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '10016c5f542ee1aec36e5d646d6bad70752e93de',
        daysAgo: 64,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 35,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-container',
    title: 'Debug Container',
    description:
      'Diagnose local container issues with Podman/Docker including image pull errors, container startup failures, OOM kills, and networking problems. Automates multi-step diagnosis: container inspect, logs retrieval, image analysis, and resource constraint checking. Use this skill when containers fail to run locally before deployment. Triggers on /debug-container command or phrases like "container won\'t start", "podman run fails", "local container crashing", "container exits immediately".',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-container',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'b01ff86bf73261f8e0e4239ef525a213473dcfa7',
        daysAgo: 152,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '39aedbd81f06b5e686f588195d6e165db974c73e',
        daysAgo: 129,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '7b43d9926ac89abe29707de96f82242a60914279',
        daysAgo: 91,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 46,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-network',
    title: 'Debug Network',
    description:
      'Diagnose OpenShift service connectivity issues including DNS resolution, service endpoints, route ingress, and network policies. Automates multi-step diagnosis: service endpoint verification, pod selector matching, route status, and network policy analysis. Use this skill when services can\'t communicate, routes return 503/502 errors, or external access fails. Triggers on /debug-network command or phrases like "can\'t reach service", "route returning 503", "pods can\'t communicate", "no endpoints".',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-network',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '053de0f6e79e238a16871f47cb36c0de43a64ce6',
        daysAgo: 71,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '393dc9d36b81ee4cb8192c068fc01e1a91bc5315',
        daysAgo: 48,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 10,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-pipeline',
    title: 'Debug Pipeline',
    description:
      'Diagnose OpenShift Pipelines (Tekton) CI/CD failures including PipelineRun failures, TaskRun step errors, workspace/PVC binding issues, and authentication problems. Automates multi-step diagnosis: PipelineRun status, failed TaskRun analysis, step container logs, and related resource checks. Use this skill when pipelines fail, hang, or produce unexpected results. Triggers on /debug-pipeline command or phrases like "pipeline failed", "PipelineRun error", "TaskRun failed", "tekton error", "pipeline stuck", "pipeline timeout".',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-pipeline',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '685b684d8a4165a69637ef91914dbd0d59aa20d3',
        daysAgo: 44,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 21,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-pod',
    title: 'Debug Pod',
    description:
      'Diagnose pod failures on OpenShift including CrashLoopBackOff, ImagePullBackOff, OOMKilled, and pending pods. Automates multi-step diagnosis: pod status, events, logs (current + previous), and resource constraint analysis. Use this skill when pods are not running, restarting frequently, or stuck in non-ready states. Triggers on /debug-pod command or phrases like "my pod is crashing", "pod won\'t start", "CrashLoopBackOff", "ImagePullBackOff", "OOMKilled".',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-pod',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 32,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-rbac',
    title: 'Debug Rbac',
    description:
      'Diagnose OpenShift RBAC permission failures that cause workloads to fail with 403 Forbidden errors when accessing the Kubernetes API. Automates multi-step diagnosis: pod logs for FORBIDDEN errors, readiness probe failures, ServiceAccount identification, RoleBinding/ClusterRoleBinding analysis, and remediation history for regression detection. Use when: - "403 forbidden when accessing Kubernetes API" - "ServiceAccount permission denied" - "pods can\'t list resources" - "missing RoleBinding" - User mentions "RBAC denied", "403 forbidden", "permission denied" NOT for SCC admission failures (use /debug-scc instead).',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-rbac',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '056203d6a0df2bb287032912c840de4a056fc5e3',
        daysAgo: 144,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'd4bb71b9e30470be78fbfa51f6b6f07eb2ace348',
        daysAgo: 110,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 43,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-rhel',
    title: 'Debug Rhel',
    description:
      'Diagnose RHEL system issues including systemd service failures, SELinux denials, firewall blocking, and system resource problems. Automates multi-step diagnosis: journalctl log analysis, SELinux denial detection (ausearch), firewall rule inspection, and systemd unit status. Use this skill when applications fail on standalone RHEL/Fedora/CentOS hosts deployed via /rhel-deploy. Triggers on /debug-rhel command or phrases like "service won\'t start on RHEL", "SELinux blocking", "systemd failed", "firewall blocking".',
    category: 'rh-developer',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-rhel',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '7562609bd597fa54688057b724b304118694554f',
        daysAgo: 122,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'e9124a4692f980a08ca3389fd6b695f751948bfa',
        daysAgo: 93,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '36672fac39cbcc1a243ee48486c53a1c8bfd5f0a',
        daysAgo: 41,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 7,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'debug-scc',
    title: 'Debug Scc',
    description:
      'Diagnose OpenShift Security Context Constraint (SCC) violations that prevent pods from being created. Automates multi-step diagnosis: Deployment status, ReplicaSet FailedCreate events, security context field extraction, SCC rejection parsing, and ServiceAccount SCC binding analysis. Use when: - "SCC violation blocking pod creation" - "unable to validate against any security context constraint" - "FailedCreate forbidden" - "pod blocked by SCC" - User mentions "SCC", "security context constraint", "FailedCreate" NOT for pods crashing after creation (use /debug-pod instead).',
    category: 'rh-developer',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/debug-scc',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 18,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'deploy',
    title: 'Deploy',
    description:
      'Create Kubernetes Deployment, Service, and Route resources on OpenShift to deploy and expose an application. Use this skill after /s2i-build to make the built image accessible. Handles port detection, replica configuration, HTTPS route creation, rollout monitoring, and rollback on failure. Triggers on /deploy command when user wants to deploy a container image to OpenShift.',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/deploy',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 29,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'detect-project',
    title: 'Detect Project',
    description:
      "Analyze a project folder or GitHub repository to detect programming language, framework, and version requirements. Use this skill when containerizing an application, selecting an S2I builder image, deploying to OpenShift or RHEL, or determining a project's tech stack. Supports Node.js, Python, Java, Go, Ruby, .NET, PHP, and Perl. Triggers on /detect-project command or when user needs build strategy recommendations. Run before /s2i-build or /rhel-deploy.",
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/detect-project',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '80bd334bb57d96335029a5251c94715743c27081',
        daysAgo: 146,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'd0f72afb7fa5d1c24fcbb5a050d40f0246d0113c',
        daysAgo: 123,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'c5ff14f80f8679c98cc25ebb02fc4b218ed0c9ac',
        daysAgo: 85,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 40,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'helm-deploy',
    title: 'Helm Deploy',
    description:
      'Deploy applications to OpenShift using Helm charts. Use this skill when user wants to deploy with Helm, when a Helm chart is detected in the project, or when /helm-deploy command is invoked. Supports both existing charts and chart creation. Handles chart detection, values customization, install/upgrade operations, and rollback. Requires kubernetes MCP Helm tools.',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/helm-deploy',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'ddbe705fcfac409f6d3950126a323c32d1aee08b',
        daysAgo: 65,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '5acb2bc17fbaeed6822239cf0b6d82aecb18c874',
        daysAgo: 42,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 4,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'incident-triage',
    title: 'Incident Triage',
    description:
      'Structured incident investigation for OpenShift using the Five Whys methodology, investigation guardrails, Prometheus metric analysis, and adversarial due diligence. Orchestrates multi-resource diagnosis across Deployments, ReplicaSets, Pods, Services, and cluster resources to trace from observed symptoms to root cause. Use when: - "investigate this incident" - "triage this alert" - "root cause analysis" - "what caused this outage" - User mentions "five whys", "incident", "triage", "RCA" NOT for single-resource issues with clear patterns (use /debug-pod, /debug-scc, /debug-rbac, or /debug-network instead).',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/incident-triage',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 15,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'recommend-image',
    title: 'Recommend Image',
    description:
      'Intelligently recommend the optimal S2I builder image or container base image for a project based on detected language/framework, use-case requirements, security posture, and deployment target. Supports GitHub URLs for remote project analysis (delegates to /detect-project). Use this skill when the user needs a container image recommendation, wants to compare image options, or asks about production vs development images. Triggers on /recommend-image command, or when advanced image selection beyond basic version matching is needed. Supports Node.js, Python, Java, Go, Ruby, .NET, PHP, and Perl on Red Hat UBI.',
    category: 'rh-developer',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/recommend-image',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '507388b167f277ea735bcc6e0007f2816dc9a403',
        daysAgo: 67,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 26,
        aliases: ['champion', 'production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'rhel-deploy',
    title: 'Rhel Deploy',
    description:
      "CRITICAL: When user types /rhel-deploy, use THIS skill immediately. This skill deploys applications to standalone RHEL/Fedora/CentOS systems (NOT OpenShift) using Podman containers with systemd, or native dnf builds. Handles SSH connectivity, SELinux, firewall-cmd, and systemd unit creation. Triggers: /rhel-deploy command, 'deploy to RHEL', 'deploy to Fedora', 'deploy to my server via SSH'.",
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/rhel-deploy',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 37,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 's2i-build',
    title: 'S2I Build',
    description:
      'Create BuildConfig and ImageStream resources on OpenShift and trigger a Source-to-Image (S2I) build. Use this skill after /detect-project to build container images from source code on the cluster. Handles namespace verification, resource creation with user confirmation, build monitoring with log streaming, and failure recovery. Triggers on /s2i-build command. Run before /deploy.',
    category: 'rh-developer',
    tags: [],
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/podman.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/s2i-build',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 48,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        noDigest: true,
      },
    ],
  },
  {
    organization: 'rh-developer',
    name: 'validate-environment',
    title: 'Validate Environment',
    description:
      'Check and report the status of required tools and environment for rh-developer skills. Validates tool installation (oc, helm, podman, git, skopeo, etc.), cluster connectivity, and permissions. Use this skill before running other deployment skills to ensure prerequisites are met. Triggers on /validate-environment command or when user asks to check their environment setup.',
    category: 'rh-developer',
    tags: [],
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-developer/skills/validate-environment',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'a08010e7b4b1e6a53f5697cad99d0a630e052703',
        daysAgo: 138,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'd31c06f555eb0316c36f1b7db6ec771c11240343',
        daysAgo: 93,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '7a89ffd248042e181a61d2807f86639c49ca98d4',
        daysAgo: 64,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 12,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'cve-impact',
    title: 'CVE Impact',
    description:
      '**CRITICAL**: Use for ALL CVE discovery and listing. DO NOT call get_cves directly. Use when: "show critical CVEs", "CVEs on hostname X", "remediatable vulnerabilities", "impact of CVE-X", risk assessment. NOT for remediation (use `/remediation`). System-level: FIRST reply = pagination prompt (Step -1). Parsing: scripts/01-cve-response-parser.py.',
    category: 'monitoring',
    tags: ['sre', 'cve', 'vulnerability', 'security'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/cve-impact',
    author: 'RHEcosystemAppEng',
    private: true,
    versions: [
      {
        revision: 'main',
        daysAgo: 23,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'cve-validation',
    title: 'CVE Validation',
    description:
      '**CRITICAL**: This skill must be used for CVE validation queries. DO NOT use raw MCP tools like get_cve directly. Validate CVE identifiers and check remediation availability in Red Hat Lightspeed. Use when: - "Is CVE-2024-1234 valid and remediable?" - "Check if CVE-X has automated remediation available" - "Verify these CVEs before creating a playbook" - "Validate CVE list for batch remediation" **DO NOT use this skill when** user requests full remediation - use `/remediation` skill instead: - "Create a remediation playbook for CVE-X" → `/remediation` skill - "Create playbook and execute it" → `/remediation` skill - "Remediate CVE-X" / "Patch CVE-X" → `/remediation` skill This skill orchestrates MCP tools (get_cve) for CVE validation. The `/remediation` skill invokes this skill as Step 2 of its workflow.',
    category: 'validation',
    tags: ['sre', 'cve', 'validation', 'security'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/cve-validation',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 34,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'execution-summary',
    title: 'Execution Summary',
    description:
      'Generates a concise report of agents, skills, tools, and documentation accessed during a workflow for audit and learning purposes. Use when: - "Generate execution summary" - "Create execution report" - "Summarize what was used" - "Show execution summary" - "What agents/skills/tools were used?"',
    category: 'reporting',
    tags: ['sre', 'reporting', 'audit'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/execution-summary',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '13bb916cb3eeac7d6d96482d4567f4d8fb7c2f48',
        daysAgo: 147,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: '456214481b2aaca57f3702b9bf9aa287d4d56fba',
        daysAgo: 106,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'b60a6e22d5ccceed98a708c4fba25854348348b8',
        daysAgo: 83,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 45,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'fleet-inventory',
    title: 'Fleet Inventory',
    description:
      'Query and display Red Hat Lightspeed managed system inventory. This skill focuses on discovery and listing only - for remediation actions, transition to the `/remediation` skill. Use when: - "Show the managed fleet" - "List all systems registered in Lightspeed" - "What systems are affected by CVE-X?" - "How many RHEL 8 systems do we have?" - "Show me production systems" **When NOT to use this skill** (use `/remediation` skill instead): - "Remediate CVE-X on these systems" - "Create a playbook for..." - "Patch system Y" This skill orchestrates MCP tools from lightspeed-mcp for fleet visibility and system inventory management.',
    category: 'monitoring',
    tags: ['sre', 'inventory', 'fleet-management'],
    lifecycle: 'beta',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/fleet-inventory',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 9,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'job-template-creator',
    title: 'Job Template Creator',
    description:
      'Create AAP (Ansible Automation Platform) job templates for executing playbooks. Use when users request: - "Create a job template for this playbook" - "Set up a template to run remediation playbooks" - "Configure AAP to execute this playbook" - "Add a new job template for CVE remediation" This skill guides through adding playbooks to Git projects and creating job templates via AAP Web UI.',
    category: 'automation',
    tags: ['sre', 'ansible', 'automation', 'aap'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/job-template-creator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '2c12d439b9e81bcd51e855f4f3e5bdfedad49f44',
        daysAgo: 61,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 20,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'job-template-remediation-validator',
    title: 'Job Template Remediation Validator',
    description:
      'Verify an AAP job template meets requirements for executing CVE remediation playbooks. Use when: - "Does this job template support remediation playbooks?" - "Validate job template X for CVE remediation" - "Check if template is ready for playbook-executor" - Before playbook-executor selects a template NOT for: AAP MCP connectivity (use `/mcp-aap-validator`), creating templates (use `/job-template-creator`).',
    category: 'validation',
    tags: ['sre', 'validation', 'ansible', 'aap'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/job-template-remediation-validator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 31,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'mcp-aap-validator',
    title: 'MCP AAP Validator',
    description:
      'Validate AAP (Ansible Automation Platform) MCP server connectivity. Use when the user asks to "validate AAP MCP", "check AAP connection", or when other skills need to verify AAP MCP availability before job management or inventory operations.',
    category: 'validation',
    tags: ['sre', 'mcp', 'validation', 'aap'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/mcp-aap-validator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '8ab946eff986624254b41e6e0bd5b0b11d5eb890',
        daysAgo: 76,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 42,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'mcp-lightspeed-validator',
    title: 'MCP Lightspeed Validator',
    description:
      'Validate Red Hat Lightspeed MCP server connectivity. Use when the user asks to "validate Lightspeed MCP", "check Lightspeed connection", or when other skills need to verify lightspeed-mcp availability before CVE operations.',
    category: 'validation',
    tags: ['sre', 'mcp', 'validation', 'lightspeed'],
    lifecycle: 'beta',
    sourceType: SkillSourceType.MLFLOW,
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/mcp-lightspeed-validator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '3fae43f96fe1fb0637a5faddd6036b368d03d501',
        daysAgo: 132,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: '25634e0f58f1b009099942e80465eaac07f43d30',
        daysAgo: 87,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '9cd439989ace932c849c4d8d460d75304025f4dd',
        daysAgo: 58,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'ebfbe7070951a6414ff3dc41edf20bf47c637c46',
        daysAgo: 6,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'playbook-executor',
    title: 'Playbook Executor',
    description:
      '**CRITICAL**: Use for Ansible playbook execution via AAP. DO NOT call AAP MCP tools directly. Execute remediation playbooks with job management, dry-run, and reporting. Use after playbook-generator. Use when: - "Execute the remediation playbook" - "Launch the playbook on AAP" - "Run the CVE remediation job" - "Dry-run the playbook first" **Git Flow**: If template playbook path ≠ generated playbook, perform Git Flow (commit, push, sync) BEFORE launch.',
    category: 'remediation',
    tags: ['sre', 'ansible', 'automation', 'execution'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/playbook-executor',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '0a3573a0f2207f02ef46c9e3e9d065a74e41be6b',
        daysAgo: 129,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '628dc384a8437150321cf30c1e951e9a0f95d36f',
        daysAgo: 91,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'bc6451eb8876fcbfd635d06b74a21dc70fb4f531',
        daysAgo: 46,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 17,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'playbook-generator',
    title: 'Playbook Generator',
    description:
      '**CRITICAL**: This skill ONLY GENERATES playbooks. It does NOT EXECUTE them. For execution, use /playbook-executor skill. Generate production-ready Ansible remediation playbooks for CVE vulnerabilities with Red Hat best practices, error handling, and Kubernetes safety patterns. Use when: - "Generate a remediation playbook for CVE-X" - "Create playbook for these CVEs" - "Get remediation playbook from Lightspeed" This skill calls the MCP tool (remediations__create_vuln_playbook) and returns the playbook **AS IS**. Do NOT modify, enhance, or add to the generated playbook. Any change requires explicit user validation first. **IMPORTANT**: - ALWAYS use this skill instead of calling create_vulnerability_playbook directly - NEVER execute playbooks using ansible-playbook CLI - ALWAYS delegate execution to /playbook-executor skill',
    category: 'remediation',
    tags: ['sre', 'ansible', 'playbook', 'security'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/playbook-generator',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'ea5ec61e893f6e4c7c4c6df7540167e21d9786fc',
        daysAgo: 111,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '27e87f82acf11e27a1466c1131e78dc6c91ed313',
        daysAgo: 73,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 28,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'remediation',
    title: 'Remediation',
    description:
      '**CRITICAL**: Use this skill for ALL CVE remediation workflows. DO NOT use individual skills piecemeal for end-to-end remediation. Use when users request: - CVE remediation playbooks or security patch deployment - Multi-step remediation (validation → context → playbook → execution) - Batch remediation across multiple systems or CVEs - End-to-end CVE management (analysis + remediation + verification) - Prioritizing and remediating CVEs (not just listing them) - Emergency security response with immediate remediation plans DO NOT use for simple queries: - "List critical CVEs" → Use `/cve-impact` skill - "What\'s the CVSS score for CVE-X?" → Use `/cve-impact` or `/cve-validation` - Standalone impact analysis without remediation → Use `/cve-impact` This skill orchestrates 6 specialized skills (cve-impact, cve-validation, system-context, playbook-generator, playbook-executor, remediation-verifier) for complete remediation workflows.',
    category: 'remediation',
    tags: ['sre', 'remediation', 'cve', 'security'],
    lifecycle: 'beta',
    sourceType: SkillSourceType.MLFLOW,
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/remediation',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'df809c8e847f86d09175c965d17ebdd1571756cb',
        daysAgo: 100,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '42695928e1975e20ad2ecd87025a3748a88b1395',
        daysAgo: 77,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        sameContentAs: 1,
      },
      {
        revision: '8603e79566f4e93d4d6cc2b9b341435b29b8a38f',
        daysAgo: 39,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'remediation-verifier',
    title: 'Remediation Verifier',
    description:
      '**CRITICAL**: This skill must be used for remediation verification. DO NOT use raw MCP tools like get_cve or get_host_details directly for verification. Verify CVE remediation success by checking Red Hat Lightspeed CVE status, validating package versions, and confirming service health. Use when: - "Verify CVE remediation was successful" - "Confirm package updates were applied" - "Check if CVE-X is fixed on target systems" - "Validate remediation after playbook execution" This skill orchestrates MCP tools (get_cve, get_cve_systems, get_host_details) for remediation verification. **IMPORTANT**: ALWAYS use this skill instead of calling verification MCP tools directly.',
    category: 'validation',
    tags: ['sre', 'verification', 'cve', 'security'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/ansible.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/remediation-verifier',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'e863ccf46137123abe3adec45ba377cdc72fb5d6',
        daysAgo: 114,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'b38a2c7c85df185f2b096a3f0029ed30cdfd73cf',
        daysAgo: 73,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 50,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-sre',
    name: 'system-context',
    title: 'System Context',
    description:
      '**CRITICAL**: This skill must be used for system inventory and context gathering. DO NOT use raw MCP tools like get_cve_systems or get_host_details directly. Gather system inventory and deployment context for CVE-affected systems, including RHEL version detection, environment classification, and deployment analysis. Use when: - "What systems are affected by CVE-X?" - "Gather system context for remediation planning" - "Analyze deployment architecture for CVE" - "Detect RHEL versions across affected systems" This skill orchestrates MCP tools (get_cve_systems, get_host_details) for system analysis. **IMPORTANT**: ALWAYS use this skill instead of calling get_cve_systems or get_host_details directly for system context gathering.',
    category: 'monitoring',
    tags: ['sre', 'inventory', 'systems', 'rhel'],
    lifecycle: 'beta',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-sre/skills/system-context',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '1eeacf1c43c2070fd4297b953d0dae75e3352422',
        daysAgo: 55,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 14,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DRAFT,
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-clone',
    title: 'VM Clone',
    description:
      'Clone existing virtual machines for testing, scaling, or creating templates. Use when: - "Clone VM [source] to [target]" - "Create a copy of VM [name]" - "Duplicate VM [name] for testing" - "Create 3 copies of template-vm" This skill clones VM configuration and optionally creates new storage or references existing storage. NOT for snapshots (use vm-snapshot for point-in-time backups).',
    category: 'vm-management',
    tags: ['virtualization', 'cloning', 'templates', 'provisioning'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-clone',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 25,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-create',
    title: 'VM Create',
    description:
      'Create new virtual machines in OpenShift Virtualization with automatic instance type resolution and OS selection. Use when: - "Create a new VM" - "Deploy a virtual machine with [OS]" - "Set up a VM in namespace [name]" - "Provision a [size] VM" This skill handles VM creation with intelligent defaults for OpenShift Virtualization. NOT for managing existing VMs (use vm-lifecycle-manager or vm-delete instead).',
    category: 'vm-management',
    tags: ['virtualization', 'provisioning', 'openshift', 'vm-management'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-create',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '866c1d8b4813ef6c104399c66c77f35a9d07aaa6',
        daysAgo: 151,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '09b8a8fa5f37533ec9228f3a714fdcb53b0aa8eb',
        daysAgo: 122,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'cfe855d0ad149bb1ac8e5000d9144fcf737ec11d',
        daysAgo: 70,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 36,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-delete',
    title: 'VM Delete',
    description:
      'Permanently delete virtual machines and their associated resources from OpenShift Virtualization. Use when: - "Delete VM [name]" - "Remove virtual machine [name]" - "Destroy VM [name]" - "Clean up VM [name]" This skill handles permanent VM deletion with strict safety confirmations and typed verification. NOT for power management (use vm-lifecycle-manager to stop VMs).',
    category: 'vm-management',
    tags: ['virtualization', 'cleanup', 'decommission', 'vm-management'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-delete',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'c52d1a79d770b03cdd51ea2b173251950c35b0c5',
        daysAgo: 128,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        noDigest: true,
      },
      {
        revision: '8cfc484ad20003ce46722ea07f94e3f79156fac0',
        daysAgo: 99,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 47,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-inventory',
    title: 'VM Inventory',
    description:
      'List and view virtual machines across namespaces with status, resource usage, and health information. Use when: - "List all VMs" - "Show VMs in namespace [name]" - "What VMs are running?" - "Get details of VM [name]" This skill provides comprehensive VM inventory and status reporting. NOT for creating or modifying VMs (use vm-create or vm-lifecycle-manager instead).',
    category: 'vm-management',
    tags: ['virtualization', 'monitoring', 'reporting', 'inventory'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-inventory',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '8cdb0711b4406e23266c836026f8879889c4bf5b',
        daysAgo: 40,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 11,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-lifecycle-manager',
    title: 'VM Lifecycle Manager',
    description:
      'Manage virtual machine lifecycle operations including start, stop, and restart. Use when: - "Start VM [name]" - "Stop the virtual machine [name]" - "Restart VM [name]" - "Power on/off VM [name]" This skill handles VM state transitions safely with user confirmation for each action. NOT for creating VMs (use vm-create) or deleting VMs (use vm-delete).',
    category: 'vm-management',
    tags: ['virtualization', 'power-management', 'operations', 'lifecycle'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-lifecycle-manager',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 22,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-rebalance',
    title: 'VM Rebalance',
    description:
      'Orchestrate VM migrations across cluster nodes for load balancing, maintenance, and resource optimization. Use when: - "Move VM database-01 to worker-03" - "Rebalance VMs to optimize CPU load" - "Drain worker-02 for maintenance" - "Automatically rebalance the cluster" Supports Manual (user-driven) and Automatic (AI-driven) modes. NOT for creating VMs (use vm-create) or lifecycle only (use vm-lifecycle-manager).',
    category: 'cluster-optimization',
    tags: ['virtualization', 'load-balancing', 'migration', 'optimization'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-rebalance',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '58ecb7025eac0c228b055ec25a28b22c82d053e2',
        daysAgo: 71,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 33,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-snapshot-create',
    title: 'VM Snapshot Create',
    description:
      'Create virtual machine snapshots for backup and recovery. Use when: - "Create a snapshot of VM [name]" - "Backup VM [name] before upgrade" - "Take a snapshot of [vm]" Validates storage class snapshot support, CSI driver capabilities, and guest agent status before snapshot creation. NOT for VM cloning (use vm-clone to create independent copies).',
    category: 'snapshot-management',
    tags: ['virtualization', 'backup', 'snapshots', 'data-protection'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-snapshot-create',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: '37e959dc8b96106dd7530deb3e02934e8a02509a',
        daysAgo: 108,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'c756e2d03e46a5d0d22e204765a09d4b318bce37',
        daysAgo: 67,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
        sameContentAs: 1,
      },
      {
        revision: 'main',
        daysAgo: 44,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-snapshot-delete',
    title: 'VM Snapshot Delete',
    description:
      'Permanently delete virtual machine snapshots to free storage space. Use when: - "Delete snapshot [snapshot-name]" - "Remove old snapshots for VM [name]" - "Free up snapshot storage" Requires user confirmation before deletion. NOT for restoring VMs (use vm-snapshot-restore instead).',
    category: 'snapshot-management',
    tags: ['virtualization', 'cleanup', 'snapshots', 'storage'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-snapshot-delete',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'ec41891433e6a62e440ec458c629b7f4172a60e3',
        daysAgo: 49,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 8,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-snapshot-list',
    title: 'VM Snapshot List',
    description:
      'List virtual machine snapshots across namespaces with status, age, and recovery information. Use when: - "List snapshots for VM [name]" - "Show snapshots in namespace [name]" - "What snapshots exist for [vm]?" Read-only operation - no user confirmation required. NOT for creating/deleting snapshots (use vm-snapshot-create/delete instead).',
    category: 'snapshot-management',
    tags: ['virtualization', 'monitoring', 'snapshots', 'reporting'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-snapshot-list',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'main',
        daysAgo: 19,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
  {
    organization: 'rh-virt',
    name: 'vm-snapshot-restore',
    title: 'VM Snapshot Restore',
    description:
      'Restore virtual machines from snapshots with strict safety confirmations to prevent data loss. Use when: - "Restore VM [name] from snapshot [snapshot-name]" - "Roll back VM [name] to snapshot" - "Recover VM [name] from backup" CRITICAL: Requires VM to be stopped and typed snapshot name confirmation before restore. NOT for creating snapshots (use vm-snapshot-create instead).',
    category: 'snapshot-management',
    tags: ['virtualization', 'recovery', 'snapshots', 'data-protection'],
    lifecycle: 'beta',
    iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/qemu.svg',
    repo: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
    path: 'rh-virt/skills/vm-snapshot-restore',
    author: 'RHEcosystemAppEng',
    versions: [
      {
        revision: 'ad22e0fe4cd9c237eaddf2e427d322d415c4b8e6',
        daysAgo: 145,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
        status: SkillStatus.DELETED,
      },
      {
        revision: 'bb0e55e409336a658829f35bc40d5cf82328979b',
        daysAgo: 116,
        aliases: [],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: '795af225227f3a793282a15fcd9e407f2837f876',
        daysAgo: 64,
        aliases: ['staging'],
        created_by: 'RHEcosystemAppEng',
      },
      {
        revision: 'main',
        daysAgo: 30,
        aliases: ['production'],
        created_by: 'RHEcosystemAppEng',
      },
    ],
  },
];
