import { Button, PencilIcon, Tag, Tooltip, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { AliasTag } from '../../common/components/AliasTag';
import { Link } from '../../common/utils/RoutingUtils';
import MCPRegistryRoutes from '../../mcp-registry/routes';
import { MCP_SEEDS } from '../../mcp-registry/mocks/mcpSeeds';
import { parseSkillQualifiedName } from '../../skills-registry/constants';
import { useSkillsStore } from '../../skills-registry/mocks/skillsStore';
import { SkillsRegistryRoutes } from '../../skills-registry/routes';
import type { SkillStatus, SkillTag } from '../../skills-registry/types';
import { getAgentPluginAliasUri, getAgentPluginVersionUri, getMemberUri } from '../constants';
import { AgentPluginsRoutes } from '../routes';
import type { AgentPluginAlias, AgentPluginKind, AgentPluginMember } from '../types';
import { isMCPServerMember, isSkillMember } from '../types';
import {
  KIND_LABELS,
  KIND_TAG_COLOR,
  LATEST_ALIAS,
  STATUS_TAG_COLOR,
  countMembersByType,
  formatMemberType,
  formatStatusLabel,
  memberTypeTagColor,
} from '../utils';

export const EmptyCell = () => <>&mdash;</>;

/** Lifecycle status tag. Same `STATUS_TAG_COLOR` as skills and MCP servers, so one state reads the same everywhere. */
export const PluginStatusTag = ({ status }: { status: SkillStatus }) => (
  <Tag componentId="mlflow.agent-plugins.status-tag" color={STATUS_TAG_COLOR[status]}>
    {formatStatusLabel(status)}
  </Tag>
);

/**
 * Marks a version RFC-0008 has withdrawn: it contains a soft-deleted skill member, so it is
 * out of resolution, discovery and pull although its own stored status is unchanged. The
 * tag says "Withdrawn" rather than "Deleted" because those are different facts: the owner
 * did nothing, and can publish a replacement version referencing a fixed member.
 */
export const PluginWithdrawnTag = () => {
  const intl = useIntl();
  return (
    <Tooltip
      componentId="mlflow.agent-plugins.withdrawn-tag.tooltip"
      content={intl.formatMessage({
        defaultMessage:
          'A skill member of this version was deleted, so the version no longer resolves, is hidden from discovery, and cannot be pulled. Its own status is unchanged.',
        description: 'Tooltip explaining a withdrawn agent plugin version',
      })}
    >
      <Tag componentId="mlflow.agent-plugins.withdrawn-tag" color="coral">
        <FormattedMessage
          defaultMessage="Withdrawn"
          description="Tag on an agent plugin version withdrawn by a deleted member"
        />
      </Tag>
    </Tooltip>
  );
};

/** Packaged or assembled, per RFC-0008's per-version kind. */
export const PluginKindTag = ({ kind }: { kind: AgentPluginKind }) => {
  const intl = useIntl();
  return (
    <Tooltip
      componentId="mlflow.agent-plugins.kind-tag.tooltip"
      content={
        kind === 'packaged'
          ? intl.formatMessage({
              defaultMessage: 'Has its own package containing the whole plugin. Pull fetches it as a unit.',
              description: 'Tooltip for the packaged plugin kind',
            })
          : intl.formatMessage({
              defaultMessage:
                'Defined entirely by member references, each with its own source. Pull fetches members one by one.',
              description: 'Tooltip for the assembled plugin kind',
            })
      }
    >
      <Tag componentId="mlflow.agent-plugins.kind-tag" color={KIND_TAG_COLOR[kind]}>
        {KIND_LABELS[kind]}
      </Tag>
    </Tooltip>
  );
};

/**
 * One alias in MLflow's app-wide `@ name` notation, the shared `AliasTag` every registry
 * uses. The tooltip carries the resolvable URI and the version it currently points at.
 */
export const PluginAliasChip = ({
  organization,
  name,
  alias,
  version,
}: {
  organization: string;
  name: string;
  alias: string;
  version: string;
}) => (
  <Tooltip
    componentId="mlflow.agent-plugins.alias-chip.tooltip"
    content={
      alias === LATEST_ALIAS ? (
        <FormattedMessage
          defaultMessage="Reserved alias. Always resolves to the newest active version, currently {version}."
          description="Tooltip explaining the reserved latest alias in the agent plugins registry"
          values={{ version }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="{uri} currently resolves to {version}"
          description="Tooltip on a plugin alias tag, naming the alias URI and the version it points at"
          values={{ uri: getAgentPluginAliasUri(organization, name, alias), version }}
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
      componentId="mlflow.agent-plugins.edit-aliases"
      size="small"
      icon={<PencilIcon />}
      onClick={onEdit}
      aria-label={intl.formatMessage({
        defaultMessage: 'Edit aliases',
        description: 'Aria label for the edit aliases button in the agent plugins registry',
      })}
    />
  );
};

export const PluginAliasesCell = ({
  organization,
  name,
  aliases,
}: {
  organization: string;
  name: string;
  aliases: AgentPluginAlias[];
}) => {
  const { theme } = useDesignSystemTheme();
  if (!aliases.length) {
    return <EmptyCell />;
  }
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
      {aliases.map(({ alias, version }) => (
        <PluginAliasChip key={alias} organization={organization} name={name} alias={alias} version={version} />
      ))}
    </div>
  );
};

export const PluginVersionAliasesCell = ({
  organization,
  name,
  version,
  aliases,
  onEdit,
}: {
  organization: string;
  name: string;
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
          <PluginAliasChip key={alias} organization={organization} name={name} alias={alias} version={version} />
        ))
      ) : (
        <EmptyCell />
      )}
      {onEdit && <EditAliasesButton onEdit={onEdit} />}
    </div>
  );
};

