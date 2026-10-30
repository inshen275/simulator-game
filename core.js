/* ============ 工具 ============ */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const roll = p => Math.random() < p;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const sig = x => 1 / (1 + Math.exp(-x));
const val = (x, s) => typeof x === 'function' ? x(s) : x;

/* ============ 数值 ============ */
const GROW_MUL = { xueba: { kn: 1.3 }, jingsai: { comp: 1.3 }, ganbu: { work: 1.4 } };
function moodCap(s) { return s.roleId === 'xueba' ? 85 : 100; }

function A(s, d) {
  for (const k in d) {
    let x = d[k];
    if (k === 'mood' && x < 0) {
      x *= .85;
      if (s.roleId === 'xiaozhen') x *= .75;            // 心态韧性
      if (s.roleId === 'xueba' && s.a.mood < 40) x *= 1.25; // 越焦虑掉得越快
    }
    if (k === 'oral' && x > 0 && s.roleId === 'xueba') x *= .7;
    const m = ATTRS[k], max = k === 'mood' ? moodCap(s) : m.max;
    const v = clamp(s.a[k] + x, m.min, max);
    s.a[k] = k === 'gpa' ? Math.round(v * 100) / 100 : Math.round(v);
  }
}
// 边际递减的成长
function grow(s, k, base) {
  const mul = (GROW_MUL[s.roleId] || {})[k] || 1;
  A(s, { [k]: Math.max(1, Math.round(base * mul * (1 - s.a[k] / 130))) });
}
function aff(s, id, d) { s.aff[id] = clamp(s.aff[id] + d, 0, 100); }

/* 推免排名：综测 = GPA 折算 + 竞赛科研加分 + 学生职务加分；同学们也在进步 */
function tui(s) { return s.a.gpa * 22.5 + s.bonus + POSTZ[s.post]; }
function classMean(s) { return 77.3 + s.m * .22 + (s.f.rival || 0) * .5; }
const SPREAD = 4.5;
function Phi(z) { return sig(1.702 * z); }
function rank(s) { return clamp(Math.round((1 - Phi((tui(s) - classMean(s)) / SPREAD)) * N) + 1, 1, N); }
function lineGpa(s) { const p = 1 - (QUOTA - 1) / N; return (classMean(s) + Math.log(p / (1 - p)) / 1.702 * SPREAD - s.bonus - POSTZ[s.post]) / 22.5; }

/* 推免资格硬门槛：任何一条不满足都会被卡 */
function gates(s) {
  const c = s.cert, r = rank(s);
  return [
    { k: 'rank', n: `综测排名前 ${QUOTA}`, ok: r <= QUOTA, v: `第 ${r} 名` },
    { k: 'cet4', n: '四级≥425', ok: c.cet4 >= 425 || c.ielts >= 6, v: c.cet4 ? `${c.cet4} 分` : '未通过' },
    { k: 'fail', n: '无挂科', ok: s.fails === 0, v: s.fails ? `挂科 ${s.fails} 门` : '无' },
    { k: 'pe', n: '体测合格', ok: s.pe === 1, v: s.pe === 1 ? '合格' : s.pe === 0 ? '不合格' : '未测' },
    { k: 'vol', n: '志愿≥30h', ok: s.vol >= 30, v: `${s.vol}h` },
    { k: 'clean', n: '无处分', ok: !s.f.punish, v: s.f.punish ? '有处分' : '无' },
  ];
}
function gateFails(s) { return gates(s).filter(g => !g.ok); }
function qualified(s) { return !gateFails(s).length; }

