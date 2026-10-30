/* ============ 渲染 ============ */
const $ = id => document.getElementById(id);
let screen = 'title', tab = 'act';
S = load();
if (S) screen = 'game';

function lookOf(s) { const r = ROLES.find(r => r.id === s.roleId); return r && r.look; }
function render() { renderSide(); renderMain(); renderLog(); }
function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function deltaTags(ds) { return ds.map(d => `<span class="delta ${d.up ? 'up' : 'down'}">${d.t}</span>`).join(''); }
function bar(v, min, max, c, n = 10) {
  const k = Math.round((v - min) / (max - min) * n);
  return `<div class="bar">${Array.from({ length: n }, (_, i) => `<i class="seg" style="${i < k ? 'background:' + c : ''}"></i>`).join('')}</div>`;
}
// 侧栏的五维短板参照线：以当前最高可冲档次为准
function refTier(s) { const g = G(s); for (let t = 1; t <= 5; t++) if (g >= TGT[t] - 5) return t; return 5; }

function newGame(roleId) {
  const name = ($('nameInput') && $('nameInput').value.trim()) || '小保';
  S = makeState(roleId, name);
  screen = 'game'; tab = 'act';
  startMonth();
  addLog(`${name}（${S.role}）的大三开始了。`);
  save(); render();
}

function renderSide() {
  const el = $('side');
  if (!S || screen !== 'game') {
    el.innerHTML = `<div class="avatar-box"><canvas id="avatar" width="96" height="96"></canvas>
      <div class="who"><b>???</b><div>等待入学</div></div></div>
      <div class="divider"></div><div style="font-size:14px">选择你的身份，开始大三生活。<br><br>
      · 保研 / 支教 / 出国 / 大厂 / 考研，多条路线<br><br>
      存档自动保存在浏览器本地。</div>`;
    drawAvatar($('avatar'), 70); return;
  }
  const r = rank(S), dr = S.rankPrev - r, t = refTier(S), d = dims(S);
  let html = `<div class="avatar-box"><canvas id="avatar" width="96" height="96"></canvas>
    <div class="who"><b>${esc(S.name)}</b><div>${S.role}</div>
    <div><span class="badge post">${POSTS[S.post]}</span></div>
    <div>${S.m < MONTHS.length ? MONTHS[S.m].n : '终章'}</div><div class="money">¥${S.coins}</div></div></div>
    <div class="rankbox">
      <div class="row"><span>综测排名</span><span class="${r <= QUOTA ? 'up' : 'down'}">${r <= QUOTA ? '推免线内' : '推免线外'}</span></div>
      <div><span class="big">第 ${r}</span> / ${N}
        <span class="${dr > 0 ? 'up' : dr < 0 ? 'down' : ''}">${dr > 0 ? '▲' + dr : dr < 0 ? '▼' + (-dr) : '—'}</span></div>
      <div class="row" style="font-size:12px"><span>推免线：第 ${QUOTA} 名</span><span>加分 ${(S.bonus + POSTZ[S.post]).toFixed(1)}</span></div>
      <canvas id="rankChart" width="250" height="48"></canvas>
    </div>
    <span class="sec-title">推免硬门槛</span>
    <div class="gate">${gates(S).filter(g => g.k !== 'rank').map(g => `<span class="${g.ok ? 'ok' : 'no'}">${g.ok ? '✔' : '✘'} ${g.n.replace(/≥.*/, '')}</span>`).join('')}<span>体能 ${S.fit}</span></div>
    <div class="divider"></div>
    <span class="sec-title">五维考核 · 参照${TIER[t]}（红线=短板线）</span>
    ${Object.keys(DIMS).map(k => `<div class="dim ${d[k] < MIN[t] ? 'weak' : ''}"><span>${DIMS[k]}</span><div class="track"><div class="fill" style="width:${d[k]}%"></div><div class="mk" style="left:${MIN[t]}%"></div></div><span>${d[k]}</span></div>`).join('')}
    <div class="row" style="margin-top:4px"><span>综合竞争力</span><span><b>${G(S)}</b>（${tierHint(G(S))}）</span></div>
    <div class="divider"></div>`;
  for (const k in ATTRS) {
    const m = ATTRS[k], v = S.a[k];
    html += `<div class="stat"><div class="row"><span>${m.n}</span><span>${k === 'gpa' ? v.toFixed(2) : v}</span></div>${bar(v, m.min, k === 'mood' ? 100 : m.max, m.c)}</div>`;
  }
  html += `<div class="divider"></div>
    <div class="row"><span>四级 / 六级</span><span>${S.cert.cet4 || '—'} / ${S.cert.cet6 || '—'}</span></div>
    <div class="row"><span>雅思</span><span>${S.cert.ielts || '—'}</span></div>
    <div class="row"><span>保研真题 / 推荐信</span><span>×${S.zhenti} / ×${S.rec}</span></div>`;
  if (S.a.mood < 25) html += `<div class="warn">⚠ 心态濒临崩溃！</div>`;
  const tags = [];
  if (S.f.paper) tags.push('<span class="tag g">一作论文</span>');
  if (S.f.coauthor) tags.push('<span class="tag g">挂名论文</span>');
  if (S.f.award) tags.push('<span class="tag g">竞赛大奖</span>');
  if (S.f.dachuang) tags.push('<span class="tag g">国创项目</span>');
  if (S.f.cv) tags.push('<span class="tag">精修简历</span>');
  if (S.f.intel) tags.push('<span class="tag">情报</span>');
  if (S.f.taoci) tags.push('<span class="tag">套磁成功</span>');
  if (S.f.bigIntern) tags.push('<span class="tag b">大厂实习</span>');
  if (S.f.zj >= 1) tags.push(`<span class="tag b">研支团·${['', '已报名', '已入选', '已确认'][S.f.zj]}</span>`);
  if (S.f.agency) tags.push(`<span class="tag r">${S.f.agency === 2 ? '机构VIP' : '机构精修班'}</span>`);
  if (S.f.exaggerate) tags.push('<span class="tag r">简历注水</span>');
  if (S.f.punish) tags.push('<span class="tag r">处分</span>');
  if (S.fails) tags.push(`<span class="tag r">挂科×${S.fails}</span>`);
  if (S.f.buddy) tags.push('<span class="tag">学习搭子</span>');
  S.offers.slice().sort().forEach(t => tags.push(`<span class="tag y">${S.names[t]}·${TIER[t]}</span>`));
  if (tags.length) html += `<div class="tags">${tags.join('')}</div>`;
  el.innerHTML = html;
  drawAvatar($('avatar'), S.a.mood, lookOf(S));
  drawRankChart($('rankChart'), S);
}

