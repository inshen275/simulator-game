/* ============ 通用小工具 ============ */
function apLose(s, n = 1) { s.ap = Math.max(0, s.ap - n); }
function failCourse(s, name) { s.fails++; A(s, { gpa: -.08, mood: -10 }); return `【${name}】挂了。\n挂科记录会直接卡死推免资格，必须尽快补考。`; }
function setPost(s, p) { s.post = Math.max(s.post, p); }
function ivRound(s, v, th) {
  const g = clamp(Math.round((v - th) / 5), -8, 6);
  s.ivAdj += g;
  return g >= 4 ? `（本轮表现：亮眼 +${g}）` : g >= 1 ? `（本轮表现：不错 +${g}）` : g >= -2 ? `（本轮表现：平平 ${g}）` : `（本轮表现：翻车 ${g}）`;
}
function startIv(s, kind, tiers) { s.ivCtx = { kind, tiers }; s.ivAdj = 0; }

/* ============ 主线事件 ============ */
const EV = {
  /* ---- 大三上 ---- */
  opening: { title: '开学第一周', scene: 'class',
    text: s => `大三开学了。辅导员赵老师在年级群里发了《推免实施细则》：\n\n· 名额 ${QUOTA} 个，按综测排名（GPA + 竞赛科研加分 + 学生职务加分）\n· 硬门槛：四级≥425、无挂科、体测合格、志愿服务≥30h、无处分\n· 任何一条不满足，排名再高也没用\n\n你翻到最后一页，心里咯噔一下。`,
    choices: [
      { t: '给直系陈学姐发消息请教', fx: s => { aff(s, 'chen', 12); }, r: '陈学姐回得很快："保研是综合题，别偏科！有问题随时问我~"\n（陈学姐好感 +12）' },
      { t: '去辅导员办公室问细则', fx: s => { aff(s, 'zhao', 10); s.f.knowRule = 1; }, r: '赵老师推了推眼镜："你是今年第一个来问的。好好准备。"\n（赵老师好感 +10）' },
      { t: '把门槛抄下来贴在床头', d: { mood: 6 }, r: '"四级、挂科、体测、志愿、处分。"\n一个都不能掉。' },
    ] },
  proj_chen: { title: '大创立项', scene: 'lab',
    text: s => s.aff.chen >= 25
      ? '陈学姐找到你："我们组有个大创项目缺人，要不要一起？会占用你一些时间哦。"'
      : `学院开始申报大创项目。你和陈学姐还不太熟（好感 ${s.aff.chen}/25），只能自己想办法。`,
    choices: s => [
      ...(s.aff.chen >= 25 ? [{ t: '跟着学姐做', h: '下月行动点-1', fx: s => {
        s.apPenalty++; A(s, { sci: 8, mood: -4 }); aff(s, 'chen', 8);
        if (roll(.65)) { s.f.dachuang = 1; s.bonus += 1; A(s, { sci: 5 }); return '学姐带飞，国家级立项！\n推免加分 +1'; }
        s.bonus += .3; return '拿到了校级立项。推免加分 +0.3'; } }] : []),
      { t: '自己当负责人申报', h: '下月行动点-1', fx: s => {
        s.apPenalty++; A(s, { sci: 6, oral: 3, mood: -6 });
        if (roll(.15 + s.a.sci / 200)) { s.f.dachuang = 1; s.bonus += 1; return '你熬夜写完申报书——国家级立项！\n推免加分 +1'; }
        return '答辩时被评委问住了："你这个创新点在哪？"\n没能立项。'; } },
      { t: '不参加', d: { mood: 4 }, r: '你把时间留给了自己。' },
    ] },
  su_recruit: { title: '学生会招新', scene: 'office', tag: '学工', cond: s => s.post < 2,
    text: s => `院学生会纳新面试在活动中心举行。门口排了一长串大一新生……和零星几个大三的你。\n\n学长："大三才来啊？我们只要能干活的。"\n${s.post === 1 ? '（你是班委，有一定优势）' : ''}`,
    choices: s => [
      { t: '展示办活动的经验', h: hint(clamp(sig((s.a.oral + s.a.work - 35) / 8), .05, .95)), fx: s => {
          if (roll(sig((s.a.oral + s.a.work - 35) / 8))) { setPost(s, 2); A(s, { work: 6 }); return '"你明天来部门报到吧。"\n你成为了【院学生会干事】。'; }
          A(s, { mood: -5 }); return '面试官："我们更想培养大一的。"\n你落选了。'; } },
      { t: '找赵老师打个招呼', req: s => s.aff.zhao >= 25, rq: '需要 赵老师好感≥25', fx: s => { setPost(s, 2); A(s, { work: 4 }); aff(s, 'zhao', -3); return '赵老师在群里说了一句"这个同学挺踏实"。\n你成为了【院学生会干事】。'; } },
      { t: '算了，大三了不折腾', d: { mood: 3 } },
    ] },
  elect_minister: { title: '换届 · 竞选部长', scene: 'stage', tag: '学工', cond: s => s.post === 2,
    text: s => `学生会换届。你所在部门的部长要退了，副部长和你都想接手。\n\n竞选部长需要：学工积分 ≥ 25（你：${s.a.work}）\n上任后每两个月会多占 1 个行动点，但综测加分和材料分会明显提高。`,
    choices: s => [
      { t: '认真准备竞选 PPT', h: s.a.work < 25 ? '' : hint(sig((s.a.oral + s.a.work + s.aff.zhao * .3 - 60) / 8)), req: s => s.a.work >= 25, rq: '需要 学工≥25', fx: s => {
          A(s, { mood: -4 });
          if (roll(sig((s.a.oral + s.a.work + s.aff.zhao * .3 - 60) / 8))) { setPost(s, 3); A(s, { work: 8, oral: 3 }); return '投票结果：你 11 票，副部长 7 票。\n你成为了【院学生会部长】！'; }
          return '副部长在演讲里放了一段感人的部门 vlog。\n你以 2 票之差落选。'; } },
      { t: '私下拉票', req: s => s.a.work >= 25, rq: '需要 学工≥25', fx: s => {
          if (roll(.25)) { A(s, { mood: -12 }); aff(s, 'zhao', -10); return '有人把你的拉票截图发给了赵老师。\n"学生干部最重要的是作风。"你落选了，名声也坏了。'; }
          setPost(s, 3); A(s, { work: 6 }); aff(s, 'li', 5); return '奶茶请了二十杯，你当选了【院学生会部长】。'; } },
      { t: '不竞选，安心当干事', d: { mood: 3 } },
    ] },
  class_elect: { title: '班委补选', scene: 'class', tag: '学工', cond: s => s.post === 0,
    text: '原来的学习委员去交换了，班里要补选一位。辅导员说："班委经历在推免综测里有加分。"',
    choices: [
      { t: '上台竞选', fx: s => { if (roll(sig((s.a.oral + s.aff.li * .3 + s.aff.wang * .2 - 25) / 8))) { setPost(s, 1); A(s, { work: 6 }); return '你当选了学习委员。从此收作业、催作业、被骂作业。'; } return '你得票第二。\n"没关系，"张佛说，"至少你少了件事。"'; } },
      { t: '不参与', d: { mood: 2 } },
    ] },
  elect_chair: { title: '换届 · 竞选院学生会主席', scene: 'stage', tag: '学工', cond: s => s.post === 3,
    text: s => `新一届院学生会主席选举。候选人三名：你、文艺部部长、外联部部长。\n\n门槛：学工 ≥ 45（你：${s.a.work}）\n当上主席后：每月固定 -1 行动点，综测加分 +2，材料分大幅提高；还能冲击校级职务。`,
    choices: s => {
      const p = sig((s.a.oral * .6 + s.a.work + s.aff.zhao * .4 + s.aff.li * .2 - 72) / 8);
      return [
        { t: '演讲：讲清楚自己的施政纲领', h: s.a.work < 45 ? '' : hint(p), req: s => s.a.work >= 45, rq: '需要 学工≥45', fx: s => {
            A(s, { mood: -6 });
            if (roll(p)) { setPost(s, 4); A(s, { work: 10, oral: 5 }); aff(s, 'zhao', 8); s.vol += 10; return '唱票的时候，你的名字后面一直在加"正"字。\n你当选【院学生会主席】！'; }
            return '外联部部长拉来了企业赞助，当场宣布"明年经费翻倍"。\n你输了。'; } },
        { t: '演讲：打感情牌，讲部门里的故事', req: s => s.a.work >= 45, rq: '需要 学工≥45', fx: s => {
            A(s, { mood: -4 });
            if (roll(p + .05)) { setPost(s, 4); A(s, { work: 8 }); return '台下有人红了眼眶。\n你当选【院学生会主席】！'; }
            if (roll(.3)) return '你讲到一半忘词了，场面一度十分安静。\n落选。'; return '票数很接近，但你还是输了。'; } },
        { t: '退出竞选，把精力还给学业', d: { mood: 6 }, r: '你把竞选稿删了，打开了期末复习资料。' },
      ];
    } },
  elect_school: { title: '校学生会主席团选举', scene: 'stage', tag: '学工', cond: s => s.post === 4,
    text: s => `校团委发来通知：各学院主席可报名参选校学生会主席团。\n门槛：学工 ≥ 65（你：${s.a.work}）\n一旦当选，最后几个月会非常忙——但这份履历在研支团和保研面试中都很有分量。`,
    choices: s => [
      { t: '报名参选', req: s => s.a.work >= 65, rq: '需要 学工≥65', h: hint(sig((s.a.oral + s.a.work + s.aff.zhao * .3 - 115) / 8)), fx: s => {
          A(s, { mood: -8 }); apLose(s, 1);
          if (roll(sig((s.a.oral + s.a.work + s.aff.zhao * .3 - 115) / 8))) { setPost(s, 5); A(s, { work: 10 }); return '全校学生代表大会，你站在大礼堂的讲台上。\n你当选【校学生会主席】！（本月行动点-1）'; }
          return '其他学院的候选人太强了。\n你止步于主席团候选人。（本月行动点-1）'; } },
      { t: '不参选，站好最后一班岗', d: { mood: 4 } },
    ] },
  ask_li: { title: '李八卦的打听', tag: '社交', scene: 'canteen',
    text: s => `李八卦端着奶茶凑过来："诶，你绩点现在多少呀？听说今年名额就 ${QUOTA} 个，大家都在算呢~"\n\n（你目前：GPA ${s.a.gpa.toFixed(2)}，加分 ${s.bonus.toFixed(1)}，排名第 ${rank(s)} 名）`,
    choices: s => askLiChoices(s) },
  ask_wang: { title: '王卷卷的比较', tag: '社交', scene: 'library',
    text: '王卷卷拿着一张 Excel 表在自习室门口拦住你："夏令营前最后一次核对——你现在加分多少？"',
    choices: s => askWangChoices(s) },
  cet: { title: '四六级考试', scene: 'exam',
    text: s => s.cert.cet4 >= 425
      ? `四级已过（${s.cert.cet4}）。这次你可以考六级——六级 550+ 在面试里是实打实的加分。\n英语水平：${s.a.eng}`
      : `你的四级还没过。四级≥425 是推免资格硬门槛，没有它，排名第一也没用。\n英语水平：${s.a.eng}${s.m >= 9 ? '\n\n⚠ 这是推免前最后一次四级考试！' : ''}`,
    choices: s => {
      const four = s.cert.cet4 < 425;
      const go = b => s => {
        if (four) { const sc = cet4Score(s, b); s.cert.cet4 = Math.max(s.cert.cet4, sc);
          if (sc >= 425) { A(s, { mood: 6 }); return `四级出分：${sc}！门槛过了。`; }
          A(s, { mood: -10 }); return `四级出分：${sc}。\n差了 ${425 - sc} 分。${s.m >= 9 ? '推免资格……悬了。' : '下次必须过。'}`; }
        const sc = cet6Score(s, b); s.cert.cet6 = Math.max(s.cert.cet6, sc);
        if (sc >= 550) { A(s, { mood: 8 }); return `六级出分：${sc}！简历上英语这一栏终于好看了。`; }
        if (sc >= 425) return `六级出分：${sc}。过是过了，写在简历上有点心虚。`;
        A(s, { mood: -5 }); return `六级出分：${sc}。没过。`;
      };
      return [
        { t: '每天一套真题，死磕', h: '心态-6', fx: s => { A(s, { mood: -6, eng: 3 }); return go(25)(s); } },
        { t: '报个冲刺班（¥600）', req: s => s.coins >= 600, rq: '需要 ¥600', fx: s => { s.coins -= 600; A(s, { eng: 4 }); return go(35)(s); } },
        { t: '裸考，相信语感', fx: go(0) },
        ...(four ? [] : [{ t: '不考了，雅思才是未来', d: { mood: 3 } }]),
      ];
    } },
  pe_test: { title: '体测', scene: 'gym',
    text: s => `一年一度的体测：1000 米 / 800 米、引体向上 / 仰卧起坐、立定跳远。\n体测不合格 = 推免资格作废。\n你的体能：${s.fit}`,
    choices: s => {
      const go = b => s => { if (roll(sig((s.fit + b - 32) / 7))) { s.pe = 1; return '跑过终点线的时候，你觉得肺快炸了。\n但是——合格！'; } s.pe = 0; A(s, { mood: -10 }); return '长跑差了 8 秒。\n体测不合格。下学期还有一次补测机会。'; };
      return [
        { t: '拼了！', h: hint(sig((s.fit - 28) / 7)), fx: s => { A(s, { mood: -4 }); return go(4)(s); } },
        { t: '正常发挥', h: hint(sig((s.fit - 32) / 7)), fx: go(0) },
        { t: '找人代跑', fx: s => { if (roll(.35)) { s.f.punish = 1; s.pe = 0; A(s, { mood: -20 }); return '被体育老师当场抓住。\n学院给了你一个【警告处分】——推免资格直接作废。'; } s.pe = 1; return '代跑的同学帮你跑了个及格。\n你心里有点发虚。'; } },
      ];
    } },
  pe_retest: { title: '体测补测', scene: 'gym', cond: s => s.pe === 0 && !s.f.punish,
    text: s => `体测补测是最后机会。体能：${s.fit}`,
    choices: s => [
      { t: '咬牙跑完', h: hint(sig((s.fit - 28) / 7)), fx: s => { if (roll(sig((s.fit - 28) / 7))) { s.pe = 1; return '补测合格！你瘫在跑道边上笑了。'; } A(s, { mood: -15 }); return '又没过。\n推免资格硬门槛：体测不合格。'; } },
      { t: '开医院证明申请免测（¥300）', req: s => s.coins >= 300, rq: '需要 ¥300', fx: s => { s.coins -= 300; if (roll(.4)) { s.pe = 1; return '学校批准了你的免测申请（按合格处理）。'; } return '体育部："这个证明不符合免测条件。"'; } },
    ] },
  final1: { title: '期末周', scene: 'library',
    text: s => `期末周来临，图书馆一座难求。这学期的成绩直接计入推免排名。\n你的基础：${s.a.kn}${s.a.kn < 35 ? '\n⚠ 基础薄弱，开摆有挂科风险！' : ''}`,
    choices: s => finalChoices(s, 1) },
  final2: { title: '最后一次期末', scene: 'library',
    text: s => `这是推免前最后一个计入排名的期末。\n当前排名第 ${rank(s)} 名（推免线第 ${QUOTA} 名，你需要约 GPA ${lineGpa(s).toFixed(2)}）。`,
    choices: s => finalChoices(s, 2) },
  makeup: { title: '补考', scene: 'exam', cond: s => s.fails > 0,
    text: s => `你还有 ${s.fails} 门挂科没清。补考通过后按 60 分记，但成绩单上会留下"补考"字样（材料分扣分）。`,
    choices: s => [
      { t: '认真复习后补考', fx: s => { A(s, { mood: -5 }); if (roll(sig((s.a.kn - 20) / 8))) { s.fails--; s.makeups++; return '补考通过。门槛清掉了一条。'; } A(s, { mood: -10 }); return '补考又没过……'; } },
      { t: '找老师求情', fx: s => { if (roll(.2)) { s.fails--; s.makeups++; return '老师叹了口气："下不为例。"'; } A(s, { mood: -6 }); return '老师："我对所有学生都一样。"'; } },
    ] },

  /* ---- 大三下 ---- */
  winter: { title: '寒假计划', scene: 'home',
    text: '寒假有一个多月，这个月行动点比较多。美赛就在二月，要参加吗？',
    choices: [
      { t: '组队打美赛', h: '本月行动点-1', fx: s => { apLose(s); A(s, { comp: 6, mood: -8 });
          if (roll(.2 + s.a.comp / 130)) { s.f.award = 1; s.bonus += 1.5; A(s, { comp: 8 }); return '四天三夜，结果出来：M 奖！\n推免加分 +1.5'; }
          s.bonus += .3; return '四天三夜，H 奖。推免加分 +0.3'; } },
      { t: '报个寒假雅思班（¥2000）', req: s => s.coins >= 2000, rq: '需要 ¥2000', fx: s => { s.coins -= 2000; A(s, { eng: 12, oral: 5, mood: -4 }); }, r: '口语老师说你的发音"很有特色"。' },
      { t: '找一份寒假实习', req: s => s.roleId !== 'fuer', rq: '家里不让', fx: s => { grow(s, 'intern', 12); s.coins += 800; A(s, { mood: -6 }); }, r: '你在一家小公司做了一个月数据标注。' },
      { t: '回家过年，好好休息', d: { mood: 15 }, r: '你吃胖了三斤，精神焕发。' },
    ] },
  proj_liu: { title: '挑战杯', scene: 'stage',
    text: s => s.aff.liu >= 25
      ? '刘学长发来消息："今年挑战杯我带队冲国奖，缺一个能干活的，来不来？"'
      : `挑战杯校赛开始报名。你和刘学长不太熟（好感 ${s.aff.liu}/25），没被拉进他的队伍。`,
    choices: s => [
      ...(s.aff.liu >= 25 ? [{ t: '跟着刘学长冲国奖', h: '下月行动点-1', fx: s => {
        s.apPenalty++; A(s, { comp: 8, mood: -5 }); aff(s, 'liu', 8);
        if (roll(.45 + s.a.comp / 300)) { s.f.award = 1; s.bonus += 2; A(s, { comp: 8 }); return '挑战杯全国二等奖！\n推免加分 +2'; }
        s.bonus += 1; return '止步省赛，拿了省一。推免加分 +1'; } }] : []),
      { t: '自己拉队伍参赛', h: '下月行动点-1', fx: s => {
        s.apPenalty++; A(s, { comp: 6, mood: -6 });
        if (roll(.12 + s.a.comp / 200)) { s.bonus += 1; return '黑马！省赛一等奖。推免加分 +1'; }
        return '校赛就被刷了。评委说"创新性不足"。'; } },
      { t: '不参加', d: { mood: 3 } },
    ] },
  paper: { title: '论文机会', scene: 'lab',
    text: '组会后孙导叫住了你："有个小方向，你要不要试着写一篇？"',
    choices: [
      { t: '熬夜冲一篇一作', req: s => s.a.sci >= 35, rq: '需要 科研≥35', fx: s => { A(s, { mood: -15 }); s.apPenalty++;
          if (roll(.25 + s.a.sci / 160)) { s.f.paper = 1; s.bonus += 2; A(s, { sci: 15 }); aff(s, 'sun', 10); return '改了十一稿后——"Accept"。\n推免加分 +2（下月行动点-1）'; }
          A(s, { sci: 6 }); return '被拒稿了，审稿意见写了三页。（下月行动点-1）'; } },
      { t: '帮师兄跑实验，蹭个挂名', req: s => s.a.sci >= 15, rq: '需要 科研≥15', fx: s => { A(s, { sci: 6, mood: -5 }); aff(s, 'sun', 4);
          if (roll(.55)) { s.f.coauthor = 1; s.bonus += .5; return '师兄的论文中了，你是第三作者！推免加分 +0.5'; }
          return '实验跑完了，论文还在投。'; } },
      { t: '婉拒，专心刷绩点', d: { gpa: .04, kn: 3 }, r: '孙导点点头："也好。"' },
    ] },
  proj_zhou: { title: '互联网+', scene: 'stage',
    text: s => s.aff.zhou >= 25
      ? '周学姐："我们的互联网+项目进省赛了，还差一个人做路演，有奖金哦！"'
      : `互联网+大赛开始报名。周学姐的团队已经满员了（好感 ${s.aff.zhou}/25）。`,
    choices: s => [
      ...(s.aff.zhou >= 25 ? [{ t: '加入周学姐的团队', h: '下月行动点-1', fx: s => {
        s.apPenalty++; A(s, { comp: 5, intern: 6, oral: 6, mood: -4 }); aff(s, 'zhou', 8);
        if (roll(.55)) { s.bonus += 1; s.coins += 800; return '省赛金奖！推免加分 +1，奖金 ¥800'; }
        s.bonus += .3; return '省赛铜奖。推免加分 +0.3'; } }] : []),
      { t: '自己写商业计划书', h: '下月行动点-1', fx: s => {
        s.apPenalty++; A(s, { comp: 3, oral: 3, mood: -5 });
        if (roll(.18)) { s.bonus += .5; return '意外拿了省银！推免加分 +0.5'; }
        return '计划书被评委评价为"像在做梦"。'; } },
      { t: '不参加', d: { mood: 3 } },
    ] },
  cv: { title: '简历与文书', scene: 'desk',
    text: s => '五月，各校夏令营通知陆续发布。你需要一份简历、个人陈述和研究计划。\n（材料是五维考核之一）' + (s.f.agency ? '\n（保研机构已经帮你精修过一版了）' : ''),
    choices: [
      { t: '字斟句酌打磨', h: '本月行动点-1', fx: s => { apLose(s); s.f.cv = 1; }, r: '每个标点都被你审视过。' },
      { t: '请学长学姐帮忙改', req: s => maxSenior(s) >= 20, rq: '需要 任一学长学姐好感≥20', fx: s => { s.f.cv = 1; }, r: '学姐删掉了你写的"热爱科研"，换成了具体项目。专业。' },
      { t: '网上找个模板套一下', r: '能用就行。' },
      { t: '在简历里"适度夸张"', d: { mood: 3 }, fx: s => { s.f.cv = 1; s.f.exaggerate = 1; }, r: '"参与"变成了"主导"，"了解"变成了"精通"。\n（材料分更高，但面试被追问时会很危险）' },
    ] },
  rec_letter: { title: '推荐信', scene: 'office',
    text: s => `夏令营要求两封专家推荐信。\n孙导好感 ${s.aff.sun}（≥35 愿意写），赵老师好感 ${s.aff.zhao}（≥40 愿意写）。`,
    choices: s => [
      { t: '请孙导写', req: s => s.aff.sun >= 35, rq: '需要 孙导好感≥35', fx: s => { s.rec += s.aff.sun >= 50 ? 2 : 1; return s.aff.sun >= 50 ? '孙导写了一封很长的推荐信，还帮你给外校老师打了招呼。（推荐信 +2）' : '孙导："写好了，你自己发吧。"（推荐信 +1）'; } },
      { t: '请赵老师写学工推荐', req: s => s.aff.zhao >= 40, rq: '需要 赵老师好感≥40', fx: s => { s.rec += 1; }, r: '赵老师写了满满一页你在学生工作中的表现。（推荐信 +1）' },
      { t: '自己写好，请任课老师签字', fx: s => { if (roll(.6)) { s.rec += 1; return '老师扫了一眼就签了。（推荐信 +1）'; } return '老师："我不太了解你，不方便签。"'; } },
      { t: '先不管了', d: { mood: 2 } },
    ] },
  route: { title: '人生路线', scene: 'crossroad',
    text: s => `六月，所有人都在做选择。\n\n五维考核：${Object.entries(dims(s)).map(([k, v]) => `${DIMS[k]} ${v}`).join(' / ')}\n综合竞争力 ${G(s)}（${tierHint(G(s))}）\n实习 ${s.a.intern}　雅思 ${s.cert.ielts || '无'}　研支团 ${['未报名', '已报名', '已入选', '已确认'][Math.max(0, s.f.zj || 0)]}\n\n暑假的重心放在哪里？（资格公示时仍可改变主意）`,
    choices: [
      { t: '全力保研：夏令营', fx: s => { s.f.route = 'baoyan'; }, r: '你把各校夏令营的截止日期做成了一张表。' },
      { t: '出国：考雅思、准备申请', fx: s => { s.f.route = 'abroad'; }, r: '你在雅思官网上报了七月的考位。' },
      { t: '就业：冲互联网大厂暑期实习', fx: s => { s.f.route = 'job'; }, r: '你在招聘软件上投出了第一份简历。' },
      { t: '两手准备：夏令营 + 实习', d: { mood: -8 }, fx: s => { s.f.route = 'both'; }, r: '你的日程表上，每一格都被填满了。' },
    ] },

  /* ---- 支教保研线 ---- */
  zj_apply: { title: '研究生支教团招募', scene: 'mountain', tag: '支教',
    text: s => `校团委发布研究生支教团招募通知：服务西部一年，结束后直接攻读研究生（单列名额，不占普通推免指标）。\n\n报名条件：\n· 学工 ≥ ${zjWorkTh(s)}（你：${s.a.work}）\n· 综测排名前 60（你：第 ${rank(s)}）\n· 心态 ≥ 40（你：${s.a.mood}）`,
    choices: s => [
      { t: '报名研支团', req: s => s.a.work >= zjWorkTh(s) && rank(s) <= 60 && s.a.mood >= 40, rq: '条件不满足', fx: s => { s.f.zj = 1; A(s, { mood: 4 }); }, r: '你在报名表的"志愿理由"一栏写了很久。' },
      { t: '再想想', d: { mood: 1 } },
    ] },
  zj_interview: { title: '研支团选拔面试', scene: 'office', tag: '支教', cond: s => s.f.zj === 1,
    text: '选拔面试分为结构化面试和试讲。评委里有校团委书记和往届支教团团长。\n团长问："你能接受一年里每周只有一次热水澡吗？"',
    choices: s => {
      const p = clamp(sig((s.a.oral * .5 + s.a.work * .6 + s.aff.zhao * .3 + s.vol * .2 - 52) / 7), .05, .95);
      const go = b => s => { if (roll(clamp(p + b, .03, .97))) { s.f.zj = 2; A(s, { work: 5 }); return '一周后，公示名单上有你的名字。\n你入选了研究生支教团（待体检政审）。'; } s.f.zj = -1; A(s, { mood: -10 }); return '你落选了。\n名单上的人，大多是学生会主席和志愿服务时长几百小时的人。'; };
      return [
        { t: '讲自己的志愿服务经历', h: hint(p), fx: go(s.vol >= 60 ? .1 : 0) },
        { t: '试讲一堂初中数学课', h: hint(p + (s.a.kn - 40) / 200), fx: go((s.a.kn - 40) / 200) },
        { t: '如实说：其实也想要保研名额', fx: go(-.15) },
      ];
    } },
  zj_check: { title: '支教 · 体检与政审', scene: 'mountain', tag: '支教', cond: s => s.f.zj === 2,
    text: s => `支教团最后一关：体检 + 政审。\n体测：${s.pe === 1 ? '合格' : '不合格'}　处分：${s.f.punish ? '有' : '无'}\n\n确认后，你将锁定支教保研名额（资格公示时单独审核），放弃普通预推免。`,
    choices: s => [
      { t: '确认支教，签承诺书', req: s => s.pe === 1 && !s.f.punish, rq: '需要 体测合格且无处分', fx: s => { s.f.zj = 3; aff(s, 'zhao', 10); A(s, { mood: 10 }); }, r: '你在承诺书上签下名字。\n明年此时，你会站在西部的讲台上。' },
      { t: '放弃支教，走普通推免', fx: s => { s.f.zj = -1; aff(s, 'zhao', -10); }, r: '赵老师有点失望："那你好好准备吧。"' },
    ] },

  /* ---- 夏令营 ---- */
  camp_apply: { title: '夏令营报名', scene: 'desk', cond: s => s.f.route !== 'abroad' && s.f.route !== 'job' && s.f.zj !== 3,
    text: s => `夏令营报名系统开放了。机票酒店自理：\n${[1, 2, 3, 4].map(t => `${TIER[t]} ¥${COST[t]}`).join(' / ')}\n\n综合竞争力 ${G(s)}（${tierHint(G(s))}），钱包 ¥${s.coins}\n${[1, 2, 3].map(t => weakTxt(s, t) ? `${TIER[t]}·${weakTxt(s, t)}` : '').filter(Boolean).join('\n')}${s.roleId === 'xiaozhen' && !s.f.intel ? '\n（信息差：你不太清楚哪些营好进）' : ''}`,
    choices: s => {
      const go = list => s => {
        const gap = (s.f.intel ? 3 : 0) - (s.roleId === 'xiaozhen' && !s.f.intel ? 6 : 0);
        s.f.inCamp = list.filter(t => G(s) + gap - weak(s, t).length * 6 >= TGT[t] - 8 || roll(.1));
        s.f.reimb = s.f.inCamp.filter(() => roll(.3));
        s.f.inCamp.forEach(t => schoolName(s, t));
        if (!s.f.inCamp.length) return '你等了一个月，邮箱里只有广告。\n一个营都没入。';
        return '入营通知来了：\n' + s.f.inCamp.map(t => `  ✔ ${s.names[t]}（${TIER[t]}）${s.f.reimb.includes(t) ? '（包食宿！）' : ''}`).join('\n');
      };
      return [
        ...[1, 2, 3, 4].map(t => ({ t: `主投 ${TIER[t]}`, h: hint(chance(s, t)) + (weak(s, t).length ? ' ⚠短板' : ''), fx: go([t]) })),
        { t: '海投！各档都投', h: '心态-10', fx: s => { A(s, { mood: -10 }); return go([1, 2, 3, 4])(s); } },
      ];
    } },
  camp_travel: { title: '参营行程', scene: 'train', cond: s => s.f.inCamp && s.f.inCamp.length,
    text: s => `你入营了：\n${s.f.inCamp.map(t => `  ${s.names[t]}：¥${campCost(s, t)}`).join('\n')}\n\n钱包：¥${s.coins}。${s.f.inCamp.length > 1 ? '营期有重叠，最多只能去两个。' : ''}`,
    choices: s => {
      const list = s.f.inCamp;
      const go = ts => s => { const c = ts.reduce((x, t) => x + campCost(s, t), 0); s.coins -= c; s.f.attend = ts;
        if (ts.length) startIv(s, 'camp', ts);
        return ts.length ? `你订好了机票和酒店，花费 ¥${c}。` : '你含泪放弃了所有营。'; };
      const out = [];
      if (list.length > 1) { const two = list.slice(0, 2), c = two.reduce((x, t) => x + campCost(s, t), 0);
        out.push({ t: `去 ${two.map(t => s.names[t]).join(' + ')}（¥${c}）`, req: s => s.coins >= c, rq: `需要 ¥${c}`, fx: go(two) }); }
      list.forEach(t => out.push({ t: `只去 ${s.names[t]}（¥${campCost(s, t)}）`, req: s => s.coins >= campCost(s, t), rq: `需要 ¥${campCost(s, t)}`, fx: go([t]) }));
      out.push({ t: '钱不够，全部放弃', d: { mood: -8 }, fx: go([]) });
      return out;
    } },
  iv_intro: { title: '面试 · 英文自我介绍', scene: 'interview', tag: '面试', cond: s => s.ivCtx && s.ivCtx.kind === 'camp',
    text: s => `面试间里坐着五位老师。中间那位说："Please introduce yourself in English, in two minutes."\n\n（考察：英语 ${s.a.eng} / 表达 ${s.a.oral}）`,
    choices: [
      { t: '背好的稿子，一字不差', fx: s => ivRound(s, s.a.eng, 45) + (s.a.eng < 45 ? '\n背到一半卡住了，你的大脑一片空白。' : '\n流利，但有老师在低头看手机。') },
      { t: '少背稿，多交流', fx: s => ivRound(s, (s.a.eng + s.a.oral) / 2 + 4, 45) + '\n你试着和老师们有眼神交流。' },
      { t: '先用中文说清楚，再补几句英文', fx: s => ivRound(s, s.a.oral - 8, 45) + '\n一位老师皱了皱眉："我们说的是英文。"' },
    ] },
  iv_pro: { title: '面试 · 专业问答', scene: 'interview', tag: '面试', cond: s => !!s.ivCtx,
    text: s => `"请你讲一下快速排序的时间复杂度，最坏情况怎么优化？再说说矩阵的秩有什么几何意义。"\n\n（考察：基础 ${s.a.kn}　保研真题 ×${s.zhenti}）`,
    choices: [
      { t: '对照真题里的高频题作答', req: s => s.zhenti > 0, rq: '需要 保研真题', fx: s => ivRound(s, s.a.kn + Math.min(s.zhenti, 3) * 6, 45) + '\n这几道题，你在学姐给的真题里见过。' },
      { t: '硬答，把会的全说出来', fx: s => ivRound(s, s.a.kn, 45) },
      { t: '承认不会，但讲自己的思路', fx: s => ivRound(s, (s.a.kn + s.a.oral) / 2, 42) + '\n"不会就是不会"，老师反而点了点头。' },
    ] },
  iv_sci: { title: '面试 · 科研追问', scene: 'interview', tag: '面试', cond: s => s.ivCtx && s.ivCtx.kind === 'camp',
    text: s => `一位年轻老师翻着你的简历："你这个项目里，具体做了哪部分？${s.f.exaggerate ? '你写的是"主导"？' : ''}"\n\n（考察：科研 ${s.a.sci}${s.f.exaggerate ? '　⚠ 简历注水' : ''}）`,
    choices: [
      { t: '如实讲自己负责的部分', fx: s => ivRound(s, s.a.sci + (s.f.exaggerate ? -10 : 5), 30) + (s.f.exaggerate ? '\n老师："那简历上为什么写主导？"' : '') },
      { t: '顺着简历往大了说', fx: s => { if (s.f.exaggerate && roll(.55)) { s.ivAdj -= 10; return '（本轮表现：翻车 -10）\n老师连问三个细节，你一个都答不上来。\n"这个项目到底是谁做的？"'; } return ivRound(s, s.a.sci + 6, 30); } },
      { t: '把话题引到自己熟悉的竞赛', fx: s => ivRound(s, s.a.comp - 5, 30) + '\n"我们问的是科研。"' },
    ] },
  iv_stress: { title: '面试 · 压力面', scene: 'interview', tag: '面试', cond: s => !!s.ivCtx,
    text: s => `最后一位老师抱着胳膊："你的排名不算靠前，${s.a.sci < 30 ? '科研也几乎是空白，' : ''}我们为什么要你？"\n\n（考察：心态 ${s.a.mood} / 表达 ${s.a.oral}）`,
    choices: [
      { t: '冷静承认不足，讲成长性', fx: s => ivRound(s, (s.a.mood + s.a.oral) / 2, 40) },
      { t: '据理力争', fx: s => roll(.5) ? ivRound(s, s.a.oral + 8, 40) + '\n老师笑了："有点意思。"' : ivRound(s, s.a.oral - 15, 40) + '\n气氛变得有点僵。' },
      { t: '表忠心："我一定会来！"', fx: s => ivRound(s, s.a.mood - 5, 40) + '\n老师在本子上写了点什么。' },
    ] },
  camp_result: { title: '优营公示', scene: 'phone', cond: s => s.ivCtx && s.ivCtx.kind === 'camp',
    text: s => `面试表现合计：${s.ivAdj > 0 ? '+' : ''}${s.ivAdj}。\n营期结束，你在宾馆里一遍遍刷新官网……`,
    choices: [{ t: '查看结果', fx: s => {
      const out = [];
      for (const t of s.ivCtx.tiers) {
        if (roll(chance(s, t, s.ivAdj + (s.f.intel ? 2 : 0)))) { gain(s, t); out.push(`${s.names[t]}：优秀营员 ✔`); }
        else out.push(`${s.names[t]}：未通过 ✘${weakTxt(s, t) ? '（' + weakTxt(s, t) + '）' : ''}`);
      }
      s.ivCtx = null;
      A(s, { mood: s.offers.length ? 12 : -12 });
      return out.join('\n');
    } }] },
  summer_intern: { title: '大厂暑期实习', scene: 'office', tag: '就业', cond: s => s.f.route === 'job' || s.f.route === 'both',
    text: s => `你投的暑期实习有了回音。\n实习 ${s.a.intern}　基础 ${s.a.kn}　竞赛 ${s.a.comp}　表达 ${s.a.oral}`,
    choices: s => {
      const p = clamp(sig((jobScore(s) - 42) / 6), .03, .95);
      return [
        { t: '冲鹅厂/狼厂的核心部门', h: hint(p), fx: s => { A(s, { mood: -6 }); if (roll(p)) { s.f.bigIntern = 1; grow(s, 'intern', 18); s.coins += 4000; apLose(s); return '三轮技术面后，你拿到了暑期实习 offer！\n实习工资到账 ¥4000。（本月行动点-1）'; } return '二面挂了。面试官："基础还要再扎实一点。"'; } },
        { t: '去一家中厂刷经历', fx: s => { grow(s, 'intern', 12); s.coins += 2500; apLose(s); return '你在一家中厂做后端，工资 ¥2500。（本月行动点-1）'; } },
        { t: '不实习了，专心别的', d: { mood: 4 } },
      ];
    } },
  intern_return: { title: '转正答辩', scene: 'office', tag: '就业', cond: s => s.f.bigIntern,
    text: s => `实习结束前的转正答辩。你的 mentor 说："答辩委员会里有总监，好好准备。"\n实习 ${s.a.intern}　表达 ${s.a.oral}`,
    choices: s => {
      const p = clamp(sig((s.a.intern * .6 + s.a.oral * .4 - 40) / 6), .05, .95);
      return [
        { t: '做一份漂亮的答辩 PPT', h: hint(p), fx: s => { A(s, { mood: -5 }); if (roll(p)) { s.f.returnOffer = roll(.3 + s.a.intern / 300) ? 'sp' : 'big'; return `转正答辩通过！HR 说："${s.f.returnOffer === 'sp' ? '你是这批里最好的，给你 SP。' : '等秋招开奖吧，你已经锁定了。'}"`; } return '答辩没过。"建议秋招再试试。"'; } },
        { t: '请假去参加预推免', fx: s => { aff(s, 'zhou', -3); }, r: 'mentor 回复："……好的。"\n转正的事，大概就这样了。' },
      ];
    } },
  ielts_exam: { title: '雅思考试', scene: 'exam', tag: '出国', cond: s => s.f.route === 'abroad' || (s.f.route === 'both' && s.a.eng >= 55),
    text: s => `雅思考场在一家酒店的会议厅。考试费 ¥2170。\n英语 ${s.a.eng}　${s.cert.ielts ? '上次：' + s.cert.ielts : ''}`,
    choices: [
      { t: '去考（¥2170）', req: s => s.coins >= 2170, rq: '需要 ¥2170', fx: s => { s.coins -= 2170; const sc = ieltsScore(s); s.cert.ielts = Math.max(s.cert.ielts, sc); A(s, { mood: sc >= 7 ? 10 : sc >= 6.5 ? 3 : -8 }); return `雅思出分：${sc}${sc >= 7 ? '！可以冲顶尖学校了。' : sc >= 6.5 ? '。够用了，但不算亮眼。' : '。很多学校的门槛是 6.5……'}`; } },
      { t: '还没准备好，下次再说', d: { mood: 2 } },
    ] },
  after_camp: { title: '夏令营之后', scene: 'night',
    text: s => s.offers.length
      ? `你手握 ${offerTxt(s)} 的优营。\n导师发来消息："同学，你确定会来吗？"`
      : '八月的夜晚，你一个人走在操场上。\n夏令营结束了，预推免还有一个月。',
    choices: s => s.offers.length ? [
      { t: '口头承诺：一定来！', d: { mood: 10 }, fx: s => { s.f.promised = 1; } },
      { t: '含糊其辞，骑驴找马', d: { mood: -3 }, fx: s => { s.f.riding = (s.f.riding || 0) + 1; }, r: '"老师我会认真考虑的！"' },
    ] : [
      { t: '去海边散散心', d: { mood: 18 } },
      { t: '闭关补短板', d: { eng: 4, kn: 4, oral: 4, mood: -10 } },
      { t: '找李八卦打听捡漏信息', req: s => s.aff.li >= 20, rq: '需要 李八卦好感≥20', fx: s => { s.f.intel = 1; aff(s, 'li', 3); }, r: '李八卦给你发了一份《各校预推免缺额名单》。' },
    ] },

  /* ---- 大四上 ---- */
  qual: { title: '推免资格公示', scene: 'board',
    text: s => {
      if (s.f.misconduct) return '公示前一天，有人匿名举报了你的材料。\n学院核查后发现：你提交的成果存在造假。';
      const gs = gates(s);
      const lines = gs.map(g => `${g.ok ? '✔' : '✘'} ${g.n}：${g.v}`).join('\n');
      if (s.f.zj === 3) return `学院公示了推免名单。\n\n${lines}\n\n研究生支教团专项名额：要求排名前 60，其余门槛相同。\n` + (zjOk(s) ? '你的名字出现在"支教保研"一栏里。' : '你的支教保研资格……被卡住了。');
      return `学院公示了推免名单。\n\n${lines}\n\n` + (qualified(s) ? '你在名单上看到了自己的名字！' : '你从头到尾找了三遍……没有你的名字。');
    },
    choices: s => {
      if (s.f.misconduct) return [{ t: '……', r: '你的推免资格被取消，学院对你进行了通报。' }];
      if (s.f.zj === 3 && zjOk(s)) return [{ t: '确认支教保研', d: { mood: 15 }, fx: s => { s.f.qual = 1; s.f.zjOK = 1; } }];
      const fails = gateFails(s);
      if (!fails.length) return [
        { t: '长舒一口气，继续保研', d: { mood: 10 }, fx: s => { s.f.qual = 1; } },
        ...(s.f.returnOffer ? [{ t: '放弃名额，接受大厂转正 offer', fx: s => { s.f.track = 'job'; } }] : []),
        { t: '放弃名额，申请出国', req: s => s.a.eng >= 55, rq: '需要 英语≥55', fx: s => { s.f.track = 'abroad'; } },
        { t: '放弃名额，参加秋招', fx: s => { s.f.track = 'job'; } },
      ];
      const onlyRank = fails.length === 1 && fails[0].k === 'rank' && rank(s) <= QUOTA + 4;
      const mark = s => { s.f.gateFail = gateFails(s).filter(g => g.k !== 'rank').map(g => g.n).join('、'); };
      return [
        ...(onlyRank ? [{ t: '等待递补', fx: s => { if (roll(.3)) { s.f.qual = 1; A(s, { mood: 10 }); return '赵老师打来电话："前面有同学放弃了名额，你递补上了。"'; } s.f.track = 'kaoyan'; A(s, { mood: -10 }); return '没有人放弃名额。\n那天晚上，你默默打开了考研网课。'; } }] : []),
        ...(s.f.returnOffer ? [{ t: '还好有大厂转正 offer', fx: s => { mark(s); s.f.track = 'job'; } }] : []),
        { t: '准备考研', fx: s => { mark(s); s.f.track = 'kaoyan'; } },
        { t: '申请出国', req: s => s.a.eng >= 55, rq: '需要 英语≥55', fx: s => { mark(s); s.f.track = 'abroad'; } },
        { t: '去找工作', fx: s => { mark(s); s.f.track = 'job'; } },
      ];
    } },
  prepush: { title: '预推免', scene: 'desk', cond: s => s.f.qual && !s.f.zjOK && best(s) !== 1,
    text: s => `预推免开始了。\n综合竞争力 ${G(s)}（${tierHint(G(s))}）\n当前 offer：${s.offers.length ? offerTxt(s) : '无'}　钱包：¥${s.coins}`,
    choices: s => {
      const b = best(s);
      const list = [1, 2, 3, 4].filter(t => !b || t < b).map(t => ({
        t: `冲 ${TIER[t]}（线下 ¥${COST[t]}）`, h: hint(chance(s, t, 2)) + (weak(s, t).length ? ' ⚠短板' : ''), req: s => s.coins >= COST[t], rq: `需要 ¥${COST[t]}`,
        fx: s => { s.coins -= COST[t]; A(s, { mood: -6 }); startIv(s, 'pre', [t]); s.ivAdj = 2; schoolName(s, t); return `你订了去${s.names[t]}的车票。`; } }));
      list.push({ t: b ? '不折腾了，就它了' : '海投线上预推免', h: b ? '' : '心态-15', fx: s => {
        if (b) { A(s, { mood: 12 }); return '你把保研群设成了免打扰。'; }
        A(s, { mood: -15 }); startIv(s, 'pre', [2, 3, 4, 5]); s.ivAdj = -3; return '一周排了七场线上面试。'; } });
      return list;
    } },
  prepush_result: { title: '预推免结果', scene: 'phone', cond: s => s.ivCtx && s.ivCtx.kind === 'pre',
    text: s => `面试表现合计：${s.ivAdj > 0 ? '+' : ''}${s.ivAdj}。`,
    choices: [{ t: '查看邮件', fx: s => {
      const out = [];
      for (const t of s.ivCtx.tiers) {
        if (roll(chance(s, t, s.ivAdj + (s.f.intel ? 3 : 0)))) { gain(s, t); out.push(`${s.names[t]}：拟录取 ✔`); A(s, { mood: 8 }); }
        else out.push(`${schoolName(s, t)}：未通过 ✘${weakTxt(s, t) ? '（' + weakTxt(s, t) + '）' : ''}`);
      }
      s.ivCtx = null; return out.join('\n');
    } }] },
  drama: { title: '名额风波', scene: 'phone', cond: s => s.f.qual && !s.f.zjOK,
    text: s => s.offers.length
      ? '保研群里突然传言：今年各校名额收紧，不少人的 offer 被"候补"了。'
      : '九推前夕，你还没有 offer。听说有人手握好几个 offer，到时候会放鸽子……',
    choices: s => {
      const keep = p => s => {
        if (roll(p - (s.f.riding || 0) * .15)) return '导师回复："放心，名额给你留着。"';
        const b = best(s); s.offers = s.offers.filter(t => t !== b); A(s, { mood: -20 });
        return `导师回复："抱歉，组里名额已经满了。"\n你的 ${s.names[b]} offer……没了。` + (s.f.riding ? '\n（也许是骑驴找马被发现了？）' : '');
      };
      return s.offers.length ? [
        { t: '主动联系导师，表忠心', fx: keep(.92) },
        { t: '装死，不看不听不问', d: { mood: 5 }, fx: keep(.72) },
        { t: '同时吊着所有导师，等最好的', req: s => s.offers.length >= 2, rq: '需要 ≥2 个 offer', fx: s => {
            if (roll(.3)) { s.f.pigeon = 1; s.offers = []; return '几位导师恰好在同一个群里。\n第二天，你所有的 offer 都被收回了。'; }
            return '你同时回复了三位导师"一定来"。\n暂时，相安无事。'; } },
        { t: '再联系一个保底', d: { mood: -10 }, fx: s => { let t = ''; if (!s.offers.includes(5) && roll(.75)) { gain(s, 5); t = '本校的老师答应收你做保底。\n'; } return t + keep(.85)(s); } },
      ] : [
        { t: '疯狂给导师发邮件捡漏', d: { mood: -12 }, fx: s => {
            if (roll(chance(s, 3, s.f.intel ? 4 : -4))) { gain(s, 3); return `凌晨两点，${s.names[3]}的一位老师回复："明天来面一下？"\n捡漏成功！`; }
            if (roll(chance(s, 4, 2))) { gain(s, 4); return `发了 80 封邮件，终于有${s.names[4]}愿意要你。`; }
            if (roll(chance(s, 5, 4))) { gain(s, 5); return '本校老师看你可怜："留下来吧。"'; }
            return '80 封邮件，3 封回复，都是"名额已满"。'; } },
        { t: '放弃保研，转战考研', fx: s => { s.f.track = 'kaoyan'; } },
        { t: '放弃保研，去找工作', fx: s => { s.f.track = 'job'; } },
      ];
    } },
  ninepush: { title: '九推之夜', scene: 'night',
    text: s => {
      if (s.f.zjOK) return '推免服务系统开放了。你的支教保研名额已经锁定。\n只需要在系统里确认接收单位。';
      return s.offers.length ? `推免服务系统即将开放。\n你手上的 offer：${offerTxt(s)}` : '推免服务系统开放了，但你没有任何 offer。\n系统里还有零星几个"补录"名额在闪烁……';
    },
    choices: s => {
      if (s.f.zjOK) return [{ t: '确认支教保研', fx: s => { const t = G(s) >= TGT[3] ? 3 : 5; gain(s, t); s.f.final = t; s.f.zjFinal = 1; return `接收单位：${s.names[t]}\n"恭喜您已被录取"。`; } }];
      if (!s.offers.length) return [
        { t: '刷新系统到最后一刻', fx: s => { if (roll(.12)) { gain(s, 5); s.f.final = 5; return '凌晨，有人放弃了一个补录名额——你抢到了！'; } s.f.track = 'kaoyan'; return '系统关闭了。\n你合上电脑："考研，我来了。"'; } },
        { t: '准备考研', fx: s => { s.f.track = 'kaoyan'; } },
        { t: '去找工作', fx: s => { s.f.track = 'job'; } },
        { t: '申请出国', req: s => s.a.eng >= 55, rq: '需要 英语≥55', fx: s => { s.f.track = 'abroad'; } },
      ];
      const b = best(s);
      return [
        { t: `准时填报 ${s.names[b]}（学硕）`, fx: s => { s.f.final = b; }, r: '填报、待录取、确认——\n"恭喜您已被录取"。你截了十张图。' },
        ...(s.a.sci >= 40 && b <= 3 ? [{ t: `改报 ${s.names[b]} 直博`, fx: s => { s.f.final = b; s.f.phd = 1; }, r: '导师很高兴："直博好，我们组就缺你这样的。"' }] : []),
        { t: '前一晚通宵庆祝', d: { mood: 10 }, fx: s => { if (roll(.75)) { s.f.final = b; return '你踩着最后一刻点下了"接受"。心跳 180。'; } s.f.oversleep = 1; return '你醒来时已经是第二天下午。\n手机上有 99+ 条未读消息。'; } },
        ...(s.offers.length > 1 ? [{ t: `选离家最近的 ${s.names[Math.max(...s.offers)]}`, d: { mood: 15 }, fx: s => { s.f.final = Math.max(...s.offers); }, r: '妈妈说，离家近点好。' }] : []),
      ];
    } },

  /* ---- 其他出路 ---- */
  tr_kaoyan: { title: '考研之路', scene: 'library',
    text: s => `考研拼的是基础知识。\n基础 ${s.a.kn}　心态 ${s.a.mood}　钱包 ¥${s.coins}\n\n报考哪里？`,
    choices: s => [
      { t: '报考 985', h: hint(kyP(s, 70)), fx: kyGo(70, 0, 'top', 3) },
      { t: '报考 211 / 双一流', h: hint(kyP(s, 55)), fx: kyGo(55, 0, 'ok', 4) },
      { t: '报考本校', h: hint(kyP(s, 45)), fx: kyGo(45, 0, 'ok', 5) },
      { t: '报考研班，冲 985（¥3000）', h: hint(kyP(s, 70, 10)), req: s => s.coins >= 3000, rq: '需要 ¥3000', fx: s => { s.coins -= 3000; return kyGo(70, 10, 'top', 3)(s); } },
    ] },
  tr_abroad: { title: '留学申请', scene: 'plane',
    text: s => `GPA ${s.a.gpa.toFixed(2)}　雅思 ${s.cert.ielts || '无'}　科研 ${s.a.sci}　实习 ${s.a.intern}　推荐信 ${s.rec}\n钱包 ¥${s.coins}${s.cert.ielts ? '' : '\n⚠ 没有雅思成绩，只能临时去考一次（-¥2170）'}`,
    choices: s => {
      const ie = s.cert.ielts ? 0 : 2170;
      return [
        { t: 'DIY 申请（¥1500）', h: abroadHint(s, 0), req: s => s.coins >= 1500 + ie, rq: `需要 ¥${1500 + ie}`, fx: s => { s.coins -= 1500; return abroadGo(s, 0); } },
        { t: '找留学中介（¥8000，文书+选校）', h: abroadHint(s, 8), req: s => s.coins >= 8000 + ie, rq: `需要 ¥${8000 + ie}`, fx: s => { s.coins -= 8000; s.f.agency = s.f.agency || 1; return abroadGo(s, s.roleId === 'fuer' && roll(.3) ? -5 : 8); } },
        { t: '钱不够……转战考研', fx: s => { s.f.track = 'kaoyan'; s.queue = ['tr_kaoyan']; }, r: '你把雅思资料换成了考研资料。' },
      ];
    } },
  tr_job: { title: '秋招', scene: 'office',
    text: s => `秋招开始了。\n实习 ${s.a.intern}　基础 ${s.a.kn}　竞赛 ${s.a.comp}　表达 ${s.a.oral}${s.f.returnOffer ? '\n你手里有暑期实习的转正 offer。' : ''}`,
    choices: s => [
      ...(s.f.returnOffer ? [{ t: '接受转正 offer', fx: s => { s.f.res = s.f.returnOffer; s.f.school = pick(['鹅厂', '狼厂']); s.f.jobDone = 1; return '你在 offer 系统里点了"接受"。'; } }] : []),
      { t: '冲互联网大厂', h: hint(sig((jobScore(s) - 48) / 6)), fx: s => { s.f.jobTarget = 'big'; } },
      { t: '投中厂', h: hint(sig((jobScore(s) - 32) / 6)), fx: s => { s.f.jobTarget = 'mid'; } },
      { t: '考国企 / 央企', h: hint(soeP(s)), fx: s => { s.f.jobTarget = 'soe'; } },
    ] },
  job_test: { title: '秋招 · 笔试', scene: 'exam', cond: s => !s.f.jobDone,
    text: s => s.f.jobTarget === 'soe' ? '国企笔试：行测 + 申论 + 专业课。' : '线上笔试：四道算法题，两小时。\n摄像头开着，屏幕被监控。',
    choices: [
      { t: '认真做', fx: s => { const v = s.f.jobTarget === 'soe' ? s.a.kn + (s.a.gpa - 3) * 20 : s.a.kn * .5 + s.a.comp * .6; const g = clamp(Math.round((v - 35) / 5), -8, 6); s.ivAdj = g; return g >= 0 ? `你 A 了大部分题。（笔试 +${g}）` : `第三题超时了，第四题没看懂。（笔试 ${g}）`; } },
      { t: '找"枪手"代考', fx: s => { if (roll(.4)) { s.f.jobDone = 1; s.f.res = 'fail'; return '系统检测到异常，你的笔试成绩作废，还进了这家公司的黑名单。'; } s.ivAdj = 5; return '笔试满分。\n但面试，只能靠你自己了。'; } },
    ] },
  job_iv: { title: '秋招 · 技术面 + HR 面', scene: 'interview', cond: s => !s.f.jobDone,
    text: s => `面试官打开了你的简历："讲讲你最有挑战的一段实习经历？"\n实习 ${s.a.intern}　表达 ${s.a.oral}`,
    choices: s => {
      const go = b => s => {
        s.f.jobDone = 1;
        const x = jobScore(s, s.ivAdj + b), tg = s.f.jobTarget;
        if (tg === 'soe') { if (roll(soeP(s, s.ivAdj * 2))) { s.f.res = 'soe'; s.f.school = pick(['某电网省公司', '某银行科技子公司', '某央企研究院']); return '政审通过，国企 offer 到手！'; } s.f.res = 'fail'; return '笔试排名第 4，只招 3 个。'; }
        if (tg === 'big' && roll(sig((x - 48) / 6))) { s.f.res = x > 70 && roll(.4) ? 'sp' : 'big'; s.f.school = pick(['鹅厂', '狼厂', '猫厂', '节节高']); return `HR："恭喜你！"${s.f.res === 'sp' ? '\n还是 SP！' : ''}`; }
        if (roll(sig((x - 32) / 6))) { s.f.res = 'mid'; s.f.school = pick(['某独角兽', '某中厂', '某外企']); return tg === 'big' ? '大厂没过，但被一家中厂捞起来了。' : '中厂 offer 到手。'; }
        s.f.res = 'fail'; return '面了十几家，都没有下文。';
      };
      return [
        { t: 'STAR 法则讲项目', fx: go(3) },
        { t: '现场手撕代码', fx: go(Math.round((s.a.comp - 40) / 6)) },
        { t: '临场发挥', fx: go(0) },
      ];
    } },
};

