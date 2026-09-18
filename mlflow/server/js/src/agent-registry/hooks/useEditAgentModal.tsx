import { FormUI, Input, Modal, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { SkillIconField } from '../../skills-registry/components/SkillIconField';
import { updateAgent } from '../mocks/agentsStore';
import type { AgentEntity } from '../types';

const COMPONENT_ID = 'mlflow.agent-registry.edit-agent';

/**
 * Edits an agent's mutable MLflow-managed metadata: display name, description and icon.
 * Tags have their own editor on the header tag row. Scoped to what RFC-0011 keeps mutable on the parent -- the name and organization are
 * the key, and everything on a version is immutable. Same shape as the skill and plugin
 * edit modals.
 */
export const useEditAgentModal = ({ agent }: { agent?: AgentEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [icons, setIcons] = useState<RegistryIcon[]>([]);

  const openModal = () => {
    setDisplayName(agent?.display_name ?? '');
    setDescription(agent?.description ?? '');
    setIcons(agent?.icons ? [...agent.icons] : []);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (agent) {
      updateAgent(agent.organization, agent.name, { description: description.trim(), displayName, icons });
    }
    setOpen(false);
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Edit agent" description="Header for the edit agent modal" />}
      okText={<FormattedMessage defaultMessage="Save" description="Confirm button in the edit agent modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the edit agent modal" />}
      onOk={handleSubmit}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.display-name`}>
            <FormattedMessage defaultMessage="Display name" description="Label for the agent display name" />
          </FormUI.Label>
          <Input
            id={`${COMPONENT_ID}.display-name`}
            componentId={`${COMPONENT_ID}.display-name`}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Incident Commander"
          />
          <FormUI.Hint>
            <FormattedMessage
              defaultMessage="A free-form label. Seeded from the Agent Card on A2A import; the registry name is the identity."
              description="Hint for the agent display name"
            />
          </FormUI.Hint>
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
            <FormattedMessage defaultMessage="Description" description="Label for the agent description" />
          </FormUI.Label>
          <Input.TextArea
            id={`${COMPONENT_ID}.description`}
            componentId={`${COMPONENT_ID}.description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={intl.formatMessage({
              defaultMessage: 'What this agent does and when to use it.',
              description: 'Placeholder for the agent description input',
            })}
            autoSize={{ minRows: 2 }}
          />
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.icon.src`}>
            <FormattedMessage defaultMessage="Icon" description="Label for the agent icon field" />
          </FormUI.Label>
          <SkillIconField componentId={`${COMPONENT_ID}.icon`} value={icons} onChange={setIcons} />
        </div>
      </div>
    </Modal>
  );

  return { EditAgentModal: modalElement, openEditAgentModal: openModal };
};
