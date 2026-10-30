/* ============ 像素绘图 ============ */

/* 像素小人：24×24 无性别造型（蓬松短发 + 连帽卫衣）
 * 只画左半边 12 列，右半边镜像，保证对称；发色/衣服/配饰按身份变化，表情随心态变化
 * o 描边  h 头发  H 头发高光  k 头发暗部  s 皮肤  S 皮肤阴影  w 眼白  e 瞳孔  b 腮红位
 * c 衣服  C 衣服暗部  l 衣服亮部  t 帽绳  n 脖子
 */
const AVATAR_HALF = [
  '........oooo',
  '......oohhhh',
  '....oohhHHhh',
  '...ohhHHhhhh',
  '...ohhhhhhhh',
  '..ohhhhhhkhh',
  '..ohhhkhhhhk',
  '..ohhkssshhs',
  '..ohksssssss',
  '..ohsskkksss',
  '..ohsswwesss',
  '..okssweesss',
  '...osbbsssss',
  '...ossssss??',
  '....oSssss??',
  '.....oosssss',
  '.......oonnn',
  '.....ooCcCnn',
  '...ooccclCcc',
  '..occccclcct',
  '..oCccccclct',
  '.oCcccccccct',
  '.oCcccccccCC',
  '.ooooooooooo',
];
const AVATAR = AVATAR_HALF.map(r => r + [...r].reverse().join(''));
// 嘴（第 13、14 行中间 2+2 列）：开心 / 一般 / 难过
const MOUTH = { happy: ['mssm', 'smms'], ok: ['ssss', 'smms'], sad: ['smms', 'mssm'] };

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = v => clamp(Math.round(v * k), 0, 255);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join('');
}
function drawAvatar(cv, mood, look) {
  if (!cv) return;
  const ctx = cv.getContext('2d'), P = cv.width / 24;
  look = look || { h: '#3a2c2c', b: '#4d96ff' };
  const dark = parseInt(look.h.slice(1), 16) < 0x333333;
  const face = mood >= 60 ? 'happy' : mood >= 30 ? 'ok' : 'sad';
  const col = {
    o: '#1f1d36', h: look.h, H: dark ? '#55536e' : shade(look.h, 1.5), k: dark ? '#111' : shade(look.h, .65),
    s: '#f5c9a0', S: '#dfa57a', n: '#dfa57a', w: '#ffffff', e: '#22223b',
    b: mood >= 70 ? '#ffa5b5' : '#f5c9a0', m: '#9c3d3d',
    c: look.b, C: shade(look.b, .7), l: shade(look.b, 1.3), t: '#f6ecd2',
  };
  ctx.clearRect(0, 0, cv.width, cv.height);
  const px = (x, y, c) => { if (c) { ctx.fillStyle = c; ctx.fillRect(x * P, y * P, P, P); } };
  AVATAR.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '?') ch = MOUTH[face][y - 13][x - 10];
    px(x, y, col[ch]);
  }));
  // 眉毛：心态低时下垂
  const brow = col.k;
  if (face === 'sad') { px(6, 9, col.s); px(17, 9, col.s); px(6, 8, brow); px(17, 8, brow); }
  // 配饰
  const f = '#22223b';
  if (look.acc === 'glasses') {
    for (const x0 of [5, 13]) { for (let i = 0; i < 6; i++) { px(x0 + i, 9, f); px(x0 + i, 12, f); } px(x0, 10, f); px(x0, 11, f); px(x0 + 5, 10, f); px(x0 + 5, 11, f); }
    px(11, 10, f); px(12, 10, f);
  }
  if (look.acc === 'headphones') {
    for (let x = 5; x < 19; x++) px(x, 1, f);
    px(4, 2, f); px(19, 2, f); px(3, 3, f); px(20, 3, f);
    for (let y = 8; y < 13; y++) { px(1, y, f); px(22, y, f); }
    for (let y = 9; y < 12; y++) { px(2, y, '#e94560'); px(21, y, '#e94560'); }
  }
  if (look.acc === 'badge') { px(7, 19, '#f9c74f'); px(8, 19, '#e94560'); px(7, 20, '#e94560'); px(8, 20, '#f9c74f'); }
  if (look.acc === 'pencil') { px(19, 3, '#f9c74f'); px(20, 2, '#f9c74f'); px(21, 1, '#e94560'); px(18, 4, '#f5c9a0'); }
  if (look.acc === 'clip') { px(6, 3, '#ff70a6'); px(7, 3, '#ff70a6'); px(7, 4, '#ff70a6'); }
  if (look.acc === 'scarf') { for (let x = 6; x < 18; x++) px(x, 16, x % 2 ? '#e94560' : '#c0392b'); px(7, 17, '#e94560'); px(7, 18, '#c0392b'); }
  if (mood < 30) { px(20, 6, '#8ecae6'); px(20, 7, '#8ecae6'); px(19, 7, '#8ecae6'); }
  if (mood >= 85) { px(21, 3, '#f9c74f'); px(22, 2, '#f9c74f'); px(20, 2, '#f9c74f'); px(21, 1, '#f9c74f'); }
}

