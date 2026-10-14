const vm=require('node:vm');
const {sandbox}=require('./test-original.cjs');
vm.runInContext(`{
  const random=Math.random;let first,second;
  try{Math.random=()=>0;first=originalRoundDeck();Math.random=()=>.999;second=originalRoundDeck();}finally{Math.random=random;}
  assert.notDeepEqual(first,second,'each stage is shuffled');
  for(const deck of [first,second]){let start=0;for(const stage of ORIGINAL_ROUND_STAGES){assert.deepEqual(deck.slice(start,start+stage.length).sort(),stage.slice().sort());start+=stage.length;}assert.equal(new Set(deck).size,14);}
  let p=reset();game.ruleRoundDeck=first;const saved=JSON.stringify(game.ruleRoundDeck);
  for(let round=1;round<=14;round++){
    game.round=round;
    const actions=availableActions(),rounds=actions.filter(a=>a.roundSlot);
    assert.equal(rounds.length,14);assert.equal(rounds.filter(a=>a.unlock<=round).length,round);
    assert.ok(!actions.some(a=>['hearth','minor'].includes(a.id)),'no simplified stove or standalone minor in original mode');
    for(const action of rounds){const html=actionCard(action);if(action.unlock>round){assert.ok(html.includes('尚未翻开'));assert.ok(!html.includes(action.name));assert.ok(!html.includes(action.detail));assert.ok(!html.includes('data-action'));}else assert.ok(html.includes('data-action="'+action.id+'"'));}
    render();const board=app.innerHTML.split('class="action-board round-board"')[1].split('auxiliary-boards')[0];
    assert.equal((board.match(/round-placeholder/g)||[]).length,14-round);
  }
  assert.equal(JSON.stringify(game.ruleRoundDeck),saved,'rendering never reshuffles a saved deck');
  game.round=1;const hidden=availableActions().find(a=>a.roundSlot===2);assert.ok(executeOnlineCommand(0,{type:'action',id:hidden.id}));
  assert.ok(executeOnlineCommand(0,{type:'action',id:'hearth'}),'removed action cannot be invoked by a client');

  p=reset();p.clay=10;p.food=20;p.hand.improvements=['A004'];game.round=game.ruleRoundDeck.indexOf('major')+1;
  doAction(0,'major');let c=autoRules.choice();assert.equal(c.type,'develop');
  assert.ok(c.options.some(o=>o.major==='fireplace2'));assert.ok(c.options.some(o=>o.cardId==='A004'),'the same action offers major and minor improvements');
  assert.equal(autoRules.choose(0,'fireplace2'),undefined);finishChoices();assert.ok(p.majors.includes('fireplace2'));assert.equal(p.clay,8);assert.equal(p.hearth,false);assert.ok(!game.majorSupply.includes('fireplace2'));
  assert.equal(autoRules.options({type:'develop',seat:0}).find(o=>o.value==='hearth4:fireplace2').returnMajor,'fireplace2');

  p=reset();p.food=20;p.hand.improvements=['A004'];doAction(0,'first');c=autoRules.choice();assert.equal(c.type,'minor');
  autoRules.choose(0,c.options.find(o=>o.cardId==='A004').value);finishChoices();assert.equal(p.food,18,'starting player action grants no extra food');assert.equal(p.wood,2);assert.equal(game.nextStart,0);
  p=reset();p.food=20;p.farm[2]={type:'house'};p.hand.improvements=['A004'];game.round=game.ruleRoundDeck.indexOf('grow')+1;
  doAction(0,'grow');assert.equal(p.family,3);assert.equal(autoRules.choice().type,'minor');finishChoices();assert.equal(p.hand.improvements[0],'A004','minor improvement after growth is optional');
  console.log('PASS: stage-local shuffle, 14 round slots, hidden card faces, one reveal per round, saved order, command validation, real improvement costs/supply and minor follow-ups');
}`,sandbox);
