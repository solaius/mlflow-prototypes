import {
  Breadcrumb,
  Button,
  CheckCircleIcon,
  DropdownMenu,
  Empty,
  ForkHorizontalIcon,
  OverflowIcon,
  SegmentedControlButton,
  SegmentedControlGroup,
  Typography,
  useDesignSystemTheme,
  WarningIcon,
  ZoomMarqueeSelection,
} from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import ErrorUtils from '../../common/utils/ErrorUtils';
import { Link, useNavigate, useParams, useSearchParams } from '../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import { SkillDescriptionBox } from '../../skills-registry/components/SkillDescriptionBox';
import { SkillTagsBox } from '../../skills-registry/components/SkillTagsBox';
import { AgentIconBox } from './AgentCellRenderers';
import { AgentEvaluationsTab } from './AgentEvaluationsTab';
import { AgentTracesTab } from './AgentTracesTab';
import { AgentBindingsSection } from './AgentBindingsSection';
import { AgentSummaryCard } from './AgentSummaryCard';
import { AgentDetailTab, AgentVersionPane, isAgentDetailTab } from './AgentVersionPane';
import { AgentVersionRail } from './AgentVersionRail';
import { getAgentQualifiedName } from '../constants';
import { AgentFormModalMode, useAgentFormModal } from '../hooks/useAgentFormModal';
import { useAgent } from '../hooks/useAgents';
import { useDeleteAgentModal } from '../hooks/useAgentModals';
import { useEditAgentModal } from '../hooks/useEditAgentModal';
import { useEditAgentTagsModal } from '../hooks/useEditAgentTagsModal';
import { AgentRegistryRoutes } from '../routes';
import { AgentBindingProtocol, parseAgentQualifiedName } from '../types';
import { VERSION_SCHEME_LABELS } from '../utils';

/**
 * Agent detail page: the master-detail layout of `SkillPage`, with the header (breadcrumb,
 * icon, name and @org, kebab with Edit and Delete, Add version), the description, the
 * summary card, the access bindings, tags and alias references, then the rail beside the
 * pane. The tab lives in the URL, Composition by default and out of the query string.
 */
/**
 * Page-level modes above the rail, the skills Preview / Traces switch extended with
 * Evaluations for agents (owner ruling 2026-09-18): both read the agent's single default
 * experiment, filterable by version (RFC-0011). Only the right pane swaps; the rail and
 * the selected version stay put. Preview is the default and stays out of the URL.
 */
enum AgentDetailMode {
  PREVIEW = 'preview',
  TRACES = 'traces',
  EVALUATIONS = 'evaluations',
}

const isAgentDetailMode = (value: string | null): value is AgentDetailMode =>
  value === AgentDetailMode.PREVIEW || value === AgentDetailMode.TRACES || value === AgentDetailMode.EVALUATIONS;

