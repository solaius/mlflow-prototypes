import {
  Empty,
  RobotIcon,
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
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Link } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';
import Routes from '../../experiment-tracking/routes';
import {
  AgentIconBox,
  AgentOrganizationCell,
  AgentStatusTag,
  AgentVersionLinkCell,
  AnchorKindTag,
  EmptyCell,
  ProtocolTag,
} from './AgentCellRenderers';
import { getAgentQualifiedName } from '../constants';
import { AgentRegistryRoutes } from '../routes';
import type { AgentBindingProtocol, AgentEntity, AgentVersionEntity } from '../types';
import { getAnchorKind } from '../types';

enum ColumnKeys {
  NAME = 'name',
  ORGANIZATION = 'organization',
  DESCRIPTION = 'description',
  LATEST_VERSION = 'latest_version',
  STATUS = 'status',
  BINDINGS = 'bindings',
  RECORD = 'record',
  OBSERVABILITY = 'observability',
  LAST_UPDATED = 'last_updated_timestamp',
}

type AgentsColumnDef = ColumnDef<AgentEntity> & {
  meta?: { styles?: Interpolation<Theme>; align?: 'left' | 'center' | 'right' };
};

export const AgentListTable = ({
  agents,
  latestVersionByKey,
  protocolsByKey,
  isLoading,
  isFiltered,
  pagination,
}: {
  agents: AgentEntity[];
  latestVersionByKey: Map<string, AgentVersionEntity>;
  protocolsByKey: Map<string, Set<AgentBindingProtocol>>;
  isLoading: boolean;
  isFiltered: boolean;
  pagination?: React.ReactElement;
}) => {
  const intl = useIntl();

  const tableColumns = useMemo(() => {
    const columns: AgentsColumnDef[] = [
      {
        id: ColumnKeys.NAME,
        header: intl.formatMessage({ defaultMessage: 'Name', description: 'Column title for the agent name' }),
        accessorKey: 'name',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const protocols = protocolsByKey.get(getAgentQualifiedName(original.organization, original.name));
          return (
            <span css={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <AgentIconBox
                icons={original.icons}
                name={original.name}
                hasA2A={protocols?.has('a2a' as AgentBindingProtocol)}
                size={24}
              />
              <Link
                componentId="mlflow.agent-registry.agent-list.agent-name-link"
                to={AgentRegistryRoutes.getAgentPageRoute(original.organization, original.name)}
                css={{ minWidth: 0 }}
              >
                <Tooltip componentId="mlflow.agent-registry.agent-list.agent-name.tooltip" content={original.name}>
                  <span>{original.name}</span>
                </Tooltip>
              </Link>
            </span>
          );
        },
        meta: { styles: { minWidth: 200, flex: 1 } },
      },
      {
        id: ColumnKeys.ORGANIZATION,
        header: intl.formatMessage({
          defaultMessage: 'Organization',
          description: 'Column title for the agent organization',
        }),
        accessorKey: 'organization',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => <AgentOrganizationCell organization={String(getValue())} />,
        // Wide enough that the longest organizations don't truncate (demo-prep#45).
        meta: { styles: { maxWidth: 200, flex: 1 } },
      },
      {
        id: ColumnKeys.DESCRIPTION,
        header: intl.formatMessage({
          defaultMessage: 'Description',
          description: 'Column title for the agent description',
        }),
        accessorKey: 'description',
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ getValue }) => (
          <Tooltip componentId="mlflow.agent-registry.agent-list.description.tooltip" content={String(getValue())}>
            <span>{String(getValue())}</span>
          </Tooltip>
        ),
        meta: { styles: { minWidth: 220, flex: 2 } },
      },
      {
        id: ColumnKeys.LATEST_VERSION,
        header: intl.formatMessage({
          defaultMessage: 'Latest version',
          description: 'Column title for the latest agent version',
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          <AgentVersionLinkCell
            organization={original.organization}
            agentName={original.name}
            version={original.latest_version}
          />
        ),
        meta: { styles: { maxWidth: 120 }, align: 'center' },
      },
      {
        id: ColumnKeys.STATUS,
        header: intl.formatMessage({
          defaultMessage: 'Status',
          description: "Column title for the latest version's status",
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) =>
          original.status ? <AgentStatusTag status={original.status} /> : <EmptyCell />,
        meta: { styles: { maxWidth: 120 } },
      },
      {
        id: ColumnKeys.BINDINGS,
        header: intl.formatMessage({
          defaultMessage: 'Endpoints',
          description: 'Column title for the binding protocols',
        }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const protocols = protocolsByKey.get(getAgentQualifiedName(original.organization, original.name));
          return protocols?.size ? (
            <span css={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[...protocols].map((protocol) => (
                <ProtocolTag key={protocol} protocol={protocol} />
              ))}
            </span>
          ) : (
            <EmptyCell />
          );
        },
        meta: { styles: { maxWidth: 150 } },
      },
      {
        id: ColumnKeys.RECORD,
        header: intl.formatMessage({ defaultMessage: 'Record', description: 'Column title for the anchor kind' }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => {
          const latest = latestVersionByKey.get(`${original.organization}/${original.name}`);
          return latest ? <AnchorKindTag kind={getAnchorKind(latest)} /> : <EmptyCell />;
        },
        meta: { styles: { maxWidth: 180 } },
      },
      {
        id: ColumnKeys.OBSERVABILITY,
        header: intl.formatMessage({ defaultMessage: 'Traces', description: 'Column title for the traces link' }),
        // eslint-disable-next-line @databricks/no-unstable-nested-components -- go/no-nested-components
        cell: ({ row: { original } }) => (
          <Link
            componentId="mlflow.agent-registry.agent-list.traces-link"
            to={Routes.getExperimentPageTracesTabRoute(original.default_experiment_id)}
          >
            <FormattedMessage
              defaultMessage="Traces"
              description="Agent list > link to the agent's default experiment traces"
            />
          </Link>
        ),
        meta: { styles: { maxWidth: 90 } },
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
    ];
    return columns;
  }, [intl, latestVersionByKey, protocolsByKey]);

  const table = useReactTable<AgentEntity>('mlflow/server/js/src/agent-registry/components/AgentListTable.tsx', {
    data: agents,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: ({ organization, name }) => `${organization}/${name}`,
  });

  const emptyComponent = isFiltered ? (
    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
      <Empty
        image={<SearchIcon />}
        data-testid="agent-list-no-results"
        description={
          <FormattedMessage
            defaultMessage="No results. Try using a different keyword or clearing a filter."
            description="Agent registry table > no results after filtering"
          />
        }
      />
    </div>
  ) : (
    <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
      <Empty
        image={<RobotIcon />}
        title={
          <FormattedMessage
            defaultMessage="No agents registered"
            description="Agent registry table > empty state title"
          />
        }
        description={
          <FormattedMessage
            defaultMessage="Register an agent to record what it is made of, where it runs, and how well it works."
            description="Agent registry table > empty state description"
          />
        }
      />
    </div>
  );

  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;

  return (
    <Table
      data-testid="agent-list-table"
      scrollable
      empty={isEmpty ? emptyComponent : undefined}
      pagination={isEmpty ? undefined : pagination}
    >
      <TableRow isHeader>
        {table.getLeafHeaders().map((header) => {
          const meta = (header.column.columnDef as AgentsColumnDef).meta;
          return (
            <TableHeader
              componentId="mlflow.agent-registry.agent-list.table-header"
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
              const meta = (cell.column.columnDef as AgentsColumnDef).meta;
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
  );
};
