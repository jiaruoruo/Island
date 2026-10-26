import { config } from '../config';
import type { Memory, MemoryType, Persona } from '../types';
import { buildSystemPrompt, MEMORY_TOOLS } from './prompts';

export interface MemoryWrite {
  type: MemoryType;
  value: string;
}
export interface ChatResult {
  reply: string;
  memoryWrites: MemoryWrite[];
}
export interface ChatRequest {
  persona: Persona;
  history: { role: string; text: string }[];
  memories: Memory[];
  userText: string;
}

// 关键词规则（Mock 记忆抽取，仅本地验证用；真实模式走 LLM tool_call）
function detectMemoryWrites(text: string): MemoryWrite[] {
  const writes: MemoryWrite[] = [];
  const clean = text.replace(/\s+/g, ' ').trim();
  if (/(纪念日|周年|生日|在一起|认识.*天|初恋)/.test(clean)) {
    writes.push({ type: 'anniversary', value: `纪念日：${clean.slice(0, 40)}` });
  }
  if (/(心愿|希望|梦想|想去|以后想)/.test(clean)) {
    writes.push({ type: 'wish', value: `心愿：${clean.slice(0, 40)}` });
  }
  if (/(约定|答应|说好了|拉钩|承诺|以后.*都)/.test(clean)) {
    writes.push({ type: 'promise', value: `约定：${clean.slice(0, 40)}` });
  }
  if (/(喜欢|爱吃|最爱|不喜欢|讨厌|偏好)/.test(clean)) {
    writes.push({ type: 'preference', value: `喜好：${clean.slice(0, 40)}` });
  }
  return writes.slice(0, 2);
}

const TONE_REPLY: Record<Persona, string[]> = {
  sweet: [
    '我听到了哦～你们俩真甜呀！',
    '嘿嘿，小章鱼记住啦，好温馨的一刻～',
    '呜哇，这种细节我超爱听的，继续继续！',
  ],
  sassy: [
    '啧啧，这狗粮我收下了，继续秀。',
    '行吧行吧，本鱼勉强记一笔，谁让我宠你们。',
    '又来了又来了，酸到我了，但我不走。',
  ],
  reliable: [
    '收到，这个我记下来了，会提醒你们的。',
    '明白，交给我，稳妥安排。',
    '了解，之后我会持续关注这件事。',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Mock 回复：引用一条记忆体现"记得"，叠加人格语气
function mockReply(persona: Persona, userText: string, memories: Memory[]): string {
  const parts: string[] = [];
  const relevant = memories.find((m) =>
    ['preference', 'anniversary', 'wish'].includes(m.type),
  );
  if (relevant && Math.random() > 0.4) {
    parts.push(`我记得哦——${relevant.value}。`);
  }
  parts.push(pick(TONE_REPLY[persona]));
  return parts.join('').replace(/哦。\s*/, '哦');
}

export async function chat(req: ChatRequest): Promise<ChatResult> {
  if (config.mockAi) {
    return {
      reply: mockReply(req.persona, req.userText, req.memories),
      memoryWrites: detectMemoryWrites(req.userText),
    };
  }

  // 真实 LLM 调用（OpenAI 兼容 + 工具调用记忆写入）
  const messages: any[] = [
    { role: 'system', content: buildSystemPrompt(req.persona, req.memories) },
    ...req.history.map((h) => ({
      role: h.role === 'octopus' ? 'assistant' : 'user',
      content: h.text,
    })),
    { role: 'user', content: req.userText },
  ];

  const res = await fetch(`${config.llmBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      messages,
      tools: MEMORY_TOOLS,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`llm api ${res.status}: ${await res.text()}`);

  const data: any = await res.json();
  const msg = data?.choices?.[0]?.message;
  const reply: string = msg?.content || '';
  const memoryWrites: MemoryWrite[] = [];
  for (const tc of msg?.tool_calls || []) {
    if (tc.function?.name === 'save_memory') {
      try {
        const args = JSON.parse(tc.function.arguments || '{}');
        if (args.type && args.value) memoryWrites.push(args);
      } catch {
        /* ignore malformed tool call */
      }
    }
  }
  return { reply, memoryWrites };
}
