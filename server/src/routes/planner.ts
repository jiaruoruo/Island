import { Router } from 'express';
import { config } from '../config';
import { getCoupleForUser } from './helpers';

export const plannerRouter = Router();

// 约会攻略 / 餐厅推荐：Mock 返回结构化方案；真实模式走 LLM
plannerRouter.post('/:coupleId/plan', async (req, res) => {
  const couple = await getCoupleForUser(req.params.coupleId, req.user!.id);
  if (!couple) return res.status(404).json({ error: '小岛不存在' });

  const { city, preference, budget } = (req.body || {}) as {
    city?: string;
    preference?: string;
    budget?: string;
  };
  const c = city || '你们所在的城市';
  const plan = {
    city: c,
    summary: `为你们安排了一天的${preference || '浪漫'}约会，预算${budget || '适中'}。`,
    schedule: [
      { time: '10:30', activity: '城市漫步 / 逛一家有趣的小店', note: '轻松开场，边走边聊' },
      { time: '12:30', activity: '午餐：推荐一家评分高的本地馆子', note: '提前订位更省心' },
      { time: '14:30', activity: '下午茶或一起看展/电影', note: '制造独处话题' },
      { time: '18:30', activity: '晚餐 + 饭后散步', note: '适合聊聊最近的感受' },
    ],
    tips: ['记得提前确认营业时间', '带伞防晒两不误', '多拍点照片存进共享记忆'],
  };

  if (!config.mockAi) {
    // 真实模式：可在此调用 LLM 生成更个性化攻略
    // const plan = await generatePlanByLLM(c, preference, budget);
  }
  res.json({ plan });
});
