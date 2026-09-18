import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import Utils from '../../common/utils/Utils';
import { AgentStatusTag } from './AgentCellRenderers';
import type { AgentVersionEntity } from '../types';

/**
 * The auditable transition history RFC-0011 requires: every lifecycle change with a
 * timestamp and an actor, human or CI identity. This is the accountability chain problem 1
 * names as missing -- for any agent, the registry can say who promoted it and when.
 */
export const AgentLifecycleTab = ({ agentVersion }: { agentVersion: AgentVersionEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const events = [...agentVersion.status_history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <Typography.Text color="secondary" size="sm">
        <FormattedMessage
          defaultMessage="Registered as draft by {actor} at {time}. Every transition since is recorded with its actor."
          description="Lifecycle tab > registration line"
          values={{
            actor: agentVersion.created_by,
            time: Utils.formatTimestamp(agentVersion.creation_timestamp, intl),
          }}
        />
      </Typography.Text>
      {events.length ? (
        <Table data-testid="agent-lifecycle-table" scrollable>
          <TableRow isHeader>
            <TableHeader componentId="mlflow.agent-registry.lifecycle.header-transition">
              <FormattedMessage defaultMessage="Transition" description="Lifecycle table > transition column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.lifecycle.header-actor" css={{ maxWidth: 220 }}>
              <FormattedMessage defaultMessage="Actor" description="Lifecycle table > actor column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.lifecycle.header-time" css={{ maxWidth: 200 }}>
              <FormattedMessage defaultMessage="When" description="Lifecycle table > time column" />
            </TableHeader>
            <TableHeader componentId="mlflow.agent-registry.lifecycle.header-note">
              <FormattedMessage defaultMessage="Note" description="Lifecycle table > note column" />
            </TableHeader>
          </TableRow>
          {events.map((event, index) => (
            <TableRow key={`${event.timestamp}-${index}`}>
              <TableCell>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <AgentStatusTag status={event.from} />
                  <Typography.Text size="sm">to</Typography.Text>
                  <AgentStatusTag status={event.to} />
                </div>
              </TableCell>
              <TableCell ellipsis css={{ maxWidth: 220 }}>
                <Typography.Text code>{event.actor}</Typography.Text>
              </TableCell>
              <TableCell ellipsis css={{ maxWidth: 200 }}>
                {Utils.formatTimestamp(event.timestamp, intl)}
              </TableCell>
              <TableCell ellipsis>
                {event.note ?? <Typography.Text color="secondary">&mdash;</Typography.Text>}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : (
        <Typography.Text color="secondary">
          <FormattedMessage
            defaultMessage="No transitions yet. This version is still in the state it was registered in."
            description="Lifecycle tab > empty"
          />
        </Typography.Text>
      )}
    </div>
  );
};
