import {
  Breadcrumb,
  Button,
  DropdownMenu,
  Empty,
  OverflowIcon,
  PlugIcon,
  Typography,
  useDesignSystemTheme,
  WarningIcon,
} from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { RegistryIconImage } from '../../common/components/RegistryIcon';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { Link, useNavigate, useParams, useSearchParams } from '../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import { SkillDescriptionBox } from '../../skills-registry/components/SkillDescriptionBox';
import { SkillTagsBox } from '../../skills-registry/components/SkillTagsBox';
import { AgentPluginVersionPane, PluginDetailTab, isPluginDetailTab } from './AgentPluginVersionPane';
import { AgentPluginVersionRail } from './AgentPluginVersionRail';
import { getPluginQualifiedName } from '../constants';
import { isPluginVersionKeyWithdrawn, useAgentPlugin } from '../hooks/useAgentPlugins';
import { useEditPluginModal } from '../hooks/useEditPluginModal';
import { useEditPluginTagsModal } from '../hooks/useEditPluginTagsModal';
import { useDeletePluginModal } from '../hooks/usePluginDeleteModals';
import { PluginFormModalMode, usePluginFormModal } from '../hooks/usePluginFormModal';
import { AgentPluginsRoutes, parsePluginParam } from '../routes';
import { getManifestDescription } from '../utils';

/**
 * Plugin detail page: the master-detail layout of `SkillPage`, with the header (breadcrumb,
 * icon, name and @org, kebab with Edit and Delete, Use, Add version), the description
 * (falling back to the manifest's), tags and alias references, then the rail beside the
 * pane. The rail renders once beside the pane rather than once per tab, and the tab lives
 * in the URL, Members by default and out of the query string.
 */
const AgentPluginPage = () => {
  const { theme } = useDesignSystemTheme();
  const navigate = useNavigate();
  const { pluginName: rawPluginName, version: rawVersion } = useParams();
  const { organization, name: pluginName } = useMemo(
    () => parsePluginParam(rawPluginName ? decodeURIComponent(rawPluginName) : ''),
    [rawPluginName],
  );
  const requestedVersion = rawVersion ? decodeURIComponent(rawVersion) : undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = isPluginDetailTab(tabParam) ? tabParam : PluginDetailTab.MEMBERS;
  const handleTabChange = (value: PluginDetailTab) => {
    const next = new URLSearchParams(searchParams);
    if (value === PluginDetailTab.MEMBERS) {
      next.delete('tab');
    } else {
      next.set('tab', value);
    }
    setSearchParams(next, { replace: true });
  };

  const {
    data: { plugin, versions, withdrawnKeys },
  } = useAgentPlugin(organization, pluginName);

  const selectedPluginVersion = useMemo(() => {
    if (!versions.length) {
      return undefined;
    }
    const requested = requestedVersion ? versions.find((v) => v.version === requestedVersion) : undefined;
    // versions is newest-first by semantic precedence, so [0] is the default selection.
    return requested ?? versions[0];
  }, [versions, requestedVersion]);

  const { PluginFormModal, openModal: openAddVersionModal } = usePluginFormModal({
    mode: PluginFormModalMode.CreatePluginVersion,
    organization,
    pluginName,
    onSuccess: ({ version }) =>
      version !== undefined &&
      navigate(AgentPluginsRoutes.getPluginVersionPageRoute(organization, pluginName, version), { replace: true }),
  });
  const { EditPluginModal, openEditPluginModal } = useEditPluginModal({ plugin });
  const { EditPluginTagsModal, openEditPluginTagsModal } = useEditPluginTagsModal({ plugin });
  const { DeletePluginModal, openModal: openDeletePluginModal } = useDeletePluginModal({
    organization,
    pluginName,
    onSuccess: () => navigate(AgentPluginsRoutes.pluginListPageRoute),
  });

  if (!plugin || !selectedPluginVersion) {
    return (
      <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Empty
          image={<WarningIcon />}
          title={
            <FormattedMessage defaultMessage="Agent plugin not found" description="Agent plugins > not found title" />
          }
          description={
            <FormattedMessage
              defaultMessage="No agent plugin named {pluginName} is registered."
              description="Agent plugins > not found description"
              values={{ pluginName: getPluginQualifiedName(organization, pluginName) }}
            />
          }
        />
      </div>
    );
  }

  const description = plugin.description || getManifestDescription(selectedPluginVersion.plugin_json) || '';

  return (
    <div css={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div css={{ padding: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
        <Breadcrumb includeTrailingCaret>
          <Breadcrumb.Item>
            <Link
              componentId="mlflow.agent-plugins.plugin-page.breadcrumb-plugins"
              to={AgentPluginsRoutes.pluginListPageRoute}
            >
              <FormattedMessage defaultMessage="Agent plugins" description="Agent plugins breadcrumb root" />
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
            <div
              css={{
                borderRadius: theme.borders.borderRadiusSm,
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.sm,
                display: 'flex',
              }}
            >
              <RegistryIconImage icons={plugin.icons} name={plugin.name} size={20} placeholder={<PlugIcon />} />
            </div>
            <div css={{ display: 'flex', flexDirection: 'column' }}>
              <Typography.Title withoutMargins level={2}>
                {plugin.name}
              </Typography.Title>
            </div>
          </div>

          <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  componentId="mlflow.agent-plugins.plugin-page.actions"
                  icon={<OverflowIcon />}
                  aria-label="More actions"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  componentId="mlflow.agent-plugins.plugin-page.actions.edit"
                  onClick={openEditPluginModal}
                >
                  <FormattedMessage defaultMessage="Edit" description="Agent plugins > plugin page > edit action" />
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  componentId="mlflow.agent-plugins.plugin-page.actions.delete"
                  onClick={openDeletePluginModal}
                >
                  <FormattedMessage defaultMessage="Delete" description="Agent plugins > plugin page > delete action" />
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            {/* No page-level Use: pulling is version-scoped, and the version pane carries it. */}
            <Button
              componentId="mlflow.agent-plugins.plugin-page.add-version"
              type="primary"
              onClick={openAddVersionModal}
            >
              <FormattedMessage
                defaultMessage="Create agent plugin version"
                description="Label for the add plugin version button"
              />
            </Button>
          </div>
        </div>

        {/*
          The skills header: description as muted copy clamped to two lines, then the entity
          tag chips with their own pencil. Keyed on the plugin so another plugin starts
          collapsed. The manifest description stands in when the parent has none (RFC-0008).
          No Alias references block: aliases belong to versions and sit in the rail.
        */}
        <SkillDescriptionBox key={getPluginQualifiedName(plugin.organization, plugin.name)} description={description} />
        <SkillTagsBox tags={plugin.tags} onEdit={openEditPluginTagsModal} />
      </div>

      <div css={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        <div css={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <AgentPluginVersionRail
            versions={versions}
            withdrawnKeys={withdrawnKeys}
            selectedVersion={selectedPluginVersion.version}
            onSelectVersion={(version) =>
              navigate(AgentPluginsRoutes.getPluginVersionPageRoute(plugin.organization, plugin.name, version), {
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
          <AgentPluginVersionPane
            plugin={plugin}
            pluginVersion={selectedPluginVersion}
            isWithdrawn={isPluginVersionKeyWithdrawn(withdrawnKeys, selectedPluginVersion)}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {PluginFormModal}
      {EditPluginModal}
      {EditPluginTagsModal}
      {DeletePluginModal}
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, AgentPluginPage);
