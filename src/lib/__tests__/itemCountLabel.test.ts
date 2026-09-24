import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemCountLabel } from '../itemCountLabel';
import type { MenuItemWithTags } from '../safetyStatus';
import type { RestrictionProfile } from '../profileStorage';

function item(id: string, gluten?: 'safe' | 'contains'): MenuItemWithTags {
  return { id, name: `Item ${id}`, description: null, price: null, tags: gluten ? [{ allergenCode: 'gluten', status: gluten }] : [] };
}
const reviewed = [item('r1', 'safe'), item('r2', 'contains'), item('r3', 'safe')];
const community = [item('c1', 'safe'), item('c2', 'contains')];
const glutenAllergy: RestrictionProfile = [{ allergenCode: 'gluten', severity: 'allergy' }];

test('no items at all: no label', () => {
  assert.equal(itemCountLabel(undefined, [], glutenAllergy, []), null);
});

test('reviewed only', () => {
  assert.equal(itemCountLabel(reviewed, [], glutenAllergy, []), '2 of 3 items safe for you');
  assert.equal(itemCountLabel(reviewed, undefined, [], []), '3 items on menu');
});

test('community only is called out as unverified', () => {
  assert.equal(itemCountLabel(undefined, community, glutenAllergy, []), '1 of 2 community items look safe (unverified)');
  assert.equal(itemCountLabel(undefined, community, [], []), '2 community items (unverified)');
});

test('both: community items are added to the total but always called out', () => {
  assert.equal(
    itemCountLabel(reviewed, community, glutenAllergy, []),
    '3 of 5 items safe for you (1 of 2 from community, unverified)'
  );
  assert.equal(itemCountLabel(reviewed, community, [], []), '5 items on menu (2 from community, unverified)');
});

test('custom keywords alone count as restrictions', () => {
  const beef = [{ ...item('b1'), name: 'Beef Burger' }, item('b2')];
  assert.equal(itemCountLabel(beef, [], [], ['beef']), '1 of 2 items safe for you');
});