/* 五维考核：绩点 / 竞赛科研 / 面试 / 英语 / 材料 */
function dims(s) {
  const a = s.a, f = s.f, c = s.cert;
  const hi = Math.max(a.comp, a.sci), lo = Math.min(a.comp, a.sci);
  const d = {
    gpa: (a.gpa - 2.8) / 1.2 * 100,
    ach: hi * .6 + lo * .25 + s.bonus * 5 + (f.paper ? 12 : 0),
    iv:  a.kn * .4 + a.oral * .4 + a.sci * .15 + Math.min(s.zhenti, 3) * 3,
    eng: a.eng * .7 + (c.cet6 >= 550 ? 20 : c.cet6 >= 425 ? 10 : c.cet4 >= 425 ? 3 : 0) + (c.ielts >= 7 ? 25 : c.ielts >= 6.5 ? 18 : c.ielts >= 6 ? 10 : 0),
    mat: 15 + (f.cv ? 18 : 0) + s.rec * 12 + (f.exaggerate ? 8 : 0) + (f.agency ? 8 : 0) + POSTZ[s.post] * 5 + a.work * .15 + s.bonus * 3 + (f.paper ? 10 : 0) - (s.makeups || 0) * 10,
  };
  for (const k in d) d[k] = Math.round(clamp(d[k], 0, 100));
  return d;
}
// 综合分：五维几何平均——偏科的收益会被短板拖垮
function G(s) { const d = dims(s); return Math.round(Math.exp(Object.values(d).reduce((x, v) => x + Math.log(Math.max(v, 5)), 0) / 5)); }
function weak(s, t) { const d = dims(s); return Object.keys(d).filter(k => d[k] < MIN[t]); }
function chance(s, t, b = 0) {
  let p = sig((G(s) + b - TGT[t]) / 5) * Math.pow(.25, weak(s, t).length);
  if (s.a.mood < 30) p *= .8;
  return clamp(p, .02, .95);
}
function hint(p) { return p > .7 ? '把握较大' : p > .4 ? '有希望' : p > .15 ? '很悬' : '做梦'; }
function tierHint(g) { return g >= TGT[1] ? '清北有戏' : g >= TGT[2] ? '华五可冲' : g >= TGT[3] ? '985 稳中求进' : g >= TGT[4] ? '211 可保' : g >= TGT[5] ? '本校保底' : '危险边缘'; }
function weakTxt(s, t) { const w = weak(s, t); return w.length ? '短板：' + w.map(k => DIMS[k]).join('、') : ''; }

function best(s) { return s.offers.length ? Math.min(...s.offers) : 0; }
function schoolName(s, t) { if (!s.names[t]) s.names[t] = pick(SCHOOL[t]); return s.names[t]; }
function gain(s, t) { if (!s.offers.includes(t)) { s.offers.push(t); schoolName(s, t); } }
function offerTxt(s) { return s.offers.slice().sort().map(t => `${s.names[t]}（${TIER[t]}）`).join('、'); }
function campCost(s, t) { return s.f.reimb && s.f.reimb.includes(t) ? Math.round(COST[t] * .3) : COST[t]; }
function maxSenior(s) { return Math.max(...SENIORS.map(id => s.aff[id])); }

function cet4Score(s, b = 0) { return Math.round(clamp(330 + s.a.eng * 3.2 + rnd(-35, 35) + b, 300, 680)); }
function cet6Score(s, b = 0) { return Math.round(clamp(290 + s.a.eng * 3.3 + rnd(-35, 35) + b, 280, 660)); }
function ieltsScore(s, b = 0) { return clamp(Math.round((4.3 + s.a.eng / 28 + rnd(-.5, .5) + b) * 2) / 2, 4, 8.5); }

/* 考研 / 出国 / 求职 */
function kyP(s, th, b = 0) { let p = sig((s.a.kn + b - th) / 6); if (s.a.mood < 30) p *= .8; return clamp(p, .03, .95); }
function abroadScore(s, b = 0) {
  const d = dims(s);
  return d.gpa * .35 + d.ach * .2 + s.a.intern * .1 + s.rec * 5 + (s.cert.ielts || 0) * 6 - 30 + b;
}
function jobScore(s, b = 0) { return s.a.intern * .45 + s.a.kn * .25 + s.a.oral * .15 + s.a.comp * .2 + (s.f.bigIntern ? 12 : 0) + b; }

