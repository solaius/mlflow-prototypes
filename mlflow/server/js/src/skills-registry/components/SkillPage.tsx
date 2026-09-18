import {
  Breadcrumb,
  Button,
  DropdownMenu,
  Empty,
  ForkHorizontalIcon,
  OverflowIcon,
  PuzzleIcon,
  SegmentedControlButton,
  SegmentedControlGroup,
  Typography,
  useDesignSystemTheme,
  WarningIcon,
  ZoomMarqueeSelection,
} from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillDescriptionBox } from './SkillDescriptionBox';
import { SkillObservabilityTab } from './SkillObservabilityTab';
import { SkillTagsBox } from './SkillTagsBox';
import { SkillVersionPane } from './SkillVersionPane';
import { useEditSkillModal } from '../hooks/useEditSkillModal';
import { useEditSkillTagsModal } from '../hooks/useEditSkillTagsModal';
import { SkillVersionRail } from './SkillVersionRail';
import { getSkillQualifiedName, parseSkillQualifiedName } from '../constants';
import { SkillFormModalMode, useSkillFormModal } from '../hooks/useSkillFormModal';
import { useDeleteSkillModal } from '../hooks/useSkillDeleteModals';
import { useSkill } from '../hooks/useSkills';
import { canDeleteSkillVersion } from '../mocks/skillsStore';
import { SkillsRegistryRoutes } from '../routes';
import ErrorUtils from '../../common/utils/ErrorUtils';
import { Link, useNavigate, useParams, useSearchParams } from '../../common/utils/RoutingUtils';
import { RegistryIconImage } from '../../common/components/RegistryIcon';
import { withErrorBoundary } from '../../common/utils/withErrorBoundary';

/**
 * Skill detail page — master-detail layout mirroring the prompts feature's
 * `PromptsDetailsPage` (`experiment-tracking/pages/prompts/PromptsDetailsPage.tsx`):
 * a header (breadcrumb, name, description, an editable tag row, a kebab menu for whole-skill
 * delete, and a primary "Add version" button — kebab first, then the primary
 * button, the same left-to-right order as prompts' own kebab +
 * "Create prompt version" pair) above a two-column row — `SkillVersionRail` on the
 * left, `SkillVersionPane` on the right. Renders both `/skills/:skillName` (no
 * version — defaults to the newest) and `/skills/:skillName/versions/:version`
 * (that version pre-selected); rail clicks navigate between the two, replacing
 * history the way prompts' query-param selection uses `replace: true`.
 *
 * A Preview/Traces segmented control sits above the rail, as prompts' own
 * Preview/Compare/Traces switch does. It swaps the RIGHT pane only; the rail stays put,
 * so the selected version never changes underneath a mode switch. No Compare option:
 * skills have no content-diff view to compare into.
 */

/** Which pane the Preview/Traces switch above the rail is showing. */
enum SkillDetailMode {
  PREVIEW = 'preview',
  TRACES = 'traces',
}

const isSkillDetailMode = (value: string | null): value is SkillDetailMode =>
  value === SkillDetailMode.PREVIEW || value === SkillDetailMode.TRACES;

