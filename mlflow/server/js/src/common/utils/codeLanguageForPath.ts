import type { CodeSnippetLanguage } from '@databricks/web-shared/snippet';

/**
 * File extension to `CodeSnippet` language, for registry file viewers.
 *
 * The same map as the skills registry's file modal (2026-09-15-dwarner-stakeholder-feedback#7),
 * shared here so the agent plugins viewer highlights identically. The skills copy moves onto
 * this one in the unified-registry run, once the skills branch is retired.
 */
const EXTENSION_LANGUAGE = new Map<string, CodeSnippetLanguage>([
  ['.py', 'python'],
  ['.js', 'javascript'],
  ['.mjs', 'javascript'],
  ['.cjs', 'javascript'],
  ['.ts', 'javascript'],
  ['.tsx', 'javascript'],
  ['.jsx', 'javascript'],
  ['.json', 'json'],
  ['.yaml', 'yaml'],
  ['.yml', 'yaml'],
  ['.sql', 'sql'],
  ['.go', 'go'],
  ['.java', 'java'],
  ['.sh', 'bash'],
  ['.bash', 'bash'],
]);

export const codeLanguageForPath = (path: string): CodeSnippetLanguage => {
  const dot = path.lastIndexOf('.');
  if (dot === -1) {
    return 'text';
  }
  return EXTENSION_LANGUAGE.get(path.slice(dot).toLowerCase()) ?? 'text';
};
