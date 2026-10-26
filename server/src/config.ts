import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function bool(v: string | undefined, def: boolean): boolean {
  if (v === undefined) return def;
  return v === 'true' || v === '1';
}

export const config = {
  port: Number(process.env.PORT || 3000),
  store: (process.env.STORE || 'memory') as 'memory' | 'prisma',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://twoo:twoo@localhost:5432/twoo?schema=public',

  mockAi: bool(process.env.MOCK_AI, true),
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
  embedModel: process.env.EMBED_MODEL || 'text-embedding-3-small',

  mockAuth: bool(process.env.MOCK_AUTH, true),
  mockPay: bool(process.env.MOCK_PAY, true),
  wxAppid: process.env.WX_APPID || '',
  wxSecret: process.env.WX_SECRET || '',
};
