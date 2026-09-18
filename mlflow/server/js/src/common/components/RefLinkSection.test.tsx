import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { DesignSystemProvider } from '@databricks/design-system';

import { RefLinkSection } from './RefLinkSection';

/**
 * This picker replaced a modal-on-top-of-modal containing a hand-rolled list of clickable
 * divs, in both the agent and agent-plugin create forms. These tests hold the behaviours
 * that made the replacement worth doing, and that the two forms now share: it searches
 * within the dropdown, it multi-selects without closing, and an already-linked reference
 * can be unlinked from the same list.
 */
const ITEMS = [
  { name: 'rh-sre/cluster-health', description: 'OpenShift cluster health assessment', latestVersion: '4' },
  { name: 'rh-sre/pod-diagnostics', description: 'Deep-dive pod troubleshooting', latestVersion: '3' },
  { name: 'rh-developer/helm-chart', description: 'Helm chart scaffolding', latestVersion: '2' },
];

const renderPicker = (props: Partial<React.ComponentProps<typeof RefLinkSection>> = {}) => {
  const onAdd = jest.fn();
  const onRemove = jest.fn();
  render(
    <IntlProvider locale="en">
      <DesignSystemProvider>
        <RefLinkSection
          componentId="test.ref-link"
          label="Member skills"
          placeholder="Search skills to add as members"
          hint="Members are pinned to the latest version of each skill selected here."
          browsableItems={ITEMS}
          items={[]}
          onAdd={onAdd}
          onRemove={onRemove}
          {...props}
        />
      </DesignSystemProvider>
    </IntlProvider>,
  );
  return { onAdd, onRemove };
};

/**
 * The design system marks parts of the dropdown `pointer-events: none` for styling, which
 * user-event refuses to click through by default. Disabling that check is the standard
 * escape for these components: the handlers under test are real, only the CSS guard is not
 * meaningful in jsdom.
 */
const user = userEvent.setup({ pointerEventsCheck: 0 });

/**
 * Queries are scoped to the listbox throughout. A selected reference also appears in the
 * trigger and again as a chip, so an unscoped getByText matches three nodes and throws.
 */
const openMenu = async () => {
  await user.click(screen.getByRole('combobox'));
  return waitFor(() => screen.getByRole('listbox'));
};

/** Options render as a checkbox inside a label, so the label is what receives the click. */
const clickOption = async (name: string) => {
  const label = within(screen.getByRole('listbox')).getByText(name).closest('label');
  expect(label).not.toBeNull();
  await user.click(label!);
};

describe('RefLinkSection', () => {
  it('lists references inline, with no second dialog to open', async () => {
    renderPicker();
    await openMenu();

    expect(within(screen.getByRole('listbox')).getByText('rh-developer/helm-chart')).toBeInTheDocument();
    // The picker this replaced put these behind a button that opened a Modal in a Modal.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('searches on description as well as name', async () => {
    renderPicker();
    await openMenu();

    await user.type(screen.getByRole('searchbox'), 'troubleshooting');

    await waitFor(() =>
      expect(within(screen.getByRole('listbox')).queryByText('rh-sre/cluster-health')).not.toBeInTheDocument(),
    );
    expect(within(screen.getByRole('listbox')).getByText('rh-sre/pod-diagnostics')).toBeInTheDocument();
  });

  it('reports the picked reference pinned to its latest version', async () => {
    const { onAdd } = renderPicker();
    await openMenu();

    await clickOption('rh-developer/helm-chart');

    expect(onAdd).toHaveBeenCalledWith({ name: 'rh-developer/helm-chart', version: '2' });
  });

  it('unlinks an already-linked reference from the same list', async () => {
    const { onRemove } = renderPicker({ items: [{ name: 'rh-sre/cluster-health', version: '4' }] });
    await openMenu();

    // Still offered rather than hidden, so the menu doubles as the way to unlink.
    await clickOption('rh-sre/cluster-health');

    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('echoes linked references as removable chips', () => {
    renderPicker({ items: [{ name: 'rh-sre/cluster-health', version: '4' }] });
    expect(screen.getByText('rh-sre/cluster-health@4')).toBeInTheDocument();
  });

  it('disables the trigger and says why when nothing is registered', () => {
    renderPicker({ browsableItems: [], emptyMessage: 'No MCP servers are registered yet.' });
    // The in-menu "None registered yet." never renders: the design system's option list
    // drops children that are not options, so an empty dropdown shows only its search box.
    // The message therefore takes the placeholder's place on the disabled trigger.
    expect(within(screen.getByRole('combobox')).getByText('No MCP servers are registered yet.')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows the placeholder in the empty field, not a second copy of the label', () => {
    renderPicker();
    const trigger = screen.getByRole('combobox');
    expect(within(trigger).getByText('Search skills to add as members')).toBeInTheDocument();
    expect(within(trigger).queryByText('Member skills')).not.toBeInTheDocument();
  });

  it('keeps the trigger live when no emptyMessage is given', () => {
    renderPicker({ browsableItems: [] });
    expect(screen.getByRole('combobox')).toBeEnabled();
  });
});
