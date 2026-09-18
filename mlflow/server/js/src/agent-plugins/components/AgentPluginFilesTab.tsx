import { Alert, Modal, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CodeSnippet } from '@databricks/web-shared/snippet';
import { codeLanguageForPath } from '../../common/utils/codeLanguageForPath';

import { SkillFileTree } from '../../skills-registry/components/SkillFileTree';
import { SkillSourceLinkOut } from '../../skills-registry/components/SkillSourceLinkOut';
import { getGitBrowseUrl, getGitFileUrl, parseSkillQualifiedName } from '../../skills-registry/constants';
import type { SkillFileEntry } from '../../skills-registry/mocks/skillContent';
import { resolveSkillFiles } from '../../skills-registry/mocks/skillContent';
import { useSkillVersionsStore } from '../../skills-registry/mocks/skillsStore';
import { SkillSourceType } from '../../skills-registry/types';
import { PluginMembersCell } from './AgentPluginCellRenderers';
import type { AgentPluginVersionEntity } from '../types';
import { isMCPServerMember, isSkillMember } from '../types';
import { getPluginVersionKind } from '../utils';

const MANIFEST_PATH = 'plugin.json';
const MCP_JSON_PATH = 'mcp.json';

/**
 * The package tree of a PACKAGED version, in the skill registry's file tree.
 *
 * A packaged plugin is a directory: `plugin.json` at the root, `skills/<name>/` for each
 * member, `mcp.json` when the standard MCP block is present, and whatever else the
 * publisher shipped. The registry holds exactly one of those files itself -- the canonical
 * manifest -- so that one opens in the pane; each skill's files are the member skill's own
 * listing, and open at the provider exactly as they do on the skill's page; `mcp.json` is
 * listed because RFC-0008 recognises and preserves it, and not opened because nothing
 * registers it.
 *
 * An ASSEMBLED version has no package to list. The tab says so and points at the members,
 * whose files live on their own pages, rather than composing a tree the registry would
 * never actually hold.
 */