function kyGo(th, b, res, tier) {
  return s => {
    s.f.jobDone = 1;
    s.f.school = schoolName(s, tier);
    if (roll(kyP(s, th, b))) { s.f.res = res; return `十二月，你走进考场。\n三月，成绩出来了——上线！你考上了${s.f.school}！`; }
    s.f.res = 'fail'; return '十二月，你走进考场。\n三月，成绩出来了……差了几分。';
  };
}
function soeP(s, b = 0) { return clamp(sig((s.a.kn * .5 + (s.a.gpa - 3) * 40 + s.a.work * .3 + b - 30) / 6), .03, .95); }
function abroadHint(s, b) { const x = abroadScore(s, b); return x >= 55 ? '美 Top30 有戏' : x >= 32 ? '英港新可冲' : x >= 10 ? '能申到学校' : '很悬'; }
function abroadGo(s, b) {
  if (!s.cert.ielts) { s.coins -= 2170; s.cert.ielts = ieltsScore(s, -.5); }
  s.f.jobDone = 1;
  const x = abroadScore(s, b);
  if (roll(sig((x - 55) / 6))) { s.f.res = 'us'; s.f.school = pick(['Northbridge University', 'Westlake Institute of Technology', 'Stanmore University']); return `雅思 ${s.cert.ielts}。\n邮箱里躺着一封 Offer —— 美国 Top30！`; }
  if (roll(sig((x - 32) / 6))) { s.f.res = 'uk'; s.f.school = pick(['University of Kingsbridge', 'Harbour City University', 'Lionsgate University']); return `雅思 ${s.cert.ielts}。\n你收到了英国/港新名校的录取。`; }
  if (roll(sig((x - 10) / 6))) { s.f.res = 'ok'; s.f.school = pick(['University of Eastvale', 'Marlow University']); return `雅思 ${s.cert.ielts}。\n你收到了一所 QS 200 名左右学校的录取。`; }
  s.f.res = 'fail'; return `雅思 ${s.cert.ielts}。\n申请季结束，你收到了 8 封拒信。`;
}
function zjWorkTh(s) { return s.roleId === 'ganbu' ? 25 : 35; }
function zjOk(s) { return gates(s).filter(g => g.k !== 'rank').every(g => g.ok) && rank(s) <= 60; }