function snap(s) { return { rank: rank(s), ...s.a, coins: s.coins, bonus: s.bonus, zhenti: s.zhenti, rec: s.rec, vol: s.vol }; }
function diffs(b, s) {
  const a = snap(s), out = [];
  for (const k in a) {
    const d = a[k] - b[k];
    if (Math.abs(d) < .001) continue;
    if (k === 'rank') out.push({ t: `排名 ${d < 0 ? '▲' : '▼'}${Math.abs(d)}`, up: d < 0 });
    else out.push({ t: `${LABEL[k]} ${d > 0 ? '+' : ''}${k === 'gpa' ? d.toFixed(2) : k === 'bonus' ? d.toFixed(1) : d}${k === 'vol' ? 'h' : ''}`, up: d > 0 });
  }
  return out;
}
const dtxt = ds => ds.map(d => d.t).join(' ');

/* ============ 新游戏 ============ */
let S = null;
function makeState(roleId, name) {
  let role = ROLES.find(r => r.id === roleId), hidden = null;
  if (!role.a) {
    // 随机人生：随机抽一个真实身份，再整体浮动
    hidden = pick(ROLES.filter(r => r.a));
    role = { ...hidden, a: { ...hidden.a } };
    for (const k in role.a) role.a[k] = k === 'gpa' ? Math.round(clamp(role.a[k] + rnd(-.12, .12), 3, 3.85) * 100) / 100 : Math.round(clamp(role.a[k] + rnd(-8, 8), 0, 95));
    role.coins = Math.round(role.coins * rnd(.6, 1.5));
  }
  return {
    v: 3, name, roleId: role.id, role: hidden ? `随机·${role.n}` : role.n,
    a: { ...role.a }, coins: role.coins, bonus: role.bonus, zhenti: 0, rec: role.id === 'keyan' ? 0 : 0,
    post: role.post, cert: { cet4: 0, cet6: 0, ielts: 0, ...role.cert }, fails: 0, makeups: 0, pe: null,
    fit: role.id === 'xiaozhen' ? 32 : 25, vol: role.id === 'ganbu' ? 24 : 6,
    aff: Object.fromEntries(NPCS.map(n => [n.id, n.id === 'sun' && role.id === 'keyan' ? 30 : n.id === 'zhao' && role.id === 'ganbu' ? 30 : n.aff])),
    gifted: {}, names: {}, f: {}, offers: [], m: 0, ap: 0, apPenalty: 0, queue: [], cur: null, phase: 'month',
    result: null, feed: [], cd: {}, log: [], rankHist: [], ending: null, turns: 0, ivAdj: 0,
  };
}
function allowance(s) { return { fuer: 1200, keyan: 400, xiaozhen: 400 }[s.roleId] || 600; }
function postOverhead(s) { if (s.m >= 12) return 0; return s.post >= 4 ? 1 : s.post === 3 ? s.m % 2 : 0; }

/* ============ 流程 ============ */
function addLog(t) { S.log.unshift({ st: S.m < MONTHS.length ? MONTHS[S.m].n : '终章', t }); S.log = S.log.slice(0, 150); }

