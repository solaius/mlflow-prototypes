import {
  Button,
  DialogCombobox,
  DialogComboboxContent,
  DialogComboboxOptionList,
  DialogComboboxOptionListSelectItem,
  DialogComboboxTrigger,
  PencilIcon,
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
import { SkillTagsCell } from '../../skills-registry/components/SkillCellRenderers';
import {
  AgentStatusTag,
  AgentVersionAliasesCell,
  AnchorKindTag,
  CompositionTag,
  HarnessChip,
  SourcePointerCell,
} from './AgentCellRenderers';
import { AgentCardTab } from './AgentCardTab';
import { AgentCompareTab } from './AgentCompareTab';
import { AgentCompositionTab } from './AgentCompositionTab';
import { AgentConfigSnapshotViewer } from './AgentConfigSnapshotViewer';
import { AgentLifecycleTab } from './AgentLifecycleTab';
import { getAgentAliasUri, getAgentVersionUri } from '../constants';
import { useEditAgentAliasesModal } from '../hooks/useEditAgentAliasesModal';
import { useEditAgentVersionTagsModal } from '../hooks/useEditAgentVersionTagsModal';
import { useDeleteAgentVersionModal } from '../hooks/useAgentModals';
import { getAgentVersionDeleteBlocker, setAgentVersionStatus } from '../mocks/agentsStore';
import { AgentRegistryRoutes } from '../routes';
import type { AgentAccessBinding, AgentEntity, AgentVersionEntity } from '../types';
import { AgentBindingProtocol, AgentStatus, getAnchorKind } from '../types';
import { OBSERVABLE_STATUSES, STATUS_TRANSITIONS, countBomEntries, formatStatusLabel } from '../utils';

const METADATA_LABEL_WIDTH = 160;

/**
 * The tabs below the version metadata, following the skill pane: no overview member, the
 * overview is what stays visible above them. Composition is the default and stays out of
 * the query string. Agent card appears only when an a2a binding exists to fetch it through.
 *
 * Traces and Evaluations are not here: they are page-level modes above the rail
 * (`AgentPage`), because both read the agent's one default experiment rather than
 * something inside a version (2026-09-18-pdouble-agent-registry-replay#2).
 */
export enum AgentDetailTab {
  COMPOSITION = 'composition',
  CARD = 'card',
  COMPARE = 'compare',
  LIFECYCLE = 'lifecycle',
}

export const isAgentDetailTab = (value: string | null): value is AgentDetailTab =>
  value !== null && (Object.values(AgentDetailTab) as string[]).includes(value);

export interface AgentVersionPaneProps {
  agent: AgentEntity;
  agentVersion: AgentVersionEntity;
  versions: AgentVersionEntity[];
  bindings: AgentAccessBinding[];
  activeTab: AgentDetailTab;
  onTabChange: (tab: AgentDetailTab) => void;
}

/**
 * Right pane of the agent detail layout, the twin of `SkillVersionPane`: "Viewing version
 * N" with the gated Delete action, the label/value grid (status with the pencil editor,
 * aliases, version tags, the definitional anchors, reference URIs), then the tabs.
 *
 * The anchors row is where RFC-0011 shows most clearly: a version has one or more source
 * pointers, a configuration snapshot, both, or -- for an interface-only record -- neither,
 * and the pane says which rather than leaving a blank.
 */
export const AgentVersionPane = ({
  agent,
  agentVersion,
  versions,
  bindings,
  activeTab,
  onTabChange,
}: AgentVersionPaneProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const navigate = useNavigate();
  const [editingStatus, setEditingStatus] = useState(false);

  const isDeleted = agentVersion.status === AgentStatus.DELETED;
  const anchorKind = getAnchorKind(agentVersion);
  const hasA2A = bindings.some((binding) => binding.protocol === AgentBindingProtocol.A2A);

  const { EditAgentAliasesModal, openEditAliasesModal } = useEditAgentAliasesModal({
    organization: agent.organization,
    agentName: agent.name,
    aliases: agent.aliases,
  });
  const { EditAgentVersionTagsModal, openEditAgentVersionTagsModal } = useEditAgentVersionTagsModal({
    organization: agent.organization,
    agentName: agent.name,
  });
  const { DeleteAgentVersionModal, openModal: openDeleteVersionModal } = useDeleteAgentVersionModal({
    organization: agent.organization,
    agentName: agent.name,
    version: agentVersion.version,
    onSuccess: () => navigate(AgentRegistryRoutes.getAgentPageRoute(agent.organization, agent.name), { replace: true }),
  });

  const deleteBlocker = getAgentVersionDeleteBlocker(agent.organization, agent.name, agentVersion.version);
  const canDelete = deleteBlocker === undefined;
  const deleteTooltip = !deleteBlocker
    ? intl.formatMessage({
        defaultMessage:
          'Removes this version from resolution and discovery. Its traces stay in the agent’s experiment.',
        description: 'Tooltip describing what deleting an agent version does',
      })
    : deleteBlocker === 'is-active'
      ? intl.formatMessage({
          defaultMessage:
            'Unpublish or deprecate this version first. Deprecating keeps it resolving for anything that references it.',
          description: 'Tooltip explaining that an active agent version must be retired before deletion',
        })
      : deleteBlocker === 'already-deleted'
        ? intl.formatMessage({
            defaultMessage: 'This version has already been deleted.',
            description: 'Tooltip on a deleted agent version',
          })
        : intl.formatMessage({
            defaultMessage: "An agent's only remaining live version can't be deleted.",
            description: 'Tooltip explaining why the delete agent version button is disabled',
          });

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
              description="Title of the agent detail pane for the selected version"
              values={{ version: agentVersion.version }}
            />
          </Typography.Title>
          <AnchorKindTag kind={anchorKind} />
          <CompositionTag composition={agentVersion.composition} />
        </div>
        <Tooltip componentId="mlflow.agent-registry.version-pane.delete-version.tooltip" content={deleteTooltip}>
          <Button
            componentId="mlflow.agent-registry.version-pane.delete-version"
            icon={<TrashIcon />}
            type="primary"
            danger
            disabled={!canDelete}
            onClick={openDeleteVersionModal}
          >
            <FormattedMessage defaultMessage="Delete version" description="Label for the delete agent version button" />
          </Button>
        </Tooltip>
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
          <FormattedMessage defaultMessage="Registered at:" description="Agent version pane metadata label" />
        </Typography.Text>
        <Typography.Text>{Utils.formatTimestamp(agentVersion.creation_timestamp, intl)}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Status:" description="Agent version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          {editingStatus ? (
            <DialogCombobox
              componentId="mlflow.agent-registry.version-pane.status.combobox"
              label={intl.formatMessage({
                defaultMessage: 'Status',
                description: 'Label for the agent version status selector',
              })}
              value={[agentVersion.status]}
              open
            >
              <DialogComboboxTrigger
                aria-label={intl.formatMessage({
                  defaultMessage: 'Status',
                  description: 'Label for the agent version status selector',
                })}
                withInlineLabel={false}
                renderDisplayedValue={(status) => formatStatusLabel(status as AgentStatus)}
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
                      checked={status === agentVersion.status}
                      disabled={
                        status !== agentVersion.status && !STATUS_TRANSITIONS[agentVersion.status].includes(status)
                      }
                      onChange={(nextStatus) => {
                        setAgentVersionStatus(
                          agent.organization,
                          agent.name,
                          agentVersion.version,
                          nextStatus as AgentStatus,
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
              <AgentStatusTag status={agentVersion.status} />
              {!isDeleted && (
                <Button
                  componentId="mlflow.agent-registry.version-pane.edit-status"
                  size="small"
                  icon={<PencilIcon />}
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Edit version status',
                    description: 'Aria label for the edit agent version status button',
                  })}
                  onClick={() => setEditingStatus(true)}
                />
              )}
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="Every change is recorded with its actor."
                  description="Note beside the status editor"
                />
              </Typography.Text>
            </>
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Registered by:" description="Agent version pane metadata label" />
        </Typography.Text>
        <Typography.Text>{agentVersion.created_by}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Aliases:" description="Agent version pane metadata label" />
        </Typography.Text>
        <div>
          <AgentVersionAliasesCell
            organization={agent.organization}
            agentName={agent.name}
            version={agentVersion.version}
            aliases={agentVersion.aliases}
            onEdit={isDeleted ? undefined : () => openEditAliasesModal(agentVersion.version)}
          />
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Metadata:" description="Agent version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
          {agentVersion.tags.length ? (
            <SkillTagsCell tags={agentVersion.tags} />
          ) : (
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="None"
                description="Agent version pane > empty version tags placeholder"
              />
            </Typography.Text>
          )}
          {!isDeleted && (
            <Button
              componentId="mlflow.agent-registry.edit-version-tags"
              size="small"
              icon={<PencilIcon />}
              onClick={() => openEditAgentVersionTagsModal(agentVersion)}
              aria-label={intl.formatMessage({
                defaultMessage: 'Edit version tags',
                description: 'Aria label for the edit agent version tags button',
              })}
            />
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage
            defaultMessage="Defined by:"
            description="Agent version pane metadata label for the definitional anchors"
          />
        </Typography.Text>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, minWidth: 0 }}>
          {agentVersion.sources.map((source, index) => (
            <SourcePointerCell key={`${source.source}-${index}`} source={source} />
          ))}
          {agentVersion.harness && (
            <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
              <HarnessChip harness={agentVersion.harness} />
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="plus the configuration below"
                  description="Anchor row > harness note"
                />
              </Typography.Text>
            </div>
          )}
          {agentVersion.config_snapshot && <AgentConfigSnapshotViewer snapshot={agentVersion.config_snapshot} />}
          {anchorKind === 'interface-only' && (
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="Nothing. Registered from its endpoint alone: the registry holds identity, imported metadata and the binding, not the agent's contents."
                description="Anchor row > interface-only explanation"
              />
            </Typography.Text>
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Composition:" description="Agent version pane metadata label" />
        </Typography.Text>
        <Typography.Text>
          {agentVersion.composition === 'undeclared' ? (
            <FormattedMessage defaultMessage="Undeclared" description="Composition summary > undeclared" />
          ) : (
            <FormattedMessage
              defaultMessage="{count, plural, =0 {Declared empty} one {# reference} other {# references}} across {axes} of 5 axes"
              description="Composition summary > counts"
              values={{
                count: countBomEntries(agentVersion.bom),
                axes: [
                  agentVersion.bom.skills,
                  agentVersion.bom.agent_plugins,
                  agentVersion.bom.mcp_servers,
                  agentVersion.bom.models,
                  agentVersion.bom.agents,
                ].filter((axis) => axis.length).length,
              }}
            />
          )}
        </Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Reference URIs:" description="Agent version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text code>
            {getAgentVersionUri(agent.organization, agent.name, agentVersion.version)}
          </Typography.Text>
          {agentVersion.aliases.map((alias) => (
            <Typography.Text key={alias} code>
              {getAgentAliasUri(agent.organization, agent.name, alias)}
            </Typography.Text>
          ))}
        </div>
      </div>

      <Tabs.Root
        componentId="mlflow.agent-registry.version-pane.tabs"
        valueHasNoPii
        value={activeTab}
        onValueChange={(value) => isAgentDetailTab(value) && onTabChange(value)}
        css={{ marginTop: theme.spacing.md, '& svg': { width: 14, height: 14 } }}
      >
        <Tabs.List>
          <Tabs.Trigger value={AgentDetailTab.COMPOSITION}>
            <FormattedMessage defaultMessage="Composition" description="Agent detail > composition tab" />
          </Tabs.Trigger>
          {hasA2A && (
            <Tabs.Trigger value={AgentDetailTab.CARD}>
              <FormattedMessage defaultMessage="Agent card" description="Agent detail > card tab" />
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value={AgentDetailTab.COMPARE}>
            <FormattedMessage defaultMessage="Compare" description="Agent detail > compare tab" />
          </Tabs.Trigger>
          <Tabs.Trigger value={AgentDetailTab.LIFECYCLE}>
            <FormattedMessage defaultMessage="Lifecycle" description="Agent detail > lifecycle tab" />
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value={AgentDetailTab.COMPOSITION}>
          <AgentCompositionTab agentVersion={agentVersion} />
        </Tabs.Content>
        {hasA2A && (
          <Tabs.Content value={AgentDetailTab.CARD}>
            <AgentCardTab bindings={bindings} />
          </Tabs.Content>
        )}
        <Tabs.Content value={AgentDetailTab.COMPARE}>
          <AgentCompareTab agent={agent} agentVersion={agentVersion} versions={versions} />
        </Tabs.Content>
        <Tabs.Content value={AgentDetailTab.LIFECYCLE}>
          <AgentLifecycleTab agentVersion={agentVersion} />
        </Tabs.Content>
      </Tabs.Root>

      {DeleteAgentVersionModal}
      {EditAgentAliasesModal}
      {EditAgentVersionTagsModal}
    </div>
  );
};
