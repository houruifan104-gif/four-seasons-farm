const vm = require('node:vm');
const { sandbox } = require('./test-original.cjs');
vm.runInContext(`{
  for (const players of [2,6]) {
    const p=reset();
    game.settings.players=players;
    while(game.players.length<players)game.players.push({...game.players[1],name:'其他玩家'});
    game.settings.moor=true;game.settings.seasons=true;game.settings.aliens=true;
    for (const round of [1,14]) {
      game.round=round;render();
      const html=app.innerHTML;
      for(const action of availableActions())assert.equal(html.split('data-action="'+action.id+'"').length-1,1,action.id+' appears once, including locked actions');
      for(const action of SPECIALS)assert.equal(html.split('data-special="'+action.id+'"').length-1,1);
      assert.ok(html.includes('round-board'));
      assert.ok(!html.includes('class="later-actions"'),'round spaces are visible without opening a disclosure');
    }
  }
  const p=reset();p.played.occupations=['A116'];p.played.improvements=['B067'];p.majors=['fireplace2'];
  game.majorSupply=game.majorSupply.filter(id=>id!=='fireplace2');
  const html=handPanel();const played=html.slice(html.indexOf('played-rack'));
  for(const id of ['A116','B067','fireplace2'])assert.ok(played.includes('data-table-card="'+id+'"'),id+' gets a full played card');
  assert.ok(played.includes('major-exchanges'),'played cooking facilities retain conversion rates');
  assert.equal((majorPanel().match(/class="major-supply-card/g)||[]).length,10);
  assert.ok(majorPanel().includes('已建造'));
  console.log('PASS: all action spaces appear once, future spaces remain on the board, and played occupations/minors/majors retain full card faces');
}`,sandbox);