function startMonth() {
  const mo = MONTHS[S.m];
  const oh = postOverhead(S);
  S.ap = Math.max(0, mo.ap - S.apPenalty - oh);
  S.penaltyShown = S.apPenalty; S.overheadShown = oh; S.apPenalty = 0;
  if (S.m > 0) {
    S.coins += allowance(S);
    if (S.post >= 2 && S.m < 12) A(S, { work: 2 });          // 例会、值班
    if (S.roleId === 'ganbu' && S.m < 12) A(S, { mood: -3 });  // 杂事缠身
  }
  const r = rank(S);
  S.rankPrev = S.rankHist.length ? S.rankHist[S.rankHist.length - 1] : r;
  S.rankHist.push(r);
  S.feed = [];
  // 本月事件队列：主线 → 社交触发 → 随机
  const q = [...mo.ev];
  SENIORS.forEach(id => { if (S.aff[id] >= 30 && !S.gifted[id]) { S.gifted[id] = 1; q.push('gift_' + id); } });
  ['wang', 'li', 'zhang'].forEach(id => { if (S.aff[id] >= 40 && !S.gifted[id]) { S.gifted[id] = 1; q.push('bond_' + id); } });
  if (S.m > 0 && S.m < 12) {
    const n = (roll(.85) ? 1 : 0) + (roll(.4) ? 1 : 0);
    for (let i = 0; i < n; i++) { const id = drawRandom(S); if (id) { S.cd[id] = S.m + (RANDOM[id].cd || 5); q.splice(i === 0 ? 0 : q.length, 0, id); } }
  }
  S.queue = q;
  S.phase = 'month';
}

function drawRandom(s) {
  const st = MONTHS[s.m].st;
  const pool = Object.entries(RANDOM).filter(([id, e]) =>
    (s.cd[id] || 0) <= s.m && (!e.role || e.role === s.roleId) && (!e.st || e.st.includes(st)) && (!e.cond || e.cond(s)));
  const tot = pool.reduce((x, [, e]) => x + (e.w || 1), 0);
  let r = Math.random() * tot;
  for (const [id, e] of pool) { r -= e.w || 1; if (r <= 0) return id; }
  return null;
}

function proceed() {
  if (S.f.collapse || S.f.misconduct) return finish();
  if (S.f.track && !S.f.trackQ) { S.f.trackQ = 1; S.queue = [...TRACKS[S.f.track]]; }
  while (S.queue.length) {
    const id = S.queue.shift();
    if (!EV[id] || (EV[id].cond && !EV[id].cond(S))) continue;
    S.cur = id; S.phase = 'event'; save(); render(); return;
  }
  S.cur = null;
  if (S.f.track) return finish();
  if (S.ap > 0) { S.phase = 'plan'; save(); render(); return; }
  endMonth();
}

function endMonth() {
  S.m++;
  if (S.m >= MONTHS.length) return finish();
  startMonth(); save(); render();
}

function choose(i) {
  const ev = EV[S.cur], ch = val(ev.choices, S)[i];
  if (!ch || (ch.req && !ch.req(S))) return;
  const before = snap(S);
  if (ch.d) A(S, ch.d);
  let text = ch.r || '';
  if (ch.fx) { const t = ch.fx(S); if (t) text = t; }
  if (S.a.mood <= 0) { S.f.collapse = 1; text += '\n\n……你的心态彻底崩了。'; }
  const ds = diffs(before, S);
  S.result = { title: ev.title, choice: ch.t, text, deltas: ds };
  S.turns++;
  addLog(`【${ev.title}】${ch.t}${ds.length ? ' → ' + dtxt(ds) : ''}`);
  S.phase = 'result';
  save(); render();
  if (ds.some(d => d.t.startsWith('心态') && !d.up && parseInt(d.t.slice(3)) <= -10)) shake();
}

function doAction(id) {
  const a = ACTIONS.find(x => x.id === id);
  if (S.ap < a.ap || (a.cond && !a.cond(S))) return;
  const before = snap(S);
  S.ap -= a.ap;
  const t = a.run(S);
  afterPlan(`【${a.n}】${t}`, before);
}

