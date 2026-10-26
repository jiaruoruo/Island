// 领域类型：前后端共享字段语义（与 prisma schema 保持一致）

export type Persona = 'sweet' | 'sassy' | 'reliable'; // 甜妹 | 毒舌 | 靠谱
export type MemoryType =
  | 'anniversary'
  | 'wish'
  | 'promise'
  | 'preference'
  | 'note';
export type Role = 'userA' | 'userB' | 'octopus';

export interface User {
  id: string;
  openid: string;
  uid: string; // 小岛号（8位数字，用于搜索加好友）
  nickname: string;
  adult: boolean;
  minorMode: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: number;
}

export interface Couple {
  id: string;
  name: string;
  memberA: string; // 用户A id
  memberB?: string | null; // 用户B id（未加入时为空）
  persona: Persona;
  inviteCode: string; // 8 位数字邀请码（加入小岛用）
  createdAt: number;
}

export interface Message {
  id: string;
  coupleId: string;
  role: Role;
  text: string;
  createdAt: number;
}

export interface Memory {
  id: string;
  coupleId: string;
  type: MemoryType;
  value: string;
  embedding: number[];
  confirmedBy: string[];
  createdAt: number;
}

export interface Reminder {
  id: string;
  coupleId: string;
  memoryId: string;
  triggerAt: number;
  triggered: boolean;
}

export interface QuizSession {
  id: string;
  coupleId: string;
  type: 'compatibility' | 'sweetness' | 'personality';
  status: 'open' | 'done';
  answers: Record<string, unknown>;
  report?: Record<string, unknown> | null;
  createdAt: number;
}

export interface Subscription {
  coupleId: string;
  plan: 'free' | 'plus';
  expireAt?: number | null;
}

export const MEMORY_TYPE_LABEL: Record<MemoryType, string> = {
  anniversary: '纪念日',
  wish: '心愿',
  promise: '约定',
  preference: '喜好',
  note: '备注',
};

export const PERSONA_LABEL: Record<Persona, string> = {
  sweet: '甜妹',
  sassy: '毒舌',
  reliable: '靠谱',
};
