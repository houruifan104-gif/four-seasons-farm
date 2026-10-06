// Exercise minor improvements through the same engine and commands used by rooms.
const vm = require('node:vm');
const { sandbox } = require('./test-original.cjs');
vm.runInContext(`{
  const choose = predicate => {const c=autoRules.choice();assert.ok(c,'a player decision is available');const o=c.options.find(predicate);assert.ok(o,c.card+' has requested option');assert.equal(executeOnlineCommand(c.seat,{type:'ruleChoice',value:o.value}),undefined);};
  const install = (p,id) => {p.hand.improvements.push(id);autoRules.install(p,id,{kind:'improvements',cost:{}});autoRules.drain();};
  let p=reset();p.hand.improvements=['A067'];p.wood=1;assert.ok(playCard(p,'improvements','A067:0'));autoRules.drain();doAction(0,'grain');assert.equal(p.grain,2,'Grain Scoop adds a real grain after being paid and played');assert.equal(p.wood,0);

  p=reset();p.hand.improvements=['A055'];p.wood=1;p.clay=1;assert.ok(playCard(p,'improvements','A055:0'));autoRules.drain();assert.equal(p.food,3,'Junk Room triggers on itself');p.hand.improvements=['B037'];install(p,'B037');assert.equal(p.food,5,'a later minor triggers its own immediate effect and Junk Room');

  p=reset();p.played.improvements=['A075','B075'];p.hand.improvements=['B059'];p.wood=0;assert.ok(playCard(p,'improvements','B059:0'));autoRules.drain();assert.equal(p.wood,1,'Sawmill discount and Wood Workshop before-payment income combine');assert.equal(p.food,4);
  p=reset();p.hand.improvements=['B059'];p.wood=1;autoRules.ask(p,'主要发展行动','develop');autoRules.drain();choose(o=>o.cardId==='B059');assert.equal(p.food,6,'Food Chest gives four food from a major improvement action');assert.equal(p.wood,0);

  p=reset();p.hand.improvements=['B002'];assert.ok(playCard(p,'improvements','B002:0'));autoRules.drain();assert.ok(autoRules.choice().options.filter(o=>o.value!=='skip').every(o=>o.cells?.length===1),'Mini Pasture must be exactly one tile');choose(o=>o.animal==='sheep');assert.equal(autoRules.pastures(p).length,1);assert.equal(autoRules.pastures(p)[0].length,1);assert.equal(p.fences,4);assert.ok(game.players[1].hand.improvements.includes('B002'),'passing minor transfers after use');

  p=reset();p.played.improvements=['B026'];p.farm[2]={type:'field',crop:null,qty:0};p.grain=1;p.wood=4;
  autoRules.coreAction(p,{ruleOp:'sow'});autoRules.drain();choose(o=>o.label.includes('替代烤面包'));choose(o=>o.crop==='grain');choose(o=>o.selectCell===3);choose(o=>o.finishSelection);choose(o=>o.animal==='sheep');finishChoices();assert.equal(p.farm[2].qty,3);assert.equal(p.fences,4,'Field Fences can replace baking while keeping sowing');assert.equal(p.wood,0);

  p=reset();p.played.improvements=['A084'];p.farm[2]={type:'field',crop:'grain',qty:1};p.farm[3]={type:'pasture',animal:'sheep',pastureId:'p'};p.sheep=2;p.grain=0;autoRules.event('end',0);autoRules.drain();choose(o=>o.grainField===0);assert.equal(p.sheep,3);assert.equal(p.farm[2].qty,0);assert.equal(p.farm[2].crop,null,'Silage can spend the last grain on a field');

  p=reset();p.played.improvements=['B032'];p.food=0;p.grain=3;game.round=4;finishRound();autoRules.drain();assert.equal(autoRules.choice().type,'feeding');choose(o=>o.abilityCard==='B032'&&o.cost.grain===3);finishChoices();assert.equal(p.begging,0,'Stew Pot conversion happens before automatic feeding');assert.equal(p.cardBonus,1);assert.equal(p.grain,0);assert.equal(game.phase,'harvest');

  p=reset();p.played.improvements=['A061','B067','A030'];p.played.occupations=['A097'];p.majors=['clayOven'];p.grain=3;autoRules.stats(p).actions=[{kind:'pile',id:'wood'},{kind:'pile',id:'reed'}];autoRules.event('fields',0,{});autoRules.drain();assert.ok(!autoRules.choice().options.some(o=>o.value==='occupation'));choose(o=>o.oven==='clayOven');assert.equal(p.grain,2,'Winnowing Fan does not trigger baking-only free grain');assert.equal(p.food,7);assert.equal(autoRules.queue.length,0,'no baking-only bonus prompt');

  p=reset();p.played.improvements=['A030'];p.grain=2;autoRules.ask(p,'test','bake');autoRules.drain();choose(o=>o.oven==='A030');assert.equal(p.grain,1);assert.equal(p.food,4);assert.equal(p.cardBonus,1);assert.equal(autoRules.queue.length,0,'Baking Sheet works alone and cannot trigger itself twice');
  p=reset();p.played.improvements=['B067'];p.majors=['clayOven'];autoRules.stats(p).actions=[{kind:'pile',id:'wood'}];assert.ok(autoRules.canCore(p,{ruleOp:'sow'}),'Hand Truck supplies the grain needed to use baking');autoRules.coreAction(p,{ruleOp:'sow'});autoRules.drain();choose(o=>o.oven==='clayOven');assert.equal(p.grain,0);assert.equal(p.food,7);

  p=reset();p.farm[2]={type:'field',crop:'grain',qty:2};install(p,'B021');autoRules.collectFields(p);autoRules.drain();assert.equal(p.grain,1);assert.equal(p.food,3,'Hayloft sees harvested grain');assert.equal(autoRules.state(p,'B021').food,3);

  p=reset();install(p,'B068');p.veg=1;autoRules.ask(p,'test','sow');autoRules.drain();assert.ok(autoRules.choice().options.filter(o=>o.value!=='skip').every(o=>o.crop==='veg'));choose(o=>o.crop==='veg');assert.equal(p.cardFields[0].qty,2);autoRules.collectFields(p);autoRules.drain();assert.equal(p.veg,1,'Beanfield grows and harvests vegetables');

  p=reset();p.played.improvements=['B019'];const info={action:availableActions().find(a=>a.id==='plow'),workerOrder:1,before:JSON.parse(JSON.stringify(p))};autoRules.event('action',0,info);autoRules.drain();choose(o=>o.value==='skip');assert.ok(!autoRules.state(p,'B019').used,'declining a limited plow does not spend a charge');autoRules.event('action',0,info);autoRules.drain();choose(o=>o.cell===2);assert.equal(autoRules.state(p,'B019').used,1);

  p=reset();p.played.improvements=['A043','A074','B027'];p.wood=8;p.stone=4;doAction(0,'room');choose(o=>o.cell===2&&o.animal==='sheep');choose(o=>o.cell===3&&o.animal==='sheep');choose(o=>o.value==='skip');assert.equal(autoRules.state(p,'A043').schedule.length,3,'two stables in one action grant one food schedule');assert.equal(autoRules.state(p,'A074').schedule.length,3);assert.equal(autoRules.choice().type,'major');choose(o=>o.major==='joinery');assert.equal(autoRules.queue.length,0,'Toolbox offers one workshop after the whole construction action');assert.equal(game.turn,1);

  p=reset();p.played.improvements=['B038'];assert.ok(!selectedCells(p,{id:'plow'}).includes(2),'Future Building Site restricts the actual board selector');assert.ok(selectedCells(p,{id:'plow'}).includes(9));

  p=reset();install(p,'B041');choose(o=>o.label.includes('2 木材'));nextRound();finishChoices();assert.equal(p.wood,2);nextRound();finishChoices();assert.equal(p.boar,1,'Wood Pasture alternating future income');
  render();assert.ok(app.innerHTML.includes('生效中的次要发展'));assert.ok(app.innerHTML.includes('第 4 轮：2 木材'),'pending income is visible on the played card');
  p=reset();install(p,'B076');nextRound();finishChoices();assert.equal(p.wood,1);autoRules.event('renovate',0,{from:'wood',to:'clay'});autoRules.drain();nextRound();finishChoices();assert.equal(p.wood,1,'Ceilings stops future income after renovation');

  p=reset();p.played.improvements=['A064','B058'];p.farm[2]={type:'field',crop:'grain',qty:2};p.farm[3]={type:'field',crop:'veg',qty:2};autoRules.collectFields(p);autoRules.drain();assert.equal(p.food,4,'Barley Mill and Weeding Tool reward actual harvested crops');
  console.log('PASS: minor payments, immediate/passive effects, passing, field/fence choices, crop payments, pre-feeding conversions, harvest chains, card fields, limited uses, batch construction and delayed income');
}`, sandbox);
