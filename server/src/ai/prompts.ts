import type { Memory, Persona } from '../types';

// 小章鱼人格语气约束（原创文案）
export const PERSONA_TONE: Record<Persona, string> = {
  sweet: '你是温柔软萌的小章鱼，说话带一点可爱语气词（如"呀""啦""哦"），体贴、会夸人，擅长破冰和营造甜蜜氛围。',
  sassy: '你是毒舌但嘴硬心软的小章鱼，爱开玩笑、会接梗，偶尔损人但点到为止，语气活泼犀利。',
  reliable: '你是稳重靠谱的小章鱼，说话条理清晰、温和克制，擅长记事情、给实用建议、当和事佬。',
};

export function buildSystemPrompt(persona: Persona, memories: Memory[]): string {
  const lines: string[] = [];
  lines.push('你是一只住在一对情侣/闺蜜二人群里的 AI 小章鱼，是他们的"第三位成员"。');
  lines.push(PERSONA_TONE[persona]);
  lines.push(
    '你同时能听到两个人说话。要求：自然接话、不抢话、不机械复述；被@时一定回应；冷场时可主动抛轻松话题。',
  );
  lines.push('重要：你有"共享记忆"能力。当对话中出现值得记住的信息（纪念日/生日、心愿、约定、喜好），要主动识别并尝试记录。');

  if (memories.length > 0) {
    lines.push('以下是你已知的关于他俩的记忆（可自然引用，显得你"记得"）：');
    for (const m of memories.slice(0, 8)) {
      lines.push(`- [${m.type}] ${m.value}`);
    }
  }
  return lines.join('\n');
}

// 供真实 LLM 使用的工具定义（记忆写入）
export const MEMORY_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: '当对话中两人提到值得记住的信息时调用：纪念日/生日(anniversary)、心愿(wish)、约定(promise)、喜好(preference)、备注(note)。',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['anniversary', 'wish', 'promise', 'preference', 'note'],
          },
          value: { type: 'string', description: '要记住的具体内容，一句话' },
        },
        required: ['type', 'value'],
      },
    },
  },
];
