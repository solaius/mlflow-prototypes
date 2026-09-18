import { useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { useEditAliasesModal } from '../../common/hooks/useEditAliasesModal';
import type { AliasMap } from '../../common/types';
import { getAgentPluginAliasUri } from '../constants';
import { setPluginVersionAliases } from '../mocks/pluginsStore';
import type { AgentPluginAlias } from '../types';
import { LATEST_ALIAS } from '../utils';

const getAliasesModalTitle = (version: string) => (
  <FormattedMessage
    defaultMessage="Add/Edit alias for agent plugin version {version}"
    description="Agent plugins > alias editor > title of the update alias modal"
    values={{ version }}
  />
);

/**
 * Alias editor for one plugin version, wrapping MLflow's app-wide `useEditAliasesModal`,
 * the same modal the model, prompt, MCP and skill registries use. Reusing it keeps the
 * reserved-alias rule, the alias cap and the "this alias currently sits on version N and
 * will be moved" conflict warning identical everywhere. Plugin versions are strings
 * already, so no key conversion is needed.
 */
export const useEditPluginAliasesModal = ({
  organization,
  pluginName,
  aliases,
}: {
  organization: string;
  pluginName: string;
  /** Every alias on the plugin, across all of its versions. */
  aliases: AgentPluginAlias[];
}) => {
  const aliasMap = useMemo<AliasMap>(() => aliases.map(({ alias, version }) => ({ alias, version })), [aliases]);

  const { EditAliasesModal, showEditAliasesModal } = useEditAliasesModal({
    aliases: aliasMap,
    onSave: async (editedVersion: string, _existing: string[], draftAliases: string[]) => {
      setPluginVersionAliases(organization, pluginName, editedVersion, draftAliases);
    },
    getTitle: getAliasesModalTitle,
    description: (
      <FormattedMessage
        defaultMessage="Aliases are mutable, named pointers to a specific plugin version, referenced as {uri}. The alias {latest} is reserved and always resolves to the newest active version."
        description="Agent plugins > alias editor > explanation of plugin aliases"
        values={{ uri: getAgentPluginAliasUri(organization, pluginName, '<alias>'), latest: LATEST_ALIAS }}
      />
    ),
  });

  const openEditAliasesModal = useCallback((version: string) => showEditAliasesModal(version), [showEditAliasesModal]);

  return { EditPluginAliasesModal: EditAliasesModal, openEditAliasesModal };
};
