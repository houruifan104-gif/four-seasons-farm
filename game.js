const TEST_MODE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('test');
const ORIGINAL_CARD_CATALOG = typeof window !== 'undefined' ? window.ORIGINAL_CARD_CATALOG || [] : [];
const SAVE_KEY = TEST_MODE ? 'four-seasons-farm-v2-test' : 'four-seasons-farm-v2';
const LEGACY_SAVE_KEY = 'four-seasons-farm-v1';
const SEEN_KEY = TEST_MODE ? 'four-seasons-seen-rules-test' : 'four-seasons-seen-rules';
const HARVEST_ROUNDS = [4, 7, 9, 11, 13, 14];
const RESOURCES = [
  ['food', '食物', '🥖'], ['wood', '木材', '🪵'], ['clay', '黏土', '🧱'],
  ['reed', '芦苇', '🌾'], ['stone', '石料', '🪨'], ['grain', '谷种', '🌱'],
  ['veg', '菜种', '🥕'], ['sheep', '羊', '🐑'], ['boar', '猪', '🐗'], ['cattle', '牛', '🐄'],
  ['fuel', '燃料', '♨️'], ['horse', '马', '🐎']
];
const ANIMALS = { sheep: '羊', boar: '猪', cattle: '牛', horse: '马' };
const SEASONS = [
  { name: '春', icon: '🌱', note: '木材堆 −1，石料堆 +1；围牧场优惠；季节行动可繁殖并播种' },
  { name: '夏', icon: '☀️', note: '黏土堆 +1，石料堆 −1，捕鱼 +1；临时劳作送谷种；收获免供暖' },
  { name: '秋', icon: '🍂', note: '木材堆、芦苇堆各 +1；季节行动可收田并取蔬菜' },
  { name: '冬', icon: '❄️', note: '黏土堆、芦苇堆各 −1；第 11 轮前禁捕鱼；开田需食物' }
];
const SEASON_ACTIONS = [
  { id: 'seasonSpring', name: '春日耕育', icon: '🌱', detail: '牲畜繁殖，可同时播种', unlock: 1, kind: 'choice' },
  { id: 'seasonSummer', name: '夏日劳作', icon: '☀️', detail: '开田，可同时烤面包或卖谷种', unlock: 1, kind: 'choice' },
  { id: 'seasonAutumn', name: '秋日采收', icon: '🍂', detail: '田地收获，并获得 1 菜种', unlock: 1, kind: 'simple' },
  { id: 'seasonWinter', name: '冬日扩员', icon: '❄️', detail: '花 2 木材及剩余收获次数的食物，无房扩员', unlock: 1, kind: 'simple' }
];
const DEFAULT_SETTINGS = { players: 2, moor: true, cards: true, seasons: false, aliens: false };
const ACTIONS = [
  { id: 'wood', name: '林地', icon: '🌲', detail: '每轮累积 3 木材', unlock: 1, kind: 'pile', key: 'wood', add: 3 },
  { id: 'clay', name: '黏土坑', icon: '🧱', detail: '每轮累积 1 黏土', unlock: 1, kind: 'pile', key: 'clay', add: 1 },
  { id: 'reed', name: '河岸', icon: '🌿', detail: '每轮累积 1 芦苇', unlock: 1, kind: 'pile', key: 'reed', add: 1 },
  { id: 'fish', name: '捕鱼', icon: '🐟', detail: '每轮累积 1 食物', unlock: 1, kind: 'pile', key: 'food', add: 1 },
  { id: 'grain', name: '谷物种子', icon: '🌱', detail: '获得 1 谷种', unlock: 1, kind: 'simple' },
  { id: 'plow', name: '开垦田地', icon: '⚒', detail: '选 1 空地开垦', unlock: 1, kind: 'target' },
  { id: 'day', name: '临时劳作', icon: '🧺', detail: '获得 2 食物', unlock: 1, kind: 'simple' },
  { id: 'sow', name: '播种', icon: '🌻', detail: '选田地种谷或菜', unlock: 1, kind: 'target' },
  { id: 'sheep', name: '羊群', icon: '🐑', detail: '每轮累积 1 羊', unlock: 1, kind: 'pile', key: 'sheep', add: 1 },
  { id: 'pasture', name: '围建牧场', icon: '♧', detail: '花 2 木材，选空地', unlock: 2, kind: 'target' },
  { id: 'hearth', name: '建造灶台', icon: '🔥', detail: '花 2 黏土，可烹饪牲畜', unlock: 3, kind: 'simple' },
  { id: 'first', name: '村庄集会', icon: '🏳', detail: '得 1 食物，下轮先手', unlock: 4, kind: 'simple' },
  { id: 'stone', name: '采石场', icon: '🪨', detail: '每轮累积 1 石料', unlock: 5, kind: 'pile', key: 'stone', add: 1 },
  { id: 'room', name: '扩建房屋', icon: '🏠', detail: '花 5 木材、2 芦苇', unlock: 5, kind: 'target' },
  { id: 'grow', name: '家庭扩员', icon: '👪', detail: '须有空房，最多 5 人', unlock: 5, kind: 'simple' },
  { id: 'veg', name: '蔬菜种子', icon: '🥕', detail: '获得 1 菜种', unlock: 7, kind: 'simple' },
  { id: 'boar', name: '野猪群', icon: '🐗', detail: '每轮累积 1 猪', unlock: 8, kind: 'pile', key: 'boar', add: 1 },
  { id: 'cattle', name: '牛群', icon: '🐄', detail: '每轮累积 1 牛', unlock: 10, kind: 'pile', key: 'cattle', add: 1 }
];
const EXTRA_ACTIONS = [
  { id: 'lessons', name: '学习职业', icon: '📖', detail: '打出 1 张职业牌', unlock: 1, kind: 'choice', cards: true },
  { id: 'major', name: '主要发展', icon: '🏛', detail: '建造 1 张公共主要发展卡', unlock: 1, kind: 'choice', cards: true },
  { id: 'minor', name: '小型设施', icon: '🛠', detail: '建造 1 张小设施', unlock: 2, kind: 'choice', cards: true },
  { id: 'copse', name: '小树林', icon: '🌳', detail: '每轮累积 1 木材', unlock: 1, kind: 'pile', key: 'wood', add: 1, minPlayers: 5 },
  { id: 'riverbankForest', name: '河岸林', icon: '🌲', detail: '每轮累积 1 木材，另得 1 芦苇', unlock: 1, kind: 'pile', key: 'wood', add: 1, minPlayers: 5 },
  { id: 'grove', name: '树林', icon: '🌳', detail: '每轮累积 2 木材', unlock: 1, kind: 'pile', key: 'wood', add: 2, minPlayers: 5 },
  { id: 'hollow', name: '土坑', icon: '🟤', detail: '每轮累积 3 黏土', unlock: 1, kind: 'pile', key: 'clay', add: 3, minPlayers: 5 },
  { id: 'travelers', name: '旅人', icon: '🚶', detail: '每轮累积 1 食物', unlock: 1, kind: 'pile', key: 'food', add: 1, minPlayers: 5 },
  { id: 'market', name: '资源市场', icon: '🛒', detail: '得木材、芦苇、石料各 1', unlock: 1, kind: 'simple', minPlayers: 5 },
  { id: 'animalMarket', name: '牲畜市场', icon: '🐾', detail: '选择 1 种牲畜', unlock: 1, kind: 'choice', minPlayers: 5 },
  { id: 'resourceTrade', name: '资源交易', icon: '⚖', detail: '得 1 食物、任选 2 建材', unlock: 1, kind: 'choice', minPlayers: 6 },
  { id: 'corral', name: '畜栏', icon: '🐑', detail: '得缺少的第一种牲畜', unlock: 1, kind: 'simple', minPlayers: 6 },
  { id: 'farmSupplies', name: '农具补给', icon: '🧰', detail: '花 1 食物开田或买谷种', unlock: 1, kind: 'choice', minPlayers: 6 },
  { id: 'sideJob', name: '副业', icon: '🔨', detail: '花 1 木材建 1 座牲畜棚', unlock: 1, kind: 'choice', minPlayers: 6 },
  { id: 'minor6', name: '额外小设施', icon: '🛠', detail: '建造 1 张小设施', unlock: 1, kind: 'choice', minPlayers: 6, cards: true },
  { id: 'infirmary', name: '医务所', icon: '✚', detail: '病人必须来此，得 1 食物', unlock: 1, kind: 'simple', moor: true, repeatable: true },
  { id: 'upgradeClay', name: '黏土房', icon: '🏚', detail: '整栋房屋改用黏土', unlock: 6, kind: 'simple', moor: true },
  { id: 'upgradeStone', name: '石头房', icon: '🏛', detail: '整栋房屋改用石料', unlock: 10, kind: 'simple', moor: true },
  { id: 'horseCook', name: '马肉厨房', icon: '🍲', detail: '花 2 黏土、1 石料', unlock: 3, kind: 'simple', moor: true },
  { id: 'kiln', name: '泥炭窑', icon: '♨', detail: '花 1 石料，采泥炭加强', unlock: 3, kind: 'simple', moor: true },
  { id: 'lodge', name: '护林屋', icon: '🌲', detail: '花 1 木材、2 黏土', unlock: 3, kind: 'simple', moor: true }
];
const SPECIALS = [
  { id: 'peat', name: '切取泥炭', icon: '♨️', detail: '移除泥沼，得 3 燃料', kind: 'target' },
  { id: 'fell', name: '伐木', icon: '🪓', detail: '移除森林，得 2 木材', kind: 'target' },
  { id: 'burn', name: '刀耕火种', icon: '🔥', detail: '森林变田地', kind: 'target' },
  { id: 'horseMarket', name: '马市', icon: '🐎', detail: '得 1 匹马，付 1 食物', kind: 'simple' },
  { id: 'fair', name: '雇工集市', icon: '🧺', detail: '得 1 食物', kind: 'simple' },
  { id: 'black', name: '黑市', icon: '🃏', detail: '付 1 燃料，建小设施', kind: 'choice', cards: true },
  { id: 'illicit', name: '私下工程', icon: '⚒', detail: '付 1 食物、1 燃料，建大型设施', kind: 'choice' }
];
const OCCUPATIONS = [
  { id: 'forester', name: '林间管事', effect: '林地或小树林额外得 1 木材', points: 0 },
  { id: 'gatherer', name: '采集者', effect: '捕鱼或临时劳作额外得 1 食物', points: 0 },
  { id: 'farmer', name: '耕作者', effect: '每次开垦后得 1 谷种', points: 0 },
  { id: 'herder', name: '牧人', effect: '每种牲畜留养上限 +1', points: 0 },
  { id: 'baker', name: '面包师', effect: '谷种在喂养时值 2 食物', points: 0 },
  { id: 'mason', name: '营造师', effect: '扩建每间房少付 1 木材、1 芦苇', points: 0 },
  { id: 'reedcutter', name: '芦苇工', effect: '河岸额外得 1 芦苇', points: 0 },
  { id: 'shepherd', name: '羊倌', effect: '羊群行动额外得 1 羊', points: 0 }
];
const IMPROVEMENTS = [
  { id: 'well', name: '石井', effect: '每轮开始得 1 食物', cost: { stone: 2, wood: 1 }, points: 2 },
  { id: 'mill', name: '磨坊', effect: '谷种喂养价值 +1', cost: { wood: 2, stone: 1 }, points: 1 },
  { id: 'silo', name: '谷仓', effect: '每次收获额外得 1 谷种', cost: { wood: 2, reed: 1 }, points: 1 },
  { id: 'basket', name: '篮筐', effect: '捕鱼额外得 1 食物', cost: { reed: 2 }, points: 1 },
  { id: 'stove', name: '暖炉', effect: '每次供暖少需 1 燃料', cost: { clay: 2 }, points: 1 },
  { id: 'peatCart', name: '泥炭车', effect: '切取泥炭额外得 1 燃料', cost: { wood: 1 }, points: 1 },
  { id: 'horseOven', name: '马肉炉', effect: '可把马转为 3 食物', cost: { clay: 2, stone: 1 }, points: 2 },
  { id: 'fenceKit', name: '围栏工具', effect: '围建牧场少付 1 木材', cost: { wood: 1, reed: 1 }, points: 1 }
];
const MAJORS = [
  { id: 'fireplace2', name: '壁炉（2 黏土）', cost: { clay: 2 }, points: 1, effect: '可烹饪牲畜；烤面包每谷种 2 食物', cook: { sheep: 2, boar: 2, cattle: 3 }, bake: 2 },
  { id: 'fireplace3', name: '壁炉（3 黏土）', cost: { clay: 3 }, points: 1, effect: '可烹饪牲畜；烤面包每谷种 2 食物', cook: { sheep: 2, boar: 2, cattle: 3 }, bake: 2 },
  { id: 'hearth4', name: '烹饪灶台（4 黏土）', cost: { clay: 4 }, points: 1, effect: '牲畜烹饪收益提高；烤面包每谷种 3 食物', cook: { sheep: 2, boar: 3, cattle: 4 }, bake: 3 },
  { id: 'hearth5', name: '烹饪灶台（5 黏土）', cost: { clay: 5 }, points: 1, effect: '牲畜烹饪收益提高；烤面包每谷种 3 食物', cook: { sheep: 2, boar: 3, cattle: 4 }, bake: 3 },
  { id: 'wellMajor', name: '水井', cost: { stone: 3, wood: 1 }, points: 4, effect: '之后最多 5 轮，每轮获得 1 食物' },
  { id: 'clayOven', name: '黏土烤炉', cost: { clay: 3, stone: 1 }, points: 2, effect: '烤面包时，1 谷种可换 5 食物', bake: 5 },
  { id: 'stoneOven', name: '石头烤炉', cost: { clay: 1, stone: 3 }, points: 3, effect: '烤面包时，至多 2 谷种各换 4 食物', bake: 4 },
  { id: 'joinery', name: '木工坊', cost: { stone: 2, wood: 2 }, points: 2, effect: '收获喂养时可用 1 木材换 2 食物；余材加分', craft: 'wood' },
  { id: 'pottery', name: '陶器坊', cost: { stone: 2, clay: 2 }, points: 2, effect: '收获喂养时可用 1 黏土换 2 食物；余材加分', craft: 'clay' },
  { id: 'basketmaker', name: '编篮坊', cost: { stone: 2, reed: 2 }, points: 2, effect: '收获喂养时可用 1 芦苇换 3 食物；余材加分', craft: 'reed' }
];
const ALIEN_CARDS = [
  ['X01', '地外肥料', '行动'], ['X02', '自制太空船', '行动'], ['X03', '变形装置', '行动'],
  ['X04', '木星商人', '商人'], ['X05', '火星商人', '商人'], ['X06', '冥王星商人', '商人'],
  ['X07', '能量线', '神器'], ['X08', '外星能源', '神器'], ['X09', '外星帮工', '神器'],
  ['X10', '复制器', '神器'], ['X11', '神秘档案', '神器'], ['X12', '毛绒访客', '神器'],
  ['X13', '宇宙尽头的餐馆', '事件'], ['X14', '地球人与外星人', '事件'], ['X15', '三脚机器', '事件'],
  ['X16', '传送指令', '事件'], ['X17', '糖果踪迹', '事件'], ['X18', '我是你的父亲', '事件'],
  ['X19', '外星绑架', '事件'], ['X20', '缩小射线', '事件'], ['X21', '喷射事故', '事件'],
  ['X22', '碳化封存', '事件'], ['X23', '麦田怪圈', '事件'], ['X24', '反抗者', '职业']
].map(([id, name, type]) => ({ id, name, type }));
const ALIEN_ACTIONS = [
  { id: 'alienFertilizer', card: 'X01', name: '地外肥料', icon: '🛸', detail: '所有已播田地增加 1 份作物', unlock: 1, kind: 'simple' },
  { id: 'alienRocket', card: 'X02', name: '自制太空船', icon: '🚀', detail: '花 2 木材、2 黏土、1 芦苇、1 石料，得 4 分', unlock: 1, kind: 'simple' },
  { id: 'alienTransform', card: 'X03', name: '变形装置', icon: '🧪', detail: '将一种建材全部换成另一种建材', unlock: 1, kind: 'choice' },
  { id: 'alienStable', card: 'X04', name: '建牲畜棚', icon: '🐾', detail: '花 1 木材建棚；首位另付 2 芦苇得 2 分', unlock: 1, kind: 'choice' }
];
const ALIEN_RULES = {
  X01: '公共行动：每块已播田增加 1 份作物。', X02: '公共行动：付 2 木材、2 黏土、1 芦苇、1 石料，得 4 分。', X03: '公共行动：把一种建材全部换成另一种。',
  X04: '第一个建牲畜棚并付 2 芦苇的玩家取得此牌，得 2 分。', X05: '第一个用正常扩员并付 2 食物的玩家取得此牌，得 2 分。', X06: '第一个围牧场并付 2 石料的玩家取得此牌，得 2 分。',
  X07: '持有者结算时每组房屋、田地、牧场各 1 格得 1 分。', X08: '持有者接下来 3 轮各多派工 1 次。', X09: '持有者每轮结束若林地无人占用，得 1 木材。', X10: '持有者下一次取得资源堆时翻倍，然后传给下家。', X11: '持有者建房或围牧场少付 1 木材。', X12: '得到 2 个毛绒访客；每次收获需各喂 1 食物，否则每个 −1 分。',
  X13: '事件：游戏结束恰好 42 分的玩家获胜。', X14: '事件：抽牌者立即无房扩员。', X15: '事件：此后每轮结束每位玩家付 1 食物；不足则下轮少派工 1 次。', X16: '事件：抽牌者决定下一轮先手。', X17: '事件：抽牌者获得 2 分；林地、临时劳作各放 1 枚糖果，未取回各扣 1 分。', X18: '事件：抽牌者付 5 种资源，获得 1 名家人。', X19: '事件：抽牌者各得 1 羊、猪、牛，本轮少派工 1 次。', X20: '事件：全体牧场容量翻倍，牲畜烹饪收益减半。', X21: '事件：全体木屋损坏 1 间；黏土屋升级石屋。', X22: '事件：抽牌者接下来的 3 轮少派工 1 次，随后一轮多派工 1 次。', X23: '事件：抽牌者两块空地被麦田怪圈占据。', X24: '抽牌者派出一名反抗者，游戏结束得 5 分，但以后少派工 1 次。'
};
function availableActions(g = game) {
  const actions = ACTIONS.concat(EXTRA_ACTIONS.filter(a => (!a.minPlayers || g.players.length >= a.minPlayers) && (!a.moor || g.settings.moor) && (!a.cards || g.settings.cards)));
  if (g.settings.seasons) actions.push(SEASON_ACTIONS[(g.round - 1) % 4]);
  if (g.settings.aliens) actions.push(...ALIEN_ACTIONS.filter(a => g.alienActive?.includes(a.card)));
  return actions;
}
function seasonName(g = game) { return g.settings.seasons ? SEASONS[(g.round - 1) % 4].name : ''; }
function winterFieldCost(g = game) { return seasonName(g) === '冬' ? 1 : 0; }
function harvestsRemaining(g = game) { return HARVEST_ROUNDS.filter(n => n >= g.round).length; }
function hasAlien(player, id) { return player.alienArtifacts.includes(id); }
function roomCost(player) { return { [player.houseMaterial]: Math.max(0, 5 - Number(player.houseMaterial === 'wood' && hasCard(player, 'mason')) - Number(player.houseMaterial === 'wood' && hasAlien(player, 'X11'))), reed: hasCard(player, 'mason') ? 1 : 2 }; }

