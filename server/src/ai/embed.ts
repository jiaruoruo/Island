import { config } from '../config';

const DIM = 256;

// 特征哈希：把文本变成 DIM 维向量（Mock 模式，无需调用 embedding API）
function featureHash(text: string): number[] {
  const vec = new Array(DIM).fill(0);
  const norm = text.toLowerCase().replace(/\s+/g, '');
  const tokens: string[] = [];
  for (let i = 0; i < norm.length; i++) {
    tokens.push(norm[i]);
    if (i + 1 < norm.length) tokens.push(norm.slice(i, i + 2)); // char bigram
  }
  for (const t of tokens) {
    let h = 0;
    for (let i = 0; i < t.length; i++) {
      h = (h * 31 + t.charCodeAt(i)) | 0;
    }
    const idx = ((h % DIM) + DIM) % DIM;
    vec[idx] += 1;
  }
  return normalize(vec);
}

function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const len = Math.sqrt(sum) || 1;
  return v.map((x) => x / len);
}

export function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot; // 向量已归一化
}

// 统一嵌入入口：Mock 用特征哈希，真实模式调用 OpenAI 兼容 embedding API
export async function embed(text: string): Promise<number[]> {
  if (config.mockAi) {
    return featureHash(text);
  }
  try {
    const res = await fetch(`${config.llmBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({ model: config.embedModel, input: text }),
    });
    if (!res.ok) throw new Error(`embedding api ${res.status}`);
    const data: any = await res.json();
    const v: number[] = data?.data?.[0]?.embedding;
    return v ? normalize(v) : featureHash(text);
  } catch (e) {
    console.warn('[embed] fallback to feature hash:', e);
    return featureHash(text);
  }
}
