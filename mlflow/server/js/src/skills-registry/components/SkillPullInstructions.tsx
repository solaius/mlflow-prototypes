import {
  SegmentedControlButton,
  SegmentedControlGroup,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getSkillPullCommand, getSkillPullSnippet } from '../constants';
import { ShowArtifactCodeSnippet } from '../../experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet';

/** Which surface the snippet is written for. */
enum PullFormat {
  CLI = 'cli',
  PYTHON = 'python',
}

export interface SkillPullInstructionsProps {
  organization: string;
  name: string;
  /** The URI the snippet resolves through: unversioned (backend latest), an alias, or a pinned version. */
  uri: string;
  /** Set when the snippet pins an exact version rather than resolving an alias. */
  version?: number;
  /** Set when the snippet resolves through an alias. */
  alias?: string;
  /**
   * What the snippet resolves to, rendered tight to the heading and above the format
   * toggle. Styling is applied here rather than by the caller so it cannot drift from
   * the footnote below the snippet.
   */
  resolutionNote?: React.ReactNode;
}

/**
 * Copyable "how do I consume this?" snippets, mirroring the MCP server registry's
 * `ConnectionInstructions`: a segmented control switching format, the snippet in a
 * `CodeSnippet`, and a `CopyButton` overlaid at the top right. Reusing that shape
 * rather than inventing one keeps the two registries' consume affordance identical,
 * which is the point of the request.
 *
 * Both snippets are the forms RFC-0008's user journeys use verbatim, including the
 * `--destination` flag name, so what is copied here is what the docs say to run.
 */
export const SkillPullInstructions = ({
  organization,
  name,
  uri,
  version,
  alias,
  resolutionNote,
}: SkillPullInstructionsProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [format, setFormat] = useState<PullFormat>(PullFormat.CLI);

  const snippet =
    format === PullFormat.CLI ? getSkillPullCommand(uri) : getSkillPullSnippet({ organization, name, version, alias });

  return (
    <div css={{ display: 'flex', flexDirection: 'column' }}>
      {/*
        What the snippet resolves to, above the toggle: it qualifies the heading (which
        skill, which version) more than the format choice, so it sits tight to the title
        and leaves a medium gap before the tabs. Kept at the footnote's weight rather
        than restored to the bold label it once was -- it is still reference detail, and
        the modal has one thing to emphasise, the snippet.
      */}
      {resolutionNote && (
        <Typography.Text size="sm" color="secondary" css={{ marginBottom: theme.spacing.md }}>
          {resolutionNote}
        </Typography.Text>
      )}

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        <SegmentedControlGroup
          name="mlflow.skills-registry.pull.format"
          componentId="mlflow.skills-registry.pull.format"
          value={format}
          onChange={(event) => setFormat(event.target.value as PullFormat)}
        >
          <SegmentedControlButton value={PullFormat.CLI}>
            <FormattedMessage defaultMessage="CLI" description="Skills registry > pull instructions > CLI format tab" />
          </SegmentedControlButton>
          <SegmentedControlButton value={PullFormat.PYTHON}>
            <FormattedMessage
              defaultMessage="Python"
              description="Skills registry > pull instructions > Python SDK format tab"
            />
          </SegmentedControlButton>
        </SegmentedControlGroup>

        {/*
          The same block the prompt "Usage example" modal uses, reused rather than rebuilt so
          the two Use modals cannot drift apart again. It carries the code styling (theme
          background, wrapped long lines) and the borderless copy button overlay.

          `CodeSnippetLanguage` has no shell grammar, so the CLI form renders as plain text.
        */}
        <ShowArtifactCodeSnippet
          code={snippet}
          language={format === PullFormat.CLI ? 'text' : 'python'}
          componentId="mlflow.skills-registry.pull.copy"
          copyAriaLabel={intl.formatMessage({
            defaultMessage: 'Copy pull command',
            description: 'Aria label for the copy button on the skill pull snippet',
          })}
        />

        {/* What running it does, below the thing you run. */}
        <Typography.Text size="sm" color="secondary">
          <FormattedMessage
            defaultMessage="Fetches the content from its source into a local directory."
            description="Skills registry > pull instructions > explanation of what pull does"
          />
        </Typography.Text>
      </div>
    </div>
  );
};
