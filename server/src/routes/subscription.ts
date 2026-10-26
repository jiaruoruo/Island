import { Router } from 'express';
import { config } from '../config';
import { createPaymentOrder } from '../services/payment';
import { getStore } from '../store';
import { getCoupleForUser } from './helpers';

export const subscriptionRouter = Router();

// 查询会员
subscriptionRouter.get('/:coupleId', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  const sub = await getStore().getSubscription(couple.id);
  res.json({ subscription: sub || { coupleId: couple.id, plan: 'free', expireAt: null } });
});

// 订阅 / 内购（Mock，真实微信支付需商户号）
subscriptionRouter.post('/:coupleId/subscribe', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });
  if (req.user!.minorMode) return res.status(403).json({ error: '未成年人不可订阅' });

  const { plan } = (req.body || {}) as { plan?: 'free' | 'plus' };
  const p = plan || 'plus';

  // 真实微信支付：返回调起参数，前端 wx.requestPayment 后由回调发货
  if (p === 'plus' && !config.mockPay) {
    const order = await createPaymentOrder(couple.id, 1200); // 12 元 = 1200 分
    return res.json({ order });
  }

  const expireAt = p === 'plus' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null;
  const sub = await getStore().setSubscription({
    coupleId: couple.id,
    plan: p,
    expireAt,
  });
  res.json({ subscription: sub });
});
