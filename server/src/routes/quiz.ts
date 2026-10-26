import { randomUUID } from 'crypto';
import { Router } from 'express';
import { getStore } from '../store';
import { getCoupleForUser } from './helpers';

// 题库（原创，可后台扩展）
const QUESTIONS: Record<string, { text: string; options: string[] }[]> = {
  compatibility: [
    { text: '周末最想一起做什么？', options: ['宅家追剧', '出门探店', '短途旅行', '打游戏'] },
    { text: '吵架后谁先低头？', options: ['我', 'TA', '看情况', '从不吵架'] },
    { text: 'TA 最常点的饮品是？', options: ['奶茶', '咖啡', '果汁', '白水'] },
  ],
  sweetness: [
    { text: '最近一次心动瞬间是什么时候？', options: ['就在刚刚', '昨天', '上周', '记不清了'] },
    { text: '你们一天联系几次？', options: ['随时', '早晚', '偶尔', '看心情'] },
  ],
  personality: [
    { text: '你们更像哪种组合？', options: ['互补型', '同类项', '欢喜冤家', '灵魂伴侣'] },
    { text: '遇到分歧时通常？', options: ['好好沟通', '冷战', '听TA的', '听我的'] },
  ],
};

const TYPE_LABEL: Record<string, string> = {
  compatibility: '默契考验',
  sweetness: '甜度打分',
  personality: '性格适配',
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const quizRouter = Router();

// 发起评测 → 返回题目
quizRouter.post('/:coupleId', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const { type } = (req.body || {}) as { type?: string };
  const t = type && QUESTIONS[type] ? type : 'compatibility';

  const quiz = await getStore().createQuiz({
    id: randomUUID(),
    coupleId: couple.id,
    type: t as any,
    status: 'open',
    answers: {},
    createdAt: Date.now(),
  });
  res.json({ quiz, questions: QUESTIONS[t], label: TYPE_LABEL[t] });
});

// 提交答题（双方各自提交，合并答案）
quizRouter.post('/:coupleId/:quizId/answer', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const quiz = await getStore().getQuiz(req.params.quizId);
  if (!quiz || quiz.coupleId !== couple.id) return res.status(404).json({ error: '评测不存在' });

  const { answers } = (req.body || {}) as { answers?: Record<string, string> };
  const role = couple.memberA === req.user!.id ? 'A' : 'B';
  const merged = { ...(quiz.answers as Record<string, any>), [role]: answers || {} };
  await getStore().updateQuiz(quiz.id, { answers: merged });
  res.json({ ok: true });
});

// 生成专属报告
quizRouter.get('/:coupleId/:quizId/report', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const quiz = await getStore().getQuiz(req.params.quizId);
  if (!quiz || quiz.coupleId !== couple.id) return res.status(404).json({ error: '评测不存在' });

  const answers = quiz.answers as Record<string, Record<string, string>>;
  const allText = JSON.stringify(answers || {});
  const base = hashStr(allText || quiz.id);
  const score = 60 + (base % 38); // 60~97
  const dims = [
    { name: '默契', value: 55 + (base % 40) },
    { name: '甜蜜', value: 55 + ((base >> 3) % 40) },
    { name: '适配', value: 55 + ((base >> 5) % 40) },
  ];
  const report = {
    label: TYPE_LABEL[quiz.type] || '关系评测',
    score,
    dims,
    comment:
      score >= 90
        ? '天作之合！你们俩的默契度爆表，继续撒糖～'
        : score >= 75
          ? '相当契合，小章鱼看好你们！'
          : '还有升温空间，多来点互动小游戏呀。',
  };
  await getStore().updateQuiz(quiz.id, { status: 'done', report });
  res.json({ report });
});
