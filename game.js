(() => {
'use strict';

/* DOG EMPIRE v3 — event delegation, resilient saves, no BigInt dependency. */
const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'dogEmpire_v3';
const OLD_KEYS = ['dogEmpire_v2', 'dogClickerUltimate_v1'];
const MAX = 1e300;

const clamp = (n, min = 0, max = MAX) => { const value = Number(n); if (Number.isNaN(value)) return min; if (value === Infinity) return max; if (value === -Infinity) return min; return Math.min(max, Math.max(min, value)); };
const num = (v, fallback = 0) => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : clamp(n, 0, MAX);
};
const fmt = (value) => {
  const n = clamp(value);
  if (n < 1000) return Math.floor(n).toLocaleString('sv-SE');
  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd'];
  const group = Math.min(units.length - 1, Math.floor(Math.log10(n) / 3));
  if (group >= units.length - 1 && n >= 1e42) return n.toExponential(2);
  const scaled = n / Math.pow(1000, group);
  return scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + units[group];
};
const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};
const freshState = () => ({
  version: 3, bones: 0, lifetime: 0, runEarned: 0, clicks: 0, level: 1,
  prestige: 0, stars: 0, upgrades: {}, generators: {}, pets: {}, research: {},
  achievements: [], settings: { sound: true, reducedMotion: false },
  boostUntil: 0, goldenCount: 0, daily: { date: today(), clicks: 0, buys: 0, earned: 0, claimed: [] },
  logs: [], savedAt: Date.now(), playSeconds: 0, legacyClick: 0, legacyPassive: 0, legacyAuto: 0
});

let s = freshState();
let activeView = 'dashboard';
let activeCategory = 'click';
let goldenUntil = 0;
let lastTick = Date.now();
let lastSave = Date.now();
let started = false;

