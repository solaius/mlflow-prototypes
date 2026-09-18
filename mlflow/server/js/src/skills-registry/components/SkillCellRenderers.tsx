import { Button, PencilIcon, Tag, Tooltip, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { getSkillAliasUri, getSkillVersionUri } from '../constants';
import { SkillsRegistryRoutes } from '../routes';
import type { SkillAlias, SkillSourceType, SkillStatus, SkillTag } from '../types';
import { LATEST_ALIAS, SOURCE_TYPE_LABELS, STATUS_TAG_COLOR, formatDigest, formatStatusLabel } from '../utils';
import { AliasTag } from '../../common/components/AliasTag';
import { Link } from '../../common/utils/RoutingUtils';

export const EmptyCell = () => <>&mdash;</>;

/**
 * Lifecycle status tag. Colors come from the shared `STATUS_TAG_COLOR` map, which is
 * the same one the MCP server registry uses, so `active` and `deprecated` read
 * identically across the two registries.
 */
export const SkillStatusTag = ({ status }: { status: SkillStatus }) => (
  <Tag componentId="mlflow.skills-registry.status-tag" color={STATUS_TAG_COLOR[status]}>
    {formatStatusLabel(status)}
  </Tag>
);

/** Which of git / OCI / ZIP / MLflow a version's single source points at. */
export const SkillSourceTypeTag = ({ sourceType }: { sourceType: SkillSourceType }) => (
  <Tag componentId="mlflow.skills-registry.source-type-tag" color="charcoal">
    {SOURCE_TYPE_LABELS[sourceType]}
  </Tag>
);

/**
 * The organization a skill is scoped to, rendered with the leading `@` that marks it as
 * an organization rather than the first segment of a name. An unscoped skill renders
 * nothing at all rather than an empty marker, which is what keeps a bare first segment
 * unambiguously a name.
 */
export const SkillOrganizationCell = ({ organization }: { organization: string }) => {
  if (!organization) {
    return <EmptyCell />;
  }
  return <Typography.Text>@{organization}</Typography.Text>;
};

/**
 * A version's content digest.
 *
 * Three states, because there genuinely are three. A digest shared with other versions
 * of the same skill is the interesting one: it means those versions carry identical
 * content, which is the question this field exists to answer. A digest held by one
 * version is shown plainly. An ABSENT digest is not rendered as a dash and left at
 * that: it means the registering client could not read the content, and saying so
 * prevents "no digest" from being misread as "no match".
 */
export const SkillDigestCell = ({
  digest,
  matchingVersions,
}: {
  digest?: string;
  /** Other versions of the same skill carrying this exact digest. */
  matchingVersions?: number[];
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  if (!digest) {
    return (
      <Tooltip
        componentId="mlflow.skills-registry.digest.absent.tooltip"
        content={intl.formatMessage({
          defaultMessage:
            'No digest was submitted, so this version cannot be compared with others. Clients compute it at registration.',
          description: 'Tooltip explaining an absent skill version digest',
        })}
      >
        <Typography.Text color="secondary" size="sm">
          <FormattedMessage
            defaultMessage="Not computed"
            description="Skills registry > digest cell > absent digest label"
          />
        </Typography.Text>
      </Tooltip>
    );
  }

  const hasMatches = Boolean(matchingVersions?.length);

  return (
    <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
      <Tooltip componentId="mlflow.skills-registry.digest.tooltip" content={digest}>
        <Typography.Text code size="sm">
          {formatDigest(digest)}
        </Typography.Text>
      </Tooltip>
      {hasMatches && (
        <Tooltip
          componentId="mlflow.skills-registry.digest.match.tooltip"
          content={intl.formatMessage(
            {
              defaultMessage:
                'Same content as {count, plural, one {version {versions}} other {versions {versions}}}, from a different source or version number.',
              description: 'Tooltip naming the versions sharing a digest',
            },
            { count: matchingVersions?.length ?? 0, versions: matchingVersions?.join(', ') },
          )}
        >
          <Tag componentId="mlflow.skills-registry.digest.match" color="turquoise">
            <FormattedMessage
              defaultMessage="Same as v{versions}"
              description="Skills registry > digest cell > identical-content badge"
              values={{ versions: matchingVersions?.join(', v') }}
            />
          </Tag>
        </Tooltip>
      )}
    </div>
  );
};

/**
 * One alias, rendered with MLflow's app-wide alias notation: the shared `AliasTag`
 * prints `@ name`, the same component model-registry, the prompt registry and the MCP
 * server registry all use. The tooltip carries the resolvable `skills:/@org/name@alias`
 * URI and the version it currently points at, so the pointer target stays discoverable
 * without putting a second, registry-specific arrow notation on screen.
 */
export const SkillAliasChip = ({
  organization,
  skillName,
  alias,
  version,
}: {
  organization: string;
  skillName: string;
  alias: string;
  version: number;
}) => (
  <Tooltip
    componentId="mlflow.skills-registry.alias-chip.tooltip"
    content={
      alias === LATEST_ALIAS ? (
        <FormattedMessage
          defaultMessage="Reserved alias. Always resolves to the newest active version, currently v{version}."
          description="Tooltip explaining the reserved latest alias in the skills registry"
          values={{ version }}
        />
      ) : (
        <FormattedMessage
          defaultMessage="{uri} currently resolves to v{version}"
          description="Tooltip on a skill alias tag, naming the alias URI and the version it points at"
          values={{ uri: getSkillAliasUri(organization, skillName, alias), version }}
        />
      )
    }
  >
    <span>
      <AliasTag value={alias} />
    </span>
  </Tooltip>
);

/** Pencil button opening the alias editor, matching `MCPServerAliasesCell`'s affordance. */
const EditAliasesButton = ({ onEdit }: { onEdit: () => void }) => {
  const intl = useIntl();
  return (
    <Button
      componentId="mlflow.skills-registry.edit-aliases"
      size="small"
      icon={<PencilIcon />}
      onClick={onEdit}
      aria-label={intl.formatMessage({
        defaultMessage: 'Edit aliases',
        description: 'Aria label for the edit aliases button in the skills registry',
      })}
    />
  );
};

/** All alias pointers currently resolving to some version of a skill. */
export const SkillAliasesCell = ({
  organization,
  skillName,
  aliases,
}: {
  organization: string;
  skillName: string;
  aliases: SkillAlias[];
}) => {
  const { theme } = useDesignSystemTheme();

  if (!aliases.length) {
    return <EmptyCell />;
  }

  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.xs }}>
      {aliases.map(({ alias, version }) => (
        <SkillAliasChip key={alias} organization={organization} skillName={skillName} alias={alias} version={version} />
      ))}
    </div>
  );
};

