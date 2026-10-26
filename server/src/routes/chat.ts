import { Router } from 'express';
import { getStore } from '../store';
import { handleUserMessage } from '../services/chatService';
import { getCoupleForUser } from './helpers';

export const chatRouter = Router();

// 历史消息
chatRouter.get('/:coupleId/messages', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const messages = await getStore().listMessages(req.params.coupleId, 100);
  res.json({ messages });
});

// 发送消息 → 触发 AI 小章鱼（小章鱼回复经 WebSocket 推送，也同步返回）
chatRouter.post('/:coupleId/messages', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  if (req.user!.minorMode) {
    return res.status(403).json({ error: '未成年人模式下暂不支持与 AI 互动' });
  }

  const { text } = (req.body || {}) as { text?: string };
  if (!text || !text.trim()) return res.status(400).json({ error: '内容不能为空' });

  const result = await handleUserMessage(req.params.coupleId, req.user!.id, text.trim());
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json(result);
});
