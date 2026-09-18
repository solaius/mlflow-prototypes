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

import type { SkillListFilters as SkillListFilterValues } from '../hooks/useSkills';
import { useSkillLabels, useSkillOrganizations } from '../hooks/useSkills';
import { useAgentFilterOptions } from '../../agent-registry/hooks/useCrossRegistryQueries';
import { usePluginFilterOptions } from '../../agent-plugins/hooks/useSkillsInPlugin';
import type { SkillSourceType } from '../types';
import { SkillStatus } from '../types';
import { SOURCE_TYPE_LABELS, SOURCE_TYPE_OPTIONS } from '../utils';

/**
 * Sentinel for the unfiltered Source option.
 *
 * It cannot be the empty string: `SimpleSelect` reads `''` as "nothing selected" and then
 * renders the trigger blank, label and all. A non-empty value matches a real option, which
 * lets the trigger render "Source: All sources" before anyone touches it.
 */
const ALL = '__all__';

export interface SkillListFiltersProps {
  filters: SkillListFilterValues;
  onChange: (filters: SkillListFilterValues) => void;
}

/**
 * The structured filter row: search, an Active checkbox, organization, source type and label.
 *
 * Source type stays, on RFC-0008's UI section, which names it as a structured filter.
 * The 2026-09-15 stakeholder pass removed it and the 2026-09-18 merge restored it
 * (2026-09-18-pdouble-round2-merge-rulings#5); the filter set as a whole is to be
 * re-evaluated later rather than trimmed one control at a time.
 */
