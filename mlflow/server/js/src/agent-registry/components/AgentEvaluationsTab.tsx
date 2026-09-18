import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { CodeSnippet } from '@databricks/web-shared/snippet';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';
import Routes from '../../experiment-tracking/routes';
import { CopyButton } from '../../shared/building_blocks/CopyButton';
import { getAgentEvaluateSnippet, getAgentQualifiedName } from '../constants';
import { getAgentEvalRuns } from '../mocks/experimentTrackingStore';
import type { AgentEntity, AgentVersionEntity } from '../types';

const formatScore = (key: string, value: number) =>
  key.startsWith('latency') ? `${value}s` : `${Math.round(value * 100)}%`;

/**
 * Evaluation runs in the agent's experiment, each carrying the version it was scored
 * against. All versions are listed, with the selected one highlighted, because the point
 * of evaluating is comparing; the Compare tab does the deltas.
 */
export const AgentEvaluationsTab = ({
  agent,
  agentVersion,
}: {
  agent: AgentEntity;
  agentVersion: AgentVersionEntity;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const qualifiedName = getAgentQualifiedName(agent.organization, agent.name);
  const runs = useMemo(() => getAgentEvalRuns(qualifiedName), [qualifiedName]);
  const snippet = getAgentEvaluateSnippet(agent.organization, agent.name, agentVersion.version);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <Typography.Text color="secondary" size="sm">
          <FormattedMessage
            defaultMessage="Promotion is informed by these, not gated on them: the registry records the decision, it does not make it."
            description="Evaluations tab > caption"
          />
        </Typography.Text>
        <Link
          componentId="mlflow.agent-registry.evaluations.open-experiment"
          to={Routes.getExperimentPageRoute(agent.default_experiment_id)}
          css={{ marginLeft: 'auto' }}
        >
          <FormattedMessage
            defaultMessage="Open in Experiments"
            description="Evaluations tab > link to the experiment"
          />
        </Link>
      </div>

      {runs.length ? (
        <Table data-testid="agent-evals-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-registry.evals.header-version" css={{ maxWidth: 110 }}>
              <FormattedMessage defaultMessage="Version" description="Evals table > version column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.evals.header-dataset">
              <FormattedMessage defaultMessage="Dataset" description="Evals table > dataset column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.evals.header-scores">
              <FormattedMessage defaultMessage="Scores" description="Evals table > scores column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.evals.header-cases" css={{ maxWidth: 90 }}>
              <FormattedMessage defaultMessage="Cases" description="Evals table > cases column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.evals.header-time" css={{ maxWidth: 200 }}>
              <FormattedMessage defaultMessage="When" description="Evals table > time column" />
            </TableHeader>
          </TableRow>
          {runs.map((run) => {
            const isSelected = run.agent_version === agentVersion.version;
            return (
              <TableRow
                key={run.run_id}
                css={{ backgroundColor: isSelected ? theme.colors.actionDefaultBackgroundPress : undefined }}
              >
                <TableCell ellipsis css={{ maxWidth: 110 }}>
                  <Typography.Text code bold={isSelected}>
                    {run.agent_version}
                  </Typography.Text>
                </TableCell>
                <TableCell ellipsis>{run.dataset}</TableCell>
                <TableCell>
                  <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                    {Object.entries(run.scores).map(([key, value]) => (
                      <Tag
                        key={key}
                        componentId="mlflow.agent-registry.evals.score"
                        color={
                          key === 'hallucination'
                            ? value > 0.15
                              ? 'coral'
                              : 'lime'
                            : value >= 0.8 || key.startsWith('latency')
                              ? 'lime'
                              : 'lemon'
                        }
                      >
                        {key.replace(/_/g, ' ')}: {formatScore(key, value)}
                      </Tag>
                    ))}
                  </div>
                </TableCell>
                <TableCell ellipsis css={{ maxWidth: 90 }}>
                  {run.case_count}
                </TableCell>
                <TableCell ellipsis css={{ maxWidth: 200 }}>
                  {Utils.formatTimestamp(run.timestamp, intl)}
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      ) : (
        <Typography.Text color="secondary">
          <FormattedMessage defaultMessage="No evaluation runs yet." description="Evaluations tab > empty" />
        </Typography.Text>
      )}

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, maxWidth: 800 }}>
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Evaluate this version" description="Evaluations tab > snippet heading" />
        </Typography.Text>
        <div css={{ position: 'relative' }}>
          <CodeSnippet language="python" style={{ padding: theme.spacing.sm }}>
            {snippet}
          </CodeSnippet>
          <CopyButton
            componentId="mlflow.agent-registry.evals.copy"
            copyText={snippet}
            css={{ position: 'absolute', top: theme.spacing.xs, right: theme.spacing.xs, zIndex: 1 }}
            size="small"
            aria-label={intl.formatMessage({
              defaultMessage: 'Copy evaluate snippet',
              description: 'Aria label for the copy button',
            })}
          />
        </div>
      </div>
    </div>
  );
};
