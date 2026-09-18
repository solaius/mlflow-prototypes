import { Tag, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import type { AgentVersionEntity } from '../types';
import { getModelRefUri } from '../constants';

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffRow {
  name: string;
  status: DiffStatus;
  oldValue?: string;
  newValue?: string;
}

/** Diffs two keyed lists where each key maps to one value (a version, a ref, a URI). */
const diffKeyed = (
  oldEntries: { key: string; value: string }[],
  newEntries: { key: string; value: string }[],
): DiffRow[] => {
  const oldMap = new Map(oldEntries.map((entry) => [entry.key, entry.value]));
  const newMap = new Map(newEntries.map((entry) => [entry.key, entry.value]));
  const rows: DiffRow[] = [];
  for (const [key, value] of newMap) {
    const old = oldMap.get(key);
    if (old === undefined) {
      rows.push({ name: key, status: 'added', newValue: value });
    } else if (old !== value) {
      rows.push({ name: key, status: 'changed', oldValue: old, newValue: value });
    } else {
      rows.push({ name: key, status: 'unchanged', oldValue: old, newValue: value });
    }
  }
  for (const [key, value] of oldMap) {
    if (!newMap.has(key)) {
      rows.push({ name: key, status: 'removed', oldValue: value });
    }
  }
  return rows;
};

const STATUS_COLOR: Record<DiffStatus, 'lime' | 'coral' | 'lemon' | undefined> = {
  added: 'lime',
  removed: 'coral',
  changed: 'lemon',
  unchanged: undefined,
};

const STATUS_LABEL: Record<DiffStatus, string> = {
  added: 'added',
  removed: 'removed',
  changed: 'changed',
  unchanged: 'unchanged',
};

const DiffSection = ({ title, rows }: { title: React.ReactNode; rows: DiffRow[] }) => {
  const { theme } = useDesignSystemTheme();
  const changed = rows.filter((row) => row.status !== 'unchanged');
  if (!rows.length) {
    return null;
  }
  return (
    <div>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
        <Typography.Text bold>{title}</Typography.Text>
        <Typography.Text size="sm" color="secondary">
          {changed.length ? (
            <FormattedMessage
              defaultMessage="{count, plural, one {# change} other {# changes}}"
              description="Version diff > change count"
              values={{ count: changed.length }}
            />
          ) : (
            <FormattedMessage defaultMessage="no changes" description="Version diff > no changes" />
          )}
        </Typography.Text>
      </div>
      <div css={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((row) => (
          <div
            key={row.name}
            css={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `2px ${theme.spacing.sm}px`,
              borderRadius: theme.borders.borderRadiusSm,
              opacity: row.status === 'unchanged' ? 0.6 : 1,
            }}
          >
            <Tag
              componentId="mlflow.agent-registry.diff.status"
              color={STATUS_COLOR[row.status]}
              css={{ minWidth: 88, justifyContent: 'center' }}
            >
              {STATUS_LABEL[row.status]}
            </Tag>
            {/* The name keeps its width; a long value (a model URI pair) wraps on its own side. */}
            <Typography.Text css={{ flex: '1 1 auto', minWidth: 96, whiteSpace: 'nowrap' }}>{row.name}</Typography.Text>
            <Typography.Text
              size="sm"
              color="secondary"
              code
              css={{ flex: '0 1 auto', minWidth: 0, maxWidth: '65%', overflowWrap: 'anywhere', textAlign: 'right' }}
            >
              {row.status === 'changed' ? `${row.oldValue} → ${row.newValue}` : (row.newValue ?? row.oldValue ?? '')}
            </Typography.Text>
          </div>
        ))}
      </div>
    </div>
  );
};

/** A naive line diff of two configuration files, enough to show which lines a snapshot changed. */
const diffLines = (before: string, after: string): { kind: 'same' | 'add' | 'del'; line: string }[] => {
  const a = before.split('\n');
  const b = after.split('\n');
  const result: { kind: 'same' | 'add' | 'del'; line: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({ kind: 'same', line: a[i] });
      i += 1;
      j += 1;
    } else if (j < b.length && (i >= a.length || !a.slice(i).includes(b[j]))) {
      result.push({ kind: 'add', line: b[j] });
      j += 1;
    } else if (i < a.length) {
      result.push({ kind: 'del', line: a[i] });
      i += 1;
    }
  }
  return result;
};

/**
 * Side-by-side BOM diff between two immutable versions, RFC-0011's versioning journey:
 * `billing-policy` skill 1 → 2, a model swapped, an MCP server added. Immutable versions
 * are what make it trustworthy: it reflects what was registered, not what a mutable record
 * drifted into. Sources, the harness and the configuration snapshot diff too -- "when both
 * versions carry configuration snapshots, those diff as content".
 */
