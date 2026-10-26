import { randomUUID } from 'crypto';
import { chat } from '../ai/client';
import { embed } from '../ai/embed';
import { retrieveMemories } from '../ai/memory';
import { moderate } from '../compliance/moderate';
import { getStore } from '../store';
import type { Couple, Memory, MemoryType, Role } from '../types';
import { broadcast } from '../ws/chatHub';

export interface SendResult {
  userMessage: { id: string; role: Role; text: string; createdAt: number };
  octopusMessage: { id: string; role: 'octopus'; text: string; createdAt: number } | null;
  memoryWrites: Memory[];
}

function roleOf(couple: Couple, userId: string): Role {
  if (couple.memberA === userId) return 'userA';
  if (couple.memberB === userId) return 'userB';
  return 'userA';
}

// 发送用户消息并触发 AI 小章鱼回复（REST 与 WebSocket 共用）
export async function handleUserMessage(
  coupleId: string,
  userId: string,
  text: string,
): Promise<SendResult | { error: string }> {
  const store = getStore();
  const couple = await store.getCouple(coupleId);
  if (!couple) return { error: '小岛不存在' };

  const mod = await moderate(text);
  if (!mod.ok) return { error: mod.reason || '内容不合规' };

  const role = roleOf(couple, userId);
  const now = Date.now();

  const userMessage = { id: randomUUID(), coupleId, role, text, createdAt: now };
  await store.addMessage(userMessage);
  broadcast(coupleId, { type: 'message', message: userMessage });

  // 组装上下文：长期记忆 + 近期消息
  const memories = await retrieveMemories(coupleId, text);
  const recent = await store.listMessages(coupleId, 20);
  const history = recent.map((m) => ({ role: m.role, text: m.text }));

  const result = await chat({
    persona: couple.persona,
    history,
    memories,
    userText: text,
  });

  const octopusMessage = result.reply
    ? { id: randomUUID(), coupleId, role: 'octopus' as const, text: result.reply, createdAt: Date.now() }
    : null;
  if (octopusMessage) {
    await store.addMessage(octopusMessage);
    broadcast(coupleId, { type: 'message', message: octopusMessage });
  }

  const memoryWrites: Memory[] = [];
  for (const w of result.memoryWrites) {
    const memory: Memory = {
      id: randomUUID(),
      coupleId,
      type: w.type as MemoryType,
      value: w.value,
      embedding: await embed(w.value),
      confirmedBy: [userId],
      createdAt: Date.now(),
    };
    await store.addMemory(memory);
    memoryWrites.push(memory);

    // 纪念日 → 建提醒（MVP 演示：7 天后到期；真实产品接订阅消息推送）
    if (w.type === 'anniversary') {
      await store.addReminder({
        id: randomUUID(),
        coupleId,
        memoryId: memory.id,
        triggerAt: now + 7 * 24 * 60 * 60 * 1000,
        triggered: false,
      });
    }
    broadcast(coupleId, { type: 'memory', memory });
  }

  return { userMessage, octopusMessage, memoryWrites };
}
