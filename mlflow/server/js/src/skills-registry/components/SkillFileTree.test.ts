import { describe, expect, it } from '@jest/globals';

import { buildSkillFileTree } from './SkillFileTree';
import type { SkillFileEntry } from '../mocks/skillContent';

const file = (path: string): SkillFileEntry => ({
  path,
  sizeBytes: 100,
  isEntryPoint: path === 'SKILL.md',
});

describe('buildSkillFileTree', () => {
  it('groups paths into directories rather than repeating prefixes', () => {
    const tree = buildSkillFileTree([
      file('SKILL.md'),
      file('references/api.md'),
      file('references/errors.md'),
      file('scripts/run.py'),
    ]);

    expect(tree.map((node) => node.name)).toEqual(['SKILL.md', 'references', 'scripts']);
    expect(tree[1].children.map((node) => node.name)).toEqual(['api.md', 'errors.md']);
    // A directory node carries no file record; only leaves do.
    expect(tree[1].file).toBeUndefined();
    expect(tree[1].children[0].file?.path).toBe('references/api.md');
  });

  it('puts the entry point first, then files, then folders', () => {
    const tree = buildSkillFileTree([file('scripts/run.py'), file('README.md'), file('SKILL.md')]);

    expect(tree.map((node) => node.name)).toEqual(['SKILL.md', 'README.md', 'scripts']);
  });

  it('nests beyond one level', () => {
    const tree = buildSkillFileTree([file('SKILL.md'), file('references/schemas/v1/user.json')]);

    const references = tree.find((node) => node.name === 'references');
    const schemas = references?.children[0];
    const v1 = schemas?.children[0];

    expect(schemas?.name).toBe('schemas');
    expect(v1?.name).toBe('v1');
    expect(v1?.children[0].path).toBe('references/schemas/v1/user.json');
  });

  it('keeps a file and a directory that share a name apart', () => {
    // `config` the file and `config/` the directory are different nodes; collapsing them
    // would hide one of the two.
    const tree = buildSkillFileTree([file('config'), file('config/settings.yaml')]);

    expect(tree).toHaveLength(2);
    expect(tree.filter((node) => node.file).map((node) => node.name)).toEqual(['config']);
    expect(tree.filter((node) => !node.file).map((node) => node.name)).toEqual(['config']);
  });
});
