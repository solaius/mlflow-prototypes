import {
  Alert,
  Button,
  FormUI,
  Input,
  Radio,
  SimpleSelect,
  SimpleSelectOption,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { SkillRegistrationMode, SkillSourceInput } from '../mocks/skillsStore';
import { readUploadedSkillFolder } from '../mocks/uploadedSkillContent';
import { SkillSourceType } from '../types';
import {
  POINTER_SOURCE_TYPES,
  SOURCE_PLACEHOLDERS,
  SOURCE_TYPE_LABELS,
  inferSourceType,
  parseProviderWebUrl,
  sourceTypeSupportsRef,
} from '../utils';

export interface SkillSourceFieldsProps {
  componentId: string;
  value: SkillSourceInput;
  onChange: (value: SkillSourceInput) => void;
  /** Inline error on the pointer URI, surfaced by the parent form's validation. */
  sourceUriError?: string;
  onSourceUriChange?: () => void;
  /**
   * Asks the parent to open its advanced section. Called when applying the pasted-web-URL
   * correction, because that correction fills `ref` and `subpath` — and silently writing
   * into two collapsed fields would look like the button did nothing.
   */
  onRequestAdvanced?: () => void;
}

/**
 * One labelled field, stacked. The registry forms used to be full pages laid out with
 * `LongFormSection`'s two-column title gutter; they are modals now, and the prompt and MCP
 * create modals both stack label over control, so this matches them.
 */
const Field = ({
  label,
  htmlFor,
  hint,
  subtleLabel,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  /**
   * Renders the label in help-text style instead of as a bold heading.
   *
   * Still a `FormUI.Label` rather than a plain span: the styling is the only thing being
   * changed, and swapping the element would cost the control its `htmlFor` association.
   * The `&&` matches the specificity DuBois' own `getLabelStyles` uses, which is what
   * makes the override land.
   */
  subtleLabel?: boolean;
  children: React.ReactNode;
}) => {
  const { theme } = useDesignSystemTheme();
  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <FormUI.Label
        htmlFor={htmlFor}
        css={
          subtleLabel
            ? {
                // The four properties DuBois' own `getHintStyles` sets, so a subtle label
                // and a hint are the same text rather than merely similar.
                '&&': {
                  color: theme.colors.textSecondary,
                  fontWeight: theme.typography.typographyRegularFontWeight,
                  fontSize: theme.typography.fontSizeSm,
                  lineHeight: theme.typography.lineHeightSm,
                },
              }
            : undefined
        }
      >
        {label}
      </FormUI.Label>
      {children}
      {hint && <FormUI.Hint>{hint}</FormUI.Hint>}
    </div>
  );
};

/**
 * The source half of the skill create and add-version modals.
 *
 * RFC-0008 puts the browser in an unusual position: the registry server never fetches a
 * user-supplied source URL, and the fields derived from content (name, digest) are
 * computed by the CLIENT during local inspection. A browser is a client with no
 * filesystem, no git and no OCI puller, so registration honestly splits in two rather
 * than pretending one flow covers both:
 *
 *   Upload a folder  the browser reads the local skill directory, so it can compute a
 *                    digest and hand over the bytes. The server stores them and assigns
 *                    the artifact path, making this a `source_type = 'mlflow'` version.
 *                    This is the flow where the UI is genuinely better than the CLI.
 *
 *   Link to a source  git, OCI or ZIP. The browser records WHERE the content lives and
 *                    submits metadata only. It cannot read the content, so it submits no
 *                    digest, which is legal rather than degraded: RFC-0008 makes the
 *                    field nullable.
 *
 * Showing both, labelled, is what keeps the UI from quietly being a worse CLI.
 *
 * Layout note (2026-09-01 UX review): only the mode, type and LOCATION live here. The
 * review's finding was that the form asked for everything at once and gave the user no
 * clue where to start, and that location is the one field that matters most — so `ref`
 * and `subpath` moved to `SkillSourceRefFields`, which the create form renders inside
 * its advanced section.
 */
