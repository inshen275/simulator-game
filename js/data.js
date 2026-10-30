/* ============ 基础常量 ============ */
const KEY = 'baoyan-sim-save-v3';
const GKEY = 'baoyan-sim-endings-v3';

const N = 120, QUOTA = 20;   // 专业人数 / 推免名额

const ATTRS = {
  gpa:    { n: 'GPA',  min: 1.5, max: 4.0, c: '#4d96ff' },
  kn:     { n: '基础', min: 0, max: 100, c: '#2ec4b6' },
  eng:    { n: '英语', min: 0, max: 100, c: '#f9c74f' },
  oral:   { n: '表达', min: 0, max: 100, c: '#ff9f68' },
  sci:    { n: '科研', min: 0, max: 100, c: '#9b5de5' },
  comp:   { n: '竞赛', min: 0, max: 100, c: '#f8961e' },
  intern: { n: '实习', min: 0, max: 100, c: '#ff70a6' },
  work:   { n: '学工', min: 0, max: 100, c: '#e05d5d' },
  mood:   { n: '心态', min: 0, max: 100, c: '#43aa8b' },
};
const LABEL = { rank: '排名', gpa: 'GPA', kn: '基础', eng: '英语', oral: '表达', sci: '科研', comp: '竞赛', intern: '实习', work: '学工', mood: '心态',
  coins: '金币', bonus: '加分', zhenti: '真题', rec: '推荐信' };

/* 五维考核 */
const DIMS = { gpa: '绩点', ach: '竞赛科研', iv: '面试', eng: '英语', mat: '材料' };
const DIMS_FROM = 8;   // 侧栏从大三下 5 月（准备夏令营材料）起显示五维

/* 院校档次：1 清北 2 华五 3 中流985 4 211 5 本校 */
const TIER = ['', '清北', '华五', '中流985', '211', '本校'];
const SCHOOL = {
  1: ['北辰大学', '清源大学'],
  2: ['澄江大学', '明远大学', '沪滨大学'],
  3: ['云岭大学', '望海大学', '长汀大学'],
  4: ['江城理工大学', '北原大学'],
  5: ['梧桐大学'],
};
const COST = [0, 1600, 1300, 900, 500, 0];   // 参营机票 + 酒店
const MIN  = [0, 52, 42, 32, 22, 12];        // 每一维的最低门槛（短板线）
const TGT  = [0, 70, 60, 50, 40, 28];        // 综合分（五维几何平均）目标线

const POSTS = ['普通同学', '班委', '院学生会干事', '院学生会部长', '院学生会主席', '校学生会主席'];
const POSTZ = [0, .3, .6, 1.2, 2, 2.8];       // 职务带来的综测加分
const MAJORS = ['计算机科学与技术', '软件工程', '电子信息工程', '人工智能'];

