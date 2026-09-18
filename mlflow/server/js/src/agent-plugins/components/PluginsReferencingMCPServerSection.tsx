import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import { PluginStatusTag } from './AgentPluginCellRenderers';
import { getPluginQualifiedName } from '../constants';
import { usePluginsReferencingMCPServer } from '../hooks/usePluginsContainingSkill';
import { AgentPluginsRoutes } from '../routes';

/**
 * "Referenced by agent plugins" on an MCP server -- RFC-0010's deprecation journey: "the
 * MCP server version detail page shows a Referenced by section listing the agent plugin
 * versions that reference it". This is the query that cannot be answered while server
 * configuration is embedded in packages, and the reason the cross-registry reference
 * exists at all.
 */
export const PluginsReferencingMCPServerSection = ({
  serverName,
  serverVersion,
}: {
  serverName: string;
  /** When given, narrows to plugin versions referencing this exact server version. */
  serverVersion?: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const references = usePluginsReferencingMCPServer(serverName, serverVersion);

  return (
    <div>
      <Typography.Title level={4}>
        <FormattedMessage
          defaultMessage="Referenced by agent plugins ({count})"
          description="MCP server detail > plugins referencing this server heading"
          values={{ count: references.length }}
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary">
        <FormattedMessage
          defaultMessage="Agent plugin versions whose membership references this server. Deprecating a server version surfaces here as the plugins it would affect."
          description="MCP server detail > plugins referencing this server caption"
        />
      </Typography.Paragraph>
      {references.length ? (
        <Table data-testid="plugins-referencing-mcp-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-referencing-mcp.header-plugin">
              <FormattedMessage defaultMessage="Agent plugin" description="Referenced-by table > plugin column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-referencing-mcp.header-version">
              <FormattedMessage
                defaultMessage="Plugin version"
                description="Referenced-by table > plugin version column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-referencing-mcp.header-referenced">
              <FormattedMessage
                defaultMessage="Server version referenced"
                description="Referenced-by table > server version column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-referencing-mcp.header-status">
              <FormattedMessage defaultMessage="Status" description="Referenced-by table > status column" />
            </TableHeader>
          </TableRow>
          {references.map(({ pluginVersion, referencedVersion }) => (
            <TableRow key={`${pluginVersion.organization}/${pluginVersion.name}@${pluginVersion.version}`}>
              <TableCell ellipsis>
                <Link
                  componentId="mlflow.agent-plugins.plugins-referencing-mcp.plugin-link"
                  to={AgentPluginsRoutes.getPluginVersionPageRoute(
                    pluginVersion.organization,
                    pluginVersion.name,
                    pluginVersion.version,
                  )}
                >
                  {getPluginQualifiedName(pluginVersion.organization, pluginVersion.name)}
                </Link>
              </TableCell>
              <TableCell ellipsis>{pluginVersion.version}</TableCell>
              <TableCell ellipsis>
                {referencedVersion ?? <Typography.Text color="secondary">not connected</Typography.Text>}
              </TableCell>
              <TableCell ellipsis>
                <PluginStatusTag status={pluginVersion.status} />
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
              defaultMessage="No registered agent plugin references this server."
              description="MCP server detail > no plugins referencing this server"
            />
          </Typography.Text>
        </div>
      )}
    </div>
  );
};
