import { randomUUID } from 'crypto';
import type {
  Couple,
  Friend,
  FriendRequest,
  Memory,
  Message,
  QuizSession,
  Reminder,
  Subscription,
  User,
} from '../types';
import type { Store } from './types';

// 内存实现：零依赖、开箱即跑，用于本地验证。生产请切 STORE=prisma。
export class MemoryStore implements Store {
  private users = new Map<string, User>();
  private usersByOpenid = new Map<string, User>();
  private couples = new Map<string, Couple>();
  private messages: Message[] = [];
  private memories: Memory[] = [];
  private reminders: Reminder[] = [];
  private quizzes = new Map<string, QuizSession>();
  private subscriptions = new Map<string, Subscription>();
  private friendRequests: FriendRequest[] = [];
  private friends: Friend[] = [];

  async getUserByOpenid(openid: string) {
    return this.usersByOpenid.get(openid) ?? null;
  }
  async getUserById(id: string) {
    return this.users.get(id) ?? null;
  }
  async findUserByUid(uid: string) {
    for (const u of this.users.values()) {
      if (u.uid === uid) return u;
    }
    return null;
  }
  async createUser(u: User) {
    const user = { ...u, id: u.id || randomUUID() };
    this.users.set(user.id, user);
    this.usersByOpenid.set(user.openid, user);
    return user;
  }

  async createCouple(c: Couple) {
    const couple = { ...c, id: c.id || randomUUID() };
    this.couples.set(couple.id, couple);
    return couple;
  }
  async getCouple(id: string) {
    return this.couples.get(id) ?? null;
  }
  async getCoupleByInviteCode(inviteCode: string) {
    for (const c of this.couples.values()) {
      if (c.inviteCode === inviteCode) return c;
    }
    return null;
  }
  async listCouplesByUser(userId: string) {
    return [...this.couples.values()].filter(
      (c) => c.memberA === userId || c.memberB === userId,
    );
  }
  async updateCouple(id: string, patch: Partial<Couple>) {
    const c = this.couples.get(id);
    if (!c) return null;
    const next = { ...c, ...patch, id };
    this.couples.set(id, next);
    return next;
  }

  async addMessage(m: Message) {
    this.messages.push({ ...m, id: m.id || randomUUID() });
  }
  async listMessages(coupleId: string, limit = 50) {
    return this.messages
      .filter((m) => m.coupleId === coupleId)
      .slice(-limit);
  }

  async addMemory(m: Memory) {
    const mem = { ...m, id: m.id || randomUUID() };
    this.memories.push(mem);
    return mem;
  }
  async listMemories(coupleId: string) {
    return this.memories.filter((m) => m.coupleId === coupleId);
  }
  async getMemory(id: string) {
    return this.memories.find((m) => m.id === id) ?? null;
  }
  async deleteMemory(id: string) {
    this.memories = this.memories.filter((m) => m.id !== id);
  }

  async addReminder(r: Reminder) {
    this.reminders.push({ ...r, id: r.id || randomUUID() });
  }
  async listDueReminders(now: number) {
    return this.reminders.filter((r) => !r.triggered && r.triggerAt <= now);
  }
  async markReminderTriggered(id: string) {
    const r = this.reminders.find((x) => x.id === id);
    if (r) r.triggered = true;
  }

  async createQuiz(q: QuizSession) {
    const quiz = { ...q, id: q.id || randomUUID() };
    this.quizzes.set(quiz.id, quiz);
    return quiz;
  }
  async getQuiz(id: string) {
    return this.quizzes.get(id) ?? null;
  }
  async updateQuiz(id: string, patch: Partial<QuizSession>) {
    const q = this.quizzes.get(id);
    if (!q) return null;
    const next = { ...q, ...patch, id };
    this.quizzes.set(id, next);
    return next;
  }
  async listQuizzes(coupleId: string) {
    return [...this.quizzes.values()].filter((q) => q.coupleId === coupleId);
  }

  async setSubscription(s: Subscription) {
    this.subscriptions.set(s.coupleId, s);
    return s;
  }
  async getSubscription(coupleId: string) {
    return this.subscriptions.get(coupleId) ?? null;
  }

  async createFriendRequest(r: FriendRequest) {
    const fr = { ...r, id: r.id || randomUUID() };
    this.friendRequests.push(fr);
    return fr;
  }
  async getFriendRequest(id: string) {
    return this.friendRequests.find((x) => x.id === id) ?? null;
  }
  async listFriendRequestsTo(userId: string) {
    return this.friendRequests.filter((r) => r.toUserId === userId);
  }
  async listFriendRequestsFrom(userId: string) {
    return this.friendRequests.filter((r) => r.fromUserId === userId);
  }
  async updateFriendRequest(id: string, patch: Partial<FriendRequest>) {
    const r = this.friendRequests.find((x) => x.id === id);
    if (!r) return null;
    Object.assign(r, patch, { id });
    return r;
  }
  async addFriend(f: Friend) {
    const fr = { ...f, id: f.id || randomUUID() };
    this.friends.push(fr);
    return fr;
  }
  async listFriends(userId: string) {
    return this.friends.filter((f) => f.userId === userId);
  }
  async getFriendBetween(a: string, b: string) {
    return (
      this.friends.find(
        (f) =>
          (f.userId === a && f.friendId === b) ||
          (f.userId === b && f.friendId === a),
      ) ?? null
    );
  }
}
