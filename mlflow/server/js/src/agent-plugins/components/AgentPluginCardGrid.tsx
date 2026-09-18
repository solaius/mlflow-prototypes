import { Empty, PlugIcon, SearchIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { cardGridStyles, flexColumnContainerStyles } from '../../skills-registry/styles';
import { AgentPluginCard } from './AgentPluginCard';
import type { AgentPluginEntity, AgentPluginVersionEntity } from '../types';

export interface AgentPluginCardGridProps {
  plugins: AgentPluginEntity[];
  /** Latest-resolved version per plugin, keyed `{organization}/{name}`. */
  latestVersionByKey: Map<string, AgentPluginVersionEntity>;
  isFiltered: boolean;
  pagination?: React.ReactElement;
}

/**
 * Card layout for the agent plugins list, on the same responsive grid as the skill and MCP
 * server cards so the registries read as one product. Empty states are split the way the
 * table's are: "no results for this filter" and "nothing registered yet" call for
 * different next actions.
 */
export const AgentPluginCardGrid = ({
  plugins,
  latestVersionByKey,
  isFiltered,
  pagination,
}: AgentPluginCardGridProps) => {
  const { theme } = useDesignSystemTheme();

  if (!plugins.length) {
    return (
      <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
        {isFiltered ? (
          <Empty
            image={<SearchIcon />}
            data-testid="plugin-card-grid-no-results"
            description={
              <FormattedMessage
                defaultMessage="No results. Try using a different keyword or clearing a filter."
                description="Agent plugins card grid > no results after filtering"
              />
            }
          />
        ) : (
          <Empty
            image={<PlugIcon />}
            title={
              <FormattedMessage
                defaultMessage="No agent plugins registered"
                description="Agent plugins card grid > empty state title"
              />
            }
            description={
              <FormattedMessage
                defaultMessage="Assemble a plugin from registered skills, or import a package."
                description="Agent plugins card grid > empty state description"
              />
            }
          />
        )}
      </div>
    );
  }

  return (
    <div css={{ ...flexColumnContainerStyles, minHeight: 0 }}>
      <div role="list" aria-label="Agent plugins" css={cardGridStyles(theme)} data-testid="plugin-card-grid">
        {plugins.map((plugin) => (
          <div role="listitem" key={`${plugin.organization}/${plugin.name}`}>
            <AgentPluginCard
              plugin={plugin}
              latestVersion={latestVersionByKey.get(`${plugin.organization}/${plugin.name}`)}
            />
          </div>
        ))}
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
