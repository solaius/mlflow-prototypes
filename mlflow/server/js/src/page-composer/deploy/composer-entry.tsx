import React, { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-expect-error - react-dom/client types not available in this project's @types/react-dom version
import { createRoot } from 'react-dom/client';
import {
  Button,
  DesignSystemProvider,
  DesignSystemThemeProvider,
  ApplyGlobalStyles,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { Global } from '@emotion/react';
import '@databricks/design-system/dist/index.css';
import '@databricks/design-system/dist/index-dark.css';
import { PageComposer } from '../PageComposer';
import { Render } from '@puckeditor/core';
import type { Data } from '@puckeditor/core';
import { puckConfig } from '../puck-components';
import LZString from 'lz-string';

let pfThemeTranslation: ((theme: any) => any) | null = null;
let pfShellClassName = '';

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pf = require('../../common/styles/patternfly/patternflyTokenTranslation');
  pfThemeTranslation = pf.PATTERN_FLY_TOKEN_TRANSLATION;
  pfShellClassName = 'pf-shell-root';
  require('@patternfly/patternfly/patternfly.css');
  require('../../common/styles/patternfly/pf-shell-overrides.scss');
} catch {
  // Upstream — no PF overrides
}

const pfThemeFunction = pfThemeTranslation ? (base: any) => pfThemeTranslation!(base) : null;

const PfFontOverrides = pfThemeTranslation
  ? () => (
      <Global
        styles={{
          '.pf-shell-root': {
            '--puck-font-family': 'var(--pf-t--global--font--family--body)',
          },
        }}
      />
    )
  : () => null;

interface SharedJourney {
  journey: string;
  snapshots: { name: string; data: Data }[];
}

function parseSharedHash(): { type: 'page'; data: Data } | { type: 'journey'; payload: SharedJourney } | null {
  try {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('share:')) {
      const json = LZString.decompressFromEncodedURIComponent(hash.slice(6));
      if (!json) return null;
      const data = JSON.parse(json);
      if (data && Array.isArray(data.content) && data.root) return { type: 'page', data: data as Data };
    }
    if (hash.startsWith('journey:')) {
      const json = LZString.decompressFromEncodedURIComponent(hash.slice(8));
      if (!json) return null;
      const payload = JSON.parse(json);
      if (payload && payload.journey && Array.isArray(payload.snapshots)) return { type: 'journey', payload };
    }
  } catch {
    // invalid share link
  }
  return null;
}

const SharedPreviewToolbar: React.FC<{ title: string; onOpenEditor: () => void; onCopyJSON: () => void }> = ({
  title,
  onOpenEditor,
  onCopyJSON,
}) => {
  const { theme } = useDesignSystemTheme();
  return (
    <div
      css={{
        padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
        display: 'flex',
        gap: theme.spacing.sm,
        alignItems: 'center',
        borderBottom: `1px solid ${theme.colors.borderDecorative}`,
        backgroundColor: theme.colors.backgroundSecondary,
        flexShrink: 0,
      }}
    >
      <Typography.Text bold>{title}</Typography.Text>
      <Typography.Text color="secondary" css={{ flex: 1 }}>
        Read-only view
      </Typography.Text>
      <Button componentId="shared-preview.open-editor" size="small" type="primary" onClick={onOpenEditor}>
        Open in Editor
      </Button>
      <Button componentId="shared-preview.copy-json" size="small" onClick={onCopyJSON}>
        Copy JSON
      </Button>
    </div>
  );
};

