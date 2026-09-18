import {
  Button,
  PencilIcon,
  RobotIcon,
  Tag,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { getPluginQualifiedName } from '../../agent-plugins/constants';
import { usePluginsStore } from '../../agent-plugins/mocks/pluginsStore';
import { AgentPluginsRoutes } from '../../agent-plugins/routes';
import { AliasTag } from '../../common/components/AliasTag';
import { RegistryIconImage } from '../../common/components/RegistryIcon';
import type { RegistryIcon } from '../../common/components/RegistryIcon';
import { Link } from '../../common/utils/RoutingUtils';
import { MCP_SEEDS } from '../../mcp-registry/mocks/mcpSeeds';
import MCPRegistryRoutes from '../../mcp-registry/routes';
import { ModelRegistryRoutes } from '../../model-registry/routes';
import { SkillSourceTypeTag } from '../../skills-registry/components/SkillCellRenderers';
import { SkillSourceDisclaimer, SkillSourceLinkOut } from '../../skills-registry/components/SkillSourceLinkOut';
import { getGitBrowseUrl, getSkillVersionUri, parseSkillQualifiedName } from '../../skills-registry/constants';
import { useSkillsStore } from '../../skills-registry/mocks/skillsStore';
import { SkillsRegistryRoutes } from '../../skills-registry/routes';
import { SkillSourceType } from '../../skills-registry/types';
import type { SkillTag } from '../../skills-registry/types';
import { A2AIcon } from './A2AIcon';
import { getAgentAliasUri, getAgentVersionUri, getModelRefUri } from '../constants';
import { useAgentsStore } from '../mocks/agentsStore';
import { AgentRegistryRoutes } from '../routes';
import type {
  AgentAlias,
  AgentAnchorKind,
  AgentBindingProtocol,
  AgentHarnessRef,
  AgentRef,
  AgentSourcePointer,
  AgentStatus,
  CompositionDeclaration,
  MCPServerRef,
  ModelRef,
  PluginRef,
  SkillRef,
} from '../types';
import { parseAgentQualifiedName } from '../types';
import {
  ANCHOR_KIND_LABELS,
  LATEST_ALIAS,
  PROTOCOL_LABELS,
  PROTOCOL_TAG_COLOR,
  STATUS_TAG_COLOR,
  formatStatusLabel,
} from '../utils';

export const EmptyCell = () => <>&mdash;</>;

/**
 * Agent icon through the shared registry renderer, in the same chip the skill and plugin
 * pages use. The placeholder is the A2A mark when the agent has an A2A binding and the
 * robot otherwise, which is the one per-registry choice the shared renderer leaves open.
 */
export const AgentIconBox = ({
  icons,
  name,
  hasA2A,
  size = 32,
}: {
  icons?: RegistryIcon[];
  name?: string;
  hasA2A?: boolean;
  size?: number;
}) => {
  const { theme } = useDesignSystemTheme();
  const glyph = Math.round(size * 0.5);
  return (
    <div
      css={{
        width: size,
        height: size,
        borderRadius: theme.borders.borderRadiusSm,
        backgroundColor: theme.colors.backgroundSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <RegistryIconImage
        icons={icons}
        name={name}
        size={glyph}
        placeholder={hasA2A ? <A2AIcon size={glyph} /> : <RobotIcon css={{ width: glyph, height: glyph }} />}
      />
    </div>
  );
};

/** Lifecycle status tag, on the colours the skill and MCP registries share. */
export const AgentStatusTag = ({ status }: { status: AgentStatus }) => (
  <Tag componentId="mlflow.agent-registry.status-tag" color={STATUS_TAG_COLOR[status]}>
    {formatStatusLabel(status)}
  </Tag>
);

export const ProtocolTag = ({ protocol }: { protocol: AgentBindingProtocol }) => (
  <Tag componentId="mlflow.agent-registry.protocol-tag" color={PROTOCOL_TAG_COLOR[protocol]}>
    {PROTOCOL_LABELS[protocol]}
  </Tag>
);

/** What a version is anchored on. Interface-only is the case worth a tooltip: it changes what the record can answer. */
export const AnchorKindTag = ({ kind }: { kind: AgentAnchorKind }) => {
  const intl = useIntl();
  const tag = (
    <Tag componentId="mlflow.agent-registry.anchor-tag" color={kind === 'interface-only' ? 'lemon' : 'charcoal'}>
      {ANCHOR_KIND_LABELS[kind]}
    </Tag>
  );
  if (kind !== 'interface-only') {
    return tag;
  }
  return (
    <Tooltip
      componentId="mlflow.agent-registry.anchor-tag.tooltip"
      content={intl.formatMessage({
        defaultMessage:
          'Registered from an endpoint with no source and no configuration snapshot. The registry holds the agent’s claim surface, not its contents.',
        description: 'Tooltip explaining an interface-only agent record',
      })}
    >
      {tag}
    </Tooltip>
  );
};

export const CompositionTag = ({ composition }: { composition: CompositionDeclaration }) => {
  const intl = useIntl();
  if (composition === 'declared') {
    return null;
  }
  return (
    <Tooltip
      componentId="mlflow.agent-registry.composition-tag.tooltip"
      content={intl.formatMessage({
        defaultMessage:
          'No bill of materials was declared. Blast-radius queries can never match this version; they report it alongside their matches instead.',
        description: 'Tooltip explaining undeclared composition',
      })}
    >
      <Tag componentId="mlflow.agent-registry.composition-tag" color="lemon">
        <FormattedMessage
          defaultMessage="Composition undeclared"
          description="Tag on an agent version with no declared BOM"
        />
      </Tag>
    </Tooltip>
  );
};

/** One alias in the app-wide `@ name` notation. */
export const AgentAliasChip = ({
  organization,
  agentName,
  alias,
  version,
}: {
  organization: string;
  agentName: string;
  alias: string;
  version: string;
}) => (
  <Tooltip
    componentId="mlflow.agent-registry.alias-chip.tooltip"
    content={
      alias === LATEST_ALIAS ? (
        <FormattedMessage
          defaultMessage="Reserved alias. Always resolves to the newest active version, currently {version}."
          description="Tooltip explaining the reserved latest alias in the agent registry"
          values={{ version }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="{uri} currently resolves to version {version}"
          description="Tooltip on an agent alias tag"
          values={{ uri: getAgentAliasUri(organization, agentName, alias), version }}
        />
      )
    }
  >
    <span>
      <AliasTag value={alias} />
    </span>
  </Tooltip>
);

const EditAliasesButton = ({ onEdit }: { onEdit: () => void }) => {
  const intl = useIntl();
  return (
    <Button
      componentId="mlflow.agent-registry.edit-aliases"
      size="small"
      icon={<PencilIcon />}
      onClick={onEdit}
      aria-label={intl.formatMessage({
        defaultMessage: 'Edit aliases',
        description: 'Aria label for the edit aliases button',
      })}
    />
  );
};

export const AgentAliasesCell = ({
  organization,
  agentName,
  aliases,
}: {
  organization: string;
  agentName: string;
  aliases: AgentAlias[];
}) => {
  const { theme } = useDesignSystemTheme();
  if (!aliases.length) {
    return <EmptyCell />;
  }
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
      {aliases.map(({ alias, version }) => (
        <AgentAliasChip key={alias} organization={organization} agentName={agentName} alias={alias} version={version} />
      ))}
    </div>
  );
};

export const AgentVersionAliasesCell = ({
  organization,
  agentName,
  version,
  aliases,
  onEdit,
}: {
  organization: string;
  agentName: string;
  version: string;
  aliases: string[];
  onEdit?: () => void;
}) => {
  const { theme } = useDesignSystemTheme();
  if (!aliases.length && !onEdit) {
    return <EmptyCell />;
  }
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
      {aliases.length ? (
        aliases.map((alias) => (
          <AgentAliasChip
            key={alias}
            organization={organization}
            agentName={agentName}
            alias={alias}
            version={version}
          />
        ))
      ) : (
        <EmptyCell />
      )}
      {onEdit && <EditAliasesButton onEdit={onEdit} />}
    </div>
  );
};

export const AgentTagsCell = ({ tags, max }: { tags: SkillTag[]; max?: number }) => {
  const { theme } = useDesignSystemTheme();
  if (!tags.length) {
    return <EmptyCell />;
  }
  const shown = max !== undefined ? tags.slice(0, max) : tags;
  const overflow = tags.length - shown.length;
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {shown.map((tag) => (
        <Tag componentId="mlflow.agent-registry.tag" key={tag.key}>
          <Typography.Text size="sm">
            {tag.key}: {tag.value}
          </Typography.Text>
        </Tag>
      ))}
      {overflow > 0 && (
        <Tag componentId="mlflow.agent-registry.tag-overflow" color="charcoal">
          <Typography.Text size="sm">+{overflow}</Typography.Text>
        </Tag>
      )}
    </div>
  );
};

export const AgentOrganizationCell = ({ organization }: { organization: string }) => {
  if (!organization) {
    return <EmptyCell />;
  }
  return <Typography.Text>@{organization}</Typography.Text>;
};

export const AgentVersionLinkCell = ({
  organization,
  agentName,
  version,
}: {
  organization: string;
  agentName: string;
  version?: string;
}) => {
  if (!version) {
    return <EmptyCell />;
  }
  return (
    <Tooltip
      componentId="mlflow.agent-registry.version-link.tooltip"
      content={getAgentVersionUri(organization, agentName, version)}
    >
      <Link
        componentId="mlflow.agent-registry.agent-list.version-link"
        to={AgentRegistryRoutes.getAgentVersionPageRoute(organization, agentName, version)}
      >
        {version}
      </Link>
    </Tooltip>
  );
};

/** A pinned skill, linking to the exact version in the Skill Registry when it resolves there. */
export const SkillRefChip = ({ skillRef }: { skillRef: SkillRef }) => {
  const { theme } = useDesignSystemTheme();
  const skills = useSkillsStore();
  const { organization, name } = parseSkillQualifiedName(skillRef.name);
  const resolved = skills.some((s) => s.organization === organization && s.name === name);
  const chip = (
    <Tag
      componentId="mlflow.agent-registry.skill-ref-tag"
      color={resolved ? 'purple' : undefined}
      css={!resolved ? { borderStyle: 'dashed', borderColor: theme.colors.border } : undefined}
    >
      {skillRef.name} v{skillRef.version}
    </Tag>
  );
  if (!resolved) {
    return (
      <Tooltip
        componentId="mlflow.agent-registry.skill-ref-chip.tooltip"
        content="Soft reference: no skill with this name is registered."
      >
        {chip}
      </Tooltip>
    );
  }
  return (
    <Tooltip
      componentId="mlflow.agent-registry.skill-ref-chip.tooltip"
      content={getSkillVersionUri(organization, name, skillRef.version)}
    >
      <Link
        componentId="mlflow.agent-registry.skill-ref-chip"
        to={SkillsRegistryRoutes.getSkillVersionPageRoute(organization, name, skillRef.version)}
      >
        {chip}
      </Link>
    </Tooltip>
  );
};

/** A referenced agent plugin, linking to the exact version. */
export const PluginRefChip = ({ pluginRef }: { pluginRef: PluginRef }) => {
  const { theme } = useDesignSystemTheme();
  const plugins = usePluginsStore();
  const { organization, name } = parseSkillQualifiedName(pluginRef.name);
  const resolved = plugins.some((p) => getPluginQualifiedName(p.organization, p.name) === pluginRef.name);
  const chip = (
    <Tag
      componentId="mlflow.agent-registry.plugin-ref-tag"
      color={resolved ? 'brown' : undefined}
      css={!resolved ? { borderStyle: 'dashed', borderColor: theme.colors.border } : undefined}
    >
      {pluginRef.name} {pluginRef.version}
    </Tag>
  );
  if (!resolved) {
    return (
      <Tooltip
        componentId="mlflow.agent-registry.plugin-ref-chip.tooltip"
        content="Soft reference: no agent plugin with this name is registered."
      >
        {chip}
      </Tooltip>
    );
  }
  return (
    <Tooltip
      componentId="mlflow.agent-registry.plugin-ref-chip.tooltip"
      content={`agent-plugins:/${pluginRef.name}/${pluginRef.version}`}
    >
      <Link
        componentId="mlflow.agent-registry.plugin-ref-chip"
        to={AgentPluginsRoutes.getPluginVersionPageRoute(organization, name, pluginRef.version)}
      >
        {chip}
      </Link>
    </Tooltip>
  );
};

/** A pinned MCP server, linking into the MCP registry when it holds the server. */
export const MCPRefChip = ({ mcpRef }: { mcpRef: MCPServerRef }) => {
  const { theme } = useDesignSystemTheme();
  const resolved = MCP_SEEDS.some((entry) => entry.server.name === mcpRef.name);
  const chip = (
    <Tag
      componentId="mlflow.agent-registry.mcp-ref-tag"
      color={resolved ? 'teal' : undefined}
      css={!resolved ? { borderStyle: 'dashed', borderColor: theme.colors.border } : undefined}
    >
      {mcpRef.name} {mcpRef.version}
    </Tag>
  );
  if (!resolved) {
    return (
      <Tooltip
        componentId="mlflow.agent-registry.mcp-ref-chip.tooltip"
        content="Soft reference: no MCP server with this name is registered."
      >
        {chip}
      </Tooltip>
    );
  }
  return (
    <Tooltip
      componentId="mlflow.agent-registry.mcp-ref-chip.tooltip"
      content={`mcp-servers:/${mcpRef.name}/${mcpRef.version}`}
    >
      <Link
        componentId="mlflow.agent-registry.mcp-ref-chip"
        to={MCPRegistryRoutes.getMCPServerDetailRoute(mcpRef.name, mcpRef.version)}
      >
        {chip}
      </Link>
    </Tooltip>
  );
};

/** A model: a registry model links into the Model Registry; an external identifier is a plain chip. */
export const ModelRefChip = ({ modelRef }: { modelRef: ModelRef }) => {
  const label = `${modelRef.name}${modelRef.version ? ` v${modelRef.version}` : ''}${modelRef.role ? ` (${modelRef.role})` : ''}`;
  const chip = (
    <Tag componentId="mlflow.agent-registry.model-ref-tag" color="indigo">
      {label}
    </Tag>
  );
  if (!modelRef.version) {
    return (
      <Tooltip
        componentId="mlflow.agent-registry.model-ref-chip.tooltip"
        content={`${getModelRefUri(modelRef)}: external model identifier${modelRef.provider ? `, ${modelRef.provider}` : ''}`}
      >
        {chip}
      </Tooltip>
    );
  }
  return (
    <Tooltip componentId="mlflow.agent-registry.model-ref-chip.tooltip" content={getModelRefUri(modelRef)}>
      <Link
        componentId="mlflow.agent-registry.model-ref-chip"
        to={ModelRegistryRoutes.getModelVersionPageRoute(modelRef.name, modelRef.version)}
      >
        {chip}
      </Link>
    </Tooltip>
  );
};

/** Another agent this one calls: pinned or name-level, linking into its page. */
export const AgentRefChip = ({ agentRef }: { agentRef: AgentRef }) => {
  const { theme } = useDesignSystemTheme();
  const agents = useAgentsStore();
  const parsed = parseAgentQualifiedName(agentRef.name);
  const resolved = parsed
    ? agents.some((a) => a.organization === parsed.organization && a.name === parsed.name)
    : false;
  const chip = (
    <Tag
      componentId="mlflow.agent-registry.agent-ref-tag"
      color={resolved ? 'pink' : undefined}
      css={!resolved ? { borderStyle: 'dashed', borderColor: theme.colors.border } : undefined}
    >
      {agentRef.name}
      {agentRef.version ? ` v${agentRef.version}` : ''}
    </Tag>
  );
  const tooltip = agentRef.version
    ? `agents:/${agentRef.name}/${agentRef.version}: pinned, versioned and deployed with this agent`
    : `agents:/${agentRef.name}: name-level, independently managed, whichever version is live`;
  if (!resolved || !parsed) {
    return (
      <Tooltip componentId="mlflow.agent-registry.agent-ref-chip.tooltip" content={tooltip}>
        {chip}
      </Tooltip>
    );
  }
  return (
    <Tooltip componentId="mlflow.agent-registry.agent-ref-chip.tooltip" content={tooltip}>
      <Link
        componentId="mlflow.agent-registry.agent-ref-chip"
        to={
          agentRef.version
            ? AgentRegistryRoutes.getAgentVersionPageRoute(parsed.organization, parsed.name, agentRef.version)
            : AgentRegistryRoutes.getAgentPageRoute(parsed.organization, parsed.name)
        }
      >
        {chip}
      </Link>
    </Tooltip>
  );
};

export const HarnessChip = ({ harness }: { harness: AgentHarnessRef }) => (
  <Tooltip
    componentId="mlflow.agent-registry.harness-chip.tooltip"
    content="Harness reference: an external identifier for the packaged harness this agent runs as a configuration of."
  >
    <Tag componentId="mlflow.agent-registry.harness-tag" color="turquoise">
      {harness.name}
      {harness.version ? ` ${harness.version}` : ''}
    </Tag>
  </Tooltip>
);

/** One source pointer, rendered as the skill registry renders its own: type tag, link, ref and path, link-out. */
export const SourcePointerCell = ({ source }: { source: AgentSourcePointer }) => {
  const { theme } = useDesignSystemTheme();
  const browseUrl =
    source.source_type === SkillSourceType.GIT
      ? getGitBrowseUrl({ source: source.source, ref: source.ref, subpath: source.subpath })
      : undefined;
  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, minWidth: 0 }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
        <SkillSourceTypeTag sourceType={source.source_type} />
        {/^https?:\/\//i.test(source.source) ? (
          <Typography.Link componentId="mlflow.agent-registry.source-link" href={source.source} openInNewTab>
            {source.source}
          </Typography.Link>
        ) : (
          <Typography.Text code css={{ wordBreak: 'break-all' }}>
            {source.source}
          </Typography.Text>
        )}
      </div>
      {source.subpath && (
        <Typography.Text size="sm" color="secondary">
          <FormattedMessage
            defaultMessage="Path: {path}"
            description="Agent source path"
            values={{ path: source.subpath }}
          />
        </Typography.Text>
      )}
      {source.ref && (
        <Typography.Text size="sm" color="secondary">
          <FormattedMessage
            defaultMessage="Ref: {ref}"
            description="Agent source git ref"
            values={{ ref: source.ref.slice(0, 12) }}
          />
        </Typography.Text>
      )}
      {/* The browse link only when it lands somewhere the source link does not; the disclaimer either way. */}
      {browseUrl &&
        (browseUrl !== source.source ? (
          <SkillSourceLinkOut componentId="mlflow.agent-registry.browse-source" href={browseUrl} />
        ) : (
          <SkillSourceDisclaimer />
        ))}
    </div>
  );
};