/* 排名走势：柱子越高排名越靠前，虚线为推免线 */
function drawRankChart(cv, s) {
  if (!cv) return;
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const hist = [...s.rankHist.slice(0, -1), rank(s)];
  const bw = Math.floor(W / MONTHS.length);
  const yOf = r => Math.round((r - 1) / (N - 1) * (H - 4));
  hist.forEach((r, i) => { ctx.fillStyle = r <= QUOTA ? '#43aa8b' : '#e94560'; const y = yOf(r); ctx.fillRect(i * bw + 1, y, bw - 3, H - y); });
  ctx.fillStyle = '#f9c74f';
  const ly = yOf(QUOTA);
  for (let x = 0; x < W; x += 8) ctx.fillRect(x, ly, 4, 2);
}

/* ---- 场景小图：128×32 低分辨率，CSS 放大 ---- */
const SW = 128, SH = 32;
function R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function person(c, x, y, shirt, hair = '#2b2b2b') {
  R(c, hair, x, y, 4, 2); R(c, '#f5c9a0', x, y + 2, 4, 3); R(c, '#22223b', x + 1, y + 3, 1, 1); R(c, '#22223b', x + 3, y + 3, 1, 1);
  R(c, shirt, x - 1, y + 5, 6, 5); R(c, '#3f3a64', x, y + 10, 4, 3);
}
function window_(c, x, y, sky) { R(c, '#5b4636', x - 1, y - 1, 16, 12); R(c, sky, x, y, 14, 10); R(c, '#5b4636', x + 6, y, 2, 10); }
function shelf(c, x, y, w) {
  R(c, '#6b4a2f', x, y, w, 20);
  const cols = ['#e94560', '#4d96ff', '#f9c74f', '#43aa8b', '#9b5de5', '#f8961e'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < w - 2; i += 2) R(c, cols[(i + r * 3) % cols.length], x + 1 + i, y + 1 + r * 6, 1, 5 - (i % 3 ? 1 : 0));
}
function desk(c, x, y, w) { R(c, '#8b5a2b', x, y, w, 3); R(c, '#5b3a1b', x + 1, y + 3, 2, 6); R(c, '#5b3a1b', x + w - 3, y + 3, 2, 6); }
function monitor(c, x, y, on = '#7ee2b8') { R(c, '#22223b', x, y, 10, 7); R(c, on, x + 1, y + 1, 8, 5); R(c, '#22223b', x + 4, y + 7, 2, 2); }
function stars(c, n, col = '#fff') { for (let i = 0; i < n; i++) R(c, col, (i * 37) % SW, (i * 13) % 14, 1, 1); }
function mountain(c, x, w, h, col) { for (let i = 0; i < w; i++) { const hh = Math.max(0, h - Math.abs(i - w / 2) * (2 * h / w)); R(c, col, x + i, SH - 6 - hh, 1, hh); } }

