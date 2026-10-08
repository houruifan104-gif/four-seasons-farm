let autoRules;
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
const DEFAULT_SETTINGS = { players: 2, moor: true, cards: true, seasons: false, aliens: false, cardDeck: 'AB' };
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
  { id: 'fireplace2', name: '壁炉', cost: { clay: 2 }, points: 1, cook: { sheep: 2, boar: 2, cattle: 3 }, vegetableFood: 2, bake: 2 },
  { id: 'fireplace3', name: '壁炉', cost: { clay: 3 }, points: 1, cook: { sheep: 2, boar: 2, cattle: 3 }, vegetableFood: 2, bake: 2 },
  { id: 'hearth4', name: '烹饪灶台', cost: { clay: 4 }, points: 1, cook: { sheep: 2, boar: 3, cattle: 4 }, vegetableFood: 3, bake: 3, returnFireplace: true },
  { id: 'hearth5', name: '烹饪灶台', cost: { clay: 5 }, points: 1, cook: { sheep: 2, boar: 3, cattle: 4 }, vegetableFood: 3, bake: 3, returnFireplace: true },
  { id: 'wellMajor', name: '水井', cost: { stone: 3, wood: 1 }, points: 4 },
  { id: 'clayOven', name: '黏土烤炉', cost: { clay: 3, stone: 1 }, points: 2, bake: 5, bakeLimit: 1 },
  { id: 'stoneOven', name: '石头烤炉', cost: { clay: 1, stone: 3 }, points: 3, bake: 4, bakeLimit: 2 },
  { id: 'joinery', name: '木工坊', cost: { stone: 2, wood: 2 }, points: 2, craft: 'wood', craftPoints: [3,5,7] },
  { id: 'pottery', name: '陶器坊', cost: { stone: 2, clay: 2 }, points: 2, craft: 'clay', craftPoints: [3,5,7] },
  { id: 'basketmaker', name: '编篮坊', cost: { stone: 2, reed: 2 }, points: 2, craft: 'reed', craftPoints: [2,4,5] }
];
MAJORS.forEach((card,index)=>{card.displayId=String(index+1);card.effect=majorEffectText(card);});

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
function originalRoundDeck() {
  return [[ 'sheep','major','sow','pasture' ],['stone','renovate','grow'],['boar','veg'],['cattle','stone2'],['growNoRoom','plowSow'],['renovateFence']].flatMap(stage=>stage.map(id=>({id,sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.id));
}
function originalBoardActions(g, actions) {
  if(!g.settings.cards||!['A','B','AB'].includes(g.settings.cardDeck))return actions;
  const added=[
    {id:'renovate',name:'翻修住房',icon:'🏗',detail:'翻修后，可建造主要或次要发展',kind:'simple',ruleOp:'renovate',unlock:6},
    {id:'stone2',name:'第二采石场',icon:'🪨',detail:'每轮累积 1 石料',kind:'pile',key:'stone',add:1,unlock:11},
    {id:'growNoRoom',name:'紧急扩员',icon:'👪',detail:'无需空房的家庭增长',kind:'simple',ruleOp:'growNoRoom',unlock:12},
    {id:'plowSow',name:'耕作',icon:'🌾',detail:'开垦田地，然后播种',kind:'simple',ruleOp:'plowSow',unlock:13},
    {id:'renovateFence',name:'翻修与围栏',icon:'🏠',detail:'翻修住房，然后建围栏',kind:'simple',ruleOp:'renovateFence',unlock:14}
  ];
  if(!actions.some(a=>a.id==='travelers')&&g.players.length>=3)added.push({id:'travelers',name:'旅行艺人',icon:'🎭',detail:'每轮累积 1 食物',kind:'pile',key:'food',add:1,unlock:1});
  const deck=g.ruleRoundDeck||['sheep','major','sow','pasture','stone','renovate','grow','boar','veg','cattle','stone2','growNoRoom','plowSow','renovateFence'];
  return actions.filter(a=>!['upgradeClay','upgradeStone'].includes(a.id)).concat(added).map(a=>{
    const slot=deck.indexOf(a.id)+1;
    if(['sow','room','pasture','major'].includes(a.id))a={...a,kind:'simple',ruleOp:a.id,detail:({sow:'播种多块田，并可烤面包',room:'扩建房间，并可建马厩',pasture:'选择相邻地块围建牧场',major:'建造主要或次要发展'})[a.id]};
    return {...a,unlock:slot||(['room','first'].includes(a.id)?1:a.unlock),roundSlot:slot||null};
  });
}

function availableActions(g = game) {
  const actions = ACTIONS.concat(EXTRA_ACTIONS.filter(a => (!a.minPlayers || g.players.length >= a.minPlayers) && (!a.moor || g.settings.moor) && (!a.cards || g.settings.cards)));
  if (g.settings.seasons) actions.push(SEASON_ACTIONS[(g.round - 1) % 4]);
  if (autoRules && g === game && automaticEnabled()) actions.push(...autoRules.publicActions());
  if (g.settings.aliens) actions.push(...ALIEN_ACTIONS.filter(a => g.alienActive?.includes(a.card)));
  return originalBoardActions(g,actions);
}
function seasonName(g = game) { return g.settings.seasons ? SEASONS[(g.round - 1) % 4].name : ''; }
function winterFieldCost(g = game) { return seasonName(g) === '冬' ? 1 : 0; }
function harvestsRemaining(g = game) { return HARVEST_ROUNDS.filter(n => n >= g.round).length; }
function hasAlien(player, id) { return player.alienArtifacts.includes(id); }
function roomCost(player) { if (automaticEnabled()) return autoRules.roomCost(player); return { [player.houseMaterial]: Math.max(0, 5 - Number(player.houseMaterial === 'wood' && hasCard(player, 'mason')) - Number(player.houseMaterial === 'wood' && hasAlien(player, 'X11'))), reed: hasCard(player, 'mason') ? 1 : 2 }; }

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
  settings = { players: Math.min(6, Math.max(2, Number(settings.players) || 2)), moor: !!settings.moor, cards: !!settings.cards, seasons: !!settings.seasons, aliens: !!settings.aliens, cardDeck: ['A', 'B', 'AB'].includes(settings.cardDeck) ? settings.cardDeck : 'simple' };
  const players = Array.from({ length: settings.players }, (_, i) => freshPlayer(i ? `电脑 ${i}` : '你的农场', i > 0, settings, i));
  let draft=null;
  if (settings.cards && settings.cardDeck !== 'simple') {
    const occupations = shuffledCards('occupation', settings.cardDeck, players.length);
    const improvements = shuffledCards('minor', settings.cardDeck, players.length);
    players.forEach(p => { p.hand = { occupations: [], improvements: [] }; });
    draft={pools:{occupations:occupations.slice(0,players.length*7),improvements:improvements.slice(0,players.length*7)},limits:{occupations:7,improvements:7},turn:0,picks:0,total:players.length*14};
  }
  players[0].food = 2;
  const game = {
    version: 2, settings, round: 1, phase: draft?'draft':'play', draft, startPlayer: 0, nextStart: 0, turn: 0,
    usedCount: players.map(() => 0), workerQuota: players.map(() => 2), occupied: {}, specialUsed: {}, piles: {}, players,
    ruleRoundDeck: settings.cardDeck !== 'simple' ? originalRoundDeck() : undefined,
    logs: [], harvestSummary: null, majorSupply: MAJORS.map(c => c.id),
    alienDeck: settings.aliens ? ALIEN_CARDS.map(c => c.id).sort(() => Math.random() - .5) : [],
    alienActive: [], alienClaims: {}, alienEvents: [], alienGlobal: {}
  };
  if(!draft)replenish(game);
  addLog(game, draft?`开局选牌：职业和次要发展各公开 ${players.length*7} 张，按座位顺序每次选 1 张，每类上限 7 张。`:'春耕开始：你先派出一名家庭成员。');
  return game;
}

function pickDraftCard(seat,id) {
  const d=game.draft;
  if(game.phase!=='draft'||!d||d.turn!==seat||typeof id!=='string')return '还没轮到你选牌。';
  const kind=['occupations','improvements'].find(k=>d.pools[k].includes(id));
  if(!kind)return '这张牌已被选走或不在公共卡池。';
  if(!cardAllowedForPlayers(findHandCard(id),game.players.length))return '这张职业卡不适用于当前人数。';
  const p=game.players[seat];
  if(p.hand[kind].length>=d.limits[kind])return `${kind==='occupations'?'职业':'次要发展'}已达到 ${d.limits[kind]} 张上限，请选另一类。`;
  d.pools[kind]=d.pools[kind].filter(c=>c!==id);p.hand[kind].push(id);d.picks++;
  d.lastPick={seat,id};addLog(game,`${p.name}选取${kind==='occupations'?'职业':'次要发展'}「${findHandCard(id).name}」。`);
  if(game.players.every(p=>['occupations','improvements'].every(k=>p.hand[k].length===d.limits[k]))){
    d.completed=true;d.turn=null;game.phase='play';game.turn=game.startPlayer;replenish(game);
    addLog(game,'公共选牌完成：每人 7 张职业、7 张次要发展。第一轮开始。');
    ui.mobileTab='actions';ui.mode=null;
  }else{
    for(let offset=1;offset<=game.players.length;offset++){const next=(seat+offset)%game.players.length;if(['occupations','improvements'].some(k=>game.players[next].hand[k].length<d.limits[k])){d.turn=next;game.turn=next;break;}}
  }
  save();render();scheduleAI();
}
function chooseDraftAI(seat) {
  const d=game.draft,p=game.players[seat];
  if(game.phase!=='draft'||!d||d.turn!==seat)return null;
  const kinds=['occupations','improvements'].filter(k=>p.hand[k].length<d.limits[k]&&d.pools[k].length);
  kinds.sort((a,b)=>p.hand[a].length-p.hand[b].length);
  const cards=(d.pools[kinds[0]]||[]).map(findHandCard);
  // Favor cards with simple conditions and low material costs for the computer's opening hand.
  const value=c=>Number(c.requirement==='无')*5+(c.points||0)-Math.min(...c.costs.map(cost=>Object.values(cost).reduce((a,b)=>a+b,0)));
  return cards.sort((a,b)=>value(b)-value(a))[0]?.id;
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
      if(repairDraftPlayerLimits(saved)){try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));}catch(_){}}
      return saved;
    }
  } catch (_) { /* private browsing can block storage */ }
  return freshGame();
}
let game = loadGame();
autoRules = initAutomaticRules();
if (game.cardReview) { game.cardReview = false; if (Number.isInteger(game.pendingCardAdvance)) { autoRules.add({type:'continue',kind:'advance',seat:game.pendingCardAdvance}); delete game.pendingCardAdvance; } }
const room = new window.FarmRoom({
  change: () => { clearTimeout(ui.aiTimer); if (room.active && room.status === 'disconnected') ui.dialog = 'online'; render(); },
  state: (snapshot, seat) => { game = snapshot; if(room.host&&repairDraftPlayerLimits(game))room.publish(game); ui.view = seat; ui.mode = null; ui.dialog = null; ui.mobileTab = 'actions'; },
  command: (seat, command) => executeOnlineCommand(seat, command)
});
function meIndex() { return room.active && room.started ? room.seat : 0; }
function canControl() { return game.phase==='play' && !(automaticEnabled() && autoRules.queue.length) && (!room.active || room.started && !room.paused && !room.pending) && game.turn === meIndex(); }
function commitPlayerAction(action, option = {}) {
  if (room.active) { ui.mode = null; room.submit({ type: 'action', id: action.id, special: !!action.special, option }); }
  else if (automaticEnabled()) autoRules.begin(meIndex(),action,option);
  else applyAction(meIndex(), action, option);
}
let publishQueued = false;
try { if (!localStorage.getItem(SEEN_KEY)) ui.dialog = 'rules'; } catch (_) { ui.dialog = 'rules'; }

