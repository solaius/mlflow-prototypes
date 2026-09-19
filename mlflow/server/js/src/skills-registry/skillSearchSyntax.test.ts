import { describe, it, expect } from '@jest/globals';

import { matchesSkillSearch, parseSkillSearch } from './skillSearchSyntax';
import type { SkillEntity } from './types';

/**
 * Tags moved out of a dropdown and into the search box so that filtering them matches the
 * rest of MLflow, where the model and prompt lists both take a simplified SQL `WHERE`
 * clause. These tests hold the two halves of that trade: the documented syntax works, and
 * a user who types an ordinary word still gets the free-text behaviour they had before.
 */
const skill = (overrides: Partial<SkillEntity> = {}): SkillEntity =>
  ({
    organization: 'rh-basic',
    name: 'cve-explainer',
    description: 'Explains CVEs in plain language',
    tags: [
      { key: 'tier', value: '1' },
      { key: 'domain', value: 'security' },
    ],
    aliases: [{ alias: 'champion', version: 3 }],
    ...overrides,
  }) as SkillEntity;

describe('parseSkillSearch', () => {
  it('lifts a tag clause out and leaves the rest as free text', () => {
    expect(parseSkillSearch('explainer tags.tier = "1"')).toEqual({
      clauses: [{ field: { kind: 'tag', key: 'tier' }, operator: '=', value: '1' }],
      freeText: 'explainer',
    });
  });

  it('treats AND as a separator rather than a word to search for', () => {
    const { freeText, clauses } = parseSkillSearch('name ILIKE "%cve%" AND tags.tier = "1"');
    expect(clauses).toHaveLength(2);
    expect(freeText).toBe('');
  });

  it('leaves a bare AND alone when it is not separating clauses', () => {
    // Nothing parsed, so "and" is just a word someone typed.
    expect(parseSkillSearch('this and that')).toEqual({ clauses: [], freeText: 'this and that' });
  });

  it('falls back to free text rather than blanking the list on a half-typed clause', () => {
    // A real backend would reject this; there is no backend, and a prototype that empties
    // itself while you are still typing teaches nothing.
    expect(parseSkillSearch('tags.tier =')).toEqual({ clauses: [], freeText: 'tags.tier =' });
  });
});

describe('matchesSkillSearch', () => {
  it('matches an exact tag value', () => {
    expect(matchesSkillSearch(skill(), 'tags.tier = "1"')).toBe(true);
    expect(matchesSkillSearch(skill(), 'tags.tier = "2"')).toBe(false);
  });

  it('honours % as a wildcard in ILIKE, and its case-insensitivity', () => {
    expect(matchesSkillSearch(skill(), 'name ILIKE "%CVE%"')).toBe(true);
    // LIKE is the case-sensitive form, so the same pattern misses.
    expect(matchesSkillSearch(skill(), 'name LIKE "%CVE%"')).toBe(false);
    expect(matchesSkillSearch(skill(), 'name LIKE "%cve%"')).toBe(true);
  });

  it('requires every clause, since AND is what joins them', () => {
    expect(matchesSkillSearch(skill(), 'tags.tier = "1" AND tags.domain = "security"')).toBe(true);
    expect(matchesSkillSearch(skill(), 'tags.tier = "1" AND tags.domain = "networking"')).toBe(false);
  });

  it('counts a missing tag key as not-equal, and as matching nothing else', () => {
    const untagged = skill({ tags: [] });
    expect(matchesSkillSearch(untagged, 'tags.tier != "1"')).toBe(true);
    expect(matchesSkillSearch(untagged, 'tags.tier = "1"')).toBe(false);
  });

  it('still searches description, organization and aliases for a bare word', () => {
    expect(matchesSkillSearch(skill(), 'plain language')).toBe(true);
    expect(matchesSkillSearch(skill(), 'rh-basic')).toBe(true);
    expect(matchesSkillSearch(skill(), 'champion')).toBe(true);
    expect(matchesSkillSearch(skill(), 'nonexistent')).toBe(false);
  });

  it('combines a clause with free text, narrowing by both', () => {
    expect(matchesSkillSearch(skill(), 'tags.tier = "1" explains')).toBe(true);
    expect(matchesSkillSearch(skill(), 'tags.tier = "1" networking')).toBe(false);
  });
});
