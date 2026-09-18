import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  NewWindowIcon,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type { SkillFileEntry } from '../mocks/skillContent';

/** A directory holds children; a file is a leaf carrying the record the listing came from. */
interface TreeNode {
  name: string;
  path: string;
  file?: SkillFileEntry;
  children: TreeNode[];
}

const formatSize = (bytes: number): string =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;

/**
 * Groups flat paths into directories.
 *
 * The entry point sorts first, then the rest of that level's files, then folders. SKILL.md
 * is the one file whose position is worth engineering: it is what a reader opens first, so
 * it sits at the top of the root rather than wherever alphabetical order puts it.
 */
export const buildSkillFileTree = (files: SkillFileEntry[]): TreeNode[] => {
  const root: TreeNode = { name: '', path: '', children: [] };

  files.forEach((file) => {
    const segments = file.path.split('/').filter(Boolean);
    let node = root;
    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;
      const path = segments.slice(0, index + 1).join('/');
      let child = node.children.find((candidate) => candidate.name === segment && Boolean(candidate.file) === isLeaf);
      if (!child) {
        child = { name: segment, path, children: [] };
        node.children.push(child);
      }
      if (isLeaf) {
        child.file = file;
      }
      node = child;
    });
  });

  const sortLevel = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((node) => ({ ...node, children: sortLevel(node.children) }))
      .sort((a, b) => {
        // Booleans, not the raw optionals: a folder's `isEntryPoint` is `undefined` and a
        // non-entry file's is `false`, and comparing those directly ranks every plain file
        // below every folder.
        const aIsEntry = Boolean(a.file?.isEntryPoint);
        const bIsEntry = Boolean(b.file?.isEntryPoint);
        if (aIsEntry !== bIsEntry) {
          return aIsEntry ? -1 : 1;
        }
        const aIsFile = Boolean(a.file);
        const bIsFile = Boolean(b.file);
        if (aIsFile !== bIsFile) {
          return aIsFile ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

  return sortLevel(root.children);
};

export interface SkillFileTreeProps {
  files: SkillFileEntry[];
  /** When the registry holds the bytes a row selects; otherwise it opens at the provider. */
  rendersContent: boolean;
  activePath?: string;
  onSelect: (path: string) => void;
  hrefFor: (path: string) => string | undefined;
}

/**
 * The skill's directory as a tree.
 *
 * The 2026-09-04 working session chose this over the flat listing it replaces. Juntao made
 * the case and pointed at the trace span view as the precedent already in the product;
 * Daniel agreed. A skill directory nests -- references, scripts, assets -- and a flat list
 * of full paths makes the reader rebuild that structure from repeated prefixes.
 *
 * Folders start expanded. A skill is small enough that its whole shape should be visible
 * without clicking, so collapsing exists for the twenty-nine-file end of the range rather
 * than as a step on the way in. The caller bounds the height, which is what keeps an
 * expanded tree from pushing the rest of the page down.
 */
export const SkillFileTree = ({ files, rendersContent, activePath, onSelect, hrefFor }: SkillFileTreeProps) => {
  const { theme } = useDesignSystemTheme();
  const tree = useMemo(() => buildSkillFileTree(files), [files]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });

  const openFile = (file: SkillFileEntry, href?: string) => {
    if (rendersContent) {
      onSelect(file.path);
    } else if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const renderNodes = (nodes: TreeNode[], depth: number): ReactNode =>
    nodes.map((node) => {
      const indent = theme.spacing.sm + depth * theme.spacing.md;

      if (!node.file) {
        const isOpen = !collapsed.has(node.path);
        return (
          <div key={`dir:${node.path}`}>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => toggle(node.path)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggle(node.path);
                }
              }}
              css={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                paddingLeft: indent,
                paddingRight: theme.spacing.sm,
                paddingTop: 4,
                paddingBottom: 4,
                cursor: 'pointer',
                '&:hover': { backgroundColor: theme.colors.actionDefaultBackgroundHover },
              }}
            >
              {isOpen ? (
                <ChevronDownIcon css={{ flexShrink: 0, color: theme.colors.textSecondary }} />
              ) : (
                <ChevronRightIcon css={{ flexShrink: 0, color: theme.colors.textSecondary }} />
              )}
              {isOpen ? (
                <FolderOpenIcon css={{ flexShrink: 0, color: theme.colors.textSecondary }} />
              ) : (
                <FolderIcon css={{ flexShrink: 0, color: theme.colors.textSecondary }} />
              )}
              <Typography.Text size="sm">{node.name}</Typography.Text>
            </div>
            {isOpen && renderNodes(node.children, depth + 1)}
          </div>
        );
      }

      const file = node.file;
      const href = rendersContent ? undefined : hrefFor(file.path);
      const isActive = rendersContent && file.path === activePath;
      const clickable = rendersContent || Boolean(href);

      return (
        <div
          key={`file:${node.path}`}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={() => openFile(file, href)}
          onKeyDown={(event) => {
            if (clickable && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              openFile(file, href);
            }
          }}
          css={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            // Files line up with the folder NAME above them, not with its chevron.
            paddingLeft: indent + theme.spacing.md,
            paddingRight: theme.spacing.sm,
            paddingTop: 4,
            paddingBottom: 4,
            minWidth: 0,
            cursor: clickable ? 'pointer' : 'default',
            backgroundColor: isActive ? theme.colors.actionDefaultBackgroundPress : undefined,
            '&:hover': clickable ? { backgroundColor: theme.colors.actionDefaultBackgroundHover } : undefined,
          }}
        >
          <FileIcon css={{ flexShrink: 0, color: theme.colors.textSecondary }} />
          <Typography.Text
            size="sm"
            bold={file.isEntryPoint}
            css={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {node.name}
          </Typography.Text>
          <Typography.Text size="sm" color="secondary" css={{ flexShrink: 0 }}>
            {formatSize(file.sizeBytes)}
          </Typography.Text>
          {href && <NewWindowIcon css={{ flexShrink: 0, color: theme.colors.textSecondary }} />}
        </div>
      );
    });

  return (
    <div data-testid="skill-files-tree" css={{ paddingTop: theme.spacing.xs, paddingBottom: theme.spacing.xs }}>
      {renderNodes(tree, 0)}
    </div>
  );
};
