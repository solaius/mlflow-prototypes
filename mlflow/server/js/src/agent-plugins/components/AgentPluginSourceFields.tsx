import {
  Alert,
  Button,
  FormUI,
  Input,
  SimpleSelect,
  SimpleSelectOption,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { SkillSourceType } from '../../skills-registry/types';
import {
  POINTER_SOURCE_TYPES,
  SOURCE_TYPE_LABELS,
  inferSourceType,
  parseProviderWebUrl,
  sourceTypeSupportsRef,
} from '../../skills-registry/utils';

/** Where a package to import lives. The plugin twin of the skill registry's pointer input. */
export interface PluginPackageInput {
  sourceType: SkillSourceType;
  sourceUri: string;
  ref: string;
  subpath: string;
}

export const EMPTY_PACKAGE_INPUT: PluginPackageInput = {
  sourceType: SkillSourceType.GIT,
  sourceUri: '',
  ref: '',
  subpath: '',
};

const PACKAGE_PLACEHOLDERS: Record<SkillSourceType, string> = {
  [SkillSourceType.GIT]: 'https://github.com/RHEcosystemAppEng/agentic-plugins',
  [SkillSourceType.OCI]: 'oci://quay.io/acme-platform/plugins/release-gate:1.2.0',
  [SkillSourceType.ZIP]: 'https://example.com/plugins/pr-workflow-1.0.0.zip',
  [SkillSourceType.MLFLOW]: '',
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
      {/*
        Hint-styled, the skills source fields' `subtleLabel`: these are secondary labels
        inside a radio reveal, so they read as help text, but stay real labels for htmlFor.
      */}
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
 * The package-location half of an import: type, location, and the branch and path that
 * address one plugin inside a monorepo.
 *
 * Same behaviours as the skill registry's source fields, for the same reasons: the type
 * selector stays (the 2026-09-01 ruling) and is pre-selected from the typed location; a
 * pasted browsing URL is detected and corrected into clone URL + ref + path, which for the
 * Red Hat collections repository is exactly how a collection is addressed.
 *
 * Unlike a skill, a plugin's `ref` and `subpath` are NOT tucked into an advanced section.
 * The collections repository holds eight plugins one directory down, so the path is the
 * field that picks which plugin is being imported, and hiding it would hide the choice.
 */
export const AgentPluginSourceFields = ({
  componentId,
  value,
  onChange,
  sourceUriError,
  onSourceUriChange,
}: {
  componentId: string;
  value: PluginPackageInput;
  onChange: (value: PluginPackageInput) => void;
  sourceUriError?: string;
  onSourceUriChange?: () => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  const update = (partial: Partial<PluginPackageInput>) => onChange({ ...value, ...partial });
  const webUrlParts = parseProviderWebUrl(value.sourceUri);

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
  };

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
      {/* Source type above location, stacked, as in the skills source fields (demo-prep#24). */}
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        <div css={{ maxWidth: 200 }}>
          <Field
            label={<FormattedMessage defaultMessage="Source type" description="Label for the package source type" />}
            htmlFor={`${componentId}.source-type`}
          >
            <SimpleSelect
              id={`${componentId}.source-type`}
              componentId={`${componentId}.source-type`}
              value={value.sourceType}
              onChange={({ target }) => update({ sourceType: target.value as SkillSourceType })}
              label={intl.formatMessage({
                defaultMessage: 'Source type',
                description: 'Label for the package source type',
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
            label={<FormattedMessage defaultMessage="Location" description="Label for the package location" />}
            htmlFor={`${componentId}.source-uri`}
          >
            <Input
              id={`${componentId}.source-uri`}
              componentId={`${componentId}.source-uri`}
              value={value.sourceUri}
              onChange={(event) => handleLocationChange(event.target.value)}
              placeholder={PACKAGE_PLACEHOLDERS[value.sourceType]}
              validationState={sourceUriError ? 'error' : undefined}
            />
            {sourceUriError && <FormUI.Message type="error" message={sourceUriError} />}
          </Field>
        </div>
      </div>

      {webUrlParts && (
        <Alert
          componentId={`${componentId}.web-url-hint`}
          type="info"
          closable={false}
          message={intl.formatMessage({
            defaultMessage: 'That looks like a page you browse, not a location you can clone.',
            description: 'Agent plugins > source fields > pasted web URL alert title',
          })}
          description={
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, alignItems: 'flex-start' }}>
              <Typography.Text size="sm">
                <FormattedMessage
                  defaultMessage="Import the clone URL and point at the plugin with the branch and path fields instead."
                  description="Agent plugins > source fields > pasted web URL explanation"
                />
              </Typography.Text>
              <Button componentId={`${componentId}.web-url-hint.apply`} size="small" onClick={applyWebUrlCorrection}>
                <FormattedMessage
                  defaultMessage="Use {cloneUrl}"
                  description="Agent plugins > source fields > apply the pasted web URL correction"
                  values={{ cloneUrl: webUrlParts.cloneUrl }}
                />
              </Button>
            </div>
          }
        />
      )}

      <div css={{ display: 'flex', gap: theme.spacing.sm }}>
        {sourceTypeSupportsRef(value.sourceType) && (
          <div css={{ flex: 1 }}>
            <Field
              label={
                <FormattedMessage defaultMessage="Branch, tag or commit" description="Label for the package ref" />
              }
              htmlFor={`${componentId}.ref`}
              hint={
                <FormattedMessage
                  defaultMessage="Defaults to the repository's default branch."
                  description="Hint for the package git ref"
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
              <FormattedMessage defaultMessage="Path within the source" description="Label for the package subpath" />
            }
            htmlFor={`${componentId}.subpath`}
            hint={
              <FormattedMessage
                defaultMessage="The directory holding plugin.json. Leave blank if it is at the root."
                description="Hint for the package subpath"
              />
            }
          >
            <Input
              id={`${componentId}.subpath`}
              componentId={`${componentId}.subpath`}
              value={value.subpath}
              onChange={(event) => update({ subpath: event.target.value })}
              placeholder="rh-sre"
            />
          </Field>
        </div>
      </div>
    </>
  );
};
