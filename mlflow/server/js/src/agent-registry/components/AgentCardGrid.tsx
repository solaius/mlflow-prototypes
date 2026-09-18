import { Empty, RobotIcon, SearchIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { cardGridStyles, flexColumnContainerStyles } from '../../skills-registry/styles';
import { AgentCard } from './AgentCard';
import { getAgentQualifiedName } from '../constants';
import type { AgentBindingProtocol, AgentEntity, AgentVersionEntity } from '../types';

export const AgentCardGrid = ({
  agents,
  latestVersionByKey,
  protocolsByKey,
  isFiltered,
  pagination,
}: {
  agents: AgentEntity[];
  latestVersionByKey: Map<string, AgentVersionEntity>;
  protocolsByKey: Map<string, Set<AgentBindingProtocol>>;
  isFiltered: boolean;
  pagination?: React.ReactElement;
}) => {
  const { theme } = useDesignSystemTheme();

  if (!agents.length) {
    return (
      <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
        {isFiltered ? (
          <Empty
            image={<SearchIcon />}
            data-testid="agent-card-grid-no-results"
            description={
              <FormattedMessage
                defaultMessage="No results. Try using a different keyword or clearing a filter."
                description="Agent registry card grid > no results after filtering"
              />
            }
          />
        ) : (
          <Empty
            image={<RobotIcon />}
            title={
              <FormattedMessage
                defaultMessage="No agents registered"
                description="Agent registry card grid > empty state title"
              />
            }
            description={
              <FormattedMessage
                defaultMessage="Register an agent to record what it is made of, where it runs, and how well it works."
                description="Agent registry card grid > empty state description"
              />
            }
          />
        )}
      </div>
    );
  }

  return (
    <div css={{ ...flexColumnContainerStyles, minHeight: 0 }}>
      <div role="list" aria-label="Agents" css={cardGridStyles(theme)} data-testid="agent-card-grid">
        {agents.map((agent) => {
          const key = `${agent.organization}/${agent.name}`;
          return (
            <div role="listitem" key={key}>
              <AgentCard
                agent={agent}
                latestVersion={latestVersionByKey.get(key)}
                protocols={protocolsByKey.get(getAgentQualifiedName(agent.organization, agent.name)) ?? new Set()}
              />
            </div>
          );
        })}
      </div>
      {pagination && (
        <div
          css={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
          }}
        >
          {pagination}
        </div>
      )}
    </div>
  );
};
