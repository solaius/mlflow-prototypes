import React from 'react';
import { CopyIcon, useDesignSystemTheme } from '@databricks/design-system';
import { CodeSnippet, type CodeSnippetLanguage } from '@databricks/web-shared/snippet';
import { CopyButton } from '@mlflow/mlflow/src/shared/building_blocks/CopyButton';

/**
 * A copyable code block: the snippet with a borderless copy button overlaid top right.
 *
 * The three optional props are all additive and defaulted, so the artifact views and the
 * prompt usage-example modal that predate them render exactly as before. They exist so
 * other surfaces can adopt this block rather than re-implementing it and drifting: the
 * skills registry needs a non-Python language for its CLI snippet, and a `componentId`
 * and accessible name for its copy button.
 */
export const ShowArtifactCodeSnippet = ({
  code,
  language = 'python',
  componentId,
  copyAriaLabel,
}: {
  code: string;
  language?: CodeSnippetLanguage;
  componentId?: string;
  copyAriaLabel?: string;
}): React.ReactElement => {
  const { theme } = useDesignSystemTheme();

  return (
    <div css={{ position: 'relative' }}>
      <CopyButton
        componentId={componentId}
        aria-label={copyAriaLabel}
        css={{ zIndex: 1, position: 'absolute', top: theme.spacing.xs, right: theme.spacing.xs }}
        showLabel={false}
        copyText={code}
        icon={<CopyIcon />}
      />
      <CodeSnippet
        language={language}
        showLineNumbers={false}
        style={{
          padding: theme.spacing.sm,
          color: theme.colors.textPrimary,
          backgroundColor: theme.colors.backgroundSecondary,
          whiteSpace: 'pre-wrap',
        }}
        wrapLongLines
      >
        {code}
      </CodeSnippet>
    </div>
  );
};
