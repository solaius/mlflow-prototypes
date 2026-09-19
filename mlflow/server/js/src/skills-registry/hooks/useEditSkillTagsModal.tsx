import { Modal } from '@databricks/design-system';
import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillTagsEditor } from '../components/SkillTagsEditor';
import { deleteSkillTag, setSkillTag } from '../mocks/skillsStore';
import type { SkillEntity, SkillTag } from '../types';

const COMPONENT_ID = 'mlflow.skills-registry.edit-skill-tags';

/**
 * Edits the SKILL-level tags on their own, so the chip row under the page title can carry
 * a pencil the way the prompt details page's `PromptsListTableTagsBox` does.
 *
 * `useEditSkillModal` can already reach these tags, but it also carries description and
 * icon. A pencil sitting beside the tags that opens a form of unrelated fields is a worse
 * affordance than no pencil at all, so this narrows the modal to what the pencil points at.
 * `useEditSkillVersionTagsModal` is the version-scoped twin of this hook.
 *
 * Writes go through `set_skill_tag` / `delete_skill_tag` per tag rather than replacing the
 * collection wholesale, because RFC-0008 has no "replace all tags" call. The save diffs the
 * draft against what is stored and issues one write per actual change -- a rename lands as
 * a delete of the old key and a set of the new one.
 */
export const useEditSkillTagsModal = ({ skill }: { skill?: SkillEntity }) => {
  const [open, setOpen] = useState(false);
  const [storedTags, setStoredTags] = useState<SkillTag[]>([]);
  const [tags, setTags] = useState<SkillTag[]>([]);

  /**
   * Seeded on open rather than at mount: the page keeps this hook mounted across rail
   * navigations and edits, so reading at mount would edit a stale snapshot.
   */
  const openModal = useCallback(() => {
    const current = skill?.tags ? skill.tags.map((tag) => ({ ...tag })) : [];
    setStoredTags(current);
    setTags(current.map((tag) => ({ ...tag })));
    setOpen(true);
  }, [skill]);

  const handleSave = () => {
    if (!skill) {
      return;
    }
    const draftKeys = new Set(tags.map((tag) => tag.key));
    storedTags
      .filter((tag) => !draftKeys.has(tag.key))
      .forEach((tag) => deleteSkillTag(skill.organization, skill.name, tag.key));

    const storedByKey = new Map(storedTags.map((tag) => [tag.key, tag.value]));
    tags
      .filter((tag) => storedByKey.get(tag.key) !== tag.value)
      .forEach((tag) => setSkillTag(skill.organization, skill.name, tag.key, tag.value));

    setOpen(false);
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Edit tags" description="Skills registry > skill tag editor > title" />}
      okText={<FormattedMessage defaultMessage="Save" description="Skills registry > skill tag editor > save" />}
      cancelText={
        <FormattedMessage defaultMessage="Cancel" description="Skills registry > skill tag editor > cancel" />
      }
      onOk={handleSave}
    >
      <SkillTagsEditor componentId={`${COMPONENT_ID}.tags`} value={tags} onChange={setTags} />
    </Modal>
  );

  return { EditSkillTagsModal: modalElement, openEditSkillTagsModal: openModal };
};
