import { describe, it, expect } from '@jest/globals';

import { MCPRegistryMockApi } from './mcpRegistryMockApi';
import { MCP_SEEDS } from './mcpSeeds';

/**
 * The fixture exists so the MCP Registry renders on static hosting, where there is no
 * tracking server to answer its calls. These tests hold the properties the pages depend
 * on: that the list is populated, that a server resolves to its versions, and that the
 * shapes carry the fields the components read.
 */
describe('MCPRegistryMockApi', () => {
  it('returns a populated server list, which is what static hosting could not do', async () => {
    const { mcp_servers: servers } = await MCPRegistryMockApi.searchMCPServers();
    expect(servers.length).toBeGreaterThan(0);
    expect(servers.length).toBe(MCP_SEEDS.length);
  });

  it('narrows the list by free text over name and description', async () => {
    const { mcp_servers: all } = await MCPRegistryMockApi.searchMCPServers();
    const needle = all[0].name.split('/')[1] ?? all[0].name;
    const { mcp_servers: filtered } = await MCPRegistryMockApi.searchMCPServers({ filter_string: needle });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThanOrEqual(all.length);
  });

  it('resolves a server to the versions the detail page renders', async () => {
    const seeded = MCP_SEEDS.find((entry) => entry.versions.length > 0);
    expect(seeded).toBeDefined();

    const server = await MCPRegistryMockApi.getMCPServer(seeded!.server.name);
    expect(server.name).toBe(seeded!.server.name);

    const { mcp_server_versions: versions } = await MCPRegistryMockApi.searchMCPServerVersions(seeded!.server.name);
    expect(versions.length).toBe(seeded!.versions.length);
    // The version detail reads these; a fixture missing them renders blank panels rather
    // than erroring, which is the harder failure to notice.
    expect(versions[0]).toHaveProperty('server_json');
    expect(versions[0]).toHaveProperty('status');
  });

  it('rejects an unknown server the way the real client does, with a readable message', async () => {
    await expect(MCPRegistryMockApi.getMCPServer('does.not/exist')).rejects.toThrow(/was not found/);
  });

  it('moves an alias rather than letting two versions answer it', async () => {
    const seeded = MCP_SEEDS.find((entry) => entry.versions.length > 1);
    expect(seeded).toBeDefined();
    const [first, second] = seeded!.versions;

    await MCPRegistryMockApi.setMCPServerAlias(seeded!.server.name, { alias: 'champion', version: first.version });
    await MCPRegistryMockApi.setMCPServerAlias(seeded!.server.name, { alias: 'champion', version: second.version });

    const { mcp_server_versions: versions } = await MCPRegistryMockApi.searchMCPServerVersions(seeded!.server.name);
    const holders = versions.filter((v) => (v.aliases ?? []).includes('champion'));
    expect(holders).toHaveLength(1);
    expect(holders[0].version).toBe(second.version);
  });
});
