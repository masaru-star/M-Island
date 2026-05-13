let monster = null;
const MONSTER_TYPES = {
  1: { name: '怪獣シマオロシ', minHP: 1, maxHP: 1, ability: null, moneyPerTurn: 0, defeatMoney: 0, condition: (pop, currentTurn) => pop >= 100000 },
  2: { name: '怪獣ヴォルカガロス', minHP: 2, maxHP: 4, ability: 'destroyArea', moneyPerTurn: 0, defeatMoney: 0, condition: (pop, currentTurn) => pop >= 120000 },
  3: { name: '怪獣アエロガロス', minHP: 3, maxHP: 3, ability: 'multiMove', moneyPerTurn: 0, defeatMoney: 0, condition: (pop, currentTurn) => pop >= 120000 },
  4: { name: '怪獣テラガロス', minHP: 5, maxHP: 5, ability: 'landfillSea', moneyPerTurn: 0, defeatMoney: 0, condition: (pop, currentTurn) => pop >= 150000 },
  5: { name: '怪獣アクアガロス', minHP: 3, maxHP: 5, ability: 'createSea', moneyPerTurn: 0, defeatMoney: 0, condition: (pop, currentTurn) => pop >= 200000 },
  6: { name: '怪獣シルバガロス', minHP: 2, maxHP: 2, ability: null, moneyPerTurn: 5000, defeatMoney: 5000000, condition: (pop, currentTurn) => pop >= 100000 && currentTurn >= 3000 },
  7: { name: '怪獣ゴルドガロス', minHP: 2, maxHP: 2, ability: null, moneyPerTurn: 50000, defeatMoney: 50000000, condition: (pop, currentTurn) => pop >= 130000 && currentTurn >= 3000 },
  8: { name: '怪獣プラチガロス', minHP: 2, maxHP: 2, ability: null, moneyPerTurn: 500000, defeatMoney: 250000000, condition: (pop, currentTurn) => pop >= 150000 && currentTurn >= 3000 },
  9: { name: '怪獣キングガロス', minHP: 100, maxHP: 250, ability: 'kingMonster', moneyPerTurn: 0, defeatMoney: 0, condition: () => false }
};
const KING_MONSTER_TYPE_ID = 9;
const KING_MONSTER_CODE = 'KING_MONSTER';
  const SIZE = 16;
  let money = 2500;
  let food = 1000;
  let population = 0;
  let turn = 0;
  let achievementPoints = 0;
  let tutorialMissions = {
      '01': false, '02': false, '03': false, '04': false, '05': false, '06': false, '07': false, '08': false
  };
  let map = [];
  let selectedX = null, selectedY = null;
  let actionQueue = [];
  let islandName = "MyIsland";
  let warships = []; // 軍艦の配列を追加
  let economicCrisisTurns = 0; // 経済危機の残りターン数
  let frozenMoney = 0; // 経済危機による凍結資金
  let volcanoTurns = 0; // 火山の噴火 残りターン数
  let trackedFundingFailure = null; // 資金不足で失敗した計画の追跡情報
  let currentExecutingTask = null; // 実行中計画（失敗追跡用）

  const SESSION_SETTING_DEFAULTS = {
      settingShowClearTileSelection: false,
      settingShowKeepOptionSelected: true,
      settingShowFundingTrackingControls: false,
      settingShowEconomicCrisisRate: false,
      settingEnablePlanTracking: false,
      settingEnhanceWarshipToExpLimit: false,
      settingAutoBombardCountToGuns: false,
      settingAutoExportFoodMax: false,
      settingAutoSupplyMax: false
  };
  let sessionSettings = { ...SESSION_SETTING_DEFAULTS };

  // 軍艦の色変化条件
  const WARSHIP_CAPS = {
      maxDurability: 30,
      mainGun: 15,
      antiAir: 35,
      maxFuel: 1000,
      maxAmmo: 1200
  };
  const MEDAL_PROGRESS_STORAGE_KEY = 'warshipMedalProgress';
  const RESIDENT_WHISPERS = [
      '「今日は波が静かだね…」',
      '「倉庫の見回り、忘れないでね」',
      '「港の風、ちょっと気持ちいい」',
      '「次のターンも平和だといいな」',
      '「最近、街に活気が出てきたかも」'
  ];
  const MEDAL_DEFS = {
      precise: {
          label: '精密射撃の名手',
          tiers: [
              { level: 1, id: '01_1_precise', icon: 'svg/01_1_precise.svg', condition: (s) => s.maxHitStreak >= 3 },
              { level: 2, id: '01_2_precise', icon: 'svg/01_2_precise.svg', condition: (s) => s.maxHitStreak >= 6 },
              { level: 3, id: '01_3_precise', icon: 'svg/01_3_precise.svg', condition: (s) => s.maxHitStreak >= 12 }
          ]
      },
      shield: {
          label: '不落の盾',
          tiers: [
              { level: 1, id: '02_1_shield', icon: 'svg/02_1_shield.svg', condition: (s) => s.damageTaken > 5 },
              { level: 2, id: '02_2_shield', icon: 'svg/02_2_shield.svg', condition: (s) => s.damageTaken > 10 },
              { level: 3, id: '02_3_shield', icon: 'svg/02_3_shield.svg', condition: (s) => s.damageTaken > 30 }
          ]
      },
      shot: {
          label: '殲滅王',
          tiers: [
              { level: 1, id: '03_1_shot', icon: 'svg/03_1_shot.svg', condition: (s) => s.sunkWarships >= 1 }
          ]
      },
      avoidance: {
          label: '奇跡の生還者',
          tiers: [
              { level: 1, id: '04_1_avoidance', icon: 'svg/04_1_avoidance.svg', condition: (s) => s.hp1HoldTurns >= 2 }
          ]
      }
  };
  let warshipTurnStats = {};
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
function getWarshipProgressStore() {
    try {
        return JSON.parse(localStorage.getItem(MEDAL_PROGRESS_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}
function setWarshipProgressStore(store) {
    localStorage.setItem(MEDAL_PROGRESS_STORAGE_KEY, JSON.stringify(store || {}));
}
function resetWarshipProgressStore() {
    localStorage.removeItem(MEDAL_PROGRESS_STORAGE_KEY);
}
function getWarshipKey(ship) {
    return `${ship.homePort}::${ship.name}`;
}
function ensureWarshipFields(ship) {
    if (ship.nickname === undefined) ship.nickname = '';
    if (!ship.medalsEarned || typeof ship.medalsEarned !== 'object') ship.medalsEarned = {};
}
function getWarshipDisplayName(ship) {
    ensureWarshipFields(ship);
    return ship.nickname ? `${ship.nickname} ${ship.name}` : ship.name;
}
function getWarshipMedalIconsHtml(ship) {
    ensureWarshipFields(ship);
    const icons = [];
    Object.keys(MEDAL_DEFS).forEach((key) => {
        const level = ship.medalsEarned[key] || 0;
        if (!level) return;
        const tier = MEDAL_DEFS[key].tiers.find((t) => t.level === level);
        if (tier) {
            icons.push(`<img class="warship-medal" src="${tier.icon}" alt="${MEDAL_DEFS[key].label} Lv${level}" title="${MEDAL_DEFS[key].label} Lv${level}">`);
        }
    });
    return icons.join('');
}
function maybeLogResidentWhisper(originMsg) {
    if (population < 1 || Math.random() >= 0.1) return;
    const eventWords = ['建設', '討伐', '砲撃', '破壊', '増強', '修理', '撃沈', '達成', '出現', '維持費'];
    const isSpecificEvent = eventWords.some((w) => originMsg.includes(w));
    if (!isSpecificEvent) return;
    const whisper = RESIDENT_WHISPERS[Math.floor(Math.random() * RESIDENT_WHISPERS.length)];
    logAction(`住民の呟き ${whisper}`, { subtle: true, skipWhisper: true });
}
function initWarshipTurnStats() {
    warshipTurnStats = {};
    warships.forEach((ship) => {
        ensureWarshipFields(ship);
        warshipTurnStats[getWarshipKey(ship)] = { maxHitStreak: 0, currentHitStreak: 0, damageTaken: 0, sunkWarships: 0 };
    });
}
function registerWarshipHit(ship) {
    const key = getWarshipKey(ship);
    if (!warshipTurnStats[key]) warshipTurnStats[key] = { maxHitStreak: 0, currentHitStreak: 0, damageTaken: 0, sunkWarships: 0 };
    warshipTurnStats[key].currentHitStreak += 1;
    warshipTurnStats[key].maxHitStreak = Math.max(warshipTurnStats[key].maxHitStreak, warshipTurnStats[key].currentHitStreak);
}
function registerWarshipMiss(ship) {
    const key = getWarshipKey(ship);
    if (!warshipTurnStats[key]) warshipTurnStats[key] = { maxHitStreak: 0, currentHitStreak: 0, damageTaken: 0, sunkWarships: 0 };
    warshipTurnStats[key].currentHitStreak = 0;
}
function registerWarshipDamageTaken(ship, damage) {
    if (!ship || damage <= 0) return;
    const key = getWarshipKey(ship);
    if (!warshipTurnStats[key]) warshipTurnStats[key] = { maxHitStreak: 0, currentHitStreak: 0, damageTaken: 0, sunkWarships: 0 };
    warshipTurnStats[key].damageTaken += damage;
}
function registerWarshipSink(attacker) {
    const key = getWarshipKey(attacker);
    if (!warshipTurnStats[key]) warshipTurnStats[key] = { maxHitStreak: 0, currentHitStreak: 0, damageTaken: 0, sunkWarships: 0 };
    warshipTurnStats[key].sunkWarships += 1;
}
function evaluateWarshipMedals() {
    const store = getWarshipProgressStore();
    warships.forEach((ship) => {
        ensureWarshipFields(ship);
        const key = getWarshipKey(ship);
        const stats = warshipTurnStats[key] || { maxHitStreak: 0, damageTaken: 0, sunkWarships: 0 };
        const progress = store[key] || { hp1HoldTurns: 0 };
        progress.hp1HoldTurns = ship.currentDurability === 1 ? (progress.hp1HoldTurns || 0) + 1 : 0;
        Object.keys(MEDAL_DEFS).forEach((medalKey) => {
            const currentLevel = ship.medalsEarned[medalKey] || 0;
            let newLevel = currentLevel;
            MEDAL_DEFS[medalKey].tiers.forEach((tier) => {
                if (tier.condition({ ...stats, hp1HoldTurns: progress.hp1HoldTurns }) && tier.level > newLevel) {
                    newLevel = tier.level;
                }
            });
            if (newLevel > currentLevel) {
                ship.medalsEarned[medalKey] = newLevel;
                logAction(`軍艦 ${getWarshipDisplayName(ship)} が勲章「${MEDAL_DEFS[medalKey].label} Lv${newLevel}」を獲得しました！`);
            }
        });
        store[key] = progress;
    });
    setWarshipProgressStore(store);
}
/**
 * 軍艦がダメージを受けた際に、火災または弾薬庫の発火を判定する
 * @param {object} warship ダメージを受けた軍艦オブジェクト
 * @param {number} damage 実際に受けたダメージ量 (今回は使用しないが汎用性のために残す)
 */
function checkAbnormalityOnDamage(warship, damage) {
    // 既に異常状態か、沈没している場合はスキップ
    if (warship.currentDurability <= 0 || warship.abnormality !== null) {
        return; 
    }
    let newAbnormality = null;
    if (warship.currentAmmo >= 1000 && Math.random() < 0.30) {
        newAbnormality = 'ammoFire'; 
    }
    if (newAbnormality === null && Math.random() < 0.10) {
        newAbnormality = 'fire';
    }
        if (newAbnormality !== null) {
        warship.abnormality = newAbnormality;
        if (newAbnormality === 'fire') {
            logAction(`軍艦 ${warship.name} に火災が発生しました！`);
        } else if (newAbnormality === 'ammoFire') {
            logAction(`軍艦 ${warship.name} の弾薬庫が発火しました！`);
        }
    }
}
/**
 * 砲撃が命中した際に、通信障害または浸水を判定する
 * @param {object} target 命中した軍艦オブジェクト
 */
function checkAbnormalityOnHit(target) {
    if (target.currentDurability <= 0 || target.abnormality !== null) {
        return;
    }
    
    let newAbnormality = null;
    if (target.currentDurability <= 50 && Math.random() < 0.05) {
        newAbnormality = 'flooding';
    }

    // 1. 通信障害の判定 (命中した際、1%の確率)
    // 自島にいる場合は発生しない (isDispatchedがtrueの時のみ発生)
    if (newAbnormality === null && target.isDispatched && Math.random() < 0.01) {
        newAbnormality = 'commFailure'; 
    }

    if (newAbnormality !== null) {
        target.abnormality = newAbnormality;
        if (newAbnormality === 'flooding') {
            logAction(`軍艦 ${target.name} に浸水が発生しました！`);
        } else if (newAbnormality === 'commFailure') {
            logAction(`軍艦 ${target.name} に通信障害が発生しました！`);
        }
    }
}
function getActionName(action, x, y, extraData) {
    let name = '';
    const actionNames = {
        buildFarm: '農場建設', buildFactory: '工場建設', enhanceFacility: '設備強化', buildPort: '港建設',
        buildGun: '砲台建設', buildDefenseFacility: '防衛施設建設', flatten: '整地', landfill: '埋め立て',
        dig: '掘削', cutForest: '伐採', plantForest: '植林', exportFood: '食料輸出',
        bombard: '砲撃', spreadBombard: '拡散弾砲撃', ppBombard: 'PP弾砲撃', randomBombard: 'ランダム弾砲撃', concentratedFire: '集中砲撃', selfDestructMilitaryFacility: '軍事施設自爆',
        goToOtherIsland: '他の島に行く', returnToMyIsland: '自島に戻る', buildWarship: '軍艦建造',
        refuelWarship: '燃料補給', resupplyWarshipAmmo: '弾薬補給', repairWarship: '軍艦修理',
        enhanceWarship: '軍艦増強', decommissionWarship: '軍艦除籍', dispatchWarship: '軍艦派遣',
        requestWarshipReturn: '軍艦帰還要請', setWarshipNickname: '二つ名指定', convertAchievementToExp: '実績pt変換', remodelWarshipWeapon: '武器換装', buildMonument: '石碑建設', upgradeMonument: '石碑強化',
        sellMonument: '石碑売却', initializeIsland: '島の初期化', delayAction: '遅延行動' 
    };
    name = actionNames[action] || action;

    // 計画の詳細情報を名前に組み込む
    if (action === 'exportFood' && extraData && extraData.amount) {
        name += ` (${extraData.amount * 20} 食料)`;
    } else if ((action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard' || action === 'randomBombard') && extraData && extraData.count) {
        name += ` (${extraData.count} 発)`;
    } else if (action === 'refuelWarship' && extraData && extraData.amount) {
        name += ` (${extraData.amount} 燃料)`;
    } else if (action === 'resupplyWarshipAmmo' && extraData && extraData.amount) {
        name += ` (${extraData.amount} 弾薬)`;
    } else if (action === 'repairWarship' && extraData && extraData.amount) {
        name += ` (${extraData.amount} 耐久回復)`;
    } else if (action === 'buildWarship' && extraData && extraData.name) {
        name += ` (${extraData.name})`;
    } else if ((action === 'dispatchWarship' || action === 'requestWarshipReturn') && extraData && extraData.name) {
        name += ` (${extraData.name})`;
    } else if (action === 'setWarshipNickname' && extraData && extraData.nickname) {
        name += ` (${extraData.nickname})`;
    } else if (action === 'convertAchievementToExp' && extraData && extraData.amount) {
        name += ` (${extraData.amount}Pt)`;
    } else if (action === 'remodelWarshipWeapon' && extraData && extraData.weaponType) {
        name += ` (${extraData.weaponType === 'mainGun' ? '主砲' : '魚雷'})`;
    } else if (action === 'goToOtherIsland' && extraData && extraData.code) {
        name += ` (コード: ${extraData.code.substring(0, 10)}...)`;
    } else if (action === 'dig' && extraData && extraData.oilFactor && extraData.oilFactor > 1) {
        let cost = 300;
        cost = 300 * extraData.oilFactor ** 2;
        name += ` (予算:${cost} レベル:${extraData.oilFactor})`;
    }
    
    // 座標の表示
    let coord = (x !== null && y !== null) ? `(${x},${y})` : '';

    return { name, coord };
}

function getBombardTypeLabel(action) {
    if (action === 'bombard') return '砲撃';
    if (action === 'spreadBombard') return '拡散弾砲撃';
    if (action === 'ppBombard') return 'PP弾砲撃';
    if (action === 'randomBombard') return 'ランダム弾砲撃';
    return '砲撃';
}
function getRequiredMoneyForTask(task) {
    if (!task || !task.action) return 0;
    const action = task.action;
    if (action === 'buildFarm' || action === 'buildFactory') return 100;
    if (action === 'enhanceFacility') return 10000;
    if (action === 'buildPort') return 3000;
    if (action === 'buildGun') return 1200;
    if (action === 'buildDefenseFacility') return 5000;
    if (action === 'flatten') return 20;
    if (action === 'landfill') return 600;
    if (action === 'dig') {
        const factor = task.oilFactor ? Math.max(1, Number(task.oilFactor)) : 1;
        return 300 * factor ** 2;
    }
    if (action === 'plantForest') return 200;
    if (action === 'bombard') return 120 * (task.count || 1);
    if (action === 'spreadBombard') return 500 * (task.count || 1);
    if (action === 'ppBombard') return 10000000 * (task.count || 1);
    if (action === 'randomBombard') return 500000 * (task.count || 1);
    if (action === 'buildMonument' || action === 'upgradeMonument') return 500000000;
    if (action === 'setWarshipNickname') return 100000;
    if (action === 'buildWarship') return Number(task?.warshipData?.originalCost || 0);
    if (action === 'resupplyWarshipAmmo') return 1000 * (task.amount || 1);
    if (action === 'repairWarship') return 100000 * (task.amount || 1);
    return 0;
}
function isSessionSettingEnabled(settingId) {
    return Boolean(sessionSettings[settingId]);
}
function setElementDisplayById(elementId, isVisible, displayValue = '') {
    const element = document.getElementById(elementId);
    if (element) element.style.display = isVisible ? displayValue : 'none';
}
function getSelectedTileWarship() {
    if (selectedX === null || selectedY === null) return null;
    return warships.find(ship => ship.x === selectedX && ship.y === selectedY) || null;
}
function getMaxExportFoodAmount() {
    return Math.max(1, Math.floor(food / 20));
}
function getMaxRefuelAmount(warship) {
    if (!warship) return 1;
    ensureWarshipFields(warship);
    const capacityLimit = Math.max(0, warship.maxFuel - warship.currentFuel);
    const resourceLimit = Math.floor(food / 500);
    return Math.max(1, Math.min(capacityLimit, resourceLimit));
}
function getMaxResupplyAmmoAmount(warship) {
    if (!warship) return 1;
    ensureWarshipFields(warship);
    const capacityLimit = Math.max(0, warship.maxAmmo - warship.currentAmmo);
    const resourceLimit = Math.floor(money / 20000);
    return Math.max(1, Math.min(capacityLimit, resourceLimit));
}
function applyAutomaticInputValues(action) {
    if (isSessionSettingEnabled('settingAutoExportFoodMax') && action === 'exportFood') {
        document.getElementById('exportAmount').value = getMaxExportFoodAmount();
    }
    if (isSessionSettingEnabled('settingAutoBombardCountToGuns') && (action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard' || action === 'randomBombard')) {
        document.getElementById('bombardCount').value = Math.max(1, getGunCount());
    }
    if (isSessionSettingEnabled('settingAutoSupplyMax')) {
        const warship = getSelectedTileWarship();
        if (action === 'refuelWarship') {
            document.getElementById('refuelAmount').value = getMaxRefuelAmount(warship);
        } else if (action === 'resupplyWarshipAmmo') {
            document.getElementById('resupplyAmmoAmount').value = getMaxResupplyAmmoAmount(warship);
        }
    }
}
function applySessionSettings() {
    setElementDisplayById('clearTileSelectionBtn', isSessionSettingEnabled('settingShowClearTileSelection'), 'inline-block');
    setElementDisplayById('keepOptionSettingControl', isSessionSettingEnabled('settingShowKeepOptionSelected'), 'inline');
    setElementDisplayById('fundingTrackingControls', isSessionSettingEnabled('settingShowFundingTrackingControls'), 'inline');
    if (!isSessionSettingEnabled('settingEnablePlanTracking')) {
        trackedFundingFailure = null;
    }
    updateLogStatusLines();
    const actionSelect = document.getElementById('actionSelect');
    const warshipSubSelect = document.getElementById('warshipSubSelect');
    let action = actionSelect ? actionSelect.value : '';
    if (action === 'warshipTool' && warshipSubSelect) action = warshipSubSelect.value;
    applyAutomaticInputValues(action);
}
function initializeSessionSettings() {
    sessionSettings = { ...SESSION_SETTING_DEFAULTS };
    Object.keys(SESSION_SETTING_DEFAULTS).forEach(settingId => {
        const input = document.getElementById(settingId);
        if (!input) return;
        input.checked = SESSION_SETTING_DEFAULTS[settingId];
        input.addEventListener('change', () => {
            sessionSettings[settingId] = input.checked;
            applySessionSettings();
            if (typeof window.updateConfirmButton === 'function') window.updateConfirmButton();
        });
    });
    applySessionSettings();
}
function getEconomicCrisisRiskInfo() {
    const currentTotalMoney = money + frozenMoney;
    const threshold = 100000000;
    const baseMoney = 1500000000;
    if (economicCrisisTurns > 0) {
        return { probability: 100, shortage: 0, crisisActive: true };
    }
    if (currentTotalMoney < threshold) {
        return { probability: 0, shortage: threshold - currentTotalMoney, crisisActive: false };
    }
    const excessMoney = Math.max(0, currentTotalMoney - baseMoney);
    const baseProbability = 0.01;
    const additionalProbability = Math.floor(excessMoney / 100000000) * 0.002;
    const totalProbability = Math.min(1, baseProbability + additionalProbability);
    return { probability: totalProbability * 100, shortage: 0, crisisActive: false };
}
function updateLogStatusLines() {
    const line1 = document.getElementById('logStatusLine1');
    const line2 = document.getElementById('logStatusLine2');
    if (!line1 || !line2) return;
    line1.style.display = isSessionSettingEnabled('settingShowEconomicCrisisRate') ? '' : 'none';
    line2.style.display = isSessionSettingEnabled('settingEnablePlanTracking') ? '' : 'none';
    const crisisInfo = getEconomicCrisisRiskInfo();
    if (crisisInfo.crisisActive) {
        line1.textContent = `経済危機進行中: 発生確率 100% (残り ${economicCrisisTurns}ターン)`;
    } else if (crisisInfo.probability <= 0) {
        line1.textContent = `経済危機発生確率: 0% / 可能性が出るまであと ${crisisInfo.shortage}G 以上`;
    } else {
        line1.textContent = `現在の経済危機発生確率: ${crisisInfo.probability.toFixed(1)}%`;
    }
    line1.className = 'log-status-danger';

    if (!trackedFundingFailure) {
        line2.textContent = '資金不足による計画失敗トラッキング: なし';
        line2.className = 'log-status-muted';
        return;
    }
    const { planLabel, targetMoney } = trackedFundingFailure;
    const currentMoney = trackedFundingFailure.currentMoney ?? money;
    const progress = targetMoney > 0 ? Math.min(100, (currentMoney / targetMoney) * 100) : 100;
    const achieved = currentMoney >= targetMoney;
    if (achieved) {
        line2.textContent = `資金不足トラッキング: 「${planLabel}」は達成済みです (目標 ${targetMoney}G / 現在 ${currentMoney}G / 達成率 ${progress.toFixed(1)}%)`;
        line2.className = 'log-status-info';
    } else {
        line2.textContent = `資金不足トラッキング: 「${planLabel}」 目標 ${targetMoney}G / 現在 ${currentMoney}G / 達成率 ${progress.toFixed(1)}%`;
        line2.className = 'log-status-danger';
    }
}
function setFundingFailureTrackingFromTask(task) {
    if (!isSessionSettingEnabled('settingEnablePlanTracking')) return;
    if (!task) return;
    const pinTracking = document.getElementById('pinFundingFailureTracking')?.checked;
    if (pinTracking && trackedFundingFailure) return;
    const targetMoney = getRequiredMoneyForTask(task);
    if (targetMoney <= 0) return;
    const { name, coord } = getActionName(task.action, task.x, task.y, task);
    trackedFundingFailure = {
        action: task.action,
        planLabel: `${coord} ${name}`.trim(),
        targetMoney
    };
    updateLogStatusLines();
}

// 計画キューの表示を更新する関数
function renderActionQueue() {
    const list = document.getElementById('actionQueueList');
    if (!list) return;
    list.innerHTML = '';
    const MAX_QUEUE_SIZE = 20; 
    for (let index = 0; index < MAX_QUEUE_SIZE; index++) {
        const listItem = document.createElement('li');
        const task = actionQueue[index]; // キューから計画を取得
        // 2桁の番号を先頭に追加
        const displayIndex = (index + 1).toString().padStart(2, '0');
        if (task) {
            // 計画が設定されている場合
            const { name, coord } = getActionName(task.action, task.x, task.y, task);
            let classList = "action-link";
            if (index < 2) {
                classList += " next-action";
            }
            listItem.innerHTML = `
                ${displayIndex} 
                <span class="${classList}" onclick="cancelAction(${index})">
                    ${coord} ${name}
                </span>
            `;
        } else {
            listItem.innerHTML = `${displayIndex} 計画無し`;
        }       
        list.appendChild(listItem);
    }
}
// 計画を撤回する関数
window.cancelAction = function (index) {
    if (index >= 0 && index < actionQueue.length) {
        const actionToCancel = actionQueue[index];
        const { name, coord } = getActionName(actionToCancel.action, actionToCancel.x, actionToCancel.y, actionToCancel);
        actionQueue.splice(index, 1);
        logAction(`計画「${coord} ${name}」を撤回しました。`);
        renderActionQueue();
        saveMyIslandState(); // 島の状態を保存
    }
}
function checkAndCompleteMission(missionId, pt, foodReward, moneyReward, checkFunc, logMessage) {
    if (!tutorialMissions[missionId] && checkFunc()) {
        tutorialMissions[missionId] = true;
        achievementPoints += pt;
        food += foodReward;
        money += moneyReward;
        logAction(`チュートリアルミッション${missionId}「${logMessage}」を達成し、${pt}Pt、${moneyReward}G、${foodReward}食料を獲得しました！`);
        updateStatus();
        saveMyIslandState();
        return true;
    }
    return false;
}
  // 上限到達数に応じて軍艦名のクラスを返す関数
  function getWarshipCapClass(ship) {
      let cappedCount = 0;
      if (ship.maxDurability >= WARSHIP_CAPS.maxDurability) cappedCount++;
      if (ship.mainGun >= WARSHIP_CAPS.mainGun) cappedCount++;
      if (ship.antiAir >= WARSHIP_CAPS.antiAir) cappedCount++;
      if (ship.maxFuel >= WARSHIP_CAPS.maxFuel) cappedCount++;
      if (ship.maxAmmo >= WARSHIP_CAPS.maxAmmo) cappedCount++;
      if (ship.exp === "NaN") cappedCount = 10;

      if (cappedCount === 2) return 'warship-name-cap-2';
      if (cappedCount === 3) return 'warship-name-cap-3';
      if (cappedCount === 4) return 'warship-name-cap-4';
      if (cappedCount === 5) return 'warship-name-cap-5';
      if (cappedCount === 10) return 'warship-sp';
      return ''; // 上限到達が2つ未満の場合は色を付けない
  }
let myIslandState = null; // 自分の島の状態を保存する変数
let isViewingOtherIsland = false; // 他の島を見ているかどうかのフラグ

function randTerrain() {
  const r = Math.random();
  // 海が生成される確率も加える
  if (r < 0.2) return 'sea'; // 海の確率を調整
  else if (r < 0.5) return 'plain';
  else if (r < 0.7) return 'waste';
  else return 'forest';
}
function getGunCount() {
    let targetMap = map;
    // 他の島を見ている場合、自分の島の状態から砲台数を取得する
    // ただし、自島状態がまだない（初期状態）場合は砲台は0とする
    if (isViewingOtherIsland && myIslandState && myIslandState.map) {
        targetMap = myIslandState.map;
    } else if (isViewingOtherIsland && !myIslandState) {
        return 0;
    }

    if (targetMap.length === 0) return 0;

    // mapを走査して砲台 (facility: 'gun') の砲撃可能数を数える
    let count = 0;
    targetMap.forEach(row => {
        row.forEach(tile => {
            if (tile.facility === 'gun') {
                count += tile.enhanced ? 3 : 1; // 高効率砲台は3連装
            }
        });
    });
    return count;
}

function handleMonsterDefeat(monster, customMessage) {
    const monsterType = MONSTER_TYPES[monster.typeId] || { name: '怪獣', defeatMoney: 0 };
    monsters = monsters.filter(m => m !== monster);
    if (customMessage) {
        logAction(customMessage);
    }
    if (monsterType.defeatMoney && monsterType.defeatMoney > 0) {
        money += monsterType.defeatMoney;
        logAction(`${monsterType.name}の討伐報奨金として${monsterType.defeatMoney}Gを獲得しました！`);
    }
    if (monster.typeId === KING_MONSTER_TYPE_ID) {
        const rewardTable = { 100: 12, 200: 32, 250: 45 };
        const kingDefeatPt = rewardTable[monster.spawnHp || monster.hp] || 0;
        if (kingDefeatPt > 0) {
            achievementPoints += kingDefeatPt;
            logAction(`${monsterType.name}討伐により ${kingDefeatPt} 実績ptを獲得しました！`);
        }
    }
}
function isKingMonster(targetMonster) {
    return targetMonster && targetMonster.typeId === KING_MONSTER_TYPE_ID;
}
function countHousesOnIsland() {
    let houses = 0;
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (map[y][x].facility === 'house') houses++;
        }
    }
    return houses;
}
function applyKingMonsterTileDestruction(x, y, actionLogPrefix) {
    const tile = map[y][x];
    const targetWarship = warships.find(ship => ship.x === x && ship.y === y && ship.currentDurability > 0 && !ship.isDispatched);
    if (targetWarship) {
        targetWarship.currentDurability -= 10;
        targetWarship.abnormality = 'flooding';
        checkAbnormalityOnDamage(targetWarship, 10);
        logAction(`${actionLogPrefix} 軍艦 ${targetWarship.name} に10ダメージと浸水を与えました。`);
        if (targetWarship.currentDurability <= 0) {
            targetWarship.currentDurability = 0;
            targetWarship.currentFuel = 0;
            targetWarship.currentAmmo = 0;
            logAction(`軍艦 ${targetWarship.name} はキングガロスの攻撃で撃沈しました。`);
        }
        return;
    }
    if (tile.facility === 'house') {
        population -= tile.pop;
        if (population < 0) population = 0;
    }
    if (tile.terrain === 'sea') {
        tile.terrain = 'waste';
    } else {
        tile.terrain = 'waste';
        tile.facility = null;
        tile.pop = 0;
        tile.enhanced = false;
    }
}
function triggerMilitaryFacilitySelfDestruct(x, y, sourceName = '軍事施設') {
    const tile = map[y] && map[y][x];
    if (!tile || (tile.facility !== 'gun' && tile.facility !== 'defenseFacility')) return false;

    tile.facility = null;
    tile.terrain = 'sea';
    tile.enhanced = false;
    const bySourceText = sourceName ? `${sourceName}により` : '';
    logAction(`(${x},${y}) の軍事施設が${bySourceText}自爆し、海になりました。`);

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;

            const targetWarship = warships.find(ship => ship.x === nx && ship.y === ny && ship.currentDurability > 0 && !ship.isDispatched);
            if (targetWarship) {
                const damage = Math.floor(Math.random() * 6) + 5;
                targetWarship.currentDurability -= damage;
                checkAbnormalityOnDamage(targetWarship, damage);
                if (targetWarship.currentDurability <= 0) {
                    targetWarship.currentDurability = 0;
                    targetWarship.currentFuel = 0;
                    targetWarship.currentAmmo = 0;
                    logAction(`自爆により軍艦 ${targetWarship.name} (${nx},${ny}) は${damage}のダメージを受け撃沈しました！`);
                } else {
                    logAction(`自爆により軍艦 ${targetWarship.name} (${nx},${ny}) は${damage}のダメージを受けました。残り耐久: ${targetWarship.currentDurability}`);
                }
            }

            const monsterHit = monsters.find(m => m.x === nx && m.y === ny);
            if (monsterHit) {
                const damage = Math.floor(Math.random() * 6) + 5;
                monsterHit.hp -= damage;
                const monsterName = MONSTER_TYPES[monsterHit.typeId] ? MONSTER_TYPES[monsterHit.typeId].name : '怪獣';
                logAction(`自爆により ${monsterName} (${nx},${ny}) は${damage}のダメージを受けました。残り体力: ${monsterHit.hp}`);
                if (monsterHit.hp <= 0) {
                    handleMonsterDefeat(monsterHit, `${monsterName} は自爆に巻き込まれ討伐されました！`);
                }
            }
        }
    }

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || (dx === 0 && dy === 0)) continue;
            const affectedTile = map[ny][nx];
            if (affectedTile.terrain !== 'sea') {
                if (affectedTile.facility === 'house') {
                    population -= affectedTile.pop;
                    if (population < 0) population = 0;
                }
                affectedTile.terrain = 'waste';
                affectedTile.facility = null;
                affectedTile.pop = 0;
                affectedTile.enhanced = false;
                logAction(`(${nx},${ny}) が軍事施設自爆により荒地になりました。`);
            }
        }
    }
    return true;
}
function spawnKingMonsterFromCode() {
    const spawnCandidates = [];
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (map[y][x].facility === 'house' && !monsters.find(m => m.x === x && m.y === y)) {
                spawnCandidates.push({ x, y });
            }
        }
    }
    if (spawnCandidates.length === 0) {
        logAction('キングガロスの出現候補となる住宅がありませんでした。');
        return;
    }
    const spawn = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
    const hpCandidates = [100, 200, 250];
    const hp = hpCandidates[Math.floor(Math.random() * hpCandidates.length)];
    monsters.push({ x: spawn.x, y: spawn.y, typeId: KING_MONSTER_TYPE_ID, hp, spawnHp: hp });
    const spawnedTile = map[spawn.y][spawn.x];
    population -= spawnedTile.pop;
    if (population < 0) population = 0;
    spawnedTile.terrain = 'waste';
    spawnedTile.facility = null;
    spawnedTile.pop = 0;
    spawnedTile.enhanced = false;
    logAction(`(${spawn.x},${spawn.y}) に 怪獣キングガロス (体力: ${hp}) が出現‼`);
}
function initMap() {
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

function updateStatus() {
const moneyElement = document.getElementById('money');
  if (economicCrisisTurns > 0) {
      moneyElement.innerHTML = `${money} <span style="color: red;">(使用不可${frozenMoney})</span>`;
  } else {
      moneyElement.textContent = money;
  }
  document.getElementById('food').textContent = food < 0 ? 0 : food;
  document.getElementById('population').textContent = population < 0 ? 0 : population;
  document.getElementById('turn').textContent = turn;
  document.getElementById('currentIslandName').textContent = islandName;
  document.getElementById('achievementPoints').textContent = achievementPoints; // ここで値を反映
  const guns = getGunCount();
  document.getElementById('gunCount').textContent = guns;
  let landMap = map; // デフォルトは現在のマップ
  
  if (isViewingOtherIsland && myIslandState && myIslandState.map) {
      landMap = myIslandState.map;
  } else if (isViewingOtherIsland && !myIslandState) {
      landMap = []; // 面積 0 扱い
  } else if (!isViewingOtherIsland) {
      landMap = map;
  }
  let landTiles = 0;
  if (landMap && landMap.length > 0) {
      landMap.forEach(row => {
          row.forEach(tile => {
              if (tile.terrain !== 'sea') {
                  landTiles++;
              }
          });
      });
  }
  const landArea = landTiles * 10;
  document.getElementById('landArea').textContent = landArea;
  // 他の島を見ているときは資金、食料、人口を非表示にする
  document.getElementById('money').style.visibility = isViewingOtherIsland ? 'hidden' : 'visible';
  document.getElementById('food').style.visibility = isViewingOtherIsland ? 'hidden' : 'visible';
  document.getElementById('population').style.visibility = isViewingOtherIsland ? 'hidden' : 'visible';
  if (trackedFundingFailure) {
      trackedFundingFailure.currentMoney = money;
  }
  updateLogStatusLines();
}

// confirmButtonの表示/非表示を更新する関数
window.updateConfirmButton = function () {
  const actionSelect = document.getElementById('actionSelect');
  const warshipSubSelect = document.getElementById('warshipSubSelect');

  let action = actionSelect.value;
  if (action === 'warshipTool') {
      warshipSubSelect.style.display = 'inline-block';
      action = warshipSubSelect.value; 
  } else {
      warshipSubSelect.style.display = 'none';
      warshipSubSelect.value = ""; // サブセレクトをリセット
  }
  document.getElementById('confirmBtn').disabled = (action === "");
  document.getElementById('exportAmount').style.display = 'none';
  document.getElementById('bombardCount').style.display = 'none';
  document.getElementById('touristCodeInput').style.display = 'none';
  document.getElementById('warshipBuildInputs').style.display = 'none';
  document.getElementById('refuelAmount').style.display = 'none';
  document.getElementById('resupplyAmmoAmount').style.display = 'none';
  document.getElementById('repairAmount').style.display = 'none';
  document.getElementById('warshipNicknameInput').style.display = 'none';
  document.getElementById('achievementConvertAmount').style.display = 'none';
  document.getElementById('weaponRemodelType').style.display = 'none';
  document.getElementById('oilDrillFactor').style.display = 'none';
  const options = actionSelect.options;
  for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option.value === "") continue;

      if (isViewingOtherIsland) {
          if (option.dataset.anyisland) {
              option.style.display = '';
          } else {
              option.style.display = 'none';
          }
      } else {
          if (option.dataset.myisland || option.dataset.anyisland) {
              option.style.display = '';
          } else {
              option.style.display = 'none';
          }
      }
  }
  if (action === 'exportFood') {
      document.getElementById('exportAmount').style.display = 'inline-block';
  } else if (action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard' || action === 'randomBombard') {
      document.getElementById('bombardCount').style.display = 'inline-block';
  } else if (action === 'goToOtherIsland' || action === 'dispatchWarship') {
      document.getElementById('touristCodeInput').style.display = 'inline-block';
  } else if (action === 'buildWarship') {
      document.getElementById('warshipBuildInputs').style.display = 'block';
      // デフォルト値を設定
      document.getElementById('warshipName').value = "無銘艦";
      document.getElementById('warshipDurability').value = 2;
      document.getElementById('warshipMainGun').value = 1;
      document.getElementById('warshipTorpedo').value = 0;
      document.getElementById('warshipAntiAir').value = 1;
      document.getElementById('warshipAmmo').value = 10;
      document.getElementById('warshipRecon').value = 0;
      document.getElementById('warshipAccuracy').value = 0;
  } else if (action === 'refuelWarship') {
      document.getElementById('refuelAmount').style.display = 'inline-block';
  } else if (action === 'resupplyWarshipAmmo') {
      document.getElementById('resupplyAmmoAmount').style.display = 'inline-block';
  } else if (action === 'repairWarship') {
      document.getElementById('repairAmount').style.display = 'inline-block';
  } else if (action === 'setWarshipNickname') {
      document.getElementById('warshipNicknameInput').style.display = 'inline-block';
  } else if (action === 'convertAchievementToExp') {
      document.getElementById('achievementConvertAmount').style.display = 'inline-block';
  } else if (action === 'remodelWarshipWeapon') {
      document.getElementById('weaponRemodelType').style.display = 'inline-block';
  } else if (action === 'dig') {
    document.getElementById('oilDrillFactor').style.display = 'inline-block';
  }
  applyAutomaticInputValues(action);
  applySessionSettings();
  renderMap();
}
function renderMap() {
  const table = document.getElementById('map');
  table.innerHTML = '';
  const selectedAction = document.getElementById('actionSelect') ? document.getElementById('actionSelect').value : '';
  let previewRange = -1;
  if (selectedAction === 'ppBombard') previewRange = 0;
  if (selectedAction === 'bombard') previewRange = 1;
  if (selectedAction === 'spreadBombard') previewRange = 2;
  for (let y = 0; y < SIZE; y++) {
    const row = document.createElement('tr');
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement('td');
      const tile = map[y][x];

      // 他の島を見ているときは砲台と防衛施設を森に偽装
      const displayFacility = (isViewingOtherIsland && (tile.facility === 'gun' || tile.facility === 'defenseFacility' || tile.facility === 'Monument')) ? 'forest' : tile.facility;
      const displayTerrain = (isViewingOtherIsland && (tile.facility === 'gun' || tile.facility === 'defenseFacility' || tile.facility === 'Monument')) ? 'forest' : tile.terrain;

      cell.className = displayTerrain; // 地形クラス
      if (displayFacility) cell.classList.add(displayFacility); // 施設クラス

      // 強化施設のクラスを追加
      if (tile.enhanced) {
          if (tile.facility === 'farm') cell.classList.add('enhancedFarm');
          if (tile.facility === 'factory') cell.classList.add('enhancedFactory');
          if (tile.facility === 'oilRig') cell.classList.add('enhancedOilRig');
      }
      // 軍艦の表示
      const warshipAtTile = warships.find(ship => ship.x === x && ship.y === y);
      if (warshipAtTile && !isViewingOtherIsland) { // 自分の島を見ているときのみ軍艦を表示
          if (warshipAtTile.currentDurability <= 0) { // 沈没している場合
              cell.classList.add('warship-wreckage');
              cell.textContent = 'x'; // 残骸アイコン
          } else {
              cell.classList.add('warship');
              if (warshipAtTile.isDispatched) {
                  cell.classList.add('warship-dispatched'); // 派遣中のスタイル
                  cell.textContent = '⛶'; // 派遣中アイコン
              } else {
                  cell.textContent = '🚢';
              }
          }
      } else {
          cell.textContent = displayFacility === 'farm' ? '🌾' :
                             displayFacility === 'house' ? '🏠' :
                             displayFacility === 'factory' ? '🏭' :
                             displayFacility === 'gun' ? '🔫' :
                             displayFacility === 'port' ? '⚓' :
                             displayFacility === 'Monument' ? '🗿' :
                             displayFacility === 'defenseFacility' ? '🛡️' :
                             displayFacility === 'oilRig' ? '🛢️' :'';
                             displayTerrain === 'mountain' ? '⛰️' : '';
      }

      // 強化施設のアイコンはそのまま
      if (tile.enhanced) {
          if (tile.facility === 'farm') cell.textContent = '🌾';
          if (tile.facility === 'factory') cell.textContent = '🏭';
          if (tile.facility === 'oilRig') cell.textContent = '🛢️';
      }

      if (previewRange >= 0 && selectedX !== null && selectedY !== null && Math.abs(x - selectedX) <= previewRange && Math.abs(y - selectedY) <= previewRange) {
        cell.classList.add('target-preview-red');
      }
      if (selectedX === x && selectedY === y) cell.classList.add('selected');
      cell.onmouseover = () => showTileInfo(x, y);
      cell.onclick = () => selectTile(x, y);
      row.appendChild(cell);
      // ★変更: monsters 配列をチェック
      const monsterAtTile = monsters.find(m => m.x === x && m.y === y);
      if (monsterAtTile) {
        cell.textContent = '👾';
      }
    }
    table.appendChild(row);
  }
}
function showTileInfo(x, y) {
  const tile = map[y][x];
  let info = ` (${x},${y}) 地形: ${tile.terrain}`;
  if (tile.facility) {
    let facilityNameMap = {
        farm: '農場',
        house: '住宅',
        factory: '工場',
        gun: '砲台',
        port: '港',
        defenseFacility: '防衛施設',
        Monument: '石碑',
        oilRig: '海底油田'
    };


    let facilityName = facilityNameMap[tile.facility] || tile.facility;

    if (tile.enhanced) { // 強化施設の表示名
        if (tile.facility === 'farm') facilityName = '強化農場';
        if (tile.facility === 'factory') facilityName = '強化工場';
        if (tile.facility === 'oilRig') facilityName = '高効率海底油田';
        if (tile.facility === 'gun') facilityName = '高効率砲台';
    }
    info += ` / 建物: ${facilityName}`;
    if (tile.facility === 'house' && !isViewingOtherIsland) info += ` (人口: ${tile.pop})`; // 他の島では人口表示なし
      if (tile.facility === 'Monument' && !isViewingOtherIsland) {
         info += ` (Lv: ${tile.MonumentLevel})`;
    }
  }

  const warshipAtTile = warships.find(ship => ship.x === x && ship.y === y);
  if (warshipAtTile && !isViewingOtherIsland) {
      ensureWarshipFields(warshipAtTile);
      // 経験値表示を修正
      const expDisplay = warshipAtTile.exp === "NaN" ? "NaN" : warshipAtTile.exp;
      const warshipCapClass = getWarshipCapClass(warshipAtTile);
const baseWarshipName = getWarshipDisplayName(warshipAtTile);
const warshipNameDisplay = warshipCapClass ? `<span class="${warshipCapClass}">${baseWarshipName}</span>` : baseWarshipName;
const warshipMedalsDisplay = getWarshipMedalIconsHtml(warshipAtTile);
info += ` / 軍艦: ${warshipNameDisplay} (母港: ${warshipAtTile.homePort}, EXP: ${expDisplay}, 耐久: ${warshipAtTile.currentDurability}/${warshipAtTile.maxDurability}, 弾薬: ${warshipAtTile.currentAmmo}/${warshipAtTile.maxAmmo}, 燃料: ${warshipAtTile.currentFuel}/${warshipAtTile.maxFuel}`;
      if (warshipMedalsDisplay) info += `, 勲章: ${warshipMedalsDisplay}`;
      if (warshipAtTile.isDispatched) {
          info += `, 派遣中`;
      }
      if (warshipAtTile.currentDurability <= 0) {
       info += `, 残骸`;
      }
      info += `)`;
  }
  const monsterAtTile = monsters.find(m => m.x === x && m.y === y);
  if (monsterAtTile) {
      const typeInfo = MONSTER_TYPES[monsterAtTile.typeId] || { name: '不明な怪獣' };
      info += ` / <span style="color: red;">${typeInfo.name} (体力: ${monsterAtTile.hp})</span>`;
  }
  document.getElementById('tileInfo').innerHTML = info;
}
function selectTile(x, y) {
  selectedX = x;
  selectedY = y;
  const actionSelect = document.getElementById('actionSelect');
  const warshipSubSelect = document.getElementById('warshipSubSelect');
  let action = actionSelect ? actionSelect.value : '';
  if (action === 'warshipTool' && warshipSubSelect) action = warshipSubSelect.value;
  applyAutomaticInputValues(action);
  renderMap();
}
window.clearTileSelection = function() {
  selectedX = null;
  selectedY = null;
  document.getElementById('tileInfo').textContent = '';
  renderMap();
}
window.clearFundingFailureTracking = function() {
    trackedFundingFailure = null;
    updateLogStatusLines();
}