function finalChoices(s, n) {
  const risk = s.a.kn < 35 || s.roleId === 'jingsai' ? .35 : .1;
  return [
    { t: '连续通宵，背到天亮', d: { gpa: .1, kn: 5, mood: -14 }, r: '你见过凌晨四点的自习室。' },
    { t: '按正常节奏复习', fx: s => { A(s, { gpa: .04, kn: 3, mood: -3 }); if (s.a.kn < 25 && roll(.25)) return failCourse(s, '数据结构'); return '不功不过，稳稳当当。'; } },
    { t: '借王卷卷的笔记', req: s => s.aff.wang >= 25, rq: '需要 王卷卷好感≥25', d: { gpa: .07, mood: -2 }, fx: s => { aff(s, 'wang', 3); }, r: '王卷卷的笔记工整得像印刷品。' },
    { t: '开摆，及格万岁', h: `挂科风险 ${Math.round(risk * 100)}%`, fx: s => { A(s, { gpa: -.1, mood: 12 }); if (roll(risk)) return failCourse(s, n === 1 ? '概率论' : '编译原理'); return '寒假提前开始了——在你的心里。'; } },
  ];
}
function askLiChoices(s) {
  return [
    { t: '如实相告', fx: s => { aff(s, 'li', 10);
        if (rank(s) <= QUOTA && roll(.5)) { s.f.rival = (s.f.rival || 0) + 1; A(s, { mood: -4 }); return `第二天，全年级都知道你排第 ${rank(s)} 名了。\n大家明显更卷了……（同学平均水平上升）`; }
        return '李八卦拍拍你："加油哦！"'; } },
    { t: '打哈哈："我就混混日子"', d: { mood: 2 }, fx: s => { aff(s, 'li', -3); }, r: '李八卦撇撇嘴，没再追问。' },
    { t: '反向打听', req: s => s.aff.li >= 20, rq: '需要 李八卦好感≥20', fx: s => { aff(s, 'li', 3); s.f.intel = 1;
        return `你套出了不少情报：\n目前推免线（第 ${QUOTA} 名）大约要 GPA ${lineGpa(s).toFixed(2)}。\n去年有三个人排名够了，却因为四级和体测被卡。`; } },
  ];
}
function askWangChoices(s) {
  return [
    { t: '摊开来比较', fx: s => {
        if (s.a.gpa >= 3.8 || s.bonus >= 4) { A(s, { mood: 8 }); aff(s, 'wang', -4); return '王卷卷看完你的数据，沉默了。'; }
        A(s, { mood: -8, kn: 2 }); return '王卷卷 GPA 3.86，加分 3.5，六级 612。\n你回宿舍的路上一直在叹气。'; } },
    { t: '提议组学习小组', fx: s => { aff(s, 'wang', 12); }, r: '王卷卷愣了一下："……行。"' },
    { t: '"我不想比较"', d: { mood: 3 }, fx: s => { aff(s, 'wang', -3); } },
  ];
}