/**
 * Aliases pointing at one specific version, used in the version rail and the version
 * pane. `onEdit`, when supplied, adds the pencil affordance; the rail omits it so a
 * row click always means "select this version".
 */
export const SkillVersionAliasesCell = ({
  organization,
  skillName,
  version,
  aliases,
  onEdit,
}: {
  organization: string;
  skillName: string;
  version: number;
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
          <SkillAliasChip
            key={alias}
            organization={organization}
            skillName={skillName}
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

/** Key-value tags on a skill or a skill version. */
export const SkillTagsCell = ({
  tags,
  muted = false,
}: {
  tags: SkillTag[];
  /**
   * Drops the chip text to the secondary colour. Set by the card grid for a skill whose
   * latest version is not active, so the whole card recedes together rather than leaving
   * bright chips on an otherwise greyed-out card.
   */
  muted?: boolean;
}) => {
  const { theme } = useDesignSystemTheme();

  if (!tags?.length) {
    return <EmptyCell />;
  }

  return (
    <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {tags.map((tag) => (
        <Tag componentId="mlflow.skills-registry.tag" key={tag.key}>
          <Typography.Text size="sm" color={muted ? 'secondary' : undefined}>
            {tag.key}: {tag.value}
          </Typography.Text>
        </Tag>
      ))}
    </div>
  );
};

/** `v{integer}` link into the version page. Versions are server-assigned integers. */
export const SkillVersionLinkCell = ({
  organization,
  skillName,
  version,
}: {
  organization: string;
  skillName: string;
  version?: number;
}) => {
  if (version === undefined) {
    return <EmptyCell />;
  }
  return (
    <Tooltip
      componentId="mlflow.skills-registry.version-link.tooltip"
      content={getSkillVersionUri(organization, skillName, version)}
    >
      <Link
        componentId="mlflow.skills-registry.skill_list.version_link"
        to={SkillsRegistryRoutes.getSkillVersionPageRoute(organization, skillName, version)}
      >
        <FormattedMessage
          defaultMessage="v{version}"
          description="Skills registry > version number rendered as v followed by the integer version"
          values={{ version }}
        />
      </Link>
    </Tooltip>
  );
};