const SCENES = {
  class: c => { R(c, '#d8cfa8', 0, 0, SW, SH); R(c, '#2f4f3a', 30, 3, 68, 14); R(c, '#8b5a2b', 28, 17, 72, 2); R(c, '#e8e8e8', 36, 7, 20, 1); R(c, '#e8e8e8', 36, 10, 28, 1); R(c, '#9c7b54', 0, 26, SW, 6); desk(c, 10, 24, 18); desk(c, 100, 24, 18); person(c, 60, 13, '#e94560'); },
  library: c => { R(c, '#cbb48a', 0, 0, SW, SH); shelf(c, 4, 2, 30); shelf(c, 94, 2, 30); R(c, '#7a5a3a', 0, 26, SW, 6); desk(c, 42, 20, 44); person(c, 56, 9, '#4d96ff'); R(c, '#fff', 48, 18, 6, 2); R(c, '#f9c74f', 72, 15, 2, 5); R(c, '#fff8c0', 71, 14, 4, 1); },
  lab: c => { R(c, '#c7d3dd', 0, 0, SW, SH); R(c, '#9aa7b4', 0, 24, SW, 8); desk(c, 6, 18, 60); monitor(c, 10, 10); monitor(c, 26, 10, '#4d96ff'); monitor(c, 42, 10); R(c, '#43aa8b', 58, 12, 3, 6); R(c, '#9b5de5', 63, 13, 3, 5); R(c, '#22223b', 84, 4, 18, 22); for (let i = 0; i < 6; i++) R(c, i % 2 ? '#7ee2b8' : '#e94560', 87 + (i % 3) * 5, 7 + Math.floor(i / 3) * 5, 2, 1); person(c, 108, 12, '#ffffff'); },
  office: c => { R(c, '#e3d5b8', 0, 0, SW, SH); window_(c, 90, 4, '#9fd3ff'); R(c, '#9c7b54', 0, 26, SW, 6); desk(c, 20, 18, 50); monitor(c, 26, 10); R(c, '#fff', 46, 15, 8, 3); R(c, '#43aa8b', 76, 14, 4, 12); R(c, '#2e8b57', 74, 10, 8, 5); person(c, 58, 8, '#22223b'); },
  stage: c => { R(c, '#2a1638', 0, 0, SW, SH); R(c, '#a3243b', 0, 0, 18, 26); R(c, '#a3243b', 110, 0, 18, 26); R(c, '#6b3b1f', 0, 22, SW, 4); R(c, '#3f3a64', 0, 26, SW, 6); for (let i = 0; i < 12; i++) R(c, '#1f1d36', 4 + i * 10, 27, 6, 5); R(c, 'rgba(249,199,79,.25)', 50, 0, 28, 22); person(c, 62, 9, '#e05d5d'); R(c, '#bbb', 58, 15, 1, 7); },
  canteen: c => { R(c, '#f0dcb4', 0, 0, SW, SH); R(c, '#c0392b', 0, 0, SW, 5); for (let i = 0; i < 8; i++) R(c, '#fff', i * 16 + 4, 1, 8, 2); R(c, '#9c7b54', 0, 26, SW, 6); desk(c, 30, 19, 68); R(c, '#fff', 40, 16, 8, 3); R(c, '#f8961e', 42, 15, 4, 1); R(c, '#fff', 80, 16, 8, 3); R(c, '#43aa8b', 82, 15, 4, 1); person(c, 50, 8, '#f8961e'); person(c, 72, 8, '#4d96ff'); },
  exam: c => { R(c, '#d8cfa8', 0, 0, SW, SH); R(c, '#2f4f3a', 40, 2, 48, 10); R(c, '#e8e8e8', 46, 5, 36, 1); R(c, '#e8e8e8', 52, 8, 24, 1); R(c, '#9c7b54', 0, 26, SW, 6); for (let i = 0; i < 4; i++) { desk(c, 6 + i * 31, 21, 22); R(c, '#fff', 12 + i * 31, 19, 8, 2); } R(c, '#22223b', 116, 3, 8, 8); R(c, '#fff', 117, 4, 6, 6); R(c, '#e94560', 120, 5, 1, 3); },
  gym: c => { R(c, '#9fd3ff', 0, 0, SW, 18); R(c, '#c0573b', 0, 18, SW, 14); for (let i = 0; i < 4; i++) R(c, '#fff', 0, 21 + i * 3, SW, 1); R(c, '#43aa8b', 0, 14, SW, 4); person(c, 30, 8, '#f9c74f'); person(c, 70, 9, '#4d96ff'); R(c, '#fff', 110, 4, 2, 14); R(c, '#e94560', 112, 4, 8, 5); },
  home: c => { R(c, '#f2c38b', 0, 0, SW, SH); window_(c, 14, 5, '#ffb38a'); R(c, '#e94560', 50, 2, 6, 6); R(c, '#f9c74f', 52, 8, 2, 3); R(c, '#9c5a3a', 0, 26, SW, 6); R(c, '#e94560', 40, 16, 48, 10); R(c, '#c0392b', 40, 14, 48, 3); person(c, 54, 6, '#e94560'); person(c, 70, 7, '#43aa8b', '#777'); },
  desk: c => { R(c, '#3f3a64', 0, 0, SW, SH); window_(c, 100, 4, '#1f1d36'); stars(c, 6); desk(c, 10, 20, 80); monitor(c, 36, 8, '#e8f0ff'); R(c, '#22223b', 39, 10, 10, 1); R(c, '#22223b', 39, 12, 6, 1); R(c, '#f9c74f', 16, 14, 2, 6); R(c, '#fff8c0', 14, 12, 6, 2); R(c, '#fff', 60, 17, 10, 3); },
  dorm: c => { R(c, '#b9c7a8', 0, 0, SW, SH); R(c, '#8b5a2b', 4, 4, 40, 3); R(c, '#4d96ff', 4, 1, 40, 3); R(c, '#8b5a2b', 4, 18, 40, 3); R(c, '#e94560', 4, 15, 40, 3); R(c, '#5b3a1b', 4, 4, 2, 24); R(c, '#5b3a1b', 42, 4, 2, 24); R(c, '#7a6a4a', 0, 28, SW, 4); desk(c, 70, 20, 40); monitor(c, 80, 12); person(c, 56, 15, '#43aa8b'); },
  mountain: c => { R(c, '#9fd3ff', 0, 0, SW, SH); R(c, '#fff', 20, 5, 10, 2); R(c, '#fff', 80, 3, 14, 2); mountain(c, -10, 70, 20, '#5a8a5a'); mountain(c, 50, 90, 24, '#3f6e4a'); R(c, '#9c7b54', 0, 26, SW, 6); R(c, '#e8d5b0', 88, 14, 22, 12); R(c, '#c0392b', 86, 11, 26, 4); R(c, '#e94560', 98, 6, 1, 6); R(c, '#e94560', 99, 6, 4, 2); person(c, 70, 13, '#2ec4b6'); person(c, 60, 17, '#f9c74f', '#000'); },
  crossroad: c => { R(c, '#9fd3ff', 0, 0, SW, 20); R(c, '#43aa8b', 0, 20, SW, 12); R(c, '#cbb48a', 58, 20, 12, 12); R(c, '#cbb48a', 0, 24, SW, 4); R(c, '#6b4a2f', 63, 4, 2, 16); R(c, '#f9c74f', 46, 5, 16, 4); R(c, '#4d96ff', 66, 9, 16, 4); R(c, '#e94560', 46, 13, 16, 4); person(c, 30, 14, '#4d96ff'); },
  interview: c => { R(c, '#e3d5b8', 0, 0, SW, SH); R(c, '#9c7b54', 0, 26, SW, 6); desk(c, 60, 18, 64); for (let i = 0; i < 5; i++) person(c, 64 + i * 12, 6, ['#22223b', '#3f3a64', '#5b4636', '#22223b', '#3f3a64'][i], i === 2 ? '#bbb' : '#2b2b2b'); R(c, '#fff', 70, 16, 6, 2); R(c, '#fff', 94, 16, 6, 2); person(c, 24, 13, '#4d96ff'); R(c, '#5b3a1b', 20, 24, 12, 2); },
  phone: c => { R(c, '#1f1d36', 0, 0, SW, SH); stars(c, 8, '#555'); R(c, '#22223b', 52, 1, 24, 30); R(c, '#e8f0ff', 54, 4, 20, 24); R(c, '#43aa8b', 56, 7, 12, 3); R(c, '#4d96ff', 60, 12, 12, 3); R(c, '#43aa8b', 56, 17, 10, 3); R(c, '#f9c74f', 60, 22, 12, 3); },
  train: c => { R(c, '#9fd3ff', 0, 0, SW, SH); mountain(c, 0, 60, 10, '#7aa37a'); R(c, '#666', 0, 28, SW, 4); R(c, '#e8e8e8', 10, 10, 108, 16); R(c, '#4d96ff', 10, 20, 108, 3); for (let i = 0; i < 9; i++) R(c, '#1f1d36', 16 + i * 11, 13, 7, 5); R(c, '#e8e8e8', 118, 12, 6, 14); R(c, '#22223b', 20, 26, 6, 2); R(c, '#22223b', 100, 26, 6, 2); },
  night: c => { R(c, '#141230', 0, 0, SW, SH); stars(c, 18); R(c, '#f9c74f', 100, 3, 8, 8); R(c, '#141230', 102, 2, 7, 7); R(c, '#2a2650', 0, 20, SW, 12); R(c, '#c0573b', 0, 24, SW, 8); R(c, '#fff', 0, 27, SW, 1); person(c, 50, 12, '#3f3a64'); },
  board: c => { R(c, '#d8cfa8', 0, 0, SW, SH); R(c, '#8b2a2a', 24, 2, 80, 22); R(c, '#fff', 28, 5, 72, 16); for (let i = 0; i < 5; i++) R(c, '#22223b', 32, 7 + i * 3, 30 + (i * 13) % 30, 1); R(c, '#e94560', 88, 15, 8, 4); R(c, '#9c7b54', 0, 26, SW, 6); person(c, 10, 13, '#4d96ff'); person(c, 112, 13, '#f8961e'); },
  plane: c => { R(c, '#9fd3ff', 0, 0, SW, SH); R(c, '#fff', 10, 6, 16, 3); R(c, '#fff', 90, 20, 20, 3); R(c, '#e8e8e8', 40, 12, 50, 6); R(c, '#4d96ff', 40, 15, 50, 1); R(c, '#e8e8e8', 58, 4, 10, 8); R(c, '#e8e8e8', 58, 18, 10, 8); R(c, '#e94560', 36, 9, 6, 6); for (let i = 0; i < 6; i++) R(c, '#1f1d36', 50 + i * 6, 13, 2, 2); },
};
function drawScene(cv, id) {
  if (!cv) return;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, SW, SH);
  (SCENES[id] || SCENES.desk)(c);
}

