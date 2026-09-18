import { Button, Header, Pagination, PlugIcon, Spacer, useDesignSystemTheme } from '@databricks/design-system';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import {
  DEFAULT_REGISTRY_VIEW_MODE,
  RegistryListControls,
  RegistryViewMode,
  RegistryViewModeToggle,
} from '../../common/components/RegistryListControls';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { useNavigate } from '../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import { AgentPluginCardGrid } from './AgentPluginCardGrid';
import { AgentPluginListFilters } from './AgentPluginListFilters';
import { AgentPluginListTable } from './AgentPluginListTable';
import type { AgentPluginListFilters as AgentPluginListFilterValues } from '../hooks/useAgentPlugins';
import { useAgentPluginsList, useLatestPluginVersionByKey } from '../hooks/useAgentPlugins';
import { PluginFormModalMode, usePluginFormModal } from '../hooks/usePluginFormModal';
import { AgentPluginsRoutes } from '../routes';

/** Same page size policy as the skills list: below experiments' default so pagination is exercised by the seeds. */
const DEFAULT_PAGE_SIZE = 10;

/**
 * Agent plugins list, laid out exactly as the skills list: header with the primary create
 * action, a one-line explanation, the structured filter row with the card/table toggle
 * pinned right, and the two layouts sharing one pagination control.
 */
const AgentPluginListPage = () => {
  const { theme } = useDesignSystemTheme();
  const [filters, setFilters] = useState<AgentPluginListFilterValues>({});
  const [viewMode, setViewMode] = useState<RegistryViewMode>(DEFAULT_REGISTRY_VIEW_MODE);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const navigate = useNavigate();
  const { PluginFormModal, openModal: openCreatePluginModal } = usePluginFormModal({
    mode: PluginFormModalMode.CreatePlugin,
    onSuccess: ({ organization, name }) => navigate(AgentPluginsRoutes.getPluginPageRoute(organization, name)),
  });

  const { data: plugins, isLoading } = useAgentPluginsList(filters);
  const latestVersionByKey = useLatestPluginVersionByKey();

  const isFiltered = Boolean(
    filters.search?.trim() ||
    filters.status ||
    filters.organization ||
    filters.kind ||
    filters.sourceType ||
    filters.memberName ||
    filters.memberType ||
    filters.label,
  );

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [filters]);

  const pagedPlugins = useMemo(() => {
    const start = (currentPageIndex - 1) * pageSize;
    return plugins.slice(start, start + pageSize);
  }, [plugins, currentPageIndex, pageSize]);

  const paginationElement = (
    <Pagination
      componentId="mlflow.agent-plugins.plugin-list.pagination"
      currentPageIndex={currentPageIndex}
      pageSize={pageSize}
      numTotal={plugins.length}
      onChange={(pageIndex, newPageSize) => {
        setCurrentPageIndex(pageIndex);
        if (newPageSize) {
          setPageSize(newPageSize);
        }
      }}
    />
  );

  return (
    <div css={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: theme.spacing.md }}>
      <Header
        title={
          <span css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span
              css={{
                borderRadius: theme.borders.borderRadiusSm,
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.sm,
                display: 'flex',
              }}
            >
              <PlugIcon />
            </span>
            <FormattedMessage defaultMessage="Agent plugins" description="Agent plugins list page title" />
          </span>
        }
        buttons={
          <Button
            componentId="mlflow.agent-plugins.plugin-list.create-button"
            type="primary"
            onClick={openCreatePluginModal}
          >
            <FormattedMessage
              defaultMessage="Create agent plugin"
              description="Agent plugins list page > create button"
            />
          </Button>
        }
      />

      {/* No subtitle: title straight to filters, with prompts' Spacer gap (demo-prep#9, #10). */}
      <Spacer shrinks={false} />

      <RegistryListControls
        filters={<AgentPluginListFilters filters={filters} onChange={setFilters} />}
        actions={
          <RegistryViewModeToggle
            name="agent-plugins-view-mode"
            componentId="mlflow.agent-plugins.plugin-list.view_toggle"
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {viewMode === RegistryViewMode.LIST ? (
        <AgentPluginListTable
          plugins={pagedPlugins}
          latestVersionByKey={latestVersionByKey}
          isLoading={isLoading}
          isFiltered={isFiltered}
          pagination={paginationElement}
        />
      ) : (
        <AgentPluginCardGrid
          plugins={pagedPlugins}
          latestVersionByKey={latestVersionByKey}
          isFiltered={isFiltered}
          pagination={paginationElement}
        />
      )}

      {PluginFormModal}
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, AgentPluginListPage);
