"""Seed the MCP Registry with the same servers from the prototype mock data."""

import json
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:5000/ajax-api/3.0/mlflow/mcp-servers"

def post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"    ERROR {e.code}: {error_body}")
        raise

def patch(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="PATCH")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def enc(s):
    return urllib.parse.quote(s, safe="")

def pkg(registry_type, identifier, version, transport_type="stdio"):
    return {"registryType": registry_type, "identifier": identifier, "version": version, "transport": {"type": transport_type}}

SEEDS = [
    {
        "name": "com.redhat.openshift/cluster-mcp",
        "description": "Read-only OpenShift cluster introspection: node and pod health, ClusterOperator status, resource utilization, and event streams.",
        "versions": [
            {
                "server_json": {"name": "com.redhat.openshift/cluster-mcp", "version": "1.0.0", "description": "OpenShift Cluster MCP", "packages": [pkg("npm", "@redhat-ai/openshift-cluster-mcp", "1.0.0")]},
                "final_status": "deprecated",
                "tools": [
                    {"name": "list_cluster_operators", "description": "Returns every ClusterOperator and its conditions.", "inputSchema": {"type": "object", "properties": {}}},
                    {"name": "get_node_health", "description": "Reports Ready/SchedulingDisabled status per node.", "inputSchema": {"type": "object", "properties": {"nodeSelector": {"type": "string"}}}},
                ],
            },
            {
                "server_json": {"name": "com.redhat.openshift/cluster-mcp", "version": "1.2.0", "description": "OpenShift Cluster MCP", "packages": [pkg("npm", "@redhat-ai/openshift-cluster-mcp", "1.2.0")]},
                "final_status": "active",
                "tools": [
                    {"name": "list_cluster_operators", "description": "Returns every ClusterOperator and its conditions.", "inputSchema": {"type": "object", "properties": {}}},
                    {"name": "get_node_health", "description": "Reports Ready/SchedulingDisabled status per node.", "inputSchema": {"type": "object", "properties": {"nodeSelector": {"type": "string"}}}},
                    {"name": "list_failing_pods", "description": "Lists pods not in Running/Succeeded.", "inputSchema": {"type": "object", "properties": {"namespace": {"type": "string"}}}},
                ],
            },
            {
                "server_json": {"name": "com.redhat.openshift/cluster-mcp", "version": "1.4.0", "description": "OpenShift Cluster MCP", "packages": [pkg("npm", "@redhat-ai/openshift-cluster-mcp", "1.4.0")], "remotes": [{"transportType": "streamable_http", "url": "https://mcp-gateway.apps.example.com/openshift/cluster/mcp"}]},
                "final_status": "active",
                "tools": [
                    {"name": "list_cluster_operators", "description": "Returns every ClusterOperator and its conditions.", "inputSchema": {"type": "object", "properties": {}}},
                    {"name": "get_node_health", "description": "Reports Ready/SchedulingDisabled status per node.", "inputSchema": {"type": "object", "properties": {"nodeSelector": {"type": "string"}}}},
                    {"name": "list_failing_pods", "description": "Lists pods not in Running/Succeeded.", "inputSchema": {"type": "object", "properties": {"namespace": {"type": "string"}}}},
                    {"name": "get_resource_utilization", "description": "Compares requests/limits against allocatable capacity.", "inputSchema": {"type": "object", "properties": {"nodePool": {"type": "string"}}}},
                ],
            },
        ],
        "aliases": [{"alias": "champion", "version": "1.4.0"}, {"alias": "production", "version": "1.4.0"}, {"alias": "staging", "version": "1.2.0"}],
    },
    {
        "name": "io.github.grafana/grafana-mcp",
        "description": "Query Grafana dashboards, panels, and alert rules, and search Loki/Prometheus datasources directly from an agent session.",
        "versions": [
            {
                "server_json": {"name": "io.github.grafana/grafana-mcp", "version": "0.2.0", "description": "Grafana MCP", "packages": [pkg("docker", "grafana/mcp-grafana", "0.2.0")]},
                "final_status": "deprecated",
                "tools": [{"name": "search_dashboards", "description": "Full-text search across dashboard titles and tags.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}],
            },
            {
                "server_json": {"name": "io.github.grafana/grafana-mcp", "version": "0.3.1", "description": "Grafana MCP", "packages": [pkg("docker", "grafana/mcp-grafana", "0.3.1")], "remotes": [{"transportType": "sse", "url": "https://mcp-gateway.apps.example.com/grafana/sse"}]},
                "final_status": "active",
                "tools": [
                    {"name": "search_dashboards", "description": "Full-text search across dashboard titles and tags.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                    {"name": "get_dashboard_panel", "description": "Fetches a single panel definition and its current query result.", "inputSchema": {"type": "object", "properties": {"dashboardUid": {"type": "string"}, "panelId": {"type": "integer"}}, "required": ["dashboardUid", "panelId"]}},
                    {"name": "list_alert_rules", "description": "Lists alert rules and their current state.", "inputSchema": {"type": "object", "properties": {"folderUid": {"type": "string"}}}},
                ],
            },
        ],
        "aliases": [{"alias": "champion", "version": "0.3.1"}],
    },
    {
        "name": "com.redhat.ansible/automation-mcp",
        "description": "Launch and monitor Ansible Automation Platform job templates, inspect inventories, and read job output.",
        "versions": [
            {
                "server_json": {"name": "com.redhat.ansible/automation-mcp", "version": "0.1.0", "description": "Ansible Automation MCP", "packages": [pkg("pypi", "ansible-automation-mcp", "0.1.0")]},
                "final_status": "draft",
                "tools": [
                    {"name": "launch_job_template", "description": "Launches a job template by ID.", "inputSchema": {"type": "object", "properties": {"templateId": {"type": "integer"}}, "required": ["templateId"]}},
                    {"name": "get_job_status", "description": "Polls a job by ID and returns its status.", "inputSchema": {"type": "object", "properties": {"jobId": {"type": "integer"}}, "required": ["jobId"]}},
                    {"name": "list_inventories", "description": "Lists inventories visible to the configured token.", "inputSchema": {"type": "object", "properties": {"organizationId": {"type": "integer"}}}},
                ],
            },
        ],
        "aliases": [],
    },
    {
        "name": "io.github.slackapi/slack-mcp",
        "description": "Read and post to Slack channels, search message history, and manage reactions.",
        "versions": [
            {
                "server_json": {"name": "io.github.slackapi/slack-mcp", "version": "1.0.0", "description": "Slack MCP", "packages": [pkg("npm", "@modelcontextprotocol/server-slack", "1.0.0")]},
                "final_status": "deprecated",
                "tools": [{"name": "post_message", "description": "Posts a message to a channel or thread.", "inputSchema": {"type": "object", "properties": {"channel": {"type": "string"}, "text": {"type": "string"}}, "required": ["channel", "text"]}}],
            },
            {
                "server_json": {"name": "io.github.slackapi/slack-mcp", "version": "2.0.0", "description": "Slack MCP", "packages": [pkg("npm", "@modelcontextprotocol/server-slack", "2.0.0")]},
                "final_status": "active",
                "tools": [
                    {"name": "post_message", "description": "Posts a message to a channel or thread.", "inputSchema": {"type": "object", "properties": {"channel": {"type": "string"}, "text": {"type": "string"}}, "required": ["channel", "text"]}},
                    {"name": "search_messages", "description": "Searches message history.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                ],
            },
            {
                "server_json": {"name": "io.github.slackapi/slack-mcp", "version": "2.1.0", "description": "Slack MCP", "packages": [pkg("npm", "@modelcontextprotocol/server-slack", "2.1.0")], "remotes": [{"transportType": "streamable_http", "url": "https://mcp-gateway.apps.example.com/slack/mcp"}]},
                "final_status": "active",
                "tools": [
                    {"name": "post_message", "description": "Posts a message to a channel or thread.", "inputSchema": {"type": "object", "properties": {"channel": {"type": "string"}, "text": {"type": "string"}}, "required": ["channel", "text"]}},
                    {"name": "search_messages", "description": "Searches message history.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                    {"name": "get_channel_history", "description": "Fetches the most recent messages in a channel.", "inputSchema": {"type": "object", "properties": {"channel": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["channel"]}},
                    {"name": "add_reaction", "description": "Adds an emoji reaction to a message.", "inputSchema": {"type": "object", "properties": {"channel": {"type": "string"}, "timestamp": {"type": "string"}, "emoji": {"type": "string"}}, "required": ["channel", "timestamp", "emoji"]}},
                ],
            },
        ],
        "aliases": [{"alias": "champion", "version": "2.1.0"}],
    },
    {
        "name": "io.github.hashicorp/terraform-mcp",
        "description": "Plan, validate, and inspect Terraform state and the public module/provider registries.",
        "versions": [
            {
                "server_json": {"name": "io.github.hashicorp/terraform-mcp", "version": "0.3.0", "description": "Terraform MCP", "packages": [pkg("npm", "@hashicorp/terraform-mcp-server", "0.3.0")]},
                "final_status": "deprecated",
                "tools": [{"name": "search_modules", "description": "Searches the public Terraform Registry.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}],
            },
            {
                "server_json": {"name": "io.github.hashicorp/terraform-mcp", "version": "0.4.2", "description": "Terraform MCP", "packages": [pkg("npm", "@hashicorp/terraform-mcp-server", "0.4.2")]},
                "final_status": "deprecated",
                "tools": [
                    {"name": "search_modules", "description": "Searches the public Terraform Registry.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                    {"name": "get_provider_docs", "description": "Fetches resource documentation for a provider.", "inputSchema": {"type": "object", "properties": {"provider": {"type": "string"}, "resource": {"type": "string"}}, "required": ["provider", "resource"]}},
                    {"name": "plan_summary", "description": "Summarizes a terraform plan JSON output.", "inputSchema": {"type": "object", "properties": {"planJson": {"type": "object"}}}},
                ],
            },
        ],
        "aliases": [],
    },
    {
        "name": "com.github/github-mcp",
        "description": "Repository, issue, and pull-request operations against GitHub — browse code, open and comment on issues/PRs, and search across an org.",
        "versions": [
            {
                "server_json": {"name": "com.github/github-mcp", "version": "1.2.0", "description": "GitHub MCP", "packages": [pkg("docker", "ghcr.io/github/github-mcp-server", "1.2.0")]},
                "final_status": "deprecated",
                "tools": [{"name": "search_repositories", "description": "Searches repositories.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}],
            },
            {
                "server_json": {"name": "com.github/github-mcp", "version": "1.5.0", "description": "GitHub MCP", "packages": [pkg("docker", "ghcr.io/github/github-mcp-server", "1.5.0")]},
                "final_status": "active",
                "tools": [
                    {"name": "search_repositories", "description": "Searches repositories.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                    {"name": "create_issue", "description": "Opens a new issue in a repository.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "title": {"type": "string"}}, "required": ["owner", "repo", "title"]}},
                    {"name": "list_pull_requests", "description": "Lists pull requests for a repository.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "state": {"type": "string"}}, "required": ["owner", "repo"]}},
                ],
            },
            {
                "server_json": {"name": "com.github/github-mcp", "version": "1.6.0", "description": "GitHub MCP", "packages": [pkg("docker", "ghcr.io/github/github-mcp-server", "1.6.0")], "remotes": [{"transportType": "streamable_http", "url": "https://mcp-gateway.apps.example.com/github/mcp"}]},
                "final_status": "active",
                "tools": [
                    {"name": "search_repositories", "description": "Searches repositories.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                    {"name": "create_issue", "description": "Opens a new issue in a repository.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "title": {"type": "string"}}, "required": ["owner", "repo", "title"]}},
                    {"name": "list_pull_requests", "description": "Lists pull requests for a repository.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "state": {"type": "string"}}, "required": ["owner", "repo"]}},
                    {"name": "get_file_contents", "description": "Reads a file at a ref from a repository.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "path": {"type": "string"}}, "required": ["owner", "repo", "path"]}},
                    {"name": "add_pr_comment", "description": "Adds a review comment to a pull request.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "pullNumber": {"type": "integer"}, "body": {"type": "string"}}, "required": ["owner", "repo", "pullNumber", "body"]}},
                ],
            },
        ],
        "aliases": [{"alias": "champion", "version": "1.6.0"}, {"alias": "production", "version": "1.6.0"}, {"alias": "staging", "version": "1.5.0"}],
    },
    {
        "name": "io.github.prometheus/prometheus-mcp",
        "description": "Run PromQL queries and browse metric metadata against a Prometheus/Thanos endpoint.",
        "versions": [
            {
                "server_json": {"name": "io.github.prometheus/prometheus-mcp", "version": "0.5.0", "description": "Prometheus MCP", "packages": [pkg("pypi", "prometheus-mcp-server", "0.5.0")]},
                "final_status": "active",
                "tools": [
                    {"name": "query_range", "description": "Runs a PromQL range query.", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "start": {"type": "string"}, "end": {"type": "string"}, "step": {"type": "string"}}, "required": ["query", "start", "end"]}},
                    {"name": "list_metric_names", "description": "Lists metric names matching a prefix.", "inputSchema": {"type": "object", "properties": {"prefix": {"type": "string"}}}},
                ],
            },
        ],
        "aliases": [{"alias": "champion", "version": "0.5.0"}],
    },
    {
        "name": "com.atlassian/jira-mcp",
        "description": "Search and read Jira issues (JQL), and inspect issue links and transitions.",
        "versions": [
            {
                "server_json": {"name": "com.atlassian/jira-mcp", "version": "0.9.0", "description": "Jira MCP", "packages": [pkg("npm", "@atlassian/jira-mcp-server", "0.9.0")]},
                "final_status": "draft",
                "tools": [
                    {"name": "search_issues", "description": "Runs a JQL query and returns matching issues.", "inputSchema": {"type": "object", "properties": {"jql": {"type": "string"}, "maxResults": {"type": "integer"}}, "required": ["jql"]}},
                    {"name": "get_issue", "description": "Fetches a single issue by key.", "inputSchema": {"type": "object", "properties": {"issueKey": {"type": "string"}}, "required": ["issueKey"]}},
                ],
            },
        ],
        "aliases": [],
    },
    {
        "name": "com.redhat.rhoai/model-registry-mcp",
        "description": "Browse registered models and model versions in the RHOAI Model Registry, and inspect metadata and deployment status.",
        "versions": [
            {
                "server_json": {"name": "com.redhat.rhoai/model-registry-mcp", "version": "1.0.0", "description": "RHOAI Model Registry MCP", "packages": [pkg("pypi", "rhoai-model-registry-mcp", "1.0.0")]},
                "final_status": "deprecated",
                "tools": [
                    {"name": "list_registered_models", "description": "Lists registered models.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}}}},
                    {"name": "get_model_version", "description": "Fetches metadata for a model version.", "inputSchema": {"type": "object", "properties": {"modelName": {"type": "string"}, "version": {"type": "string"}}, "required": ["modelName", "version"]}},
                ],
            },
            {
                "server_json": {"name": "com.redhat.rhoai/model-registry-mcp", "version": "1.1.0", "description": "RHOAI Model Registry MCP", "packages": [pkg("pypi", "rhoai-model-registry-mcp", "1.1.0")], "remotes": [{"transportType": "streamable_http", "url": "https://mcp-gateway.apps.example.com/rhoai/model-registry/mcp"}]},
                "final_status": "active",
                "tools": [
                    {"name": "list_registered_models", "description": "Lists registered models.", "inputSchema": {"type": "object", "properties": {"owner": {"type": "string"}}}},
                    {"name": "get_model_version", "description": "Fetches metadata for a model version.", "inputSchema": {"type": "object", "properties": {"modelName": {"type": "string"}, "version": {"type": "string"}}, "required": ["modelName", "version"]}},
                    {"name": "list_deployments", "description": "Lists active deployments for a registered model.", "inputSchema": {"type": "object", "properties": {"modelName": {"type": "string"}}, "required": ["modelName"]}},
                ],
            },
        ],
        "aliases": [{"alias": "champion", "version": "1.1.0"}],
    },
]


def seed():
    for server in SEEDS:
        name = server["name"]
        print(f"Creating server: {name}")
        post(BASE, {"name": name, "description": server["description"]})

        for ver in server["versions"]:
            v = ver["server_json"]["version"]
            final_status = ver["final_status"]
            create_status = "active" if final_status in ("deprecated", "deleted") else final_status
            print(f"  Version {v} (create as {create_status})")
            payload = {"server_json": ver["server_json"], "status": create_status, "tools": ver["tools"]}
            post(f"{BASE}/{enc(name)}/versions", payload)

            if final_status in ("deprecated", "deleted"):
                print(f"    -> updating to {final_status}")
                patch(f"{BASE}/{enc(name)}/versions/{enc(v)}", {"status": final_status})

        for alias_def in server.get("aliases", []):
            alias = alias_def["alias"]
            version = alias_def["version"]
            print(f"  Alias {alias} -> {version}")
            post(f"{BASE}/{enc(name)}/aliases", {"alias": alias, "version": version})

    print(f"\nDone. Seeded {len(SEEDS)} MCP servers.")


if __name__ == "__main__":
    seed()