// logAction関数を修正して、メッセージに基づいて色を適用
function logAction(msg, options = {}) {
  const log = document.getElementById('log');
  const statusLine2 = document.getElementById('logStatusLine2');
  const entry = document.createElement('div');
  entry.textContent = `[ターン${turn}] ${msg}`;
  if (options.subtle) {
    entry.classList.add('log-whisper');
  } else if (msg.includes('失敗') || msg.includes('台風') || msg.includes('隕石') || msg.includes('不足') || msg.includes('廃墟') || msg.includes('壊滅') || msg.includes('踏み荒らしました') || msg.includes('怪獣が出現') || msg.includes('自爆') || msg.includes('攻撃されました') || msg.includes('砲撃') || msg.includes('破壊されました') || msg.includes('撃沈')|| msg.includes('枯渇')|| msg.includes('経済危機')|| msg.includes('隆起')|| msg.includes('噴火')|| msg.includes('津波')|| msg.includes('地震')) {
    entry.classList.add('log-red');
  } else if (msg.includes('建設') || msg.includes('形成') || msg.includes('討伐') || msg.includes('初期化') || msg.includes('強化') || msg.includes('補給') || msg.includes('移動しました') || msg.includes('派遣') || msg.includes('帰還') || msg.includes('要請') || msg.includes('修理')) { // 修理を追加
    entry.classList.add('log-cyan');
  }
  if (statusLine2 && statusLine2.parentNode === log) {
    statusLine2.insertAdjacentElement('afterend', entry);
  } else {
    log.prepend(entry);
  }
  if (currentExecutingTask && isSessionSettingEnabled('settingEnablePlanTracking') && msg.includes('失敗') && msg.includes('資金不足')) {
    setFundingFailureTrackingFromTask(currentExecutingTask);
  }
  updateLogStatusLines();
  if (!options.skipWhisper) {
    maybeLogResidentWhisper(msg);
  }
}

