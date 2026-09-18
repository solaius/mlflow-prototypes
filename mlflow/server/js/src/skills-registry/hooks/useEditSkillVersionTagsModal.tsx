import { Modal } from '@databricks/design-system';
import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillTagsEditor } from '../components/SkillTagsEditor';
import { deleteSkillVersionTag, setSkillVersionTag } from '../mocks/skillsStore';
import type { SkillTag, SkillVersionEntity } from '../types';

const COMPONENT_ID = 'mlflow.skills-registry.edit-version-tags';

/**
 * Edits the tags on ONE skill version.
 *
 * Separate from the skill-level editor on purpose. RFC-0008 carries tags at both levels
 * with their own endpoints, and the distinction carries meaning: a skill-level tag
 * describes the asset, a version-level tag describes one registration of it. The pane
 * already showed these read-only; this is the other half.
 *
 * Writes go through `set_skill_tag` / `delete_skill_tag`'s version-scoped equivalents
 * rather than replacing the collection wholesale, because that is the shape of the API
 * this stands in for: the RFC has no "replace all tags" call. So the save diffs the draft
 * against what is stored and issues one write per actual change -- a rename lands as a
 * delete of the old key and a set of the new one.
 */
export const useEditSkillVersionTagsModal = ({
  organization,
  skillName,
}: {
  organization: string;
  skillName: string;
}) => {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [storedTags, setStoredTags] = useState<SkillTag[]>([]);
  const [tags, setTags] = useState<SkillTag[]>([]);

  /**
   * Seeded on open rather than at mount: the pane keeps this hook mounted across version
   * selections, so reading at mount would edit whichever version happened to be showing
   * first.
   */
  const openModal = useCallback((skillVersion: SkillVersionEntity) => {
    const current = skillVersion.tags.map((tag) => ({ ...tag }));
    setVersion(skillVersion.version);
    setStoredTags(current);
    setTags(current.map((tag) => ({ ...tag })));
    setOpen(true);
  }, []);

  const handleSave = () => {
    if (version === undefined) {
      return;
    }
    const draftKeys = new Set(tags.map((tag) => tag.key));
    storedTags
      .filter((tag) => !draftKeys.has(tag.key))
      .forEach((tag) => deleteSkillVersionTag(organization, skillName, version, tag.key));

    const storedByKey = new Map(storedTags.map((tag) => [tag.key, tag.value]));
    tags
      .filter((tag) => storedByKey.get(tag.key) !== tag.value)
      .forEach((tag) => setSkillVersionTag(organization, skillName, version, tag.key, tag.value));

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
          description="Skills registry > version tag editor > modal title"
          values={{ version }}
        />
      }
      okText={<FormattedMessage defaultMessage="Save" description="Skills registry > version tag editor > save" />}
      cancelText={
        <FormattedMessage defaultMessage="Cancel" description="Skills registry > version tag editor > cancel" />
      }
      onOk={handleSave}
    >
      <SkillTagsEditor componentId={`${COMPONENT_ID}.tags`} value={tags} onChange={setTags} />
    </Modal>
  );

  return { EditSkillVersionTagsModal: modalElement, openEditSkillVersionTagsModal: openModal };
};
