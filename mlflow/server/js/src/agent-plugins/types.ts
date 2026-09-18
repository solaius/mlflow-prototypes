/**
 * Entity types for the Agent Plugins registry, mirroring MLflow RFC-0008 (merged
 * 2026-08-19) for everything the registry stores, and RFC-0010 (PR #27, journeys only as of
 * 2026-08-24) for the one place the two disagree: what a member can be.
 *
 * An agent plugin is the governed registry identity for an open Agent Plugins package. It
 * shares its lifecycle vocabulary, tag model, alias model and icon model with the Skill
 * Registry -- RFC-0008 defines both entities in one document and types the plugin's status
 * as `SkillStatus` -- so this file imports those rather than restating them. Two registries
 * that implement the same lifecycle should read the same.
 *
 * Scope note, as for skills: this models the upstream RFC only. Downstream governance
 * concerns (approval tracks, trust tiers, scan results) are absent by design.
 */

import type { RegistryIcon } from '../common/components/RegistryIcon';
import type { SkillSourceType, SkillTag } from '../skills-registry/types';
import { SkillStatus } from '../skills-registry/types';

/** Re-exported so plugin code names the lifecycle once. `draft -> active <-> deprecated -> deleted`. */
export { SkillStatus as AgentPluginStatus };

export type AgentPluginTag = SkillTag;

/** A mutable, named pointer from an alias to a manifest version string. */
export interface AgentPluginAlias {
  alias: string;
  version: string;
}

/**
 * The marker `source_type` carries when a version has no plugin-level package.
 *
 * RFC-0008 derives a version's KIND from this one column: `git`, `oci`, `zip` and `mlflow`
 * are packaged (the version has its own package containing the whole plugin), while
 * `assembled` means the version's content is defined entirely by its member references.
 * Kind is resolved per version, never per plugin, so one name may be packaged in one
 * version and assembled in the next.
 */
export const ASSEMBLED_SOURCE_TYPE = 'assembled';

export type AgentPluginSourceType = SkillSourceType | typeof ASSEMBLED_SOURCE_TYPE;

/**
 * Where a version's package lives, when it has one.
 *
 * An assembled version has NO plugin-level source, which RFC-0008 states outright: it
 * "has no agent plugin-level source and its members carry their own independent sources".
 * The optional fields are therefore absent, not blank, on an assembled version, and a
 * packaged version fills the same shape the skill registry uses for its own pointers.
 */
export interface AgentPluginVersionSource {
  source_type: AgentPluginSourceType;
  /** Clone URL (git), image reference (OCI), archive URL (ZIP) or `mlflow-artifacts:/...` path. */
  source?: string;
  /** Branch, tag or resolved commit. Git only. */
  ref?: string;
  /** Directory holding `plugin.json` within the repository, image or archive. */
  subpath?: string;
}

export type AgentPluginKind = 'packaged' | 'assembled';

/** Member types the two RFCs name. Anything else is an adapter-assigned label MLflow does not interpret. */
export const MEMBER_TYPE_SKILL = 'skill';
export const MEMBER_TYPE_MCP_SERVER = 'mcp-server';

/**
 * One membership row.
 *
 * RFC-0008 stores skill members only, frozen to a concrete integer version at create time.
 * RFC-0010 generalises the row: `member_type` is a free-form string, `mcp-server` members
 * are references into the MCP Server Registry pinned to a SemVer version, and every other
 * type (agent, hook, command, instruction, ...) has no registry entity of its own -- it is
 * governed through the plugin, so it carries a name and nothing to pin.
 *
 * `member_type` was dropped from RFC-0008 on 2026-08-06 precisely so RFC-0010 could add it
 * back once the model was agreed. Carrying it here, with the two typed cases named as
 * constants, is how this prototype stays correct against the merged RFC (every seeded
 * RFC-0008 member is `skill`) while showing what the follow-on adds.
 */
export interface AgentPluginMember {
  member_type: string;
  /** Qualified `@org/name` for skills; reverse-DNS server name for MCP servers; the component name otherwise. */
  name: string;
  /** Frozen pin: an integer for skills, a SemVer string for MCP servers, absent for generic members. */
  version?: number | string;
}

/** Narrowed member shapes, for the two types that resolve in another registry. */
export type SkillMember = AgentPluginMember & { member_type: typeof MEMBER_TYPE_SKILL; version: number };
/**
 * An MCP server member. The version is optional here and nowhere else: import derives an
 * `mcp-server` row from `mcp.json` before anyone has connected it to a registered server,
 * and RFC-0010 leaves whether that connection is automatic, confirmed or manual as an open
 * question. A row with a version is a connected cross-registry reference; one without is
 * discovered configuration the registry knows about but has not resolved.
 */
export type MCPServerMember = AgentPluginMember & { member_type: typeof MEMBER_TYPE_MCP_SERVER; version?: string };

export const isSkillMember = (member: AgentPluginMember): member is SkillMember =>
  member.member_type === MEMBER_TYPE_SKILL && typeof member.version === 'number';

export const isMCPServerMember = (member: AgentPluginMember): member is MCPServerMember =>
  member.member_type === MEMBER_TYPE_MCP_SERVER;

/**
 * The logical plugin asset. Maps onto MLflow's RegisteredModel the way skills do.
 *
 * `organization` is part of the primary key `(workspace, organization, name)` and is NOT
 * written into the canonical manifest: RFC-0008 keeps it an MLflow registry namespace.
 * `status` and `latest_version` are read-only and derived from the same latest-resolved
 * version; both are absent when the plugin has no resolvable version.
 */
export interface AgentPluginEntity {
  organization: string;
  name: string;
  /** Mutable MLflow-managed description. May be empty, in which case the UI falls back to the manifest's. */
  description: string;
  /** Mutable presentation icons per RFC-0008 §Icons (PR #45). No manifest fallback: the format defines none. */
  icons?: RegistryIcon[];
  tags: AgentPluginTag[];
  aliases: AgentPluginAlias[];
  /** Derived: the latest-resolved version, or undefined when nothing resolves. */
  latest_version?: string;
  /** Derived from the latest-resolved version; undefined when nothing resolves. */
  status?: SkillStatus;
  created_by: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
}

/**
 * An immutable registered version. Maps onto MLflow's ModelVersion.
 *
 * `version` is the publisher's SemVer string, equal to `plugin_json.version` by construction:
 * RFC-0008 canonicalises the manifest's version field on ingest so the two can never
 * drift, and that is the only field of the manifest the registry ever sets. Everything in
 * `plugin_json` is preserved as submitted and immutable afterwards; so are the member list
 * and the source. Status and tags are the mutable fields.
 */
export interface AgentPluginVersionEntity {
  organization: string;
  name: string;
  version: string;
  plugin_json: Record<string, unknown>;
  source: AgentPluginVersionSource;
  members: AgentPluginMember[];
  status: SkillStatus;
  tags: AgentPluginTag[];
  /** Aliases currently pointing at this specific version. */
  aliases: string[];
  created_by: string;
  last_updated_by?: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
}
