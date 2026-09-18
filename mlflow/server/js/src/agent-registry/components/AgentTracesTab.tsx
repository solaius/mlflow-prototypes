import {
  SimpleSelect,
  SimpleSelectOption,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { CodeSnippet } from '@databricks/web-shared/snippet';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';
import Routes from '../../experiment-tracking/routes';
import { CopyButton } from '../../shared/building_blocks/CopyButton';
import { getAgentQualifiedName, getAgentTraceSnippet } from '../constants';
import { getAgentTraceVolume, getAgentTraces } from '../mocks/experimentTrackingStore';
import type { AgentEntity, AgentVersionEntity } from '../types';

const ALL = '__all__';

/**
 * The agent's traces: `search_traces` over its one default experiment, filterable by the
 * version recorded as trace metadata. Defaults to the selected version, because that is
 * what the rail selection means, and offers the whole agent because the longitudinal view
 * across upgrades is the reason the RFC keeps one experiment per agent.
 *
 * Does not re-implement the traces UI. The listing is a summary; drilling into a trace goes
 * to the experiment traces view, where the one traces implementation lives.
 */
export const AgentTracesTab = ({
  agent,
  agentVersion,
  versions,
}: {
  agent: AgentEntity;
  agentVersion: AgentVersionEntity;
  versions: AgentVersionEntity[];
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const qualifiedName = getAgentQualifiedName(agent.organization, agent.name);
  const [versionFilter, setVersionFilter] = useState<string>(agentVersion.version);
  const effectiveVersion = versionFilter === ALL ? undefined : versionFilter;
  const traces = useMemo(() => getAgentTraces(qualifiedName, effectiveVersion), [qualifiedName, effectiveVersion]);
  const volume = getAgentTraceVolume(qualifiedName, effectiveVersion);
  const snippet = getAgentTraceSnippet(agent.organization, agent.name, agentVersion.version);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        <SimpleSelect
          id="mlflow.agent-registry.traces.version-filter"
          componentId="mlflow.agent-registry.traces.version-filter"
          value={versionFilter}
          onChange={({ target }) => setVersionFilter(target.value)}
          label={intl.formatMessage({ defaultMessage: 'Version', description: 'Label for the traces version filter' })}
          width={180}
        >
          <SimpleSelectOption value={ALL}>
            {intl.formatMessage({ defaultMessage: 'All versions', description: 'Traces version filter > all' })}
          </SimpleSelectOption>
          {versions.map((version) => (
            <SimpleSelectOption key={version.version} value={version.version}>
              {intl.formatMessage(
                { defaultMessage: 'Version {version}', description: 'Traces version filter > one version' },
                { version: version.version },
              )}
            </SimpleSelectOption>
          ))}
        </SimpleSelect>
        <Typography.Text color="secondary" size="sm">
          <FormattedMessage
            defaultMessage="{volume, plural, one {# trace} other {# traces}} in the agent's experiment{scoped, select, true { for this version} other {}}, newest {shown} shown."
            description="Traces tab > volume line"
            values={{ volume, scoped: effectiveVersion ? 'true' : 'false', shown: traces.length }}
          />
        </Typography.Text>
        <Link
          componentId="mlflow.agent-registry.traces.open-experiment"
          to={Routes.getExperimentPageTracesTabRoute(agent.default_experiment_id)}
          css={{ marginLeft: 'auto' }}
        >
          <FormattedMessage
            defaultMessage="Open in Experiments"
            description="Traces tab > link to the experiment traces view"
          />
        </Link>
      </div>

      {traces.length ? (
        <Table data-testid="agent-traces-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-registry.traces.header-input">
              <FormattedMessage defaultMessage="Request" description="Traces table > input column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.traces.header-version" css={{ maxWidth: 110 }}>
              <FormattedMessage defaultMessage="Version" description="Traces table > version column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.traces.header-status" css={{ maxWidth: 100 }}>
              <FormattedMessage defaultMessage="Status" description="Traces table > status column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.traces.header-latency" css={{ maxWidth: 110 }}>
              <FormattedMessage defaultMessage="Latency" description="Traces table > latency column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.traces.header-time" css={{ maxWidth: 200 }}>
              <FormattedMessage defaultMessage="When" description="Traces table > time column" />
            </TableHeader>
          </TableRow>
          {traces.map((trace) => (
            <TableRow key={trace.trace_id}>
              <TableCell ellipsis>
                <Link
                  componentId="mlflow.agent-registry.traces.trace-link"
                  to={Routes.getExperimentPageTracesTabRoute(trace.experiment_id)}
                >
                  {trace.input_preview}
                </Link>
              </TableCell>
              <TableCell ellipsis css={{ maxWidth: 110 }}>
                <Typography.Text code>{trace.agent_version}</Typography.Text>
              </TableCell>
              <TableCell ellipsis css={{ maxWidth: 100 }}>
                <Tag componentId="mlflow.agent-registry.traces.status" color={trace.status === 'OK' ? 'lime' : 'coral'}>
                  {trace.status}
                </Tag>
              </TableCell>
              <TableCell ellipsis css={{ maxWidth: 110 }}>
                {(trace.latency_ms / 1000).toFixed(2)}s
              </TableCell>
              <TableCell ellipsis css={{ maxWidth: 200 }}>
                {Utils.formatTimestamp(trace.timestamp, intl)}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : (
        <Typography.Text color="secondary">
          <FormattedMessage
            defaultMessage="No traces recorded against this version yet."
            description="Traces tab > empty"
          />
        </Typography.Text>
      )}

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, maxWidth: 800 }}>
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Log traces against this agent" description="Traces tab > snippet heading" />
        </Typography.Text>
        <Typography.Text size="sm" color="secondary">
          <FormattedMessage
            defaultMessage="Sets the destination to the agent's default experiment and records the agent and version as trace metadata. A deployment that overrides its destination swaps only the first piece."
            description="Traces tab > snippet caption"
          />
        </Typography.Text>
        <div css={{ position: 'relative' }}>
          <CodeSnippet language="python" style={{ padding: theme.spacing.sm }}>
            {snippet}
          </CodeSnippet>
          <CopyButton
            componentId="mlflow.agent-registry.traces.copy"
            copyText={snippet}
            css={{ position: 'absolute', top: theme.spacing.xs, right: theme.spacing.xs, zIndex: 1 }}
            size="small"
            aria-label={intl.formatMessage({
              defaultMessage: 'Copy tracing snippet',
              description: 'Aria label for the copy button',
            })}
          />
        </div>
      </div>
    </div>
  );
};
