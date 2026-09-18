import {
  Button,
  Empty,
  PlayIcon,
  PuzzleIcon,
  SearchIcon,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableSkeletonRows,
  Tooltip,
} from '@databricks/design-system';
import type { Interpolation, Theme } from '@emotion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel } from '@tanstack/react-table';
import { useReactTable_unverifiedWithReact18 as useReactTable } from '@databricks/web-shared/react-table';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { RegistryIconImage } from '../../common/components/RegistryIcon';

import {
  EmptyCell,
  SkillOrganizationCell,
  SkillSourceTypeTag,
  SkillStatusTag,
  SkillVersionLinkCell,
} from './SkillCellRenderers';
import { SkillPullModal } from './SkillPullModal';
import { SkillsRegistryRoutes } from '../routes';
import type { SkillEntity, SkillVersionEntity } from '../types';
import { Link } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';

enum ColumnKeys {
  NAME = 'name',
  ORGANIZATION = 'organization',
  DESCRIPTION = 'description',
  LATEST_VERSION = 'latest_version',
  STATUS = 'status',
  SOURCE = 'source',
  LAST_UPDATED = 'last_updated_timestamp',
  ACTIONS = 'actions',
}

type SkillsColumnDef = ColumnDef<SkillEntity> & {
  meta?: { styles?: Interpolation<Theme>; align?: 'left' | 'center' | 'right' };
};

export interface SkillListTableProps {
  skills: SkillEntity[];
  /** Latest LIVE version per skill, keyed `{organization}/{name}`. */
  latestVersionByKey: Map<string, SkillVersionEntity>;
  isLoading: boolean;
  isFiltered: boolean;
  /** Pagination control rendered docked to the table, mirroring ModelVersionTable's `pagination` prop. */
  pagination?: React.ReactElement;
}

