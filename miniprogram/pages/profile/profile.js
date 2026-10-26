const { request } = require('../../utils/request');
const app = getApp();

const BENEFITS = [
  '无限次数关系评测与专属报告',
  '解锁全部小章鱼性格（甜妹/毒舌/靠谱）',
  '双人共享更长记忆 · 不被压缩',
  '限定装扮与小窝主题',
  '高级约会攻略与餐厅优先推荐',
];

Page({
  data: {
    coupleId: '',
    plan: 'free',
    user: null,
    BENEFITS,
    subscribing: false,
  },
  onLoad(options) {
    this.setData({ coupleId: options.coupleId || '', user: app.globalData.user });
    if (options.coupleId) this.load();
  },
  onShow() {
    if (this.data.coupleId) this.load();
  },
  async load() {
    try {
      const res = await request('/api/subscription/' + this.data.coupleId);
      this.setData({ plan: res.subscription.plan });
    } catch (e) {}
  },
  async subscribe() {
    if (!this.data.coupleId) {
      wx.showToast({ title: '请先进入某个小岛', icon: 'none' });
      return;
    }
    this.setData({ subscribing: true });
    try {
      // Mock 支付：真实微信支付需商户号
      const res = await request('/api/subscription/' + this.data.coupleId + '/subscribe', {
        method: 'POST',
        data: { plan: 'plus' },
      });
      this.setData({ plan: res.subscription.plan });
      wx.showToast({ title: '开通成功（Mock）', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: (e && e.error) || '开通失败', icon: 'none' });
    } finally {
      this.setData({ subscribing: false });
    }
  },
});
