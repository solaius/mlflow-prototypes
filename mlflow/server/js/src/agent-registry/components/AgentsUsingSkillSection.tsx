import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import { AgentStatusTag } from './AgentCellRenderers';
import { getAgentQualifiedName } from '../constants';
import { useAgentsUsingSkill } from '../hooks/useAgentsUsingSkill';
import { AgentRegistryRoutes } from '../routes';

export interface AgentsUsingSkillSectionProps {
  skillName: string;
  /** When given, narrows to agent versions pinning this exact skill version. */
  skillVersion?: number;
}

/**
 * "Used by agents" -- the reverse of the pins recorded on each agent version, expanded
 * through agent plugin references as RFC-0011's blast-radius journey requires. A row that
 * arrived through a plugin says so: that is the difference between "talk to the agent's
 * owner" and "talk to the plugin's owner".
 *
 * Reads registry records exclusively; no runtime data is consulted, and none is needed.
 */
export const AgentsUsingSkillSection = ({ skillName, skillVersion }: AgentsUsingSkillSectionProps) => {
  const { theme } = useDesignSystemTheme();
  const usages = useAgentsUsingSkill(skillName, skillVersion);

  return (
    <div>
      <Typography.Title level={4}>
        <FormattedMessage
          defaultMessage="Used by agents ({count})"
          description="Skill version pane > agents using this skill heading"
          values={{ count: usages.length }}
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary">
        <FormattedMessage
          defaultMessage="Registered agent versions whose bill of materials carries this exact skill version, directly or through an agent plugin. Deleting this version affects every one of them. Deprecating it doesn't: the version still resolves and pulls, and just shows as deprecated in the registry."
          description="Skill version pane > agents using this skill caption"
        />
      </Typography.Paragraph>

      {usages.length ? (
        <Table data-testid="agents-using-skill-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-skill.header-agent">
              <FormattedMessage defaultMessage="Agent" description="Agents-using-skill table > agent column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-skill.header-version">
              <FormattedMessage
                defaultMessage="Agent version"
                description="Agents-using-skill table > version column"
              />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-skill.header-via">
              <FormattedMessage defaultMessage="Through" description="Agents-using-skill table > via column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.agents-using-skill.header-status">
              <FormattedMessage defaultMessage="Status" description="Agents-using-skill table > status column" />
            </TableHeader>
          </TableRow>
          {usages.map(({ agentOrganization, agentName, agentVersion, via }) => (
            <TableRow key={`${agentOrganization}/${agentName}@${agentVersion.version}`}>
              <TableCell ellipsis>
                <Link
                  componentId="mlflow.agent-registry.agents-using-skill.agent-link"
                  to={AgentRegistryRoutes.getAgentVersionPageRoute(agentOrganization, agentName, agentVersion.version)}
                >
                  {getAgentQualifiedName(agentOrganization, agentName)}
                </Link>
              </TableCell>
              <TableCell ellipsis>{agentVersion.version}</TableCell>
              <TableCell ellipsis>
                {via ? (
                  <Typography.Text size="sm" color="secondary">
                    <FormattedMessage
                      defaultMessage="plugin {plugin} {version}"
                      description="Agents-using-skill table > via a plugin"
                      values={{ plugin: via.pluginName, version: via.pluginVersion }}
                    />
                  </Typography.Text>
                ) : (
                  <Typography.Text size="sm" color="secondary">
                    <FormattedMessage defaultMessage="direct pin" description="Agents-using-skill table > direct pin" />
                  </Typography.Text>
                )}
              </TableCell>
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
              defaultMessage="No registered agent carries this version."
              description="Skill version pane > no agents using this skill version"
            />
          </Typography.Text>
        </div>
      )}
    </div>
  );
};
