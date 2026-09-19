import {
  Button,
  CopyIcon,
  DialogCombobox,
  DialogComboboxContent,
  DialogComboboxOptionList,
  DialogComboboxOptionListSelectItem,
  DialogComboboxTrigger,
  PencilIcon,
  PlayIcon,
  Tooltip,
  Typography,
  TrashIcon,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  SkillDigestCell,
  SkillSourceTypeTag,
  SkillStatusTag,
  SkillTagsCell,
  SkillVersionAliasesCell,
} from './SkillCellRenderers';
import { SkillFilesTab } from './SkillFilesTab';
import { SkillPullModal } from './SkillPullModal';
import { SkillSourceDisclaimer, SkillSourceLinkOut } from './SkillSourceLinkOut';
import { getGitBrowseUrl, getSkillAliasUri, getSkillVersionUri } from '../constants';
import { useEditSkillAliasesModal } from '../hooks/useEditSkillAliasesModal';
import { useEditSkillVersionTagsModal } from '../hooks/useEditSkillVersionTagsModal';
import { useDeleteSkillVersionModal } from '../hooks/useSkillDeleteModals';
import { getSkillVersionDeleteBlocker, setSkillVersionStatus } from '../mocks/skillsStore';
import { SkillsRegistryRoutes } from '../routes';
import type { SkillEntity, SkillVersionEntity } from '../types';
import { SkillSourceType, SkillStatus } from '../types';
import { OBSERVABLE_STATUSES, STATUS_TRANSITIONS, formatStatusLabel, groupVersionsByDigest } from '../utils';
import { CopyButton } from '../../shared/building_blocks/CopyButton';
import { useNavigate } from '../../common/utils/RoutingUtils';
import Utils from '../../common/utils/Utils';

const METADATA_LABEL_WIDTH = 160;

/**
 * The tabs below the version metadata.
 *
 * No OVERVIEW member: the overview IS the metadata above the tabs, always visible. That is
 * what "move the tabs under the overview information" means, and it is the MCP registry's
 * shape -- `MCPServerVersionDetail` renders its metadata grid and then its Connect/Tools
 * tabs beneath it.
 *
 * "Used by agents" and "Packaged in agent plugins" are absent because they cannot be built
 * on this branch: they read the agent registry and agent plugins, which exist only on the
 * composed branch, where they are added rather than stubbed here.
 */
export interface SkillVersionPaneProps {
  skill: SkillEntity;
  skillVersion: SkillVersionEntity;
  /** Every live version of this skill, used to find versions with identical content. */
  siblingVersions: SkillVersionEntity[];
  /** False when this is the skill's only live version: the delete button is disabled rather than hidden. */
  canDelete: boolean;
  /** Highest version number ever issued, which the file resolver needs to age a listing. */
  totalVersions: number;
}

/**
 * Right pane of the skill detail master-detail layout, mirroring the prompts feature's
 * `PromptContentPreview`: "Viewing version N" heading plus top-right actions and a
 * label/value metadata grid. The SKILL.md preview that used to close this pane now lives
 * in the Files tab, beside the reference files and scripts it shares a directory with.
 *
 * Status and aliases are editable in place through the same affordance the MCP server
 * registry's version detail uses: a tag that swaps for a `DialogCombobox` on pencil
 * click, with illegal transitions disabled rather than hidden so the whole lifecycle
 * stays legible.
 *
 * The metadata grid shows ONE source. A version points at git, an OCI image, a ZIP
 * archive or MLflow-stored content, never a combination, so there is no second location
 * row: for MLflow-stored content the artifact path is what the source row prints.
 */