export const SkillListTable = ({
  skills,
  latestVersionByKey,
  isLoading,
  isFiltered,
  pagination,
}: SkillListTableProps) => {
  const intl = useIntl();
  const [pullTarget, setPullTarget] = useState<SkillEntity | undefined>(undefined);

  const tableColumns = useMemo(() => {
    const columns: SkillsColumnDef[] = [
      {
        id: ColumnKeys.NAME,
        header: intl.formatMessage({
          defaultMessage: 'Name',
          description: 'Column title for the skill name in the skills registry list',
        }),
        accessorKey: 'name',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          // The icon rides inside the name cell rather than taking a column of its own:
          // it identifies the skill, so it belongs beside the name, and a column of mostly
          // identical glyphs would cost width the description needs more.
          <span css={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <RegistryIconImage
              icons={original.icons}
              name={original.name}
              placeholder={<PuzzleIcon css={{ flexShrink: 0 }} />}
              css={{ flexShrink: 0 }}
            />
            <Link
              componentId="mlflow.skills-registry.skill_list.skill_name_link"
              to={SkillsRegistryRoutes.getSkillPageRoute(original.organization, original.name)}
              css={{ minWidth: 0 }}
            >
              <Tooltip componentId="mlflow.skills-registry.skill-list.skill-name.tooltip" content={original.name}>
                <span>{original.name}</span>
              </Tooltip>
            </Link>
          </span>
        ),
        meta: { styles: { minWidth: 200, flex: 1 } },
      },
      {
        id: ColumnKeys.ORGANIZATION,
        header: intl.formatMessage({
          defaultMessage: 'Organization',
          description: 'Column title for the skill organization in the skills registry list',
        }),
        accessorKey: 'organization',
        // `SkillOrganizationCell` prints the leading `@` and renders an unscoped skill as a
        // dash rather than an empty cell, so a bare first segment stays unambiguously a name.
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => <SkillOrganizationCell organization={String(getValue())} />,
        // 200, not the 160 this column used to carry: an organization is an identifier
        // people match on rather than read, and `@rh-ai-engineer` truncated to
        // `@rh-ai-engi…` is the one kind of truncation that costs the reader the answer.
        meta: { styles: { maxWidth: 200, flex: 1 } },
      },
      {
        id: ColumnKeys.DESCRIPTION,
        header: intl.formatMessage({
          defaultMessage: 'Description',
          description: 'Column title for the skill description in the skills registry list',
        }),
        accessorKey: 'description',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => {
          const description = String(getValue());
          return (
            <Tooltip componentId="mlflow.skills-registry.skill-list.description.tooltip" content={description}>
              <span>{description}</span>
            </Tooltip>
          );
        },
        meta: { styles: { minWidth: 220, flex: 2 } },
      },
      {
        id: ColumnKeys.LATEST_VERSION,
        header: intl.formatMessage({
          defaultMessage: 'Latest version',
          description: 'Column title for the latest skill version in the skills registry list',
        }),
        accessorKey: 'latest_version',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue, row: { original } }) => (
          <SkillVersionLinkCell
            organization={original.organization}
            skillName={original.name}
            version={getValue() as number}
          />
        ),
        meta: { styles: { maxWidth: 120 }, align: 'center' },
      },
      {
        id: ColumnKeys.STATUS,
        header: intl.formatMessage({
          defaultMessage: 'Status',
          description: "Column title for the latest version's lifecycle status in the skills registry list",
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestVersionByKey.get(`${original.organization}/${original.name}`);
          return latest ? <SkillStatusTag status={latest.status} /> : <EmptyCell />;
        },
        meta: { styles: { maxWidth: 120 } },
      },
      {
        id: ColumnKeys.SOURCE,
        header: intl.formatMessage({
          defaultMessage: 'Source',
          description: "Column title for the latest version's source type in the skills registry list",
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestVersionByKey.get(`${original.organization}/${original.name}`);
          return latest ? <SkillSourceTypeTag sourceType={latest.source.source_type} /> : <EmptyCell />;
        },
        meta: { styles: { maxWidth: 150 } },
      },
      {
        id: ColumnKeys.LAST_UPDATED,
        header: intl.formatMessage({
          defaultMessage: 'Last modified',
          description: 'Column title for the last modified timestamp in the skills registry list',
        }),
        accessorKey: 'last_updated_timestamp',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => <span>{Utils.formatTimestamp(getValue(), intl)}</span>,
        meta: { styles: { maxWidth: 150, flex: 1 } },
      },
      {
        id: ColumnKeys.ACTIONS,
        header: intl.formatMessage({
          defaultMessage: 'Use',
          description: 'Column title for the per-row pull action in the skills registry list',
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          <Tooltip
            componentId="mlflow.skills-registry.skill-list.pull.tooltip"
            content={intl.formatMessage({
              defaultMessage: 'Show the command to pull this skill',
              description: 'Tooltip on the per-row pull button in the skills registry list',
            })}
          >
            <Button
              componentId="mlflow.skills-registry.skill-list.pull"
              size="small"
              icon={<PlayIcon />}
              aria-label={intl.formatMessage(
                {
                  defaultMessage: 'Use {name}',
                  description: 'Aria label for the per-row pull button in the skills registry list',
                },
                { name: original.name },
              )}
              onClick={() => setPullTarget(original)}
            />
          </Tooltip>
        ),
        meta: { styles: { maxWidth: 80 }, align: 'center' },
      },
    ];

    return columns;
  }, [intl, latestVersionByKey]);

  const table = useReactTable<SkillEntity>('mlflow/server/js/src/skills-registry/components/SkillListTable.tsx', {
    data: skills,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: ({ organization, name }) => `${organization}/${name}`,
  });

  const emptyComponent = isFiltered ? (
    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
      <Empty
        image={<SearchIcon />}
        data-testid="skill-list-no-results"
        description={
          <FormattedMessage
            defaultMessage="No results. Try using a different keyword or clearing a filter."
            description="Skills registry table > no results after filtering"
          />
        }
      />
    </div>
  ) : (
    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
      <Empty
        image={<PuzzleIcon />}
        title={
          <FormattedMessage
            defaultMessage="No skills registered"
            description="Skills registry table > empty state title"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Register a skill to version and share it with your team."
            description="Skills registry table > empty state description"
          />
        }
      />
    </div>
  );

  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;

  return (
    <>
      <Table
        data-testid="skill-list-table"
        scrollable
        empty={isEmpty ? emptyComponent : undefined}
        pagination={isEmpty ? undefined : pagination}
      >
        <TableRow isHeader>
          {table.getLeafHeaders().map((header) => {
            const meta = (header.column.columnDef as SkillsColumnDef).meta;
            return (
              <TableHeader
                componentId="mlflow.skills-registry.skill-list.table-header"
                ellipsis
                key={header.id}
                css={meta?.styles}
                align={meta?.align}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHeader>
            );
          })}
        </TableRow>
        {isLoading ? (
          <TableSkeletonRows table={table} />
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => {
                const meta = (cell.column.columnDef as SkillsColumnDef).meta;
                return (
                  <TableCell ellipsis key={cell.id} css={meta?.styles} align={meta?.align}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </Table>

      {pullTarget && (
        <SkillPullModal
          visible
          skill={pullTarget}
          skillVersion={latestVersionByKey.get(`${pullTarget.organization}/${pullTarget.name}`)}
          onClose={() => setPullTarget(undefined)}
        />
      )}
    </>
  );
};
