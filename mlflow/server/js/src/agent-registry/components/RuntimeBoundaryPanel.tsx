import { InfoIcon, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

/**
 * States, in the UI, where this registry stops.
 *
 * RFC-0011's first design position: the registry is record-level, not runtime-aware. It
 * stores what an agent is, not whether it is running, healthy or scaled. The list below is
 * the RFC's own out-of-scope section, several items of which are natural follow-ons --
 * their exclusion is sequencing, not rejection. A platform's runtime view joins registry
 * records against its own inventory at query time, with this registry supplying the
 * consumer-and-owner half of "which running agents are affected?"
 *
 * Like the MCP registry's `GovernanceRoadmapPanel`, this has no state wiring: nothing here
 * reflects data and no interaction is possible.
 */
export const RuntimeBoundaryPanel = () => {
  const { theme } = useDesignSystemTheme();

  const outOfScope = [
    {
      key: 'runtime-state',
      title: (
        <FormattedMessage defaultMessage="Runtime state" description="Runtime boundary panel > runtime state title" />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Health, liveness, deployment status, scaling and placement are the serving platform's. The registry performs no polling and no health checks."
          description="Runtime boundary panel > runtime state description"
        />
      ),
    },
    {
      key: 'sync',
      title: (
        <FormattedMessage
          defaultMessage="Registry synchronization from deployments"
          description="Runtime boundary panel > sync title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Auto-registering agents when they deploy, keeping bills of materials fresh, and maintaining deployment trace links is platform-side glue pushing to these APIs."
          description="Runtime boundary panel > sync description"
        />
      ),
    },
    {
      key: 'discovery',
      title: (
        <FormattedMessage
          defaultMessage="Auto-discovery of composition"
          description="Runtime boundary panel > discovery title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Bills of materials are developer-asserted. Inferring what an agent actually used from its traces, and flagging where assertion and observation disagree, is a follow-on the span data is designed to enable."
          description="Runtime boundary panel > discovery description"
        />
      ),
    },
    {
      key: 'shadow',
      title: (
        <FormattedMessage
          defaultMessage="Unregistered agent detection"
          description="Runtime boundary panel > shadow title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Surfacing agents running without a registry record needs runtime scanning, built on top of this registry."
          description="Runtime boundary panel > shadow description"
        />
      ),
    },
    {
      key: 'notifications',
      title: (
        <FormattedMessage
          defaultMessage="Notifications, routing and cost"
          description="Runtime boundary panel > misc title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Blast-radius queries name owners; notifying them is left to the organization. Runtime discovery and request routing are a gateway's. Per-agent token cost is a rollup over agent-linked traces."
          description="Runtime boundary panel > misc description"
        />
      ),
    },
  ];

  return (
    <div
      css={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borders.borderRadiusMd,
        padding: theme.spacing.md,
      }}
    >
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <InfoIcon css={{ color: theme.colors.textSecondary }} />
        <Typography.Title level={4} withoutMargins>
          <FormattedMessage defaultMessage="Beyond this registry" description="Runtime boundary panel title" />
        </Typography.Title>
      </div>
      <Typography.Paragraph color="secondary" css={{ marginTop: theme.spacing.xs }}>
        <FormattedMessage
          defaultMessage="The registry records what an agent is and what it is made of. The questions below depend on live state it does not hold, so they are answered by the platform that runs the agent. Every row here is inert."
          description="Runtime boundary panel caption"
        />
      </Typography.Paragraph>
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        {outOfScope.map((item) => (
          <div
            key={item.key}
            aria-disabled
            css={{
              padding: theme.spacing.sm,
              borderRadius: theme.borders.borderRadiusSm,
              backgroundColor: theme.colors.backgroundSecondary,
              opacity: 0.6,
              cursor: 'not-allowed',
            }}
          >
            <Typography.Text bold color="secondary">
              {item.title}
            </Typography.Text>
            <div>
              <Typography.Text size="sm" color="secondary">
                {item.description}
              </Typography.Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
