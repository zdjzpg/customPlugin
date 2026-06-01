const DEFAULT_ORDER = ['听', '说', '读'];

function buildWeightedAbilityMap(details = []) {
  const abilityMap = {};

  details.forEach((detail) => {
    const abilities = Array.isArray(detail.abilities) && detail.abilities.length ? detail.abilities : [];
    if (!abilities.length) {
      return;
    }
    const unitTotal = Number(detail.total || 0) / abilities.length;
    const unitScore = Number(detail.gained || 0) / abilities.length;
    abilities.forEach((ability) => {
      if (!abilityMap[ability]) {
        abilityMap[ability] = { score: 0, total: 0 };
      }
      abilityMap[ability].score += unitScore;
      abilityMap[ability].total += unitTotal;
    });
  });

  return abilityMap;
}

function toAbilityItems(abilityMap = {}, order = DEFAULT_ORDER) {
  return order
    .filter((label) => Number(abilityMap[label]?.total || 0) > 0)
    .map((label) => {
      const item = abilityMap[label];
      return {
        label,
        score: Number(item.score || 0),
        total: Number(item.total || 0),
        percent: item.total ? Math.round((item.score / item.total) * 100) : 0
      };
    });
}

module.exports = {
  DEFAULT_ORDER,
  buildWeightedAbilityMap,
  toAbilityItems
};
