import { randomUUID } from 'crypto';
import { Router } from 'express';
import { getStore } from '../store';

export const friendRouter = Router();

// 发送好友申请
friendRouter.post('/requests', async (req, res) => {
  const me = req.user!;
  const { toUserId } = (req.body || {}) as { toUserId?: string };
  if (!toUserId) return res.status(400).json({ error: '缺少对方用户' });
  if (toUserId === me.id) {
    return res.status(400).json({ error: '不能添加自己为好友' });
  }

  const store = getStore();
  const target = await store.getUserById(toUserId);
  if (!target) return res.status(404).json({ error: '用户不存在' });
  if (await store.getFriendBetween(me.id, toUserId)) {
    return res.status(400).json({ error: '你们已经是好友了' });
  }
  const mine = await store.listFriendRequestsFrom(me.id);
  if (mine.some((r) => r.toUserId === toUserId && r.status === 'pending')) {
    return res.status(400).json({ error: '已发送过申请，等待对方通过' });
  }

  const request = await store.createFriendRequest({
    id: randomUUID(),
    fromUserId: me.id,
    toUserId,
    status: 'pending',
    createdAt: Date.now(),
  });
  res.json({ request });
});

// 我收到的好友申请
friendRouter.get('/requests', async (req, res) => {
  const me = req.user!;
  const store = getStore();
  const list = (await store.listFriendRequestsTo(me.id)).filter(
    (r) => r.status === 'pending',
  );
  const requests = await Promise.all(
    list.map(async (r) => {
      const u = await store.getUserById(r.fromUserId);
      return {
        ...r,
        fromUser: u
          ? { id: u.id, uid: u.uid, nickname: u.nickname }
          : null,
      };
    }),
  );
  res.json({ requests });
});

// 通过好友申请
friendRouter.post('/requests/:id/accept', async (req, res) => {
  const me = req.user!;
  const store = getStore();
  const r = await store.getFriendRequest(req.params.id);
  if (!r || r.toUserId !== me.id) {
    return res.status(404).json({ error: '申请不存在' });
  }
  if (r.status !== 'pending') {
    return res.status(400).json({ error: '该申请已处理' });
  }
  await store.updateFriendRequest(r.id, { status: 'accepted' });
  await store.addFriend({
    id: randomUUID(),
    userId: r.fromUserId,
    friendId: r.toUserId,
    createdAt: Date.now(),
  });
  await store.addFriend({
    id: randomUUID(),
    userId: r.toUserId,
    friendId: r.fromUserId,
    createdAt: Date.now(),
  });
  res.json({ ok: true });
});

// 拒绝好友申请
friendRouter.post('/requests/:id/reject', async (req, res) => {
  const me = req.user!;
  const store = getStore();
  const r = await store.getFriendRequest(req.params.id);
  if (!r || r.toUserId !== me.id) {
    return res.status(404).json({ error: '申请不存在' });
  }
  await store.updateFriendRequest(r.id, { status: 'rejected' });
  res.json({ ok: true });
});

// 我的好友列表
friendRouter.get('/', async (req, res) => {
  const me = req.user!;
  const store = getStore();
  const rows = await store.listFriends(me.id);
  const friends = (
    await Promise.all(
      rows.map(async (f) => {
        const u = await store.getUserById(f.friendId);
        return u ? { id: u.id, uid: u.uid, nickname: u.nickname } : null;
      }),
    )
  ).filter(Boolean);
  res.json({ friends });
});
