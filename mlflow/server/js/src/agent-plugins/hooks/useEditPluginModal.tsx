import { FormUI, Input, Modal, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { SkillIconField } from '../../skills-registry/components/SkillIconField';
import { updatePlugin } from '../mocks/pluginsStore';
import type { AgentPluginEntity } from '../types';

const COMPONENT_ID = 'mlflow.agent-plugins.edit-plugin';

/**
 * Edits a plugin's mutable presentation metadata, mirroring the skill registry's
 * `useEditSkillModal` and the MCP server registry's `useEditServerModal`.
 *
 * Scoped to exactly what RFC-0008 makes mutable on the parent through `update_agent_plugin`:
 * `description` and `icons`. Tags have their own editor on the header tag row, so they are
 * not here. Name and organization are the primary key and never editable; a version's
 * manifest, members and source are immutable.
 */
export const useEditPluginModal = ({ plugin }: { plugin?: AgentPluginEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [icons, setIcons] = useState<RegistryIcon[]>([]);

  const openModal = () => {
    setDescription(plugin?.description ?? '');
    setIcons(plugin?.icons ? [...plugin.icons] : []);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (plugin) {
      updatePlugin(plugin.organization, plugin.name, { description: description.trim(), icons });
    }
    setOpen(false);
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Edit agent plugin" description="Header for the edit plugin modal" />}
      okText={<FormattedMessage defaultMessage="Save" description="Confirm button in the edit plugin modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the edit plugin modal" />}
      onOk={handleSubmit}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
            <FormattedMessage defaultMessage="Description" description="Label for the plugin description" />
          </FormUI.Label>
          <Input.TextArea
            id={`${COMPONENT_ID}.description`}
            componentId={`${COMPONENT_ID}.description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={intl.formatMessage({
              defaultMessage: 'What this plugin bundles and who it is for.',
              description: 'Placeholder for the plugin description input',
            })}
            autoSize={{ minRows: 2 }}
          />
          <FormUI.Hint>
            <FormattedMessage
              defaultMessage="Leave blank to show the manifest's description."
              description="Hint explaining the manifest fallback for an empty plugin description"
            />
          </FormUI.Hint>
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <FormUI.Label htmlFor={`${COMPONENT_ID}.icon.src`}>
            <FormattedMessage defaultMessage="Icon" description="Label for the plugin icon field" />
          </FormUI.Label>
          <SkillIconField componentId={`${COMPONENT_ID}.icon`} value={icons} onChange={setIcons} />
        </div>
      </div>
    </Modal>
  );

  return { EditPluginModal: modalElement, openEditPluginModal: openModal };
};
