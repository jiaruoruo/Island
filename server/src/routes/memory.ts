import { randomUUID } from 'crypto';
import { Router } from 'express';
import { embed } from '../ai/embed';
import { retrieveMemories } from '../ai/memory';
import { getStore } from '../store';
import type { MemoryType } from '../types';
import { getCoupleForUser } from './helpers';

export const memoryRouter = Router();

// 共享记忆列表
memoryRouter.get('/:coupleId', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const memories = await getStore().listMemories(req.params.coupleId);
  res.json({ memories });
});

// 手动新增记忆
memoryRouter.post('/:coupleId', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const { type, value } = (req.body || {}) as { type?: MemoryType; value?: string };
  if (!type || !value) return res.status(400).json({ error: 'type 与 value 必填' });

  const memory = await getStore().addMemory({
    id: randomUUID(),
    coupleId: couple.id,
    type,
    value,
    embedding: await embed(value),
    confirmedBy: [req.user!.id],
    createdAt: Date.now(),
  });
  res.json({ memory });
});

// 语义检索（"我想吃的那家店叫什么" → 召回相关记忆）
memoryRouter.post('/:coupleId/search', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const { query } = (req.body || {}) as { query?: string };
  const memories = await retrieveMemories(couple.id, query || '');
  res.json({ memories });
});

// 删除记忆（双人确认：需 body.both=true，模拟双方同意防一方抹除）
memoryRouter.delete('/:coupleId/:memoryId', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const { both } = (req.body || {}) as { both?: boolean };
  if (!both) return res.status(400).json({ error: '删除共同记忆需双方确认' });

  const memory = await getStore().getMemory(req.params.memoryId);
  if (!memory || memory.coupleId !== couple.id) {
    return res.status(404).json({ error: '记忆不存在' });
  }
  await getStore().deleteMemory(memory.id);
  res.json({ ok: true });
});

// 到期提醒列表
memoryRouter.get('/:coupleId/reminders', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const due = await getStore().listDueReminders(Date.now());
  res.json({ reminders: due.filter((r) => r.coupleId === couple.id) });
});