const app = document.querySelector('#app');
const ui = { mobileTab: 'actions', actionCategory: 'basic', view: 0, mode: null, dialog: null, toast: '', aiTimer: null, toastTimer: null, setup: { ...DEFAULT_SETTINGS }, catalog: { query: '', kind: 'all', deck: 'all', page: 0 } };

function freshPlayer(name, ai = false, settings = DEFAULT_SETTINGS, index = 0) {
  const farm = Array.from({ length: 15 }, (_, i) => i < 2 ? { type: 'house' } : { type: 'empty' });
  if (settings.moor) {
    const slots = [3, 4, 7, 8, 11, 12, 13, 14];
    const rotated = slots.slice(index % slots.length).concat(slots.slice(0, index % slots.length));
    rotated.forEach((slot, i) => { farm[slot] = { type: i < 5 ? 'forest' : 'moor' }; });
  }
  return {
    name, ai, family: 2, food: 3, wood: 0, clay: 0, reed: 0, stone: 0,
    grain: 0, veg: 0, sheep: 0, boar: 0, cattle: 0, horse: 0, fuel: 0,
    hearth: false, horseCook: false, kiln: false, lodge: false, houseMaterial: 'wood', sick: 0,
    begging: 0, farm, stables: { sheep: 0, boar: 0, cattle: 0, horse: 0 },
    hand: settings.cards ? {
      occupations: OCCUPATIONS.filter((_, i) => (i + index) % 2 === 0).slice(0, 4).map(c => c.id),
      improvements: IMPROVEMENTS.filter((_, i) => (i + index) % 2 === 0).slice(0, 4).map(c => c.id)
    } : { occupations: [], improvements: [] },
    played: { occupations: [], improvements: [] }, majors: [], majorBuiltRound: {}, alienArtifacts: [], alienPoints: 0, woozles: 0, woozlePenalty: 0, candyActions: [], alienBonusUntil: 0, frozenUntil: 0, thawRound: 0
  };
}

