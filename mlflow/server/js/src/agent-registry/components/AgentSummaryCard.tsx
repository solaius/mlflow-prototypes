import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import Routes from '../../experiment-tracking/routes';
import { getAgentQualifiedName } from '../constants';
import { getAgentSummary, getExperimentName } from '../mocks/experimentTrackingStore';
import type { AgentEntity } from '../types';

const MetricTile = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => {
  const { theme } = useDesignSystemTheme();
  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
      <Typography.Text size="sm" color="secondary">
        {label}
      </Typography.Text>
      <Typography.Text bold>{value}</Typography.Text>
    </div>
  );
};

/**
 * RFC-0011's summary card: "a summary card shows latest eval score and trace volume". Sits
 * in the page header because it describes the AGENT, across versions, which is exactly why
 * the RFC puts traces in one default experiment per agent rather than per version.
 */
export const AgentSummaryCard = ({ agent, bindingCount }: { agent: AgentEntity; bindingCount: number }) => {
  const { theme } = useDesignSystemTheme();
  const qualifiedName = getAgentQualifiedName(agent.organization, agent.name);
  const summary = getAgentSummary(qualifiedName);
  const primaryScoreKey = summary.latestEval
    ? (Object.keys(summary.latestEval.scores).find((key) => key === 'correctness') ??
      Object.keys(summary.latestEval.scores)[0])
    : undefined;

  return (
    <div
      css={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: theme.borders.borderRadiusMd,
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.backgroundSecondary,
        marginBottom: theme.spacing.md,
      }}
    >
      <MetricTile
        label={<FormattedMessage defaultMessage="Default experiment" description="Summary card > experiment label" />}
        value={
          <Link
            componentId="mlflow.agent-registry.summary.experiment"
            to={Routes.getExperimentPageTracesTabRoute(agent.default_experiment_id)}
          >
            {getExperimentName(qualifiedName)}
          </Link>
        }
      />
      <MetricTile
        label={<FormattedMessage defaultMessage="Traces" description="Summary card > trace volume label" />}
        value={summary.traceVolume.toLocaleString()}
      />
      <MetricTile
        label={
          summary.latestEval && primaryScoreKey ? (
            <FormattedMessage
              defaultMessage="Latest eval: {scorer} (v{version})"
              description="Summary card > latest eval label"
              values={{ scorer: primaryScoreKey.replace(/_/g, ' '), version: summary.latestEval.agent_version }}
            />
          ) : (
            <FormattedMessage defaultMessage="Latest eval" description="Summary card > latest eval label, none" />
          )
        }
        value={
          summary.latestEval && primaryScoreKey
            ? primaryScoreKey.startsWith('latency')
              ? `${summary.latestEval.scores[primaryScoreKey]}s`
              : `${Math.round(summary.latestEval.scores[primaryScoreKey] * 100)}%`
            : '—'
        }
      />
      <MetricTile
        label={<FormattedMessage defaultMessage="Error rate" description="Summary card > error rate label" />}
        value={summary.errorRate !== undefined ? `${(summary.errorRate * 100).toFixed(1)}%` : '—'}
      />
      <MetricTile
        label={<FormattedMessage defaultMessage="Access bindings" description="Summary card > bindings label" />}
        value={bindingCount}
      />
    </div>
  );
};