// 観光者コードを生成する関数
function generateTouristCode() {
    const simplifiedMap = map.map(row => row.map(tile => {
        let touristTerrain = tile.terrain;
        let touristFacility = tile.facility;

            if (touristFacility === 'gun' || touristFacility === 'defenseFacility' || touristFacility === 'Monument') {
            touristTerrain = 'forest';
            touristFacility = null;
        }
        return { terrain: touristTerrain, facility: touristFacility };
    }));
    const touristData = {
        map: simplifiedMap,
        islandName: islandName,
        turn: turn
    };
    const jsonString = JSON.stringify(touristData);
    // 新しいエンコード方式 (btoaとencodeURIComponentを組み合わせる)
    return btoa(encodeURIComponent(jsonString));
}

// 軍艦データをコードに変換する関数
function encodeWarshipData(warship) {
    const data = {
        homePort: warship.homePort,
        name: warship.name,
        exp: warship.exp,
        currentFuel: warship.currentFuel,
        maxFuel: warship.maxFuel,
        maxDurability: warship.maxDurability,
        currentDurability: warship.currentDurability,
        mainGun: warship.mainGun,
        torpedo: warship.torpedo,
        antiAir: warship.antiAir,
        maxAmmo: warship.maxAmmo,
        currentAmmo: warship.currentAmmo,
        reconnaissance: warship.reconnaissance,
        accuracyImprovement: warship.accuracyImprovement,
        isDispatched: warship.isDispatched,
        originalCost: warship.originalCost || 0, // 追加
        abnormality: warship.abnormality || 0,
        nickname: warship.nickname || '',
        medalsEarned: warship.medalsEarned || {}
    };
    const jsonString = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonString));
}

// コードから軍艦データをデコードする関数
function decodeWarshipData(encodedData) {
    const jsonString = decodeURIComponent(atob(encodedData));
    const data = JSON.parse(jsonString);
    // 互換性維持のための初期化
    if (data.isDispatched === undefined) data.isDispatched = false;
    if (data.maxFuel === undefined) data.maxFuel = 100;
    if (data.originalCost === undefined) data.originalCost = 0; // 追加
    if (data.nickname === undefined) data.nickname = '';
    if (data.medalsEarned === undefined) data.medalsEarned = {};
    return data;
}


// 自分の島の状態を保存
function saveGame() {
    const gameState = {
        map: JSON.parse(JSON.stringify(map)),
        money: money,
        food: food,
        population: population,
        turn: turn,
        achievementPoints: achievementPoints,
        tutorialMissions: tutorialMissions,
        islandName: islandName,
        monster: null,
        monsters: JSON.parse(JSON.stringify(monsters)), // 新しい配列を保存
        actionQueue: JSON.parse(JSON.stringify(actionQueue)),
        warships: JSON.parse(JSON.stringify(warships)) // 軍艦データを保存
    };
    const jsonString = JSON.stringify(gameState);
    // 新しいエンコード方式 (btoaとencodeURIComponentを組み合わせる)
    document.getElementById('saveLoadData').value = btoa(encodeURIComponent(jsonString));
    logAction("ゲームがセーブされました。データをテキストエリアからコピーしてください。");
}

function loadGame() {
    const encodedData = document.getElementById('saveLoadData').value;
    if (!encodedData) {
        logAction("ロードするセーブデータがありません。");
        return;
    }
    try {
        // 新しいデコード方式
        const jsonString = decodeURIComponent(atob(encodedData));
        const gameState = JSON.parse(jsonString);

        map = gameState.map;
        money = gameState.money;
        food = gameState.food;
        population = gameState.population;
        turn = gameState.turn;
        achievementPoints = gameState.achievementPoints || 0;
        tutorialMissions = gameState.tutorialMissions || { 
            '01': false, '02': false, '03': false, '04': false, '05': false, '06': false, '07': false, '08': false
        };
        islandName = gameState.islandName || "MyIsland";
        
        // ★変更: 旧 monster データ処理
        monsters = gameState.monsters || []; // 新しい形式を優先
        if (gameState.monster && !gameState.monsters) { // 旧形式(monster)があり、新形式(monsters)がない
            const oldMonster = gameState.monster;
            // mapデータ(gameState.map)を使って地形チェック
            if (gameState.map[oldMonster.y] && gameState.map[oldMonster.y][oldMonster.x] && gameState.map[oldMonster.y][oldMonster.x].terrain !== 'sea') { // 海にいない場合
                monsters.push({
                    x: oldMonster.x,
                    y: oldMonster.y,
                    typeId: 1, // シマオロシ
                    hp: 1
                });
                logAction("旧バージョンの怪獣を「怪獣シマオロシ」として引き継ぎました。");
            } else {
                logAction("旧バージョンの怪獣は海にいたため、消滅しました。");
            }
        }
        monster = null; // 旧 monster 変数は使わない

        actionQueue = gameState.actionQueue || []; // ロード時にactionQueueがない場合に対応
        warships = gameState.warships || []; // 軍艦データをロード

        // 過去のセーブデータにenhancedプロパティがない場合のために初期化
        map.forEach(row => row.forEach(tile => {
            if (tile.enhanced === undefined) {
                tile.enhanced = false;
            }
            if (tile.MonumentLevel === undefined) {
                tile.MonumentLevel = 0;
            }
        }));
        // isDispatchedプロパティがない場合の初期化
        warships.forEach(ship => {
            if (ship.isDispatched === undefined) {
                ship.isDispatched = false;
            }
            if (ship.maxFuel === undefined) { // 旧データ対応
                ship.maxFuel = 100;
            }
                if (ship.isKenzouWarship === undefined) {
                    ship.isKenzouWarship = false;
                }
            if (ship.originalCost === undefined) { // 新規データ対応
                ship.originalCost = 0;
            }
            if (ship.abnormality === undefined) { 
                ship.abnormality = null; 
            }
            ensureWarshipFields(ship);
        });

        document.getElementById('islandNameInput').value = islandName; // UIにロードした名前を反映
        isViewingOtherIsland = false; // ロード時は自分の島にいる
        resetWarshipProgressStore(); // 手動ロード時は進捗をリセット（勲章獲得済みのみ維持）
        saveMyIslandState(); // ロードした状態を自分の島の状態として保存
        logAction("ゲームがロードされました。");
        renderMap();
        updateStatus();
        document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
        updateConfirmButton(); // UIを更新
        renderActionQueue();
    } catch (e) {
        logAction("セーブデータの読み込みに失敗しました。データが破損しているか、形式が不正です。");
        console.error(e);
    }
}


// 自分の島の状態を保存
function saveMyIslandState() {
    myIslandState = {
        map: JSON.parse(JSON.stringify(map)), // ディープコピー
        money: money,
        food: food,
        population: population,
        turn: turn,
        achievementPoints: achievementPoints,
        tutorialMissions: tutorialMissions,
        islandName: islandName,
        monster: null,
        monsters: JSON.parse(JSON.stringify(monsters)),
        actionQueue: JSON.parse(JSON.stringify(actionQueue)),
        warships: JSON.parse(JSON.stringify(warships)),
        economicCrisisTurns: economicCrisisTurns,
        frozenMoney: frozenMoney,
        volcanoTurns: volcanoTurns
    };
    localStorage.setItem('myIslandState', JSON.stringify(myIslandState));
}

// 自分の島の状態をロード
function loadMyIslandState() {
    const storedState = localStorage.getItem('myIslandState');
    if (storedState) {
        myIslandState = JSON.parse(storedState);
    } else {
      // エラーが発生した場合のアラート表示
            const res = confirm("データを読み込めませんでした。一度初期化すると直る可能性があります。\n\n「OK」を押すとデータを破棄して初期化します。\n「キャンセル」を押すと戻ります（後で計画一覧から初期化できます）。");
            if (res) {
                // データを破棄して初期化
                localStorage.removeItem('myIslandState');
                resetGame(); // 初期化関数を呼び出す
                logAction("データを破棄し、島を初期化しました。");
            } else {
                // 何もしない（空の状態で開始、あるいは手動初期化を待つ）
                initMap(); 
                renderMap();
                updateStatus();
            }
    }

    map = JSON.parse(JSON.stringify(myIslandState.map));
    money = myIslandState.money;
    food = myIslandState.food;
    population = myIslandState.population;
    turn = myIslandState.turn;
    achievementPoints= myIslandState.achievementPoints;
    tutorialMissions= myIslandState.tutorialMissions;
    islandName = myIslandState.islandName;
    monsters = myIslandState.monsters ? JSON.parse(JSON.stringify(myIslandState.monsters)) : []; // 新
    if (myIslandState.monster && monsters.length === 0) { // 旧形式があり、新形式(monsters)がない
        const oldMonster = myIslandState.monster;
        if (map[oldMonster.y] && map[oldMonster.y][oldMonster.x]) { // 座標存在チェック
            const tile = map[oldMonster.y][oldMonster.x];
            if (tile.terrain !== 'sea') { // 海にいない場合
                monsters.push({
                    x: oldMonster.x,
                    y: oldMonster.y,
                    typeId: 1, // シマオロシ
                    hp: 1
                });
                logAction("旧バージョンの怪獣を「怪獣シマオロシ」として引き継ぎました。");
            } else {
                logAction("旧バージョンの怪獣は海にいたため、消滅しました。");
            }
        }
    }
    monster = null; // 旧変数はクリア
    actionQueue = JSON.parse(JSON.stringify(myIslandState.actionQueue));
    warships = myIslandState.warships ? JSON.parse(JSON.stringify(myIslandState.warships)) : []; // 軍艦データをロード
    economicCrisisTurns = myIslandState.economicCrisisTurns || 0;
    frozenMoney = myIslandState.frozenMoney || 0;
    volcanoTurns = myIslandState.volcanoTurns || 0;
    // isDispatchedプロパティがない場合の初期化
    warships.forEach(ship => {
        if (ship.isDispatched === undefined) {
            ship.isDispatched = false;
        }
        if (ship.maxFuel === undefined) { // 旧データ対応
            ship.maxFuel = 100;
        }
        if (ship.originalCost === undefined) { // 新規データ対応
            ship.originalCost = 0;
        }
        ensureWarshipFields(ship);
    });

    // 過去のセーブデータにenhancedプロパティがない場合のために初期化
    map.forEach(row => row.forEach(tile => {
        if (tile.enhanced === undefined) {
            tile.enhanced = false;
        }
        if (tile.MonumentLevel === undefined) {
            tile.MonumentLevel = 0;
        }
    }));


    isViewingOtherIsland = false;
    updateStatus();
    renderMap();
    logAction("自島に戻りました。");
    document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
    updateConfirmButton(); // UIを更新
    renderActionQueue();
}


// ゲームを初期設定に戻す関数
function resetGame() {
    money = 2500;
    food = 1000;
    population = 0;
    turn = 0;
    islandName = "MyIsland";
    monster = null;
    monsters = [];
    actionQueue = [];
    warships = []; // 軍艦データをリセット
    resetWarshipProgressStore();
    economicCrisisTurns = 0;
    frozenMoney = 0;
    volcanoTurns = 0;
    selectedX = null;
    selectedY = null;

    document.getElementById('islandNameInput').value = islandName;
    document.getElementById('otherIslandActionInput').value = '';
    document.getElementById('actionForOtherIslandOutput').value = '';
    document.getElementById('touristCodeInput').value = '';

    initMap(); // マップを再初期化
    saveMyIslandState(); // 初期化された状態を保存
    updateStatus();
    renderMap();
    isViewingOtherIsland = false; // 初期化時は自分の島にいる
    document.getElementById('actionSelect').value = "";
    updateConfirmButton();
    renderActionQueue();
    logAction("島が初期化されました。");
}

// 特定の座標が防衛施設によって守られているかチェックする関数
// 修正：守られている場合、その防衛施設のタイルオブジェクトを返すようにする
function getProtectingDefenseFacility(targetX, targetY) {
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const tile = map[y][x];
            if (tile.facility === 'defenseFacility') {
                const dist = Math.max(Math.abs(x - targetX), Math.abs(y - targetY));
                if (dist <= 2) { // 防衛施設の周囲2マス
                    return tile; // 防衛施設のタイルオブジェクトを返す
                }
            }
        }
    }
    return null; // 保護されていない場合はnullを返す
}

function handleWarshipAttacks() {
    const currentMap = map;
    const currentIslandName = islandName;
    const activeAttackingWarships = warships.filter(ship =>
        ship.currentDurability > 0 &&
        ship.currentAmmo > 0 &&
        ship.homePort !== currentIslandName
    );

    activeAttackingWarships.forEach(warship => {
        let attacksPerformed = 0;
        const totalAttacks = warship.mainGun + warship.torpedo;
        logAction(`${warship.name} (${warship.homePort}籍) が自動攻撃を開始します。`);
        let attackRadius = 1; // 3x3 range (radius 1 from center means 1 tile in each direction, so 3x3 total)
        if (warship.reconnaissance === 1) attackRadius = 2; // 5x5 range
        if (warship.reconnaissance === 2) attackRadius = 3; // 7x7 range


        for (let i = 0; i < totalAttacks; i++) {
            if (warship.abnormality === 'fire') {
                logAction(`軍艦 ${warship.name} は火災が発生しているため、攻撃できません。`);
                break;
            }
            if (warship.currentAmmo <= 0) {
                logAction(`${warship.name} は弾薬がなくなりました。`);
                break;
            }
            let targetX, targetY;
            let validTargetFound = false;
            let attempts = 0;
            const maxAttempts = 100; // Prevent infinite loops

            while (!validTargetFound && attempts < maxAttempts) {
                targetX = warship.x + Math.floor(Math.random() * (2 * attackRadius + 1)) - attackRadius;
                targetY = warship.y + Math.floor(Math.random() * (2 * attackRadius + 1)) - attackRadius;

                // Check bounds and ensure it's not the warship's own location
                if (targetX >= 0 && targetX < SIZE && targetY >= 0 && targetY < SIZE &&
                    !(targetX === warship.x && targetY === warship.y)) {

                    const targetTile = currentMap[targetY][targetX];

                    // Exclude waste and sea unless it has a facility/monster/other warship
                    const isSeaOrWasteWithoutFacility =
                        (targetTile.terrain === 'sea' || targetTile.terrain === 'waste') &&
                        !targetTile.facility &&
                        !(monster && monster.x === targetX && monster.y === targetY) &&
                        !(warships.find(ship => ship.x === targetX && ship.y === targetY && ship !== warship)); // Check for other warships
                    const targetWarship = warships.find(ship => ship.x === targetX && ship.y === targetY && ship !== warship);
                    const isTargetSameHomeportWarship = targetWarship && (targetWarship.homePort === warship.homePort);
                    const isWreckage = targetWarship && targetWarship.currentDurability <= 0;
                    if (!isSeaOrWasteWithoutFacility && !isTargetSameHomeportWarship && !isWreckage && targetTile.terrain !== 'mountain') {
                        validTargetFound = true;
                    }
                }
                attempts++;
            }

            if (!validTargetFound) {
                continue; // Skip this attack
            }

            const targetTile = currentMap[targetY][targetX];
            let hitChance = 0.10; // Base 10%
            if (warship.accuracyImprovement === 1) {
                hitChance = 0.15;
            } else if (warship.accuracyImprovement === 2) {
                hitChance = 0.22;
            }
            let protectingDefenseFacility = null;
            if (warship.accuracyImprovement !== 1) {
                protectingDefenseFacility = getProtectingDefenseFacility(targetX, targetY);
                if (protectingDefenseFacility) {
                    hitChance *= 0.5; // Halve hit chance if protected by a defense facility
                    logAction(`防衛施設の干渉により、${warship.name} の攻撃精度が低下しました。`);
                }
            }


            if (Math.random() < hitChance) {
                logAction(`${warship.name} の攻撃が (${targetX},${targetY}) に命中！`);
                registerWarshipHit(warship);
                warship.currentAmmo--;
                attacksPerformed++;

                let expGained = 0;
                let targetType = "不明な施設";
                const monsterHit = monsters.find(m => m.x === targetX && m.y === targetY);
                if (monsterHit) {
                    expGained += 1; // 経験値
                    targetType = MONSTER_TYPES[monsterHit.typeId].name;
                    monsterHit.hp -= 1; // ダメージ
                    
                    if (monsterHit.hp <= 0) {
                        handleMonsterDefeat(monsterHit, `${warship.name} は ${targetType} を討伐し、${expGained} EXPを獲得しました！`);
                    } else {
                        logAction(`${warship.name} は ${targetType} に命中！ (残り体力: ${monsterHit.hp})`);
                    }
                } else {
                    const otherWarshipAtTarget = warships.find(ship => ship.x === targetX && ship.y === targetY && ship !== warship && ship.homePort !== warship.homePort);
                    if (otherWarshipAtTarget) {
                        expGained += 1;
                        targetType = "敵軍艦";
                        if (otherWarshipAtTarget.currentDurability <= 10) {
                        logAction(`${otherWarshipAtTarget.name}は${warship.name}の砲撃が命中し、黒煙を噴き出しました。 残り耐久: ${otherWarshipAtTarget.currentDurability}`);
                        }else if (otherWarshipAtTarget.currentDurability <= 25) {
                        logAction(`${otherWarshipAtTarget.name}は${warship.name}の砲撃を受けましたが、装甲により損傷は僅かでした。 残り耐久: ${otherWarshipAtTarget.currentDurability}`);
                        }else if (otherWarshipAtTarget.currentDurability <= 80) {
                        logAction(`${otherWarshipAtTarget.name}は${warship.name}の砲撃を受けましたが、ほぼ無傷でした。 残り耐久: ${otherWarshipAtTarget.currentDurability}`);
                        }else{
                        logAction(`${otherWarshipAtTarget.name}は${warship.name}の砲撃を受けましたが、完全に動じないようです。 残り耐久: ${otherWarshipAtTarget.currentDurability}`);
                        }
                        checkAbnormalityOnHit(otherWarshipAtTarget);
                        otherWarshipAtTarget.currentDurability -= 1; // Reduce durability
                        registerWarshipDamageTaken(otherWarshipAtTarget, 1);
                        if (otherWarshipAtTarget.currentDurability <= 0) {
                            otherWarshipAtTarget.fuel = 0; // 残り燃料を0に
                            otherWarshipAtTarget.currentFuel = 0; // 現在燃料も0に
                            otherWarshipAtTarget.ammo = 0; // 残り弾薬を0に
                            otherWarshipAtTarget.currentAmmo = 0; // 現在弾薬も0に
                            registerWarshipSink(warship);
                            logAction(`敵軍艦「${otherWarshipAtTarget.name}」を撃沈しました！`);
                            // For simplicity, a destroyed warship remains as wreckage on the map. renderMap will show 'x'.
                        }
                    } else if (targetTile.facility === 'house') { // House hit
    expGained += Math.floor(targetTile.pop / 2500);
    targetType = "住宅";
    logAction(`${warship.name} は住宅 (${targetTile.pop}人) を攻撃し、${expGained} EXPを獲得しました！`);
    population -= targetTile.pop;
    if (population < 0) population = 0;
    targetTile.pop = 0; // Destroy population
    targetTile.facility = null; // Remove facility
    targetTile.terrain = 'waste'; // Turn into waste
    targetTile.enhanced = false; // Remove enhancement
    } else if(targetTile.Monument) {
                targetType = '石碑';
                if (targetTile.MonumentLevel >= 2) {
                    targetTile.MonumentLevel -= 1; // レベルを1下げる
                    logAction(`${warship.name} の攻撃により、石碑のレベルが1低下しました (Lv${targetTile.MonumentLevel})。`);
                } else { // レベル1の場合
                    logAction(`${warship.name} は石碑（Lv1）を破壊しました。`);
                    targetTile.facility = null;
                    targetTile.terrain = 'waste'; // 荒れ地になる
                    targetTile.MonumentLevel = 0; // レベルをリセット
                }
    } else if(targetTile.facility) {
                        // Hit another facility (gun, factory, farm, port, defenseFacility)
                        targetType = targetTile.facility;
                        targetTile.facility = null;
                        targetTile.terrain = 'waste'; // Turn into waste
                        targetTile.enhanced = false; // Remove enhancement
                    }else {
                        // Hit a terrain without facility (plain, forest)
                        targetType = targetTile.terrain;
                        targetTile.terrain = 'waste';
                    }
                }
if (warship.exp === "NaN") {
    return;
}
                warship.exp += expGained;
            } else {
                registerWarshipMiss(warship);
                warship.currentAmmo--; // Still consume ammo on miss
                attacksPerformed++;
            }
        }
        if (attacksPerformed > 0) {
            logAction(`${warship.name} は合計 ${attacksPerformed} 回の攻撃を行いました。`);
        }
    });
}

