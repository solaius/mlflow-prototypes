import { Button, Input, PlusIcon, useDesignSystemTheme } from '@databricks/design-system';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getPluginQualifiedName } from '../../agent-plugins/constants';
import { usePluginsStore } from '../../agent-plugins/mocks/pluginsStore';
import { RefLinkSection } from '../../common/components/RefLinkSection';
import { MCP_SEEDS } from '../../mcp-registry/mocks/mcpSeeds';
import { getSkillQualifiedName } from '../../skills-registry/constants';
import { useSkillsStore } from '../../skills-registry/mocks/skillsStore';
import { getAgentQualifiedName } from '../constants';
import { useAgentsStore } from '../mocks/agentsStore';
import { REGISTERED_MODEL_SEEDS } from '../mocks/modelRegistrySeeds';
import type { AgentBom } from '../types';

/**
 * The bill of materials, one picker per axis, all through the shared `RefLinkSection`
 * so linking a skill to an agent is the same interaction as linking one to a plugin.
 *
 * Every axis pins the entity's latest version, because a BOM entry is a snapshot of what
 * this agent version was built against. Two departures the RFC makes explicit: models take
 * an external identifier as well as a registry model, and agent references may be
 * name-level when the callee is independently managed -- the "pin" toggle on that row is
 * the registrant saying which.
 */
