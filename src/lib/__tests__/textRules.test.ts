import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMentions } from '../mentions';
import { formatOpeningHours, shortDescription } from '../restaurantDescription';
import { nameMatches } from '../osm';

test('custom restriction matching: whole words, plurals, accents, case', () => {
  const cases: [string, string[], string[]][] = [
    ['Beef Pho with rice noodles', ['beef'], ['beef']],
    ['Beefeater Gin', ['beef'], []],
    ['Two EGGS any style', ['egg'], ['egg']],
    ['Crème brûlée', ['creme brulee'], ['creme brulee']],
    ['Grilled chicken, beef-style marinade', ['beef'], ['beef']],
    ['Tomatoes and potatoes', ['tomato', 'potato'], ['tomato', 'potato']],
    ['Pineapple fried rice', ['apple'], []],
    ['Anything', ['  '], []],
  ];
  for (const [text, keywords, expected] of cases) {
    assert.deepEqual(findMentions(text, keywords), expected, text);
  }
});

test('opening hours: 12-hour time, spelled-out days, special cases', () => {
  assert.deepEqual(formatOpeningHours('Mo off; Tu-Fr 11:30-14:30,17:00-20:00; Sa-Su 17:00-20:00'), [
    'Mon closed',
    'Tue-Fri 11:30 AM–2:30 PM, 5 PM–8 PM',
    'Sat-Sun 5 PM–8 PM',
  ]);
  assert.deepEqual(formatOpeningHours('Mo-Su 10:00-02:00'), ['Mon-Sun 10 AM–2 AM']);
  assert.deepEqual(formatOpeningHours('Mo-Su 00:00-24:00'), ['Mon-Sun open 24 hours']);
  assert.deepEqual(formatOpeningHours('24/7'), ['Open 24 hours']);
  assert.deepEqual(formatOpeningHours('closed'), ['Listed as closed']);
});

test('short description: cuisines, diets, fallback', () => {
  assert.equal(
    shortDescription('moroccan;mediterranean', { diets: [{ code: 'vegan', only: false }, { code: 'halal', only: false }] }),
    'Moroccan · Mediterranean · Vegan options · Halal options'
  );
  assert.equal(shortDescription(undefined, {}), 'Restaurant');
});

test('name search: case, accents, curly apostrophes', () => {
  assert.equal(nameMatches("Lily P's Wood Fired Pizza Co.", 'lily p’s'), true);
  assert.equal(nameMatches('Crêpe Café', 'crepe cafe'), true);
  assert.equal(nameMatches('Pho Queen', 'pizza'), false);
});
