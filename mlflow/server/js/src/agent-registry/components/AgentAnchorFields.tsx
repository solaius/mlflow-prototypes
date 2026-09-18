import {
  Radio,
  Alert,
  Button,
  FormUI,
  Input,
  PlusIcon,
  SimpleSelect,
  SimpleSelectOption,
  Tag,
  TrashIcon,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { isValidEndpointUrl } from '../../mcp-registry/utils';
import { SkillSourceType } from '../../skills-registry/types';
import {
  POINTER_SOURCE_TYPES,
  SOURCE_PLACEHOLDERS,
  SOURCE_TYPE_LABELS,
  inferSourceType,
  sourceTypeSupportsRef,
} from '../../skills-registry/utils';
import { fetchAgentCard, importCardMetadata } from '../mocks/agentCards';
import type { AgentCardFetch } from '../mocks/agentCards';
import type { A2AAgentCard } from '../types';

/** One typed source pointer as the form collects it. */
export interface SourcePointerInput {
  sourceType: SkillSourceType;
  sourceUri: string;
  ref: string;
  subpath: string;
}

export const EMPTY_SOURCE_POINTER: SourcePointerInput = {
  sourceType: SkillSourceType.GIT,
  sourceUri: '',
  ref: '',
  subpath: '',
};

/** The three registration paths RFC-0011 describes, as the form's primary choice. */
export type AnchorMode = 'source' | 'harness' | 'endpoint';

export interface AnchorInput {
  /** Unset until the registrant chooses: nothing is preselected on create (demo-prep#22). */
  mode?: AnchorMode;
  sources: SourcePointerInput[];
  harnessName: string;
  harnessVersion: string;
  /** The folder the registrant picked, and the files the browser read from it. */
  configFolderName?: string;
  configFiles: { path: string; size_bytes: number; content?: string }[];
  endpointUrl: string;
  /** What fetching the endpoint's well-known card returned, if it was fetched. */
  cardFetch?: AgentCardFetch;
  /** A card the registrant pasted, for endpoints the browser cannot fetch. */
  pastedCard?: A2AAgentCard;
  pastedCardError?: string;
}

export const EMPTY_ANCHOR_INPUT: AnchorInput = {
  mode: undefined,
  sources: [EMPTY_SOURCE_POINTER],
  harnessName: '',
  harnessVersion: '',
  configFiles: [],
  endpointUrl: '',
};

/** The card an endpoint registration will import from, however it arrived. */
export const getImportableCard = (input: AnchorInput): A2AAgentCard | undefined =>
  input.pastedCard ?? (input.cardFetch?.status === 'ok' ? input.cardFetch.card : undefined);

/** Whether the anchor half of the form is complete enough to register. */
export const isAnchorComplete = (input: AnchorInput): boolean => {
  if (!input.mode) {
    return false;
  }
  if (input.mode === 'source') {
    return input.sources.some((source) => source.sourceUri.trim().length > 0);
  }
  if (input.mode === 'harness') {
    return input.harnessName.trim().length > 0 && input.configFiles.length > 0;
  }
  return isValidEndpointUrl(input.endpointUrl.trim());
};

const Field = ({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { theme } = useDesignSystemTheme();
  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      {/* Hint-styled: these are secondary labels inside a radio reveal (demo-prep#24). */}
      <FormUI.Label
        htmlFor={htmlFor}
        css={{
          '&&': {
            color: theme.colors.textSecondary,
            fontWeight: theme.typography.typographyRegularFontWeight,
            fontSize: theme.typography.fontSizeSm,
            lineHeight: theme.typography.lineHeightSm,
          },
        }}
      >
        {label}
      </FormUI.Label>
      {children}
      {hint && <FormUI.Hint>{hint}</FormUI.Hint>}
    </div>
  );
};

/**
 * "How is this agent defined?" -- the definitional anchor, which RFC-0011 makes the one
 * required thing beyond a name and description.
 *
 *   Source      one or more typed pointers, the natural anchor for framework-built and
 *               custom agents; several are allowed (the repo it is built from and the image
 *               it ships as), the RFC's deliberate divergence from one-source skills.
 *   Harness     for agents that are a packaged harness plus configuration: a harness
 *               reference and a configuration snapshot read from disk, stored as an
 *               immutable artifact. The browser reads the folder, so the snapshot is real.
 *   Endpoint    an A2A endpoint. The browser fetches the card when the endpoint permits, or
 *               the registrant pastes it, since the server never fetches; the card's
 *               description and free-form name are imported, the card is not stored, and
 *               the registration is interface-only unless a source is added too.
 */
export const AgentAnchorFields = ({
  componentId,
  value,
  onChange,
}: {
  componentId: string;
  value: AnchorInput;
  onChange: (value: AnchorInput) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const update = (partial: Partial<AnchorInput>) => onChange({ ...value, ...partial });

  const updateSource = (index: number, partial: Partial<SourcePointerInput>) =>
    update({
      sources: value.sources.map((source, i) => {
        if (i !== index) {
          return source;
        }
        const next = { ...source, ...partial };
        if (partial.sourceUri !== undefined) {
          const inferred = inferSourceType(partial.sourceUri);
          if (inferred && inferred !== source.sourceType) {
            next.sourceType = inferred;
          }
        }
        return next;
      }),
    });

  const handleFetchCard = () => {
    const url = value.endpointUrl.trim();
    if (!isValidEndpointUrl(url)) {
      return;
    }
    update({ cardFetch: fetchAgentCard(url), pastedCard: undefined, pastedCardError: undefined });
  };

  const handlePasteCard = (text: string) => {
    if (!text.trim()) {
      update({ pastedCard: undefined, pastedCardError: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(text) as A2AAgentCard;
      update({ pastedCard: parsed, pastedCardError: undefined, cardFetch: undefined });
    } catch (error) {
      update({ pastedCard: undefined, pastedCardError: error instanceof Error ? error.message : String(error) });
    }
  };

  const importable = getImportableCard(value);
  const imported = importable ? importCardMetadata(importable) : undefined;

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {/*
        The anchor choice as vertical radios, each carrying its own description, with the
        chosen option's fields revealed directly beneath it and indented to hang under its
        text (demo-prep#21-#25). Nothing is preselected on create; version mode is seeded
        from the latest version's anchor, a choice already made for this agent.
      */}
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <FormUI.Label>
          <FormattedMessage
            defaultMessage="How is this agent defined?"
            description="Label for the anchor mode selector"
          />
        </FormUI.Label>
        <Radio.Group
          name={`${componentId}.mode`}
          componentId={`${componentId}.mode`}
          value={value.mode ?? ''}
          onChange={(event) => update({ mode: event.target.value as AnchorMode })}
          layout="vertical"
        >
          <Radio value="source">
            <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormattedMessage defaultMessage="Source" description="Anchor mode: source" />
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="The repository it is built from, the image it ships as, or both. Recorded, never fetched."
                  description="Hint for the source anchor mode"
                />
              </Typography.Text>
            </div>
          </Radio>
          <div css={{ paddingLeft: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
            {value.mode === 'source' && (
              <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {value.sources.map((source, index) => (
                  <div
                    key={index}
                    css={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: theme.spacing.sm,
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borders.borderRadiusMd,
                    }}
                  >
                    <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
                      {/* Source type above location, stacked (demo-prep#24). */}
                      <div
                        css={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}
                      >
                        <div css={{ maxWidth: 200 }}>
                          <Field
                            label={
                              <FormattedMessage
                                defaultMessage="Source type"
                                description="Label for a source pointer type"
                              />
                            }
                          >
                            <SimpleSelect
                              id={`${componentId}.source-${index}.type`}
                              componentId={`${componentId}.source.type`}
                              value={source.sourceType}
                              onChange={({ target }) =>
                                updateSource(index, { sourceType: target.value as SkillSourceType })
                              }
                              label={intl.formatMessage({
                                defaultMessage: 'Source type',
                                description: 'Label for a source pointer type',
                              })}
                            >
                              {POINTER_SOURCE_TYPES.map((sourceType) => (
                                <SimpleSelectOption key={sourceType} value={sourceType}>
                                  {SOURCE_TYPE_LABELS[sourceType]}
                                </SimpleSelectOption>
                              ))}
                            </SimpleSelect>
                          </Field>
                        </div>
                        <div css={{ minWidth: 0 }}>
                          <Field
                            label={
                              <FormattedMessage
                                defaultMessage="Location"
                                description="Label for a source pointer location"
                              />
                            }
                          >
                            <Input
                              id={`${componentId}.source-${index}.uri`}
                              componentId={`${componentId}.source.uri`}
                              value={source.sourceUri}
                              onChange={(event) => updateSource(index, { sourceUri: event.target.value })}
                              placeholder={SOURCE_PLACEHOLDERS[source.sourceType].replace(
                                'skills-developer',
                                'billing-agent',
                              )}
                            />
                          </Field>
                        </div>
                      </div>
                      {value.sources.length > 1 && (
                        <Button
                          componentId={`${componentId}.source.remove`}
                          icon={<TrashIcon />}
                          type="tertiary"
                          aria-label={intl.formatMessage({
                            defaultMessage: 'Remove source',
                            description: 'Aria label for the remove source button',
                          })}
                          onClick={() => update({ sources: value.sources.filter((_, i) => i !== index) })}
                        />
                      )}
                    </div>
                    <div css={{ display: 'flex', gap: theme.spacing.sm }}>
                      {sourceTypeSupportsRef(source.sourceType) && (
                        <div css={{ flex: 1 }}>
                          <Field
                            label={
                              <FormattedMessage
                                defaultMessage="Branch, tag or commit"
                                description="Label for a source pointer ref"
                              />
                            }
                          >
                            <Input
                              id={`${componentId}.source-${index}.ref`}
                              componentId={`${componentId}.source.ref`}
                              value={source.ref}
                              onChange={(event) => updateSource(index, { ref: event.target.value })}
                              placeholder="8f4e2a1"
                            />
                          </Field>
                        </div>
                      )}
                      <div css={{ flex: 1 }}>
                        <Field
                          label={
                            <FormattedMessage
                              defaultMessage="Path within the source"
                              description="Label for a source pointer subpath"
                            />
                          }
                        >
                          <Input
                            id={`${componentId}.source-${index}.subpath`}
                            componentId={`${componentId}.source.subpath`}
                            value={source.subpath}
                            onChange={(event) => updateSource(index, { subpath: event.target.value })}
                            placeholder="agents/billing"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  componentId={`${componentId}.source.add`}
                  type="link"
                  icon={<PlusIcon />}
                  css={{ alignSelf: 'flex-start', padding: 0 }}
                  onClick={() => update({ sources: [...value.sources, EMPTY_SOURCE_POINTER] })}
                >
                  <FormattedMessage
                    defaultMessage="Add another source"
                    description="Button adding a second source pointer"
                  />
                </Button>
              </div>
            )}
          </div>
          <Radio value="harness">
            <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormattedMessage defaultMessage="Harness and configuration" description="Anchor mode: harness" />
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="A packaged harness plus the configuration that makes it this agent. The configuration is stored as an immutable artifact."
                  description="Hint for the harness anchor mode"
                />
              </Typography.Text>
            </div>
          </Radio>
          <div css={{ paddingLeft: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
            {value.mode === 'harness' && (
              <>
                <div css={{ display: 'flex', gap: theme.spacing.sm }}>
                  <div css={{ flex: 1 }}>
                    <Field
                      label={<FormattedMessage defaultMessage="Harness" description="Label for the harness name" />}
                      htmlFor={`${componentId}.harness`}
                      hint={
                        <FormattedMessage
                          defaultMessage="An open vocabulary: opencode, claude-code, goose. Known names are normalized."
                          description="Hint for the harness name"
                        />
                      }
                    >
                      <Input
                        id={`${componentId}.harness`}
                        componentId={`${componentId}.harness`}
                        value={value.harnessName}
                        onChange={(event) => update({ harnessName: event.target.value })}
                        placeholder="opencode"
                      />
                    </Field>
                  </div>
                  <div css={{ flex: '0 0 160px' }}>
                    <Field
                      label={
                        <FormattedMessage
                          defaultMessage="Harness version"
                          description="Label for the harness version"
                        />
                      }
                      htmlFor={`${componentId}.harness-version`}
                    >
                      <Input
                        id={`${componentId}.harness-version`}
                        componentId={`${componentId}.harness-version`}
                        value={value.harnessVersion}
                        onChange={(event) => update({ harnessVersion: event.target.value })}
                        placeholder="0.5.3"
                      />
                    </Field>
                  </div>
                </div>
                <Field
                  label={
                    <FormattedMessage
                      defaultMessage="Configuration snapshot"
                      description="Label for the configuration snapshot folder"
                    />
                  }
                  htmlFor={`${componentId}.config`}
                  hint={
                    value.configFolderName ? (
                      <FormattedMessage
                        defaultMessage="Read {count, plural, one {# file} other {# files}} from {folder}. Redact secrets before uploading: the snapshot is stored as-is."
                        description="Hint confirming the selected configuration folder"
                        values={{ count: value.configFiles.length, folder: value.configFolderName }}
                      />
                    ) : (
                      <FormattedMessage
                        defaultMessage="The file or folder that makes this installation of the harness this agent: settings, instruction files, subagent definitions. Leave out what the BOM already governs."
                        description="Hint prompting for a configuration folder"
                      />
                    )
                  }
                >
                  <input
                    ref={(node) => {
                      folderInputRef.current = node;
                      if (node) {
                        node.setAttribute('webkitdirectory', '');
                        node.setAttribute('directory', '');
                      }
                    }}
                    id={`${componentId}.config`}
                    type="file"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      const folder = files[0]?.webkitRelativePath?.split('/')[0];
                      update({
                        configFolderName: folder || undefined,
                        configFiles: files.map((file) => ({
                          path: file.webkitRelativePath?.split('/').slice(1).join('/') || file.name,
                          size_bytes: file.size,
                        })),
                      });
                    }}
                  />
                </Field>
              </>
            )}
          </div>
          <Radio value="endpoint">
            <div css={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormattedMessage defaultMessage="A2A endpoint" description="Anchor mode: endpoint" />
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage
                  defaultMessage="An A2A endpoint. Its card is imported for description and display name, and rendered live afterwards; it is never stored."
                  description="Hint for the endpoint anchor mode"
                />
              </Typography.Text>
            </div>
          </Radio>
          <div css={{ paddingLeft: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
            {value.mode === 'endpoint' && (
              <>
                <Field
                  label={
                    <FormattedMessage defaultMessage="A2A endpoint" description="Label for the A2A endpoint input" />
                  }
                  htmlFor={`${componentId}.endpoint`}
                  hint={
                    <FormattedMessage
                      defaultMessage="Creates an a2a access binding. The card at its well-known path is fetched by this browser, never by the server."
                      description="Hint for the A2A endpoint input"
                    />
                  }
                >
                  <div css={{ display: 'flex', gap: theme.spacing.sm }}>
                    <Input
                      id={`${componentId}.endpoint`}
                      componentId={`${componentId}.endpoint`}
                      value={value.endpointUrl}
                      onChange={(event) => update({ endpointUrl: event.target.value, cardFetch: undefined })}
                      placeholder="https://agents.acme.internal/travel"
                      css={{ flex: 1 }}
                    />
                    <Button
                      componentId={`${componentId}.fetch-card`}
                      disabled={!isValidEndpointUrl(value.endpointUrl.trim())}
                      onClick={handleFetchCard}
                    >
                      <FormattedMessage defaultMessage="Fetch card" description="Button fetching the A2A card" />
                    </Button>
                  </div>
                </Field>

                {value.cardFetch?.status === 'unreachable' && (
                  <Alert
                    componentId={`${componentId}.card-unreachable`}
                    type="warning"
                    closable={false}
                    message={intl.formatMessage({
                      defaultMessage: 'No card could be fetched',
                      description: 'Card fetch failure title',
                    })}
                    description={
                      <Typography.Text size="sm">
                        {value.cardFetch.reason}{' '}
                        <FormattedMessage
                          defaultMessage="Paste the card below to import its metadata anyway."
                          description="Card fetch failure > paste hint"
                        />
                      </Typography.Text>
                    }
                  />
                )}

                {imported ? (
                  <div
                    css={{
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borders.borderRadiusMd,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: theme.spacing.xs,
                    }}
                  >
                    <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <Typography.Text bold>
                        <FormattedMessage
                          defaultMessage="Imported from the card"
                          description="Card import preview heading"
                        />
                      </Typography.Text>
                      <Tag componentId={`${componentId}.card-source`} color="indigo">
                        {value.pastedCard ? 'pasted' : 'fetched'}
                      </Tag>
                    </div>
                    <Typography.Text size="sm">
                      <FormattedMessage
                        defaultMessage="Display name: {name}"
                        description="Card import preview > display name"
                        values={{ name: imported.displayName }}
                      />
                    </Typography.Text>
                    <Typography.Text size="sm">
                      <FormattedMessage
                        defaultMessage="Description: {description}"
                        description="Card import preview > description"
                        values={{ description: imported.description }}
                      />
                    </Typography.Text>
                    <Typography.Text size="sm" color="secondary">
                      <FormattedMessage
                        defaultMessage="{count, plural, one {# declared skill} other {# declared skills}}, provider {provider}, card version {version}. The card itself is not stored."
                        description="Card import preview > summary"
                        values={{
                          count: importable?.skills.length ?? 0,
                          provider: imported.providerOrganization ?? '—',
                          version: importable?.version ?? '—',
                        }}
                      />
                    </Typography.Text>
                  </div>
                ) : (
                  <Field
                    label={
                      <FormattedMessage
                        defaultMessage="Or paste the card"
                        description="Label for the pasted card textarea"
                      />
                    }
                    htmlFor={`${componentId}.card`}
                  >
                    <Input.TextArea
                      id={`${componentId}.card`}
                      componentId={`${componentId}.card`}
                      onChange={(event) => handlePasteCard(event.target.value)}
                      placeholder='{ "protocolVersion": "1.0", "name": "…", "description": "…", "version": "…", "skills": [] }'
                      autoSize={{ minRows: 3 }}
                      css={{ fontFamily: 'Source Code Pro, Menlo, monospace', fontSize: theme.typography.fontSizeSm }}
                      validationState={value.pastedCardError ? 'error' : undefined}
                    />
                    {value.pastedCardError && <FormUI.Message type="error" message={value.pastedCardError} />}
                  </Field>
                )}
              </>
            )}
          </div>
        </Radio.Group>
      </div>
    </div>
  );
};