/* ============ 开局身份：优势 + 短板 ============ */
const ROLES = [
  { id: 'xueba', n: '卷王学霸', d: '绩点就是生命线，图书馆座位是你的第二张床。',
    pro: 'GPA 3.64 起步；自习成长 +30%', con: '表达成长 -30%；心态上限 85',
    a: { gpa: 3.64, kn: 42, eng: 45, oral: 12, sci: 5, comp: 5, intern: 0, work: 5, mood: 60 },
    coins: 1200, bonus: 0, post: 0, cert: { cet4: 540, cet6: 0 }, look: { h: '#2b2b2b', b: '#4d96ff', acc: 'glasses' } },
  { id: 'jingsai', n: '竞赛狂魔', d: '代码和建模才是浪漫。大二已拿过一个省奖。',
    pro: '竞赛 40、已有加分 1.0；竞赛成长 +30%', con: '四级未过；挂科风险高',
    a: { gpa: 3.30, kn: 35, eng: 35, oral: 22, sci: 10, comp: 40, intern: 0, work: 5, mood: 65 },
    coins: 1500, bonus: 1.0, post: 0, cert: { cet4: 0, cet6: 0 }, look: { h: '#7a3b12', b: '#f8961e', acc: 'headphones' } },
  { id: 'keyan', n: '科研萌新', d: '大二就进了孙导的组，虽然主要负责拿外卖。',
    pro: '科研 30；孙导好感高', con: '生活费减半（¥400/月）',
    a: { gpa: 3.42, kn: 35, eng: 48, oral: 22, sci: 30, comp: 0, intern: 0, work: 5, mood: 58 },
    coins: 800, bonus: 0, post: 0, cert: { cet4: 500, cet6: 0 }, look: { h: '#3d2c5e', b: '#9b5de5', acc: 'pencil' } },
  { id: 'ganbu', n: '学生干部', d: '开局即班长，辅导员办公室的常客。',
    pro: '开局班长；学工成长 +40%', con: '基础 26；每月心态 -3',
    a: { gpa: 3.38, kn: 26, eng: 42, oral: 45, sci: 4, comp: 4, intern: 0, work: 25, mood: 65 },
    coins: 1500, bonus: 0, post: 1, cert: { cet4: 470, cet6: 0 }, look: { h: '#1c1c1c', b: '#e05d5d', acc: 'badge' } },
  { id: 'fuer', n: '家境优渥', d: '从小上外教课，家里只希望你"别太累"。',
    pro: '¥6000 起步、生活费翻倍；已过六级', con: '基础 20；不能兼职',
    a: { gpa: 3.38, kn: 20, eng: 62, oral: 38, sci: 4, comp: 4, intern: 0, work: 5, mood: 55 },
    coins: 6000, bonus: 0, post: 0, cert: { cet4: 610, cet6: 560 }, look: { h: '#b5651d', b: '#2ec4b6', acc: 'clip' } },
  { id: 'xiaozhen', n: '小镇做题家', d: '高考考出县城的第一人，刷题是你的本能。',
    pro: '基础 50；心态损失 -25%', con: '四级未过；缺情报时入营难',
    a: { gpa: 3.52, kn: 50, eng: 30, oral: 10, sci: 6, comp: 6, intern: 0, work: 5, mood: 62 },
    coins: 600, bonus: 0, post: 0, cert: { cet4: 0, cet6: 0 }, look: { h: '#4a3426', b: '#43aa8b', acc: 'scarf' } },
  { id: 'random', n: '随机人生', d: '命运的骰子替你决定一切——包括你是谁。', pro: '身份随机', con: '', a: null },
];

/* ============ NPC ============ */
const NPCS = [
  { id: 'wang', n: '王卷卷', type: '同学', color: '#4d96ff', aff: 10, d: '同专业绩点第一，图书馆座位永远在你斜对面。',
    perks: [[25, '≥25：期末可以借笔记'], [40, '≥40：成为学习搭子（自习收益↑）']] },
  { id: 'li', n: '李八卦', type: '同学', color: '#f8961e', aff: 15, d: '全年级的消息都会经过这里。',
    perks: [[20, '≥20：可以反向打听情报'], [40, '≥40：透露预推免内部消息']] },
  { id: 'zhang', n: '张佛', type: '室友', color: '#43aa8b', aff: 20, d: '你的室友，信奉"一切随缘"。',
    perks: [[40, '≥40：学会松弛感（休息收益↑）']] },
  { id: 'chen', n: '陈学姐', type: '学姐', color: '#9b5de5', aff: 15, d: '直系学姐，去年保研去了华五，在本院带大创。',
    perks: [[25, '≥25：10月邀请你做大创'], [30, '≥30：赠送保研真题']] },
  { id: 'liu', n: '刘学长', type: '学长', color: '#e94560', aff: 5, d: '挑战杯国奖得主，竞赛圈的传说。',
    perks: [[25, '≥25：3月邀请你冲挑战杯'], [30, '≥30：赠送机试真题']] },
  { id: 'zhou', n: '周学姐', type: '学姐', color: '#ff70a6', aff: 5, d: '创业达人，正在组互联网+团队，大厂实习过。',
    perks: [[25, '≥25：5月邀请你加入互联网+'], [30, '≥30：赠送面经']] },
  { id: 'sun', n: '孙导', type: '导师', color: '#5c4b8a', aff: 5, d: '本院实验室的博导，话不多，但很看重学生的踏实。',
    perks: [[35, '≥35：愿意给你写推荐信'], [50, '≥50：第二封推荐信 + 内推']] },
  { id: 'zhao', n: '赵老师', type: '辅导员', color: '#22223b', aff: 10, d: '年级辅导员，学生工作和推免资格审核都归她管。',
    perks: [[30, '≥30：竞选时更信任你'], [40, '≥40：研支团推荐 + 学工推荐信']] },
];
const npc = id => NPCS.find(n => n.id === id);
const SENIORS = ['chen', 'liu', 'zhou'];
const SENIOR_ATTR = { chen: 'sci', liu: 'comp', zhou: 'intern', sun: 'sci', zhao: 'work' };