function freshGame(settings = DEFAULT_SETTINGS) {
  settings = { players: Math.min(6, Math.max(2, Number(settings.players) || 2)), moor: !!settings.moor, cards: !!settings.cards, seasons: !!settings.seasons, aliens: !!settings.aliens };
  const players = Array.from({ length: settings.players }, (_, i) => freshPlayer(i ? `电脑 ${i}` : '你的农场', i > 0, settings, i));
  players[0].food = 2;
  const game = {
    version: 2, settings, round: 1, phase: 'play', startPlayer: 0, nextStart: 0, turn: 0,
    usedCount: players.map(() => 0), workerQuota: players.map(() => 2), occupied: {}, specialUsed: {}, piles: {}, players,
    logs: [], harvestSummary: null, majorSupply: MAJORS.map(c => c.id),
    alienDeck: settings.aliens ? ALIEN_CARDS.map(c => c.id).sort(() => Math.random() - .5) : [],
    alienActive: [], alienClaims: {}, alienEvents: [], alienGlobal: {}
  };
  replenish(game);
  addLog(game, '春耕开始：你先派出一名家庭成员。');
  return game;
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || (!TEST_MODE && localStorage.getItem(LEGACY_SAVE_KEY)));
    if (saved?.players?.length >= 2 && saved?.round >= 1 && saved?.round <= 14) {
      if (saved.version === 1) {
        saved.version = 2;
        saved.settings = { players: 2, moor: false, cards: false };
        saved.specialUsed = {};
        saved.players.forEach(p => Object.assign(p, { horse: 0, fuel: 0, sick: 0, houseMaterial: 'wood', horseCook: false, kiln: false, lodge: false, stables: { sheep: 0, boar: 0, cattle: 0, horse: 0 }, hand: { occupations: [], improvements: [] }, played: { occupations: [], improvements: [] } }));
      }
      saved.workerQuota ||= saved.players.map(p => p.family);
      saved.settings = { ...DEFAULT_SETTINGS, ...saved.settings };
      saved.specialUsed ||= {};
      saved.majorSupply ||= MAJORS.map(c => c.id).filter(id => !saved.players.some(p => p.majors?.includes(id)));
      saved.alienDeck ||= []; saved.alienActive ||= []; saved.alienClaims ||= {}; saved.alienEvents ||= []; saved.alienGlobal ||= {};
      saved.players.forEach(p => { p.stables ||= { sheep: 0, boar: 0, cattle: 0, horse: 0 }; p.majors ||= []; p.majorBuiltRound ||= {}; p.alienArtifacts ||= []; p.alienPoints ||= 0; p.woozles ||= 0; p.woozlePenalty ||= 0; p.candyActions ||= []; p.alienBonusUntil ||= 0; p.frozenUntil ||= 0; p.thawRound ||= 0; });
      return saved;
    }
  } catch (_) { /* private browsing can block storage */ }
  return freshGame();
}
let game = loadGame();
try { if (!localStorage.getItem(SEEN_KEY)) ui.dialog = 'rules'; } catch (_) { ui.dialog = 'rules'; }

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (_) { /* game remains playable */ }
}
function addLog(g, message) {
  g.logs.unshift({ round: g.round, message });
  g.logs = g.logs.slice(0, 8);
}
function replenish(g) {
  for (const action of availableActions(g)) if (action.kind === 'pile' && action.unlock <= g.round) {
    g.piles[action.id] = (g.piles[action.id] || 0) + action.add;
  }
  if (g.settings.seasons) {
    const season = SEASONS[(g.round - 1) % 4].name;
    const change = season === '春' ? { wood: -1, copse: -1, grove: -1, riverbankForest: -1, stone: 1 }
      : season === '夏' ? { clay: 1, hollow: 1, stone: -1, fish: 1 }
      : season === '秋' ? { wood: 1, copse: 1, grove: 1, riverbankForest: 1, reed: 1 }
      : { clay: -1, hollow: -1, reed: -1 };
    for (const [id, amount] of Object.entries(change)) if (id in g.piles) g.piles[id] = Math.max(0, g.piles[id] + amount);
  }
  if (g.settings.cards) for (const player of g.players) if (player.played.improvements.includes('well')) player.food++;
  if (g.settings.cards) for (const player of g.players) if (player.majorBuiltRound.wellMajor && g.round > player.majorBuiltRound.wellMajor && g.round <= player.majorBuiltRound.wellMajor + 5) player.food++;
}
function farmCount(player, type) { return player.farm.filter(c => c.type === type).length; }
function emptyCells(player) { return player.farm.map((c, i) => c.type === 'empty' ? i : -1).filter(i => i >= 0); }
function emptyFields(player) { return player.farm.map((c, i) => c.type === 'field' && !c.crop ? i : -1).filter(i => i >= 0); }
function roomCells(player) {
  return emptyCells(player).filter(i => [i % 5 > 0 ? i - 1 : -1, i % 5 < 4 ? i + 1 : -1, i - 5, i + 5]
    .some(n => player.farm[n]?.type === 'house'));
}
function selectedCells(player, mode) {
  if (!mode) return [];
  if (mode.id === 'plow' || mode.id === 'pasture' || mode.id === 'farmSupplies' || mode.id === 'seasonSummer') return emptyCells(player);
  if (mode.id === 'room') return roomCells(player);
  if (mode.id === 'sow' || mode.id === 'seasonSpring') return emptyFields(player);
  if (mode.id === 'peat') return player.farm.map((c, i) => c.type === 'moor' ? i : -1).filter(i => i >= 0);
  if (mode.id === 'fell') return player.farm.map((c, i) => c.type === 'forest' ? i : -1).filter(i => i >= 0);
  if (mode.id === 'burn') return player.farm.map((c, i) => {
    if (c.type !== 'forest') return -1;
    if (!farmCount(player, 'field')) return i;
    return [i % 5 > 0 ? i - 1 : -1, i % 5 < 4 ? i + 1 : -1, i - 5, i + 5].some(n => player.farm[n]?.type === 'field') ? i : -1;
  }).filter(i => i >= 0);
  return [];
}
function hasCard(player, id) { return player.played.occupations.includes(id) || player.played.improvements.includes(id); }
function canPay(player, cost) { return Object.entries(cost).every(([key, amount]) => player[key] >= amount); }
function pay(player, cost) { for (const [key, amount] of Object.entries(cost)) player[key] -= amount; }
function playableCards(player, type) {
  const deck = type === 'occupations' ? OCCUPATIONS : IMPROVEMENTS;
  return player.hand[type].map(id => deck.find(c => c.id === id)).filter(card => card && (type === 'occupations' ? player.food >= (player.played.occupations.length ? 2 : 1) : canPay(player, card.cost)));
}
function majorCost(card) {
  const cost = { ...card.cost };
  if (seasonName() === '秋') { const key = Object.keys(cost).find(k => cost[k] > 0); if (key) cost[key]--; }
  return cost;
}
function playableMajors(player) { return MAJORS.filter(card => game.majorSupply.includes(card.id) && canPay(player, majorCost(card))); }
function animalFoodValue(player, type) {
  const base = type === 'horse' ? player.horseCook || hasCard(player, 'horseOven') ? 3 : 0 : player.hearth ? { sheep: 2, boar: 3, cattle: 4 }[type] : 0;
  const worth = Math.max(base, ...player.majors.map(id => MAJORS.find(c => c.id === id)?.cook?.[type] || 0));
  return game.alienGlobal.smallAnimals && worth ? Math.max(1, Math.floor(worth / 2)) : worth;
}
function breadFoodValue(player) { return Math.max(player.hearth ? 2 : 0, ...player.majors.map(id => MAJORS.find(c => c.id === id)?.bake || 0)); }
function canAct(player, action) {
  if (player.sick > 0 && action.id !== 'infirmary') return false;
  switch (action.id) {
    case 'plow': case 'pasture': return emptyCells(player).length > 0 && (action.id !== 'pasture' ? player.food >= winterFieldCost() : player.wood >= Math.max(0, 2 - Number(seasonName() === '春' || hasCard(player, 'fenceKit')) - Number(hasAlien(player, 'X11'))));
    case 'farmSupplies': return player.food >= 1;
    case 'seasonSpring': return true;
    case 'seasonSummer': return emptyCells(player).length > 0 || player.grain > 0;
    case 'seasonAutumn': return true;
    case 'seasonWinter': return player.family < 5 && player.wood >= 2 && player.food >= harvestsRemaining();
    case 'sow': return emptyFields(player).length > 0 && (player.grain > 0 || player.veg > 0);
    case 'room': return canPay(player, roomCost(player)) && roomCells(player).length > 0;
    case 'fish': return seasonName() !== '冬' || game.round >= 12;
    case 'grow': return player.family < Math.min(5, farmCount(player, 'house'));
    case 'hearth': return !player.hearth && player.clay >= 2;
    case 'lessons': return playableCards(player, 'occupations').length > 0;
    case 'major': return playableMajors(player).length > 0;
    case 'minor': case 'minor6': return playableCards(player, 'improvements').length > 0;
    case 'sideJob': return player.wood >= 1 && Object.values(player.stables).reduce((a, b) => a + b, 0) < 4;
    case 'animalMarket': return true;
    case 'corral': return ['sheep', 'boar', 'cattle'].some(t => player[t] === 0);
    case 'upgradeClay': return player.houseMaterial === 'wood' && canPay(player, { clay: farmCount(player, 'house') * 2, reed: 1 });
    case 'upgradeStone': return player.houseMaterial === 'clay' && canPay(player, { stone: farmCount(player, 'house') * 2, reed: 1 });
    case 'horseCook': return !player.horseCook && canPay(player, { clay: 2, stone: 1 });
    case 'kiln': return !player.kiln && player.stone >= 1;
    case 'lodge': return !player.lodge && canPay(player, { wood: 1, clay: 2 });
    case 'alienFertilizer': return player.farm.some(c => c.type === 'field' && c.crop);
    case 'alienRocket': return canPay(player, { wood: 2, clay: 2, reed: 1, stone: 1 });
    case 'alienTransform': return ['wood', 'clay', 'reed', 'stone'].some(k => player[k] > 0);
    case 'alienStable': return player.wood >= 1 && Object.values(player.stables).reduce((a, b) => a + b, 0) < 4;
    default: return true;
  }
}
function canSpecial(player, special, who) {
  if (!game.settings.moor || player.sick > 0 || game.usedCount[who] >= game.workerQuota[who]) return false;
  if (special.cards && !game.settings.cards) return false;
  const used = game.specialUsed[special.id] || [];
  const reuseCost = used.length ? 2 : 0;
  if (used.includes(who) || used.length >= 2 || player.food < reuseCost) return false;
  switch (special.id) {
    case 'peat': case 'fell': case 'burn': return selectedCells(player, { id: special.id }).length > 0;
    case 'horseMarket': return player.food >= 1 + reuseCost;
    case 'black': return player.fuel >= 1 && playableCards(player, 'improvements').length > 0;
    case 'illicit': return player.fuel >= 1 && player.food >= 1 + reuseCost && ['horseCook', 'kiln', 'lodge'].some(id => canAct(player, EXTRA_ACTIONS.find(a => a.id === id)));
    default: return true;
  }
}
function animalCapacity(player, type) { return 1 + (player.stables?.[type] || 0) + (hasCard(player, 'herder') ? 1 : 0) + player.farm.filter(c => c.type === 'pasture' && c.animal === type).length * (game.alienGlobal.smallAnimals ? 6 : 3); }
function addAnimals(player, type, amount) {
  const canKeep = Math.max(0, animalCapacity(player, type) - player[type]);
  const kept = Math.min(canKeep, amount);
  const excess = amount - kept;
  player[type] += kept;
  const worth = animalFoodValue(player, type);
  if (worth) player.food += excess * worth;
  return { kept, excess, cooked: worth > 0 && excess > 0 };
}
function actionText(who, action, extra = '') { return `${who === 0 ? '你' : game.players[who].name}：${action.name}${extra ? '，' + extra : ''}。`; }
function playCard(player, type, id) {
  const deck = type === 'occupations' ? OCCUPATIONS : IMPROVEMENTS;
  const card = deck.find(c => c.id === id);
  if (!card) return '';
  if (type === 'occupations') player.food -= player.played.occupations.length ? 2 : 1;
  else pay(player, card.cost);
  player.hand[type] = player.hand[type].filter(x => x !== id);
  player.played[type].push(id);
  return card.name;
}
function playMajorCard(player, id) {
  const card = MAJORS.find(c => c.id === id);
  if (!card || !game.majorSupply.includes(id) || !canPay(player, majorCost(card))) return '';
  pay(player, majorCost(card));
  game.majorSupply = game.majorSupply.filter(x => x !== id);
  player.majors.push(id);
  player.majorBuiltRound[id] = game.round;
  return card.name;
}
function buildMajor(player, id) {
  if (id === 'horseCook') { pay(player, { clay: 2, stone: 1 }); player.horseCook = true; return '马肉厨房完工'; }
  if (id === 'kiln') { player.stone--; player.kiln = true; return '泥炭窑完工'; }
  if (id === 'lodge') { pay(player, { wood: 1, clay: 2 }); player.lodge = true; return '护林屋完工'; }
  return '';
}
function harvestFields(player) {
  let count = 0;
  for (const cell of player.farm) if (cell.type === 'field' && cell.crop && cell.qty > 0) {
    player[cell.crop]++;
    cell.qty--;
    count++;
    if (cell.qty === 0) cell.crop = null;
  }
  return count;
}
function breedAnimals(player) {
  const newborn = [];
  for (const type of Object.keys(ANIMALS)) if (player[type] >= 2 && player[type] < animalCapacity(player, type)) {
    player[type]++;
    newborn.push(ANIMALS[type]);
  }
  return newborn;
}
function revealAlienCard(who) {
  const id = game.alienDeck.shift();
  if (!id) return;
  const player = game.players[who];
  const card = ALIEN_CARDS.find(c => c.id === id);
  game.alienActive.push(id);
  addLog(game, `🛸 ${player.name}发现 ${id}「${card.name}」：${ALIEN_RULES[id]}`);
  if (['X07', 'X08', 'X09', 'X10', 'X11', 'X12'].includes(id)) {
    player.alienArtifacts.push(id);
    if (id === 'X08') player.alienBonusUntil = game.round + 3;
    if (id === 'X12') player.woozles = 2;
  }
  if (id === 'X14' && player.family < 5) player.family++;
  if (id === 'X16') game.nextStart = who;
  if (id === 'X17') { player.alienPoints += 2; player.candyActions = ['wood', 'day']; }
  if (id === 'X18') {
    const goods = ['wood', 'clay', 'reed', 'stone', 'grain', 'veg', 'food'].filter(k => player[k] > 0);
    if (goods.length >= 5 && player.family < 5) { goods.slice(0, 5).forEach(k => player[k]--); player.family++; }
  }
  if (id === 'X19') { ['sheep', 'boar', 'cattle'].forEach(k => addAnimals(player, k, 1)); game.workerQuota[who] = Math.max(game.usedCount[who], game.workerQuota[who] - 1); }
  if (id === 'X20') game.alienGlobal.smallAnimals = true;
  if (id === 'X21') game.players.forEach(p => {
    if (p.houseMaterial === 'clay') p.houseMaterial = 'stone';
    else if (p.houseMaterial === 'wood') { const idx = p.farm.findLastIndex(c => c.type === 'house'); if (idx >= 0 && farmCount(p, 'house') > 1) p.farm[idx] = { type: 'empty' }; }
  });
  if (id === 'X22') { player.frozenUntil = game.round + 3; player.thawRound = game.round + 4; game.workerQuota[who] = Math.max(game.usedCount[who], game.workerQuota[who] - 1); }
  if (id === 'X23') emptyCells(player).slice(0, 2).forEach(i => { player.farm[i] = { type: 'circle' }; });
  if (id === 'X24') { player.alienArtifacts.push(id); game.workerQuota[who] = Math.max(game.usedCount[who], game.workerQuota[who] - 1); }
  if (id.startsWith('X1') || id.startsWith('X2')) if (!['X10', 'X11', 'X12', 'X24'].includes(id)) game.alienEvents.push(id);
}
function claimAlienMerchant(who, actionId) {
  const player = game.players[who];
  const claim = ['sideJob', 'alienStable'].includes(actionId) ? ['X04', { reed: 2 }]
    : actionId === 'grow' ? ['X05', { food: 2 }]
    : actionId === 'pasture' ? ['X06', { stone: 2 }] : null;
  if (!claim || !game.alienActive.includes(claim[0]) || game.alienClaims[claim[0]] !== undefined || !canPay(player, claim[1])) return;
  pay(player, claim[1]); game.alienClaims[claim[0]] = who; player.alienPoints += 2;
  addLog(game, `${player.name}满足条件，取得 ${claim[0]}「${ALIEN_CARDS.find(c => c.id === claim[0]).name}」，获得 2 分。`);
}

