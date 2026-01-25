export function initMap() {
  map = Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => {
      // 周囲4マスを海にする
      if (x < 4 || y < 4 || x >= SIZE - 4 || y >= SIZE - 4) {
        return { terrain: 'sea', facility: null, pop: 0, enhanced: false };
      }
      // ランダムな陸地配置（森、平地、荒地）と海
      const terrain = randTerrain();
      return { terrain, facility: null, pop: 0, enhanced: false };
    })
  );
  let placed = 0;
  // 初期住宅を2つ配置
  // 平地を探し、すでに施設がない場所に配置する
  const possibleHouseLocations = [];
  for (let y = 4; y < SIZE - 4; y++) {
    for (let x = 4; x < SIZE - 4; x++) {
      const tile = map[y][x];
      if (tile.terrain === 'plain' && !tile.facility) {
        possibleHouseLocations.push({ x, y });
      }
    }
  }

  // シャッフルしてランダムに2つ選択
  possibleHouseLocations.sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(2, possibleHouseLocations.length); i++) {
    const { x, y } = possibleHouseLocations[i];
    const tile = map[y][x];
    tile.facility = 'house';
    tile.pop = 25;
    population += 25;
    placed++;
  }
document.getElementById('islandNameInput').value = islandName; // UIに初期値を反映
    renderActionQueue();
}