/* ============ 阶段 & 月份 ============ */
const STAGES = [
  { name: '大三上', sub: '第一阶段 · 开局', desc: '九月，梧桐叶还没黄。保研倒计时一年。\n专业 120 人，推免名额只有 20 个。排名、四级、挂科、体测、综测——任何一项不过关，资格都会作废。' },
  { name: '大三下', sub: '第二阶段 · 积累', desc: '寒假过后，身边的人开始悄悄"上分"。\n论文、竞赛、学生工作、实习、英语……时间只有这么多，你必须做出取舍。' },
  { name: '暑期夏令营', sub: '第三阶段 · 夏令营', desc: '各校夏令营、大厂暑期实习、雅思考场轮番开放。\n五维考核里任何一项是短板，面试官都会一眼看穿。' },
  { name: '大四上', sub: '第四阶段 · 资格审核', desc: '推免资格即将公示，预推免进入白热化。\n名额、候补、鸽子……保研江湖，险恶得很。' },
  { name: '九推', sub: '最终阶段 · 九推', desc: '9 月 28 日，推免服务系统开放。\n一年的努力，将在今晚尘埃落定。' },
];

const MONTHS = [
  { n: '大三上 · 9月',  st: 0, ap: 3, ev: ['opening'] },
  { n: '大三上 · 10月', st: 0, ap: 3, ev: ['proj_chen', 'su_recruit'] },
  { n: '大三上 · 11月', st: 0, ap: 3, ev: ['elect_minister', 'ask_li'] },
  { n: '大三上 · 12月', st: 0, ap: 3, ev: ['cet', 'pe_test'] },
  { n: '大三上 · 1月',  st: 0, ap: 2, ev: ['final1'] },
  { n: '寒假 · 2月',    st: 1, ap: 4, ev: ['winter'] },
  { n: '大三下 · 3月',  st: 1, ap: 3, ev: ['proj_liu', 'makeup', 'class_elect', 'elect_chair'] },
  { n: '大三下 · 4月',  st: 1, ap: 3, ev: ['paper', 'zj_apply', 'ask_wang'] },
  { n: '大三下 · 5月',  st: 1, ap: 3, ev: ['proj_zhou', 'cv', 'rec_letter', 'zj_interview', 'pe_retest', 'elect_school'] },
  { n: '大三下 · 6月',  st: 1, ap: 2, ev: ['final2', 'cet', 'route', 'camp_apply'] },
  { n: '暑假 · 7月',    st: 2, ap: 3, ev: ['camp_travel', 'iv_intro', 'iv_pro', 'iv_sci', 'iv_stress', 'camp_result', 'summer_intern', 'ielts_exam'] },
  { n: '暑假 · 8月',    st: 2, ap: 3, ev: ['after_camp', 'intern_return', 'makeup', 'zj_check'] },
  { n: '大四上 · 9月上旬', st: 3, ap: 1, ev: ['qual', 'prepush', 'iv_pro', 'iv_stress', 'prepush_result'] },
  { n: '大四上 · 9月中旬', st: 3, ap: 1, ev: ['drama'] },
  { n: '九推 · 9月28日', st: 4, ap: 0, ev: ['ninepush'] },
];

