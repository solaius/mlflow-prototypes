/**
 * What an agent's endpoint SERVES, for the live-card view.
 *
 * RFC-0011 departs from the canonical-payload pattern of the MCP and skill registries on
 * purpose: an A2A Agent Card's system of record is the agent itself, so MLflow never
 * persists one. Registering from an endpoint imports the card's descriptive metadata into
 * ordinary registry fields and creates an `a2a` binding; the UI then renders the card
 * read-only by FETCHING it through the binding at view time, so what is shown can never
 * drift from what the agent serves.
 *
 * There is no agent behind a static preview, so this table plays the endpoint: a card per
 * URL the seeded bindings point at, one of them deliberately unreachable so the failure
 * state renders. `fetchAgentCard` is what a browser would do against
 * `<endpoint>/.well-known/agent-card.json` when the endpoint permits it.
 */

import type { A2AAgentCard } from '../types';

const A2A_PROTOCOL_VERSION = '1.0';

interface ServedCard {
  url: string;
  card: A2AAgentCard;
}

const card = (
  url: string,
  name: string,
  description: string,
  providerOrganization: string,
  version: string,
  skills: A2AAgentCard['skills'],
  extra: Partial<A2AAgentCard> = {},
): ServedCard => ({
  url,
  card: {
    protocolVersion: A2A_PROTOCOL_VERSION,
    name,
    description,
    url,
    preferredTransport: 'JSONRPC',
    provider: { organization: providerOrganization },
    version,
    capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills,
    securitySchemes: { oidc: { type: 'openIdConnect', description: 'Workspace OIDC issuer' } },
    ...extra,
  },
});

