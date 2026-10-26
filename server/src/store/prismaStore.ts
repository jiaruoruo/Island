import { randomUUID } from 'crypto';
import { getPrisma } from '../db/prisma';
import type {
  Couple,
  Friend,
  FriendRequest,
  Memory,
  MemoryType,
  Message,
  Persona,
  QuizSession,
  Reminder,
  Role,
  Subscription,
  User,
} from '../types';
import type { Store } from './types';

// Prisma 实现：生产路径。需先 docker compose up -d 并 prisma migrate dev。
export class PrismaStore implements Store {
  private get p() {
    return getPrisma();
  }

  private userOut(u: any): User {
    return {
      id: u.id,
      openid: u.openid,
      uid: u.uid,
      nickname: u.nickname,
      adult: u.adult,
      minorMode: u.minorMode,
    };
  }
  private coupleOut(c: any): Couple {
    return {
      id: c.id,
      name: c.name,
      memberA: c.memberA,
      memberB: c.memberB,
      persona: c.persona as Persona,
      inviteCode: c.inviteCode,
      createdAt: new Date(c.createdAt).getTime(),
    };
  }
  private messageOut(m: any): Message {
    return {
      id: m.id,
      coupleId: m.coupleId,
      role: m.role as Role,
      text: m.text,
      createdAt: new Date(m.createdAt).getTime(),
    };
  }
  private memoryOut(m: any): Memory {
    return {
      id: m.id,
      coupleId: m.coupleId,
      type: m.type as MemoryType,
      value: m.value,
      embedding: (m.embedding as number[]) || [],
      confirmedBy: m.confirmedBy as string[],
      createdAt: new Date(m.createdAt).getTime(),
    };
  }

  async getUserByOpenid(openid: string) {
    const u = await this.p.user.findUnique({ where: { openid } });
    return u ? this.userOut(u) : null;
  }
  async getUserById(id: string) {
    const u = await this.p.user.findUnique({ where: { id } });
    return u ? this.userOut(u) : null;
  }
  async findUserByUid(uid: string) {
    const u = await this.p.user.findUnique({ where: { uid } });
    return u ? this.userOut(u) : null;
  }
  async updateUser(id: string, patch: Partial<User>) {
    const data: { nickname?: string; minorMode?: boolean } = {};
    if (patch.nickname !== undefined) data.nickname = patch.nickname;
    if (patch.minorMode !== undefined) data.minorMode = patch.minorMode;
    if (!Object.keys(data).length) {
      const u = await this.p.user.findUnique({ where: { id } });
      return u ? this.userOut(u) : null;
    }
    const updated = await this.p.user.update({ where: { id }, data });
    return this.userOut(updated);
  }
  async createUser(u: User) {
    const created = await this.p.user.create({
      data: {
        id: u.id || randomUUID(),
        openid: u.openid,
        uid: u.uid,
        nickname: u.nickname,
        adult: u.adult,
        minorMode: u.minorMode,
      },
    });
    return this.userOut(created);
  }

