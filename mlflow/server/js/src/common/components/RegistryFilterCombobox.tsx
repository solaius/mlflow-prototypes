import {
  TypeaheadComboboxInput,
  TypeaheadComboboxMenu,
  TypeaheadComboboxMenuItem,
  TypeaheadComboboxRoot,
  useComboboxState,
} from '@databricks/design-system';
import { useEffect, useMemo, useState } from 'react';

export interface RegistryFilterComboboxProps {
  componentId: string;
  id: string;
  /** Every value this filter can take. Sorted by the caller. */
  options: string[];
  /** Currently applied value, or undefined when the filter is off. */
  value?: string;
  onChange: (value: string | undefined) => void;
  /** Shown when nothing is selected. Names the dimension and its unfiltered state. */
  placeholder: string;
  ariaLabel: string;
  width?: number;
  /**
   * How an option is written for a human. Defaults to the raw value.
   *
   * Returns a string rather than a node because it has to serve three places at once: the
   * menu row, the input after a selection, and the text the query is matched against. A
   * node could only do the first, which is how a control ends up offering `@acme-platform`
   * and then displaying `acme-platform` once you pick it.
   *
   * The stored value is unaffected — `onChange` still emits the raw option, because that is
   * what the query layer matches on. This is presentation only.
   */
  formatOption?: (option: string) => string;
}

/**
 * A searchable single-select filter, for filters whose option list has no ceiling.
 *
 * Organizations, tags and registered agents all grow with the registry, and a plain
 * select becomes unusable well before they stop growing. This is the same
 * `useComboboxState` + `TypeaheadCombobox*` pattern MLflow already uses in five places,
 * so the typing, keyboard handling and menu behaviour are the app's rather than ours.
 *
 * Deliberately NOT applied to every filter. Status and source type are closed enums of
 * three and four values fixed by the RFC, and putting a text input in front of a list
 * you can read at a glance costs a keystroke and buys nothing.
 *
 * Clearing is the input's own clear affordance rather than an "All X" row in the menu.
 * That keeps the unfiltered state out of the option list, where it would otherwise be
 * indistinguishable from a real organization named "All organizations", and it sidesteps
 * the empty-value trap that made these controls render blank when they were selects.
 */
export const RegistryFilterCombobox = ({
  componentId,
  id,
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  width = 200,
  formatOption,
}: RegistryFilterComboboxProps) => {
  const [items, setItems] = useState<string[]>(options);
  const [inputValue, setInputValue] = useState('');

  const display = formatOption ?? ((option: string) => option);

  // The option list is derived from the registry contents, so it changes as skills are
  // registered or filtered. Re-seed the menu whenever it does, but only when no query is
  // active, so typing is never interrupted by a background refresh.
  useEffect(() => {
    if (!inputValue.trim()) {
      setItems(options);
    }
  }, [options, inputValue]);

  const comboboxState = useComboboxState<string>({
    componentId,
    allItems: options,
    items,
    setItems,
    multiSelect: false,
    // Both go through `display`, and they have to move together: the input is filled from
    // `itemToString` after a selection, and the next keystroke is matched against whatever
    // is in the input. Matching raw items while displaying formatted ones would empty the
    // menu the moment someone edited a selection, because `acme-platform` does not contain
    // `@acme-platform`. Matching formatted-to-formatted also means a query can include the
    // marker or omit it, and both find the option.
    itemToString: (item) => (item ? display(item) : ''),
    matcher: (item, query) => display(item).toLowerCase().includes(query.toLowerCase()),
    formValue: value ?? '',
    formOnChange: (next: string | null) => onChange(next || undefined),
    setInputValue,
    preventUnsetOnBlur: true,
  });

  const menuItems = useMemo(() => items, [items]);

  return (
    <TypeaheadComboboxRoot id={id} comboboxState={comboboxState} css={{ width }}>
      <TypeaheadComboboxInput
        aria-label={ariaLabel}
        placeholder={placeholder}
        comboboxState={comboboxState}
        formOnChange={(next: string | null) => onChange(next || undefined)}
        allowClear
        showComboboxToggleButton
        onClear={() => {
          setInputValue('');
          onChange(undefined);
        }}
      />
      <TypeaheadComboboxMenu comboboxState={comboboxState}>
        {menuItems.map((option, index) => (
          <TypeaheadComboboxMenuItem key={option} item={option} index={index} comboboxState={comboboxState}>
            {display(option)}
          </TypeaheadComboboxMenuItem>
        ))}
      </TypeaheadComboboxMenu>
    </TypeaheadComboboxRoot>
  );
};