export const PluginTagsCell = ({ tags }: { tags: SkillTag[] }) => {
  const { theme } = useDesignSystemTheme();
  if (!tags?.length) {
    return <EmptyCell />;
  }
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {tags.map((tag) => (
        <Tag componentId="mlflow.agent-plugins.tag" key={tag.key}>
          <Typography.Text size="sm">
            {tag.key}: {tag.value}
          </Typography.Text>
        </Tag>
      ))}
    </div>
  );
};

export const PluginOrganizationCell = ({ organization }: { organization: string }) => {
  if (!organization) {
    return <EmptyCell />;
  }
  return <Typography.Text>@{organization}</Typography.Text>;
};

export const PluginVersionLinkCell = ({
  organization,
  name,
  version,
}: {
  organization: string;
  name: string;
  version?: string;
}) => {
  if (!version) {
    return <EmptyCell />;
  }
  return (
    <Tooltip
      componentId="mlflow.agent-plugins.version-link.tooltip"
      content={getAgentPluginVersionUri(organization, name, version)}
    >
      <Link
        componentId="mlflow.agent-plugins.plugin-list.version-link"
        to={AgentPluginsRoutes.getPluginVersionPageRoute(organization, name, version)}
      >
        {version}
      </Link>
    </Tooltip>
  );
};

/**
 * Member type badges for a card or row: "13 skills · 2 MCP servers · 1 hook". RFC-0010's
 * gallery journey asks for exactly this, so a plugin's shape is readable before opening it.
 */
export const PluginMemberCountsCell = ({ members }: { members: AgentPluginMember[] }) => {
  const { theme } = useDesignSystemTheme();
  const counts = countMembersByType(members);
  if (!counts.length) {
    return (
      <Typography.Text color="secondary" size="sm">
        <FormattedMessage defaultMessage="No members" description="Agent plugins > member counts > empty" />
      </Typography.Text>
    );
  }
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {counts.map(({ memberType, count }) => (
        <Tag
          key={memberType}
          componentId="mlflow.agent-plugins.member-count-tag"
          color={memberTypeTagColor(memberType)}
        >
          <Typography.Text size="sm">
            {count} {(count === 1 ? formatMemberType(memberType) : `${formatMemberType(memberType)}s`).toLowerCase()}
          </Typography.Text>
        </Tag>
      ))}
    </div>
  );
};

