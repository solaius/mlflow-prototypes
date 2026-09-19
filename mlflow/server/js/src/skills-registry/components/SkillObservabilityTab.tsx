import { Alert, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';

import { getSkillQualifiedName } from '../constants';
import Routes from '../../experiment-tracking/routes';
import { Link } from '../../common/utils/RoutingUtils';

/**
 * Traces and evaluations for one skill.
 *
 * The 2026-09-01 review asked for this and settled its shape in the same breath.
 * Matthew's ruling was explicit: do NOT re-implement the traces UI here — send the user
 * to the existing experiment traces view with the filter pre-selected, so there is one
 * traces implementation rather than two. Bill added that traces and evaluations can
 * share a single tab, which is why they are together.
 *
 * What is honestly missing, and is shown as missing rather than faked: a skill has no
 * experiment association in RFC-0008, and the traces view has no filter-by-skill. Both
 * are prerequisites for the deep link, and neither exists yet. So this tab states the
 * intended destination and links to the traces view it would filter, in the same spirit
 * as `GovernanceRoadmapPanel` and `RuntimeBoundaryPanel` — the sibling registries'
 * established way of making a scope boundary visible instead of silently absent.
 */
export const SkillObservabilityTab = ({ organization, skillName }: { organization: string; skillName: string }) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const qualifiedName = getSkillQualifiedName(organization, skillName);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, maxWidth: 720 }}>
      <Alert
        componentId="mlflow.skills-registry.observability.boundary"
        type="info"
        closable={false}
        message={intl.formatMessage({
          defaultMessage: 'Traces and evaluations live in Experiments',
          description: 'Skills registry > observability tab > boundary alert title',
        })}
        description={
          <FormattedMessage
            defaultMessage="Links out to the experiment view rather than repeating it here."
            description="Skills registry > observability tab > boundary alert description"
          />
        }
      />

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <Typography.Title level={4} withoutMargins>
          <FormattedMessage
            defaultMessage="What this will link to"
            description="Skills registry > observability tab > planned link heading"
          />
        </Typography.Title>
        <Typography.Text color="secondary">
          <FormattedMessage
            defaultMessage="The experiment traces view, filtered to runs that loaded {skill}, and the evaluation runs scored against it."
            description="Skills registry > observability tab > planned link description"
            values={{ skill: <Typography.Text bold>{qualifiedName}</Typography.Text> }}
          />
        </Typography.Text>
      </div>

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <Typography.Title level={4} withoutMargins>
          <FormattedMessage
            defaultMessage="What it needs first"
            description="Skills registry > observability tab > prerequisites heading"
          />
        </Typography.Title>
        <ul css={{ margin: 0, paddingLeft: theme.spacing.lg }}>
          <li>
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="A skill reference recorded on the trace, so traces can be filtered by skill at all."
                description="Skills registry > observability tab > prerequisite: trace attribution"
              />
            </Typography.Text>
          </li>
          <li>
            <Typography.Text color="secondary">
              <FormattedMessage
                defaultMessage="An experiment to open. A skill is registry-scoped and belongs to no single experiment, so the destination has to be chosen or carried from context."
                description="Skills registry > observability tab > prerequisite: experiment scope"
              />
            </Typography.Text>
          </li>
        </ul>
      </div>

      <Link componentId="mlflow.skills-registry.observability.experiments" to={Routes.experimentsObservatoryRoute}>
        <FormattedMessage
          defaultMessage="Go to Experiments"
          description="Skills registry > observability tab > link to the experiments list"
        />
      </Link>
    </div>
  );
};
