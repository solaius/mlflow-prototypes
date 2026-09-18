import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { AgentStatusTag } from '../../agent-registry/components/AgentCellRenderers';
import { getAgentQualifiedName } from '../../agent-registry/constants';
import { AgentRegistryRoutes } from '../../agent-registry/routes';
import { Link } from '../../common/utils/RoutingUtils';
import { useAgentsUsingPlugin } from '../hooks/useAgentsUsingPlugin';

/**
 * "Used by agents" for a plugin version: the reverse of the agent plugin references each
 * agent version's BOM records (RFC-0011). This is the plugin half of the blast-radius
 * query, and it reads registry records only.
 */
export const AgentsUsingPluginSection = ({
  qualifiedPluginName,
  pluginVersion,
}: {
  qualifiedPluginName: string;
  pluginVersion?: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const usages = useAgentsUsingPlugin(qualifiedPluginName, pluginVersion);

  return (
    <div>
      <Typography.Title level={4}>
        <FormattedMessage
          defaultMessage="Used by agents ({count})"
          description="Plugin version pane > agents using this plugin heading"
          values={{ count: usages.length }}
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary">
        <FormattedMessage
          defaultMessage="Registered agent versions whose bill of materials references this exact plugin version. Deleting this version affects every one of them; deprecating it does not."
          description="Plugin version pane > agents using this plugin caption"
        />
      </Typography.Paragraph>

      {usages.length ? (
        <Table data-testid="agents-using-plugin-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-plugins.agents-using-plugin.header-agent">
              <FormattedMessage defaultMessage="Agent" description="Agents-using-plugin table > agent column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.agents-using-plugin.header-version">
              <FormattedMessage
                defaultMessage="Agent version"
                description="Agents-using-plugin table > version column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.agents-using-plugin.header-status">
              <FormattedMessage defaultMessage="Status" description="Agents-using-plugin table > status column" />
            </TableHeader>
          </TableRow>
          {usages.map(({ agentOrganization, agentName, agentVersion }) => (
            <TableRow key={`${agentOrganization}/${agentName}@${agentVersion.version}`}>
              <TableCell ellipsis>
                <Link
                  componentId="mlflow.agent-plugins.agents-using-plugin.agent-link"
                  to={AgentRegistryRoutes.getAgentPageRoute(agentOrganization, agentName, agentVersion.version)}
                >
                  {getAgentQualifiedName(agentOrganization, agentName)}
                </Link>
              </TableCell>
              <TableCell ellipsis>{agentVersion.version}</TableCell>
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
              defaultMessage="No registered agent references this version."
              description="Plugin version pane > no agents using this plugin version"
            />
          </Typography.Text>
        </div>
      )}
    </div>
  );
};
