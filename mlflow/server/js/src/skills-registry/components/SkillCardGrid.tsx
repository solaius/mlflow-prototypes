import { Empty, PuzzleIcon, SearchIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { SkillCard } from './SkillCard';
import type { SkillEntity, SkillVersionEntity } from '../types';
import { cardGridStyles, flexColumnContainerStyles } from '../styles';

export interface SkillCardGridProps {
  skills: SkillEntity[];
  /** Latest live version per skill, keyed `{organization}/{name}`. */
  latestVersionByKey: Map<string, SkillVersionEntity>;
  isFiltered: boolean;
  /** Pagination control, rendered below the grid so both layouts page identically. */
  pagination?: React.ReactElement;
}

/**
 * Card layout for the skills list, mirroring `MCPServerCardGrid`: the same responsive
 * `auto-fill` grid, the same empty states, and pagination docked underneath.
 *
 * The empty states are split the way the table's are, because "no results for this
 * filter" and "nothing registered yet" call for different next actions and collapsing
 * them into one message loses that.
 */
export const SkillCardGrid = ({ skills, latestVersionByKey, isFiltered, pagination }: SkillCardGridProps) => {
  const { theme } = useDesignSystemTheme();

  if (!skills.length) {
    return (
      <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
        {isFiltered ? (
          <Empty
            image={<SearchIcon />}
            data-testid="skill-card-grid-no-results"
            description={
              <FormattedMessage
                defaultMessage="No results. Try using a different keyword or clearing a filter."
                description="Skills registry card grid > no results after filtering"
              />
            }
          />
        ) : (
          <Empty
            image={<PuzzleIcon />}
            title={
              <FormattedMessage
                defaultMessage="No skills registered"
                description="Skills registry card grid > empty state title"
              />
            }
            description={
              <FormattedMessage
                defaultMessage="Register a skill to version and share it with your team."
                description="Skills registry card grid > empty state description"
              />
            }
          />
        )}
      </div>
    );
  }

  return (
    <div css={{ ...flexColumnContainerStyles, minHeight: 0 }}>
      <div role="list" aria-label="Skills" css={cardGridStyles(theme)} data-testid="skill-card-grid">
        {skills.map((skill) => (
          <div role="listitem" key={`${skill.organization}/${skill.name}`}>
            <SkillCard skill={skill} latestVersion={latestVersionByKey.get(`${skill.organization}/${skill.name}`)} />
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
