import {
  Button,
  Checkbox,
  ChevronDownIcon,
  ChevronRightIcon,
  FormUI,
  Input,
  Modal,
  SegmentedControlButton,
  SegmentedControlGroup,
  SimpleSelect,
  SimpleSelectOption,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { parseSkillQualifiedName } from '../../skills-registry/constants';
import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { isValidEndpointUrl } from '../../mcp-registry/utils';
import { SkillIconField } from '../../skills-registry/components/SkillIconField';
import { SkillTagsEditor } from '../../skills-registry/components/SkillTagsEditor';
import { SkillSourceType } from '../../skills-registry/types';
import type { SkillTag } from '../../skills-registry/types';
import {
  AgentAnchorFields,
  EMPTY_ANCHOR_INPUT,
  EMPTY_SOURCE_POINTER,
  getImportableCard,
  isAnchorComplete,
} from '../components/AgentAnchorFields';
import type { AnchorInput } from '../components/AgentAnchorFields';
import { AgentBomPicker } from '../components/AgentBomPicker';
import { AgentRegisterSnippet } from '../components/AgentRegisterSnippet';
import { getAgentQualifiedName } from '../constants';
import { importCardMetadata } from '../mocks/agentCards';
import {
  addAgentVersion,
  agentNameExists,
  createAgent,
  getAgent,
  getLatestAgentVersion,
  nextMonotonicVersion,
} from '../mocks/agentsStore';
import type { AgentBom, AgentSourcePointer } from '../types';
import { AgentBindingProtocol, AgentStatus, AgentVersionScheme, EMPTY_BOM } from '../types';
import {
  CREATABLE_STATUSES,
  PROTOCOL_LABELS,
  VERSION_SCHEME_LABELS,
  formatStatusLabel,
  normalizeVersionForScheme,
} from '../utils';

const COMPONENT_ID = 'mlflow.agent-registry.agent-form';

export enum AgentFormModalMode {
  CreateAgent = 'CreateAgent',
  CreateAgentVersion = 'CreateAgentVersion',
}

enum RegisterSurface {
  FORM = 'form',
  CLI = 'cli',
  PYTHON = 'python',
}

interface AgentFormState {
  organization: string;
  name: string;
  description: string;
  anchor: AnchorInput;
  /** Whether to declare a BOM. Forced on for anchored records; a choice for interface-only ones. */
  declareComposition: boolean;
  bom: AgentBom;
  versionScheme: AgentVersionScheme;
  version: string;
  status: AgentStatus;
  tags: SkillTag[];
  icons: RegistryIcon[];
  displayName: string;
  /** An endpoint given with an anchored registration: sugar for a binding. */
  endpointUrl: string;
  endpointProtocol: AgentBindingProtocol;
}

const INITIAL_STATE: AgentFormState = {
  organization: '',
  name: '',
  description: '',
  anchor: EMPTY_ANCHOR_INPUT,
  declareComposition: true,
  bom: EMPTY_BOM,
  versionScheme: AgentVersionScheme.MONOTONIC,
  version: '',
  // RFC-0011: "MLflow creates an AgentVersion record with initial status draft".
  status: AgentStatus.DRAFT,
  tags: [],
  icons: [],
  displayName: '',
  endpointUrl: '',
  endpointProtocol: AgentBindingProtocol.A2A,
};

export interface UseAgentFormModalProps {
  mode: AgentFormModalMode;
  organization?: string;
  agentName?: string;
  onSuccess?: (result: { organization: string; name: string; version?: string }) => void;
}

/**
 * Register an agent, or add a version to one, in a modal -- the agent twin of the skill and
 * plugin form modals: Form / CLI / Python surface, identity first, the definitional anchor
 * second, the composition third, and everything optional behind the advanced toggle.
 *
 * RFC-0011's required set is name, description, and at least one anchor or an A2A
 * endpoint. Composition is required when an anchor is present and may be undeclared for an
 * interface-only record, which is why the BOM section is always shown for anchored
 * registrations and becomes a checkbox for endpoint-only ones: forcing a declaration there
 * would invite invented BOMs that pollute cross-registry queries.
 *
 * Version mode carries the previous version's anchors and BOM forward: a new version
 * realistically starts from the last bill of materials and changes part of it, and
 * carrying it over is what makes consecutive versions comparable. Under the monotonic
 * scheme the number is minted, so no version field is shown.
 */
export const useAgentFormModal = ({ mode, organization, agentName, onSuccess }: UseAgentFormModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AgentFormState>(INITIAL_STATE);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [versionError, setVersionError] = useState<string | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [surface, setSurface] = useState<RegisterSurface>(RegisterSurface.FORM);

  const isCreating = mode === AgentFormModalMode.CreateAgent;
  const isVersionMode = mode === AgentFormModalMode.CreateAgentVersion;
  const existing =
    isVersionMode && organization !== undefined && agentName ? getAgent(organization, agentName) : undefined;
  const scheme = isVersionMode ? (existing?.version_scheme ?? AgentVersionScheme.MONOTONIC) : values.versionScheme;
  const needsVersionInput = scheme !== AgentVersionScheme.MONOTONIC;

  // The organization is typed into Name as `@org/name` and split here
  // (2026-09-18-pdouble-round2-merge-rulings#3, #6). An agent's name is always the
  // registrant's, even when a card is imported, so this holds in every anchor mode.
  const scopedName = parseSkillQualifiedName(values.name.trim());
  const effectiveOrganization = isVersionMode ? (organization ?? '') : scopedName.organization;
  const effectiveName = isVersionMode ? (agentName ?? '') : scopedName.name;
  const qualifiedName = getAgentQualifiedName(effectiveOrganization, effectiveName);

  const setField = <K extends keyof AgentFormState>(key: K, value: AgentFormState[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const isEndpointOnly = values.anchor.mode === 'endpoint';
  const importedCard = isEndpointOnly ? getImportableCard(values.anchor) : undefined;
  const imported = importedCard ? importCardMetadata(importedCard) : undefined;
  const effectiveDescription = values.description.trim() || imported?.description || '';

  const openModal = () => {
    setNameError(undefined);
    setVersionError(undefined);
    setSurface(RegisterSurface.FORM);
    setShowAdvanced(false);
    const latest = existing ? getLatestAgentVersion(existing.organization, existing.name) : undefined;
    if (latest) {
      const anchor: AnchorInput = latest.harness
        ? {
            ...EMPTY_ANCHOR_INPUT,
            mode: 'harness',
            harnessName: latest.harness.name,
            harnessVersion: latest.harness.version ?? '',
            configFolderName: latest.config_snapshot ? `carried over from version ${latest.version}` : undefined,
            configFiles: latest.config_snapshot?.files ?? [],
          }
        : latest.sources.length
          ? {
              ...EMPTY_ANCHOR_INPUT,
              mode: 'source',
              sources: latest.sources.map((source) => ({
                sourceType: source.source_type as SkillSourceType,
                sourceUri: source.source,
                ref: source.ref ?? '',
                subpath: source.subpath ?? '',
              })),
            }
          : { ...EMPTY_ANCHOR_INPUT, mode: 'endpoint' };
      setValues({
        ...INITIAL_STATE,
        anchor,
        declareComposition: latest.composition === 'declared',
        bom: {
          skills: latest.bom.skills.map((ref) => ({ ...ref })),
          agent_plugins: latest.bom.agent_plugins.map((ref) => ({ ...ref })),
          mcp_servers: latest.bom.mcp_servers.map((ref) => ({ ...ref })),
          models: latest.bom.models.map((ref) => ({ ...ref })),
          agents: latest.bom.agents.map((ref) => ({ ...ref })),
        },
      });
    } else {
      setValues(INITIAL_STATE);
    }
    setOpen(true);
  };

  const duplicateNameMessage = (name: string) =>
    intl.formatMessage(
      {
        defaultMessage: 'An agent named "{name}" is already registered.',
        description: 'Agent registry > duplicate name error',
      },
      { name },
    );

  const handleNameBlur = () => {
    if (isCreating && effectiveName && agentNameExists(effectiveOrganization, effectiveName)) {
      setNameError(duplicateNameMessage(qualifiedName));
    }
  };

  const anchorComplete = isAnchorComplete(values.anchor);
  const isComplete =
    (isVersionMode || effectiveName.length > 0) &&
    effectiveDescription.length > 0 &&
    anchorComplete &&
    (!needsVersionInput || values.version.trim().length > 0);

  const snippetInput = useMemo(
    () => ({
      organization: effectiveOrganization,
      name: effectiveName,
      description: effectiveDescription,
      versionScheme: scheme,
      version: needsVersionInput ? values.version.trim() : undefined,
      sources:
        values.anchor.mode === 'source'
          ? values.anchor.sources.map((source) => ({
              sourceType: source.sourceType,
              sourceUri: source.sourceUri,
              ref: source.ref.trim() || undefined,
              subpath: source.subpath.trim() || undefined,
            }))
          : [],
      harness:
        values.anchor.mode === 'harness' && values.anchor.harnessName.trim()
          ? { name: values.anchor.harnessName.trim(), version: values.anchor.harnessVersion.trim() || undefined }
          : undefined,
      configSnapshotPath:
        values.anchor.mode === 'harness' && values.anchor.configFolderName
          ? `./${values.anchor.configFolderName}`
          : undefined,
      a2aEndpoint:
        values.anchor.mode === 'endpoint'
          ? values.anchor.endpointUrl.trim() || undefined
          : values.endpointProtocol === AgentBindingProtocol.A2A
            ? values.endpointUrl.trim() || undefined
            : undefined,
      bom: values.declareComposition || !isEndpointOnly ? values.bom : EMPTY_BOM,
      status: values.status,
    }),
    [effectiveOrganization, effectiveName, effectiveDescription, scheme, needsVersionInput, values, isEndpointOnly],
  );

  const handleSubmit = () => {
    if (isCreating && agentNameExists(effectiveOrganization, effectiveName)) {
      setNameError(duplicateNameMessage(qualifiedName));
      return;
    }
    const version = needsVersionInput ? normalizeVersionForScheme(scheme, values.version) : undefined;
    if (needsVersionInput && !version) {
      setVersionError(
        scheme === AgentVersionScheme.SEMVER
          ? intl.formatMessage({
              defaultMessage: 'Versions must be valid SemVer, for example 1.2.0.',
              description: 'Agent registry > invalid semver',
            })
          : intl.formatMessage({
              defaultMessage: 'A version is required under this scheme.',
              description: 'Agent registry > version required',
            }),
      );
      return;
    }

    const sources: AgentSourcePointer[] =
      values.anchor.mode === 'source'
        ? values.anchor.sources
            .filter((source) => source.sourceUri.trim())
            .map((source) => ({
              source_type: source.sourceType,
              source: source.sourceUri.trim(),
              ...(source.sourceType === SkillSourceType.GIT && source.ref.trim() ? { ref: source.ref.trim() } : {}),
              ...(source.subpath.trim() ? { subpath: source.subpath.trim() } : {}),
            }))
        : [];
    const resolvedVersion =
      version ?? (isVersionMode ? nextMonotonicVersion(effectiveOrganization, effectiveName) : '1');
    const configSnapshot =
      values.anchor.mode === 'harness' && values.anchor.configFiles.length
        ? {
            artifact_path: `mlflow-artifacts:/agents/${qualifiedName}/${resolvedVersion}/config/`,
            files: values.anchor.configFiles,
          }
        : undefined;
    const harness =
      values.anchor.mode === 'harness' && values.anchor.harnessName.trim()
        ? { name: values.anchor.harnessName.trim(), version: values.anchor.harnessVersion.trim() || undefined }
        : undefined;
    const endpoint =
      values.anchor.mode === 'endpoint'
        ? { url: values.anchor.endpointUrl.trim(), protocol: AgentBindingProtocol.A2A }
        : values.endpointUrl.trim()
          ? { url: values.endpointUrl.trim(), protocol: values.endpointProtocol }
          : undefined;
    const bom = isEndpointOnly && !values.declareComposition ? undefined : values.bom;

    const versionInput = { sources, configSnapshot, harness, bom, status: values.status, tags: values.tags, endpoint };

    if (isVersionMode) {
      const created = addAgentVersion({
        organization: effectiveOrganization,
        name: effectiveName,
        version,
        ...versionInput,
      });
      if (created) {
        setOpen(false);
        onSuccess?.({ organization: effectiveOrganization, name: effectiveName, version: created.version });
      }
      return;
    }

    const agent = createAgent({
      organization: effectiveOrganization,
      name: effectiveName,
      displayName: values.displayName.trim() || imported?.displayName,
      description: effectiveDescription,
      icons: values.icons.length ? values.icons : imported?.iconUrl ? [{ src: imported.iconUrl }] : undefined,
      versionScheme: values.versionScheme,
      version,
      ...versionInput,
    });
    if (agent) {
      setOpen(false);
      onSuccess?.({ organization: agent.organization, name: agent.name, version: agent.latest_version });
    }
  };

  const modalElement = (
    <Modal
      componentId={`${COMPONENT_ID}.modal`}
      visible={open}
      onCancel={() => setOpen(false)}
      title={
        isCreating ? (
          <FormattedMessage defaultMessage="Register agent" description="Header for the register agent modal" />
        ) : (
          <FormattedMessage
            defaultMessage="Add a version to {name}"
            description="Header for the add agent version modal"
            values={{ name: qualifiedName }}
          />
        )
      }
      okText={<FormattedMessage defaultMessage="Register" description="Confirm button in the agent form modal" />}
      cancelText={<FormattedMessage defaultMessage="Cancel" description="Cancel button in the agent form modal" />}
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
            <FormattedMessage defaultMessage="Form" description="Agent registry > register > form surface" />
          </SegmentedControlButton>
          <SegmentedControlButton value={RegisterSurface.CLI}>
            <FormattedMessage defaultMessage="CLI" description="Agent registry > register > CLI surface" />
          </SegmentedControlButton>
          <SegmentedControlButton value={RegisterSurface.PYTHON}>
            <FormattedMessage defaultMessage="Python" description="Agent registry > register > Python surface" />
          </SegmentedControlButton>
        </SegmentedControlGroup>

        {surface !== RegisterSurface.FORM ? (
          <AgentRegisterSnippet format={surface === RegisterSurface.CLI ? 'cli' : 'python'} input={snippetInput} />
        ) : (
          <>
            {isCreating ? (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <FormUI.Label htmlFor={`${COMPONENT_ID}.name`}>
                  <FormattedMessage defaultMessage="Name" description="Label for the agent name input" />
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
                  placeholder="billing-agent"
                  validationState={nameError ? 'error' : undefined}
                />
                {nameError ? (
                  <FormUI.Message type="error" message={nameError} />
                ) : (
                  <FormUI.Hint>
                    <FormattedMessage
                      defaultMessage="Scope to a single organization by adding it to the name, e.g. @my-org/my-agent-name. Chosen by you, even when importing a card."
                      description="Hint on the agent name input explaining organization scoping and that a card's name is not an identity"
                    />
                  </FormUI.Hint>
                )}
              </div>
            ) : (
              <Typography.Text color="secondary">
                <FormattedMessage
                  defaultMessage="Adding a version to {name}. Anchors and composition are carried over from the latest version; change what differs. Each version is an immutable snapshot."
                  description="Explains what an added agent version starts from"
                  values={{ name: qualifiedName }}
                />
              </Typography.Text>
            )}

            {isCreating && (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                <FormUI.Label htmlFor={`${COMPONENT_ID}.description`}>
                  <FormattedMessage defaultMessage="Description" description="Label for the agent description" />
                </FormUI.Label>
                <Input.TextArea
                  id={`${COMPONENT_ID}.description`}
                  componentId={`${COMPONENT_ID}.description`}
                  value={values.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder={
                    imported?.description ??
                    intl.formatMessage({
                      defaultMessage: 'What this agent does and when to use it.',
                      description: 'Placeholder for the agent description',
                    })
                  }
                  autoSize={{ minRows: 2 }}
                />
                <FormUI.Hint>
                  {imported ? (
                    <FormattedMessage
                      defaultMessage="Pre-filled from the card. Type to override it."
                      description="Hint when the description came from an A2A card"
                    />
                  ) : (
                    <FormattedMessage
                      defaultMessage="Required. The one human-readable field every consumer and agent reads first."
                      description="Hint for the agent description"
                    />
                  )}
                </FormUI.Hint>
              </div>
            )}

            <AgentAnchorFields
              componentId={`${COMPONENT_ID}.anchor`}
              value={values.anchor}
              onChange={(anchor) => setField('anchor', anchor)}
            />

            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                <Typography.Text bold>
                  <FormattedMessage defaultMessage="Composition" description="Heading for the BOM section" />
                </Typography.Text>
                {isEndpointOnly ? (
                  <Checkbox
                    componentId={`${COMPONENT_ID}.declare-composition`}
                    isChecked={values.declareComposition}
                    onChange={(checked) => setField('declareComposition', checked)}
                  >
                    <FormattedMessage
                      defaultMessage="Declare what this agent is made of"
                      description="Checkbox enabling the BOM for an interface-only record"
                    />
                  </Checkbox>
                ) : (
                  <Typography.Text color="secondary" size="sm">
                    <FormattedMessage
                      defaultMessage="Required with an anchor: the bill of materials is what makes cross-registry questions answerable."
                      description="Note that composition is required for anchored records"
                    />
                  </Typography.Text>
                )}
              </div>
              {isEndpointOnly && !values.declareComposition ? (
                <Typography.Text color="secondary" size="sm">
                  <FormattedMessage
                    defaultMessage="Recorded as undeclared, not as an empty dependency list. Blast-radius queries will report this agent alongside their matches rather than silently missing it."
                    description="Explanation of undeclared composition"
                  />
                </Typography.Text>
              ) : (
                <AgentBomPicker
                  componentId={`${COMPONENT_ID}.bom`}
                  value={values.bom}
                  onChange={(bom) => setField('bom', bom)}
                  excludeAgent={qualifiedName}
                />
              )}
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
                description="Toggle for the optional fields in the agent form"
              />
            </Button>

            {showAdvanced && (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div css={{ display: 'flex', gap: theme.spacing.sm }}>
                  {isCreating && (
                    <div css={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      <FormUI.Label htmlFor={`${COMPONENT_ID}.scheme`}>
                        <FormattedMessage
                          defaultMessage="Version scheme"
                          description="Label for the version scheme selector"
                        />
                      </FormUI.Label>
                      <SimpleSelect
                        id={`${COMPONENT_ID}.scheme`}
                        componentId={`${COMPONENT_ID}.scheme`}
                        value={values.versionScheme}
                        onChange={({ target }) => setField('versionScheme', target.value as AgentVersionScheme)}
                        label={intl.formatMessage({
                          defaultMessage: 'Version scheme',
                          description: 'Label for the version scheme selector',
                        })}
                      >
                        {Object.values(AgentVersionScheme).map((value) => (
                          <SimpleSelectOption key={value} value={value}>
                            {VERSION_SCHEME_LABELS[value]}
                          </SimpleSelectOption>
                        ))}
                      </SimpleSelect>
                      <FormUI.Hint>
                        <FormattedMessage
                          defaultMessage="Fixed for the agent's life. Monotonic mints numbers; the others take the version you supply."
                          description="Hint for the version scheme selector"
                        />
                      </FormUI.Hint>
                    </div>
                  )}
                  {needsVersionInput && (
                    <div css={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      <FormUI.Label htmlFor={`${COMPONENT_ID}.version`}>
                        <FormattedMessage defaultMessage="Version" description="Label for the agent version input" />
                      </FormUI.Label>
                      <Input
                        id={`${COMPONENT_ID}.version`}
                        componentId={`${COMPONENT_ID}.version`}
                        value={values.version}
                        onChange={(event) => {
                          setField('version', event.target.value);
                          setVersionError(undefined);
                        }}
                        placeholder={scheme === AgentVersionScheme.SEMVER ? '1.0.0' : '2026.09'}
                        validationState={versionError ? 'error' : undefined}
                      />
                      {versionError && <FormUI.Message type="error" message={versionError} />}
                    </div>
                  )}
                </div>
                {needsVersionInput && !showAdvanced && null}

                {isCreating && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.display-name`}>
                      <FormattedMessage defaultMessage="Display name" description="Label for the agent display name" />
                    </FormUI.Label>
                    <Input
                      id={`${COMPONENT_ID}.display-name`}
                      componentId={`${COMPONENT_ID}.display-name`}
                      value={values.displayName}
                      onChange={(event) => setField('displayName', event.target.value)}
                      placeholder={imported?.displayName ?? 'Billing Agent'}
                    />
                  </div>
                )}

                {isCreating && (
                  <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                    <FormUI.Label htmlFor={`${COMPONENT_ID}.icon.src`}>
                      <FormattedMessage defaultMessage="Icon" description="Label for the agent icon field" />
                    </FormUI.Label>
                    <SkillIconField
                      componentId={`${COMPONENT_ID}.icon`}
                      value={values.icons}
                      onChange={(icons) => setField('icons', icons)}
                    />
                  </div>
                )}

                {!isEndpointOnly && (
                  <div css={{ display: 'flex', gap: theme.spacing.sm }}>
                    <div css={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      <FormUI.Label htmlFor={`${COMPONENT_ID}.endpoint`}>
                        <FormattedMessage
                          defaultMessage="Endpoint"
                          description="Label for the optional endpoint at registration"
                        />
                      </FormUI.Label>
                      <Input
                        id={`${COMPONENT_ID}.endpoint`}
                        componentId={`${COMPONENT_ID}.endpoint`}
                        value={values.endpointUrl}
                        onChange={(event) => setField('endpointUrl', event.target.value)}
                        placeholder="https://agents.example.internal/billing"
                        validationState={
                          values.endpointUrl && !isValidEndpointUrl(values.endpointUrl.trim()) ? 'error' : undefined
                        }
                      />
                      <FormUI.Hint>
                        <FormattedMessage
                          defaultMessage="Optional. Sugar for creating an access binding on this version."
                          description="Hint for the optional endpoint at registration"
                        />
                      </FormUI.Hint>
                    </div>
                    <div css={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      <FormUI.Label htmlFor={`${COMPONENT_ID}.endpoint-protocol`}>
                        <FormattedMessage defaultMessage="Protocol" description="Label for the endpoint protocol" />
                      </FormUI.Label>
                      <SimpleSelect
                        id={`${COMPONENT_ID}.endpoint-protocol`}
                        componentId={`${COMPONENT_ID}.endpoint-protocol`}
                        value={values.endpointProtocol}
                        onChange={({ target }) => setField('endpointProtocol', target.value as AgentBindingProtocol)}
                        label={intl.formatMessage({
                          defaultMessage: 'Protocol',
                          description: 'Label for the endpoint protocol',
                        })}
                      >
                        {Object.values(AgentBindingProtocol).map((value) => (
                          <SimpleSelectOption key={value} value={value}>
                            {PROTOCOL_LABELS[value]}
                          </SimpleSelectOption>
                        ))}
                      </SimpleSelect>
                    </div>
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
                    onChange={({ target }) => setField('status', target.value as AgentStatus)}
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
                      defaultMessage="Draft while you iterate; promote to active once evaluated. Promotion is recorded, not gated."
                      description="Hint explaining the lifecycle status choices when registering an agent"
                    />
                  </FormUI.Hint>
                </div>

                <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                  <FormUI.Label htmlFor={`${COMPONENT_ID}.tags.key`}>
                    <FormattedMessage defaultMessage="Version tags" description="Label for the version tags editor" />
                  </FormUI.Label>
                  <SkillTagsEditor
                    componentId={`${COMPONENT_ID}.tags`}
                    value={values.tags}
                    onChange={(tags) => setField('tags', tags)}
                  />
                  <FormUI.Hint>
                    <FormattedMessage
                      defaultMessage="The catch-all for facts that fit no BOM axis. Editable later from the version pane."
                      description="Hint for the agent version tags editor"
                    />
                  </FormUI.Hint>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );

  return { AgentFormModal: modalElement, openModal };
};
