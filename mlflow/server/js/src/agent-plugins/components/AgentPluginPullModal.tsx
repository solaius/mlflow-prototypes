import {
  Modal,
  SegmentedControlButton,
  SegmentedControlGroup,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ShowArtifactCodeSnippet } from '../../experiment-tracking/components/artifact-view-components/ShowArtifactCodeSnippet';
import {
  getAgentPluginUri,
  getAgentPluginVersionUri,
  getPluginPullCommand,
  getPluginPullSnippet,
  getPluginQualifiedName,
} from '../constants';
import type { AgentPluginEntity, AgentPluginVersionEntity } from '../types';
import { STATUS_TAG_COLOR, formatStatusLabel, getPluginVersionKind } from '../utils';

enum PullFormat {
  CLI = 'cli',
  PYTHON = 'python',
}

/**
 * "How do I consume this plugin?" -- the plugin twin of `SkillPullModal`, same modal shape.
 *
 * Opened from a card (the plugin) it pulls what the backend resolves as latest: the bare
 * `agent-plugins:/@org/name` URI, which RFC-0008 resolves by SemVer precedence among active
 * versions. It does not go through an alias, even when one exists
 * (2026-09-15-dwarner-stakeholder-feedback#1). Opened from the version pane it pins that version.
 *
 * The resolution line is one muted sentence tight under the heading, a qualifier of it rather
 * than a peer of the format tabs, which render at the default size above the prompts usage
 * block (`ShowArtifactCodeSnippet`).
 */
export const AgentPluginPullModal = ({
  visible,
  plugin,
  pluginVersion,
  pinVersion,
  onClose,
}: {
  visible: boolean;
  plugin: AgentPluginEntity;
  pluginVersion?: AgentPluginVersionEntity;
  pinVersion?: boolean;
  onClose: () => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [format, setFormat] = useState<PullFormat>(PullFormat.CLI);

  if (!visible) {
    return null;
  }

  const version = pluginVersion?.version ?? plugin.latest_version;
  const pinned = Boolean(pinVersion && version);
  const uri =
    pinned && version
      ? getAgentPluginVersionUri(plugin.organization, plugin.name, version)
      : getAgentPluginUri(plugin.organization, plugin.name);

  const snippet =
    format === PullFormat.CLI
      ? getPluginPullCommand(uri)
      : getPluginPullSnippet({
          organization: plugin.organization,
          name: plugin.name,
          version: pinned ? version : undefined,
        });

  const kind = pluginVersion ? getPluginVersionKind(pluginVersion.source) : undefined;

  return (
    <Modal
      componentId="mlflow.agent-plugins.pull-modal"
      title={
        <FormattedMessage
          defaultMessage="Use {name}"
          description="Agent plugins > pull modal title"
          values={{ name: getPluginQualifiedName(plugin.organization, plugin.name) }}
        />
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
    >
      <div css={{ display: 'flex', flexDirection: 'column', marginTop: -theme.spacing.xs }}>
        {version && (
          <Typography.Text size="sm" color="secondary" css={{ marginBottom: theme.spacing.md }}>
            <span css={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
              {pinned ? (
                <FormattedMessage
                  defaultMessage="Pinned version: {version}"
                  description="Agent plugins > pull modal > what the snippet resolves to, a pinned version"
                  values={{ version }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Latest version: {version}"
                  description="Agent plugins > pull modal > what the snippet resolves to, the backend's latest"
                  values={{ version }}
                />
              )}
              {pluginVersion && (
                <Tag
                  componentId="mlflow.agent-plugins.pull-modal.status"
                  color={STATUS_TAG_COLOR[pluginVersion.status]}
                >
                  {formatStatusLabel(pluginVersion.status)}
                </Tag>
              )}
            </span>
          </Typography.Text>
        )}

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <SegmentedControlGroup
            name="mlflow.agent-plugins.pull.format"
            componentId="mlflow.agent-plugins.pull.format"
            value={format}
            onChange={(event) => setFormat(event.target.value as PullFormat)}
          >
            <SegmentedControlButton value={PullFormat.CLI}>
              <FormattedMessage defaultMessage="CLI" description="Agent plugins > pull instructions > CLI format tab" />
            </SegmentedControlButton>
            <SegmentedControlButton value={PullFormat.PYTHON}>
              <FormattedMessage
                defaultMessage="Python"
                description="Agent plugins > pull instructions > Python format tab"
              />
            </SegmentedControlButton>
          </SegmentedControlGroup>

          <ShowArtifactCodeSnippet
            code={snippet}
            language={format === PullFormat.CLI ? 'text' : 'python'}
            componentId="mlflow.agent-plugins.pull.copy"
            copyAriaLabel={intl.formatMessage({
              defaultMessage: 'Copy pull command',
              description: 'Aria label for the copy button on the plugin pull snippet',
            })}
          />

          <Typography.Text size="sm" color="secondary">
            {kind === 'assembled' ? (
              <FormattedMessage
                defaultMessage="Fetches each member from its own source into a skills directory named after it. Fails rather than producing a partial plugin if any member cannot be resolved."
                description="Agent plugins > pull instructions > assembled explanation"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Fetches the whole package as a unit, including mcp.json and any content that was not registered."
                description="Agent plugins > pull instructions > packaged explanation"
              />
            )}
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );
};
