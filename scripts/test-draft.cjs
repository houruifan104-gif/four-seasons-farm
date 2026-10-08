const vm = require('node:vm');
const { sandbox } = require('./test-original.cjs');
vm.runInContext(`
function resetDraft(n=2,deck='AB'){
  room.active=true;room.host=true;room.started=true;room.status='playing';room.seat=0;room.pending=false;
  room.members=Array.from({length:n},(_,i)=>({name:'玩家'+i,online:true}));
  game=freshGame({...DEFAULT_SETTINGS,players:n,cardDeck:deck,moor:false,seasons:false,aliens:false});
  game.players.forEach(p=>p.ai=false);ui.dialog=null;ui.mode=null;ui.draftKind='occupations';return game;
}
for(const deck of ['A','B','AB'])for(let n=2;n<=6;n++){
  resetDraft(n,deck);
  assert.equal(game.phase,'draft');assert.equal(Object.keys(game.piles).length,0);
  assert.equal(game.draft.pools.occupations.length,n*7);assert.equal(game.draft.pools.improvements.length,n*7);
  const all=[...game.draft.pools.occupations,...game.draft.pools.improvements];assert.equal(new Set(all).size,n*14);
  if(deck!=='AB')assert.ok(all.every(id=>id.startsWith(deck)));
  assert.ok(game.players.every(p=>p.hand.occupations.length===0&&p.hand.improvements.length===0));
  assert.ok(game.draft.pools.occupations.every(id=>findHandCard(id).minPlayers<=n),'public pool respects player count');
  assert.equal(shuffledCards('occupation',deck,n).length,(n===2?42:n===3?63:84)*(deck==='AB'?2:1));
  assert.equal(shuffledCards('minor',deck,n).length,84*(deck==='AB'?2:1),'minor deck unchanged');
  const opening=game.players.map(p=>JSON.stringify({...p,hand:null}));
  let count=0;
  while(game.phase==='draft'){
    assert.equal(game.turn,count%n);assert.equal(game.draft.turn,count%n);
    const who=game.turn,id=chooseDraftAI(who);assert.ok(id);
    assert.equal(executeOnlineCommand(who,{type:'draftPick',id}),undefined);
    assert.equal(game.draft.picks,++count);
    if(count===n+1){game=JSON.parse(JSON.stringify(game));assert.equal(game.phase,'draft');assert.equal(game.draft.turn,count%n);}
    assert.ok(count<=n*14);
  }
  assert.equal(count,n*14);assert.equal(game.phase,'play');assert.equal(game.turn,0);assert.equal(game.round,1);
  assert.ok(game.players.every(p=>p.hand.occupations.length===7&&p.hand.improvements.length===7));
  assert.equal(game.draft.pools.occupations.length+game.draft.pools.improvements.length,0);
  assert.equal(game.piles.wood,3,'first round replenished exactly once');
  game.players.forEach((p,i)=>assert.equal(JSON.stringify({...p,hand:null}),opening[i],'draft does not play cards or charge resources'));
  assert.ok(executeOnlineCommand(0,{type:'draftPick',id:all[0]}));assert.equal(game.piles.wood,3);
}
resetDraft();
let draftBefore=JSON.stringify(game),firstDraftCard=game.draft.pools.occupations[0];
for(const [seat,command] of [[1,{type:'draftPick',id:firstDraftCard}],[0,{type:'draftPick',id:'fake'}],[0,{type:'action',id:'wood'}],[0,{type:'continue'}],[0,{type:'ruleAbility',id:'B104'}]]){
  assert.ok(executeOnlineCommand(seat,command));assert.equal(JSON.stringify(game),draftBefore);
}
room.members[1].online=false;assert.ok(executeOnlineCommand(0,{type:'draftPick',id:firstDraftCard}));assert.equal(JSON.stringify(game),draftBefore);room.members[1].online=true;
assert.equal(canControl(),false);render();assert.ok(app.innerHTML.includes('公共选牌'));assert.ok(!app.innerHTML.includes('data-action='));
executeOnlineCommand(0,{type:'draftPick',id:firstDraftCard});draftBefore=JSON.stringify(game);
assert.ok(executeOnlineCommand(1,{type:'draftPick',id:firstDraftCard}));assert.equal(JSON.stringify(game),draftBefore);
assert.match(app.innerHTML,/data-draft-pick="[^"]+" disabled/,'other seat cannot click pick');
executeOnlineCommand(1,{type:'draftPick',id:game.draft.pools.improvements[0]});
for(let round=1;round<7;round++){
  executeOnlineCommand(0,{type:'draftPick',id:game.draft.pools.occupations[0]});
  executeOnlineCommand(1,{type:'draftPick',id:game.draft.pools.improvements[0]});
}
assert.equal(game.players[0].hand.occupations.length,7);assert.equal(game.players[1].hand.improvements.length,7);
draftBefore=JSON.stringify(game);assert.ok(executeOnlineCommand(0,{type:'draftPick',id:game.draft.pools.occupations[0]}));assert.equal(JSON.stringify(game),draftBefore);
ui.draftKind='occupations';render();assert.ok(app.innerHTML.includes('该类已满 7 张'));assert.equal(ui.draftKind,'occupations','full category can still be inspected');
assert.ok(game.draft.pools.improvements.includes(chooseDraftAI(0)),'AI picks only below cap');
while(game.phase==='draft')assert.equal(executeOnlineCommand(game.turn,{type:'draftPick',id:chooseDraftAI(game.turn)}),undefined);
assert.ok(game.players.every(p=>p.hand.occupations.length===7&&p.hand.improvements.length===7));
assert.equal(freshGame({...DEFAULT_SETTINGS,cardDeck:'simple'}).phase,'play');
assert.equal(freshGame({...DEFAULT_SETTINGS,cards:false}).phase,'play');
// Boundary cards carry the publisher's 1+/3+/4+ thresholds.
for(const deck of ['A','B'])for(const [number,minimum] of [[85,1],[126,1],[127,3],[147,3],[148,4],[168,4]]){
  const card=findHandCard(deck+String(number).padStart(3,'0'));assert.equal(card.minPlayers,minimum);
  for(let n=2;n<=6;n++)assert.equal(cardAllowedForPlayers(card,n),n>=minimum);
}
resetDraft();game.draft.pools.occupations[0]='A148';draftBefore=JSON.stringify(game);
assert.ok(executeOnlineCommand(0,{type:'draftPick',id:'A148'}));assert.equal(JSON.stringify(game),draftBefore,'host rejects ineligible occupation even if present');
assert.equal(repairDraftPlayerLimits(game),true);assert.equal(game.draft.pools.occupations.length,14);assert.ok(game.draft.pools.occupations.every(id=>findHandCard(id).minPlayers===1));
const kept=game.draft.pools.occupations[0];executeOnlineCommand(0,{type:'draftPick',id:kept});
game.draft.pools.occupations[1]='B127';const chosen=JSON.stringify(game.players.map(p=>p.hand));const remainingMinors=JSON.stringify(game.draft.pools.improvements);
assert.equal(repairDraftPlayerLimits(game),true);assert.equal(game.draft.picks,1);assert.equal(game.turn,1);assert.equal(game.draft.pools.occupations.length,13);assert.equal(JSON.stringify(game.players.map(p=>p.hand)),chosen);assert.equal(JSON.stringify(game.draft.pools.improvements),remainingMinors);
assert.equal(new Set([...game.draft.pools.occupations,kept]).size,14,'migration never duplicates a picked card');
assert.equal(repairDraftPlayerLimits(game),false,'migration is idempotent');
render();assert.ok(app.innerHTML.includes('1+ 人'));assert.ok(app.innerHTML.includes('当前 2 人筛选'));
game.phase='play';draftBefore=JSON.stringify(game);assert.equal(repairDraftPlayerLimits(game),false);assert.equal(JSON.stringify(game),draftBefore,'ongoing games are preserved');
console.log('PASS: all A/B player thresholds, 2–6 player eligible deck counts, stale card rejection and saved draft repair');
console.log('PASS: public draft for 2–6 players and A/B/AB; 7+7 caps, alternating seats, AI, persistence, authority, duplicates, paused rooms and one-time round start');
`, sandbox);