/* ---- 标题画面 ---- */
function drawTitleArt(cv) {
  if (!cv) return;
  const c = cv.getContext('2d');
  R(c, '#2a2650', 0, 0, 140, 40); stars(c, 10);
  R(c, '#e8d5b0', 30, 12, 80, 22); R(c, '#c0392b', 26, 8, 88, 5); R(c, '#a3243b', 60, 2, 20, 8);
  for (let i = 0; i < 6; i++) R(c, '#4d6b8a', 36 + i * 12, 16, 6, 6);
  R(c, '#5b3a1b', 64, 24, 12, 10); R(c, '#f9c74f', 66, 4, 8, 3);
  R(c, '#43aa8b', 0, 34, 140, 6); R(c, '#cbb48a', 60, 34, 20, 6);
  person(c, 16, 22, '#4d96ff'); person(c, 120, 22, '#e94560');
}

/* ============ 拟录取截图（虚构单位，仅供游戏） ============ */
function rr(c, x, y, w, h, r, fill) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fillStyle = fill; c.fill(); }
const SANS = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
function txt(c, t, x, y, size, col, weight = '', align = 'left') { c.font = `${weight} ${size}px ${SANS}`; c.fillStyle = col; c.textAlign = align; c.fillText(t, x, y); }

function stuNo(s) { let h = 0; for (const ch of s.name + s.role) h = (h * 31 + ch.charCodeAt(0)) % 1e7; return '2027' + String(h).padStart(7, '0') + '0' + (S ? S.turns % 10 : 0); }

