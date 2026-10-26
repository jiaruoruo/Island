import { getStore } from '../store';
import type { Memory } from '../types';
import { cosine, embed } from './embed';

// 向量召回：给定主题，从该小岛的长期记忆中检索最相关 topK 条
export async function retrieveMemories(
  coupleId: string,
  topic: string,
  topK = 5,
): Promise<Memory[]> {
  const store = getStore();
  const all = await store.listMemories(coupleId);
  if (all.length === 0) return [];
  if (!topic.trim()) return all.slice(0, topK);

  const q = await embed(topic);
  const scored = all.map((m) => ({ m, score: cosine(q, m.embedding || []) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((x) => x.m);
}

// 周期摘要压缩：把同类型零散记忆凝成一条摘要，降低后续 prompt 长度。
// MVP 中作为一个可调用工具暴露，可在定时任务里周期性执行。
export async function compressMemories(coupleId: string): Promise<number> {
  const store = getStore();
  const all = await store.listMemories(coupleId);
  const byType = new Map<string, Memory[]>();
  for (const m of all) {
    const arr = byType.get(m.type) || [];
    arr.push(m);
    byType.set(m.type, arr);
  }

  let removed = 0;
  for (const [type, list] of byType) {
    if (list.length <= 3) continue;
    const summaryValue = list.map((m) => m.value.replace(/^(纪念日|心愿|约定|喜好|备注)：/, '')).join('；');
    await store.addMemory({
      id: '',
      coupleId,
      type: type as Memory['type'],
      value: `摘要(${type}): ${summaryValue}`,
      embedding: await embed(summaryValue),
      confirmedBy: ['system'],
      createdAt: Date.now(),
    });
    for (const m of list) {
      await store.deleteMemory(m.id);
      removed++;
    }
  }
  return removed;
}