function social(id, kind) {
  const n = npc(id), cost = kind === 'treat' ? 80 : 0;
  if (S.ap < 1 || S.coins < cost || !socialOk(S, id)) return;
  const before = snap(S);
  S.ap--; S.coins -= cost;
  const g = kind === 'treat' ? 14 : 7 + Math.floor(Math.random() * 4);
  aff(S, id, g); A(S, { mood: kind === 'treat' ? 4 : 2 });
  if (SENIOR_ATTR[id]) grow(S, SENIOR_ATTR[id], 2);
  afterPlan(`【${kind === 'treat' ? '请吃饭' : '聊天'}·${n.n}】${kind === 'treat' ? '你们在校门口吃了顿烤肉。' : pick(CHAT[id])}（好感+${g}）`, before);
}
function socialOk(s, id) { return id === 'sun' ? s.a.sci >= 10 : true; }

function buyAgency(lv) {
  const pkg = AGENCY.find(p => p.lv === lv);
  const price = pkg.price - (lv === 2 && S.f.agency === 1 ? AGENCY[0].price : 0);
  if ((S.f.agency || 0) >= lv || S.coins < price) return;
  if (typeof confirm === 'function' && !confirm(`确定花费 ¥${price} 购买【${pkg.n}】吗？`)) return;
  const before = snap(S);
  S.coins -= price;
  S.f.cv = 1; S.f.intel = 1;
  if (lv === 2) { S.zhenti += 2; A(S, { oral: 8 }); }
  S.f.agency = lv;
  afterPlan(`【保研机构】购买了${pkg.n}。顾问："同学，保研是信息战！"`, before);
}

function afterPlan(text, before) {
  const ds = diffs(before, S);
  S.feed.unshift({ t: text, d: ds });
  addLog(text + (ds.length ? ' → ' + dtxt(ds) : ''));
  S.turns++;
  if (S.a.mood <= 0) { S.f.collapse = 1; return finish(); }
  save(); render();
}

function next() { proceed(); }

function finish() {
  S.ending = calcEnding(S);
  S.phase = 'ending'; S.cur = null;
  unlock(S.ending);
  addLog(`达成结局：${ENDINGS[S.ending].t}`);
  save(); render();
}

function calcEnding(s) {
  const f = s.f;
  if (f.collapse) return 'collapse';
  if (f.misconduct) return 'misconduct';
  if (f.oversleep) return 'oversleep';
  if (f.pigeon) return 'pigeon';
  if (f.final) {
    f.school = s.names[f.final] || schoolName(s, f.final);
    if (f.zjFinal) return 'zhijiao';
    if (f.final === 1 && f.paper) return 'scholar';
    if (f.phd) return 'phd';
    if (s.post >= 4 && f.final <= 3) return 'chairman';
    return ['', 'qingbei', 'huawu', 'mid985', 's211', 'local'][f.final];
  }
  const tr = f.track || 'kaoyan', res = f.res || 'fail';
  if (res === 'fail') {
    if (f.agency) return 'leek';
    if (f.gateFail && rank(s) <= QUOTA) return 'gatekeeper';
    if (s.a.mood >= 85) return 'happy';
    return { kaoyan: 'kaoyan_fail', abroad: 'abroad_fail', job: 'job_fail' }[tr];
  }
  if (tr === 'kaoyan') return res === 'top' ? 'kaoyan_top' : 'kaoyan_ok';
  if (tr === 'abroad') return { us: 'abroad_us', uk: 'abroad_uk', ok: 'abroad_ok' }[res];
  return { sp: 'job_sp', big: 'job_big', mid: 'job_mid', soe: 'job_soe' }[res];
}

/* ============ 存档 ============ */
const store = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem() {}, removeItem() {} };
function load() { try { const s = JSON.parse(store.getItem(KEY)); return s && s.v === 3 ? s : null; } catch (e) { return null; } }
function save() { try { if (S) store.setItem(KEY, JSON.stringify(S)); else store.removeItem(KEY); } catch (e) {} }
function unlocked() { try { return JSON.parse(store.getItem(GKEY)) || []; } catch (e) { return []; } }
function unlock(id) { try { const u = unlocked(); if (!u.includes(id)) { u.push(id); store.setItem(GKEY, JSON.stringify(u)); } } catch (e) {} }