function drawOffer(cv, s, id) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, e = ENDINGS[id];
  c.clearRect(0, 0, W, H);
  ({ tm: shotTM, abroad: shotAbroad, job: shotJob, ky: shotKY, reject: shotReject, bad: shotBad }[e.shot] || shotBad)(c, W, H, s, id);
  // 水印
  c.save(); c.globalAlpha = .1; c.translate(W / 2, H / 2); c.rotate(-.35);
  for (let i = -3; i <= 3; i++) txt(c, '保研模拟器 · 游戏截图 · 非真实文件', 0, i * 90, 26, '#000', 'bold', 'center');
  c.restore();
  rr(c, W - 330, H - 34, 320, 24, 4, 'rgba(0,0,0,.55)');
  txt(c, '保研模拟器 · 游戏截图 · 非真实文件', W - 170, H - 17, 13, '#fff', '', 'center');
}

function shotTM(c, W, H, s) {
  const t = s.f.final, sch = s.names[t] || '梧桐大学', zj = !!s.f.zjFinal, phd = !!s.f.phd;
  c.fillStyle = '#f0f2f5'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1e4f9c'; c.fillRect(0, 0, W, 64);
  rr(c, 20, 14, 36, 36, 18, '#fff'); txt(c, '研', 38, 39, 20, '#1e4f9c', 'bold', 'center');
  txt(c, '全国推荐优秀应届本科毕业生免试攻读研究生服务系统（模拟）', 70, 40, 19, '#fff', 'bold');
  c.fillStyle = '#163d7a'; c.fillRect(0, 64, W, 36);
  ['首页', '我的申请', '复试通知', '待录取通知', '个人信息'].forEach((m, i) => { if (i === 3) { c.fillStyle = '#2f6fd1'; c.fillRect(110 + i * 130, 64, 130, 36); } txt(c, m, 175 + i * 130, 88, 15, '#fff', '', 'center'); });
  txt(c, `欢迎您，${s.name}　　考生编号：${stuNo(s)}`, 30, 128, 14, '#555');
  rr(c, 24, 144, W - 48, H - 200, 6, '#fff');
  txt(c, '待录取通知', 44, 180, 20, '#1e4f9c', 'bold');
  c.fillStyle = '#e8eef8'; c.fillRect(44, 196, W - 88, 36);
  const cols = [['招生单位', 44], ['院系所', 214], ['专业', 384], ['学习方式', 554], ['类别', 664], ['状态', 794]];
  cols.forEach(([n, x]) => txt(c, n, x + 10, 220, 14, '#333', 'bold'));
  const major = s.f.major || (s.f.major = pick(MAJORS));
  const row = [sch, '计算机学院', major, '全日制', zj ? '支教保研' : phd ? '直博生' : '学术学位硕士', '待录取'];
  c.fillStyle = '#fbfcfe'; c.fillRect(44, 232, W - 88, 44);
  row.forEach((v, i) => txt(c, v, cols[i][1] + 10, 260, 15, i === 5 ? '#e67e22' : '#222', i === 5 ? 'bold' : ''));
  c.strokeStyle = '#dde3ee'; c.strokeRect(44, 196, W - 88, 80);
  txt(c, `${sch}已向您发送待录取通知，请在 48 小时内确认是否接受。`, 44, 316, 15, '#444');
  if (zj) txt(c, '备注：研究生支教团专项计划，保留入学资格一年，支教期满后入学。', 44, 342, 14, '#888');
  rr(c, 44, 368, 150, 44, 4, '#bfc6d1'); txt(c, '已接受 ✔', 119, 396, 17, '#fff', 'bold', 'center');
  rr(c, 214, 368, 150, 44, 4, '#eceff3'); txt(c, '拒绝', 289, 396, 17, '#aaa', '', 'center');
  rr(c, W - 390, 360, 340, 60, 6, '#e9f7ef'); txt(c, '✔ 恭喜您已被录取！', W - 220, 397, 20, '#27ae60', 'bold', 'center');
  txt(c, `确认时间：2027-09-28 ${String(9 + (s.turns % 3)).padStart(2, '0')}:0${s.turns % 6}:${String(s.turns % 60).padStart(2, '0')}`, 44, 446, 13, '#999');
}

