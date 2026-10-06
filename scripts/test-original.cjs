const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const app = { innerHTML: '', addEventListener() {} };
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const sandbox = { console, crypto: webcrypto, URL, URLSearchParams, localStorage: storage, sessionStorage: storage, location: { search: '?test=rules', href: 'http://localhost/', protocol: 'http:' }, document: { querySelector: () => app, addEventListener() {} }, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, queueMicrotask: () => {}, requestAnimationFrame: () => {}, navigator: {} };
sandbox.window = sandbox; sandbox.matchMedia = () => ({ matches: false });
vm.createContext(sandbox);
for (const f of ['card-catalog.js', 'multiplayer.js', 'original-rules.js', 'game.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox);
sandbox.assert = assert; sandbox.app = app;
vm.runInContext(`
room.active=true;room.host=true;room.started=true;room.status='playing';room.seat=0;
room.members=[{name:'甲',online:true},{name:'乙',online:true}];
function reset(){game=freshGame({...DEFAULT_SETTINGS,players:2,moor:false,cardDeck:'AB'});game.players.forEach(p=>p.ai=false);ui.dialog=null;ui.mode=null;return game.players[0];}
function finishChoices(prefer){let limit=0;while(autoRules.queue.length&&limit++<100){autoRules.drain();const c=autoRules.choice();if(!c)continue;assert.equal(autoRules.choose(c.seat,prefer?.(c)||c.options.find(o=>o.value==='skip')?.value||c.options[0].value),undefined);}assert.ok(limit<100,'effects must terminate');}
function doAction(seat,id,option={}){const error=executeOnlineCommand(seat,{type:'action',id,option});assert.equal(error,undefined,error);}
assert.equal(ORIGINAL_CARD_CATALOG.length,336);
for(const deck of ['A','B','AB']){const g=freshGame({...DEFAULT_SETTINGS,players:6,cardDeck:deck});const cards=g.players.flatMap(p=>p.hand.occupations.concat(p.hand.improvements));assert.equal(cards.length,84);assert.equal(new Set(cards).size,84);}
let p=reset();render();assert.ok(app.innerHTML.includes('data-action=\"wood\"'),'cloned original actions remain visible');p.hand.occupations=['A116'];doAction(0,'lessons',{card:'A116'});assert.ok(p.played.occupations.includes('A116'));assert.equal(game.turn,1);assert.equal(autoRules.queue.length,0,'no host confirmation');doAction(1,'day');doAction(0,'wood');assert.equal(p.wood,4,'Wood Cutter adds one on real action');assert.equal(game.turn,1);
p=reset();p.played.occupations=['A105'];doAction(0,'plow',{cell:2});assert.equal(p.clay,1);assert.equal(p.food,3,'Barrow Pusher gives clay and food after plowing');
p=reset();p.played.occupations=['B142'];doAction(0,'grain');assert.equal(p.grain,1);assert.equal(p.veg,1,'Greengrocer gives vegetable');
p=reset();p.played.occupations=['A114'];game.round=6;doAction(0,'day');let c=autoRules.choice();assert.ok(c);assert.equal(c.seat,0);assert.ok(executeOnlineCommand(1,{type:'ruleChoice',value:c.options[0].value}),'other seat cannot choose');assert.equal(executeOnlineCommand(0,{type:'ruleChoice',value:c.options.find(o=>o.gain?.veg).value}),undefined);assert.equal(p.veg,1);assert.equal(game.turn,1);
p=reset();p.played.occupations=['B126','A143'];p.houseMaterial='stone';assert.equal(roomCost(p).stone,2);assert.equal(roomCost(p).reed,2);
p=reset();p.played.occupations=['B116','B118'];game.piles.reed=0;nextRound();assert.equal(p.wood,2,'round-start wood from empty reed and two-room house');
p=reset();p.hand.improvements=['A004'];p.food=2;assert.ok(playCard(p,'improvements','A004:0'));autoRules.drain();assert.equal(p.food,0);assert.equal(p.wood,2);assert.ok(game.players[1].hand.improvements.includes('A004'));assert.ok(!p.played.improvements.includes('A004'));
p=reset();p.hand.occupations=['B125'];playCard(p,'occupations','B125');autoRules.drain();for(const key of ['wood','clay','reed','stone']){const before=p[key];nextRound();finishChoices();assert.equal(p[key],before+1,'scheduled resource '+key);}
p=reset();p.played.occupations=['A112','A106'];p.farm[2]={type:'field',crop:'grain',qty:2};p.food=20;game.round=4;finishRound();finishChoices(c=>c.type==='harvestExtra'?c.options.find(o=>o.value!=='skip')?.value:null);assert.equal(p.grain,2);assert.equal(p.farm[2].crop,null);assert.equal(p.food,18,'harvest bonus before feeding');assert.equal(game.phase,'harvest');
p=reset();p.hand.occupations=['B155'];playCard(p,'occupations','B155');autoRules.drain();assert.equal(p.wood,1);assert.equal(p.reed,1);
p=reset();p.played.occupations=['A156'];game.turn=1;doAction(1,'reed');c=autoRules.choice();assert.equal(c.seat,0,'reacting opponent chooses own effect');const encoded=JSON.stringify(game);game=JSON.parse(encoded);c=autoRules.choice();assert.equal(executeOnlineCommand(0,{type:'ruleChoice',value:c.options.find(o=>o.value!=='skip').value}),undefined);assert.equal(game.players[0].reed,1);assert.equal(game.players[0].food,1);assert.equal(game.players[1].food,4);
p=reset();p.played.occupations=['B104'];p.sheep=1;assert.equal(autoRules.activate(0,'B104'),undefined);c=autoRules.choice();autoRules.choose(0,c.options.find(o=>o.gain?.veg).value);assert.equal(p.sheep,0);assert.equal(p.veg,1);assert.equal(game.usedCount[0],0,'anytime conversion uses no worker');

// Every catalog entry can be installed and serialized; optional effects are declined.
for(const card of ORIGINAL_CARD_CATALOG){p=reset();for(const k of ['food','wood','clay','reed','stone','grain','veg'])p[k]=30;const kind=card.kind==='occupation'?'occupations':'improvements';p.hand[kind]=[card.id];autoRules.install(p,card.id,{kind,cost:{}});finishChoices();JSON.stringify(game);assert.equal(autoRules.queue.length,0,card.id+' leaves no unresolved events');}
p=reset();p.played.occupations=['A088'];p.wood=1;autoRules.ask(p,'test','pasture',{size:1},false);autoRules.drain();c=autoRules.choice();assert.ok(c.options.some(o=>o.cost.wood===1));autoRules.choose(0,c.options.find(o=>o.animal==='sheep').value);finishChoices();assert.equal(p.wood,0);assert.equal(p.fences,4);assert.equal(autoRules.capacity(p,'sheep'),3,'2 pasture spaces plus shared pet');p.boar=1;assert.equal(autoRules.capacity(p,'sheep'),2,'pet space is shared across species');
p=reset();p.hand.occupations=['A105'];p.played.improvements=['B025'];p.majors=['clayOven'];p.grain=1;doAction(0,'lessons',{card:'A105'});c=autoRules.choice();assert.equal(c.type,'bake');autoRules.choose(0,c.options.find(o=>o.oven==='clayOven').value);finishChoices();assert.equal(p.food,6);assert.equal(p.grain,0);assert.equal(game.turn,1,'chained baking completes before advancing');
p=reset();let turns=0;while(game.round<=14&&game.phase!=='harvest'&&turns++<150){const seat=game.turn;const a=availableActions().find(a=>a.unlock<=game.round&&!a.ruleOp&&['pile','simple'].includes(a.kind)&&originalCanOccupy(game.players[seat],a)&&canAct(game.players[seat],a));assert.ok(a);doAction(seat,a.id);finishChoices();if(game.phase==='harvest'){if(game.round===14)break;nextRound();finishChoices();}}assert.equal(game.round,14);assert.equal(game.phase,'harvest');autoRules.finalize();finishChoices();assert.ok(Number.isFinite(score(game.players[0]).total));

console.log('PASS: auto occupation resource effects, optional choices, guest authority, costs, round income, passing immediate effects, schedules, harvest hooks, persisted choices and anytime conversions');
`, sandbox);
