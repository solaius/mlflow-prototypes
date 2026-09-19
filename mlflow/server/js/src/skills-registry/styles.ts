import type { Theme } from '@emotion/react';

type ThemeType = Theme;

/**
 * Shared layout primitives for the Skills Registry, deliberately identical to the MCP
 * server registry's `mcp-registry/styles.ts`. The two registries sit next to each other
 * in the same sidebar, so a skill card and an MCP server card being the same size on
 * the same grid is not a cosmetic detail: it is what makes them read as one product
 * rather than two features that happened to ship together.
 */
export const cardGridStyles = (theme: ThemeType) => ({
  flex: '0 1 auto',
  overflow: 'auto',
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: theme.spacing.md,
  paddingTop: theme.spacing.md,
});

export const textClampStyles = (lines: number) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical' as const,
});

export const textEllipsisStyles = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

export const noShrinkStyles = { flexShrink: 0 };

export const cardBodyStyles = (theme: ThemeType) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: theme.spacing.sm,
  flexGrow: 1,
});

export const cardHeaderRowStyles = (theme: ThemeType) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  minWidth: 0,
});

export const flexColumnContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1,
  minHeight: 0,
};