/* 出路线：资格公示后进入的结算流程 */
const TRACKS = { kaoyan: ['tr_kaoyan'], abroad: ['tr_abroad'], job: ['tr_job', 'job_test', 'job_iv'] };

/* ============ 保研机构 ============ */
const AGENCY = [
  { lv: 1, n: '保研文书精修班', price: 2500, perks: '简历文书精修（材料+）\n院校信息库（获得【情报】）' },
  { lv: 2, n: '全程 VIP 1v1 保研规划', price: 6000, perks: '包含精修班全部内容\n保研真题 ×2\n模拟面试（表达+8）' },
];

/* ============ 结局 ============ */
// shot: 结局截图类型 tm=推免系统 abroad=留学offer job=录用通知 ky=考研成绩 reject=拒信 bad=特殊
const ENDINGS = {
  scholar:     { t: '学术新星', r: 'SSR', c: '#9b5de5', shot: 'tm', d: s => `${s.name} 带着一作论文走进了${s.f.school}的实验室。\n导师说："你是我带过起点最高的学生。"` },
  phd:         { t: '直博之路', r: 'SR', c: '#9b5de5', shot: 'tm', d: s => `${s.name} 选择了${s.f.school}的直博。\n五年很长，但你第一次觉得，自己是真的喜欢科研。` },
  chairman:    { t: '主席保研', r: 'SSR', c: '#e05d5d', shot: 'tm', d: s => `从班委到${POSTS[s.post]}，再到${s.f.school}。\n${s.name} 证明了：学生工作和学业，可以两手都硬。` },
  qingbei:     { t: '顶峰相见', r: 'SR', c: '#e94560', shot: 'tm', d: s => `${s.f.school}的录取通知上，校徽闪闪发光。\n${s.name} 终于站上了那座曾经只敢仰望的山峰。` },
  huawu:       { t: '名校入场券', r: 'SR', c: '#e94560', shot: 'tm', d: s => `${s.f.school}向 ${s.name} 敞开了大门。\n你在新学校的第一顿饭吃得很慢，想把这份喜悦多留一会儿。` },
  mid985:      { t: '稳稳上岸', r: 'R', c: '#4d96ff', shot: 'tm', d: s => `${s.f.school}，一所不错的 985。没有惊天逆袭，但每一步都算数。\n${s.name} 睡了一年来最踏实的一觉。` },
  s211:        { t: '上岸就是胜利', r: 'R', c: '#4d96ff', shot: 'tm', d: s => `${s.f.school}的老师在电话里说："欢迎你。"\n${s.name} 挂掉电话，在楼道里蹲了好一会儿。` },
  local:       { t: '熟悉的食堂', r: 'R', c: '#4d96ff', shot: 'tm', d: s => `${s.name} 留在了梧桐大学。\n同一个食堂，同一条林荫道，身份从"本科生"变成了"研究生"。` },
  zhijiao:     { t: '山那边的讲台', r: 'SSR', c: '#2ec4b6', shot: 'tm', d: s => `${s.name} 加入了研究生支教团，将在西部县城支教一年，然后回到${s.f.school}读研。\n第一堂课，孩子们问你："老师，大学是什么样的？"` },
  abroad_us:   { t: '美利坚名校', r: 'SSR', c: '#43aa8b', shot: 'abroad', d: s => `${s.name} 拿到了 ${s.f.school} 的录取。\n飞机起飞的时候，你想：原来路不止一条。` },
  abroad_uk:   { t: '英伦 / 港新名校', r: 'SR', c: '#43aa8b', shot: 'abroad', d: s => `${s.f.school} 的 offer 躺在邮箱里。\n一年制硕士很快，但足够让 ${s.name} 看到更大的世界。` },
  abroad_ok:   { t: '海外漂流', r: 'R', c: '#43aa8b', shot: 'abroad', d: s => `${s.name} 去了 ${s.f.school}。\n排名不算顶尖，但异国的生活让你学会了独立。` },
  abroad_fail: { t: '全聚德', r: 'N', c: '#777', shot: 'reject', d: s => `8 封拒信，0 个 offer。\n${s.name} 把拒信打印出来贴在墙上："明年再战。"` },
  job_sp:      { t: '大厂 SP', r: 'SSR', c: '#2ec4b6', shot: 'job', d: s => `暑期实习转正，还拿到了 SP 级 offer。\n当同学们还在读研时，${s.name} 已经在${s.f.school}写代码了。` },
  job_big:     { t: '大厂 Offer', r: 'SR', c: '#2ec4b6', shot: 'job', d: s => `五轮面试后，HR 打来电话："恭喜你！"\n${s.name} 成了${s.f.school}的一名应届生。` },
  job_mid:     { t: '中厂打工人', r: 'R', c: '#2ec4b6', shot: 'job', d: s => `${s.name} 拿到了${s.f.school}的 offer。\n不是最大的厂，但团队很好，导师很耐心。` },
  job_soe:     { t: '铁饭碗', r: 'R', c: '#2ec4b6', shot: 'job', d: s => `笔试、面试、政审——${s.name} 进了${s.f.school}。\n朝九晚五，周末还能睡懒觉。` },
  job_fail:    { t: '灵活就业', r: 'N', c: '#777', shot: 'reject', d: s => `秋招颗粒无收。\n${s.name} 开始了"灵活就业"——也就是待业。` },
  kaoyan_top:  { t: '考研逆袭', r: 'SR', c: '#f8961e', shot: 'ky', d: s => `没有保研又如何？\n${s.name} 凭着扎实的基础，考上了${s.f.school}！这一路，比任何 offer 都更有分量。` },
  kaoyan_ok:   { t: '考研上岸', r: 'R', c: '#f8961e', shot: 'ky', d: s => `${s.name} 考上了${s.f.school}。\n大三时打下的基础，终究没有白费。` },
  kaoyan_fail: { t: '二战再见', r: 'N', c: '#777', shot: 'ky', d: s => `成绩出来那天，${s.name} 离分数线差了 6 分。\n你在备忘录里写下："明年见。"` },
  gatekeeper:  { t: '门槛刺客', r: 'BAD', c: '#333', shot: 'bad', d: s => `排名明明够了，却因为【${s.f.gateFail || '硬门槛'}】失去了推免资格。\n${s.name} 后来常跟学弟学妹说："短板，真的会要命。"` },
  happy:       { t: '快乐至上', r: 'SR', c: '#f9c74f', shot: 'bad', d: s => `什么都没成，但 ${s.name} 依然笑得很开心。\n"人生是旷野，不是轨道。"` },
  leek:        { t: '韭菜的自我修养', r: 'BAD', c: '#333', shot: 'bad', d: s => `${s.name} 花大价钱报了保研机构，结果什么都没拿到。\n顾问的微信头像变成了灰色。` },
  collapse:    { t: '精神状态遥遥领先', r: 'BAD', c: '#333', shot: 'bad', d: s => `长期的焦虑压垮了 ${s.name}。\n你决定休学一年，去云南放空自己。` },
  oversleep:   { t: '九推惊魂', r: 'BAD', c: '#333', shot: 'bad', d: s => `${s.name} 睡过了九推填报时间。\nOffer 作废，导师拉黑。（请务必定好闹钟）` },
  misconduct:  { t: '学术不端', r: 'BAD', c: '#333', shot: 'bad', d: s => `${s.name} 的"成果"被查出造假，学院发布了通报。\n推免资格取消，档案里多了一页纸。` },
  pigeon:      { t: '鸽王之王', r: 'BAD', c: '#333', shot: 'bad', d: s => `${s.name} 同时吊着好几位导师，最后一刻所有名额都另作他用。\n保研圈很小，你的名字在导师群里传开了。` },
};
