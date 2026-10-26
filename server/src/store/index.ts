import { config } from '../config';
import { MemoryStore } from './memoryStore';
import { PrismaStore } from './prismaStore';
import type { Store } from './types';

// 根据 env 选择存储实现：memory（默认，零依赖）或 prisma（PostgreSQL）
let instance: Store | null = null;

export function getStore(): Store {
  if (!instance) {
    if (config.store === 'prisma') {
      instance = new PrismaStore();
    } else {
      instance = new MemoryStore();
    }
  }
  return instance;
}
