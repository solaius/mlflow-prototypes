import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { getSkillRegisterCommand, getSkillRegisterSnippet } from '../constants';
import type { SkillRegisterInput } from '../constants';
import { ShowArtifactCodeSnippet } from '../../experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet';

/**
 * The CLI and Python equivalents of what the create form is currently holding.
 *
 * The 2026-09-01 UX review asked for this by pointing at the MCP server registry, which
 * offers a Python option beside its form; Yuki extended the ask to CLI as well, so the
 * parent renders a three-way Form / CLI / Python control and this component covers the
 * two non-form arms.
 *
 * The snippets are built from the LIVE form values rather than from a static example.
 * That is the whole point of putting them behind a toggle on the same modal: a user who
 * fills the form and then switches to CLI is looking at the command that would do what
 * they just described, which is what makes it copyable into a script or a runbook.
 */
export const SkillRegisterSnippet = ({ format, input }: { format: 'cli' | 'python'; input: SkillRegisterInput }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const snippet = format === 'cli' ? getSkillRegisterCommand(input) : getSkillRegisterSnippet(input);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <Typography.Text color="secondary" size="sm">
        {format === 'cli' ? (
          <FormattedMessage
            defaultMessage="The CLI reads the skill locally, so it can infer the name and record a digest."
            description="Skills registry > register snippet > CLI advantage note"
          />
        ) : (
          <FormattedMessage
            defaultMessage="The SDK reads the skill locally, so it can infer the name and record a digest."
            description="Skills registry > register snippet > SDK advantage note"
          />
        )}
      </Typography.Text>

      {/*
        Same shared block as the pull snippet -- see the note in `SkillPullInstructions`.
        `CodeSnippetLanguage` has no shell grammar, so the CLI form renders as plain text.
      */}
      <ShowArtifactCodeSnippet
        code={snippet}
        language={format === 'cli' ? 'text' : 'python'}
        componentId="mlflow.skills-registry.register.copy"
        copyAriaLabel={intl.formatMessage({
          defaultMessage: 'Copy register command',
          description: 'Aria label for the copy button on the skill register snippet',
        })}
      />
    </div>
  );
};
