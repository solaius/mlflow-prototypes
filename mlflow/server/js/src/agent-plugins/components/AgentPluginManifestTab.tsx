import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { LazyJsonRecordEditor } from '../../experiment-tracking/pages/experiment-evaluation-datasets-v2/components/LazyJsonRecordEditor';
import { CopyButton } from '../../shared/building_blocks/CopyButton';
import type { AgentPluginVersionEntity } from '../types';

/**
 * The canonical `plugin.json` stored on this version, read-only, in the same JSON viewer
 * the MCP registry uses for `server.json` -- they are the same idea: a publisher payload
 * MLflow preserves verbatim and never edits after creation. The one field the registry
 * touched on ingest is `version`, normalised so it equals the registry version.
 */
export const AgentPluginManifestTab = ({ pluginVersion }: { pluginVersion: AgentPluginVersionEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const jsonString = useMemo(() => JSON.stringify(pluginVersion.plugin_json, null, 2), [pluginVersion.plugin_json]);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, maxWidth: 900 }}>
      <Typography.Text color="secondary" size="sm">
        <FormattedMessage
          defaultMessage="Immutable once stored. The version field was normalized on ingest so it equals the registry version; everything else is as submitted."
          description="Agent plugins > manifest tab > explanation"
        />
      </Typography.Text>
      <div css={{ position: 'relative' }}>
        <LazyJsonRecordEditor
          value={jsonString}
          onChange={() => {}}
          readOnly
          height="240px"
          maxHeight="480px"
          ariaLabel={intl.formatMessage({
            defaultMessage: 'Canonical plugin.json',
            description: 'Aria label for the plugin manifest viewer',
          })}
        />
        <CopyButton
          componentId="mlflow.agent-plugins.manifest.copy"
          copyText={jsonString}
          css={{ position: 'absolute', top: theme.spacing.xs, right: theme.spacing.xs, zIndex: 1 }}
          size="small"
          aria-label={intl.formatMessage({
            defaultMessage: 'Copy plugin.json',
            description: 'Aria label for the copy button on the plugin manifest',
          })}
        />
      </div>
    </div>
  );
};
