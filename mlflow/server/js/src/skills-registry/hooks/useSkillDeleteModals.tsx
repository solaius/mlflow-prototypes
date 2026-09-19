import { Modal, Typography } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { deleteSkill, deleteSkillVersion } from '../mocks/skillsStore';

/**
 * Whole-skill delete, mirroring the prompts feature's `useDeletePromptModal`
 * (`experiment-tracking/pages/prompts/hooks/useDeletePromptModal.tsx`): a
 * self-contained hook returning `{ DeleteSkillModal, openModal }`, a design-system
 * `Modal` with `okButtonProps={{ danger: true }}`. There's no backend here, so
 * `onOk` calls the session store directly instead of a mutation.
 */
export const useDeleteSkillModal = ({
  organization,
  skillName,
  onSuccess,
}: {
  organization?: string;
  skillName?: string;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);

  const modalElement = (
    <Modal
      componentId="mlflow.skills-registry.delete-skill-modal"
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Delete skill" description="Header for the delete skill modal" />}
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete skill modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete skill modal" />}
      okButtonProps={{ danger: true }}
      onOk={() => {
        if (organization === undefined || !skillName) {
          setOpen(false);
          return;
        }
        deleteSkill(organization, skillName);
        setOpen(false);
        onSuccess?.();
      }}
    >
      <FormattedMessage
        defaultMessage='Are you sure you want to delete "{skillName}" and all of its versions? This action cannot be undone.'
        description="Content of the delete skill confirmation modal"
        values={{ skillName }}
      />
    </Modal>
  );

  return { DeleteSkillModal: modalElement, openModal: () => setOpen(true) };
};

/**
 * Single-version delete, mirroring `useDeletePromptVersionModal`. The caller is
 * expected to have already gated the triggering button on `canDeleteSkillVersion` —
 * this hook doesn't re-check, it just performs the delete.
 *
 * "Delete" here is RFC-0008's soft delete: the version record and its number survive,
 * the status becomes the terminal `deleted`, and the version is removed from
 * resolution, discovery and pull. The copy says so, because a confirmation that reads
 * like a hard delete would misrepresent what the button does.
 */
export const useDeleteSkillVersionModal = ({
  organization,
  skillName,
  version,
  onSuccess,
}: {
  organization?: string;
  skillName?: string;
  version?: number;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);

  const modalElement = (
    <Modal
      componentId="mlflow.skills-registry.delete-skill-version-modal"
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Delete version" description="Header for the delete version modal" />}
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete version modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete version modal" />}
      okButtonProps={{ danger: true }}
      onOk={() => {
        if (organization === undefined || !skillName || version === undefined) {
          setOpen(false);
          return;
        }
        deleteSkillVersion(organization, skillName, version);
        setOpen(false);
        onSuccess?.();
      }}
    >
      {/*
        One element rather than two siblings: the design system's Modal renders whatever it
        is given as a list, so a bare pair of children draws a missing-key warning.
      */}
      <div>
        <FormattedMessage
          defaultMessage="Delete version {version}? Its number is retained and never reused, but the version is removed from resolution, discovery and pull, the registry stops returning it, and any alias pointing at it is dropped. This cannot be undone."
          description="Content of the delete version confirmation modal"
          values={{ version }}
        />
        {/*
          RFC-0008 names deprecation as the route for "routine, non-breaking retirement",
          and reserves delete for withdrawal — it calls soft delete a kill switch for
          compromised content. Those are different intents, and the confirmation dialog is
          the last place the difference can still be pointed out, which is what the
          2026-09-01 review asked the delete flow to do.
        */}
        <div css={{ marginTop: 8 }}>
          <Typography.Text color="secondary" size="sm">
            <FormattedMessage
              defaultMessage="Retiring this version rather than withdrawing it? Deprecate it instead — a deprecated version still resolves for anything that pins it, so consumers keep working."
              description="Delete version modal > pointer to deprecation as the non-breaking alternative"
            />
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );

  return { DeleteSkillVersionModal: modalElement, openModal: () => setOpen(true) };
};
