import {
  Checkbox,
  SimpleSelect,
  SimpleSelectOption,
  TableFilterInput,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { RegistryFilterCombobox } from '../../common/components/RegistryFilterCombobox';
import { ModelSearchInputHelpTooltip } from '../../model-registry/components/model-list/ModelListFilters';
import type { AgentListFilters as AgentListFilterValues, BomAxis } from '../hooks/useAgents';
import { useAgentLabels, useAgentOrganizations, useBomAxisOptions, useBomAxisVersions } from '../hooks/useAgents';
import { AgentBindingProtocol, AgentStatus } from '../types';
import { PROTOCOL_LABELS } from '../utils';

const ALL = '__all__';
const fromOption = (value: string): string | undefined => (value === ALL ? undefined : value);

const BOM_AXIS_LABELS: Record<BomAxis, string> = {
  skill: 'Skill',
  agent_plugin: 'Agent plugin',
  mcp_server: 'MCP server',
  model: 'Model',
  agent: 'Agent',
};

/**
 * The agent list's filter row: status, organization, binding protocol, anchor kind, and the
 * BOM predicate RFC-0011's blast-radius journey runs -- pick an axis, pick a name, optionally
 * pin a version, and the list answers "which agents carry this?" Tags ride in the search
 * box through the shared syntax, as everywhere else.
 */
export const AgentListFilters = ({
  filters,
  onChange,
}: {
  filters: AgentListFilterValues;
  onChange: (filters: AgentListFilterValues) => void;
}) => {
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();
  const organizations = useAgentOrganizations();
  const labels = useAgentLabels();
  const bomOptions = useBomAxisOptions(filters.bomAxis);
  const bomVersions = useBomAxisVersions(filters.bomAxis, filters.bomName);

  const update = (partial: Partial<AgentListFilterValues>) => onChange({ ...filters, ...partial });

  return (
    <>
      <TableFilterInput
        componentId="mlflow.agent-registry.agent-list.search"
        placeholder={intl.formatMessage({
          defaultMessage: 'Search agents',
          description: 'Placeholder for the agent registry search box',
        })}
        value={filters.search ?? ''}
        onChange={(event) => update({ search: event.target.value })}
        onClear={() => update({ search: '' })}
        ignoreFilterMediaSizing
        containerProps={{ style: { width: 260, height: theme.general.heightSm } }}
        suffix={
          <ModelSearchInputHelpTooltip
            exampleEntityName="my-agent-name"
            leadIn={
              <FormattedMessage
                defaultMessage="Filter by tag, org, keyword, binding, anchor, label, and bill of materials."
                description="Agent registry > search box help popover > summary of the available filters"
              />
            }
          />
        }
      />

      {/* The skills registry's Active checkbox (MCP parity); the wrapper borrows the select triggers' border. */}
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          height: theme.general.heightSm,
          border: `1px solid ${theme.colors.actionDefaultBorderDefault}`,
          borderRadius: theme.general.borderRadiusBase,
          paddingLeft: theme.spacing.sm,
          paddingRight: theme.spacing.sm,
        }}
      >
        <Checkbox
          componentId="mlflow.agent-registry.agent-list.active-filter"
          isChecked={filters.status === AgentStatus.ACTIVE}
          onChange={() => update({ status: filters.status === AgentStatus.ACTIVE ? undefined : AgentStatus.ACTIVE })}
        >
          <FormattedMessage
            defaultMessage="Active"
            description="Agent registry > filter row > checkbox that limits the list to active agents"
          />
        </Checkbox>
      </div>

      <RegistryFilterCombobox
        id="mlflow.agent-registry.agent-list.organization-filter"
        componentId="mlflow.agent-registry.agent-list.organization-filter"
        options={organizations}
        value={filters.organization}
        onChange={(organization) => update({ organization })}
        placeholder={intl.formatMessage({
          defaultMessage: 'All organizations',
          description: 'Placeholder for the agent registry organization filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Organization',
          description: 'Aria label for the agent registry organization filter',
        })}
        formatOption={(organization) => `@${organization}`}
      />

      <SimpleSelect
        id="mlflow.agent-registry.agent-list.binding-filter"
        componentId="mlflow.agent-registry.agent-list.binding-filter"
        value={filters.bindingProtocol ?? ALL}
        onChange={({ target }) =>
          update({ bindingProtocol: fromOption(target.value) as AgentListFilterValues['bindingProtocol'] })
        }
        label={intl.formatMessage({
          defaultMessage: 'Endpoint',
          description: 'Label for the agent registry binding filter',
        })}
        width={170}
      >
        <SimpleSelectOption value={ALL}>
          {intl.formatMessage({
            defaultMessage: 'Any or none',
            description: 'Agent registry binding filter > unfiltered option',
          })}
        </SimpleSelectOption>
        <SimpleSelectOption value="any">
          {intl.formatMessage({
            defaultMessage: 'Has a binding',
            description: 'Agent registry binding filter > any binding',
          })}
        </SimpleSelectOption>
        {Object.values(AgentBindingProtocol).map((protocol) => (
          <SimpleSelectOption key={protocol} value={protocol}>
            {PROTOCOL_LABELS[protocol]}
          </SimpleSelectOption>
        ))}
      </SimpleSelect>

      <SimpleSelect
        id="mlflow.agent-registry.agent-list.anchor-filter"
        componentId="mlflow.agent-registry.agent-list.anchor-filter"
        value={filters.anchor ?? ALL}
        onChange={({ target }) => update({ anchor: fromOption(target.value) as AgentListFilterValues['anchor'] })}
        label={intl.formatMessage({
          defaultMessage: 'Record',
          description: 'Label for the agent registry anchor filter',
        })}
        width={170}
      >
        <SimpleSelectOption value={ALL}>
          {intl.formatMessage({
            defaultMessage: 'All records',
            description: 'Agent registry anchor filter > unfiltered option',
          })}
        </SimpleSelectOption>
        <SimpleSelectOption value="anchored">
          {intl.formatMessage({ defaultMessage: 'Anchored', description: 'Agent registry anchor filter > anchored' })}
        </SimpleSelectOption>
        <SimpleSelectOption value="interface-only">
          {intl.formatMessage({
            defaultMessage: 'Interface-only',
            description: 'Agent registry anchor filter > interface-only',
          })}
        </SimpleSelectOption>
      </SimpleSelect>

      <RegistryFilterCombobox
        id="mlflow.agent-registry.agent-list.label-filter"
        componentId="mlflow.agent-registry.agent-list.label-filter"
        options={labels}
        value={filters.label}
        onChange={(label) => update({ label })}
        placeholder={intl.formatMessage({
          defaultMessage: 'All labels',
          description: 'Placeholder for the agent registry label filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Label',
          description: 'Aria label for the agent registry label filter',
        })}
      />

      {/*
        The blast-radius predicate: `bom.<axis>.name = X [AND version = Y]`. Kept last so
        the record filters read as a group, and split into axis, name and version because
        that is how the RFC writes the query.
      */}
      <SimpleSelect
        id="mlflow.agent-registry.agent-list.bom-axis-filter"
        componentId="mlflow.agent-registry.agent-list.bom-axis-filter"
        value={filters.bomAxis ?? ALL}
        onChange={({ target }) =>
          update({
            bomAxis: fromOption(target.value) as BomAxis | undefined,
            bomName: undefined,
            bomVersion: undefined,
          })
        }
        label={intl.formatMessage({
          defaultMessage: 'Uses',
          description: 'Label for the agent registry BOM axis filter',
        })}
        width={160}
      >
        <SimpleSelectOption value={ALL}>
          {intl.formatMessage({
            defaultMessage: 'Anything',
            description: 'Agent registry BOM axis filter > unfiltered option',
          })}
        </SimpleSelectOption>
        {(Object.keys(BOM_AXIS_LABELS) as BomAxis[]).map((axis) => (
          <SimpleSelectOption key={axis} value={axis}>
            {BOM_AXIS_LABELS[axis]}
          </SimpleSelectOption>
        ))}
      </SimpleSelect>

      {filters.bomAxis && (
        <RegistryFilterCombobox
          id="mlflow.agent-registry.agent-list.bom-name-filter"
          componentId="mlflow.agent-registry.agent-list.bom-name-filter"
          options={bomOptions}
          value={filters.bomName}
          onChange={(bomName) => update({ bomName, bomVersion: undefined })}
          placeholder={intl.formatMessage(
            { defaultMessage: 'Any {axis}', description: 'Placeholder for the agent registry BOM name filter' },
            { axis: BOM_AXIS_LABELS[filters.bomAxis].toLowerCase() },
          )}
          ariaLabel={intl.formatMessage({
            defaultMessage: 'Component name',
            description: 'Aria label for the agent registry BOM name filter',
          })}
          width={260}
        />
      )}

      {filters.bomAxis && filters.bomName && bomVersions.length > 0 && (
        <SimpleSelect
          id="mlflow.agent-registry.agent-list.bom-version-filter"
          componentId="mlflow.agent-registry.agent-list.bom-version-filter"
          value={filters.bomVersion ?? ALL}
          onChange={({ target }) => update({ bomVersion: fromOption(target.value) })}
          label={intl.formatMessage({
            defaultMessage: 'Version',
            description: 'Label for the agent registry BOM version filter',
          })}
          width={150}
        >
          <SimpleSelectOption value={ALL}>
            {intl.formatMessage({
              defaultMessage: 'Any version',
              description: 'Agent registry BOM version filter > unfiltered option',
            })}
          </SimpleSelectOption>
          {bomVersions.map((version) => (
            <SimpleSelectOption key={version} value={version}>
              {version}
            </SimpleSelectOption>
          ))}
        </SimpleSelect>
      )}
    </>
  );
};
