import { FormUI, Modal, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillTagsEditor } from '../../skills-registry/components/SkillTagsEditor';
import type { SkillTag } from '../../skills-registry/types';
import { deletePluginVersionTag, setPluginVersionTag } from '../mocks/pluginsStore';
import type { AgentPluginVersionEntity } from '../types';

const COMPONENT_ID = 'mlflow.agent-plugins.edit-version-tags';

/**
 * Version-level tag editor, the plugin twin of `useEditSkillVersionTagsModal`. RFC-0008
 * gives plugin versions their own tag endpoints, distinct from the parent's, and the
 * distinction carries meaning: a plugin-level tag describes the asset, a version-level
 * tag describes one registration of it.
 */
export const useEditPluginVersionTagsModal = ({
  organization,
  pluginName,
}: {
  organization: string;
  pluginName: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<AgentPluginVersionEntity | undefined>(undefined);
  const [tags, setTags] = useState<SkillTag[]>([]);

  const openModal = (pluginVersion: AgentPluginVersionEntity) => {
    setTarget(pluginVersion);
    setTags(pluginVersion.tags.map((tag) => ({ ...tag })));
    setOpen(true);
  };

  const handleSubmit = () => {
    if (target) {
      const draftKeys = new Set(tags.map((tag) => tag.key));
      target.tags
        .filter((tag) => !draftKeys.has(tag.key))
        .forEach((tag) => deletePluginVersionTag(organization, pluginName, target.version, tag.key));
      const storedByKey = new Map(target.tags.map((tag) => [tag.key, tag.value]));
      tags
        .filter((tag) => storedByKey.get(tag.key) !== tag.value)
        .forEach((tag) => setPluginVersionTag(organization, pluginName, target.version, tag.key, tag.value));
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
          description="Header for the edit plugin version tags modal"
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
          <FormattedMessage defaultMessage="Version tags" description="Label for the plugin version tags editor" />
        </FormUI.Label>
        <SkillTagsEditor componentId={`${COMPONENT_ID}.tags`} value={tags} onChange={setTags} />
        <FormUI.Hint>
          <FormattedMessage
            defaultMessage="Describe this registration. Tags that describe the plugin itself belong on the plugin."
            description="Hint distinguishing version-level from plugin-level tags"
          />
        </FormUI.Hint>
      </div>
    </Modal>
  );

  return { EditPluginVersionTagsModal: modalElement, openEditPluginVersionTagsModal: openModal };
};