export const SkillSourceFields = ({
  componentId,
  value,
  onChange,
  sourceUriError,
  onSourceUriChange,
  onRequestAdvanced,
}: SkillSourceFieldsProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const update = (partial: Partial<SkillSourceInput>) => onChange({ ...value, ...partial });
  const isUpload = value.mode === 'upload';

  const [isReadingFolder, setIsReadingFolder] = useState(false);
  const [folderReadFailed, setFolderReadFailed] = useState(false);
  /*
    Reading a folder is asynchronous, and both of these guard the gap it opens.

    `valueRef` is what the result merges into: `update` closes over the `value` of the
    render the pick happened in, so applying the listing through it would revert anything
    the user changed while the read was running.

    `readToken` discards a superseded read. Picking a second folder before the first
    finishes is one click, and without this the slower read wins whichever it was.
  */
  const valueRef = useRef(value);
  valueRef.current = value;
  const readToken = useRef(0);

  const handleFolderPicked = async (fileList: FileList | null) => {
    readToken.current += 1;
    const token = readToken.current;
    setFolderReadFailed(false);

    if (!fileList?.length) {
      setIsReadingFolder(false);
      update({ uploadedFolderName: undefined, uploadedFiles: undefined, uploadedDigest: undefined });
      return;
    }

    // The folder NAME lands immediately, before any file is read: it is what the form
    // infers the skill's name from and what enables submit, and making either wait on a
    // tree read would stall the form on work the user cannot see.
    const folderName = fileList[0].webkitRelativePath?.split('/')[0] || undefined;
    update({ uploadedFolderName: folderName, uploadedFiles: undefined, uploadedDigest: undefined });
    setIsReadingFolder(true);

    try {
      const content = await readUploadedSkillFolder(fileList);
      if (token !== readToken.current) {
        return;
      }
      onChange({ ...valueRef.current, uploadedFiles: content.files, uploadedDigest: content.digest });
    } catch {
      if (token === readToken.current) {
        setFolderReadFailed(true);
      }
    } finally {
      if (token === readToken.current) {
        setIsReadingFolder(false);
      }
    }
  };

  // Only knowable once the tree has been read, which is the point: a folder without a
  // SKILL.md at its root is not a skill, and saying so at pick time beats registering a
  // version whose entry point nothing can find.
  const uploadedFiles = value.uploadedFiles;
  const isMissingManifest = Boolean(uploadedFiles?.length) && !uploadedFiles?.some((file) => file.path === 'SKILL.md');

  // A pasted browsing URL is the single most likely wrong-shaped input, and it is the
  // one RFC-0008 PR #44 calls out by name. Detecting it here means the form can offer
  // the fix while the user is still looking at the field, rather than accepting a
  // location that cannot be cloned and failing at pull time.
  const webUrlParts = value.mode === 'pointer' ? parseProviderWebUrl(value.sourceUri) : undefined;

  const applyWebUrlCorrection = () => {
    if (!webUrlParts) {
      return;
    }
    update({
      sourceType: SkillSourceType.GIT,
      sourceUri: webUrlParts.cloneUrl,
      ref: webUrlParts.ref ?? value.ref,
      subpath: webUrlParts.subpath ?? value.subpath,
    });
    onSourceUriChange?.();
    onRequestAdvanced?.();
  };

  /**
   * Typing a location pre-selects the type it obviously is. Two guards keep this from
   * fighting the user: nothing happens when the location is unrecognised, and nothing
   * happens when the guess matches what is already selected. A deliberate override
   * therefore survives further typing in the same field, which is the behaviour the
   * review asked for — infer to save a click, never to take the choice away.
   */
  const handleLocationChange = (nextUri: string) => {
    const inferred = inferSourceType(nextUri);
    update({
      sourceUri: nextUri,
      ...(inferred && inferred !== value.sourceType ? { sourceType: inferred } : {}),
    });
    onSourceUriChange?.();
  };

  return (
    <>
      <Field label={<FormattedMessage defaultMessage="Source" description="Label for how skill content is supplied" />}>
        {/*
          Radios, not a segmented control. The two modes are a choice being made about the
          skill being registered, and the fields below change depending on which is picked;
          a segmented control reads as a view switch over the same content, which is what
          the Form/CLI/Python control above it genuinely is. Keeping both as segmented
          controls made two different kinds of decision look like one.

          Nothing is selected on open. The two modes ask for completely different things --
          a URL versus a local directory -- so defaulting to either one puts the user in
          front of a half-filled form for a decision they never made, and the wrong default
          costs more than the extra click saves.

          `value.mode ?? ''` rather than `undefined`: an undefined value makes antd's group
          uncontrolled, which would let its internal state drift from the form's. The empty
          string matches no radio, so nothing is checked and the group stays controlled.
        */}
        <Radio.Group
          name={`${componentId}.mode`}
          componentId={`${componentId}.mode`}
          value={value.mode ?? ''}
          onChange={(event) => update({ mode: event.target.value as SkillRegistrationMode })}
          layout="vertical"
        >
          {/*
            Each mode carries its own explanation rather than one line below the group that
            swaps with the selection. With nothing selected there is no mode to describe,
            and a reader choosing between two flows wants to compare them, not click one to
            find out what it was.
          */}
          <Radio value="pointer">
            <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormattedMessage
                defaultMessage="Link to a source"
                description="Skills registry > registration mode > pointer option"
              />
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="Content stays where it is. Clients fetch it with their own credentials."
                  description="Explanation of the pointer registration flow"
                />
              </Typography.Text>
            </div>
          </Radio>
          {/*
            The pointer's fields render INSIDE the group, directly under the option that
            asks for them, rather than below both radios. What they are for is then
            unambiguous: a location field sitting under "Upload a folder" reads as though
            it might belong to either mode.

            Indented by `theme.spacing.lg` -- the same offset DuBois gives a `FormUI.Hint`
            following a radio label -- so they hang under the option's text and cannot be
            mistaken for a third choice in the list. `paddingBottom` of `sm` matches the
            padding the vertical group puts below each label, keeping the rhythm even.
          */}
          {value.mode === 'pointer' && (
            <div
              css={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
                paddingLeft: theme.spacing.lg,
                paddingBottom: theme.spacing.sm,
              }}
            >
              <Field
                label={
                  <FormattedMessage defaultMessage="Source type" description="Label for the source type selector" />
                }
                htmlFor={`${componentId}.source-type`}
                subtleLabel
              >
                <SimpleSelect
                  id={`${componentId}.source-type`}
                  componentId={`${componentId}.source-type`}
                  value={value.sourceType}
                  onChange={({ target }) => update({ sourceType: target.value as SkillSourceType })}
                  label={intl.formatMessage({
                    defaultMessage: 'Source type',
                    description: 'Label for the source type selector',
                  })}
                >
                  {POINTER_SOURCE_TYPES.map((sourceType) => (
                    <SimpleSelectOption key={sourceType} value={sourceType}>
                      {SOURCE_TYPE_LABELS[sourceType]}
                    </SimpleSelectOption>
                  ))}
                </SimpleSelect>
              </Field>
              <Field
                label={<FormattedMessage defaultMessage="Location" description="Label for the source location input" />}
                htmlFor={`${componentId}.source-uri`}
                subtleLabel
              >
                <Input
                  id={`${componentId}.source-uri`}
                  componentId={`${componentId}.source-uri`}
                  value={value.sourceUri}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  placeholder={SOURCE_PLACEHOLDERS[value.sourceType]}
                  validationState={sourceUriError ? 'error' : undefined}
                />
                {sourceUriError && <FormUI.Message type="error" message={sourceUriError} />}
              </Field>

              {/* Travels with the location field it is correcting, not left behind below
                  the group where it would be pointing at an input two options away. */}
              {webUrlParts && (
                <Alert
                  componentId={`${componentId}.web-url-hint`}
                  type="info"
                  closable={false}
                  message={intl.formatMessage({
                    defaultMessage: 'That looks like a page you browse, not a location you can clone.',
                    description: 'Skills registry > source fields > pasted web URL alert title',
                  })}
                  description={
                    <div
                      css={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing.xs,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Typography.Text size="sm">
                        <FormattedMessage
                          defaultMessage="Register the clone URL and point at the skill with the branch and path fields instead."
                          description="Skills registry > source fields > pasted web URL explanation"
                        />
                      </Typography.Text>
                      <Button
                        componentId={`${componentId}.web-url-hint.apply`}
                        size="small"
                        onClick={applyWebUrlCorrection}
                      >
                        <FormattedMessage
                          defaultMessage="Use {cloneUrl}"
                          description="Skills registry > source fields > apply the pasted web URL correction"
                          values={{ cloneUrl: webUrlParts.cloneUrl }}
                        />
                      </Button>
                    </div>
                  }
                />
              )}
            </div>
          )}
          <Radio value="upload">
            <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormattedMessage
                defaultMessage="Upload a folder"
                description="Skills registry > registration mode > upload option"
              />
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="Your browser reads the folder and uploads it. MLflow stores the content."
                  description="Explanation of the upload registration flow"
                />
              </Typography.Text>
            </div>
          </Radio>
        </Radio.Group>
      </Field>

      {/*
        The folder picker stays below the group rather than moving inside it beside the
        pointer's fields, because "Upload a folder" is the LAST option: directly below the
        group already is directly below that radio. Both modes therefore reveal their
        fields in the same place relative to the option that asked for them.
      */}
      {isUpload && (
        /*
          No "Skill folder" label: the radio directly above already says "Upload a folder",
          and a second heading restating it made the picker look like a separate question.

          Indented by `theme.spacing.lg` so it hangs under that radio's TEXT rather than
          under its button. That is not a hand-tuned number -- it is the same offset DuBois
          applies to a `FormUI.Hint` following a radio label (`getCommonRadioGroupStyles`),
          so this lines up with the design system's own answer for the same problem.
        */
        <div
          css={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
            paddingLeft: theme.spacing.lg,
          }}
        >
          {/*
            A directory picker is the whole reason the upload flow is viable in a browser:
            it is the one way the page can read a skill tree without a filesystem API.
            `webkitdirectory` is the attribute that turns a file input into one, and it is
            set imperatively because React does not type it.

            `aria-label` replaces the visible label that used to name it. Dropping the
            heading is a visual decision, and it must not cost the input its accessible
            name.
          */}
          <input
            ref={(node) => {
              folderInputRef.current = node;
              if (node) {
                node.setAttribute('webkitdirectory', '');
                node.setAttribute('directory', '');
              }
            }}
            id={`${componentId}.folder`}
            type="file"
            multiple
            aria-label={intl.formatMessage({
              defaultMessage: 'Skill folder',
              description: 'Label for the uploaded skill folder',
            })}
            onChange={(event) => {
              handleFolderPicked(event.target.files);
            }}
          />
          {/*
            Three states, because the read is visible work: what to do, that it is
            happening, and what came back. The last one reports a COUNT -- it is the only
            confirmation that the browser read the tree rather than just noting its name,
            and it is the number a reader can sanity-check against their own folder.
          */}
          <FormUI.Hint>
            {isReadingFolder ? (
              <FormattedMessage
                defaultMessage="Reading {folder}…"
                description="Hint shown while the browser reads the selected skill folder"
                values={{ folder: value.uploadedFolderName }}
              />
            ) : uploadedFiles?.length ? (
              <FormattedMessage
                defaultMessage="Read {count, plural, one {# file} other {# files}} from {folder}."
                description="Hint confirming what was read out of the selected skill folder"
                values={{ count: uploadedFiles.length, folder: value.uploadedFolderName }}
              />
            ) : value.uploadedFolderName ? (
              <FormattedMessage
                defaultMessage="Reading {folder}. SKILL.md must sit at the root of the selected folder."
                description="Hint confirming the selected skill folder"
                values={{ folder: value.uploadedFolderName }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Select the directory containing SKILL.md."
                description="Hint prompting for a skill folder"
              />
            )}
          </FormUI.Hint>

          {/*
            Both of these warn rather than block. The folder name alone is still enough to
            register -- it was the whole input until the browser started reading -- so a
            failed read or a missing entry point degrades to what the flow did before,
            with the problem stated, instead of trapping the user behind a heuristic.
          */}
          {isMissingManifest && (
            <FormUI.Message
              type="warning"
              message={intl.formatMessage(
                {
                  defaultMessage: 'No SKILL.md at the root of {folder}. Clients resolve a skill through that file.',
                  description: 'Warning when the uploaded folder has no SKILL.md at its root',
                },
                { folder: value.uploadedFolderName },
              )}
            />
          )}
          {folderReadFailed && (
            <FormUI.Message
              type="warning"
              message={intl.formatMessage({
                defaultMessage:
                  'Could not read that folder, so no file listing or content digest was captured. Registering it will record the folder name only.',
                description: 'Warning when the browser fails to read the selected skill folder',
              })}
            />
          )}
        </div>
      )}
    </>
  );
};

