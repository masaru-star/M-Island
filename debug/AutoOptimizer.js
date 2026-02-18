/*
 * M-Island Console Auto Optimizer
 * 使い方:
 * 1) ブラウザの開発者ツールのコンソールでこのファイル内容を貼り付ける
 * 2) AutoOptimizer.run(50) のように実行する
 * 3) 停止したい場合は AutoOptimizer.stop()
 */

(() => {
  'use strict';

  const ACTION_SELECT_ID = 'actionSelect';
  const GUN_COST = 1200;
  const DEFENSE_COST = 5000;
  const LANDFILL_COST = 600;
  const MONUMENT_COST = 500000000;

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const getSnapshot = () => {
    if (typeof map === 'undefined' || !Array.isArray(map)) {
      throw new Error('map 変数にアクセスできません。ゲーム画面のコンソールで実行してください。');
    }

    return {
      map: clone(map),
      money: typeof money === 'number' ? money : 0,
      food: typeof food === 'number' ? food : 0,
      population: typeof population === 'number' ? population : 0,
      turn: typeof turn === 'number' ? turn : 0,
      actionQueue: Array.isArray(actionQueue) ? clone(actionQueue) : [],
      warships: (typeof warships !== 'undefined' && Array.isArray(warships)) ? clone(warships) : [],
      monsters: (typeof monsters !== 'undefined' && Array.isArray(monsters)) ? clone(monsters) : [],
      isViewingOtherIsland: typeof isViewingOtherIsland === 'boolean' ? isViewingOtherIsland : false
    };
  };

  const setAction = (action) => {
    const actionSelect = document.getElementById(ACTION_SELECT_ID);
    const warshipSubSelect = document.getElementById('warshipSubSelect');

    if (!actionSelect) throw new Error('actionSelect が見つかりません。');

    const warshipTools = new Set([
      'refuelWarship',
      'resupplyWarshipAmmo',
      'repairWarship',
      'enhanceWarship',
      'decommissionWarship',
      'dispatchWarship',
      'requestWarshipReturn'
    ]);

    if (warshipTools.has(action)) {
      actionSelect.value = 'warshipTool';
      if (warshipSubSelect) warshipSubSelect.value = action;
    } else {
      actionSelect.value = action;
      if (warshipSubSelect) warshipSubSelect.value = '';
    }

    if (typeof window.updateConfirmButton === 'function') {
      window.updateConfirmButton();
    }
  };

  const enqueuePlan = ({ action, x = null, y = null, exportAmount = 1, oilFactor = 1, bombardCount = 1 }) => {
    try {
      if (x !== null && y !== null && typeof window.selectTile === 'function') {
        window.selectTile(x, y);
      }

      setAction(action);

      if (action === 'exportFood') {
        const el = document.getElementById('exportAmount');
        if (el) el.value = String(Math.max(1, exportAmount));
      }

      if (action === 'dig') {
        const el = document.getElementById('oilDrillFactor');
        if (el) el.value = String(Math.max(1, oilFactor));
      }

      if (action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard') {
        const el = document.getElementById('bombardCount');
        if (el) el.value = String(Math.max(1, bombardCount));
      }

      if (typeof window.confirmAction !== 'function') {
        throw new Error('confirmAction 関数が見つかりません。');
      }
      window.confirmAction();
      return true;
    } catch (e) {
      console.error('[AutoOptimizer] 計画追加失敗:', e);
      return false;
    }
  };

  const listTiles = (state, pred) => {
    const out = [];
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        const tile = state.map[y][x];
        if (pred(tile, x, y)) out.push({ x, y, tile });
      }
    }
    return out;
  };

  const countFacility = (state, facility) =>
    state.map.flat().filter((t) => t.facility === facility).length;

  const hasAdjacentLand = (state, x, y) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (ny < 0 || nx < 0 || ny >= state.map.length || nx >= state.map[ny].length) continue;
        if (state.map[ny][nx].terrain !== 'sea') return true;
      }
    }
    return false;
  };

  const adjacentLandCount = (state, x, y) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (ny < 0 || nx < 0 || ny >= state.map.length || nx >= state.map[ny].length) continue;
        if (state.map[ny][nx].terrain !== 'sea') count += 1;
      }
    }
    return count;
  };

  const inDefenseFiveByFive = (x, y, defenseTiles) => defenseTiles.some((d) => Math.abs(d.x - x) <= 2 && Math.abs(d.y - y) <= 2);

  const chooseBuildSite = (candidates, usedSet) => {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const key = `${c.x},${c.y}`;
      if (!usedSet.has(key)) {
        usedSet.add(key);
        candidates.splice(i, 1);
        return c;
      }
    }
    return null;
  };

  const pickFlattenTarget = (tiles, usedSet) => {
    for (let i = 0; i < tiles.length; i++) {
      const c = tiles[i];
      const key = `${c.x},${c.y}`;
      if (!usedSet.has(key)) {
        usedSet.add(key);
        tiles.splice(i, 1);
        return c;
      }
    }
    return null;
  };

  const proposePlans = (state, memory) => {
    const plans = [];

    const queueLen = (state.actionQueue || []).length;
    const room = Math.max(0, 2 - queueLen);
    if (room === 0) return plans;

    const farms = countFacility(state, 'farm');
    const factories = countFacility(state, 'factory');
    const houses = countFacility(state, 'house');
    let guns = countFacility(state, 'gun');
    let defenseFacilities = countFacility(state, 'defenseFacility');

    const plainEmptyTiles = listTiles(state, (t) => t.terrain === 'plain' && !t.facility);
    const innerPlainEmptyTiles = plainEmptyTiles.filter(
      (p) => p.x > 0 && p.y > 0 && p.x < state.map[0].length - 1 && p.y < state.map.length - 1
    );
    const houseTilesByPop = listTiles(state, (t) => t.facility === 'house' && t.terrain === 'plain')
      .sort((a, b) => (a.tile.pop || 0) - (b.tile.pop || 0));
    const wastes = listTiles(state, (t) => t.terrain === 'waste');
    const forests = listTiles(state, (t) => t.terrain === 'forest' && !t.facility);
    const warshipCoords = new Set((state.warships || []).map((w) => `${w.x},${w.y}`));
    const seas = listTiles(state, (t, x, y) => t.terrain === 'sea' && !warshipCoords.has(`${x},${y}`));
    const farmImprovables = listTiles(state, (t) => t.facility === 'farm' && !t.enhanced);
    const factoryImprovables = listTiles(state, (t) => t.facility === 'factory' && !t.enhanced);

    const gunTiles = listTiles(state, (t) => t.facility === 'gun').sort((a, b) => adjacentLandCount(state, a.x, a.y) - adjacentLandCount(state, b.x, b.y));
    const defenseTiles = listTiles(state, (t) => t.facility === 'defenseFacility').sort((a, b) => adjacentLandCount(state, a.x, a.y) - adjacentLandCount(state, b.x, b.y));
    const monumentTiles = listTiles(state, (t) => t.facility === 'Monument');

    const defenseSites = listTiles(state, (t, x, y) => t.terrain === 'plain' && !t.facility && !inDefenseFiveByFive(x, y, defenseTiles));

    const frontierSeas = seas
      .filter((p) => hasAdjacentLand(state, p.x, p.y))
      .sort((a, b) => adjacentLandCount(state, b.x, b.y) - adjacentLandCount(state, a.x, a.y));

    const usedPositions = new Set();
    let simulatedMoney = state.money;

    const isThreatened = state.monsters.length > 0 || state.population >= 20000;
    const desiredGunMin = 6;
    const desiredGunMax = simulatedMoney >= 500000 ? 20 : 15;
    const desiredGuns = simulatedMoney >= 120000 ? 18 : desiredGunMin;
    const maxDefenseAllowed = Math.max(1, Math.floor(guns / 6));

    const foodSurplus = state.food > Math.max(6000, state.population * 1.8);
    const foodDeficit = state.food < Math.max(300, state.population * 0.2);

    if (foodDeficit) memory.foodDeficitStreak += 1;
    else memory.foodDeficitStreak = 0;

    for (let i = 0; i < room; i++) {
      // 最優先: 怪獣討伐
      if (state.monsters.length > 0) {
        const monumentTooClose = state.monsters.find((m) =>
          monumentTiles.find((mon) => Math.abs(mon.x - m.x) <= 1 && Math.abs(mon.y - m.y) <= 1)
        );
        if (monumentTooClose && monumentTiles.length > 0) {
          const nearMonument = monumentTiles.find((mon) =>
            Math.abs(mon.x - monumentTooClose.x) <= 1 && Math.abs(mon.y - monumentTooClose.y) <= 1
          ) || monumentTiles[0];
          plans.push({ action: 'sellMonument', x: nearMonument.x, y: nearMonument.y });
          simulatedMoney += MONUMENT_COST * Math.max(1, nearMonument.tile.MonumentLevel || 1);
          const idx = monumentTiles.findIndex((m) => m.x === nearMonument.x && m.y === nearMonument.y);
          if (idx >= 0) monumentTiles.splice(idx, 1);
          continue;
        }

        if (guns > 0 && simulatedMoney >= 120) {
          const target = state.monsters[0];
          const maxShots = Math.min(guns, Math.max(1, Math.floor(simulatedMoney / 120)));
          plans.push({ action: 'bombard', x: target.x, y: target.y, bombardCount: maxShots });
          simulatedMoney -= maxShots * 120;
          continue;
        }

        if (simulatedMoney >= GUN_COST) {
          const p = chooseBuildSite(plainEmptyTiles, usedPositions);
          if (p) {
            plans.push({ action: 'buildGun', x: p.x, y: p.y });
            simulatedMoney -= GUN_COST;
            guns += 1;
            continue;
          }
        }
      }
      // 優先度1: 食料
      if (farmImprovables.length > 0 && simulatedMoney >= 10000) {
        const f = chooseBuildSite(farmImprovables, usedPositions);
        if (f) {
          plans.push({ action: 'enhanceFacility', x: f.x, y: f.y });
          simulatedMoney -= 10000;
          continue;
        }
      }

      if (foodDeficit && plainEmptyTiles.length > 0 && simulatedMoney >= 100) {
        const p = chooseBuildSite(plainEmptyTiles, usedPositions);
        if (p) {
          plans.push({ action: 'buildFarm', x: p.x, y: p.y });
          simulatedMoney -= 100;
          continue;
        }
      }

      if (memory.foodDeficitStreak >= 2 && houseTilesByPop.length > 0 && simulatedMoney >= 100) {
        const h = chooseBuildSite(houseTilesByPop, usedPositions);
        if (h) {
          plans.push({ action: 'buildFarm', x: h.x, y: h.y });
          simulatedMoney -= 100;
          continue;
        }
      }

      if (farms < Math.max(2, Math.floor((houses + 1) / 3)) && plainEmptyTiles.length > 0 && simulatedMoney >= 100) {
        const p = chooseBuildSite(plainEmptyTiles, usedPositions);
        if (p) {
          plans.push({ action: 'buildFarm', x: p.x, y: p.y });
          simulatedMoney -= 100;
          continue;
        }
      }

      // 優先度2: 資金
      if (factoryImprovables.length > 0 && simulatedMoney >= 10000) {
        const f = chooseBuildSite(factoryImprovables, usedPositions);
        if (f) {
          plans.push({ action: 'enhanceFacility', x: f.x, y: f.y });
          simulatedMoney -= 10000;
          continue;
        }
      }

      if (farmImprovables.length > 0 && simulatedMoney >= 10000) {
        const f = chooseBuildSite(farmImprovables, usedPositions);
        if (f) {
          plans.push({ action: 'enhanceFacility', x: f.x, y: f.y });
          simulatedMoney -= 10000;
          continue;
        }
      }

      if (simulatedMoney < 5000 && monumentTiles.length > 0) {
        const m = monumentTiles[0];
        plans.push({ action: 'sellMonument', x: m.x, y: m.y });
        simulatedMoney += MONUMENT_COST * Math.max(1, m.tile.MonumentLevel || 1);
        monumentTiles.shift();
        continue;
      }

      if (forests.length > 0 && (simulatedMoney < 20000 || factories < Math.max(1, Math.floor((houses + 3) / 4)))) {
        const p = chooseBuildSite(forests, usedPositions);
        if (p) {
          plans.push({ action: 'cutForest', x: p.x, y: p.y });
          continue;
        }
      }

      if (factories < Math.max(1, Math.floor((houses + 3) / 4)) && plainEmptyTiles.length > 0 && simulatedMoney >= 100) {
        const p = chooseBuildSite(plainEmptyTiles, usedPositions);
        if (p) {
          plans.push({ action: 'buildFactory', x: p.x, y: p.y });
          simulatedMoney -= 100;
          continue;
        }
      }

      // 優先度3: 整地
      if (wastes.length > 0 && simulatedMoney >= 20) {
        const p = chooseBuildSite(wastes, usedPositions);
        if (p) {
          plans.push({ action: 'flatten', x: p.x, y: p.y });
          simulatedMoney -= 20;
          continue;
        }
      }

      if (defenseFacilities > maxDefenseAllowed && simulatedMoney >= 20) {
        const d = pickFlattenTarget(defenseTiles, usedPositions);
        if (d) {
          plans.push({ action: 'flatten', x: d.x, y: d.y });
          simulatedMoney -= 20;
          defenseFacilities -= 1;
          continue;
        }
      }

      if (guns > desiredGunMax && simulatedMoney >= 20) {
        const g = pickFlattenTarget(gunTiles, usedPositions);
        if (g) {
          plans.push({ action: 'flatten', x: g.x, y: g.y });
          simulatedMoney -= 20;
          guns -= 1;
          continue;
        }
      }

      // 優先度4: ほかの軍事施設の建設・使用
      if (guns < desiredGunMin && simulatedMoney >= GUN_COST) {
        const p = chooseBuildSite(plainEmptyTiles, usedPositions);
        if (p) {
          plans.push({ action: 'buildGun', x: p.x, y: p.y });
          simulatedMoney -= GUN_COST;
          guns += 1;
          continue;
        }
      }

      if (isThreatened && guns < desiredGuns && simulatedMoney >= GUN_COST) {
        const p = chooseBuildSite(plainEmptyTiles, usedPositions);
        if (p) {
          plans.push({ action: 'buildGun', x: p.x, y: p.y });
          simulatedMoney -= GUN_COST;
          guns += 1;
          continue;
        }
      }

      if (isThreatened && defenseFacilities < maxDefenseAllowed && simulatedMoney >= DEFENSE_COST) {
        const p = defenseSites.find((site) => {
          const key = `${site.x},${site.y}`;
          return !usedPositions.has(key) && !inDefenseFiveByFive(site.x, site.y, defenseTiles);
        });
        if (p) {
          usedPositions.add(`${p.x},${p.y}`);
          plans.push({ action: 'buildDefenseFacility', x: p.x, y: p.y });
          simulatedMoney -= DEFENSE_COST;
          defenseFacilities += 1;
          defenseTiles.push(p);
          continue;
        }
      }

      // 優先度5: 埋め立て
      if (simulatedMoney >= LANDFILL_COST && frontierSeas.length > 0) {
        const p = chooseBuildSite(frontierSeas, usedPositions);
        if (p) {
          plans.push({ action: 'landfill', x: p.x, y: p.y });
          simulatedMoney -= LANDFILL_COST;
          continue;
        }
      }

      if (simulatedMoney >= LANDFILL_COST && seas.length > 0) {
        const p = chooseBuildSite(seas, usedPositions);
        if (p) {
          plans.push({ action: 'landfill', x: p.x, y: p.y });
          simulatedMoney -= LANDFILL_COST;
          continue;
        }
      }

      // 優先度6: 食料輸出 / 石碑関連（ほかにやることがない時）
      if (foodSurplus && state.food >= 40) {
        const amount = Math.max(1, Math.floor((state.food * 0.5) / 20));
        plans.push({ action: 'exportFood', exportAmount: amount });
        simulatedMoney += amount * 200;
        continue;
      }

      if (monumentTiles.length > 1) {
        const extra = monumentTiles.pop();
        plans.push({ action: 'sellMonument', x: extra.x, y: extra.y });
        simulatedMoney += MONUMENT_COST * Math.max(1, extra.tile.MonumentLevel || 1);
        continue;
      }

      if (monumentTiles.length === 1 && simulatedMoney >= MONUMENT_COST * 1.2) {
        const m = monumentTiles[0];
        plans.push({ action: 'upgradeMonument', x: m.x, y: m.y });
        simulatedMoney -= MONUMENT_COST;
        continue;
      }

      if (monumentTiles.length === 0 && simulatedMoney >= MONUMENT_COST) {
        const site = chooseBuildSite(innerPlainEmptyTiles, usedPositions);
        if (site) {
          plans.push({ action: 'buildMonument', x: site.x, y: site.y });
          simulatedMoney -= MONUMENT_COST;
          monumentTiles.push(site);
          continue;
        }
      }

      plans.push({ action: 'delayAction' });
    }

    return plans;
  };

  const AutoOptimizer = {
    running: false,
    timer: null,
    turnsLeft: 0,
    memory: {
      foodDeficitStreak: 0
    },

    run(turns = 10, intervalMs = 250) {
      const n = Number(turns);
      if (!Number.isFinite(n) || n <= 0) {
        console.warn('[AutoOptimizer] turns は 1 以上の数値で指定してください。');
        return;
      }
      if (this.running) {
        console.warn('[AutoOptimizer] すでに実行中です。停止するには AutoOptimizer.stop() を実行してください。');
        return;
      }

      this.running = true;
      this.turnsLeft = Math.floor(n);
      console.log(`[AutoOptimizer] 自動最適化を開始します。残り ${this.turnsLeft} ターン`);

      const step = () => {
        if (!this.running) return;
        if (this.turnsLeft <= 0) {
          this.stop(true);
          return;
        }

        try {
          const state = getSnapshot();
          if (state.isViewingOtherIsland) {
            console.warn('[AutoOptimizer] 他の島を表示中のため停止しました。自島に戻って再実行してください。');
            this.stop(false);
            return;
          }
          const plans = proposePlans(state, this.memory);

          plans.forEach((plan) => enqueuePlan(plan));

          if (typeof window.nextTurn !== 'function') {
            throw new Error('nextTurn 関数が見つかりません。');
          }
          window.nextTurn();

          this.turnsLeft -= 1;
          if (this.turnsLeft % 10 === 0 || this.turnsLeft <= 3) {
            console.log(`[AutoOptimizer] 実行中... 残り ${this.turnsLeft} ターン`);
          }
        } catch (e) {
          console.error('[AutoOptimizer] エラーで停止:', e);
          this.stop(false);
          return;
        }

        this.timer = setTimeout(step, intervalMs);
      };

      step();
    },

    stop(completed = false) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.running = false;
      const msg = completed ? '完了しました。' : '停止しました。';
      console.log(`[AutoOptimizer] ${msg}`);
    }
  };

  window.AutoOptimizer = AutoOptimizer;
  console.log('[AutoOptimizer] 読み込み完了: AutoOptimizer.run(ターン数, 間隔ms) / AutoOptimizer.stop()');
})();