export const AgentBomPicker = ({
  componentId,
  value,
  onChange,
  excludeAgent,
}: {
  componentId: string;
  value: AgentBom;
  onChange: (bom: AgentBom) => void;
  /** The agent being registered, kept out of its own callee list. */
  excludeAgent?: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const skills = useSkillsStore();
  const plugins = usePluginsStore();
  const agents = useAgentsStore();
  const [externalModel, setExternalModel] = useState('');

  const skillEntities = useMemo(
    () =>
      skills
        .map((skill) => ({
          name: getSkillQualifiedName(skill.organization, skill.name),
          description: skill.description,
          latestVersion: String(skill.latest_version),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [skills],
  );
  const pluginEntities = useMemo(
    () =>
      plugins
        .filter((plugin) => plugin.latest_version)
        .map((plugin) => ({
          name: getPluginQualifiedName(plugin.organization, plugin.name),
          description: plugin.description,
          latestVersion: plugin.latest_version ?? '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [plugins],
  );
  const mcpEntities = useMemo(
    () =>
      MCP_SEEDS.map((entry) => ({
        name: entry.server.name,
        description: entry.server.description ?? '',
        latestVersion: entry.server.latest_version ?? '',
      })).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const modelEntities = useMemo(
    () =>
      REGISTERED_MODEL_SEEDS.map((model) => ({
        name: model.name,
        description: model.description,
        latestVersion: model.latest_version,
      })),
    [],
  );
  const agentEntities = useMemo(
    () =>
      agents
        .filter(
          (agent) => agent.latest_version && getAgentQualifiedName(agent.organization, agent.name) !== excludeAgent,
        )
        .map((agent) => ({
          name: getAgentQualifiedName(agent.organization, agent.name),
          description: agent.description,
          latestVersion: agent.latest_version ?? '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [agents, excludeAgent],
  );

  const addExternalModel = () => {
    const name = externalModel.trim();
    if (!name || value.models.some((ref) => ref.name === name)) {
      return;
    }
    onChange({ ...value, models: [...value.models, { name }] });
    setExternalModel('');
  };

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'Skills',
            description: 'Label for the BOM skills picker',
          })}
          componentId={`${componentId}.skills`}
          browsableItems={skillEntities}
          items={value.skills.map((ref) => ({ name: ref.name, version: String(ref.version) }))}
          onAdd={(entity) =>
            onChange({ ...value, skills: [...value.skills, { name: entity.name, version: Number(entity.version) }] })
          }
          onRemove={(index) => onChange({ ...value, skills: value.skills.filter((_, i) => i !== index) })}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registered skills',
            description: 'BOM skills picker placeholder',
          })}
          hint={intl.formatMessage({
            defaultMessage: 'Pinned to the exact skill version this agent was built against.',
            description: 'BOM skills picker hint',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No skills are registered yet.',
            description: 'BOM skills picker empty',
          })}
        />
      </div>

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'Agent plugins',
            description: 'Label for the BOM plugins picker',
          })}
          componentId={`${componentId}.plugins`}
          browsableItems={pluginEntities}
          items={value.agent_plugins.map((ref) => ({ name: ref.name, version: ref.version }))}
          onAdd={(entity) =>
            onChange({
              ...value,
              agent_plugins: [...value.agent_plugins, { name: entity.name, version: entity.version }],
            })
          }
          onRemove={(index) => onChange({ ...value, agent_plugins: value.agent_plugins.filter((_, i) => i !== index) })}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registered agent plugins',
            description: 'BOM plugins picker placeholder',
          })}
          hint={intl.formatMessage({
            defaultMessage: 'Referenced as a composed unit. Queries expand it through its registered members.',
            description: 'BOM plugins picker hint',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No agent plugins are registered yet.',
            description: 'BOM plugins picker empty',
          })}
        />
      </div>

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'MCP servers',
            description: 'Label for the BOM MCP picker',
          })}
          componentId={`${componentId}.mcp`}
          browsableItems={mcpEntities}
          items={value.mcp_servers.map((ref) => ({ name: ref.name, version: ref.version }))}
          onAdd={(entity) =>
            onChange({ ...value, mcp_servers: [...value.mcp_servers, { name: entity.name, version: entity.version }] })
          }
          onRemove={(index) => onChange({ ...value, mcp_servers: value.mcp_servers.filter((_, i) => i !== index) })}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registered MCP servers',
            description: 'BOM MCP picker placeholder',
          })}
          hint={intl.formatMessage({
            defaultMessage: 'The tools this agent calls, pinned to a registered server version.',
            description: 'BOM MCP picker hint',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No MCP servers are registered yet.',
            description: 'BOM MCP picker empty',
          })}
        />
      </div>

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'Models',
            description: 'Label for the BOM models picker',
          })}
          componentId={`${componentId}.models`}
          browsableItems={modelEntities}
          items={value.models.map((ref) => ({ name: ref.name, version: ref.version ?? 'external' }))}
          onAdd={(entity) =>
            onChange({
              ...value,
              models: [
                ...value.models,
                {
                  name: entity.name,
                  version: entity.version,
                  provider: REGISTERED_MODEL_SEEDS.find((model) => model.name === entity.name)?.provider,
                },
              ],
            })
          }
          onRemove={(index) => onChange({ ...value, models: value.models.filter((_, i) => i !== index) })}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registry models',
            description: 'BOM models picker placeholder',
          })}
          hint={intl.formatMessage({
            defaultMessage:
              'A registry model (models:/name/version), or an external identifier such as gpt-4o typed below.',
            description: 'BOM models picker hint',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No models are registered yet.',
            description: 'BOM models picker empty',
          })}
        />
        <div css={{ display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
          <Input
            componentId={`${componentId}.external-model`}
            value={externalModel}
            onChange={(event) => setExternalModel(event.target.value)}
            placeholder="gpt-4o"
            css={{ flex: 1 }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addExternalModel();
              }
            }}
          />
          <Button
            componentId={`${componentId}.external-model.add`}
            icon={<PlusIcon />}
            disabled={!externalModel.trim()}
            onClick={addExternalModel}
          >
            <FormattedMessage
              defaultMessage="Add external model"
              description="Button adding an external model identifier"
            />
          </Button>
        </div>
      </div>

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <RefLinkSection
          label={intl.formatMessage({
            defaultMessage: 'Agents it calls',
            description: 'Label for the BOM agents picker',
          })}
          componentId={`${componentId}.agents`}
          browsableItems={agentEntities}
          items={value.agents.map((ref) => ({ name: ref.name, version: ref.version ?? 'name-level' }))}
          onAdd={(entity) =>
            onChange({ ...value, agents: [...value.agents, { name: entity.name, version: entity.version }] })
          }
          onRemove={(index) => onChange({ ...value, agents: value.agents.filter((_, i) => i !== index) })}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search registered agents',
            description: 'BOM agents picker placeholder',
          })}
          hint={intl.formatMessage({
            defaultMessage:
              'Pinned when the callee is versioned and deployed with this agent. Remove the pin for an independently managed callee.',
            description: 'BOM agents picker hint',
          })}
          emptyMessage={intl.formatMessage({
            defaultMessage: 'No other agents are registered yet.',
            description: 'BOM agents picker empty',
          })}
        />
        {value.agents.some((ref) => ref.version) && (
          <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {value.agents.map((ref, index) =>
              ref.version ? (
                <Button
                  key={ref.name}
                  componentId={`${componentId}.agents.unpin`}
                  size="small"
                  type="link"
                  onClick={() =>
                    onChange({
                      ...value,
                      agents: value.agents.map((entry, i) => (i === index ? { name: entry.name } : entry)),
                    })
                  }
                >
                  <FormattedMessage
                    defaultMessage="Make {name} name-level"
                    description="Button turning a pinned agent reference into a name-level one"
                    values={{ name: ref.name }}
                  />
                </Button>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
};
