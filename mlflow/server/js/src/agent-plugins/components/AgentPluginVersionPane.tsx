import {
  Button,
  DialogCombobox,
  DialogComboboxContent,
  DialogComboboxOptionList,
  DialogComboboxOptionListSelectItem,
  DialogComboboxTrigger,
  PencilIcon,
  PlayIcon,
  Tabs,
  Tooltip,
  TrashIcon,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useNavigate } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';
import { SkillSourceDisclaimer, SkillSourceLinkOut } from '../../skills-registry/components/SkillSourceLinkOut';
import { SkillSourceTypeTag, SkillTagsCell } from '../../skills-registry/components/SkillCellRenderers';
import { getGitBrowseUrl } from '../../skills-registry/constants';
import { SkillSourceType, SkillStatus } from '../../skills-registry/types';
import {
  PluginKindTag,
  PluginStatusTag,
  PluginVersionAliasesCell,
  PluginWithdrawnTag,
} from './AgentPluginCellRenderers';
import { AgentPluginFilesTab } from './AgentPluginFilesTab';
import { AgentPluginManifestTab } from './AgentPluginManifestTab';
import { AgentPluginMembersTab } from './AgentPluginMembersTab';
import { AgentPluginPullModal } from './AgentPluginPullModal';
import { AgentsUsingPluginSection } from './AgentsUsingPluginSection';
import { getAgentPluginAliasUri, getAgentPluginVersionUri, getPluginQualifiedName } from '../constants';
import { useEditPluginAliasesModal } from '../hooks/useEditPluginAliasesModal';
import { useEditPluginVersionTagsModal } from '../hooks/useEditPluginVersionTagsModal';
import { useDeletePluginVersionModal } from '../hooks/usePluginDeleteModals';
import { getPluginVersionDeleteBlocker, setPluginVersionStatus } from '../mocks/pluginsStore';
import { AgentPluginsRoutes } from '../routes';
import type { AgentPluginEntity, AgentPluginVersionEntity } from '../types';
import { OBSERVABLE_STATUSES, STATUS_TRANSITIONS, formatStatusLabel, getPluginVersionKind } from '../utils';

const METADATA_LABEL_WIDTH = 160;

/**
 * The tabs below the version metadata. No overview member: the overview IS the metadata
 * above the tabs, always visible, exactly as the skill pane arranged it after the
 * 2026-09-04 session. Members is the default and stays out of the query string.
 */
export enum PluginDetailTab {
  MEMBERS = 'members',
  FILES = 'files',
  MANIFEST = 'manifest',
  AGENTS = 'agents',
}

export const isPluginDetailTab = (value: string | null): value is PluginDetailTab =>
  value !== null && (Object.values(PluginDetailTab) as string[]).includes(value);

export interface AgentPluginVersionPaneProps {
  plugin: AgentPluginEntity;
  pluginVersion: AgentPluginVersionEntity;
  isWithdrawn: boolean;
  activeTab: PluginDetailTab;
  onTabChange: (tab: PluginDetailTab) => void;
}

/**
 * Right pane of the plugin detail master-detail layout, the twin of `SkillVersionPane`:
 * "Viewing version X" with the Use and gated Delete actions, the label/value grid with the
 * pencil-to-dropdown status editor and the alias and version-tag editors, the source row
 * (packaged only -- an assembled version has none), the reference URIs, and then the tabs.
 */
