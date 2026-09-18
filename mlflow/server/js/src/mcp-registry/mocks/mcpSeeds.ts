/**
 * Seed data for the MCP Registry prototype mock.
 *
 * Captured from a running MLflow server's own MCP registry responses, so the shapes here
 * are the API's shapes rather than a hand-written approximation. That matters more for
 * this registry than the others: skills, agents and agent plugins were designed
 * mock-first, while MCP is real upstream code whose components read fields a
 * hand-written fixture would have to guess at.
 *
 * One transformation is applied on capture: keys whose value was `null` are dropped. The
 * server sends `null` for absent optional fields while `types.ts` declares them optional
 * (`| undefined`), and TypeScript does not accept one for the other. Nothing reads the
 * difference, but the mismatch is worth knowing about if these types are ever validated
 * against live responses.
 *
 * Regenerate by querying a local server's `/ajax-api/3.0/mlflow/mcp-servers` and its
 * per-server `/versions` and `/endpoints` collections.
 */

import type { MCPAccessEndpoint, MCPServer, MCPServerVersion } from '../types';

export interface MCPSeedEntry {
  server: MCPServer;
  versions: MCPServerVersion[];
  endpoints: MCPAccessEndpoint[];
}

/*
 * Cast rather than annotated. The data below is captured from live API responses, so its
 * runtime shape is authoritative by construction; what TypeScript objects to is only that
 * a JSON string literal widens to `string` and will not narrow to `MCPStatus` or
 * `TransportType` on its own. Annotating each of those fields individually across ~30
 * records would add noise without adding a check that means anything here.
 */