/* 社交触发 */
const SENIOR_GIFT = { chen: '保研面试真题', liu: '机试真题', zhou: '面经合集' };
SENIORS.forEach(id => {
  EV['gift_' + id] = { title: `${npc(id).n}的礼物`, tag: '社交', scene: 'phone',
    text: `${npc(id).n}发来一个压缩包："这是我当年整理的${SENIOR_GIFT[id]}，别外传哦。"`,
    choices: [{ t: '谢谢！请你喝奶茶', fx: s => { s.zhenti++; s.coins -= Math.min(s.coins, 30); aff(s, id, 5); }, r: '获得【保研真题 ×1】\n专业问答轮会有加成。' }] };
});
EV.bond_wang = { title: '学习搭子', tag: '社交', scene: 'library', text: '王卷卷："以后一起自习吧，互相监督。"',
  choices: [{ t: '好！', fx: s => { s.f.buddy = 1; }, r: '从此自习时 GPA 和基础的收益提升。' }, { t: '我习惯一个人学', d: { mood: 3 } }] };
EV.bond_li = { title: '内部消息', tag: '社交', scene: 'canteen', text: '李八卦压低声音："告诉你个秘密，今年有几所学校预推免名额特别多……"',
  choices: [{ t: '认真记下来', fx: s => { s.f.intel = 1; }, r: '获得【情报】：入营、预推免和捡漏成功率提升。' }] };
EV.bond_zhang = { title: '室友的松弛感', tag: '社交', scene: 'dorm', text: '张佛："走，周末爬山去。人生不只有保研。"',
  choices: [{ t: '跟着去爬山', d: { mood: 15 }, fx: s => { s.f.chill = 1; s.fit += 5; }, r: '山顶的风很大。你学会了一点松弛感。\n（休息收益提升，体能+5）' }] };
