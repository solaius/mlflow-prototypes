/**
 * The subset of MLflow's search syntax the asset registry lists understand.
 *
 * Every registry in this UI filters tags through the search box using a simplified SQL
 * `WHERE` clause (`tags.my_key = "my_value"`), documented in the popover the model and
 * prompt lists both render. The skills list adopted the same grammar at the 2026-09-01
 * review (`skills-registry/skillSearchSyntax.ts`); this module is that grammar lifted to a
 * structural type so the agent plugin and agent lists parse queries the same way rather
 * than each growing a slightly different one.
 *
 * Parsing is deliberately lenient rather than strict. A real backend rejects a malformed
 * filter with a server error; there is no server here, and a prototype that blanks the list
 * over a half-typed clause teaches nothing useful. Anything that does not parse as a clause
 * falls through to free text.
 */

/** Comparison operators the popover documents. `LIKE`/`ILIKE` take `%` wildcards. */
type ClauseOperator = '=' | '!=' | 'LIKE' | 'ILIKE';

interface SearchClause {
  field: { kind: 'name' } | { kind: 'tag'; key: string };
  operator: ClauseOperator;
  value: string;
}

export interface ParsedRegistrySearch {
  clauses: SearchClause[];
  /** Whatever was left once clauses were lifted out, matched the way a bare word always was. */
  freeText: string;
}

/** The fields the free-text half of a query looks at. Every registry entity has them. */
export interface SearchableRegistryEntity {
  name: string;
  organization: string;
  description: string;
  tags: { key: string; value: string }[];
  aliases: { alias: string }[];
  /** Extra discovery text a registry adds (manifest keywords, an author, a display name). */
  extraSearchText?: string[];
}

const TAG_CLAUSE = /\btags\.([A-Za-z0-9_.-]+)\s*(!=|=|ILIKE|LIKE)\s*(?:"([^"]*)"|'([^']*)')/gi;
const NAME_CLAUSE = /\bname\s*(!=|=|ILIKE|LIKE)\s*(?:"([^"]*)"|'([^']*)')/gi;

export const parseRegistrySearch = (input: string): ParsedRegistrySearch => {
  const clauses: SearchClause[] = [];
  let remainder = input;

  remainder = remainder.replace(TAG_CLAUSE, (_match, key, operator, doubleQuoted, singleQuoted) => {
    clauses.push({
      field: { kind: 'tag', key },
      operator: operator.toUpperCase() as ClauseOperator,
      value: doubleQuoted ?? singleQuoted ?? '',
    });
    return ' ';
  });

  remainder = remainder.replace(NAME_CLAUSE, (_match, operator, doubleQuoted, singleQuoted) => {
    clauses.push({
      field: { kind: 'name' },
      operator: operator.toUpperCase() as ClauseOperator,
      value: doubleQuoted ?? singleQuoted ?? '',
    });
    return ' ';
  });

  if (clauses.length > 0) {
    remainder = remainder.replace(/\bAND\b/gi, ' ');
  }

  return { clauses, freeText: remainder.trim().replace(/\s+/g, ' ') };
};

const likeToRegExp = (pattern: string, caseInsensitive: boolean) => {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
  return new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '');
};

const compare = (actual: string | undefined, clause: SearchClause): boolean => {
  if (actual === undefined) {
    return clause.operator === '!=';
  }
  switch (clause.operator) {
    case '=':
      return actual === clause.value;
    case '!=':
      return actual !== clause.value;
    case 'LIKE':
      return likeToRegExp(clause.value, false).test(actual);
    case 'ILIKE':
      return likeToRegExp(clause.value, true).test(actual);
    default:
      return false;
  }
};

const matchesFreeText = (entity: SearchableRegistryEntity, freeText: string): boolean => {
  const needle = freeText.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    entity.name.toLowerCase().includes(needle) ||
    entity.organization.toLowerCase().includes(needle) ||
    entity.description.toLowerCase().includes(needle) ||
    entity.tags.some((tag) => `${tag.key}:${tag.value}`.toLowerCase().includes(needle)) ||
    entity.aliases.some(({ alias }) => alias.toLowerCase().includes(needle)) ||
    (entity.extraSearchText ?? []).some((text) => text.toLowerCase().includes(needle))
  );
};

/** Whether an entity satisfies the whole query. Clauses are conjunctive, as `AND` implies. */
export const matchesRegistrySearch = (entity: SearchableRegistryEntity, search: string): boolean => {
  const { clauses, freeText } = parseRegistrySearch(search);

  for (const clause of clauses) {
    const { field } = clause;
    const actual = field.kind === 'name' ? entity.name : entity.tags.find((tag) => tag.key === field.key)?.value;
    if (!compare(actual, clause)) {
      return false;
    }
  }

  return matchesFreeText(entity, freeText);
};
