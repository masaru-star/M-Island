export let monster = null;
export const SIZE = 16;
export let money = 2500;
export let food = 1000;
export let population = 0;
export let turn = 0;
export let achievementPoints = 0;
export let tutorialMissions = { '01': false, '02': false, '03': false, '04': false, '05': false, '06': false, '07': false, '08': false };
export let map = [];
export let actionQueue = [];
export let islandName = "MyIsland";
export let warships = [];
export function setMoney(value){ money = value; }
export function changeMoney(value){ money += value; }
export function setFood(value){ food = value; }
export function changeFood(value){ food += value; }
export function setPop(value){ population = value; }
export function setName(value){ islandName = value; }
export function setTurn(value){ turn = value; }
export function setMonster(value){ monster = value; }

export let myIslandState = null; // 自分の島の状態
export let isViewingOtherIsland = false; // 他の島を見ているか
export function setmyIslandState(value){ myIslandState = value; }
export function setisViewingOtherIsland(value){ isViewingOtherIsland = value; }
export const MONSTER_TYPES = {
  1: { name: '怪獣シマオロシ', minHP: 1, maxHP: 1, ability: null, condition: (pop) => pop >= 60000 },
  2: { name: '怪獣ヴォルカガロス', minHP: 2, maxHP: 4, ability: 'destroyArea', condition: (pop) => pop >= 120000 },
  3: { name: '怪獣アエロガロス', minHP: 3, maxHP: 3, ability: 'multiMove', condition: (pop) => pop >= 120000 },
  4: { name: '怪獣テラガロス', minHP: 5, maxHP: 5, ability: 'landfillSea', condition: (pop) => pop >= 150000 },
  5: { name: '怪獣アクアガロス', minHP: 3, maxHP: 5, ability: 'createSea', condition: (pop) => pop >= 150000 }
};
export let economicCrisisTurns = 0; // 経済危機の残ターン
export let frozenMoney = 0; // 経済危機による凍結資金
export let volcanoTurns = 0; // 火山の噴火の残ターン
export const WARSHIP_CAPS = { maxDurability: 30, mainGun: 15, antiAir: 35, maxFuel: 1000, maxAmmo: 1200 }; // 軍艦の色変化条件
