const { request } = require('../../utils/request');

Page({
  data: {
    coupleId: '',
    result: null,
    loading: false,
  },
  onLoad(options) {
    this.setData({ coupleId: options.coupleId || '' });
  },
  async draw(e) {
    const kind = e.currentTarget.dataset.kind;
    this.setData({ loading: true, result: null });
    try {
      const res = await request('/api/game/' + this.data.coupleId + '/' + kind, {
        method: 'POST',
      });
      this.setData({ result: res });
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '抽取失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
