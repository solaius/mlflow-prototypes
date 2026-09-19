import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { DesignSystemProvider } from '@databricks/design-system';

import { SkillPullModal } from './SkillPullModal';
import type { SkillEntity, SkillVersionEntity } from '../types';
import { SkillStatus } from '../types';

/**
 * The two entry points into this modal want opposite references, and the difference is
 * the whole point of the `pinVersion` prop.
 *
 * From the skill, "how do I use this" asks the backend for latest. From a version, the
 * same answer would be a bug: a command copied into a CI job has to keep fetching the
 * version the user was looking at.
 */
const SKILL = {
  organization: 'rh-basic',
  name: 'cve-explainer',
  latest_version: 3,
  aliases: [
    { alias: 'production', version: 3 },
    { alias: 'champion', version: 3 },
  ],
} as unknown as SkillEntity;

const VERSION = {
  organization: 'rh-basic',
  name: 'cve-explainer',
  version: 3,
  status: SkillStatus.ACTIVE,
  aliases: ['production', 'champion'],
} as unknown as SkillVersionEntity;

const renderModal = (pinVersion?: boolean) =>
  render(
    <IntlProvider locale="en">
      <DesignSystemProvider>
        <SkillPullModal visible skill={SKILL} skillVersion={VERSION} pinVersion={pinVersion} onClose={jest.fn()} />
      </DesignSystemProvider>
    </IntlProvider>,
  );

describe('SkillPullModal', () => {
  it('asks the backend for latest when asked about the skill, ignoring production', () => {
    renderModal();
    expect(screen.getByText(/skills:\/@rh-basic\/cve-explainer(?![@/])/)).toBeInTheDocument();
    expect(screen.queryByText(/@production/)).not.toBeInTheDocument();
    expect(screen.queryByText(/@champion/)).not.toBeInTheDocument();
  });

  it('pins the version number when asked about a specific version', () => {
    renderModal(true);
    // The regression: this used to emit `@champion` here too, so a command copied from
    // "Use" on version 3 stopped fetching version 3 as soon as the alias moved.
    expect(screen.queryByText(/@champion/)).not.toBeInTheDocument();
    expect(screen.getByText(/skills:\/@rh-basic\/cve-explainer\/3/)).toBeInTheDocument();
  });

  it('labels which of the two it handed over, so the choice is visible', () => {
    renderModal(true);
    expect(screen.getByText(/Pinned version: v3/)).toBeInTheDocument();
  });

  it('says it resolves to latest, not through an alias', () => {
    renderModal();
    expect(screen.getByText(/Latest version: v3/)).toBeInTheDocument();
    expect(screen.queryByText(/Resolves through alias/)).not.toBeInTheDocument();
  });
});