function shotAbroad(c, W, H, s, id) {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f3f3f3'; c.fillRect(0, 0, W, 52);
  txt(c, '✉  Inbox', 24, 33, 17, '#333', 'bold');
  txt(c, 'Admissions Office <admissions@' + s.f.school.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + '.edu.example>', 24, 86, 14, '#666');
  txt(c, `Offer of Admission — ${s.f.school}`, 24, 120, 22, '#111', 'bold');
  c.fillStyle = id === 'abroad_us' ? '#8c1515' : id === 'abroad_uk' ? '#002147' : '#2e5e4e'; c.fillRect(24, 140, W - 48, 70);
  txt(c, s.f.school.toUpperCase(), W / 2, 184, 24, '#fff', 'bold', 'center');
  const lines = [`Dear ${s.name},`, '', 'Congratulations! On behalf of the Admissions Committee, I am delighted to offer',
    `you admission to the Master of Science in Computer Science program for Fall 2027.`, '',
    `Your academic record (GPA ${s.a.gpa.toFixed(2)}) and IELTS score of ${s.cert.ielts} were reviewed carefully.`,
    'Please confirm your acceptance in the applicant portal within 14 days.', '', 'Sincerely,', 'Graduate Admissions Committee'];
  lines.forEach((l, i) => txt(c, l, 24, 250 + i * 24, 15, '#222'));
}

