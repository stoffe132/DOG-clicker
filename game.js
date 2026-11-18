(() => {
'use strict';
const $=id=>document.getElementById(id), SAVE='dogEmpire_v2', LEGACY='dogClickerUltimate_v1';
const fmt=v=>{let n;try{n=BigInt(v)}catch(_){n=0n}if(n<1000n)return n.toString();const u=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];let g=0,d=1n;while(n>=d*1000n&&g<u.length-1){d*=1000n;g++}return (n/d).toString()+(((n%d)*10n/d)>0n?'.'+((n%d)*10n/d):'')+u[g]};
const big=v=>{try{return BigInt(v||0)}catch(_){return 0n}}, clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const fresh=()=>({version:2,currency:'0',lifetime:'0',runEarned:'0',legacyClick:'0',legacyPassive:'0',legacyAuto:'0',clicks:0,level:1,prestige:0,stars:0,upgrades:{},generators:{},pets:{},perks:{},achievements:[],settings:{sound:true,reducedMotion:false},boostUntil:0,daily:{date:today(),clicks:0,purchases:0,earned:'0',claimed:[]},logs:[],last:Date.now(),playSeconds:0});
let s=fresh();
try{const raw=localStorage.getItem(SAVE)||localStorage.getItem(LEGACY);if(raw){const x=JSON.parse(raw);s={...s,...x};s.currency=String(x.currency??x.bones??'0');s.lifetime=String(x.lifetime??x.total??'0');s.runEarned=String(x.runEarned??x.total??'0');s.legacyClick=String(x.legacyClick??x.click??'0');s.legacyPassive=String(x.legacyPassive??x.passive??'0');s.legacyAuto=String(x.legacyAuto??x.auto??'0');s.upgrades={...(x.upgrades||{})};s.generators={...(x.generators||{})};s.pets={...(x.petOwned||{})};s.perks={...(x.perks||{})};s.settings={...s.settings,...(x.settings||{})};s.daily={...s.daily,...(x.daily||{})};if(s.daily.date!==today())s.daily={date:today(),clicks:0,purchases:0,earned:'0',claimed:[]};}}catch(e){console.warn('Save load',e)}
const U=[
{id:'tap',name:'Tass-träning',icon:'🐾',cat:'click',desc:'+2 grundkraft per klick och nivå.',base:30n,rate:1150,kind:'flat',power:2},
{id:'tapmult',name:'Superstuds',icon:'💪',cat:'click',desc:'+20% klickkraft per nivå.',base:250n,rate:1220,kind:'mult',power:1200},
{id:'gloves',name:'Guldhandskar',icon:'🧤',cat:'click',desc:'+10% klickkraft per nivå.',base:1800n,rate:1280,kind:'mult',power:1100},
{id:'auto',name:'Självklickande tass',icon:'🦾',cat:'automation',desc:'+1 automatiskt klick per sekund.',base:900n,rate:1320,kind:'auto',power:1},
{id:'automult',name:'Turbo-motor',icon:'⚡',cat:'automation',desc:'+15% styrka på automatiska klick.',base:6500n,rate:1280,kind:'multauto',power:1150},
{id:'kennel',name:'Kennelutbildning',icon:'🏡',cat:'income',desc:'+15% producentproduktion per nivå.',base:1200n,rate:1190,kind:'multprod',power:1150},
{id:'empire',name:'Hundimperiets strategi',icon:'🌐',cat:'income',desc:'+10% global styrka per nivå.',base:18000n,rate:1300,kind:'global',power:1100},
{id:'crit',name:'Prickskytte-nos',icon:'🎯',cat:'critical',desc:'+2 procentenheter kritisk chans.',base:3500n,rate:1370,kind:'crit',max:35},
{id:'critpower',name:'Skallattack',icon:'💥',cat:'critical',desc:'+0,5x kritisk skada per nivå.',base:7000n,rate:1350,kind:'critpower'},
{id:'luck',name:'Gyllene nos',icon:'✨',cat:'fortune',desc:'Gör gyllene hundar vanligare.',base:8000n,rate:1380,kind:'luck',max:100},
{id:'gold',name:'Guldfångare',icon:'🪙',cat:'fortune',desc:'+35% belöning från gyllene hundar.',base:14000n,rate:1390,kind:'gold'},
{id:'offline',name:'Drömmarnas hundvakt',icon:'🌙',cat:'utility',desc:'+5 procentenheter offline-inkomst.',base:9000n,rate:1360,kind:'offline',max:10},
{id:'coupon',name:'Ben-rabatt',icon:'🏷️',cat:'utility',desc:'-1% kostnad per nivå.',base:22000n,rate:1450,kind:'coupon',max:30},
{id:'quest',name:'Uppdragsproffs',icon:'📋',cat:'utility',desc:'+20% dagliga uppdragsbelöningar.',base:12000n,rate:1400,kind:'quest'},
{id:'bond',name:'Flockens band',icon:'❤️',cat:'income',desc:'Förstärker bonusen från husdjur.',base:45000n,rate:1500,kind:'bond'}
];
const G=[
['puppy','Valpkompis','🐶','En liten hjälpreda som samlar ben.',15n,1n,1150],
['walker','Hundrastare','🦮','Kommer hem med fickorna fulla.',120n,7n,1160],
['daycare','Hunddagis','🏫','Ett helt gäng jobbar tillsammans.',1250n,42n,1170],
['kennel','Superkennel','🏡','Professionell hundbensproduktion.',14000n,260n,1180],
['factory','Kexfabrik','🍪','Bakar hundgodis dygnet runt.',165000n,1700n,1190],
['robot','Hundrobot','🤖','En outtröttlig mekanisk arbetare.',2100000n,12500n,1200],
['planet','Hundplanet','🪐','En hel planet som producerar ben.',31000000n,98000n,1220],
['portal','Tassportal','🌀','Importerar ben från andra dimensioner.',500000000n,850000n,1250]
].map(a=>({id:a[0],name:a[1],icon:a[2],desc:a[3],base:a[4],output:a[5],rate:a[6]}));
const P=[
['retriever','Golden retriever','🐕','+3% total bonus per hund.',500n],
['corgi','Corgi','🐕‍🦺','Liten kropp, stor arbetsmoral.',1800n],
['husky','Husky','🐺','Drar upp tempot i flocken.',7000n],
['shiba','Shiba inu','🦊','Har känsla för guld.',25000n],
['pug','Mops','🐶','Håller koll även när du är borta.',100000n],
['samoyed','Samojed','☁️','Sprider energi i produktionen.',600000n],
['dachshund','Tax','🌭','En liten strateg med stor effekt.',4000000n],
['dragon','Drakhund','🐉','En mytisk vän från benriket.',50000000n]
].map(a=>({id:a[0],name:a[1],icon:a[2],desc:a[3],base:a[4]}));
const R=[
['star','Stjärntassar','🌟','+25% klickkraft per nivå.',1,25],
['factory','Fabriksfrö','🏭','+15% producentkraft per nivå.',2,25],
['start','Varm start','🎁','Starta med 1 000 extra hundben per nivå.',2,50],
['offline','Tidsmästare','⏳','+5 procentenheter offline-inkomst.',3,10],
['gold','Gyllene själ','✨','+25% gyllene belöning per nivå.',3,25],
['discount','Stjärnrabatt','🏷️','-1% kostnad per nivå.',4,25]
].map(a=>({id:a[0],name:a[1],icon:a[2],desc:a[3],base:a[4],max:a[5]}));
const A=[
['first','Första benet','Samla ditt första hundben.','🦴',()=>big(s.lifetime)>=1n],
['100','Valpstart','Samla 100 livstidsben.','🐾',()=>big(s.lifetime)>=100n],
['1000','Benburken','Samla 1 000 livstidsben.','🫙',()=>big(s.lifetime)>=1000n],
['million','Miljonben','Samla en miljon livstidsben.','💰',()=>big(s.lifetime)>=1000000n],
['click100','Klickmaskin','Klicka 100 gånger.','👆',()=>s.clicks>=100],
['click1000','Tassstorm','Klicka 1 000 gånger.','🌪️',()=>s.clicks>=1000],
['gen10','Liten fabrik','Äg 10 producenter.','⚙️',()=>totalGens()>=10],
['gen100','Industrimagnat','Äg 100 producenter.','🏭',()=>totalGens()>=100],
['up10','Förbättringsiver','Köp 10 uppgraderingsnivåer.','⬆️',()=>totalUps()>=10],
['pet1','Bästa vän','Skaffa din första kompis.','❤️',()=>totalPets()>=1],
['pet10','Hundflock','Samla 10 hundkompisar.','🐕',()=>totalPets()>=10],
['prestige1','Återfödd','Gör din första prestige.','✦',()=>s.prestige>=1],
['prestige5','Stjärnlegend','Gör fem prestigeomgångar.','🌌',()=>s.prestige>=5],
['billion','Benmiljardär','Samla en miljard livstidsben.','👑',()=>big(s.lifetime)>=1000000000n]
].map(a=>({id:a[0],name:a[1],desc:a[2],icon:a[3],test:a[4]}));
const categories=[['click','👆 Klickkraft'],['income','⚙️ Produktion'],['automation','🤖 Automatik'],['critical','💥 Kritiska träffar'],['fortune','🍀 Tur & guld'],['utility','🧰 Effektivitet']];
let currentCat='click',currentView='dashboard',goldenUntil=0,lastTick=Date.now(),lastSave=0;
function lv(id){return clamp(s.upgrades[id],0,1000000)}
function gc(id){return clamp(s.generators[id],0,1e9)}
function pc(id){return clamp(s.pets[id],0,1e9)}
function rc(id){return clamp(s.perks[id],0,1e5)}
function totalGens(){return G.reduce((a,g)=>a+gc(g.id),0)}
function totalUps(){return U.reduce((a,u)=>a+lv(u.id),0)}
function totalPets(){return P.reduce((a,p)=>a+pc(p.id),0)}
function powRatio(value,n,d,count,cap=10n**30n){let x=BigInt(value);for(let i=0;i<Math.min(2500,Math.max(0,count));i++){x=x*BigInt(n)/BigInt(d);if(x>=cap)return cap}return x}
function scale(base,rate,count){let x=BigInt(base);if(count>2500)return 10n**300n;for(let i=0;i<count;i++)x=(x*BigInt(rate)+999n)/1000n;return x}
function discount(){return Math.min(50,lv('coupon')+rc('discount'))}
function cost(base,rate,count){return scale(base,rate,count)*BigInt(100-discount())/100n}
function ucost(u){return cost(u.base,u.rate,lv(u.id))}
function gcost(g){return cost(g.base,g.rate,gc(g.id))}
function pCost(p){return p.base*powRatio(1000n,1200,1000,pc(p.id))/1000n}
function prestigeNeed(){return 10n**BigInt(Math.min(3000,6+s.prestige*2))}
function sqrt(n){if(n<2n)return n;let x=n/2n,y=(x+n/x)/2n;while(y<x){x=y;y=(x+n/x)/2n}return x}
function prestigeReward(){const r=big(s.runEarned)/prestigeNeed();return r<1n?0:Number(sqrt(r)>1000000n?1000000n:sqrt(r))}
function globalBP(){return 1000+s.stars*100+totalPets()*(30+lv('bond')*10)}
function multiplier(){return BigInt(globalBP())*powRatio(1000n,1100,1000,lv('empire'))/1000n}
function clickVal(){let v=(1n+big(s.legacyClick)+BigInt(lv('tap')*2))*multiplier()/1000n;v=v*powRatio(1000n,1200,1000,lv('tapmult'))/1000n;v=v*powRatio(1000n,1100,1000,lv('gloves'))/1000n;v=v*powRatio(1000n,1250,1000,rc('star'))/1000n;return v>0n?v:1n}
function autoVal(){let clicks=BigInt(lv('auto'))+big(s.legacyAuto||0);return clickVal()*clicks*powRatio(1000n,1150,1000,lv('automult'))/1000n}
function prodVal(){let n=big(s.legacyPassive||0);for(const g of G)n+=g.output*BigInt(gc(g.id));n=n*multiplier()/1000n;n=n*powRatio(1000n,1150,1000,lv('kennel'))/1000n;n=n*powRatio(1000n,1150,1000,rc('factory'))/1000n;return n}
function income(){let n=prodVal()+autoVal();if(Date.now()<s.boostUntil)n*=2n;return n}
function afford(n){return big(s.currency)>=n}
function spend(n){if(!afford(n))return false;s.currency=(big(s.currency)-n).toString();return true}
function grant(n){n=BigInt(n);if(n<=0n)return;s.currency=(big(s.currency)+n).toString();s.lifetime=(big(s.lifetime)+n).toString();s.runEarned=(big(s.runEarned)+n).toString();s.daily.earned=(big(s.daily.earned)+n).toString()}
function log(msg){s.logs.unshift({time:Date.now(),message:msg});s.logs=s.logs.slice(0,12);renderLog()}
function save(){try{s.last=Date.now();localStorage.setItem(SAVE,JSON.stringify(s));$('saveLabel').textContent='Sparat '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}catch(e){$('saveLabel').textContent='Kunde inte spara';console.warn(e)}}
function buyUpgrade(id){const u=U.find(x=>x.id===id);if(!u||lv(id)>=(u.max||1000000))return;const c=ucost(u);if(!spend(c))return;s.upgrades[id]=lv(id)+1;s.daily.purchases++;sound('buy.mp3');log('Köpte '+u.name+' — nivå '+s.upgrades[id]+'.');renderAll();save()}
function buyGen(id,amount){const g=G.find(x=>x.id===id);if(!g)return;let bought=0;for(let i=0;i<amount;i++){const c=gcost(g);if(!spend(c))break;s.generators[id]=gc(id)+1;bought++}if(bought){s.daily.purchases+=bought;sound('buy.mp3');log('Byggde '+bought+' '+g.name+'.');renderAll();save()}}
function buyPet(id){const p=P.find(x=>x.id===id);if(!p)return;const c=pCost(p);if(!spend(c))return;s.pets[id]=pc(id)+1;s.daily.purchases++;sound('buy.mp3');log(p.name+' anslöt sig till flocken!');renderAll();save()}
function buyPerk(id){const r=R.find(x=>x.id===id);if(!r||rc(id)>=r.max)return;const c=r.base+rc(id);if(s.stars<c)return;s.stars-=c;s.perks[id]=rc(id)+1;log('Forskning klar: '+r.name+' nivå '+s.perks[id]+'.');renderAll();save()}
function sound(file){if(!s.settings.sound)return;try{const a=new Audio(file);a.volume=.32;a.play().catch(()=>{})}catch(_){}}
function clickDog(){let reward=clickVal();if(Math.random()<Math.min(.75,lv('crit')*.02))reward=reward*BigInt(Math.round((2+lv('critpower')*.5)*100))/100n;grant(reward);s.clicks++;s.daily.clicks++;sound('click.mp3');const stage=$('dogButton').parentElement,el=document.createElement('span');el.className='float-number';el.textContent='+'+fmt(reward);el.style.left=(25+Math.random()*50)+'%';el.style.top='30%';stage.appendChild(el);setTimeout(()=>el.remove(),900);checkQuests();checkAchievements();renderTop();renderLevel()}
function claimGolden(){if(Date.now()>goldenUntil)return;let reward=(big(s.currency)+income()*60n+clickVal()*100n+100n);reward=reward*powRatio(1000n,1350,1000,lv('gold'))/1000n;grant(reward);goldenUntil=0;$('goldenButton').style.display='none';log('Gyllene hund! Du fick '+fmt(reward)+' hundben.');renderAll();save()}
function tryGolden(){if(goldenUntil>Date.now())return;const chance=Math.min(.08,.003+lv('luck')*.0005);if(Math.random()<chance){goldenUntil=Date.now()+12000;$('goldenButton').style.display='inline-block';log('En gyllene hund dök upp! Klicka innan den försvinner.')}}
function boost(){if(!spend(2500n))return;s.boostUntil=Math.max(Date.now(),s.boostUntil)+60000;log('Godisboost: dubbel produktion i 60 sekunder.');renderAll();save()}
function doPrestige(){const reward=prestigeReward();if(!reward)return;if(!confirm('Prestige ger '+reward+' stjärnstoft. Hundben, producenter och vanliga uppgraderingar återställs. Husdjur och forskning behålls. Fortsätta?'))return;s.stars+=reward;s.prestige++;s.currency=(1000*rc('start')).toString();s.runEarned='0';s.upgrades={};s.generators={};s.boostUntil=0;log('Prestige '+s.prestige+'! Du fick '+reward+' stjärnstoft.');renderAll();save()}
function quests(){return[
{id:'clicks',name:'Tassarna i arbete',desc:'Klicka hunden 50 gånger',icon:'👆',p:s.daily.clicks,goal:50,reward:250n},
{id:'purchases',name:'Byggmästare',desc:'Köp 5 uppgraderingar eller producenter',icon:'⚙️',p:s.daily.purchases,goal:5,reward:600n},
{id:'earn',name:'Ben på hög',desc:'Tjäna 5 000 hundben idag',icon:'🦴',p:Number(big(s.daily.earned)>1000000000000n?1000000000000n:big(s.daily.earned)),goal:5000,reward:1000n}
]}
function checkQuests(){for(const q of quests())if(q.p>=q.goal&&!s.daily.claimed.includes(q.id)){s.daily.claimed.push(q.id);let r=q.reward*powRatio(1000n,1200,1000,lv('quest'))/1000n;grant(r);log('Uppdrag klart: '+q.name+' (+'+fmt(r)+').')}}
function checkAchievements(){for(const a of A){if(!s.achievements.includes(a.id)&&a.test()){s.achievements.push(a.id);log('Prestation upplåst: '+a.name+'!')}}}
function renderTop(){$('bonesValue').textContent=fmt(s.currency);$('bonesFoot').textContent='Livstid: '+fmt(s.lifetime);$('clickValue').textContent=fmt(clickVal());$('incomeValue').textContent=fmt(income());$('prestigeValue').textContent=s.prestige;$('prestigeFoot').textContent='+'+(s.stars*10)+'% permanent stjärnbonus';$('starDust').textContent=fmt(s.stars)}
function renderLevel(){let l=Number(sqrt(big(s.lifetime)/100n))+1;l=clamp(l,1,1000000);s.level=l;const prev=100n*BigInt(l-1)*BigInt(l-1),next=100n*BigInt(l)*BigInt(l),within=big(s.lifetime)>prev?big(s.lifetime)-prev:0n,span=next-prev,pct=span?Number(within*10000n/span)/100:0;$('levelBadge').textContent='NIVÅ '+l.toLocaleString('sv-SE');$('levelDescription').textContent='Nästa milstolpe vid '+fmt(next)+' livstidsben';$('levelProgressText').textContent=fmt(within)+' / '+fmt(span)+' hundben';$('levelPercent').textContent=pct.toFixed(1)+'%';$('levelProgress').style.width=Math.min(100,pct)+'%'}
function renderLog(){$('eventLog').innerHTML=s.logs.length?s.logs.map(x=>'<div class="log-entry"><time>'+new Date(x.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</time>'+esc(x.message)+'</div>').join(''):'<div class="log-entry">Välkommen till DOG EMPIRE.</div>'}
function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderQuests(){$('questList').innerHTML=quests().map(q=>{const done=s.daily.claimed.includes(q.id),p=Math.min(q.goal,q.p);return '<div class="quest-row"><div class="quest-icon">'+q.icon+'</div><div><b>'+q.name+'</b><small>'+(done?'Klart — belöning hämtad':q.desc+' · '+p+'/'+q.goal)+'</small><div class="progress"><i style="width:'+(p/q.goal*100)+'%"></i></div></div><div class="quest-reward">'+(done?'✓':'+'+fmt(q.reward))+'</div></div>'}).join('')}
function renderUpgrades(){const cats=$('upgradeCategories');cats.innerHTML=categories.map(c=>'<button class="category-btn '+(c[0]===currentCat?'active':'')+'" data-cat="'+c[0]+'">'+c[1]+'</button>').join('');cats.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{currentCat=b.dataset.cat;renderUpgrades()});const list=U.filter(u=>u.cat===currentCat);$('upgradeGrid').innerHTML=list.map(u=>{const l=lv(u.id),c=ucost(u),max=u.max||1000000;return '<article class="shop-item"><div class="shop-top"><div class="shop-icon">'+u.icon+'</div><div class="shop-info"><b>'+u.name+'</b><small>'+u.desc+'</small></div></div><div class="shop-meta"><span>Nivå '+l+' / '+max+'</span><span>'+Math.floor(l/max*100)+'%</span></div><div class="progress"><i style="width:'+Math.min(100,l/max*100)+'%"></i></div><div class="shop-bottom"><span class="cost">🦴 '+fmt(c)+'</span><button class="btn small primary" data-u="'+u.id+'" '+(!afford(c)||l>=max?'disabled':'')+'>Köp nivå</button></div></article>'}).join('');$('upgradeGrid').querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.u));$('upgradeCount').textContent=totalUps().toLocaleString('sv-SE')+' nivåer köpta'}
function renderGenerators(){$('generatorGrid').innerHTML=G.map(g=>{const n=gc(g.id),c=gcost(g);return '<article class="generator"><div class="big-icon">'+g.icon+'</div><div class="generator-info"><b>'+g.name+'</b><p>'+g.desc+'</p><div class="generator-count">Ägda: '+n.toLocaleString('sv-SE')+'</div></div><div class="generator-bottom"><div><div class="cost">🦴 '+fmt(c)+'</div><small class="card-sub">'+fmt(g.output)+' / sek per styck</small></div><div style="display:flex;gap:5px"><button class="btn small" data-g="'+g.id+'" data-n="10" '+(!afford(c)?'disabled':'')+'>+10</button><button class="btn small primary" data-g="'+g.id+'" data-n="1" '+(!afford(c)?'disabled':'')+'>Köp</button></div></div></article>'}).join('');$('generatorGrid').querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>buyGen(b.dataset.g,Number(b.dataset.n)));$('producerCount').textContent=totalGens().toLocaleString('sv-SE')+' ägda'}
function renderPets(){$('petGrid').innerHTML=P.map(p=>{const n=pc(p.id),c=pCost(p);return '<article class="pet-card"><div class="pet-portrait">'+p.icon+'</div><b>'+p.name+'</b><p>'+p.desc+'</p><div class="pet-owned">Ägda: '+n+'</div><button class="btn primary" data-p="'+p.id+'" '+(!afford(c)?'disabled':'')+'>Köp · '+fmt(c)+' 🦴</button></article>'}).join('');$('petGrid').querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>buyPet(b.dataset.p));$('petCount').textContent=totalPets()+' kompisar'}
function renderPerks(){$('perkGrid').innerHTML=R.map(r=>{const l=rc(r.id),c=r.base+l;return '<article class="perk"><div class="shop-top"><div class="shop-icon">'+r.icon+'</div><div class="shop-info"><b>'+r.name+'</b><small>'+r.desc+'</small></div></div><div class="shop-meta"><span>Nivå '+l+' / '+r.max+'</span><span>'+s.stars+' stjärnstoft</span></div><div class="progress"><i style="width:'+(l/r.max*100)+'%"></i></div><div class="shop-bottom"><span class="cost">'+(l>=r.max?'MAXAD':'✦ '+c+' stjärnstoft')+'</span><button class="btn small primary" data-r="'+r.id+'" '+(l>=r.max||s.stars<c?'disabled':'')+'>Lås upp</button></div></article>'}).join('');$('perkGrid').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>buyPerk(b.dataset.r))}
function renderPrestige(){const reward=prestigeReward();$('prestigeRequirement').textContent='Krav: '+fmt(prestigeNeed())+' ben i denna omgång · Möjlig belöning: '+reward+' stjärnstoft';$('prestigeButton').disabled=!reward;renderPerks()}
function renderAchievements(){$('achievementGrid').innerHTML=A.map(a=>{const on=s.achievements.includes(a.id);return '<article class="achievement-card '+(on?'unlocked':'')+'"><div class="achievement-icon">'+(on?a.icon:'🔒')+'</div><div><b>'+a.name+'</b><small>'+a.desc+'</small></div></article>'}).join('');$('achievementCount').textContent=s.achievements.length+' / '+A.length}
function renderStats(){ $('statLifetime').textContent=fmt(s.lifetime);$('statClicks').textContent=s.clicks.toLocaleString('sv-SE');$('statGenerators').textContent=totalGens().toLocaleString('sv-SE');$('statPets').textContent=totalPets().toLocaleString('sv-SE');const rows=G.filter(g=>gc(g.id)).map(g=>'<tr><td>'+g.name+'</td><td>'+fmt(g.output*BigInt(gc(g.id)))+' / sek</td></tr>');if(autoVal())rows.push('<tr><td>Automatiska klick</td><td>'+fmt(autoVal())+' / sek</td></tr>');$('productionBreakdown').innerHTML=rows.length?'<table class="table"><thead><tr><th>Källa</th><th>Grundproduktion</th></tr></thead><tbody>'+rows.join('')+'</tbody></table>':'<div class="empty">Du har inte byggt någon produktion ännu.</div>'}
function renderSettings(){$('settingsList').innerHTML=[['sound','Ljudeffekter','Spela upp klick- och köpljud.'],['reducedMotion','Minskade animationer','Minska rörelser och effekter.']].map(x=>'<div class="setting-row"><div><b>'+x[1]+'</b><small>'+x[2]+'</small></div><button class="toggle '+(s.settings[x[0]]?'on':'')+'" data-setting="'+x[0]+'"><i></i></button></div>').join('');$('settingsList').querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>{const id=b.dataset.setting;s.settings[id]=!s.settings[id];document.body.classList.toggle('reduced-motion',s.settings.reducedMotion);renderSettings();save()})}
function renderBoost(){const on=s.boostUntil>Date.now();$('boostStatus').textContent=on?'AKTIV':'INGEN';$('boostPanel').textContent=on?'Dubbel produktion aktiv i '+Math.ceil((s.boostUntil-Date.now())/1000)+' sekunder.':'Köp en godisboost för att dubbla produktionen i 60 sekunder.';$('buyBoost').disabled=!afford(2500n)}
function renderAll(){renderTop();renderLevel();renderQuests();renderLog();renderUpgrades();renderGenerators();renderPets();renderPrestige();renderAchievements();renderStats();renderSettings();renderBoost();$('soundQuick').textContent=s.settings.sound?'♫':'♫̸';}
const meta={dashboard:['DOG EMPIRE / SPELÖVERSIKT','Din hundvärld'],upgrades:['DOG EMPIRE / FÖRBÄTTRA','Uppgraderingar'],producers:['DOG EMPIRE / PRODUKTION','Hundfabriken'],pets:['DOG EMPIRE / FLOCKEN','Hundkompisar'],prestige:['DOG EMPIRE / ÅTERFÖDELSE','Prestige & forskning'],achievements:['DOG EMPIRE / MILSTOLPAR','Prestationer'],statistics:['DOG EMPIRE / ANALYS','Spelstatistik'],settings:['DOG EMPIRE / SYSTEM','Inställningar']};
function navigate(v){if(!meta[v])return;currentView=v;document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('eyebrow').textContent=meta[v][0];$('pageTitle').textContent=meta[v][1];window.scrollTo({top:0,behavior:s.settings.reducedMotion?'auto':'smooth'})}
function exportSave(){const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dog-empire-save-'+today()+'.json';a.click();URL.revokeObjectURL(url);log('Sparfil exporterad.')}
function importSave(text){try{const x=JSON.parse(text);if(!x||x.version!==2)throw Error('bad save');s={...fresh(),...x};s.daily={...fresh().daily,...(x.daily||{})};if(s.daily.date!==today())s.daily=fresh().daily;save();renderAll();log('Sparfil importerad.')}catch(e){alert('Sparfilen kunde inte läsas. Kontrollera att den kommer från DOG EMPIRE.');}}
function offline(){const seconds=Math.max(0,Math.min(28800,Math.floor((Date.now()-Number(s.last||Date.now()))/1000)));if(seconds<10)return;const pct=Math.min(100,50+lv('offline')*5+rc('offline')*5),earned=income()*BigInt(seconds)*BigInt(pct)/100n;if(earned){grant(earned);log('Välkommen tillbaka! Du tjänade '+fmt(earned)+' hundben offline.');}}
function tick(){const now=Date.now(),dt=Math.min(5,Math.max(0,(now-lastTick)/1000));lastTick=now;const sec=BigInt(Math.floor(dt));if(sec>0n){grant(income()*sec);s.playSeconds+=Number(sec)}if(goldenUntil&&now>goldenUntil){goldenUntil=0;$('goldenButton').style.display='none'}if(goldenUntil===0)tryGolden();checkQuests();checkAchievements();renderTop();renderLevel();renderBoost();if(now-lastSave>15000){save();lastSave=now}}
function init(){document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));$('dogButton').addEventListener('click',clickDog);$('goldenButton').addEventListener('click',claimGolden);$('quickUpgrade').onclick=()=>navigate('upgrades');$('quickProducer').onclick=()=>navigate('producers');$('buyBoost').onclick=boost;$('prestigeButton').onclick=doPrestige;$('soundQuick').onclick=()=>{s.settings.sound=!s.settings.sound;renderAll();save()};$('settingsQuick').onclick=()=>navigate('settings');$('exportButton').onclick=exportSave;$('importButton').onclick=()=>$('importFile').click();$('importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(f)importSave(await f.text());e.target.value=''});$('resetButton').onclick=()=>{if(confirm('Radera all speldata permanent?')){localStorage.removeItem(SAVE);localStorage.removeItem(LEGACY);location.reload()}};document.addEventListener('keydown',e=>{if(e.code==='Space'&&currentView==='dashboard'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();clickDog()}});window.addEventListener('beforeunload',save);document.body.classList.toggle('reduced-motion',s.settings.reducedMotion);offline();renderAll();save();lastTick=Date.now();setInterval(tick,1000)}
init();
})();