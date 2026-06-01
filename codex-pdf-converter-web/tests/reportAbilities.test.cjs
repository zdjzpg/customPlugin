const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildWeightedAbilityMap,
  toAbilityItems
} = require('../src/shared/reportAbilities');

test('buildWeightedAbilityMap splits multi-ability questions evenly', () => {
  const abilityMap = buildWeightedAbilityMap([
    { abilities: ['听', '读'], total: 10, gained: 8 },
    { abilities: ['说'], total: 20, gained: 15 }
  ]);

  assert.equal(abilityMap['听'].total, 5);
  assert.equal(abilityMap['听'].score, 4);
  assert.equal(abilityMap['读'].total, 5);
  assert.equal(abilityMap['读'].score, 4);
  assert.equal(abilityMap['说'].total, 20);
});

test('toAbilityItems only returns dimensions that exist in the report', () => {
  const items = toAbilityItems({
    听: { score: 10, total: 20 },
    说: { score: 15, total: 30 }
  });

  assert.deepEqual(items.map((item) => item.label), ['听', '说']);
});