function save() {
  if (room.active) {
    if (room.host && room.started && !publishQueued) { publishQueued = true; queueMicrotask(() => { publishQueued = false; room.publish(game); }); }
    return;
  }
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
function emptyCells(player) { return automaticEnabled() ? autoRules.empty(player) : player.farm.map((c, i) => c.type === 'empty' ? i : -1).filter(i => i >= 0); }
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
  if (originalMode()) return originalPlayOptions(player, type);
  const deck = type === 'occupations' ? OCCUPATIONS : IMPROVEMENTS;
  return player.hand[type].map(id => deck.find(c => c.id === id)).filter(card => card && (type === 'occupations' ? player.food >= (player.played.occupations.length ? 2 : 1) : canPay(player, card.cost)));
}
function blackMarketCards(player) {
  const extra = (game.specialUsed.black || []).length ? 2 : 0;
  return playableCards(player, 'improvements').filter(c => player.food >= extra + (c.cost?.food || 0));
}
function majorCost(card, player = game.players[game.turn]) {
  const cost = automaticEnabled() ? autoRules.majorCost(player,card) : { ...card.cost };
  if (seasonName() === '秋') { const key = Object.keys(cost).find(k => cost[k] > 0); if (key) cost[key]--; }
  return cost;
}
function playableMajors(player) { return MAJORS.filter(card => game.majorSupply.includes(card.id) && canPay(player, majorCost(card, player))); }
function animalFoodValue(player, type) {
  const base = type === 'horse' ? player.horseCook || hasCard(player, 'horseOven') ? 3 : 0 : player.hearth ? { sheep: 2, boar: 3, cattle: 4 }[type] : 0;
  const worth = Math.max(base, ...player.majors.map(id => MAJORS.find(c => c.id === id)?.cook?.[type] || 0));
  const total = automaticEnabled() ? autoRules.cooking(player,type,worth) : worth;
  return game.alienGlobal.smallAnimals && total ? Math.max(1, Math.floor(total / 2)) : total;
}
function vegetableFoodValue(player) {
  const base=Math.max(1,player.hearth?3:1,...player.majors.map(id=>id.startsWith('hearth')?3:id.startsWith('fireplace')?2:1));
  return automaticEnabled()?autoRules.cooking(player,'veg',base):base;
}
function familyFoodNeed(player) {
  const newborn=automaticEnabled()?autoRules.stats(player).newborn:(player.newbornRound===game.round?player.newbornCount||0:0);
  return Math.max(0,player.family*2+(player.woozles||0)-Math.min(player.family,newborn));
}
function breadFoodValue(player) { return Math.max(player.hearth ? 2 : 0, ...player.majors.map(id => MAJORS.find(c => c.id === id)?.bake || 0)); }
function canAct(player, action) {
  if (automaticEnabled() && action.ruleOp) return autoRules.canCore(player,action);
  if (automaticEnabled() && action.rulePublic) { const own=game.players.indexOf(player)===action.owner; return action.rulePublic==='A162' ? own : action.rulePublic==='A039' ? own || player.grain>0 : player.wood>=5 && (own || player.food>0); }
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
    case 'grow': return player.family < Math.min(5, automaticEnabled() ? autoRules.housing(player) : farmCount(player, 'house'));
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
    case 'black': return player.fuel >= 1 && blackMarketCards(player).length > 0;
    case 'illicit': return player.fuel >= 1 && player.food >= 1 + reuseCost && ['horseCook', 'kiln', 'lodge'].some(id => canAct(player, EXTRA_ACTIONS.find(a => a.id === id)));
    default: return true;
  }
}
function animalCapacity(player, type) { const base = 1 + (player.stables?.[type] || 0) + (hasCard(player, 'herder') ? 1 : 0) + player.farm.filter(c => c.type === 'pasture' && c.animal === type).length * (game.alienGlobal.smallAnimals ? 6 : 3); return automaticEnabled() ? autoRules.capacity(player,type,base) : base; }
function addAnimals(player, type, amount) {
  const canKeep = Math.max(0, animalCapacity(player, type) - player[type]);
  const kept = Math.min(canKeep, amount);
  const excess = amount - kept;
  player[type] += kept;
  const worth = animalFoodValue(player, type);
  if (worth) player.food += excess * worth;
  return { kept, excess, cooked: worth > 0 && excess > 0 };
}
function actionText(who, action, extra = '') { return `${!room.active && who === 0 ? '你' : game.players[who].name}：${action.name}${extra ? '，' + extra : ''}。`; }
function playCard(player, type, choiceId, source = 'minor') {
  const card = playableCards(player, type).find(c => (c.choiceId || c.id) === choiceId);
  if (!card) return '';
  if(card.original && type==='improvements' && hasCard(player,'B075'))autoRules.gain(player,'B075',{wood:1});
  if (type === 'occupations' && card.original) {pay(player,card.cost);if(card.pool)game.piles.travelers-=card.pool;}
  else if (type === 'occupations') player.food -= player.played.occupations.length ? 2 : 1;
  else if (card.returnCooking) {
    const returned = choiceId.split(':')[1];
    player.majors = player.majors.filter(id => id !== returned);
    game.majorSupply.push(returned); delete player.majorBuiltRound[returned];
  } else pay(player, card.cost || {});
  player.hand[type] = player.hand[type].filter(x => x !== card.id);
  if (card.passing) game.players[(game.players.indexOf(player) + 1) % game.players.length].hand[type].push(card.id);
  else player.played[type].push(card.id);
  if (card.original) { player.cardHistory ||= []; player.cardHistory.push(card.id); autoRules.event('play',game.players.indexOf(player),{id:card.id,cost:card.cost,action:source}); autoRules.event(type==='occupations'?'occupation':'improvement',game.players.indexOf(player),{id:card.id,action:source}); }
  return card.name;
}
function playMajorCard(player, id) {
  const card = MAJORS.find(c => c.id === id);
  if (!card || !game.majorSupply.includes(id) || !canPay(player, majorCost(card, player))) return '';
  pay(player, majorCost(card, player));
  game.majorSupply = game.majorSupply.filter(x => x !== id);
  player.majors.push(id);
  player.majorBuiltRound[id] = game.round;
  if (automaticEnabled()) { autoRules.event('improvement',game.players.indexOf(player),{id,major:true}); if(['clayOven','stoneOven'].includes(id))autoRules.ask(player,id,'bake'); }
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

function applyAction(who, action, option = {}, ruleContext = null) {
  const player = game.players[who];
  const familyBefore=player.family;
  let detail = '';
  if (action.special && (game.specialUsed[action.id] || []).length) player.food -= 2;
  if (automaticEnabled() && action.ruleOp) {autoRules.coreAction(player,action);detail='执行'+action.name;}
  else if (action.rulePublic) {
    const owner=game.players[action.owner]; if(action.rulePublic==='A039'){if(who!==action.owner){player.grain--;owner.grain++;}autoRules.bonus(player,'A039',3);}
    if(action.rulePublic==='A162')autoRules.gain(player,'A162',{wood:3,clay:2});
    if(action.rulePublic==='B042'){if(who!==action.owner){player.food--;owner.food++;}autoRules.offer(player,'B042',[5,7,9].map((n,i)=>({cost:{wood:n},gain:{wood:8,food:[2,4,7][i]}})),false);}
  } else if (action.kind === 'pile') {
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
      player.farm[option.cell] = { type: 'field', crop: option.crop, qty: (option.crop === 'grain' ? 3 : 2) + Number(automaticEnabled() && hasCard(player,'B115')) };
      detail = `播下${option.crop === 'grain' ? '谷物' : '蔬菜'}`; break;
    case 'pasture': player.wood -= Math.max(0, 2 - Number(seasonName() === '春' || hasCard(player, 'fenceKit')) - Number(hasAlien(player, 'X11'))); player.farm[option.cell] = { type: 'pasture', animal: option.animal }; detail = `建成${ANIMALS[option.animal]}牧场${seasonName() === '春' ? '，春季围栏优惠' : ''}`; break;
    case 'room': pay(player, roomCost(player)); player.farm[option.cell] = { type: 'house' }; if (seasonName() === '夏' && Object.values(player.stables).reduce((a, b) => a + b, 0) < 4) { const type = Object.keys(ANIMALS).filter(t => t !== 'horse' || game.settings.moor).sort((a, b) => player[b] - player[a])[0]; player.stables[type]++; } detail = `新增 1 间住房${seasonName() === '夏' ? '及免费牲畜棚' : ''}`; break;
    case 'lessons': detail = `学会职业「${playCard(player, 'occupations', option.card, action.id)}」`; break;
    case 'major': detail = `建造主要发展「${playMajorCard(player, option.major)}」`; break;
    case 'minor': case 'minor6': detail = `建造小设施「${playCard(player, 'improvements', option.card, action.id)}」`; break;
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
    case 'seasonSpring': { const born = breedAnimals(player); if (option.crop && Number.isInteger(option.cell)) { player[option.crop]--; player.farm[option.cell] = { type: 'field', crop: option.crop, qty: (option.crop === 'grain' ? 3 : 2) + Number(automaticEnabled() && hasCard(player,'B115')) }; } detail = `新生牲畜 ${born.join('、') || '无'}${option.crop ? '，并播种' : ''}`; break; }
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
    case 'black': player.fuel--; detail = `建造小设施「${playCard(player, 'improvements', option.card, action.id)}」`; break;
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
  if(!automaticEnabled()&&player.family>familyBefore){player.newbornCount=(player.newbornRound===game.round?player.newbornCount||0:0)+player.family-familyBefore;player.newbornRound=game.round;}
  save();
  if (ruleContext && automaticEnabled()) {
    if (ruleContext.sameWorker && !action.special) game.usedCount[who]--;
    autoRules.afterAction(who,action,option,ruleContext.before,ruleContext);
  } else advanceTurn(who);
}

function advanceTurn(who) {
  const n = game.players.length;
  if (Number.isInteger(game.forcedNextSeat)) { const next=game.forcedNextSeat; delete game.forcedNextSeat; if(game.usedCount[next]<game.workerQuota[next]) {game.turn=next;save();render();scheduleAI();return;} }
  let next = -1;
  for (let offset = 1; offset <= n; offset++) {
    const candidate = (who + offset) % n;
    if (game.usedCount[candidate] < game.workerQuota[candidate]) { next = candidate; break; }
  }
  if (next < 0) { finishRound(); return; }
  game.turn = next;
  save(); render();
  scheduleAI();
}
function chooseAiAction(who) {
  const p = game.players[who];
  const nextHarvest = HARVEST_ROUNDS.find(n => n >= game.round) || 14;
  const foodNeed = p.family * 2 - p.food;
  const candidates = availableActions().filter(a => a.unlock <= game.round && originalCanOccupy(p,a) && canAct(p, a));
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
  if (room.active || game.phase !== 'play' || !game.players[game.turn].ai || ui.dialog) return;
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
  if (action.id === 'lessons') option.card = playableCards(p, 'occupations')[0]?.choiceId || playableCards(p, 'occupations')[0]?.id;
  if (action.id === 'major') option.major = playableMajors(p)[0]?.id;
  if (['minor', 'minor6', 'black'].includes(action.id)) option.card = playableCards(p, 'improvements')[0]?.choiceId || playableCards(p, 'improvements')[0]?.id;
  if (action.id === 'illicit') option.major = ['horseCook', 'kiln', 'lodge'].find(id => canAct(p, EXTRA_ACTIONS.find(a => a.id === id)));
  if (action.id === 'alienTransform') { const from = ['wood', 'clay', 'reed', 'stone'].sort((a, b) => p[b] - p[a])[0]; option.trade = `${from}-${from === 'stone' ? 'wood' : 'stone'}`; }
  if (action.id === 'alienStable') option.animal = p.cattle ? 'cattle' : p.boar ? 'boar' : 'sheep';
  if(automaticEnabled())autoRules.begin(who,action,option);else applyAction(who, action, option);
}
function scheduleAI() {
  clearTimeout(ui.aiTimer);
  if(!room.active&&game.phase==='draft'&&!ui.dialog&&game.players[game.draft.turn].ai){ui.aiTimer=setTimeout(()=>{const seat=game.draft?.turn;if(game.phase==='draft'&&game.players[seat]?.ai){const id=chooseDraftAI(seat);if(id)pickDraftCard(seat,id);}},350);return;}
  if (!(automaticEnabled() && autoRules.queue.length) && !room.active && game.phase === 'play' && game.players[game.turn].ai && !ui.dialog) ui.aiTimer = setTimeout(performAI, game.players.length > 2 ? 250 : 550);
}

function feed(player, fieldsDone = false) {
  let need = familyFoodNeed(player);
  const received = { crops: 0, newborn: [], fed: need, shortage: 0, heatCost: 0, cold: 0 };
  if (hasCard(player, 'silo')) player.grain++;
  received.crops = fieldsDone ? 0 : harvestFields(player);
  received.newborn = [];
  const useFood = Math.min(need, player.food);
  player.food -= useFood;
  need -= useFood;
  // Original games resolve resource conversions in the player-owned feeding dialog.
  if (!fieldsDone) {
    while (need > 0 && player.veg > 0) { player.veg--; player.food += vegetableFoodValue(player); const x = Math.min(need, player.food); player.food -= x; need -= x; }
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
  }
  if (need > 0) { player.begging += need; received.shortage = need; }
  received.newborn=breedAnimals(player);
  if(fieldsDone&&hasCard(player,'B011'))autoRules.gain(player,'B011',{food:autoRules.breedingYardFood(player)});
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
function finishRound(rulesDone = false) {
  if (automaticEnabled() && !rulesDone) { autoRules.roundEnd(); return; }
  if (game.alienActive.includes('X15')) game.players.forEach(p => { if (p.food > 0) p.food--; else p.frozenUntil = Math.max(p.frozenUntil, game.round + 1); });
  for (const p of game.players) {
    if (hasAlien(p, 'X09') && !('wood' in game.occupied)) p.wood++;
  }
  if (HARVEST_ROUNDS.includes(game.round)) {
    if (automaticEnabled()) {autoRules.harvest();return;}
    game.harvestSummary = game.players.map(p=>feed(p));
    const player = game.harvestSummary[0];
    game.phase = 'harvest';
    addLog(game, `第 ${game.round} 轮收获完成。${player.shortage ? `食物不足 ${player.shortage}，获得乞讨标记。` : '全家吃饱了。'}`);
    save(); render();
  } else nextRound();
}
function nextRound() {
  const oldPiles={...game.piles};
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
  if (automaticEnabled())autoRules.roundStart(oldPiles);
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
    parts.cards = player.played.improvements.reduce((sum, id) => sum + (findHandCard(id)?.points || 0), 0);
    parts.cardBonus = (player.cardBonus || 0) + (automaticEnabled() ? autoRules.score(player) : 0);
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
  const occupied = !originalCanOccupy(game.players[meIndex()],action);
  const inactive = room.active && (!room.started || room.paused || room.pending) || game.phase !== 'play' || !canControl() || !!ui.mode || !!ui.dialog;
  const disabled = locked || occupied || inactive || !canAct(game.players[meIndex()], action);
  const badge = locked ? `<span class="unlock-tag">第 ${action.unlock} 轮</span>` : action.kind === 'pile' ? `<span class="action-badge">${game.piles[action.id] || 0}</span>` : '';
  const usedText = occupied ? ` · ${game.occupied[action.id] === meIndex() ? '你' : game.players[game.occupied[action.id]].name}已用` : '';
  return `<button class="action-card ${action.kind === 'pile' ? ANIMALS[action.key] ? 'animal-card' : 'resource-card' : ''} ${locked ? 'locked' : ''} ${occupied ? 'used' : ''}" data-action="${action.id}" ${disabled ? 'disabled' : ''} aria-label="${action.name}，${action.detail}${usedText}">${badge}<span class="action-icon">${action.icon}</span><span class="action-title">${action.name}</span><span class="action-detail">${action.detail}${usedText}</span>${occupied ? `<span class="worker-token ${game.occupied[action.id] === meIndex() ? 'human' : 'computer'}" aria-hidden="true"></span>` : ''}</button>`;
}
function specialCard(special) {
  const used = game.specialUsed[special.id] || [];
  const disabled = game.phase !== 'play' || !canControl() || !!ui.mode || !!ui.dialog || !canSpecial(game.players[meIndex()], special, meIndex());
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
  const selectable = ui.view === meIndex() && !ui.mode?.choice ? selectedCells(p, ui.mode) : [];
  const action = ui.mode ? (ui.mode.special ? SPECIALS : availableActions()).find(a => a.id === ui.mode.id) : null;
  const prompt = action ? `请选择一块可用地块完成「${action.name}」。` : '点击行动卡派工；每个普通行动格每轮只能被占用一次。';
  const cells = p.farm.map((cell, i) => `<button class="farm-cell ${cell.type} ${selectable.includes(i) ? 'selectable' : ''}" data-cell="${i}" ${selectable.includes(i) ? '' : 'disabled'} aria-label="第 ${i + 1} 格，${cell.type === 'empty' ? '空地' : cell.type === 'forest' ? '森林' : cell.type === 'moor' ? '泥沼' : cell.type === 'circle' ? '怪圈' : cell.type === 'house' ? '住房' : cell.type === 'field' ? cell.crop === 'grain' ? '谷物田' : cell.crop === 'veg' ? '蔬菜田' : '空田' : ANIMALS[cell.animal] + '牧场'}">${cellContent(cell)}</button>`).join('');
  const views = game.players.map((person, i) => `<button data-view="${i}" class="${ui.view === i ? 'active' : ''}">${i === meIndex() ? '我的' : escapeHTML(person.name)}</button>`).join('');
  return `<section class="panel farm-panel"><div class="panel-head"><div><p class="eyebrow">HOMESTEAD</p><h2>农场地块</h2></div><span class="head-note">5 × 3 · 共 15 格</span></div><div class="farm-wrap"><div class="farm-banner"><div class="farm-player ${ui.view !== meIndex() ? 'ai' : ''}"><i class="dot"></i>${p.name}</div><div class="view-switch" aria-label="切换农场">${views}</div></div><div class="farm-field">${cells}</div><div class="farm-footer"><span>空地 <strong>${farmCount(p, 'empty')}</strong> · 田地 <strong>${farmCount(p, 'field')}</strong> · 牧场 <strong>${farmCount(p, 'pasture')}</strong></span><span>住房 <strong>${farmCount(p, 'house')}</strong> / 家人 <strong>${p.family}</strong></span></div><div class="farm-tip ${ui.mode ? 'pick' : ''}">${prompt}${ui.mode ? ' <button class="cancel-pick" data-cancel="1">取消</button>' : ''}</div><div class="mini-stats"><div class="mini-stat"><b>${game.workerQuota[ui.view] - game.usedCount[ui.view]}</b>本轮剩余派工</div><div class="mini-stat"><b>${p.sick ? `${p.sick} 人` : p.hearth ? '已建成' : '未建造'}</b>${p.sick ? '卧床病人' : '灶台'}</div><div class="mini-stat"><b>${p.begging}</b>乞讨标记</div><div class="mini-stat"><b>${score(p).total}</b>当前分数</div></div></div></section>`;
}
function cardCost(card) {
  if (card.original) return card.costLabel;
  return Object.entries(card.cost || {}).filter(([, amount]) => amount > 0).map(([key, amount]) => `${amount} ${RESOURCES.find(r => r[0] === key)[1]}`).join('、') || '无材料';
}
// Shared card face; decorative artwork never supplies rules or resource values.
const MAJOR_ARTWORK = Object.freeze({
  fireplace2:'fireplace',fireplace3:'fireplace',hearth4:'hearth',hearth5:'hearth',
  wellMajor:'well',clayOven:'clay-oven',stoneOven:'stone-oven',
  joinery:'joinery',pottery:'pottery',basketmaker:'basketmaker'
});
function cardArtwork(card, kind) {
  if(kind==='major'&&MAJOR_ARTWORK[card.id])return `<img class="fc-art-image" src="./assets/major-cards/${MAJOR_ARTWORK[card.id]}.jpg?v=pastoral-1" width="1536" height="1024" alt="" loading="lazy" decoding="async">`;
  const name = card.name || '';
  const theme = /炉|灶|烤|厨|烹|面包/.test(name) ? 'oven'
    : /羊|牛|猪|牧场|牧羊|畜|马/.test(name) ? 'herd'
    : /木|林|树|伐/.test(name) ? 'wood'
    : /谷|麦|田|耕|种|犁|粮|菜|镰/.test(name) ? 'field'
    : /井|鱼|水|池|钓/.test(name) ? 'water'
    : /屋|房|建|庄|宿/.test(name) ? 'house'
    : kind === 'occupation' ? 'worker' : 'tools';
  const motifs = {
    oven: '<path fill="#b17651" d="M100 101V68Q100 29 140 29T180 68V101Z"/><path fill="#eed5a3" d="M114 100V73Q114 48 140 48T166 73V100Z"/><path fill="#584a39" d="M120 99V77Q120 57 140 57T160 77V99Z"/><path fill="#d89b43" d="M130 95Q119 82 138 66Q134 79 148 78Q163 98 130 95Z"/><path d="M105 53H121M160 53H176M100 72H112M168 72H180M139 30V46M126 37L130 50M154 36L151 49M94 103H186"/><path d="M133 22Q121 13 134 4M150 22Q139 11 152 3" opacity=".4"/>',
    herd: '<path fill="#d8d5b4" d="M93 80Q83 61 100 52Q103 33 122 39Q137 24 151 39Q178 33 177 59Q190 75 175 86L104 88Z"/><path fill="#eee8cc" d="M98 72Q90 54 103 50Q106 38 120 45Q134 33 145 44Q161 38 166 52L165 76Z"/><path fill="#656550" d="M166 53Q187 44 190 65L182 81L169 77Z"/><path d="M110 85V104M124 87V102M158 87V104M173 84V102M184 60H185M169 53L159 47M97 63L87 56"/><path d="M78 106H203M85 102L81 94M197 101L201 94" opacity=".5"/>',
    wood: '<path fill="#5b7355" d="M96 78L117 39L107 41L128 9L149 41L140 39L160 78Z"/><path fill="#85916a" d="M153 87L168 59L161 60L179 31L197 60L190 59L205 87Z"/><path d="M128 56V104M179 72V103"/><path fill="#a47b50" d="M82 97L103 84L125 95L103 109Z"/><path fill="#e3c99a" d="M103 84L126 94V103L104 110L103 96L82 97V89Z"/><path d="M91 92L103 88M109 99L119 96"/>',
    field: '<path fill="#c3b274" d="M67 108L115 75H172L217 108Z"/><path d="M92 108L130 77M124 108L143 77M155 108L156 77M187 108L168 77" opacity=".55"/><path d="M137 76V25M122 77V40M155 77V34"/><g fill="#d6aa4b"><path d="M137 60Q117 55 122 43Q138 46 137 60ZM137 46Q153 43 152 31Q137 35 137 46ZM137 34Q125 27 136 15Q146 26 137 34ZM122 66Q103 61 109 50Q123 53 122 66ZM155 64Q172 60 169 48Q154 50 155 64Z"/></g>',
    water: '<ellipse cx="140" cy="101" rx="65" ry="9" fill="#9baea1" stroke="none"/><path fill="#c4bd98" d="M108 78Q139 68 170 78V98Q138 111 108 98Z"/><ellipse cx="139" cy="78" rx="31" ry="10" fill="#5b7169"/><path fill="#99704d" d="M108 37H116V81H108ZM162 37H170V81H162Z"/><path fill="#a67852" d="M93 40L139 13L185 40Z"/><path d="M139 40V69M107 88Q140 101 170 88M127 83V94M150 92V101"/><path fill="#c6a365" d="M132 63H148L145 77H135Z"/>',
    house: '<path fill="#d3b580" d="M98 54H181V104H98Z"/><path fill="#92624b" d="M88 56L139 19L191 56Z"/><path fill="#e8d8b0" d="M119 62H136V80H119ZM153 62H170V80H153Z"/><path fill="#7a6950" d="M136 82H153V104H136Z"/><path d="M95 106H194M127 62V80M119 71H136M162 62V80M153 71H170M172 39V22H181V45"/><path d="M71 82V105M84 80V105M64 89H94M64 99H94"/>',
    worker: '<path fill="#a07c4d" d="M122 45L126 24H151L156 45Z"/><path fill="#dfc194" d="M123 47Q121 70 140 70Q158 66 155 47Z"/><path fill="#657858" d="M105 103L110 80Q139 63 168 81L177 103Z"/><path fill="#cbb17a" d="M124 74L123 103H157L156 74L148 76V87H132V76Z"/><path d="M113 46H166M132 57H133M147 57H148M114 91L96 78M168 93L183 80M95 106V41M88 31V45H103V31M95 29V45"/>',
    tools: '<path fill="#b98c56" d="M89 99L156 28L163 34L97 106Z"/><path fill="#87917c" d="M146 27L166 15L190 39L175 51Z"/><path fill="#bd985f" d="M116 29L182 100L175 106L109 36Z"/><path fill="#7b8573" d="M104 23L122 41L109 55L91 36L92 22L101 31L110 32Z"/><path fill="#d0b782" d="M119 91H149L155 106H112Z"/><path d="M122 91V83H147V91M119 98H147"/>'
  };
  return `<svg class="fc-art-svg" viewBox="0 0 280 120" aria-hidden="true" focusable="false"><circle cx="206" cy="28" r="15" fill="#dfc489" opacity=".65"/><path d="M0 91Q49 56 100 85T210 80T280 84V120H0Z" fill="#a8b18c" opacity=".3"/><path d="M0 107Q62 85 119 104T280 93V120H0Z" fill="#97a17b" opacity=".25"/><g fill="none" stroke="#66583e" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${motifs[theme]}<path d="M36 105L39 93M38 99L31 95M241 108L243 96M243 101L249 97" opacity=".4"/></g></svg>`;
}
// Card rule data is shared by the compact text and the visible conversion rows.
function majorRuleGroups(card) {
  const rows=[];
  if(card.cook){
    rows.push({title:'随时',exchanges:[['蔬菜',card.vegetableFood],['羊',card.cook.sheep],['野猪',card.cook.boar],['牛',card.cook.cattle]].map(([resource,food])=>({resource,food}))});
  }
  if(card.bake){
    rows.push({title:'烤面包行动',exchanges:[{resource:'谷物',food:card.bake}],text:card.bakeLimit?`每次最多转换 ${card.bakeLimit} 个谷物。`:''});
    if(card.bakeLimit)rows.push({text:'建造此卡时，立即获得一次烤面包行动。'});
  }
  if(card.craft){
    const resource={wood:'木材',clay:'黏土',reed:'芦苇'}[card.craft];
    rows.push({title:'收获时',exchanges:[{resource,food:card.craft==='reed'?3:2}],text:'每次收获最多转换 1 个。'});
    rows.push({title:'游戏结束计分',text:`库存至少有 ${card.craftPoints.join('／')} 个${resource}时，分别获得 1／2／3 奖励分。`});
  }
  if(card.id==='wellMajor')rows.push({text:'在接下来的 5 个轮次格上各放置 1 食物。这些轮次开始时，领取相应的食物。'});
  return rows;
}
function majorEffectText(card) {
  return majorRuleGroups(card).map(group=>`${group.title?`${group.title}：`:''}${(group.exchanges||[]).map(row=>`1 ${row.resource} → ${row.food} 食物`).join('；')}${group.exchanges?'。':''}${group.text||''}`).join('\n');
}
function majorRulesMarkup(card) {
  return `<span class="major-rules">${majorRuleGroups(card).map(group=>`<span class="major-rule-group">${group.title?`<span class="major-rule-title">${escapeHTML(group.title)}</span>`:''}${group.exchanges?`<span class="major-exchanges">${group.exchanges.map(row=>`<span class="major-exchange"><span>1 ${escapeHTML(row.resource)}</span><span aria-hidden="true">→</span><strong>${row.food} 食物</strong></span>`).join('')}</span>`:''}${group.text?`<span class="major-rule-text">${escapeHTML(group.text)}</span>`:''}</span>`).join('')}</span>`;
}

function cardFace(c, kind, {link=false, english=false}={}) {
  const type = {occupation:'职业',minor:'次要发展',major:'主要发展'}[kind];
  const title = link ? `<button class="card-title-button" data-card-detail="${c.id}">${escapeHTML(c.name)}</button>` : escapeHTML(c.name);
  const cost = cardCost(c)+(c.returnFireplace?'，或归还 1 张壁炉':'');
  const requirement = c.requirement || '无';
  return `<span class="fc-top"><span class="fc-type">${type}${kind==='occupation'&&c.minPlayers?`<span class="fc-players" title="至少 ${c.minPlayers} 人可用">${c.minPlayers}+ 人</span>`:''}</span><span class="fc-id">${escapeHTML(c.displayId||c.id)}</span></span><span class="fc-title">${title}</span>${english&&c.nameEn?`<span class="fc-english">${escapeHTML(c.nameEn)}</span>`:''}<span class="fc-art">${cardArtwork(c,kind)}${c.points?`<span class="fc-score" aria-label="固定分 ${c.points}"><strong>${c.points}</strong><span>分</span></span>`:''}</span>${kind==='occupation'?'':`<span class="fc-cost"><span>费用</span><strong>${escapeHTML(cost)}</strong></span>`}<span class="fc-rules">${kind==='major'?majorRulesMarkup(c):`<span class="fc-effect">${escapeHTML(c.effect)}</span>`}</span>${requirement!=='无'||c.passing?`<span class="fc-bottom">${requirement!=='无'?`<span class="fc-requirement">前置 · ${escapeHTML(requirement)}</span>`:''}${c.passing?'<span class="fc-passing-rule">打出后，将此牌传给左手边的玩家，加入其手牌。</span>':''}</span>`:''}`;
}

function handPanel() {
  const p = game.players[meIndex()];
  const row = (id, type) => {
    const c = findHandCard(id);
    if (!c) return '';
    const kind=type==='occupations'?'occupation':'minor';
    return `<article class="hand-card farm-card fc-${kind}">${cardFace(c,kind,{link:!!c.original})}</article>`;
  };
  const played = p.played.occupations.concat(p.played.improvements).map(id => { const c = findHandCard(id); return c?.original ? `<button class="card-title-button" data-card-detail="${id}">${id} · ${escapeHTML(c.name)}</button>` : c?.name; }).join('、');
  return `<section class="panel cards-panel"><div class="panel-head"><div><p class="eyebrow">CARDS</p><h2>你的手牌</h2></div><span class="head-note">${originalMode() ? '原版自动牌组 · 开局 7 职业 + 7 次要发展' : '在学习职业或小型设施行动打出'}</span></div><div class="hand-grid">${p.hand.occupations.map(id => row(id, 'occupations')).join('')}${p.hand.improvements.map(id => row(id, 'improvements')).join('')}</div><div class="played-cards">已打出：${played || '无'}</div>${activeMinorPanel(p)}${automaticAbilityPanel(p)}${p.cardNotes ? `<div class="played-cards">卡牌提醒：${escapeHTML(p.cardNotes)}</div>` : ''}</section>`;
}
function activeMinorPanel(p) {
  if(!automaticEnabled())return '';
  const cards=p.played.improvements.map(findHandCard).filter(c=>c?.original);
  if(!cards.length)return '';
  const special={_plow:'开田',_stable:'免费马厩',_worker:'临时家人',_stoneRoom:'免费石屋',_minor:'次要发展',_sowFence:'播种或围栏'};
  return `<div class="active-minors"><h3>生效中的次要发展 · ${cards.length}</h3>${cards.map(c=>{
    const s=p.rules?.[c.id]||{},status=[];
    if(s.schedule?.length)status.push(s.schedule.map(x=>`第 ${x.round} 轮：${Object.entries(x.goods).map(([k,n])=>special[k]||autoRules.label({[k]:n})).join('、')}`).join('；'));
    if(s.food!==undefined)status.push(`卡上剩余 ${s.food} 食物`);
    if(s.goods?.length)status.push(`下一份：${autoRules.label({[s.goods[0]]:1})} · 卡上剩余 ${s.goods.length} 份`);
    if(c.id==='B019'||c.id==='A018')status.push(`剩余使用次数：${Math.max(0,(c.id==='B019'?2:1)-(s.used||0))}`);
    for(const f of (p.cardFields||[]).filter(f=>f.card===c.id))status.push(f.crop?`牌上田地：${autoRules.label({[f.crop]:f.qty})}`:'牌上田地：尚未播种');
    return `<details><summary>${c.id} · ${escapeHTML(c.name)}</summary><p>${escapeHTML(c.effect)}</p>${status.length?`<p class="minor-state">${escapeHTML(status.join(' · '))}</p>`:''}</details>`;
  }).join('')}</div>`;
}
function majorPanel() {
  const cards = MAJORS.map(card => `<article class="hand-card farm-card fc-major ${game.majorSupply.includes(card.id) ? '' : 'major-taken'}">${cardFace(card,'major',{link:true})}${game.majorSupply.includes(card.id)?'':'<span class="fc-owned">已建造</span>'}</article>`).join('');
  return `<section class="panel cards-panel major-panel"><div class="panel-head"><div><p class="eyebrow">MAJOR IMPROVEMENTS</p><h2>主要发展</h2></div><span class="head-note">公共牌，每张只能建造一次</span></div><div class="hand-grid">${cards}</div></section>`;
}
function alienPanel() {
  const me = game.players[meIndex()];
  const cards = game.alienActive.map(id => {
    const card = ALIEN_CARDS.find(c => c.id === id);
    const owner = game.alienClaims[id] !== undefined ? ` · ${game.players[game.alienClaims[id]].name}` : game.players.find(p => p.alienArtifacts.includes(id))?.name;
    return `<div class="hand-card"><b>${id} · ${card.name}</b><span>${ALIEN_RULES[id]}</span><small>${card.type}${owner ? ` · ${owner}` : ''}</small></div>`;
  }).join('');
  const status = [me.woozles ? `毛绒访客 ${me.woozles}` : '', me.candyActions.length ? `待收糖果：${me.candyActions.map(id => ACTIONS.find(a => a.id === id)?.name).join('、')}` : ''].filter(Boolean).join(' · ');
  return `<section class="panel cards-panel alien-panel"><div class="panel-head"><div><p class="eyebrow">X DECK</p><h2>外星人扩展</h2></div><span class="head-note">牌堆剩余 ${game.alienDeck.length} 张</span></div>${status ? `<div class="alien-status">${status}</div>` : ''}<div class="hand-grid">${cards || '<div class="played-cards">第 5 轮起，使用采石场翻开外星卡。</div>'}</div></section>`;
}
function findHandCard(id) { return ORIGINAL_CARD_CATALOG.find(c => c.id === id) || OCCUPATIONS.concat(IMPROVEMENTS).find(c => c.id === id); }
function cardAllowedForPlayers(card, playerCount) {
  return !!card && (card.kind !== 'occupation' || Number.isInteger(card.minPlayers) && card.minPlayers <= playerCount);
}
function repairDraftPlayerLimits(g) {
  if(g.phase!=='draft'||!g.draft||!['A','B','AB'].includes(g.settings.cardDeck))return false;
  const pool=g.draft.pools.occupations,n=g.players.length;
  const valid=id=>cardAllowedForPlayers(findHandCard(id),n);
  if(pool.every(valid))return false;
  const used=new Set([...pool,...g.players.flatMap(p=>p.hand.occupations.concat(p.played.occupations))]);
  const replacements=shuffledCards('occupation',g.settings.cardDeck,n).filter(id=>!used.has(id));
  const invalid=pool.filter(id=>!valid(id)).length;
  if(replacements.length<invalid)return false;
  g.draft.pools.occupations=pool.map(id=>valid(id)?id:replacements.shift());
  addLog(g,`已按 ${n} 人局替换公共池中 ${invalid} 张不适用的职业牌，已选手牌保留。`);
  return true;
}
function shuffledCards(kind, deck, playerCount) {
  const cards = ORIGINAL_CARD_CATALOG.filter(c => c.kind === kind && (deck === 'AB' || c.id.startsWith(deck)) && cardAllowedForPlayers(c,playerCount)).map(c => c.id);
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}
function originalCosts(card, player) {
  if (automaticEnabled() && player) return autoRules.cardCosts(player,card);
  if (card.id === 'A020' && game.round >= 4) return [{ grain: 1, food: 1 }];
  return card.costs;
}
function originalRequirement(p, c) {
  const n = p.played.occupations.length, f = automaticEnabled() ? autoRules.fields(p).length : farmCount(p, 'field'), pasture = automaticEnabled() ? autoRules.pastures(p).length : farmCount(p, 'pasture');
  const grainFields = p.farm.filter(t => t.crop === 'grain' && t.qty > 0).length;
  const vegFields = p.farm.filter(t => t.crop === 'veg' && t.qty > 0).length;
  const animals = p.sheep + p.boar + p.cattle;
  const material = p.wood + p.clay + p.reed + p.stone;
  const checks = {
    'ー': true, '職業1': n >= 1, '職業2': n >= 2, '職業3': n >= 3, '職業3以下': n <= 3, 'ちょうど職業2': n === 2, '職業を出していない': n === 0,
    '職業2と進歩2': n >= 2 && p.played.improvements.length + p.majors.length >= 2, '職業2とストックに建設資材1': n >= 2 && material >= 1,
    '畑2': f >= 2, '畑3': f >= 3, '小麦畑1': grainFields >= 1, '小麦畑2': grainFields >= 2, '野菜畑2': vegFields >= 2,
    '何も植えていない畑1': emptyFields(p).length > 0, '畑タイルなし': f === 0, '小麦畑がない': grainFields === 0,
    '牧場1': pasture >= 1, 'ちょうど牧場1': pasture === 1, '羊5': p.sheep >= 5, '家畜1': animals >= 1, '家畜がいない': animals === 0,
    'まだ木の家': p.houseMaterial === 'wood', '木の家ちょうど2部屋': p.houseMaterial === 'wood' && farmCount(p, 'house') === 2,
    'レンガか石の家': p.houseMaterial !== 'wood', '未使用の農場スペース4以上': farmCount(p, 'empty') >= 4,
    '未使用の農場が7スペース以下': farmCount(p, 'empty') <= 7, '農場スペースが全て使用済み': farmCount(p, 'empty') === 0,
    'ストックに小麦2': p.grain >= 2, 'ストックの木材≧現在のラウンド数': p.wood >= game.round,
    'ラウンド3(5)かその前に出す': game.round <= 5, 'ラウンド7またはその後に出す': game.round >= 7,
    ':パン:進歩': p.majors.some(id => MAJORS.find(m => m.id === id)?.bake),
    'かまどと調理場両方': p.majors.some(id => id.startsWith('fireplace')) && p.majors.some(id => id.startsWith('hearth')),
    '人物が4人以下': p.family <= 4, '家族1人が「漁」にいる': game.occupied.fish === game.players.indexOf(p),
    '手元にレンガ5以上': p.clay >= 5, '畑タイル6と、全種類の家畜': f >= 6 && p.sheep > 0 && p.boar > 0 && p.cattle > 0,
    '下記参照': pasture >= game.round - 1,
    'ストックに柵が1本以上ある': !automaticEnabled() || autoRules.fenceCount(p)<15, '製陶所(またはその改良進歩)': p.majors.includes('pottery')
  };
  if(c.id==='B154' && p.sheep>=7)return false;
  const before = c.requirementCode.match(/^ラウンド(\d+)またはその前に出す$/);
  return before ? game.round <= Number(before[1]) : checks[c.requirementCode] === true;
}
function originalPlayOptions(p, type) {
  return p.hand[type].flatMap(id => {
    const c = findHandCard(id);
    if (!c?.original || !originalRequirement(p, c) || type==='improvements'&&c.id==='A010') return [];
    if (type === 'occupations') {
      const fee=p.played.occupations.length?2:1;
      const quote={...p,food:p.food+(hasCard(p,'B063')&&p.grain?4:0)+(hasCard(p,'B109')&&p.wood?p.played.occupations.length:0)};
      return autoRules.occupationPayments(p,fee).flatMap(({cost,pool},i)=>canPay(quote,cost)?[{...c,cost,pool,choiceId:i?`${id}:pay${i}`:id,paymentLabel:`${autoRules.label(cost)}${pool?`、旅行艺人格 ${pool} 食物`:''}`}]:[]);
    }
    if (c.returnCooking) return p.majors.filter(id => /^(fireplace|hearth)/.test(id)).map(id => ({ ...c, choiceId: `${c.id}:${id}`, paymentLabel: `归还${MAJORS.find(m => m.id === id).name}` }));
    return originalCosts(c,p).flatMap((cost, i) => canPay(hasCard(p,'B075')?{...p,wood:p.wood+1}:p, cost) ? [{ ...c, cost, choiceId: `${c.id}:${i}`, paymentLabel: cardCost({ cost }) }] : []);
  });
}
function originalDeckPicker() {
  return `<label>手牌牌组<select data-setting="cardDeck">${[['simple','精简牌组 · 自动结算'],['AB','原版 A + B · 336 张 · 自动效果'],['A','原版 A · 168 张 · 自动效果'],['B','原版 B · 168 张 · 自动效果']].map(([v,n]) => `<option value="${v}" ${(ui.setup.cardDeck || 'simple') === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><p class="deck-help">原版开局：职业、次要发展各公开人数 × 7 张，轮流选 1 张，每人每类上限 7 张。选满后开始经营，自动扣打牌费用、计固定分、传递牌；卡牌效果自动触发，可选效果由持牌玩家选择。棋盘仍用本作简化规则。</p>`;
}
function cardDetailDialog() {
  const c = findHandCard(ui.detailCard)||MAJORS.find(card=>card.id===ui.detailCard);
  if (!c) return '';
  const kind=c.kind||(MAJORS.includes(c)?'major':OCCUPATIONS.includes(c)?'occupation':'minor');
  return `<div class="modal-backdrop"><section class="modal card-detail" role="dialog" aria-modal="true" aria-label="卡牌详情"><article class="detail-face farm-card fc-${kind}">${cardFace(c,kind)}</article><div class="modal-actions"><button class="primary-btn" data-card-back="1">${ui.cardReturn === 'catalog' ? '返回牌库' : '返回游戏'}</button></div></section></div>`;
}

function automaticEnabled() { return !!autoRules?.active; }
function originalCanOccupy(p, a) { return automaticEnabled() ? autoRules.canOccupy(p,a) : a.repeatable || !(a.id in game.occupied); }
function automaticChoiceDialog() {
  const t=autoRules.choice();if(!t)return '';
  const card=findHandCard(t.card),owner=game.players[t.seat],mine=t.seat===meIndex();
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="自动卡牌效果"><p class="eyebrow">${escapeHTML(t.card||'')} · ${escapeHTML(owner.name)}</p><h2>${escapeHTML(t.type==='feeding'?'喂养家人':card?.name||t.title||'选择附加行动')}</h2>${t.type==='feeding'?`<p>本次需要 <strong>${familyFoodNeed(owner)}</strong> 食物，库存 <strong>${owner.food}</strong> 食物。${owner.food<familyFoodNeed(owner)?`还差 ${familyFoodNeed(owner)-owner.food} 食物，可选择下方兑换。`:'食物已经足够，可以完成喂养。'}</p><p>兑换由你决定，系统不会自动吃掉谷物、蔬菜或牲畜。喂养后才繁殖，每种最多增加 1 只。</p>`:''}${card?`<p>${escapeHTML(card.effect)}</p>`:''}${mine?`<div class="modal-choice many">${t.options.map(o=>`<button class="choice-btn" data-rule-choice="${escapeHTML(o.value)}"><b>${escapeHTML(o.label)}</b>${o.cost?`<small>${autoRules.label(o.cost)||'无费用'}</small>`:''}${o.major?majorRulesMarkup(MAJORS.find(c=>c.id===o.major)):''}</button>`).join('')}</div>`:`<p role="status">等待${escapeHTML(owner.name)}选择，结果会自动同步。</p>`}</section></div>`;
}
function automaticAbilityPanel(p) {
  if(!automaticEnabled())return '';
  const abilities=autoRules.abilities(p);
  return abilities.length?`<div class="card-abilities"><h3>随时效果</h3>${abilities.map(t=>`<button class="ghost-btn" data-rule-ability="${t.card}" ${!canControl()?'disabled':''}>${escapeHTML(findHandCard(t.card).name)}</button>`).join('')}</div>`:'';
}
function automaticContinue(task) {
  if(task.kind==='base') {
    game.ruleActionSerial=(game.ruleActionSerial||0)+1;
    const p=game.players[task.seat],before=JSON.parse(JSON.stringify(p));
    const context={pile:game.piles[task.action.id]||0,hasLargePile:Object.values(game.piles).some(n=>n>=5),extra:task.extra,finish:!task.extra,sameWorker:task.sameWorker};
    applyAction(task.seat,task.action,task.option,{before,...context});
  } else if(task.kind==='advance') {
    ui.mode=null;ui.dialog=null;advanceTurn(task.seat);
  } else if(task.kind==='roundEnd') {
    finishRound(true);
  } else if(task.kind==='fields') {
    game.ruleHarvest=game.players.map(p=>({crops:autoRules.collectFields(p)}));
    for(let i=0;i<game.players.length;i++)autoRules.event('feed',i);
    autoRules.add({type:'continue',kind:'feed'});
  } else if(task.kind==='feed') {
    game.harvestSummary=game.players.map((p,i)=>({...feed(p,true),crops:game.ruleHarvest[i].crops}));
    delete game.ruleHarvest;
    for(let i=0;i<game.players.length;i++)autoRules.event('harvestAfter',i);
    autoRules.add({type:'continue',kind:'harvestDone'});
  } else if(task.kind==='harvestDone') {
    game.phase='harvest';addLog(game,`第 ${game.round} 轮收获与卡牌效果已自动结算。`);
  }
}
function automaticExtraAction(seat,id,options={}) {
  const action=availableActions().find(a=>a.id===id);if(!action)return;
  autoRules.ask(game.players[seat],options.card,'actionChoice',{action,sameWorker:options.sameWorker},false);
}
function initAutomaticRules() {
  return new window.OriginalRules({
    game:()=>game,card:findHandCard,majors:MAJORS,log:message=>addLog(game,message),actions:()=>availableActions(),
    animals:addAnimals,capacity:animalCapacity,animalFood:animalFoodValue,vegetableFood:vegetableFoodValue,foodNeed:familyFoodNeed,requirement:originalRequirement,canAct,save,render,
    continue:automaticContinue,extraAction:automaticExtraAction,
    choices:(p,id)=>availableActions().find(a=>a.id===id)?.ruleOp ? {options:[]} : choiceOptions(p,id),cells:(p,id)=>selectedCells(p,{id}),
    aiChoice:(seat,value)=>{clearTimeout(ui.aiTimer);ui.aiTimer=setTimeout(()=>autoRules.choose(seat,autoRules.aiOption(autoRules.choice())||value),120);}
  });
}

function originalMode() { return game.settings.cards && ['A', 'B', 'AB'].includes(game.settings.cardDeck); }
function catalogDialog() {
  const state = ui.catalog, query = state.query.trim().toLocaleLowerCase();
  const filtered = ORIGINAL_CARD_CATALOG.filter(c => (state.kind === 'all' || c.kind === state.kind) && (state.deck === 'all' || c.id.startsWith(state.deck)) && (!query || `${c.id} ${c.name} ${c.nameEn} ${c.effect}`.toLocaleLowerCase().includes(query)));
  const pages = Math.max(1, Math.ceil(filtered.length / 36));
  state.page = Math.min(state.page, pages - 1);
  const visible = filtered.slice(state.page * 36, (state.page + 1) * 36);
  const items = visible.map(c => `<button class="catalog-card farm-card fc-${c.kind}" data-card-detail="${c.id}" aria-label="查看${escapeHTML(c.name)}详情">${cardFace(c,c.kind)}</button>`).join('');
  return `<div class="modal-backdrop"><div class="modal catalog-modal" role="dialog" aria-modal="true" aria-label="原版牌库"><p class="eyebrow">ORIGINAL CARDS · A / B</p><h2>原版牌库</h2><p>15 周年版 A/B：168 张职业 · 168 张次要发展。</p><div class="catalog-controls"><input data-catalog-query type="search" value="${escapeHTML(state.query)}" placeholder="搜索卡号、中文、英文或效果"><select data-catalog-kind><option value="all" ${state.kind === 'all' ? 'selected' : ''}>全部类别</option><option value="occupation" ${state.kind === 'occupation' ? 'selected' : ''}>职业</option><option value="minor" ${state.kind === 'minor' ? 'selected' : ''}>次要发展</option></select><select data-catalog-deck><option value="all" ${state.deck === 'all' ? 'selected' : ''}>A + B 牌组</option><option value="A" ${state.deck === 'A' ? 'selected' : ''}>A 牌组</option><option value="B" ${state.deck === 'B' ? 'selected' : ''}>B 牌组</option></select></div><div class="catalog-count">找到 ${filtered.length} 张 · 第 ${state.page + 1} / ${pages} 页</div><div class="catalog-grid">${items || '<p>没有符合条件的卡牌。</p>'}</div><div class="modal-actions catalog-pagination"><button class="ghost-btn" data-catalog-page="prev" ${state.page <= 0 ? 'disabled' : ''}>上一页</button><button class="ghost-btn" data-catalog-page="next" ${state.page >= pages - 1 ? 'disabled' : ''}>下一页</button><button class="primary-btn" data-close="catalog">关闭</button></div></div></div>`;
}
function rulesDialog() {
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="玩法说明"><p class="eyebrow">HOW TO PLAY</p><h2>经营四季田园</h2><p>14 轮内，你与${room.active ? '其他玩家' : '电脑'}轮流派出家人，占用行动格来经营农场。资源格每轮累积，取走时一次获得全部。第 4、7、9、11、13、14 轮结束后收获。</p><h3>基础经营</h3><ul><li>开田、播种、建房、牧场需点击农场格子。每位家人每轮只能行动一次；扩员增加下轮起的派工人数。</li><li>${originalMode()?'收获时先收田地产物，再喂养家人，最后繁殖。成年人需 2 食物，当轮新生儿需 1 食物。':'收获时先收田地产物，再喂养家人，最后繁殖。成年人需 2 食物，当轮新生儿需 1 食物。'}不足的食物变成乞讨标记。</li><li>${originalMode()?'住房共享 1 个宠物位置；牧场每格容量为 2，同一牧场内每座马厩使容量翻倍。':'每种牲畜可留养 1 只，对应牧场每格再容纳 3 只。'}两只以上且有空间才会繁殖。</li></ul>${game.settings.moor ? `<h3>沼泽与冬季</h3><ul><li>农场起始有 5 片森林、3 片泥沼。特殊行动不占用家人；同一特殊行动被别人第二次使用时，需付 2 食物。</li><li>伐木移除森林得木材，切泥炭移除泥沼得燃料。收获时每间木屋需 1 燃料；黏土屋减 1、石屋减 2。木材可按 1:1 代替燃料。</li><li>供暖不足会有人卧床，下轮这些人只能去医务所。马可饲养和繁殖；普通灶台不能烹饪马。</li></ul>` : ''}${game.settings.cards ? `<h3>职业与设施</h3><p>“学习职业”与“小型设施”可从手牌选择并支付费用，获得持续效果与分数。${originalMode() ? '原版开局先从公共卡池轮流选牌：每次选 1 张，每人选满 7 张职业和 7 张次要发展后进入第一轮。打牌费用、资源、固定分与卡牌触发自动处理；需要决定时由持牌玩家选择。' : '当前精简牌组的效果自动生效。'}</p>` : ''}${game.settings.seasons ? `<h3>四季流转</h3><p>春、夏、秋、冬每轮轮换。每季有一个独立行动格，并在补充资源、派工或收获时改变规则。当前季节与效果显示在行动区顶部。</p>` : ''}${game.settings.aliens ? `<h3>外星人扩展</h3><p>第 5 轮起，使用采石场会翻开 1 张外星卡。行动卡增加公共行动；商人、神器、事件和职业按卡牌说明生效。此版按简化规则系统改编，所有效果可在外星卡区查看。</p>` : ''}<div class="modal-actions"><button class="primary-btn" data-close="rules">开始经营</button></div></div></div>`;
}
function choiceOptions(p, id) {
  let options = [], title = '选择';
  if (id === 'sow') { title = '选择种子'; options = [['grain', '🌾 谷物', p.grain > 0, '可收获 3 次'], ['veg', '🥕 蔬菜', p.veg > 0, '可收获 2 次']]; }
  else if (id === 'pasture' || id === 'animalMarket') {
    title = id === 'pasture' ? '选择牧场牲畜' : '选择牲畜';
    options = [['sheep', '🐑 羊', true, id === 'animalMarket' ? '另得 1 食物' : ''], ['boar', '🐗 猪', true, ''], ['cattle', '🐄 牛', id !== 'animalMarket' || p.food > 0, id === 'animalMarket' ? '需付 1 食物' : '']];
    if (game.settings.moor && id === 'pasture') options.push(['horse', '🐎 马', true, '']);
  } else if (id === 'lessons') { title = '选择职业'; options = playableCards(p, 'occupations').map(c => [c.choiceId || c.id, c.name, true, `${c.paymentLabel ? c.paymentLabel+' · ' : ''}${c.effect}`]); }
  else if (id === 'major') { title = '建造主要发展'; options = playableMajors(p).map(c => [c.id, c.name, true, `${cardCost({ cost: majorCost(c) })} · ${c.effect}`]); }
  else if (id === 'minor' || id === 'minor6' || id === 'black') { title = '选择小设施'; options = (id === 'black' ? blackMarketCards(p) : playableCards(p, 'improvements')).map(c => [c.choiceId || c.id, c.name, true, `${c.paymentLabel || cardCost(c)} · ${c.effect}`]); }
  else if (id === 'illicit') { title = '选择大型设施'; options = ['horseCook', 'kiln', 'lodge'].filter(major => canAct(p, EXTRA_ACTIONS.find(a => a.id === major))).map(major => { const a = EXTRA_ACTIONS.find(x => x.id === major); return [major, a.name, true, a.detail]; }); }
  else if (id === 'farmSupplies') { title = '选择农具补给'; options = [['plow', '⚒ 开田', emptyCells(p).length > 0 && p.food >= (seasonName() === '冬' ? 2 : 1), `付 ${seasonName() === '冬' ? 2 : 1} 食物，在空地开田`], ['grain', '🌾 谷种', true, '付 1 食物，获得 1 谷种']]; }
  else if (id === 'seasonSpring') { title = '春日耕育'; options = [['breed', '只繁殖', true, '立刻进行一次牲畜繁殖'], ['grain', '繁殖并播谷', p.grain > 0 && emptyFields(p).length > 0, '再选择 1 块空田'], ['veg', '繁殖并播菜', p.veg > 0 && emptyFields(p).length > 0, '再选择 1 块空田']]; }
  else if (id === 'seasonSummer') { title = '夏日劳作'; options = [['plow', '只开田', emptyCells(p).length > 0, '选择 1 块空地'], ['sell', '只卖谷种', p.grain > 0, '1 谷种换 4 食物'], ['bake', '只烤面包', p.grain > 0 && breadFoodValue(p) > 0, '需烘焙设施'], ['both', '开田并卖谷种', p.grain > 0 && emptyCells(p).length > 0, '选择 1 块空地'], ['plowBake', '开田并烤面包', p.grain > 0 && breadFoodValue(p) > 0 && emptyCells(p).length > 0, '选择 1 块空地']]; }
  else if (id === 'alienTransform') { title = '变形装置：交换建材'; options = ['wood', 'clay', 'reed', 'stone'].flatMap(from => ['wood', 'clay', 'reed', 'stone'].filter(to => to !== from).map(to => [`${from}-${to}`, `${RESOURCES.find(r => r[0] === from)[1]} → ${RESOURCES.find(r => r[0] === to)[1]}`, p[from] > 0, `全部 ${p[from]} 个` ])); }
  else if (id === 'alienStable') { title = '选择牲畜棚'; options = Object.entries(ANIMALS).filter(([type]) => game.settings.moor || type !== 'horse').map(([type, name]) => [type, name, true, '花 1 木材，该牲畜容量 +1']); }
  else if (id === 'resourceTrade') { title = '选择两种建材'; options = [['wood-reed', '木材 + 芦苇', true, '另得 1 食物'], ['wood-stone', '木材 + 石料', true, '另得 1 食物'], ['clay-reed', '黏土 + 芦苇', true, '另得 1 食物'], ['clay-stone', '黏土 + 石料', true, '另得 1 食物']]; }
  else if (id === 'sideJob') { title = '选择牲畜棚'; options = Object.entries(ANIMALS).filter(([type]) => game.settings.moor || type !== 'horse').map(([type, name]) => [type, name, true, '付 1 木材，该牲畜容量 +1']); }
  return { options, title };
}
function choiceDialog() {
  if (!ui.mode?.choice) return '';
  const { options, title } = choiceOptions(game.players[meIndex()], ui.mode.id);
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">CHOOSE</p><h2>${title}</h2><div class="modal-choice ${options.length > 3 ? 'many' : ''}">${options.map(([value, label, enabled, detail]) => `<button class="choice-btn" data-choice="${value}" ${enabled ? '' : 'disabled'}><b>${label}</b>${ui.mode.id==='major'?`<small>${cardCost({cost:majorCost(MAJORS.find(c=>c.id===value))})}</small>${majorRulesMarkup(MAJORS.find(c=>c.id===value))}`:`<small>${detail}</small>`}</button>`).join('')}</div><div class="modal-actions"><button class="ghost-btn" data-cancel="1">取消</button></div></div></div>`;
}
function harvestDialog() {
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">HARVEST · ROUND ${game.round}</p><h2>收获结算</h2><p>收田 → 喂养 → 繁殖。新生牲畜不能用于本次喂养。</p><div class="harvest-grid">${game.harvestSummary.map((s, i) => `<div class="harvest-card ${i ? 'ai' : ''}"><b>${game.players[i].name}</b>收获作物：${s.crops}<br>新生牲畜：${s.newborn.length ? s.newborn.join('、') : '无'}<br>喂养：应付 ${s.fed} · 实付 ${s.fed-s.shortage}${s.shortage ? `<br><strong>食物不足 ${s.shortage}</strong>` : '<br>全家吃饱 ✓'}${game.settings.moor ? `<br>房屋供暖：${s.heatCost} 燃料${s.cold ? `<br><strong>供暖不足 ${s.cold}，有人卧床</strong>` : '<br>温暖过冬 ✓'}` : ''}</div>`).join('')}</div><div class="modal-actions">${room.active ? '<button class="ghost-btn" data-online="1">查看房间</button>' : ''}<button class="primary-btn" data-continue="1" ${room.active && (!room.host || room.paused) ? 'disabled' : ''}>${room.active && !room.host ? '等待房主继续' : game.round === 14 ? '查看结算' : '进入下一轮'}</button></div></div></div>`;
}
function endingDialog() {
  const mine = score(game.players[meIndex()]);
  const exact42 = game.alienActive.includes('X13') && game.players.some(p => score(p).total === 42);
  const ranking = game.players.map((p, i) => ({ name: p.name, points: score(p).total, i })).sort((a, b) => Number(exact42 && b.points === 42) - Number(exact42 && a.points === 42) || b.points - a.points);
  const labels = { family: '家庭成员', rooms: '住房', fields: '田地', pastures: '牧场', varieties: '物产种类', herd: '牲畜数量', hearth: '灶台', empty: '未利用土地', begging: '乞讨标记', horses: '马', moorBuildings: '沼泽建筑', moorBonus: '沼泽奖励', cards: '小设施', cardBonus: '卡牌奖励', majors: '主要发展', craftBonus: '工坊余材', aliens: '外星卡' };
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">THE FOURTEENTH HARVEST</p><h2>${ranking[0].i === meIndex() ? '你的农场欣欣向荣' : '还有一个春天等着你'}</h2><p>14 轮经营结束，最终排名如下。${exact42 ? '外星事件：恰好 42 分优先获胜。' : ''}</p><div class="ranking">${ranking.map((r, i) => `<div class="score-row"><span>${i + 1}. ${r.name}</span><b>${r.points} 分</b></div>`).join('')}</div><h3>你的农场账本</h3>${Object.entries(mine.parts).map(([key, value]) => `<div class="score-row"><span>${labels[key]}</span><b>${value > 0 ? '+' : ''}${value}</b></div>`).join('')}<div class="modal-actions"><button class="primary-btn" data-new-confirm="1">再玩一局</button></div></div></div>`;
}
function newDialog() {
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><p class="eyebrow">NEW GAME</p><h2>开启一座新农场</h2><p>选择要启用的扩展。开始后会替换当前进度。</p><div class="setup-grid"><label>玩家数（你 + 电脑）<select data-setting="players">${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${ui.setup.players === n ? 'selected' : ''}>${n} 人${n >= 5 ? ' · 扩展行动格' : ''}</option>`).join('')}</select></label><label class="check-row"><input type="checkbox" data-setting="moor" ${ui.setup.moor ? 'checked' : ''}> 沼泽农夫：森林、泥沼、燃料、马、特殊行动</label><label class="check-row"><input type="checkbox" data-setting="seasons" ${ui.setup.seasons ? 'checked' : ''}> 四季流转：季节行动与资源变化</label><label class="check-row"><input type="checkbox" data-setting="cards" ${ui.setup.cards ? 'checked' : ''}> 职业与次要发展</label>${originalDeckPicker()}<label class="check-row"><input type="checkbox" data-setting="aliens" ${ui.setup.aliens ? 'checked' : ''}> 外星人：24 张 X 卡，采石场触发</label></div><div class="modal-actions"><button class="ghost-btn" data-close="new">返回</button><button class="primary-btn" data-new="1">开始新游戏</button></div></div></div>`;
}
function draftPanel() {
  const d=game.draft,me=game.players[meIndex()],owner=game.players[d.turn];
  const available=!room.active||room.started&&!room.paused&&!room.pending;
  const mine=d.turn===meIndex()&&available;
  if(!['occupations','improvements'].includes(ui.draftKind))ui.draftKind='occupations';
  const kind=ui.draftKind,label=kind==='occupations'?'职业':'次要发展',full=me.hand[kind].length>=7;
  const progress=game.players.map((p,i)=>`<div class="draft-seat ${i===d.turn?'is-current':''}"><strong>${i+1}. ${escapeHTML(p.name)}${i===meIndex()?' · 你':''}</strong><span>职业 ${p.hand.occupations.length}/7 · 次发 ${p.hand.improvements.length}/7</span>${i===d.turn?'<b>正在选牌</b>':''}</div>`).join('');
  const pool=d.pools[kind].map(id=>{const c=findHandCard(id),type=kind==='occupations'?'occupation':'minor';return `<article class="draft-card farm-card fc-${type}">${cardFace(c,type,{link:true})}<button class="primary-btn fc-pick" data-draft-pick="${id}" ${!mine||full?'disabled':''}>${full?'该类已满 7 张':mine?'选入手牌':'等待轮到你'}</button></article>`;}).join('');
  const hands=game.players.map((p,i)=>`<details ${i===meIndex()?'open':''}><summary>${escapeHTML(p.name)} · 已选 ${p.hand.occupations.length+p.hand.improvements.length}/14</summary>${['occupations','improvements'].map(k=>`<div><b>${k==='occupations'?'职业':'次要发展'} ${p.hand[k].length}/7</b><p>${p.hand[k].map(id=>`<button class="card-title-button" data-card-detail="${id}">${escapeHTML(findHandCard(id).name)}</button>`).join('、')||'尚未选择'}</p></div>`).join('')}</details>`).join('');
  return `<main class="shell draft-shell"><header class="masthead"><div class="brand"><div class="brand-mark">✳</div><div><h1>开局 · 公共选牌</h1><p>FOUR SEASONS FARM</p></div></div><div class="header-actions"><button class="ghost-btn" data-cover-settings="1">摸鱼模式</button><button class="ghost-btn" data-online="1">${room.active?'房间':'多人联机'}</button><button class="ghost-btn" data-rules="1">玩法</button><button class="ghost-btn" data-new-confirm="1" ${room.active?'disabled':''}>新游戏</button></div></header>${room.active?onlineBar():''}<section class="draft-intro"><h2>${mine?'轮到你，选择 1 张牌':`等待${escapeHTML(owner.name)}选择 1 张牌`}</h2><p>职业、次要发展各公开 ${game.players.length} × 7 = ${game.players.length*7} 张。按 1 → ${game.players.length} → 1 的顺序轮流选择，每次任选一类拿 1 张，每人每类上限 7 张。</p><p>职业池已按当前 ${game.players.length} 人筛选。选牌免费，不执行卡牌效果；所有人选满后开始第一轮。</p><progress max="${d.total}" value="${d.picks}" aria-label="公共选牌进度"></progress><span>已选 ${d.picks} / ${d.total} 张</span>${d.lastPick?`<p class="draft-last" role="status">${escapeHTML(game.players[d.lastPick.seat].name)}刚选了「${escapeHTML(findHandCard(d.lastPick.id).name)}」</p>`:''}</section><section class="draft-seats" aria-label="选牌顺序">${progress}</section><div class="draft-layout"><section class="draft-pool"><nav class="draft-tabs" aria-label="公共卡池类别">${[['occupations','职业'],['improvements','次要发展']].map(([k,n])=>`<button class="ghost-btn ${k===kind?'active':''}" data-draft-kind="${k}" aria-pressed="${k===kind}">${n}池 · 剩 ${d.pools[k].length} 张<span>你已选 ${me.hand[k].length}/7</span></button>`).join('')}</nav><div class="draft-grid">${pool||'<p class="draft-empty">这一类的牌已全部选完。</p>'}</div></section><aside class="draft-hands"><h2>已选手牌</h2>${hands}</aside></div></main>`;
}
function render() {
  if(game.phase==='draft'){
    const overlay=(room.active&&!room.started)||ui.dialog==='online'?onlineDialog():ui.dialog==='rules'?rulesDialog():ui.dialog==='cardDetail'?cardDetailDialog():ui.dialog==='catalog'?catalogDialog():ui.dialog==='new'?newDialog():'';
    app.innerHTML=draftPanel()+overlay+(ui.toast?`<div class="notice" role="status">${escapeHTML(ui.toast)}</div>`:'');return;
  }
  const me = game.players[meIndex()];
  if (ui.view >= game.players.length) ui.view = meIndex();
  const currentTurn = game.phase === 'play' ? canControl() ? me.sick ? '病人需先前往医务所' : '轮到你派工' : `${escapeHTML(game.players[game.turn].name)}${room.active ? '派工中' : '正在思考…'}` : game.phase === 'harvest' ? '收获季' : '游戏结束';
  const nextHarvest = HARVEST_ROUNDS.find(n => n >= game.round);
  const track = Array.from({ length: 14 }, (_, i) => `<i class="${i + 1 < game.round ? 'past' : i + 1 === game.round ? 'now' : ''}" title="第 ${i + 1} 轮"></i>`).join('');
  const resources = game.settings.moor ? RESOURCES : RESOURCES.slice(0, 10);
  const actions = availableActions();
  const currentActions = actions.filter(a => a.unlock <= game.round);
  const laterActions = actions.filter(a => a.unlock > game.round);
  const basicActions = currentActions.filter(a => !EXTRA_ACTIONS.some(x=>x.id===a.id)&&!ALIEN_ACTIONS.some(x=>x.id===a.id)&&!SEASON_ACTIONS.some(x=>x.id===a.id)&&!a.rulePublic&&a.owner===undefined);
  const expansionActions = currentActions.filter(a => EXTRA_ACTIONS.some(x=>x.id===a.id)||a.rulePublic||a.owner!==undefined);
  const alienActions = currentActions.filter(a => ALIEN_ACTIONS.some(x=>x.id===a.id));
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
  const resourceTray = `<section class="resource-tray"><div class="tray-heading"><span>资源收纳盒</span><small>剩余派工 ${Math.max(0, game.workerQuota[meIndex()] - game.usedCount[meIndex()])} / ${game.workerQuota[meIndex()]}</small></div><div class="summary-strip ${game.settings.moor ? 'expanded' : ''}">${resources.map(r => resCard(r, me)).join('')}</div>${game.settings.moor ? `<div class="expansion-line"><button data-convert="woodFuel" ${me.wood && game.phase === 'play' && canControl() ? '' : 'disabled'}>1 木材 → 1 燃料</button></div>` : ''}</section>`;
  const scorePanel = `<section class="panel info-box tabletop-score"><h3>计分与收获</h3>${scores}<div class="score-row"><span>下次收获</span><b>${nextHarvest ? `第 ${nextHarvest} 轮` : '已结束'}</b></div><div class="score-row"><span>当前先手</span><b>${game.players[game.startPlayer].name}</b></div></section>`;
  const logPanel = `<section class="panel info-box tabletop-log"><h3>农场日志</h3><div class="log-list">${game.logs.slice(0, 6).map(item => `<div class="log-line"><time>第 ${item.round} 轮</time><span>${escapeHTML(item.message)}</span></div>`).join('')}</div></section>`;
  app.innerHTML = `<div class="shell tabletop-shell" data-mobile-screen="${mobileTab}" data-mobile-category="${ui.actionCategory}"><header class="masthead"><div class="brand"><div class="brand-mark">✳</div><div><h1>四季田园</h1><p>FOUR SEASONS FARM</p></div></div><div class="header-actions"><button class="ghost-btn" data-cover-settings="1">摸鱼模式</button><button class="ghost-btn" data-online="1">${room.active ? '房间' : '多人联机'}</button><button class="ghost-btn" data-rules="1">玩法</button><button class="ghost-btn" data-catalog-open="1">原版牌库</button><button class="ghost-btn" data-new-confirm="1" ${room.active ? 'disabled' : ''}>新游戏</button><span class="round-pill">第 ${game.round} / 14 轮</span></div></header>${room.active ? onlineBar() : ''}${turnBar}<div class="tabletop-layout">${game.settings.cards ? `<div class="table-major">${majorPanel()}</div>` : ''}<div class="table-farm">${farmPanel()}</div><div class="table-actions">${actionsPanel}</div><aside class="table-side">${resourceTray}${scorePanel}${logPanel}</aside>${game.settings.cards || game.settings.aliens ? `<div class="table-hand">${game.settings.cards ? handPanel() : ''}${game.settings.aliens ? alienPanel() : ''}</div>` : ''}</div><footer class="footer">原创精简游戏 · 灵感来自 Uwe Rosenberg 的《Agricola》 · 本作与 Lookout Games 无关联</footer>${mobileNav}</div>${(room.active && !room.started) || ui.dialog === 'online' ? onlineDialog() : ui.dialog === 'rules' ? rulesDialog() : ui.dialog === 'cardDetail' ? cardDetailDialog() : ui.dialog === 'catalog' ? catalogDialog() : ui.dialog === 'new' ? newDialog() : automaticEnabled() && autoRules.choice() ? automaticChoiceDialog() : ui.mode?.choice ? choiceDialog() : game.phase === 'harvest' ? harvestDialog() : game.phase === 'ended' ? endingDialog() : ''}${ui.toast ? `<div class="notice" role="status">${escapeHTML(ui.toast)}</div>` : ''}`;
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
  if (game.phase !== 'play' || !canControl() || ui.dialog || ui.mode) return;
  if (action.special ? !canSpecial(game.players[meIndex()], action, meIndex()) : action.unlock > game.round || !originalCanOccupy(game.players[meIndex()],action) || !canAct(game.players[meIndex()], action)) return;
  if (action.kind === 'target' || action.kind === 'choice') {
    ui.view = meIndex();
    ui.mode = { id: action.id, special: !!action.special, choice: action.kind === 'choice' || ['sow', 'pasture'].includes(action.id) };
    render();
    if (!ui.mode.choice) scrollToSectionOnMobile('.farm-field');
  } else commitPlayerAction(action);
}
function clickCell(index) {
  if (!ui.mode || !canControl() || ui.view !== meIndex() || ui.mode.choice) return;
  if (!selectedCells(game.players[meIndex()], ui.mode).includes(index)) return;
  const action = (ui.mode.special ? SPECIALS.map(a => ({ ...a, special: true })) : availableActions()).find(a => a.id === ui.mode.id);
  commitPlayerAction(action, { cell: index, crop: ui.mode.crop, animal: ui.mode.animal, supply: ui.mode.supply });
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
  commitPlayerAction(action, { animal: value, card: value, major: value, supply: value, trade: value });
}
app.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const d = button.dataset;
  if (handleOnlineClick(d)) return;
  if(d.draftKind&&['occupations','improvements'].includes(d.draftKind)){ui.draftKind=d.draftKind;render();return;}
  if(d.draftPick){if(room.active)room.submit({type:'draftPick',id:d.draftPick});else{const error=pickDraftCard(meIndex(),d.draftPick);if(error)toast(error);}return;}
  if (d.cardDetail) { ui.cardReturn = ui.dialog; ui.detailCard = d.cardDetail; ui.dialog = 'cardDetail'; render(); return; }
  if (d.cardBack) { ui.dialog = ui.cardReturn; render(); return; }
  if(d.ruleChoice) { if(room.active)room.submit({type:'ruleChoice',value:d.ruleChoice});else autoRules.choose(meIndex(),d.ruleChoice);return; }
  if(d.ruleAbility) { if(room.active)room.submit({type:'ruleAbility',id:d.ruleAbility});else autoRules.activate(meIndex(),d.ruleAbility);return; }
  if (d.mobileTab && ['actions', 'farm', 'cards', 'overview'].includes(d.mobileTab)) { ui.mobileTab = d.mobileTab; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  else if (d.action) beginAction(availableActions().find(a => a.id === d.action));
  else if (d.special) beginAction({ ...SPECIALS.find(a => a.id === d.special), special: true });
  else if (['season', 'alien', 'special', 'basic', 'expansion'].includes(d.jump)) {
    if (window.matchMedia('(max-width: 700px)').matches) { ui.actionCategory = d.jump; render(); }
    document.querySelector(`.${d.jump}-section`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  else if (d.cell !== undefined) clickCell(Number(d.cell));
  else if (d.view !== undefined) { if (!ui.mode || Number(d.view) === meIndex()) { ui.view = Number(d.view); render(); } }
  else if (d.choice) submitChoice(d.choice);
  else if (d.cancel) { ui.mode = null; ui.mobileTab = 'actions'; render(); scrollToSectionOnMobile('.actions-panel'); }
  else if (d.rules) { ui.dialog = 'rules'; render(); }
  else if (d.catalogOpen) { ui.catalog = { query: '', kind: 'all', deck: 'all', page: 0 }; ui.dialog = 'catalog'; render(); }
  else if (d.catalogPage) { ui.catalog.page += d.catalogPage === 'next' ? 1 : -1; render(); }
  else if (d.close) { ui.dialog = null; if (d.close === 'rules') { try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {} } render(); scheduleAI(); }
  else if (d.newConfirm) { if (room.active) { ui.dialog = 'online'; render(); return; } ui.setup = { ...DEFAULT_SETTINGS }; ui.dialog = 'new'; render(); }
  else if (d.new) { if (room.active) return; clearTimeout(ui.aiTimer); game = freshGame(ui.setup); ui.mobileTab = 'actions'; ui.actionCategory = 'basic'; ui.mode = null; ui.dialog = null; ui.view = meIndex(); save(); render(); }
  else if (d.continue) { if (room.active) { room.submit({ type: 'continue' }); return; } if (game.round === 14) { if(automaticEnabled())autoRules.finalize(); game.phase = 'ended'; save(); render(); } else nextRound(); }
  else if (d.convert === 'woodFuel' && game.settings.moor && game.phase === 'play' && canControl() && meHasWood()) { if (room.active) room.submit({ type: 'convert' }); else { game.players[meIndex()].wood--; game.players[meIndex()].fuel++; save(); render(); } }
});
function meHasWood() { return game.players[meIndex()].wood > 0; }
app.addEventListener('change', event => {
  const setting = event.target.dataset?.setting;
  if (setting === 'cardDeck') ui.setup.cardDeck = event.target.value;
  if (setting === 'players') ui.setup.players = Number(event.target.value);
  if (['moor', 'cards', 'seasons', 'aliens'].includes(setting)) ui.setup[setting] = event.target.checked;
  if (event.target.matches('[data-catalog-kind]')) { ui.catalog.kind = event.target.value; ui.catalog.page = 0; render(); }
  if (event.target.matches('[data-catalog-deck]')) { ui.catalog.deck = event.target.value; ui.catalog.page = 0; render(); }
});
app.addEventListener('input', event => {
  if (event.target.dataset.onlineField) { ui.onlineDraft ||= {}; ui.onlineDraft[event.target.dataset.onlineField] = event.target.value; return; }
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
function executeOnlineCommand(seat, command) {
  if (!room.host || !room.started || room.paused || !command || typeof command !== 'object') return '房间尚未就绪。';
  if(command.type==='draftPick')return pickDraftCard(seat,command.id);
  if(game.phase==='draft')return '请先完成公共选牌，再开始第一轮。';
  if(command.type==='ruleChoice')return autoRules.choose(seat,command.value);
  if(command.type==='ruleAbility')return autoRules.activate(seat,command.id);
  if(automaticEnabled() && autoRules.queue.length)return '等待卡牌效果结算。';
  if (command.type === 'continue') {
    if (seat !== 0 || game.phase !== 'harvest') return '等待房主推进收获。';
    if (game.round === 14) { if(automaticEnabled())autoRules.finalize(); game.phase = 'ended'; save(); render(); } else nextRound();
    return;
  }
  if (game.phase !== 'play' || game.turn !== seat || game.usedCount[seat] >= game.workerQuota[seat]) return '还没轮到你，请等待其他玩家。';
  const player = game.players[seat];
  if (command.type === 'convert') {
    if (!game.settings.moor || player.wood < 1) return '木材不足。';
    player.wood--; player.fuel++; save(); render(); return;
  }
  if (command.type !== 'action') return '未知操作。';
  const action = command.special === true ? SPECIALS.map(a => ({ ...a, special: true })).find(a => a.id === command.id) : availableActions().find(a => a.id === command.id);
  if (!action) return '行动不存在。';
  if (action.special ? !canSpecial(player, action, seat) : action.unlock > game.round || !originalCanOccupy(player,action) || !canAct(player, action)) return '这个行动当前不可用。';
  const option = {};
  for (const key of ['cell', 'crop', 'animal', 'card', 'major', 'supply', 'trade']) {
    const value = command.option?.[key];
    if (value !== undefined) { if (!['string', 'number'].includes(typeof value) || String(value).length > 60) return '无效的选择。'; option[key] = value; }
  }
  const id = action.id;
  const field = ({ sow: 'crop', pasture: 'animal', animalMarket: 'animal', lessons: 'card', major: 'major', minor: 'card', minor6: 'card', black: 'card', illicit: 'major', farmSupplies: 'supply', seasonSummer: 'supply', alienTransform: 'trade', resourceTrade: 'trade', alienStable: 'animal', sideJob: 'animal' })[id];
  const options = action.ruleOp ? [] : choiceOptions(player, id).options;
  const value = id === 'seasonSpring' ? option.crop || 'breed' : option[field];
  if (options.length && !options.some(([v, , enabled]) => enabled && v === value)) return '所选卡牌、资源或牲畜当前不可用。';
  const needsCell = action.kind === 'target' || id === 'farmSupplies' && option.supply === 'plow' || id === 'seasonSpring' && option.crop || id === 'seasonSummer' && ['plow', 'both', 'plowBake'].includes(option.supply);
  if (needsCell && (!Number.isInteger(option.cell) || !selectedCells(player, { id }).includes(option.cell))) return '请选择可用的农场地块。';
  if(automaticEnabled())autoRules.begin(seat,action,option);else applyAction(seat, action, option);
}
function onlineBar() {
  const offline = room.members.filter(m => !m.online).map(m => m.name);
  const state = room.pending ? '正在同步行动…' : room.status === 'disconnected' ? '连接已断开，等待重连' : offline.length ? `暂停 · 等待 ${offline.join('、')} 重连` : room.started ? `你是 ${room.members[room.seat]?.name || '农场主'} · ${room.members.length} 人对局` : '等待朋友加入';
  return `<div class="online-bar"><button data-online="1">房间 ${escapeHTML(room.code)}</button><span role="status">${automaticEnabled() && autoRules.choice() ? `等待${escapeHTML(game.players[autoRules.choice().seat].name)}选择卡牌效果` : escapeHTML(state)}</span>${room.status === 'disconnected' ? '<button data-room-retry="1">重新连接</button>' : ''}</div>`;
}
function onlineDialog() {
  ui.onlineDraft ||= { name: '', code: new URLSearchParams(location.search).get('room') || '' };
  const draft = ui.onlineDraft;
  let body;
  if (room.active) {
    body = `<div class="room-code" aria-label="房间码">${escapeHTML(room.code)}</div><p>${room.started ? '对局进行中。房主请保持页面打开；掉线玩家可在原设备点击重新连接。' : '把房间码发给朋友，每人用自己的设备加入。至少 2 人即可开始，最多 6 人。'}</p><div class="room-members">${room.members.map((m, i) => `<div><b>${i + 1}. ${escapeHTML(m.name)}${i === 0 ? ' · 房主' : ''}${i === room.seat ? ' · 你' : ''}</b><span>${m.online ? '已连接' : '等待重连'}</span></div>`).join('') || '<p>正在连接房间…</p>'}</div>${room.status === 'connecting' ? '<p role="status">正在建立连接…</p>' : ''}<p class="room-error" role="status">${escapeHTML(room.error)}</p><div class="room-controls"><button class="ghost-btn" data-room-copy="1">复制邀请链接</button>${room.status === 'disconnected' ? '<button class="primary-btn" data-room-retry="1">重新连接</button>' : ''}${room.host && !room.started ? `<button class="primary-btn" data-room-start="1" ${room.members.length < 2 || room.members.some(m => !m.online) || room.status !== 'lobby' ? 'disabled' : ''}>开始对局（${room.members.length} 人）</button>` : !room.started ? '<p>等待房主开始对局。</p>' : ''}</div><div class="modal-actions"><button class="ghost-btn" data-room-leave="1">${room.host ? '关闭房间' : '离开房间'}</button>${room.started ? '<button class="primary-btn" data-close="online">回到游戏</button>' : ''}</div>`;
  } else {
    body = `<p>2–6 位真人各用自己的手机或电脑，轮流经营农场。房主需保持页面打开。</p><label class="online-field">你的昵称<input data-online-field="name" maxlength="16" placeholder="例如：小麦" value="${escapeHTML(draft.name)}"></label><div class="room-join"><label class="online-field">房间码<input data-online-field="code" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="输入 8 位房间码" value="${escapeHTML(draft.code)}"></label><button class="primary-btn" data-room-join="1">加入房间</button></div><div class="room-create"><h3>或者创建房间</h3><div class="setup-grid"><label>房间人数上限<select data-setting="players">${[2,3,4,5,6].map(n => `<option value="${n}" ${ui.setup.players === n ? 'selected' : ''}>${n} 人</option>`).join('')}</select></label>${[['moor','沼泽农夫'],['seasons','四季流转'],['cards','职业与设施'],['aliens','外星人扩展']].map(([key,label]) => `<label class="check-row"><input type="checkbox" data-setting="${key}" ${ui.setup[key] ? 'checked' : ''}>${label}</label>`).join('')}${originalDeckPicker()}</div><button class="primary-btn" data-room-create="1">创建房间</button></div>${room.saved() ? `<button class="ghost-btn room-resume" data-room-retry="1">重连上次房间 ${escapeHTML(room.saved().code)}</button>` : ''}<p class="room-error" role="status">${escapeHTML(room.error)}</p><div class="modal-actions"><button class="ghost-btn" data-close="online">返回</button></div>`;
  }
  return `<div class="modal-backdrop"><section class="modal online-modal" role="dialog" aria-modal="true" aria-label="多人联机"><h2>一起经营农场</h2>${body}</section></div>`;
}
function handleOnlineClick(d) {
  if (d.online) { ui.dialog = 'online'; ui.setup = { ...game.settings }; ui.mode = null; render(); return true; }
  if (d.roomCreate || d.roomJoin) {
    ui.mode = null; ui.dialog = 'online';
    room.open({ host: !!d.roomCreate, code: ui.onlineDraft?.code, name: ui.onlineDraft?.name, settings: { ...ui.setup } }); return true;
  }
  if (d.roomRetry) { ui.dialog = 'online'; room.open({ resume: true }); return true; }
  if (d.roomStart) {
    if (!room.host || room.started || room.status !== 'lobby' || room.members.length < 2 || room.members.some(m => !m.online)) return true;
    game = freshGame({ ...room.settings, players: room.members.length });
    game.players.forEach((p, i) => { p.name = room.members[i].name; p.ai = false; });
    game.logs = []; addLog(game, `联机对局开始，${game.players[0].name}${game.phase==='draft'?'先选牌':'先派工'}。`);
    ui.dialog = null; ui.view = 0; ui.mode = null; ui.mobileTab = 'actions'; room.start(game); return true;
  }
  if (d.roomLeave) { room.close(); game = loadGame(); ui.dialog = null; ui.mode = null; ui.view = 0; render(); scheduleAI(); return true; }
  if (d.roomCopy) {
    const url = new URL(location.protocol === 'file:' ? 'https://houruifan104-gif.github.io/four-seasons-farm/' : location.href);
    url.search = ''; url.hash = ''; url.searchParams.set('room', room.code);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url.href).then(() => toast('邀请链接已复制，发给朋友即可。')).catch(() => toast(`房间码：${room.code}`));
    else toast(`房间码：${room.code}`);
    return true;
  }
  return false;
}

if (new URLSearchParams(location.search).has('room')) ui.dialog = 'online';
if(automaticEnabled()&&autoRules.queue.length)autoRules.drain();else{render();scheduleAI();}
