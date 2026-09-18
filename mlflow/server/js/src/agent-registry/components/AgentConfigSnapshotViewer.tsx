import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { SkillFileTree } from '../../skills-registry/components/SkillFileTree';
import type { AgentConfigSnapshot } from '../types';

/**
 * The configuration snapshot artifact, in the skill registry's file tree with the pane
 * beside it. The registry holds these bytes -- they were uploaded at registration -- so
 * every file opens in place, unlike a source pointer's files.
 */
export const AgentConfigSnapshotViewer = ({ snapshot }: { snapshot: AgentConfigSnapshot }) => {
  const { theme } = useDesignSystemTheme();
  const files = snapshot.files.map((file, index) => ({
    path: file.path,
    content: file.content,
    sizeBytes: file.size_bytes,
    isEntryPoint: index === 0,
  }));
  const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined);
  const activePath = selectedPath ?? files[0]?.path;
  const active = files.find((file) => file.path === activePath);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, minWidth: 0 }}>
      <Typography.Text code size="sm" css={{ wordBreak: 'break-all' }}>
        {snapshot.artifact_path}
      </Typography.Text>
      <div
        css={{
          display: 'flex',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borders.borderRadiusMd,
          height: 240,
          minHeight: 0,
        }}
      >
        <div css={{ flex: '0 0 220px', overflow: 'auto', borderRight: `1px solid ${theme.colors.border}` }}>
          <SkillFileTree
            files={files}
            rendersContent
            activePath={activePath}
            onSelect={setSelectedPath}
            hrefFor={() => undefined}
          />
        </div>
        <div css={{ flex: 1, minWidth: 0, overflow: 'auto', padding: theme.spacing.sm }}>
          {active?.content !== undefined ? (
            <pre
              css={{
                margin: 0,
                fontFamily: 'Source Code Pro, Menlo, monospace',
                fontSize: theme.typography.fontSizeSm,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {active.content}
            </pre>
          ) : (
            <Typography.Text color="secondary" size="sm">
              <FormattedMessage
                defaultMessage="Stored as an artifact; content not carried in this prototype."
                description="Config snapshot viewer > no content"
              />
            </Typography.Text>
          )}
        </div>
      </div>
      <Typography.Text size="sm" color="secondary">
        <FormattedMessage
          defaultMessage="Immutable. Captures only what the bill of materials does not already govern; redaction happened client-side before upload."
          description="Config snapshot viewer > caption"
        />
      </Typography.Text>
    </div>
  );
};
