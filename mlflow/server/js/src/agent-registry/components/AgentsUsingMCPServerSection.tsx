import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import { AgentStatusTag } from './AgentCellRenderers';
import { getAgentQualifiedName } from '../constants';
import { useAgentsUsingMCPServer } from '../hooks/useCrossRegistryQueries';
import { AgentRegistryRoutes } from '../routes';

/**
 * "Used by agents" on an MCP server: the same blast-radius query as on a skill, over the
 * BOM's MCP axis -- "which agents use MCP server Y whose tool schema changed?"
 */
export const AgentsUsingMCPServerSection = ({
  serverName,
  serverVersion,
}: {
  serverName: string;
  serverVersion?: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const usages = useAgentsUsingMCPServer(serverName, serverVersion);

  return (
    <div>
      <Typography.Title level={4}>
        <FormattedMessage
          defaultMessage="Used by agents ({count})"
          description="MCP server detail > agents using this server heading"
          values={{ count: usages.length }}
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary">
        <FormattedMessage
          defaultMessage="Registered agent versions whose bill of materials pins this server."
          description="MCP server detail > agents using this server caption"
        />
      </Typography.Paragraph>
      {usages.length ? (
        <Table data-testid="agents-using-mcp-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-mcp.header-agent">
              <FormattedMessage defaultMessage="Agent" description="Agents-using-MCP table > agent column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-mcp.header-version">
              <FormattedMessage defaultMessage="Agent version" description="Agents-using-MCP table > version column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-mcp.header-pinned">
              <FormattedMessage
                defaultMessage="Server version pinned"
                description="Agents-using-MCP table > pinned column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-mcp.header-status">
              <FormattedMessage defaultMessage="Status" description="Agents-using-MCP table > status column" />
            </TableHeader>
          </TableRow>
          {usages.map(({ agentOrganization, agentName, agentVersion, pinnedServerVersion }) => (
            <TableRow key={`${agentOrganization}/${agentName}@${agentVersion.version}`}>
              <TableCell ellipsis>
                <Link
                  componentId="mlflow.agent-registry.agents-using-mcp.agent-link"
                  to={AgentRegistryRoutes.getAgentVersionPageRoute(agentOrganization, agentName, agentVersion.version)}
                >
                  {getAgentQualifiedName(agentOrganization, agentName)}
                </Link>
              </TableCell>
              <TableCell ellipsis>{agentVersion.version}</TableCell>
              <TableCell ellipsis>{pinnedServerVersion}</TableCell>
              <TableCell ellipsis>
                <AgentStatusTag status={agentVersion.status} />
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : (
        <div
          css={{
            padding: theme.spacing.sm,
            borderRadius: theme.borders.borderRadiusSm,
            backgroundColor: theme.colors.backgroundSecondary,
          }}
        >
          <Typography.Text color="secondary">
            <FormattedMessage
              defaultMessage="No registered agent pins this server."
              description="MCP server detail > no agents using this server"
            />
          </Typography.Text>
        </div>
      )}
    </div>
  );
};