// confirmAction関数をグローバルスコープで定義
window.confirmAction = function () {
    const actionSelect = document.getElementById('actionSelect');
    const warshipSubSelect = document.getElementById('warshipSubSelect');
    let action = document.getElementById('actionSelect').value;
    if (action === 'warshipTool') {
        action = warshipSubSelect.value;
    }
    if (action === "") {
        if (actionSelect.value === 'warshipTool') {
            logAction(`軍艦ツールからオプションを選択してください`);
        }
        return;
    }
  const targetTileSelected = (selectedX !== null && selectedY !== null);
  const MAX_QUEUE_SIZE = 20;
    if (actionQueue.length >= MAX_QUEUE_SIZE) {
        logAction(`計画キューが満杯です（最大${MAX_QUEUE_SIZE}個）。`);
        return; // キューが満杯なら処理を中断
    }
const keepOptionSelected = document.getElementById('keepOptionSelected').checked;
  if (isViewingOtherIsland) {
      if (action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard' || action === 'randomBombard') {
          if (action !== 'randomBombard' && !targetTileSelected) {
              logAction(`砲撃対象のタイルを選択してください`);
              return;
          }
          const count = parseInt(document.getElementById('bombardCount').value);
          if (isNaN(count) || count <= 0) {
              logAction(`砲撃の数が正しく指定されていません`);
              return;
          }
          const guns = getGunCount(); // 自島の砲台数を取得
              if (guns === 0) {
                logAction(`砲撃に失敗しました（砲台がありません）`);
                return;
              }
              if (count > guns) {
                logAction(`砲撃に失敗しました（砲撃数が保有砲台数 (${guns}) を超えています）`);
                return;
              }
          // 行動内容を圧縮・暗号化して他島への行動テキストボックスに出力
          const actionData = {
              type: action,
              count: count
          };
          if (action !== 'randomBombard') {
              actionData.x = selectedX;
              actionData.y = selectedY;
          }
          // 新しいエンコード方式 (btoaとencodeURIComponentを組み合わせる)
          const encodedAction = btoa(encodeURIComponent(JSON.stringify(actionData)));
          document.getElementById('actionForOtherIslandOutput').value = encodedAction;
          logAction(`他島への行動が「他島への行動」欄に出力されました。`);
          document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
          updateConfirmButton();
          updateConfirmButton(); // UIを更新
          return;
      } else if (action === 'returnToMyIsland') {
          loadMyIslandState(); // 自分の島に戻る
          document.getElementById('actionForOtherIslandOutput').value = generateTouristCode(); // 自分の観光者コードを出力
          return;
      } else {
          logAction(`他の島では砲撃系コマンドか「自島に戻る」のみ実行可能です。`);
          document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
          updateConfirmButton(); // UIを更新
          return;
      }
  }

  if (!action) return;
  applyAutomaticInputValues(action);
  const requiresTileSelection = ['buildFarm', 'buildFactory', 'buildPort', 'buildGun', 'buildDefenseFacility', 'buildWarship', 'refuelWarship', 'resupplyWarshipAmmo', 'repairWarship', 'setWarshipNickname', 'convertAchievementToExp', 'remodelWarshipWeapon', 'dispatchWarship', 'requestWarshipReturn', 'flatten', 'landfill', 'dig', 'cutForest', 'plantForest', 'enhanceFacility', 'selfDestructMilitaryFacility', 'bombard', 'spreadBombard', 'ppBombard', 'concentratedFire'];
  if (requiresTileSelection.includes(action) && !targetTileSelected) {
    logAction(`アクションの対象タイルを選択してください`);
    return;
  }

  let tile = null;
  if (targetTileSelected) {
      tile = map[selectedY][selectedX];
  }


  if (action === 'exportFood') {
    const amount = parseInt(document.getElementById('exportAmount').value);
    if (!isNaN(amount) && amount > 0) {
      actionQueue.push({ action, amount, x: null, y: null });
      logAction(`食料を ${amount * 20} 輸出する計画を立てました`);
    } else {
      logAction(`食料輸出に失敗しました（輸出数が未指定または無効）`);
    }
  } else if (action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard' || action === 'randomBombard') {
    const count = parseInt(document.getElementById('bombardCount').value);
    if (isNaN(count) || count <= 0) {
      logAction(`砲撃の数が正しく指定されていません`);
      return;
    }
    const guns = getGunCount();
    if (guns === 0) {
      logAction(`砲撃に失敗しました（砲台がありません）`);
      return;
    }
    let cost = 0;
    if (action === 'bombard') cost = count * 120;
    else if (action === 'spreadBombard') cost = count * 500;
    else if (action === 'ppBombard') cost = count * 10000000; // PP弾の価格を更新
    else if (action === 'randomBombard') cost = count * 500000;

    if (money < cost) {
      logAction(`砲撃に失敗しました（資金不足）`);
      return;
    }
    if (count > guns) { // 保有している砲台の数までしか砲撃できない
      logAction(`砲撃に失敗しました（保有砲台数を超えています）`);
      return;
    }
    actionQueue.push({ x: action === 'randomBombard' ? null : selectedX, y: action === 'randomBombard' ? null : selectedY, action, count });
    if (action === 'randomBombard') {
      logAction(`${count}発のランダム弾砲撃を計画しました`);
    } else {
      logAction(`(${selectedX},${selectedY}) に ${count}発の${getBombardTypeLabel(action)}を計画しました`);
    }
  } else if (action === 'concentratedFire') {
    const latestAction = actionQueue[actionQueue.length - 1];
    if (latestAction && latestAction.action === 'concentratedFire') {
      if (actionQueue.length + 2 > MAX_QUEUE_SIZE) {
        logAction(`計画キューに空きが足りないため、集中砲撃を追加できません。`);
        return;
      }
      actionQueue.push({ x: null, y: null, action: 'delayAction', autoInserted: true });
      logAction(`集中砲撃の連続を防ぐため、遅延行動を自動挿入しました。`);
    }
    actionQueue.push({ x: selectedX, y: selectedY, action: 'concentratedFire' });
    logAction(`(${selectedX},${selectedY}) に集中砲撃を計画しました`);
  } else if (action === 'selfDestructMilitaryFacility') { // 名称変更
    if (tile && (tile.facility === 'gun' || tile.facility === 'defenseFacility')) {
      actionQueue.push({ x: selectedX, y: selectedY, action });
      logAction(`(${selectedX},${selectedY}) の軍事施設自爆を計画しました`);
    } else {
      logAction(`(${selectedX},${selectedY}) に軍事施設がありません`);
    }
  } else if (action === 'goToOtherIsland') {
      const touristCode = document.getElementById('touristCodeInput').value;
      if (touristCode) {
          try {
              const jsonString = decodeURIComponent(atob(touristCode));
              const otherIslandData = JSON.parse(jsonString);

              saveMyIslandState(); // 自分の島の状態を保存
              map = otherIslandData.map;
              islandName = otherIslandData.islandName;
              turn = otherIslandData.turn; // 他の島のターン数に一時的に合わせる
              money = 0; food = 0; population = 0; // 他の島の情報は限定表示
              monster = null;
              isViewingOtherIsland = true;
              logAction(`「${islandName}」に移動しました。`);
              renderMap();
              updateStatus();
              document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
              updateConfirmButton(); // UIを更新
          } catch (e) {
              logAction(`観光者コードの読み込みに失敗しました。`);
              console.error(e);
          }
      } else {
          logAction(`観光者コードを入力してください。`);
      }
  } else if (action === 'returnToMyIsland') {
      loadMyIslandState(); // 自分の島に戻る
      document.getElementById('actionForOtherIslandOutput').value = generateTouristCode(); // 自分の観光者コードを出力
  } else if (action === 'initializeIsland') { // 新しいコマンドの処理
if (confirm('本当にこの操作を行いますか？')) {
      resetGame();
} else {
logAction(`島の初期化はキャンセルされました。`);
}
  }else if (action === 'buildWarship') { // 軍艦建造
      if (!targetTileSelected) {
          logAction("軍艦を建造する海域を選択してください。");
          return;
      }
      // 港に隣接する海域かチェック
      let adjacentToPort = false;
      for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
              const nx = selectedX + dx;
              const ny = selectedY + dy;
              if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && (dx !== 0 || dy !== 0)) {
                  if (map[ny][nx].facility === 'port') {
                      adjacentToPort = true;
                      break;
                  }
              }
          }
          if (adjacentToPort) break;
      }
      if (!adjacentToPort) {
          logAction("軍艦は港に隣接する海域にのみ建造可能です。");
          return;
      }
      if (tile.terrain !== 'sea' || tile.facility !== null) {
          logAction(`(${selectedX},${selectedY}) は軍艦を建造できる海域ではありません。`);
          return;
      }
      // Check if a warship already exists at the selected tile
      const existingWarship = warships.find(ship => ship.x === selectedX && ship.y === selectedY);
      if (existingWarship) {
          logAction(`(${selectedX},${selectedY}) には既に軍艦「${existingWarship.name}」が存在します。`);
          return;
      }
      const name = document.getElementById('warshipName').value.trim();
      const durability = parseInt(document.getElementById('warshipDurability').value);
      const mainGun = parseInt(document.getElementById('warshipMainGun').value);
      const torpedo = parseInt(document.getElementById('warshipTorpedo').value);
      const antiAir = parseInt(document.getElementById('warshipAntiAir').value);
      const ammo = parseInt(document.getElementById('warshipAmmo').value);
      const recon = parseInt(document.getElementById('warshipRecon').value);
      const accuracy = parseInt(document.getElementById('warshipAccuracy').value);

      if (!name || name.length > 15) {
          logAction("艦名は1文字以上15文字以下で入力してください。");
          return;
      }
      if (isNaN(durability) || durability < 2 || durability > 15) {
          logAction("耐久度は2～15の範囲で指定してください。");
          return;
      }
      if (isNaN(mainGun) || mainGun < 1 || mainGun > 5) {
          logAction("主砲は1～5の範囲で指定してください。");
          return;
      }
      if (isNaN(torpedo) || torpedo < 0 || torpedo > 3) {
          logAction("魚雷は0～3の範囲で指定してください。");
          return;
      }
      if (isNaN(antiAir) || antiAir < 1 || antiAir > 6) {
          logAction("対空砲は1～6の範囲で指定してください。");
          return;
      }
      if (isNaN(ammo) || ammo < 10 || ammo > 500) {
          logAction("弾薬庫は10～500の範囲で指定してください。");
          return;
      }
      if (isNaN(recon) || recon < 0 || recon > 2) {
          logAction("偵察機は0～2の範囲で指定してください。");
          return;
      }
      if (isNaN(accuracy) || accuracy < 0 || accuracy > 2) {
          logAction("射撃精度向上は0～2の範囲で指定してください。");
          return;
      }

        const cost = (durability * 10000000) + (mainGun * 12000000) + (torpedo * 10000000) + (antiAir * 5000000) + (ammo * 100000) + (recon * 12500000) + (accuracy * 50000000);
        if (money < cost) {
            const needed = cost - money; // 不足金額を計算
            logAction(`軍艦建造に失敗しました（資金不足: ${needed}G が不足しています）`); // メッセージを修正
            return;
        }
      actionQueue.push({ x: selectedX, y: selectedY, action, warshipData: { name, durability, mainGun, torpedo, antiAir, ammo, recon, accuracy, originalCost: cost } }); // originalCostを追加
      logAction(`(${selectedX},${selectedY}) に軍艦「${name}」の建造を計画しました (費用: ${cost}G)`);
  } else if (action === 'refuelWarship') { // 燃料補給
      const warship = warships.find(ship => ship.x === selectedX && ship.y === selectedY);
      if (!warship) {
          logAction(`(${selectedX},${selectedY}) に軍艦が存在しません。`);
          return;
      }
      if (warship.isDispatched) {
          logAction(`派遣中の軍艦には燃料補給できません。`);
          return;
      }
      const amount = parseInt(document.getElementById('refuelAmount').value);
      if (isNaN(amount) || amount <= 0) {
          logAction(`補給数が正しく指定されていません。`);
          return;
      }
      const cost = amount * 500; // 食料500
      if (food < cost) {
          logAction(`燃料補給に失敗しました（食料不足: ${cost} 必要）`);
          return;
      }
      actionQueue.push({ x: selectedX, y: selectedY, action, amount });
      logAction(`(${selectedX},${selectedY}) の軍艦に燃料 ${amount} を補給する計画を立てました (食料 ${cost} 消費)`);
  } else if (action === 'resupplyWarshipAmmo') { // 弾薬補給
      const warship = warships.find(ship => ship.x === selectedX && ship.y === selectedY);
      if (!warship) {
          logAction(`(${selectedX},${selectedY}) に軍艦が存在しません。`);
          return;
      }
      if (warship.isDispatched) {
          logAction(`派遣中の軍艦には弾薬補給できません。`);
          return;
      }
      const amount = parseInt(document.getElementById('resupplyAmmoAmount').value);
      if (isNaN(amount) || amount <= 0) {
          logAction(`補給数が正しく指定されていません。`);
          return;
      }
      const cost = amount * 20000; // 20000G
      if (money < cost) {
          logAction(`弾薬補給に失敗しました（資金不足: ${cost}G 必要）`);
          return;
      }
      actionQueue.push({ x: selectedX, y: selectedY, action, amount });
      logAction(`(${selectedX},${selectedY}) の軍艦に弾薬を ${amount} 補給する計画を立てました (資金 ${cost}G 消費)`);
}else if (action === 'repairWarship') {
    if (!targetTileSelected) {
        logAction(`修理対象の軍艦が配置されているタイルを選択してください。`);
        return;
    }
    const ship = warships.find(s => s.x === selectedX && s.y === selectedY);
    if (!ship) {
        logAction(`選択したタイルに軍艦がいません。`);
        return;
    }
    // 撃沈されている軍艦は修理できないようにする
    if (ship.currentDurability <= 0) {
        logAction(`${ship.name} は撃沈されており、修理できません。`);
        return;
    }
    if (ship.isDispatched) {
        logAction(`${ship.name} は派遣中なので修理できません。`);
        return;
    }
    const repairAmount = parseInt(document.getElementById('repairAmount').value);
    if (isNaN(repairAmount) || repairAmount <= 0) {
        logAction(`回復耐久値が正しく指定されていません。`);
        return;
    }

    const costPerDurability = 500000; // 耐久度1回復あたりの費用
    // 回復可能な耐久値を計算
    const missingDurability = ship.maxDurability - ship.currentDurability;
    if (missingDurability <= 0) {
        logAction(`${ship.name} の耐久度はすでに最大です。`);
        return;
    }
    const actualRepairAmount = Math.min(repairAmount, missingDurability);
    const actualCost = actualRepairAmount * costPerDurability;
    if (money < actualCost) {
        logAction(`資金が不足しています。修理には ${actualCost}G 必要です。`);
        return;
    }
            if (ship.abnormality === 'ammoFire') {
                // 弾薬庫の発火: 10以上修理で治る
                if (repairAmount >= 10) {
                    ship.abnormality = null;
                    logAction(`軍艦 ${ship.name} は耐久値を${repairAmount}修理し、弾薬庫の火災は鎮火されました！`);
                }
            } else if (ship.abnormality !== null) {
                // 火災、浸水、通信障害: 1以上修理で治る
                ship.abnormality = null;
                logAction(`軍艦 ${ship.name} は耐久値を${repairAmount}修理し、異常状態(${oldAbnormality})が復旧しました！`);
            }
    money -= actualCost;
    ship.currentDurability += actualRepairAmount;
    logAction(`${ship.name} を ${actualRepairAmount} 耐久値分修理しました。費用: ${actualCost}G。現在の耐久度: ${ship.currentDurability}/${ship.maxDurability}`);
    renderMap();
    updateStatus();
    saveMyIslandState();
} else if (action === 'setWarshipNickname') {
    const ship = warships.find(s => s.x === selectedX && s.y === selectedY);
    if (!ship) {
        logAction(`選択したタイルに軍艦がいません。`);
        return;
    }
    if (ship.homePort !== islandName) {
        logAction(`母港が自島の軍艦のみ二つ名指定できます。`);
        return;
    }
    const nickname = document.getElementById('warshipNicknameInput').value.trim();
    if (!nickname || nickname.length > 10) {
        logAction(`二つ名は1〜10文字で入力してください。`);
        return;
    }
    if (money < 100000) {
        logAction(`二つ名指定に失敗しました（資金不足）。`);
        return;
    }
    actionQueue.push({ x: selectedX, y: selectedY, action, nickname });
    logAction(`軍艦 ${ship.name} の二つ名「${nickname}」を計画しました。`);
} else if (action === 'convertAchievementToExp') {
    const ship = warships.find(s => s.x === selectedX && s.y === selectedY);
    if (!ship) {
        logAction(`選択したタイルに軍艦がいません。`);
        return;
    }
    const amount = parseInt(document.getElementById('achievementConvertAmount').value);
    if (isNaN(amount) || amount <= 0) {
        logAction(`消費する実績Ptは1以上の整数を指定してください。`);
        return;
    }
    if (achievementPoints < amount) {
        logAction(`実績Pt変換に失敗しました（実績Pt不足）。`);
        return;
    }
    actionQueue.push({ x: selectedX, y: selectedY, action, amount });
    logAction(`軍艦 ${ship.name} に実績Pt ${amount} をEXPへ変換する計画を追加しました。`);
} else if (action === 'remodelWarshipWeapon') {
    const ship = warships.find(s => s.x === selectedX && s.y === selectedY);
    if (!ship) {
        logAction(`選択したタイルに軍艦がいません。`);
        return;
    }
    const weaponType = document.getElementById('weaponRemodelType').value;
    if (!['mainGun', 'torpedo'].includes(weaponType)) {
        logAction(`換装する武器種別が無効です。`);
        return;
    }
    const weaponLabel = weaponType === 'mainGun' ? '主砲' : '魚雷';
    const ok = confirm(`${ship.name} を${weaponLabel}換装しますか？\nEXP全消費 + 弾薬庫上限1000消費します。`);
    if (!ok) {
        logAction(`武器換装はキャンセルされました。`);
        return;
    }
    actionQueue.push({ x: selectedX, y: selectedY, action, weaponType });
    logAction(`軍艦 ${ship.name} の${weaponLabel}換装を計画しました。`);
}else if (action === 'dispatchWarship') { // 軍艦派遣
      const warship = warships.find(ship => ship.x === selectedX && ship.y === selectedY);
      if (!warship) {
          logAction(`(${selectedX},${selectedY}) に軍艦が存在しません。`);
          return;
      }
      if (warship.isDispatched) {
          logAction(`この軍艦はすでに派遣中です。`);
          return;
      }
      const touristCode = document.getElementById('touristCodeInput').value;
      if (!touristCode) {
          logAction(`派遣先の観光者コードを入力してください。`);
          return;
      }
      let targetIslandName;
      try {
          const jsonString = decodeURIComponent(atob(touristCode));
          const otherIslandData = JSON.parse(jsonString);
          targetIslandName = otherIslandData.islandName;
      } catch (e) {
          logAction(`無効な観光者コードです。`);
          return;
      }
      if (targetIslandName === islandName) {
          logAction(`母港と同じ島には軍艦を派遣できません。`);
          return;
      }
      const encodedWarshipData = encodeWarshipData(warship);
      const dispatchData = {
          type: "warshipDispatch",
          warshipData: encodedWarshipData,
          destinationIslandName: targetIslandName,
          sourceIslandName: islandName // 派遣元を記録
      };
      const encodedDispatchAction = btoa(encodeURIComponent(JSON.stringify(dispatchData)));
      document.getElementById('actionForOtherIslandOutput').value = encodedDispatchAction;
      warship.isDispatched = true; // 派遣状態にする
      warship.currentFuel = 0; // 派遣中は燃料0
      warship.currentAmmo = 0; // 派遣中は弾薬0
      logAction(`軍艦「${warship.name}」を「${targetIslandName}」へ派遣する計画を立てました。`);
      logAction(`他島への行動が「他島への行動」欄に出力されました。`);
  } else if (action === 'requestWarshipReturn') {
      const warship = warships.find(ship => ship.x === selectedX && ship.y === selectedY);
      if (!warship) {
          logAction(`(${selectedX},${selectedY}) に軍艦が存在しません。`);
          return;
      }
      if (!warship.isDispatched) {
          logAction(`この軍艦は派遣されていません。`);
          return;
      }
      if (warship.homePort !== islandName) {
          logAction(`この軍艦の母港は${warship.homePort}であり、この島ではありません。`);
          return;
      }
      const returnRequestData = {
          type: "warshipReturnRequest", // 新しいタイプ
          homePort: warship.homePort,
          name: warship.name // 要請する軍艦を特定する情報
      };
      const encodedReturnRequestAction = btoa(encodeURIComponent(JSON.stringify(returnRequestData)));
      document.getElementById('actionForOtherIslandOutput').value = encodedReturnRequestAction;

      logAction(`軍艦「${warship.name}」の帰還を要請しました。他島への行動が「他島への行動」欄に出力されました。`);
      // ここでは軍艦の状態は変更しない（相手島からの確認を待つ）
  } else if (action === 'enhanceWarship') {
    if (!targetTileSelected) {
        logAction(`増強対象の軍艦が配置されているタイルを選択してください。`);
        return;
    }
    const ship = warships.find(s => s.x === selectedX && s.y === selectedY);
    if (!ship) {
        logAction(`選択したタイルに軍艦がいません。`);
        return;
    }

    const expCost = 200;
    if (ship.exp < expCost) {
        logAction(`${ship.name} の経験値が不足しています。（${expCost}EXP 必要）`);
        return;
    }

    const enhancementResults = [];
    do {
        ship.exp -= expCost; // 経験値を消費

        let buffMessage = '';
        const rand = Math.random() * 100; // 0から99.99...の乱数

        // バフの確率と効果を定義
        if (rand < 35) { // 35%
            ship.maxFuel += 5;
            ship.currentFuel = Math.min(ship.currentFuel, ship.maxFuel); // 上限を超えないように調整
            buffMessage = `燃料上限+5`;
        } else if (rand < 70) { // 35% + 35% = 70%
            ship.maxAmmo += 10;
            ship.currentAmmo = Math.min(ship.currentAmmo, ship.maxAmmo); // 上限を超えないように調整
            buffMessage = `弾薬庫上限+10`;
        } else if (rand < 81) { // 70% + 11% = 81%
            ship.antiAir += 1;
            buffMessage = `対空砲+1`;
        } else if (rand < 91) { // 81% + 10% = 91%
            ship.maxFuel += 10;
            ship.currentFuel = Math.min(ship.currentFuel, ship.maxFuel); // 上限を超えないように調整
            buffMessage = `燃料上限+10`;
        } else if (rand < 95) { // 91% + 4% = 95%
            ship.maxDurability += 1;
            ship.currentDurability = Math.min(ship.currentDurability, ship.maxDurability); // 上限を超えないように調整
            buffMessage = `耐久上限+1`;
        } else if (rand < 99) { // 95% + 4% = 99%
            ship.mainGun += 1;
            buffMessage = `主砲+1`;
        } else if (rand < 99.5) { // 99% + 0.5% = 99.5%
            ship.maxAmmo += 100;
            ship.currentAmmo = Math.min(ship.currentAmmo, ship.maxAmmo); // 上限を超えないように調整
            buffMessage = `弾薬庫上限+100`;
        } else if (rand < 99.8) { // 99.5% + 0.3% = 99.8%
            ship.antiAir += 2;
            ship.maxDurability += 1;
            ship.currentDurability = Math.min(ship.currentDurability, ship.maxDurability);
            buffMessage = `対空+2＆耐久上限+1`;
        } else { // 99.8% + 0.2% = 100%
            ship.maxDurability += 3;
            ship.currentDurability = Math.min(ship.currentDurability, ship.maxDurability);
            ship.mainGun += 2;
            buffMessage = `耐久上限+3＆主砲+2`;
        }
        enhancementResults.push(buffMessage);
    } while (isSessionSettingEnabled('settingEnhanceWarshipToExpLimit') && ship.exp >= expCost);
    const resultSummary = enhancementResults.length === 1 ? enhancementResults[0] : `${enhancementResults.length}回実行（${enhancementResults.join('、')}）`;
    logAction(`${ship.name} を増強しました！ ${resultSummary}を獲得。現在の経験値: ${ship.exp}`);
    renderMap();
    updateStatus();
    saveMyIslandState();
} else if (action === 'decommissionWarship') {
    if (!targetTileSelected) {
        logAction(`除籍対象の軍艦が配置されているタイルを選択してください。`);
        return;
    }
    const shipIndex = warships.findIndex(s => s.x === selectedX && s.y === selectedY);
    const ship = warships[shipIndex];

    if (!ship) {
        logAction(`選択したタイルに軍艦がいません。`);
        return;
    }
      const warship = warships.find(ship => ship.x === selectedX && ship.y === selectedY);
    const confirmation = confirm(`${ship.name} を除籍しますが、よろしいですか？`);
      if (warship.homePort !== islandName) {
          logAction(`この軍艦の母港は${warship.homePort}であり、この島ではありません。`);
          return;
}if (confirmation) {
        warships.splice(shipIndex, 1);
        money += 1000000; // 1,000,000Gを獲得

        logAction(`${ship.name} を除籍し、1,000,000Gを獲得しました。`);
        renderMap();
        updateStatus();
        saveMyIslandState();
    } else {
        logAction(`軍艦 ${ship.name} の除籍をキャンセルしました。`);
    }
}else if (action === 'dig') {
    if (!targetTileSelected) { logAction(`掘削対象のタイルを選択してください`); return; }
    
    // 油田発掘率の入力値を取得 (空白または1～10)
    let factorInput = document.getElementById('oilDrillFactor').value;
    let factor = 0;
    
    if (factorInput !== "") {
        factor = parseInt(factorInput);
        if (isNaN(factor) || factor < 1 || factor > 10) {
            logAction(`油田発掘率に無効な値が入力されました (1～10 または空白)`);
            return;
        }
    }
    // factorが0（空白）の場合はデフォルトの動作（factor=1と同じ扱い）
    if (factor === 0) factor = 1;

    actionQueue.push({ action, x: selectedX, y: selectedY, oilFactor: factor }); // oilFactorとして保存
    logAction(`(${selectedX},${selectedY}) を掘削する計画を立てました (発掘率Lv:${factor})`);
}else {
actionQueue.push({ x: selectedX, y: selectedY, action, keepSelected: keepOptionSelected });
    logAction(`(${selectedX},${selectedY}) に ${action} を計画しました`);
  }
