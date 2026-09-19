import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

/**
 * A link out of the registry to somebody else's site, shown as the URL it actually goes to.
 *
 * Two decisions from the 2026-09-04 working session, both about the same problem. Bill's
 * was to replace the "browse this version at its source" label with the link itself: the
 * registry stores a pointer, so where that pointer goes is the fact worth showing, and a
 * friendly label hides the one thing a reader needs to judge before clicking.
 *
 * Juntao's was the disclaimer. Registered content is third-party by definition -- the
 * registry never fetched it and cannot vouch for it -- so leaving the product is a moment
 * worth marking. Deliberately one short line rather than a warning banner: this is the
 * normal way to reach a git-sourced skill, not an error.
 */
/**
 * Juntao's disclaimer on its own, for a caller that is already showing the URL.
 *
 * Extracted rather than copied so the sentence has one definition: the version pane needs
 * it beside a link it renders itself, and a second `FormattedMessage` with the same text
 * would be two strings for translators to keep in step.
 */
export const SkillSourceDisclaimer = () => (
  <Typography.Text size="sm" color="secondary">
    <FormattedMessage
      defaultMessage="Opens a third-party site. Check you trust the source before using what it contains."
      description="Skills registry > disclaimer shown beside a link that leaves the product"
    />
  </Typography.Text>
);

export const SkillSourceLinkOut = ({ componentId, href }: { componentId: string; href: string }) => {
  const { theme } = useDesignSystemTheme();

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {/*
        No `NewWindowIcon` here: `openInNewTab` makes `Typography.Link` append one itself,
        so adding a second was drawing the glyph twice.
      */}
      <Typography.Link
        componentId={componentId}
        href={href}
        openInNewTab
        css={{ fontSize: theme.typography.fontSizeSm, wordBreak: 'break-all' }}
      >
        {href}
      </Typography.Link>
      <SkillSourceDisclaimer />
    </div>
  );
};
