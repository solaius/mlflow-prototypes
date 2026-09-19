import { Button, CloseIcon, Input, PlusIcon, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { SkillTag } from '../types';

export interface SkillTagsEditorProps {
  componentId: string;
  value: SkillTag[];
  onChange: (tags: SkillTag[]) => void;
}

/**
 * Key/value tag editor for the create and add-version forms.
 *
 * Exists because of a gap the 2026-09-01 UX review found by holding two registries side
 * by side: the MCP server registry lets you set tags while creating a server AND edit
 * them afterwards, and the skills registry let you do neither, even though RFC-0008
 * carries tags at both the entity and version level with `set_skill_tag` /
 * `delete_skill_tag` endpoints for each. It was a UI gap, not a spec gap.
 *
 * Tags are a MAP, not a list: `set_skill_tag` upserts one key. So a key already present
 * is overwritten rather than appended, which is why adding a duplicate key silently
 * replaces the existing row instead of producing two rows the API could never return.
 */
export const SkillTagsEditor = ({ componentId, value, onChange }: SkillTagsEditorProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const trimmedKey = draftKey.trim();
  const canAdd = trimmedKey.length > 0;

  const addTag = () => {
    if (!canAdd) {
      return;
    }
    const withoutKey = value.filter((tag) => tag.key !== trimmedKey);
    onChange([...withoutKey, { key: trimmedKey, value: draftValue.trim() }]);
    setDraftKey('');
    setDraftValue('');
  };

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      {value.length > 0 && (
        <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {value.map((tag) => (
            <div
              key={tag.key}
              css={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `2px ${theme.spacing.xs}px`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borders.borderRadiusSm,
                backgroundColor: theme.colors.backgroundSecondary,
              }}
            >
              <Typography.Text size="sm">{tag.value ? `${tag.key}: ${tag.value}` : tag.key}</Typography.Text>
              <Button
                componentId={`${componentId}.remove`}
                size="small"
                type="tertiary"
                icon={<CloseIcon />}
                aria-label={intl.formatMessage(
                  {
                    defaultMessage: 'Remove tag {key}',
                    description: 'Skills registry > tag editor > remove tag button label',
                  },
                  { key: tag.key },
                )}
                onClick={() => onChange(value.filter((entry) => entry.key !== tag.key))}
              />
            </div>
          ))}
        </div>
      )}

      <div css={{ display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
        <Input
          componentId={`${componentId}.key`}
          value={draftKey}
          onChange={(event) => setDraftKey(event.target.value)}
          placeholder={intl.formatMessage({
            defaultMessage: 'Key',
            description: 'Skills registry > tag editor > key placeholder',
          })}
          css={{ flex: 1 }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <Input
          componentId={`${componentId}.value`}
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          placeholder={intl.formatMessage({
            defaultMessage: 'Value',
            description: 'Skills registry > tag editor > value placeholder',
          })}
          css={{ flex: 1 }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <Button componentId={`${componentId}.add`} icon={<PlusIcon />} disabled={!canAdd} onClick={addTag}>
          <FormattedMessage defaultMessage="Add" description="Skills registry > tag editor > add tag button" />
        </Button>
      </div>
    </div>
  );
};
