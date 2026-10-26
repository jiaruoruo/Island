import { Router } from 'express';
import { getStore } from '../store';

export const userRouter = Router();

// 我的信息
userRouter.get('/me', async (req, res) => {
  res.json({ user: req.user });
});

// 编辑资料（更新昵称等）
userRouter.put('/me', async (req, res) => {
  const me = req.user!;
  const { nickname } = (req.body || {}) as { nickname?: string };
  if (nickname !== undefined) {
    const n = String(nickname).trim();
    if (!n || n.length > 20) {
      return res.status(400).json({ error: '昵称长度需在 1-20 之间' });
    }
    const updated = await getStore().updateUser(me.id, { nickname: n });
    return res.json({ user: updated });
  }
  res.json({ user: me });
});

// 搜索用户（小岛号 / 手机号）
userRouter.get('/search', async (req, res) => {
  const me = req.user!;
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: '请输入小岛号或手机号' });

  const store = getStore();
  let user = await store.findUserByUid(q);
  if (!user && /^1\d{10}$/.test(q)) {
    // 手机号注册的用户 openid 为 phone_<手机号>
    user = await store.getUserByOpenid('phone_' + q);
  }
  if (!user) return res.status(404).json({ error: '未找到该用户' });
  if (user.id === me.id) {
    return res.status(400).json({ error: '不能添加自己为好友' });
  }

  const isFriend = await store.getFriendBetween(me.id, user.id);
  res.json({
    user: { id: user.id, uid: user.uid, nickname: user.nickname },
    isFriend: !!isFriend,
  });
});