export const MCP_SEEDS = [
  {
    server: {
      name: 'com.atlassian/jira-mcp',
      description: 'Search and read Jira issues (JQL), and inspect issue links and transitions.',
      workspace: 'default',
      status: 'draft',
      access_endpoints: [],
      latest_version: '0.9.0',
      aliases: [],
      tags: {},
      creation_timestamp: 1787691900730,
      last_updated_timestamp: 1787691900730,
    },
    versions: [
      {
        name: 'com.atlassian/jira-mcp',
        version: '0.9.0',
        server_json: {
          name: 'com.atlassian/jira-mcp',
          version: '0.9.0',
          description: 'Jira MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@atlassian/jira-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '0.9.0',
            },
          ],
        },
        workspace: 'default',
        status: 'draft',
        tools: [
          {
            name: 'search_issues',
            description: 'Runs a JQL query and returns matching issues.',
            inputSchema: {
              type: 'object',
              properties: {
                jql: {
                  type: 'string',
                },
                maxResults: {
                  type: 'integer',
                },
              },
              required: ['jql'],
            },
          },
          {
            name: 'get_issue',
            description: 'Fetches a single issue by key.',
            inputSchema: {
              type: 'object',
              properties: {
                issueKey: {
                  type: 'string',
                },
              },
              required: ['issueKey'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900736,
        last_updated_timestamp: 1787691900736,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'com.github/github-mcp',
      description:
        'Repository, issue, and pull-request operations against GitHub — browse code, open and comment on issues/PRs, and search across an org.',
      workspace: 'default',
      status: 'active',
      access_endpoints: [],
      latest_version: '1.6.0',
      aliases: [
        {
          alias: 'champion',
          version: '1.6.0',
        },
        {
          alias: 'production',
          version: '1.6.0',
        },
        {
          alias: 'staging',
          version: '1.5.0',
        },
      ],
      tags: {},
      creation_timestamp: 1787691900629,
      last_updated_timestamp: 1787691900629,
    },
    versions: [
      {
        name: 'com.github/github-mcp',
        version: '1.2.0',
        server_json: {
          name: 'com.github/github-mcp',
          version: '1.2.0',
          description: 'GitHub MCP',
          packages: [
            {
              registryType: 'docker',
              identifier: 'ghcr.io/github/github-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '1.2.0',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'search_repositories',
            description: 'Searches repositories.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900637,
        last_updated_timestamp: 1787691900648,
      },
      {
        name: 'com.github/github-mcp',
        version: '1.5.0',
        server_json: {
          name: 'com.github/github-mcp',
          version: '1.5.0',
          description: 'GitHub MCP',
          packages: [
            {
              registryType: 'docker',
              identifier: 'ghcr.io/github/github-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '1.5.0',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'search_repositories',
            description: 'Searches repositories.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'create_issue',
            description: 'Opens a new issue in a repository.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
                repo: {
                  type: 'string',
                },
                title: {
                  type: 'string',
                },
              },
              required: ['owner', 'repo', 'title'],
            },
          },
          {
            name: 'list_pull_requests',
            description: 'Lists pull requests for a repository.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
                repo: {
                  type: 'string',
                },
                state: {
                  type: 'string',
                },
              },
              required: ['owner', 'repo'],
            },
          },
        ],
        aliases: ['staging'],
        tags: {},
        creation_timestamp: 1787691900651,
        last_updated_timestamp: 1787691900651,
      },
      {
        name: 'com.github/github-mcp',
        version: '1.6.0',
        server_json: {
          name: 'com.github/github-mcp',
          version: '1.6.0',
          description: 'GitHub MCP',
          packages: [
            {
              registryType: 'docker',
              identifier: 'ghcr.io/github/github-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '1.6.0',
            },
          ],
          remotes: [
            {
              url: 'https://mcp-gateway.apps.example.com/github/mcp',
              transportType: 'streamable_http',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'search_repositories',
            description: 'Searches repositories.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'create_issue',
            description: 'Opens a new issue in a repository.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
                repo: {
                  type: 'string',
                },
                title: {
                  type: 'string',
                },
              },
              required: ['owner', 'repo', 'title'],
            },
          },
          {
            name: 'list_pull_requests',
            description: 'Lists pull requests for a repository.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
                repo: {
                  type: 'string',
                },
                state: {
                  type: 'string',
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'get_file_contents',
            description: 'Reads a file at a ref from a repository.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
                repo: {
                  type: 'string',
                },
                path: {
                  type: 'string',
                },
              },
              required: ['owner', 'repo', 'path'],
            },
          },
          {
            name: 'add_pr_comment',
            description: 'Adds a review comment to a pull request.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
                repo: {
                  type: 'string',
                },
                pullNumber: {
                  type: 'integer',
                },
                body: {
                  type: 'string',
                },
              },
              required: ['owner', 'repo', 'pullNumber', 'body'],
            },
          },
        ],
        aliases: ['champion', 'production'],
        tags: {},
        creation_timestamp: 1787691900670,
        last_updated_timestamp: 1787691900670,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'com.redhat.ansible/automation-mcp',
      description:
        'Launch and monitor Ansible Automation Platform job templates, inspect inventories, and read job output.',
      workspace: 'default',
      status: 'draft',
      access_endpoints: [],
      latest_version: '0.1.0',
      aliases: [],
      tags: {},
      creation_timestamp: 1787691900510,
      last_updated_timestamp: 1787691900510,
    },
    versions: [
      {
        name: 'com.redhat.ansible/automation-mcp',
        version: '0.1.0',
        server_json: {
          name: 'com.redhat.ansible/automation-mcp',
          version: '0.1.0',
          description: 'Ansible Automation MCP',
          packages: [
            {
              registryType: 'pypi',
              identifier: 'ansible-automation-mcp',
              transport: {
                type: 'stdio',
              },
              version: '0.1.0',
            },
          ],
        },
        workspace: 'default',
        status: 'draft',
        tools: [
          {
            name: 'launch_job_template',
            description: 'Launches a job template by ID.',
            inputSchema: {
              type: 'object',
              properties: {
                templateId: {
                  type: 'integer',
                },
              },
              required: ['templateId'],
            },
          },
          {
            name: 'get_job_status',
            description: 'Polls a job by ID and returns its status.',
            inputSchema: {
              type: 'object',
              properties: {
                jobId: {
                  type: 'integer',
                },
              },
              required: ['jobId'],
            },
          },
          {
            name: 'list_inventories',
            description: 'Lists inventories visible to the configured token.',
            inputSchema: {
              type: 'object',
              properties: {
                organizationId: {
                  type: 'integer',
                },
              },
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900518,
        last_updated_timestamp: 1787691900518,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'com.redhat.openshift/cluster-mcp',
      description:
        'Read-only OpenShift cluster introspection: node and pod health, ClusterOperator status, resource utilization, and event streams.',
      workspace: 'default',
      status: 'active',
      access_endpoints: [],
      latest_version: '1.4.0',
      aliases: [
        {
          alias: 'champion',
          version: '1.4.0',
        },
        {
          alias: 'production',
          version: '1.4.0',
        },
        {
          alias: 'staging',
          version: '1.2.0',
        },
      ],
      tags: {},
      creation_timestamp: 1787691900383,
      last_updated_timestamp: 1787691900383,
    },
    versions: [
      {
        name: 'com.redhat.openshift/cluster-mcp',
        version: '1.0.0',
        server_json: {
          name: 'com.redhat.openshift/cluster-mcp',
          version: '1.0.0',
          description: 'OpenShift Cluster MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@redhat-ai/openshift-cluster-mcp',
              transport: {
                type: 'stdio',
              },
              version: '1.0.0',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'list_cluster_operators',
            description: 'Returns every ClusterOperator and its conditions.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_node_health',
            description: 'Reports Ready/SchedulingDisabled status per node.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeSelector: {
                  type: 'string',
                },
              },
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900393,
        last_updated_timestamp: 1787691900408,
      },
      {
        name: 'com.redhat.openshift/cluster-mcp',
        version: '1.2.0',
        server_json: {
          name: 'com.redhat.openshift/cluster-mcp',
          version: '1.2.0',
          description: 'OpenShift Cluster MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@redhat-ai/openshift-cluster-mcp',
              transport: {
                type: 'stdio',
              },
              version: '1.2.0',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'list_cluster_operators',
            description: 'Returns every ClusterOperator and its conditions.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_node_health',
            description: 'Reports Ready/SchedulingDisabled status per node.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeSelector: {
                  type: 'string',
                },
              },
            },
          },
          {
            name: 'list_failing_pods',
            description: 'Lists pods not in Running/Succeeded.',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                },
              },
            },
          },
        ],
        aliases: ['staging'],
        tags: {},
        creation_timestamp: 1787691900422,
        last_updated_timestamp: 1787691900422,
      },
      {
        name: 'com.redhat.openshift/cluster-mcp',
        version: '1.4.0',
        server_json: {
          name: 'com.redhat.openshift/cluster-mcp',
          version: '1.4.0',
          description: 'OpenShift Cluster MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@redhat-ai/openshift-cluster-mcp',
              transport: {
                type: 'stdio',
              },
              version: '1.4.0',
            },
          ],
          remotes: [
            {
              url: 'https://mcp-gateway.apps.example.com/openshift/cluster/mcp',
              transportType: 'streamable_http',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'list_cluster_operators',
            description: 'Returns every ClusterOperator and its conditions.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_node_health',
            description: 'Reports Ready/SchedulingDisabled status per node.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeSelector: {
                  type: 'string',
                },
              },
            },
          },
          {
            name: 'list_failing_pods',
            description: 'Lists pods not in Running/Succeeded.',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                },
              },
            },
          },
          {
            name: 'get_resource_utilization',
            description: 'Compares requests/limits against allocatable capacity.',
            inputSchema: {
              type: 'object',
              properties: {
                nodePool: {
                  type: 'string',
                },
              },
            },
          },
        ],
        aliases: ['champion', 'production'],
        tags: {},
        creation_timestamp: 1787691900432,
        last_updated_timestamp: 1787691900432,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'com.redhat.rhoai/model-registry-mcp',
      description:
        'Browse registered models and model versions in the RHOAI Model Registry, and inspect metadata and deployment status.',
      workspace: 'default',
      status: 'active',
      access_endpoints: [],
      latest_version: '1.1.0',
      aliases: [
        {
          alias: 'champion',
          version: '1.1.0',
        },
      ],
      tags: {},
      creation_timestamp: 1787691900739,
      last_updated_timestamp: 1787691900739,
    },
    versions: [
      {
        name: 'com.redhat.rhoai/model-registry-mcp',
        version: '1.0.0',
        server_json: {
          name: 'com.redhat.rhoai/model-registry-mcp',
          version: '1.0.0',
          description: 'RHOAI Model Registry MCP',
          packages: [
            {
              registryType: 'pypi',
              identifier: 'rhoai-model-registry-mcp',
              transport: {
                type: 'stdio',
              },
              version: '1.0.0',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'list_registered_models',
            description: 'Lists registered models.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
              },
            },
          },
          {
            name: 'get_model_version',
            description: 'Fetches metadata for a model version.',
            inputSchema: {
              type: 'object',
              properties: {
                modelName: {
                  type: 'string',
                },
                version: {
                  type: 'string',
                },
              },
              required: ['modelName', 'version'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900751,
        last_updated_timestamp: 1787691900760,
      },
      {
        name: 'com.redhat.rhoai/model-registry-mcp',
        version: '1.1.0',
        server_json: {
          name: 'com.redhat.rhoai/model-registry-mcp',
          version: '1.1.0',
          description: 'RHOAI Model Registry MCP',
          packages: [
            {
              registryType: 'pypi',
              identifier: 'rhoai-model-registry-mcp',
              transport: {
                type: 'stdio',
              },
              version: '1.1.0',
            },
          ],
          remotes: [
            {
              url: 'https://mcp-gateway.apps.example.com/rhoai/model-registry/mcp',
              transportType: 'streamable_http',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'list_registered_models',
            description: 'Lists registered models.',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                },
              },
            },
          },
          {
            name: 'get_model_version',
            description: 'Fetches metadata for a model version.',
            inputSchema: {
              type: 'object',
              properties: {
                modelName: {
                  type: 'string',
                },
                version: {
                  type: 'string',
                },
              },
              required: ['modelName', 'version'],
            },
          },
          {
            name: 'list_deployments',
            description: 'Lists active deployments for a registered model.',
            inputSchema: {
              type: 'object',
              properties: {
                modelName: {
                  type: 'string',
                },
              },
              required: ['modelName'],
            },
          },
        ],
        aliases: ['champion'],
        tags: {},
        creation_timestamp: 1787691900770,
        last_updated_timestamp: 1787691900770,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'io.github.grafana/grafana-mcp',
      description:
        'Query Grafana dashboards, panels, and alert rules, and search Loki/Prometheus datasources directly from an agent session.',
      workspace: 'default',
      status: 'active',
      access_endpoints: [],
      latest_version: '0.3.1',
      aliases: [
        {
          alias: 'champion',
          version: '0.3.1',
        },
      ],
      tags: {},
      creation_timestamp: 1787691900465,
      last_updated_timestamp: 1787691900465,
    },
    versions: [
      {
        name: 'io.github.grafana/grafana-mcp',
        version: '0.2.0',
        server_json: {
          name: 'io.github.grafana/grafana-mcp',
          version: '0.2.0',
          description: 'Grafana MCP',
          packages: [
            {
              registryType: 'docker',
              identifier: 'grafana/mcp-grafana',
              transport: {
                type: 'stdio',
              },
              version: '0.2.0',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'search_dashboards',
            description: 'Full-text search across dashboard titles and tags.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900474,
        last_updated_timestamp: 1787691900483,
      },
      {
        name: 'io.github.grafana/grafana-mcp',
        version: '0.3.1',
        server_json: {
          name: 'io.github.grafana/grafana-mcp',
          version: '0.3.1',
          description: 'Grafana MCP',
          packages: [
            {
              registryType: 'docker',
              identifier: 'grafana/mcp-grafana',
              transport: {
                type: 'stdio',
              },
              version: '0.3.1',
            },
          ],
          remotes: [
            {
              url: 'https://mcp-gateway.apps.example.com/grafana/sse',
              transportType: 'sse',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'search_dashboards',
            description: 'Full-text search across dashboard titles and tags.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_dashboard_panel',
            description: 'Fetches a single panel definition and its current query result.',
            inputSchema: {
              type: 'object',
              properties: {
                dashboardUid: {
                  type: 'string',
                },
                panelId: {
                  type: 'integer',
                },
              },
              required: ['dashboardUid', 'panelId'],
            },
          },
          {
            name: 'list_alert_rules',
            description: 'Lists alert rules and their current state.',
            inputSchema: {
              type: 'object',
              properties: {
                folderUid: {
                  type: 'string',
                },
              },
            },
          },
        ],
        aliases: ['champion'],
        tags: {},
        creation_timestamp: 1787691900492,
        last_updated_timestamp: 1787691900492,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'io.github.hashicorp/terraform-mcp',
      description: 'Plan, validate, and inspect Terraform state and the public module/provider registries.',
      workspace: 'default',
      status: 'deprecated',
      access_endpoints: [],
      latest_version: '0.4.2',
      aliases: [],
      tags: {},
      creation_timestamp: 1787691900581,
      last_updated_timestamp: 1787691900581,
    },
    versions: [
      {
        name: 'io.github.hashicorp/terraform-mcp',
        version: '0.3.0',
        server_json: {
          name: 'io.github.hashicorp/terraform-mcp',
          version: '0.3.0',
          description: 'Terraform MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@hashicorp/terraform-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '0.3.0',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'search_modules',
            description: 'Searches the public Terraform Registry.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900589,
        last_updated_timestamp: 1787691900600,
      },
      {
        name: 'io.github.hashicorp/terraform-mcp',
        version: '0.4.2',
        server_json: {
          name: 'io.github.hashicorp/terraform-mcp',
          version: '0.4.2',
          description: 'Terraform MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@hashicorp/terraform-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '0.4.2',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'search_modules',
            description: 'Searches the public Terraform Registry.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_provider_docs',
            description: 'Fetches resource documentation for a provider.',
            inputSchema: {
              type: 'object',
              properties: {
                provider: {
                  type: 'string',
                },
                resource: {
                  type: 'string',
                },
              },
              required: ['provider', 'resource'],
            },
          },
          {
            name: 'plan_summary',
            description: 'Summarizes a terraform plan JSON output.',
            inputSchema: {
              type: 'object',
              properties: {
                planJson: {
                  type: 'object',
                },
              },
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900610,
        last_updated_timestamp: 1787691900621,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'io.github.prometheus/prometheus-mcp',
      description: 'Run PromQL queries and browse metric metadata against a Prometheus/Thanos endpoint.',
      workspace: 'default',
      status: 'active',
      access_endpoints: [],
      latest_version: '0.5.0',
      aliases: [
        {
          alias: 'champion',
          version: '0.5.0',
        },
      ],
      tags: {},
      creation_timestamp: 1787691900706,
      last_updated_timestamp: 1787691900706,
    },
    versions: [
      {
        name: 'io.github.prometheus/prometheus-mcp',
        version: '0.5.0',
        server_json: {
          name: 'io.github.prometheus/prometheus-mcp',
          version: '0.5.0',
          description: 'Prometheus MCP',
          packages: [
            {
              registryType: 'pypi',
              identifier: 'prometheus-mcp-server',
              transport: {
                type: 'stdio',
              },
              version: '0.5.0',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'query_range',
            description: 'Runs a PromQL range query.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
                start: {
                  type: 'string',
                },
                end: {
                  type: 'string',
                },
                step: {
                  type: 'string',
                },
              },
              required: ['query', 'start', 'end'],
            },
          },
          {
            name: 'list_metric_names',
            description: 'Lists metric names matching a prefix.',
            inputSchema: {
              type: 'object',
              properties: {
                prefix: {
                  type: 'string',
                },
              },
            },
          },
        ],
        aliases: ['champion'],
        tags: {},
        creation_timestamp: 1787691900714,
        last_updated_timestamp: 1787691900714,
      },
    ],
    endpoints: [],
  },
  {
    server: {
      name: 'io.github.slackapi/slack-mcp',
      description: 'Read and post to Slack channels, search message history, and manage reactions.',
      workspace: 'default',
      status: 'active',
      access_endpoints: [],
      latest_version: '2.1.0',
      aliases: [
        {
          alias: 'champion',
          version: '2.1.0',
        },
      ],
      tags: {},
      creation_timestamp: 1787691900527,
      last_updated_timestamp: 1787691900527,
    },
    versions: [
      {
        name: 'io.github.slackapi/slack-mcp',
        version: '1.0.0',
        server_json: {
          name: 'io.github.slackapi/slack-mcp',
          version: '1.0.0',
          description: 'Slack MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@modelcontextprotocol/server-slack',
              transport: {
                type: 'stdio',
              },
              version: '1.0.0',
            },
          ],
        },
        workspace: 'default',
        status: 'deprecated',
        tools: [
          {
            name: 'post_message',
            description: 'Posts a message to a channel or thread.',
            inputSchema: {
              type: 'object',
              properties: {
                channel: {
                  type: 'string',
                },
                text: {
                  type: 'string',
                },
              },
              required: ['channel', 'text'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900534,
        last_updated_timestamp: 1787691900546,
      },
      {
        name: 'io.github.slackapi/slack-mcp',
        version: '2.0.0',
        server_json: {
          name: 'io.github.slackapi/slack-mcp',
          version: '2.0.0',
          description: 'Slack MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@modelcontextprotocol/server-slack',
              transport: {
                type: 'stdio',
              },
              version: '2.0.0',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'post_message',
            description: 'Posts a message to a channel or thread.',
            inputSchema: {
              type: 'object',
              properties: {
                channel: {
                  type: 'string',
                },
                text: {
                  type: 'string',
                },
              },
              required: ['channel', 'text'],
            },
          },
          {
            name: 'search_messages',
            description: 'Searches message history.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
        ],
        aliases: [],
        tags: {},
        creation_timestamp: 1787691900556,
        last_updated_timestamp: 1787691900556,
      },
      {
        name: 'io.github.slackapi/slack-mcp',
        version: '2.1.0',
        server_json: {
          name: 'io.github.slackapi/slack-mcp',
          version: '2.1.0',
          description: 'Slack MCP',
          packages: [
            {
              registryType: 'npm',
              identifier: '@modelcontextprotocol/server-slack',
              transport: {
                type: 'stdio',
              },
              version: '2.1.0',
            },
          ],
          remotes: [
            {
              url: 'https://mcp-gateway.apps.example.com/slack/mcp',
              transportType: 'streamable_http',
            },
          ],
        },
        workspace: 'default',
        status: 'active',
        tools: [
          {
            name: 'post_message',
            description: 'Posts a message to a channel or thread.',
            inputSchema: {
              type: 'object',
              properties: {
                channel: {
                  type: 'string',
                },
                text: {
                  type: 'string',
                },
              },
              required: ['channel', 'text'],
            },
          },
          {
            name: 'search_messages',
            description: 'Searches message history.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_channel_history',
            description: 'Fetches the most recent messages in a channel.',
            inputSchema: {
              type: 'object',
              properties: {
                channel: {
                  type: 'string',
                },
                limit: {
                  type: 'integer',
                },
              },
              required: ['channel'],
            },
          },
          {
            name: 'add_reaction',
            description: 'Adds an emoji reaction to a message.',
            inputSchema: {
              type: 'object',
              properties: {
                channel: {
                  type: 'string',
                },
                timestamp: {
                  type: 'string',
                },
                emoji: {
                  type: 'string',
                },
              },
              required: ['channel', 'timestamp', 'emoji'],
            },
          },
        ],
        aliases: ['champion'],
        tags: {},
        creation_timestamp: 1787691900565,
        last_updated_timestamp: 1787691900565,
      },
    ],
    endpoints: [],
  },
] as unknown as MCPSeedEntry[];
