import { Alert, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { AgentRefChip, HarnessChip, MCPRefChip, ModelRefChip, PluginRefChip, SkillRefChip } from './AgentCellRenderers';
import { RuntimeBoundaryPanel } from './RuntimeBoundaryPanel';
import type { AgentVersionEntity } from '../types';
import { countBomEntries } from '../utils';

const Axis = ({
  title,
  caption,
  count,
  children,
}: {
  title: React.ReactNode;
  caption: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) => {
  const { theme } = useDesignSystemTheme();
  return (
    <div>
      <Typography.Title level={4}>
        {title} ({count})
      </Typography.Title>
      <Typography.Paragraph color="secondary">{caption}</Typography.Paragraph>
      {count ? (
        <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>{children}</div>
      ) : (
        <Typography.Text color="secondary">&mdash;</Typography.Text>
      )}
    </div>
  );
};

/**
 * The bill of materials, one section per axis, each chip linking into the registry it
 * references. This is the reason the registry is worth having: it is what makes "which
 * agents use skill X?" answerable from records alone.
 *
 * The BOM is a component inventory, not a complete recipe -- its axes exist because
 * corresponding registries or identifier conventions exist -- so the panel below the axes
 * states where the record stops and the platform begins.
 */
export const AgentCompositionTab = ({ agentVersion }: { agentVersion: AgentVersionEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const { bom } = agentVersion;

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {agentVersion.composition === 'undeclared' ? (
        <Alert
          componentId="mlflow.agent-registry.composition.undeclared"
          type="warning"
          closable={false}
          message={intl.formatMessage({
            defaultMessage: 'Composition undeclared',
            description: 'Composition tab > undeclared alert title',
          })}
          description={intl.formatMessage({
            defaultMessage:
              'This version was registered from its endpoint with no source and no configuration snapshot, and no bill of materials was declared. The registry knows its claim surface, not its contents: blast-radius queries report it alongside their matches rather than silently missing it. Composition can be declared on a later version.',
            description: 'Composition tab > undeclared alert description',
          })}
          css={{ maxWidth: 800 }}
        />
      ) : countBomEntries(bom) === 0 ? (
        <Typography.Text color="secondary">
          <FormattedMessage
            defaultMessage="Declared empty: this version depends on nothing the registry tracks."
            description="Composition tab > declared but empty"
          />
        </Typography.Text>
      ) : null}

      {agentVersion.harness && (
        <div>
          <Typography.Title level={4}>
            <FormattedMessage defaultMessage="Harness" description="Composition tab > harness heading" />
          </Typography.Title>
          <Typography.Paragraph color="secondary">
            <FormattedMessage
              defaultMessage="The packaged harness this agent runs as a configuration of. A proposed axis: an external identifier, like an external model reference."
              description="Composition tab > harness caption"
            />
          </Typography.Paragraph>
          <HarnessChip harness={agentVersion.harness} />
        </div>
      )}

      <Axis
        title={<FormattedMessage defaultMessage="Skills" description="Composition tab > skills heading" />}
        caption={
          <FormattedMessage
            defaultMessage="Skill Registry entries this version pins, at exact integer versions."
            description="Composition tab > skills caption"
          />
        }
        count={bom.skills.length}
      >
        {bom.skills.map((ref) => (
          <SkillRefChip key={`${ref.name}@${ref.version}`} skillRef={ref} />
        ))}
      </Axis>

      <Axis
        title={<FormattedMessage defaultMessage="Agent plugins" description="Composition tab > plugins heading" />}
        caption={
          <FormattedMessage
            defaultMessage="Referenced as composed units. Queries expand each through its registered members, so a skill that arrives through a plugin is still found."
            description="Composition tab > plugins caption"
          />
        }
        count={bom.agent_plugins.length}
      >
        {bom.agent_plugins.map((ref) => (
          <PluginRefChip key={`${ref.name}@${ref.version}`} pluginRef={ref} />
        ))}
      </Axis>

      <Axis
        title={<FormattedMessage defaultMessage="MCP servers" description="Composition tab > MCP heading" />}
        caption={
          <FormattedMessage
            defaultMessage="The tools this version calls, pinned to registered server versions."
            description="Composition tab > MCP caption"
          />
        }
        count={bom.mcp_servers.length}
      >
        {bom.mcp_servers.map((ref) => (
          <MCPRefChip key={`${ref.name}@${ref.version}`} mcpRef={ref} />
        ))}
      </Axis>

      <Axis
        title={<FormattedMessage defaultMessage="Models" description="Composition tab > models heading" />}
        caption={
          <FormattedMessage
            defaultMessage="Registry models link to their versions; external identifiers are recorded as given."
            description="Composition tab > models caption"
          />
        }
        count={bom.models.length}
      >
        {bom.models.map((ref) => (
          <ModelRefChip key={`${ref.name}@${ref.version ?? 'external'}`} modelRef={ref} />
        ))}
      </Axis>

      <Axis
        title={<FormattedMessage defaultMessage="Agents it calls" description="Composition tab > agents heading" />}
        caption={
          <FormattedMessage
            defaultMessage="Pinned when versioned and deployed together; name-level when the callee is independently managed. Answers 'which agents call the compromised agent?'"
            description="Composition tab > agents caption"
          />
        }
        count={bom.agents.length}
      >
        {bom.agents.map((ref) => (
          <AgentRefChip key={`${ref.name}@${ref.version ?? 'name'}`} agentRef={ref} />
        ))}
      </Axis>

      <RuntimeBoundaryPanel />
    </div>
  );
};
