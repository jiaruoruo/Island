import { randomUUID } from 'crypto';
import { Router } from 'express';
import { getStore } from '../store';
import type { Persona } from '../types';

export const coupleRouter = Router();

// 生成 8 位数字邀请码
function genInviteCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

// 新建小岛（建岛）：name + 小章鱼性格
coupleRouter.post('/', async (req, res) => {
  const user = req.user!;
  const { name, persona } = (req.body || {}) as {
    name?: string;
    persona?: Persona;
  };
  const store = getStore();
  let inviteCode = genInviteCode();
  while (await store.getCoupleByInviteCode(inviteCode)) {
    inviteCode = genInviteCode();
  }
  const couple = await store.createCouple({
    id: randomUUID(),
    name: name || '我们的小岛',
    memberA: user.id,
    memberB: null,
    persona: persona || 'sweet',
    inviteCode,
    createdAt: Date.now(),
  });
  res.json({ couple, inviteCode });
});

// 我加入的小岛列表
coupleRouter.get('/', async (req, res) => {
  const list = await getStore().listCouplesByUser(req.user!.id);
  res.json({ couples: list });
});

// 小岛详情
coupleRouter.get('/:id', async (req, res) => {
  const couple = await getStore().getCouple(req.params.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  res.json({ couple });
});

// 受邀方加入小岛（按 8 位邀请码）
coupleRouter.post('/:id/join', async (req, res) => {
  const user = req.user!;
  const couple = await getStore().getCoupleByInviteCode(req.params.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在或邀请码错误' });
  if (couple.memberA === user.id) return res.json({ couple });
  if (couple.memberB && couple.memberB !== user.id) {
    return res.status(403).json({ error: '该小岛已有两个人' });
  }
  const updated = await getStore().updateCouple(couple.id, { memberB: user.id });
  res.json({ couple: updated });
});
