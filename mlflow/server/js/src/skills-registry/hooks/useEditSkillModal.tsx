import { FormUI, Input, Modal, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { SkillIconField } from '../components/SkillIconField';
import { updateSkill } from '../mocks/skillsStore';
import type { SkillEntity } from '../types';

const COMPONENT_ID = 'mlflow.skills-registry.edit-skill';

/**
 * Edits a skill's mutable presentation metadata, mirroring the MCP server registry's
 * `useEditServerModal`.
 *
 * This exists because of Daniel Warner's finding in the 2026-09-01 review: the MCP registry
 * lets you set tags while creating a server AND edit them afterwards, and the skills
 * registry did neither.
 *
 * Tags are NOT here. They have their own editor, reached from the pencil on the tag row
 * under the page title, so offering them in two places meant two drafts of the same list
 * and no answer for which one wins.
 *
 * Name and organization are NOT here either: RFC-0008 keys a skill on
 * `(organization, name)` and gives `update_skill` no field for either. A rename was tried
 * in the 2026-09-07 demo pass and dropped on 2026-09-11 (Peter Double and Daniel Warner),
 * since no rename can reach a `skills:/` URI that somebody has already copied.
 */
export const useEditSkillModal = ({ skill }: { skill?: SkillEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [icons, setIcons] = useState<RegistryIcon[]>([]);

  /**
   * Seeded on open rather than at mount: the modal would otherwise show whatever the skill
   * looked like on first render, which is stale after any edit or a rail navigation.
   */
  const openModal = () => {
    setDescription(skill?.description ?? '');
    setIcons(skill?.icons ? [...skill.icons] : []);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (skill) {
      updateSkill(skill.organization, skill.name, {
        description: description.trim(),
        icons: icons.filter((icon) => icon.src.trim()),
      });
    }
    setOpen(false);
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Edit skill" description="Header for the edit skill modal" />}
      okText={<FormattedMessage defaultMessage="Save" description="Confirm button in the edit skill modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the edit skill modal" />}
      onOk={handleSubmit}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
            <FormattedMessage defaultMessage="Description" description="Label for the skill description" />
          </FormUI.Label>
          <Input.TextArea
            id={`${COMPONENT_ID}.description`}
            componentId={`${COMPONENT_ID}.description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={intl.formatMessage({
              defaultMessage: 'What this skill does and when to use it.',
              description: 'Placeholder for the skill description input',
            })}
            autoSize={{ minRows: 2 }}
          />
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.icon.src`}>
            <FormattedMessage defaultMessage="Icons" description="Label for the skill icons section" />
          </FormUI.Label>
          <SkillIconField componentId={`${COMPONENT_ID}.icon`} value={icons} onChange={setIcons} />
        </div>
      </div>
    </Modal>
  );

  return { EditSkillModal: modalElement, openEditSkillModal: openModal };
};
