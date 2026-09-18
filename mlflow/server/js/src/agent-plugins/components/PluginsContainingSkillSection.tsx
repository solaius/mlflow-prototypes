import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import { PluginKindTag, PluginStatusTag } from './AgentPluginCellRenderers';
import { getPluginQualifiedName } from '../constants';
import { usePluginsContainingSkill } from '../hooks/usePluginsContainingSkill';
import { AgentPluginsRoutes } from '../routes';
import { getPluginVersionKind } from '../utils';

export interface PluginsContainingSkillSectionProps {
  /** `@organization/name`, the reference form plugin members record skills by. */
  qualifiedSkillName: string;
  /** When given, narrows to plugin versions pinning this exact skill version. */
  skillVersion?: number;
}

/**
 * "Packaged in agent plugins" -- the reverse of the membership rows each plugin version
 * records.
 *
 * This answers the question a skill owner asks before changing or withdrawing a version:
 * what ships this? Plugins pin exact skill versions, so a withdrawal is not a private
 * decision, and the skill page is where the consequence has to be visible. Nothing else
 * can answer it: the skill stores no memberships, and the RFC deliberately keeps it that
 * way, directing clients to search plugins by member name instead.
 *
 * It sits beside "Used by agents" rather than replacing it, because they are different
 * dependencies. An agent pins a skill directly; a plugin packages it for distribution.
 */
export const PluginsContainingSkillSection = ({
  qualifiedSkillName,
  skillVersion,
}: PluginsContainingSkillSectionProps) => {
  const { theme } = useDesignSystemTheme();
  const memberships = usePluginsContainingSkill(qualifiedSkillName, skillVersion);

  return (
    <div>
      <Typography.Title level={4}>
        <FormattedMessage
          defaultMessage="Packaged in agent plugins ({count})"
          description="Skill version pane > plugins containing this skill heading"
          values={{ count: memberships.length }}
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary">
        <FormattedMessage
          defaultMessage="Agent plugin versions that include this exact skill version as a member. Deleting this version withdraws every plugin version listed here. Deprecating it doesn't affect them: the version still resolves and pulls, and just shows as deprecated in the registry."
          description="Skill version pane > plugins containing this skill caption"
        />
      </Typography.Paragraph>

      {memberships.length ? (
        <Table data-testid="plugins-containing-skill-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-containing-skill.header-plugin">
              <FormattedMessage
                defaultMessage="Agent plugin"
                description="Plugins-containing-skill table > plugin column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-containing-skill.header-version">
              <FormattedMessage
                defaultMessage="Plugin version"
                description="Plugins-containing-skill table > version column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-containing-skill.header-kind">
              <FormattedMessage defaultMessage="Kind" description="Plugins-containing-skill table > kind column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-plugins.plugins-containing-skill.header-status">
              <FormattedMessage defaultMessage="Status" description="Plugins-containing-skill table > status column" />
            </TableHeader>
          </TableRow>
          {memberships.map(({ pluginVersion }) => (
            <TableRow key={`${pluginVersion.organization}/${pluginVersion.name}@${pluginVersion.version}`}>
              <TableCell ellipsis>
                <Link
                  componentId="mlflow.agent-plugins.plugins-containing-skill.plugin-link"
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
                <PluginKindTag kind={getPluginVersionKind(pluginVersion.source)} />
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
              defaultMessage="No registered agent plugin packages this version."
              description="Skill version pane > no plugins containing this skill version"
            />
          </Typography.Text>
        </div>
      )}
    </div>
  );
};
