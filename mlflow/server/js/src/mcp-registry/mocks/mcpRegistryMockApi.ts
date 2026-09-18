/**
 * In-memory stand-in for the MCP registry API.
 *
 * Why this exists: the MCP Registry is the one asset registry in this prototype that was
 * built against the real MLflow API rather than a client-side mock, because it is
 * upstream code rather than prototype code. Static hosting has no MLflow server behind
 * it, so every call 404s and the page renders "The requested resource was not found."
 * The other three registries are unaffected because they never call a server at all.
 *
 * This module gives MCP the same footing as the others, so the whole prototype can be
 * reviewed from a URL. It implements the same object shape as `MCPRegistryApi`, which is
 * the entire seam: no component or hook changes, and the real client is still used
 * wherever a backend is present.
 *
 * It is a prototype fixture, not a fake server. Behaviour is deliberately shallow:
 * filter strings are matched on name and description rather than parsed as the
 * backend's filter grammar, and pagination returns everything in one page. Anything
 * relying on the real grammar should be exercised against a real server.
 */

import { MCP_SEEDS } from './mcpSeeds';
import type {
  CreateMCPAccessEndpointRequest,
  CreateMCPServerRequest,
  CreateMCPServerVersionRequest,
  MCPAccessEndpoint,
  MCPServer,
  MCPServerVersion,
  SearchMCPAccessEndpointsResponse,
  SearchMCPServerVersionsResponse,
  SearchMCPServersParams,
  SearchMCPServersResponse,
  SetMCPServerAliasRequest,
  SetMCPServerTagRequest,
  UpdateMCPAccessEndpointRequest,
  UpdateMCPServerRequest,
  UpdateMCPServerVersionRequest,
} from '../types';

/** Session state. Seeded once per page load and reset on reload, like the sibling stores. */
let servers: MCPServer[] = MCP_SEEDS.map((entry) => ({ ...entry.server }));
let versions: MCPServerVersion[] = MCP_SEEDS.flatMap((entry) => entry.versions.map((v) => ({ ...v })));
let endpoints: MCPAccessEndpoint[] = MCP_SEEDS.flatMap((entry) => entry.endpoints.map((e) => ({ ...e })));

const now = () => Date.now();

/** The real client rejects with an `Error`; callers render `error.message`, so match that. */
const notFound = (what: string): never => {
  throw new Error(`${what} was not found.`);
};

const findServer = (name: string) => servers.find((server) => server.name === name);

const versionsFor = (name: string) => versions.filter((version) => version.name === name);

/**
 * Free-text narrowing over name and description.
 *
 * The backend accepts a structured filter grammar here. Reimplementing that grammar in a
 * fixture would be a lot of surface area to get subtly wrong, and a wrong parser is worse
 * than an obviously simple one, so this matches substrings and says so.
 */
const matchesFilter = (server: MCPServer, filterString?: string) => {
  const needle = filterString?.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    server.name.toLowerCase().includes(needle) ||
    (server.display_name ?? '').toLowerCase().includes(needle) ||
    (server.description ?? '').toLowerCase().includes(needle)
  );
};

/** Recomputes the parent's advertised latest version after a version-level change. */
const refreshLatestVersion = (name: string) => {
  const live = versionsFor(name);
  servers = servers.map((server) =>
    server.name === name
      ? {
          ...server,
          latest_version: live.length ? live[live.length - 1].version : undefined,
          last_updated_timestamp: now(),
        }
      : server,
  );
};