export const AgentPluginFilesTab = ({ pluginVersion }: { pluginVersion: AgentPluginVersionEntity }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const skillVersions = useSkillVersionsStore();
  const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  const kind = getPluginVersionKind(pluginVersion.source);

  const { files, hrefs } = useMemo(() => {
    const entries: SkillFileEntry[] = [];
    const links = new Map<string, string | undefined>();
    if (kind !== 'packaged') {
      return { files: entries, hrefs: links };
    }

    entries.push({
      path: MANIFEST_PATH,
      content: JSON.stringify(pluginVersion.plugin_json, null, 2),
      sizeBytes: JSON.stringify(pluginVersion.plugin_json).length,
      isEntryPoint: true,
    });
    if (pluginVersion.members.some(isMCPServerMember)) {
      entries.push({ path: MCP_JSON_PATH, sizeBytes: 0, isEntryPoint: false });
    }

    for (const member of pluginVersion.members) {
      if (!isSkillMember(member)) {
        continue;
      }
      const { organization, name } = parseSkillQualifiedName(member.name);
      const skillVersion = skillVersions.find(
        (entry) => entry.organization === organization && entry.name === name && entry.version === member.version,
      );
      if (!skillVersion) {
        continue;
      }
      const total = Math.max(
        ...skillVersions
          .filter((entry) => entry.organization === organization && entry.name === name)
          .map((entry) => entry.version),
        0,
      );
      const resolution = resolveSkillFiles(skillVersion, total);
      if (resolution.status !== 'available') {
        continue;
      }
      for (const file of resolution.files) {
        const path = `skills/${name}/${file.path}`;
        entries.push({ ...file, path, isEntryPoint: false });
        links.set(
          path,
          skillVersion.source.source_type === SkillSourceType.GIT
            ? getGitFileUrl({
                source: skillVersion.source.source,
                ref: skillVersion.source.ref,
                subpath: skillVersion.source.subpath,
                filePath: file.path,
              })
            : undefined,
        );
      }
    }
    return { files: entries, hrefs: links };
  }, [kind, pluginVersion, skillVersions]);

  if (kind === 'assembled') {
    return (
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, maxWidth: 720 }}>
        <Alert
          componentId="mlflow.agent-plugins.files.assembled"
          type="info"
          closable={false}
          message={intl.formatMessage({
            defaultMessage: 'An assembled version has no package',
            description: 'Agent plugins > files tab > assembled alert title',
          })}
          description={intl.formatMessage({
            defaultMessage:
              'Its content is its members, each fetched from its own source into a skills directory named after it. The files are on each member skill’s page.',
            description: 'Agent plugins > files tab > assembled alert description',
          })}
        />
        <PluginMembersCell members={pluginVersion.members} />
      </div>
    );
  }

  const activePath = selectedPath;
  const showFile = (path: string) => {
    setSelectedPath(path);
    setIsFileModalOpen(true);
  };
  const activeFile = files.find((file) => file.path === activePath);
  const activeHref = activePath ? hrefs.get(activePath) : undefined;

  const browseUrl =
    pluginVersion.source.source_type === SkillSourceType.GIT && pluginVersion.source.source
      ? getGitBrowseUrl({
          source: pluginVersion.source.source,
          ref: pluginVersion.source.ref,
          subpath: pluginVersion.source.subpath,
        })
      : undefined;

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <Typography.Text color="secondary" size="sm">
        <FormattedMessage
          defaultMessage="The package as pull fetches it: the manifest the registry holds, the member skills at their derived paths, and the content that is preserved but not registered."
          description="Agent plugins > files tab > packaged explanation"
        />
      </Typography.Text>
      {browseUrl && <SkillSourceLinkOut componentId="mlflow.agent-plugins.files.browse" href={browseUrl} />}

      {/*
        The skills files arrangement: a full-width tree in a bounded, internally scrolling
        frame, and a file opens in a modal over it with syntax highlighting and line numbers.
        Nothing opens on arrival (demo-prep#15, stakeholder#7).
      */}
      <div
        css={{
          minWidth: 0,
          maxHeight: 420,
          overflow: 'auto',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borders.borderRadiusMd,
        }}
      >
        <SkillFileTree
          files={files}
          rendersContent
          activePath={activePath}
          onSelect={showFile}
          hrefFor={(path) => hrefs.get(path)}
        />
      </div>

      <Modal
        componentId="mlflow.agent-plugins.files.file-modal"
        title={activeFile?.path}
        visible={isFileModalOpen}
        onCancel={() => setIsFileModalOpen(false)}
        size="wide"
        footer={null}
      >
        {activeFile?.content ? (
          <CodeSnippet
            language={codeLanguageForPath(activeFile.path)}
            showLineNumbers
            style={{
              margin: 0,
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borders.borderRadiusMd,
              maxHeight: '60vh',
              overflow: 'auto',
              fontSize: theme.typography.fontSizeSm,
              lineHeight: theme.typography.lineHeightSm,
            }}
            wrapLongLines
          >
            {activeFile.content}
          </CodeSnippet>
        ) : activePath === MCP_JSON_PATH ? (
          <Typography.Text color="secondary">
            <FormattedMessage
              defaultMessage="Recognized standard content. Preserved in the package and pulled with it, but not registered: its servers appear as members, its configuration stays here."
              description="Agent plugins > files tab > mcp.json explanation"
            />
          </Typography.Text>
        ) : activeHref ? (
          <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, alignItems: 'flex-start' }}>
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="Content is read from a remote source."
                description="Agent plugins > files tab > provider-linked file explanation"
              />
            </Typography.Text>
            <SkillSourceLinkOut componentId="mlflow.agent-plugins.files.open" href={activeHref} />
          </div>
        ) : (
          <Typography.Text color="secondary">
            <FormattedMessage
              defaultMessage="No listing beyond the name. The registry did not fetch this content."
              description="Agent plugins > files tab > no content explanation"
            />
          </Typography.Text>
        )}
      </Modal>
    </div>
  );
};
