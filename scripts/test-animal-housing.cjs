const vm = require('node:vm');
const { sandbox } = require('./test-original.cjs');
vm.runInContext(`{
  let p=reset();
  p.farm[2]={type:'pasture',animal:'sheep'};
  assert.equal(animalCapacity(p,'cattle'),3,'old sheep pasture can house cattle');
  assert.equal(addAnimals(p,'cattle',3).kept,3);
  assert.equal(autoRules.animalHousing(p).assignments[0].animal,'cattle');
  assert.equal(p.farm[2].animal,'sheep','allocation queries must not mutate saved state');
  assert.equal(animalCapacity(p,'boar'),0,'pet slot and pasture cannot be reused by another species');
  p.cattle=1;assert.equal(addAnimals(p,'boar',2).kept,2,'move cattle to house and put boar in pasture');
  assert.equal(autoRules.animalHousing(p).assignments[0].animal,'boar');
  p.boar=0;p.cattle=0;assert.equal(autoRules.animalHousing(p).assignments[0].animal,null,'empty pasture has no fixed species');

  p=reset();p.sheep=1;assert.equal(animalCapacity(p,'boar'),0,'one pet across all rooms and species');
  p.farm[2]={type:'empty',stable:true,stableAnimal:'sheep'};p.stables.sheep=1;
  assert.equal(animalCapacity(p,'boar'),1,'unfenced stable accepts any species');
  p.farm[2]={...p.farm[2],type:'pasture',pastureId:'one'};
  assert.equal(animalCapacity(p,'cattle'),4,'fencing stable replaces its single slot with doubled pasture');
  p.farm[3]={type:'pasture',pastureId:'one',stable:true};p.stables.boar=1;
  assert.equal(animalCapacity(p,'cattle'),16,'two tiles and two stables: 2 × 2 × 2 × 2');
  p.sheep=2;p.cattle=2;assert.equal(autoRules.animalHousing(p).fits,false,'one large enclosure still cannot mix species');

  p=reset();p.farm[2]={type:'pasture',pastureId:'large',animal:'sheep'};p.farm[3]={type:'pasture',pastureId:'large',animal:'sheep'};
  p.farm[4]={type:'pasture',animal:'cattle'};p.sheep=2;p.cattle=4;
  assert.equal(autoRules.animalHousing(p).fits,true,'swap a small herd into the small pasture');
  assert.equal(autoRules.animalHousing(p).assignments.find(g=>g.cells.length===2).animal,'cattle');
  assert.equal(addAnimals(p,'boar',2).kept,1,'only the shared pet slot remains');
  const encoded=JSON.stringify(p);assert.equal(autoRules.animalHousing(JSON.parse(encoded)).fits,true,'allocation survives reload');

  p=reset();p.wood=10;
  const stableOptions=autoRules.options({type:'stable',seat:0});
  assert.equal(new Set(stableOptions.map(o=>o.cell)).size,stableOptions.length,'one stable option per tile');
  assert.ok(stableOptions.every(o=>!o.animal));
  assert.ok(autoRules.options({type:'pasture',seat:0,size:1}).every(o=>!o.animal),'building does not choose species');
  autoRules.ask(p,'test','stable',{},false);autoRules.drain();
  assert.equal(executeOnlineCommand(0,{type:'ruleChoice',value:'2'}),undefined);
  assert.equal(p.farm[2].stable,true);assert.equal(autoRules.stables(p),1);assert.equal(animalCapacity(p,'cattle'),2);

  p=reset();p.farm[2]={type:'pasture'};p.sheep=1;ui.view=0;
  assert.ok(farmPanel().includes('pasture-sheep.jpg'));p.sheep=0;p.cattle=2;
  assert.ok(farmPanel().includes('pasture-cattle.jpg'));p.cattle=0;
  assert.ok(!farmPanel().includes('pasture-sheep.jpg'),'empty pasture must not display a sheep');

  game=readyGame({players:6,moor:false,cards:false,seasons:false,aliens:false});p=game.players[0];p.wood=3;
  assert.equal(executeOnlineCommand(0,{type:'action',id:'sideJob'}),undefined,'simple stable build accepts no species');
  assert.equal(autoRules.stables(p),1);assert.equal(animalCapacity(p,'cattle'),2);
  assert.equal(choiceOptions(p,'pasture').options.length,0);
  for(const id of ['resourceTrade','farmSupplies','minor6'])assert.equal(EXTRA_ACTIONS.find(a=>a.id===id).kind,'choice');

  console.log('PASS: flexible pastures, shared pet slot, stable multipliers, no mixed herds, automatic rearrangement, legacy saves, species-free build commands and live artwork');
}`, sandbox);