function applyAction(who, action, option = {}) {
  const player = game.players[who];
  let detail = '';
  if (action.special && (game.specialUsed[action.id] || []).length) player.food -= 2;
  if (action.kind === 'pile') {
    let qty = game.piles[action.id] || 0;
    if (hasAlien(player, 'X10')) { qty *= 2; player.alienArtifacts = player.alienArtifacts.filter(id => id !== 'X10'); game.players[(who + 1) % game.players.length].alienArtifacts.push('X10'); }
    game.piles[action.id] = 0;
    if (ANIMALS[action.key]) {
      const total = qty + (action.id === 'sheep' && hasCard(player, 'shepherd') ? 1 : 0);
      const result = addAnimals(player, action.key, total);
      detail = `获得 ${total} ${ANIMALS[action.key]}，留养 ${result.kept}${result.excess ? result.cooked ? `、烹饪 ${result.excess}` : `、放走 ${result.excess}` : ''}`;
    } else {
      let total = qty;
      if (['wood', 'copse', 'grove', 'riverbankForest'].includes(action.id) && hasCard(player, 'forester')) total++;
      if (action.id === 'reed' && hasCard(player, 'reedcutter')) total++;
      if (action.id === 'fish') total += Number(hasCard(player, 'gatherer')) + Number(hasCard(player, 'basket'));
      player[action.key] += total;
      if (action.id === 'riverbankForest') player.reed++;
      detail = `获得 ${total} ${RESOURCES.find(r => r[0] === action.key)[1]}`;
    }
  } else switch (action.id) {
    case 'grain': player.grain++; detail = '获得 1 谷种'; break;
    case 'veg': player.veg++; detail = '获得 1 菜种'; break;
    case 'day': player.food += 2 + Number(hasCard(player, 'gatherer')); if (seasonName() === '夏') player.grain++; detail = `获得 ${2 + Number(hasCard(player, 'gatherer'))} 食物${seasonName() === '夏' ? '、1 谷种' : ''}`; break;
    case 'first': player.food++; game.nextStart = who; detail = '获得 1 食物，下轮先手'; break;
    case 'hearth': player.clay -= 2; player.hearth = true; detail = '灶台完工'; break;
    case 'grow': player.family++; detail = `家庭增至 ${player.family} 人`; break;
    case 'plow': player.food -= winterFieldCost(); player.farm[option.cell] = { type: 'field', crop: null, qty: 0 }; if (hasCard(player, 'farmer')) player.grain++; detail = `开垦第 ${option.cell + 1} 格${winterFieldCost() ? '，花 1 食物' : ''}`; break;
    case 'sow':
      player[option.crop]--;
      player.farm[option.cell] = { type: 'field', crop: option.crop, qty: option.crop === 'grain' ? 3 : 2 };
      detail = `播下${option.crop === 'grain' ? '谷物' : '蔬菜'}`; break;
    case 'pasture': player.wood -= Math.max(0, 2 - Number(seasonName() === '春' || hasCard(player, 'fenceKit')) - Number(hasAlien(player, 'X11'))); player.farm[option.cell] = { type: 'pasture', animal: option.animal }; detail = `建成${ANIMALS[option.animal]}牧场${seasonName() === '春' ? '，春季围栏优惠' : ''}`; break;
    case 'room': pay(player, roomCost(player)); player.farm[option.cell] = { type: 'house' }; if (seasonName() === '夏' && Object.values(player.stables).reduce((a, b) => a + b, 0) < 4) { const type = Object.keys(ANIMALS).filter(t => t !== 'horse' || game.settings.moor).sort((a, b) => player[b] - player[a])[0]; player.stables[type]++; } detail = `新增 1 间住房${seasonName() === '夏' ? '及免费牲畜棚' : ''}`; break;
    case 'lessons': detail = `学会职业「${playCard(player, 'occupations', option.card)}」`; break;
    case 'major': detail = `建造主要发展「${playMajorCard(player, option.major)}」`; break;
    case 'minor': case 'minor6': detail = `建造小设施「${playCard(player, 'improvements', option.card)}」`; break;
    case 'market': player.wood++; player.reed++; player.stone++; detail = '获得木材、芦苇、石料各 1'; break;
    case 'animalMarket': {
      if (option.animal === 'cattle') player.food--;
      const result = addAnimals(player, option.animal, 1);
      if (option.animal === 'sheep') player.food++;
      detail = `获得 1 ${ANIMALS[option.animal]}${result.excess ? '，无法留养' : ''}`; break;
    }
    case 'resourceTrade': { const [a, b] = option.trade.split('-'); player.food++; player[a]++; player[b]++; detail = `获得 1 食物、1 ${RESOURCES.find(r => r[0] === a)[1]}、1 ${RESOURCES.find(r => r[0] === b)[1]}`; break; }
    case 'corral': { const type = ['sheep', 'boar', 'cattle'].find(t => player[t] === 0); addAnimals(player, type, 1); detail = `获得 1 ${ANIMALS[type]}`; break; }
    case 'farmSupplies': player.food -= seasonName() === '冬' && option.supply === 'plow' ? 2 : 1; if (option.supply === 'grain') { player.grain++; detail = '花 1 食物买谷种'; } else { player.farm[option.cell] = { type: 'field', crop: null, qty: 0 }; detail = `花 ${seasonName() === '冬' ? 2 : 1} 食物开田`; } break;
    case 'seasonSpring': { const born = breedAnimals(player); if (option.crop && Number.isInteger(option.cell)) { player[option.crop]--; player.farm[option.cell] = { type: 'field', crop: option.crop, qty: option.crop === 'grain' ? 3 : 2 }; } detail = `新生牲畜 ${born.join('、') || '无'}${option.crop ? '，并播种' : ''}`; break; }
    case 'seasonSummer': { const baking = option.supply === 'bake' || option.supply === 'plowBake'; const selling = option.supply === 'sell' || option.supply === 'both'; if (baking || selling) { player.grain--; player.food += selling ? 4 : breadFoodValue(player) + Number(hasCard(player, 'baker')) + Number(hasCard(player, 'mill')); } if (['plow', 'both', 'plowBake'].includes(option.supply)) { player.farm[option.cell] = { type: 'field', crop: null, qty: 0 }; if (hasCard(player, 'farmer')) player.grain++; } detail = `${['plow', 'both', 'plowBake'].includes(option.supply) ? '开田 1 格' : ''}${baking ? '，烤面包' : selling ? '，卖谷种换 4 食物' : ''}`.replace(/^，/, ''); break; }
    case 'seasonAutumn': detail = `收获 ${harvestFields(player)} 块田，并获得 1 菜种`; player.veg++; break;
    case 'seasonWinter': player.wood -= 2; player.food -= harvestsRemaining(); player.family++; detail = `无房扩员至 ${player.family} 人，花 2 木材、${harvestsRemaining()} 食物`; break;
    case 'alienFertilizer': { let n = 0; game.players.forEach(p => p.farm.forEach(c => { if (c.type === 'field' && c.crop) { c.qty++; n++; } })); detail = `全场 ${n} 块播种田各增加 1 份作物`; break; }
    case 'alienRocket': pay(player, { wood: 2, clay: 2, reed: 1, stone: 1 }); player.alienPoints += 4; detail = '建成飞船，获得 4 分'; break;
    case 'alienTransform': { const [from, to] = option.trade.split('-'); const n = player[from]; player[from] = 0; player[to] += n; detail = `${n} ${RESOURCES.find(r => r[0] === from)[1]}变为${RESOURCES.find(r => r[0] === to)[1]}`; break; }
    case 'alienStable': player.wood--; player.stables[option.animal]++; detail = `为${ANIMALS[option.animal]}建 1 座牲畜棚`; break;
    case 'sideJob': player.wood--; player.stables[option.animal]++; detail = `为${ANIMALS[option.animal]}建 1 座牲畜棚`; break;
    case 'infirmary': player.food++; if (player.sick > 0) player.sick--; detail = '恢复 1 名病人，获得 1 食物'; break;
    case 'upgradeClay': pay(player, { clay: farmCount(player, 'house') * 2, reed: 1 }); player.houseMaterial = 'clay'; detail = '房屋升级为黏土'; break;
    case 'upgradeStone': pay(player, { stone: farmCount(player, 'house') * 2, reed: 1 }); player.houseMaterial = 'stone'; detail = '房屋升级为石料'; break;
    case 'horseCook': case 'kiln': case 'lodge': detail = buildMajor(player, action.id); break;
    case 'peat': player.farm[option.cell] = { type: 'empty' }; player.fuel += 3 + Number(player.kiln) + Number(hasCard(player, 'peatCart')); detail = `移除泥沼，获得 ${3 + Number(player.kiln) + Number(hasCard(player, 'peatCart'))} 燃料`; break;
    case 'fell': player.farm[option.cell] = { type: 'empty' }; player.wood += 2 + Number(player.lodge); detail = `移除森林，获得 ${2 + Number(player.lodge)} 木材`; break;
    case 'burn': player.farm[option.cell] = { type: 'field', crop: null, qty: 0 }; detail = '森林变为田地'; break;
    case 'horseMarket': player.food--; { const result = addAnimals(player, 'horse', 1); detail = result.excess ? '获得马，但没有位置留养' : '获得 1 匹马'; } break;
    case 'fair': player.food++; detail = '获得 1 食物'; break;
    case 'black': player.fuel--; detail = `建造小设施「${playCard(player, 'improvements', option.card)}」`; break;
    case 'illicit': player.food--; player.fuel--; detail = buildMajor(player, option.major); break;
  }
  if (action.special) {
    game.specialUsed[action.id] ||= [];
    game.specialUsed[action.id].push(who);
  } else {
    if (!action.repeatable) game.occupied[action.id] = who;
    game.usedCount[who]++;
  }
  addLog(game, actionText(who, action, detail));
  if (player.candyActions.includes(action.id)) player.candyActions = player.candyActions.filter(id => id !== action.id);
  if (!action.special) claimAlienMerchant(who, action.id);
  if (game.settings.aliens && action.id === 'stone' && game.round >= 5) revealAlienCard(who);
  ui.mode = null;
  save();
  advanceTurn(who);
}

