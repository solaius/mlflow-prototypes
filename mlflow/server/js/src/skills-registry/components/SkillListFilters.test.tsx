import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { DesignSystemProvider } from '@databricks/design-system';

import { SkillListFilters } from './SkillListFilters';
import type { SkillListFilters as SkillListFilterValues } from '../hooks/useSkills';

const renderFilters = (onChange = jest.fn()) =>
  render(
    <IntlProvider locale="en">
      <DesignSystemProvider>
        <SkillListFilters filters={{}} onChange={onChange} />
      </DesignSystemProvider>
    </IntlProvider>,
  );

describe('SkillListFilters', () => {
  it('shows its unfiltered state rather than rendering blank controls', () => {
    renderFilters();

    // Active checkbox is unchecked at rest (all statuses visible).
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /active/i })).not.toBeChecked();
    // Organization combobox names its dimension.
    expect(screen.getByPlaceholderText('All organizations')).toBeInTheDocument();
    // Source stays, per RFC-0008's UI section (2026-09-18-pdouble-round2-merge-rulings#5).
    expect(screen.getByText('All sources')).toBeInTheDocument();
  });

  it('filters to active skills when the Active checkbox is checked', async () => {
    const onChange = jest.fn();
    renderFilters(onChange);

    await userEvent.click(screen.getByRole('checkbox', { name: /active/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('clears the status filter when the Active checkbox is unchecked', async () => {
    const onChange = jest.fn();
    render(
      <IntlProvider locale="en">
        <DesignSystemProvider>
          <SkillListFilters filters={{ status: 'active' as any }} onChange={onChange} />
        </DesignSystemProvider>
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /active/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: undefined }));
  });

  it('offers no tag control, because tags are filtered through the search box', () => {
    renderFilters();
    expect(screen.queryByPlaceholderText('All tags')).not.toBeInTheDocument();
  });

  it('narrows the organization list as you type, which is the point of the combobox', async () => {
    renderFilters();
    const input = screen.getByPlaceholderText('All organizations');

    await userEvent.click(input);
    await waitFor(() => expect(screen.getByText('@rh-sre')).toBeInTheDocument());
    expect(screen.getByText('@ocp-admin')).toBeInTheDocument();

    await userEvent.type(input, 'ocp');
    await waitFor(() => expect(screen.queryByText('@rh-sre')).not.toBeInTheDocument());
    expect(screen.getByText('@ocp-admin')).toBeInTheDocument();
  });

  it('keeps the `@` in the input after an organization is picked, not just in the menu', async () => {
    const Harness = () => {
      const [filters, setFilters] = useState<SkillListFilterValues>({});
      return <SkillListFilters filters={filters} onChange={setFilters} />;
    };
    render(
      <IntlProvider locale="en">
        <DesignSystemProvider>
          <Harness />
        </DesignSystemProvider>
      </IntlProvider>,
    );

    const input = screen.getByPlaceholderText<HTMLInputElement>('All organizations');
    await userEvent.click(input);
    await waitFor(() => expect(screen.getByText('@ocp-admin')).toBeInTheDocument());
    await userEvent.click(screen.getByText('@ocp-admin'));

    await waitFor(() => expect(input.value).toBe('@ocp-admin'));
  });

  it('keeps the free-text input separate from the structured filters', () => {
    renderFilters();
    expect(screen.getByPlaceholderText('Search skills')).toBeInTheDocument();
  });
});
