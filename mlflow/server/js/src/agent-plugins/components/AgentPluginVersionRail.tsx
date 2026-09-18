import { Table, TableCell, TableHeader, TableRow, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useIntl } from 'react-intl';

import Utils from '../../common/utils/Utils';
import {
  PluginKindTag,
  PluginStatusTag,
  PluginVersionAliasesCell,
  PluginWithdrawnTag,
} from './AgentPluginCellRenderers';
import { isPluginVersionKeyWithdrawn } from '../hooks/useAgentPlugins';
import type { AgentPluginVersionEntity } from '../types';
import { getPluginVersionKind } from '../utils';

export interface AgentPluginVersionRailProps {
  /** Live versions, newest first by semantic precedence. Deleted versions are never returned. */
  versions: AgentPluginVersionEntity[];
  withdrawnKeys: Set<string>;
  selectedVersion?: string;
  onSelectVersion: (version: string) => void;
}

/**
 * Left rail of the plugin detail master-detail layout, the twin of `SkillVersionRail`: a
 * single-column design-system `Table`, one combined cell per row (bold version plus its
 * status, kind and alias chips, secondary timestamp below), row click selects.
 *
 * Two things differ from the skill rail, both because plugin versions are SemVer strings
 * rather than server-assigned integers. There are no gap rows: a deleted version leaves no
 * hole in a sequence that was never contiguous. And each row carries its kind, because
 * RFC-0008 resolves kind per version -- a plugin can be packaged in 0.1.0 and assembled in
 * 0.2.0, and the rail is where that is visible.
 *
 * A withdrawn version stays in the rail, marked. Its stored status is unchanged and the
 * owner needs to see it to publish a replacement; only deleted versions disappear.
 */
export const AgentPluginVersionRail = ({
  versions,
  withdrawnKeys,
  selectedVersion,
  onSelectVersion,
}: AgentPluginVersionRailProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  return (
    <Table data-testid="plugin-version-rail" scrollable>
      <TableRow isHeader>
        <TableHeader componentId="mlflow.agent-plugins.version-rail.table-header">
          {intl.formatMessage({ defaultMessage: 'Versions', description: 'Column title for the plugin version rail' })}
        </TableHeader>
      </TableRow>
      {versions.map((version) => {
        const isSelected = version.version === selectedVersion;
        const withdrawn = isPluginVersionKeyWithdrawn(withdrawnKeys, version);
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
                  <Typography.Text bold>{version.version}</Typography.Text>
                  <PluginStatusTag status={version.status} />
                  {withdrawn && <PluginWithdrawnTag />}
                  {version.aliases.length > 0 && (
                    <PluginVersionAliasesCell
                      organization={version.organization}
                      name={version.name}
                      version={version.version}
                      aliases={version.aliases}
                    />
                  )}
                </div>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                  <PluginKindTag kind={getPluginVersionKind(version.source)} />
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
