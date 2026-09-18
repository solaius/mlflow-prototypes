/**
 * A small stand-in for the Model Registry, for the BOM picker.
 *
 * RFC-0011's `models` axis takes either a registry model (`models:/name/version`) or an
 * external identifier (`gpt-4o`). The real model registry is API-backed and empty on a
 * static preview, so this carries the registered models the seeded agents reference. The
 * external identifiers need no seed: they are whatever the registrant types.
 */
export interface RegisteredModelSeed {
  name: string;
  description: string;
  latest_version: string;
  provider: string;
}

export const REGISTERED_MODEL_SEEDS: RegisteredModelSeed[] = [
  {
    name: 'granite-3.3-8b-instruct',
    description: 'Granite 3.3 8B instruct, served through the platform gateway.',
    latest_version: '3',
    provider: 'Red Hat',
  },
  {
    name: 'granite-3.3-2b-instruct',
    description: 'Granite 3.3 2B instruct, for classification and routing.',
    latest_version: '2',
    provider: 'Red Hat',
  },
  {
    name: 'granite-3.1-8b-instruct',
    description: 'Granite 3.1 8B instruct. Superseded by 3.3.',
    latest_version: '4',
    provider: 'Red Hat',
  },
  {
    name: 'llama-3.3-70b-instruct',
    description: 'Llama 3.3 70B instruct, served on the GPU pool.',
    latest_version: '2',
    provider: 'Meta',
  },
  {
    name: 'llama-3.1-70b-instruct',
    description: 'Llama 3.1 70B instruct. Superseded by 3.3.',
    latest_version: '5',
    provider: 'Meta',
  },
  {
    name: 'nomic-embed-text-v1.5',
    description: 'Nomic embedding model for retrieval.',
    latest_version: '1',
    provider: 'Nomic',
  },
];