if (!keepOptionSelected) {
    document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
}
  renderActionQueue();
  updateConfirmButton();
}

// nextTurn関数をグローバルスコープで定義
window.nextTurn = function () {
turn++;
    initWarshipTurnStats();
    warships.forEach(warship => {
        if (warship.currentDurability <= 0) return;
        if (warship.abnormality === 'commFailure' && !warship.isDispatched) {
            warship.abnormality = null;
            logAction(`軍艦 ${warship.name} は帰港したため、通信障害が自動復旧しました。`);
            // 状態がリセットされたので、今ターンの異常状態効果はスキップ
            return; 
        }

        switch (warship.abnormality) {
            case 'fire':
                // 効果: 1ダメージ
                warship.currentDurability -= 1;
                registerWarshipDamageTaken(warship, 1);
                logAction(`軍艦 ${warship.name} は火災により1ダメージを受けました。残り耐久: ${warship.currentDurability}`);
                // 自動復旧: 25%の確率
                if (Math.random() < 0.25) {
                    warship.abnormality = null;
                    logAction(`軍艦 ${warship.name} の火災が自動復旧しました。`);
                }
                break;
            case 'flooding':
                // 効果: 1ダメージ
                warship.currentDurability -= 1;
                registerWarshipDamageTaken(warship, 1);
                logAction(`軍艦 ${warship.name} は浸水により1ダメージを受けました。残り耐久: ${warship.currentDurability}`);
                // 自動復旧: 8%の確率
                if (Math.random() < 0.08) {
                    warship.abnormality = null;
                    logAction(`軍艦 ${warship.name} の浸水が自動復旧しました。`);
                }
                break;
            case 'ammoFire':
                warship.currentDurability -= 3;
                registerWarshipDamageTaken(warship, 3);
                warship.currentAmmo = Math.max(0, warship.currentAmmo - 50);
                logAction(`軍艦 ${warship.name} は弾薬庫の発火により3ダメージを受け、弾薬を50消費しました。残り耐久: ${warship.currentDurability}、残り弾薬: ${warship.currentAmmo}`);
                if (warship.currentAmmo === 0) {
                     warship.abnormality = null;
                     logAction(`軍艦 ${warship.name} は弾薬が尽きたため、弾薬庫の発火が収まりました。`);
                }
                break;
            case 'commFailure':
                break;
        }
        if (warship.currentDurability <= 0 && warship.abnormality !== null) {
            warship.currentDurability = 0;
            warship.currentFuel = 0;
            warship.currentAmmo = 0;
            warship.abnormality = null;
            logAction(`軍艦 ${warship.name} は異常状態の進行により撃沈しました！`);
        }
    });
  const otherIslandActionCode = document.getElementById('otherIslandActionInput').value;
  document.getElementById('otherIslandActionInput').value = ''; // 処理したらクリア
  if (otherIslandActionCode) {
      if (otherIslandActionCode === "KING_MONSTER") {
          spawnKingMonsterFromCode();
      } else {
      try {
          const jsonString = decodeURIComponent(atob(otherIslandActionCode));
          const incomingAction = JSON.parse(jsonString);

          if ((incomingAction.type === 'bombard' || incomingAction.type === 'spreadBombard' || incomingAction.type === 'ppBombard' || incomingAction.type === 'randomBombard') &&
              incomingAction.count !== undefined &&
              (incomingAction.type === 'randomBombard' || (incomingAction.x !== undefined && incomingAction.y !== undefined))) {
              const { x, y, type, count } = incomingAction;
              let errorRange = 1;
              if (type === 'bombard') {
                  errorRange = 1;
              } else if (type === 'spreadBombard') {
                  errorRange = 2;
              } else if (type === 'ppBombard') {
                  errorRange = 0;
              } else if (type === 'randomBombard') {
                  errorRange = 0;
              }

              logAction(`他島から ${count}発の${getBombardTypeLabel(type)}を受けました！`);
              for (let i = 0; i < count; i++) {
                  let tx = 0;
                  let ty = 0;
                  if (type === 'randomBombard') {
                      tx = Math.floor(Math.random() * SIZE);
                      ty = Math.floor(Math.random() * SIZE);
                  } else {
                      let dx = 0;
                      let dy = 0;
                      if (errorRange > 0) {
                          dx = Math.floor(Math.random() * (2 * errorRange + 1)) - errorRange;
                          dy = Math.floor(Math.random() * (2 * errorRange + 1)) - errorRange;
                      }
                      tx = x + dx;
                      ty = y + dy;
                  }

                  if (tx >= 0 && ty >= 0 && tx < SIZE && ty < SIZE) {
                      const protectingFacility = getProtectingDefenseFacility(tx, ty); // 変更点

                      if (protectingFacility) { // 防衛施設があった場合
                          if (type === 'ppBombard' || type === 'randomBombard') { // PP弾・ランダム弾だった場合
                              protectingFacility.facility = null; // 防衛施設を破壊
                              protectingFacility.terrain = 'waste'; // 防衛施設の場所を荒地にする
                              protectingFacility.enhanced = false; // 強化状態もリセット
                              logAction(`(${tx},${ty}) を守っていた防衛施設が${getBombardTypeLabel(type)}により破壊されました！`);
                              // その後、貫通弾の効果を適用（既存の攻撃ロジックに流れる）
                          } else { // 貫通弾でなければ防衛施設が守る
                              logAction(`砲撃は防衛施設により無効化されました (${tx},${ty})`);
                              continue; // 次の攻撃へ
                          }
                      }
                      // 防衛施設が破壊されたか、元々存在しない場合、以下の攻撃ロジックが実行される
                      const target = map[ty][tx];
                      if (target.terrain === 'mountain') { // 追加
                          logAction(`他島からの砲撃は山に着弾しましたが、被害はありませんでした(${tx},${ty})`); // 追加
                          continue; // 追加
                      }
                      if (target.terrain === 'sea') {
                          if (target.facility === 'port') {
                              target.facility = null;
                              logAction(`他島からの砲撃により (${tx},${ty}) の港が破壊されました`);
                          } else {
                              const targetWarship = warships.find(ship => ship.x === tx && ship.y === ty);
                              if (targetWarship) {
                                  if (targetWarship.isDispatched) {
                                      logAction(`派遣中の軍艦「${targetWarship.name}」への砲撃は無効でした。`);
                                      continue;
                                  }
                                  targetWarship.currentDurability -= 1; // 耐久値1減少
                                  registerWarshipDamageTaken(targetWarship, 1);
                                  checkAbnormalityOnDamage(targetWarship, damage);
                                  if (targetWarship.currentDurability <= 0) {
                            targetWarship.fuel = 0; // 残り燃料を0に
                            targetWarship.currentFuel = 0; // 現在燃料も0に
                            targetWarship.ammo = 0; // 残り弾薬を0に
                            targetWarship.currentAmmo = 0; // 現在弾薬も0に
                                      warships = warships.filter(ship => ship !== targetWarship);
                                      logAction(`他島からの砲撃により軍艦「${targetWarship.name}」が撃沈されました！`);
                                  } else {
                                      logAction(`他島からの砲撃が軍艦「${targetWarship.name}」に着弾しました！ (残り耐久: ${targetWarship.currentDurability})`);
                                  }
                              } else {
                                  logAction(`他島からの砲撃は海に着弾しました (${tx},${ty})`);
                              }
                          }
                      } else { // 陸地の場合
                          if (target.facility) {
                              if (target.facility === 'house') {
                                  population -= target.pop;
                                  if (population < 0) population = 0;
                              }
                              target.facility = null;
                              target.enhanced = false; // 施設破壊時に強化状態もリセット
                          }
                          target.terrain = 'waste';
                          logAction(`他島からの砲撃により (${tx},${ty}) が破壊されました`);
                      }
                          const monsterHit = monsters.find(m => m.x === tx && m.y === ty);
                      if (monsterHit) {
                          monsterHit.hp -= 1;
                          const monsterName = MONSTER_TYPES[monsterHit.typeId] ? MONSTER_TYPES[monsterHit.typeId].name : '怪獣';
                          logAction(`他島からの砲撃が ${monsterName} に命中！ (残り体力: ${monsterHit.hp})`);
                          if (monsterHit.hp <= 0) {
                              handleMonsterDefeat(monsterHit, `${monsterName} は討伐されました！`);
                          }
                      }
                  } else {
                      logAction(`他島からの砲撃は領域外に着弾しました (${tx},${ty})`);
                  }
              }
          } else if (incomingAction.type === 'warshipDispatch') { // 軍艦派遣の受信処理
              const { warshipData, sourceIslandName } = incomingAction;
              const newWarship = decodeWarshipData(warshipData);

              // 適切な海域を探して配置
              const possibleSeaTiles = [];
              for (let y = 0; y < SIZE; y++) {
                  for (let x = 0; x < SIZE; x++) {
                      const tile = map[y][x];
                      const existingWarship = warships.find(ship => ship.x === x && ship.y === y);
                      if (tile.terrain === 'sea' && tile.facility === null && !existingWarship) {
                          possibleSeaTiles.push({ x, y });
                      }
                  }
              }

              if (possibleSeaTiles.length > 0) {
                  const randomIndex = Math.floor(Math.random() * possibleSeaTiles.length);
                  const { x, y } = possibleSeaTiles[randomIndex];
                  newWarship.x = x;
                  newWarship.y = y;
                  newWarship.isDispatched = false; // 派遣された軍艦は、その島では派遣中ではない
                  warships.push(newWarship);
                  logAction(`「${sourceIslandName}」から軍艦「${newWarship.name}」が派遣されました！ (${x},${y}) に到着。`);
              } else {
                  logAction(`「${sourceIslandName}」から派遣された軍艦「${newWarship.name}」は配置できる海域がなく、帰還しました。`);
              }
          } else if (incomingAction.type === 'warshipReturnRequest') {
              const { homePort, name } = incomingAction;
              const warshipToReturn = warships.find(ship =>
                  ship.homePort === homePort &&
                  ship.name === name &&
                  !ship.isDispatched // この島でアクティブな（派遣中でない）軍艦
              );

              if (warshipToReturn) {
                  // 最新の軍艦情報をエンコード
                  const encodedWarshipData = encodeWarshipData(warshipToReturn);
                  const returnConfirmationData = {
                      type: "warshipReturnConfirmation", // 帰還確認タイプ
                      warshipData: encodedWarshipData,
                      originalHomePort: warshipToReturn.homePort
                  };
                  const encodedReturnConfirmationAction = btoa(encodeURIComponent(JSON.stringify(returnConfirmationData)));
                  document.getElementById('actionForOtherIslandOutput').value = encodedReturnConfirmationAction;

                  // 軍艦をこの島から削除
                  warships = warships.filter(ship => ship !== warshipToReturn);
                  logAction(`軍艦「${warshipToReturn.name}」(${warshipToReturn.homePort}籍) の帰還要請を受け、返送コードを出力し、自島から削除しました。`);
              } else {
                  logAction(`帰還要請された軍艦「${name}」(${homePort}籍) は、この島には存在しませんでした。`);
              }
          } else if (incomingAction.type === 'warshipReturnConfirmation') { // 軍艦帰還確認の受信処理 (母港側)
              const { warshipData, originalHomePort } = incomingAction;
              const returnedWarshipData = decodeWarshipData(warshipData);
              const existingWarship = warships.find(ship =>
                  ship.homePort === returnedWarshipData.homePort &&
                  ship.name === returnedWarshipData.name &&
                  ship.isDispatched === true // 母港で派遣中とマークされているもの
              );

              if (existingWarship) {
                  // 最新の軍艦情報に書き換える
                  existingWarship.exp = returnedWarshipData.exp;
                  existingWarship.currentFuel = returnedWarshipData.currentFuel;
                  existingWarship.maxFuel = returnedWarshipData.maxFuel; // maxFuelも更新
                  existingWarship.currentDurability = returnedWarshipData.currentDurability;
                  existingWarship.mainGun = returnedWarshipData.mainGun;
                  existingWarship.torpedo = returnedWarshipData.torpedo;
                  existingWarship.antiAir = returnedWarshipData.antiAir;
                  existingWarship.maxAmmo = returnedWarshipData.maxAmmo;
                  existingWarship.currentAmmo = returnedWarshipData.currentAmmo;
                  existingWarship.reconnaissance = returnedWarshipData.reconnaissance;
                  existingWarship.accuracyImprovement = returnedWarshipData.accuracyImprovement;

                  existingWarship.isDispatched = false; // 派遣状態を解除

                  logAction(`軍艦「${existingWarship.name}」が母港「${originalHomePort}」に帰還しました！情報が更新され、派遣状態が解除されました。`);
              } else {
                  logAction(`帰還した軍艦「${returnedWarshipData.name}」は、この島で対応する派遣中の軍艦が見つかりませんでした。`);
              }
          }
      } catch (e) {
          logAction("他島からの行動データの復元に失敗しました。");
          console.error(e);
      }
      }
  }


  // 必ず自分の島に戻る
  if (isViewingOtherIsland) {
      loadMyIslandState(); // 自分の島に戻る
      document.getElementById('actionForOtherIslandOutput').value = ''; // 他島への行動をクリア
      logAction("ターンが進んだため、自島に戻りました。");
  }
  handleWarshipAttacks()
  let foodChange = 0, moneyChange = 0;
  let prevPopulation = population; // 前ターンの人口を保存
  let currentTurnPopulationGrowth = 0; // 現在のターンでの人口増加をリセット

  // 行動キューの処理 (最大2つまで実行)
const ACTIONS_PER_TURN = 2; // 1ターンに実行する計画の数
let previousExecutedAction = null;
for (let i = 0; i < ACTIONS_PER_TURN; i++) {
    if (actionQueue.length === 0) {
        break; // キューが空になったら終了
    }
    // actionQueue.shift() により、実行した計画はキューから削除される（残りは保持される）
    const task = actionQueue.shift();
    currentExecutingTask = task;
    const x = task.x;
    const y = task.y;
    const action = task.action;
    let tile = null;
    if (x !== null && y !== null) {
        tile = map[y][x];
    }
    if (x !== null && y !== null) {
      tile = map[y][x];
    }else if (action === 'buildWarship') {
  const { warshipData } = task;
  const existingWarship = warships.find(ship => ship.x === x && ship.y === y);
  if (existingWarship) {
    logAction(`(${x},${y}) には既に軍艦が存在するため、建造に失敗しました。`);
    continue;
  }

const newWarship = {
        x: selectedX,
        y: selectedY,
        homePort: islandName,
        name: document.getElementById('warshipName').value || "無銘艦",
        exp: 0,
        currentFuel: Math.min(WARSHIP_CAPS.maxFuel, 100), // 初期燃料も上限考慮
        maxFuel: Math.min(WARSHIP_CAPS.maxFuel, 100), // 初期最大燃料も上限考慮
        maxDurability: Math.min(WARSHIP_CAPS.maxDurability, parseInt(document.getElementById('warshipDurability').value)),
        currentDurability: Math.min(WARSHIP_CAPS.maxDurability, parseInt(document.getElementById('warshipDurability').value)),
        mainGun: Math.min(WARSHIP_CAPS.mainGun, parseInt(document.getElementById('warshipMainGun').value)),
        torpedo: parseInt(document.getElementById('warshipTorpedo').value), // 魚雷には上限なし
        antiAir: Math.min(WARSHIP_CAPS.antiAir, parseInt(document.getElementById('warshipAntiAir').value)),
        maxAmmo: Math.min(WARSHIP_CAPS.maxAmmo, parseInt(document.getElementById('warshipAmmo').value)),
        currentAmmo: Math.min(WARSHIP_CAPS.maxAmmo, parseInt(document.getElementById('warshipAmmo').value)),
        reconnaissance: parseInt(document.getElementById('warshipRecon').value),
        accuracyImprovement: parseInt(document.getElementById('warshipAccuracy').value),
        isDispatched: false, // 派遣状態
        originalCost: totalCost // 建造コストを保存
    };
  warships.push(newWarship);
  money -= warshipData.originalCost;
        map[currentAction.y][currentAction.x].facility = 'warship'; // 地図タイルに軍艦が建設されたことを記録
  logAction(`(${x},${y}) に軍艦「${newWarship.name}」を建造しました。`);
}

    // 住宅の上に建設する際の処理を共通化
    const handleHouseOverwrite = (targetTile) => {
        if (targetTile && targetTile.facility === 'house') {
            population -= targetTile.pop;
            if (population < 0) population = 0;
            targetTile.facility = null;
            targetTile.pop = 0;
            logAction(`(${x},${y}) の住宅が取り壊されました。`);
        }
    };
    if (action === 'delayAction') {
        previousExecutedAction = 'delayAction';
    }
    else if (action === 'concentratedFire') {
        if (previousExecutedAction === 'concentratedFire') {
            logAction(`連続する集中砲撃は無効化されました。`);
            continue;
        }
        const targetX = x;
        const targetY = y;
        const availableWarships = warships.filter(ship => ship.currentDurability > 0 && !ship.isDispatched && ship.currentAmmo > 0 && ship.currentFuel > 0 && ship.abnormality !== 'fire' && !(ship.x === targetX && ship.y === targetY));
        if (availableWarships.length === 0) {
            logAction(`(${targetX},${targetY}) への集中砲撃は実行されませんでした（攻撃可能な軍艦がありません）。`);
            previousExecutedAction = 'concentratedFire';
            continue;
        }
        logAction(`(${targetX},${targetY}) へ集中砲撃を開始します。`);
        const canParticipate = (ship) => {
            const dist = Math.max(Math.abs(ship.x - targetX), Math.abs(ship.y - targetY));
            if (dist <= 1) return true;
            if (dist <= 2) return ship.reconnaissance >= 1;
            if (dist <= 3) return ship.reconnaissance >= 2;
            return false;
        };
        for (const ship of availableWarships) {
            if (!canParticipate(ship)) continue;
            const attackLimit = ship.mainGun + ship.torpedo;
            let executed = 0;
            for (let n = 0; n < attackLimit; n++) {
                if (ship.currentAmmo <= 0 || ship.currentFuel <= 0) {
                    registerWarshipMiss(ship);
                    break;
                }
                ship.currentAmmo -= 1;
                ship.currentFuel = Math.max(0, ship.currentFuel - 1);
                executed++;
                const monsterHit = monsters.find(m => m.x === targetX && m.y === targetY);
                if (monsterHit) {
                    monsterHit.hp -= 1;
                    registerWarshipHit(ship);
                    const monsterName = MONSTER_TYPES[monsterHit.typeId] ? MONSTER_TYPES[monsterHit.typeId].name : '怪獣';
                    if (monsterHit.hp <= 0) {
                        handleMonsterDefeat(monsterHit, `${monsterName} は集中砲撃により討伐されました！`);
                    } else {
                        logAction(`${monsterName} に命中！ (残り体力: ${monsterHit.hp})`);
                    }
                    continue;
                }
                const targetTile = map[targetY][targetX];
                if (targetTile.terrain === 'mountain') {
                    registerWarshipMiss(ship);
                    logAction(`集中砲撃は山に着弾しましたが、被害はありませんでした。 (${targetX},${targetY})`);
                    continue;
                }
                if (targetTile.terrain === 'sea') {
                    if (targetTile.facility === 'port') {
                        registerWarshipHit(ship);
                        targetTile.facility = null;
                        logAction(`集中砲撃により (${targetX},${targetY}) の港が破壊されました。`);
                        continue;
                    }
                    const targetWarship = warships.find(w => w.x === targetX && w.y === targetY && w !== ship);
                    if (targetWarship && !targetWarship.isDispatched) {
                        registerWarshipHit(ship);
                        targetWarship.currentDurability -= 1;
                        registerWarshipDamageTaken(targetWarship, 1);
                        if (targetWarship.currentDurability <= 0) {
                            targetWarship.currentDurability = 0;
                            targetWarship.currentAmmo = 0;
                            targetWarship.currentFuel = 0;
                            registerWarshipSink(ship);
                            logAction(`集中砲撃により軍艦「${targetWarship.name}」が撃沈されました！`);
                        } else {
                            logAction(`集中砲撃が軍艦「${targetWarship.name}」に命中！ (残り耐久: ${targetWarship.currentDurability})`);
                        }
                    } else {
                        registerWarshipMiss(ship);
                        logAction(`集中砲撃は海に着弾しました。 (${targetX},${targetY})`);
                    }
                } else {
                    registerWarshipHit(ship);
                    if (targetTile.facility === 'house') {
                        population -= targetTile.pop;
                        if (population < 0) population = 0;
                    }
                    targetTile.facility = null;
                    targetTile.enhanced = false;
                    targetTile.terrain = 'waste';
                    logAction(`集中砲撃により (${targetX},${targetY}) が破壊されました。`);
                }
            }
            if (executed > 0) {
                logAction(`軍艦「${ship.name}」が集中砲撃を ${executed} 回実行しました。`);
            }
        }
        previousExecutedAction = 'concentratedFire';
    }
    else if (action === 'buildFarm') {
      if (tile && tile.terrain === 'plain' && money >= 100) {
        handleHouseOverwrite(tile);
        tile.facility = 'farm';
        tile.enhanced = false; // 新規建設は強化なし
        money -= 100;
        logAction(`(${x},${y}) に農場を建設しました`);
        checkAndCompleteMission('02', 1, 0, 250,() => map.flat().some(t => t.facility === 'farm'),'農場が1つでも建設されている');
      } else logAction(`(${x},${y}) の農場建設は失敗しました（条件不適合または資金不足）`);
    }
    else if (action === 'buildFactory') {
      if (tile && tile.terrain === 'plain' && money >= 100) {
        handleHouseOverwrite(tile);
        tile.facility = 'factory';
        tile.enhanced = false; // 新規建設は強化なし
        money -= 100;
        logAction(`(${x},${y}) に工場を建設しました`);
        checkAndCompleteMission('03', 1, 0, 500,() => map.flat().some(t => t.facility === 'factory'),'工場が1つでも建設されている');
      } else logAction(`(${x},${y}) の工場建設は失敗しました（条件不適合または資金不足）`);
    }
    else if (action === 'flatten') {
      if (tile && tile.terrain === 'mountain') { // 変更
        logAction(`(${x},${y}) の整地は失敗しました（山は破壊できません）`);
        continue;
      }
      if (tile && (tile.terrain === 'waste' || tile.facility) && money >= 20) {
        money -= 20;
        if (tile.facility === 'house') {
            population -= tile.pop; // 人口を即時反映
            if (population < 0) population = 0;
        }
        tile.terrain = 'plain'; tile.facility = null; tile.pop = 0; tile.enhanced = false; // 強化状態もリセット
        logAction(`(${x},${y}) を整地して平地にしました`);
      } else logAction(`(${x},${y}) の整地は失敗しました（条件不適合または資金不足）`);
    }
    else if (action === 'buildMonument'){
      if (tile && tile.terrain === 'plain' && tile.facility != 'Monument' && money >= 500000000) {
        handleHouseOverwrite(tile);
        tile.facility = 'Monument';
        money -= 500000000;
        tile.MonumentLevel = 1;
        logAction(`(${x},${y}) に石碑を建設しました`);
      } else {
        logAction(`(${x},${y}) の石碑建設は失敗しました（条件不適合または資金不足）`);
      }
    }
    else if (action === 'upgradeMonument')
      if (tile && tile.facility === 'Monument' && money >= 500000000) {
        handleHouseOverwrite(tile);
        tile.MonumentLevel += 1;
        money -= 500000000;
        logAction(`(${x},${y}) の石碑を強化しました`);
      } else {
        logAction(`(${x},${y}) の石碑強化は失敗しました（条件不適合または資金不足）`);
      }
    else if (action === 'sellMonument')
      if (tile && tile.facility === 'Monument') {
        handleHouseOverwrite(tile);
        tile.terrain = 'plain'; tile.facility = null; tile.pop = 0; tile.enhanced = false
        money += 500000000 * tile.MonumentLevel;
        tile.MonumentLevel = 0;
        logAction(`(${x},${y}) の石碑を売却しました`);
      } else {
        logAction(`(${x},${y}) の石碑売却は失敗しました（条件不適合または資金不足）`);
      }
    else if (action === 'cutForest') {
      if (tile && tile.terrain === 'forest') {
        const gain = Math.floor(Math.random() * 421) + 80;
        money += gain; tile.terrain = 'plain'; tile.enhanced = false; // 強化状態もリセット
        logAction(`(${x},${y}) を伐採し ${gain}G を得ました`);
      } else logAction(`(${x},${y}) の伐採は失敗しました（森ではありません）`);
    }
    else if (action === 'plantForest') {
      if (tile && tile.terrain === 'plain' && tile.facility === null && money >= 200) {
        handleHouseOverwrite(tile);
        tile.terrain = 'forest';
        tile.enhanced = false; // 強化状態もリセット
        money -= 200;
        logAction(`(${x},${y}) に植林を行い、森にしました`);
      } else {
        logAction(`(${x},${y}) の植林は失敗しました（条件不適合または資金不足）`);
      }
    }
    else if (action === 'buildGun') {
      if (tile && tile.terrain === 'plain' && money >= 1200) {
        handleHouseOverwrite(tile);
        tile.facility = 'gun'; money -= 1200; tile.enhanced = false; // 強化状態もリセット
        logAction(`(${x},${y}) に砲台を建設しました`);
        const guns = getGunCount();
        checkAndCompleteMission('05', 1, 0, 1000,() => guns >= 3,'砲撃可能数が3以上になる');
      } else logAction(`(${x},${y}) の砲台建設は失敗しました（条件不適合または資金不足）`);
    }
    else if (action === 'buildDefenseFacility') { // 防衛施設建設
      if (tile && tile.terrain === 'plain' && money >= 5000) {
        handleHouseOverwrite(tile);
        tile.facility = 'defenseFacility';
        money -= 5000;
        tile.enhanced = false; // 新規建設は強化なし
        logAction(`(${x},${y}) に防衛施設を建設しました`);
        checkAndCompleteMission('06', 1, 0, 1000, () => map.flat().some(t => t.facility === 'defenseFacility'),'防衛施設が1つでも建設されている');
      } else logAction(`(${x},${y}) の防衛施設建設は失敗しました（条件不適合または資金不足）`);
    }
    else if (action === 'landfill') {
      if (tile && tile.terrain === 'sea' && money >= 600) {
        tile.terrain = 'waste'; money -= 600; tile.enhanced = false; // 強化状態もリセット
        logAction(`(${x},${y}) を埋め立てて荒地にしました`);
      } else logAction(`(${x},${y}) の埋め立ては失敗しました（海ではありませんまたは資金不足）`);
    }
    else if (action === 'exportFood') {
      const amount = task.amount;
      if (food >= amount * 20) {
        food -= amount * 20; money += amount * 200;
        logAction(`食料を ${amount * 20} 輸出し ${amount * 200}G を得ました`);
        checkAndCompleteMission('08', 2, 5000, 0, () => true, '食料輸出を行う');
      } else logAction(`食料輸出に失敗しました（食料不足）`);
    }
    else if (action === 'buildPort') {
      if (tile && tile.terrain === 'sea' && !tile.facility && money >= 3000) {
        let adjacentLand = false;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && (dx !== 0 || dy !== 0) && map[ny][nx].terrain !== 'sea') {
              adjacentLand = true;
              break;
            }
          }
          if (adjacentLand) break;
        }
        if (adjacentLand) {
          tile.facility = 'port'; money -= 3000; tile.enhanced = false; // 強化状態もリセット
          logAction(`(${x},${y}) に港を建設しました`);
        } else logAction(`(${x},${y}) の港建設は失敗しました（陸地に隣接していませんまたは資金不足）`);
      } else logAction(`(${x},${y}) の港建設は失敗しました（条件不適合または資金不足）`);
    }
    else if (action === 'dig') {
    const tile = map[y][x];
    if (monsters.find(m => m.x === x && m.y === y)) {
        logAction(`(${x},${y}) の掘削は失敗しました（怪獣がいます）`);
        continue;
    }
    if (tile.terrain === 'mountain') {
        logAction(`(${x},${y}) の掘削は失敗しました（山は掘削できません）`);
        continue; // 追加 (次のアクション処理へ)
    }
    const oilFactor = task.oilFactor || 1; // confirmActionで設定した値、未設定なら1 
    // コスト計算
    let cost = 300;
    if (tile.terrain === 'sea' && oilFactor > 1) {
        // 海を掘削し、かつ油田発掘率Lv > 1 の場合: 300 * 階乗(入力値)
        // 訂正：300 * 入力値の2乗
        cost = 300 * oilFactor ** 2;
    } 
    if (money < cost) {
        logAction(`(${x},${y}) の掘削は失敗しました（資金不足: ${cost}G 必要）`);
    } else {
        money -= cost;
        
        if (tile.terrain !== 'sea') {
            // 海以外の地形を掘削した場合 (入力値に関わらず発掘されない)
            if (tile.facility === 'house') {
                population -= tile.pop;
                if (population < 0) population = 0;
            }
            tile.terrain = 'sea';
            tile.facility = null;
            tile.pop = 0;
            tile.enhanced = false;
            logAction(`(${x},${y}) を掘削して海にしました。`);
        } else {
            // 海の地形を掘削した場合
            if (tile.facility === 'oilRig') {
                logAction(`(${x},${y}) にはすでに油田が存在するため、発掘は失敗しました。 (コスト: ${cost}G)`);
            } else {
                // 発掘率の計算
                // oilFactor=1 の場合: 2%
                // oilFactor=n の場合: 2% + (n-1) * 5%
                const drillProbability = 0.02 + (oilFactor - 1) * 0.05;
                
                if (Math.random() < drillProbability) {
                    tile.facility = 'oilRig';
                    logAction(`(${x},${y}) を海に掘削した結果、油田を発見しました！ (コスト: ${cost}G, 確率: ${Math.round(drillProbability * 100)}%)`);
                } else {
                    logAction(`(${x},${y}) を掘削しましたが、油田は見つかりませんでした。 (コスト: ${cost}G, 確率: ${Math.round(drillProbability * 100)}%)`);
                }
            }
        }
    }
}
    else if (action === 'bombard' || action === 'spreadBombard' || action === 'ppBombard' || action === 'randomBombard') {
      const count = task.count || 1;
      const guns = getGunCount();
      let costPerShot = 0;
      let errorRange = 1; // 砲撃の誤差範囲
      if (action === 'bombard') {
          costPerShot = 120;
          errorRange = 1;
      } else if (action === 'spreadBombard') {
          costPerShot = 500;
          errorRange = 2;
      } else if (action === 'ppBombard') {
          costPerShot = 10000000; // PP弾の価格を更新
          errorRange = 0; // 誤差なし
      } else if (action === 'randomBombard') {
          costPerShot = 500000;
          errorRange = 0;
      }

      const usableGuns = Math.min(count, guns, Math.floor(money / costPerShot));

      if (usableGuns > 0) {
        let hits = 0;
        let shotsFired = 0;
        for (let i = 0; i < usableGuns; i++) {
          shotsFired++;
          let tx = 0;
          let ty = 0;
          if (action === 'randomBombard') {
            tx = Math.floor(Math.random() * SIZE);
            ty = Math.floor(Math.random() * SIZE);
          } else {
            let dx = 0;
            let dy = 0;
            if (errorRange > 0) {
              dx = Math.floor(Math.random() * (2 * errorRange + 1)) - errorRange;
              dy = Math.floor(Math.random() * (2 * errorRange + 1)) - errorRange;
            }
            tx = x + dx;
            ty = y + dy;
          }

          if (tx >= 0 && ty >= 0 && tx < SIZE && ty < SIZE) {
            const protectingFacility = getProtectingDefenseFacility(tx, ty); // 変更点

            if (protectingFacility) { // 防衛施設があった場合
                if (action === 'ppBombard' || action === 'randomBombard') { // PP弾・ランダム弾だった場合
                    protectingFacility.facility = null; // 防衛施設を破壊
                    protectingFacility.terrain = 'waste'; // 防衛施設の場所を荒地にする
                    protectingFacility.enhanced = false; // 強化状態もリセット
                    logAction(`(${tx},${ty}) を守っていた防衛施設が${getBombardTypeLabel(action)}により破壊されました！`);
                    // その後、貫通弾の効果を適用（既存の攻撃ロジックに流れる）
                } else { // 貫通弾でなければ防衛施設が守る
                    renderMap();
                    logAction(`砲撃は防衛施設により無効化されました (${tx},${ty})`);
                    continue; // 次の攻撃へ
                }
            }
            // 防衛施設が破壊されたか、元々存在しない場合、以下の攻撃ロジックが実行される
            const target = map[ty][tx];
            const monsterHit = monsters.find(m => m.x === tx && m.y === ty);
            if (monsterHit) {
                monsterHit.hp -= 1;
                const monsterName = MONSTER_TYPES[monsterHit.typeId] ? MONSTER_TYPES[monsterHit.typeId].name : '怪獣';
                logAction(`砲撃が ${monsterName} に命中！ (残り体力: ${monsterHit.hp})`);
                if (monsterHit.hp <= 0) {
                    handleMonsterDefeat(monsterHit, `${monsterName} が砲撃により討伐されました‼`);
                }
                hits++; // 命中カウント
                continue; // タイル破壊はスキップ
            }
            if (target.terrain === 'mountain') {
                logAction(`砲撃は山に着弾しましたが、無効でした。 (${tx},${ty})`);
                continue;
            }
            if (target.terrain === 'sea') {
                if (target.facility === 'port') {
                    target.facility = null;
                    renderMap();
                    logAction(`砲撃で (${tx},${ty}) の港を破壊し、海になりました`);
                } else {
                    // 軍艦への着弾判定
                    const targetWarship = warships.find(ship => ship.x === tx && ship.y === ty);
                    if (targetWarship) {
                        // 派遣中の軍艦への攻撃は無効
                        if (targetWarship.isDispatched) {
                            logAction(`派遣中の軍艦「${targetWarship.name}」への砲撃は無効でした。`);
                            continue;
                        }
                        targetWarship.currentDurability -= 1; // 耐久値1減少
                        registerWarshipDamageTaken(targetWarship, 1);
                        if (targetWarship.currentDurability <= 0) {
                            warships = warships.filter(ship => ship !== targetWarship);
                            targetWarship.fuel = 0; // 残り燃料を0に
                            targetWarship.currentFuel = 0; // 現在燃料も0に
                            targetWarship.ammo = 0; // 残り弾薬を0に
                            targetWarship.currentAmmo = 0; // 現在弾薬も0に
                            warships = warships.filter(ship => ship !== targetWarship);
                            logAction(`砲撃により軍艦「${targetWarship.name}」が撃沈されました！`);
                        } else {
                            logAction(`砲撃が軍艦「${targetWarship.name}」に着弾しました！ (残り耐久: ${targetWarship.currentDurability})`);
                        }
                    } else {
                        renderMap();
                        logAction(`砲撃は海に着弾しました (${tx},${ty})`);
                    }
                }
            } else { // 陸地の場合
                if (target.facility) {
                    if (target.facility === 'house') {
                        population -= target.pop;
                        if (population < 0) population = 0;
                    }
                }
                    target.facility = null;
                    target.enhanced = false; // 施設破壊時に強化状態もリセット
                target.terrain = 'waste';
                logAction(`砲撃で (${tx},${ty}) を破壊しました`);
            }

            // 怪獣が命中したかチェック(削除済み)
            // if (monster && monster.x === tx && monster.y === ty) {
            //   monster = null;
            //   logAction(`怪獣が砲撃により討伐されました‼`);
            // }
            hits++;
          } else {
            logAction(`砲撃は領域外に着弾しました (${tx},${ty})`);
          }
        }
        if (action === 'randomBombard') {
          money -= shotsFired * costPerShot;
        } else {
          money -= hits * costPerShot; // 成功した砲撃の数だけ費用を引く
        }
      } else {
        logAction(`砲撃は実行されませんでした。`);
      }
    }
    else if (action === 'selfDestructMilitaryFacility') { // 名称変更
        if (!triggerMilitaryFacilitySelfDestruct(x, y, '')) {
            logAction(`(${x},${y}) に軍事施設がありませんでした。`);
        }
    }
    else if (action === 'enhanceFacility') { // 設備強化
        if (tile && (tile.facility === 'farm' || tile.facility === 'factory'|| tile.facility === 'oilRig' || tile.facility === 'gun') && !tile.enhanced && money >= 10000) {
tile.enhanced = true;
        money -= 10000;
        
        let facilityName;
        if (tile.facility === 'farm') facilityName = '農場';
        else if (tile.facility === 'factory') facilityName = '工場';
        else if (tile.facility === 'oilRig') facilityName = '海底油田';
        else if (tile.facility === 'gun') facilityName = '高効率砲台';
        logAction(`(${x},${y}) の${facilityName}が強化されました。`);
            checkAndCompleteMission('04', 1, 0, 1000, () => true, '工場または農場に設備強化を行う');
        } else {
            logAction(`(${x},${y}) の設備強化は失敗しました。`);
        }
    } else if (action === 'buildWarship') { // 軍艦建造
        const { name, durability, mainGun, torpedo, antiAir, ammo, recon, accuracy, cost } = task.warshipData;

        // 再度、場所と費用を確認
        let adjacentToPort = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && (dx !== 0 || dy !== 0)) {
                    if (map[ny][nx].facility === 'port') {
                        adjacentToPort = true;
                        break;
                    }
                }
            }
            if (adjacentToPort) break;
        }
        // Check if a warship already exists at the selected tile
        const existingWarship = warships.find(ship => ship.x === x && ship.y === y);

            const newWarship = {
                x: x,
                y: y,
                homePort: islandName,
                name: name,
                exp: 0,
                currentFuel: 0, // 初期燃料0
                maxFuel: 100, // 仮の最大燃料
                maxDurability: durability,
                currentDurability: durability,
                mainGun: mainGun,
                torpedo: torpedo,
                antiAir: antiAir,
                maxAmmo: ammo,
                currentAmmo: 0, // 初期弾薬0
                reconnaissance: recon,
                accuracyImprovement: accuracy,
                isDispatched: false,
                abnormality: null,
                nickname: '',
                medalsEarned: {}
            };