const upgrades = [
  { id:'tap', cat:'click', name:'Tass-träning', icon:'🐾', desc:'+2 grundkraft per klick och nivå.', base:30, rate:1.15, max:100000 },
  { id:'tapmult', cat:'click', name:'Superstuds', icon:'💪', desc:'+20% klickkraft per nivå.', base:250, rate:1.22, max:100000 },
  { id:'gloves', cat:'click', name:'Guldhandskar', icon:'🧤', desc:'+10% klickkraft per nivå.', base:1800, rate:1.28, max:100000 },
  { id:'auto', cat:'automation', name:'Självklickande tass', icon:'🦾', desc:'+1 automatiskt klick per sekund.', base:900, rate:1.32, max:100000 },
  { id:'automult', cat:'automation', name:'Turbo-motor', icon:'⚡', desc:'+15% styrka på automatiska klick.', base:6500, rate:1.28, max:100000 },
  { id:'kennel', cat:'income', name:'Kennelutbildning', icon:'🏡', desc:'+15% producentproduktion per nivå.', base:1200, rate:1.19, max:100000 },
  { id:'empire', cat:'income', name:'Hundimperiets strategi', icon:'🌐', desc:'+10% global styrka per nivå.', base:18000, rate:1.30, max:100000 },
  { id:'crit', cat:'critical', name:'Prickskytte-nos', icon:'🎯', desc:'+2 procentenheter kritisk chans.', base:3500, rate:1.37, max:35 },
  { id:'critpower', cat:'critical', name:'Skallattack', icon:'💥', desc:'+0,5x kritisk skada per nivå.', base:7000, rate:1.35, max:100000 },
  { id:'luck', cat:'fortune', name:'Gyllene nos', icon:'✨', desc:'Gör gyllene hundar vanligare.', base:8000, rate:1.38, max:100 },
  { id:'gold', cat:'fortune', name:'Guldfångare', icon:'🪙', desc:'+35% belöning från gyllene hundar.', base:14000, rate:1.39, max:100000 },
  { id:'offline', cat:'utility', name:'Drömmarnas hundvakt', icon:'🌙', desc:'+5 procentenheter offline-inkomst.', base:9000, rate:1.36, max:10 },
  { id:'coupon', cat:'utility', name:'Ben-rabatt', icon:'🏷️', desc:'-1% kostnad per nivå.', base:22000, rate:1.45, max:30 },
  { id:'quest', cat:'utility', name:'Uppdragsproffs', icon:'📋', desc:'+20% dagliga uppdragsbelöningar.', base:12000, rate:1.40, max:100000 },
  { id:'bond', cat:'income', name:'Flockens band', icon:'❤️', desc:'Förstärker bonusen från husdjur.', base:45000, rate:1.50, max:100000 }
];
const generators = [
  { id:'puppy', name:'Valpkompis', icon:'🐶', desc:'En liten hjälpreda som samlar ben.', base:15, output:1, rate:1.15 },
  { id:'walker', name:'Hundrastare', icon:'🦮', desc:'Kommer hem med fickorna fulla.', base:120, output:7, rate:1.16 },
  { id:'daycare', name:'Hunddagis', icon:'🏫', desc:'Ett helt gäng jobbar tillsammans.', base:1250, output:42, rate:1.17 },
  { id:'kennel', name:'Superkennel', icon:'🏡', desc:'Professionell hundbensproduktion.', base:14000, output:260, rate:1.18 },
  { id:'factory', name:'Kexfabrik', icon:'🍪', desc:'Bakar hundgodis dygnet runt.', base:165000, output:1700, rate:1.19 },
  { id:'robot', name:'Hundrobot', icon:'🤖', desc:'En outtröttlig mekanisk arbetare.', base:2100000, output:12500, rate:1.20 },
  { id:'planet', name:'Hundplanet', icon:'🪐', desc:'En hel planet som producerar ben.', base:31000000, output:98000, rate:1.22 },
  { id:'portal', name:'Tassportal', icon:'🌀', desc:'Importerar ben från andra dimensioner.', base:500000000, output:850000, rate:1.25 }
];
const pets = [
  { id:'retriever', name:'Golden retriever', icon:'🐕', desc:'+3% total bonus per hund.', base:500 },
  { id:'corgi', name:'Corgi', icon:'🐕‍🦺', desc:'Liten kropp, stor arbetsmoral.', base:1800 },
  { id:'husky', name:'Husky', icon:'🐺', desc:'Drar upp tempot i flocken.', base:7000 },
  { id:'shiba', name:'Shiba inu', icon:'🦊', desc:'Har känsla för guld.', base:25000 },
  { id:'pug', name:'Mops', icon:'🐶', desc:'Håller koll även när du är borta.', base:100000 },
  { id:'samoyed', name:'Samojed', icon:'☁️', desc:'Sprider energi i produktionen.', base:600000 },
  { id:'dachshund', name:'Tax', icon:'🌭', desc:'En liten strateg med stor effekt.', base:4000000 },
  { id:'dragon', name:'Drakhund', icon:'🐉', desc:'En mytisk vän från benriket.', base:50000000 }
];
const research = [
  { id:'star', name:'Stjärntassar', icon:'🌟', desc:'+25% klickkraft per nivå.', base:1, max:25 },
  { id:'factory', name:'Fabriksfrö', icon:'🏭', desc:'+15% producentkraft per nivå.', base:2, max:25 },
  { id:'start', name:'Varm start', icon:'🎁', desc:'Starta med 1 000 extra hundben per nivå.', base:2, max:50 },
  { id:'offline', name:'Tidsmästare', icon:'⏳', desc:'+5 procentenheter offline-inkomst.', base:3, max:10 },
  { id:'gold', name:'Gyllene själ', icon:'✨', desc:'+25% gyllene belöning per nivå.', base:3, max:25 },
  { id:'discount', name:'Stjärnrabatt', icon:'🏷️', desc:'-1% kostnad per nivå.', base:4, max:25 }
];
const achievements = [
  {id:'first',name:'Första benet',desc:'Samla ditt första hundben.',icon:'🦴',test:()=>s.lifetime>=1},
  {id:'100',name:'Valpstart',desc:'Samla 100 livstidsben.',icon:'🐾',test:()=>s.lifetime>=100},
  {id:'1000',name:'Benburken',desc:'Samla 1 000 livstidsben.',icon:'🫙',test:()=>s.lifetime>=1000},
  {id:'million',name:'Miljonben',desc:'Samla en miljon livstidsben.',icon:'💰',test:()=>s.lifetime>=1e6},
  {id:'click100',name:'Klickmaskin',desc:'Klicka 100 gånger.',icon:'👆',test:()=>s.clicks>=100},
  {id:'click1000',name:'Tassstorm',desc:'Klicka 1 000 gånger.',icon:'🌪️',test:()=>s.clicks>=1000},
  {id:'gen10',name:'Liten fabrik',desc:'Äg 10 producenter.',icon:'⚙️',test:()=>totalGenerators()>=10},
  {id:'gen100',name:'Industrimagnat',desc:'Äg 100 producenter.',icon:'🏭',test:()=>totalGenerators()>=100},
  {id:'up10',name:'Förbättringsiver',desc:'Köp 10 uppgraderingsnivåer.',icon:'⬆️',test:()=>totalUpgrades()>=10},
  {id:'pet1',name:'Bästa vän',desc:'Skaffa din första kompis.',icon:'❤️',test:()=>totalPets()>=1},
  {id:'pet10',name:'Hundflock',desc:'Samla 10 hundkompisar.',icon:'🐕',test:()=>totalPets()>=10},
  {id:'prestige1',name:'Återfödd',desc:'Gör din första prestige.',icon:'✦',test:()=>s.prestige>=1},
  {id:'prestige5',name:'Stjärnlegend',desc:'Gör fem prestigeomgångar.',icon:'🌌',test:()=>s.prestige>=5},
  {id:'billion',name:'Benmiljardär',desc:'Samla en miljard livstidsben.',icon:'👑',test:()=>s.lifetime>=1e9}
];
const categoryList = [
  ['click','👆 Klickkraft'],['income','⚙️ Produktion'],['automation','🤖 Automatik'],
  ['critical','💥 Kritiska träffar'],['fortune','🍀 Tur & guld'],['utility','🧰 Effektivitet']
];