function header() {
  const mo = MONTHS[Math.min(S.m, MONTHS.length - 1)];
  return `<span class="stage-label">${STAGES[mo.st].sub} · ${mo.n}</span>
    <div class="progress">${MONTHS.map((_, i) => `<i class="${i < S.m ? 'on' : i === S.m ? 'now' : ''}"></i>`).join('')}</div>`;
}
const TAGC = { 社交: 'var(--purple)', 随机: 'var(--red)', 专属: 'var(--orange)', 学工: '#e05d5d', 支教: 'var(--teal)', 面试: 'var(--blue)', 就业: 'var(--teal)', 出国: 'var(--green)' };
const RAND_SCENE = { study: 'class', sci: 'lab' };
function sceneOf(ev) { return ev.scene || (ev.tag === '专属' ? 'dorm' : pick(['dorm', 'canteen', 'phone', 'library'])); }

function renderMain() {
  const el = $('main');
  if (screen === 'title' || (!S && screen !== 'pick')) {
    const has = !!S;
    el.innerHTML = `<div class="title-screen">
      <canvas id="titleArt" width="140" height="40"></canvas>
      <div class="en">BAOYAN SIMULATOR v3</div>
      <div class="big-title">保研模拟器</div>
      <div class="sub-title">—— 大三求生记 · 短板会要命 ——</div>
      <div class="menu">
        ${has ? `<button class="btn center px" onclick="screen='game';render()">▶ 继续游戏</button>` : ''}
        <button class="btn center px" onclick="${has ? "if(confirm('开始新游戏会覆盖当前存档，确定吗？')){screen='pick';render()}" : "screen='pick';render()"}">★ 新的人生</button>
        <button class="btn center px alt" onclick="showGallery()">◆ 结局图鉴（${unlocked().length}/${Object.keys(ENDINGS).length}）</button>
        <button class="btn center px alt" onclick="showHelp()">？ 玩法说明</button>
      </div>
      <div class="press">PRESS START</div></div>`;
    drawTitleArt($('titleArt'));
    return;
  }
  if (screen === 'pick') {
    el.innerHTML = `<h2>创建角色</h2>
      <div>你的名字：<input id="nameInput" class="name-input px" maxlength="8" value="小保"></div>
      <p style="margin:14px 0 0">选择你的身份：</p>
      <div class="roles">${ROLES.map(r => `<button class="role px" onclick="newGame('${r.id}')"><b>${r.n}</b><p>${r.d}</p>
        <p class="pro">＋ ${r.pro}</p><p class="con">－ ${r.con}</p>
        ${r.a ? `<p class="nums">GPA ${r.a.gpa} · 基础${r.a.kn} · 英${r.a.eng} · 表达${r.a.oral} · 研${r.a.sci} · 赛${r.a.comp} · 学工${r.a.work} · ¥${r.coins}</p>` : ''}</button>`).join('')}</div>
      <button class="btn small px" style="margin-top:22px" onclick="screen='title';render()">← 返回</button>`;
    return;
  }
  if (S.phase === 'month') {
    const mo = MONTHS[S.m], newStage = S.m === 0 || MONTHS[S.m - 1].st !== mo.st;
    const r = rank(S), dr = S.rankPrev - r;
    let t = newStage ? STAGES[mo.st].desc + '\n\n' : '';
    if (S.m > 0) t += `生活费结余 +¥${allowance(S)}，钱包 ¥${S.coins}\n`;
    t += `本月排名：第 ${r} 名` + (S.m > 0 ? `（上月第 ${S.rankPrev} 名，${dr > 0 ? '▲上升 ' + dr : dr < 0 ? '▼下降 ' + (-dr) : '持平'}）` : '') + '\n';
    if (S.m > 0 && dr < 0) t += '同学们都在进步，不进则退。\n';
    const fails = gateFails(S).filter(g => g.k !== 'rank' && !(g.k === 'pe' && S.pe === null));
    if (fails.length && S.m >= 3 && S.m < 12) t += `⚠ 未达标的推免门槛：${fails.map(g => g.n).join('、')}\n`;
    t += `本月行动点：${S.ap}` + (S.penaltyShown ? `（项目占用 -${S.penaltyShown}）` : '') + (S.overheadShown ? `（${POSTS[S.post]}事务 -${S.overheadShown}）` : '');
    el.innerHTML = `${header()}<h2>${mo.n}</h2>
      <canvas class="scene" id="scene" width="${SW}" height="${SH}"></canvas>
      <div class="story" id="story"></div>
      <div id="choiceBox" hidden><button class="btn center px" onclick="proceed()">▶ 开始这个月</button></div>`;
    drawScene($('scene'), ['class', 'library', 'library', 'exam', 'library', 'home', 'class', 'lab', 'desk', 'crossroad', 'train', 'night', 'board', 'phone', 'night'][S.m]);
    typeText(t);
    return;
  }
  if (S.phase === 'event') {
    const ev = EV[S.cur], chs = val(ev.choices, S);
    el.innerHTML = `${header()}<h2>${ev.title}${ev.tag ? `<span class="ev-tag" style="background:${TAGC[ev.tag] || 'var(--ink)'}">${ev.tag}</span>` : ''}</h2>
      <canvas class="scene" id="scene" width="${SW}" height="${SH}"></canvas>
      <div class="story" id="story"></div>
      <div id="choiceBox" class="choices" hidden>${chs.map((c, i) => {
        const lock = c.req && !c.req(S);
        return `<button class="btn px ${lock ? 'locked' : ''}" onclick="choose(${i})"><span class="key">${i + 1}</span>${c.t}
          ${lock ? `<span class="hint">🔒${c.rq || ''}</span>` : c.h ? `<span class="hint">${c.h}</span>` : ''}</button>`;
      }).join('')}</div>`;
    drawScene($('scene'), sceneOf(ev));
    typeText(val(ev.text, S));
    return;
  }
  if (S.phase === 'result') {
    const r = S.result;
    el.innerHTML = `${header()}<h2>${r.title}</h2><div class="chosen">你选择了：${esc(r.choice)}</div>
      <div class="story" id="story"></div>
      <div id="choiceBox" class="choices" hidden>
        <div class="deltas">${deltaTags(r.deltas)}</div>
        <button class="btn center px" onclick="next()">▶ 继续</button></div>`;
    typeText(r.text || '……');
    return;
  }
  if (S.phase === 'plan') return renderPlan(el);
  if (S.phase === 'ending') {
    const e = ENDINGS[S.ending], u = unlocked();
    const cap = { tm: '推免服务系统 · 待录取通知', abroad: '录取邮件', job: '录用通知书', ky: '考研成绩查询', reject: '收件箱', bad: '……' }[e.shot];
    el.innerHTML = `<div class="ending">
      <span class="stage-label">THE END</span><br>
      <span class="rarity px ${e.r}" style="background:${e.c}">${e.r}</span>
      <h2>${e.t}</h2>
      <div class="desc px">${esc(e.d(S))}</div>
      <div class="shot-wrap px"><canvas id="offerShot" width="960" height="500"></canvas>
        <div class="shot-cap">📸 ${cap}（单位名称均为虚构，仅为游戏截图）</div></div>
      <button class="btn center px" onclick="saveShot()">⬇ 保存截图</button>
      <div class="summary">
        <div>GPA ${S.a.gpa.toFixed(2)}</div><div>排名 ${rank(S)}/${N}</div><div>综合 ${G(S)}</div><div>${POSTS[S.post]}</div>
        ${Object.entries(dims(S)).map(([k, v]) => `<div>${DIMS[k]} ${v}</div>`).join('')}
        <div>¥${S.coins}</div><div>决策 ${S.turns} 次</div><div>Offer ${S.offers.length} 个</div>
      </div>
      <p>已解锁结局：${u.length} / ${Object.keys(ENDINGS).length}</p>
      <button class="btn center px" onclick="screen='pick';render()">★ 再来一局</button>
      <button class="btn center px alt" onclick="showGallery()">◆ 结局图鉴</button></div>`;
    drawOffer($('offerShot'), S, S.ending);
  }
}

