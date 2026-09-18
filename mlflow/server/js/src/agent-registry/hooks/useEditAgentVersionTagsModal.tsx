import { FormUI, Modal, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillTagsEditor } from '../../skills-registry/components/SkillTagsEditor';
import type { SkillTag } from '../../skills-registry/types';
import { deleteAgentVersionTag, setAgentVersionTag } from '../mocks/agentsStore';
import type { AgentVersionEntity } from '../types';

const COMPONENT_ID = 'mlflow.agent-registry.edit-version-tags';

/** Version-level tag editor, the agent twin of the skill and plugin ones. Tags are the one mutable thing on a version. */
export const useEditAgentVersionTagsModal = ({
  organization,
  agentName,
}: {
  organization: string;
  agentName: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<AgentVersionEntity | undefined>(undefined);
  const [tags, setTags] = useState<SkillTag[]>([]);

  const openModal = (agentVersion: AgentVersionEntity) => {
    setTarget(agentVersion);
    setTags(agentVersion.tags.map((tag) => ({ ...tag })));
    setOpen(true);
  };

  const handleSubmit = () => {
    if (target) {
      const draftKeys = new Set(tags.map((tag) => tag.key));
      target.tags
        .filter((tag) => !draftKeys.has(tag.key))
        .forEach((tag) => deleteAgentVersionTag(organization, agentName, target.version, tag.key));
      const storedByKey = new Map(target.tags.map((tag) => [tag.key, tag.value]));
      tags
        .filter((tag) => storedByKey.get(tag.key) !== tag.value)
        .forEach((tag) => setAgentVersionTag(organization, agentName, target.version, tag.key, tag.value));
    }
    setOpen(false);
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={
        <FormattedMessage
          defaultMessage="Edit tags for version {version}"
          description="Header for the edit agent version tags modal"
          values={{ version: target?.version }}
        />
      }
      okText={<FormattedMessage defaultMessage="Save" description="Confirm button in the edit version tags modal" />}
      cancelText={
        <FormattedMessage defaultMessage="Cancel" description="Cancel button in the edit version tags modal" />
      }
      onOk={handleSubmit}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <FormUI.Label htmlFor={`${COMPONENT_ID}.tags.key`}>
          <FormattedMessage defaultMessage="Version tags" description="Label for the agent version tags editor" />
        </FormUI.Label>
        <SkillTagsEditor componentId={`${COMPONENT_ID}.tags`} value={tags} onChange={setTags} />
        <FormUI.Hint>
          <FormattedMessage
            defaultMessage="Free-form facts about this registration that fit no BOM axis. Tags that describe the agent itself belong on the agent."
            description="Hint distinguishing version-level from agent-level tags"
          />
        </FormUI.Hint>
      </div>
    </Modal>
  );

  return { EditAgentVersionTagsModal: modalElement, openEditAgentVersionTagsModal: openModal };
};