function migrateSave(raw) {
  const base = freshState();
  if (!raw || typeof raw !== 'object') return base;
  const old = raw;
  base.bones = num(old.bones ?? old.currency);
  base.lifetime = num(old.lifetime ?? old.total);
  base.runEarned = num(old.runEarned ?? old.total);
  base.clicks = num(old.clicks);
  base.prestige = num(old.prestige);
  base.stars = num(old.stars);
  base.level = Math.max(1, num(old.level, 1));
  base.upgrades = { ...(old.upgrades || {}) };
  base.generators = { ...(old.generators || {}) };
  base.pets = { ...(old.petOwned || (Array.isArray(old.pets) ? {} : old.pets) || {}) };
  base.research = { ...(old.research || old.perks || {}) };
  base.achievements = Array.isArray(old.achievements) ? old.achievements.slice() : [];
  base.settings = { ...base.settings, ...(old.settings || {}) };
  base.boostUntil = num(old.boostUntil);
  base.logs = Array.isArray(old.logs) ? old.logs.slice(0, 12) : [];
  base.savedAt = num(old.savedAt ?? old.last, Date.now());
  base.playSeconds = num(old.playSeconds);
  base.daily = { ...base.daily, ...(old.daily || {}) };
  if (base.daily.date !== today()) base.daily = { date:today(), clicks:0, buys:0, earned:0, claimed:[] };
  base.daily.clicks = num(base.daily.clicks);
  base.daily.buys = num(base.daily.buys ?? base.daily.purchases);
  base.daily.earned = num(base.daily.earned);
  base.daily.claimed = Array.isArray(base.daily.claimed) ? base.daily.claimed : [];
  if (old.version !== 3) {
    const legacyClick = num(old.legacyClick ?? old.click, 1);
    base.legacyClick = Math.max(0, legacyClick - 1);
    base.legacyPassive = num(old.legacyPassive ?? old.passive);
    base.legacyAuto = num(old.legacyAuto ?? old.auto);
  } else {
    base.legacyClick = num(old.legacyClick);
    base.legacyPassive = num(old.legacyPassive);
    base.legacyAuto = num(old.legacyAuto);
  }
  // Convert the previous game's "kind:index" upgrade map into safe carry-over bonuses.
  if (old.upgrades && old.version !== 3) {
    const carry = { click:0, idle:0, auto:0, special:0 };
    for (const [key, value] of Object.entries(old.upgrades)) {
      const kind = String(key).split(':')[0];
      if (kind in carry) carry[kind] += num(value);
    }
    base.legacyClick += carry.click;
    base.legacyPassive += carry.idle;
    base.legacyAuto += carry.auto;
    if (carry.special) base.stars += Math.floor(carry.special / 5);
  }
  return base;
}

