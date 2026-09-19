/*
  File bodies below are verbatim shell, Python and YAML from the source repository, so they
  legitimately contain `${...}` sequences. These are DATA inside double-quoted string
  literals, never template interpolation, and the rule that flags them cannot tell the
  difference.
*/
/* eslint-disable no-template-curly-in-string */

/**
 * Real file trees for every seeded skill, read from
 * github.com/RHEcosystemAppEng/agentic-plugins. Paths and sizes are verbatim.
 *
 * WHERE A REGISTRY WOULD GET THIS IS AN OPEN QUESTION, and the prototype surfaces it
 * rather than hiding it. RFC-0008's server never fetches a user-supplied source, so for a
 * git, OCI or ZIP pointer the registry does not obviously know what is in the directory.
 * Two plausible answers, neither yet specified:
 *
 *   1. The registering CLIENT submits a file manifest. It already inspects the content
 *      locally to compute the name and the digest, so the listing is free at that point.
 *   2. The UI asks the provider directly, the same way it links out to it.
 *
 * The 2026-09-01 UX review asked for a file explorer without settling this, and a file
 * explorer that can only ever show one skill in twenty is not reviewable. So the listing
 * is seeded for every skill, and the question goes to the working session.
 *
 * `content` is carried only for the skills modelled as MLflow-STORED, which is the one
 * case where the registry genuinely holds the bytes. For a pointer the UI links each file
 * out to the provider instead of rendering it, per the same review's decision on git.
 */

export interface RegisteredSkillFile {
  /** Path relative to the skill directory. */
  path: string;
  /** Real byte size as reported by the source repository. */
  size: number;
  /** File text. Present only for MLflow-stored skills. */
  content?: string;
}

