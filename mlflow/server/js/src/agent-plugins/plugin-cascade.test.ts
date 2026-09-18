import { describe, it, expect } from '@jest/globals';

import { PLUGIN_VERSIONS } from './mocks/mockPlugins';
import { getPluginCascadeImpact } from './mocks/pluginsStore';

/**
 * RFC-0008 §Entity-level status gives `delete_agent_plugin` an explicit `cascade` option,
 * because a packaged plugin's members are ordinary skills with their own identity. The
 * referential-integrity rule is the part worth pinning: a member still held by a LIVE
 * version of another plugin blocks the cascade, and blocks the WHOLE operation rather than
 * being skipped. "Failing this way is less surprising than deleting most members and
 * silently keeping the referenced ones."
 */
describe('deleting an agent plugin with cascade', () => {
  const firstPlugin = PLUGIN_VERSIONS[0];

  it('reports which members a cascade would take', () => {
    const impact = getPluginCascadeImpact(firstPlugin.organization, firstPlugin.name);
    expect(impact.removable.length + impact.blocked.length).toBeGreaterThan(0);
  });

  it('splits members into removable and blocked, never both', () => {
    for (const pluginVersion of PLUGIN_VERSIONS) {
      const impact = getPluginCascadeImpact(pluginVersion.organization, pluginVersion.name);
      const overlap = impact.removable.filter((name) => impact.blocked.some((entry) => entry.skillName === name));
      expect(overlap).toEqual([]);
    }
  });

  it('names the plugin holding a blocked member, so the block is actionable', () => {
    const blocked = PLUGIN_VERSIONS.map((pluginVersion) =>
      getPluginCascadeImpact(pluginVersion.organization, pluginVersion.name),
    ).flatMap((impact) => impact.blocked);
    expect(blocked.length).toBeGreaterThan(0);
    for (const entry of blocked) {
      expect(entry.heldBy.startsWith('@')).toBe(true);
      expect(entry.skillName).toBeTruthy();
    }
  });
});