function load() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) for (const key of OLD_KEYS) { raw = localStorage.getItem(key); if (raw) break; }
    if (raw) s = migrateSave(JSON.parse(raw));
  } catch (error) {
    console.warn('DOG EMPIRE save load failed:', error);
    s = freshState();
    addLog('En gammal sparfil kunde inte läsas. Ett nytt spel startades.');
  }
}
function save() {
  try {
    s.savedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    const label = $('saveLabel');
    if (label) label.textContent = 'Sparat ' + new Date().toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'});
  } catch (error) {
    const label = $('saveLabel');
    if (label) label.textContent = 'Sparning blockerad';
    console.warn('DOG EMPIRE save failed:', error);
  }
}
function addLog(message) {
  s.logs.unshift({ time:Date.now(), message:String(message) });
  s.logs = s.logs.slice(0, 12);
}
function levelOf(map, id) { return Math.max(0, Math.floor(num(map[id]))); }
function upLevel(id) { return levelOf(s.upgrades, id); }
function genCount(id) { return levelOf(s.generators, id); }
function petCount(id) { return levelOf(s.pets, id); }
function researchLevel(id) { return levelOf(s.research, id); }
function totalGenerators() { return generators.reduce((sum, g) => sum + genCount(g.id), 0); }
function totalUpgrades() { return upgrades.reduce((sum, u) => sum + upLevel(u.id), 0); }
function totalPets() { return pets.reduce((sum, p) => sum + petCount(p.id), 0); }
function cost(base, rate, count) {
  const discount = Math.min(0.5, (upLevel('coupon') + researchLevel('discount')) * 0.01);
  const exponent = Math.min(10000, Math.max(0, count));
  const raw = base * Math.pow(rate, exponent);
  return Math.max(1, Math.ceil(Math.min(MAX, raw) * (1 - discount)));
}
function upgradeCost(item) { return cost(item.base, item.rate, upLevel(item.id)); }
function generatorCost(item) { return cost(item.base, item.rate, genCount(item.id)); }
function petCost(item) { return Math.max(1, Math.ceil(item.base * Math.pow(1.2, petCount(item.id)))); }
function prestigeRequirement() { return Math.min(MAX, 1e6 * Math.pow(100, Math.min(150, s.prestige))); }
function prestigeReward() {
  const ratio = s.runEarned / prestigeRequirement();
  return ratio >= 1 ? Math.max(1, Math.floor(Math.sqrt(ratio))) : 0;
}
function globalMultiplier() {
  return 1 + s.stars * 0.1 + totalPets() * (0.03 + upLevel('bond') * 0.01) + upLevel('empire') * 0.1 + researchLevel('star') * 0.25;
}
function clickPower() {
  let value = (1 + s.legacyClick + upLevel('tap') * 2);
  value *= Math.pow(1.2, upLevel('tapmult'));
  value *= Math.pow(1.1, upLevel('gloves'));
  value *= Math.pow(1.25, researchLevel('star'));
  value *= globalMultiplier();
  return clamp(value, 1, MAX);
}
function autoIncome() {
  const autoClicks = upLevel('auto') + s.legacyAuto;
  return clickPower() * autoClicks * Math.pow(1.15, upLevel('automult'));
}
function producerIncome() {
  let base = s.legacyPassive;
  for (const g of generators) base += g.output * genCount(g.id);
  base *= globalMultiplier();
  base *= Math.pow(1.15, upLevel('kennel'));
  base *= Math.pow(1.15, researchLevel('factory'));
  return clamp(base);
}
function incomePerSecond() {
  const multiplier = Date.now() < s.boostUntil ? 2 : 1;
  return clamp((producerIncome() + autoIncome()) * multiplier);
}
function addBones(amount) {
  const earned = clamp(amount);
  if (earned <= 0) return;
  s.bones = clamp(s.bones + earned);
  s.lifetime = clamp(s.lifetime + earned);
  s.runEarned = clamp(s.runEarned + earned);
  s.daily.earned = clamp(s.daily.earned + earned);
}
function canAfford(price) { return s.bones >= price; }
function spend(price) {
  if (!canAfford(price)) return false;
  s.bones = Math.max(0, s.bones - price);
  return true;
}
function playSound(file) {
  if (!s.settings.sound) return;
  try { const audio = new Audio('./' + file); audio.volume = 0.28; audio.play().catch(() => {}); } catch (_) {}
}
function buyUpgrade(id) {
  const item = upgrades.find(x => x.id === id);
  if (!item) return;
  const level = upLevel(id);
  if (level >= item.max) return;
  const price = upgradeCost(item);
  if (!spend(price)) { addLog('Du behöver fler hundben för ' + item.name + '.'); renderActivity(); return; }
  s.upgrades[id] = level + 1;
  s.daily.buys++;
  playSound('buy.mp3');
  addLog(item.name + ' uppgraderad till nivå ' + (level + 1) + '.');
  afterAction();
}
function buyGenerator(id, amount = 1) {
  const item = generators.find(x => x.id === id);
  if (!item) return;
  let bought = 0;
  let paid = 0;
  const target = Math.max(1, Math.min(10, amount));
  for (let i = 0; i < target; i++) {
    const price = generatorCost(item);
    if (!spend(price)) break;
    paid += price;
    s.generators[id] = genCount(id) + 1;
    bought++;
  }
  if (!bought) { addLog('Du behöver fler hundben för ' + item.name + '.'); renderActivity(); return; }
  s.daily.buys += bought;
  playSound('buy.mp3');
  addLog('Köpte ' + bought + ' ' + item.name + (bought > 1 ? ' (totalt ' + genCount(id) + ').' : '.'));
  afterAction();
}
function buyPet(id) {
  const item = pets.find(x => x.id === id);
  if (!item) return;
  const price = petCost(item);
  if (!spend(price)) { addLog('Du behöver fler hundben för ' + item.name + '.'); renderActivity(); return; }
  s.pets[id] = petCount(id) + 1;
  s.daily.buys++;
  playSound('buy.mp3');
  addLog(item.name + ' anslöt sig till flocken!');
  afterAction();
}
function buyResearch(id) {
  const item = research.find(x => x.id === id);
  if (!item) return;
  const level = researchLevel(id), price = item.base + level;
  if (level >= item.max || s.stars < price) return;
  s.stars -= price;
  s.research[id] = level + 1;
  addLog('Forskning klar: ' + item.name + ' nivå ' + (level + 1) + '.');
  afterAction();
}
function clickDog() {
  let reward = clickPower();
  const critChance = Math.min(0.7, upLevel('crit') * 0.02);
  let critical = false;
  if (Math.random() < critChance) {
    reward *= 2 + upLevel('critpower') * 0.5;
    critical = true;
  }
  addBones(reward);
  s.clicks++;
  s.daily.clicks++;
  playSound('click.mp3');
  const button = $('dogButton');
  if (button) {
    const float = document.createElement('span');
    float.className = 'float-number';
    float.textContent = (critical ? 'CRIT +' : '+') + fmt(reward);
    float.style.left = (24 + Math.random() * 52) + '%';
    float.style.top = '23%';
    button.appendChild(float);
    setTimeout(() => float.remove(), 850);
  }
  checkQuests();
  checkAchievements();
  renderTop();
  renderLevel();
  renderQuestList();
  renderActivity();
}
function collectGolden() {
  if (Date.now() > goldenUntil) return;
  const rewardBase = Math.max(100, s.bones * 0.15, incomePerSecond() * 60, clickPower() * 50);
  const reward = rewardBase * Math.pow(1.35, upLevel('gold')) * Math.pow(1.25, researchLevel('gold'));
  addBones(reward);
  s.goldenCount++;
  goldenUntil = 0;
  const button = $('goldenButton');
  if (button) button.style.display = 'none';
  playSound('buy.mp3');
  addLog('Gyllene hund! Du fick ' + fmt(reward) + ' hundben.');
  checkAchievements();
  afterAction();
}
function maybeSpawnGolden() {
  if (goldenUntil > Date.now()) return;
  const chance = Math.min(0.12, 0.006 + upLevel('luck') * 0.001);
  if (Math.random() < chance) {
    goldenUntil = Date.now() + 12000;
    const button = $('goldenButton');
    if (button) button.style.display = 'inline-block';
    addLog('En gyllene hund dök upp! Klicka på knappen innan den försvinner.');
    renderActivity();
  }
}
function buyBoost() {
  if (!spend(2500)) { addLog('Du behöver 2 500 hundben för en godisboost.'); renderActivity(); return; }
  s.boostUntil = Math.max(Date.now(), s.boostUntil) + 60000;
  addLog('Godisboost aktiverad: dubbel produktion i 60 sekunder.');
  afterAction();
}
function doPrestige() {
  const reward = prestigeReward();
  if (!reward) { addLog('Du behöver tjäna ' + fmt(prestigeRequirement()) + ' hundben i denna omgång innan prestige.'); renderPrestige(); renderActivity(); return; }
  if (!confirm('Prestige ger ' + reward + ' stjärnstoft. Hundben, producenter och vanliga uppgraderingar återställs. Husdjur och forskning behålls. Fortsätta?')) return;
  s.stars += reward;
  s.prestige++;
  s.bones = 1000 * researchLevel('start');
  s.runEarned = 0;
  s.upgrades = {};
  s.generators = {};
  s.boostUntil = 0;
  addLog('Prestige ' + s.prestige + '! Du fick ' + reward + ' stjärnstoft.');
  afterAction();
}
function questData() {
  return [
    {id:'clicks', name:'Tassarna i arbete', desc:'Klicka hunden 50 gånger.', icon:'👆', progress:s.daily.clicks, goal:50, reward:250},
    {id:'buys', name:'Byggmästare', desc:'Köp 5 uppgraderingar eller producenter.', icon:'⚙️', progress:s.daily.buys, goal:5, reward:600},
    {id:'earn', name:'Ben på hög', desc:'Tjäna 5 000 hundben idag.', icon:'🦴', progress:s.daily.earned, goal:5000, reward:1000}
  ];
}
function claimQuest(id) {
  const q = questData().find(x => x.id === id);
  if (!q || q.progress < q.goal || s.daily.claimed.includes(id)) return;
  const reward = q.reward * Math.pow(1.2, upLevel('quest'));
  s.daily.claimed.push(id);
  addBones(reward);
  addLog('Uppdrag klart: ' + q.name + ' (+' + fmt(reward) + ').');
  afterAction();
}
function checkQuests() {
  for (const q of questData()) {
    if (q.progress >= q.goal && !s.daily.claimed.includes(q.id)) {
      addLog('Uppdrag redo att hämtas: ' + q.name + '.');
    }
  }
}
function checkAchievements() {
  for (const a of achievements) {
    if (!s.achievements.includes(a.id) && a.test()) {
      s.achievements.push(a.id);
      addLog('Prestation upplåst: ' + a.name + '!');
    }
  }
}
function renderTop() {
  $('bonesValue').textContent = fmt(s.bones);
  $('bonesFoot').textContent = 'Livstid: ' + fmt(s.lifetime);
  $('clickValue').textContent = fmt(clickPower());
  $('incomeValue').textContent = fmt(incomePerSecond());
  $('prestigeValue').textContent = String(s.prestige);
  $('prestigeFoot').textContent = '+' + Math.round((globalMultiplier() - 1) * 100) + '% permanent bonus';
}
function renderLevel() {
  const level = Math.max(1, Math.floor(Math.sqrt(s.lifetime / 100)) + 1);
  const previous = 100 * (level - 1) * (level - 1);
  const next = 100 * level * level;
  const progress = Math.max(0, s.lifetime - previous);
  const span = Math.max(1, next - previous);
  const percent = Math.min(100, progress / span * 100);
  s.level = level;
  $('levelBadge').textContent = 'NIVÅ ' + level.toLocaleString('sv-SE');
  $('levelDescription').textContent = 'Nästa milstolpe vid ' + fmt(next) + ' livstidsben';
  $('levelProgressText').textContent = fmt(progress) + ' / ' + fmt(span) + ' hundben';
  $('levelPercent').textContent = percent.toFixed(1) + '%';
  $('levelProgress').style.width = percent + '%';
}
function renderActivity() {
  const list = $('eventLog');
  list.innerHTML = s.logs.length ? s.logs.map(x =>
    '<div class="log-entry"><time>' + new Date(num(x.time)).toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'}) + '</time>' + escapeHTML(x.message) + '</div>'
  ).join('') : '<div class="log-entry">Välkommen till DOG EMPIRE.</div>';
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderQuestList() {
  $('questList').innerHTML = questData().map(q => {
    const claimed = s.daily.claimed.includes(q.id);
    const progress = Math.min(q.goal, q.progress);
    const ready = progress >= q.goal && !claimed;
    return '<div class="quest-row"><div class="quest-icon">' + q.icon + '</div><div><b>' + q.name + '</b><small>' +
      (claimed ? 'Klart — belöning hämtad' : q.desc + ' ' + fmt(progress) + '/' + fmt(q.goal)) +
      '</small><div class="progress"><i style="width:' + (progress / q.goal * 100) + '%"></i></div></div>' +
      (ready ? '<button class="btn small primary" data-claim-quest="' + q.id + '">Hämta +' + fmt(q.reward) + '</button>' : '<span class="quest-reward">' + (claimed ? '✓' : '+' + fmt(q.reward)) + '</span>') +
      '</div>';
  }).join('');
}
function renderUpgrades() {
  $('upgradeCategories').innerHTML = categoryList.map(c =>
    '<button class="category-btn ' + (activeCategory === c[0] ? 'active' : '') + '" data-category="' + c[0] + '">' + c[1] + '</button>'
  ).join('');
  const items = upgrades.filter(u => u.cat === activeCategory);
  $('upgradeGrid').innerHTML = items.map(u => {
    const level = upLevel(u.id), price = upgradeCost(u), max = u.max;
    return '<article class="shop-item"><div class="shop-top"><div class="shop-icon">' + u.icon + '</div><div class="shop-info"><b>' + u.name + '</b><small>' + u.desc + '</small></div></div>' +
      '<div class="shop-meta"><span>Nivå ' + level + ' / ' + max + '</span><span>' + Math.floor(level / max * 100) + '%</span></div>' +
      '<div class="progress"><i style="width:' + Math.min(100, level / max * 100) + '%"></i></div>' +
      '<div class="shop-bottom"><span class="cost">🦴 ' + fmt(price) + '</span><button class="btn small primary" data-buy-upgrade="' + u.id + '" ' +
      (s.bones < price || level >= max ? 'disabled' : '') + '>Köp nivå</button></div></article>';
  }).join('');
  $('upgradeCount').textContent = totalUpgrades().toLocaleString('sv-SE') + ' nivåer köpta';
}
function renderGenerators() {
  $('generatorGrid').innerHTML = generators.map(g => {
    const count = genCount(g.id), price = generatorCost(g);
    return '<article class="generator"><div class="big-icon">' + g.icon + '</div><div class="generator-info"><b>' + g.name + '</b><p>' + g.desc + '</p><div class="generator-count">Ägda: ' + count + '</div></div>' +
      '<div class="generator-bottom"><div><div class="cost">🦴 ' + fmt(price) + '</div><small class="card-sub">' + fmt(g.output) + ' / sek per styck</small></div>' +
      '<div style="display:flex;gap:5px"><button class="btn small" data-buy-generator="' + g.id + '" data-amount="10" ' + (s.bones < price ? 'disabled' : '') + '>+10</button>' +
      '<button class="btn small primary" data-buy-generator="' + g.id + '" data-amount="1" ' + (s.bones < price ? 'disabled' : '') + '>Köp</button></div></div></article>';
  }).join('');
  $('producerCount').textContent = totalGenerators().toLocaleString('sv-SE') + ' ägda';
}
function renderPets() {
  $('petGrid').innerHTML = pets.map(p => {
    const count = petCount(p.id), price = petCost(p);
    return '<article class="pet-card"><div class="pet-portrait">' + p.icon + '</div><b>' + p.name + '</b><p>' + p.desc + '</p><div class="pet-owned">Ägda: ' + count + '</div>' +
      '<button class="btn primary" data-buy-pet="' + p.id + '" ' + (s.bones < price ? 'disabled' : '') + '>Köp · ' + fmt(price) + ' 🦴</button></article>';
  }).join('');
  $('petCount').textContent = totalPets() + ' kompisar';
}
function renderResearch() {
  $('perkGrid').innerHTML = research.map(r => {
    const level = researchLevel(r.id), price = r.base + level;
    return '<article class="perk"><div class="shop-top"><div class="shop-icon">' + r.icon + '</div><div class="shop-info"><b>' + r.name + '</b><small>' + r.desc + '</small></div></div>' +
      '<div class="shop-meta"><span>Nivå ' + level + ' / ' + r.max + '</span><span>' + s.stars + ' stjärnstoft</span></div>' +
      '<div class="progress"><i style="width:' + (level / r.max * 100) + '%"></i></div><div class="shop-bottom"><span class="cost">' +
      (level >= r.max ? 'MAXAD' : '✦ ' + price + ' stjärnstoft') + '</span><button class="btn small primary" data-buy-research="' + r.id + '" ' +
      (level >= r.max || s.stars < price ? 'disabled' : '') + '>Lås upp</button></div></article>';
  }).join('');
}
function renderPrestige() {
  const reward = prestigeReward();
  $('starDust').textContent = fmt(s.stars);
  $('prestigeRequirement').textContent = 'Krav: ' + fmt(prestigeRequirement()) + ' ben i denna omgång · Möjlig belöning: ' + reward + ' stjärnstoft';
  $('prestigeButton').disabled = reward < 1;
  renderResearch();
}
function renderAchievements() {
  $('achievementGrid').innerHTML = achievements.map(a => {
    const unlocked = s.achievements.includes(a.id);
    return '<article class="achievement-card ' + (unlocked ? 'unlocked' : '') + '"><div class="achievement-icon">' +
      (unlocked ? a.icon : '🔒') + '</div><div><b>' + a.name + '</b><small>' + a.desc + '</small></div></article>';
  }).join('');
  $('achievementCount').textContent = s.achievements.length + ' / ' + achievements.length;
}
function renderStats() {
  $('statLifetime').textContent = fmt(s.lifetime);
  $('statClicks').textContent = Math.floor(s.clicks).toLocaleString('sv-SE');
  $('statGenerators').textContent = totalGenerators().toLocaleString('sv-SE');
  $('statPets').textContent = totalPets().toLocaleString('sv-SE');
  const rows = generators.filter(g => genCount(g.id) > 0).map(g =>
    '<tr><td>' + g.name + '</td><td>' + fmt(g.output * genCount(g.id)) + ' / sek</td></tr>'
  );
  if (s.legacyPassive > 0) rows.push('<tr><td>Tidigare passiv produktion</td><td>' + fmt(s.legacyPassive) + ' / sek</td></tr>');
  if (autoIncome() > 0) rows.push('<tr><td>Automatiska klick</td><td>' + fmt(autoIncome()) + ' / sek</td></tr>');
  $('productionBreakdown').innerHTML = rows.length ?
    '<table class="table"><thead><tr><th>Källa</th><th>Grundproduktion</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' :
    '<div class="empty">Du har inte byggt någon produktion ännu.</div>';
}
function renderSettings() {
  const options = [
    ['sound','Ljudeffekter','Spela upp klick- och köpljud.'],
    ['reducedMotion','Minskade animationer','Minska rörelser och effekter.']
  ];
  $('settingsList').innerHTML = options.map(o =>
    '<div class="setting-row"><div><b>' + o[1] + '</b><small>' + o[2] + '</small></div>' +
    '<button class="toggle ' + (s.settings[o[0]] ? 'on' : '') + '" data-setting="' + o[0] + '" aria-label="' + o[1] + '"><i></i></button></div>'
  ).join('');
  document.body.classList.toggle('reduced-motion', !!s.settings.reducedMotion);
}
function renderBoost() {
  const active = s.boostUntil > Date.now();
  $('boostStatus').textContent = active ? 'AKTIV' : 'INGEN';
  $('boostPanel').textContent = active ?
    'Dubbel produktion aktiv i ' + Math.ceil((s.boostUntil - Date.now()) / 1000) + ' sekunder.' :
    'Köp en godisboost för att dubbla produktionen i 60 sekunder.';
  $('buyBoost').disabled = !canAfford(2500);
}
function renderAll() {
  renderTop(); renderLevel(); renderQuestList(); renderActivity(); renderUpgrades();
  renderGenerators(); renderPets(); renderPrestige(); renderAchievements();
  renderStats(); renderSettings(); renderBoost();
}
function renderOnlyTop() {
  renderTop(); renderLevel(); renderQuestList(); renderBoost();
  renderUpgrades(); renderGenerators(); renderPets(); renderPrestige();
  renderAchievements(); renderStats();
}
function afterAction() {
  checkAchievements();
  renderAll();
  save();
}
const pageMeta = {
  dashboard:['DOG EMPIRE / SPELÖVERSIKT','Din hundvärld'],
  upgrades:['DOG EMPIRE / FÖRBÄTTRA','Uppgraderingar'],
  producers:['DOG EMPIRE / PRODUKTION','Hundfabriken'],
  pets:['DOG EMPIRE / FLOCKEN','Hundkompisar'],
  prestige:['DOG EMPIRE / ÅTERFÖDELSE','Prestige & forskning'],
  achievements:['DOG EMPIRE / MILSTOLPAR','Prestationer'],
  statistics:['DOG EMPIRE / ANALYS','Spelstatistik'],
  settings:['DOG EMPIRE / SYSTEM','Inställningar']
};
function navigate(view) {
  if (!pageMeta[view]) return;
  activeView = view;
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === 'view-' + view));
  document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  $('eyebrow').textContent = pageMeta[view][0];
  $('pageTitle').textContent = pageMeta[view][1];
  window.scrollTo({top:0, behavior:s.settings.reducedMotion ? 'auto' : 'smooth'});
}
function exportSave() {
  const blob = new Blob([JSON.stringify(s, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dog-empire-save-' + today() + '.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  addLog('Sparfil exporterad.'); renderActivity();
}
function importSave(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') throw new Error('Ogiltig sparfil');
    s = migrateSave(parsed);
    save(); renderAll(); addLog('Sparfil importerad.'); renderActivity();
  } catch (error) {
    alert('Sparfilen kunde inte läsas. Kontrollera att den kommer från DOG EMPIRE.');
  }
}
function offlineEarnings() {
  const seconds = Math.max(0, Math.min(28800, Math.floor((Date.now() - num(s.savedAt, Date.now())) / 1000)));
  if (seconds < 10) return;
  const percent = Math.min(1, 0.5 + upLevel('offline') * 0.05 + researchLevel('offline') * 0.05);
  const earned = incomePerSecond() * seconds * percent;
  if (earned > 0) {
    addBones(earned);
    addLog('Välkommen tillbaka! Du tjänade ' + fmt(earned) + ' hundben offline.');
  }
}
function onClick(event) {
  const target = event && event.target;
  const button = target && typeof target.closest === 'function' ? target.closest('button') : null;
  if (!button) return;
  if (button.disabled) return;

  if (button.dataset.view) { navigate(button.dataset.view); return; }
  if (button.dataset.category) { activeCategory = button.dataset.category; renderUpgrades(); return; }
  if (button.dataset.buyUpgrade) { buyUpgrade(button.dataset.buyUpgrade); return; }
  if (button.dataset.buyGenerator) { buyGenerator(button.dataset.buyGenerator, num(button.dataset.amount, 1)); return; }
  if (button.dataset.buyPet) { buyPet(button.dataset.buyPet); return; }
  if (button.dataset.buyResearch) { buyResearch(button.dataset.buyResearch); return; }
  if (button.dataset.claimQuest) { claimQuest(button.dataset.claimQuest); return; }
  if (button.dataset.setting) {
    const key = button.dataset.setting;
    s.settings[key] = !s.settings[key];
    renderSettings(); save(); return;
  }

  switch (button.id) {
    case 'dogButton': clickDog(); break;
    case 'goldenButton': collectGolden(); break;
    case 'quickUpgrade': navigate('upgrades'); break;
    case 'quickProducer': navigate('producers'); break;
    case 'buyBoost': buyBoost(); break;
    case 'prestigeButton': doPrestige(); break;
    case 'soundQuick':
      s.settings.sound = !s.settings.sound;
      $('soundQuick').textContent = s.settings.sound ? '♫' : '♫̸';
      save(); break;
    case 'settingsQuick': navigate('settings'); break;
    case 'exportButton': exportSave(); break;
    case 'importButton': $('importFile').click(); break;
    case 'resetButton':
      if (confirm('Radera all speldata permanent?')) {
        localStorage.removeItem(SAVE_KEY);
        OLD_KEYS.forEach(key => localStorage.removeItem(key));
        location.reload();
      }
      break;
  }
}
function tick() {
  const now = Date.now();
  const elapsed = Math.min(3, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;
  if (elapsed > 0) {
    addBones(incomePerSecond() * elapsed);
    s.playSeconds += elapsed;
  }
  if (goldenUntil > 0 && now >= goldenUntil) {
    goldenUntil = 0;
    $('goldenButton').style.display = 'none';
  }
  if (!goldenUntil) maybeSpawnGolden();
  checkAchievements();
  renderTop(); renderLevel(); renderQuestList(); renderBoost();
  if (activeView === 'upgrades') renderUpgrades();
  if (activeView === 'producers') renderGenerators();
  if (activeView === 'pets') renderPets();
  if (activeView === 'prestige') renderPrestige();
  if (activeView === 'achievements') renderAchievements();
  if (activeView === 'statistics') renderStats();
  if (now - lastSave >= 5000) { save(); lastSave = now; }
}
function showFatal(error) {
  console.error('DOG EMPIRE failed:', error);
  const panel = $('fatalStatus');
  if (panel) {
    panel.hidden = false;
    panel.textContent = 'Spelet kunde inte starta: ' + (error && error.message ? error.message : String(error));
  }
}
function start() {
  if (started) return;
  started = true;
  try {
    load();
    offlineEarnings();
    document.addEventListener('click', onClick);
    $('importFile').addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      if (file) importSave(await file.text());
      event.target.value = '';
    });
    window.addEventListener('beforeunload', save);
    renderAll();
    addLog('DOG EMPIRE är redo. Klicka på hunden för att börja!');
    renderActivity();
    save();
    lastTick = Date.now();
    setInterval(tick, 500);
  } catch (error) {
    showFatal(error);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
else start();
})();