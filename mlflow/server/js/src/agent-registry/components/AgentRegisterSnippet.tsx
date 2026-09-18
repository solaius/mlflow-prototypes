import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { ShowArtifactCodeSnippet } from '../../experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet';
import { getAgentRegisterCommand, getAgentRegisterSnippet } from '../constants';
import type { AgentRegisterInput } from '../constants';

/**
 * The CLI and Python equivalents of what the register form is holding, built from the live
 * values -- the agent twin of the skill and plugin snippets. The Python arm is RFC-0011's
 * own `register_agent` sketch; the CLI arm follows the shape of the skill and plugin CLIs.
 */
export const AgentRegisterSnippet = ({ format, input }: { format: 'cli' | 'python'; input: AgentRegisterInput }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const snippet = format === 'cli' ? getAgentRegisterCommand(input) : getAgentRegisterSnippet(input);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <Typography.Text color="secondary" size="sm">
        <FormattedMessage
          defaultMessage="The same registration as the form. From a pipeline, run it on every release build with the source ref set to the build's commit."
          description="Agent registry > register snippet > note"
        />
      </Typography.Text>
      {/* The prompts usage block, as in the skills and plugin forms (demo-prep#13). */}
      <ShowArtifactCodeSnippet
        code={snippet}
        language={format === 'cli' ? 'text' : 'python'}
        componentId="mlflow.agent-registry.register.copy"
        copyAriaLabel={intl.formatMessage({
          defaultMessage: 'Copy register command',
          description: 'Aria label for the copy button',
        })}
      />
    </div>
  );
};
