import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { SkillStatusTag, SkillVersionAliasesCell } from './SkillCellRenderers';
import type { SkillVersionEntity } from '../types';
import Utils from '../../common/utils/Utils';

export interface SkillVersionRailProps {
  /** Live versions only, newest first. Deleted versions are not returned by any read API. */
  versions: SkillVersionEntity[];
  /**
   * Highest version number ever allocated for this skill, including numbers now held by
   * deleted versions. Any number below this with no matching version is a gap.
   */
  highestVersionNumber: number;
  selectedVersion?: number;
  onSelectVersion: (version: number) => void;
}

/** A rail row is either a live version or the space a deleted one used to occupy. */
type RailRow = { kind: 'version'; version: SkillVersionEntity } | { kind: 'gap'; versionNumber: number };

/**
 * Left rail of the skill detail master-detail layout, mirroring the prompts feature's
 * `PromptVersionsTable`: a single-column design-system `Table`, one combined cell per
 * row (bold "Version N" plus alias chips on one line, secondary-colored timestamp
 * below), row click selects, selected row highlighted with
 * `theme.colors.actionDefaultBackgroundPress`.
 *
 * Each row also carries its lifecycle status tag, the way the MCP server registry's
 * `MCPServerVersionList` does: the rail is where versions are compared, so which one is
 * active has to be readable without selecting each in turn.
 *
 * The digest used to sit here too, on its own line under the version name, so identical
 * content could be spotted across rows. It was three lines of hash in a narrow rail for a
 * comparison that is rarely the question being asked, and it pushed the timestamp -- which
 * is -- down out of the eye's path. The digest, and the "same content as v1, v2" note that
 * came with it, are still on the version pane a click away.
 *
 * Deleted versions are NOT rendered as dimmed rows, because no read API returns them:
 * a UI that showed them would be showing something it could not have been given. What
 * it renders instead is the GAP they leave. The number was allocated and will never be
 * reused, so a rail jumping from v3 to v1 is real information, and labelling that gap
 * is the honest way to carry the fact that a version once existed there.
 */
export const SkillVersionRail = ({
  versions,
  highestVersionNumber,
  selectedVersion,
  onSelectVersion,
}: SkillVersionRailProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  /**
   * Live versions newest first, with a gap row wherever an allocated number is missing.
   * Built from the number range rather than from the version list so a gap at the top
   * (the newest version was deleted) shows up as readily as one in the middle.
   */
  const rows = useMemo<RailRow[]>(() => {
    const byNumber = new Map(versions.map((version) => [version.version, version]));
    const result: RailRow[] = [];
    for (let number = highestVersionNumber; number >= 1; number -= 1) {
      const version = byNumber.get(number);
      result.push(version ? { kind: 'version', version } : { kind: 'gap', versionNumber: number });
    }
    return result;
  }, [versions, highestVersionNumber]);

  return (
    <Table data-testid="skill-version-rail" scrollable>
      <TableRow isHeader>
        <TableHeader componentId="mlflow.skills-registry.version-rail.table-header">
          <FormattedMessage
            defaultMessage="Versions"
            description="Column title for the version rail on the skill detail page"
          />
        </TableHeader>
      </TableRow>

      {rows.map((row) => {
        if (row.kind === 'gap') {
          return (
            <TableRow key={`gap-${row.versionNumber}`} css={{ cursor: 'default' }}>
              <TableCell>
                <Tooltip
                  componentId="mlflow.skills-registry.version-rail.gap.tooltip"
                  content={intl.formatMessage({
                    defaultMessage:
                      'Deleted. The number is never reused, and the registry no longer returns this version.',
                    description: 'Tooltip explaining a deleted version gap in the skill version rail',
                  })}
                >
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <Typography.Text color="secondary">
                      <FormattedMessage
                        defaultMessage="Version {version}"
                        description="Version rail gap row heading"
                        values={{ version: row.versionNumber }}
                      />
                    </Typography.Text>
                    <Typography.Text size="sm" color="secondary">
                      <FormattedMessage
                        defaultMessage="Deleted, number not reused"
                        description="Version rail gap row explanation"
                      />
                    </Typography.Text>
                  </div>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        }

        const { version } = row;
        const isSelected = version.version === selectedVersion;

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
                  <SkillStatusTag status={version.status} />
                  {version.aliases.length > 0 && (
                    <SkillVersionAliasesCell
                      organization={version.organization}
                      skillName={version.name}
                      version={version.version}
                      aliases={version.aliases}
                    />
                  )}
                </div>
                <Typography.Text size="sm" color="secondary">
                  {Utils.formatTimestamp(version.creation_timestamp, intl)}
                </Typography.Text>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
};
