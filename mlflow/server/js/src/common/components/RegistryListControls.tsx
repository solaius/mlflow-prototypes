import {
  GridIcon,
  ListIcon,
  SegmentedControlButton,
  SegmentedControlGroup,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useIntl } from 'react-intl';

/**
 * The two layouts every asset registry list offers.
 *
 * Card is the default across all of them. These lists are browsed before they are
 * audited: the first question is "what is available and what is it for", which a card
 * answers with a description and tags, and only then "compare these rows on one field",
 * which is what the table is good at. Defaulting to the table put the scanning case
 * behind a click.
 */
export enum RegistryViewMode {
  LIST = 'list',
  GRID = 'grid',
}

export const DEFAULT_REGISTRY_VIEW_MODE = RegistryViewMode.GRID;

/**
 * List/card toggle, matching the MCP server registry's control exactly: same icons,
 * same aria labels, same segmented group.
 *
 * `name` must be unique per page, since a segmented control is a radio group and two
 * groups sharing a name on one document would fight over selection.
 */
export const RegistryViewModeToggle = ({
  name,
  componentId,
  value,
  onChange,
}: {
  name: string;
  componentId: string;
  value: RegistryViewMode;
  onChange: (mode: RegistryViewMode) => void;
}) => {
  const intl = useIntl();

  return (
    <SegmentedControlGroup
      name={name}
      componentId={componentId}
      value={value}
      onChange={(event) => onChange(event.target.value as RegistryViewMode)}
    >
      <SegmentedControlButton
        value={RegistryViewMode.LIST}
        icon={<ListIcon />}
        aria-label={intl.formatMessage({
          defaultMessage: 'List view',
          description: 'Aria label for the registry list view toggle',
        })}
      />
      <SegmentedControlButton
        value={RegistryViewMode.GRID}
        icon={<GridIcon />}
        aria-label={intl.formatMessage({
          defaultMessage: 'Grid view',
          description: 'Aria label for the registry grid view toggle',
        })}
      />
    </SegmentedControlGroup>
  );
};

/**
 * Filter row for an asset registry list: filters on the left, view toggle (and anything
 * else passed as `actions`) pinned right on the same line.
 *
 * This deliberately does NOT use `TableFilterLayout`. That component puts its `actions`
 * slot in a wrapping flex container alongside the filters, so once a page had more than
 * a couple of filters the toggle wrapped onto its own line and left-aligned under them.
 * The MCP server registry never had that problem because it lays the row out directly:
 * a `flex: 1` region for the filters and a non-shrinking region for the controls. This
 * is that layout, extracted so the four registries cannot drift apart again.
 *
 * `alignItems: flex-start` matters: filters wrap internally, and without it the toggle
 * would drift to the vertical centre of a two-line filter block instead of staying level
 * with the first row.
 */
export const RegistryListControls = ({ filters, actions }: { filters: React.ReactNode; actions: React.ReactNode }) => {
  const { theme } = useDesignSystemTheme();

  return (
    <div
      css={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        flexShrink: 0,
        marginBottom: theme.spacing.md,
      }}
    >
      <div
        css={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}
      >
        {filters}
      </div>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexShrink: 0 }}>{actions}</div>
    </div>
  );
};
