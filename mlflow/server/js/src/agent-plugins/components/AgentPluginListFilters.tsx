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
import { SkillSourceType } from '../../skills-registry/types';
import { SkillStatus } from '../../skills-registry/types';
import { SOURCE_TYPE_LABELS } from '../../skills-registry/utils';
import type { AgentPluginListFilters as AgentPluginListFilterValues } from '../hooks/useAgentPlugins';
import {
  usePluginLabels,
  usePluginMemberNames,
  usePluginMemberTypes,
  usePluginOrganizations,
} from '../hooks/useAgentPlugins';
import type { AgentPluginKind } from '../types';
import { formatMemberType } from '../utils';

/** Sentinel for the unfiltered option; the empty string renders a `SimpleSelect` trigger blank. */
const ALL = '__all__';
const fromOption = (value: string): string | undefined => (value === ALL ? undefined : value);

/**
 * The "source" filter folds kind and packaged source type into one control, because they
 * are one column in the RFC: `source_type` is `assembled`, or one of the four packaged
 * types. Offering "Assembled" beside "Git" is exactly how the API distinguishes them.
 */
const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'kind:packaged', label: 'Packaged (any)' },
  { value: `type:${SkillSourceType.GIT}`, label: SOURCE_TYPE_LABELS[SkillSourceType.GIT] },
  { value: `type:${SkillSourceType.OCI}`, label: SOURCE_TYPE_LABELS[SkillSourceType.OCI] },
  { value: `type:${SkillSourceType.ZIP}`, label: SOURCE_TYPE_LABELS[SkillSourceType.ZIP] },
  { value: `type:${SkillSourceType.MLFLOW}`, label: SOURCE_TYPE_LABELS[SkillSourceType.MLFLOW] },
  { value: 'kind:assembled', label: 'Assembled' },
];

const toSourceOption = (filters: AgentPluginListFilterValues): string =>
  filters.sourceType ? `type:${filters.sourceType}` : filters.kind ? `kind:${filters.kind}` : ALL;

/**
 * The structured filter row RFC-0008's UI section commits to for agent plugins: status,
 * organization, source type, and membership by member name; plus RFC-0010's member type.
 * Free text (and tag clauses) live in the search box, as on every other registry list.
 *
 * Status is the skills registry's Active checkbox (MCP registry parity), and the label
 * control is the skills registry's, matching a tag value whatever its key
 * (2026-09-18-pdouble-agent-plugins-replay#3).
 */