function saveShot() {
  const a = document.createElement('a');
  a.download = `保研模拟器-${ENDINGS[S.ending].t}.png`;
  a.href = $('offerShot').toDataURL('image/png');
  a.click();
}

function renderPlan(el) {
  const mo = MONTHS[S.m], r = rank(S), dr = S.rankPrev - r;
  let body = '';
  if (tab === 'act') {
    body = Object.entries(ACT_CAT).map(([cat, cn]) => `<div class="cat">${cn}</div><div class="grid">${ACTIONS.filter(a => a.cat === cat).map(a => {
      const avail = !a.cond || a.cond(S), ok = S.ap >= a.ap && avail;
      return `<button class="act px" ${ok ? '' : 'disabled'} onclick="doAction('${a.id}')"><span class="cost">${a.ap}点</span>
        <b>${a.n}</b><p>${avail ? a.d : '🔒' + val(a.lock, S)}</p></button>`;
    }).join('')}</div>`).join('');
  } else if (tab === 'social') {
    body = `<div class="grid">${NPCS.map(n => {
      const v = S.aff[n.id], ok = socialOk(S, n.id);
      return `<div class="npc px"><div class="npc-top"><div class="npc-face px" style="background:${n.color}">${n.n[0]}</div>
        <div><b>${n.n}</b> <span class="tag">${n.type}</span><div class="row"><span>好感</span><span>${v}</span></div></div></div>
        ${bar(v, 0, 100, n.color)}<p>${n.d}</p>
        ${n.perks.map(([th, t]) => `<div class="perk ${v >= th ? 'done' : ''}">${t}</div>`).join('')}
        ${ok ? '' : '<p>🔒 科研≥10 才能约到孙导</p>'}
        <div class="npc-btns"><button ${S.ap >= 1 && ok ? '' : 'disabled'} onclick="social('${n.id}','chat')">聊天(1点)</button>
        <button ${S.ap >= 1 && S.coins >= 80 && ok ? '' : 'disabled'} onclick="social('${n.id}','treat')">请吃饭(1点 ¥80)</button></div></div>`;
    }).join('')}</div>`;
  } else {
    body = `<p style="margin-top:0">"同学，保研是信息战！我们机构往届学员 98% 上岸！"——机构顾问<br><span style="font-size:13px">（不占行动点，但价格不菲。没有结果的话……你懂的）</span></p>` +
      AGENCY.map(p => {
        const owned = (S.f.agency || 0) >= p.lv;
        const price = p.price - (p.lv === 2 && S.f.agency === 1 ? AGENCY[0].price : 0);
        return `<div class="agency px"><b>${p.n}</b> <span class="price">¥${price}</span>${p.lv === 2 && S.f.agency === 1 ? '（已抵扣精修班费用）' : ''}
          <div style="white-space:pre-wrap;font-size:14px">${p.perks}</div>
          <button class="btn center px" ${owned || S.coins < price || S.m > 11 ? 'disabled' : ''} onclick="buyAgency(${p.lv})">${owned ? '已购买' : S.coins < price ? '金币不足' : '购买'}</button></div>`;
      }).join('');
  }
  el.innerHTML = `${header()}<h2>${mo.n} · 月度计划</h2>
    <div class="plan-head"><span class="ap">行动点 ${Array.from({ length: Math.max(mo.ap, S.ap) }, (_, i) => `<i class="${i < S.ap ? '' : 'off'}"></i>`).join('')}</span>
      <span>金币 <b>¥${S.coins}</b></span>
      <span>排名 <b>第 ${r} 名</b> <span class="${dr > 0 ? 'up' : dr < 0 ? 'down' : ''}">${dr > 0 ? '▲' + dr : dr < 0 ? '▼' + (-dr) : ''}</span></span>
      <span>综合 <b>${G(S)}</b></span><span>志愿 <b>${S.vol}h</b></span></div>
    <div class="tabs">
      <button class="tab px ${tab === 'act' ? 'on' : ''}" onclick="tab='act';render()">行动</button>
      <button class="tab px ${tab === 'social' ? 'on' : ''}" onclick="tab='social';render()">社交</button>
      <button class="tab px ${tab === 'agency' ? 'on' : ''}" onclick="tab='agency';render()">保研机构</button>
    </div>
    ${body}
    ${S.feed.length ? `<div class="feed">${S.feed.map(f => `<div>${esc(f.t)}<div class="deltas">${deltaTags(f.d)}</div></div>`).join('')}</div>` : ''}
    <button class="btn center px" onclick="finishMonthClick()">${S.ap > 0 ? '结束本月 ▶' : '行动点用完了，进入下个月 ▶'}</button>`;
}

