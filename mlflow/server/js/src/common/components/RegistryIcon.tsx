import { useDesignSystemTheme } from '@databricks/design-system';
import { useEffect, useState } from 'react';

/**
 * An icon descriptor as the MLflow registries store it.
 *
 * RFC-0008 §Icons defines this shape for skills and agent plugins and says outright that
 * it matches RFC-0004's `MCPIcon` "so UIs share one icon renderer across registries". This
 * module is that renderer. Keeping it here rather than copying MCP's is the difference
 * between three registries that happen to look alike today and three that stay alike.
 */
export interface RegistryIcon {
  src: string;
  sizes?: string[];
  mimeType?: string;
  theme?: string;
  /** Where the icon came from, for registries that inherit one from a payload. */
  source?: string;
}

/**
 * Picks the icon matching the active theme, falling back to an unthemed one.
 *
 * A registry can carry both a light and a dark variant, and a publisher who supplies only
 * one expects it used everywhere — which is why the untagged icon is the fallback rather
 * than nothing.
 */
export const resolveRegistryIcon = (icons?: RegistryIcon[], isDarkMode?: boolean): RegistryIcon | undefined => {
  if (!icons?.length) {
    return undefined;
  }
  const preferred = isDarkMode ? 'dark' : 'light';
  return icons.find((icon) => icon.theme === preferred) ?? icons.find((icon) => !icon.theme);
};

/**
 * Allows only http(s) URLs through.
 *
 * Icons are publisher-supplied strings rendered into an `img src`, which makes them an
 * injection surface: `javascript:` and `data:` both belong to the publisher rather than to
 * the registry. Anything that is not an ordinary web URL is dropped and the default glyph
 * shows instead.
 */
export const sanitizeIconHref = (url: string | undefined): string | undefined => {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
  } catch {
    // Malformed URL: treat as absent rather than guessing at a fix.
  }
  return undefined;
};

/**
 * Tracks which of a primary and a fallback icon source is still worth attempting.
 *
 * A registered icon URL is a pointer to somewhere the registry does not control, so it can
 * simply stop resolving. Without this, a dead URL leaves a broken-image glyph in a list —
 * worse than the default icon it replaced.
 */
export const useIconFallback = (primarySrc: string | undefined, fallbackSrc: string | undefined) => {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => setPrimaryFailed(false), [primarySrc]);
  useEffect(() => setFallbackFailed(false), [fallbackSrc]);

  const activeSrc =
    primarySrc && !primaryFailed
      ? primarySrc
      : fallbackSrc && !fallbackFailed && fallbackSrc !== primarySrc
        ? fallbackSrc
        : undefined;

  const onError = () => {
    if (activeSrc === primarySrc) {
      setPrimaryFailed(true);
    } else {
      setFallbackFailed(true);
    }
  };

  return { activeSrc, onError };
};

export interface RegistryIconImageProps {
  icons?: RegistryIcon[];
  /** A second set to try when the first has none that resolve. */
  fallbackIcons?: RegistryIcon[];
  /** Rendered when no icon resolves. Each registry passes its own default glyph. */
  placeholder: React.ReactNode;
  /** Alt text; usually the entity name. */
  name?: string;
  size?: number;
  /**
   * Styles for the icon's chip.
   *
   * This is what makes a `css` prop on this component work, and it has to be `className`
   * rather than `css`: Emotion's JSX transform serializes a `css` prop on a COMPONENT and
   * passes the result down as `className`, so a `css` prop declared here would never be
   * reached. Callers still write `css={...}`; this is the seam it arrives through.
   *
   * Note that it does not reach `placeholder`, which is the caller's own element and is
   * rendered untouched. A caller styling the icon has to style its placeholder too.
   */
  className?: string;
}

/**
 * Renders an entity's icon, or the caller's placeholder when none resolves.
 *
 * The placeholder is a prop rather than a built-in default because the glyph is the one
 * genuinely per-registry part: a puzzle piece for skills, the MCP mark for servers. Every
 * other behaviour — theme selection, sanitising, failure fallback, sizing — is identical
 * by specification, and lives here.
 */
export const RegistryIconImage = ({
  icons,
  fallbackIcons,
  placeholder,
  name,
  size = 16,
  className,
}: RegistryIconImageProps) => {
  const { theme } = useDesignSystemTheme();
  const primarySrc = sanitizeIconHref(resolveRegistryIcon(icons, theme.isDarkMode)?.src);
  const fallbackSrc = sanitizeIconHref(resolveRegistryIcon(fallbackIcons, theme.isDarkMode)?.src);
  const { activeSrc, onError } = useIconFallback(primarySrc, fallbackSrc);

  if (!activeSrc) {
    return <>{placeholder}</>;
  }

  /*
    The image sits on a light chip rather than directly on the page.

    A registered icon is an arbitrary third-party image, and a great many of them are
    monochrome marks drawn in near-black -- which is invisible against a dark theme. The
    registry cannot recolour someone's logo, and should not try, so it gives every icon a
    consistent light ground instead. This is what npm, the VS Code marketplace and every
    other registry showing publisher art in a dark UI settle on, for the same reason.
  */
  return (
    <span
      className={className}
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size + 6,
        height: size + 6,
        borderRadius: theme.borders.borderRadiusSm,
        backgroundColor: theme.colors.white,
        border: `1px solid ${theme.colors.borderDecorative}`,
      }}
    >
      <img
        src={activeSrc}
        alt={name || ''}
        // The icon is third-party and the registry gains nothing by telling its host where
        // the viewer came from.
        referrerPolicy="no-referrer"
        onError={onError}
        css={{ width: size, height: size, objectFit: 'contain' }}
      />
    </span>
  );
};
