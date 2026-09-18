import {
  Button,
  PencilIcon,
  PlusIcon,
  Tooltip,
  TrashIcon,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import Utils from '../../common/utils/Utils';
import { Link } from '../../common/utils/RoutingUtils';
import Routes from '../../experiment-tracking/routes';
import { ProtocolTag } from './AgentCellRenderers';
import { useAgentBindingModal, useDeleteBindingModal } from '../hooks/useAgentBindingModals';
import type { AgentAccessBinding, AgentEntity, AgentVersionEntity } from '../types';
import { AgentBindingProtocol } from '../types';
import { formatBindingTarget, isActionableProtocol, resolveBindingTarget } from '../utils';

/**
 * The agent's access bindings, at the agent level, since a binding targets a version or an
 * alias rather than belonging to either. Mirrors the MCP registry's endpoints subsection:
 * a protocol tag, the URL, the target and what it resolves to, edit and delete, and an add
 * button.
 *
 * `a2a` and `mcp` bindings are actionable: they are the entry points for endpoint-driven
 * tracing and evaluation, and for the live card. An `other` binding is a documented pointer
 * and shows its note instead.
 */
export const AgentBindingsSection = ({
  agent,
  versions,
  bindings,
}: {
  agent: AgentEntity;
  versions: AgentVersionEntity[];
  bindings: AgentAccessBinding[];
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const { BindingModal, openBindingModal } = useAgentBindingModal({
    organization: agent.organization,
    agentName: agent.name,
    versions,
    aliases: agent.aliases,
  });
  const { DeleteBindingModal, openDeleteBindingModal } = useDeleteBindingModal();

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <Typography.Text size="sm" color="secondary">
          <FormattedMessage defaultMessage="Access bindings" description="Agent page > bindings section label" />
        </Typography.Text>
        <Tooltip
          componentId="mlflow.agent-registry.bindings.help"
          content={intl.formatMessage({
            defaultMessage:
              'Where approved endpoints for this agent are. Mutable, separate from the immutable versions; a binding that targets an alias follows it. Recorded, never probed.',
            description: 'Tooltip explaining access bindings',
          })}
        >
          <Button
            componentId="mlflow.agent-registry.bindings.add"
            size="small"
            icon={<PlusIcon />}
            onClick={() => openBindingModal()}
            aria-label={intl.formatMessage({
              defaultMessage: 'Add access binding',
              description: 'Aria label for the add binding button',
            })}
          >
            <FormattedMessage defaultMessage="Add binding" description="Button adding an access binding" />
          </Button>
        </Tooltip>
      </div>

      {bindings.length === 0 ? (
        <Typography.Text color="secondary" size="sm">
          <FormattedMessage
            defaultMessage="None. Add one when the agent is deployed; until then it can still be traced and evaluated by running its code."
            description="Agent page > no bindings"
          />
        </Typography.Text>
      ) : (
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {bindings.map((binding) => {
            const resolved = resolveBindingTarget(binding, agent.aliases);
            return (
              <div
                key={binding.id}
                css={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borders.borderRadiusSm,
                  flexWrap: 'wrap',
                }}
              >
                <ProtocolTag protocol={binding.protocol} />
                <Typography.Link
                  componentId="mlflow.agent-registry.bindings.url"
                  href={binding.endpoint_url}
                  openInNewTab
                  css={{ wordBreak: 'break-all' }}
                >
                  {binding.endpoint_url}
                </Typography.Link>
                <Typography.Text size="sm" color="secondary">
                  {formatBindingTarget(binding)}
                  {binding.target_alias && resolved ? ` → v${resolved}` : ''}
                </Typography.Text>
                {!isActionableProtocol(binding.protocol) && binding.description && (
                  <Typography.Text size="sm" color="secondary">
                    {binding.description}
                  </Typography.Text>
                )}
                {binding.experiment_id && (
                  <Typography.Text size="sm" color="secondary">
                    <FormattedMessage
                      defaultMessage="traces to {link}"
                      description="Binding row > overridden experiment"
                      values={{
                        link: (
                          <Link
                            componentId="mlflow.agent-registry.bindings.experiment"
                            to={Routes.getExperimentPageTracesTabRoute(binding.experiment_id)}
                          >
                            experiment {binding.experiment_id}
                          </Link>
                        ),
                      }}
                    />
                  </Typography.Text>
                )}
                <Typography.Text size="sm" color="secondary" css={{ marginLeft: 'auto' }}>
                  {binding.created_by === 'rhoai-registry-sync' ? (
                    <FormattedMessage
                      defaultMessage="platform-synced"
                      description="Binding row > synced by the platform"
                    />
                  ) : (
                    <FormattedMessage
                      defaultMessage="by {actor}, {time}"
                      description="Binding row > who and when"
                      values={{
                        actor: binding.last_updated_by ?? binding.created_by,
                        time: Utils.formatTimestamp(binding.last_updated_timestamp, intl),
                      }}
                    />
                  )}
                </Typography.Text>
                <Button
                  componentId="mlflow.agent-registry.bindings.edit"
                  type="tertiary"
                  size="small"
                  icon={<PencilIcon />}
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Edit binding',
                    description: 'Aria label for the edit binding button',
                  })}
                  onClick={() => openBindingModal(binding)}
                />
                <Button
                  componentId="mlflow.agent-registry.bindings.delete"
                  type="tertiary"
                  size="small"
                  icon={<TrashIcon />}
                  danger
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Delete binding',
                    description: 'Aria label for the delete binding button',
                  })}
                  onClick={() => openDeleteBindingModal(binding)}
                />
                {binding.protocol === AgentBindingProtocol.A2A && (
                  <Typography.Text size="sm" color="secondary">
                    <FormattedMessage defaultMessage="serves the live card" description="Binding row > a2a card note" />
                  </Typography.Text>
                )}
              </div>
            );
          })}
        </div>
      )}

      {BindingModal}
      {DeleteBindingModal}
    </div>
  );
};
