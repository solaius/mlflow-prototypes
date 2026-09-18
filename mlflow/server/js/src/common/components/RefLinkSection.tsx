import {
  DialogCombobox,
  DialogComboboxContent,
  DialogComboboxHintRow,
  DialogComboboxOptionList,
  DialogComboboxOptionListCheckboxItem,
  DialogComboboxOptionListSearch,
  DialogComboboxTrigger,
  FormUI,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

/**
 * Shared reference picker for the asset registries.
 *
 * Lifted verbatim from `agent-registry/components/AgentCreateModal.tsx`, where Aditi
 * Saluja wrote it to answer Daniel Warner's modal-on-modal feedback. It is shared rather
 * than copied so the agent and agent-plugin forms cannot drift into two different
 * linking interactions, which is what happened when we each solved that feedback
 * independently.
 *
 * Behaviour is unchanged by the move. The multi-select dropdown keeps its own search and
 * checkbox rows, so several references can be linked without the menu closing and an
 * existing one can be unlinked from the same list, while the chips below stay the
 * scannable summary of what is currently linked.
 *
 * `emptyMessage` (added at the unified-registry merge, 2026-09-18) covers the case the
 * menu cannot: the option list drops children that are not options, so the in-menu
 * "None registered yet." never renders and an empty dropdown shows only its search box.
 * With `emptyMessage` set and nothing registered, the trigger is disabled and shows the
 * message in place of the placeholder. Without the prop the component behaves as she
 * wrote it.
 *
 * The trigger runs with `withInlineLabel={false}` (v12, 2026-09-18): the label is already
 * drawn above the field, so the field shows the placeholder while empty and the linked
 * names once something is picked. The label still names the control for screen readers.
 */

export interface LinkedRef {
  name: string;
  version: string;
}

export interface BrowsableItem {
  name: string;
  description: string;
  latestVersion: string;
}

/**
 * Searchable, multi-select combobox for linking registry references (skills, MCP servers,
 * plugins, models) to an agent. Replaces the earlier "Link" button → modal-on-modal flow:
 * selection happens inline in a typeahead-style dropdown (search + checkboxes), and picks
 * are echoed as removable chips below. Latest version is pinned automatically.
 */
export const RefLinkSection = ({
  componentId,
  label,
  placeholder,
  hint,
  browsableItems,
  items,
  onAdd,
  onRemove,
  emptyMessage,
}: {
  componentId: string;
  label: string;
  placeholder: string;
  hint: string;
  browsableItems: BrowsableItem[];
  items: LinkedRef[];
  onAdd: (ref: LinkedRef) => void;
  onRemove: (index: number) => void;
  /** Shown on the disabled trigger when nothing is registered at all. */
  emptyMessage?: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const nothingRegistered = browsableItems.length === 0 && emptyMessage !== undefined;
  const [search, setSearch] = useState('');

  const selectedNames = useMemo(() => new Set(items.map((i) => i.name)), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return browsableItems;
    return browsableItems.filter(
      (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }, [browsableItems, search]);

  const toggle = (item: BrowsableItem) => {
    const index = items.findIndex((i) => i.name === item.name);
    if (index >= 0) {
      onRemove(index);
    } else {
      onAdd({ name: item.name, version: item.latestVersion });
    }
  };

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <Typography.Text bold>{label}</Typography.Text>
      <DialogCombobox
        componentId={`${componentId}.combobox`}
        label={label}
        multiSelect
        value={items.map((i) => i.name)}
      >
        <DialogComboboxTrigger
          allowClear={false}
          withInlineLabel={false}
          placeholder={nothingRegistered ? emptyMessage : placeholder}
          disabled={nothingRegistered}
          css={{ width: '100%' }}
        />
        <DialogComboboxContent minWidth={360} matchTriggerWidth>
          <DialogComboboxOptionList>
            <DialogComboboxOptionListSearch controlledValue={search} setControlledValue={setSearch}>
              {filtered.length === 0 ? (
                <div css={{ padding: theme.spacing.sm }}>
                  <Typography.Text color="secondary">
                    {browsableItems.length === 0
                      ? intl.formatMessage({
                          defaultMessage: 'None registered yet.',
                          description: 'Reference picker > menu text when the registry holds nothing to link',
                        })
                      : intl.formatMessage({
                          defaultMessage: 'No matches found.',
                          description: 'Reference picker > menu text when the search matches nothing',
                        })}
                  </Typography.Text>
                </div>
              ) : (
                filtered.map((item) => (
                  <DialogComboboxOptionListCheckboxItem
                    key={item.name}
                    value={item.name}
                    checked={selectedNames.has(item.name)}
                    onChange={() => toggle(item)}
                  >
                    {item.name}
                    {item.description && <DialogComboboxHintRow>{item.description}</DialogComboboxHintRow>}
                  </DialogComboboxOptionListCheckboxItem>
                ))
              )}
            </DialogComboboxOptionListSearch>
          </DialogComboboxOptionList>
        </DialogComboboxContent>
      </DialogCombobox>
      {items.length > 0 && (
        <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {items.map((item, index) => (
            <Tag componentId={`${componentId}.tag`} key={item.name} closable onClose={() => onRemove(index)}>
              {item.name}@{item.version}
            </Tag>
          ))}
        </div>
      )}
      <FormUI.Hint>{hint}</FormUI.Hint>
    </div>
  );
};