export const AgentPluginListFilters = ({
  filters,
  onChange,
}: {
  filters: AgentPluginListFilterValues;
  onChange: (filters: AgentPluginListFilterValues) => void;
}) => {
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();
  const organizations = usePluginOrganizations();
  const memberNames = usePluginMemberNames();
  const memberTypes = usePluginMemberTypes();
  const labels = usePluginLabels();

  const update = (partial: Partial<AgentPluginListFilterValues>) => onChange({ ...filters, ...partial });

  return (
    <>
      <TableFilterInput
        componentId="mlflow.agent-plugins.plugin-list.search"
        placeholder={intl.formatMessage({
          defaultMessage: 'Search agent plugins',
          description: 'Placeholder for the agent plugins search box',
        })}
        value={filters.search ?? ''}
        onChange={(event) => update({ search: event.target.value })}
        onClear={() => update({ search: '' })}
        ignoreFilterMediaSizing
        containerProps={{ style: { width: 260, height: theme.general.heightSm } }}
        suffix={
          <ModelSearchInputHelpTooltip
            exampleEntityName="my-plugin-name"
            leadIn={
              <FormattedMessage
                defaultMessage="Filter by tag, org, keyword, source type, member, and label."
                description="Agent plugins > search box help popover > summary of the available filters"
              />
            }
          />
        }
      />

      {/* The skills registry's Active checkbox; the wrapper borrows the select triggers' border and height. */}
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
          componentId="mlflow.agent-plugins.plugin-list.active-filter"
          isChecked={filters.status === SkillStatus.ACTIVE}
          onChange={() => update({ status: filters.status === SkillStatus.ACTIVE ? undefined : SkillStatus.ACTIVE })}
        >
          <FormattedMessage
            defaultMessage="Active"
            description="Agent plugins > filter row > checkbox that limits the list to active plugins"
          />
        </Checkbox>
      </div>

      <RegistryFilterCombobox
        id="mlflow.agent-plugins.plugin-list.organization-filter"
        componentId="mlflow.agent-plugins.plugin-list.organization-filter"
        options={organizations}
        value={filters.organization}
        onChange={(organization) => update({ organization })}
        placeholder={intl.formatMessage({
          defaultMessage: 'All organizations',
          description: 'Placeholder for the agent plugins organization filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Organization',
          description: 'Aria label for the agent plugins organization filter',
        })}
        formatOption={(organization) => `@${organization}`}
      />

      <SimpleSelect
        id="mlflow.agent-plugins.plugin-list.source-filter"
        componentId="mlflow.agent-plugins.plugin-list.source-filter"
        value={toSourceOption(filters)}
        onChange={({ target }) => {
          const value = target.value;
          if (value === ALL) {
            update({ kind: undefined, sourceType: undefined });
          } else if (value.startsWith('kind:')) {
            update({ kind: value.slice('kind:'.length) as AgentPluginKind, sourceType: undefined });
          } else {
            update({ kind: undefined, sourceType: value.slice('type:'.length) as SkillSourceType });
          }
        }}
        label={intl.formatMessage({
          defaultMessage: 'Source',
          description: 'Label for the agent plugins source filter',
        })}
        width={180}
      >
        <SimpleSelectOption value={ALL}>
          {intl.formatMessage({
            defaultMessage: 'All sources',
            description: 'Agent plugins source filter > unfiltered option',
          })}
        </SimpleSelectOption>
        {SOURCE_OPTIONS.map((option) => (
          <SimpleSelectOption key={option.value} value={option.value}>
            {option.label}
          </SimpleSelectOption>
        ))}
      </SimpleSelect>

      <RegistryFilterCombobox
        id="mlflow.agent-plugins.plugin-list.label-filter"
        componentId="mlflow.agent-plugins.plugin-list.label-filter"
        options={labels}
        value={filters.label}
        onChange={(label) => update({ label })}
        placeholder={intl.formatMessage({
          defaultMessage: 'All labels',
          description: 'Placeholder for the agent plugins label filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Label',
          description: 'Aria label for the agent plugins label filter',
        })}
      />

      {/* RFC-0008: "for agent plugins, membership (by member name)". The reverse of the skill list's plugin filter. */}
      <RegistryFilterCombobox
        id="mlflow.agent-plugins.plugin-list.member-filter"
        componentId="mlflow.agent-plugins.plugin-list.member-filter"
        options={memberNames}
        value={filters.memberName}
        onChange={(memberName) => update({ memberName })}
        placeholder={intl.formatMessage({
          defaultMessage: 'Any member',
          description: 'Placeholder for the agent plugins member name filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Contains member',
          description: 'Aria label for the agent plugins member name filter',
        })}
        width={240}
      />

      {/* RFC-0010: "a filter panel narrows the gallery by member type". New types appear here as plugins carrying them are imported. */}
      <SimpleSelect
        id="mlflow.agent-plugins.plugin-list.member-type-filter"
        componentId="mlflow.agent-plugins.plugin-list.member-type-filter"
        value={filters.memberType ?? ALL}
        onChange={({ target }) => update({ memberType: fromOption(target.value) })}
        label={intl.formatMessage({
          defaultMessage: 'Member type',
          description: 'Label for the agent plugins member type filter',
        })}
        width={170}
      >
        <SimpleSelectOption value={ALL}>
          {intl.formatMessage({
            defaultMessage: 'Any type',
            description: 'Agent plugins member type filter > unfiltered option',
          })}
        </SimpleSelectOption>
        {memberTypes.map((memberType) => (
          <SimpleSelectOption key={memberType} value={memberType}>
            {formatMemberType(memberType)}
          </SimpleSelectOption>
        ))}
      </SimpleSelect>
    </>
  );
};
