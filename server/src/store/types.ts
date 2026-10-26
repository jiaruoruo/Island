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

// 数据访问统一接口：memory 与 prisma 两种实现
export interface Store {
  // users
  getUserByOpenid(openid: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  findUserByUid(uid: string): Promise<User | null>;
  createUser(u: User): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User | null>;

  // couples
  createCouple(c: Couple): Promise<Couple>;
  getCouple(id: string): Promise<Couple | null>;
  getCoupleByInviteCode(inviteCode: string): Promise<Couple | null>;
  listCouplesByUser(userId: string): Promise<Couple[]>;
  updateCouple(id: string, patch: Partial<Couple>): Promise<Couple | null>;

  // messages
  addMessage(m: Message): Promise<void>;
  listMessages(coupleId: string, limit?: number): Promise<Message[]>;

  // memories
  addMemory(m: Memory): Promise<Memory>;
  listMemories(coupleId: string): Promise<Memory[]>;
  getMemory(id: string): Promise<Memory | null>;
  deleteMemory(id: string): Promise<void>;

  // reminders
  addReminder(r: Reminder): Promise<void>;
  listDueReminders(now: number): Promise<Reminder[]>;
  markReminderTriggered(id: string): Promise<void>;

  // quiz
  createQuiz(q: QuizSession): Promise<QuizSession>;
  getQuiz(id: string): Promise<QuizSession | null>;
  updateQuiz(id: string, patch: Partial<QuizSession>): Promise<QuizSession | null>;
  listQuizzes(coupleId: string): Promise<QuizSession[]>;

  // subscription
  setSubscription(s: Subscription): Promise<Subscription>;
  getSubscription(coupleId: string): Promise<Subscription | null>;

  // friends
  createFriendRequest(r: FriendRequest): Promise<FriendRequest>;
  getFriendRequest(id: string): Promise<FriendRequest | null>;
  listFriendRequestsTo(userId: string): Promise<FriendRequest[]>;
  listFriendRequestsFrom(userId: string): Promise<FriendRequest[]>;
  updateFriendRequest(
    id: string,
    patch: Partial<FriendRequest>,
  ): Promise<FriendRequest | null>;
  addFriend(f: Friend): Promise<Friend>;
  listFriends(userId: string): Promise<Friend[]>;
  getFriendBetween(a: string, b: string): Promise<Friend | null>;
}
