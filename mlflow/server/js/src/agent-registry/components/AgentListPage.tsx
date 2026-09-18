import { Alert, Button, Header, Pagination, RobotIcon, useDesignSystemTheme, Spacer } from '@databricks/design-system';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  DEFAULT_REGISTRY_VIEW_MODE,
  RegistryListControls,
  RegistryViewMode,
  RegistryViewModeToggle,
} from '../../common/components/RegistryListControls';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { useNavigate } from '../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';
import { AgentCardGrid } from './AgentCardGrid';
import { AgentListFilters } from './AgentListFilters';
import { AgentListTable } from './AgentListTable';
import { AgentFormModalMode, useAgentFormModal } from '../hooks/useAgentFormModal';
import type { AgentListFilters as AgentListFilterValues } from '../hooks/useAgents';
import { useAgentProtocolsByKey, useAgentsList, useLatestAgentVersionByKey } from '../hooks/useAgents';
import { AgentRegistryRoutes } from '../routes';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Agents list, laid out as the skills and plugins lists are. One thing is specific to
 * agents: when the blast-radius predicate is active, the count of agents with undeclared
 * composition is shown beside the results, because RFC-0011 says a query that can only see
 * what registrants declared must report what it could not see.
 */
const AgentListPage = () => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [filters, setFilters] = useState<AgentListFilterValues>({});
  const [viewMode, setViewMode] = useState<RegistryViewMode>(DEFAULT_REGISTRY_VIEW_MODE);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const navigate = useNavigate();
  const { AgentFormModal, openModal: openRegisterModal } = useAgentFormModal({
    mode: AgentFormModalMode.CreateAgent,
    onSuccess: ({ organization, name }) => navigate(AgentRegistryRoutes.getAgentPageRoute(organization, name)),
  });

  const {
    data: { agents, undeclaredCompositionCount },
    isLoading,
  } = useAgentsList(filters);
  const latestVersionByKey = useLatestAgentVersionByKey();
  const protocolsByKey = useAgentProtocolsByKey();

  const isFiltered = Boolean(
    filters.search?.trim() ||
    filters.status ||
    filters.organization ||
    filters.bindingProtocol ||
    filters.anchor ||
    filters.label ||
    (filters.bomAxis && filters.bomName),
  );
  const bomActive = Boolean(filters.bomAxis && filters.bomName);

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [filters]);

  const pagedAgents = useMemo(() => {
    const start = (currentPageIndex - 1) * pageSize;
    return agents.slice(start, start + pageSize);
  }, [agents, currentPageIndex, pageSize]);

  const paginationElement = (
    <Pagination
      componentId="mlflow.agent-registry.agent-list.pagination"
      currentPageIndex={currentPageIndex}
      pageSize={pageSize}
      numTotal={agents.length}
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
              <RobotIcon />
            </span>
            <FormattedMessage defaultMessage="Agents" description="Agent registry list page title" />
          </span>
        }
        buttons={
          <Button
            componentId="mlflow.agent-registry.agent-list.create-button"
            type="primary"
            onClick={openRegisterModal}
          >
            <FormattedMessage
              defaultMessage="Register agent"
              description="Agent registry list page > register button"
            />
          </Button>
        }
      />

      {/* No subtitle: title straight to filters, with prompts' Spacer gap (demo-prep#9, #10). */}
      <Spacer shrinks={false} />

      <RegistryListControls
        filters={<AgentListFilters filters={filters} onChange={setFilters} />}
        actions={
          <RegistryViewModeToggle
            name="agent-registry-view-mode"
            componentId="mlflow.agent-registry.agent-list.view_toggle"
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {bomActive && (
        <Alert
          componentId="mlflow.agent-registry.agent-list.blast-radius"
          type={undeclaredCompositionCount ? 'warning' : 'info'}
          closable={false}
          css={{ marginBottom: theme.spacing.md }}
          message={[
            intl.formatMessage(
              {
                defaultMessage:
                  '{matches, plural, =0 {No agents declare} one {# agent declares} other {# agents declare}} {name}.',
                description: 'Agent list > blast-radius summary line',
              },
              { matches: agents.length, name: filters.bomName },
            ),
            undeclaredCompositionCount
              ? intl.formatMessage(
                  {
                    defaultMessage:
                      '{undeclared, plural, one {# more has} other {# more have}} undeclared composition and cannot be matched.',
                    description: 'Agent list > blast-radius undeclared count',
                  },
                  { undeclared: undeclaredCompositionCount },
                )
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          description={intl.formatMessage({
            defaultMessage:
              'The query sees only the component types the registry tracks, and within those, only what registrants declared. Agent plugin references are expanded through their members.',
            description: 'Agent list > blast-radius coverage note',
          })}
        />
      )}

      {viewMode === RegistryViewMode.LIST ? (
        <AgentListTable
          agents={pagedAgents}
          latestVersionByKey={latestVersionByKey}
          protocolsByKey={protocolsByKey}
          isLoading={isLoading}
          isFiltered={isFiltered}
          pagination={paginationElement}
        />
      ) : (
        <AgentCardGrid
          agents={pagedAgents}
          latestVersionByKey={latestVersionByKey}
          protocolsByKey={protocolsByKey}
          isFiltered={isFiltered}
          pagination={paginationElement}
        />
      )}

      {AgentFormModal}
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, AgentListPage);
