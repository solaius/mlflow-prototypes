import { Card, Tooltip, Typography, useDesignSystemTheme } from '@databricks/design-system';

import { useNavigate } from '../../common/utils/RoutingUtils';
import {
  cardBodyStyles,
  cardHeaderRowStyles,
  noShrinkStyles,
  textClampStyles,
  textEllipsisStyles,
} from '../../skills-registry/styles';
import { SkillTagsCell } from '../../skills-registry/components/SkillCellRenderers';
import { AgentIconBox, AnchorKindTag, ProtocolTag } from './AgentCellRenderers';
import { getAgentQualifiedName } from '../constants';
import { AgentRegistryRoutes } from '../routes';
import type { AgentBindingProtocol, AgentEntity, AgentVersionEntity } from '../types';
import { AgentStatus, getAnchorKind } from '../types';

/**
 * One agent as a card, matching the skill and plugin cards: same `Card`, header row (icon,
 * name, latest version), `@org` line, clamped description, tags, and a footer with status
 * and timestamp. The agent-specific facts are the binding protocols it is reachable over
 * and, when it is one, the interface-only marker.
 */
export const AgentCard = ({
  agent,
  latestVersion,
  protocols,
}: {
  agent: AgentEntity;
  latestVersion?: AgentVersionEntity;
  protocols: Set<AgentBindingProtocol>;
}) => {
  const { theme } = useDesignSystemTheme();
  const navigate = useNavigate();
  const qualifiedName = getAgentQualifiedName(agent.organization, agent.name);
  const anchorKind = latestVersion ? getAnchorKind(latestVersion) : undefined;
  const hasTags = agent.tags.length > 0;
  // Status by contrast, the skills and MCP cards' treatment: an agent whose latest live version
  // is not active recedes (icon at half opacity, name and tags in secondary grey).
  const isActive = agent.status === AgentStatus.ACTIVE;

  return (
    <Card
      componentId="mlflow.agent-registry.card"
      width="100%"
      navigateFn={async () => navigate(AgentRegistryRoutes.getAgentPageRoute(agent.organization, agent.name))}
      dangerouslyAppendEmotionCSS={{
        height: '100%',
        '& > div': { display: 'flex', flexDirection: 'column', flexGrow: 1 },
      }}
    >
      <div css={cardBodyStyles(theme)}>
        <div css={cardHeaderRowStyles(theme)}>
          <span css={{ display: 'inline-flex', flexShrink: 0, opacity: isActive ? 1 : 0.5 }}>
            <AgentIconBox
              icons={agent.icons}
              name={agent.name}
              hasA2A={protocols.has('a2a' as AgentBindingProtocol)}
              size={24}
            />
          </span>
          <Tooltip componentId="mlflow.agent-registry.card.name.tooltip" content={qualifiedName}>
            <Typography.Text bold color={isActive ? undefined : 'secondary'} css={{ ...textEllipsisStyles, flex: 1 }}>
              {agent.name}
            </Typography.Text>
          </Tooltip>
          {agent.latest_version && (
            <Typography.Text color="secondary" size="sm" css={noShrinkStyles}>
              v{agent.latest_version}
            </Typography.Text>
          )}
        </div>

        <Typography.Text color="secondary" size="sm" css={textClampStyles(hasTags ? 2 : 3)}>
          {agent.description}
        </Typography.Text>

        <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {[...protocols].map((protocol) => (
            <ProtocolTag key={protocol} protocol={protocol} />
          ))}
          {anchorKind === 'interface-only' && <AnchorKindTag kind={anchorKind} />}
        </div>

        {hasTags && <SkillTagsCell tags={agent.tags} muted={!isActive} />}

        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
            marginTop: 'auto',
          }}
        >
          <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, minWidth: 0 }}>
            {/* `@org` where the timestamp was, and no status tag (stakeholder#4, demo-prep#34). */}
            {agent.organization && (
              <Typography.Text color="secondary" size="sm" css={textEllipsisStyles}>
                @{agent.organization}
              </Typography.Text>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
