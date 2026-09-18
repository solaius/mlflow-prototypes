import { Alert, Modal, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CodeSnippet, type CodeSnippetLanguage } from '@databricks/web-shared/snippet';
import { SkillFileTree } from './SkillFileTree';
import { SkillSourceLinkOut } from './SkillSourceLinkOut';
import { getGitBrowseUrl, getGitFileUrl } from '../constants';
import { resolveSkillFiles } from '../mocks/skillContent';
import type { SkillVersionEntity } from '../types';
import { SkillSourceType } from '../types';
import { parseManifest } from '../utils';

/**
 * The Files tab: a skill's directory, not just its entry point.
 *
 * The 2026-09-01 UX review found the detail page rendering SKILL.md alone, presenting a
 * directory as a single file, when RFC-0008 defines a skill as "a directory containing a
 * SKILL.md entry point plus optional reference files and scripts". Yuki asked for a file
 * explorer; the real collections it is seeded from run from one file to twenty-nine, so
 * the range it has to cope with is real.
 *
 * Two modes, and the difference is the review's own decision rather than a limitation:
 *
 *   Stored     MLflow holds the bytes, so a file opens in a modal over the tree.
 *   Pointer    The registry never fetched the content and will not render it. The listing
 *              still shows -- a skill's shape is worth seeing -- and each row opens that
 *              exact file at that exact ref on the provider.
 *
 * A tree rather than a flat listing, decided at the 2026-09-04 working session -- see
 * `SkillFileTree`. The listing is height-bounded and scrolls inside itself: the tabs now
 * sit below the version metadata, so an expanded tree that grew the page would push
 * everything under it out of view, which was Juntao's concern with moving them.
 */
export const SkillFilesTab = ({
  skillVersion,
  totalVersions,
}: {
  skillVersion: SkillVersionEntity;
  totalVersions: number;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  const resolution = useMemo(() => resolveSkillFiles(skillVersion, totalVersions), [skillVersion, totalVersions]);

  // Two pieces of state rather than one nullable path, because they answer different
  // questions. `activePath` is the last file read and outlives the modal, so the tree can
  // keep marking it; `isFileModalOpen` is whether the reader is looking at it right now.
  // Collapsing them would also blank the modal body mid-close-animation.
  const [activePath, setActivePath] = useState<string | undefined>(undefined);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  const files = resolution.status === 'available' ? resolution.files : [];
  const rendersContent = resolution.status === 'available' && resolution.rendersContent;

  const activeFile = files.find((file) => file.path === activePath);

  const showFile = (path: string) => {
    setActivePath(path);
    setIsFileModalOpen(true);
  };

  const isGit = skillVersion.source.source_type === SkillSourceType.GIT;
  const browseUrl = isGit
    ? getGitBrowseUrl({
        source: skillVersion.source.source,
        ref: skillVersion.source.ref,
        subpath: skillVersion.source.subpath,
      })
    : undefined;

  const linkFor = (filePath: string) =>
    isGit
      ? getGitFileUrl({
          source: skillVersion.source.source,
          ref: skillVersion.source.ref,
          subpath: skillVersion.source.subpath,
          filePath,
        })
      : undefined;

  if (resolution.status === 'unlisted') {
    return (
      <Alert
        componentId="mlflow.skills-registry.files.unlisted"
        type="info"
        closable={false}
        message={intl.formatMessage({
          defaultMessage: 'Content is read from a remote source.',
          description: 'Skills registry > files tab > unlisted alert title',
        })}
        description={
          <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, alignItems: 'flex-start' }}>
            {browseUrl && <SkillSourceLinkOut componentId="mlflow.skills-registry.files.browse" href={browseUrl} />}
          </div>
        }
        css={{ maxWidth: 720 }}
      />
    );
  }

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {!rendersContent && (
        <Alert
          componentId="mlflow.skills-registry.files.pointer"
          type="info"
          closable={false}
          message={intl.formatMessage({
            defaultMessage: 'Files are read at the source, not here',
            description: 'Skills registry > files tab > pointer-source alert title',
          })}
          description={
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, alignItems: 'flex-start' }}>
              <Typography.Text size="sm">
                {isGit ? (
                  <FormattedMessage
                    defaultMessage="Each file opens at the provider, at the registered ref."
                    description="Skills registry > files tab > git pointer explanation"
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Pull the skill with the CLI to read these files."
                    description="Skills registry > files tab > non-git pointer explanation"
                  />
                )}
              </Typography.Text>
              {browseUrl && (
                <SkillSourceLinkOut componentId="mlflow.skills-registry.files.browse-directory" href={browseUrl} />
              )}
            </div>
          }
        />
      )}

      {/*
        Bounded and scrolling inside itself. The tabs moved below the version metadata at
        the 2026-09-04 session, so a tree that grew with every expanded folder would push
        everything after it off the bottom of the page. That was Juntao's objection to the
        move, and Daniel's answer was MLflow's usual one: give long content a fixed frame
        rather than letting it set the page height.

        Full width now that nothing sits beside it -- it used to be a 320px column with the
        file content in the remaining space, which left the tree cramped and the source
        lines wrapping in a half-width pane.
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
          rendersContent={rendersContent}
          activePath={activePath}
          onSelect={showFile}
          hrefFor={linkFor}
        />
      </div>

      {/*
        The file opens over the tree rather than in a column beside it. Both halves were
        losing: the tree had 320px to render nested paths in, and source lines wrapped in
        whatever the pane had left. A modal gives the content the full dialog width and
        leaves the tree the full page width, and it matches what the pointer-source rows
        already do -- click a file, get the file.

        No file is open on arrival. The pane version defaulted to SKILL.md because empty
        space beside a tree reads as broken; a modal that opened by itself would read as
        something the reader did not ask for.
      */}
      <Modal
        componentId="mlflow.skills-registry.files.file-modal"
        title={activeFile?.path}
        visible={isFileModalOpen}
        onCancel={() => setIsFileModalOpen(false)}
        size="wide"
        footer={null}
      >
        {activeFile?.content ? (
          <CodeSnippet
            language={languageForPath(activeFile.path)}
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
            {activeFile.isEntryPoint ? renderManifest(activeFile.content) : activeFile.content}
          </CodeSnippet>
        ) : (
          <Typography.Text color="secondary">
            <FormattedMessage
              defaultMessage="This file is stored but too large to preview here. Pull the skill to read it."
              description="Skills registry > files tab > stored file without carried content"
            />
          </Typography.Text>
        )}
      </Modal>
    </div>
  );
};

/** Frontmatter first, then a blank line, then the body — the order the file is on disk. */
const renderManifest = (content: string): string => {
  const { frontmatter, body } = parseManifest(content);
  return frontmatter ? `---\n${frontmatter}\n---\n\n${body.trimStart()}` : content;
};

const EXTENSION_LANGUAGE = new Map<string, CodeSnippetLanguage>([
  ['.py', 'python'],
  ['.js', 'javascript'],
  ['.mjs', 'javascript'],
  ['.cjs', 'javascript'],
  ['.ts', 'javascript'],
  ['.tsx', 'javascript'],
  ['.jsx', 'javascript'],
  ['.json', 'json'],
  ['.yaml', 'yaml'],
  ['.yml', 'yaml'],
  ['.sql', 'sql'],
  ['.go', 'go'],
  ['.java', 'java'],
  ['.sh', 'bash'],
  ['.bash', 'bash'],
]);

const languageForPath = (path: string): CodeSnippetLanguage => {
  const dot = path.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = path.slice(dot).toLowerCase();
  return EXTENSION_LANGUAGE.get(ext) ?? 'text';
};
