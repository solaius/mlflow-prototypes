import { useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { useEditAliasesModal } from '../../common/hooks/useEditAliasesModal';
import type { AliasMap } from '../../common/types';
import { getAgentAliasUri } from '../constants';
import { setAgentVersionAliases } from '../mocks/agentsStore';
import type { AgentAlias } from '../types';
import { LATEST_ALIAS } from '../utils';

const getAliasesModalTitle = (version: string) => (
  <FormattedMessage
    defaultMessage="Add/Edit alias for agent version {version}"
    description="Agent registry > alias editor > title of the update alias modal"
    values={{ version }}
  />
);

/**
 * Alias editor for one agent version, wrapping MLflow's app-wide `useEditAliasesModal`, the
 * same modal every other registry uses, so the reserved-alias rule and the alias-moves
 * warning are identical across the app. RFC-0011 bindings may target an alias, which is
 * one more reason the pointer semantics must match everywhere.
 */
export const useEditAgentAliasesModal = ({
  organization,
  agentName,
  aliases,
}: {
  organization: string;
  agentName: string;
  aliases: AgentAlias[];
}) => {
  const aliasMap = useMemo<AliasMap>(() => aliases.map(({ alias, version }) => ({ alias, version })), [aliases]);

  const { EditAliasesModal, showEditAliasesModal } = useEditAliasesModal({
    aliases: aliasMap,
    onSave: async (editedVersion: string, _existing: string[], draftAliases: string[]) => {
      setAgentVersionAliases(organization, agentName, editedVersion, draftAliases);
    },
    getTitle: getAliasesModalTitle,
    description: (
      <FormattedMessage
        defaultMessage="Aliases are mutable, named pointers to a specific agent version, referenced as {uri}. An access binding that targets an alias follows it as it moves. The alias {latest} is reserved."
        description="Agent registry > alias editor > explanation of agent aliases"
        values={{ uri: getAgentAliasUri(organization, agentName, '<alias>'), latest: LATEST_ALIAS }}
      />
    ),
  });

  const openEditAliasesModal = useCallback((version: string) => showEditAliasesModal(version), [showEditAliasesModal]);

  return { EditAgentAliasesModal: EditAliasesModal, openEditAliasesModal };
};