function shotJob(c, W, H, s, id) {
  c.fillStyle = '#eef1f6'; c.fillRect(0, 0, W, H);
  rr(c, 40, 30, W - 80, H - 80, 10, '#fff');
  const brand = { '鹅厂': '#1f6feb', '狼厂': '#2932e1', '猫厂': '#ff6a00', '节节高': '#111' }[s.f.school] || '#2ec4b6';
  c.fillStyle = brand; c.fillRect(40, 30, W - 80, 80);
  txt(c, `${s.f.school}（虚构）· 录用通知书`, 70, 80, 24, '#fff', 'bold');
  const lv = { job_sp: ['SP（特殊人才计划）', '26k×16'], job_big: ['应届 · 后端开发', '22k×15'], job_mid: ['应届 · 软件开发', '16k×14'], job_soe: ['信息技术岗', '12k×13 + 公积金 12%'] }[id];
  const rows = [['候选人', s.name], ['岗位', lv[0]], ['工作地点', pick(['深圳', '北京', '杭州', '上海'])], ['薪资方案', lv[1]], ['报到时间', '2027年7月']];
  rows.forEach(([k, v], i) => { txt(c, k, 80, 160 + i * 42, 16, '#888'); txt(c, v, 220, 160 + i * 42, 18, '#222', 'bold'); });
  if (id === 'job_sp') { rr(c, W - 230, 140, 150, 40, 20, '#fff3cd'); txt(c, '★ SP Offer', W - 155, 166, 17, '#b8860b', 'bold', 'center'); }
  rr(c, 80, 390, 170, 46, 6, brand); txt(c, '已接受 offer', 165, 420, 17, '#fff', 'bold', 'center');
  txt(c, '请在 7 个自然日内完成三方协议签署。', 280, 420, 14, '#999');
}