function advanceTurn(who) {
  const n = game.players.length;
  let next = -1;
  for (let offset = 1; offset <= n; offset++) {
    const candidate = (who + offset) % n;
    if (game.usedCount[candidate] < game.workerQuota[candidate]) { next = candidate; break; }
  }
  if (next < 0) { finishRound(); return; }
  game.turn = next;
  render();
  scheduleAI();
}
function chooseAiAction(who) {
  const p = game.players[who];
  const nextHarvest = HARVEST_ROUNDS.find(n => n >= game.round) || 14;
  const foodNeed = p.family * 2 - p.food;
  const candidates = availableActions().filter(a => a.unlock <= game.round && (a.repeatable || !(a.id in game.occupied)) && canAct(p, a));
  if (game.settings.moor) candidates.push(...SPECIALS.map(a => ({ ...a, special: true })).filter(a => canSpecial(p, a, who)));
  function value(a) {
    const pile = game.piles[a.id] || 0;
    const urgency = nextHarvest - game.round <= 1 ? Math.max(0, foodNeed) : 0;
    switch (a.id) {
      case 'infirmary': return p.sick ? 100 : 1;
      case 'peat': return p.fuel < farmCount(p, 'house') ? 13 : 5;
      case 'fell': return p.wood < 5 ? 12 : 6;
      case 'burn': return 9;
      case 'horseMarket': return p.horse === 0 ? 6 : 2;
      case 'fair': return 3 + urgency;
      case 'black': return 8;
      case 'illicit': return 7;
      case 'lessons': return game.round < 9 ? 8 : 3;
      case 'major': return p.majors.length < 2 ? 9 : 5;
      case 'minor': case 'minor6': return 7;
      case 'upgradeClay': case 'upgradeStone': return 6;
      case 'kiln': case 'lodge': case 'horseCook': return 6;
      case 'animalMarket': return 4;
      case 'market': return 8;
      case 'resourceTrade': return 7;
      case 'corral': return 6;
      case 'farmSupplies': return 6;
      case 'sideJob': return 4;
      case 'seasonSpring': return 10;
      case 'seasonSummer': return p.grain > 0 ? 12 : 7;
      case 'seasonAutumn': return 5 + p.farm.filter(c => c.type === 'field' && c.crop).length * 3;
      case 'seasonWinter': return 17;
      case 'alienFertilizer': return 6;
      case 'alienRocket': return 14;
      case 'alienTransform': return 4;
      case 'alienStable': return 6;
      case 'grow': return 18 - game.round * .35;
      case 'room': return p.family >= farmCount(p, 'house') ? 13 : 7;
      case 'sow': return 10 + (nextHarvest - game.round <= 2 ? 1 : 0);
      case 'plow': return emptyFields(p).length === 0 ? 8 : 5;
      case 'pasture': return farmCount(p, 'pasture') < 2 ? 8 : 5;
      case 'hearth': return 10;
      case 'wood': return 2 + pile * (p.wood < 5 ? 1.5 : .9);
      case 'copse': case 'grove': case 'riverbankForest': return 2 + pile * 1.2;
      case 'hollow': return 2 + pile;
      case 'travelers': return 2 + pile * 1.4 + urgency;
      case 'reed': return 2 + pile * (p.reed < 2 ? 2 : 1);
      case 'clay': return 2 + pile * (p.hearth ? .5 : 2);
      case 'grain': return p.grain === 0 && emptyFields(p).length ? 9 : 5;
      case 'veg': return p.veg === 0 && emptyFields(p).length ? 9 : 5;
      case 'fish': return 2 + pile * 1.4 + urgency * 1.5;
      case 'day': return 3 + urgency * 1.2;
      case 'sheep': case 'boar': case 'cattle': return 2 + Math.min(pile, animalCapacity(p, a.key) - p[a.key]) * 2 + (p.hearth ? pile * .8 : 0);
      case 'stone': return 1 + pile * .8;
      case 'first': return 3 + (game.nextStart === 1 ? 0 : 1);
      default: return 1;
    }
  }
  return candidates.sort((a, b) => value(b) - value(a))[0];
}
function performAI() {
  ui.aiTimer = null;
  if (game.phase !== 'play' || game.turn === 0 || ui.dialog) return;
  const who = game.turn;
  const action = chooseAiAction(who);
  if (!action) { finishRound(); return; }
  let option = {};
  const p = game.players[who];
  if (['plow', 'pasture'].includes(action.id)) option.cell = emptyCells(p)[0];
  if (action.id === 'farmSupplies') { option.supply = emptyCells(p).length ? 'plow' : 'grain'; option.cell = emptyCells(p)[0]; }
  if (action.id === 'room') option.cell = roomCells(p)[0];
  if (['peat', 'fell', 'burn'].includes(action.id)) option.cell = selectedCells(p, { id: action.id })[0];
  if (action.id === 'sow') {
    option.cell = emptyFields(p)[0];
    option.crop = p.veg > 0 ? 'veg' : 'grain';
  }
  if (action.id === 'pasture') {
    const order = game.settings.moor ? ['sheep', 'boar', 'cattle', 'horse'] : ['sheep', 'boar', 'cattle'];
    option.animal = order.sort((a, b) => p[b] - p[a])[0];
    if (p[option.animal] === 0) option.animal = game.round >= 10 ? 'cattle' : game.round >= 8 ? 'boar' : 'sheep';
  }
  if (action.id === 'animalMarket') option.animal = p.food && game.round >= 10 ? 'cattle' : 'sheep';
  if (action.id === 'sideJob') option.animal = p.horse ? 'horse' : p.cattle ? 'cattle' : p.boar ? 'boar' : 'sheep';
  if (action.id === 'resourceTrade') option.trade = 'wood-reed';
  if (action.id === 'seasonSpring') { option.crop = emptyFields(p).length ? p.veg > 0 ? 'veg' : p.grain > 0 ? 'grain' : null : null; option.cell = option.crop ? emptyFields(p)[0] : undefined; }
  if (action.id === 'seasonSummer') { option.supply = emptyCells(p).length ? p.grain > 0 ? 'both' : 'plow' : 'sell'; option.cell = emptyCells(p)[0]; }
  if (action.id === 'lessons') option.card = playableCards(p, 'occupations')[0]?.id;
  if (action.id === 'major') option.major = playableMajors(p)[0]?.id;
  if (['minor', 'minor6', 'black'].includes(action.id)) option.card = playableCards(p, 'improvements')[0]?.id;
  if (action.id === 'illicit') option.major = ['horseCook', 'kiln', 'lodge'].find(id => canAct(p, EXTRA_ACTIONS.find(a => a.id === id)));
  if (action.id === 'alienTransform') { const from = ['wood', 'clay', 'reed', 'stone'].sort((a, b) => p[b] - p[a])[0]; option.trade = `${from}-${from === 'stone' ? 'wood' : 'stone'}`; }
  if (action.id === 'alienStable') option.animal = p.cattle ? 'cattle' : p.boar ? 'boar' : 'sheep';
  applyAction(who, action, option);
}
function scheduleAI() {
  clearTimeout(ui.aiTimer);
  if (game.phase === 'play' && game.turn !== 0 && !ui.dialog) ui.aiTimer = setTimeout(performAI, game.players.length > 2 ? 250 : 550);
}

