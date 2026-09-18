import { useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { getSkillAliasUri } from '../constants';
import { setSkillVersionAliases } from '../mocks/skillsStore';
import { LATEST_ALIAS } from '../utils';
import type { SkillAlias } from '../types';
import { useEditAliasesModal } from '../../common/hooks/useEditAliasesModal';
import type { AliasMap } from '../../common/types';

const getAliasesModalTitle = (version: string) => (
  <FormattedMessage
    defaultMessage="Add/Edit alias for skill version {version}"
    description="Skills registry > alias editor > title of the update alias modal"
    values={{ version }}
  />
);

/**
 * Alias editor for one skill version, wrapping MLflow's app-wide
 * `common/hooks/useEditAliasesModal` — the same modal the model registry uses. Reusing
 * it rather than writing a registry-specific one is what keeps the reserved-alias
 * rules, the ten-alias cap and, most importantly, the "this alias currently sits on
 * version N and will be moved" conflict warning identical to the rest of the app.
 *
 * Aliases are pointers owned by the skill, so the hook needs every alias across every
 * version to detect those conflicts — not just the ones on the version being edited.
 * There is no backend here, so `onSave` writes straight to the session store.
 */
export const useEditSkillAliasesModal = ({
  organization,
  skillName,
  aliases,
}: {
  organization: string;
  skillName: string;
  /** Every alias on the skill, across all of its versions. */
  aliases: SkillAlias[];
}) => {
  // The shared hook keys versions by string; skill versions are integers.
  const aliasMap = useMemo<AliasMap>(
    () => aliases.map(({ alias, version }) => ({ alias, version: String(version) })),
    [aliases],
  );

  const { EditAliasesModal, showEditAliasesModal } = useEditAliasesModal({
    aliases: aliasMap,
    onSave: async (editedVersion: string, _existingAliases: string[], draftAliases: string[]) => {
      setSkillVersionAliases(organization, skillName, Number(editedVersion), draftAliases);
    },
    getTitle: getAliasesModalTitle,
    description: (
      <FormattedMessage
        defaultMessage="Aliases are mutable, named pointers to a specific skill version, referenced as {uri}. The alias {latest} is reserved and always resolves to the newest active version."
        description="Skills registry > alias editor > explanation of skill aliases"
        values={{ uri: getSkillAliasUri(organization, skillName, '<alias>'), latest: LATEST_ALIAS }}
      />
    ),
  });

  const openEditAliasesModal = useCallback(
    (version: number) => showEditAliasesModal(String(version)),
    [showEditAliasesModal],
  );

  return { EditSkillAliasesModal: EditAliasesModal, openEditAliasesModal };
};