let hiyou = (durability * 10000000) + (mainGun * 12000000) + (torpedo * 10000000) + (antiAir * 5000000) + (ammo * 100000) + (recon * 12500000) + (accuracy * 50000000);
            warships.push(newWarship);
            money = money - hiyou;
            logAction(`軍艦「${name}」を (${x},${y}) に建造しました！`);

    } else if (action === 'refuelWarship') { // 燃料補給
        const warship = warships.find(ship => ship.x === x && ship.y === y);
        if (warship && !warship.isDispatched) {
            const amount = task.amount;
            const cost = amount * 500;
            if (food >= cost) {
                const actualRefuelAmount = Math.min(amount, warship.maxFuel - warship.currentFuel);
                warship.currentFuel += actualRefuelAmount;
                food -= cost;
                logAction(`軍艦「${warship.name}」に燃料を ${actualRefuelAmount} 補給しました。`);
            } else {
                logAction(`軍艦「${warship.name}」への燃料補給に失敗しました（食料不足）。`);
            }
        } else {
            logAction(`(${x},${y}) には軍艦が存在しないか、派遣中でした。`);
        }
    } else if (action === 'resupplyWarshipAmmo') { // 弾薬補給
        const warship = warships.find(ship => ship.x === x && ship.y === y);
        if (warship && !warship.isDispatched) {
            const amount = task.amount;
            const cost = amount * 20000;
            if (money >= cost) {
                const actualResupplyAmount = Math.min(amount, warship.maxAmmo - warship.currentAmmo);
                warship.currentAmmo += actualResupplyAmount;
                money -= cost;
                logAction(`軍艦「${warship.name}」に弾薬を ${actualResupplyAmount} 補給しました。`);
            } else {
                logAction(`軍艦「${warship.name}」への弾薬補給に失敗しました（資金不足）。`);
            }
        } else {
            logAction(`(${x},${y}) には軍艦が存在しないか、派遣中でした。`);
        }
    } else if (action === 'setWarshipNickname') {
        const warship = warships.find(ship => ship.x === x && ship.y === y);
        if (warship && warship.homePort === islandName && money >= 100000) {
            ensureWarshipFields(warship);
            warship.nickname = task.nickname;
            money -= 100000;
            logAction(`軍艦「${warship.name}」に二つ名「${task.nickname}」を設定しました。`);
        } else {
            logAction(`二つ名指定は失敗しました。`);
        }
    } else if (action === 'convertAchievementToExp') {
        const warship = warships.find(ship => ship.x === x && ship.y === y);
        const amount = parseInt(task.amount);
        if (warship && !isNaN(amount) && amount > 0 && achievementPoints >= amount) {
            achievementPoints -= amount;
            if (warship.exp !== "NaN") {
                warship.exp += amount * 100;
            }
            logAction(`軍艦「${warship.name}」へ ${amount * 100} EXP を付与しました。`);
        } else {
            logAction(`実績pt変換は失敗しました。`);
        }
    } else if (action === 'remodelWarshipWeapon') {
        const warship = warships.find(ship => ship.x === x && ship.y === y);
        if (warship && warship.maxAmmo >= 1000 && warship.exp > 0) {
            warship.exp = 0;
            warship.maxAmmo -= 1000;
            warship.currentAmmo = Math.min(warship.currentAmmo, warship.maxAmmo);
            if (task.weaponType === 'torpedo') warship.torpedo += 1;
            else warship.mainGun += 1;
            logAction(`軍艦「${warship.name}」の武器換装を実行しました（${task.weaponType === 'torpedo' ? '魚雷' : '主砲'}+1）。`);
        } else {
            logAction(`武器換装は失敗しました（EXPまたは弾薬庫上限が不足）。`);
        }
    } else if (action === 'dispatchWarship') { // 軍艦派遣 (キューからの実行)
        // この処理はconfirmActionで他島への行動として出力済みのため、ここでは何もせずスキップ
        // 軍艦のisDispatchedフラグと燃料0はconfirmActionで既に設定されている
    } else if (action === 'requestWarshipReturn') { // 軍艦帰還要請 (キューからの実行)
        // この処理もconfirmActionで他島への行動として出力済みのため、ここでは何もせずスキップ
    }
  }
  // 軍艦の移動 (派遣中の軍艦は移動しない)
  for (const warship of warships) {
      if (!warship.isDispatched && warship.currentFuel >= 1) { // 派遣中でない軍艦のみ移動
            if (warship.abnormality === 'flooding') {
                logAction(`軍艦 ${warship.name} は浸水しているため、移動できません。`);
                continue; // 次のアクションへ
            }
          warship.currentFuel -= 1; // 燃料消費
          const possibleMoves = [];
          for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                  const nx = warship.x + dx;
                  const ny = warship.y + dy;
                  if (dx === 0 && dy === 0) continue;
                  // マップ範囲内であること
                  if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
                      const targetTile = map[ny][nx];
                      // 海であること、建物がないこと、他の軍艦がいないこと
                      const isSeaWithoutFacilityOrWarship = (targetTile.terrain === 'sea' && targetTile.facility === null && !warships.some(otherShip => otherShip !== warship && otherShip.x === nx && otherShip.y === ny));
                      if (isSeaWithoutFacilityOrWarship) {
                          possibleMoves.push({ x: nx, y: ny });
                      }
                  }
              }
          }

          if (possibleMoves.length > 0) {
              const randomIndex = Math.floor(Math.random() * possibleMoves.length);
              const newPos = possibleMoves[randomIndex];
              logAction(`軍艦「${warship.name}」は (${warship.x},${warship.y}) から (${newPos.x},${newPos.y}) へ移動しました。`);
              warship.x = newPos.x;
              warship.y = newPos.y;
          } else {
              logAction(`軍艦「${warship.name}」は移動できませんでした（移動可能なマスがない）。`);
          }
      }
  }

  // 生産＆成長処理
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = map[y][x];
      if (tile.facility === 'farm' && tile.terrain === 'plain') {
          if (volcanoTurns === 0) { // 噴火中は産出なし
              foodChange += tile.enhanced ? 300 : 100; // 強化農場は食料300
          }
      }
      if (tile.facility === 'house') {
        const growth = Math.floor(Math.random() * 151 + 50);
        const added = Math.min(7500 - tile.pop, growth);
        if (volcanoTurns === 0) { // 追加
            tile.pop += added;
            currentTurnPopulationGrowth += added;
        }
      }
      if (tile.facility === 'factory') {
          // 変更箇所：経済危機の影響を反映
          let divisor;
          if (economicCrisisTurns > 0) {
              // 経済危機中
              if (tile.enhanced) {
                  // 強化工場 (通常1.5倍) の生産が 0.2倍 になる
                  // 元の生産額: pop / (4 / 1.5)
                  // この 0.2倍: (pop / (4 / 1.5)) * 0.2 = pop / ((4 / 1.5) / 0.2) = pop / (4 / (1.5 * 0.2)) = pop / (4 / 0.3)
                  divisor = 4 / 0.3; 
              } else {
                  // 通常工場 (通常1.0倍) の生産が 0.5倍 になる
                  // 元の生産額: pop / 4
                  // この 0.5倍: (pop / 4) * 0.5 = pop / (4 / 0.5)
                  divisor = 4 / 0.5;
              }
          } else {
              // 経済危機ではない
              divisor = tile.enhanced ? (4 / 1.5) : 4;
          }
          moneyChange += Math.floor(population / divisor);
      }
    }
  }