function feed(player) {
  let need = player.family * 2 + player.woozles;
  const received = { crops: 0, newborn: [], fed: need, shortage: 0, heatCost: 0, cold: 0 };
  if (hasCard(player, 'silo')) player.grain++;
  received.crops = harvestFields(player);
  received.newborn = breedAnimals(player);
  const useFood = Math.min(need, player.food);
  player.food -= useFood;
  need -= useFood;
  while (need > 0 && player.veg > 0) { player.veg--; player.food += 2; const x = Math.min(need, player.food); player.food -= x; need -= x; }
  while (need > 0 && player.grain > 0) { player.grain--; const value = hasCard(player, 'baker') || hasCard(player, 'mill') ? 2 : 1; player.food += value; const x = Math.min(need, player.food); player.food -= x; need -= x; }
  for (const craft of MAJORS.filter(c => c.craft && player.majors.includes(c.id))) if (need > 0 && player[craft.craft] > 0) {
    player[craft.craft]--;
    const worth = craft.craft === 'reed' ? 3 : 2;
    const used = Math.min(need, worth); need -= used; player.food += worth - used;
  }
  for (const type of ['sheep', 'boar', 'cattle', 'horse']) if (animalFoodValue(player, type)) {
    const worth = animalFoodValue(player, type);
    while (need > 0 && player[type] > 0) {
      player[type]--; player.food += worth;
      const x = Math.min(need, player.food); player.food -= x; need -= x;
    }
  }
  if (need > 0) { player.begging += need; received.shortage = need; }
  if (player.woozles) {
    if (received.shortage) { player.woozlePenalty += player.woozles; player.woozles = 0; }
    else player.woozles += Math.floor(player.woozles / 2);
  }
  if (game.settings.moor && seasonName() !== '夏') {
    received.heatCost = Math.max(0, farmCount(player, 'house') - ({ wood: 0, clay: 1, stone: 2 }[player.houseMaterial]) - Number(hasCard(player, 'stove')));
    let heating = received.heatCost;
    const fuel = Math.min(heating, player.fuel); player.fuel -= fuel; heating -= fuel;
    const wood = Math.min(heating, player.wood); player.wood -= wood; heating -= wood;
    received.cold = heating;
    player.sick = Math.min(player.family, heating);
  }
  return received;
}
function finishRound() {
  if (game.alienActive.includes('X15')) game.players.forEach(p => { if (p.food > 0) p.food--; else p.frozenUntil = Math.max(p.frozenUntil, game.round + 1); });
  for (const p of game.players) {
    if (hasAlien(p, 'X09') && !('wood' in game.occupied)) p.wood++;
  }
  if (HARVEST_ROUNDS.includes(game.round)) {
    game.harvestSummary = game.players.map(feed);
    const player = game.harvestSummary[0];
    game.phase = 'harvest';
    addLog(game, `第 ${game.round} 轮收获完成。${player.shortage ? `食物不足 ${player.shortage}，获得乞讨标记。` : '全家吃饱了。'}`);
    save(); render();
  } else nextRound();
}
function nextRound() {
  game.round++;
  game.phase = 'play';
  game.occupied = {};
  game.usedCount = game.players.map(() => 0);
  game.workerQuota = game.players.map(p => Math.max(1, p.family + Number(hasAlien(p, 'X08') && game.round <= p.alienBonusUntil) + Number(p.thawRound === game.round) - Number(p.frozenUntil >= game.round) - Number(hasAlien(p, 'X24'))));
  game.specialUsed = {};
  game.startPlayer = game.nextStart;
  game.turn = game.startPlayer;
  game.harvestSummary = null;
  replenish(game);
  addLog(game, `第 ${game.round} 轮开始，资源继续累积。`);
  save(); render(); scheduleAI();
}
function score(player) {
  const fields = farmCount(player, 'field');
  const pastures = farmCount(player, 'pasture');
  const rooms = farmCount(player, 'house');
  const empty = farmCount(player, 'empty');
  const varieties = ['grain', 'veg', 'sheep', 'boar', 'cattle'].filter(t => player[t] > 0 || (t === 'grain' || t === 'veg') && player.farm.some(c => c.crop === t)).length;
  const herd = Math.floor(player.sheep / 2) + Math.floor(player.boar / 2) + Math.floor(player.cattle / 2);
  const parts = { family: player.family * 3 - player.sick * 2, rooms, fields, pastures: pastures * 2, varieties: varieties * 2, herd, hearth: player.hearth ? 1 : 0, empty: -empty, begging: -player.begging * 3 };
  if (game.settings.moor) {
    parts.horses = player.horse || -1;
    parts.moorBuildings = Number(player.horseCook) * 2 + Number(player.kiln) + Number(player.lodge);
    parts.moorBonus = (player.kiln ? Math.min(2, Math.floor(player.fuel / 3)) : 0) + (player.lodge ? farmCount(player, 'forest') : 0);
  }
  if (game.settings.cards) {
    parts.cards = player.played.improvements.reduce((sum, id) => sum + (IMPROVEMENTS.find(c => c.id === id)?.points || 0), 0);
    parts.majors = player.majors.reduce((sum, id) => sum + (MAJORS.find(c => c.id === id)?.points || 0), 0);
    parts.craftBonus = player.majors.reduce((sum, id) => {
      const card = MAJORS.find(c => c.id === id);
      if (!card?.craft) return sum;
      const qty = player[card.craft];
      const levels = card.craft === 'reed' ? [2, 4, 5] : [3, 5, 7];
      return sum + levels.filter(n => qty >= n).length;
    }, 0);
  }
  if (game.settings.aliens) {
    parts.aliens = player.alienPoints + player.woozles - player.woozlePenalty - player.candyActions.length + (hasAlien(player, 'X24') ? 5 : 0);
    if (hasAlien(player, 'X07')) parts.aliens += Math.min(rooms, fields, pastures);
  }
  return { parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
}
function escapeHTML(str) { return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function resCard([key, label, icon], player) {
  return `<div class="resource" title="${label}"><div class="res-top">${icon}</div><div class="res-bottom"><span>${label}</span><strong>${player[key]}</strong></div></div>`;
}
function actionCard(action) {
  const locked = action.unlock > game.round;
  const occupied = !action.repeatable && action.id in game.occupied;
  const inactive = game.phase !== 'play' || game.turn !== 0 || !!ui.mode || !!ui.dialog;
  const disabled = locked || occupied || inactive || !canAct(game.players[0], action);
  const badge = locked ? `<span class="unlock-tag">第 ${action.unlock} 轮</span>` : action.kind === 'pile' ? `<span class="action-badge">${game.piles[action.id] || 0}</span>` : '';
  const usedText = occupied ? ` · ${game.occupied[action.id] === 0 ? '你' : game.players[game.occupied[action.id]].name}已用` : '';
  return `<button class="action-card ${action.kind === 'pile' ? ANIMALS[action.key] ? 'animal-card' : 'resource-card' : ''} ${locked ? 'locked' : ''} ${occupied ? 'used' : ''}" data-action="${action.id}" ${disabled ? 'disabled' : ''} aria-label="${action.name}，${action.detail}${usedText}">${badge}<span class="action-icon">${action.icon}</span><span class="action-title">${action.name}</span><span class="action-detail">${action.detail}${usedText}</span>${occupied ? `<span class="worker-token ${game.occupied[action.id] === 0 ? 'human' : 'computer'}" aria-hidden="true"></span>` : ''}</button>`;
}
function specialCard(special) {
  const used = game.specialUsed[special.id] || [];
  const disabled = game.phase !== 'play' || game.turn !== 0 || !!ui.mode || !!ui.dialog || !canSpecial(game.players[0], special, 0);
  const cost = used.length ? ' · 再用付 2 食物' : ' · 不占用家人';
  return `<button class="action-card special-card ${used.length >= 2 ? 'used' : ''}" data-special="${special.id}" ${disabled ? 'disabled' : ''}><span class="action-icon">${special.icon}</span><span class="action-title">${special.name}</span><span class="action-detail">${special.detail}${cost}</span></button>`;
}
function cellContent(cell) {
  if (cell.type === 'house') return `<span class="cell-icon">🏠</span><span class="cell-label">住房</span>`;
  if (cell.type === 'field') return `<span class="cell-icon">${cell.crop === 'veg' ? '🥕' : cell.crop === 'grain' ? '🌾' : '☷'}</span><span class="cell-label">${cell.crop === 'veg' ? '蔬菜' : cell.crop === 'grain' ? '谷物' : '空田'}</span>${cell.qty ? `<span class="cell-qty">${cell.qty}</span>` : ''}`;
  if (cell.type === 'pasture') return `<span class="cell-icon">${{ sheep: '🐑', boar: '🐗', cattle: '🐄', horse: '🐎' }[cell.animal]}</span><span class="cell-label">${ANIMALS[cell.animal]}牧场</span>`;
  if (cell.type === 'forest') return `<span class="cell-icon">🌲</span><span class="cell-label">森林</span>`;
  if (cell.type === 'moor') return `<span class="cell-icon">🟫</span><span class="cell-label">泥沼</span>`;
  if (cell.type === 'circle') return `<span class="cell-icon">🛸</span><span class="cell-label">怪圈</span>`;
  return `<span class="cell-icon">·</span><span class="cell-label">空地</span>`;
}
function farmPanel() {
  const p = game.players[ui.view];
  const selectable = ui.view === 0 && !ui.mode?.choice ? selectedCells(p, ui.mode) : [];
  const action = ui.mode ? (ui.mode.special ? SPECIALS : availableActions()).find(a => a.id === ui.mode.id) : null;
  const prompt = action ? `请选择一块可用地块完成「${action.name}」。` : '点击行动卡派工；每个普通行动格每轮只能被占用一次。';
  const cells = p.farm.map((cell, i) => `<button class="farm-cell ${cell.type} ${selectable.includes(i) ? 'selectable' : ''}" data-cell="${i}" ${selectable.includes(i) ? '' : 'disabled'} aria-label="第 ${i + 1} 格，${cell.type === 'empty' ? '空地' : cell.type === 'forest' ? '森林' : cell.type === 'moor' ? '泥沼' : cell.type === 'circle' ? '怪圈' : cell.type === 'house' ? '住房' : cell.type === 'field' ? cell.crop === 'grain' ? '谷物田' : cell.crop === 'veg' ? '蔬菜田' : '空田' : ANIMALS[cell.animal] + '牧场'}">${cellContent(cell)}</button>`).join('');
  const views = game.players.map((person, i) => `<button data-view="${i}" class="${ui.view === i ? 'active' : ''}">${i ? `电脑 ${i}` : '我的'}</button>`).join('');
  return `<section class="panel farm-panel"><div class="panel-head"><div><p class="eyebrow">HOMESTEAD</p><h2>农场地块</h2></div><span class="head-note">5 × 3 · 共 15 格</span></div><div class="farm-wrap"><div class="farm-banner"><div class="farm-player ${ui.view ? 'ai' : ''}"><i class="dot"></i>${p.name}</div><div class="view-switch" aria-label="切换农场">${views}</div></div><div class="farm-field">${cells}</div><div class="farm-footer"><span>空地 <strong>${farmCount(p, 'empty')}</strong> · 田地 <strong>${farmCount(p, 'field')}</strong> · 牧场 <strong>${farmCount(p, 'pasture')}</strong></span><span>住房 <strong>${farmCount(p, 'house')}</strong> / 家人 <strong>${p.family}</strong></span></div><div class="farm-tip ${ui.mode ? 'pick' : ''}">${prompt}${ui.mode ? ' <button class="cancel-pick" data-cancel="1">取消</button>' : ''}</div><div class="mini-stats"><div class="mini-stat"><b>${game.workerQuota[ui.view] - game.usedCount[ui.view]}</b>本轮剩余派工</div><div class="mini-stat"><b>${p.sick ? `${p.sick} 人` : p.hearth ? '已建成' : '未建造'}</b>${p.sick ? '卧床病人' : '灶台'}</div><div class="mini-stat"><b>${p.begging}</b>乞讨标记</div><div class="mini-stat"><b>${score(p).total}</b>当前分数</div></div></div></section>`;
}
function cardCost(card) {
  return Object.entries(card.cost || {}).filter(([, amount]) => amount > 0).map(([key, amount]) => `${amount} ${RESOURCES.find(r => r[0] === key)[1]}`).join('、') || '无材料';
}
function handPanel() {
  const p = game.players[0];
  const row = (id, type) => {
    const card = (type === 'occupations' ? OCCUPATIONS : IMPROVEMENTS).find(c => c.id === id);
    return `<div class="hand-card ${type === 'occupations' ? 'occupation-card' : 'minor-card'}"><div class="card-illustration" aria-hidden="true">${type === 'occupations' ? '👩‍🌾' : '🛠️'}</div><b>${card.name}</b><span>${card.effect}</span><small>${type === 'occupations' ? '职业' : `小设施 · ${cardCost(card)} · ${card.points} 分`}</small></div>`;
  };
  return `<section class="panel cards-panel"><div class="panel-head"><div><p class="eyebrow">CARDS</p><h2>你的手牌</h2></div><span class="head-note">在“学习职业”或“小型设施”行动打出</span></div><div class="hand-grid">${p.hand.occupations.map(id => row(id, 'occupations')).join('')}${p.hand.improvements.map(id => row(id, 'improvements')).join('')}</div><div class="played-cards">已打出：${p.played.occupations.concat(p.played.improvements).map(id => (OCCUPATIONS.concat(IMPROVEMENTS).find(c => c.id === id)?.name)).join('、') || '无'}</div></section>`;
}
function majorPanel() {
  const cards = MAJORS.map(card => `<div class="hand-card ${game.majorSupply.includes(card.id) ? '' : 'major-taken'}"><b>${card.name}</b><span>${card.effect}</span><small>${cardCost(card)} · ${card.points} 分${game.majorSupply.includes(card.id) ? '' : ' · 已建造'}</small></div>`).join('');
  return `<section class="panel cards-panel major-panel"><div class="panel-head"><div><p class="eyebrow">MAJOR IMPROVEMENTS</p><h2>主要发展</h2></div><span class="head-note">公共牌，每张只能建造一次</span></div><div class="hand-grid">${cards}</div></section>`;
}
function alienPanel() {
  const me = game.players[0];
  const cards = game.alienActive.map(id => {
    const card = ALIEN_CARDS.find(c => c.id === id);
    const owner = game.alienClaims[id] !== undefined ? ` · ${game.players[game.alienClaims[id]].name}` : game.players.find(p => p.alienArtifacts.includes(id))?.name;
    return `<div class="hand-card"><b>${id} · ${card.name}</b><span>${ALIEN_RULES[id]}</span><small>${card.type}${owner ? ` · ${owner}` : ''}</small></div>`;
  }).join('');
  const status = [me.woozles ? `毛绒访客 ${me.woozles}` : '', me.candyActions.length ? `待收糖果：${me.candyActions.map(id => ACTIONS.find(a => a.id === id)?.name).join('、')}` : ''].filter(Boolean).join(' · ');
  return `<section class="panel cards-panel alien-panel"><div class="panel-head"><div><p class="eyebrow">X DECK</p><h2>外星人扩展</h2></div><span class="head-note">牌堆剩余 ${game.alienDeck.length} 张</span></div>${status ? `<div class="alien-status">${status}</div>` : ''}<div class="hand-grid">${cards || '<div class="played-cards">第 5 轮起，使用采石场翻开外星卡。</div>'}</div></section>`;
}
function catalogDialog() {
  const state = ui.catalog;
  const query = state.query.trim().toLocaleLowerCase();
  const filtered = ORIGINAL_CARD_CATALOG.filter(card =>
    (state.kind === 'all' || card.kind === state.kind) &&
    (state.deck === 'all' || card.id.startsWith(state.deck)) &&
    (!query || `${card.id} ${card.name}`.toLocaleLowerCase().includes(query))
  );
  const pageSize = 36;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  state.page = Math.min(state.page, pages - 1);
  const visible = filtered.slice(state.page * pageSize, (state.page + 1) * pageSize);
  const items = visible.map(card => `<a class="catalog-card ${card.kind}" href="${escapeHTML(card.url)}" target="_blank" rel="noopener noreferrer"><b>${card.id}</b><span>${escapeHTML(card.name)}</span><small>${card.kind === 'occupation' ? '职业' : '次要发展'} · 查看来源 ↗</small></a>`).join('');
  return `<div class="modal-backdrop"><div class="modal catalog-modal" role="dialog" aria-modal="true" aria-label="原版卡牌目录"><p class="eyebrow">CARD INDEX · A / B</p><h2>原版卡牌目录</h2><p>15 周年版 A/B 牌组：168 张职业、168 张次要发展。这里提供卡号、英文名称和来源链接。目录卡不在当前游戏中发放；其效果尚未接入规则引擎。</p><div class="catalog-controls"><input data-catalog-query type="search" value="${escapeHTML(state.query)}" placeholder="搜索卡号或英文名称"><select data-catalog-kind><option value="all" ${state.kind === 'all' ? 'selected' : ''}>全部类别</option><option value="occupation" ${state.kind === 'occupation' ? 'selected' : ''}>职业</option><option value="minor" ${state.kind === 'minor' ? 'selected' : ''}>次要发展</option></select><select data-catalog-deck><option value="all" ${state.deck === 'all' ? 'selected' : ''}>A + B 牌组</option><option value="A" ${state.deck === 'A' ? 'selected' : ''}>A 牌组</option><option value="B" ${state.deck === 'B' ? 'selected' : ''}>B 牌组</option></select></div><div class="catalog-count">找到 ${filtered.length} 张 · 第 ${state.page + 1} / ${pages} 页</div><div class="catalog-grid">${items || '<p>没有符合条件的卡牌。</p>'}</div><div class="modal-actions catalog-pagination"><button class="ghost-btn" data-catalog-page="prev" ${state.page <= 0 ? 'disabled' : ''}>上一页</button><button class="ghost-btn" data-catalog-page="next" ${state.page >= pages - 1 ? 'disabled' : ''}>下一页</button><button class="primary-btn" data-close="catalog">关闭</button></div></div></div>`;
}
function rulesDialog() {
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="玩法说明"><p class="eyebrow">HOW TO PLAY</p><h2>经营四季田园</h2><p>14 轮内，你与电脑轮流派出家人，占用行动格来经营农场。资源格每轮累积，取走时一次获得全部。第 4、7、9、11、13、14 轮结束后收获。</p><h3>基础经营</h3><ul><li>开田、播种、建房、牧场需点击农场格子。每位家人每轮只能行动一次；扩员增加下轮起的派工人数。</li><li>收获时田地产物、牲畜繁殖，再喂养家人，每人需 2 食物。不足的食物变成乞讨标记。</li><li>每种牲畜可留养 1 只，对应牧场每格再容纳 3 只。两只以上且有空间才会繁殖。</li></ul>${game.settings.moor ? `<h3>沼泽与冬季</h3><ul><li>农场起始有 5 片森林、3 片泥沼。特殊行动不占用家人；同一特殊行动被别人第二次使用时，需付 2 食物。</li><li>伐木移除森林得木材，切泥炭移除泥沼得燃料。收获时每间木屋需 1 燃料；黏土屋减 1、石屋减 2。木材可按 1:1 代替燃料。</li><li>供暖不足会有人卧床，下轮这些人只能去医务所。马可饲养和繁殖；普通灶台不能烹饪马。</li></ul>` : ''}${game.settings.cards ? `<h3>职业与设施</h3><p>“学习职业”与“小型设施”可从手牌选择并支付费用，获得持续效果与分数。本作使用原创精简牌组。</p>` : ''}${game.settings.seasons ? `<h3>四季流转</h3><p>春、夏、秋、冬每轮轮换。每季有一个独立行动格，并在补充资源、派工或收获时改变规则。当前季节与效果显示在行动区顶部。</p>` : ''}${game.settings.aliens ? `<h3>外星人扩展</h3><p>第 5 轮起，使用采石场会翻开 1 张外星卡。行动卡增加公共行动；商人、神器、事件和职业按卡牌说明生效。此版按简化规则系统改编，所有效果可在外星卡区查看。</p>` : ''}<div class="modal-actions"><button class="primary-btn" data-close="rules">开始经营</button></div></div></div>`;
}
function choiceDialog() {
  if (!ui.mode?.choice) return '';
  const p = game.players[0];
  const id = ui.mode.id;
  let options = [], title = '选择';
  if (id === 'sow') { title = '选择种子'; options = [['grain', '🌾 谷物', p.grain > 0, '可收获 3 次'], ['veg', '🥕 蔬菜', p.veg > 0, '可收获 2 次']]; }
  else if (id === 'pasture' || id === 'animalMarket') {
    title = id === 'pasture' ? '选择牧场牲畜' : '选择牲畜';
    options = [['sheep', '🐑 羊', true, id === 'animalMarket' ? '另得 1 食物' : ''], ['boar', '🐗 猪', true, ''], ['cattle', '🐄 牛', id !== 'animalMarket' || p.food > 0, id === 'animalMarket' ? '需付 1 食物' : '']];
    if (game.settings.moor && id === 'pasture') options.push(['horse', '🐎 马', true, '']);
  } else if (id === 'lessons') { title = '选择职业'; options = playableCards(p, 'occupations').map(c => [c.id, c.name, true, c.effect]); }
  else if (id === 'major') { title = '建造主要发展'; options = playableMajors(p).map(c => [c.id, c.name, true, `${cardCost({ cost: majorCost(c) })} · ${c.effect}`]); }
  else if (id === 'minor' || id === 'minor6' || id === 'black') { title = '选择小设施'; options = playableCards(p, 'improvements').map(c => [c.id, c.name, true, `${cardCost(c)} · ${c.effect}`]); }
  else if (id === 'illicit') { title = '选择大型设施'; options = ['horseCook', 'kiln', 'lodge'].filter(major => canAct(p, EXTRA_ACTIONS.find(a => a.id === major))).map(major => { const a = EXTRA_ACTIONS.find(x => x.id === major); return [major, a.name, true, a.detail]; }); }
  else if (id === 'farmSupplies') { title = '选择农具补给'; options = [['plow', '⚒ 开田', emptyCells(p).length > 0 && p.food >= (seasonName() === '冬' ? 2 : 1), `付 ${seasonName() === '冬' ? 2 : 1} 食物，在空地开田`], ['grain', '🌾 谷种', true, '付 1 食物，获得 1 谷种']]; }
  else if (id === 'seasonSpring') { title = '春日耕育'; options = [['breed', '只繁殖', true, '立刻进行一次牲畜繁殖'], ['grain', '繁殖并播谷', p.grain > 0 && emptyFields(p).length > 0, '再选择 1 块空田'], ['veg', '繁殖并播菜', p.veg > 0 && emptyFields(p).length > 0, '再选择 1 块空田']]; }
  else if (id === 'seasonSummer') { title = '夏日劳作'; options = [['plow', '只开田', emptyCells(p).length > 0, '选择 1 块空地'], ['sell', '只卖谷种', p.grain > 0, '1 谷种换 4 食物'], ['bake', '只烤面包', p.grain > 0 && breadFoodValue(p) > 0, '需烘焙设施'], ['both', '开田并卖谷种', p.grain > 0 && emptyCells(p).length > 0, '选择 1 块空地'], ['plowBake', '开田并烤面包', p.grain > 0 && breadFoodValue(p) > 0 && emptyCells(p).length > 0, '选择 1 块空地']]; }
  else if (id === 'alienTransform') { title = '变形装置：交换建材'; options = ['wood', 'clay', 'reed', 'stone'].flatMap(from => ['wood', 'clay', 'reed', 'stone'].filter(to => to !== from).map(to => [`${from}-${to}`, `${RESOURCES.find(r => r[0] === from)[1]} → ${RESOURCES.find(r => r[0] === to)[1]}`, p[from] > 0, `全部 ${p[from]} 个` ])); }
  else if (id === 'alienStable') { title = '选择牲畜棚'; options = Object.entries(ANIMALS).filter(([type]) => game.settings.moor || type !== 'horse').map(([type, name]) => [type, name, true, '花 1 木材，该牲畜容量 +1']); }
  else if (id === 'resourceTrade') { title = '选择两种建材'; options = [['wood-reed', '木材 + 芦苇', true, '另得 1 食物'], ['wood-stone', '木材 + 石料', true, '另得 1 食物'], ['clay-reed', '黏土 + 芦苇', true, '另得 1 食物'], ['clay-stone', '黏土 + 石料', true, '另得 1 食物']]; }
  else if (id === 'sideJob') { title = '选择牲畜棚'; options = Object.entries(ANIMALS).filter(([type]) => game.settings.moor || type !== 'horse').map(([type, name]) => [type, name, true, '付 1 木材，该牲畜容量 +1']); }
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">CHOOSE</p><h2>${title}</h2><div class="modal-choice ${options.length > 3 ? 'many' : ''}">${options.map(([value, label, enabled, detail]) => `<button class="choice-btn" data-choice="${value}" ${enabled ? '' : 'disabled'}><b>${label}</b><small>${detail}</small></button>`).join('')}</div><div class="modal-actions"><button class="ghost-btn" data-cancel="1">取消</button></div></div></div>`;
}
function harvestDialog() {
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">HARVEST · ROUND ${game.round}</p><h2>收获季到了</h2><div class="harvest-grid">${game.harvestSummary.map((s, i) => `<div class="harvest-card ${i ? 'ai' : ''}"><b>${game.players[i].name}</b>收获作物：${s.crops}<br>新生牲畜：${s.newborn.length ? s.newborn.join('、') : '无'}<br>家人口粮：${s.fed}${s.shortage ? `<br><strong>食物不足 ${s.shortage}</strong>` : '<br>全家吃饱 ✓'}${game.settings.moor ? `<br>房屋供暖：${s.heatCost} 燃料${s.cold ? `<br><strong>供暖不足 ${s.cold}，有人卧床</strong>` : '<br>温暖过冬 ✓'}` : ''}</div>`).join('')}</div><div class="modal-actions"><button class="primary-btn" data-continue="1">${game.round === 14 ? '查看结算' : '进入下一轮'}</button></div></div></div>`;
}
function endingDialog() {
  const mine = score(game.players[0]);
  const exact42 = game.alienActive.includes('X13') && game.players.some(p => score(p).total === 42);
  const ranking = game.players.map((p, i) => ({ name: p.name, points: score(p).total, i })).sort((a, b) => Number(exact42 && b.points === 42) - Number(exact42 && a.points === 42) || b.points - a.points);
  const labels = { family: '家庭成员', rooms: '住房', fields: '田地', pastures: '牧场', varieties: '物产种类', herd: '牲畜数量', hearth: '灶台', empty: '未利用土地', begging: '乞讨标记', horses: '马', moorBuildings: '沼泽建筑', moorBonus: '沼泽奖励', cards: '小设施', majors: '主要发展', craftBonus: '工坊余材', aliens: '外星卡' };
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">THE FOURTEENTH HARVEST</p><h2>${ranking[0].i === 0 ? '你的农场欣欣向荣' : '还有一个春天等着你'}</h2><p>14 轮经营结束，最终排名如下。${exact42 ? '外星事件：恰好 42 分优先获胜。' : ''}</p><div class="ranking">${ranking.map((r, i) => `<div class="score-row"><span>${i + 1}. ${r.name}</span><b>${r.points} 分</b></div>`).join('')}</div><h3>你的农场账本</h3>${Object.entries(mine.parts).map(([key, value]) => `<div class="score-row"><span>${labels[key]}</span><b>${value > 0 ? '+' : ''}${value}</b></div>`).join('')}<div class="modal-actions"><button class="primary-btn" data-new-confirm="1">再玩一局</button></div></div></div>`;
}
function newDialog() {
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">NEW GAME</p><h2>开启一座新农场</h2><p>选择要启用的扩展。开始后会替换当前进度。</p><div class="setup-grid"><label>玩家数（你 + 电脑）<select data-setting="players">${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${ui.setup.players === n ? 'selected' : ''}>${n} 人${n >= 5 ? ' · 扩展行动格' : ''}</option>`).join('')}</select></label><label class="check-row"><input type="checkbox" data-setting="moor" ${ui.setup.moor ? 'checked' : ''}> 沼泽农夫：森林、泥沼、燃料、马、特殊行动</label><label class="check-row"><input type="checkbox" data-setting="seasons" ${ui.setup.seasons ? 'checked' : ''}> 四季流转：季节行动与资源变化</label><label class="check-row"><input type="checkbox" data-setting="cards" ${ui.setup.cards ? 'checked' : ''}> 职业与小设施：原创精简牌组</label><label class="check-row"><input type="checkbox" data-setting="aliens" ${ui.setup.aliens ? 'checked' : ''}> 外星人：24 张 X 卡，采石场触发</label></div><div class="modal-actions"><button class="ghost-btn" data-close="new">返回</button><button class="primary-btn" data-new="1">开始新游戏</button></div></div></div>`;
}
function render() {
  const me = game.players[0];
  if (ui.view >= game.players.length) ui.view = 0;
  const currentTurn = game.phase === 'play' ? game.turn === 0 ? me.sick ? '病人需先前往医务所' : '轮到你派工' : `${game.players[game.turn].name}正在思考…` : game.phase === 'harvest' ? '收获季' : '游戏结束';
  const nextHarvest = HARVEST_ROUNDS.find(n => n >= game.round);
  const track = Array.from({ length: 14 }, (_, i) => `<i class="${i + 1 < game.round ? 'past' : i + 1 === game.round ? 'now' : ''}" title="第 ${i + 1} 轮"></i>`).join('');
  const resources = game.settings.moor ? RESOURCES : RESOURCES.slice(0, 10);
  const actions = availableActions();
  const currentActions = actions.filter(a => a.unlock <= game.round);
  const laterActions = actions.filter(a => a.unlock > game.round);
  const basicActions = currentActions.filter(a => ACTIONS.includes(a));
  const expansionActions = currentActions.filter(a => EXTRA_ACTIONS.includes(a));
  const alienActions = currentActions.filter(a => ALIEN_ACTIONS.includes(a));
  const seasonAction = game.settings.seasons ? SEASON_ACTIONS[(game.round - 1) % 4] : null;
  const seasonSection = seasonAction ? `<div class="action-section season-section"><div class="section-title"><h3>${SEASONS[(game.round - 1) % 4].icon} ${seasonName()}季行动</h3><span>${SEASONS[(game.round - 1) % 4].note}</span></div><div class="action-list">${actionCard(seasonAction)}</div></div>` : '';
  const alienSection = game.settings.aliens ? `<div class="action-section alien-section"><div class="section-title"><h3>🛸 外星行动</h3><span>采石场翻牌后开放</span></div><div class="action-list">${alienActions.map(actionCard).join('') || '<p class="empty-actions">尚无已翻开的外星行动卡</p>'}</div></div>` : '';
  const specialSection = game.settings.moor ? `<div class="action-section special-section"><div class="section-title"><h3>沼泽特殊行动</h3><span>不占用家人 · 每项最多使用 2 次</span></div><div class="action-list special-list">${SPECIALS.filter(a => !a.cards || game.settings.cards).map(specialCard).join('')}</div></div>` : '';
  const expansionSection = expansionActions.length ? `<div class="action-section expansion-section"><div class="section-title"><h3>扩展行动</h3><span>${game.players.length} 人局 · 职业与设施</span></div><div class="action-list">${expansionActions.map(actionCard).join('')}</div></div>` : '';
  const laterSection = laterActions.length ? `<details class="later-actions"><summary>之后解锁的行动 <span>${laterActions.length} 项</span></summary><div class="action-list">${laterActions.map(actionCard).join('')}</div></details>` : '';
  const actionNav = game.settings.moor || game.settings.aliens || expansionActions.length || seasonAction ? `<nav class="action-nav" aria-label="行动分类">${seasonAction ? '<button data-jump="season">四季</button>' : ''}${game.settings.aliens ? '<button data-jump="alien">外星</button>' : ''}${game.settings.moor ? '<button data-jump="special">沼泽特殊</button>' : ''}<button data-jump="basic">基础行动</button>${expansionActions.length ? '<button data-jump="expansion">扩展行动</button>' : ''}</nav>` : '';
  const actionsPanel = `<section class="panel actions-panel"><div class="panel-head"><div><p class="eyebrow">WORKER PLACEMENT</p><h2>今日可做的事</h2></div><span class="head-note">每人每轮行动 1 次</span></div>${actionNav}${seasonSection}${alienSection}${specialSection}<div class="action-section basic-section"><div class="section-title"><h3>基础行动</h3><span>使用家人派工</span></div><div class="action-list">${basicActions.map(actionCard).join('')}</div></div>${expansionSection}${laterSection}</section>`;
  const categories = ['basic', ...(seasonAction ? ['season'] : []), ...(game.settings.aliens ? ['alien'] : []), ...(game.settings.moor ? ['special'] : []), ...(expansionActions.length ? ['expansion'] : [])];
  if (!categories.includes(ui.actionCategory)) ui.actionCategory = 'basic';
  const pickingCell = !!ui.mode && !ui.mode.choice;
  if (ui.mobileTab === 'cards' && !game.settings.cards && !game.settings.aliens) ui.mobileTab = 'actions';
  const mobileTab = pickingCell ? 'farm' : ui.mobileTab;
  const mobileTabs = [['actions', '⚒', '行动'], ['farm', '⌂', '农场'], ...(game.settings.cards || game.settings.aliens ? [['cards', '▤', '卡牌']] : []), ['overview', '☷', '概况']];
  const mobileNav = `<nav class="mobile-nav" aria-label="游戏区域">${mobileTabs.map(([id, icon, label]) => `<button data-mobile-tab="${id}" ${mobileTab === id ? 'aria-current="page"' : ''} ${pickingCell && id !== 'farm' ? 'disabled' : ''}><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</nav>`;
  const scores = game.players.map((p, i) => `<div class="score-row"><span>${p.name}</span><b>${score(p).total} 分</b></div>`).join('');
  const turnBar = `<div class="topline"><div class="turn ${game.turn && game.phase === 'play' ? 'ai' : ''}"><span></span>${currentTurn}</div><div class="season-track" aria-label="轮次进度">${track}</div><div class="next">${game.phase === 'ended' ? '经营完毕' : nextHarvest === game.round ? '本轮结束后收获' : `第 ${nextHarvest} 轮收获`}</div></div>`;
  const resourceTray = `<section class="resource-tray"><div class="tray-heading"><span>资源收纳盒</span><small>剩余派工 ${Math.max(0, game.workerQuota[0] - game.usedCount[0])} / ${game.workerQuota[0]}</small></div><div class="summary-strip ${game.settings.moor ? 'expanded' : ''}">${resources.map(r => resCard(r, me)).join('')}</div>${game.settings.moor ? `<div class="expansion-line"><button data-convert="woodFuel" ${me.wood && game.phase === 'play' && game.turn === 0 ? '' : 'disabled'}>1 木材 → 1 燃料</button></div>` : ''}</section>`;
  const scorePanel = `<section class="panel info-box tabletop-score"><h3>计分与收获</h3>${scores}<div class="score-row"><span>下次收获</span><b>${nextHarvest ? `第 ${nextHarvest} 轮` : '已结束'}</b></div><div class="score-row"><span>当前先手</span><b>${game.players[game.startPlayer].name}</b></div></section>`;
  const logPanel = `<section class="panel info-box tabletop-log"><h3>农场日志</h3><div class="log-list">${game.logs.slice(0, 6).map(item => `<div class="log-line"><time>第 ${item.round} 轮</time><span>${escapeHTML(item.message)}</span></div>`).join('')}</div></section>`;
  app.innerHTML = `<div class="shell tabletop-shell" data-mobile-screen="${mobileTab}" data-mobile-category="${ui.actionCategory}"><header class="masthead"><div class="brand"><div class="brand-mark">✳</div><div><h1>四季田园</h1><p>FOUR SEASONS FARM</p></div></div><div class="header-actions"><button class="ghost-btn" data-rules="1">玩法</button><button class="ghost-btn" data-catalog-open="1">原版牌库</button><button class="ghost-btn" data-new-confirm="1">新游戏</button><span class="round-pill">第 ${game.round} / 14 轮</span></div></header>${turnBar}<div class="tabletop-layout">${game.settings.cards ? `<div class="table-major">${majorPanel()}</div>` : ''}<div class="table-farm">${farmPanel()}</div><div class="table-actions">${actionsPanel}</div><aside class="table-side">${resourceTray}${scorePanel}${logPanel}</aside>${game.settings.cards || game.settings.aliens ? `<div class="table-hand">${game.settings.cards ? handPanel() : ''}${game.settings.aliens ? alienPanel() : ''}</div>` : ''}</div><footer class="footer">原创精简游戏 · 灵感来自 Uwe Rosenberg 的《Agricola》 · 本作与 Lookout Games 无关联</footer>${mobileNav}</div>${ui.dialog === 'rules' ? rulesDialog() : ui.dialog === 'catalog' ? catalogDialog() : ui.dialog === 'new' ? newDialog() : ui.mode?.choice ? choiceDialog() : game.phase === 'harvest' ? harvestDialog() : game.phase === 'ended' ? endingDialog() : ''}${ui.toast ? `<div class="notice" role="status">${escapeHTML(ui.toast)}</div>` : ''}`;
}
function toast(message) {
  ui.toast = message; clearTimeout(ui.toastTimer); render();
  ui.toastTimer = setTimeout(() => { ui.toast = ''; render(); }, 2400);
}
function scrollToSectionOnMobile(selector) {
  if (window.matchMedia('(max-width: 700px)').matches) {
    const screen = selector === '.farm-field' ? 'farm' : 'actions';
    if (ui.mobileTab !== screen) { ui.mobileTab = screen; render(); }
  }
  requestAnimationFrame(() => {
    const target = document.querySelector(selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (window.matchMedia('(max-width: 900px)').matches || (selector === '.farm-field' && (rect.top < 0 || rect.bottom > window.innerHeight))) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
function beginAction(action) {
  if (game.phase !== 'play' || game.turn !== 0 || ui.dialog || ui.mode) return;
  if (action.special ? !canSpecial(game.players[0], action, 0) : action.unlock > game.round || (!action.repeatable && action.id in game.occupied) || !canAct(game.players[0], action)) return;
  if (action.kind === 'target' || action.kind === 'choice') {
    ui.view = 0;
    ui.mode = { id: action.id, special: !!action.special, choice: action.kind === 'choice' || ['sow', 'pasture'].includes(action.id) };
    render();
    if (!ui.mode.choice) scrollToSectionOnMobile('.farm-field');
  } else applyAction(0, action);
}
function clickCell(index) {
  if (!ui.mode || game.turn !== 0 || ui.view !== 0 || ui.mode.choice) return;
  if (!selectedCells(game.players[0], ui.mode).includes(index)) return;
  const action = (ui.mode.special ? SPECIALS.map(a => ({ ...a, special: true })) : availableActions()).find(a => a.id === ui.mode.id);
  applyAction(0, action, { cell: index, crop: ui.mode.crop, animal: ui.mode.animal, supply: ui.mode.supply });
  scrollToSectionOnMobile('.actions-panel');
}
function submitChoice(value) {
  if (!ui.mode?.choice) return;
  const id = ui.mode.id;
  if (['sow', 'pasture'].includes(id)) {
    if (id === 'sow') ui.mode.crop = value; else ui.mode.animal = value;
    ui.mode.choice = false; render(); scrollToSectionOnMobile('.farm-field'); return;
  }
  if (id === 'farmSupplies' && value === 'plow') { ui.mode.choice = false; ui.mode.supply = 'plow'; render(); scrollToSectionOnMobile('.farm-field'); return; }
  if (id === 'seasonSpring' && value !== 'breed') { ui.mode.choice = false; ui.mode.crop = value; render(); scrollToSectionOnMobile('.farm-field'); return; }
  if (id === 'seasonSummer' && ['plow', 'both', 'plowBake'].includes(value)) { ui.mode.choice = false; ui.mode.supply = value; render(); scrollToSectionOnMobile('.farm-field'); return; }
  const action = (ui.mode.special ? SPECIALS.map(a => ({ ...a, special: true })) : availableActions()).find(a => a.id === id);
  applyAction(0, action, { animal: value, card: value, major: value, supply: value, trade: value });
}
app.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const d = button.dataset;
  if (d.mobileTab && ['actions', 'farm', 'cards', 'overview'].includes(d.mobileTab)) { ui.mobileTab = d.mobileTab; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  else if (d.action) beginAction(availableActions().find(a => a.id === d.action));
  else if (d.special) beginAction({ ...SPECIALS.find(a => a.id === d.special), special: true });
  else if (['season', 'alien', 'special', 'basic', 'expansion'].includes(d.jump)) {
    if (window.matchMedia('(max-width: 700px)').matches) { ui.actionCategory = d.jump; render(); }
    document.querySelector(`.${d.jump}-section`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  else if (d.cell !== undefined) clickCell(Number(d.cell));
  else if (d.view !== undefined) { if (!ui.mode || Number(d.view) === 0) { ui.view = Number(d.view); render(); } }
  else if (d.choice) submitChoice(d.choice);
  else if (d.cancel) { ui.mode = null; ui.mobileTab = 'actions'; render(); scrollToSectionOnMobile('.actions-panel'); }
  else if (d.rules) { ui.dialog = 'rules'; render(); }
  else if (d.catalogOpen) { ui.catalog = { query: '', kind: 'all', deck: 'all', page: 0 }; ui.dialog = 'catalog'; render(); }
  else if (d.catalogPage) { ui.catalog.page += d.catalogPage === 'next' ? 1 : -1; render(); }
  else if (d.close) { ui.dialog = null; if (d.close === 'rules') { try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {} } render(); scheduleAI(); }
  else if (d.newConfirm) { ui.setup = { ...DEFAULT_SETTINGS }; ui.dialog = 'new'; render(); }
  else if (d.new) { clearTimeout(ui.aiTimer); game = freshGame(ui.setup); ui.mobileTab = 'actions'; ui.actionCategory = 'basic'; ui.mode = null; ui.dialog = null; ui.view = 0; save(); render(); }
  else if (d.continue) { if (game.round === 14) { game.phase = 'ended'; save(); render(); } else nextRound(); }
  else if (d.convert === 'woodFuel' && game.settings.moor && game.phase === 'play' && game.turn === 0 && meHasWood()) { game.players[0].wood--; game.players[0].fuel++; save(); render(); }
});
function meHasWood() { return game.players[0].wood > 0; }
app.addEventListener('change', event => {
  const setting = event.target.dataset?.setting;
  if (setting === 'players') ui.setup.players = Number(event.target.value);
  if (['moor', 'cards', 'seasons', 'aliens'].includes(setting)) ui.setup[setting] = event.target.checked;
  if (event.target.matches('[data-catalog-kind]')) { ui.catalog.kind = event.target.value; ui.catalog.page = 0; render(); }
  if (event.target.matches('[data-catalog-deck]')) { ui.catalog.deck = event.target.value; ui.catalog.page = 0; render(); }
});
app.addEventListener('input', event => {
  if (!event.target.matches('[data-catalog-query]')) return;
  const position = event.target.selectionStart;
  ui.catalog.query = event.target.value; ui.catalog.page = 0; render();
  const input = app.querySelector('[data-catalog-query]');
  input?.focus(); input?.setSelectionRange(position, position);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && ui.mode) { ui.mode = null; render(); }
  else if (event.key === 'Escape' && ui.dialog === 'rules') { ui.dialog = null; render(); scheduleAI(); }
});
render();
scheduleAI();
