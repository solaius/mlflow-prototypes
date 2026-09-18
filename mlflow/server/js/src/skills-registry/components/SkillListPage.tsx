import { Button, Header, Pagination, PuzzleIcon, Spacer, useDesignSystemTheme } from '@databricks/design-system';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillCardGrid } from './SkillCardGrid';
import { SkillListFilters } from './SkillListFilters';
import { SkillListTable } from './SkillListTable';
import type { SkillListFilters as SkillListFilterValues } from '../hooks/useSkills';
import { useSkillsList } from '../hooks/useSkills';
import { useSkillVersionsStore } from '../mocks/skillsStore';
import { SkillFormModalMode, useSkillFormModal } from '../hooks/useSkillFormModal';
import { SkillsRegistryRoutes } from '../routes';
import { SkillStatus } from '../types';
import {
  DEFAULT_REGISTRY_VIEW_MODE,
  RegistryListControls,
  RegistryViewMode,
  RegistryViewModeToggle,
} from '../../common/components/RegistryListControls';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { useNavigate } from '../../common/utils/RoutingUtils';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';

/**
 * Mirrors experiment-tracking's list pagination policy: a fixed default page size,
 * reset to page 1 whenever the filter changes, using the index-based `Pagination`
 * component rather than experiments' `CursorPagination`, because this list has no
 * server to hand back a page token. Set below experiments' 25-per-page default so
 * pagination is actually exercised by the seeded skill count.
 */
const DEFAULT_PAGE_SIZE = 10;

const SkillListPage = () => {
  const { theme } = useDesignSystemTheme();
  const [filters, setFilters] = useState<SkillListFilterValues>({});
  const [viewMode, setViewMode] = useState<RegistryViewMode>(DEFAULT_REGISTRY_VIEW_MODE);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const navigate = useNavigate();
  const { SkillFormModal, openModal: openCreateSkillModal } = useSkillFormModal({
    mode: SkillFormModalMode.CreateSkill,
    onSuccess: ({ organization, name }) => navigate(SkillsRegistryRoutes.getSkillPageRoute(organization, name)),
  });

  const { data: skills, isLoading } = useSkillsList(filters);
  const skillVersions = useSkillVersionsStore();

  /**
   * Latest LIVE version per skill. Both layouts need it: the table for its status
   * column, the cards for their status tag and pull snippet. Deleted versions are
   * excluded here as well as in the read hooks, so a skill whose newest version was
   * deleted reports the newest one a client could actually resolve.
   */
  const latestVersionByKey = useMemo(() => {
    const map = new Map<string, (typeof skillVersions)[number]>();
    for (const version of skillVersions) {
      if (version.status === SkillStatus.DELETED) {
        continue;
      }
      const key = `${version.organization}/${version.name}`;
      const current = map.get(key);
      if (!current || version.version > current.version) {
        map.set(key, version);
      }
    }
    return map;
  }, [skillVersions]);

  const isFiltered = Boolean(
    filters.search?.trim() ||
    filters.status ||
    filters.organization ||
    filters.sourceType ||
    filters.label ||
    filters.agent ||
    filters.plugin,
  );

  // A narrower (or wider) result set can easily leave the current page out of range,
  // so every filter change lands back on page 1.
  useEffect(() => {
    setCurrentPageIndex(1);
  }, [filters]);

  const pagedSkills = useMemo(() => {
    const start = (currentPageIndex - 1) * pageSize;
    return skills.slice(start, start + pageSize);
  }, [skills, currentPageIndex, pageSize]);

  const paginationElement = (
    <Pagination
      componentId="mlflow.skills-registry.skill-list.pagination"
      currentPageIndex={currentPageIndex}
      pageSize={pageSize}
      numTotal={skills.length}
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
      {/*
        Title and primary action on one line, matching the MCP server registry: the
        create action belongs to the page, not to the filter row, so it stays put as
        filters are added or removed.
      */}
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
              <PuzzleIcon />
            </span>
            <FormattedMessage defaultMessage="Skills" description="Skills registry list page title" />
          </span>
        }
        buttons={
          <Button
            componentId="mlflow.skills-registry.skill-list.create-button"
            type="primary"
            onClick={openCreateSkillModal}
          >
            <FormattedMessage
              defaultMessage="Create skill"
              description="Skills registry list page > create skill button"
            />
          </Button>
        }
      />

      {/*
        No subtitle paragraph under the header. The prompts and MCP registry list pages
        both go straight from title to filter row, and the sentence this replaced
        explained the storage model to an audience already on the page.

        The `Spacer` is what that paragraph used to provide incidentally: prompts puts the
        same `<Spacer shrinks={false} />` between its `Header` and its filter row, so this
        is the gap being matched rather than a value picked to look right.
      */}
      <Spacer shrinks={false} />

      <RegistryListControls
        filters={<SkillListFilters filters={filters} onChange={setFilters} />}
        actions={
          <RegistryViewModeToggle
            name="skills-registry-view-mode"
            componentId="mlflow.skills-registry.skill-list.view_toggle"
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {viewMode === RegistryViewMode.LIST ? (
        <SkillListTable
          skills={pagedSkills}
          latestVersionByKey={latestVersionByKey}
          isLoading={isLoading}
          isFiltered={isFiltered}
          pagination={paginationElement}
        />
      ) : (
        <SkillCardGrid
          skills={pagedSkills}
          latestVersionByKey={latestVersionByKey}
          isFiltered={isFiltered}
          pagination={paginationElement}
        />
      )}

      {SkillFormModal}
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, SkillListPage);