export const AgentVersionDiff = ({
  oldVersion,
  newVersion,
}: {
  oldVersion: AgentVersionEntity;
  newVersion: AgentVersionEntity;
}) => {
  const { theme } = useDesignSystemTheme();

  const sections = useMemo(
    () => ({
      skills: diffKeyed(
        oldVersion.bom.skills.map((ref) => ({ key: ref.name, value: `v${ref.version}` })),
        newVersion.bom.skills.map((ref) => ({ key: ref.name, value: `v${ref.version}` })),
      ),
      plugins: diffKeyed(
        oldVersion.bom.agent_plugins.map((ref) => ({ key: ref.name, value: ref.version })),
        newVersion.bom.agent_plugins.map((ref) => ({ key: ref.name, value: ref.version })),
      ),
      mcp: diffKeyed(
        oldVersion.bom.mcp_servers.map((ref) => ({ key: ref.name, value: ref.version })),
        newVersion.bom.mcp_servers.map((ref) => ({ key: ref.name, value: ref.version })),
      ),
      models: diffKeyed(
        oldVersion.bom.models.map((ref) => ({ key: ref.role ?? ref.name, value: getModelRefUri(ref) })),
        newVersion.bom.models.map((ref) => ({ key: ref.role ?? ref.name, value: getModelRefUri(ref) })),
      ),
      agents: diffKeyed(
        oldVersion.bom.agents.map((ref) => ({ key: ref.name, value: ref.version ?? 'name-level' })),
        newVersion.bom.agents.map((ref) => ({ key: ref.name, value: ref.version ?? 'name-level' })),
      ),
      sources: diffKeyed(
        oldVersion.sources.map((source) => ({
          key: `${source.source_type}: ${source.source}`,
          value: source.ref ?? '',
        })),
        newVersion.sources.map((source) => ({
          key: `${source.source_type}: ${source.source}`,
          value: source.ref ?? '',
        })),
      ),
      harness: diffKeyed(
        oldVersion.harness ? [{ key: oldVersion.harness.name, value: oldVersion.harness.version ?? '' }] : [],
        newVersion.harness ? [{ key: newVersion.harness.name, value: newVersion.harness.version ?? '' }] : [],
      ),
    }),
    [oldVersion, newVersion],
  );

  const configDiff = useMemo(() => {
    if (!oldVersion.config_snapshot || !newVersion.config_snapshot) {
      return undefined;
    }
    const oldFiles = new Map(oldVersion.config_snapshot.files.map((file) => [file.path, file]));
    const newFiles = new Map(newVersion.config_snapshot.files.map((file) => [file.path, file]));
    const paths = [...new Set([...oldFiles.keys(), ...newFiles.keys()])].sort();
    return paths
      .map((path) => {
        const before = oldFiles.get(path);
        const after = newFiles.get(path);
        if (
          before &&
          after &&
          before.content !== undefined &&
          after.content !== undefined &&
          before.content !== after.content
        ) {
          return { path, lines: diffLines(before.content, after.content) };
        }
        if (!before) {
          return { path, lines: (after?.content ?? '').split('\n').map((line) => ({ kind: 'add' as const, line })) };
        }
        if (!after) {
          return { path, lines: (before.content ?? '').split('\n').map((line) => ({ kind: 'del' as const, line })) };
        }
        return undefined;
      })
      .filter((entry): entry is { path: string; lines: { kind: 'same' | 'add' | 'del'; line: string }[] } =>
        Boolean(entry),
      );
  }, [oldVersion, newVersion]);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {(oldVersion.composition === 'undeclared' || newVersion.composition === 'undeclared') && (
        <Typography.Text color="secondary" size="sm">
          <FormattedMessage
            defaultMessage="One side has undeclared composition, so its bill of materials is unknown rather than empty."
            description="Version diff > undeclared warning"
          />
        </Typography.Text>
      )}
      <DiffSection
        title={<FormattedMessage defaultMessage="Skills" description="Diff section > skills" />}
        rows={sections.skills}
      />
      <DiffSection
        title={<FormattedMessage defaultMessage="Agent plugins" description="Diff section > plugins" />}
        rows={sections.plugins}
      />
      <DiffSection
        title={<FormattedMessage defaultMessage="MCP servers" description="Diff section > MCP" />}
        rows={sections.mcp}
      />
      <DiffSection
        title={<FormattedMessage defaultMessage="Models" description="Diff section > models" />}
        rows={sections.models}
      />
      <DiffSection
        title={<FormattedMessage defaultMessage="Agents it calls" description="Diff section > agents" />}
        rows={sections.agents}
      />
      <DiffSection
        title={<FormattedMessage defaultMessage="Sources" description="Diff section > sources" />}
        rows={sections.sources}
      />
      <DiffSection
        title={<FormattedMessage defaultMessage="Harness" description="Diff section > harness" />}
        rows={sections.harness}
      />

      {configDiff && (
        <div>
          <Typography.Text bold>
            <FormattedMessage defaultMessage="Configuration snapshot" description="Diff section > config snapshot" />
          </Typography.Text>
          {configDiff.length === 0 ? (
            <div>
              <Typography.Text size="sm" color="secondary">
                <FormattedMessage defaultMessage="no changes" description="Version diff > no changes" />
              </Typography.Text>
            </div>
          ) : (
            configDiff.map(({ path, lines }) => (
              <div key={path} css={{ marginTop: theme.spacing.sm }}>
                <Typography.Text code>{path}</Typography.Text>
                <pre
                  css={{
                    margin: `${theme.spacing.xs}px 0 0`,
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borders.borderRadiusSm,
                    fontFamily: 'Source Code Pro, Menlo, monospace',
                    fontSize: theme.typography.fontSizeSm,
                    overflowX: 'auto',
                    maxHeight: 260,
                  }}
                >
                  {lines.map((entry, index) => (
                    <div
                      key={index}
                      css={{
                        backgroundColor:
                          entry.kind === 'add'
                            ? theme.colors.tagLime
                            : entry.kind === 'del'
                              ? theme.colors.tagCoral
                              : undefined,
                        opacity: entry.kind === 'same' ? 0.7 : 1,
                      }}
                    >
                      {entry.kind === 'add' ? '+ ' : entry.kind === 'del' ? '- ' : '  '}
                      {entry.line}
                    </div>
                  ))}
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
