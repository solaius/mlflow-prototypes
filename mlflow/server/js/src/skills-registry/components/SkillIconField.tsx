import { useEffect, useState } from 'react';
import {
  Button,
  CloseIcon,
  FormUI,
  Input,
  PlusIcon,
  PuzzleIcon,
  SimpleSelect,
  SimpleSelectOption,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  resolveRegistryIcon,
  sanitizeIconHref,
  useIconFallback,
} from '../../common/components/RegistryIcon';
import type { RegistryIcon } from '../../common/components/RegistryIcon';

export interface SkillIconFieldProps {
  componentId: string;
  value: RegistryIcon[];
  onChange: (icons: RegistryIcon[]) => void;
}

const PREVIEW_ICON_SIZE = 28;
const PREVIEW_BOX_SIZE = 44;

type ThemeOption = 'Any' | 'Light' | 'Dark';

const themeOptionToValue = (option: ThemeOption): string | undefined =>
  option === 'Any' ? undefined : option.toLowerCase();

const themeValueToOption = (theme?: string): ThemeOption => {
  if (theme === 'light') return 'Light';
  if (theme === 'dark') return 'Dark';
  return 'Any';
};

const ThemeSelectOptions = () => (
  <>
    <SimpleSelectOption value="Any">
      <FormattedMessage defaultMessage="Any" description="Theme-agnostic icon option" />
    </SimpleSelectOption>
    <SimpleSelectOption value="Light">
      <FormattedMessage defaultMessage="Light" description="Light mode icon option" />
    </SimpleSelectOption>
    <SimpleSelectOption value="Dark">
      <FormattedMessage defaultMessage="Dark" description="Dark mode icon option" />
    </SimpleSelectOption>
  </>
);

const PreviewItem = ({
  isDark,
  icons,
  onLoadError,
}: {
  isDark: boolean;
  icons: RegistryIcon[];
  onLoadError?: (failedSrc: string) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const resolved = resolveRegistryIcon(icons, isDark);
  const sanitizedSrc = sanitizeIconHref(resolved?.src);
  const { activeSrc, onError: onIconError } = useIconFallback(sanitizedSrc, undefined);

  return (
    <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
      <Tooltip
        content={activeSrc ?? 'default'}
        componentId="mlflow.skills-registry.icon-editor.preview.tooltip"
      >
        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: PREVIEW_BOX_SIZE,
            height: PREVIEW_BOX_SIZE,
            borderRadius: theme.borders.borderRadiusSm,
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            border: `1px solid ${theme.colors.border}`,
            flexShrink: 0,
          }}
        >
          {activeSrc ? (
            <img
              src={activeSrc}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => {
                if (activeSrc === sanitizedSrc) {
                  onLoadError?.(resolved?.src ?? '');
                }
                onIconError();
              }}
              css={{ width: PREVIEW_ICON_SIZE, height: PREVIEW_ICON_SIZE, objectFit: 'contain' }}
            />
          ) : (
            <PuzzleIcon
              aria-hidden
              css={{
                fontSize: PREVIEW_ICON_SIZE,
                width: PREVIEW_ICON_SIZE,
                height: PREVIEW_ICON_SIZE,
                color: isDark ? theme.colors.textPlaceholder : theme.colors.textSecondary,
              }}
            />
          )}
        </div>
      </Tooltip>
      <Typography.Text color="secondary" size="sm">
        <FormattedMessage
          defaultMessage="{label} theme"
          description="Preview item theme label"
          values={{ label: isDark ? 'dark' : 'light' }}
        />
      </Typography.Text>
    </div>
  );
};