/**
 * The `ref` and `subpath` half of a pointer registration, split out so the create form
 * can place it inside its advanced section while the location stays primary.
 *
 * Splitting rather than deleting matters: the 2026-09-01 review asked for a simpler
 * default, but these two fields are how a skill inside a MONOREPO is addressed, and
 * RFC-0008 PR #44 makes them the documented answer to a pasted browsing URL. Hiding
 * them by default is only safe because the form auto-opens the section whenever they
 * carry a value or the paste correction fills them.
 */
export const SkillSourceRefFields = ({
  componentId,
  value,
  onChange,
}: Pick<SkillSourceFieldsProps, 'componentId' | 'value' | 'onChange'>) => {
  const { theme } = useDesignSystemTheme();
  const update = (partial: Partial<SkillSourceInput>) => onChange({ ...value, ...partial });

  if (value.mode !== 'pointer') {
    return null;
  }

  return (
    <div css={{ display: 'flex', gap: theme.spacing.sm }}>
      {sourceTypeSupportsRef(value.sourceType) && (
        <div css={{ flex: 1 }}>
          <Field
            label={
              <FormattedMessage defaultMessage="Branch, tag or commit" description="Label for the source ref input" />
            }
            htmlFor={`${componentId}.ref`}
            hint={
              <FormattedMessage
                defaultMessage="Defaults to the repository's default branch."
                description="Hint for the git ref input"
              />
            }
          >
            <Input
              id={`${componentId}.ref`}
              componentId={`${componentId}.ref`}
              value={value.ref}
              onChange={(event) => update({ ref: event.target.value })}
              placeholder="main"
            />
          </Field>
        </div>
      )}
      <div css={{ flex: 1 }}>
        <Field
          label={
            <FormattedMessage
              defaultMessage="Path within the source"
              description="Label for the source subpath input"
            />
          }
          htmlFor={`${componentId}.subpath`}
          hint={
            <FormattedMessage
              defaultMessage="The directory holding SKILL.md. Leave blank if it is at the root."
              description="Hint for the source subpath input"
            />
          }
        >
          <Input
            id={`${componentId}.subpath`}
            componentId={`${componentId}.subpath`}
            value={value.subpath}
            onChange={(event) => update({ subpath: event.target.value })}
            placeholder="skills/my-skill"
          />
        </Field>
      </div>
    </div>
  );
};

/**
 * Starting state: no mode chosen, so the form shows the two options and nothing else.
 *
 * `sourceType` still starts on git even though no mode is selected. It is the type the
 * pointer flow lands on, and pre-selecting the most common one inside a mode the user has
 * already committed to is a different thing from pre-selecting the mode itself.
 */
export const EMPTY_SOURCE_INPUT: SkillSourceInput = {
  mode: undefined,
  sourceType: SkillSourceType.GIT,
  sourceUri: '',
  ref: '',
  subpath: '',
};

/**
 * Whether the source half of the form is complete enough to submit.
 *
 * No mode is not complete, and saying so here is what keeps the submit button disabled
 * while the form is still asking the first question.
 */
export const isSourceInputComplete = (source: SkillSourceInput): boolean => {
  if (source.mode === 'upload') {
    return Boolean(source.uploadedFolderName);
  }
  if (source.mode === 'pointer') {
    return source.sourceUri.trim().length > 0;
  }
  return false;
};