export const SkillListFilters = ({ filters, onChange }: SkillListFiltersProps) => {
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();
  const organizations = useSkillOrganizations();
  const agentOptions = useAgentFilterOptions();
  const pluginOptions = usePluginFilterOptions();
  const agentVersions = agentOptions.find((option) => option.agentName === filters.agent)?.versions ?? [];
  const labels = useSkillLabels();

  const update = (partial: Partial<SkillListFilterValues>) => onChange({ ...filters, ...partial });

  return (
    <>
      <TableFilterInput
        componentId="mlflow.skills-registry.skill-list.search"
        placeholder={intl.formatMessage({
          defaultMessage: 'Search skills',
          description: 'Placeholder for the skills registry search box',
        })}
        value={filters.search ?? ''}
        onChange={(event) => update({ search: event.target.value })}
        onClear={() => update({ search: '' })}
        /*
          Width goes on the CONTAINER, not the input. `TableFilterInput` wraps its input
          in a div carrying a responsive width (30% at lg, 400px at xxl), and a `css` prop
          on the component lands on the inner input instead. Sizing only the input left the
          visible box narrower than the flex item holding it, so the row's gap was measured
          from an edge the eye could not see and Status appeared butted against the search
          box while the selects, which size their own outer element, spaced correctly.
        */
        ignoreFilterMediaSizing
        containerProps={{ style: { width: 260, height: theme.general.heightSm } }}
        suffix={
          <ModelSearchInputHelpTooltip
            exampleEntityName="my-skill-name"
            leadIn={
              <FormattedMessage
                defaultMessage="Filter by tag, org, keyword, source type, and label."
                description="Skills registry > search box help popover > summary of the available filters"
              />
            }
          />
        }
      />

      {/*
        A checkbox rather than a dropdown, matching the MCP server registry's "Active"
        toggle. Checked = show only active skills; unchecked = show all statuses including
        drafts. Status is a version property, so the filter evaluates the latest live
        version, just as the query layer already does.

        The wrapper borrows the same border, height and radius the `SimpleSelect` triggers
        use, so the checkbox reads as a peer of the dropdowns rather than a floating label.
      */}
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
          componentId="mlflow.skills-registry.skill-list.active-filter"
          isChecked={filters.status === SkillStatus.ACTIVE}
          onChange={() => update({ status: filters.status === SkillStatus.ACTIVE ? undefined : SkillStatus.ACTIVE })}
        >
          <FormattedMessage
            defaultMessage="Active"
            description="Skills registry > filter row > checkbox that limits the list to active skills"
          />
        </Checkbox>
      </div>

      {/*
        `formatOption` prints the `@` in the menu AND in the input once something is picked,
        but the VALUE stays bare, because that is what the query layer stores and what a
        skill record carries. The marker is presentation: it is how RFC-0008 writes an
        organization everywhere else, and printing it here keeps the dropdown reading the
        same as the URIs on the detail page.
      */}
      <RegistryFilterCombobox
        id="mlflow.skills-registry.skill-list.organization-filter"
        componentId="mlflow.skills-registry.skill-list.organization-filter"
        options={organizations}
        value={filters.organization}
        onChange={(organization) => update({ organization })}
        placeholder={intl.formatMessage({
          defaultMessage: 'All organizations',
          description: 'Placeholder for the skills registry organization filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Organization',
          description: 'Aria label for the skills registry organization filter',
        })}
        formatOption={(organization) => `@${organization}`}
      />

      <SimpleSelect
        id="mlflow.skills-registry.skill-list.source-filter"
        componentId="mlflow.skills-registry.skill-list.source-filter"
        value={filters.sourceType ?? ALL}
        onChange={({ target }) =>
          update({ sourceType: target.value === ALL ? undefined : (target.value as SkillSourceType) })
        }
        label={intl.formatMessage({
          defaultMessage: 'Source',
          description: 'Label for the skills registry source type filter',
        })}
        width={180}
      >
        <SimpleSelectOption value={ALL}>
          {intl.formatMessage({
            defaultMessage: 'All sources',
            description: 'Skills registry source filter > unfiltered option',
          })}
        </SimpleSelectOption>
        {SOURCE_TYPE_OPTIONS.map((sourceType) => (
          <SimpleSelectOption key={sourceType} value={sourceType}>
            {SOURCE_TYPE_LABELS[sourceType]}
          </SimpleSelectOption>
        ))}
      </SimpleSelect>

      <RegistryFilterCombobox
        id="mlflow.skills-registry.skill-list.label-filter"
        componentId="mlflow.skills-registry.skill-list.label-filter"
        options={labels}
        value={filters.label}
        onChange={(label) => update({ label })}
        placeholder={intl.formatMessage({
          defaultMessage: 'All labels',
          description: 'Placeholder for the skills registry label filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Label',
          description: 'Aria label for the skills registry label filter',
        })}
      />

      {/*
        Not one of the four structured filters RFC-0008 names. This is a cross-registry
        reverse lookup over the pins agent versions record, and it is kept last so the
        RFC's own set reads as a group.

        Searchable for the same reason organization is: the number of registered agents
        grows with the registry and has no ceiling. Its version filter below stays a
        plain select, because one agent's versions are few and bounded.
      */}
      <RegistryFilterCombobox
        id="mlflow.skills-registry.skill-list.agent-filter"
        componentId="mlflow.skills-registry.skill-list.agent-filter"
        options={agentOptions.map(({ agentName }) => agentName)}
        value={filters.agent}
        onChange={(agent) => update({ agent, agentVersion: undefined })}
        placeholder={intl.formatMessage({
          defaultMessage: 'Any agent',
          description: 'Placeholder for the skills registry used-by-agent filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Used by agent',
          description: 'Aria label for the skills registry used-by-agent filter',
        })}
      />

      {filters.agent && (
        <SimpleSelect
          id="mlflow.skills-registry.skill-list.agent-version-filter"
          componentId="mlflow.skills-registry.skill-list.agent-version-filter"
          value={filters.agentVersion ?? ALL}
          onChange={({ target }) => update({ agentVersion: target.value === ALL ? undefined : target.value })}
          label={intl.formatMessage({
            defaultMessage: 'Agent version',
            description: 'Label for the skills registry agent version filter',
          })}
          width={160}
        >
          <SimpleSelectOption value={ALL}>
            {intl.formatMessage({
              defaultMessage: 'Any version',
              description: 'Skills registry agent version filter > unfiltered option',
            })}
          </SimpleSelectOption>
          {agentVersions.map((version) => (
            <SimpleSelectOption key={version} value={version}>
              {version}
            </SimpleSelectOption>
          ))}
        </SimpleSelect>
      )}

      {/*
        Pick a plugin, see the skills inside it -- Nana's shape from the 2026-09-04
        session, which Juntao then placed here rather than anywhere new: it is one more
        entry in a filter group that already exists.

        Single-select, matching the filters beside it. Multi-select came up on the same
        call and was parked with the broader toolbar rework: once there are this many
        dropdowns the answer is a type-and-value filter builder, not a tenth control.
      */}
      <RegistryFilterCombobox
        id="mlflow.skills-registry.skill-list.plugin-filter"
        componentId="mlflow.skills-registry.skill-list.plugin-filter"
        options={pluginOptions}
        value={filters.plugin}
        onChange={(plugin) => update({ plugin })}
        placeholder={intl.formatMessage({
          defaultMessage: 'Any plugin',
          description: 'Placeholder for the skills registry packaged-in-plugin filter',
        })}
        ariaLabel={intl.formatMessage({
          defaultMessage: 'Packaged in plugin',
          description: 'Aria label for the skills registry packaged-in-plugin filter',
        })}
      />
    </>
  );
};