const IconRow = ({
  icon,
  index,
  placeholder,
  selectWidth,
  hasError,
  onChangeSrc,
  onChangeTheme,
  onRemove,
}: {
  icon: RegistryIcon;
  index: number;
  placeholder: string;
  selectWidth: number;
  hasError: boolean;
  onChangeSrc: (index: number, value: string) => void;
  onChangeTheme: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [localSrc, setLocalSrc] = useState(icon.src);

  useEffect(() => {
    setLocalSrc(icon.src);
  }, [icon.src]);

  return (
    <div css={{ display: 'flex', flexDirection: 'column' }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <div css={{ flex: 1 }}>
          <Input
            componentId="mlflow.skills-registry.icon-editor.url"
            value={localSrc}
            onChange={(e) => setLocalSrc(e.target.value)}
            onBlur={() => {
              if (localSrc !== icon.src) {
                onChangeSrc(index, localSrc);
              }
            }}
            placeholder={placeholder}
            validationState={hasError || !localSrc.trim() ? 'error' : undefined}
          />
        </div>
        <SimpleSelect
          id={`skills-registry-icon-editor-theme-${index}`}
          componentId="mlflow.skills-registry.icon-editor.theme"
          value={themeValueToOption(icon.theme)}
          onChange={({ target }) => onChangeTheme(index, target.value)}
          css={{ width: selectWidth }}
        >
          <ThemeSelectOptions />
        </SimpleSelect>
        <Tooltip
          content={intl.formatMessage({
            defaultMessage: 'Remove icon',
            description: 'Tooltip for remove icon button in skill icon editor',
          })}
          componentId="mlflow.skills-registry.icon-editor.remove.tooltip"
        >
          <Button
            componentId="mlflow.skills-registry.icon-editor.remove"
            onClick={() => onRemove(index)}
            aria-label={intl.formatMessage({
              defaultMessage: 'Remove icon',
              description: 'Aria label for remove icon button in skill icon editor',
            })}
            dangerouslySetAntdProps={{ danger: true }}
          >
            <CloseIcon />
          </Button>
        </Tooltip>
      </div>
      {!localSrc.trim() && (
        <FormUI.Message
          type="error"
          message={
            <FormattedMessage defaultMessage="Enter a valid URL" description="Error message when icon URL is empty" />
          }
        />
      )}
      {localSrc.trim() && hasError && (
        <FormUI.Message
          type="error"
          message={
            <FormattedMessage
              defaultMessage="Image failed to load"
              description="Error message when icon URL fails to load in preview"
            />
          }
        />
      )}
    </div>
  );
};

/**
 * Multi-icon editor matching the MCP server registry's `IconEditor`: confirmed rows
 * with URL + theme + remove, a draft row with URL + theme + add, and a preview strip
 * showing both light- and dark-theme renderings.
 *
 * Ported from `mlflow/server/js/src/mcp-registry/components/IconEditor.tsx` (MLflow 3.15),
 * adapted to use the shared `RegistryIcon` type and utilities from `common/components/RegistryIcon`.
 */
export const SkillIconField = ({ componentId, value, onChange }: SkillIconFieldProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  const [draftUrl, setDraftUrl] = useState('');
  const [draftTheme, setDraftTheme] = useState<ThemeOption>('Any');
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set());

  const handleSrcChange = (index: number, newSrc: string) => {
    setFailedSrcs((prev) => {
      if (!prev.has(value[index].src)) return prev;
      const next = new Set(prev);
      next.delete(value[index].src);
      return next;
    });
    onChange(value.map((icon, i) => (i === index ? { ...icon, src: newSrc } : icon)));
  };

  const handleThemeChange = (index: number, option: string) => {
    const updated = value.map((icon, i) => {
      if (i !== index) return icon;
      const themeVal = themeOptionToValue(option as ThemeOption);
      if (themeVal) return { ...icon, theme: themeVal };
      const { theme: _, ...rest } = icon;
      return rest;
    });
    onChange(updated);
  };

  const handleAddDraft = () => {
    const trimmed = draftUrl.trim();
    if (!trimmed) return;
    const newIcon: RegistryIcon = { src: trimmed };
    const themeVal = themeOptionToValue(draftTheme);
    if (themeVal) {
      newIcon.theme = themeVal;
    }
    onChange([...value, newIcon]);
    setDraftUrl('');
    setDraftTheme('Any');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleLoadError = (failedSrc: string) => {
    setFailedSrcs((prev) => {
      if (prev.has(failedSrc)) return prev;
      const next = new Set(prev);
      next.add(failedSrc);
      return next;
    });
  };

  const placeholder = intl.formatMessage({
    defaultMessage: 'https://example.com/icon.svg',
    description: 'Placeholder for icon URL input in skill icon editor',
  });

  const selectWidth = theme.spacing.xl * 4;
  const buttonSpacerWidth = theme.spacing.xl + theme.spacing.sm;

  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
        width: '100%',
        padding: theme.spacing.md,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.general.borderRadiusBase,
      }}
    >
      {/* Column headers */}
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <Typography.Text color="secondary" size="sm" css={{ flex: 1 }}>
          <FormattedMessage defaultMessage="Icon URL" description="Column header for icon URL" />
        </Typography.Text>
        <Typography.Text color="secondary" size="sm" css={{ width: selectWidth }}>
          <FormattedMessage defaultMessage="Theme" description="Column header for icon theme" />
        </Typography.Text>
        <div css={{ width: buttonSpacerWidth }} />
      </div>

      {/* Confirmed rows */}
      {value.map((icon, index) => (
        <IconRow
          key={`${icon.src}-${icon.theme ?? 'Any'}-${index}`}
          icon={icon}
          index={index}
          placeholder={placeholder}
          selectWidth={selectWidth}
          hasError={failedSrcs.has(icon.src)}
          onChangeSrc={handleSrcChange}
          onChangeTheme={handleThemeChange}
          onRemove={handleRemove}
        />
      ))}

      {/* Draft row */}
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <div css={{ flex: 1 }}>
          <Input
            componentId={`${componentId}.draft-url`}
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <SimpleSelect
          id={`${componentId}-theme-draft`}
          componentId={`${componentId}.draft-theme`}
          value={draftTheme}
          onChange={({ target }) => setDraftTheme(target.value as ThemeOption)}
          css={{ width: selectWidth }}
        >
          <ThemeSelectOptions />
        </SimpleSelect>
        <Tooltip
          content={intl.formatMessage({
            defaultMessage: 'Add icon',
            description: 'Tooltip for add icon button in skill icon editor',
          })}
          componentId="mlflow.skills-registry.icon-editor.add.tooltip"
        >
          <Button
            componentId={`${componentId}.add`}
            onClick={handleAddDraft}
            disabled={!draftUrl.trim()}
            aria-label={intl.formatMessage({
              defaultMessage: 'Add icon',
              description: 'Aria label for add icon button in skill icon editor',
            })}
          >
            <PlusIcon />
          </Button>
        </Tooltip>
      </div>

      {/* Preview */}
      <div>
        <Typography.Text color="secondary" size="sm" css={{ display: 'block', marginBottom: theme.spacing.xs }}>
          <FormattedMessage defaultMessage="Preview" description="Preview label in skill icon editor" />
        </Typography.Text>
        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.general.borderRadiusBase,
          }}
        >
          <PreviewItem isDark={false} icons={value} onLoadError={handleLoadError} />
          <PreviewItem isDark icons={value} onLoadError={handleLoadError} />
        </div>
      </div>
    </div>
  );
};