/**
 * One member as a chip, linking into its registry when it resolves there.
 *
 * A skill member links to the exact pinned skill version. An MCP server member links to
 * the server's detail page when the MCP registry holds it; one discovered from `mcp.json`
 * and not yet connected renders with a dashed border and says so. Generic members have no
 * registry to link into -- the plugin is their governance unit -- so they are plain chips.
 */
export const PluginMemberChip = ({ member }: { member: AgentPluginMember }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const skills = useSkillsStore();

  if (isSkillMember(member)) {
    const { organization, name } = parseSkillQualifiedName(member.name);
    const resolved = skills.some((skill) => skill.organization === organization && skill.name === name);
    const chip = (
      <Tag
        componentId="mlflow.agent-plugins.member-chip"
        color={resolved ? 'purple' : undefined}
        css={!resolved ? { borderStyle: 'dashed', borderColor: theme.colors.border } : undefined}
      >
        {member.name} v{member.version}
      </Tag>
    );
    if (!resolved) {
      return (
        <Tooltip
          componentId="mlflow.agent-plugins.member-chip.tooltip"
          content={intl.formatMessage({
            defaultMessage: 'No skill with this name is registered.',
            description: 'Tooltip on an unresolved skill member chip',
          })}
        >
          {chip}
        </Tooltip>
      );
    }
    return (
      <Tooltip componentId="mlflow.agent-plugins.member-chip.tooltip" content={getMemberUri(member)}>
        <Link
          componentId="mlflow.agent-plugins.member-link"
          to={SkillsRegistryRoutes.getSkillVersionPageRoute(organization, name, member.version)}
        >
          {chip}
        </Link>
      </Tooltip>
    );
  }

  if (isMCPServerMember(member)) {
    const registered = MCP_SEEDS.some((entry) => entry.server.name === member.name);
    const connected = registered && Boolean(member.version);
    const chip = (
      <Tag
        componentId="mlflow.agent-plugins.member-chip"
        color={connected ? 'teal' : undefined}
        css={!connected ? { borderStyle: 'dashed', borderColor: theme.colors.border } : undefined}
      >
        {member.name}
        {member.version ? ` ${member.version}` : ''}
      </Tag>
    );
    if (!connected) {
      return (
        <Tooltip
          componentId="mlflow.agent-plugins.member-chip.tooltip"
          content={
            registered
              ? intl.formatMessage({
                  defaultMessage:
                    'Discovered from mcp.json. A server with this name is registered, but this member is not connected to a version of it.',
                  description: 'Tooltip on an MCP member that is registered but not pinned',
                })
              : intl.formatMessage({
                  defaultMessage:
                    'Discovered from mcp.json and not connected to the MCP Server Registry. The configuration stays in the package.',
                  description: 'Tooltip on an MCP member that is not in the registry',
                })
          }
        >
          {chip}
        </Tooltip>
      );
    }
    return (
      <Tooltip componentId="mlflow.agent-plugins.member-chip.tooltip" content={getMemberUri(member)}>
        <Link
          componentId="mlflow.agent-plugins.member-link"
          to={MCPRegistryRoutes.getMCPServerDetailRoute(member.name, member.version)}
        >
          {chip}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      componentId="mlflow.agent-plugins.member-chip.tooltip"
      content={intl.formatMessage(
        {
          defaultMessage: '{type}. Governed through this plugin: no registry entry, version or lifecycle of its own.',
          description: 'Tooltip on a generic plugin member chip',
        },
        { type: formatMemberType(member.member_type) },
      )}
    >
      <Tag componentId="mlflow.agent-plugins.member-chip" color="charcoal">
        {member.name}
      </Tag>
    </Tooltip>
  );
};

export const PluginMembersCell = ({ members }: { members: AgentPluginMember[] }) => {
  const { theme } = useDesignSystemTheme();
  if (!members.length) {
    return <EmptyCell />;
  }
  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {members.map((member) => (
        <PluginMemberChip key={`${member.member_type}:${member.name}`} member={member} />
      ))}
    </div>
  );
};
