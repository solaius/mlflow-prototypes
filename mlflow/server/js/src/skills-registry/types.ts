/**
 * Entity types for the Skills Registry, mirroring MLflow RFC-0008 (Skill Registry),
 * merged upstream 2026-08-19.
 *
 * Scope note: this models the *upstream* RFC only. Downstream governance concerns
 * (lifecycle/approval/verification/certification tracks, trust tiers, security scan
 * status) are deliberately absent: they belong to a distribution's governance layer,
 * not to MLflow core.
 *
 * Shape note: the registry stores METADATA ABOUT skills, not the skills themselves.
 * RFC-0008 is explicit that the server never fetches a user-supplied source URL and
 * that content-derived fields are computed client-side. Nothing here holds skill
 * content: a version carries a pointer to content plus the lifecycle around it. The
 * content itself is resolved by the client (see `mocks/skillContent.ts`).
 */

import type { RegistryIcon } from '../common/components/RegistryIcon';

/** A key-value pair attached to a Skill or a SkillVersion. */
export interface SkillTag {
  key: string;
  value: string;
}

/**
 * Where a version sits in its lifecycle, exactly as RFC-0008 §Per-version status
 * defines it: `draft -> active <-> deprecated -> deleted`, `active` on create,
 * `deleted` terminal. The sibling MCP server registry models the same four states as
 * `MCPStatus` (`mcp-registry/types.ts`): the two registries deliberately read the
 * same, because they implement the same lifecycle.
 *
 * `deleted` is a SOFT state at the storage layer (the version row survives so its
 * number is never reused), but it is NOT observable through any read API: there is no
 * endpoint that returns deleted versions. It appears in this enum because the write
 * path transitions into it, never because a client renders it.
 */
export enum SkillStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  DELETED = 'deleted',
}

/**
 * The four content locations RFC-0008 recognizes.
 *
 * Originally server-set. RFC-0008 PR #44 (merged 2026-09-01, after the 09-01 UX review)
 * changed the contract: an EXTERNAL pointer may now carry an explicit `source_type`,
 * which the server validates against the source value and rejects on contradiction,
 * inferring only when none is submitted. `mlflow` stays flow-derived and is never
 * client-supplied, which is why it is absent from `POINTER_SOURCE_TYPES`.
 *
 * The UI therefore keeps its type selector (the review's ruling) and pre-selects it
 * from the location the user types, rather than removing it in favour of inference.
 */
export enum SkillSourceType {
  GIT = 'git',
  OCI = 'oci',
  ZIP = 'zip',
  MLFLOW = 'mlflow',
}

/**
 * A mutable, named pointer from an alias to a specific integer version.
 * Referenced as `skills:/@{organization}/{name}@{alias}`.
 */
export interface SkillAlias {
  alias: string;
  version: number;
}

/**
 * Where a version's content lives. A version has EXACTLY ONE source: git, OCI, ZIP or
 * MLflow-stored, never a combination. This is the flat shape the REST API returns
 * (`source_type`, `source`, `ref`, `subpath`); the SDK wraps the same data in typed
 * `GitSource` / `OCISource` / `ZipSource` classes, with a plain artifact-path string
 * for `mlflow` content.
 *
 * There is deliberately no separate artifact-location field. For
 * `source_type = 'mlflow'` the artifact path IS the source: content uploaded through
 * the client-side upload flow is stored at a server-chosen path and that path is what
 * lands here. A git-sourced version has no MLflow artifact location at all, because
 * the server never copied its content anywhere.
 */
export interface SkillVersionSource {
  source_type: SkillSourceType;
  /** Clone URL (git), image reference (OCI), archive URL (ZIP), or `mlflow-artifacts:/...` path. */
  source: string;
  /** Branch, tag or resolved commit. GIT ONLY: meaningless on the other three types. */
  ref?: string;
  /** Path to the SKILL.md directory within the repository, image or archive. */
  subpath?: string;
}

/**
 * The logical skill asset. Maps onto MLflow's RegisteredModel in the same way the
 * Prompt Registry maps onto model-registry entities.
 *
 * `organization` is a first-class field, not a prefix baked into `name`: it is part of
 * the primary key `(workspace, organization, name)` and it is what the REST path
 * `/@{organization}/{name}` and the `skills:/@{org}/{name}` URI form are built from.
 * An unscoped skill carries the empty string, and the `@org` segment is then omitted
 * entirely rather than rendered as an empty marker.
 */
export interface SkillEntity {
  organization: string;
  name: string;
  description: string;
  /**
   * Presentation icons, per RFC-0008 §Icons (PR #45, merged 2026-09-01).
   *
   * PARENT-LEVEL and mutable: one icon identifies the skill, not a particular
   * registration of it, which is what the 2026-09-01 review settled when Bill asked
   * whether icons were per skill or per version. Neither the Agent Skills frontmatter nor
   * the Agent Plugins manifest defines an icon field, so this is MLflow-managed metadata
   * with no upstream fallback: when it is unset the UI shows its default glyph.
   *
   * The shape is deliberately identical to RFC-0004's `MCPIcon` so both registries share
   * one renderer -- see `common/components/RegistryIcon`.
   */
  icons?: RegistryIcon[];
  tags: SkillTag[];
  /** Alias pointers that currently resolve to some version of this skill. */
  aliases: SkillAlias[];
  /** Highest live version: a convenience field for listing. */
  latest_version: number;
  creation_timestamp: number;
  last_updated_timestamp: number;
}

/**
 * A registered version of a skill. Maps onto MLflow's ModelVersion.
 *
 * `version` is a SERVER-ASSIGNED MONOTONIC INTEGER, never a semver string: the RFC
 * moved to auto-increment integers because most public skill repositories carry no
 * semantic version of their own. Numbers are allocated over all rows including
 * soft-deleted ones, so a number is never reused.
 *
 * What is immutable here is the METADATA: the version's number and its source pointer
 * are fixed once created. The content at that source can still drift, which is exactly
 * why `digest` exists.
 */
export interface SkillVersionEntity {
  organization: string;
  /** Name of the parent skill. */
  name: string;
  version: number;
  source: SkillVersionSource;
  /**
   * Content hash over the resolved skill content, computed BY THE CLIENT during local
   * inspection and submitted at registration. Client-asserted and never server-verified,
   * and nullable: a version registered as a bare pointer by a client that could not read
   * the content has no digest at all. Two versions sharing a digest are known to be the
   * same content, which is what makes "which of these versions are identical?" answerable.
   */
  digest?: string;
  tags: SkillTag[];
  /** Aliases currently pointing at this specific version. */
  aliases: string[];
  created_by: string;
  last_updated_by?: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
  status: SkillStatus;
}