export const SkillVersionPane = ({
  skill,
  skillVersion,
  siblingVersions,
  canDelete,
  totalVersions,
}: SkillVersionPaneProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const navigate = useNavigate();
  const [editingStatus, setEditingStatus] = useState(false);
  const [pullModalOpen, setPullModalOpen] = useState(false);

  const isDeleted = skillVersion.status === SkillStatus.DELETED;
  const isMlflowStored = skillVersion.source.source_type === SkillSourceType.MLFLOW;

  const matchingVersions = useMemo(() => {
    const groups = groupVersionsByDigest(siblingVersions);
    const group = groups.get(skillVersion.version);
    if (!group) {
      return undefined;
    }
    return siblingVersions
      .filter((entry) => entry.version !== skillVersion.version && groups.get(entry.version) === group)
      .map((entry) => entry.version)
      .sort((a, b) => a - b);
  }, [siblingVersions, skillVersion.version]);

  const { EditSkillAliasesModal, openEditAliasesModal } = useEditSkillAliasesModal({
    organization: skill.organization,
    skillName: skill.name,
    aliases: skill.aliases,
  });

  const { EditSkillVersionTagsModal, openEditSkillVersionTagsModal } = useEditSkillVersionTagsModal({
    organization: skill.organization,
    skillName: skill.name,
  });

  const { DeleteSkillVersionModal, openModal: openDeleteVersionModal } = useDeleteSkillVersionModal({
    organization: skill.organization,
    skillName: skill.name,
    version: skillVersion.version,
    // The rail's own selection logic always defaults to the newest version when no
    // :version is pinned, so navigating back to the plain skill route is sufficient to
    // land on "the newest remaining version" after a delete.
    onSuccess: () =>
      navigate(SkillsRegistryRoutes.getSkillPageRoute(skill.organization, skill.name), { replace: true }),
  });

  /**
   * The provider page for this exact version, when one can be derived.
   *
   * Git content is linked rather than rendered, per the 2026-09-01 review, so this is the
   * affordance that replaces the preview for git sources.
   */
  const gitBrowseUrl =
    skillVersion.source.source_type === SkillSourceType.GIT
      ? getGitBrowseUrl({
          source: skillVersion.source.source,
          ref: skillVersion.source.ref,
          subpath: skillVersion.source.subpath,
        })
      : undefined;

  /**
   * The browse URL only when it says something the source link above it does not.
   *
   * `getGitBrowseUrl` has nothing to add a ref or path to when a version carries neither,
   * so it returns the repository URL itself -- character-for-character the source. Two
   * rows then printed the same link, which read as a rendering bug rather than as "there
   * is one place to go". A version registered from a pasted browse URL without applying
   * the clone-URL correction lands in exactly that state.
   */
  const distinctBrowseUrl = gitBrowseUrl !== skillVersion.source.source ? gitBrowseUrl : undefined;

  /**
   * What the delete button's tooltip says, per blocking rule.
   *
   * The `is-active` case is the one that matters: RFC-0008 makes unpublish-or-deprecate
   * a PREREQUISITE of deleting, not an alternative to it, so the tooltip names the step
   * rather than reporting a refusal. This is also the review's "show some description
   * about the behaviour" ask, answered at the point the user meets the restriction.
   */
  const deleteBlocker = getSkillVersionDeleteBlocker(skill.organization, skill.name, skillVersion.version);
  const deleteTooltip = !deleteBlocker
    ? intl.formatMessage({
        defaultMessage:
          'Removes this version from resolution, discovery and pull. Its number is never reused.',
        description: 'Tooltip describing what deleting a skill version does',
      })
    : deleteBlocker === 'is-active'
      ? intl.formatMessage({
          defaultMessage:
            'Unpublish or deprecate this version first. Deprecating keeps it resolving for anything that pins it.',
          description: 'Tooltip explaining that an active version must be retired before deletion',
        })
      : deleteBlocker === 'already-deleted'
        ? intl.formatMessage({
            defaultMessage: 'This version has already been deleted.',
            description: 'Tooltip explaining the delete button is disabled on a deleted version',
          })
        : intl.formatMessage({
            defaultMessage: "A skill's only remaining live version can't be deleted.",
            description: 'Tooltip explaining why the delete-version button is disabled',
          });

  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        padding: theme.spacing.md,
        overflow: 'auto',
        gap: theme.spacing.md,
      }}
    >
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm }}>
        <Typography.Title withoutMargins level={3}>
          <FormattedMessage
            defaultMessage="Viewing version {version}"
            description="Title of the skill detail pane for the currently selected version"
            values={{ version: skillVersion.version }}
          />
        </Typography.Title>

        {/*
          Delete before Use, matching the prompt details pane's action order
          (`PromptContentPreview`: Delete version, Optimize, Use).
        */}
        <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <Tooltip componentId="mlflow.skills-registry.version-pane.delete-version.tooltip" content={deleteTooltip}>
            <Button
              componentId="mlflow.skills-registry.version-pane.delete-version"
              icon={<TrashIcon />}
              type="primary"
              danger
              disabled={!canDelete}
              onClick={openDeleteVersionModal}
            >
              <FormattedMessage defaultMessage="Delete version" description="Label for the delete version button" />
            </Button>
          </Tooltip>
          <Button
            componentId="mlflow.skills-registry.version-pane.pull"
            icon={<PlayIcon />}
            onClick={() => setPullModalOpen(true)}
          >
            <FormattedMessage defaultMessage="Use" description="Label for the pull button on the skill version pane" />
          </Button>
        </div>
      </div>

      <div
        css={{
          display: 'grid',
          gridTemplateColumns: `${METADATA_LABEL_WIDTH}px 1fr`,
          gridAutoRows: 'minmax(24px, auto)',
          alignItems: 'flex-start',
          rowGap: theme.spacing.sm,
          columnGap: theme.spacing.md,
        }}
      >
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Registered at:" description="Skill version pane metadata label" />
        </Typography.Text>
        <Typography.Text>{Utils.formatTimestamp(skillVersion.creation_timestamp)}</Typography.Text>

        {/*
          No Description row: the description is skill-level, not version-level, so it reads
          the same for every version in the rail. It lives under the page title now, where a
          field that never changes with the selection belongs, and it is edited from the
          pencil there.
        */}

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Status:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          {editingStatus ? (
            <DialogCombobox
              componentId="mlflow.skills-registry.version-pane.status.combobox"
              label={intl.formatMessage({
                defaultMessage: 'Status',
                description: 'Label for the skill version status selector',
              })}
              value={[skillVersion.status]}
              open
            >
              <DialogComboboxTrigger
                aria-label={intl.formatMessage({
                  defaultMessage: 'Status',
                  description: 'Label for the skill version status selector',
                })}
                withInlineLabel={false}
                renderDisplayedValue={(status) => formatStatusLabel(status as SkillStatus)}
                allowClear={false}
                width={160}
              />
              <DialogComboboxContent
                matchTriggerWidth
                onEscapeKeyDown={() => setEditingStatus(false)}
                onPointerDownOutside={() => setEditingStatus(false)}
              >
                <DialogComboboxOptionList>
                  {OBSERVABLE_STATUSES.map((status) => (
                    <DialogComboboxOptionListSelectItem
                      key={status}
                      value={status}
                      checked={status === skillVersion.status}
                      disabled={
                        status !== skillVersion.status && !STATUS_TRANSITIONS[skillVersion.status].includes(status)
                      }
                      onChange={(nextStatus) => {
                        setSkillVersionStatus(
                          skill.organization,
                          skill.name,
                          skillVersion.version,
                          nextStatus as SkillStatus,
                        );
                        setEditingStatus(false);
                      }}
                    >
                      {formatStatusLabel(status)}
                    </DialogComboboxOptionListSelectItem>
                  ))}
                </DialogComboboxOptionList>
              </DialogComboboxContent>
            </DialogCombobox>
          ) : (
            <>
              <SkillStatusTag status={skillVersion.status} />
              {!isDeleted && (
                <Button
                  componentId="mlflow.skills-registry.version-pane.edit-status"
                  size="small"
                  icon={<PencilIcon />}
                  aria-label={intl.formatMessage({
                    defaultMessage: 'Edit version status',
                    description: 'Aria label for the edit skill version status button',
                  })}
                  onClick={() => setEditingStatus(true)}
                />
              )}
            </>
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Created by:" description="Skill version pane metadata label" />
        </Typography.Text>
        <Typography.Text>{skillVersion.created_by}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Aliases:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div>
          <SkillVersionAliasesCell
            organization={skill.organization}
            skillName={skill.name}
            version={skillVersion.version}
            aliases={skillVersion.aliases}
            onEdit={isDeleted ? undefined : () => openEditAliasesModal(skillVersion.version)}
          />
        </div>

        {/*
          Version-level tags, distinct from the skill-level tags in the page header.
          RFC-0008 carries both, with separate endpoints for each, and the distinction
          carries meaning: a skill-level tag describes the asset, a version-level tag
          describes one registration of it. The 2026-09-01 review surfaced the tag gap;
          reading the spec surfaced that there were two levels of it, and the pane
          previously showed neither.
        */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Metadata:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
          {skillVersion.tags.length ? (
            <SkillTagsCell tags={skillVersion.tags} />
          ) : (
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="None"
                description="Skill version pane > empty version tags placeholder"
              />
            </Typography.Text>
          )}
          {/* Withdrawn versions are terminal, so their metadata stops being editable too. */}
          {!isDeleted && (
            <Button
              componentId="mlflow.skills-registry.edit-version-tags"
              size="small"
              icon={<PencilIcon />}
              onClick={() => openEditSkillVersionTagsModal(skillVersion)}
              aria-label={intl.formatMessage({
                defaultMessage: 'Edit version tags',
                description: 'Aria label for the edit version tags button in the skills registry',
              })}
            />
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Source:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, minWidth: 0 }}>
          <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
            <SkillSourceTypeTag sourceType={skillVersion.source.source_type} />
            {isMlflowStored ? (
              // Server-chosen artifact path: not a link, and not a second location field
              // beside a repository URL. For MLflow-stored content this IS the source.
              <Typography.Text code css={{ wordBreak: 'break-all' }}>
                {skillVersion.source.source}
              </Typography.Text>
            ) : (
              <Typography.Link
                componentId="mlflow.skills-registry.version-pane.source-link"
                href={skillVersion.source.source}
                openInNewTab
              >
                {skillVersion.source.source}
              </Typography.Link>
            )}
          </div>
          {skillVersion.source.subpath && (
            <Typography.Text size="sm" color="secondary">
              <FormattedMessage
                defaultMessage="Path: {path}"
                description="Skill version pane source path"
                values={{ path: skillVersion.source.subpath }}
              />
            </Typography.Text>
          )}
          {skillVersion.source.ref && (
            <Typography.Text size="sm" color="secondary">
              <FormattedMessage
                defaultMessage="Ref: {ref}"
                description="Skill version pane source git ref"
                values={{ ref: skillVersion.source.ref.slice(0, 12) }}
              />
            </Typography.Text>
          )}
          {/*
            For a git source the registry links OUT to the provider rather than
            rendering the content, per the 2026-09-01 review. The plain source link
            above lands on the repository root; this one lands on this version's exact
            ref and path, which is what a reader following "show me this version" means.

            When the version has no ref there is no more precise place to go, so the
            second link would be the first one again. The disclaimer still applies -- the
            destination is somebody else's site either way -- so that is all that renders.
          */}
          {gitBrowseUrl &&
            (distinctBrowseUrl ? (
              <SkillSourceLinkOut
                componentId="mlflow.skills-registry.version-pane.browse-source"
                href={distinctBrowseUrl}
              />
            ) : (
              <SkillSourceDisclaimer />
            ))}
        </div>

        {/*
          Digest sits directly below the source it was computed from and above the URIs
          that resolve to it, so the three "where did this content come from and how do I
          ask for it again" rows read as one block.
        */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Content digest:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
          <SkillDigestCell digest={skillVersion.digest} matchingVersions={matchingVersions} />
          {/*
            Copies the FULL digest, not the 12 characters on screen. The cell truncates for
            width and keeps the whole value in a tooltip, so a copy button that handed over
            the truncation would be worse than none -- a digest is only useful whole.

            The button lives here rather than inside `SkillDigestCell` because that cell is
            a shared renderer: it is meant to drop into any row, and a copy button baked in
            would arrive everywhere it is ever reused.
          */}
          {skillVersion.digest && (
            <CopyButton
              componentId="mlflow.skills-registry.version-pane.copy-digest"
              copyText={skillVersion.digest}
              showLabel={false}
              icon={<CopyIcon />}
              size="small"
              aria-label={intl.formatMessage({
                defaultMessage: 'Copy content digest',
                description: 'Aria label for the copy button beside the skill version content digest',
              })}
            />
          )}
        </div>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Reference URIs:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text code>
            {getSkillVersionUri(skill.organization, skill.name, skillVersion.version)}
          </Typography.Text>
          {skillVersion.aliases.map((alias) => (
            <Typography.Text key={alias} code>
              {getSkillAliasUri(skill.organization, skill.name, alias)}
            </Typography.Text>
          ))}
        </div>

        {/*
          The file browser is a labelled property like the rest, not a section below them.
          It used to hang off the bottom of the pane in its own full-width block, which read
          as a separate region with no name; giving it a "Files:" label puts it in the same
          column as every other value and makes the grid the whole of what this pane says
          about a version.

          Last in the grid because it is the tallest row -- the tree bounds itself at 420px
          and scrolls, so anything after it would sit an awkward distance down the page.

          This pane used to carry a two-tab strip (Files | Traces & evaluations); traces
          moved up to the page-level Preview/Traces switch above the rail, matching the
          prompt details page, which left a one-item tab strip behind. A single tab is
          chrome with nothing to choose, so the strip went and the files render directly.
        */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Files:" description="Skill version pane metadata label" />
        </Typography.Text>
        <div css={{ minWidth: 0 }}>
          <SkillFilesTab skillVersion={skillVersion} totalVersions={totalVersions} />
        </div>
      </div>

      {/*
        The SKILL.md accordion that used to sit here has moved to the Files tab, which
        shows it alongside the reference files and scripts rather than as the skill's only
        visible file. Keeping both would have re-added the vertical scroll the tabs were
        introduced to remove, and would have shown the same content twice.
      */}

      <SkillPullModal
        visible={pullModalOpen}
        skill={skill}
        skillVersion={skillVersion}
        pinVersion
        onClose={() => setPullModalOpen(false)}
      />

      {DeleteSkillVersionModal}
      {EditSkillAliasesModal}
      {EditSkillVersionTagsModal}
    </div>
  );
};
