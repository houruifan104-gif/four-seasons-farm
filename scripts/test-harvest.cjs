const vm = require('node:vm');
const { sandbox } = require('./test-original.cjs');
vm.runInContext(`{
  function harvest(){game.round=4;finishRound();autoRules.drain();}
  function choose(value){const c=autoRules.choice();assert.ok(c);assert.equal(executeOnlineCommand(c.seat,{type:'ruleChoice',value}),undefined);}
  let p=reset();p.food=0;p.grain=2;p.veg=2;p.sheep=2;p.majors=['fireplace2'];p.farm[2]={type:'pasture',animal:'sheep'};
  harvest();assert.equal(autoRules.choice().type,'feeding');assert.equal(p.grain,2);assert.equal(p.veg,2);assert.equal(p.sheep,2,'the game must not spend seed crops or breeding parents automatically');
  assert.equal(autoRules.choice().options.find(o=>o.value==='eatVegetable').gain.food,2,'Fireplace vegetables are worth two, not three');
  choose('finishFeeding');finishChoices();assert.equal(p.begging,4);assert.equal(p.grain,2);assert.equal(p.veg,2);assert.equal(p.sheep,3,'parents breed only after the feeding decision');assert.equal(p.food,0,'newborn animal cannot pay this harvest food');

  p=reset();p.food=2;p.sheep=2;p.majors=['fireplace2'];p.farm[2]={type:'pasture',animal:'sheep'};harvest();choose('cook:sheep');finishChoices();assert.equal(p.sheep,1,'cooking a parent prevents breeding');assert.equal(p.begging,0);assert.equal(game.harvestSummary[0].newborn.length,0);
  p=reset();p.food=20;p.sheep=3;p.majors=['fireplace2'];p.farm[2]={type:'pasture',animal:'sheep'};harvest();finishChoices();assert.equal(p.sheep,3,'a full pasture and pet slot cannot accept offspring');assert.equal(p.food,16,'overflow newborns are not cooked');

  p=reset();p.food=0;p.grain=2;p.majors=['clayOven'];harvest();assert.ok(autoRules.choice().options.some(o=>o.value==='eatGrain'&&o.gain.food===1));assert.ok(!autoRules.choice().options.some(o=>o.oven),'harvest does not grant a Bake Bread action');choose('eatGrain');choose('eatGrain');finishChoices();assert.equal(p.begging,2);

  p=reset();assert.equal(vegetableFoodValue(p),1);p.majors=['fireplace2'];assert.equal(vegetableFoodValue(p),2);p.majors=['hearth4'];assert.equal(vegetableFoodValue(p),3);p.played.improvements=['A060'];assert.equal(vegetableFoodValue(p),4);
  p=reset();p.food=0;p.sheep=1;harvest();assert.equal(p.sheep,1,'animals without a cooking improvement are never eaten');assert.equal(p.begging,4);

  p=reset();p.food=2;p.wood=2;p.grain=1;p.majors=['joinery'];harvest();choose('craft:joinery');assert.equal(p.wood,1);const saved=JSON.stringify(game);game=JSON.parse(saved);assert.ok(!autoRules.choice().options.some(o=>o.craft==='joinery'),'a workshop is once per harvest, including after reconnect');assert.ok(executeOnlineCommand(1,{type:'ruleChoice',value:'finishFeeding'}),'only the feeding player can decide');const before=JSON.stringify(game);assert.ok(executeOnlineCommand(0,{type:'ruleChoice',value:'craft:joinery'}));assert.equal(JSON.stringify(game),before);choose('finishFeeding');finishChoices();assert.equal(game.players[0].begging,0);

  p=reset();p.family=3;p.food=5;game.round=4;autoRules.stats(p).newborn=1;assert.equal(familyFoodNeed(p),5);finishRound();finishChoices();assert.equal(p.begging,0);assert.equal(game.harvestSummary[0].fed,5);nextRound();assert.equal(familyFoodNeed(p),6,'a child born in an earlier round is no longer a newborn');

  game=freshGame({players:3,moor:false,cards:false,seasons:false,aliens:false});game.players.forEach(p=>{p.ai=false;p.food=20;p.farm[2]={type:'field',crop:'grain',qty:3};});game.round=4;finishRound();assert.equal(game.phase,'harvest');for(const p of game.players){assert.equal(p.grain,1);assert.equal(p.farm[2].qty,2);assert.equal(p.food,16);}assert.ok(game.harvestSummary.every(s=>s.crops===1),'every seat harvests once; array indexes must not become feed flags');
  game=freshGame({players:2,moor:false,cards:false,seasons:false,aliens:false});p=game.players[0];p.food=2;p.sheep=2;p.hearth=true;p.farm[2]={type:'pasture',animal:'sheep'};game.round=4;finishRound();assert.equal(p.sheep,1,'simple mode also feeds before breeding');
  game=freshGame({players:2,moor:false,cards:false,seasons:false,aliens:false});p=game.players[0];p.family=3;p.newbornRound=4;p.newbornCount=1;game.round=4;assert.equal(familyFoodNeed(p),5);game.round=7;assert.equal(familyFoodNeed(p),6);
  console.log('PASS: harvest order, player-controlled feeding, cooking rates, no free baking, newborn food, breeding limits, workshop limits, reconnect/guest validation and every seat harvesting');
}`, sandbox);