export const MCPRegistryMockApi = {
  createMCPServer: async (request: CreateMCPServerRequest): Promise<MCPServer> => {
    const server = {
      ...(request as unknown as MCPServer),
      workspace: 'default',
      access_endpoints: [],
      aliases: [],
      tags: {},
      creation_timestamp: now(),
      last_updated_timestamp: now(),
    };
    servers = [server, ...servers];
    return server;
  },

  searchMCPServers: async (params: SearchMCPServersParams = {}): Promise<SearchMCPServersResponse> => ({
    mcp_servers: servers.filter((server) => matchesFilter(server, params.filter_string)),
    next_page_token: undefined,
  }),

  getMCPServer: async (name: string): Promise<MCPServer> => findServer(name) ?? notFound(`MCP server '${name}'`),

  updateMCPServer: async (name: string, request: UpdateMCPServerRequest): Promise<MCPServer> => {
    const server = findServer(name) ?? notFound(`MCP server '${name}'`);
    const updated = { ...server, ...request, last_updated_timestamp: now() } as MCPServer;
    servers = servers.map((entry) => (entry.name === name ? updated : entry));
    return updated;
  },

  deleteMCPServer: async (name: string): Promise<void> => {
    servers = servers.filter((server) => server.name !== name);
    versions = versions.filter((version) => version.name !== name);
    endpoints = endpoints.filter((endpoint) => endpoint.server_name !== name);
  },

  createMCPServerVersion: async (name: string, request: CreateMCPServerVersionRequest): Promise<MCPServerVersion> => {
    const version = {
      ...(request as unknown as MCPServerVersion),
      name,
      workspace: 'default',
      aliases: [],
      tags: {},
      creation_timestamp: now(),
      last_updated_timestamp: now(),
    };
    versions = [...versions, version];
    refreshLatestVersion(name);
    return version;
  },

  searchMCPServerVersions: async (name: string): Promise<SearchMCPServerVersionsResponse> => ({
    mcp_server_versions: versionsFor(name),
    next_page_token: undefined,
  }),

  getMCPServerVersion: async (name: string, version: string): Promise<MCPServerVersion> =>
    versionsFor(name).find((entry) => entry.version === version) ??
    notFound(`Version '${version}' of MCP server '${name}'`),

  updateMCPServerVersion: async (
    name: string,
    version: string,
    request: UpdateMCPServerVersionRequest,
  ): Promise<MCPServerVersion> => {
    const target =
      versionsFor(name).find((entry) => entry.version === version) ??
      notFound(`Version '${version}' of MCP server '${name}'`);
    const updated = { ...target, ...request, last_updated_timestamp: now() } as MCPServerVersion;
    versions = versions.map((entry) => (entry.name === name && entry.version === version ? updated : entry));
    refreshLatestVersion(name);
    return updated;
  },

  deleteMCPServerVersion: async (name: string, version: string): Promise<void> => {
    versions = versions.filter((entry) => !(entry.name === name && entry.version === version));
    refreshLatestVersion(name);
  },

  getLatestMCPServerVersion: async (name: string): Promise<MCPServerVersion> => {
    const live = versionsFor(name);
    return live.length ? live[live.length - 1] : notFound(`Latest version of MCP server '${name}'`);
  },

  createMCPAccessEndpoint: async (
    name: string,
    request: CreateMCPAccessEndpointRequest,
  ): Promise<MCPAccessEndpoint> => {
    const endpoint = {
      ...(request as unknown as MCPAccessEndpoint),
      server_name: name,
      creation_timestamp: now(),
      last_updated_timestamp: now(),
    };
    endpoints = [...endpoints, endpoint];
    return endpoint;
  },

  searchMCPAccessEndpoints: async (name: string): Promise<SearchMCPAccessEndpointsResponse> => ({
    mcp_access_endpoints: endpoints.filter((endpoint) => endpoint.server_name === name),
    next_page_token: undefined,
  }),

  updateMCPAccessEndpoint: async (
    name: string,
    endpointId: string,
    request: UpdateMCPAccessEndpointRequest,
  ): Promise<MCPAccessEndpoint> => {
    const target =
      endpoints.find((entry) => entry.server_name === name && entry.id === endpointId) ??
      notFound(`Access endpoint '${endpointId}'`);
    const updated = { ...target, ...request, last_updated_timestamp: now() } as MCPAccessEndpoint;
    endpoints = endpoints.map((entry) => (entry === target ? updated : entry));
    return updated;
  },

  deleteMCPAccessEndpoint: async (name: string, endpointId: string): Promise<void> => {
    endpoints = endpoints.filter((entry) => !(entry.server_name === name && entry.id === endpointId));
  },

  setMCPServerTag: async (name: string, request: SetMCPServerTagRequest): Promise<void> => {
    servers = servers.map((server) =>
      server.name === name ? { ...server, tags: { ...server.tags, [request.key]: request.value } } : server,
    );
  },

  deleteMCPServerTag: async (name: string, key: string): Promise<void> => {
    servers = servers.map((server) => {
      if (server.name !== name) {
        return server;
      }
      const { [key]: _removed, ...rest } = server.tags ?? {};
      return { ...server, tags: rest };
    });
  },

  setMCPServerVersionTag: async (name: string, version: string, request: SetMCPServerTagRequest): Promise<void> => {
    versions = versions.map((entry) =>
      entry.name === name && entry.version === version
        ? { ...entry, tags: { ...entry.tags, [request.key]: request.value } }
        : entry,
    );
  },

  deleteMCPServerVersionTag: async (name: string, version: string, key: string): Promise<void> => {
    versions = versions.map((entry) => {
      if (!(entry.name === name && entry.version === version)) {
        return entry;
      }
      const { [key]: _removed, ...rest } = entry.tags ?? {};
      return { ...entry, tags: rest };
    });
  },

  /**
   * Aliases are pointers owned by the server, so setting one MOVES it off whichever
   * version held it. Two versions answering the same alias is not a state the registry
   * can reach, and a fixture that allowed it would invite a design conversation about a
   * situation that cannot occur.
   */
  setMCPServerAlias: async (name: string, request: SetMCPServerAliasRequest): Promise<void> => {
    versions = versions.map((entry) => {
      if (entry.name !== name) {
        return entry;
      }
      const without = (entry.aliases ?? []).filter((alias) => alias !== request.alias);
      return entry.version === request.version
        ? { ...entry, aliases: [...without, request.alias] }
        : { ...entry, aliases: without };
    });
    servers = servers.map((server) => {
      if (server.name !== name) {
        return server;
      }
      const without = (server.aliases ?? []).filter((entry) => entry.alias !== request.alias);
      return { ...server, aliases: [...without, { alias: request.alias, version: request.version }] };
    });
  },

  getMCPServerVersionByAlias: async (name: string, alias: string): Promise<MCPServerVersion> =>
    versionsFor(name).find((entry) => (entry.aliases ?? []).includes(alias)) ??
    notFound(`Alias '${alias}' of MCP server '${name}'`),

  deleteMCPServerAlias: async (name: string, alias: string): Promise<void> => {
    versions = versions.map((entry) =>
      entry.name === name ? { ...entry, aliases: (entry.aliases ?? []).filter((a) => a !== alias) } : entry,
    );
    servers = servers.map((server) =>
      server.name === name
        ? { ...server, aliases: (server.aliases ?? []).filter((entry) => entry.alias !== alias) }
        : server,
    );
  },
};