/** Keyed by `<organization>/<name>`. */
export const REGISTERED_SKILL_FILES = {
  'ocp-admin/cluster-inventory': [
    {
      path: 'SKILL.md',
      size: 10953,
      content:
        '---\nname: cluster-inventory\ndescription: |\n  List and inspect OpenShift clusters across self-managed (OCP, SNO) and managed service (ROSA, ARO, OSD) deployments.\n\n  Returns cluster name, ID, version, status, platform, and creation date.\n\n  Use when:\n  - "List all clusters"\n  - "Show cluster status"\n  - "What clusters are available?"\n  - "Get details of cluster [name]"\n  - "Show cluster events for diagnostics"\n\n  Read-only operations. Does NOT modify clusters.\nlicense: Apache-2.0\nmodel: inherit\ncolor: cyan\nallowed-tools: list_clusters cluster_info cluster_events cluster_logs_download_url\nmetadata:\n  mcp_servers:\n    - openshift-self-managed\n    - openshift-ocm-managed\n  mcp_tools:\n    - list_clusters\n    - cluster_info\n    - cluster_events\n    - cluster_logs_download_url\n  environment_vars:\n    - OFFLINE_TOKEN\n  destructive: false\n  categories:\n    - cluster-management\n    - monitoring\n---\n\n# cluster-inventory\n\n**MCP-First Approach**: This skill uses MCP tools from `openshift-self-managed` and `openshift-ocm-managed` servers. MCP tools have **absolute priority**.\n\n**CLI Tools Policy**:\n- ✅ **ALWAYS use MCP tools** when available\n- ⚠️ **Last resort only**: CLI commands (`oc`, `kubectl`) may be attempted if no MCP alternative exists\n- ⚠️ **Assume unavailable**: CLI tools are likely not installed in the execution environment\n\nList and inspect OpenShift clusters across all types (OCP, SNO, ROSA, ARO, OSD).\n\n## Prerequisites\n\n**Required MCP Servers**: `openshift-self-managed`, `openshift-ocm-managed`\n\n**Required MCP Tools**:\n- `list_clusters` (from both servers) - Lists clusters (auto-routes to correct API)\n- `cluster_info` (from both servers) - Gets cluster details\n- `cluster_events` (from openshift-self-managed only) - Gets events for self-managed clusters\n- `cluster_logs_download_url` (from openshift-self-managed only) - Gets log download URL for diagnostics\n\n**Environment Variables**: `OFFLINE_TOKEN` - Red Hat authentication token\n\n**Verification Steps**:\n1. Verify both MCP servers exist in `mcps.json`\n2. Check `OFFLINE_TOKEN` is set: `test -n "$OFFLINE_TOKEN" && echo "✓" || echo "✗"`\n3. If missing → Stop and report error with setup instructions\n\n**Prerequisite Failure Handling**: If prerequisites fail, report the missing requirement and stop execution.\n\n**Security**: Never display credential values.\n\n## When to Use This Skill\n\nUse when:\n- "List all clusters" / "Show my clusters" / "What clusters do I have?"\n- User wants cluster status or installation progress\n- User needs detailed cluster info (version, config, hosts)\n- User wants to inspect cluster events for troubleshooting\n\n**Cluster Types**: OCP, SNO, ROSA, ARO, OSD (all supported)\n\nDo NOT use when:\n- Create cluster → Use `/cluster-creator` skill\n- Modify cluster → Use cluster management skills\n- Delete cluster → Use cluster deletion skill\n\n---\n\n## Filtering Capabilities\n\n**Optional Filters** (apply when user requests):\n- `cluster_type`: Filter by type - "all" (default), "self-managed", "managed", "rosa", "aro", "osd", "ocp", "sno"\n- `status_filter`: Filter by status - "all" (default), "ready", "installed", "installing", "error", "pending-for-input"\n- `name_search`: Partial match on cluster name (case-insensitive)\n\n**Examples**:\n- "List only ROSA clusters" → cluster_type="rosa"\n- "Show clusters in error state" → status_filter="error"\n- "Find clusters with \'prod\' in name" → name_search="prod"\n\n**Query Strategy**: ALWAYS query BOTH MCP servers by default unless user explicitly filters by cluster type.\n\n**Performance Guidance**:\n- **>20 clusters**: Display summary only, ask user before fetching detailed info for all\n- **Parallel calls**: When fetching cluster_info for multiple clusters, limit to 5 concurrent calls\n- **Large accounts**: Consider filtering by type or status to reduce output\n\n## Output Formatting\n\n**Summary Header** (always first):\n```\n📊 Found X cluster(s): Y installed ✅, Z installing ⏳, ...\n```\n\n**Single cluster (1)**: Detailed bullet list with all fields:\n```\n**Cluster: cluster-name**\n- ID: full-uuid\n- Status: ✅ ready\n- Type: ROSA\n- Version: 4.21.5\n- Provider: AWS\n- Region: us-east-1\n```\n\n**Multiple clusters (≥2)**: Table format with full cluster IDs:\n```\n| Name | ID | Status | Type | Version | Provider | Region |\n|------|----|-----------------------|------|---------|----------|--------|\n| name | full-uuid | ✅ ready | ROSA | 4.21.5 | AWS | us-east-1 |\n```\n\n**Status Icons**: ✅ ready/installed, ⏳ installing, ⚠️ pending-for-input, ❌ error\n\n**Cluster Type Detection**:\n- OCM clusters: Check `cloud_provider.id` → aws=ROSA, azure=ARO, gcp=OSD\n- Self-managed: Check `platform` → none+single_node=SNO, else=OCP\n\n**Sorting**: Sort by type (OCP→ROSA→ARO→OSD→SNO), then by creation date (newest first)\n\n## Workflow\n\n### Step 1: List All Clusters\n\n**MCP Tools**: Call BOTH in parallel (unless user explicitly filters by type)\n- `list_clusters` (from `openshift-self-managed`) → Gets OCP, SNO clusters\n- `list_clusters` (from `openshift-ocm-managed`) → Gets ROSA, ARO, OSD clusters\n\n**Parameters**: None (MCP tools have no parameters)\n\n**Apply Filters** (post-processing after fetching results):\n- If user specified `cluster_type`: Filter results to matching types\n- If user specified `status_filter`: Filter results to matching statuses\n- If user specified `name_search`: Filter results containing search string (case-insensitive)\n\n**Expected Output**: Combined list with name, ID, version, status, platform, creation date\n\n**Merge & Display**:\n1. Merge results from both APIs\n2. Detect cluster type (see Output Formatting section)\n3. Sort by type (OCP→ROSA→ARO→OSD→SNO), then date (newest first)\n4. Display with summary header + list/table format\n\n**Error Handling**:\n- Both APIs fail → Verify OFFLINE_TOKEN and connectivity\n- One API fails → Show partial results with note\n- No clusters → Report "No clusters found"\n\n### Step 2: Get Detailed Cluster Information (Optional)\n\nExecute when user requests details for specific cluster.\n\n**MCP Tool**: `cluster_info` (from correct server based on cluster source)\n**Parameters**: `cluster_id` - UUID from list_clusters\n\n**Server Selection**: Use cluster\'s `source` field from Step 1:\n- `source: "ocm"` → Call via `openshift-ocm-managed`\n- `source: "assisted-installer"` → Call via `openshift-self-managed`\n\n**Expected Output**: Cluster details (ID, version, status, network config, hosts/nodes)\n\n**Error Handling**:\n- Cluster not found → Verify cluster exists\n- Wrong MCP instance → Try other instance\n- Permission denied → User lacks access\n\n### Step 3: Get Diagnostics (Optional - Self-Managed Only)\n\n**NOTE**: Only for OCP/SNO clusters. ROSA/ARO/OSD use cloud provider consoles for events and logs.\n\nExecute when user requests events, troubleshoots errors, or needs installation logs.\n\n#### 3a. Get Cluster Events\n\n**MCP Tool**: `cluster_events` (from `openshift-self-managed`)\n**Parameters**: `cluster_id` - UUID of self-managed cluster\n\n**Expected Output**: Chronological events with timestamps, severity, messages\n\n**When to use**:\n- Diagnosing installation failures\n- Understanding cluster state transitions\n- Investigating validation errors\n\n**Error Handling**:\n- Cluster not found → Verify exists\n- No events → Report no history yet\n- Permission denied → User lacks access\n\n#### 3b. Get Cluster Logs\n\n**MCP Tool**: `cluster_logs_download_url` (from `openshift-self-managed`)\n**Parameters**: `cluster_id` - UUID of self-managed cluster\n\n**Expected Output**: Presigned download URL for logs bundle (installation, validation, host discovery, diagnostics)\n\n**When to use**:\n- Cluster status is "error"\n- Events don\'t provide enough detail\n- Deep troubleshooting needed\n\n**Error Handling**:\n- Cluster not found → Verify exists\n- Logs unavailable → Too early in lifecycle\n- URL generation fails → Cluster not ready\n\n## Dependencies\n\n### Required MCP Servers\n- `openshift-self-managed` - Assisted Installer service for OCP/SNO\n- `openshift-ocm-managed` - OCM service for ROSA/ARO/OSD\n\n### Required MCP Tools\n- `list_clusters` (from both servers) - Lists clusters (auto-routes to correct API)\n- `cluster_info` (from both servers) - Gets cluster details (auto-routes to correct API)\n- `cluster_events` (from openshift-self-managed only) - Gets events for self-managed clusters\n- `cluster_logs_download_url` (from openshift-self-managed only) - Gets log download URL\n\n### Related Skills\n- `/cluster-creator` - Create new clusters\n- Future: cluster-installer, cluster-deletion\n\n### Reference Documentation\n- [troubleshooting.md](docs/troubleshooting.md) - Cluster status and error diagnosis\n- [PVC Capacity Planning](docs/pvc-capacity-planning.md) - Consult when cluster storage details show high PVC usage or approaching capacity\n- [Database Connection Management](docs/database-connection-management.md) - Consult when cluster workloads include PostgreSQL with high connection usage\n- **[Documentation Index](docs/INDEX.md)** - Complete guide to all ocp-admin documentation (consult for topics not explicitly referenced above)\n\n## Example Usage\n\n### Example 1: List All Clusters\n\n**User**: "List all my OpenShift clusters"\n\n**Output**:\n```\n📊 Found 5 cluster(s): 3 ready ✅, 1 installing ⏳, 1 pending ⚠️\n\n| Name | ID | Status | Type | Version | Provider | Region |\n|------|----|--------|------|---------|----------|--------|\n| prod-ocp | 762df996-acba-4a42-9fe9-edb0a8ec8bee | ⏳ installing | OCP | 4.21.0 | Baremetal | - |\n| dev-ocp | a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7 | ✅ ready | OCP | 4.20.5 | vSphere | - |\n| rosa-prod | 2o2gevtk4bohdu41ff4jps0dl8rrshb6 | ✅ ready | ROSA | 4.21.0 | AWS | us-east-1 |\n| aro-dev | 20ekbvg1jkaqssc47mmc0irlvhf59c0p | ✅ ready | ARO | 4.20.0 | Azure | - |\n| edge-01 | 8e5d3e45-77c6-440b-9cfa-9f88187535c6 | ⚠️ pending-for-input | SNO | 4.21.0 | Self-managed | - |\n```\n\n### Example 2: List Single Cluster\n\n**User**: "Show me my edge cluster"\n\n**Output**:\n```\n📊 Found 1 cluster\n\n**Cluster: edge-01**\n- ID: 8e5d3e45-77c6-440b-9cfa-9f88187535c6\n- Status: ⚠️ pending-for-input\n- Type: SNO\n- Version: 4.21.0\n- Provider: Self-managed\n- Region: -\n```\n\n### Example 3: Filter by Type\n\n**User**: "List only ROSA clusters"\n\n**Output**:\n```\n📊 Found 2 ROSA cluster(s): 2 ready ✅\n\n| Name | ID | Status | Type | Version | Provider | Region |\n|------|----|--------|------|---------|----------|--------|\n| rosa-prod | 2o2gevtk4bohdu41ff4jps0dl8rrshb6 | ✅ ready | ROSA | 4.21.0 | AWS | us-east-1 |\n| rosa-dev | 2nm4er0dk4a8lcs23foq6ug50v4onsvs | ✅ ready | ROSA | 4.20.8 | AWS | us-west-2 |\n```\n\n### Example 4: Get Cluster Details\n\n**User**: "Show me details for prod-ocp"\n\n**Output**:\n```\n**Cluster Details: prod-ocp**\n- ID: 762df996-acba-4a42-9fe9-edb0a8ec8bee\n- Version: 4.21.0\n- Status: Installing (45% complete)\n- Platform: Baremetal\n- Hosts: 3/3 ready\n- Network: API VIP configured, Ingress VIP configured\n```\n',
    },
    {
      path: 'catalog-info.yaml',
      size: 1066,
      content:
        'apiVersion: backstage.io/v1alpha1\nkind: AiResource\nmetadata:\n  name: cluster-inventory\n  namespace: ai5-marketplace\n  title: OpenShift Cluster Inventory\n  description: >\n    List and inspect OpenShift clusters across self-managed (OCP, SNO)\n    and managed service (ROSA, ARO, OSD) deployments.\n    Read-only operations. Does NOT modify clusters.\n  labels:\n    distribution: external\n  annotations:\n    backstage.io/source-location: >-\n      url:https://github.com/RHEcosystemAppEng/agentic-plugins/blob/main/ocp-admin/skills/cluster-inventory/SKILL.md\n\n  tags:\n    - ai-skill\n    - openshift\n    - cluster-management\n    - inventory\n    - monitoring\n  links:\n    - url: https://github.com/RHEcosystemAppEng/agentic-plugins\n      title: Source Repository\n      icon: github\nspec:\n  type: skill\n  lifecycle: beta\n  owner: group:redhat/ai5-marketplace\n  disciplines:\n    - devops\n    - infrastructure\n  categories:\n    - monitoring\n    - inventory\n  agents: []\n  dependsOn:\n    - airesource:ai5-marketplace/ocp-admin\n    - mcpserver:ai5-marketplace/assisted-installer\n',
    },
    {
      path: 'docs/INDEX.md',
      size: 35,
      content: '../../cluster-creator/docs/INDEX.md',
    },
    {
      path: 'docs/backup-restore.md',
      size: 44,
      content: '../../cluster-creator/docs/backup-restore.md',
    },
    {
      path: 'docs/certificate-rotation.md',
      size: 50,
      content: '../../cluster-creator/docs/certificate-rotation.md',
    },
    {
      path: 'docs/credentials-management.md',
      size: 52,
      content: '../../cluster-creator/docs/credentials-management.md',
    },
    {
      path: 'docs/database-connection-management.md',
      size: 60,
      content: '../../cluster-creator/docs/database-connection-management.md',
    },
    {
      path: 'docs/day-2-operations.md',
      size: 46,
      content: '../../cluster-creator/docs/day-2-operations.md',
    },
    {
      path: 'docs/etcd-maintenance.md',
      size: 46,
      content: '../../cluster-creator/docs/etcd-maintenance.md',
    },
    {
      path: 'docs/examples.md',
      size: 38,
      content: '../../cluster-creator/docs/examples.md',
    },
    {
      path: 'docs/host-requirements.md',
      size: 47,
      content: '../../cluster-creator/docs/host-requirements.md',
    },
    {
      path: 'docs/idp.md',
      size: 33,
      content: '../../cluster-creator/docs/idp.md',
    },
    {
      path: 'docs/input-validation-guide.md',
      size: 52,
      content: '../../cluster-creator/docs/input-validation-guide.md',
    },
    {
      path: 'docs/multi-cluster-auth.md',
      size: 47,
      content: '../../cluster-report/docs/multi-cluster-auth.md',
    },
    {
      path: 'docs/networking.md',
      size: 40,
      content: '../../cluster-creator/docs/networking.md',
    },
    {
      path: 'docs/platforms.md',
      size: 39,
      content: '../../cluster-creator/docs/platforms.md',
    },
    {
      path: 'docs/providers.md',
      size: 39,
      content: '../../cluster-creator/docs/providers.md',
    },
    {
      path: 'docs/pvc-capacity-planning.md',
      size: 51,
      content: '../../cluster-creator/docs/pvc-capacity-planning.md',
    },
    {
      path: 'docs/quick-reference.md',
      size: 45,
      content: '../../cluster-creator/docs/quick-reference.md',
    },
    {
      path: 'docs/rbac.md',
      size: 34,
      content: '../../cluster-creator/docs/rbac.md',
    },
    {
      path: 'docs/security-checklist.md',
      size: 48,
      content: '../../cluster-creator/docs/security-checklist.md',
    },
    {
      path: 'docs/static-networking-guide.md',
      size: 53,
      content: '../../cluster-creator/docs/static-networking-guide.md',
    },
    {
      path: 'docs/storage.md',
      size: 37,
      content: '../../cluster-creator/docs/storage.md',
    },
    {
      path: 'docs/troubleshooting.md',
      size: 45,
      content: '../../cluster-creator/docs/troubleshooting.md',
    },
  ],
  'rh-sre/mcp-lightspeed-validator': [
    {
      path: 'SKILL.md',
      size: 2552,
      content:
        '---\nname: mcp-lightspeed-validator\ndescription: |\n  Validate Red Hat Lightspeed MCP server connectivity. Use when the user asks to "validate Lightspeed MCP", "check Lightspeed connection", or when other skills need to verify lightspeed-mcp availability before CVE operations.\nmodel: haiku\ncolor: yellow\nlicense: Apache-2.0\nallowed-tools: get_mcp_version\n---\n\n# MCP Lightspeed Validator\n\nValidates connectivity to the Red Hat Lightspeed MCP server by calling `get_mcp_version`.\n\n## When to Use This Skill\n\nUse when validating Lightspeed MCP before CVE operations, troubleshooting connection issues, or when other skills (e.g. remediation) need to verify availability. Do NOT use for actual CVE queries—use cve-impact or cve-validation.\n\n## Workflow\n\n1. **Test connectivity**: Call `get_mcp_version` with **no parameters**.\n2. **If it fails**: Provide a comprehensive message with possible root causes (see below).\n3. **Report**: Output a table with validated servers and outcome (emojis).\n\n## Failure Message (Root Causes)\n\nWhen the tool call fails, include:\n\n```\n❌ Lightspeed MCP connection failed\n\n**Possible root causes:**\n- **Credentials**: LIGHTSPEED_CLIENT_ID or LIGHTSPEED_CLIENT_SECRET not set or invalid\n- **Expired credentials**: Red Hat Console tokens may have expired\n- **Server not running**: MCP server/container may be stopped\n- **Network**: Firewall or proxy blocking console.redhat.com\n- **Configuration**: mcps.json misconfigured or server not registered\n\n**Troubleshooting:**\n1. Verify env vars: LIGHTSPEED_CLIENT_ID, LIGHTSPEED_CLIENT_SECRET (never echo values)\n2. Check credentials at: https://console.redhat.com/settings/integrations\n3. Restart MCP server or host after config changes\n4. Check container logs if using podman/docker\n```\n\n## Report Format\n\nAlways end with a table:\n\n| Server | Outcome |\n|--------|---------|\n| lightspeed-mcp | ✅ PASSED |\n| lightspeed-mcp | ❌ FAILED |\n\nUse ✅ for success, ❌ for failure, ⚠️ for partial (e.g. connected but error on tool).\n\n## Dependencies\n\n### Required MCP Servers\n- `lightspeed-mcp` - Red Hat Lightspeed vulnerability and inventory data\n\n### Required MCP Tools\n- `get_mcp_version` (from lightspeed-mcp gateway) - Connectivity test\n\n### Related Skills\n- `/remediation` - Requires Lightspeed MCP validation before CVE operations\n- `/cve-validation`, `/cve-impact`, `/fleet-inventory` - All require Lightspeed MCP\n\n### Reference Documentation\n- [Red Hat Lightspeed Documentation Overview](docs/insights/README.md) - Lightspeed setup, CVE assessment, vulnerability logic\n',
    },
    {
      path: 'catalog-info.yaml',
      size: 1047,
      content:
        'apiVersion: backstage.io/v1alpha1\nkind: AiResource\nmetadata:\n  name: mcp-lightspeed-validator\n  namespace: ai5-marketplace\n  title: MCP Lightspeed Validator\n  description: >\n    Validate Red Hat Lightspeed MCP server connectivity. Verifies lightspeed-mcp\n    availability by calling get_mcp_version before CVE operations.\n  labels:\n    distribution: external\n  annotations:\n    backstage.io/source-location: >-\n      url:https://github.com/RHEcosystemAppEng/agentic-plugins/blob/main/rh-sre/skills/mcp-lightspeed-validator/SKILL.md\n  tags:\n    - ai-skill\n    - sre\n    - mcp\n    - validation\n    - lightspeed\n  links:\n    - url: https://github.com/RHEcosystemAppEng/agentic-plugins\n      title: Source Repository\n      icon: github\nspec:\n  type: skill\n  lifecycle: beta\n  owner: group:redhat/ai5-marketplace\n  disciplines:\n    - devops\n  categories:\n    - validation\n  agents: []\n  dependsOn:\n    - airesource:ai5-marketplace/rh-sre\n    - mcpserver:redhat/red-hat-lightspeed-mcp-server\n  dependencyOf:\n    - airesource:ai5-marketplace/remediation\n',
    },
    {
      path: 'docs/SOURCES.md',
      size: 24,
      content: '../../../docs/SOURCES.md',
    },
    {
      path: 'docs/ansible/aap-integration.md',
      size: 58,
      content: '../../../mcp-aap-validator/docs/ansible/aap-integration.md',
    },
    {
      path: 'docs/ansible/cve-remediation-templates.md',
      size: 69,
      content: '../../../playbook-generator/docs/ansible/cve-remediation-templates.md',
    },
    {
      path: 'docs/ansible/error-handling.md',
      size: 57,
      content: '../../../mcp-aap-validator/docs/ansible/error-handling.md',
    },
    {
      path: 'docs/ansible/idempotency.md',
      size: 54,
      content: '../../../mcp-aap-validator/docs/ansible/idempotency.md',
    },
    {
      path: 'docs/insights/README.md',
      size: 1453,
      content:
        '---\ntitle: Red Hat Lightspeed Documentation Overview\ncategory: insights\nlast_updated: 2026-01-20\n---\n\n# Red Hat Lightspeed Documentation Overview\n\nThis directory contains Red Hat Lightspeed-specific guidance for CVE vulnerability assessment and remediation planning.\n\n## Available Documentation\n\n### Current Documentation\n- **[vulnerability-logic.md](vulnerability-logic.md)** - How Red Hat Lightspeed assesses CVE risk\n  - CVE identification and classification (Vulnerable vs Affected)\n  - Security Rules designation\n  - Red Hat severity ratings (Critical/Important/Moderate/Low)\n  - Risk assessment and prioritization methodology\n  - Priority decision matrix\n  - Integration with remediation workflows\n\n### Future Enhancements (P2 Priority)\n- **remediation-workflow.md** - End-to-end remediation process (planned)\n- **system-inventory.md** - Inventory management patterns (planned)\n\n## When to Use These Docs\n\n**Use vulnerability-logic.md when**:\n- Performing CVE impact analysis\n- Need to understand Red Hat severity ratings\n- Prioritizing CVEs for remediation\n- Explaining risk assessments to management\n\n## Quick Links\n\n- Red Hat Lightspeed: https://docs.redhat.com/en/documentation/red_hat_insights/1-latest\n- CVE Assessment Guide: https://docs.redhat.com/en/documentation/red_hat_insights/1-latest/html/assessing_and_monitoring_security_vulnerabilities_on_rhel_systems/vuln-cves_vuln-overview\n- Source attribution: [../SOURCES.md](../SOURCES.md)\n',
    },
    {
      path: 'docs/insights/vulnerability-logic.md',
      size: 60,
      content: '../../../cve-validation/docs/insights/vulnerability-logic.md',
    },
    {
      path: 'docs/references/compliance-frameworks.md',
      size: 67,
      content: '../../../mcp-aap-validator/docs/references/compliance-frameworks.md',
    },
    {
      path: 'docs/references/cvss-scoring.md',
      size: 55,
      content: '../../../cve-validation/docs/references/cvss-scoring.md',
    },
    {
      path: 'docs/rhel/package-management.md',
      size: 59,
      content: '../../../playbook-generator/docs/rhel/package-management.md',
    },
    {
      path: 'docs/rhel/selinux-context.md',
      size: 55,
      content: '../../../mcp-aap-validator/docs/rhel/selinux-context.md',
    },
    {
      path: 'docs/rhel/systemd-services.md',
      size: 56,
      content: '../../../mcp-aap-validator/docs/rhel/systemd-services.md',
    },
    {
      path: 'docs/rhel/version-compatibility.md',
      size: 61,
      content: '../../../mcp-aap-validator/docs/rhel/version-compatibility.md',
    },
  ],
  'rh-sre/remediation': [
    {
      path: 'SKILL.md',
      size: 15193,
      content:
        '---\nname: remediation\ndescription: |\n  **CRITICAL**: Use this skill for ALL CVE remediation workflows. DO NOT use individual skills piecemeal for end-to-end remediation.\n\n  Use when users request:\n  - CVE remediation playbooks or security patch deployment\n  - Multi-step remediation (validation → context → playbook → execution)\n  - Batch remediation across multiple systems or CVEs\n  - End-to-end CVE management (analysis + remediation + verification)\n  - Prioritizing and remediating CVEs (not just listing them)\n  - Emergency security response with immediate remediation plans\n\n  DO NOT use for simple queries:\n  - "List critical CVEs" → Use `/cve-impact` skill\n  - "What\'s the CVSS score for CVE-X?" → Use `/cve-impact` or `/cve-validation`\n  - Standalone impact analysis without remediation → Use `/cve-impact`\n\n  This skill orchestrates 6 specialized skills (cve-impact, cve-validation, system-context, playbook-generator, playbook-executor, remediation-verifier) for complete remediation workflows.\nmodel: inherit\ncolor: red\nmetadata:\n  author: "Red Hat Ecosystem Engineering"\n  priority: "high"\nlicense: Apache-2.0\nallowed-tools: vulnerability__get_cves vulnerability__get_cve vulnerability__get_cve_systems vulnerability__get_system_cves inventory__find_host_by_name inventory__get_host_details remediations__create_vuln_playbook job_templates_list job_templates_retrieve projects_list job_templates_launch_retrieve jobs_retrieve jobs_stdout_retrieve jobs_job_events_list jobs_job_host_summaries_list jobs_relaunch_retrieve inventories_list hosts_list\n---\n\n# Remediation Skill\n\nEnd-to-end CVE remediation workflow. Orchestrates specialized skills for validation, context gathering, playbook generation, execution, and verification.\n\n## Prerequisites\n\n**Required MCP Servers**: `lightspeed-mcp` (CVE data, playbook generation), `aap-mcp-job-management`, `aap-mcp-inventory-management` (execution)\n\n**Related Skills** (this skill invokes them):\n- `/mcp-lightspeed-validator` - Verify Lightspeed MCP before CVE operations\n- `/mcp-aap-validator` - Verify AAP MCP before playbook execution\n- `/cve-impact` - CVE risk assessment\n- `/cve-validation` - CVE validation and remediation availability\n- `/system-context` - System inventory and deployment context\n- `/playbook-generator` - Ansible playbook generation\n- `/playbook-executor` - Playbook execution via AAP\n- `/remediation-verifier` - Post-remediation verification\n\n**Verification**: See Step 0 for MCP validation. Execute `/mcp-aap-validator` before Step 5 (playbook execution) if not already validated.\n\n## When to Use This Skill\n\n**Use this skill when**:\n- User requests CVE remediation (playbook creation, patching, deployment)\n- Full workflow needed: analysis → validation → playbook → execution → verification\n- Batch remediation across multiple CVEs or systems\n\n**Do NOT use when**:\n- User only wants CVE listing or impact analysis → Use `/cve-impact`\n- User only wants CVE validation → Use `/cve-validation`\n- User only wants playbook generation (no execution) → Use `/playbook-generator` directly\n\n## Workflow\n\nExecute skills in this order. **MANDATORY**: Use actual Skill tool invocations, NOT text pretending to invoke skills. **Each step must complete before the next begins**—do not start Step N+1 until Step N has returned its result.\n\n### Upfront: Planned Tasks (Before Step 0)\n\n**When**: Before executing any step. **Do NOT start Step 0 until the user validates the plan.**\n\n**Action**: Present the planned task list using **Part A** of [references/01-remediation-plan-template.md](references/01-remediation-plan-template.md). Show the 7 tasks (validate MCP → impact → validate CVE → context → playbook → execute → verify) and ask "Proceed with this plan?"\n\n**Task list ordering** (CRITICAL): If using TodoWrite or task list UI, create tasks **in workflow order** (Step 0, 1, 2, 3, 4, 5, 6). Do NOT create in completion order or random order—display order must match execution order.\n\n**Wait for explicit user response** ("yes" or "proceed") before invoking Step 0. If "abort" → stop.\n\n### Step 0: Validate MCP Prerequisites\n\n**Action**: Execute `/mcp-lightspeed-validator` (and `/mcp-aap-validator` before Step 5 if executing playbooks)\n\n**When**: Before any CVE or remediation operations. Can skip if already validated this session.\n\n**Sequencing (MANDATORY)**: Invoke validators **one at a time**. **Do NOT proceed to Step 1 until Step 0 is complete.** Wait for each validator to return explicit results (PASSED / FAILED / PARTIAL) before moving on. "Successfully loaded skill" alone does NOT mean validation completed—you must see the actual validation outcome.\n\n**Invocation**: Use the Skill tool for ALL sub-skill invocations (validators, cve-validation, cve-impact, system-context, playbook-generator, playbook-executor, remediation-verifier). **Do NOT use "Task Output" with the skill name as task ID**—that causes "No task found" errors (e.g. "No task found with ID: cve-validation"). See [skill-invocation.md](docs/references/skill-invocation.md).\n\n**Handle result**: If validation fails, stop and provide setup instructions. If passed, proceed to Step 1. **If any skill invocation fails** (e.g. "No task found with ID: ..."): Proceed with a warning—do not block. Later steps will surface real errors if MCP is unavailable.\n\n### Step 1: Impact Analysis (If Requested or Needed)\n\n**Action**: Execute the `/cve-impact` skill\n\n**Invoke**:\n```\n"Analyze CVE-XXXX-YYYY and assess its impact on affected systems"\n```\n\n**Expected**: Risk assessment, affected systems list, CVSS interpretation. Integrate into remediation planning. If user only wanted impact analysis, provide assessment and offer remediation options.\n\n### Step 2: Validate CVE (Remediatable Gate)\n\n**Action**: Execute the `/cve-validation` skill\n\n**Invoke**:\n```\n"Validate CVE-XXXX-YYYY format, existence, and remediation availability"\n```\n\n**Expected**: Validation status including `remediation_status.automated_remediation_available` or `validation_status`.\n\n**Remediatable Gate** (MANDATORY): Trust cve-validation skill output. Do NOT re-interpret raw get_cve response—cve-validation uses advisory_available, remediation, advisories_list (not rules[]). See [references/01-remediation-indicators.md](references/01-remediation-indicators.md).\n- **If remediatable** (`remediation_available: true` or `validation_status: "valid"`): Proceed to Step 3.\n- **If NOT remediatable** (`remediation_available: false` or `validation_status: "not_remediable"`):\n  1. Explain: "CVE-XXXX-YYYY has no automated remediation in Red Hat Lightspeed. Execution may have no effect."\n  2. Suggest alternatives: manual patching, check Red Hat errata.\n  3. Offer: "Continue anyway? (yes/no)"\n  4. **If user says "yes"**: Proceed to Step 3 with warning: "⚠️ Proceeding despite no automated remediation—playbook generation or execution may have no effect."\n  5. **If user says "no"**: Stop. Do not proceed to Steps 3–5.\n\n**Batch**: For multiple CVEs, validate each. Proceed only with remediatable CVEs unless user explicitly confirms to include non-remediatable ones (with same warning).\n\n### Step 3: Gather Context\n\n**Action**: Execute the `/system-context` skill\n\n**Invoke**:\n```\n"Gather system context for CVE-XXXX-YYYY: identify affected systems, RHEL versions, and deployment environments"\n```\n\n**Expected**: Context summary with remediation strategy. Use to inform playbook generation and execution planning.\n\n### Step 4: Generate Playbook\n\n**Action**: Execute the `/playbook-generator` skill\n\n**CRITICAL**: You MUST invoke `/playbook-generator`, NOT generate playbook text yourself.\n\n**Invoke**:\n```\n"Generate an Ansible remediation playbook for CVE-XXXX-YYYY targeting systems [list of system UUIDs]. Apply Red Hat best practices and RHEL-specific patterns from documentation."\n```\n\n**Expected**: Ansible playbook from Red Hat Lightspeed (returned AS IS by playbook-generator—no modifications). Present to user. **The playbook-generator ONLY GENERATES**—it does NOT execute. After presenting the playbook, present the Remediation Plan for user validation (see below).\n\n### Remediation Plan (User Validation) — MANDATORY before Step 5\n\n**When**: After Step 4 completes. **Do NOT proceed to Step 5 until the user validates the plan.**\n\n**Action**: Present the plan using the Summary + Table + Checklist format. **Read [references/01-remediation-plan-template.md](references/01-remediation-plan-template.md)** for the exact template.\n\n**Format**:\n1. **Summary** — 1–2 sentences: what will happen and why\n2. **Table** — CVE | Target Systems | Key Action\n3. **Checklist** — Ordered steps (mark completed as "— done")\n4. **Confirm prompt** — "yes"/"proceed", "dry-run only", or "abort"\n\n**Wait for explicit user response.** If "yes" or "proceed" → invoke playbook-executor. If "abort" → stop. If "dry-run only" → invoke playbook-executor with instruction to run dry-run only and stop.\n\n### Step 5: Execute Playbook (With User Confirmation)\n\n**Prerequisite**: Remediation Plan must be presented and user must have responded "yes" or "proceed" (or "dry-run only"). Do NOT invoke playbook-executor until plan validation is complete.\n\n**CRITICAL**: Before execution, you MUST:\n1. Have presented the Remediation Plan (summary + table + checklist)\n2. Have received user confirmation ("yes", "proceed", or "dry-run only")\n3. Show playbook preview and key tasks when invoking playbook-executor\n4. Recommend dry-run first; wait for explicit approval before actual execution\n\n**Action**: Execute the `/playbook-executor` skill\n\n**Invoke** (pass playbook metadata from playbook-generator and system-context):\n```\n"Execute the generated playbook for CVE-XXXX-YYYY. Playbook file: [filename from playbook-generator]. Content: [in context from playbook-generator output]. Target systems: [list of system UUIDs from system-context]. Start with dry-run (check mode) if user requested it. Monitor job status until completion and report results."\n```\n\n**Git Flow path**: When playbook-executor performs Git Flow (write playbook to repo), it MUST use the absolute path for the Write tool: `<user_provided_repo_path>/playbooks/remediation/<filename>`. Never use a relative path like `test-aap-project/playbooks/...`—that causes "Error writing file" when the repo is outside the workspace.\n\n**Expected**: playbook-executor validates AAP, matches templates, offers dry-run, executes on approval, streams progress, generates report. **Validates job log for CVE handling**—confirms from stdout that the playbook addressed the target CVE(s); reports ✓ confirmation or ⚠️ warning if no evidence found. After success, suggest verification with `/remediation-verifier`.\n\n### Step 6: Verify Deployment (Optional)\n\n**Action**: Execute the `/remediation-verifier` skill (if user requests verification)\n\n**Invoke**:\n```\n"Verify remediation success for CVE-XXXX-YYYY on systems [list of system UUIDs]. Check CVE status, package versions, and service health."\n```\n\n**Expected**: Verification report with pass/fail. Present results to user.\n\n## Dependencies\n\n### Required MCP Tools\n- None (orchestration skill—delegates to other skills that use MCP tools)\n\n### Required MCP Servers\n- `lightspeed-mcp` - CVE data, playbook generation\n- `aap-mcp-job-management` - Job launch and monitoring\n- `aap-mcp-inventory-management` - Inventory for execution\n\n### Related Skills\n- `cve-impact` - Step 1\n- `cve-validation` - Step 2\n- `system-context` - Step 3\n- `playbook-generator` - Step 4\n- `playbook-executor` - Step 5\n- `remediation-verifier` - Step 6\n\n### Reference Documentation\n- [references/01-remediation-plan-template.md](references/01-remediation-plan-template.md) - Plan format for user validation\n- [lightspeed-mcp-tool-failures.md](docs/references/lightspeed-mcp-tool-failures.md) - Backend errors (e.g. explain_cves), user-friendly message, workarounds\n- [cve-remediation-templates.md](docs/ansible/cve-remediation-templates.md)\n- [package-management.md](docs/rhel/package-management.md)\n\n## Critical: Human-in-the-Loop Requirements\n\nThis skill requires explicit user confirmation at:\n\n1. **Upfront Planned Tasks** (before Step 0)\n   - Present the 7-task plan. Wait for "yes" or "proceed" before starting any step.\n   - Do NOT invoke validators or other skills until the user confirms.\n\n2. **Remediation Plan Validation** (before Step 5)\n   - Present the plan: Summary + Table + Checklist\n   - Wait for user response: "yes"/"proceed", "dry-run only", or "abort"\n   - Do NOT invoke playbook-executor until the user validates the plan\n\n3. **Before Playbook Execution (Step 5)**\n   - Display playbook preview and key tasks\n   - Recommend dry-run first; wait for explicit approval before actual execution\n\n4. **Before Destructive Actions**\n   - Offer dry-run (check mode) before actual execution\n   - If dry-run approved, run first and show results\n   - Only proceed to actual execution after user confirms\n\n**Never assume approval**—always wait for explicit user confirmation before execution.\n\n## MCP Tool Usage\n\n**vulnerability__explain_cves**: Requires a valid `system_uuid` from inventory. Do NOT call it unless you have the resolved UUID from Step 3 (system-context) or Step 1 (cve-impact). Never pass `system_uuid: "undefined"` or placeholder values—this causes validation errors. For remediation availability at Step 2, use `get_cve` via cve-validation only.\n\n**Lightspeed tool failures**: If a tool fails with a cryptic backend error (e.g. `\'dnf_modules\'`), do NOT retry or expose the raw error. Use workarounds from [lightspeed-mcp-tool-failures.md](docs/references/lightspeed-mcp-tool-failures.md).\n\n## Error Handling\n\n- **Invalid CVE**: "CVE-XXXX-YYYY is not valid or doesn\'t exist. Please verify the CVE ID."\n- **No Remediation Available**: "CVE-XXXX-YYYY doesn\'t have an automated remediation playbook. Manual patching required."\n- **System Not Found**: "System XXXX is not in the Lightspeed inventory. Please ensure it\'s registered."\n- **Batch Partial Failure**: "Successfully processed X of Y CVEs. Failed: [list]. Reason: [explanations]"\n- **Lightspeed tool failures** (e.g. explain_cves `\'dnf_modules\'`): Do NOT show raw error. Use user-friendly message and workaround from [lightspeed-mcp-tool-failures.md](docs/references/lightspeed-mcp-tool-failures.md).\n\n## Output Format\n\n**Single CVE**:\n```\nCVE-XXXX-YYYY Remediation Summary\nCVSS Score: X.X (Severity)\nAffected Packages: package-name-version\nAnsible Playbook Generated: ✓\nTarget Systems: N systems\n[Playbook YAML or AAP link]\n[Execution instructions]\n```\n\n**Batch**:\n```\nBatch Remediation Summary\nCVEs: CVE-A, CVE-B, CVE-C\nTarget Systems: N systems\nTotal Fixes: X package updates\n[Consolidated playbook]\n[Execution instructions]\n```\n\n## Important Reminders\n\n- **Use actual tool calls**—invoke skills via Skill tool, not text. If tool use count is 0, you are doing it wrong.\n- **Orchestrate skills, don\'t call MCP tools directly**—skills handle docs and tools.\n- **Always ask for execution confirmation** before Step 5.\n- **Safety**: Test in non-prod first, back up systems, schedule maintenance windows, verify after execution.\n',
    },
    {
      path: 'catalog-info.yaml',
      size: 1585,
      content:
        'apiVersion: backstage.io/v1alpha1\nkind: AiResource\nmetadata:\n  name: remediation\n  namespace: ai5-marketplace\n  title: Remediation\n  description: >\n    End-to-end CVE remediation orchestration skill. Handles multi-step remediation\n    workflows including validation, system context gathering, playbook generation,\n    execution, and verification. Use for all CVE remediation workflows, batch\n    remediation across multiple systems, and emergency security response.\n  labels:\n    distribution: external\n  annotations:\n    backstage.io/source-location: >-\n      url:https://github.com/RHEcosystemAppEng/agentic-plugins/blob/main/rh-sre/skills/remediation/SKILL.md\n  tags:\n    - ai-skill\n    - sre\n    - remediation\n    - cve\n    - security\n  links:\n    - url: https://github.com/RHEcosystemAppEng/agentic-plugins\n      title: Source Repository\n      icon: github\nspec:\n  type: skill\n  lifecycle: beta\n  owner: group:redhat/ai5-marketplace\n  disciplines:\n    - security\n  categories:\n    - remediation\n  agents: []\n  dependsOn:\n    - airesource:ai5-marketplace/rh-sre\n    - airesource:ai5-marketplace/mcp-lightspeed-validator\n    - airesource:ai5-marketplace/mcp-aap-validator\n    - airesource:ai5-marketplace/cve-impact\n    - airesource:ai5-marketplace/cve-validation\n    - airesource:ai5-marketplace/system-context\n    - airesource:ai5-marketplace/playbook-generator\n    - airesource:ai5-marketplace/playbook-executor\n    - airesource:ai5-marketplace/remediation-verifier\n    - mcpserver:redhat/red-hat-lightspeed-mcp-server\n    - mcpserver:ai5-marketplace/ansible-automation-platform\n',
    },
    {
      path: 'docs/ansible/aap-integration.md',
      size: 58,
      content: '../../../mcp-aap-validator/docs/ansible/aap-integration.md',
    },
    {
      path: 'docs/ansible/cve-remediation-templates.md',
      size: 69,
      content: '../../../playbook-generator/docs/ansible/cve-remediation-templates.md',
    },
    {
      path: 'docs/ansible/error-handling.md',
      size: 57,
      content: '../../../mcp-aap-validator/docs/ansible/error-handling.md',
    },
    {
      path: 'docs/ansible/idempotency.md',
      size: 54,
      content: '../../../mcp-aap-validator/docs/ansible/idempotency.md',
    },
    {
      path: 'docs/insights/vulnerability-logic.md',
      size: 60,
      content: '../../../cve-validation/docs/insights/vulnerability-logic.md',
    },
    {
      path: 'docs/references/compliance-frameworks.md',
      size: 67,
      content: '../../../mcp-aap-validator/docs/references/compliance-frameworks.md',
    },
    {
      path: 'docs/references/cvss-scoring.md',
      size: 55,
      content: '../../../cve-validation/docs/references/cvss-scoring.md',
    },
    {
      path: 'docs/references/lightspeed-mcp-tool-failures.md',
      size: 67,
      content: '../../../cve-impact/docs/references/lightspeed-mcp-tool-failures.md',
    },
    {
      path: 'docs/references/skill-invocation.md',
      size: 2258,
      content:
        '---\ntitle: Skill Invocation Reference\ncategory: references\ntags: [skills, invocation, troubleshooting]\nlast_updated: 2026-03-02\n---\n\n# Skill Invocation Reference\n\nGuidance for correctly invoking skills in the rh-sre pack across different AI hosts (Cursor, Claude Code, etc.).\n\n## Invoking Skills (All Sub-Skills)\n\nWhen the remediation skill (or other orchestrators) invokes any sub-skill—validators, cve-validation, cve-impact, system-context, playbook-generator, playbook-executor, remediation-verifier:\n\n- **Use the Skill tool** with the skill name. Format may vary by host:\n  - Cursor: `Skill(rh-sre:mcp-lightspeed-validator)` or similar\n  - Claude Code: `/mcp-lightspeed-validator` or `Skill(mcp-lightspeed-validator)`\n- **Wait for the skill to complete**—skills typically return output directly. Do NOT proceed to the next step until you have the skill\'s actual result (e.g. validation PASSED/FAILED). "Successfully loaded skill" indicates the skill was loaded, not that it finished—wait for the validation outcome before continuing.\n- **Do NOT use "Task Output" with the skill name as the task ID.** If you see "No task found with ID: mcp-lightspeed-validator" (or cve-validation, cve-impact, etc.), you are passing the skill name to a Task Output tool. Task Output expects the task ID returned from an async invocation (e.g. a UUID), NOT the skill name. Skill names are not task IDs.\n\n## If Validator Invocation Fails\n\nIf validator invocation returns "No task found" or similar:\n\n1. **Do NOT block the workflow.** Proceed with a warning.\n2. **Inform the user**: "Validator invocation encountered an issue. Proceeding with remediation workflow—MCP operations in later steps will confirm connectivity."\n3. **Continue to Step 2** (cve-validation). The `get_cve` call will fail if Lightspeed MCP is unavailable.\n4. **Continue to Step 5** (playbook-executor). AAP MCP calls will fail if AAP is unavailable.\n\nThe workflow is resilient: actual MCP tool calls in later steps serve as implicit validation. Do not retry Task Output with the skill name.\n\n## Validation Freshness\n\nIf validation was performed earlier in the same session and succeeded, you may skip re-invoking validators. See each validator skill\'s "Validation Freshness Policy" section.\n',
    },
    {
      path: 'docs/rhel/package-management.md',
      size: 59,
      content: '../../../playbook-generator/docs/rhel/package-management.md',
    },
    {
      path: 'docs/rhel/selinux-context.md',
      size: 55,
      content: '../../../mcp-aap-validator/docs/rhel/selinux-context.md',
    },
    {
      path: 'docs/rhel/systemd-services.md',
      size: 56,
      content: '../../../mcp-aap-validator/docs/rhel/systemd-services.md',
    },
    {
      path: 'docs/rhel/version-compatibility.md',
      size: 61,
      content: '../../../mcp-aap-validator/docs/rhel/version-compatibility.md',
    },
    {
      path: 'references/01-remediation-indicators.md',
      size: 60,
      content: '../../cve-validation/references/01-remediation-indicators.md',
    },
    {
      path: 'references/01-remediation-plan-template.md',
      size: 2392,
      content:
        '# Remediation Plan Template\n\nRead this reference when presenting plans for user validation.\n\n## Part A: Upfront Planned Tasks (Before Step 0)\n\n**When**: Before executing any step. Present immediately after the user requests remediation.\n\n**Purpose**: Let the user validate the approach before any work begins.\n\n**Format**:\n```\n## Remediation: CVE-XXXX-YYYY\n\n**Planned tasks** (in order—use this exact order for TodoWrite/task lists; display order must match execution order):\n1. Validate MCP (Lightspeed, AAP)\n2. Impact analysis (assess CVE risk)\n3. CVE validation (remediatable gate)\n4. System context (affected systems, RHEL versions)\n5. Generate playbook\n6. Dry-run → User confirms → Execute\n7. Verify (optional)\n\n❓ Proceed with this plan?\n- "yes" or "proceed" — I\'ll start with Step 0 (validate MCP)\n- "abort" — Cancel\n```\n\n**Wait for user response** before invoking Step 0. Do NOT start any step until the user confirms.\n\n---\n\n## Part B: Execution Plan (After Step 4, Before Step 5)\n\n**When**: After Step 4 (playbook generated) and before Step 5 (execution). The user must validate before proceeding.\n\n## Part B Format\n\n### 1. Summary (1–2 sentences)\n\n```\n## Remediation Plan: CVE-XXXX-YYYY\n\n**Summary**: [One sentence describing what will happen and why.]\nExample: "Remediate CVE-2026-24882 on ip-172-31-32-201 via Ansible playbook (httpd update to address CVE)."\n```\n\n### 2. Table (CVE, systems, key actions)\n\n```\n| CVE | Target Systems | Key Action |\n|-----|----------------|------------|\n| CVE-XXXX-YYYY | hostname-1, hostname-2 | Update package: httpd 2.4.x → 2.4.y |\n```\n\nFor batch: one row per CVE or combined row if same action.\n\n### 3. Checklist (ordered steps)\n\n```\n**Execution steps**:\n☐ Step 0: Validate MCP (Lightspeed, AAP) — done\n☐ Step 1: Impact analysis — done\n☐ Step 2: CVE validation — done\n☐ Step 3: System context — done\n☐ Step 4: Generate playbook — done\n☐ Step 5: Dry-run → Confirm → Execute\n☐ Step 6: Verify (optional)\n```\n\nMark completed steps as "— done". Show only remaining steps as checkboxes if preferred.\n\n### 4. Confirm Prompt\n\n```\n❓ Confirm to proceed?\n\n- "yes" or "proceed" — Run dry-run first, then execute\n- "dry-run only" — Run dry-run only, no execution\n- "abort" — Cancel remediation\n\nPlease respond with your choice.\n```\n\n**Wait for explicit user response** before invoking playbook-executor.\n',
    },
  ],
} satisfies Record<string, RegisteredSkillFile[]>;
