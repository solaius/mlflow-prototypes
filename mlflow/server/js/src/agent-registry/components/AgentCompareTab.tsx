import { SimpleSelect, SimpleSelectOption, Tag, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AgentVersionDiff } from './AgentVersionDiff';
import { getAgentQualifiedName } from '../constants';
import { getAgentEvalRuns } from '../mocks/experimentTrackingStore';
import type { AgentEntity, AgentVersionEntity } from '../types';

/**
 * Compare the selected version with another: the BOM diff from the versioning journey and
 * the evaluation deltas from the trace-and-eval journey, together. "What changed, and did
 * it matter?" is one question, so it is one tab, with the rail's selection as the base.
 */
export const AgentCompareTab = ({
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
  const others = versions.filter((version) => version.version !== agentVersion.version);
  const [otherVersion, setOtherVersion] = useState<string | undefined>(others[0]?.version);
  const other = others.find((version) => version.version === otherVersion) ?? others[0];
  const qualifiedName = getAgentQualifiedName(agent.organization, agent.name);

  const evalDeltas = useMemo(() => {
    if (!other) {
      return [];
    }
    const base = getAgentEvalRuns(qualifiedName, agentVersion.version)[0];
    const compared = getAgentEvalRuns(qualifiedName, other.version)[0];
    if (!base && !compared) {
      return [];
    }
    const keys = new Set([...Object.keys(base?.scores ?? {}), ...Object.keys(compared?.scores ?? {})]);
    return [...keys].sort().map((key) => {
      const baseScore = base?.scores[key];
      const otherScore = compared?.scores[key];
      const delta = baseScore !== undefined && otherScore !== undefined ? baseScore - otherScore : undefined;
      const lowerIsBetter = key === 'hallucination' || key.startsWith('latency');
      const regressed = delta !== undefined && (lowerIsBetter ? delta > 0.01 : delta < -0.01);
      return { key, baseScore, otherScore, delta, regressed, lowerIsBetter };
    });
  }, [qualifiedName, agentVersion.version, other]);

  if (!other) {
    return (
      <Typography.Text color="secondary">
        <FormattedMessage
          defaultMessage="Register a second version to compare against."
          description="Compare tab > single version"
        />
      </Typography.Text>
    );
  }

  const format = (key: string, value?: number) =>
    value === undefined ? '—' : key.startsWith('latency') ? `${value}s` : `${Math.round(value * 100)}%`;
  const regressions = evalDeltas.filter((entry) => entry.regressed).length;

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, maxWidth: 900 }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        <Typography.Text>
          <FormattedMessage
            defaultMessage="Version {base} compared with"
            description="Compare tab > base label"
            values={{ base: <Typography.Text bold>{agentVersion.version}</Typography.Text> }}
          />
        </Typography.Text>
        <SimpleSelect
          id="mlflow.agent-registry.compare.other"
          componentId="mlflow.agent-registry.compare.other"
          value={other.version}
          onChange={({ target }) => setOtherVersion(target.value)}
          label={intl.formatMessage({
            defaultMessage: 'Compare with',
            description: 'Label for the compare version selector',
          })}
          width={180}
        >
          {others.map((version) => (
            <SimpleSelectOption key={version.version} value={version.version}>
              {intl.formatMessage(
                { defaultMessage: 'Version {version}', description: 'Compare selector option' },
                { version: version.version },
              )}
            </SimpleSelectOption>
          ))}
        </SimpleSelect>
      </div>

      <Typography.Text color="secondary" size="sm">
        <FormattedMessage
          defaultMessage="Declared changes only: what differs in the two registrations, without depending on the change author's memory. Discovering changes nobody declared is deferred auto-discovery."
          description="Compare tab > caption"
        />
      </Typography.Text>

      <AgentVersionDiff oldVersion={other} newVersion={agentVersion} />

      {evalDeltas.length > 0 && (
        <div>
          <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Evaluation deltas" description="Compare tab > eval heading" />
            </Typography.Text>
            {regressions > 0 && (
              <Tag componentId="mlflow.agent-registry.compare.regressions" color="coral">
                <FormattedMessage
                  defaultMessage="{count} regressed"
                  description="Compare tab > regression count"
                  values={{ count: regressions }}
                />
              </Tag>
            )}
          </div>
          <div css={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {evalDeltas.map((entry) => (
              <div
                key={entry.key}
                css={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `2px ${theme.spacing.sm}px`,
                }}
              >
                <Typography.Text css={{ flex: 1 }}>{entry.key.replace(/_/g, ' ')}</Typography.Text>
                <Typography.Text size="sm" color="secondary" code>
                  {format(entry.key, entry.otherScore)} → {format(entry.key, entry.baseScore)}
                </Typography.Text>
                <Typography.Text
                  size="sm"
                  bold
                  css={{
                    minWidth: 70,
                    textAlign: 'right',
                    color: entry.regressed
                      ? theme.colors.textValidationDanger
                      : entry.delta && entry.delta !== 0
                        ? theme.colors.textValidationSuccess
                        : undefined,
                  }}
                >
                  {entry.delta === undefined
                    ? '—'
                    : entry.key.startsWith('latency')
                      ? `${entry.delta >= 0 ? '+' : ''}${entry.delta.toFixed(2)}s`
                      : `${entry.delta >= 0 ? '+' : ''}${Math.round(entry.delta * 100)}pp`}
                </Typography.Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