const SERVED_CARDS: ServedCard[] = [
  card(
    'https://incident-commander.apps.example.com/a2a',
    'Incident Commander',
    'Coordinates incident response across an OpenShift estate: triages alerts, correlates pod and cluster health with recent changes, drafts the incident timeline, and keeps the response channel updated.',
    'Red Hat SRE',
    '2.0.0',
    [
      {
        id: 'triage-alert',
        name: 'Triage an alert',
        description: 'Classify an incoming alert by blast radius and likely subsystem.',
        tags: ['incident', 'triage'],
      },
      {
        id: 'build-timeline',
        name: 'Build an incident timeline',
        description: 'Assemble an ordered timeline from logs, events and deploy history.',
        tags: ['incident', 'timeline'],
      },
      {
        id: 'brief-responders',
        name: 'Brief responders',
        description: 'Post and maintain a running summary in the response channel.',
        tags: ['incident', 'comms'],
      },
    ],
    { documentationUrl: 'https://github.com/redhat-ai/agent-incident-commander#readme' },
  ),
  card(
    'https://cve-remediation.apps.example.com/a2a',
    'CVE Remediation',
    'End-to-end CVE handling: explains the advisory against Red Hat severity ratings, scans dependency manifests for affected versions, and opens the tracking issues and pull requests that carry the fix.',
    'Red Hat SRE',
    '1.0.0',
    [
      {
        id: 'assess-advisory',
        name: 'Assess an advisory',
        description: 'Read a CVE or RHSA and state impact per product version in use.',
        tags: ['security', 'cve'],
      },
      {
        id: 'scan-dependencies',
        name: 'Scan dependencies',
        description: 'Find affected package versions across repositories.',
        tags: ['security', 'dependencies'],
      },
      {
        id: 'open-remediation',
        name: 'Open remediation work',
        description: 'File the tracking issue and raise the bump pull request.',
        tags: ['security', 'remediation'],
      },
    ],
  ),
  card(
    'https://model-deployer.apps.example.com/a2a',
    'Model Deployer',
    'Deploys and tunes model serving on OpenShift AI: selects a runtime, validates GPU capacity, creates the InferenceService, and watches the rollout to completion.',
    'Red Hat AI Platform',
    '2.0.0',
    [
      {
        id: 'select-runtime',
        name: 'Select a serving runtime',
        description: 'Choose between vLLM, NIM and Caikit for a given model and accelerator.',
        tags: ['serving', 'runtime'],
      },
      {
        id: 'deploy-inference-service',
        name: 'Deploy an InferenceService',
        description: 'Create and roll out the serving resource, then verify readiness.',
        tags: ['serving', 'kserve'],
      },
    ],
  ),
  card(
    'https://pipeline-builder.apps.example.com/a2a',
    'Pipeline Builder',
    'Bootstraps delivery pipelines for a repository: generates the CI definition, wires GitOps promotion, and produces the Helm chart the pipeline deploys.',
    'Red Hat Developer Experience',
    '1.3.0',
    [
      {
        id: 'scaffold-pipeline',
        name: 'Scaffold a pipeline',
        description: 'Generate CI configuration matched to the repository layout.',
        tags: ['cicd'],
      },
      {
        id: 'wire-gitops',
        name: 'Wire GitOps promotion',
        description: 'Set up environment promotion through a GitOps repository.',
        tags: ['cicd', 'gitops'],
      },
    ],
  ),
  card(
    'https://service-scaffolder.apps.example.com/a2a',
    'Service Scaffolder',
    'Generates a new service from the organization template set: Quarkus project layout, container build, and the Helm chart needed to deploy it.',
    'Red Hat Developer Experience',
    '2026.08',
    [
      {
        id: 'scaffold-service',
        name: 'Scaffold a service',
        description: 'Create a runnable project from the organization template.',
        tags: ['scaffolding'],
      },
    ],
  ),
  card(
    'https://agents.acme-travel.example/concierge',
    'ACME Travel Concierge',
    'Books and rebooks corporate travel against negotiated fares, and answers policy questions about what is reimbursable.',
    'ACME Travel',
    '4.11.2',
    [
      {
        id: 'book-itinerary',
        name: 'Book an itinerary',
        description: 'Search fares and hold or ticket a multi-leg trip.',
        tags: ['travel'],
      },
      {
        id: 'rebook',
        name: 'Rebook a disrupted trip',
        description: 'Find alternatives after a cancellation and rebook within policy.',
        tags: ['travel', 'disruption'],
      },
      {
        id: 'policy',
        name: 'Answer a policy question',
        description: 'Explain what the travel policy allows and reimburses.',
        tags: ['policy'],
      },
    ],
    { iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@13/icons/expedia.svg', preferredTransport: 'HTTP+JSON' },
  ),
];

/** A URL the seeds bind to on purpose with nothing behind it, so the failure state is reachable. */
const UNREACHABLE_URLS = new Set(['https://report-generator.apps.example.com/a2a']);

export type AgentCardFetch =
  | { status: 'ok'; card: A2AAgentCard; fetchedAt: number }
  | { status: 'unreachable'; reason: string; fetchedAt: number };

/** Simulates `GET <endpoint>/.well-known/agent-card.json`. */
export const fetchAgentCard = (endpointUrl: string): AgentCardFetch => {
  const fetchedAt = Date.now();
  if (UNREACHABLE_URLS.has(endpointUrl)) {
    return {
      status: 'unreachable',
      reason:
        'The endpoint did not answer. The registry records where the card should be; whether anything serves it is the platform’s question.',
      fetchedAt,
    };
  }
  const served = SERVED_CARDS.find((entry) => entry.url === endpointUrl);
  if (!served) {
    return {
      status: 'unreachable',
      reason:
        'No Agent Card was served at the well-known path. The endpoint may not speak A2A, or may not permit browser fetches.',
      fetchedAt,
    };
  }
  return { status: 'ok', card: served.card, fetchedAt };
};

/** The descriptive metadata an A2A registration imports from the card (never the card itself). */
export const importCardMetadata = (
  cardPayload: A2AAgentCard,
): { displayName: string; description: string; iconUrl?: string; providerOrganization?: string } => ({
  displayName: cardPayload.name,
  description: cardPayload.description,
  iconUrl: typeof cardPayload.iconUrl === 'string' ? cardPayload.iconUrl : undefined,
  providerOrganization: cardPayload.provider?.organization,
});