  async createCouple(c: Couple) {
    const created = await this.p.couple.create({
      data: {
        id: c.id || randomUUID(),
        name: c.name,
        memberA: c.memberA,
        memberB: c.memberB,
        persona: c.persona,
        inviteCode: c.inviteCode,
      },
    });
    return this.coupleOut(created);
  }
  async getCouple(id: string) {
    const c = await this.p.couple.findUnique({ where: { id } });
    return c ? this.coupleOut(c) : null;
  }
  async getCoupleByInviteCode(inviteCode: string) {
    const c = await this.p.couple.findUnique({ where: { inviteCode } });
    return c ? this.coupleOut(c) : null;
  }
  async listCouplesByUser(userId: string) {
    const list = await this.p.couple.findMany({
      where: { OR: [{ memberA: userId }, { memberB: userId }] },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((c) => this.coupleOut(c));
  }
  async updateCouple(id: string, patch: Partial<Couple>) {
    const c = await this.p.couple.update({
      where: { id },
      data: {
        name: patch.name,
        memberB: patch.memberB,
        persona: patch.persona,
      },
    });
    return this.coupleOut(c);
  }

  async addMessage(m: Message) {
    await this.p.message.create({
      data: {
        id: m.id || randomUUID(),
        coupleId: m.coupleId,
        role: m.role,
        text: m.text,
      },
    });
  }
  async listMessages(coupleId: string, limit = 50) {
    const list = await this.p.message.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return list.map((m) => this.messageOut(m));
  }

  async addMemory(m: Memory) {
    const created = await this.p.memory.create({
      data: {
        id: m.id || randomUUID(),
        coupleId: m.coupleId,
        type: m.type,
        value: m.value,
        embedding: m.embedding as any,
        confirmedBy: m.confirmedBy,
      },
    });
    return this.memoryOut(created);
  }
  async listMemories(coupleId: string) {
    const list = await this.p.memory.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((m) => this.memoryOut(m));
  }
  async getMemory(id: string) {
    const m = await this.p.memory.findUnique({ where: { id } });
    return m ? this.memoryOut(m) : null;
  }
  async deleteMemory(id: string) {
    await this.p.memory.delete({ where: { id } });
  }

  async addReminder(r: Reminder) {
    await this.p.reminder.create({
      data: {
        id: r.id || randomUUID(),
        coupleId: r.coupleId,
        memoryId: r.memoryId,
        triggerAt: new Date(r.triggerAt),
        triggered: r.triggered,
      },
    });
  }
  async listDueReminders(now: number) {
    const list = await this.p.reminder.findMany({
      where: { triggered: false, triggerAt: { lte: new Date(now) } },
    });
    return list.map((r) => ({
      id: r.id,
      coupleId: r.coupleId,
      memoryId: r.memoryId,
      triggerAt: new Date(r.triggerAt).getTime(),
      triggered: r.triggered,
    }));
  }
  async markReminderTriggered(id: string) {
    await this.p.reminder.update({
      where: { id },
      data: { triggered: true },
    });
  }

  async createQuiz(q: QuizSession) {
    await this.p.quizSession.create({
      data: {
        id: q.id || randomUUID(),
        coupleId: q.coupleId,
        type: q.type,
        status: q.status,
        answers: q.answers as any,
        report: q.report as any,
      },
    });
    return q;
  }
  async getQuiz(id: string) {
    const q = await this.p.quizSession.findUnique({ where: { id } });
    if (!q) return null;
    return {
      id: q.id,
      coupleId: q.coupleId,
      type: q.type as QuizSession['type'],
      status: q.status as QuizSession['status'],
      answers: (q.answers as any) || {},
      report: (q.report as any) || null,
      createdAt: new Date(q.createdAt).getTime(),
    };
  }
  async updateQuiz(id: string, patch: Partial<QuizSession>) {
    const q = await this.p.quizSession.update({
      where: { id },
      data: {
        status: patch.status,
        answers: patch.answers as any,
        report: patch.report as any,
      },
    });
    return {
      id: q.id,
      coupleId: q.coupleId,
      type: q.type as QuizSession['type'],
      status: q.status as QuizSession['status'],
      answers: (q.answers as any) || {},
      report: (q.report as any) || null,
      createdAt: new Date(q.createdAt).getTime(),
    };
  }
  async listQuizzes(coupleId: string) {
    const list = await this.p.quizSession.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((q) => ({
      id: q.id,
      coupleId: q.coupleId,
      type: q.type as QuizSession['type'],
      status: q.status as QuizSession['status'],
      answers: (q.answers as any) || {},
      report: (q.report as any) || null,
      createdAt: new Date(q.createdAt).getTime(),
    }));
  }

  async setSubscription(s: Subscription) {
    await this.p.subscription.upsert({
      where: { coupleId: s.coupleId },
      create: { coupleId: s.coupleId, plan: s.plan, expireAt: s.expireAt ? new Date(s.expireAt) : null },
      update: { plan: s.plan, expireAt: s.expireAt ? new Date(s.expireAt) : null },
    });
    return s;
  }
  async getSubscription(coupleId: string) {
    const s = await this.p.subscription.findUnique({ where: { coupleId } });
    if (!s) return null;
    return {
      coupleId: s.coupleId,
      plan: s.plan as Subscription['plan'],
      expireAt: s.expireAt ? new Date(s.expireAt).getTime() : null,
    };
  }

  async createFriendRequest(r: FriendRequest) {
    await this.p.friendRequest.create({
      data: {
        id: r.id || randomUUID(),
        fromUserId: r.fromUserId,
        toUserId: r.toUserId,
        status: r.status,
      },
    });
    return r;
  }
  async getFriendRequest(id: string) {
    const r = await this.p.friendRequest.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      status: r.status as FriendRequest['status'],
      createdAt: new Date(r.createdAt).getTime(),
    };
  }
  async listFriendRequestsTo(userId: string) {
    const list = await this.p.friendRequest.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      status: r.status as FriendRequest['status'],
      createdAt: new Date(r.createdAt).getTime(),
    }));
  }
  async listFriendRequestsFrom(userId: string) {
    const list = await this.p.friendRequest.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      status: r.status as FriendRequest['status'],
      createdAt: new Date(r.createdAt).getTime(),
    }));
  }
  async updateFriendRequest(id: string, patch: Partial<FriendRequest>) {
    const r = await this.p.friendRequest.update({
      where: { id },
      data: { status: patch.status },
    });
    return {
      id: r.id,
      fromUserId: r.fromUserId,
      toUserId: r.toUserId,
      status: r.status as FriendRequest['status'],
      createdAt: new Date(r.createdAt).getTime(),
    };
  }
  async addFriend(f: Friend) {
    await this.p.friend.create({
      data: {
        id: f.id || randomUUID(),
        userId: f.userId,
        friendId: f.friendId,
      },
    });
    return f;
  }
  async listFriends(userId: string) {
    const list = await this.p.friend.findMany({ where: { userId } });
    return list.map((f) => ({
      id: f.id,
      userId: f.userId,
      friendId: f.friendId,
      createdAt: new Date(f.createdAt).getTime(),
    }));
  }
  async getFriendBetween(a: string, b: string) {
    const f = await this.p.friend.findFirst({
      where: {
        OR: [
          { userId: a, friendId: b },
          { userId: b, friendId: a },
        ],
      },
    });
    if (!f) return null;
    return {
      id: f.id,
      userId: f.userId,
      friendId: f.friendId,
      createdAt: new Date(f.createdAt).getTime(),
    };
  }
}
