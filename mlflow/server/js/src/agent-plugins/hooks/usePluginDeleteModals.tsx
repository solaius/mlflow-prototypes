import { Alert, Checkbox, Modal, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getAgentQualifiedName } from '../../agent-registry/constants';
import { getPluginQualifiedName } from '../constants';
import { useAgentsUsingPlugin } from './useAgentsUsingPlugin';
import { deletePlugin, deletePluginVersion, getPluginCascadeImpact } from '../mocks/pluginsStore';

/**
 * What deleting this would take down with it: the agent versions whose BOM references the
 * plugin. Mirrors the skill registry's `DeletionImpact`, for the same reason -- deletion is
 * the one operation that withdraws dependents, and the confirmation is the last place that
 * fact can be shown before it matters.
 */
const DeletionImpact = ({ qualifiedPluginName, version }: { qualifiedPluginName?: string; version?: string }) => {
  const { theme } = useDesignSystemTheme();
  const usages = useAgentsUsingPlugin(qualifiedPluginName, version);

  if (!usages.length) {
    return null;
  }

  return (
    <div css={{ marginTop: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <Typography.Text bold>
        <FormattedMessage
          defaultMessage="Deleting this affects {count, plural, one {# agent version} other {# agent versions}} that reference it:"
          description="Agent plugins > delete confirmation > dependents heading"
          values={{ count: usages.length }}
        />
      </Typography.Text>
      <ul css={{ margin: 0, paddingLeft: theme.spacing.lg }}>
        {usages.map(({ agentOrganization, agentName, agentVersion }) => (
          <li key={`${agentOrganization}/${agentName}@${agentVersion.version}`}>
            <Typography.Text>{`${getAgentQualifiedName(agentOrganization, agentName)} v${agentVersion.version}`}</Typography.Text>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Whole-plugin delete: RFC-0008's administrative hard delete of the parent, cascading to
 * its own versions, tags and aliases, with the explicit `cascade` option that decides
 * whether the member skills go too.
 */
export const useDeletePluginModal = ({
  organization,
  pluginName,
  onSuccess,
}: {
  organization?: string;
  pluginName?: string;
  onSuccess?: () => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [cascade, setCascade] = useState(false);
  const qualifiedName =
    organization !== undefined && pluginName ? getPluginQualifiedName(organization, pluginName) : pluginName;

  /*
    RFC-0008 §Entity-level status makes cascade an explicit option on `delete_agent_plugin`,
    because a packaged plugin's members are ordinary skills with their own identity: without
    it the plugin goes and the members stay; with it they go together. That is a real
    choice, so the dialog offers it rather than picking.

    The impact is computed up front because the RFC also blocks a cascade that would hit a
    member another live plugin still holds -- and blocks the WHOLE operation, atomically.
    Showing that before the button beats failing after it.
  */
  const impact =
    organization !== undefined && pluginName ? getPluginCascadeImpact(organization, pluginName) : undefined;
  const blockedByCascade = cascade && Boolean(impact?.blocked.length);

  const modalElement = (
    <Modal
      componentId="mlflow.agent-plugins.delete-plugin-modal"
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Delete agent plugin" description="Header for the delete plugin modal" />}
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete plugin modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete plugin modal" />}
      okButtonProps={{ danger: true, disabled: blockedByCascade }}
      onOk={() => {
        if (organization === undefined || !pluginName) {
          setOpen(false);
          return;
        }
        deletePlugin(organization, pluginName, { cascade });
        setOpen(false);
        onSuccess?.();
      }}
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        <FormattedMessage
          defaultMessage='Are you sure you want to delete "{pluginName}" and all of its versions? This action cannot be undone.'
          description="Content of the delete plugin confirmation modal"
          values={{ pluginName: qualifiedName }}
        />

        <DeletionImpact qualifiedPluginName={qualifiedName} />

        {Boolean(impact && (impact.removable.length || impact.blocked.length)) && (
          <>
            <Checkbox
              componentId="mlflow.agent-plugins.delete-plugin-modal.cascade"
              isChecked={cascade}
              onChange={(checked) => setCascade(checked)}
            >
              <FormattedMessage
                defaultMessage="Also delete the member skills"
                description="Delete plugin modal > cascade option label"
              />
            </Checkbox>

            <Typography.Text size="sm" color="secondary">
              {cascade ? (
                <FormattedMessage
                  defaultMessage="Member skills are hard-deleted with the plugin, subject to the check below."
                  description="Delete plugin modal > cascade explanation when checked"
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Only the plugin is deleted. Its member skills keep their own source pointers and stay resolvable on their own."
                  description="Delete plugin modal > cascade explanation when unchecked"
                />
              )}
            </Typography.Text>

            {cascade && impact && impact.removable.length > 0 && (
              <Typography.Text size="sm">
                <FormattedMessage
                  defaultMessage="Will also delete: {skills}"
                  description="Delete plugin modal > list of member skills a cascade removes"
                  values={{ skills: impact.removable.join(', ') }}
                />
              </Typography.Text>
            )}

            {blockedByCascade && impact && (
              <Alert
                componentId="mlflow.agent-plugins.delete-plugin-modal.cascade-blocked"
                type="warning"
                closable={false}
                message={intl.formatMessage({
                  defaultMessage: 'Cascade is blocked by another plugin',
                  description: 'Delete plugin modal > cascade blocked alert title',
                })}
                description={
                  <FormattedMessage
                    defaultMessage="{details}. The whole delete would fail rather than remove the others, so clear that reference first or delete this plugin without its members."
                    description="Delete plugin modal > cascade blocked explanation"
                    values={{
                      details: impact.blocked
                        .map((entry) => `${entry.skillName} is still a member of ${entry.heldBy}`)
                        .join('; '),
                    }}
                  />
                }
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );

  return { DeletePluginModal: modalElement, openModal: () => setOpen(true) };
};

/**
 * Single-version delete: RFC-0008's SOFT delete. The row and the version string survive,
 * the status becomes the terminal `deleted`, aliases pointing at it are dropped, and no read
 * API returns it again. Unlike a skill version's, a plugin version's soft delete withdraws
 * nothing else. The copy says so, because a confirmation that reads like a hard delete
 * would misrepresent what the button does.
 */
export const useDeletePluginVersionModal = ({
  organization,
  pluginName,
  version,
  onSuccess,
}: {
  organization?: string;
  pluginName?: string;
  version?: string;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const qualifiedName =
    organization !== undefined && pluginName ? getPluginQualifiedName(organization, pluginName) : undefined;

  const modalElement = (
    <Modal
      componentId="mlflow.agent-plugins.delete-plugin-version-modal"
      visible={open}
      onCancel={() => setOpen(false)}
      title={<FormattedMessage defaultMessage="Delete version" description="Header for the delete version modal" />}
      okText={<FormattedMessage defaultMessage="Delete" description="Confirm button in the delete version modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the delete version modal" />}
      okButtonProps={{ danger: true }}
      onOk={() => {
        if (organization === undefined || !pluginName || !version) {
          setOpen(false);
          return;
        }
        deletePluginVersion(organization, pluginName, version);
        setOpen(false);
        onSuccess?.();
      }}
    >
      <div>
        <FormattedMessage
          defaultMessage="Delete version {version}? The version is removed from resolution, discovery and pull, the registry stops returning it, and any alias pointing at it is dropped. Its members are untouched. This cannot be undone."
          description="Content of the delete plugin version confirmation modal"
          values={{ version }}
        />
        <DeletionImpact qualifiedPluginName={qualifiedName} version={version} />
        <div css={{ marginTop: 8 }}>
          <Typography.Text color="secondary" size="sm">
            <FormattedMessage
              defaultMessage="Retiring this version rather than withdrawing it? Deprecate it instead. A deprecated version still resolves for anything that pins it."
              description="Delete plugin version modal > pointer to deprecation as the non-breaking alternative"
            />
          </Typography.Text>
        </div>
      </div>
    </Modal>
  );

  return { DeletePluginVersionModal: modalElement, openModal: () => setOpen(true) };
};