if (turn > 0 && turn % 50 === 0) {
    const monumentLevel = getMonumentLevel(); // A. で追加した関数を呼び出す
    if (monumentLevel > 0) {
        const expIncrease = monumentLevel * 5;
        let increasedCount = 0;

        warships.forEach(ship => {
            // 1. 母港が現在の島名と同じ
            // 2. expが"NaN"でない（特殊艦の除外）
            // 3. 沈没していない
            if (ship.homePort === islandName && ship.exp !== "NaN" && ship.currentDurability > 0) {
                ship.exp += expIncrease;
                increasedCount++;
            }
        });

        if (increasedCount > 0) {
            logAction(`[石碑効果] ${islandName}籍の軍艦 ${increasedCount}隻に経験値 ${expIncrease} を付与しました！ (Lv${monumentLevel}効果)`);
        }
    }
}
let totalOilRigIncome = 0;
let oilRigLoss = 0;
let remainingOilRigCount = 0; // 残存数をカウント

for (let y = 0; y < SIZE; y++) { 
    for (let x = 0; x < SIZE; x++) { 
        const tile = map[y][x]; 
        if (tile.facility === 'oilRig') {
            
            // 収入計算: 強化なら2基相当 (2000G)、そうでなければ1基相当 (1000G)
            const income = tile.enhanced ? 50000 : 25000; 
            totalOilRigIncome += income;
            
            // 枯渇率計算: 既存の枯渇率を0.02と仮定し、強化なら1.75倍 (0.035)
            const baseLossRate = 0.02; 
            const lossRate = tile.enhanced ? baseLossRate * 1.75 : baseLossRate; 
            if (Math.random() < lossRate) { 
                oilRigLoss++; 
                const facilityName = tile.enhanced ? '高効率海底油田' : '海底油田';
                
                tile.facility = null; 
                tile.enhanced = false; // 強化状態もリセット 
                
                logAction(`(${x},${y}) の${facilityName}が枯渇しました。`); 
            } else {
                remainingOilRigCount++;
            }
        } 
    } 
}
moneyChange += totalOilRigIncome; // 合計収入を加算
if (remainingOilRigCount > 0 || totalOilRigIncome > 0) {
    logAction(`海底油田から${totalOilRigIncome}Gを獲得しました。`); 
}
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = map[y][x];
      if (tile.facility === 'farm') {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && (dx !== 0 || dy !== 0) && map[ny][nx].terrain === 'plain' && !map[ny][nx].facility && Math.random() < 0.1) {
              map[ny][nx].facility = 'house'; map[ny][nx].pop = 50;
              currentTurnPopulationGrowth += 50;
              logAction(`(${nx},${ny}) に住宅が自動形成されました`);
            }
          }
        }
      }
    }
  }

  currentExecutingTask = null;
  population += currentTurnPopulationGrowth; // 合計の人口増加分を反映
  checkAndCompleteMission('07', 2, 1000, 0, () => population >= 50000, '総人口が5万人に達する');
  foodChange -= Math.floor(population / 200) * 5;
  food += foodChange;
  money += moneyChange;
// 火山の噴火 持続処理 (追加)
    if (volcanoTurns > 0) {
        volcanoTurns--;
        if (volcanoTurns === 0) {
            logAction(`噴火による降灰が終息しました。農場と人口増加が正常に戻ります。`);
        } else {
            logAction(`噴火による降灰はあと ${volcanoTurns} ターン続きます...`);
        }
    }
    const hasKingMonster = monsters.some(isKingMonster);
    if (hasKingMonster) {
        const volunteerMoney = countHousesOnIsland() * 50000;
        if (volunteerMoney > 0) {
            money += volunteerMoney;
            moneyChange += volunteerMoney;
            logAction(`怪獣キングガロスの影響で義勇金 ${volunteerMoney}G が支給されました。`);
        }
        if (economicCrisisTurns > 0) {
            money += frozenMoney;
            frozenMoney = 0;
            economicCrisisTurns = 0;
            logAction('怪獣キングガロスの影響で経済危機が強制的に終息しました。');
        }
    }
// 経済危機の発生判定
    if (!hasKingMonster && economicCrisisTurns === 0 && (money + frozenMoney) >= 100000000) {
        const baseMoney = 1500000000;
        const currentTotalMoney = money + frozenMoney;
        const excessMoney = Math.max(0, currentTotalMoney - baseMoney); // 0未満にならないように    
        const baseProbability = 0.01; // 1%
        const additionalProbability = Math.floor(excessMoney / 100000000) * 0.002; // 1億Gごとに 0.2%
        const totalProbability = baseProbability + additionalProbability;
        
        if (Math.random() < totalProbability) {
            // 経済危機発生
            economicCrisisTurns = Math.floor(Math.random() * 26) + 10; // 10～35ターン
            const frozenPercentage = Math.random() * 0.5 + 0.4; // 40%～90%
            frozenMoney = Math.floor(currentTotalMoney * frozenPercentage);
            money = currentTotalMoney - frozenMoney; // 使えるお金を減らす
            
            logAction(`経済危機が発生しました！ ${economicCrisisTurns}ターンの間、資金の${Math.round(frozenPercentage * 100)}% (${frozenMoney}G)が凍結されます！`);
        }
    } 
    // 経済危機の持続処理
    else if (!hasKingMonster && economicCrisisTurns > 0) {
        economicCrisisTurns--;
        if (economicCrisisTurns === 0) {
            logAction(`経済危機が終息しました。凍結されていた ${frozenMoney}G が使用可能になります。`);
            money += frozenMoney;
            frozenMoney = 0;
        } else {
            logAction(`経済危機はあと ${economicCrisisTurns} ターン続きます...`);
        }
    }
  // 新規イベント：大地の隆起
  const hasMountain = map.flat().some(tile => tile.terrain === 'mountain');
  if (!hasMountain && Math.random() < 0.08) { // 8%
      const x = Math.floor(Math.random() * (SIZE - 2)) + 1; // 端を除く (1～14)
      const y = Math.floor(Math.random() * (SIZE - 2)) + 1; // 端を除く (1～14)

      logAction(`島の中央部 (${x},${y}) で大地の隆起が発生しました！`);

      for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
                  const tile = map[ny][nx];

                  // 対象が軍艦の場合 (追加)
                  const targetWarship = warships.find(ship => ship.x === nx && ship.y === ny);
                  if (targetWarship) {
                      warships = warships.filter(ship => ship !== targetWarship);
                      logAction(`隆起に巻き込まれ、軍艦「${targetWarship.name}」が破壊されました！`);
                  }
                  if (tile.facility === 'house') {
                      population -= tile.pop;
                      if (population < 0) population = 0;
                  }
                  
                  if (dx === 0 && dy === 0) {
                      tile.terrain = 'mountain'; // 山になる
                      tile.facility = null;
                      tile.pop = 0;
                      tile.enhanced = false;
                      logAction(`(${nx},${ny}) が山になりました。`);
                  } else {
                      if (tile.terrain !== 'sea' && tile.terrain !== 'mountain') { // 海と山以外
                          tile.terrain = 'waste';
                          tile.facility = null;
                          tile.pop = 0;
                          tile.enhanced = false;
                      }
                  }
              }
          }
      }
  }
  // 新規イベント：火山の噴火
  if (volcanoTurns === 0 && hasMountain && food >= 500000 && turn >= 500 && Math.random() < 0.01) { // 1%
      volcanoTurns = 12;
      logAction(`火山が噴火しました！ ${volcanoTurns}ターンの間、降灰により農場の生産と人口増加が停止します！`);
  }
  // 台風イベント
  if (Math.random() < 0.035) { // 台風発生確率
    logAction(`島に台風が上陸‼`)
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const tile = map[y][x];
        if (tile.facility === 'farm') {
          // 防衛施設による保護をチェック
          if (getProtectingDefenseFacility(x, y)) {
              continue;
          }

          let forestCount = 0;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && map[ny][nx].terrain === 'forest') {
                forestCount++;
              }
            }
          }
          let destroyChance = (8 - forestCount / 12) / 2;
          if (tile.enhanced) {
              destroyChance /= 2; // 強化農場は破壊確率が半分
          }

          if (Math.random() < destroyChance / 10) {
            tile.terrain = 'plain';
            tile.facility = null;
            tile.enhanced = false;
            logAction(`(${x},${y})の農場は台風により吹き飛ばされました。`);
          }
        }
      }
    }
  }
if (turn >= 1000 && Math.random() < 0.001) { // 0.1% = 0.001
    logAction(`巨大地震が発生しました！島全体に甚大な被害が予想されます！`);
    earthquakeEffect();
}
  // 隕石イベント（1.8%）
  if (Math.random() < 0.018) {
    const x = Math.floor(Math.random() * SIZE);
    const y = Math.floor(Math.random() * SIZE);

    const protectingFacility = getProtectingDefenseFacility(x, y); // 変更点

    const tile = map[y][x];
    const label = tile.facility ? (tile.facility === 'farm' ? '農場' : tile.facility === 'factory' ? '工場' : '住宅') : tile.terrain;
    const targetWarship = warships.find(ship => ship.x === x && ship.y === y);
    if (targetWarship) {
        if (targetWarship.isDispatched) {
            logAction(`派遣中の軍艦「${targetWarship.name}」への隕石衝突は無効でした。`);
        } else {
            targetWarship.currentDurability -= 35;
            if (targetWarship.currentDurability <= 0) {
                warships = warships.filter(ship => ship !== targetWarship);
                logAction(`隕石により軍艦「${targetWarship.name}」が砕け散りました…`);
            } else {
                logAction(`隕石が軍艦「${targetWarship.name}」に命中、甚大な被害が出ました。 (残り耐久: ${targetWarship.currentDurability})`);
                checkAbnormalityOnDamage(targetWarship, damage);
            }
        }
    } else if (protectingFacility) {
        protectingFacility.facility = null; // 防衛施設を破壊
        protectingFacility.terrain = 'waste'; // 防衛施設の場所を荒地にする
        protectingFacility.enhanced = false; // 強化状態もリセット
        logAction(`(${x},${y}) に隕石が落下しましたが、防衛施設が防御に成功しました。`);
        logAction(`防衛施設は職務を全うしました。`);
    }else {
        if (tile.facility === 'house') {
            population -= tile.pop;
            if (population < 0) population = 0;
        }

        tile.terrain = 'sea';
        tile.facility = null;
        tile.pop = 0;
        tile.enhanced = false;
        logAction(`島に隕石が落下‼`)
        logAction(`(${x},${y})の${label}に隕石が落下しました。`);
    }
  }
  if (food < 0) {
    logAction(`島の食料が不足しています‼`)
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const tile = map[y][x];
        if (tile.facility === 'house') {
          const lost = Math.floor(Math.random() * 201 + 300);
          tile.pop -= lost;
          population -= lost; // 人口を即時反映
          if (population < 0) population = 0;
          if (tile.pop <= 0) {
            tile.terrain = 'waste';
            tile.facility = null;
            tile.pop = 0;
            tile.enhanced = false; // 強化状態もリセット
            logAction(`(${x},${y})の住宅は廃墟となりました。`);
          }
        }
      }
    }
    const destroyChance = 0.05;
    if (Math.random() < destroyChance) {
      const allTargets = [];
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const tile = map[y][x];
          if (tile.facility === 'farm' || tile.facility === 'factory') {
            allTargets.push({ x, y });
          }
        }
      }
      if (allTargets.length > 0) {
        const { x, y } = allTargets[Math.floor(Math.random() * allTargets.length)];
        const label = map[y][x].facility === 'farm' ? '農場' : '工場';
        map[y][x].terrain = 'waste';
        map[y][x].facility = null;
        map[y][x].enhanced = false;
        logAction(`(${x},${y})の${label}で食料不足により住民が殺到、崩壊しました。`);
      }
    }
  }
  if (food < 0) food = 0;

  // 1. 出現候補地 (住宅) をリストアップ
  const spawnCandidates = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = map[y][x];
      // 住宅であり、かつ他の怪獣がいない場所
      if (tile.facility === 'house' && !monsters.find(m => m.x === x && m.y === y)) {
        spawnCandidates.push({ x, y });
      }
    }
  }
  if (spawnCandidates.length > 0) {
      // 2. 出現判定 (種類ごと)
      for (const typeId in MONSTER_TYPES) {
          const type = MONSTER_TYPES[typeId];
          
          // 3. 出現条件チェック (人口) と確率 (1%)
          if (type.condition(population, turn) && Math.random() < 0.01) {
              
              // 4. 出現場所の決定 (候補地からランダム)
              if (spawnCandidates.length === 0) break; 
              const spawnIndex = Math.floor(Math.random() * spawnCandidates.length);
              const spawn = spawnCandidates[spawnIndex];
              
              // 5. 体力(HP)の決定
              const hp = Math.floor(Math.random() * (type.maxHP - type.minHP + 1)) + type.minHP;

              // 6. 怪獣オブジェクトの生成
              const newMonster = { 
                  x: spawn.x, 
                  y: spawn.y, 
                  typeId: parseInt(typeId),
                  hp: hp
              };
              monsters.push(newMonster);

              // 7. 出現場所の破壊
              const spawnedTile = map[spawn.y][spawn.x];
              if (spawnedTile.facility === 'house') {
                  population -= spawnedTile.pop;
                  if (population < 0) population = 0;
              }
              spawnedTile.terrain = 'waste';
              spawnedTile.facility = null;
              spawnedTile.pop = 0;
              spawnedTile.enhanced = false; 
              
              logAction(`(${spawn.x},${spawn.y}) に ${type.name} (体力: ${hp}) が出現‼`);
              
              // 8. 出現した場所を候補地から削除
              spawnCandidates.splice(spawnIndex, 1);
          }
      }
  }

