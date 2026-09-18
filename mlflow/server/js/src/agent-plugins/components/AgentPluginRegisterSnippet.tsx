import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  getPluginImportCommand,
  getPluginImportSnippet,
  getPluginRegisterCommand,
  getPluginRegisterSnippet,
} from '../constants';
import type { PluginImportInput, PluginRegisterInput } from '../constants';
import { ShowArtifactCodeSnippet } from '../../experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet';

/**
 * The CLI and Python equivalents of what the plugin form is currently holding, the twin of
 * `SkillRegisterSnippet`. Two registrations exist for plugins -- assemble from registered
 * members, or import a package -- and each has its own command, so the snippet is built
 * from whichever the form is describing.
 *
 * For import the note matters more than for skills: the client is the ONLY place the
 * package can be fetched and inspected, so the CLI and SDK are not merely equivalent to
 * the form, they are what the form hands over to for any location it cannot inspect.
 */
export const AgentPluginRegisterSnippet = ({
  format,
  input,
}: {
  format: 'cli' | 'python';
  input: { kind: 'assemble'; register: PluginRegisterInput } | { kind: 'import'; import: PluginImportInput };
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const snippet =
    input.kind === 'assemble'
      ? format === 'cli'
        ? getPluginRegisterCommand(input.register)
        : getPluginRegisterSnippet(input.register)
      : format === 'cli'
        ? getPluginImportCommand(input.import)
        : getPluginImportSnippet(input.import);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <Typography.Text color="secondary" size="sm">
        {input.kind === 'import' ? (
          <FormattedMessage
            defaultMessage="Import runs in the client: it fetches the package, detects its format, discovers the skills and registers them with the plugin in one transaction."
            description="Agent plugins > register snippet > import note"
          />
        ) : (
          <FormattedMessage
            defaultMessage="Assembles a version from registered members. Each reference is resolved to a concrete version and frozen."
            description="Agent plugins > register snippet > assemble note"
          />
        )}
      </Typography.Text>

      {/* The prompts usage block, as in the Use modal (demo-prep#13). */}
      <ShowArtifactCodeSnippet
        code={snippet}
        language={format === 'cli' ? 'text' : 'python'}
        componentId="mlflow.agent-plugins.register.copy"
        copyAriaLabel={intl.formatMessage({
          defaultMessage: 'Copy command',
          description: 'Aria label for the copy button on the plugin register snippet',
        })}
      />
    </div>
  );
};
