import { Router } from 'express';
import { getCoupleForUser } from './helpers';

const TOPICS = [
  '如果一起去旅行，最想去哪儿？',
  '第一次见面时你对TA的第一印象？',
  '最想和TA一起尝试的新鲜事？',
  '你们之间最搞笑的一次乌龙？',
  '如果有一天时间可以任意支配，会怎么过？',
  '最想对TA说但一直没说的话？',
];

const TRUTH_OR_DARE = [
  { type: '真心话', content: '说出一个你从未告诉TA的小秘密' },
  { type: '真心话', content: '最想和TA一起完成的三个愿望？' },
  { type: '真心话', content: '最想改掉自己的哪个小毛病？' },
  { type: '大冒险', content: '给TA发一条只有三个字的甜言蜜语' },
  { type: '大冒险', content: '模仿一个可爱的动物表情并让TA猜' },
  { type: '大冒险', content: '用方言说一句"我喜欢你"' },
];

export const gameRouter = Router();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 话题盲盒
gameRouter.post('/:coupleId/topic', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  res.json({ topic: pick(TOPICS) });
});

// 真心话大冒险
gameRouter.post('/:coupleId/truth', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  res.json(pick(TRUTH_OR_DARE));
});
