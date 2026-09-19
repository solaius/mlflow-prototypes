import { Modal, Tag, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

import { SkillPullInstructions } from './SkillPullInstructions';
import { getSkillQualifiedName, getSkillUri, getSkillVersionUri } from '../constants';
import type { SkillEntity, SkillVersionEntity } from '../types';
import { STATUS_TAG_COLOR, formatStatusLabel } from '../utils';

export interface SkillPullModalProps {
  visible: boolean;
  skill: SkillEntity;
  /**
   * The version shown in the resolution note (and pinned when `pinVersion` is set).
   * Omitted from callers that only know the skill; the modal then uses `latest_version`.
   */
  skillVersion?: SkillVersionEntity;
  /**
   * Forces the snippets to pin `skillVersion` by number. Set by the version pane, where
   * the whole promise of the button is that what you copy keeps fetching the version
   * you were looking at.
   */
  pinVersion?: boolean;
  onClose: () => void;
}

/**
 * "How do I consume this skill?" modal, mirroring the MCP server registry's
 * `QuickConnectModal`: same modal shape, same header layout (what you are consuming
 * plus the version and its status), same copyable-snippet body.
 *
 * Which URI the snippets use depends on where the modal was opened from, and the two
 * cases want opposite things.
 *
 * From the skill itself (the list card, the table row) the user is asking "how do I use
 * this skill". The snippet is the unversioned skill URI, so the backend supplies whatever
 * it considers latest (the highest non-draft version). A user alias such as `production`
 * is not used, even when one points at that version today.
 *
 * From a specific version, the user is asking "how do I use THIS version". An alias is
 * the wrong answer however convenient it looks: aliases are mutable pointers, so a
 * command copied into a CI job would silently start fetching something else the day
 * someone retargets it. `pinVersion` says the number is the point, and the snippet emits it.
 */
export const SkillPullModal = ({ visible, skill, skillVersion, pinVersion, onClose }: SkillPullModalProps) => {
  const { theme } = useDesignSystemTheme();

  if (!visible) {
    return null;
  }

  const version = skillVersion?.version ?? skill.latest_version;
  const uri = pinVersion
    ? getSkillVersionUri(skill.organization, skill.name, version)
    : getSkillUri(skill.organization, skill.name);

  return (
    <Modal
      componentId="mlflow.skills-registry.pull-modal"
      title={
        <FormattedMessage
          defaultMessage="Use {name}"
          description="Skills registry > pull modal title"
          values={{ name: getSkillQualifiedName(skill.organization, skill.name) }}
        />
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
    >
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
          marginTop: -theme.spacing.xs,
        }}
      >
        <SkillPullInstructions
          organization={skill.organization}
          name={skill.name}
          uri={uri}
          version={pinVersion ? version : undefined}
          resolutionNote={
            /*
              Label and value are one message rather than two adjacent `Typography.Text`
              nodes, which is what the bold-label version needed. Now that the whole line
              is one weight there is nothing to split, and a translator gets the sentence
              instead of a fragment.
            */
            <span css={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
              {pinVersion ? (
                <FormattedMessage
                  defaultMessage="Pinned version: v{version}"
                  description="Skills registry > pull modal > what the snippet resolves to, a pinned version"
                  values={{ version }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Latest version: v{version}"
                  description="Skills registry > pull modal > what the snippet resolves to, the backend's latest"
                  values={{ version }}
                />
              )}
              {skillVersion && (
                <Tag
                  componentId="mlflow.skills-registry.pull-modal.status"
                  color={STATUS_TAG_COLOR[skillVersion.status]}
                >
                  {formatStatusLabel(skillVersion.status)}
                </Tag>
              )}
            </span>
          }
        />
      </div>
    </Modal>
  );
};
