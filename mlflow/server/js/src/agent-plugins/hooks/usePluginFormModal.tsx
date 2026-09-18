import {
  Alert,
  Button,
  ChevronDownIcon,
  ChevronRightIcon,
  FormUI,
  Input,
  Modal,
  Radio,
  SegmentedControlButton,
  SegmentedControlGroup,
  SimpleSelect,
  SimpleSelectOption,
  Tag,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { SkillIconField } from '../../skills-registry/components/SkillIconField';
import { SkillTagsEditor } from '../../skills-registry/components/SkillTagsEditor';
import { SkillSourceType, SkillStatus } from '../../skills-registry/types';
import type { SkillTag } from '../../skills-registry/types';
import { AgentPluginMemberPicker } from '../components/AgentPluginMemberPicker';
import { AgentPluginRegisterSnippet } from '../components/AgentPluginRegisterSnippet';
import { AgentPluginSourceFields, EMPTY_PACKAGE_INPUT } from '../components/AgentPluginSourceFields';
import type { PluginPackageInput } from '../components/AgentPluginSourceFields';
import { parseSkillQualifiedName } from '../../skills-registry/constants';
import { getMemberUri, getPluginQualifiedName } from '../constants';
import { FORMAT_LABELS, usePackageIntrospection } from '../mocks/pluginPackages';
import type { MCPServerMemberInput, SkillMemberInput } from '../mocks/pluginsStore';
import {
  createAssembledPlugin,
  getLatestPluginVersion,
  importPackagedPlugin,
  pluginExists,
  pluginVersionExists,
  resolveMembers,
} from '../mocks/pluginsStore';
import { MEMBER_TYPE_MCP_SERVER, MEMBER_TYPE_SKILL, isMCPServerMember, isSkillMember } from '../types';
import {
  CREATABLE_STATUSES,
  formatMemberType,
  formatStatusLabel,
  getPluginVersionKind,
  normalizeSemver,
} from '../utils';

const COMPONENT_ID = 'mlflow.agent-plugins.plugin-form';

export enum PluginFormModalMode {
  CreatePlugin = 'CreatePlugin',
  CreatePluginVersion = 'CreatePluginVersion',
}

/** The two ways RFC-0008 registers a plugin version. Kind is per version, so both are offered in both modes. */
type RegistrationKind = 'assemble' | 'import';

enum RegisterSurface {
  FORM = 'form',
  CLI = 'cli',
  PYTHON = 'python',
}

interface PluginFormState {
  kind?: RegistrationKind;
  organization: string;
  name: string;
  description: string;
  version: string;
  packageInput: PluginPackageInput;
  skillMembers: SkillMemberInput[];
  mcpMembers: MCPServerMemberInput[];
  status: SkillStatus;
  tags: SkillTag[];
  icons: RegistryIcon[];
}

const INITIAL_STATE: PluginFormState = {
  kind: undefined,
  organization: '',
  name: '',
  description: '',
  version: '1.0.0',
  packageInput: EMPTY_PACKAGE_INPUT,
  skillMembers: [],
  mcpMembers: [],
  // RFC-0008 §Per-version status: `active` on create unless the caller asks otherwise.
  status: SkillStatus.ACTIVE,
  tags: [],
  icons: [],
};

export interface UsePluginFormModalProps {
  mode: PluginFormModalMode;
  organization?: string;
  pluginName?: string;
  onSuccess?: (result: { organization: string; name: string; version?: string }) => void;
}

/**
 * Create an agent plugin, or add a version to one, in a modal -- the plugin twin of
 * `useSkillFormModal`, with the same Form / CLI / Python surface and the same progressive
 * disclosure, and one thing skills do not have: a choice of registration kind.
 *
 * ASSEMBLE is RFC-0008's UI path ("add members by searching and selecting from registered
 * skills"): identity, a version, and the members. Each reference is resolved to a concrete
 * version and frozen; a skill with no active version cannot be a name-only member.
 *
 * IMPORT is a client-side operation the browser can only partly perform. The form takes
 * the package location and shows what inspection finds -- format, manifest, discovered
 * skills, other members, warnings -- for the packages this prototype knows, then registers
 * the plugin and its member skills in one step, as `POST /import` does. For a location it
 * cannot inspect it says so and points at the CLI and Python arms, which are the real
 * import surface, rather than registering a manifest it never saw.
 */
export const usePluginFormModal = ({ mode, organization, pluginName, onSuccess }: UsePluginFormModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<PluginFormState>(INITIAL_STATE);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [versionError, setVersionError] = useState<string | undefined>(undefined);
  const [sourceUriError, setSourceUriError] = useState<string | undefined>(undefined);
  const [memberErrors, setMemberErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [surface, setSurface] = useState<RegisterSurface>(RegisterSurface.FORM);

  const isCreatingPlugin = mode === PluginFormModalMode.CreatePlugin;
  const isVersionMode = mode === PluginFormModalMode.CreatePluginVersion;
  const isImport = values.kind === 'import';

  // Assemble mode: `@org/name` typed into Name is split (rulings-09-18#6). Import mode keeps
  // its own organization field, because its name comes from plugin.json.
  const scopedName = parseSkillQualifiedName(values.name.trim());
  const effectiveOrganization = isVersionMode
    ? (organization ?? '')
    : isImport
      ? values.organization.trim()
      : scopedName.organization;
  const effectiveName = isVersionMode ? (pluginName ?? '') : scopedName.name;

  const setField = <K extends keyof PluginFormState>(key: K, value: PluginFormState[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const introspection = usePackageIntrospection(
    isImport && values.packageInput.sourceUri.trim()
      ? {
          sourceType: values.packageInput.sourceType,
          source: values.packageInput.sourceUri,
          ref: values.packageInput.ref,
          subpath: values.packageInput.subpath,
        }
      : undefined,
  );
  const inspected = introspection?.status === 'inspected' ? introspection : undefined;
  const manifestVersion = inspected?.manifestVersion;

  /**
   * Seeded on open rather than at mount. In version mode the latest version decides the
   * starting kind: a packaged plugin most likely gets its next version from a re-import of
   * the same package, an assembled one from an edited member list.
   */
  const openModal = () => {
    setNameError(undefined);
    setVersionError(undefined);
    setSourceUriError(undefined);
    setMemberErrors([]);
    setSurface(RegisterSurface.FORM);
    setShowAdvanced(false);
    const latest =
      isVersionMode && organization !== undefined && pluginName
        ? getLatestPluginVersion(organization, pluginName)
        : undefined;
    if (
      latest &&
      getPluginVersionKind(latest.source) === 'packaged' &&
      latest.source.source_type !== SkillSourceType.MLFLOW
    ) {
      setValues({
        ...INITIAL_STATE,
        kind: 'import',
        version: '',
        packageInput: {
          sourceType: latest.source.source_type as SkillSourceType,
          sourceUri: latest.source.source ?? '',
          ref: latest.source.ref ?? '',
          subpath: latest.source.subpath ?? '',
        },
      });
    } else if (latest) {
      setValues({
        ...INITIAL_STATE,
        kind: 'assemble',
        version: latest.version,
        skillMembers: latest.members.filter(isSkillMember).map((m) => ({ name: m.name, version: m.version })),
        mcpMembers: latest.members.filter(isMCPServerMember).map((m) => ({ name: m.name, version: m.version })),
      });
    } else {
      setValues(INITIAL_STATE);
    }
    setOpen(true);
  };

  const duplicateNameMessage = (qualified: string) =>
    intl.formatMessage(
      {
        defaultMessage: 'An agent plugin named "{name}" is already registered.',
        description: 'Agent plugins > create plugin > duplicate name inline error',
      },
      { name: qualified },
    );

  const handleNameBlur = () => {
    const { organization: trimmedOrg, name: trimmedName } = parseSkillQualifiedName(values.name.trim());
    setNameError(
      isCreatingPlugin && trimmedName && pluginExists(trimmedOrg, trimmedName)
        ? duplicateNameMessage(getPluginQualifiedName(trimmedOrg, trimmedName))
        : undefined,
    );
  };

  const resolvedVersion = isImport ? (manifestVersion ?? values.version.trim()) : values.version.trim();

  const isComplete = !values.kind
    ? false
    : isImport
      ? Boolean(inspected) && Boolean(resolvedVersion) && (isVersionMode || Boolean(inspected?.name))
      : (isVersionMode || effectiveName.length > 0) && values.version.trim().length > 0;

  const snippetInput = useMemo(
    () =>
      isImport
        ? {
            kind: 'import' as const,
            import: {
              organization: effectiveOrganization,
              sourceType: values.packageInput.sourceType,
              sourceUri: values.packageInput.sourceUri.trim(),
              ref: values.packageInput.ref.trim() || undefined,
              subpath: values.packageInput.subpath.trim() || undefined,
              version: manifestVersion ? undefined : values.version.trim() || undefined,
            },
          }
        : {
            kind: 'assemble' as const,
            register: {
              organization: effectiveOrganization,
              name: effectiveName,
              version: values.version.trim(),
              skillUris: values.skillMembers.map((m) =>
                getMemberUri({ member_type: MEMBER_TYPE_SKILL, name: m.name, version: m.version }),
              ),
              mcpServerUris: values.mcpMembers.map((m) =>
                getMemberUri({ member_type: MEMBER_TYPE_MCP_SERVER, name: m.name, version: m.version }),
              ),
              status: values.status,
            },
          },
    [isImport, effectiveOrganization, effectiveName, values, manifestVersion],
  );

  const handleSubmit = () => {
    if (!values.kind) {
      return;
    }
    const normalized = normalizeSemver(resolvedVersion);
    if (!normalized) {
      setVersionError(
        intl.formatMessage({
          defaultMessage: 'Versions must be valid SemVer, for example 1.0.0. Semverish values like 1.0 are normalized.',
          description: 'Agent plugins > invalid version error',
        }),
      );
      return;
    }
    if (
      pluginVersionExists(
        effectiveOrganization,
        isImport ? (inspected?.name ?? effectiveName) : effectiveName,
        normalized,
      )
    ) {
      setVersionError(
        intl.formatMessage(
          {
            defaultMessage: 'Version {version} is already registered. A manifest is immutable once stored.',
            description: 'Agent plugins > duplicate version error',
          },
          { version: normalized },
        ),
      );
      return;
    }

    if (isImport) {
      if (!inspected) {
        setSourceUriError(
          intl.formatMessage({
            defaultMessage: 'A package location this browser can inspect is required.',
            description: 'Agent plugins > required package location error',
          }),
        );
        return;
      }
      const plugin = importPackagedPlugin({
        organization: effectiveOrganization,
        pluginName: isVersionMode ? pluginName : undefined,
        version: normalized,
        source: {
          sourceType: values.packageInput.sourceType,
          source: values.packageInput.sourceUri,
          ref: values.packageInput.ref,
          subpath: values.packageInput.subpath,
        },
        introspection: inspected,
        status: values.status,
        tags: values.tags,
        icons: values.icons,
      });
      if (plugin) {
        setOpen(false);
        onSuccess?.({ organization: plugin.organization, name: plugin.name, version: normalized });
      }
      return;
    }

    if (isCreatingPlugin && pluginExists(effectiveOrganization, effectiveName)) {
      setNameError(duplicateNameMessage(getPluginQualifiedName(effectiveOrganization, effectiveName)));
      return;
    }
    const { members, errors } = resolveMembers(values.skillMembers, values.mcpMembers);
    if (errors.length) {
      setMemberErrors(errors);
      return;
    }
    const plugin = createAssembledPlugin({
      organization: effectiveOrganization,
      name: effectiveName,
      description: values.description,
      version: normalized,
      members,
      status: values.status,
      tags: values.tags,
      icons: values.icons,
    });
    if (plugin) {
      setOpen(false);
      onSuccess?.({ organization: plugin.organization, name: plugin.name, version: normalized });
    }
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={
        isCreatingPlugin ? (
          <FormattedMessage defaultMessage="Create agent plugin" description="Header for the create plugin modal" />
        ) : (
          <FormattedMessage
            defaultMessage="Add a version to {name}"
            description="Header for the add plugin version modal"
            values={{ name: getPluginQualifiedName(organization ?? '', pluginName ?? '') }}
          />
        )
      }
      okText={
        isImport ? (
          <FormattedMessage
            defaultMessage="Import"
            description="Confirm button in the plugin form modal, import kind"
          />
        ) : (
          <FormattedMessage defaultMessage="Create" description="Confirm button in the plugin form modal" />
        )
      }
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the plugin form modal" />}
      okButtonProps={{ disabled: !isComplete || surface !== RegisterSurface.FORM }}
      onOk={handleSubmit}
      size="wide"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <SegmentedControlGroup
          name={`${COMPONENT_ID}.surface`}
          componentId={`${COMPONENT_ID}.surface`}
          value={surface}
          onChange={(event) => setSurface(event.target.value as RegisterSurface)}
        >
          <SegmentedControlButton value={RegisterSurface.FORM}>
            <FormattedMessage defaultMessage="Form" description="Agent plugins > create > form surface" />
          </SegmentedControlButton>
          <SegmentedControlButton value={RegisterSurface.CLI}>
            <FormattedMessage defaultMessage="CLI" description="Agent plugins > create > CLI surface" />
          </SegmentedControlButton>
          <SegmentedControlButton value={RegisterSurface.PYTHON}>
            <FormattedMessage defaultMessage="Python" description="Agent plugins > create > Python surface" />
          </SegmentedControlButton>
        </SegmentedControlGroup>

        {surface !== RegisterSurface.FORM ? (
          <AgentPluginRegisterSnippet
            format={surface === RegisterSurface.CLI ? 'cli' : 'python'}
            input={snippetInput}
          />
        ) : (
          <>
            {/*
              Name first: it is the one required identity field, so it sits at the top rather
              than after a choice (demo-prep#28). The organization is typed into it as
              `@org/name` and split on the way out (2026-09-18-pdouble-round2-merge-rulings#3, #6).
              In Import mode the name comes from plugin.json, so the field shows what
              introspection found and is not editable.
            */}
            {isCreatingPlugin && (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <FormUI.Label htmlFor={`${COMPONENT_ID}.name`}>
                  <FormattedMessage defaultMessage="Name" description="Label for the plugin name input" />
                </FormUI.Label>
                <Input
                  id={`${COMPONENT_ID}.name`}
                  componentId={`${COMPONENT_ID}.name`}
                  value={isImport ? (inspected?.name ?? '') : values.name}
                  disabled={isImport}
                  onChange={(event) => {
                    setField('name', event.target.value);
                    setNameError(undefined);
                  }}
                  onBlur={handleNameBlur}
                  placeholder={isImport ? undefined : 'pr-workflow'}
                  validationState={nameError ? 'error' : undefined}
                />
                {nameError ? (
                  <FormUI.Message type="error" message={nameError} />
                ) : isImport ? (
                  <FormUI.Hint>
                    <FormattedMessage
                      defaultMessage="Taken from the package's plugin.json."
                      description="Hint on the plugin name input in import mode"
                    />
                  </FormUI.Hint>
                ) : (
                  <FormUI.Hint>
                    <FormattedMessage
                      defaultMessage="Scope to a single organization by adding it to the name, e.g. @my-org/my-plugin-name."
                      description="Hint on the plugin name input explaining that an organization can scope the name"
                    />
                  </FormUI.Hint>
                )}
              </div>
            )}

            {/*
              The registration kind as vertical radios, each with its own description, and each
              option's fields revealed directly beneath it, indented to hang under its text
              (demo-prep#21-#25). Nothing is preselected on create, so submit stays disabled
              until a choice is made; version mode is seeded from the latest version's kind.
              Still offered in version mode: RFC-0008 lets a plugin migrate between authoring
              styles under a stable name. The heading stays "Content", not "Source": an
              assembled version has no plugin-level source (RFC-0008).
            */}
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              <FormUI.Label>
                <FormattedMessage defaultMessage="Content" description="Label for how plugin content is supplied" />
              </FormUI.Label>
              <Radio.Group
                name={`${COMPONENT_ID}.kind`}
                componentId={`${COMPONENT_ID}.kind`}
                value={values.kind ?? ''}
                onChange={(event) => {
                  setField('kind', event.target.value as RegistrationKind);
                  setVersionError(undefined);
                  setMemberErrors([]);
                  setNameError(undefined);
                }}
                layout="vertical"
              >
                <Radio value="assemble">
                  <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormattedMessage
                      defaultMessage="Assemble from registered members"
                      description="Agent plugins > registration kind > assemble option"
                    />
                    <Typography.Text size="sm" color="secondary">
                      <FormattedMessage
                        defaultMessage="No package of its own. Each member keeps its independent source, and pull fetches them one by one."
                        description="Explanation of the assemble registration kind"
                      />
                    </Typography.Text>
                  </div>
                </Radio>
                {values.kind === 'assemble' && (
                  <div
                    css={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: theme.spacing.md,
                      paddingLeft: theme.spacing.lg,
                      paddingBottom: theme.spacing.sm,
                    }}
                  >
                    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, maxWidth: 200 }}>
                      <FormUI.Label htmlFor={`${COMPONENT_ID}.version`}>
                        <FormattedMessage defaultMessage="Version" description="Label for the plugin version input" />
                      </FormUI.Label>
                      <Input
                        id={`${COMPONENT_ID}.version`}
                        componentId={`${COMPONENT_ID}.version`}
                        value={values.version}
                        onChange={(event) => {
                          setField('version', event.target.value);
                          setVersionError(undefined);
                        }}
                        placeholder="1.0.0"
                        validationState={versionError ? 'error' : undefined}
                      />
                      {versionError ? (
                        <FormUI.Message type="error" message={versionError} />
                      ) : (
                        <FormUI.Hint>
                          <FormattedMessage
                            defaultMessage="SemVer, written into the synthesized manifest. Only the publisher knows whether a change is a patch or a major."
                            description="Hint for the plugin version input in assemble mode"
                          />
                        </FormUI.Hint>
                      )}
                    </div>

                    <AgentPluginMemberPicker
                      componentId={`${COMPONENT_ID}.members`}
                      skills={values.skillMembers}
                      mcpServers={values.mcpMembers}
                      onSkillsChange={(skillMembers) => {
                        setField('skillMembers', skillMembers);
                        setMemberErrors([]);
                      }}
                      onMCPServersChange={(mcpMembers) => setField('mcpMembers', mcpMembers)}
                    />

                    {memberErrors.length > 0 && (
                      <Alert
                        componentId={`${COMPONENT_ID}.member-errors`}
                        type="error"
                        closable={false}
                        message={intl.formatMessage({
                          defaultMessage: 'Members could not be resolved',
                          description: 'Agent plugins > assemble > member resolution error title',
                        })}
                        description={memberErrors.join(' ')}
                      />
                    )}
                  </div>
                )}
                <Radio value="import">
                  <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormattedMessage
                      defaultMessage="Import a package"
                      description="Agent plugins > registration kind > import option"
                    />
                    <Typography.Text size="sm" color="secondary">
                      <FormattedMessage
                        defaultMessage="The package is fetched and inspected in the client; its skills are registered with it, each pointing back into the package."
                        description="Explanation of the import registration kind"
                      />
                    </Typography.Text>
                  </div>
                </Radio>
                {isImport && (
                  <div
                    css={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: theme.spacing.md,
                      paddingLeft: theme.spacing.lg,
                    }}
                  >
                    <AgentPluginSourceFields
                      componentId={COMPONENT_ID}
                      value={values.packageInput}
                      onChange={(packageInput) => setField('packageInput', packageInput)}
                      sourceUriError={sourceUriError}
                      onSourceUriChange={() => {
                        setSourceUriError(undefined);
                        setVersionError(undefined);
                      }}
                    />

                    {/*
                      Organization stays a field of its own in Import mode, under the package
                      location: there is no name input to type `@org/` into, because the name
                      comes from plugin.json (owner ruling 2026-09-18,
                      2026-09-18-pdouble-agent-plugins-replay#6).
                    */}
                    {isCreatingPlugin && (
                      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, maxWidth: 280 }}>
                        <FormUI.Label htmlFor={`${COMPONENT_ID}.import-organization`}>
                          <FormattedMessage
                            defaultMessage="Organization"
                            description="Label for the organization input"
                          />
                        </FormUI.Label>
                        <Input
                          id={`${COMPONENT_ID}.import-organization`}
                          componentId={`${COMPONENT_ID}.import-organization`}
                          value={values.organization}
                          onChange={(event) => setField('organization', event.target.value)}
                          placeholder="ai5-marketplace"
                        />
                        <FormUI.Hint>
                          <FormattedMessage
                            defaultMessage="Optional. The namespace the plugin and its skills register into; never written into the manifest."
                            description="Hint for the organization input in import mode"
                          />
                        </FormUI.Hint>
                      </div>
                    )}

                    {introspection?.status === 'not-inspectable' && (
                      <Alert
                        componentId={`${COMPONENT_ID}.not-inspectable`}
                        type="warning"
                        closable={false}
                        message={intl.formatMessage({
                          defaultMessage: 'This location cannot be inspected from the browser',
                          description: 'Agent plugins > import > not inspectable alert title',
                        })}
                        description={introspection.reason}
                      />
                    )}

                    {inspected && (
                      <div
                        css={{
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borders.borderRadiusMd,
                          padding: theme.spacing.md,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: theme.spacing.sm,
                        }}
                      >
                        <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                          <Typography.Text bold>
                            <FormattedMessage
                              defaultMessage="Introspection"
                              description="Agent plugins > import > introspection preview heading"
                            />
                          </Typography.Text>
                          <Tag componentId={`${COMPONENT_ID}.format-tag`} color="turquoise">
                            {FORMAT_LABELS[inspected.format]}
                          </Tag>
                          <Typography.Text color="secondary" size="sm">
                            <FormattedMessage
                              defaultMessage="{name} {version}"
                              description="Agent plugins > import > detected name and version"
                              values={{
                                name: getPluginQualifiedName(
                                  effectiveOrganization,
                                  isVersionMode ? effectiveName : inspected.name,
                                ),
                                version: manifestVersion ?? '',
                              }}
                            />
                          </Typography.Text>
                        </div>
                        <Typography.Text size="sm">
                          <FormattedMessage
                            defaultMessage="Discovered {count, plural, =0 {no skills} one {# skill} other {# skills}}"
                            description="Agent plugins > import > discovered skill count"
                            values={{ count: inspected.skills.length }}
                          />
                          {inspected.otherMembers.length > 0 && (
                            <FormattedMessage
                              defaultMessage=" and {others, plural, one {# other member} other {# other members}}"
                              description="Agent plugins > import > discovered other member count"
                              values={{ others: inspected.otherMembers.length }}
                            />
                          )}
                          .
                        </Typography.Text>
                        <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                          {inspected.skills.map((skill) => (
                            <Tag
                              key={`skill:${skill.name}`}
                              componentId={`${COMPONENT_ID}.discovered-skill`}
                              color="purple"
                            >
                              {`skill: ${skill.name}`}
                            </Tag>
                          ))}
                          {inspected.otherMembers.map((member) => (
                            <Tag
                              key={`${member.member_type}:${member.name}`}
                              componentId={`${COMPONENT_ID}.discovered-member`}
                              color={member.member_type === MEMBER_TYPE_MCP_SERVER ? 'teal' : 'charcoal'}
                            >
                              {`${formatMemberType(member.member_type).toLowerCase()}: ${member.name}`}
                            </Tag>
                          ))}
                        </div>
                        {inspected.warnings.map((warning) => (
                          <Typography.Text key={warning} size="sm" color="secondary">
                            {warning}
                          </Typography.Text>
                        ))}
                      </div>
                    )}

                    {inspected && !manifestVersion && (
                      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, maxWidth: 200 }}>
                        <FormUI.Label htmlFor={`${COMPONENT_ID}.import-version`}>
                          <FormattedMessage defaultMessage="Version" description="Label for the plugin version input" />
                        </FormUI.Label>
                        <Input
                          id={`${COMPONENT_ID}.import-version`}
                          componentId={`${COMPONENT_ID}.import-version`}
                          value={values.version}
                          onChange={(event) => {
                            setField('version', event.target.value);
                            setVersionError(undefined);
                          }}
                          placeholder="1.0.0"
                          validationState={versionError ? 'error' : undefined}
                        />
                        {versionError ? (
                          <FormUI.Message type="error" message={versionError} />
                        ) : (
                          <FormUI.Hint>
                            <FormattedMessage
                              defaultMessage="The manifest declares no version, so one must be supplied."
                              description="Hint for the plugin version input in import mode"
                            />
                          </FormUI.Hint>
                        )}
                      </div>
                    )}
                    {inspected && manifestVersion && versionError && (
                      <FormUI.Message type="error" message={versionError} />
                    )}
                  </div>
                )}
              </Radio.Group>
            </div>

            <Button
              componentId={`${COMPONENT_ID}.toggle_advanced`}
              type="link"
              onClick={() => setShowAdvanced(!showAdvanced)}
              icon={showAdvanced ? <ChevronDownIcon /> : <ChevronRightIcon />}
              css={{ padding: 0, alignSelf: 'flex-start' }}
            >
              <FormattedMessage
                defaultMessage="Advanced settings (optional)"
                description="Toggle for the optional fields in the plugin create modal"
              />
            </Button>

            {showAdvanced && (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {isCreatingPlugin && !isImport && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
                      <FormattedMessage defaultMessage="Description" description="Label for the plugin description" />
                    </FormUI.Label>
                    <Input.TextArea
                      id={`${COMPONENT_ID}.description`}
                      componentId={`${COMPONENT_ID}.description`}
                      value={values.description}
                      onChange={(event) => setField('description', event.target.value)}
                      placeholder={intl.formatMessage({
                        defaultMessage: 'What this plugin bundles and who it is for.',
                        description: 'Placeholder for the plugin description input',
                      })}
                      autoSize={{ minRows: 2 }}
                    />
                  </div>
                )}

                {isCreatingPlugin && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.icon.src`}>
                      <FormattedMessage defaultMessage="Icon" description="Label for the plugin icon field" />
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
                      description="Hint explaining the lifecycle status choices when registering a plugin version"
                    />
                  </FormUI.Hint>
                </div>

                {isCreatingPlugin && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.tags.key`}>
                      <FormattedMessage defaultMessage="Tags" description="Label for the plugin tags editor" />
                    </FormUI.Label>
                    <SkillTagsEditor
                      componentId={`${COMPONENT_ID}.tags`}
                      value={values.tags}
                      onChange={(tags) => setField('tags', tags)}
                    />
                    <FormUI.Hint>
                      <FormattedMessage
                        defaultMessage="Key/value metadata you can filter the registry by. Manifest keywords stay separate and immutable."
                        description="Hint for the plugin tags editor"
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

  return { PluginFormModal: modalElement, openModal };
};