function finishMonthClick() {
  if (S.ap > 0 && !confirm(`还有 ${S.ap} 个行动点没用，确定结束本月吗？`)) return;
  endMonth();
}

function renderLog() {
  const el = $('logbox');
  if (!S || screen !== 'game') { el.innerHTML = '<h3>▼ 人生日志</h3><div class="log-item">暂无记录</div>'; return; }
  el.innerHTML = '<h3>▼ 人生日志</h3>' + S.log.map(l => `<div class="log-item"><span>[${l.st}]</span> ${esc(l.t)}</div>`).join('');
}

/* 打字机效果：点击文字可跳过 */
let typer = null;
function typeText(text) {
  clearInterval(typer);
  const el = $('story'), box = $('choiceBox');
  let i = 0;
  el.classList.add('cursor');
  const done = () => { clearInterval(typer); typer = null; el.textContent = text; el.classList.remove('cursor'); box.hidden = false; };
  el.onclick = done;
  typer = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) done(); }, 22);
}
function shake() { const m = $('main'); m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); }

/* ============ 弹窗 / 菜单 ============ */
function modal(html) { $('modalBody').innerHTML = html; $('modal').hidden = false; }
function closeModal() { $('modal').hidden = true; }
$('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };

function showGallery() {
  const u = unlocked();
  modal(`<h2>结局图鉴（${u.length}/${Object.keys(ENDINGS).length}）</h2>
    <div class="gallery">${Object.entries(ENDINGS).map(([id, e]) => u.includes(id)
      ? `<div class="g-item px"><span class="tag" style="background:${e.c}">${e.r}</span> <b>${e.t}</b></div>`
      : `<div class="g-item px lock"><span class="tag">?</span> <b>？？？</b></div>`).join('')}</div>
    <button class="btn center px" onclick="closeModal()">关闭</button>`);
}
function showHelp() {
  modal(`<h2>玩法说明</h2><div class="help">
    <p>■ 每月用<b>行动点</b>安排学习、科研、竞赛、学生工作、兼职、社交。职务越高，例会越多，每月固定占用的行动点也越多。</p>
    <p>■ <b>推免资格</b> = 综测排名前 ${QUOTA} <b>且</b> 四级≥425、无挂科、体测合格、志愿≥30h、无处分。任何一条不过，排名再高也没用。</p>
    <p>■ <b>院校考核</b>看五维：绩点 / 竞赛科研 / 面试 / 英语 / 材料。综合分取<b>几何平均</b>，任何一维低于该档院校的短板线，录取率直接打折。</p>
    <p>■ 夏令营面试分四轮：英文自我介绍 → 专业问答 → 科研追问 → 压力面，每轮的选择都会计分。</p>
    <p>■ <b>学生工作线</b>：班委 → 院学生会干事 → 部长 → 院主席 → 校主席，逐级竞选。</p>
    <p>■ <b>支教保研</b>：大三下 4 月报名研究生支教团，过面试、体检政审后锁定单列名额。</p>
    <p>■ 其他出路：出国（雅思+申请）、互联网大厂（暑期实习→转正 / 秋招）、考研。</p>
    <p>■ 快捷键：数字键选择选项，空格 / 回车继续。</p></div>
    <button class="btn center px" onclick="closeModal()">关闭</button>`);
}
function showMenu() {
  modal(`<h2>菜单</h2>
    <button class="btn center px" onclick="closeModal();screen='title';render()">返回标题</button>
    <button class="btn center px" onclick="if(confirm('确定放弃当前进度，重新开始吗？')){closeModal();screen='pick';render()}">重新开始</button>
    <button class="btn center px" onclick="if(confirm('确定删除存档吗？结局图鉴会保留。')){S=null;save();closeModal();screen='title';render()}">删除存档</button>
    <button class="btn center px alt" onclick="showHelp()">玩法说明</button>
    <button class="btn center px alt" onclick="closeModal()">关闭</button>`);
}
$('btnMenu').onclick = showMenu;
$('btnGallery').onclick = showGallery;

document.addEventListener('keydown', e => {
  if (!$('modal').hidden || screen !== 'game' || !S || e.target.tagName === 'INPUT') return;
  const box = $('choiceBox');
  if (typer && (e.key === ' ' || e.key === 'Enter')) { $('story').onclick(); e.preventDefault(); return; }
  if (!box || box.hidden) return;
  if (S.phase === 'event' && /^[1-9]$/.test(e.key)) choose(+e.key - 1);
  else if ((e.key === ' ' || e.key === 'Enter') && (S.phase === 'result' || S.phase === 'month')) {
    e.preventDefault(); S.phase === 'result' ? next() : proceed();
  }
});

render();