const AgentPage = () => {
  const { theme } = useDesignSystemTheme();
  const navigate = useNavigate();
  const { agentName: rawAgentName, version: rawVersion } = useParams();
  const parsed = useMemo(
    () => parseAgentQualifiedName(rawAgentName ? decodeURIComponent(rawAgentName) : ''),
    [rawAgentName],
  );
  const requestedVersion = rawVersion ? decodeURIComponent(rawVersion) : undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode = isAgentDetailMode(modeParam) ? modeParam : AgentDetailMode.PREVIEW;
  const handleModeChange = (value: AgentDetailMode) => {
    const next = new URLSearchParams(searchParams);
    if (value === AgentDetailMode.PREVIEW) {
      next.delete('mode');
    } else {
      next.set('mode', value);
    }
    setSearchParams(next, { replace: true });
  };

  const tabParam = searchParams.get('tab');
  const activeTab = isAgentDetailTab(tabParam) ? tabParam : AgentDetailTab.COMPOSITION;
  const handleTabChange = (value: AgentDetailTab) => {
    const next = new URLSearchParams(searchParams);
    if (value === AgentDetailTab.COMPOSITION) {
      next.delete('tab');
    } else {
      next.set('tab', value);
    }
    setSearchParams(next, { replace: true });
  };

  const {
    data: { agent, versions, bindings },
  } = useAgent(parsed?.organization, parsed?.name);

  const selectedAgentVersion = useMemo(() => {
    if (!versions.length) {
      return undefined;
    }
    const requested = requestedVersion ? versions.find((version) => version.version === requestedVersion) : undefined;
    return requested ?? versions[0];
  }, [versions, requestedVersion]);

  const { AgentFormModal, openModal: openAddVersionModal } = useAgentFormModal({
    mode: AgentFormModalMode.CreateAgentVersion,
    organization: parsed?.organization,
    agentName: parsed?.name,
    onSuccess: ({ organization, name, version }) =>
      version !== undefined &&
      navigate(AgentRegistryRoutes.getAgentVersionPageRoute(organization, name, version), { replace: true }),
  });
  const { EditAgentModal, openEditAgentModal } = useEditAgentModal({ agent });
  const { EditAgentTagsModal, openEditAgentTagsModal } = useEditAgentTagsModal({ agent });
  const { DeleteAgentModal, openModal: openDeleteAgentModal } = useDeleteAgentModal({
    organization: parsed?.organization,
    agentName: parsed?.name,
    onSuccess: () => navigate(AgentRegistryRoutes.agentListPageRoute),
  });

  if (!parsed || !agent || !selectedAgentVersion) {
    return (
      <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Empty
          image={<WarningIcon />}
          title={
            <FormattedMessage defaultMessage="Agent not found" description="Agent registry > agent not found title" />
          }
          description={
            <FormattedMessage
              defaultMessage="No agent named {agentName} is registered."
              description="Agent registry > agent not found description"
              values={{ agentName: rawAgentName ? decodeURIComponent(rawAgentName) : '' }}
            />
          }
        />
      </div>
    );
  }

  const hasA2A = bindings.some((binding) => binding.protocol === AgentBindingProtocol.A2A);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div css={{ padding: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
        <Breadcrumb includeTrailingCaret>
          <Breadcrumb.Item>
            <Link
              componentId="mlflow.agent-registry.agent-page.breadcrumb_agents"
              to={AgentRegistryRoutes.agentListPageRoute}
            >
              <FormattedMessage defaultMessage="Agents" description="Agent registry breadcrumb root" />
            </Link>
          </Breadcrumb.Item>
        </Breadcrumb>

        <div
          css={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.sm,
          }}
        >
          <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <AgentIconBox icons={agent.icons} name={agent.name} hasA2A={hasA2A} size={36} />
            <div css={{ display: 'flex', flexDirection: 'column' }}>
              <Typography.Title withoutMargins level={2}>
                {agent.name}
              </Typography.Title>
              {/* No `@org` here (demo-prep#1); display name and version scheme are RFC-0011 fields. */}
              <Typography.Text color="secondary" size="sm">
                {agent.display_name ? `${agent.display_name} · ` : ''}
                {VERSION_SCHEME_LABELS[agent.version_scheme]}
              </Typography.Text>
            </div>
          </div>

          <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  componentId="mlflow.agent-registry.agent-page.actions"
                  icon={<OverflowIcon />}
                  aria-label="More actions"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  componentId="mlflow.agent-registry.agent-page.actions.edit"
                  onClick={openEditAgentModal}
                >
                  <FormattedMessage defaultMessage="Edit" description="Agent registry > agent page > edit action" />
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  componentId="mlflow.agent-registry.agent-page.actions.delete"
                  onClick={openDeleteAgentModal}
                >
                  <FormattedMessage defaultMessage="Delete" description="Agent registry > agent page > delete action" />
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <Button
              componentId="mlflow.agent-registry.agent-page.add-version"
              type="primary"
              onClick={openAddVersionModal}
            >
              <FormattedMessage
                defaultMessage="Create agent version"
                description="Label for the add agent version button"
              />
            </Button>
          </div>
        </div>

        {/*
          The skills header: description as muted copy clamped to two lines, then the entity
          tag chips with their own pencil. The summary card and access bindings follow: they
          are the agent record's own content (RFC-0011). No Alias references block.
        */}
        <SkillDescriptionBox
          key={getAgentQualifiedName(agent.organization, agent.name)}
          description={agent.description}
        />
        <SkillTagsBox tags={agent.tags} onEdit={openEditAgentTagsModal} />

        <AgentSummaryCard agent={agent} bindingCount={bindings.length} />

        <AgentBindingsSection agent={agent} versions={versions} bindings={bindings} />
      </div>

      <div css={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        <div css={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div
            css={{ display: 'flex', gap: theme.spacing.sm, padding: `0 ${theme.spacing.md}px ${theme.spacing.sm}px` }}
          >
            <SegmentedControlGroup
              name="mlflow.agent-registry.agent-page.mode"
              componentId="mlflow.agent-registry.agent-page.mode"
              value={mode}
            >
              <SegmentedControlButton
                value={AgentDetailMode.PREVIEW}
                onClick={() => handleModeChange(AgentDetailMode.PREVIEW)}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <ZoomMarqueeSelection />
                  <FormattedMessage defaultMessage="Preview" description="Agent detail > preview mode" />
                </div>
              </SegmentedControlButton>
              <SegmentedControlButton
                value={AgentDetailMode.TRACES}
                onClick={() => handleModeChange(AgentDetailMode.TRACES)}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <ForkHorizontalIcon />
                  <FormattedMessage defaultMessage="Traces" description="Agent detail > traces mode" />
                </div>
              </SegmentedControlButton>
              <SegmentedControlButton
                value={AgentDetailMode.EVALUATIONS}
                onClick={() => handleModeChange(AgentDetailMode.EVALUATIONS)}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <CheckCircleIcon />
                  <FormattedMessage defaultMessage="Evaluations" description="Agent detail > evaluations mode" />
                </div>
              </SegmentedControlButton>
            </SegmentedControlGroup>
          </div>
          <AgentVersionRail
            versions={versions}
            selectedVersion={selectedAgentVersion.version}
            onSelectVersion={(version) =>
              navigate(AgentRegistryRoutes.getAgentVersionPageRoute(agent.organization, agent.name, version), {
                replace: true,
              })
            }
          />
        </div>
        <div
          css={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            borderLeft: `1px solid ${theme.colors.border}`,
            overflow: 'auto',
          }}
        >
          {mode === AgentDetailMode.PREVIEW && (
            <AgentVersionPane
              agent={agent}
              agentVersion={selectedAgentVersion}
              versions={versions}
              bindings={bindings}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
          {mode === AgentDetailMode.TRACES && (
            <div css={{ padding: theme.spacing.md }}>
              <AgentTracesTab agent={agent} agentVersion={selectedAgentVersion} versions={versions} />
            </div>
          )}
          {mode === AgentDetailMode.EVALUATIONS && (
            <div css={{ padding: theme.spacing.md }}>
              <AgentEvaluationsTab agent={agent} agentVersion={selectedAgentVersion} />
            </div>
          )}
        </div>
      </div>

      {AgentFormModal}
      {EditAgentModal}
      {EditAgentTagsModal}
      {DeleteAgentModal}
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, AgentPage);
