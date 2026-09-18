import {
  Button,
  ChevronDownIcon,
  ChevronRightIcon,
  FormUI,
  Input,
  Modal,
  SegmentedControlButton,
  SegmentedControlGroup,
  SimpleSelect,
  SimpleSelectOption,
  Spacer,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { SkillRegisterSnippet } from '../components/SkillRegisterSnippet';
import {
  EMPTY_SOURCE_INPUT,
  SkillSourceFields,
  SkillSourceRefFields,
  isSourceInputComplete,
} from '../components/SkillSourceFields';
import { SkillIconField } from '../components/SkillIconField';
import { SkillTagsEditor } from '../components/SkillTagsEditor';
import { getSkillQualifiedName, parseSkillQualifiedName } from '../constants';
import type { RegistryIcon } from '../../common/components/RegistryIcon';
import type { SkillTag } from '../types';
import type { SkillSourceInput } from '../mocks/skillsStore';
import {
  addSkillVersion,
  createSkill,
  getLatestSkillVersion,
  nextSkillVersionNumber,
  skillNameExists,
} from '../mocks/skillsStore';
import { SkillSourceType, SkillStatus } from '../types';
import { CREATABLE_STATUSES, formatStatusLabel } from '../utils';

const COMPONENT_ID = 'mlflow.skills-registry.skill-form';

/**
 * The name a client would read out of the uploaded folder's SKILL.md.
 *
 * The Agent Skills spec constrains `name` to lowercase alphanumerics and hyphens AND
 * requires it to match the skill's directory name, which is what makes the directory a
 * sound stand-in here: a real client parses the frontmatter, but the two agree by
 * construction. Anything that does not fit the slug shape returns undefined rather than
 * being mangled into one, so the form falls back to asking.
 */
const deriveNameFromFolder = (folderName?: string): string | undefined => {
  if (!folderName) {
    return undefined;
  }
  const candidate = folderName.trim().toLowerCase();
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(candidate) ? candidate : undefined;
};

export enum SkillFormModalMode {
  CreateSkill = 'CreateSkill',
  CreateSkillVersion = 'CreateSkillVersion',
}

interface SkillFormState {
  organization: string;
  name: string;
  description: string;
  source: SkillSourceInput;
  status: SkillStatus;
  tags: SkillTag[];
  icons: RegistryIcon[];
}

/**
 * Which of the three equivalent registration surfaces the modal is showing.
 *
 * Mirrors the MCP server registry's form/Python pair, extended to three at the
 * 2026-09-01 review's request. The CLI and Python arms are read-only renderings of the
 * form's current values, not separate editors — switching back and forth never loses
 * what was typed.
 */
enum RegisterSurface {
  FORM = 'form',
  CLI = 'cli',
  PYTHON = 'python',
}

const INITIAL_STATE: SkillFormState = {
  organization: '',
  name: '',
  description: '',
  source: EMPTY_SOURCE_INPUT,
  // RFC-0008 §Per-version status: a version is `active` on create unless the caller asks
  // otherwise. The form defaults to what the API would. Re-confirmed as the intended
  // default after the 2026-09-01 review raised `draft` as an alternative.
  status: SkillStatus.ACTIVE,
  tags: [],
  icons: [],
};

export interface UseSkillFormModalProps {
  mode: SkillFormModalMode;
  /** Required in version mode: the skill the new version belongs to. */
  organization?: string;
  skillName?: string;
  onSuccess?: (result: { organization: string; name: string; version?: number }) => void;
}

/**
 * Create a skill, or add a version to one, in a modal.
 *
 * Both used to be full pages. They are modals now, matching the prompt and MCP registries,
 * and they share one hook for the same reason `useCreatePromptModal` does: the two forms
 * differ only in whether identity is being chosen or is already fixed, and keeping them
 * apart meant every change to the source fields had to be made twice.
 *
 * Version mode deliberately does NOT lock the source to the previous version's. The
 * backend, the CLI and the SDK all let a skill's versions live in different places, and a
 * UI that pinned new versions to the existing repository would enforce a restriction the
 * registry does not have. It pre-fills from the latest version, which covers the common
 * case without forbidding the others.
 */
export const useSkillFormModal = ({ mode, organization, skillName, onSuccess }: UseSkillFormModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<SkillFormState>(INITIAL_STATE);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [sourceUriError, setSourceUriError] = useState<string | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [surface, setSurface] = useState<RegisterSurface>(RegisterSurface.FORM);

  const isCreatingSkill = mode === SkillFormModalMode.CreateSkill;
  const isVersionMode = mode === SkillFormModalMode.CreateSkillVersion;

  const latestVersion = useMemo(
    () =>
      isVersionMode && organization !== undefined && skillName
        ? getLatestSkillVersion(organization, skillName)
        : undefined,
    [isVersionMode, organization, skillName],
  );

  const nextVersion =
    isVersionMode && organization !== undefined && skillName
      ? nextSkillVersionNumber(organization, skillName)
      : undefined;

  const setField = <K extends keyof SkillFormState>(key: K, value: SkillFormState[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  /**
   * Seeded on open rather than at mount: the latest version is read from the store, and in
   * version mode a modal that kept its first render's values would show a stale source
   * after another version landed.
   */
  const openModal = () => {
    setNameError(undefined);
    setSourceUriError(undefined);
    setSurface(RegisterSurface.FORM);
    // Version mode pre-fills ref and subpath from the previous version. Those live in
    // the advanced section now, and a section that silently hides pre-filled values is
    // worse than no section at all — so it starts open exactly when it has something in
    // it. Same rule the prompt registry's create modal uses for its own advanced block.
    setShowAdvanced(Boolean(latestVersion?.source.ref || latestVersion?.source.subpath));
    setValues({
      ...INITIAL_STATE,
      source: latestVersion
        ? {
            // An MLflow-stored version has a server-assigned path, so there is nothing to
            // pre-fill as a pointer: it starts on the upload flow it came from.
            mode: latestVersion.source.source_type === SkillSourceType.MLFLOW ? 'upload' : 'pointer',
            sourceType:
              latestVersion.source.source_type === SkillSourceType.MLFLOW
                ? SkillSourceType.GIT
                : latestVersion.source.source_type,
            sourceUri: latestVersion.source.source_type === SkillSourceType.MLFLOW ? '' : latestVersion.source.source,
            ref: latestVersion.source.ref ?? '',
            subpath: latestVersion.source.subpath ?? '',
          }
        : EMPTY_SOURCE_INPUT,
    });
    setOpen(true);
  };

  const duplicateNameMessage = (qualified: string) =>
    intl.formatMessage(
      {
        defaultMessage: 'A skill named "{name}" is already registered.',
        description: 'Skills registry > create skill > duplicate name inline error',
      },
      { name: qualified },
    );

  const handleNameBlur = () => {
    const { organization: trimmedOrg, name: trimmedName } = parseSkillQualifiedName(values.name.trim());
    setNameError(
      trimmedName && skillNameExists(trimmedOrg, trimmedName)
        ? duplicateNameMessage(getSkillQualifiedName(trimmedOrg, trimmedName))
        : undefined,
    );
  };

  /**
   * Whether the browser can read the content well enough to derive the name itself.
   *
   * RFC-0008 computes a skill's `name` from SKILL.md CLIENT-SIDE — which is why the
   * RFC's own minimal example registers a git source with no `--name` at all. A browser
   * is a client that can do this for an uploaded folder and cannot do it for a pointer:
   * it has no git, no OCI puller, and the server never fetches on its behalf. So "the
   * minimal set of fields" genuinely differs by mode, and the form says which one it is
   * in rather than demanding a name it could have worked out.
   */
  const canInferName = values.source.mode === 'upload';
  const inferredName = canInferName ? deriveNameFromFolder(values.source.uploadedFolderName) : undefined;
  const effectiveName = values.name.trim() || inferredName || '';
  /*
    The Name input is the only place an organization is entered since the Organization
    field left the form (2026-09-18-pdouble-round2-merge-rulings#3), so `@my-org/my-skill`
    is split here into its organization and bare name. Without this, following the Name
    hint registered an unscoped skill whose name began with `@my-org/`
    (2026-09-18-pdouble-round2-merge-rulings#6).
  */
  const scopedName = parseSkillQualifiedName(effectiveName);

  const isComplete = isVersionMode
    ? isSourceInputComplete(values.source)
    : effectiveName.length > 0 && isSourceInputComplete(values.source);

  const handleSubmit = () => {
    if (values.source.mode === 'pointer' && !values.source.sourceUri.trim()) {
      setSourceUriError(
        intl.formatMessage({
          defaultMessage: 'A source location is required.',
          description: 'Skills registry > required source URI error',
        }),
      );
      return;
    }

    if (isVersionMode) {
      if (organization === undefined || !skillName) {
        return;
      }
      const created = addSkillVersion({
        organization,
        name: skillName,
        source: values.source,
        status: values.status,
      });
      setOpen(false);
      onSuccess?.({ organization, name: skillName, version: created?.version });
      return;
    }

    const { organization: trimmedOrg, name: trimmedName } = scopedName;

    if (!trimmedName) {
      setNameError(
        intl.formatMessage({
          defaultMessage: 'Skill name is required.',
          description: 'Skills registry > create skill > required name error',
        }),
      );
      return;
    }
    if (skillNameExists(trimmedOrg, trimmedName)) {
      setNameError(duplicateNameMessage(getSkillQualifiedName(trimmedOrg, trimmedName)));
      return;
    }

    createSkill({ ...values, organization: trimmedOrg, name: trimmedName });
    setOpen(false);
    onSuccess?.({ organization: trimmedOrg, name: trimmedName, version: 1 });
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={
        isCreatingSkill ? (
          <FormattedMessage defaultMessage="Create skill" description="Header for the create skill modal" />
        ) : (
          <FormattedMessage
            defaultMessage="Create skill version {version}"
            description="Header for the add skill version modal"
            values={{ version: nextVersion }}
          />
        )
      }
      okText={<FormattedMessage defaultMessage="Create" description="Confirm button in the skill form modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the skill form modal" />}
      okButtonProps={{ disabled: !isComplete }}
      onOk={handleSubmit}
      size="wide"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {/*
          Default size, not `small`: the Link-to-a-source / Upload-a-folder control further
          down the same modal is the default size, and two segmented controls in one dialog
          at different sizes read as two different kinds of control.
        */}
        <SegmentedControlGroup
          name={`${COMPONENT_ID}.surface`}
          componentId={`${COMPONENT_ID}.surface`}
          value={surface}
          onChange={(event) => setSurface(event.target.value as RegisterSurface)}
        >
          <SegmentedControlButton value={RegisterSurface.FORM}>
            <FormattedMessage defaultMessage="Form" description="Skills registry > create > form surface" />
          </SegmentedControlButton>
          <SegmentedControlButton value={RegisterSurface.CLI}>
            <FormattedMessage defaultMessage="CLI" description="Skills registry > create > CLI surface" />
          </SegmentedControlButton>
          <SegmentedControlButton value={RegisterSurface.PYTHON}>
            <FormattedMessage defaultMessage="Python" description="Skills registry > create > Python surface" />
          </SegmentedControlButton>
        </SegmentedControlGroup>

        {surface !== RegisterSurface.FORM ? (
          <SkillRegisterSnippet
            format={surface === RegisterSurface.CLI ? 'cli' : 'python'}
            input={{
              organization: scopedName.organization,
              name: scopedName.name,
              sourceType: values.source.sourceType,
              sourceUri: values.source.sourceUri.trim(),
              ref: values.source.ref?.trim() || undefined,
              subpath: values.source.subpath?.trim() || undefined,
              status: values.status,
            }}
          />
        ) : (
          <>
            {isCreatingSkill ? (
              /*
                Name alone on the top row, and it stays on the top row. It is the one
                required field in this form, so it does not belong behind a disclosure
                toggle labelled "optional" -- a required field hidden there leaves Create
                disabled with nothing on screen saying why.

                Organization moved into the advanced section instead: it is optional, most
                skills are unscoped, and it was the first thing the eye landed on.
              */
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <FormUI.Label htmlFor={`${COMPONENT_ID}.name`}>
                  {canInferName ? (
                    <FormattedMessage
                      defaultMessage="Name (optional)"
                      description="Label for the skill name input when it can be read from the uploaded folder"
                    />
                  ) : (
                    <FormattedMessage defaultMessage="Name" description="Label for the skill name input" />
                  )}
                </FormUI.Label>
                <Input
                  id={`${COMPONENT_ID}.name`}
                  componentId={`${COMPONENT_ID}.name`}
                  value={values.name}
                  onChange={(event) => {
                    setField('name', event.target.value);
                    setNameError(undefined);
                  }}
                  onBlur={handleNameBlur}
                  placeholder="my-skill"
                  validationState={nameError ? 'error' : undefined}
                />
                {/*
                  The hint slot shows an error, the inferred-name note, or help text about
                  organization scoping. The scoping hint is especially useful when a name
                  collision occurs: the user may not know they can scope under an org.
                */}
                {nameError ? (
                  <FormUI.Message type="error" message={nameError} />
                ) : canInferName && !values.name.trim() ? (
                  <FormUI.Hint>
                    {inferredName ? (
                      <FormattedMessage
                        defaultMessage="Read from SKILL.md as {name}. Type one to override it."
                        description="Hint when the skill name is inferred from the uploaded folder"
                        values={{ name: inferredName }}
                      />
                    ) : (
                      <FormattedMessage
                        defaultMessage="Read from the folder's SKILL.md when you select one."
                        description="Hint when the skill name will be inferred but no folder is selected yet"
                      />
                    )}
                  </FormUI.Hint>
                ) : (
                  <FormUI.Hint>
                    <FormattedMessage
                      defaultMessage="Scope to a single organization by adding it to the name, e.g. @my-org/my-skill-name."
                      description="Hint on the name input explaining that an organization can scope the name"
                    />
                  </FormUI.Hint>
                )}
              </div>
            ) : (
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Adding a version to {name}. Its content can come from anywhere, not just where the previous version lives."
                  description="Explains what an added skill version is registered against"
                  values={{ name: getSkillQualifiedName(organization ?? '', skillName ?? '') }}
                />
              </Typography.Text>
            )}

            <SkillSourceFields
              componentId={COMPONENT_ID}
              value={values.source}
              onChange={(source) => setField('source', source)}
              sourceUriError={sourceUriError}
              onSourceUriChange={() => setSourceUriError(undefined)}
              onRequestAdvanced={() => setShowAdvanced(true)}
            />

            {/*
          Everything below is optional, and the 2026-09-01 review's core finding was that
          showing it all at once left users unsure where to begin. Same disclosure the
          prompt registry's create modal uses: a link-styled chevron toggle, label ending
          in "(optional)", collapsed unless it has content worth showing.
        */}
            <Button
              componentId={`${COMPONENT_ID}.toggle_advanced`}
              type="link"
              onClick={() => setShowAdvanced(!showAdvanced)}
              icon={showAdvanced ? <ChevronDownIcon /> : <ChevronRightIcon />}
              css={{ padding: 0, alignSelf: 'flex-start' }}
            >
              <FormattedMessage
                defaultMessage="Advanced settings (optional)"
                description="Toggle for the optional fields in the skill create modal"
              />
            </Button>

            {showAdvanced && (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <SkillSourceRefFields
                  componentId={COMPONENT_ID}
                  value={values.source}
                  onChange={(source) => setField('source', source)}
                />

                {/*
                  Sits after the ref/subpath fields, which are a continuation of the Source
                  block above the toggle, and before Description, which is the other piece
                  of optional identity. Blurring revalidates the name for the same reason it
                  did on the top row: "already registered" is a check on org + name together.
                */}
                {isCreatingSkill && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
                      <FormattedMessage defaultMessage="Description" description="Label for the skill description" />
                    </FormUI.Label>
                    <Input.TextArea
                      id={`${COMPONENT_ID}.description`}
                      componentId={`${COMPONENT_ID}.description`}
                      value={values.description}
                      onChange={(event) => setField('description', event.target.value)}
                      placeholder={intl.formatMessage({
                        defaultMessage: 'What this skill does and when to use it.',
                        description: 'Placeholder for the skill description input',
                      })}
                      autoSize={{ minRows: 2 }}
                    />
                  </div>
                )}

                {isCreatingSkill && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.icon.src`}>
                      <FormattedMessage defaultMessage="Icon" description="Label for the skill icon field" />
                    </FormUI.Label>
                    <SkillIconField
                      componentId={`${COMPONENT_ID}.icon`}
                      value={values.icons}
                      onChange={(icons) => setField('icons', icons)}
                    />
                  </div>
                )}

                <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                  <FormUI.Label htmlFor={`${COMPONENT_ID}.status`}>
                    <FormattedMessage defaultMessage="Status" description="Label for the lifecycle status selector" />
                  </FormUI.Label>
                  <SimpleSelect
                    id={`${COMPONENT_ID}.status`}
                    componentId={`${COMPONENT_ID}.status`}
                    value={values.status}
                    onChange={({ target }) => setField('status', target.value as SkillStatus)}
                    label={intl.formatMessage({
                      defaultMessage: 'Status',
                      description: 'Label for the lifecycle status selector',
                    })}
                  >
                    {CREATABLE_STATUSES.map((status) => (
                      <SimpleSelectOption key={status} value={status}>
                        {formatStatusLabel(status)}
                      </SimpleSelectOption>
                    ))}
                  </SimpleSelect>
                  <FormUI.Hint>
                    <FormattedMessage
                      defaultMessage="A draft is passed over whenever any active version exists. A draft can always be reached by an explicit version pin or an alias."
                      description="Hint explaining the lifecycle status choices when registering a skill version"
                    />
                  </FormUI.Hint>
                </div>

                {isCreatingSkill && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.tags.key`}>
                      <FormattedMessage defaultMessage="Tags" description="Label for the skill tags editor" />
                    </FormUI.Label>
                    <SkillTagsEditor
                      componentId={`${COMPONENT_ID}.tags`}
                      value={values.tags}
                      onChange={(tags) => setField('tags', tags)}
                    />
                    <FormUI.Hint>
                      <FormattedMessage
                        defaultMessage="Key/value metadata you can filter the registry by. Editable later from the skill page."
                        description="Hint for the skill tags editor"
                      />
                    </FormUI.Hint>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );

  return { SkillFormModal: modalElement, openModal };
};
