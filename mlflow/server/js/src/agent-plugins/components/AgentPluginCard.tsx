import { Button, Card, PlayIcon, PlugIcon, Tooltip, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { RegistryIconImage } from '../../common/components/RegistryIcon';
import { useNavigate } from '../../common/utils/RoutingUtils';
import {
  cardBodyStyles,
  cardHeaderRowStyles,
  noShrinkStyles,
  textClampStyles,
  textEllipsisStyles,
} from '../../skills-registry/styles';
import { SkillTagsCell } from '../../skills-registry/components/SkillCellRenderers';
import { SkillStatus } from '../../skills-registry/types';
import { PluginMemberCountsCell } from './AgentPluginCellRenderers';
import { AgentPluginPullModal } from './AgentPluginPullModal';
import { getPluginQualifiedName } from '../constants';
import { AgentPluginsRoutes } from '../routes';
import type { AgentPluginEntity, AgentPluginVersionEntity } from '../types';
import { getManifestDescription } from '../utils';

/** How far a non-active card's icon fades; the skills card's value (demo-prep#41). */
const INACTIVE_ICON_OPACITY = 0.5;

/**
 * One agent plugin as a card, matching the skill and MCP server cards: same `Card`, same
 * header row (icon, name, version), clamped description, tags, and a footer pairing the
 * organization with the single "Use" action. No `@org` line under the name (the full
 * `@org/name` is in the name's tooltip) and no status tag: status is carried by contrast, the
 * way the MCP and skill cards do it, so a plugin whose latest live version is not active
 * drops its icon to half opacity and its name, tags and action to secondary grey.
 *
 * Two plugin-specific things. The description falls back to the manifest's when the parent
 * has none, which RFC-0008 explicitly allows the UI to do. And the member badges under it
 * are RFC-0010's gallery journey: "13 skills · 2 MCP servers" is the fact that tells two
 * plugins apart at a glance, the way a version number does for an MCP server.
 */
export const AgentPluginCard = ({
  plugin,
  latestVersion,
}: {
  plugin: AgentPluginEntity;
  /** The plugin's latest-resolved version, used for status, members and the pull snippet. */
  latestVersion?: AgentPluginVersionEntity;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const navigate = useNavigate();
  const [pullModalOpen, setPullModalOpen] = useState(false);

  const qualifiedName = getPluginQualifiedName(plugin.organization, plugin.name);
  const description = plugin.description || (latestVersion ? getManifestDescription(latestVersion.plugin_json) : '');
  const hasTags = plugin.tags.length > 0;
  const isActive = latestVersion?.status === SkillStatus.ACTIVE;
  // Faded on the image AND the placeholder: RegistryIconImage leaves the placeholder untouched.
  const iconStyles = { ...noShrinkStyles, ...(isActive ? {} : { opacity: INACTIVE_ICON_OPACITY }) };
  // Button ignores `css` and importantifies its colour, hence a wrapper with `&&` and !important.
  const inactiveActionStyles = {
    '&& button:enabled, && button:enabled:hover, && button:enabled:active': {
      color: `${theme.colors.textSecondary} !important`,
    },
  };

  return (
    <>
      <Card
        componentId="mlflow.agent-plugins.card"
        width="100%"
        navigateFn={async () => {
          navigate(AgentPluginsRoutes.getPluginPageRoute(plugin.organization, plugin.name));
        }}
        dangerouslyAppendEmotionCSS={{
          height: '100%',
          '& > div': { display: 'flex', flexDirection: 'column', flexGrow: 1 },
        }}
      >
        <div css={cardBodyStyles(theme)}>
          <div css={cardHeaderRowStyles(theme)}>
            <RegistryIconImage
              icons={plugin.icons}
              name={plugin.name}
              placeholder={<PlugIcon css={iconStyles} />}
              css={iconStyles}
            />
            <Tooltip componentId="mlflow.agent-plugins.card.name.tooltip" content={qualifiedName}>
              <Typography.Text bold color={isActive ? undefined : 'secondary'} css={{ ...textEllipsisStyles, flex: 1 }}>
                {plugin.name}
              </Typography.Text>
            </Tooltip>
            {plugin.latest_version && (
              <Typography.Text color="secondary" size="sm" css={noShrinkStyles}>
                {plugin.latest_version}
              </Typography.Text>
            )}
          </div>

          {description && (
            <Typography.Text color="secondary" size="sm" css={textClampStyles(hasTags ? 2 : 3)}>
              {description}
            </Typography.Text>
          )}

          {latestVersion && <PluginMemberCountsCell members={latestVersion.members} />}

          {hasTags && <SkillTagsCell tags={plugin.tags} muted={!isActive} />}

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
              {plugin.organization && (
                <Typography.Text color="secondary" size="sm" css={textEllipsisStyles}>
                  @{plugin.organization}
                </Typography.Text>
              )}
            </div>
            <span css={{ display: 'inline-flex', ...noShrinkStyles, ...(isActive ? {} : inactiveActionStyles) }}>
              <Tooltip
                componentId="mlflow.agent-plugins.card.pull.tooltip"
                content={intl.formatMessage({
                  defaultMessage: 'Show the command to pull this plugin',
                  description: 'Tooltip on the agent plugin card pull button',
                })}
              >
                <Button
                  componentId="mlflow.agent-plugins.card.pull"
                  type="tertiary"
                  size="small"
                  icon={<PlayIcon />}
                  aria-label={intl.formatMessage(
                    {
                      defaultMessage: 'Use {name}',
                      description: 'Aria label for the pull button on an agent plugin card',
                    },
                    { name: qualifiedName },
                  )}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setPullModalOpen(true);
                  }}
                >
                  <FormattedMessage
                    defaultMessage="Use"
                    description="Label for the pull button on an agent plugin card"
                  />
                </Button>
              </Tooltip>
            </span>
          </div>
        </div>
      </Card>

      <AgentPluginPullModal
        visible={pullModalOpen}
        plugin={plugin}
        pluginVersion={latestVersion}
        onClose={() => setPullModalOpen(false)}
      />
    </>
  );
};