function shotKY(c, W, H, s, id) {
  c.fillStyle = '#f5f5f5'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#8b1a1a'; c.fillRect(0, 0, W, 60);
  txt(c, '硕士研究生招生考试 · 初试成绩查询（模拟）', 30, 38, 20, '#fff', 'bold');
  rr(c, 30, 84, W - 60, H - 130, 6, '#fff');
  txt(c, `考生姓名：${s.name}　　报考单位：${s.f.school || '—'}`, 54, 124, 16, '#333');
  const k = s.a.kn, ok = id !== 'kaoyan_fail';
  const sc = [['思想政治理论', 60 + Math.round(k / 8)], ['英语（一）', 45 + Math.round(s.a.eng / 4)], ['数学（一）', 70 + Math.round(k * .6)], ['计算机学科专业基础', 75 + Math.round(k * .55)]];
  if (!ok) sc[2][1] -= 18;
  c.fillStyle = '#f0e6e6'; c.fillRect(54, 146, W - 108, 34);
  txt(c, '科目', 70, 169, 15, '#333', 'bold'); txt(c, '成绩', W - 160, 169, 15, '#333', 'bold');
  sc.forEach(([n, v], i) => { txt(c, n, 70, 210 + i * 36, 15, '#333'); txt(c, String(Math.min(v, 148)), W - 160, 210 + i * 36, 15, '#333'); });
  const tot = sc.reduce((x, [, v]) => x + Math.min(v, 148), 0);
  txt(c, `总分：${tot}`, 70, 370, 20, '#8b1a1a', 'bold');
  txt(c, ok ? '复试结果：拟录取' : '复试结果：未进入复试', 70, 410, 20, ok ? '#27ae60' : '#c0392b', 'bold');
}

function shotReject(c, W, H, s, id) {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f3f3f3'; c.fillRect(0, 0, W, 52);
  txt(c, `✉  收件箱（${id === 'abroad_fail' ? 8 : 23} 封未读）`, 24, 33, 17, '#333', 'bold');
  const items = id === 'abroad_fail'
    ? ['Application Decision', 'Update on your application', 'Thank you for applying', 'Your application status', 'Admission Decision']
    : ['感谢您投递我司岗位', '【面试结果通知】', '很遗憾地通知您', '您的简历已进入人才库', '感谢您参加我司笔试'];
  items.forEach((t, i) => {
    c.fillStyle = i % 2 ? '#fafafa' : '#fff'; c.fillRect(0, 70 + i * 74, W, 74);
    txt(c, t, 30, 102 + i * 74, 17, '#222', 'bold');
    txt(c, id === 'abroad_fail' ? 'We regret to inform you that we are unable to offer you admission...' : '经过慎重评估，很遗憾您暂未通过本次招聘流程……', 30, 128 + i * 74, 14, '#888');
  });
}

function shotBad(c, W, H, s, id) {
  c.fillStyle = '#1f1d36'; c.fillRect(0, 0, W, H);
  const msg = {
    gatekeeper: ['推免资格审核结果', `未通过：${s.f.gateFail || '硬门槛'}`],
    leek: ['XX保研规划机构', '对方已开启好友验证，你还不是他（她）好友'],
    collapse: ['休学申请', '审批状态：已通过'],
    oversleep: ['推免服务系统', '填报时间已截止'],
    misconduct: ['关于学术不端行为的处理通报', '取消推免资格'],
    pigeon: ['导师交流群（87人）', '"大家注意一下这个同学……"'],
    happy: ['人生不是轨道', '是旷野'],
  }[id] || ['结局', ENDINGS[id].t];
  rr(c, 80, 100, W - 160, 280, 10, '#f6ecd2');
  txt(c, msg[0], W / 2, 190, 28, '#1f1d36', 'bold', 'center');
  txt(c, msg[1], W / 2, 260, 20, id === 'happy' ? '#43aa8b' : '#c0392b', 'bold', 'center');
  txt(c, ENDINGS[id].t, W / 2, 330, 16, '#666', '', 'center');
}
