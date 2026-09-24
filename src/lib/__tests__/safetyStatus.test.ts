import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSafetyStatus,
  countSafeItems,
  explainUnsafe,
  itemIsSafeForProfile,
  type MenuItemWithTags,
} from '../safetyStatus';
import type { RestrictionProfile, SeverityLevel } from '../profileStorage';

// A menu shaped like Pho Queen's seeded data for gluten: one explicitly safe
// item, one untagged ("unknown"), one may_contain, two contains.
function item(id: string, name: string, gluten?: 'safe' | 'contains' | 'may_contain', description: string | null = null): MenuItemWithTags {
  return { id, name, description, price: null, tags: gluten ? [{ allergenCode: 'gluten', status: gluten }] : [] };
}
const menu: MenuItemWithTags[] = [
  item('1', 'Edamame', 'safe', 'Steamed soy beans'),
  item('2', 'Tom Yum Soup'),
  item('3', 'Spring Roll', 'may_contain'),
  item('4', 'Crab Rangoon', 'contains'),
  item('5', 'Siamese Wing', 'contains'),
];
const gluten = (severity: SeverityLevel): RestrictionProfile => [{ allergenCode: 'gluten', severity }];

test('no restrictions: every seeded restaurant is safe and every item counts', () => {
  assert.equal(computeSafetyStatus(menu, []), 'safe');
  assert.equal(countSafeItems(menu, []), menu.length);
  assert.deepEqual(explainUnsafe(menu, []), []);
});

test('preference never disqualifies anything', () => {
  assert.equal(computeSafetyStatus(menu, gluten('preference')), 'safe');
  assert.equal(countSafeItems(menu, gluten('preference')), 5);
});

test('intolerance: only "contains" disqualifies an item', () => {
  assert.equal(countSafeItems(menu, gluten('intolerance')), 3); // safe + unknown + may_contain
  assert.equal(computeSafetyStatus(menu, gluten('intolerance')), 'safe');
});

test('allergy: only an explicit safe tag counts; restaurant safe with one safe item', () => {
  assert.equal(countSafeItems(menu, gluten('allergy')), 1);
  assert.equal(computeSafetyStatus(menu, gluten('allergy')), 'safe');
});

test('severe: same item rule as allergy, but cross-contact anywhere makes the restaurant unsafe', () => {
  assert.equal(countSafeItems(menu, gluten('severe')), 1);
  assert.equal(computeSafetyStatus(menu, gluten('severe')), 'unsafe');
  const reasons = explainUnsafe(menu, gluten('severe'));
  assert.equal(reasons.length, 1);
  assert.match(reasons[0], /3 menu items contain or may contain Gluten/);
});

test('severe with no risky items on the menu is safe', () => {
  const clean = [item('1', 'Edamame', 'safe'), item('2', 'Rice', 'safe')];
  assert.equal(computeSafetyStatus(clean, gluten('severe')), 'safe');
});

test('allergy with nothing confirmed safe is unsafe, with a matching reason', () => {
  const risky = [item('4', 'Crab Rangoon', 'contains'), item('2', 'Tom Yum Soup')];
  assert.equal(computeSafetyStatus(risky, gluten('allergy')), 'unsafe');
  assert.deepEqual(explainUnsafe(risky, gluten('allergy')), ['No menu item is confirmed safe for Gluten (Allergy).']);
});

test('verdict and explanation always agree', () => {
  for (const severity of ['preference', 'intolerance', 'allergy', 'severe'] as SeverityLevel[]) {
    const unsafe = computeSafetyStatus(menu, gluten(severity)) === 'unsafe';
    assert.equal(unsafe, explainUnsafe(menu, gluten(severity)).length > 0, severity);
  }
});

test('custom keywords exclude items that mention them, but never change the restaurant verdict', () => {
  assert.equal(itemIsSafeForProfile(menu[0], gluten('allergy'), ['soy']), false);
  assert.equal(countSafeItems(menu, gluten('allergy'), ['soy']), 0);
  assert.equal(countSafeItems(menu, [], ['soy']), 4);
  assert.equal(computeSafetyStatus(menu, gluten('allergy')), 'safe');
});