// 怪獣の移動と能力
  const monstersThisTurn = [...monsters]; 
  
  for (const monster of monstersThisTurn) {
      // (もし討伐されて配列から消えていたらスキップ)
      if (!monsters.includes(monster)) continue; 
      
      const monsterType = MONSTER_TYPES[monster.typeId];
      if (!monsterType) continue; // 不明な怪獣はスキップ
      if (monsterType.moneyPerTurn && monsterType.moneyPerTurn > 0) {
          moneyChange += monsterType.moneyPerTurn;
          logAction(`${monsterType.name} が${monsterType.moneyPerTurn}Gを生産しました。`);
      }

      // 1. 移動処理 (アエロガロスは特別)
      let moveCount = 1;
      if (monsterType.ability === 'multiMove') {
          moveCount = Math.floor(Math.random() * 11); // 0～10回
          if (moveCount > 0) {
              logAction(`${monsterType.name} は ${moveCount} 回移動する！`);
          }
      } else if (monsterType.ability === 'kingMonster') {
          moveCount = 0;
      }

      for (let i = 0; i < moveCount; i++) {
          // (再度、討伐チェック)
          if (!monsters.includes(monster)) break; 
          
          const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
          ];
          const possible = directions.filter(({ dx, dy }) => {
            const nx = monster.x + dx;
            const ny = monster.y + dy;
            return nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && 
                   map[ny][nx].terrain !== 'sea' && // 陸地のみ
                   !monsters.find(m => m.x === nx && m.y === ny); // 他の怪獣がいない
          });

          if (possible.length > 0) {
            const { dx, dy } = possible[Math.floor(Math.random() * possible.length)];
            const nx = monster.x + dx;
            const ny = monster.y + dy;
            const targetTile = map[ny][nx];
            
            // (防衛施設破壊ロジックは共通)
            const protectingFacility = getProtectingDefenseFacility(nx, ny);
            if (protectingFacility) {
                protectingFacility.facility = null;
                protectingFacility.terrain = 'waste';
                protectingFacility.enhanced = false;
                logAction(`${monsterType.name}によって (${nx},${ny}) を守っていた防衛施設が破壊されました！`);
            }

            if (targetTile.facility === 'house') {
              population -= targetTile.pop;
              if (population < 0) population = 0;
            }
            targetTile.terrain = 'waste';
            targetTile.facility = null;
            targetTile.pop = 0;
            targetTile.enhanced = false; 

            logAction(`${monsterType.name} が (${nx},${ny}) を踏み荒らしました。`);
            monster.x = nx;
            monster.y = ny;
          }
      } // (multiMove ループ終わり)
      
      // (再度、討伐チェック)
      if (!monsters.includes(monster)) continue; 

      // 2. 特殊能力の処理
      if (monsterType.ability === 'destroyArea' && Math.random() < 0.10) { // ヴォルカガロス (10%)
          logAction(`${monsterType.name} が周囲の陸地を破壊！`);
          for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                  if (dx === 0 && dy === 0) continue;
                  const nx = monster.x + dx;
                  const ny = monster.y + dy;
                  if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
                      const tile = map[ny][nx];
                      if (tile.terrain !== 'sea' && !monsters.find(m => m.x === nx && m.y === ny)) { // 海と他の怪獣以外
                          if (tile.facility === 'house') {
                              population -= tile.pop;
                              if (population < 0) population = 0;
                          }
                          tile.terrain = 'waste';
                          tile.facility = null;
                          tile.pop = 0;
                          tile.enhanced = false;
                      }
                  }
              }
          }
      } 
      else if (monsterType.ability === 'landfillSea' && Math.random() < 0.15) { // テラガロス (15%)
          // 荒地にする海（軍艦含む）を探す
          const seaTiles = [];
          for (let y = 0; y < SIZE; y++) {
              for (let x = 0; x < SIZE; x++) {
                  if (map[y][x].terrain === 'sea') {
                      seaTiles.push({ x, y });
                  }
              }
          }
          if (seaTiles.length > 0) {
              const { x, y } = seaTiles[Math.floor(Math.random() * seaTiles.length)];
              const targetWarship = warships.find(ship => ship.x === x && ship.y === y);
              
              if (targetWarship && targetWarship.currentDurability > 0 && !targetWarship.isDispatched) {
                  logAction(`${monsterType.name} が (${x},${y}) の海を埋め立てようとし、軍艦「${targetWarship.name}」に10ダメージ！`);
                  targetWarship.currentDurability -= 10;
                  checkAbnormalityOnDamage(targetWarship, 10);
                  if (targetWarship.currentDurability <= 0) {
                      targetWarship.currentDurability = 0;
                      targetWarship.currentFuel = 0;
                      targetWarship.currentAmmo = 0;
                      logAction(`軍艦 ${targetWarship.name} は撃沈しました！`);
                  }
              } else {
                  logAction(`${monsterType.name} が (${x},${y}) の海を荒地に変えました！`);
                  map[y][x].terrain = 'waste';
                  map[y][x].facility = null;
                  map[y][x].enhanced = false;
              }
          }
      }
      else if (monsterType.ability === 'createSea') { // アクアガロス (毎ターン)
          // 陸地タイルを探す (自分自身と他の怪獣、山、石碑を除く)
          const landTiles = [];
          for (let y = 0; y < SIZE; y++) {
              for (let x = 0; x < SIZE; x++) {
                  const tile = map[y][x];
                  if (tile.terrain !== 'sea' && tile.terrain !== 'mountain' && tile.facility !== 'Monument' &&
                      !(monster.x === x && monster.y === y) && 
                      !monsters.find(m => m !== monster && m.x === x && m.y === y)) 
                  {
                      landTiles.push({ x, y });
                  }
              }
          }
          if (landTiles.length > 0) {
              const { x, y } = landTiles[Math.floor(Math.random() * landTiles.length)];
              const tile = map[y][x];
              const facilityNameMap = {
                  farm: '農場',
                  house: '住宅',
                  factory: '工場',
                  gun: '砲台',
                  port: '港',
                  defenseFacility: '防衛施設',
                  Monument: '石碑',
                  oilRig: '海底油田'
              };
              const facilityName = tile.facility ? (facilityNameMap[tile.facility] || tile.facility) : tile.terrain;
              logAction(`${monsterType.name} が (${x},${y}) の${facilityName}を海に変えました！`);
              if (tile.facility === 'house') {
                  population -= tile.pop;
                  if (population < 0) population = 0;
              }
              tile.terrain = 'sea';
              tile.facility = null;
              tile.pop = 0;
              tile.enhanced = false;
          }
      }
      else if (monsterType.ability === 'kingMonster') {
          const kingAction = Math.floor(Math.random() * 6) + 1;
          if (kingAction === 1) {
              const militaryTiles = [];
              for (let yy = 0; yy < SIZE; yy++) {
                  for (let xx = 0; xx < SIZE; xx++) {
                      if (map[yy][xx].facility === 'gun' || map[yy][xx].facility === 'defenseFacility') {
                          militaryTiles.push({ x: xx, y: yy });
                      }
                  }
              }
              if (militaryTiles.length > 0) {
                  const first = militaryTiles[Math.floor(Math.random() * militaryTiles.length)];
                  const queue = [first];
                  const visited = new Set();
                  while (queue.length > 0) {
                      const current = queue.shift();
                      const key = `${current.x},${current.y}`;
                      if (visited.has(key)) continue;
                      visited.add(key);
                      const chainedTargets = [];
                      for (let dx = -1; dx <= 1; dx++) {
                          for (let dy = -1; dy <= 1; dy++) {
                              const nx = current.x + dx;
                              const ny = current.y + dy;
                              if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
                              if (map[ny][nx].facility === 'gun' || map[ny][nx].facility === 'defenseFacility') {
                                  chainedTargets.push({ x: nx, y: ny });
                              }
                          }
                      }
                      triggerMilitaryFacilitySelfDestruct(current.x, current.y, `${monsterType.name}の能力`);
                      queue.push(...chainedTargets);
                  }
              } else {
                  logAction(`${monsterType.name} は軍事施設自爆を試みましたが、対象がありませんでした。`);
              }
          } else if (kingAction === 2) {
              const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
              const dir = directions[Math.floor(Math.random() * directions.length)];
              let nx = monster.x + dir.dx;
              let ny = monster.y + dir.dy;
              while (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
                  applyKingMonsterTileDestruction(nx, ny, `${monsterType.name}が直進破壊: (${nx},${ny})`);
                  monster.x = nx;
                  monster.y = ny;
                  nx += dir.dx;
                  ny += dir.dy;
              }
              logAction(`${monsterType.name} は限界まで直進しました。`);
          } else if (kingAction === 3) {
              logAction(`${monsterType.name} が地震/津波を発生させた！`);
              earthquakeEffect([{ x: monster.x, y: monster.y }]);
          } else if (kingAction === 4) {
              const steps = Math.floor(Math.random() * 21) + 5;
              const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
              for (let s = 0; s < steps; s++) {
                  const dir = directions[Math.floor(Math.random() * directions.length)];
                  const nx = monster.x + dir.dx;
                  const ny = monster.y + dir.dy;
                  if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
                  applyKingMonsterTileDestruction(nx, ny, `${monsterType.name}が移動破壊: (${nx},${ny})`);
                  monster.x = nx;
                  monster.y = ny;
              }
              logAction(`${monsterType.name} はランダムに ${steps} マス移動しました。`);
          } else if (kingAction === 5) {
              const adjacentWarships = warships.filter(ship =>
                  ship.currentDurability > 0 &&
                  !ship.isDispatched &&
                  Math.max(Math.abs(ship.x - monster.x), Math.abs(ship.y - monster.y)) === 1
              );
              if (adjacentWarships.length > 0) {
                  const target = adjacentWarships[Math.floor(Math.random() * adjacentWarships.length)];
                  const useRoar = Math.random() < 0.5;
                  const damage = useRoar ? 14 : 21;
                  target.currentDurability -= damage;
                  checkAbnormalityOnDamage(target, damage);
                  logAction(`${monsterType.name}の${useRoar ? '咆哮' : '巨大な拳'}！軍艦 ${target.name} に ${damage} ダメージ。`);
                  if (target.currentDurability <= 0) {
                      target.currentDurability = 0;
                      target.currentFuel = 0;
                      target.currentAmmo = 0;
                      logAction(`軍艦 ${target.name} は${monsterType.name}の攻撃で撃沈しました。`);
                  }
              } else {
                  logAction(`${monsterType.name} は隣接する軍艦を探したが見つからなかった。`);
              }
          } else if (kingAction === 6) {
              for (let yy = 0; yy < SIZE; yy++) {
                  if (yy === monster.y) continue;
                  const tile = map[yy][monster.x];
                  if (tile.terrain !== 'sea') {
                      if (tile.facility === 'house') {
                          population -= tile.pop;
                          if (population < 0) population = 0;
                      }
                      tile.terrain = 'waste';
                      tile.facility = null;
                      tile.pop = 0;
                      tile.enhanced = false;
                  }
              }
              for (let xx = 0; xx < SIZE; xx++) {
                  if (xx === monster.x) continue;
                  const tile = map[monster.y][xx];
                  if (tile.terrain !== 'sea') {
                      if (tile.facility === 'house') {
                          population -= tile.pop;
                          if (population < 0) population = 0;
                      }
                      tile.terrain = 'waste';
                      tile.facility = null;
                      tile.pop = 0;
                      tile.enhanced = false;
                  }
              }
              logAction(`${monsterType.name} の衝撃で縦横の陸地が荒地化しました。`);
          }
      }
  }

let gunCount = 0;
let enhancedGunCount = 0;
let defenseFacilityCount = 0;
let portCount = 0;
// マップ上の施設数をカウント
map.forEach(row => {
    row.forEach(tile => {
        if (tile.facility === 'gun') {
            gunCount++;
            if (tile.enhanced) enhancedGunCount++;
        }
        else if (tile.facility === 'defenseFacility') defenseFacilityCount++;
        else if (tile.facility === 'port') portCount++;
    });
});
// 沈没していない軍艦（currentDurability > 0）の数をカウント
const activeWarshipCount = warships.filter(ship => ship.currentDurability > 0).length;
const facilityMaintenance = (gunCount * 600) + (enhancedGunCount * 600) + (defenseFacilityCount * 2000) + (portCount * 2500);
const warshipMaintenance = activeWarshipCount * 20000;
let maintenanceCost = facilityMaintenance + warshipMaintenance;
let maintenanceMultiplier = 1;
if (economicCrisisTurns > 0) {
    maintenanceMultiplier = 12; // 経済危機中は維持費12倍
}
const actualMaintenanceCost = maintenanceCost * maintenanceMultiplier;
if (actualMaintenanceCost > 0) {
    money -= actualMaintenanceCost;
    let logMsg = `維持費 ${actualMaintenanceCost}G を資金から差し引きました。（砲台:${gunCount}（高効率:${enhancedGunCount}）、防衛施設:${defenseFacilityCount}、港:${portCount}、軍艦:${activeWarshipCount}）`;
    if (maintenanceMultiplier > 1) {
        logMsg += ` (経済危機により${maintenanceMultiplier}倍)`;
    }
    logAction(logMsg);
    // 資金がマイナスになった場合は0に置き換える
    if (money < 0) {
        money = 0;
        logAction('資金不足により維持が困難になっています！');
    }
}
  evaluateWarshipMedals();
  saveMyIslandState(); // ターン終了後、自分の島の状態を保存
  updateStatus();
  renderActionQueue()
  const populationChange = population - prevPopulation; // 人口の増減を計算
  logAction(`資金収支: ${moneyChange+totalOilRigIncome - actualMaintenanceCost}G, 食料: ${foodChange >= 0 ? '+' : ''}${foodChange}, 人口変化: ${populationChange >= 0 ? '+' : ''}${populationChange}`);
  renderMap();
}
/**
 * 地震・津波の効果を処理する
 * 1. 地震効果 (ランダムな陸地タイル5〜12個の荒地化)
 * 2. 津波効果 (沿岸タイルの荒地化/海化、港・油田の破壊、軍艦へのダメージ)
 */
function earthquakeEffect(excludedCoords = []) {
    const excludedSet = new Set((excludedCoords || []).map(c => `${c.x},${c.y}`));
    // ------------------------------------
    // 1. 地震効果 (陸地タイルの荒地化)
    // ------------------------------------
    const affectedTiles = []; 
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const tile = map[y][x];
            // 陸地タイルかつ石碑ではないことを確認
            if (tile.terrain !== 'sea' && tile.facility !== 'Monument' && !excludedSet.has(`${x},${y}`)) {
                affectedTiles.push({ x, y });
            }
        }
    }

    const numToDestroy = Math.floor(Math.random() * 8) + 5; // 5から12
    affectedTiles.sort(() => 0.5 - Math.random()); // ランダムにシャッフル
    const landDestroyed = affectedTiles.slice(0, numToDestroy);

    landDestroyed.forEach(({ x, y }) => {
        const tile = map[y][x];
        
        if (tile.facility === 'house') {
            population -= tile.pop;
            if (population < 0) population = 0;
            logAction(`(${x},${y})の住宅が地震により破壊されました。`);
        } else {
            logAction(`(${x},${y})の${tile.facility || tile.terrain}が地震により破壊され荒地になりました。`);
        }

        tile.terrain = 'waste';
        tile.facility = null;
        tile.pop = 0;
        tile.enhanced = false;
    });

    if (landDestroyed.length > 0) {
        logAction(`地震により ${landDestroyed.length} 個の陸地タイルが荒地になりました。`);
    } else {
        logAction(`地震による陸地の直接的な被害はありませんでした。`);
    }

    logAction(`津波が島に押し寄せます...`);

    // ------------------------------------
    // 2. 津波効果
    // ------------------------------------
    let portsDestroyed = 0;
    let oilRigsDestroyed = 0;
    let totalTilesAffected = 0;

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const tile = map[y][x];
            if (excludedSet.has(`${x},${y}`)) continue;
            if (tile.facility === 'Monument') continue; // 石碑は例外

            // 海または最外周に隣接する陸地タイルかどうかを判定する
            const isLand = tile.terrain !== 'sea';
            let isAdjacentToSea = false;
            
            // 周囲8マスに海があるかをチェック
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && map[ny][nx].terrain === 'sea') {
                        isAdjacentToSea = true;
                        break;
                    }
                }
                if (isAdjacentToSea) break;
            }

            // A. 油田と港の破壊 (海タイルでも隣接陸地タイルでも全て破壊)
            if (tile.facility === 'oilRig' || tile.facility === 'port') {
                 // 既に津波で破壊される対象なので、以降のランダム破壊は無視される
            } else if (!isLand || !isAdjacentToSea) {
                // 陸地でなく、かつ海に隣接していない陸地でもない（つまり内陸の陸地、または内陸の海）は対象外
                continue;
            }

            // 破壊処理
            if (tile.facility === 'oilRig' || tile.facility === 'port') {
                if (tile.facility === 'oilRig') oilRigsDestroyed++;
                if (tile.facility === 'port') portsDestroyed++;
                logAction(`津波により (${x},${y}) の${tile.facility === 'oilRig' ? '油田' : '港'}が破壊され海になりました。`);
                tile.terrain = 'sea';
                tile.facility = null;
                tile.pop = 0;
                tile.enhanced = false;
                totalTilesAffected++;
            } else if (isAdjacentToSea) { // 海に隣接する陸地タイルに対するランダム破壊
                const r = Math.random();
                if (r < 0.30) { // 30%の確率で荒地
                    if (tile.facility === 'house') {
                        population -= tile.pop;
                        if (population < 0) population = 0;
                        logAction(`津波により (${x},${y})の住宅が破壊され荒地になりました。`);
                    } else {
                        logAction(`津波により (${x},${y})の${tile.facility || tile.terrain}が荒地になりました。`);
                    }
                    tile.terrain = 'waste';
                    tile.facility = null;
                    tile.pop = 0;
                    tile.enhanced = false;
                    totalTilesAffected++;
                } else if (r < 0.30 + 0.20) { // 20%の確率で海
                    if (tile.facility === 'house') {
                        population -= tile.pop;
                        if (population < 0) population = 0;
                        logAction(`津波により (${x},${y})の住宅が破壊され海になりました。`);
                    } else {
                        logAction(`津波により (${x},${y})の${tile.facility || tile.terrain}が海になりました。`);
                    }
                    tile.terrain = 'sea';
                    tile.facility = null;
                    tile.pop = 0;
                    tile.enhanced = false;
                    totalTilesAffected++;
                }
            }
        }
    }
    
    // 滞在中の軍艦へのダメージ
    warships.forEach(ship => {
        // 自島にいて、沈没しておらず、派遣中でない船
        if (ship.homePort === islandName && ship.currentDurability > 0 && !ship.isDispatched) {
            const damage = 2;
            ship.currentDurability -= damage;
            checkAbnormalityOnDamage(ship, damage);
            logAction(`津波により軍艦 ${ship.name} が ${damage} ダメージを受けました。`);
            if (ship.currentDurability <= 0) {
                ship.currentDurability = 0;
                logAction(`軍艦 ${ship.name} は津波により沈没しました。`);
            }
        }
    });

    if (totalTilesAffected > 0 || portsDestroyed > 0 || oilRigsDestroyed > 0) {
        logAction(`津波により沿岸部 ${totalTilesAffected} マスに被害が発生しました。（港 ${portsDestroyed}、油田 ${oilRigsDestroyed} を含む）`);
    } else {
         logAction(`津波はありましたが、沿岸部への被害はありませんでした。`);
    }
}
function getMonumentLevel() {
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const tile = map[y][x];
            // 石碑が存在し、レベルが設定されているか確認
            if (tile.facility === 'Monument' && tile.MonumentLevel > 0) {
                return tile.MonumentLevel;
            }
        }
    }
    return 0;
}

/**
 * 条件に合うタイルに計画を一括登録する関数
 * @param {string} action - 計画するアクションID (例: 'enhanceFacility', 'flatten', 'dig')
 * @param {string} targetTerrain - 対象の地形ID (例: 'plain', 'forest', 'waste')
 * @param {string|null} targetFacility - 対象の施設ID (例: 'farm', 'factory', なしの場合は null)
 */
function addBulkPlans(action, targetTerrain, targetFacility) {
    // 他の島を表示中は実行不可にする
    if (typeof isViewingOtherIsland !== 'undefined' && isViewingOtherIsland) {
        logAction("他の島の表示中は計画を追加できません。");
        return;
    }
    const MAX_QUEUE_SIZE = 20; // 計画キューの最大値
    let addedCount = 0;
    const keepOption = document.getElementById('keepOptionSelected')?.checked || false;
    // マップ全体(16x16)をループ
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            // キューが上限に達していたら終了
            if (actionQueue.length >= MAX_QUEUE_SIZE) {
                logAction("計画キューが上限（20件）に達したため、一括登録を終了します。");
                finalizeBulkAction(addedCount);
                return;
            }
            const tile = map[y][x];
            // 地形と施設が引数と一致するか判定
            if (tile.terrain === targetTerrain && tile.facility === targetFacility) {
                // 計画をキューに追加
                actionQueue.push({ 
                    x: x, 
                    y: y, 
                    action: action, 
                    keepSelected: keepOption 
                });

                // ログ表示（既存の関数を利用）
                const actionInfo = getActionName(action, x, y);
                logAction(`(${x},${y}) に ${actionInfo.name} を計画しました`);
                addedCount++;
            }
        }
    }
    if (addedCount === 0) {
        logAction("条件に一致するタイルが見つかりませんでした。");
    } else {
        finalizeBulkAction(addedCount);
    }
    // UI更新とセーブ
    function finalizeBulkAction(count) {
        renderActionQueue(); // 計画リストの表示更新
        updateConfirmButton(); // UI状態の更新
        if (typeof saveMyIslandState === 'function') {
            saveMyIslandState(); // 状態を保存
        }
        logAction(`一括登録完了: 合計 ${count} 件の計画を追加しました。`);
    }
}

// セーブ機能
window.saveGame = function() {
    islandName = document.getElementById('islandNameInput').value; // UIから名前を取得
    saveMyIslandState(); // 自分の島の最新の状態を保存

    const gameState = {
        map: myIslandState.map,
        money: myIslandState.money,
        food: myIslandState.food,
        population: myIslandState.population,
        turn: myIslandState.turn,
        achievementPoints : myIslandState.achievementPoints,
        tutorialMissions : myIslandState.tutorialMissions,
        islandName: myIslandState.islandName,
        monster: myIslandState.monster,
        actionQueue: myIslandState.actionQueue,
        warships: myIslandState.warships,
        economicCrisisTurns: myIslandState.economicCrisisTurns,
        frozenMoney: myIslandState.frozenMoney,
        volcanoTurns: myIslandState.volcanoTurns
    };
    const jsonString = JSON.stringify(gameState);

    // 文字列をUnicodeコードポイントの配列に変換し、カンマ区切りで結合
    const encodedData = Array.from(jsonString).map(char => char.charCodeAt(0)).join(',');

    document.getElementById('saveLoadData').value = encodedData;
    logAction("ゲームがセーブデータとして出力されました。テキストエリアからコピーしてください。");
    updateStatus(); // 島の名前の変更をUIに反映
}

// ロード機能
window.loadGame = function() {
    const encodedData = document.getElementById('saveLoadData').value;
    if (!encodedData) {
        logAction("ロードするデータがありません。テキストエリアにデータを貼り付けてください。");
        return;
    }

    try {
        // カンマ区切りの文字列をUnicodeコードポイントの配列に戻し、文字列に変換
        const charCodes = encodedData.split(',').map(Number);
        const jsonString = String.fromCharCode(...charCodes);

        const gameState = JSON.parse(jsonString);
        map = gameState.map;
        money = gameState.money;
        food = gameState.food;
        population = gameState.population;
        turn = gameState.turn;
        achievementPoints = gameState.achievementPoints || 0; // 実績Ptをロード、旧データ対応で0を代入
        tutorialMissions = gameState.tutorialMissions || { // チュートリアルミッションをロード、旧データ対応
            '01': false, '02': false, '03': false, '04': false, '05': false, '06': false, '07': false, '08': false
        };
        islandName = gameState.islandName || "MyIsland";
        monster = gameState.monster;
        actionQueue = gameState.actionQueue || []; // ロード時にactionQueueがない場合に対応
        warships = gameState.warships || []; // 軍艦データをロード
        economicCrisisTurns = gameState.economicCrisisTurns || 0;
        frozenMoney = gameState.frozenMoney || 0;
        volcanoTurns = gameState.volcanoTurns || 0;

        // 過去のセーブデータにenhancedプロパティがない場合のために初期化
        map.forEach(row => row.forEach(tile => {
            if (tile.enhanced === undefined) {
                tile.enhanced = false;
            }
            if (tile.MonumentLevel === undefined) {
                tile.MonumentLevel = 0;
            }
        }));
        // isDispatchedプロパティがない場合の初期化
        warships.forEach(ship => {
            if (ship.isDispatched === undefined) {
                ship.isDispatched = false;
            }
            if (ship.maxFuel === undefined) {
                ship.maxFuel = 100;
            }
            if (ship.abnormality === undefined) { 
                ship.abnormality = null; 
            }
            ensureWarshipFields(ship);
        });

        document.getElementById('islandNameInput').value = islandName; // UIにロードした名前を反映
        isViewingOtherIsland = false; // ロード時は自分の島にいる
        resetWarshipProgressStore(); // 手動ロード時は進捗をリセット
        saveMyIslandState(); // ロードした状態を自分の島の状態として保存
        logAction("ゲームがロードされました。");
        renderMap();
        updateStatus();
        document.getElementById('actionSelect').value = ""; // コマンド選択をリセット
        updateConfirmButton(); // UIを更新
    } catch (e) {
        logAction("セーブデータの読み込みに失敗しました。データが破損しているか、形式が正しくありません。");
        console.error(e);
    }
}
// 初期化時に自分の島の状態をロード（または初期化）する　
window.onload = function() {
    initializeSessionSettings();
    loadMyIslandState(); // まず自分の島をロード/初期化
    updateConfirmButton(); // 初回UI更新
};