export const AgentPluginVersionPane = ({
  plugin,
  pluginVersion,
  isWithdrawn,
  activeTab,
  onTabChange,
}: AgentPluginVersionPaneProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const navigate = useNavigate();
  const [editingStatus, setEditingStatus] = useState(false);
  const [pullModalOpen, setPullModalOpen] = useState(false);

  const kind = getPluginVersionKind(pluginVersion.source);
  const isDeleted = pluginVersion.status === SkillStatus.DELETED;

  const { EditPluginAliasesModal, openEditAliasesModal } = useEditPluginAliasesModal({
    organization: plugin.organization,
    pluginName: plugin.name,
    aliases: plugin.aliases,
  });
  const { EditPluginVersionTagsModal, openEditPluginVersionTagsModal } = useEditPluginVersionTagsModal({
    organization: plugin.organization,
    pluginName: plugin.name,
  });
  const { DeletePluginVersionModal, openModal: openDeleteVersionModal } = useDeletePluginVersionModal({
    organization: plugin.organization,
    pluginName: plugin.name,
    version: pluginVersion.version,
    onSuccess: () =>
      navigate(AgentPluginsRoutes.getPluginPageRoute(plugin.organization, plugin.name), { replace: true }),
  });

  const deleteBlocker = getPluginVersionDeleteBlocker(plugin.organization, plugin.name, pluginVersion.version);
  const canDelete = deleteBlocker === undefined;
  const deleteTooltip = !deleteBlocker
    ? intl.formatMessage({
        defaultMessage: 'Removes this version from resolution, discovery and pull. Its members are untouched.',
        description: 'Tooltip describing what deleting a plugin version does',
      })
    : deleteBlocker === 'is-active'
      ? intl.formatMessage({
          defaultMessage:
            'Unpublish or deprecate this version first. Deprecating keeps it resolving for anything that pins it.',
          description: 'Tooltip explaining that an active plugin version must be retired before deletion',
        })
      : deleteBlocker === 'already-deleted'
        ? intl.formatMessage({
            defaultMessage: 'This version has already been deleted.',
            description: 'Tooltip on a deleted plugin version',
          })
        : intl.formatMessage({
            defaultMessage: "A plugin's only remaining live version can't be deleted.",
            description: 'Tooltip explaining why the delete plugin version button is disabled',
          });

  const gitBrowseUrl =
    pluginVersion.source.source_type === SkillSourceType.GIT && pluginVersion.source.source
      ? getGitBrowseUrl({
          source: pluginVersion.source.source,
          ref: pluginVersion.source.ref,
          subpath: pluginVersion.source.subpath,
        })
      : undefined;

  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        padding: theme.spacing.md,
        overflow: 'auto',
        gap: theme.spacing.md,
      }}
    >
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm }}>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <Typography.Title withoutMargins level={3}>
            <FormattedMessage
              defaultMessage="Viewing version {version}"
              description="Title of the plugin detail pane for the selected version"
              values={{ version: pluginVersion.version }}
            />
          </Typography.Title>
          {isWithdrawn && <PluginWithdrawnTag />}
        </div>
        <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          {/* Delete before Use: the prompt details pane's order. */}
          <Tooltip componentId="mlflow.agent-plugins.version-pane.delete-version.tooltip" content={deleteTooltip}>
            <Button
              componentId="mlflow.agent-plugins.version-pane.delete-version"
              icon={<TrashIcon />}
              type="primary"
              danger
              disabled={!canDelete}
              onClick={openDeleteVersionModal}
            >
              <FormattedMessage
                defaultMessage="Delete version"
                description="Label for the delete plugin version button"
              />
            </Button>
          </Tooltip>
          <Tooltip
            componentId="mlflow.agent-plugins.version-pane.pull.tooltip"
            content={
              isWithdrawn
                ? intl.formatMessage({
                    defaultMessage: 'Pull fails on a withdrawn version, naming the deleted member.',
                    description: 'Tooltip on the pull button of a withdrawn plugin version',
                  })
                : undefined
            }
          >
            <Button
              componentId="mlflow.agent-plugins.version-pane.pull"
              icon={<PlayIcon />}
              disabled={isWithdrawn}
              onClick={() => setPullModalOpen(true)}
            >
              <FormattedMessage
                defaultMessage="Use"
                description="Label for the pull button on the plugin version pane"
              />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div
        css={{
          display: 'grid',
          gridTemplateColumns: `${METADATA_LABEL_WIDTH}px 1fr`,
          gridAutoRows: 'minmax(24px, auto)',
          alignItems: 'flex-start',
          rowGap: theme.spacing.sm,
          columnGap: theme.spacing.md,
        }}
      >
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Registered at:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <Typography.Text>{Utils.formatTimestamp(pluginVersion.creation_timestamp)}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Status:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          {editingStatus ? (
            <DialogCombobox
              componentId="mlflow.agent-plugins.version-pane.status.combobox"
              label={intl.formatMessage({
                defaultMessage: 'Status',
                description: 'Label for the plugin version status selector',
              })}
              value={[pluginVersion.status]}
              open
            >
              <DialogComboboxTrigger
                aria-label={intl.formatMessage({
                  defaultMessage: 'Status',
                  description: 'Label for the plugin version status selector',
                })}
                withInlineLabel={false}
                renderDisplayedValue={(status) => formatStatusLabel(status as SkillStatus)}
                allowClear={false}
                width={160}
              />
              <DialogComboboxContent
                matchTriggerWidth
                onEscapeKeyDown={() => setEditingStatus(false)}
                onPointerDownOutside={() => setEditingStatus(false)}
              >
                <DialogComboboxOptionList>
                  {OBSERVABLE_STATUSES.map((status) => (
                    <DialogComboboxOptionListSelectItem
                      key={status}
                      value={status}
                      checked={status === pluginVersion.status}
                      disabled={
                        status !== pluginVersion.status && !STATUS_TRANSITIONS[pluginVersion.status].includes(status)
                      }
                      onChange={(nextStatus) => {
                        setPluginVersionStatus(
                          plugin.organization,
                          plugin.name,
                          pluginVersion.version,
                          nextStatus as SkillStatus,
                        );
                        setEditingStatus(false);
                      }}
                    >
                      {formatStatusLabel(status)}
                    </DialogComboboxOptionListSelectItem>
                  ))}
                </DialogComboboxOptionList>
              </DialogComboboxContent>
            </DialogCombobox>
          ) : (
            <>
              <PluginStatusTag status={pluginVersion.status} />
              {!isDeleted && (
                <Button
                  componentId="mlflow.agent-plugins.version-pane.edit-status"
                  size="small"
                  icon={<PencilIcon />}
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Edit version status',
                    description: 'Aria label for the edit plugin version status button',
                  })}
                  onClick={() => setEditingStatus(true)}
                />
              )}
            </>
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Kind:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <PluginKindTag kind={kind} />
          <Typography.Text size="sm" color="secondary">
            {kind === 'packaged' ? (
              <FormattedMessage
                defaultMessage="Members carry sources derived from this package."
                description="Plugin version pane > packaged kind explanation"
              />
            ) : (
              <FormattedMessage
                defaultMessage="No package of its own; members keep independent sources."
                description="Plugin version pane > assembled kind explanation"
              />
            )}
          </Typography.Text>
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Created by:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <Typography.Text>{pluginVersion.created_by}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Aliases:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <div>
          <PluginVersionAliasesCell
            organization={plugin.organization}
            name={plugin.name}
            version={pluginVersion.version}
            aliases={pluginVersion.aliases}
            onEdit={isDeleted || isWithdrawn ? undefined : () => openEditAliasesModal(pluginVersion.version)}
          />
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Metadata:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
          {pluginVersion.tags.length ? (
            <SkillTagsCell tags={pluginVersion.tags} />
          ) : (
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="None"
                description="Plugin version pane > empty version tags placeholder"
              />
            </Typography.Text>
          )}
          {!isDeleted && (
            <Button
              componentId="mlflow.agent-plugins.edit-version-tags"
              size="small"
              icon={<PencilIcon />}
              onClick={() => openEditPluginVersionTagsModal(pluginVersion)}
              aria-label={intl.formatMessage({
                defaultMessage: 'Edit version tags',
                description: 'Aria label for the edit plugin version tags button',
              })}
            />
          )}
        </div>

        {kind === 'packaged' && pluginVersion.source.source && (
          <>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Package:" description="Plugin version pane metadata label" />
            </Typography.Text>
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, minWidth: 0 }}>
              <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                <SkillSourceTypeTag sourceType={pluginVersion.source.source_type as SkillSourceType} />
                {pluginVersion.source.source_type === SkillSourceType.MLFLOW ? (
                  <Typography.Text code css={{ wordBreak: 'break-all' }}>
                    {pluginVersion.source.source}
                  </Typography.Text>
                ) : (
                  <Typography.Link
                    componentId="mlflow.agent-plugins.version-pane.source-link"
                    href={pluginVersion.source.source}
                    openInNewTab
                  >
                    {pluginVersion.source.source}
                  </Typography.Link>
                )}
              </div>
              {pluginVersion.source.subpath && (
                <Typography.Text size="sm" color="secondary">
                  <FormattedMessage
                    defaultMessage="Path: {path}"
                    description="Plugin version pane source path"
                    values={{ path: pluginVersion.source.subpath }}
                  />
                </Typography.Text>
              )}
              {pluginVersion.source.ref && (
                <Typography.Text size="sm" color="secondary">
                  <FormattedMessage
                    defaultMessage="Ref: {ref}"
                    description="Plugin version pane source git ref"
                    values={{ ref: pluginVersion.source.ref.slice(0, 12) }}
                  />
                </Typography.Text>
              )}
              {/* The browse link only when it lands somewhere the source link does not; the disclaimer either way. */}
              {gitBrowseUrl &&
                (gitBrowseUrl !== pluginVersion.source.source ? (
                  <SkillSourceLinkOut
                    componentId="mlflow.agent-plugins.version-pane.browse-source"
                    href={gitBrowseUrl}
                  />
                ) : (
                  <SkillSourceDisclaimer />
                ))}
            </div>
          </>
        )}

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Reference URIs:" description="Plugin version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text code>
            {getAgentPluginVersionUri(plugin.organization, plugin.name, pluginVersion.version)}
          </Typography.Text>
          {pluginVersion.aliases.map((alias) => (
            <Typography.Text key={alias} code>
              {getAgentPluginAliasUri(plugin.organization, plugin.name, alias)}
            </Typography.Text>
          ))}
        </div>
      </div>

      <Tabs.Root
        componentId="mlflow.agent-plugins.version-pane.tabs"
        valueHasNoPii
        value={activeTab}
        onValueChange={(value) => isPluginDetailTab(value) && onTabChange(value)}
        css={{ marginTop: theme.spacing.md, '& svg': { width: 14, height: 14 } }}
      >
        <Tabs.List>
          <Tabs.Trigger value={PluginDetailTab.MEMBERS}>
            <FormattedMessage defaultMessage="Members" description="Agent plugins > detail > members tab" />
          </Tabs.Trigger>
          <Tabs.Trigger value={PluginDetailTab.FILES}>
            <FormattedMessage defaultMessage="Files" description="Agent plugins > detail > files tab" />
          </Tabs.Trigger>
          <Tabs.Trigger value={PluginDetailTab.MANIFEST}>
            <FormattedMessage defaultMessage="plugin.json" description="Agent plugins > detail > manifest tab" />
          </Tabs.Trigger>
          <Tabs.Trigger value={PluginDetailTab.AGENTS}>
            <FormattedMessage defaultMessage="Used by agents" description="Agent plugins > detail > agents tab" />
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value={PluginDetailTab.MEMBERS}>
          <AgentPluginMembersTab pluginVersion={pluginVersion} isWithdrawn={isWithdrawn} />
        </Tabs.Content>
        <Tabs.Content value={PluginDetailTab.FILES}>
          <AgentPluginFilesTab pluginVersion={pluginVersion} />
        </Tabs.Content>
        <Tabs.Content value={PluginDetailTab.MANIFEST}>
          <AgentPluginManifestTab pluginVersion={pluginVersion} />
        </Tabs.Content>
        <Tabs.Content value={PluginDetailTab.AGENTS}>
          <AgentsUsingPluginSection
            qualifiedPluginName={getPluginQualifiedName(plugin.organization, plugin.name)}
            pluginVersion={pluginVersion.version}
          />
        </Tabs.Content>
      </Tabs.Root>

      <AgentPluginPullModal
        visible={pullModalOpen}
        plugin={plugin}
        pluginVersion={pluginVersion}
        pinVersion
        onClose={() => setPullModalOpen(false)}
      />

      {DeletePluginVersionModal}
      {EditPluginAliasesModal}
      {EditPluginVersionTagsModal}
    </div>
  );
};
