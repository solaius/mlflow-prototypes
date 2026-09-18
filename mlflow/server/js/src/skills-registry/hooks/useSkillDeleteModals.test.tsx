import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { DesignSystemProvider } from '@databricks/design-system';

import { useDeleteSkillVersionModal } from './useSkillDeleteModals';

/**
 * The confirmation described mechanics and stopped there, so the one fact worth having
 * before confirming was missing: deletion is the only operation that withdraws dependents.
 * Deprecating a version leaves every agent and plugin pinning it working; deleting it does
 * not. These tests hold that the blast radius reaches the modal.
 */
const Harness = ({ version }: { version: number }) => {
  const { DeleteSkillVersionModal, openModal } = useDeleteSkillVersionModal({
    organization: 'rh-developer',
    skillName: 'incident-triage',
    version,
  });
  return (
    <>
      <button type="button" onClick={openModal}>
        open
      </button>
      {DeleteSkillVersionModal}
    </>
  );
};

// The design system marks parts of the modal `pointer-events: none` for styling, which
// user-event refuses to click through by default.
const user = userEvent.setup({ pointerEventsCheck: 0 });

const renderModal = async (version: number) => {
  render(
    <IntlProvider locale="en">
      <DesignSystemProvider>
        <Harness version={version} />
      </DesignSystemProvider>
    </IntlProvider>,
  );
  await user.click(screen.getByText('open'));
};

describe('useDeleteSkillVersionModal', () => {
  it('names what deleting this version would withdraw', async () => {
    // @rh-developer/incident-triage v1 is pinned by seeded agent versions.
    await renderModal(1);
    expect(screen.getByText(/Deleting this withdraws/)).toBeInTheDocument();
  });

  it('still says what deletion does to the version itself', async () => {
    await renderModal(1);
    expect(screen.getByText(/Its number is retained and never reused/)).toBeInTheDocument();
  });

  it('says nothing about dependents when there are none', async () => {
    // A version number no agent or plugin pins.
    await renderModal(999);
    expect(screen.queryByText(/Deleting this withdraws/)).not.toBeInTheDocument();
  });
});
