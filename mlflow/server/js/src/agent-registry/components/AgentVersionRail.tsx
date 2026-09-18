import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import Utils from '../../common/utils/Utils';
import { AgentStatusTag, AgentVersionAliasesCell, AnchorKindTag, CompositionTag } from './AgentCellRenderers';
import type { AgentVersionEntity } from '../types';
import { getAnchorKind } from '../types';

/**
 * Left rail of the agent detail layout, the twin of `SkillVersionRail`: one combined cell
 * per row, row click selects. Interface-only versions and undeclared composition are
 * marked in the rail, because those are the two facts that change what the pane can answer.
 */
export const AgentVersionRail = ({
  versions,
  selectedVersion,
  onSelectVersion,
}: {
  /** Live versions, newest first under the agent's scheme. */
  versions: AgentVersionEntity[];
  selectedVersion?: string;
  onSelectVersion: (version: string) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  return (
    <Table data-testid="agent-version-rail" scrollable>
      <TableRow isHeader>
        <TableHeader componentId="mlflow.agent-registry.version-rail.table-header">
          {intl.formatMessage({ defaultMessage: 'Versions', description: 'Column title for the agent version rail' })}
        </TableHeader>
      </TableRow>
      {versions.map((version) => {
        const isSelected = version.version === selectedVersion;
        const anchorKind = getAnchorKind(version);
        return (
          <TableRow
            key={version.version}
            css={{
              backgroundColor: isSelected ? theme.colors.actionDefaultBackgroundPress : undefined,
              cursor: 'pointer',
            }}
            onClick={() => onSelectVersion(version.version)}
          >
            <TableCell>
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                  <Typography.Text bold>
                    <FormattedMessage
                      defaultMessage="Version {version}"
                      description="Version rail entry heading"
                      values={{ version: version.version }}
                    />
                  </Typography.Text>
                  <AgentStatusTag status={version.status} />
                  {version.aliases.length > 0 && (
                    <AgentVersionAliasesCell
                      organization={version.organization}
                      agentName={version.name}
                      version={version.version}
                      aliases={version.aliases}
                    />
                  )}
                </div>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                  {anchorKind === 'interface-only' && <AnchorKindTag kind={anchorKind} />}
                  <CompositionTag composition={version.composition} />
                  <Typography.Text size="sm" color="secondary">
                    {Utils.formatTimestamp(version.creation_timestamp, intl)}
                  </Typography.Text>
                </div>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
};
