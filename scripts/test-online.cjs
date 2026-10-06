const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const app = { innerHTML: '', addEventListener() {} };
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const sandbox = { console, crypto: webcrypto, URL, URLSearchParams, localStorage: storage, sessionStorage: storage, location: { search: '?test=rules', href: 'http://localhost/', protocol: 'http:' }, document: { querySelector: () => app, addEventListener() {} }, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, queueMicrotask: () => {}, requestAnimationFrame: () => {}, navigator: {} };
sandbox.window = sandbox; sandbox.matchMedia = () => ({ matches: false });
vm.createContext(sandbox);
for (const f of ['multiplayer.js', 'original-rules.js', 'game.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox);
sandbox.assert = assert;
vm.runInContext(`
room.active = true; room.host = true; room.started = true; room.status = 'playing';
room.members = [{name:'甲',online:true},{name:'乙',online:true}];
game = freshGame({players:2,moor:true,cards:true,seasons:false,aliens:true});
game.players.forEach(p => p.ai = false); ui.dialog = null;
const act = (seat,id,option={},special=false) => executeOnlineCommand(seat,{type:'action',id,option,special});
const before = JSON.stringify(game);
assert.ok(act(1,'wood')); assert.equal(JSON.stringify(game),before,'out-of-turn rejected');
assert.ok(act(0,'plow',{cell:0})); assert.equal(JSON.stringify(game),before,'house cannot be plowed');
assert.equal(act(0,'wood'),undefined); assert.equal(game.players[0].wood,3); assert.equal(game.turn,1);
assert.ok(act(1,'wood')); assert.equal(game.players[1].wood,0,'occupied action rejected');
assert.equal(act(1,'plow',{cell:2}),undefined); assert.equal(game.players[1].farm[2].type,'field'); assert.equal(game.players[0].farm[2].type,'empty','guest farms independently');
assert.equal(act(0,'lessons',{card:game.players[0].hand.occupations[0]}),undefined);
const guestBefore = JSON.stringify(game);
assert.ok(act(1,'sow',{cell:2,crop:'wood'})); assert.equal(JSON.stringify(game),guestBefore,'invalid crop rejected');
assert.equal(act(1,'grain'),undefined); assert.equal(game.round,2); assert.equal(game.turn,0);
room.host=false; room.seat=1; game.turn=1; assert.equal(meIndex(),1); assert.equal(canControl(),true); room.pending=true; assert.equal(canControl(),false); room.pending=false; room.host=true;
room.members[1].online=false; const paused=JSON.stringify(game); assert.ok(act(1,'day')); assert.equal(JSON.stringify(game),paused,'disconnect pauses actions'); room.members[1].online=true;
room.members=Array.from({length:6},(_,i)=>({name:'玩家'+i,online:true}));
game=freshGame({players:6,moor:true,cards:true,seasons:true,aliens:false}); game.players.forEach(p=>p.ai=false); room.seat=0;
let moves=0, harvests=0;
while(game.phase!=='ended' && moves<300) {
  if(game.phase==='harvest') { assert.ok(executeOnlineCommand(1,{type:'continue'})); assert.equal(executeOnlineCommand(0,{type:'continue'}),undefined); harvests++; continue; }
  const who=game.turn;
  const action=availableActions().find(a=>a.unlock<=game.round && ['simple','pile'].includes(a.kind) && (a.repeatable || !(a.id in game.occupied)) && canAct(game.players[who],a));
  assert.ok(action,'legal action available'); assert.equal(act(who,action.id),undefined); moves++;
}
assert.equal(game.phase,'ended'); assert.equal(harvests,6); assert.equal(game.players.length,6);
console.log('PASS: independent seats, turns, targets, cards, duplicate actions, disconnect pause, guest UI identity, 6-player 14-round game and 6 harvests ('+moves+' moves)');
`, sandbox);
