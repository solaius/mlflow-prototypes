import { Button, PencilIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { SkillTagsCell } from './SkillCellRenderers';
import type { SkillTag } from '../types';

/**
 * The skill's tags as a bare chip row with an inline editor affordance, rendered directly
 * under the page title. Mirrors the prompt details page's `PromptsListTableTagsBox`: a
 * pencil once there are tags to correct, and a labelled "Add tags" button when there are
 * none, since a lone pencil beside empty space reads as decoration.
 */
export const SkillTagsBox = ({ tags, onEdit }: { tags: SkillTag[]; onEdit: () => void }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  const containsTags = tags.length > 0;

  return (
    <div
      css={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
      }}
    >
      {/*
        Guarded rather than handed an empty list: `SkillTagsCell` falls back to a dash, which
        reads as stray punctuation under the title once the "Tags" caption is gone.
      */}
      {containsTags && <SkillTagsCell tags={tags} />}
      <Button
        componentId="mlflow.skills-registry.skill-page.tags.edit"
        size="small"
        type="tertiary"
        icon={containsTags ? <PencilIcon /> : undefined}
        onClick={onEdit}
        aria-label={intl.formatMessage({
          defaultMessage: 'Edit tags',
          description: 'Skills registry > skill page > aria label for the edit tags button',
        })}
      >
        {containsTags ? undefined : (
          <FormattedMessage
            defaultMessage="Add tags"
            description="Skills registry > skill page > label for the add tags button"
          />
        )}
      </Button>
    </div>
  );
};
