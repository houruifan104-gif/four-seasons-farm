const vm = require('node:vm');
const { sandbox } = require('./test-original.cjs');
vm.runInContext(`{
  let p=reset();
  for(const c of MAJORS){
    p.majors=[c.id];
    const groups=majorRuleGroups(c);
    if(c.cook){
      const rows=groups.find(g=>g.title==='随时').exchanges;
      assert.equal(rows[0].food,vegetableFoodValue(p));
      for(const [index,key] of ['sheep','boar','cattle'].entries())assert.equal(rows[index+1].food,animalFoodValue(p,key));
    }
    if(c.bake){
      const rate=autoRules.bakeRates(p).find(r=>r[0]===c.id);
      assert.equal(groups.find(g=>g.title==='烤面包行动').exchanges[0].food,rate[1]);
      assert.equal(c.bakeLimit||99,rate[2]);
    }
    ui.detailCard=c.id;
    const html=cardDetailDialog();
    assert.ok(html.includes('major-rules'),c.id+' details show rules');
    assert.ok(!html.includes('fc-english'));
    assert.ok(!html.includes('卡牌效果'));
  }
  for(const c of [OCCUPATIONS[0],IMPROVEMENTS[0],ORIGINAL_CARD_CATALOG[0]]){
    ui.detailCard=c.id;
    assert.ok(cardDetailDialog().includes(escapeHTML(c.effect)),c.id+' still shows its effect');
    assert.ok(!cardDetailDialog().includes('major-rules'));
  }
  p=reset();for(const key of ['wood','clay','reed','stone'])p[key]=30;
  autoRules.ask(p,'','major');autoRules.drain();
  const html=automaticChoiceDialog();
  assert.ok(html.includes('data-rule-choice="fireplace2"'));
  assert.ok(html.includes('1 牛'));
  assert.ok(html.includes('4 食物'));
  assert.ok(html.includes('每次最多转换 2 个谷物'));
  assert.ok(html.includes('3／5／7'));
  assert.ok(html.includes('2／4／5'));
  finishChoices();
  ui.mode={id:'major',choice:true};
  assert.ok(choiceDialog().includes('major-exchanges'));
  console.log('PASS: major food rates match engine; bake limits, workshop thresholds, build choices and card details are visible');
}`, sandbox);
