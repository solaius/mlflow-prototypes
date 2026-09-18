import { Modal, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { getAgentQualifiedName } from '../constants';
import { deleteAgent, deleteAgentVersion } from '../mocks/agentsStore';
import { useAgentsCallingAgent } from './useCrossRegistryQueries';

/**
 * What deleting this would affect: the agent versions whose BOM names this agent as a
 * callee. RFC-0011's `agents` axis exists so this question has an answer; the confirmation
 * is where the answer is worth having.
 */
const DeletionImpact = ({ qualifiedAgentName, version }: { qualifiedAgentName?: string; version?: string }) => {
  const { theme } = useDesignSystemTheme();
  const callers = useAgentsCallingAgent(qualifiedAgentName, version);

  if (!callers.length) {
    return null;
  }

  return (
    <div css={{ marginTop: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <Typography.Text bold>
        <FormattedMessage
          defaultMessage="{count, plural, one {# agent version calls} other {# agent versions call}} this agent:"
          description="Agent registry > delete confirmation > callers heading"
          values={{ count: callers.length }}
        />
      </Typography.Text>
      <ul css={{ margin: 0, paddingLeft: theme.spacing.lg }}>
        {callers.map(({ agentOrganization, agentName, agentVersion, pinnedVersion }) => (
          <li key={`${agentOrganization}/${agentName}@${agentVersion.version}`}>
            <Typography.Text>
              {`${getAgentQualifiedName(agentOrganization, agentName)} v${agentVersion.version}`}
              {pinnedVersion ? ` (pins v${pinnedVersion})` : ' (name-level)'}
            </Typography.Text>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Whole-agent delete: the agent, every version, every binding. */
export const useDeleteAgentModal = ({
  organization,
  agentName,
  onSuccess,
}: {
  organization?: string;
  agentName?: string;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const qualifiedName =
    organization !== undefined && agentName ? getAgentQualifiedName(organization, agentName) : undefined;

  const modalElement = (
    <Modal
      componentId="mlflow.agent-registry.delete-agent-modal"
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Delete agent" description="Header for the delete agent modal" />}
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete agent modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete agent modal" />}
      okButtonProps={{ danger: true }}
      onOk={() => {
        if (organization === undefined || !agentName) {
          setOpen(false);
          return;
        }
        deleteAgent(organization, agentName);
        setOpen(false);
        onSuccess?.();
      }}
    >
      <div>
        <FormattedMessage
          defaultMessage='Are you sure you want to delete "{agentName}", all of its versions and all of its access bindings? Its traces and evaluation runs stay in its experiment. This action cannot be undone.'
          description="Content of the delete agent confirmation modal"
          values={{ agentName: qualifiedName }}
        />
        <DeletionImpact qualifiedAgentName={qualifiedName} />
      </div>
    </Modal>
  );

  return { DeleteAgentModal: modalElement, openModal: () => setOpen(true) };
};

/**
 * Single-version delete: a soft delete, as in the sibling registries. The version keeps its
 * row and number, becomes terminal `deleted`, loses its aliases and any binding that
 * targeted it by version, and is never returned again.
 */
export const useDeleteAgentVersionModal = ({
  organization,
  agentName,
  version,
  onSuccess,
}: {
  organization?: string;
  agentName?: string;
  version?: string;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const qualifiedName =
    organization !== undefined && agentName ? getAgentQualifiedName(organization, agentName) : undefined;

  const modalElement = (
    <Modal
      componentId="mlflow.agent-registry.delete-agent-version-modal"
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Delete version" description="Header for the delete version modal" />}
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete version modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete version modal" />}
      okButtonProps={{ danger: true }}
      onOk={() => {
        if (organization === undefined || !agentName || !version) {
          setOpen(false);
          return;
        }
        deleteAgentVersion(organization, agentName, version);
        setOpen(false);
        onSuccess?.();
      }}
    >
      <div>
        <FormattedMessage
          defaultMessage="Delete version {version}? Its number is never reused, but the version is removed from resolution and discovery, any alias pointing at it is dropped, and any binding targeting it by version goes with it. Its traces stay in the agent's experiment. This cannot be undone."
          description="Content of the delete agent version confirmation modal"
          values={{ version }}
        />
        <DeletionImpact qualifiedAgentName={qualifiedName} version={version} />
        <div css={{ marginTop: 8 }}>
          <Typography.Text color="secondary" size="sm">
            <FormattedMessage
              defaultMessage="Retiring this version rather than withdrawing it? Deprecate it instead: still visible, marked as superseded, and every reference to it keeps resolving."
              description="Delete agent version modal > pointer to deprecation"
            />
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );

  return { DeleteAgentVersionModal: modalElement, openModal: () => setOpen(true) };
};
