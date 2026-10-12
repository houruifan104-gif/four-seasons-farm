const vm=require('node:vm');
const {sandbox}=require('./test-original.cjs');
vm.runInContext(`{
  let p=reset();p.wood=20;p.reed=10;
  autoRules.ask(p,'test','room',{batch:true},false);autoRules.drain();
  assert.ok(automaticChoiceDialog().includes('放大农场建造'));
  selectConstructionCell(2);assert.equal(p.farm[2].type,'empty');assert.equal(p.wood,20,'preview spends nothing');
  selectConstructionCell(3);assert.deepEqual(ui.build.cells,[2,3]);
  const c=autoRules.choice(),option=c.options.find(o=>o.cells?.join(',')==='2,3');assert.ok(option);
  assert.ok(constructionDialog().includes('data-build-confirm="'+option.value+'"'));
  confirmConstruction(option.value);assert.equal(p.farm[2].type,'house');assert.equal(p.farm[3].type,'house');assert.equal(p.wood,10);

  p=reset();p.wood=10;autoRules.ask(p,'test','pasture',{},false);autoRules.drain();
  selectConstructionCell(2);selectConstructionCell(3);assert.equal(p.wood,10);assert.equal(p.farm[2].type,'empty');
  assert.ok(constructionDialog().includes('build-fence'));
  submitRuleChoice('undo');assert.deepEqual(autoRules.choice().selected,[2]);
  selectConstructionCell(3);submitRuleChoice('finish');
  const fence=autoRules.choice().options.find(o=>o.cells);assert.equal(fence.cost.wood,6);
  constructionDialog();confirmConstruction(fence.value);assert.equal(p.wood,4);assert.equal(autoRules.pastures(p)[0].length,2);

  p=reset();p.wood=4;autoRules.ask(p,'test','stable',{},false);autoRules.drain();
  selectConstructionCell(2);assert.ok(constructionDialog().includes('待建'));assert.ok(!p.farm[2].stable);
  room.status='disconnected';confirmConstruction('2');assert.ok(!p.farm[2].stable,'paused room cannot confirm');room.status='playing';
  confirmConstruction('2');assert.equal(p.farm[2].stable,true);assert.equal(p.wood,2);

  p=reset();p.wood=4;for(let i=2;i<15;i++)p.farm[i]={type:'field'};p.farm[2]={type:'empty'};
  autoRules.ask(p,'test','stable',{},false);autoRules.drain();assert.ok(autoRules.choice(),'one legal tile still requires confirmation');
  room.seat=1;assert.equal(constructionContext(),null,'another player cannot pick');room.seat=0;

  game=readyGame({players:2,moor:false,cards:false,seasons:false,aliens:false});p=game.players[0];ui.mode=null;ui.dialog=null;ui.build=null;p.wood=10;
  beginAction(availableActions().find(a=>a.id==='plow'));assert.ok(constructionContext());selectConstructionCell(2);
  assert.equal(p.farm[2].type,'empty');confirmConstruction('2');assert.equal(p.farm[2].type,'field');assert.equal(ui.mode,null);
  console.log('PASS: large farm construction, multi-room preview, fence selection/undo/costs, stable confirmation, single-tile choices, paused/other-seat protection and simple mode placement');
}`,sandbox);