const SharedPreview: React.FC<{ data: Data }> = ({ data }) => (
  <div css={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
    <SharedPreviewToolbar
      title="Shared Design Preview"
      onOpenEditor={() => {
        localStorage.setItem('mlflow-page-composer-data', JSON.stringify(data));
        window.location.hash = '';
        window.location.reload();
      }}
      onCopyJSON={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
    />
    <div css={{ flex: 1, overflow: 'auto' }}>
      <Render config={puckConfig} data={data} />
    </div>
  </div>
);

const SharedJourneyPreview: React.FC<{ payload: SharedJourney }> = ({ payload }) => {
  const { theme } = useDesignSystemTheme();
  const [index, setIndex] = useState(0);
  const current = payload.snapshots[index];
  return (
    <div css={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <SharedPreviewToolbar
        title={`Journey: ${payload.journey}`}
        onOpenEditor={() => {
          if (current) localStorage.setItem('mlflow-page-composer-data', JSON.stringify(current.data));
          window.location.hash = '';
          window.location.reload();
        }}
        onCopyJSON={() =>
          navigator.clipboard.writeText(
            JSON.stringify(
              payload.snapshots.map((s) => ({ name: s.name, data: s.data })),
              null,
              2,
            ),
          )
        }
      />
      <div
        css={{
          padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
          display: 'flex',
          gap: theme.spacing.sm,
          alignItems: 'center',
          borderBottom: `1px solid ${theme.colors.borderDecorative}`,
          flexShrink: 0,
        }}
      >
        <Button
          componentId="shared-journey.prev"
          size="small"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          Previous
        </Button>
        <Button
          componentId="shared-journey.next"
          size="small"
          disabled={index === payload.snapshots.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Next
        </Button>
        <Typography.Text bold>
          {index + 1} / {payload.snapshots.length}
        </Typography.Text>
        <Typography.Text color="secondary"> — </Typography.Text>
        <Typography.Text>{current?.name}</Typography.Text>
      </div>
      <div css={{ flex: 1, overflow: 'auto' }}>{current && <Render config={puckConfig} data={current.data} />}</div>
    </div>
  );
};

const darkModeBodyClassName = 'dark-mode';
const darkModeLocalStorageKey = '_mlflow_dark_mode_toggle_enabled';

/**
 * Overrides Puck editor CSS custom properties to match the DuBois dark palette.
 * All values come from theme.colors (semantic tokens + primitive greys) —
 * nothing is hardcoded, so if DuBois updates its palette, this follows automatically.
 *
 * Puck's grey ramp (grey-01=darkest … grey-12=lightest in light mode) is inverted
 * to map onto the DuBois primitive greys (grey100=lightest … grey800=darkest).
 */
const PuckDarkModeOverrides = () => {
  const { theme } = useDesignSystemTheme();

  const styles = useMemo(() => {
    if (!theme.isDarkMode) return null;

    const c = theme.colors;

    return {
      body: {
        [`&.${darkModeBodyClassName}`]: {
          colorScheme: 'dark' as const,

          // Surface colors — semantic tokens
          '--puck-color-white': c.backgroundPrimary,
          '--puck-color-black': c.textPrimary,
          '--puck-color-surface': c.backgroundPrimary,
          '--puck-color-surface-muted': c.backgroundSecondary,
          '--puck-color-surface-subtle': c.backgroundPrimary,
          '--puck-color-surface-inverse': c.textPrimary,

          // Border colors — semantic tokens
          '--puck-color-border': c.border,
          '--puck-color-border-hover': c.borderAccessible,
          '--puck-color-border-muted': c.border,
          '--puck-color-border-inverse': c.borderAccessible,

          // Text colors — semantic tokens
          '--puck-color-text': c.textPrimary,
          '--puck-color-text-secondary': c.textSecondary,
          '--puck-color-text-muted': c.textPlaceholder,
          '--puck-color-text-subtle': c.textPlaceholder,
          '--puck-color-text-inverse': c.backgroundPrimary,
          '--puck-color-text-disabled': c.actionDisabledText,
          '--puck-color-bg-disabled': c.actionDisabledBackground,

          // Interactive colors — semantic tokens
          '--puck-color-interactive': c.actionPrimaryBackgroundDefault,
          '--puck-color-interactive-soft': c.backgroundSecondary,
          '--puck-color-interactive-soft-hover': c.actionDefaultBackgroundHover,
          '--puck-color-interactive-neutral-hover': c.backgroundSecondary,
          '--puck-color-interactive-subtle': c.backgroundSecondary,
          '--puck-color-selection-bg': `color-mix(in srgb, ${c.actionPrimaryBackgroundDefault} 20%, transparent)`,
          '--puck-color-selection-border': c.actionPrimaryBackgroundDefault,
          '--puck-color-overlay-backdrop': c.overlayOverlay,

          // Grey ramp — primitive greys (inverted for dark mode)
          '--puck-color-grey-01': c.grey100,
          '--puck-color-grey-02': c.grey200,
          '--puck-color-grey-03': c.grey300,
          '--puck-color-grey-04': c.grey350,
          '--puck-color-grey-05': c.grey400,
          '--puck-color-grey-06': c.grey500,
          '--puck-color-grey-07': c.grey600,
          '--puck-color-grey-08': c.grey650,
          '--puck-color-grey-09': c.grey700,
          '--puck-color-grey-10': c.grey700,
          '--puck-color-grey-11': c.grey800,
          '--puck-color-grey-12': c.grey800,
        },
      },
    };
  }, [theme]);

  if (!styles) return null;
  return <Global styles={styles} />;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>Page Composer failed to render</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const pref = localStorage.getItem(darkModeLocalStorageKey);
      if (pref !== null) return pref === 'true';
    } catch {
      // ignore
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches || false;
  });

  useEffect(() => {
    document.body.classList.toggle(darkModeBodyClassName, isDarkMode);
    try {
      localStorage.setItem(darkModeLocalStorageKey, isDarkMode ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode((d) => !d), []);
  const [sharedHash] = useState(() => parseSharedHash());

  const content = (
    <DesignSystemProvider>
      <ApplyGlobalStyles />
      <PuckDarkModeOverrides />
      <PfFontOverrides />
      <div className={pfShellClassName}>
        {sharedHash?.type === 'page' ? (
          <SharedPreview data={sharedHash.data} />
        ) : sharedHash?.type === 'journey' ? (
          <SharedJourneyPreview payload={sharedHash.payload} />
        ) : (
          <PageComposer isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        )}
      </div>
    </DesignSystemProvider>
  );

  return (
    <ErrorBoundary>
      <DesignSystemThemeProvider isDarkMode={isDarkMode}>
        {pfThemeFunction ? <EmotionThemeProvider theme={pfThemeFunction}>{content}</EmotionThemeProvider> : content}
      </DesignSystemThemeProvider>
    </ErrorBoundary>
  );
};

window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver')) e.stopImmediatePropagation();
});

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
