import {
  Button,
  Empty,
  PlayIcon,
  PlugIcon,
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
import { Link } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';
import {
  EmptyCell,
  PluginKindTag,
  PluginMemberCountsCell,
  PluginOrganizationCell,
  PluginStatusTag,
  PluginVersionLinkCell,
} from './AgentPluginCellRenderers';
import { AgentPluginPullModal } from './AgentPluginPullModal';
import { AgentPluginsRoutes } from '../routes';
import type { AgentPluginEntity, AgentPluginVersionEntity } from '../types';
import { getManifestDescription, getPluginVersionKind } from '../utils';

enum ColumnKeys {
  NAME = 'name',
  ORGANIZATION = 'organization',
  DESCRIPTION = 'description',
  LATEST_VERSION = 'latest_version',
  MEMBERS = 'members',
  STATUS = 'status',
  KIND = 'kind',
  LAST_UPDATED = 'last_updated_timestamp',
  ACTIONS = 'actions',
}

type PluginsColumnDef = ColumnDef<AgentPluginEntity> & {
  meta?: { styles?: Interpolation<Theme>; align?: 'left' | 'center' | 'right' };
};

export interface AgentPluginListTableProps {
  plugins: AgentPluginEntity[];
  latestVersionByKey: Map<string, AgentPluginVersionEntity>;
  isLoading: boolean;
  isFiltered: boolean;
  pagination?: React.ReactElement;
}

export const AgentPluginListTable = ({
  plugins,
  latestVersionByKey,
  isLoading,
  isFiltered,
  pagination,
}: AgentPluginListTableProps) => {
  const intl = useIntl();
  const [pullTarget, setPullTarget] = useState<AgentPluginEntity | undefined>(undefined);

  const tableColumns = useMemo(() => {
    const latestFor = (plugin: AgentPluginEntity) => latestVersionByKey.get(`${plugin.organization}/${plugin.name}`);
    const columns: PluginsColumnDef[] = [
      {
        id: ColumnKeys.NAME,
        header: intl.formatMessage({ defaultMessage: 'Name', description: 'Column title for the plugin name' }),
        accessorKey: 'name',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          <span css={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <RegistryIconImage
              icons={original.icons}
              name={original.name}
              placeholder={<PlugIcon css={{ flexShrink: 0 }} />}
              css={{ flexShrink: 0 }}
            />
            <Link
              componentId="mlflow.agent-plugins.plugin-list.plugin-name-link"
              to={AgentPluginsRoutes.getPluginPageRoute(original.organization, original.name)}
              css={{ minWidth: 0 }}
            >
              <Tooltip componentId="mlflow.agent-plugins.plugin-list.plugin-name.tooltip" content={original.name}>
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
          description: 'Column title for the plugin organization',
        }),
        accessorKey: 'organization',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => <PluginOrganizationCell organization={String(getValue())} />,
        // Wide enough that the longest organizations don't truncate (demo-prep#45).
        meta: { styles: { maxWidth: 200, flex: 1 } },
      },
      {
        id: ColumnKeys.DESCRIPTION,
        header: intl.formatMessage({
          defaultMessage: 'Description',
          description: 'Column title for the plugin description',
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestFor(original);
          const description =
            original.description || (latest ? (getManifestDescription(latest.plugin_json) ?? '') : '');
          return (
            <Tooltip componentId="mlflow.agent-plugins.plugin-list.description.tooltip" content={description}>
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
          description: 'Column title for the latest plugin version',
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          <PluginVersionLinkCell
            organization={original.organization}
            name={original.name}
            version={original.latest_version}
          />
        ),
        meta: { styles: { maxWidth: 130 }, align: 'center' },
      },
      {
        id: ColumnKeys.MEMBERS,
        header: intl.formatMessage({
          defaultMessage: 'Members',
          description: 'Column title for the plugin member counts',
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestFor(original);
          return latest ? <PluginMemberCountsCell members={latest.members} /> : <EmptyCell />;
        },
        meta: { styles: { minWidth: 200, flex: 1 } },
      },
      {
        id: ColumnKeys.STATUS,
        header: intl.formatMessage({
          defaultMessage: 'Status',
          description: "Column title for the latest version's status",
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestFor(original);
          return latest ? <PluginStatusTag status={latest.status} /> : <EmptyCell />;
        },
        meta: { styles: { maxWidth: 120 } },
      },
      {
        id: ColumnKeys.KIND,
        header: intl.formatMessage({
          defaultMessage: 'Kind',
          description: "Column title for the latest version's kind",
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestFor(original);
          return latest ? <PluginKindTag kind={getPluginVersionKind(latest.source)} /> : <EmptyCell />;
        },
        meta: { styles: { maxWidth: 120 } },
      },
      {
        id: ColumnKeys.LAST_UPDATED,
        header: intl.formatMessage({
          defaultMessage: 'Last modified',
          description: 'Column title for the last modified timestamp',
        }),
        accessorKey: 'last_updated_timestamp',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => <span>{Utils.formatTimestamp(getValue(), intl)}</span>,
        meta: { styles: { maxWidth: 150, flex: 1 } },
      },
      {
        id: ColumnKeys.ACTIONS,
        header: intl.formatMessage({ defaultMessage: 'Use', description: 'Column title for the per-row pull action' }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          <Tooltip
            componentId="mlflow.agent-plugins.plugin-list.pull.tooltip"
            content={intl.formatMessage({
              defaultMessage: 'Show the command to pull this plugin',
              description: 'Tooltip on the per-row pull button in the agent plugins list',
            })}
          >
            <Button
              componentId="mlflow.agent-plugins.plugin-list.pull"
              size="small"
              icon={<PlayIcon />}
              aria-label={intl.formatMessage(
                { defaultMessage: 'Use {name}', description: 'Aria label for the per-row pull button' },
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

  const table = useReactTable<AgentPluginEntity>(
    'mlflow/server/js/src/agent-plugins/components/AgentPluginListTable.tsx',
    {
      data: plugins,
      columns: tableColumns,
      getCoreRowModel: getCoreRowModel(),
      getRowId: ({ organization, name }) => `${organization}/${name}`,
    },
  );

  const emptyComponent = isFiltered ? (
    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
      <Empty
        image={<SearchIcon />}
        data-testid="plugin-list-no-results"
        description={
          <FormattedMessage
            defaultMessage="No results. Try using a different keyword or clearing a filter."
            description="Agent plugins table > no results after filtering"
          />
        }
      />
    </div>
  ) : (
    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
      <Empty
        image={<PlugIcon />}
        title={
          <FormattedMessage
            defaultMessage="No agent plugins registered"
            description="Agent plugins table > empty state title"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Assemble a plugin from registered skills, or import a package."
            description="Agent plugins table > empty state description"
          />
        }
      />
    </div>
  );

  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;

  return (
    <>
      <Table
        data-testid="plugin-list-table"
        scrollable
        empty={isEmpty ? emptyComponent : undefined}
        pagination={isEmpty ? undefined : pagination}
      >
        <TableRow isHeader>
          {table.getLeafHeaders().map((header) => {
            const meta = (header.column.columnDef as PluginsColumnDef).meta;
            return (
              <TableHeader
                componentId="mlflow.agent-plugins.plugin-list.table-header"
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
                const meta = (cell.column.columnDef as PluginsColumnDef).meta;
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
        <AgentPluginPullModal
          visible
          plugin={pullTarget}
          pluginVersion={latestVersionByKey.get(`${pullTarget.organization}/${pullTarget.name}`)}
          onClose={() => setPullTarget(undefined)}
        />
      )}
    </>
  );
};
