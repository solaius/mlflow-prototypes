import { Modal } from '@databricks/design-system';
import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillTagsEditor } from '../../skills-registry/components/SkillTagsEditor';
import type { SkillTag } from '../../skills-registry/types';
import { deletePluginTag, setPluginTag } from '../mocks/pluginsStore';
import type { AgentPluginEntity } from '../types';

const COMPONENT_ID = 'mlflow.agent-plugins.edit-plugin-tags';

/**
 * Edits the PLUGIN-level tags on their own, for the pencil on the chip row under the page
 * title -- the skills registry's `useEditSkillTagsModal`. The kebab Edit modal no longer
 * carries tags, so each field has exactly one editor.
 *
 * RFC-0008 has no replace-all-tags call, so the save diffs the draft against what is stored
 * and issues one write per actual change.
 */
export const useEditPluginTagsModal = ({ plugin }: { plugin?: AgentPluginEntity }) => {
  const [open, setOpen] = useState(false);
  const [storedTags, setStoredTags] = useState<SkillTag[]>([]);
  const [tags, setTags] = useState<SkillTag[]>([]);

  // Seeded on open, not at mount: the page keeps this hook mounted across edits.
  const openModal = useCallback(() => {
    const current = plugin?.tags ? plugin.tags.map((tag) => ({ ...tag })) : [];
    setStoredTags(current);
    setTags(current.map((tag) => ({ ...tag })));
    setOpen(true);
  }, [plugin]);

  const handleSave = () => {
    if (!plugin) {
      return;
    }
    const draftKeys = new Set(tags.map((tag) => tag.key));
    storedTags
      .filter((tag) => !draftKeys.has(tag.key))
      .forEach((tag) => deletePluginTag(plugin.organization, plugin.name, tag.key));

    const storedByKey = new Map(storedTags.map((tag) => [tag.key, tag.value]));
    tags
      .filter((tag) => storedByKey.get(tag.key) !== tag.value)
      .forEach((tag) => setPluginTag(plugin.organization, plugin.name, tag.key, tag.value));

    setOpen(false);
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Edit tags" description="Agent plugins > plugin tag editor > title" />}
      okText={<FormattedMessage defaultMessage="Save" description="Agent plugins > plugin tag editor > save" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Agent plugins > plugin tag editor > cancel" />}
      onOk={handleSave}
    >
      <SkillTagsEditor componentId={`${COMPONENT_ID}.tags`} value={tags} onChange={setTags} />
    </Modal>
  );

  return { EditPluginTagsModal: modalElement, openEditPluginTagsModal: openModal };
};
