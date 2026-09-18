import { CheckCircleIcon, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';

/**
 * Read-only, clearly-labeled placeholder for the governance tracks a distribution built on top
 * of this registry (e.g. an RHOAI-flavored fork) would layer on: approval, verification, and
 * certification. None of this exists in MLflow core today — the entities this prototype models
 * (`MCPServer` / `MCPServerVersion` / `MCPAccessEndpoint`) carry no trust-tier, review, or scan
 * fields. This panel exists purely so that gap is visible in the UI rather than silently
 * absent, and it deliberately has no state wiring: nothing here reflects real data, and no
 * interaction is possible.
 */
export const GovernanceRoadmapPanel = () => {
  const { theme } = useDesignSystemTheme();

  const tracks = [
    {
      key: 'approval',
      title: (
        <FormattedMessage
          defaultMessage="Approval"
          description="Governance roadmap panel > approval track title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="A reviewer signs off before a server is discoverable org-wide."
          description="Governance roadmap panel > approval track description"
        />
      ),
    },
    {
      key: 'verification',
      title: (
        <FormattedMessage
          defaultMessage="Verification"
          description="Governance roadmap panel > verification track title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="Automated checks confirm the published tool surface matches server_json."
          description="Governance roadmap panel > verification track description"
        />
      ),
    },
    {
      key: 'certification',
      title: (
        <FormattedMessage
          defaultMessage="Certification"
          description="Governance roadmap panel > certification track title"
        />
      ),
      description: (
        <FormattedMessage
          defaultMessage="A security/compliance scan result is attached and kept current per version."
          description="Governance roadmap panel > certification track description"
        />
      ),
    },
  ];

  return (
    <div
      css={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borders.borderRadiusMd,
        padding: theme.spacing.md,
      }}
    >
      <Typography.Title level={4} withoutMargins>
        <FormattedMessage
          defaultMessage="Governance roadmap (not yet in MLflow)"
          description="Governance roadmap panel title"
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary" css={{ marginTop: theme.spacing.xs }}>
        <FormattedMessage
          defaultMessage="These tracks describe where a distribution's governance layer would attach on top of the upstream registry entities — they are deferred, not implemented, and every row below is inert."
          description="Governance roadmap panel caption"
        />
      </Typography.Paragraph>
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        {tracks.map((track) => (
          <div
            key={track.key}
            aria-disabled
            css={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: theme.spacing.sm,
              padding: theme.spacing.sm,
              borderRadius: theme.borders.borderRadiusSm,
              backgroundColor: theme.colors.backgroundSecondary,
              opacity: 0.6,
              cursor: 'not-allowed',
            }}
          >
            <CheckCircleIcon css={{ color: theme.colors.actionDisabledText, marginTop: 2 }} />
            <div>
              <Typography.Text bold color="secondary">
                {track.title}
              </Typography.Text>
              <div>
                <Typography.Text size="sm" color="secondary">
                  {track.description}
                </Typography.Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
