import {
  Alert,
  Button,
  SimpleSelect,
  SimpleSelectOption,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { LazyJsonRecordEditor } from '../../experiment-tracking/pages/experiment-evaluation-datasets-v2/components/LazyJsonRecordEditor';
import Utils from '../../common/utils/Utils';
import { useAgentCard } from '../hooks/useAgentCard';
import type { AgentAccessBinding } from '../types';
import { AgentBindingProtocol } from '../types';

/**
 * The A2A Agent Card, FETCHED through an `a2a` binding at view time and rendered read-only.
 *
 * RFC-0011 departs from the canonical-payload pattern of the MCP and skill registries here
 * on purpose: an Agent Card's system of record is the agent itself, so MLflow never stores
 * one. What this tab shows is what the endpoint serves right now, which is the only way
 * the displayed card can never drift from the real one. When the endpoint does not answer,
 * that is the honest state, and the registry's own fields (description, display name) are
 * what it holds from the import.
 */
export const AgentCardTab = ({ bindings }: { bindings: AgentAccessBinding[] }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const a2aBindings = useMemo(
    () => bindings.filter((binding) => binding.protocol === AgentBindingProtocol.A2A),
    [bindings],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const binding = a2aBindings.find((entry) => entry.id === selectedId) ?? a2aBindings[0];
  const { result, loading, refresh } = useAgentCard(binding?.endpoint_url);

  if (!binding) {
    return (
      <Alert
        componentId="mlflow.agent-registry.card.no-binding"
        type="info"
        closable={false}
        message={intl.formatMessage({ defaultMessage: 'No A2A binding', description: 'Card tab > no binding title' })}
        description={intl.formatMessage({
          defaultMessage: 'A card is fetched through an a2a access binding. Add one when the agent is deployed.',
          description: 'Card tab > no binding description',
        })}
        css={{ maxWidth: 720 }}
      />
    );
  }

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, maxWidth: 900 }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {a2aBindings.length > 1 && (
          <SimpleSelect
            id="mlflow.agent-registry.card.binding"
            componentId="mlflow.agent-registry.card.binding"
            value={binding.id}
            onChange={({ target }) => setSelectedId(target.value)}
            label={intl.formatMessage({
              defaultMessage: 'Binding',
              description: 'Label for the card binding selector',
            })}
            width={320}
          >
            {a2aBindings.map((entry) => (
              <SimpleSelectOption key={entry.id} value={entry.id}>
                {entry.endpoint_url}
              </SimpleSelectOption>
            ))}
          </SimpleSelect>
        )}
        <Typography.Text size="sm" color="secondary">
          {loading ? (
            <FormattedMessage
              defaultMessage="Fetching {url}/.well-known/agent-card.json…"
              description="Card tab > fetching"
              values={{ url: binding.endpoint_url }}
            />
          ) : result ? (
            <FormattedMessage
              defaultMessage="Fetched from {url} at {time}. Not stored: the endpoint is the card's system of record."
              description="Card tab > fetched note"
              values={{ url: binding.endpoint_url, time: Utils.formatTimestamp(result.fetchedAt, intl) }}
            />
          ) : null}
        </Typography.Text>
        <Button
          componentId="mlflow.agent-registry.card.refresh"
          size="small"
          onClick={() => refresh()}
          disabled={loading}
        >
          <FormattedMessage defaultMessage="Fetch again" description="Card tab > refresh button" />
        </Button>
      </div>

      {result?.status === 'unreachable' && (
        <Alert
          componentId="mlflow.agent-registry.card.unreachable"
          type="warning"
          closable={false}
          message={intl.formatMessage({
            defaultMessage: 'No card could be fetched',
            description: 'Card tab > unreachable title',
          })}
          description={result.reason}
        />
      )}

      {result?.status === 'ok' && (
        <>
          <div
            css={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              rowGap: theme.spacing.sm,
              columnGap: theme.spacing.md,
              alignItems: 'flex-start',
            }}
          >
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Name:" description="Card tab > name label" />
            </Typography.Text>
            <Typography.Text>{result.card.name}</Typography.Text>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Card version:" description="Card tab > version label" />
            </Typography.Text>
            <Typography.Text>{result.card.version}</Typography.Text>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Provider:" description="Card tab > provider label" />
            </Typography.Text>
            <Typography.Text>{result.card.provider?.organization ?? '—'}</Typography.Text>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Capabilities:" description="Card tab > capabilities label" />
            </Typography.Text>
            <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {Object.entries(result.card.capabilities)
                .filter(([, enabled]) => enabled)
                .map(([capability]) => (
                  <Tag key={capability} componentId="mlflow.agent-registry.card.capability" color="indigo">
                    {capability}
                  </Tag>
                ))}
            </div>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Declared skills:" description="Card tab > skills label" />
            </Typography.Text>
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              {result.card.skills.map((skill) => (
                <div key={skill.id}>
                  <Typography.Text bold>{skill.name}</Typography.Text>
                  {skill.description && (
                    <div>
                      <Typography.Text size="sm" color="secondary">
                        {skill.description}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              ))}
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="What the agent says it can do. Deliberately separate from the registered skills in its composition: the two lists answer different questions."
                  description="Card tab > declared skills caption"
                />
              </Typography.Text>
            </div>
          </div>

          <div>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Raw card" description="Card tab > raw JSON heading" />
            </Typography.Text>
            <div css={{ marginTop: theme.spacing.xs }}>
              <LazyJsonRecordEditor
                value={JSON.stringify(result.card, null, 2)}
                onChange={() => {}}
                readOnly
                height="200px"
                maxHeight="420px"
                ariaLabel={intl.formatMessage({
                  defaultMessage: 'Fetched agent card JSON',
                  description: 'Aria label for the card viewer',
                })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
