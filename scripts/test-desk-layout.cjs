const vm=require('node:vm');
const {sandbox}=require('./test-original.cjs');
vm.runInContext(`{
  reset();ui.deskView='actions';ui.suppliesOpen=false;ui.handOpen=false;ui.dockTab='hand';render();
  assert.ok(app.innerHTML.includes('desk-shell'));
  assert.ok(app.innerHTML.includes('id="desk-farm" hidden'));
  assert.ok(app.innerHTML.includes('id="supply-details" class="supply-details table-side" hidden'));
  assert.ok(app.innerHTML.includes('id="card-dock-body" hidden'));
  const before=JSON.stringify(game);
  assert.equal(handleDeskClick({deskView:'farm'}),true);assert.equal(ui.deskView,'farm');assert.ok(app.innerHTML.includes('id="desk-actions" hidden'));
  handleDeskClick({suppliesOpen:'1'});assert.equal(ui.suppliesOpen,true);assert.ok(!app.innerHTML.includes('class="supply-details table-side" hidden'));
  handleDeskClick({suppliesToggle:'1'});assert.equal(ui.suppliesOpen,false);
  handleDeskClick({handToggle:'1'});assert.equal(ui.handOpen,true);assert.ok(!app.innerHTML.includes('id="card-dock-body" hidden'));
  for(const tab of ['played','majors','hand']){handleDeskClick({dockTab:tab});assert.equal(ui.dockTab,tab);assert.ok(app.innerHTML.includes('data-dock-kind="'+tab+'"'));}
  handleDeskClick({handToggle:'1'});assert.equal(ui.handOpen,false);
  assert.equal(JSON.stringify(game),before,'layout controls never change game state');
  handleDeskClick({deskView:'actions'});ui.mode={id:'plow',choice:false};render();assert.ok(app.innerHTML.includes('id="desk-actions" hidden'),'placement opens farm view');ui.mode=null;
  console.log('PASS: desktop switch, collapsed supplies and hand defaults, drawer controls, card categories and unchanged game state');
}`,sandbox);
