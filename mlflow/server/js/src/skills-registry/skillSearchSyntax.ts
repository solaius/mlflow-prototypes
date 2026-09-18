import type { SkillEntity } from './types';

/**
 * The subset of MLflow's search syntax the skills list understands.
 *
 * Every other registry in this UI filters tags through the search box using a simplified
 * SQL `WHERE` clause (`tags.my_key = "my_value"`), documented in the popover the model and
 * prompt lists both render. The skills list used to offer a tag dropdown instead, which was
 * more discoverable in isolation and inconsistent with everywhere else in the product. This
 * module is the trade being made in the other direction.
 *
 * Parsing is deliberately lenient rather than strict. A real backend rejects a malformed
 * filter with a server error; there is no server here, and a prototype that blanks the list
 * over a half-typed clause teaches nothing useful. So anything that does not parse as a
 * clause falls through to free text, which is what a user typing an ordinary word already
 * expects. The cost is that `tags.env =` searches for the literal string; the benefit is
 * that the box never stops working while you are still typing in it.
 */

/** Comparison operators the popover documents. `LIKE`/`ILIKE` take `%` wildcards. */
type ClauseOperator = '=' | '!=' | 'LIKE' | 'ILIKE';

interface SearchClause {
  /** `name`, or a specific tag key. */
  field: { kind: 'name' } | { kind: 'tag'; key: string };
  operator: ClauseOperator;
  value: string;
}

export interface ParsedSkillSearch {
  clauses: SearchClause[];
  /** Whatever was left once clauses were lifted out, matched the way a bare word always was. */
  freeText: string;
}

/** `tags.<key> <op> "<value>"`, single or double quoted. */
const TAG_CLAUSE = /\btags\.([A-Za-z0-9_.-]+)\s*(!=|=|ILIKE|LIKE)\s*(?:"([^"]*)"|'([^']*)')/gi;
/** `name <op> "<value>"`. */
const NAME_CLAUSE = /\bname\s*(!=|=|ILIKE|LIKE)\s*(?:"([^"]*)"|'([^']*)')/gi;

export const parseSkillSearch = (input: string): ParsedSkillSearch => {
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

  // `AND` is only meaningful as a separator between clauses, and every clause has already
  // been lifted out, so what is left of it is punctuation. Dropping it stops a query like
  // `name ILIKE "%cve%" AND tags.tier = "1"` from also demanding the word "and" appear in
  // the description. A bare `AND` typed on its own is not a separator and survives as text.
  if (clauses.length > 0) {
    remainder = remainder.replace(/\bAND\b/gi, ' ');
  }

  return { clauses, freeText: remainder.trim().replace(/\s+/g, ' ') };
};

/** Turns a `LIKE` pattern into a regexp: `%` is the wildcard, everything else is literal. */
const likeToRegExp = (pattern: string, caseInsensitive: boolean) => {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
  return new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '');
};

const compare = (actual: string | undefined, clause: SearchClause): boolean => {
  // An absent tag key satisfies `!=` and nothing else: a skill with no `tier` tag genuinely
  // is not tier 1, but neither is it a match for any positive comparison.
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

/**
 * Free-text match over user-visible discovery metadata: name, organization, description,
 * tags and aliases. RFC-0008 scopes free text to exactly this, so a user typing "active"
 * matches descriptions containing the word rather than silently filtering by status.
 */
const matchesFreeText = (skill: SkillEntity, freeText: string): boolean => {
  const needle = freeText.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    skill.name.toLowerCase().includes(needle) ||
    skill.organization.toLowerCase().includes(needle) ||
    skill.description.toLowerCase().includes(needle) ||
    skill.tags.some((tag) => `${tag.key}:${tag.value}`.toLowerCase().includes(needle)) ||
    skill.aliases.some(({ alias }) => alias.toLowerCase().includes(needle))
  );
};

/** Whether a skill satisfies the whole query. Clauses are conjunctive, as `AND` implies. */
export const matchesSkillSearch = (skill: SkillEntity, search: string): boolean => {
  const { clauses, freeText } = parseSkillSearch(search);

  for (const clause of clauses) {
    // Destructured because narrowing a discriminated union through a property access does
    // not survive into the `find` callback; narrowing a `const` binding does.
    const { field } = clause;
    const actual = field.kind === 'name' ? skill.name : skill.tags.find((tag) => tag.key === field.key)?.value;
    if (!compare(actual, clause)) {
      return false;
    }
  }

  return matchesFreeText(skill, freeText);
};
