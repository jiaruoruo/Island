// 全功能自动化测试：跑通小程序调用的所有后端接口（需先启动后端）
// 用法：node scripts/smoke-all.js
const BASE = process.env.BASE || 'http://localhost:3000';

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log('  \u2713 ' + name);
  } else {
    fail++;
    console.error('  \u2717 ' + name + (extra ? '  -> ' + JSON.stringify(extra) : ''));
  }
}

async function call(path, opts = {}) {
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {}),
    },
    body: opts.data ? JSON.stringify(opts.data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

(async () => {
  const suffix = Date.now();

  // 1. 健康检查
  console.log('\n[1] 健康检查');
  const health = await call('/api/health');
  ok('GET /api/health', health.status === 200 && health.body.ok === true, health);

  // 2. 登录（成年 A / 成年 B / 未成年 C）
  console.log('\n[2] 登录与年龄核验');
  const a = await call('/api/auth/login', { method: 'POST', data: { code: 'a' + suffix, nickname: 'A', adult: true } });
  ok('登录 A 成功', a.status === 200 && !!a.body.token);
  ok('A 为成年', a.body.user && a.body.user.adult === true && a.body.user.minorMode === false);

  const b = await call('/api/auth/login', { method: 'POST', data: { code: 'b' + suffix, nickname: 'B', adult: true } });
  ok('登录 B 成功', b.status === 200 && !!b.body.token);

  const minor = await call('/api/auth/login', { method: 'POST', data: { code: 'm' + suffix, nickname: 'M', adult: false } });
  ok('未成年人登录被拒(403)', minor.status === 403 && !minor.body.token, minor);

  // 3. 建岛 + 加入
  console.log('\n[3] 建岛与加入');
  const couple = await call('/api/couples', { method: 'POST', token: a.body.token, data: { name: '测试小岛', persona: 'sassy' } });
  const cid = couple.body.couple && couple.body.couple.id;
  const invite = couple.body.inviteCode;
  ok('建岛成功', couple.status === 200 && !!cid);
  ok('邀请码为 8 位数字', typeof invite === 'string' && /^\d{8}$/.test(invite), invite);

  const joined = await call('/api/couples/' + invite + '/join', { method: 'POST', token: b.body.token });
  ok('B 通过邀请码加入', joined.status === 200 && joined.body.couple.memberB === b.body.user.id);

  // 4. 群聊 AI + 记忆
  console.log('\n[4] 三人群聊与共享记忆');
  const send = await call('/api/chat/' + cid + '/messages', { method: 'POST', token: a.body.token, data: { text: '下个月是我们的周年纪念日，我想去海边' } });
  ok('AI 小章鱼回复', send.status === 200 && !!send.body.octopusMessage);
  ok('自动抽取记忆', send.body.memoryWrites && send.body.memoryWrites.length > 0);

  const msgs = await call('/api/chat/' + cid + '/messages', { token: a.body.token });
  ok('历史消息 >= 2 条', msgs.body.messages && msgs.body.messages.length >= 2);

  const mems = await call('/api/memory/' + cid, { token: a.body.token });
  ok('记忆已落库', mems.body.memories && mems.body.memories.length >= 1);

  // 5. 记忆增删查
  console.log('\n[5] 记忆增删查');
  const addMem = await call('/api/memory/' + cid, { method: 'POST', token: a.body.token, data: { type: 'preference', value: 'A 喜欢喝奶茶' } });
  ok('手动新增记忆', addMem.status === 200 && !!addMem.body.memory.id);

  const search = await call('/api/memory/' + cid + '/search', { method: 'POST', token: a.body.token, data: { query: '海边' } });
  ok('语义检索', search.status === 200 && Array.isArray(search.body.memories));

  const delNo = await call('/api/memory/' + cid + '/' + addMem.body.memory.id, { method: 'DELETE', token: a.body.token, data: {} });
  ok('未双人确认删除被拒(400)', delNo.status === 400);

  const delYes = await call('/api/memory/' + cid + '/' + addMem.body.memory.id, { method: 'DELETE', token: a.body.token, data: { both: true } });
  ok('双人确认删除成功', delYes.status === 200 && delYes.body.ok === true);

  // 6. 关系评测
  console.log('\n[6] 关系评测');
  const quiz = await call('/api/quiz/' + cid, { method: 'POST', token: a.body.token, data: { type: 'compatibility' } });
  ok('发起评测并返回题目', quiz.status === 200 && quiz.body.questions && quiz.body.questions.length > 0);
  const quizId = quiz.body.quiz.id;
  const answers = {};
  quiz.body.questions.forEach((q, i) => { answers[i] = q.options[0]; });
  const ans = await call('/api/quiz/' + cid + '/' + quizId + '/answer', { method: 'POST', token: a.body.token, data: { answers } });
  ok('提交答题', ans.status === 200);
  const report = await call('/api/quiz/' + cid + '/' + quizId + '/report', { token: a.body.token });
  ok('生成报告含分数', report.status === 200 && typeof report.body.report.score === 'number');

  // 7. 互动游戏
  console.log('\n[7] 互动游戏');
  const topic = await call('/api/game/' + cid + '/topic', { method: 'POST', token: a.body.token });
  ok('话题盲盒', topic.status === 200 && typeof topic.body.topic === 'string');
  const truth = await call('/api/game/' + cid + '/truth', { method: 'POST', token: a.body.token });
  ok('真心话大冒险', truth.status === 200 && truth.body.type && truth.body.content);

  // 8. 约会攻略
  console.log('\n[8] 约会攻略');
  const plan = await call('/api/planner/' + cid + '/plan', { method: 'POST', token: a.body.token, data: { city: '上海', preference: '浪漫', budget: '适中' } });
  ok('生成约会攻略', plan.status === 200 && plan.body.plan.schedule && plan.body.plan.schedule.length > 0);

  // 9. 会员订阅
  console.log('\n[9] 会员订阅');
  const sub0 = await call('/api/subscription/' + cid, { token: a.body.token });
  ok('默认免费会员', sub0.status === 200 && sub0.body.subscription.plan === 'free');
  const sub1 = await call('/api/subscription/' + cid + '/subscribe', { method: 'POST', token: a.body.token, data: { plan: 'plus' } });
  ok('开通 PLUS(Mock)', sub1.status === 200 && sub1.body.subscription.plan === 'plus');

  // 10. 合规拦截
  console.log('\n[10] 合规拦截');
  const badChat = await call('/api/chat/' + cid + '/messages', { method: 'POST', token: a.body.token, data: { text: '来赌博吧' } });
  ok('敏感词拦截(400)', badChat.status === 400);

  console.log('\n===== 结果: 通过 ' + pass + ' / 失败 ' + fail + ' =====');
  if (fail > 0) process.exit(1);
})();
