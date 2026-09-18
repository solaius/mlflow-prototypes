import {
  FormUI,
  Input,
  Modal,
  SimpleSelect,
  SimpleSelectOption,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { isValidEndpointUrl } from '../../mcp-registry/utils';
import { createAgentBinding, deleteAgentBinding, updateAgentBinding } from '../mocks/agentsStore';
import type { AgentAccessBinding, AgentAlias, AgentVersionEntity } from '../types';
import { AgentBindingProtocol } from '../types';
import { PROTOCOL_LABELS } from '../utils';

const COMPONENT_ID = 'mlflow.agent-registry.binding';

const ALIAS_PREFIX = 'alias:';
const VERSION_PREFIX = 'version:';

/**
 * Add or edit an access binding, mirroring the MCP registry's `AccessEndpointModal`: a URL,
 * a target that is either a version or an alias, and -- where agent bindings depart from
 * MCP's -- a protocol. `a2a` and `mcp` are actionable; `other` records where the agent lives
 * and takes a note saying how to reach it, since the protocol does not.
 *
 * The RFC's deployment-override proposal rides along as an optional experiment id: a
 * deployment that sends its traces somewhere other than the agent's default experiment
 * records that here so it stays findable from the agent's page.
 */
export const useAgentBindingModal = ({
  organization,
  agentName,
  versions,
  aliases,
}: {
  organization: string;
  agentName: string;
  versions: AgentVersionEntity[];
  aliases: AgentAlias[];
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AgentAccessBinding | undefined>(undefined);
  const [url, setUrl] = useState('');
  const [protocol, setProtocol] = useState<AgentBindingProtocol>(AgentBindingProtocol.A2A);
  const [target, setTarget] = useState('');
  const [experimentId, setExperimentId] = useState('');
  const [description, setDescription] = useState('');

  const openModal = (binding?: AgentAccessBinding, scopedVersion?: string) => {
    setEditing(binding);
    setUrl(binding?.endpoint_url ?? '');
    setProtocol(binding?.protocol ?? AgentBindingProtocol.A2A);
    setTarget(
      binding?.target_alias
        ? `${ALIAS_PREFIX}${binding.target_alias}`
        : binding?.target_version
          ? `${VERSION_PREFIX}${binding.target_version}`
          : scopedVersion
            ? `${VERSION_PREFIX}${scopedVersion}`
            : aliases[0]
              ? `${ALIAS_PREFIX}${aliases[0].alias}`
              : versions[0]
                ? `${VERSION_PREFIX}${versions[0].version}`
                : '',
    );
    setExperimentId(binding?.experiment_id ?? '');
    setDescription(binding?.description ?? '');
    setOpen(true);
  };

  const isValid = isValidEndpointUrl(url) && Boolean(target);

  const handleSubmit = () => {
    if (!isValid) {
      return;
    }
    const input = {
      endpoint_url: url,
      protocol,
      target_alias: target.startsWith(ALIAS_PREFIX) ? target.slice(ALIAS_PREFIX.length) : undefined,
      target_version: target.startsWith(VERSION_PREFIX) ? target.slice(VERSION_PREFIX.length) : undefined,
      experiment_id: experimentId,
      description,
    };
    if (editing) {
      updateAgentBinding(editing.id, input);
    } else {
      createAgentBinding(organization, agentName, input);
    }
    setOpen(false);
  };

  const distinctAliases = [...new Set(aliases.map((entry) => entry.alias))];

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={
        editing ? (
          <FormattedMessage defaultMessage="Edit access binding" description="Header for the edit binding modal" />
        ) : (
          <FormattedMessage defaultMessage="Add access binding" description="Header for the add binding modal" />
        )
      }
      okText={
        editing ? (
          <FormattedMessage defaultMessage="Save" description="Confirm button in the edit binding modal" />
        ) : (
          <FormattedMessage defaultMessage="Add" description="Confirm button in the add binding modal" />
        )
      }
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the binding modal" />}
      okButtonProps={{ disabled: !isValid }}
      onOk={handleSubmit}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.url`}>
            <FormattedMessage defaultMessage="Endpoint URL" description="Label for the binding URL input" />
          </FormUI.Label>
          <Input
            id={`${COMPONENT_ID}.url`}
            componentId={`${COMPONENT_ID}.url`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://agents.example.internal/billing"
            validationState={url && !isValidEndpointUrl(url) ? 'error' : undefined}
          />
          <FormUI.Hint>
            <FormattedMessage
              defaultMessage="Recorded, never probed. Whether anything answers here is the platform's question."
              description="Hint for the binding URL input"
            />
          </FormUI.Hint>
        </div>

        <div css={{ display: 'flex', gap: theme.spacing.sm }}>
          <div css={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            <FormUI.Label htmlFor={`${COMPONENT_ID}.protocol`}>
              <FormattedMessage defaultMessage="Protocol" description="Label for the binding protocol selector" />
            </FormUI.Label>
            <SimpleSelect
              id={`${COMPONENT_ID}.protocol`}
              componentId={`${COMPONENT_ID}.protocol`}
              value={protocol}
              onChange={({ target: element }) => setProtocol(element.value as AgentBindingProtocol)}
              label={intl.formatMessage({
                defaultMessage: 'Protocol',
                description: 'Label for the binding protocol selector',
              })}
            >
              {Object.values(AgentBindingProtocol).map((value) => (
                <SimpleSelectOption key={value} value={value}>
                  {PROTOCOL_LABELS[value]}
                </SimpleSelectOption>
              ))}
            </SimpleSelect>
            <FormUI.Hint>
              {protocol === AgentBindingProtocol.OTHER ? (
                <FormattedMessage
                  defaultMessage="A documented pointer. MLflow records where the agent lives but cannot invoke it."
                  description="Hint for the other protocol"
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Self-describing: URL plus protocol is enough to connect, trace and evaluate."
                  description="Hint for an actionable protocol"
                />
              )}
            </FormUI.Hint>
          </div>
          <div css={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            <FormUI.Label htmlFor={`${COMPONENT_ID}.target`}>
              <FormattedMessage defaultMessage="Target" description="Label for the binding target selector" />
            </FormUI.Label>
            <SimpleSelect
              id={`${COMPONENT_ID}.target`}
              componentId={`${COMPONENT_ID}.target`}
              value={target}
              onChange={({ target: element }) => setTarget(element.value)}
              label={intl.formatMessage({
                defaultMessage: 'Target',
                description: 'Label for the binding target selector',
              })}
            >
              {distinctAliases.map((alias) => (
                <SimpleSelectOption key={`alias:${alias}`} value={`${ALIAS_PREFIX}${alias}`}>
                  @{alias}
                </SimpleSelectOption>
              ))}
              {versions.map((version) => (
                <SimpleSelectOption key={`version:${version.version}`} value={`${VERSION_PREFIX}${version.version}`}>
                  {intl.formatMessage(
                    { defaultMessage: 'Version {version}', description: 'Binding target option for a version' },
                    { version: version.version },
                  )}
                </SimpleSelectOption>
              ))}
            </SimpleSelect>
            <FormUI.Hint>
              <FormattedMessage
                defaultMessage="An alias target follows the alias as it moves between versions."
                description="Hint for the binding target selector"
              />
            </FormUI.Hint>
          </div>
        </div>

        {protocol === AgentBindingProtocol.OTHER && (
          <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
              <FormattedMessage
                defaultMessage="How to connect"
                description="Label for the other-protocol binding note"
              />
            </FormUI.Label>
            <Input.TextArea
              id={`${COMPONENT_ID}.description`}
              componentId={`${COMPONENT_ID}.description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={intl.formatMessage({
                defaultMessage: 'What to send, and how to authenticate.',
                description: 'Placeholder for the other-protocol binding note',
              })}
              autoSize={{ minRows: 2 }}
            />
          </div>
        )}

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.experiment`}>
            <FormattedMessage
              defaultMessage="Trace destination override"
              description="Label for the binding experiment override"
            />
          </FormUI.Label>
          <Input
            id={`${COMPONENT_ID}.experiment`}
            componentId={`${COMPONENT_ID}.experiment`}
            value={experimentId}
            onChange={(event) => setExperimentId(event.target.value)}
            placeholder={intl.formatMessage({
              defaultMessage: 'Experiment id, if this deployment does not log to the agent’s default',
              description: 'Placeholder for the binding experiment override',
            })}
          />
          <Typography.Text size="sm" color="secondary">
            <FormattedMessage
              defaultMessage="Optional. Keeps a deployment with its own experiment findable from this page."
              description="Hint for the binding experiment override"
            />
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );

  return { BindingModal: modalElement, openBindingModal: openModal };
};

/** Retiring a deployment deletes its binding; the agent, its versions and its history are untouched. */
export const useDeleteBindingModal = () => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<AgentAccessBinding | undefined>(undefined);

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.delete-modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={
        <FormattedMessage defaultMessage="Delete access binding" description="Header for the delete binding modal" />
      }
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete binding modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete binding modal" />}
      okButtonProps={{ danger: true }}
      onOk={() => {
        if (target) {
          deleteAgentBinding(target.id);
        }
        setOpen(false);
      }}
    >
      <FormattedMessage
        defaultMessage="Delete the binding for {url}? The agent, its versions and its history are untouched. Only the record of this endpoint goes."
        description="Content of the delete binding confirmation modal"
        values={{ url: target?.endpoint_url }}
      />
    </Modal>
  );

  return {
    DeleteBindingModal: modalElement,
    openDeleteBindingModal: (binding: AgentAccessBinding) => {
      setTarget(binding);
      setOpen(true);
    },
  };
};
