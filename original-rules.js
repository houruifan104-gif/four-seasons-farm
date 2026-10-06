/* Automatic A/B effects. State and pending decisions are JSON so rooms can resume. */
(() => {
  const MATERIALS = ['wood','clay','reed','stone'];
  const ANIMALS = ['sheep','boar','cattle','horse'];
  const LABELS = {food:'食物',wood:'木材',clay:'黏土',reed:'芦苇',stone:'石料',grain:'谷物',veg:'蔬菜',sheep:'羊',boar:'猪',cattle:'牛',horse:'马',fuel:'燃料'};
  const HARVESTS = [4,7,9,11,13,14];
  const PASSIVE = new Set();
  class OriginalRules {
    constructor(api) { this.api=api; this.inserting=false; this.cursor=0; }
    get g() { return this.api.game(); }
    get active() { return this.g.settings.cards && ['A','B','AB'].includes(this.g.settings.cardDeck); }
    get queue() { return this.g.ruleQueue ||= []; }
    p(seat) { return this.g.players[seat]; }
    seat(p) { return this.g.players.indexOf(p); }
    has(p,id) { return p.played.occupations.includes(id)||p.played.improvements.includes(id); }
    owns(p) { return p.played.occupations.concat(p.played.improvements); }
    state(p,id) { p.rules ||= {}; return p.rules[id] ||= {}; }
    stats(p) { p.ruleStats ||= {}; return p.ruleStats[this.g.round] ||= {actions:[],materials:0,built:[],newborn:0,placedGoods:false}; }
    rooms(p) { return p.farm.filter(c=>c.type==='house').length; }
    fields(p) { return p.farm.filter((c,i)=>c.type==='field'||this.has(p,'B072')&&c.type==='pasture'&&this.pastures(p).some(a=>a[0]===i&&a.length<=2)).concat(p.cardFields || []); }
    pastures(p) { const groups=new Map(); p.farm.forEach((c,i)=>{if(c.type==='pasture'){const id=c.pastureId??`single-${i}`; if(!groups.has(id))groups.set(id,[]);groups.get(id).push(i);}});return [...groups.values()]; }
    stables(p) { return Object.values(p.stables).reduce((a,b)=>a+b,0); }
    empty(p) { const all=p.farm.map((c,i)=>c.type==='empty'?i:-1).filter(i=>i>=0);if(!this.has(p,'B038'))return all;const nonAdjacent=all.filter(i=>!p.farm.some((c,j)=>c.type==='house'&&this.adjacent(i,j)));return nonAdjacent.length?nonAdjacent:all; }
    crops(p,kind) { return this.fields(p).filter(c=>c.crop===kind&&c.qty>0); }
    fenceCount(p) { return Number.isInteger(p.fences)?p.fences:this.pastures(p).reduce((n,c)=>n+this.boundary(c).length,0); }
    boundary(cells) { const set=new Set(cells), edges=[]; for(const i of cells){const x=i%5,y=Math.floor(i/5); for(const [j,e] of [[x?i-1:-1,`v${x},${y}`],[x<4?i+1:-1,`v${x+1},${y}`],[y?i-5:-1,`h${x},${y}`],[y<2?i+5:-1,`h${x},${y+1}`]])if(!set.has(j))edges.push(e);}return edges; }
    adjacent(a,b) { return Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5))===1; }
    affordable(p,cost={}) { return Object.entries(cost).every(([k,n])=>(p[k]||0)>=n); }
    pay(p,cost={}) { for(const [k,n] of Object.entries(cost))p[k]-=n; }
    label(goods) { return Object.entries(goods).filter(([,n])=>n).map(([k,n])=>`${n} ${LABELS[k]||k}`).join('、'); }
    log(p,id,text) { this.api.log(`${p.name} · ${id} ${this.api.card(id)?.name||''}：${text}`); }
    add(task) { if(!this.active)return; if(this.inserting)this.queue.splice(this.cursor++,0,task); else this.queue.push(task); }
    offer(p,id,offers,optional=true,title='选择卡牌效果') { this.add({seat:this.seat(p),card:id,type:'offer',offers,optional,title}); }
    ask(p,id,type,args={},optional=true) {
      if(type==='sow'&&!args.sowStarted){args={...args,sowStarted:true};if(!args.restricted){if(this.has(p,'A065'))this.gain(p,'A065',{grain:1});this.event('beforeSow',this.seat(p),{restricted:false});}}
      if(type==='bake'&&this.has(p,'B067')&&!args.prepared){this.gain(p,'B067',{grain:this.stats(p).actions.filter(a=>a.kind==='pile').length});args={...args,prepared:true};}
      this.add({seat:this.seat(p),card:id,type,...args,optional});
    }
    event(type,seat,info={}) { if(this.active)this.add({type:'event',event:type,seat,info}); }
    gain(p,id,goods) {
      for(const [key,n] of Object.entries(goods)) {
        if(!n)continue;
        if(ANIMALS.includes(key))this.api.animals(p,key,n);else p[key]=(p[key]||0)+n;
      }
      this.log(p,id,`获得 ${this.label(goods)}`);
      this.event('gain',this.seat(p),{goods,source:id});
    }
    bonus(p,id,n) { if(n){p.cardBonus=(p.cardBonus||0)+n;this.log(p,id,`获得 ${n} 奖励分`);} }
    once(p,id,key,fn) { const s=this.state(p,id);if(!s[key]){s[key]=true;fn();} }
    schedule(p,id,offsets,goods) { const state=this.state(p,id); state.schedule ||= [];for(const offset of offsets){const round=this.g.round+offset;if(round<=14)state.schedule.push({round,goods});} }
    extra(p,id,type,args={},optional=true) { this.ask(p,id,type,args,optional); }
    notifyBuild(p,type,before,info={}) { this.event(type,this.seat(p),{...info,before});this.event('milestone',this.seat(p)); }
    choice() { const task=this.queue[0];return task&&task.type!=='event'&&task.type!=='continue'?{...task,options:this.options(task)}:null; }
    options(t) {
      const p=this.p(t.seat); if(!p)return [];
      let options=[];
      const add=(value,label,effect={})=>options.push({value:String(value),label,...effect});
      if(t.type==='offer')for(const [i,o] of t.offers.entries())if(this.affordable(p,o.cost)&&(!o.test||this.test(p,o.test)))add(i,o.label||`${this.label(o.cost||{})} → ${this.label(o.gain||{})}${o.bonus?`、${o.bonus} 分`:''}`,o);
      if(t.type==='plow')for(const i of this.empty(p).filter(i=>!p.farm.some(c=>c.type==='field')||p.farm.some((c,j)=>c.type==='field'&&this.adjacent(i,j))))add(i,`开垦第 ${i+1} 格`,{cost:t.cost||{},cell:i});
      if(t.type==='sow') {
        this.fields(p).forEach((c,i)=>{if(!c.crop)for(const crop of ['grain','veg'])if(p[crop]>0&&(!c.only||c.only===crop))add(`${i}:${crop}`,`第 ${i+1} 块田种${LABELS[crop]}`,{field:i,crop,cost:{[crop]:1}});});
      }
      if(t.type==='stable')if(this.stables(p)+(p.removedStables||0)<4){for(let i=0;i<15;i++){const c=p.farm[i];if(!c.stable&&['empty','pasture'].includes(c.type)&&(!t.singlePasture||c.type==='pasture'&&this.pastures(p).some(a=>a.length===1&&a[0]===i)))for(const animal of ANIMALS.filter(k=>k!=='horse'||this.g.settings.moor))add(`${i}:${animal}`,`第 ${i+1} 格建${LABELS[animal]}棚`,{cell:i,animal,cost:t.cost||{wood:2}});}}
      if(t.type==='stable'&&this.has(p,'B085')&&!this.state(p,'B085').built&&this.stables(p)+(p.removedStables||0)<4){for(let i=0;i<10;i++)if(i%5<4&&[i,i+1,i+5,i+6].every(j=>p.farm[j].type==='field')){add('central','在四块田中央建特殊马厩，增加 1 人住房',{cost:t.cost||{wood:2},central:true});break;}}
      if(t.type==='room'){
        const groups=this.empty(p).filter(i=>p.farm.some((c,j)=>c.type==='house'&&this.adjacent(i,j))).map(i=>[i]);
        if(t.batch)for(const pair of groups.slice())for(const i of this.empty(p))if(!pair.includes(i)&&(pair.some(j=>this.adjacent(i,j))||p.farm.some((c,j)=>c.type==='house'&&this.adjacent(i,j)))){const pair2=[...pair,i].sort((a,b)=>a-b);if(!groups.some(g=>g.join(',')===pair2.join(',')))groups.push(pair2);}
        for(const cells of groups){let cost=t.free?{}:this.roomCost(p,t);cost=Object.fromEntries(Object.entries(cost).map(([k,n])=>[k,n*cells.length]));if(cells.length>=2&&this.has(p,'A014')){cost.reed=Math.max(0,(cost.reed||0)-2);cost[p.houseMaterial]=Math.max(0,(cost[p.houseMaterial]||0)-({wood:2,clay:3,stone:4})[p.houseMaterial]);}add(cells.join(','),`第 ${cells.map(i=>i+1).join('、')} 格扩建${cells.length} 间房`,{cell:cells[0],cells,cost});}
      }
      if(t.type==='renovate'&&!this.has(p,'A010')&&!this.has(p,'B033'))for(const material of p.houseMaterial==='wood'?(this.has(p,'A087')?['clay','stone']:['clay']):p.houseMaterial==='clay'?['stone']:[])add(material,`翻修为${material==='clay'?'黏土':'石'}屋`,{material,cost:t.free?{}:this.renovationCost(p,material,t)});
      if(t.type==='grow'&&p.family<5&&(t.noRoom||this.housing(p)>p.family))add('grow','增加 1 名家人',{cost:t.cost||{}});
      if(t.type==='pasture') {
        const selected=t.selected||[];
        if(!t.chooseAnimal&&!t.size){
          for(const i of this.empty(p))if(!selected.includes(i)&&(!selected.length||selected.some(j=>this.adjacent(i,j))))add(`select:${i}`,`圈入第 ${i+1} 格${selected.length?`（已选 ${selected.map(i=>i+1).join('、')}）`:''}`,{selectCell:i});
          if(selected.length){add('finish',`确认 ${selected.length} 格牧场，选择牲畜与费用`,{finishSelection:true});add('undo','撤回最后一格',{undoSelection:true});}
        } else {
          const empty=this.empty(p),groups=t.chooseAnimal?[selected]:empty.map(i=>[i]);
          if(t.size===2){groups.length=0;for(const a of empty)for(const b of empty)if(a<b&&this.adjacent(a,b))groups.push([a,b]);}
          for(const cells of groups){if(this.pastures(p).length&&!cells.some(i=>p.farm.some((c,j)=>c.type==='pasture'&&this.adjacent(i,j))))continue;
            const edges=this.boundary(cells).filter(e=>!(p.fenceEdges||[]).includes(e)),discount=this.has(p,'A088')?3:0;
            const outer=edges.filter(e=>/^v(0|5),/.test(e)||/^h\d+,(0|3)$/.test(e)).length;
            const modes=this.has(p,'B030')&&outer?[0,outer]:[0];
            for(const palisades of modes){if(this.fenceCount(p)+edges.length-palisades>15)continue;
              const amount=Math.max(0,edges.length-palisades-discount-(t.discount||0))+palisades*2;
              for(const animal of ANIMALS.filter(k=>k!=='horse'||this.g.settings.moor)){
                const variants=t.free?[{}]:t.cost?[t.cost]:[{wood:amount},...(this.has(p,'A016')&&!palisades?[{clay:amount}]:[])];
                for(let v=0;v<variants.length;v++)add(`${cells.join(',')}:${animal}:${v}:${palisades}`,`${cells.length} 格${LABELS[animal]}牧场 · ${this.label(variants[v])||'免费'}${palisades?` · ${palisades} 段木栅栏`:''}`,{cells,animal,edges,palisades,cost:variants[v]});
              }
            }
          }
          if(!groups.some(g=>g.length===0)&&t.chooseAnimal)add('back','重新选择地块',{backSelection:true});
        }
      }
      if(['occupation','minor','major','develop'].includes(t.type)) {
        if(t.type!=='major')for(const kind of t.type==='occupation'?['occupations']:['improvements'])for(const id of p.hand[kind]){
          const c=this.api.card(id);if(!c||!this.api.requirement(p,c)||t.allowed&&!t.allowed.includes(id)||id==='A010'&&t.type!=='develop')continue;
          if(c.returnCooking){for(const major of p.majors.filter(id=>/^(fireplace|hearth)/.test(id)))add(`${id}:${major}`,`${c.name} · 归还${this.api.majors.find(c=>c.id===major).name}`,{cardId:id,kind,cost:{},returnMajor:major});continue;}
          const variants=kind==='occupations'?(t.free?[{cost:{}}]:this.occupationPayments(p,t.fee??(p.played.occupations.length?2:1))):this.cardCosts(p,c).map(cost=>({cost}));
          variants.forEach(({cost,pool=0},i)=>{if(!t.needStone||cost.stone>0)add(`${id}:${i}`,`${c.name} · ${this.label(cost)||'免费'}${pool?`、从旅行艺人格支付 ${pool} 食物`:''}`,{cardId:id,kind,cost,pool});});
        }
        if(['major','develop'].includes(t.type))for(const c of this.api.majors)if(this.g.majorSupply.includes(c.id)&&(!t.allowed||t.allowed.includes(c.id))){const cost=t.cost||this.majorCost(p,c);if(!t.needStone||cost.stone>0)add(c.id,`${c.name} · ${this.label(cost)||'免费'}`,{major:c.id,cost});if(c.id.startsWith('hearth')&&!t.needStone)for(const old of p.majors.filter(id=>id.startsWith('fireplace')))add(`${c.id}:${old}`,`${c.name} · 归还${this.api.majors.find(c=>c.id===old).name}`,{major:c.id,cost:{},returnMajor:old});}
      }
      if(t.type==='bake') {
        const rates=this.bakeRates(p);for(const [id,rate,limit] of rates)for(let n=1;n<=Math.min(p.grain,limit,t.max||99);n++)add(`${id}:${n}`,`烤 ${n} 谷物 → ${rate*n} 食物`,{cost:{grain:n},gain:{food:rate*n},oven:id,qty:n});
        if(this.has(p,'A097'))add('occupation','改为免费打出职业',{next:[{type:'occupation',free:true}]});
      }
      if(t.type==='takePile')for(const a of this.api.actions())if(a.kind==='pile'&&MATERIALS.includes(a.key)&&(this.g.piles[a.id]||0)>=(t.thresholds?.[a.key]||t.min||1))add(a.id,`从${a.name}取 1 ${LABELS[a.key]}`,{take:{action:a.id,key:a.key,n:1}});
      if(t.type==='harvestExtra')this.fields(p).forEach((c,i)=>{if(c.crop==='grain'&&c.qty>=2&&!(this.state(p,'A112').extraFields||[]).includes(i))add(i,`第 ${i+1} 块谷物田多收 1 谷物`,{harvestExtra:i});});
      if(t.type==='crop')this.fields(p).forEach((c,i)=>{if(c.crop===(t.crop||'veg')&&c.qty>0)add(i,`从第 ${i+1} 块田取 1 ${LABELS[c.crop]}`,{field:i,gain:{[c.crop]:1}});});
      if(t.type==='discard')for(const kind of ['occupations','improvements'])for(const id of p.hand[kind])add(id,`弃掉${this.api.card(id).name}`,{discard:{id,kind},gain:t.gain});
      if(t.type==='actionChoice'){
        const a=t.action;const choices=this.api.choices(p,a.id).options;
        if(choices.length){for(const [v,label,enabled]of choices)if(enabled)add(v,label,{baseValue:v});}
        else if(a.kind==='target'){for(const i of this.api.cells(p,a.id))add(i,`第 ${i+1} 格`,{baseCell:i});}
        else add('execute',a.name,{});
      }
      if(t.type==='actionTarget')for(const i of this.api.cells(p,t.action.id))add(i,`第 ${i+1} 格`,{baseCell:i});
      if(t.type==='repeat')for(const a of this.api.actions())if(a.unlock<=this.g.round&&(!t.allowed||t.allowed.includes(a.id))&&(t.occupied||!(a.id in this.g.occupied))&&this.api.canAct(p,a))add(a.id,`额外使用${a.name}`,{action:a.id,cost:t.cost||{}});
      if(t.type==='selectThree')for(const id of p.hand.occupations.filter(id=>!(t.selected||[]).includes(id)))add(id,`选择${this.api.card(id).name}`,{cardId:id});
      if(t.type==='moveCrop')this.fields(p).forEach((from,i)=>{if(from.qty>=2)this.fields(p).forEach((to,j)=>{if(!to.crop&&(!to.only||to.only===from.crop))add(`${i}:${j}`,`第 ${i+1} 田 → 第 ${j+1} 田`,{from:i,to:j});});});
      if(['room','renovate'].includes(t.type)&&this.has(p,'A123')){for(const o of options.slice())for(const k of ['clay','stone'])if((o.cost?.[k]||0)>=2){const cost={...o.cost,[k]:o.cost[k]-2,wood:(o.cost.wood||0)+1};options.push({...o,value:o.value+':frame',label:o.label+' · 用 1 木替代 2 建材',cost});}}
      options=options.filter(o=>this.affordable((o.major||o.kind==='improvements')&&this.has(p,'B075')?{...p,wood:p.wood+1}:p,o.cost||{})&&(!t.maxWood||(o.cost?.wood||0)<=t.maxWood));
      if(options.length&&t.optional)options.push({value:'skip',label:'不使用此效果'});
      return options;
    }
    endSow(p,t){this.event('sow',this.seat(p),{crop:t.sownCrops.includes('veg')?'veg':'grain',restricted:!!t.restricted,fields:t.sownFields});}
    test(p,test) { if(test==='room')return p.family<5&&this.housing(p)>p.family;return true; }
    choose(seat,value) {
      const t=this.choice();if(!t||t.seat!==seat)return '等待对应玩家选择卡牌效果。';
      const option=t.options.find(o=>o.value===String(value));if(!option)return '这个选择当前不可用。';
      this.queue.shift();this.inserting=true;this.cursor=0;
      if(value!=='skip')this.resolve(t,option);else if(t.type==='sow'&&t.sownFields?.length)this.endSow(this.p(seat),t);else if(t.type==='sow'&&!t.restricted&&this.has(this.p(seat),'A094')&&this.g.turn===seat&&this.g.usedCount[seat]<this.g.workerQuota[seat])this.ask(this.p(seat),'A094','repeat',{occupied:true,sameWorker:false});
      this.inserting=false;this.drain();
    }
    drain() {
      if(!this.active||this.draining)return;
      this.draining=true;
      let count=0;
      while(this.queue.length&&count++<1000){const t=this.queue[0];this.inserting=true;this.cursor=0;
        if(t.type==='event'){this.queue.shift();this.fire(t.event,t.seat,t.info);}
        else if(t.type==='continue'){this.queue.shift();this.api.continue(t);}
        else {const opts=this.options(t);if(!opts.length){this.queue.shift();if(t.type==='sow'&&t.sownFields?.length)this.endSow(this.p(t.seat),t);}else if(!t.optional&&opts.length===1){this.queue.shift();this.resolve(t,opts[0]);}else{this.inserting=false;break;}}
        this.inserting=false;
      }
      this.draining=false;this.api.save();this.api.render();
      const choice=this.choice();if(choice&&this.p(choice.seat).ai)this.api.aiChoice(choice.seat,choice.options.find(o=>o.value!=='skip')?.value||'skip');
    }
    resolve(t,o) {
      const p=this.p(t.seat),id=t.card;if(o.pool)this.g.piles.travelers-=o.pool;
      if(o.returnMajor){p.majors=p.majors.filter(id=>id!==o.returnMajor);delete p.majorBuiltRound[o.returnMajor];this.g.majorSupply.push(o.returnMajor);}
      if((o.major||o.kind==='improvements')&&this.has(p,'B075'))this.gain(p,'B075',{wood:1});this.pay(p,o.cost);
      if(o.transfer){const q=this.p(o.transfer.seat);for(const [k,n] of Object.entries(o.transfer.goods))q[k]=(q[k]||0)+n;}
      if(o.putBack){this.g.piles[o.putBack.action]=(this.g.piles[o.putBack.action]||0)+o.putBack.n;}
      if(o.take){this.g.piles[o.take.action]-=o.take.n;this.gain(p,id,{[o.take.key]:o.take.n});}
      if(o.gain)this.gain(p,id,o.gain);if(o.cooking)this.event('cook',t.seat);if(o.bonus)this.bonus(p,id,o.bonus);
      if(o.state)Object.assign(this.state(p,id),o.state);
      if(o.allOpponents)for(const q of this.g.players)if(q!==p)this.gain(q,id,o.allOpponents);
      if(o.discard)p.hand[o.discard.kind]=p.hand[o.discard.kind].filter(c=>c!==o.discard.id);
      if(o.schedule)for(const s of o.schedule)this.schedule(p,id,s.offsets,s.goods);
      if(t.type==='plow'){const before=JSON.parse(JSON.stringify(p.farm));p.farm[o.cell]={type:'field',crop:null,qty:0};this.stats(p).placedGoods=true;this.log(p,id,`开垦第 ${o.cell+1} 格`);this.notifyBuild(p,'plow',before,{cells:[o.cell]});if((t.count||1)>1)this.ask(p,id,'plow',{...t,count:t.count-1},true);}
      if(t.type==='sow'){
        const c=this.fields(p)[o.field];c.crop=o.crop;c.qty=o.crop==='grain'?3:2;this.stats(p).placedGoods=true;
        if(this.has(p,'B115'))this.offer(p,'B115',[{label:`第 ${o.field+1} 块田多放 1 ${LABELS[o.crop]}`,extraCrop:o.field}]);
        const next={...t,count:(t.count||1)-1,sownFields:(t.sownFields||[]).concat(o.field),sownCrops:(t.sownCrops||[]).concat(o.crop)};
        if(next.count>0)this.ask(p,id,'sow',next,true);else this.endSow(p,next);
      }
      if(t.type==='stable'&&o.central){this.state(p,'B085').built=true;p.removedStables=(p.removedStables||0)+1;this.log(p,id,'田地中央的马厩提供 1 人住房');}
      if(t.type==='stable'&&!o.central){p.farm[o.cell].stable=true;p.farm[o.cell].stableAnimal=o.animal;p.stables[o.animal]++;this.event('stable',t.seat,{cell:o.cell});this.log(p,id,`第 ${o.cell+1} 格建成马厩`);}
      if(t.type==='room'){const before=JSON.parse(JSON.stringify(p.farm));(o.cells||[o.cell]).forEach(i=>p.farm[i]={type:'house'});this.notifyBuild(p,'room',before,{material:p.houseMaterial,count:(o.cells||[o.cell]).length});this.log(p,id,`扩建第 ${o.cell+1} 格`);}
      if(t.type==='renovate'){const from=p.houseMaterial;p.houseMaterial=o.material;this.event('renovate',t.seat,{from,to:o.material});this.log(p,id,'完成房屋翻修');}
      if(t.type==='grow'){p.family++;this.stats(p).newborn++;this.event('grow',t.seat,{count:1});this.log(p,id,'家庭增加 1 人');}
      if(t.type==='pasture'&&(o.selectCell!==undefined||o.undoSelection||o.finishSelection||o.backSelection)){
        const selected=o.backSelection?[]:o.undoSelection?(t.selected||[]).slice(0,-1):o.selectCell!==undefined?(t.selected||[]).concat(o.selectCell):(t.selected||[]);
        this.ask(p,id,'pasture',{...t,selected,chooseAnimal:!!o.finishSelection},true);
      }
      if(t.type==='pasture'&&o.cells){if(t.removeStables)p.removedStables=(p.removedStables||0)+t.removeStables;const previousFences=this.fenceCount(p);const before=JSON.parse(JSON.stringify(p.farm));const pastureId=`${this.g.round}-${t.seat}-${o.cells[0]}`;o.cells.forEach(i=>p.farm[i]={...p.farm[i],type:'pasture',animal:o.animal,pastureId});p.fenceEdges=[...new Set((p.fenceEdges||[]).concat(o.edges))];p.fences=previousFences+o.edges.length-(o.palisades||0);if(o.palisades)this.bonus(p,'B030',o.palisades);this.notifyBuild(p,'pasture',before,{cells:o.cells,fences:o.edges.length});this.log(p,id,'建成牧场');}
      if(o.cardId&&t.type!=='selectThree')this.install(p,o.cardId,{kind:o.kind,cost:o.cost,source:id,action:t.type==='develop'?'major':t.type});
      if(o.major){p.majors.push(o.major);p.majorBuiltRound[o.major]=this.g.round;this.g.majorSupply=this.g.majorSupply.filter(c=>c!==o.major);this.event('improvement',t.seat,{id:o.major,major:true,returnedFireplace:o.returnMajor?.startsWith('fireplace')});if(['clayOven','stoneOven'].includes(o.major))this.ask(p,o.major,'bake');}
      if(t.type==='bake'&&o.oven&&!t.noBakeEvent){this.event('bake',t.seat,{qty:o.qty});}
      if(t.type==='crop'){const c=this.fields(p)[o.field];c.qty--;if(!c.qty)c.crop=null;if(t.sellOption)this.offer(p,id,[{cost:{veg:1},gain:{food:3},bonus:1}]);}
      if(t.type==='actionChoice'||t.type==='actionTarget'){
        const a=t.action,v=o.baseValue,option=t.baseOption||{animal:v,card:v,major:v,supply:v,trade:v,crop:v};
        if(a.kind==='target'&&o.baseCell===undefined){this.ask(p,id,'actionTarget',{action:a,baseOption:option,sameWorker:t.sameWorker},false);}
        else{if(o.baseCell!==undefined)option.cell=o.baseCell;this.event('beforeAction',t.seat,{action:a,pile:this.g.piles[a.id]||0});this.add({type:'continue',kind:'base',seat:t.seat,action:a,option,extra:true,sameWorker:t.sameWorker});}
      }
      if(t.type==='repeat')this.api.extraAction(t.seat,o.action,{sameWorker:t.sameWorker,card:id});
      if(t.type==='moveCrop'){const a=this.fields(p)[o.from],b=this.fields(p)[o.to];b.crop=a.crop;b.qty=1;a.qty--;}
      if(t.type==='selectThree'){const selected=(t.selected||[]).concat(o.cardId);if(selected.length<Math.min(3,p.hand.occupations.length))this.ask(p,id,'selectThree',{selected},false);else{const pick=selected[Math.floor(Math.random()*selected.length)];this.install(p,pick,{kind:'occupations',cost:{},source:id});}}
      if(o.removeStables)p.removedStables=(p.removedStables||0)+o.removeStables;
      if(o.quota)this.g.workerQuota[t.seat]+=o.quota;
      if(o.noNewborn)this.stats(p).newborn=Math.max(0,this.stats(p).newborn-1);
      if(o.extraCrop!==undefined)this.fields(p)[o.extraCrop].qty++;
      if(o.harvestExtra!==undefined){this.state(p,'A112').extraFields.push(o.harvestExtra);this.ask(p,'A112','harvestExtra');}
      if(o.shiftGood)this.state(p,id).goods.shift();
      if(o.passOccupation){p.hand.occupations=p.hand.occupations.filter(x=>x!==o.passOccupation);this.p((t.seat+1)%this.g.players.length).hand.occupations.push(o.passOccupation);}
      if(o.takeFieldGrain)for(const c of this.crops(p,'grain').slice(0,o.takeFieldGrain)){c.qty--;if(!c.qty)c.crop=null;}
      if(o.removeFence)p.fences=(p.fences||0)+1;
      if(t.thenPasture&&t.type==='renovate')this.ask(p,id,'pasture');
      if(t.thenDevelop&&t.type==='renovate')this.ask(p,id,'develop');
      if(t.type==='stable'&&(t.count||1)>1)this.ask(p,id,'stable',{count:t.count-1});
      if(t.type==='occupation'&&(t.count||1)>1)this.ask(p,id,'occupation',{free:t.free,fee:t.fee,count:t.count-1});
      for(const next of o.next||[])this.ask(p,id,next.type,next,next.optional!==false);
      this.event('milestone',t.seat);
    }
    install(p,id,info={}) {
      const c=this.api.card(id),kind=info.kind||(c.kind==='occupation'?'occupations':'improvements');
      p.hand[kind]=p.hand[kind].filter(x=>x!==id);
      if(c.passing)this.p((this.seat(p)+1)%this.g.players.length).hand[kind].push(id);else p.played[kind].push(id);
      p.cardHistory ||= [];p.cardHistory.push(id);
      const s=this.state(p,id);s.playRound=this.g.round;s.playOrder=p.cardHistory.length;s.playOccupationCount=p.played.occupations.length;
      this.log(p,id,'已打出，自动执行卡牌效果');
      this.event('play',this.seat(p),{id,...info});this.event(kind==='occupations'?'occupation':'improvement',this.seat(p),{id,...info});
    }
    roomCost(p,args={}) {
      const type=p.houseMaterial;let n=5;if(this.has(p,'B126'))n=3;if(type==='wood'&&this.has(p,'B013'))n=2;
      const cost={[type]:Math.max(0,n-(type==='stone'&&this.has(p,'A143')?1:0)-(args.discount||0)),reed:Math.max(0,2-(args.reedDiscount||0))};
      if(this.has(p,'B145')&&p.wood>=(cost.wood||0)+1){cost.wood=(cost.wood||0)+1;cost.reed=0;}return cost;
    }
    renovationCost(p,type,args={}) { const cost={[type]:Math.max(0,this.rooms(p)-(args.freeMaterial?this.rooms(p):0)-(args.discount||0)-Number(type==='stone'&&this.has(p,'A143'))),reed:1};if(this.has(p,'B145')&&p.wood>=1){cost.wood=1;cost.reed=0;}return cost; }
    discounts(p,cost,{major=false,development=true}={}) {
      const c={...cost};if(development&&this.has(p,'A075')&&c.wood)c.wood--;if(this.has(p,'A143')&&c.stone)c.stone--;
      if(major&&this.has(p,'B095')&&c.stone)c.stone=Math.max(0,c.stone-Math.max(0,this.rooms(p)-2));return c;
    }
    occupationPayments(p,fee) {
      const result=[];for(let wood=0;wood<=(this.has(p,'A028')?fee:0);wood++)for(let pool=0;pool<=(this.has(p,'B155')?Math.min(fee-wood,this.g.piles.travelers||0):0);pool++){
        const cost={food:fee-wood-pool,...(wood?{wood}:{})};result.push({cost,pool});
      }return result;
    }
    cardCosts(p,c) { let costs=c.costs.map(cost=>({...cost}));if(c.id==='A020'&&this.g.round>=4)costs=[{grain:1,food:1}];if(c.id==='B036')costs=costs.map(cost=>({...cost,clay:(cost.clay||0)+p.family,food:(cost.food||0)+p.family}));return costs.map(cost=>this.discounts(p,cost)); }
    majorCost(p,c) { return this.discounts(p,c.cost,{major:true}); }
    housing(p) { let n=this.rooms(p)+Number(this.has(p,'A010'))+Number(this.has(p,'B010'))+Number(this.has(p,'A127')&&this.g.round<=9);if(this.has(p,'A085')&&p.houseMaterial!=='wood'&&p.farm.some((c,i)=>c.type==='house'&&p.farm.some((v,j)=>v.type==='field'&&this.adjacent(i,j))&&p.farm.some((v,j)=>v.type==='pasture'&&this.adjacent(i,j))))n++;if(this.state(p,'B085').built)n++;return n; }
    habitats(p) {
      const fixed=Object.fromEntries(ANIMALS.map(k=>[k,0]));let located=0;
      for(const cells of this.pastures(p)){const kind=p.farm[cells[0]].animal,stables=cells.filter(i=>p.farm[i].stable).length;located+=stables;
        let capacity=cells.length*2*Math.pow(2,stables)*(this.g.alienGlobal.smallAnimals?2:1);
        if(this.has(p,'A012'))capacity+=2;if(this.has(p,'B115')&&!stables)capacity++;
        if(this.has(p,'B072')&&p.farm[cells[0]].crop)capacity-=cells.length;
        fixed[kind]+=Math.max(0,capacity);
      }
      if(this.has(p,'A011'))fixed.boar+=this.fields(p).filter(c=>!c.crop).length;
      const harvests=HARVESTS.filter(r=>r<this.g.round||(r===this.g.round&&this.g.phase!=='play')).length;
      if(this.has(p,'A148'))fixed.sheep+=harvests;if(this.has(p,'B086'))fixed.boar+=harvests;
      if(this.has(p,'B148'))fixed.sheep+=p.played.occupations.length;
      const yard=this.has(p,'B011')?this.pastures(p).length:0;
      const generic=(this.has(p,'A086')?this.rooms(p):1)+Math.max(0,this.stables(p)-located)+yard;
      return {fixed,generic,yard};
    }
    capacity(p,kind,base) {
      const {fixed,generic}=this.habitats(p);let maximum=fixed[kind]||0;
      for(const barn of this.has(p,'B012')?ANIMALS:[null]){
        const others=ANIMALS.filter(k=>k!==kind).reduce((sum,k)=>sum+Math.max(0,p[k]-fixed[k]-(barn===k?3:0)),0);
        if(others<=generic)maximum=Math.max(maximum,fixed[kind]+(barn===kind?3:0)+generic-others);
      }return maximum;
    }
    breedingYardFood(p) {
      const {fixed,generic,yard}=this.habitats(p);let needed=ANIMALS.reduce((n,k)=>n+Math.max(0,p[k]-fixed[k]),0);
      if(this.has(p,'B012'))needed-=Math.max(...ANIMALS.map(k=>Math.min(3,Math.max(0,p[k]-fixed[k]))));
      return Math.max(0,yard-Math.max(0,needed-(generic-yard)));
    }
    bakeRates(p) { const rates=[];if(p.hearth)rates.push(['stove',2,99]);for(const id of p.majors){const c=this.api.majors.find(c=>c.id===id);if(c?.bake)rates.push([id,c.bake,id==='clayOven'?1:id==='stoneOven'?2:99]);}if(this.has(p,'A060'))rates.push(['A060',2,99]);return rates; }
    cooking(p,kind,base) { return this.has(p,'A060')?Math.max(base,({veg:4,sheep:3,cattle:5})[kind]||0):base; }
    score(p) {
      let n=0;const held=id=>this.has(p,id),pastures=this.pastures(p),fields=this.fields(p),unused=this.empty(p).length;
      if(held('A031'))n+=Math.min(unused,p.majors.length);
      if(held('A032')){const area=pastures.flat().length;n+=area>=10?4:area>=8?3:area>=7?2:area>=6?1:0;}
      if(held('A038'))n+=({wood:3,clay:2,stone:0})[p.houseMaterial];
      if(held('A098'))n+=p.farm.filter(c=>c.stable&&c.type!=='pasture').length;
      if(held('A099'))n+=pastures.filter(c=>c.length>=3).length*2;
      if(held('A101'))n+=p.majors.filter(id=>/^(fireplace|hearth)/.test(id)).length+Number(held('A060'));
      if(held('A133')){const k=p.played.improvements.length+p.majors.length;n+=k>=10?9:k>=9?7:k>=8?5:k>=7?4:k>=6?3:k>=5?2:0;}
      if(held('B031')&&this.empty(p).some(a=>this.empty(p).some(b=>this.adjacent(a,b))))n+=2;
      if(held('B039'))n+=Math.floor(p.sheep/3);
      if(held('B099'))n+=Math.max(0,p.played.occupations.length-(this.state(p,'B099').playOccupationCount||p.played.occupations.length));
      if(held('B100')){const order=this.state(p,'B100').playOrder||0;n+=(p.cardHistory||[]).slice(order).filter(id=>this.api.card(id)?.effect.includes('累积格')).length;}
      if(held('B153')){const points=p.majors.map(id=>this.api.majors.find(c=>c.id===id).points);const sum=points.reduce((a,b)=>a+b,0)+(points.length?Math.min(...points):0);n+=[5,7,9,11].filter(t=>sum>=t).length;}
      for(const q of this.g.players){if(this.has(q,'A135')){const m=Math.min(p.sheep,p.boar,p.cattle);n+=m>=4?5:m>=3?3:m>=2?1:0;}if(this.has(q,'A136')){const m=Math.min(...MATERIALS.map(k=>p[k]));n+=m>=3?5:m>=2?3:m>=1?1:0;}if(this.has(q,'B136')&&this.rooms(p)===Math.max(...this.g.players.map(p=>this.rooms(p))))n+=3;}
      if(held('A134')||held('B098'))for(const cells of pastures){const kind=p.farm[cells[0]].animal,capacity=cells.length*3+(p.stables[kind]||0);const herd=p[kind];if(held('A134')&&herd>=capacity)n++;if(held('B098')&&herd>0&&capacity-herd>=3)n++;}
      return n;
    }
    // Card-specific handlers follow below.
    onPlay(p,id,e) {
      const s=this.state(p,id),r=this.g.round,rooms=this.rooms(p),fields=this.fields(p),pastures=this.pastures(p),food=n=>this.gain(p,id,{food:n});
      const ask=(type,args={},optional=true)=>this.ask(p,id,type,args,optional),gain=goods=>this.gain(p,id,goods),offer=(offers,optional=true)=>this.offer(p,id,offers,optional);
      s.playRound=r;s.playOrder=(p.cardHistory||[]).length;s.playOccupationCount=p.played.occupations.length;
      switch(id){
        case 'A001':ask('stable',{singlePasture:true,cost:{}});break;
        case 'A002':ask('plow',{},false);break;
        case 'A003':ask('selectThree',{},false);break;
        case 'A004':gain({wood:rooms+Number(rooms>p.family)});break;
        case 'A005':gain({clay:Math.floor(p.clay/2)});break;
        case 'A006':{const goods={};for(const [c,k]of [['wellMajor','stone'],['joinery','wood'],['pottery','clay'],['basketmaker','reed']])if(p.majors.includes(c))goods[k]=1;gain(goods);break;}
        case 'A007':gain({food:this.crops(p,'grain').length,grain:this.crops(p,'veg').length});break;
        case 'A008':gain({grain:1,veg:1});break;
        case 'A009':gain({cattle:1});break;
        case 'A011':case 'A165':gain({boar:1});break;
        case 'A013':gain({clay:3});ask('renovate',{freeMaterial:true});break;
        case 'A016':case 'A077':case 'A121':gain({clay:1});break;
        case 'A019':this.schedule(p,id,[5],{_plow:1});break;
        case 'A020':ask('plow',{count:2});break;
        case 'A022':this.schedule(p,id,[Math.max(0,15-this.fenceCount(p))],{_worker:1});break;
        case 'A027':gain({wood:2});ask('major',{allowed:['clayOven','stoneOven'],cost:{clay:1,stone:1}});break;
        case 'A033':this.bonus(p,id,14-r);food((14-r)*2);break;
        case 'A036':offer(Array.from({length:Math.min(p.food,HARVESTS.filter(x=>x<r).length)},(_,i)=>({cost:{food:i+1},bonus:i+1})));break;
        case 'A040':s.cells=this.empty(p);break;
        case 'A044':case 'B045':this.schedule(p,id,[1,2,3],{food:1});break;
        case 'A047':this.schedule(p,id,Array.from({length:this.fenceCount(p)},(_,i)=>i+1),{food:1});break;
        case 'A054':food(5);break;
        case 'A057':{const value=(n,a,b,c)=>n>=c?4:n>=b?3:n>=a?2:0;food(value(p.sheep,1,3,4)+value(p.cattle,1,2,3));break;}
        case 'A069':this.schedule(p,id,[4,7,9],{veg:1});break;
        case 'A086':offer([{gain:{wood:1}},{gain:{grain:1}}],false);break;
        case 'A089':this.schedule(p,id,[3,6,9],{_stable:1});break;
        case 'A096':gain({wood:1});ask('minor');break;
        case 'A102':s.goods=['wood','grain','reed','stone','veg','clay','reed','veg'];break;
        case 'A112':case 'B160':gain({grain:1});break;
        case 'A117':gain({wood:p.played.improvements.length+p.majors.length});break;
        case 'A125':if(rooms===2&&p.houseMaterial==='clay')gain({clay:3,reed:2,stone:2});break;
        case 'A134':gain({wood:1,clay:1});break;
        case 'A135':case 'A136':case 'B136':gain({wood:[1,3,6,9].filter(x=>14-r>=x).length});break;
        case 'A139':ask('major',{allowed:['fireplace2','fireplace3']});break;
        case 'A144':s.reed=true;s.clay=true;break;
        case 'B001':gain({clay:5});ask('renovate');break;
        case 'B002':ask('pasture',{free:true});break;
        case 'B003':{const card=p.hand.occupations[Math.floor(Math.random()*p.hand.occupations.length)];if(card)offer([...(this.api.requirement(p,this.api.card(card))?[{label:`支付 2 食物，打出${this.api.card(card).name}`,cost:{food:2},next:[{type:'occupation',allowed:[card],free:true,optional:false}]}]:[]),{label:`传给下一位玩家：${this.api.card(card).name}`,state:{passOccupation:card},passOccupation:card}],false);break;}
        case 'B004':gain({wood:this.stats(p).actions.filter(a=>a.kind==='pile').length});break;
        case 'B005':gain({[p.hand.occupations.length<=4?'stone':p.hand.occupations.length===5?'reed':p.hand.occupations.length===6?'clay':'wood']:1});break;
        case 'B006':gain({stone:p.family});break;
        case 'B007':food(2+p.majors.filter(id=>['wellMajor','joinery','pottery','basketmaker'].includes(id)).length);break;
        case 'B008':gain({veg:1});break;
        case 'B009':offer([{gain:{reed:1}},{cost:{reed:1},gain:{cattle:1}}],false);break;
        case 'B014':this.schedule(p,id,[12-r],{_stoneRoom:1});break;
        case 'B016':case 'B025':case 'B037':case 'B058':food(1);break;
        case 'B018':this.schedule(p,id,[MATERIALS.reduce((n,k)=>n+p[k],0)],{_plow:1});break;
        case 'B020':this.schedule(p,id,[7,8,9],{_plow:1});break;
        case 'B021':s.food=4;break;
        case 'B022':food(2);this.g.workerQuota[this.seat(p)]++;break;
        case 'B033':this.bonus(p,id,14-r);break;
        case 'B041':offer([{label:'下一轮先领 2 木材',schedule:[{offsets:[1,3],goods:{wood:2}},{offsets:[2,4],goods:{boar:1}}]},{label:'下一轮先领 1 野猪',schedule:[{offsets:[1,3],goods:{boar:1}},{offsets:[2,4],goods:{wood:2}}]}],false);break;
        case 'B044':this.schedule(p,id,[3,4],{food:2});break;
        case 'B046':this.schedule(p,id,[1,2,3,4],{food:1});this.schedule(p,id,[5],{stone:1});break;
        case 'B048':s.food=2;break;
        case 'B052':food(r);break;
        case 'B054':food(2);break;
        case 'B055':s.food=3;break;
        case 'B059':food(e.action==='major'?4:2);break;
        case 'B065':this.schedule(p,id,Array.from({length:e.cost?.stone?4:e.cost?.clay?3:2},(_,i)=>i+1),{grain:1});break;
        case 'B066':this.schedule(p,id,[5,8,11,14].filter(n=>n>r).map(n=>n-r),{grain:1});break;
        case 'B068':case 'B113':case 'B141':p.cardFields ||= [];p.cardFields.push({type:'field',crop:null,qty:0,only:id==='B068'?'veg':null,card:id});if(id==='B113')offer([{cost:{food:1},gain:{grain:1}},{cost:{food:3},gain:{veg:1}}]);if(id==='B141')offer([{gain:{grain:1}},{cost:{clay:1},gain:{grain:2}},{cost:{clay:3},gain:{grain:3}}],false);break;
        case 'B071':if(HARVESTS.filter(n=>n<r).length===p.played.occupations.length)gain({food:1,grain:1,veg:1});break;
        case 'B073':if(rooms>=2&&rooms<=5)gain({[({2:'veg',3:'food',4:'grain',5:'veg'})[rooms]]:1});break;
        case 'B074':this.schedule(p,id,Array.from({length:14-r},(_,i)=>r+i+1).filter(n=>n%2===0).map(n=>n-r),{wood:1});break;
        case 'B076':this.schedule(p,id,[1,2,3,4,5],{wood:1});break;
        case 'B078':this.schedule(p,id,[5,8,10,12].filter(n=>n>r).map(n=>n-r),{reed:1});break;
        case 'B083':s.goods=['sheep','food','cattle','food','boar'];break;
        case 'B084':this.schedule(p,id,[1,2],{boar:1});break;
        case 'B088':if(rooms===2)ask('renovate',{free:true,thenPasture:true});break;
        case 'B089':case 'B116':case 'B117':gain({wood:1});break;
        case 'B093':offer([2,3,4].map(n=>({cost:{food:n},label:`存 ${n} 食物，接下来 ${n} 轮领回并获得播种或围栏行动`,schedule:[{offsets:Array.from({length:n},(_,i)=>i+1),goods:{food:1,_sowFence:1}}]})));break;
        case 'B096':this.schedule(p,id,Array.from({length:14-r},(_,i)=>r+i+1).filter(n=>n%2).slice(0,2).map(n=>n-r),{wood:1,_minor:1});break;
        case 'B102':gain(this.g.players.length===1?{grain:2}:this.g.players.length===2?{clay:3}:this.g.players.length===3?{reed:2}:{sheep:2});break;
        case 'B103':case 'B155':gain({wood:1,reed:1});break;
        case 'B105':gain(Object.fromEntries(['food','grain','veg','reed','wood'].filter(k=>p[k]>=2).map(k=>[k,1])));break;
        case 'B119':gain({wood:1});this.schedule(p,id,Array.from({length:this.fenceCount(p)},(_,i)=>i+1),{wood:1});break;
        case 'B123':offer([{cost:{food:1},gain:{stone:rooms}}]);break;
        case 'B125':MATERIALS.forEach((k,i)=>this.schedule(p,id,[i+1],{[k]:1}));break;
        case 'B127':if(r>=5)ask('grow',{noRoom:true,cost:{stone:1,grain:1,veg:1,sheep:1}});break;
        case 'B138':gain({wood:2});break;
        case 'B148':gain({sheep:1});break;
        case 'B149':if(this.stables(p)+(p.removedStables||0)<=1)ask('pasture',{size:2,cost:{wood:2},removeStables:3});break;
        case 'B151':gain({stone:1});break;
        case 'B164':this.schedule(p,id,[2,5,8,10],{sheep:1});break;
        case 'B167':if(ANIMALS.slice(0,3).every(k=>p[k]+1<=this.api.capacity(p,k)))offer([{cost:{food:2},gain:{sheep:1,boar:1,cattle:1}}]);break;
      }
    }
    fire(type,seat,e={}) {
      const player=this.p(seat);if(!player)return;
      if(type==='play')this.onPlay(player,e.id,e);
      for(let i=0;i<this.g.players.length;i++){
        const p=this.p(i),own=i===seat,ids=this.owns(p).slice();
        for(const id of ids)this.trigger(p,id,type,own,e,seat);
      }
      if(['play','renovate'].includes(type))for(const p of this.g.players)this.transitions(p);
      if(['play','milestone','gain','pasture','plow','room'].includes(type))this.milestones();
    }
    transitions(p) {
      const h=id=>this.has(p,id);
      if(p.houseMaterial!=='wood'){
        if(h('A045'))this.once(p,'A045','started',()=>this.schedule(p,'A045',[1,2,3,4,5,6],{food:1}));
        if(h('A120'))this.once(p,'A120','started',()=>this.schedule(p,'A120',[1,2,3,4,5],{clay:2}));
      }
      if(p.houseMaterial==='stone'&&h('B107'))this.once(p,'B107','started',()=>this.schedule(p,'B107',Array.from({length:14-this.g.round},(_,i)=>i+1),{food:3}));
    }
    milestones() {
      for(const p of this.g.players){const h=id=>this.has(p,id);
        if(h('A153')&&p.boar>=5)this.once(p,'A153','awarded',()=>this.bonus(p,'A153',3));
        if(h('B154')&&p.sheep>=7)this.once(p,'B154','awarded',()=>{this.bonus(p,'B154',3);this.gain(p,'B154',{food:2});});
        if(h('B035')&&p.sheep>=([9,8,7,6,5,5][this.g.players.length-1]||5))this.once(p,'B035','awarded',()=>this.bonus(p,'B035',2));
        if(h('B163')&&this.rooms(p)===2&&this.g.players.filter(q=>this.rooms(q)===2).length===1)this.once(p,'B163','awarded',()=>this.gain(p,'B163',{wood:3,clay:2,reed:1,stone:1}));
        if(h('A144')){const s=this.state(p,'A144');for(const q of this.g.players){if(s.reed&&this.pastures(q).length>=3){s.reed=false;this.gain(q,'A144',{reed:3});}if(s.clay&&this.fields(q).length>=5){s.clay=false;this.gain(q,'A144',{clay:4});}}}
      }
    }
    trigger(p,id,type,own,e,actor) {
      const s=this.state(p,id),r=this.g.round,a=e.action||{},key=a.key,pile=e.pile||0,before=e.before||{},stats=this.stats(p);
      const is=(...names)=>names.includes(a.id),wood=a.kind==='pile'&&key==='wood',clay=a.kind==='pile'&&key==='clay',stone=a.kind==='pile'&&key==='stone',animal=a.kind==='pile'&&ANIMALS.includes(key),foodPile=a.kind==='pile'&&key==='food';
      const gain=goods=>this.gain(p,id,goods),ask=(kind,args={},optional=true)=>this.ask(p,id,kind,args,optional),offer=(offers,optional=true)=>this.offer(p,id,offers,optional);
      const exchange=(cost,gain,other={})=>offer([{cost,gain,...other}]);
      const back=(n,goods,next=[])=>exchange({[key]:n},goods,{putBack:{action:a.id,n},next});
      if(type==='endAction'&&own){
        if(id==='A073'&&this.empty({ ...p,farm:e.before.farm }).length-this.empty(p).length>=2)ask('sow',{count:15});
        if(id==='A167'&&this.rooms(p)>this.rooms(e.before)&&this.stables(p)>this.stables(e.before))gain({[({wood:'sheep',clay:'boar',stone:'cattle'})[p.houseMaterial]]:1});
        if(id==='A040'&&s.cells){const used=s.cells.filter(i=>p.farm[i].type!=='empty');s.cells=s.cells.filter(i=>p.farm[i].type==='empty');for(const i of used)offer([{gain:{clay:1}},{gain:{food:2}}],false);}
      }
      if(type==='beforeAction'&&own){


        if(id==='A124'&&a.roundSlot>=5&&a.roundSlot<=7)gain({stone:1});
        if(id==='A126'&&a.roundSlot>=1&&a.roundSlot<=4)gain({[MATERIALS[a.roundSlot-1]]:1});
        if(id==='B094'&&is('pasture'))gain({wood:2});
        if(id==='B120'&&a.roundSlot===r-1)gain({clay:2});
        if(id==='B063'&&is('lessons'))offer([{cost:{grain:1},gain:{food:4}}],p.food>=(p.played.occupations.length?2:1)||this.has(p,'A028')||this.has(p,'B155'));
        if(id==='B109'&&is('lessons'))offer([{cost:{wood:1},gain:{food:p.played.occupations.length}}],p.food>=(p.played.occupations.length?2:1)||this.has(p,'A028')||this.has(p,'B155'));
      }
      if(type==='beforeAction'&&!own&&id==='B138'&&wood&&pile>=5&&this.p(actor).food>0){this.p(actor).food--;gain({food:1});}
      if(type==='action'){
        if(own){
          const direct={
            A042:is('fish')?{wood:1}:is('wood')?{food:1}:null,
            A051:is('fish')?{food:2}:null,A052:wood&&(this.g.piles.boar||0)>0?{food:2}:null,
            A066:animal&&(before[key]||0)>0?{grain:1}:null,A067:is('grain')?{grain:1}:null,
            A078:is('fish')?{food:1,reed:1}:null,A080:stone?{stone:1}:null,
            A103:foodPile?{[pile===1?'veg':pile===2?'grain':'reed']:1}:null,
            A107:a.kind==='pile'&&MATERIALS.includes(key)&&pile===6-e.workerOrder&&e.workerOrder<=3?{food:1}:null,
            A116:wood?{wood:1}:null,A119:is('plow','grain','sow','plowSow')?{wood:1}:null,
            A121:is('lessons','clay')?{clay:1}:null,A122:is('sow')?{clay:2,wood:1}:null,
            A139:is('hollow')?{food:1}:null,A140:is('clay','hollow')?{food:this.g.piles[a.id==='clay'?'hollow':'clay']||0}:null,
            A146:foodPile&&pile>=2&&pile<=5?{[({2:'stone',3:'reed',4:'clay',5:'wood'})[pile]]:1}:null,
            A155:is('travelers')?{wood:1,grain:1}:null,
            A161:a.kind==='pile'&&stats.actions.slice(0,-1).some(x=>x.kind==='pile'&&x.key===key&&x.id!==a.id)?{veg:1}:null,
            A163:is('market')?{[MATERIALS[Math.min(3,e.workerOrder-1)]]:1}:null,
            B040:is('fish','reed')?{grain:1,wood:1}:null,B051:clay?{food:p.boar}:null,
            B056:is('wood','clay','reed','day')?{food:1}:null,B062:is('grain')&&'plow'in this.g.occupied?{food:3}:null,
            B064:is('sow')&&'fish'in this.g.occupied?{food:2}:null,B077:is('day')?{clay:3}:null,
            B112:a.roundSlot===HARVESTS.filter(n=>n<r).at(-1)?{grain:1}:null,
            B121:is('wood','reed')||this.g.players.length>=3&&is('clay')?{clay:1}:null,
            B122:clay?{stone:1}:stone?{clay:1}:null,B142:is('grain')?{veg:1}:null,
            B144:is('clay')?{wood:1,reed:1}:is('hollow')?{wood:1}:null,
            B161:e.hasLargePile&&pile<5?{veg:1}:null,B162:wood&&[2,3,4].includes(pile)?{wood:1,food:pile===3?0:1}:null
          };
          if(direct[id])gain(direct[id]);
          if(id==='A015'&&wood&&p.wood>=7)ask('stable',{cost:{wood:1}});
          if(id==='A017'&&animal&&!s.used&&(p[key]||0)>=(before[key]||0)+pile){s.used=true;ask('plow');}
          if(id==='A018'&&is('plow','plowSow')&&e.workerOrder===1&&!s.used){s.used=true;ask('plow',{count:2});}
          if(id==='A021'&&is('room')&&this.rooms({farm:before.farm||[]})>(before.family||0)){gain({food:1});ask('grow');}
          if(id==='A023'&&stone)ask('develop',{needStone:true});
          if(id==='A024'&&is('plow','plowSow'))ask('bake');
          if(id==='A046'&&is('sheep'))this.schedule(p,id,[1,2],{food:1});
          if(id==='A056'&&wood)back(2,{food:3});
          if(id==='A072'&&stone)for(const field of this.fields(p))if(field.crop&&!field.underCrop)field.qty++;
          if(id==='A081'&&['clay','reed','stone'].includes(key)){s.stored ||= {};const res=({clay:'wood',reed:'clay',stone:'reed'})[key];s.stored[res]=(s.stored[res]||0)+1;}
          if(id==='A082')ask('takePile',{min:4});
          if(id==='A091'&&wood)ask('plow',{cost:{food:3}});
          if(id==='A095'&&is('fish')&&pile<=2)ask('develop');
          if(id==='A108'&&wood)back(1,{food:2});
          if(id==='A113'&&is('lessons'))for(const field of this.crops(p,'grain'))if(field.qty>=3&&!field.underCrop){field.underCrop='veg';field.underQty=1;this.log(p,id,'在谷物田底部放置 1 蔬菜');}
          if(id==='A114'&&is('day'))r<6?gain({grain:1}):offer([{gain:{grain:1}},{gain:{veg:1}}],false);
          if(id==='A115'&&wood)ask('sow',{restricted:true});
          if(id==='A129'&&is('room','grain')&&!e.extra)ask('repeat',{allowed:[a.id==='room'?'grain':'room'],occupied:true,sameWorker:true});
          if(id==='A137'&&is('sheep','reed')){const other=a.id==='sheep'?'reed':'sheep',k=other;if((this.g.piles[other]||0)>0)offer([{label:`从另一格取 1 ${LABELS[k]}`,take:{action:other,key:k,n:1}}]);}
          if(id==='A138'&&is('fish'))exchange({wood:1},{food:p.family,reed:1});
          if(id==='A147'&&animal)exchange({food:1},{[key]:1});
          if(id==='A149'&&is('travelers'))ask('room',{reedDiscount:1});
          if(id==='A164'&&wood)back(1,{sheep:1});
          if(id==='A168'&&is('lessons'))offer([{gain:{sheep:1}},{cost:{food:1},gain:{boar:1}},{cost:{food:2},gain:{cattle:1}}]);
          if(id==='B015'&&wood)ask('pasture',{discount:1,maxWood:pile});
          if(id==='B017'&&wood)back(2,{},[{type:'plow'}]);
          if(id==='B019'&&is('plow')&&(s.used||0)<2){s.used=(s.used||0)+1;ask('plow');}
          if(id==='B028'&&is('wood'))back(2,{},[{type:'occupation',free:true}]);
          if(id==='B034'&&animal&&!s.used&&p[key]>=(before[key]||0)+pile){s.used=true;this.bonus(p,id,pile);}
          if(id==='B043'&&is('grain','veg'))this.schedule(p,id,a.id==='grain'?[1,2,3]:[1,2],{food:1});
          if(id==='B047'&&is('fish'))this.schedule(p,id,[1,2,3],{food:1});
          if(id==='B048'){if(stone)s.food=(s.food||0)+2;if(wood&&s.food){s.food--;gain({food:1});}}
          if(id==='B055'&&wood&&s.food){s.food--;gain({food:1});}
          if(id==='B060'&&is('fish'))offer([{label:'付 1 谷物，接下来 6 轮各得 1 食物',cost:{grain:1},schedule:[{offsets:[1,2,3,4,5,6],goods:{food:1}}]}]);
          if(id==='B087'&&is('day'))offer([{label:'额外扩建一间房',next:[{type:'room'}]},{label:'额外翻修',next:[{type:'renovate'}]}]);
          if(id==='B090'&&is('plow')&&'grain'in this.g.occupied)ask('plow');
          if(id==='B091'&&is('day'))ask('plow');
          if(id==='B092'&&is('sheep')&&r>=5)ask('grow');
          if(id==='B024'&&!e.extra&&this.g.usedCount[this.seat(p)]<this.g.workerQuota[this.seat(p)])ask('repeat',{allowed:animal?null:['sheep','boar','cattle'],sameWorker:false});
          if(id==='B094'&&is('pasture')&&this.g.usedCount[this.seat(p)]<this.g.workerQuota[this.seat(p)])this.g.forcedNextSeat=this.seat(p);
          if(id==='B108'&&wood)ask('bake');
          if(id==='B128'&&is('major'))ask('renovate',{discount:2});
          if(id==='B130'&&is('sow','pasture')&&!e.extra)ask('repeat',{allowed:[a.id==='sow'?'pasture':'sow'],cost:{food:1},sameWorker:true});
          if(id==='B131'&&wood)ask('minor');
          if(id==='B137'&&a.roundSlot>=8&&a.roundSlot<=11){const k=['veg','boar','stone','cattle'][a.roundSlot-8];s.claimed ||= [];if(!s.claimed.includes(k)){s.claimed.push(k);gain({[k]:1});}}
          if(id==='B146'&&a.kind==='pile'&&MATERIALS.includes(key))ask('discard',{gain:{[key]:1}});
          if(id==='B147'&&wood)exchange({grain:1},{boar:1});
          if(id==='B150'&&is('room','major')&&!e.extra)ask('repeat',{allowed:[a.id==='room'?'major':'room'],cost:{food:1},sameWorker:true});
          if(id==='B152'&&is('day')&&!e.extra)ask('repeat',{allowed:['travelers','lessons'],cost:{food:1},sameWorker:true});
          if(id==='B156'&&is('market'))offer([{gain:{clay:1}},{gain:{grain:1}}],false);
          if(id==='B166'&&is('grain'))exchange({food:1},{cattle:1});
        }
        if(id==='A050'&&is('cattle')){gain({food:3});for(const q of this.g.players)if(q!==p)this.gain(q,id,{food:1});}
        if(id==='A077'&&is('boar'))gain({clay:2});
        if(id==='A142'&&is('reed')&&pile>=2)offer([{gain:{grain:1}},{cost:{food:2},gain:{veg:1}}]);
        if(id==='B079'&&stone&&pile>=3)gain({stone:1});
        if(!own){
          if(id==='A128'&&is('reed'))ask('room',{discount:p.houseMaterial==='clay'?1:p.houseMaterial==='stone'?2:0});
          if(id==='A150'&&is('travelers'))offer([{label:'建围栏',next:[{type:'pasture'}]},{label:'建马厩',next:[{type:'stable'}]},{label:'扩建房屋',next:[{type:'room'}]}]);
          if(id==='A154'&&foodPile)exchange({grain:1},{},{bonus:1,transfer:{seat:actor,goods:{grain:1}}});
          if(id==='A156'&&a.kind==='pile'&&['reed','stone','sheep','boar'].includes(key))exchange({food:1},{[key]:1},{transfer:{seat:actor,goods:{food:1}}});
          if(id==='A158'&&is('travelers'))offer([{cost:{grain:1},gain:{food:4}},{cost:{sheep:1},gain:{food:5}},{cost:{veg:1},gain:{food:7}}]);
          if(id==='A159'&&is('fish','reed'))exchange({wood:1},{food:a.id==='fish'?2:3},{transfer:{seat:actor,goods:{wood:1}}});
          if(id==='A160'&&is('travelers')){gain({food:1,wood:1});exchange({food:2},{veg:1});}
          if(id==='B143'&&is('hollow'))gain({clay:this.g.players.length===3?2:1,food:this.g.players.length===4?1:0});
        }
      }
      if(type==='plow'){
        if(own&&id==='A105')gain({clay:(e.cells||[0]).length,food:(e.cells||[0]).length});
        if(!own&&id==='B159'&&(e.cells||[]).some(i=>(e.before||[]).some((c,j)=>c.type==='field'&&this.adjacent(i,j))))gain({[r===14?'grain':'food']:(e.cells||[0]).length});
      }
      if(type==='room'&&own){
        if(id==='A093')ask('grow',{cost:{wood:1,grain:1}});
        if(id==='A110'&&e.material==='clay')gain({food:3});
        if(id==='A111')this.schedule(p,id,[1,2,3,4],{food:1});
        if(id==='B111'&&e.material==='clay'){gain({food:(e.count||1)*2});this.bonus(p,id,e.count||1);}
      }
      if(['room','stable','pasture'].includes(type)&&own&&id==='B027')ask('major',{allowed:['joinery','pottery','basketmaker']});
      if(type==='pasture'&&own){
        if(id==='A034'&&this.fenceCount(p)<15)offer([{cost:{wood:1},gain:{food:2},bonus:1,removeFence:1}]);
        if(id==='A068'&&e.fences>=r)gain({veg:1});
        if(id==='A083'&&e.cells?.length>=4)gain({sheep:2});
        if(id==='B124'&&s.lastRound!==r){s.lastRound=r;gain({stone:2});}
      }
      if(type==='stable'&&own){if(id==='A043')this.schedule(p,id,[1,2,3],{food:1});if(id==='A074')this.schedule(p,id,[1,2,3],{wood:1});}
      if(type==='renovate'&&own){
        if(id==='A037')exchange({wood:1},{grain:1},{bonus:1});
        if(id==='A110'&&e.from==='clay'&&e.to==='stone')gain({food:3});
        if(id==='B016')ask('stable',{cost:{}});
        if(id==='B055')s.food=(s.food||0)+3;
        if(id==='B076')s.schedule=[];
        if(id==='B134'&&e.to==='stone'&&r<=13){const n=Math.min(3,14-r);gain({food:n});this.bonus(p,id,n);}
        if(id==='B168'){gain({food:2});for(const cells of this.pastures(p))if(cells.some(i=>p.farm[i].stable)){const k=p.farm[cells[0]].animal;if(p[k])gain({[k]:1});}}
      }
      if(type==='grow'&&own&&id==='A092')offer([{label:'付 1 食物，让新生儿当轮行动',cost:{food:1},quota:1,noNewborn:true}]);
      if(type==='occupation'&&own){if(id==='B025')ask('bake');if(id==='B049'&&p.played.occupations.length===p.played.improvements.length+p.majors.length)gain({food:2});}
      if(type==='improvement'&&own){
        if(id==='A041'&&e.returnedFireplace)gain({wood:2,veg:1});
        if(id==='A055')gain({food:1});
        if(id==='A109'&&!e.major&&['major','develop'].includes(e.action||e.source))gain({food:3});
        if(id==='A131'&&['joinery','pottery','basketmaker'].includes(e.id))ask('occupation',{free:true,count:2});
        if(id==='B049'&&p.played.occupations.length===p.played.improvements.length+p.majors.length)gain({food:2});
      }
      if(type==='beforeSow'&&!own&&id==='A132'&&!e.restricted)exchange({grain:1},{},{bonus:1,transfer:{seat:actor,goods:{grain:1}}});
      if(type==='sow'){
        if(own&&id==='A079'&&!e.restricted&&e.crop==='veg')gain({clay:1,stone:1});
        if(own&&id==='B054'&&!e.restricted)gain({food:this.stables(p)});
      }
      if((type==='bake'||type==='cook')&&own&&id==='B029'&&stats.actions.at(-1)?.id==='lessons')this.once(p,id,`cooked${this.g.round}-${this.g.usedCount[this.seat(p)]}`,()=>this.bonus(p,id,1));
      if(type==='bake'&&own){
        if(id==='A030')exchange({grain:1},{food:2},{bonus:1});
        if(id==='A063'&&HARVESTS.includes(r-1))gain({food:3});
      }
      if(type==='gain'&&own){
        if(id==='A048'&&e.goods.wood&&p.wood>=5)offer([{cost:{wood:1},gain:{food:3}}],p.wood<7);
        if(id==='B021'&&e.goods.grain&&s.food>0){s.food--;gain({food:1});if(!s.food)ask('grow',{noRoom:true});}
      }
      if(type==='start'&&own){
        const due=(s.schedule||[]).filter(x=>x.round===r);s.schedule=(s.schedule||[]).filter(x=>x.round>r);
        for(const entry of due){const ordinary=Object.fromEntries(Object.entries(entry.goods).filter(([k])=>!k.startsWith('_')));if(Object.keys(ordinary).length)gain(ordinary);const g=entry.goods;
          if(g._plow)ask('plow');if(g._stable)ask('stable',{cost:{}});if(g._worker)this.g.workerQuota[this.seat(p)]++;
          if(g._stoneRoom&&p.houseMaterial==='stone')ask('room',{free:true});if(g._minor)ask('minor');
          if(g._sowFence)offer([{label:'播种',next:[{type:'sow',count:15}]},{label:'建围栏',next:[{type:'pasture'}]}]);
        }
        if(id==='A049'&&(e.oldPiles?.reed||0)>0)gain({food:1});
        if(id==='A076'&&p.clay>0)exchange({grain:1},{clay:2,food:1});
        if(id==='A081'&&[7,11,14].includes(r)&&s.stored){gain(s.stored);s.stored={};}
        if(id==='A090'&&p.houseMaterial==='stone')ask('plow',{cost:{food:1}});
        if(id==='A096'&&this.api.actions().some(a=>a.key==='stone'&&a.unlock===r)){gain({wood:1});ask('minor');}
        if(id==='B057'&&p.houseMaterial==='wood')gain({food:1});
        if(id==='B070'&&HARVESTS.includes(r)){exchange({food:2},{grain:1});exchange({food:4},{veg:1});}
        if(id==='B081')ask('takePile',{thresholds:{wood:6,clay:5,reed:4,stone:4}});
        if(id==='B089'&&p.houseMaterial==='stone')ask('stable',{cost:{wood:1}});
        if(id==='B097'&&p.houseMaterial==='stone')offer([{label:'付 1 食物打职业',next:[{type:'occupation',fee:1}]},{label:'打出次要发展',next:[{type:'minor'}]}]);
        if(id==='B106'&&Object.values(p.rules||{}).some(st=>st.schedule?.some(x=>x.round>=r)))gain({food:1});
        if(id==='B110'&&p.stone>0)gain({[r===14?'veg':'food']:1});
        if(id==='B114'&&this.rooms(p)>=3&&p.family===2){gain({food:1});offer([{gain:{grain:1}},{gain:{veg:1}}],false);}
        if(id==='B116'&&!(e.oldPiles?.reed))gain({wood:1});
        if(id==='B118'&&this.rooms(p)===2)gain({wood:1});
        if(id==='B135')offer(ANIMALS.slice(0,3).map(k=>({cost:{[k]:1,grain:1,veg:1},gain:{food:5},bonus:2})));
      }
      if(type==='end'&&own){
        if(id==='A029')exchange({grain:1},{},{bonus:1,allOpponents:{food:1}});
        if(id==='A035'&&this.g.occupied.fish===this.seat(p))this.bonus(p,id,stats.newborn*2);
        if(id==='A053'&&stats.materials>=7)gain({food:2});
        if(id==='A054'&&!HARVESTS.includes(r)){if(p.food)p.food--;else p.begging++;}
        if(id==='A058'&&[8,10,12].includes(r))ask('crop',{crop:'veg',sellOption:true});
        if(id==='A070'&&!HARVESTS.includes(r))ask('crop',{crop:'veg'});
        if(id==='A084'&&!HARVESTS.includes(r))offer(ANIMALS.slice(0,3).filter(k=>p[k]>=2&&p[k]<this.api.capacity(p,k)).map(k=>({cost:{grain:1},gain:{[k]:1}})));
        if(id==='A100'&&stats.actions.filter(a=>a.kind==='pile').length>=3)exchange({food:1},{},{bonus:1});
        if(id==='A127'&&r===9&&p.family>this.housing(p)-1){p.family--;this.log(p,id,'临时住房到期，无法安置的家人离开');}
        if(id==='A141'&&'day'in this.g.occupied&&'grain'in this.g.occupied)gain({veg:1});
        if(id==='A151'){const empty=this.api.actions().filter(a=>a.roundSlot>=1&&a.roundSlot<=4&&!(a.id in this.g.occupied));if(empty.length===1)ask('repeat',{allowed:[empty[0].id],sameWorker:true});}
        if(id==='A152'&&!('lessons'in this.g.occupied))ask('occupation',{fee:1});
        if(id==='A157'&&!('lessons'in this.g.occupied))gain({food:1});
        if(id==='A165'&&r===12&&p.boar>=2&&p.boar<this.api.capacity(p,'boar'))gain({boar:1});
        if(id==='B053'&&!HARVESTS.includes(r))offer([{cost:{wood:1},gain:{food:2}},{cost:{stone:1},gain:{food:4}}]);
        if(id==='B117'&&p.stone>p.clay)gain({wood:1});
        if(id==='B139'&&!this.api.actions().some(a=>a.key==='wood'&&(this.g.piles[a.id]||0)>0))gain({food:r>=5?2:1});
        if(id==='B140'&&stats.placedGoods)gain({food:2});
        if(id==='B158'&&stats.actions.some(a=>a.id==='wood')&&stats.actions.some(a=>a.id==='copse'))gain({food:5});
        if(id==='B160'&&['wood','clay','reed'].every(a=>a in this.g.occupied))gain({grain:1});
      }
      if(type==='harvestBefore'&&own){
        if(id==='A112'){s.extraFields=[];ask('harvestExtra');}
        if(id==='A166')exchange({food:Math.max(0,4-this.pastures(p).length)},{cattle:1});
        if(id==='B165'){const fields=this.crops(p,'grain');offer([1,3,4].filter(n=>fields.length>=n).map(n=>({label:`从 ${n} 块谷物田各弃 1 谷物，得 ${n===1?1:n===3?2:3} 野猪`,takeFieldGrain:n,gain:{boar:n===1?1:n===3?2:3}})));}
        if(id==='B061'&&this.crops(p,'grain').length&&this.crops(p,'veg').length&&this.fields(p).some(c=>!c.crop))gain({food:3});
      }
      if(type==='fields'&&own){
        if(id==='A064')gain({food:e.grainFields||0});
        if(id==='A104')for(const a of this.api.actions().filter(a=>a.key==='wood')){const n=this.g.piles[a.id]||0;if(n===2)gain({wood:1});else if(n>=3)gain({food:1});}
        if(id==='A106')gain({food:(e.lastGrain||0)*2+(e.lastVeg||0)});
        if(id==='A118'){gain({wood:1});offer([{cost:{food:1},gain:{wood:1}},{cost:{food:2},gain:{wood:2}}]);}
        if(id==='A059'&&(e.veg||0)>0&&p.veg>=3)offer([{cost:{veg:1},gain:{food:6}}],p.veg<4);
        if(id==='A061')ask('bake',{max:1,noBakeEvent:true});
        if(id==='B039')gain({food:p.sheep>=7?3:p.sheep>=4?2:p.sheep>=1?1:0});
        if(id==='B050')gain({food:Math.floor(p.sheep/3)+Math.floor(p.cattle/2)});
        if(id==='B058')gain({food:e.veg||0});
        if(id==='B132'&&!this.empty(p).length)this.bonus(p,id,e.veg||0);
      }
      if(type==='feed'&&own){
        if(id==='A062')offer([1,2,3].map(n=>({cost:{grain:n},gain:{food:3},bonus:n-1})));
        if(id==='B101'&&this.g.players.some(q=>q.majors.includes('joinery')))exchange({food:2},{},{bonus:1});
      }
      if(type==='harvestAfter'&&own){
        if(id==='A145')gain({reed:1});
        if(id==='B082')offer(MATERIALS.map(k=>({cost:{food:['wood','clay'].includes(k)?1:2},gain:{[k]:1}})));
      }
    }
    coreAction(p,a) {
      const id=a.ruleOp;
      if(id==='room'){this.ask(p,'房屋扩建','room',{batch:true});this.ask(p,'房屋扩建','stable',{count:4});}
      if(id==='pasture')this.ask(p,'围栏行动','pasture');
      if(id==='sow'){
        if(this.has(p,'B026'))this.offer(p,'B026',[{label:'播种',next:[{type:'sow',count:15}]},{label:'用播种行动换建围栏',next:[{type:'pasture'}]}]);else this.ask(p,'播种行动','sow',{count:20});
        this.ask(p,'烤面包行动','bake');
      }
      if(id==='major')this.ask(p,'主要发展行动','develop');
      if(id==='renovate')this.ask(p,'翻修行动','renovate',{thenDevelop:true});
      if(id==='renovateFence')this.ask(p,'翻修围栏','renovate',{thenPasture:true});
      if(id==='growNoRoom')this.ask(p,'紧急扩员','grow',{noRoom:true},false);
      if(id==='plowSow'){this.ask(p,'耕作','plow');this.ask(p,'耕作','sow',{count:15});}
    }
    canCore(p,a) {
      if(a.ruleOp==='pasture')return this.options({type:'pasture',seat:this.seat(p),size:1,optional:false}).length>0;
      if(a.owner!==undefined&&a.ruleOp&&a.owner!==this.seat(p))return false;
      const types=({room:['room','stable'],pasture:['pasture'],sow:['sow','bake'],major:['develop'],renovate:['renovate'],renovateFence:['renovate'],growNoRoom:['grow'],plowSow:['plow','sow']})[a.ruleOp];
      return !types||types.some(type=>this.options({type,seat:this.seat(p),batch:type==='room',noRoom:a.ruleOp==='growNoRoom',card:'',optional:false}).length)||a.ruleOp==='sow'&&this.has(p,'A065')&&this.fields(p).some(c=>!c.crop);
    }

    abilities(p) {
      const out=[];
      for(const id of this.owns(p)){
        let offers=[],type='offer',args={};const s=this.state(p,id);
        if(id==='A102'&&s.goods?.length)offers=[{cost:{food:1},gain:{[s.goods[0]]:1},shiftGood:true}];
        if(id==='B083'&&s.goods?.length)offers=[{cost:{clay:1},gain:{[s.goods[0]]:1},shiftGood:true}];
        if(id==='A071'){type='moveCrop';}
        if(id==='B032')offers=[1,3,5].map((n,i)=>({cost:{grain:n},gain:{food:i+3},bonus:i}));
        if(id==='B069')offers=[{label:'付 4 黏土、2 食物，接下来两轮各得 1 蔬菜',cost:{clay:4,food:2},schedule:[{offsets:[1,2],goods:{veg:1}}]}];
        if(id==='B080')offers=[2,3,4].map(n=>({cost:{clay:n},gain:{stone:n-1}}));
        if(id==='B104')offers=['boar','veg','stone'].map(k=>({cost:{sheep:1},gain:{[k]:1}}));
        if(id==='B157')offers=['sheep','boar','cattle'].map((k,i)=>({label:`盐渍 1 ${LABELS[k]}，接下来 ${[3,5,7][i]} 轮每轮得 1 食物`,cost:{[k]:1},schedule:[{offsets:Array.from({length:[3,5,7][i]},(_,j)=>j+1),goods:{food:1}}]}));
        if(id==='A060')offers=['veg','sheep','cattle'].map(k=>({cost:{[k]:1},gain:{food:({veg:4,sheep:3,cattle:5})[k]},cooking:true}));
        const t={seat:this.seat(p),card:id,type,offers,...args,optional:true};if(this.options(t).some(o=>o.value!=='skip'))out.push(t);
      }
      return out;
    }
    aiOption(t){if(!t)return null;const options=t.options;const chosen=options.find(o=>o.finishSelection)||options.find(o=>o.cells||o.cardId||o.major||o.oven||o.gain)||options.find(o=>o.selectCell!==undefined)||options.find(o=>o.value==='skip')||options[0];return chosen?.value;}
    activate(seat,id) {if(this.queue.length||this.g.turn!==seat||this.g.phase!=='play')return '请在自己的回合使用卡牌。';const t=this.abilities(this.p(seat)).find(t=>t.card===id);if(!t)return '卡牌效果当前不可用。';this.add(t);this.drain();}
    canOccupy(p,a) {
      if(!(a.id in this.g.occupied)||a.repeatable)return true;
      if(this.has(p,'A028')&&a.id==='lessons')return true;
      if(this.has(p,'B151')&&this.rooms(p)===2&&p.houseMaterial==='wood'&&a.id!=='first')return true;
      if(this.has(p,'A026')&&a.id==='grow'&&this.g.occupied[a.id]!==this.seat(p))return true;
      const actions=this.stats(p).actions;
      if(this.has(p,'A025')&&actions[0]?.id===a.id&&a.kind!=='pile'&&!this.state(p,'A025')[`used${this.g.round}`])return true;
      if(this.has(p,'A130')&&this.g.usedCount[this.seat(p)]>=2&&actions[1]?.id===a.id&&!this.state(p,'A130')[`used${this.g.round}`])return true;
      if(this.has(p,'B129')&&a.roundSlot===13){const n=this.g.players.length,owner=this.g.occupied[a.id];return owner===(this.seat(p)+1)%n||owner===(this.seat(p)+n-1)%n;}
      return false;
    }
    publicActions() {
      const result=[];
      for(let i=0;i<this.g.players.length;i++){const p=this.p(i);
        if(this.has(p,'B023')&&this.g.round<14)result.push({id:`finalScenario${i}`,name:'提前翻修围栏',icon:'🏠',detail:'最终情景持有者专属：翻修后围栏',unlock:1,kind:'simple',ruleOp:'renovateFence',owner:i});
        if(this.has(p,'A039'))result.push({id:`chapel${i}`,name:'小教堂',icon:'⛪',detail:'获得 3 奖励分；对手须先付持有者 1 谷物',unlock:1,kind:'simple',rulePublic:'A039',owner:i});
        if(this.has(p,'B042'))result.push({id:`forestInn${i}`,name:'森林旅店',icon:'🌲',detail:'交换木材与食物；对手须先付持有者 1 食物',unlock:1,kind:'simple',rulePublic:'B042',owner:i});
        if(this.has(p,'A162')&&'wood'in this.g.occupied&&'clay'in this.g.occupied)result.push({id:`forestGap${i}`,name:'森林记账处',icon:'📒',detail:'持有者行动：获得 3 木材、2 黏土',unlock:1,kind:'simple',rulePublic:'A162',owner:i});
      }
      return result;
    }
    afterAction(seat,a,option,before,context={}) {
      const p=this.p(seat),stats=this.stats(p),pile=context.pile||0;
      stats.actions.push({id:a.id,key:a.key,kind:a.kind});if(a.kind==='pile'&&MATERIALS.includes(a.key))stats.materials+=pile;
      if(before.grain<p.grain||before.veg<p.veg)this.event('gain',seat,{goods:{grain:Math.max(0,p.grain-before.grain),veg:Math.max(0,p.veg-before.veg)},source:a.id});
      if(a.kind==='pile')this.event('gain',seat,{goods:{[a.key]:pile},source:a.id});
      const newFields=p.farm.flatMap((c,i)=>c.type==='field'&&before.farm[i].type!=='field'?[i]:[]);
      const newRooms=p.farm.flatMap((c,i)=>c.type==='house'&&before.farm[i].type!=='house'?[i]:[]);
      const newPastures=p.farm.flatMap((c,i)=>c.type==='pasture'&&before.farm[i].type!=='pasture'?[i]:[]);
      if(newFields.length)this.event('plow',seat,{cells:newFields,before:before.farm});
      if(newRooms.length)this.event('room',seat,{count:newRooms.length,material:p.houseMaterial,before:before.farm});
      if(newPastures.length){p.fences=(before.fences||0)+newPastures.length*4;this.event('pasture',seat,{cells:newPastures,fences:newPastures.length*4,before:before.farm});}
      if(this.stables(p)>this.stables(before))this.event('stable',seat,{count:this.stables(p)-this.stables(before)});
      if(p.houseMaterial!==before.houseMaterial)this.event('renovate',seat,{from:before.houseMaterial,to:p.houseMaterial});
      if(p.family>before.family){stats.newborn+=p.family-before.family;this.event('grow',seat,{count:p.family-before.family});}
      if(['sow','seasonSpring'].includes(a.id)&&option.crop){stats.placedGoods=true;this.event('sow',seat,{crop:option.crop,restricted:a.id!=='sow'});}
      this.event('action',seat,{action:a,pile,before,workerOrder:this.g.usedCount[seat],hasLargePile:context.hasLargePile,extra:context.extra});
      this.event('endAction',seat,{before,action:a});
      this.event('milestone',seat);
      if(context.finish!==false)this.add({type:'continue',kind:'advance',seat});
    }
    begin(seat,a,option={},extra=false) {
      if(this.queue.length)return '先完成卡牌选择。';
      const occupied=a.id in this.g.occupied,p=this.p(seat);
      if(occupied&&this.has(p,'A025'))this.state(p,'A025')[`used${this.g.round}`]=true;
      if(occupied&&this.has(p,'A130'))this.state(p,'A130')[`used${this.g.round}`]=true;
      this.event('beforeAction',seat,{action:a,option,pile:this.g.piles[a.id]||0});
      this.add({type:'continue',kind:'base',seat,action:a,option,extra});this.drain();
    }
    roundStart(oldPiles) {for(let i=0;i<this.g.players.length;i++)this.event('start',i,{oldPiles});this.drain();}
    roundEnd() {for(let i=0;i<this.g.players.length;i++)this.event('end',i);this.add({type:'continue',kind:'roundEnd'});this.drain();}
    harvest() {for(let i=0;i<this.g.players.length;i++)this.event('harvestBefore',i);this.add({type:'continue',kind:'fields'});this.drain();}
    collectFields(p) {
      const summary={grainFields:0,vegFields:0,grain:0,veg:0,lastGrain:0,lastVeg:0};
      for(const [i,c] of this.fields(p).entries())if(c.crop&&c.qty>0){const crop=c.crop,n=Math.min(c.qty,crop==='grain'&&this.has(p,'A112')&&this.state(p,'A112').extraFields?.includes(i)?2:1);p[crop]+=n;summary[crop]+=n;summary[crop+'Fields']++;c.qty-=n;if(!c.qty){summary[crop==='grain'?'lastGrain':'lastVeg']++;c.crop=c.underCrop||null;c.qty=c.underQty||0;delete c.underCrop;delete c.underQty;}}
      this.event('fields',this.seat(p),summary);return summary.grain+summary.veg;
    }
    finalize() {for(const p of this.g.players)if(this.has(p,'B133'))this.once(p,'B133','final',()=>this.gain(p,'B133',{veg:Math.min(p.majors.length,p.played.improvements.length,p.played.occupations.length)}));this.drain();}
  }
  window.OriginalRules=OriginalRules;
})();
