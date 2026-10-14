const vm=require('node:vm');
const {sandbox}=require('./test-original.cjs');
vm.runInContext(`{
  let p=reset();p.hand.occupations=['A116'];room.active=false;
  beginAction(availableActions().find(a=>a.id==='lessons'));
  assert.equal(ui.dockTab,'hand');assert.equal(ui.handOpen,true);
  assert.equal(choiceDialog(),'','no separate miniature selector');
  assert.ok(handPanel().includes('data-play-card="A116"'));
  playFromHand('A116');assert.ok(p.played.occupations.includes('A116'));assert.equal(game.usedCount[0],1);
  room.active=true;p=reset();p.hand.improvements=['A004'];p.food=2;p.grain=1;
  autoRules.ask(p,'test','minor');autoRules.drain();
  assert.equal(automaticChoiceDialog(),'');assert.ok(cardPlayContext().rule);
  assert.equal(cardPlayContext().options.filter(o=>o.id==='A004').length,2,'all alternate payment methods retained');
  assert.ok(handPanel().includes('data-play-card="A004:1"'));
  room.active=false;playFromHand('A004:1');assert.equal(p.grain,0);assert.equal(p.food,2);assert.equal(p.wood,2);
  room.active=true;p=reset();p.clay=2;
  autoRules.ask(p,'test','major',{},false);autoRules.drain();
  assert.equal(autoRules.choice().type,'major','even a single legal card waits for a click');
  assert.ok(cardPlayContext().majorOnly);assert.ok(majorPanel().includes('farm-card fc-major'));
  assert.ok(majorPanel().includes('data-play-card="fireplace2"'));
  room.active=false;playFromHand('fireplace2');assert.ok(p.majors.includes('fireplace2'));assert.equal(p.clay,0);

  room.active=true;p=reset();
  const resourceBefore=p.wood,usedBefore=game.usedCount[0],pileBefore=game.piles.wood;
  doAction(0,'wood');let id=game.undo.id;
  assert.equal(game.undo.label,availableActions().find(a=>a.id==='wood').name);
  assert.ok(!game.undo.before.undo,'history is limited to one snapshot');
  assert.equal(executeOnlineCommand(0,{type:'undoRequest',id}),undefined);
  assert.deepEqual(game.undoVote.approved,[true,false]);assert.equal(canControl(),false);
  assert.ok(executeOnlineCommand(1,{type:'action',id:'day'}),'game freezes during vote');
  assert.ok(executeOnlineCommand(1,{type:'ruleAbility',id:'B104'}));
  assert.ok(executeOnlineCommand(1,{type:'undoVote',id:'old',agree:true}),'stale vote rejected');
  assert.ok(executeOnlineCommand(8,{type:'undoVote',id,agree:true}),'unknown seat rejected');
  game=JSON.parse(JSON.stringify(game));
  assert.equal(executeOnlineCommand(1,{type:'undoVote',id,agree:true}),undefined);
  assert.equal(game.players[0].wood,resourceBefore);assert.equal(game.usedCount[0],usedBefore);
  assert.equal(game.piles.wood,pileBefore);assert.equal(game.turn,0);assert.ok(!('wood' in game.occupied));
  assert.equal(game.undo,undefined);assert.equal(game.undoVote,undefined);assert.ok(!canRequestUndo(),'cannot undo twice');
  assert.ok(executeOnlineCommand(0,{type:'undoRequest',id}));

  doAction(0,'wood');id=game.undo.id;const woodAfter=game.players[0].wood;
  executeOnlineCommand(0,{type:'undoRequest',id});executeOnlineCommand(1,{type:'undoVote',id,agree:false});
  assert.equal(game.players[0].wood,woodAfter);assert.equal(game.turn,1);assert.ok(!game.undoVote);
  doAction(1,'day');assert.notEqual(game.undo.id,id);assert.ok(executeOnlineCommand(0,{type:'undoRequest',id}),'old snapshot cannot be requested');
  id=game.undo.id;room.members[1].online=false;assert.ok(executeOnlineCommand(0,{type:'undoRequest',id}));room.members[1].online=true;

  p=reset();p.hand.occupations=['A116'];const foodBefore=p.food;
  doAction(0,'lessons',{card:'A116'});id=game.undo.id;
  executeOnlineCommand(0,{type:'undoRequest',id});executeOnlineCommand(1,{type:'undoVote',id,agree:true});
  assert.ok(game.players[0].hand.occupations.includes('A116'));assert.ok(!game.players[0].played.occupations.includes('A116'));
  assert.equal(game.players[0].food,foodBefore);assert.equal(game.usedCount[0],0);

  game=readyGame({...DEFAULT_SETTINGS,players:3,moor:false,cardDeck:'AB'});game.players.forEach(p=>p.ai=false);
  room.members=[{name:'甲',online:true},{name:'乙',online:true},{name:'丙',online:true}];
  doAction(0,'day');id=game.undo.id;executeOnlineCommand(0,{type:'undoRequest',id});
  executeOnlineCommand(1,{type:'undoVote',id,agree:true});assert.ok(game.undoVote,'two votes cannot approve for three players');
  executeOnlineCommand(2,{type:'undoVote',id,agree:true});assert.equal(game.undoVote,undefined);assert.equal(game.turn,0);
  console.log('PASS: full-hand card play, payment variants, explicit single-card selection, unanimous undo, veto, stale votes, reconnect state and full action rollback');
}`,sandbox);
