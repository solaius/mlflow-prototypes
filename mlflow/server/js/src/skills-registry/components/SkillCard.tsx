import {
  Button,
  Card,
  PlayIcon,
  PuzzleIcon,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { RegistryIconImage } from '../../common/components/RegistryIcon';

import { SkillTagsCell } from './SkillCellRenderers';
import { SkillPullModal } from './SkillPullModal';
import { getSkillQualifiedName } from '../constants';
import { SkillsRegistryRoutes } from '../routes';
import type { SkillEntity, SkillVersionEntity } from '../types';
import { SkillStatus } from '../types';
import { cardBodyStyles, cardHeaderRowStyles, noShrinkStyles, textClampStyles, textEllipsisStyles } from '../styles';
import { useNavigate } from '../../common/utils/RoutingUtils';

/**
 * How far a non-active card's icon fades.
 *
 * Text has a colour token for this; publisher art does not. `RegistryIconImage` will not
 * recolour someone's logo — it cannot know what the mark is supposed to look like — so
 * opacity is the only lever, and 0.5 drops the icon by about as much as `textSecondary`
 * drops the words beside it.
 */
const INACTIVE_ICON_OPACITY = 0.5;

export interface SkillCardProps {
  skill: SkillEntity;
  /** The skill's latest live version, used for the pull snippet. */
  latestVersion?: SkillVersionEntity;
}

/**
 * One skill as a card, mirroring the MCP server registry's `MCPServerCard`: same
 * `Card` component, same header row (icon, name, version), clamped description, tags,
 * and a footer pairing the timestamp with a single action button.
 *
 * The action is "Use", opening the pull snippets. It stops propagation so clicking it
 * does not also navigate into the detail page, exactly as the MCP card's connect button
 * does, because a card that is itself a link needs its inner button to say so.
 *
 * Status is carried by CONTRAST rather than by a badge, again as the MCP cards do: an
 * active skill reads at full strength, anything else drops its name, tags and action to
 * the same secondary grey the description and timestamp already use. That keeps the
 * lifecycle legible while scanning a grid without spending a chip on every card.
 */
export const SkillCard = ({ skill, latestVersion }: SkillCardProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const navigate = useNavigate();
  const [pullModalOpen, setPullModalOpen] = useState(false);

  const qualifiedName = getSkillQualifiedName(skill.organization, skill.name);
  const hasTags = skill.tags.length > 0;

  /*
    Whether this card reads at full strength. The status belongs to the latest LIVE version,
    which is also what the "Use" button pulls, so a card is only as current as the thing it
    hands you. A skill with no live version at all is dimmed too: there is nothing active
    behind it either.
  */
  const isActive = latestVersion?.status === SkillStatus.ACTIVE;

  /*
    Passed to the icon AND to its placeholder. `RegistryIconImage` styles the chip a
    registered icon sits on, but renders the placeholder glyph untouched — it is the
    caller's own element — so the two have to be faded separately or one of the branches
    keeps a full-strength mark.
  */
  const iconStyles = { ...noShrinkStyles, ...(isActive ? {} : { opacity: INACTIVE_ICON_OPACITY }) };

  /*
    Greying the Use button has to be done from a wrapper, with `!important`, and neither part
    is optional.

    `Button` ignores a `css` prop: it spreads the caller's props and then sets its own `css`
    after them, so anything passed in is overwritten. (That is also why the blue this
    replaces was doing nothing — the button was already tertiary blue on its own.) And its
    type colours go through DuBois' `importantify`, landing as `color: <blue> !important` on
    `&:enabled:not(.btn-icon-only)`, so the override has to beat both the flag and the
    specificity. `&&` doubles this wrapper's class to get there. Hover and press are listed
    too, or the button flashes blue under the cursor.

    The wrapper sits OUTSIDE the tooltip so the Tooltip/Button pairing is untouched and the
    tooltip still describes the button itself rather than a styling div.
  */
  const inactiveActionStyles = {
    '&& button:enabled, && button:enabled:hover, && button:enabled:active': {
      color: `${theme.colors.textSecondary} !important`,
    },
  };

  return (
    <>
      <Card
        componentId="mlflow.skills-registry.card"
        width="100%"
        navigateFn={async () => {
          navigate(SkillsRegistryRoutes.getSkillPageRoute(skill.organization, skill.name));
        }}
        dangerouslyAppendEmotionCSS={{
          height: '100%',
          '& > div': { display: 'flex', flexDirection: 'column', flexGrow: 1 },
        }}
      >
        <div css={cardBodyStyles(theme)}>
          <div css={cardHeaderRowStyles(theme)}>
            <RegistryIconImage
              icons={skill.icons}
              name={skill.name}
              placeholder={<PuzzleIcon css={iconStyles} />}
              css={iconStyles}
            />
            <Tooltip componentId="mlflow.skills-registry.card.name.tooltip" content={qualifiedName}>
              <Typography.Text bold color={isActive ? undefined : 'secondary'} css={{ ...textEllipsisStyles, flex: 1 }}>
                {skill.name}
              </Typography.Text>
            </Tooltip>
            <Typography.Text color="secondary" size="sm" css={noShrinkStyles}>
              v{skill.latest_version}
            </Typography.Text>
          </div>

          {skill.description && (
            <Typography.Text color="secondary" size="sm" css={textClampStyles(hasTags ? 2 : 3)}>
              {skill.description}
            </Typography.Text>
          )}

          {hasTags && <SkillTagsCell tags={skill.tags} muted={!isActive} />}

          <div
            css={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: theme.spacing.sm,
              marginTop: 'auto',
            }}
          >
            {/* No status tag here -- a card is a browse surface, and the status of the latest
                version belongs beside the version itself on the detail page. */}
            <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, minWidth: 0 }}>
              {skill.organization && (
                <Typography.Text color="secondary" size="sm" css={textEllipsisStyles}>
                  @{skill.organization}
                </Typography.Text>
              )}
            </div>
            {/*
              Tertiary blue only while the skill is active -- and that blue comes from the
              button's own type, not from anything set here. On a deprecated or draft skill it
              was the brightest thing on an otherwise grey card, reading as a recommendation
              to pull exactly the version you should not.
            */}
            <span css={{ display: 'inline-flex', ...noShrinkStyles, ...(isActive ? {} : inactiveActionStyles) }}>
              <Tooltip
                componentId="mlflow.skills-registry.card.pull.tooltip"
                content={intl.formatMessage({
                  defaultMessage: 'Show the command to pull this skill',
                  description: 'Tooltip on the skill card pull button',
                })}
              >
                <Button
                  componentId="mlflow.skills-registry.card.pull"
                  type="tertiary"
                  size="small"
                  icon={<PlayIcon />}
                  aria-label={intl.formatMessage(
                    {
                      defaultMessage: 'Use {name}',
                      description: 'Aria label for the pull button on a skill card',
                    },
                    { name: qualifiedName },
                  )}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setPullModalOpen(true);
                  }}
                >
                  <FormattedMessage defaultMessage="Use" description="Label for the pull button on a skill card" />
                </Button>
              </Tooltip>
            </span>
          </div>
        </div>
      </Card>

      <SkillPullModal
        visible={pullModalOpen}
        skill={skill}
        skillVersion={latestVersion}
        onClose={() => setPullModalOpen(false)}
      />
    </>
  );
};