const SkillPage = () => {
  const { theme } = useDesignSystemTheme();
  const navigate = useNavigate();
  const { skillKey: rawSkillKey, version: rawVersion } = useParams();
  // The route carries the qualified `@org/name` identifier; the store keys on the two
  // parts, so it is split once here rather than at every call site.
  const { organization, name: skillName } = useMemo(
    () => parseSkillQualifiedName(rawSkillKey ? decodeURIComponent(rawSkillKey) : ''),
    [rawSkillKey],
  );
  const requestedVersion = rawVersion ? Number.parseInt(rawVersion, 10) : undefined;

  // The mode lives in the URL so it survives a reload and can be linked to, exactly as
  // `RoleDetailPage` does it with its tab. Preview is the default and is kept OUT of the
  // query string, so the common case has a clean URL.
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode = isSkillDetailMode(modeParam) ? modeParam : SkillDetailMode.PREVIEW;

  const handleModeChange = (value: SkillDetailMode) => {
    const next = new URLSearchParams(searchParams);
    if (value === SkillDetailMode.PREVIEW) {
      next.delete('mode');
    } else {
      next.set('mode', value);
    }
    setSearchParams(next, { replace: true });
  };

  const {
    data: { skill, versions, highestVersionNumber },
  } = useSkill(organization, skillName);

  const selectedSkillVersion = useMemo(() => {
    if (!versions.length) {
      return undefined;
    }
    const requested =
      requestedVersion !== undefined && !Number.isNaN(requestedVersion)
        ? versions.find((version) => version.version === requestedVersion)
        : undefined;
    // versions is sorted newest-first, so [0] is the default "latest" selection —
    // used both when no :version segment is present and when an invalid one is.
    return requested ?? versions[0];
  }, [versions, requestedVersion]);

  const { SkillFormModal, openModal: openAddVersionModal } = useSkillFormModal({
    mode: SkillFormModalMode.CreateSkillVersion,
    organization,
    skillName,
    onSuccess: ({ version }) =>
      version !== undefined &&
      navigate(SkillsRegistryRoutes.getSkillVersionPageRoute(organization, skillName, version), { replace: true }),
  });

  const { EditSkillModal, openEditSkillModal } = useEditSkillModal({ skill });

  const { EditSkillTagsModal, openEditSkillTagsModal } = useEditSkillTagsModal({ skill });

  const { DeleteSkillModal, openModal: openDeleteSkillModal } = useDeleteSkillModal({
    organization,
    skillName,
    onSuccess: () => navigate(SkillsRegistryRoutes.skillListPageRoute),
  });

  if (!skill || !selectedSkillVersion) {
    return (
      <div css={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Empty
          image={<WarningIcon />}
          title={
            <FormattedMessage defaultMessage="Skill not found" description="Skills registry > skill not found title" />
          }
          description={
            <FormattedMessage
              defaultMessage="No skill named {skillName} is registered."
              description="Skills registry > skill not found description"
              values={{ skillName: getSkillQualifiedName(organization, skillName) }}
            />
          }
        />
      </div>
    );
  }

  const handleSelectVersion = (version: number) => {
    navigate(SkillsRegistryRoutes.getSkillVersionPageRoute(skill.organization, skill.name, version), {
      replace: true,
    });
  };

  return (
    <div css={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/*
        `paddingBottom` rather than a margin on the tag row: this is the seam between the
        header block and the rail-and-pane row below it, so the space belongs to the
        boundary, not to `SkillTagsBox`, which should not know what follows it. With the
        tag row's own `sm` margin it comes to `md` between the last chip and the
        Preview/Traces switch.
      */}
      <div css={{ padding: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
        <Breadcrumb includeTrailingCaret>
          <Breadcrumb.Item>
            <Link
              componentId="mlflow.skills-registry.skill-page.breadcrumb_skills"
              to={SkillsRegistryRoutes.skillListPageRoute}
            >
              <FormattedMessage defaultMessage="Skills" description="Skills registry breadcrumb root" />
            </Link>
          </Breadcrumb.Item>
        </Breadcrumb>

        <div
          css={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.sm,
          }}
        >
          <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <div
              css={{
                borderRadius: theme.borders.borderRadiusSm,
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.sm,
                display: 'flex',
              }}
            >
              <RegistryIconImage icons={skill.icons} name={skill.name} size={20} placeholder={<PuzzleIcon />} />
            </div>
            <div css={{ display: 'flex', flexDirection: 'column' }}>
              <Typography.Title withoutMargins level={2}>
                {skill.name}
              </Typography.Title>
            </div>
          </div>

          <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  componentId="mlflow.skills-registry.skill-page.actions"
                  icon={<OverflowIcon />}
                  aria-label="More actions"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  componentId="mlflow.skills-registry.skill-page.actions.edit"
                  onClick={openEditSkillModal}
                >
                  <FormattedMessage
                    defaultMessage="Edit"
                    description="Skills registry > skill page > edit action in the kebab menu"
                  />
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  componentId="mlflow.skills-registry.skill-page.actions.delete"
                  onClick={openDeleteSkillModal}
                >
                  <FormattedMessage
                    defaultMessage="Delete"
                    description="Label for the delete skill kebab-menu action"
                  />
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            {/*
              No "Use" button here: `SkillVersionPane` carries one beside the version
              heading, and pulling is inherently version-scoped, so the page-level copy
              was the ambiguous of the two.
            */}
            <Button
              componentId="mlflow.skills-registry.skill-page.add-version"
              type="primary"
              onClick={openAddVersionModal}
            >
              <FormattedMessage
                defaultMessage="Create skill version"
                description="Label for the add skill version button"
              />
            </Button>
          </div>
        </div>

        {/*
          Description between the header row and the tags -- the MCP server details page's
          treatment. Keyed on the skill so that navigating to another one starts collapsed:
          `SkillPage` stays mounted across that navigation, and an expansion left over from
          the previous skill would apply to a description the reader never expanded.
        */}
        <SkillDescriptionBox
          key={getSkillQualifiedName(skill.organization, skill.name)}
          description={skill.description}
        />

        {/*
          Tags sit directly under the title as a bare chip row -- no "Tags" caption --
          mirroring the prompt details page's `PromptsListTableTagsBox`, which renders
          immediately below its `Header`.
        */}
        <SkillTagsBox tags={skill.tags} onEdit={openEditSkillTagsModal} />
      </div>

      {/*
        Rail beside, pane to its right, and the Preview/Traces switch above the rail --
        the prompt details page's arrangement. The rail renders once here rather than once
        per mode, which is both the fix for Juntao's "only part of the page changes"
        objection and the reason switching modes can no longer show a different version
        than the one selected.
      */}
      <div css={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        <div css={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div
            css={{ display: 'flex', gap: theme.spacing.sm, padding: `0 ${theme.spacing.md}px ${theme.spacing.sm}px` }}
          >
            <SegmentedControlGroup
              name="mlflow.skills-registry.skill-page.mode"
              componentId="mlflow.skills-registry.skill-page.mode"
              value={mode}
            >
              <SegmentedControlButton
                value={SkillDetailMode.PREVIEW}
                onClick={() => handleModeChange(SkillDetailMode.PREVIEW)}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <ZoomMarqueeSelection />
                  <FormattedMessage
                    defaultMessage="Preview"
                    description="Label for the preview mode on the skill details page"
                  />
                </div>
              </SegmentedControlButton>
              <SegmentedControlButton
                value={SkillDetailMode.TRACES}
                onClick={() => handleModeChange(SkillDetailMode.TRACES)}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <ForkHorizontalIcon />
                  <FormattedMessage
                    defaultMessage="Traces"
                    description="Label for the traces mode on the skill details page"
                  />
                </div>
              </SegmentedControlButton>
            </SegmentedControlGroup>
          </div>
          <SkillVersionRail
            versions={versions}
            highestVersionNumber={highestVersionNumber}
            selectedVersion={selectedSkillVersion.version}
            onSelectVersion={handleSelectVersion}
          />
        </div>
        <div
          css={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            borderLeft: `1px solid ${theme.colors.border}`,
            overflow: 'auto',
          }}
        >
          {mode === SkillDetailMode.PREVIEW && (
            <SkillVersionPane
              skill={skill}
              skillVersion={selectedSkillVersion}
              siblingVersions={versions}
              canDelete={canDeleteSkillVersion(skill.organization, skill.name, selectedSkillVersion.version)}
              totalVersions={highestVersionNumber}
            />
          )}
          {mode === SkillDetailMode.TRACES && (
            <div css={{ padding: theme.spacing.md }}>
              <SkillObservabilityTab organization={skill.organization} skillName={skill.name} />
            </div>
          )}
        </div>
      </div>

      {SkillFormModal}
      {EditSkillModal}
      {EditSkillTagsModal}
      {DeleteSkillModal}
    </div>
  );
};

export default withErrorBoundary(ErrorUtils.mlflowServices.MODEL_REGISTRY, SkillPage);
