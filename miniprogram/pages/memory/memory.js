const { request } = require('../../utils/request');

const TYPES = [
  { key: 'anniversary', label: '纪念日', color: '#FF7E9D' },
  { key: 'wish', label: '心愿', color: '#9B8CFF' },
  { key: 'promise', label: '约定', color: '#4FD1C5' },
  { key: 'preference', label: '喜好', color: '#FF9500' },
  { key: 'note', label: '备注', color: '#4FA3FF' },
];

Page({
  data: {
    coupleId: '',
    memories: [],
    query: '',
    showAdd: false,
    type: 'anniversary',
    value: '',
    TYPES,
  },
  onLoad(options) {
    this.setData({ coupleId: options.coupleId || '' });
  },
  onShow() {
    this.load();
  },
  decorate(list) {
    return (list || []).map((m) => {
      const t = TYPES.find((x) => x.key === m.type);
      const color = t ? t.color : '#999999';
      return {
        ...m,
        typeLabel: t ? t.label : m.type,
        typeColor: color,
        chipBg: color + '22',
      };
    });
  },
  async load() {
    try {
      const res = await request('/api/memory/' + this.data.coupleId);
      this.setData({ memories: this.decorate(res.memories) });
    } catch (e) {}
  },
  onQuery(e) {
    this.setData({ query: e.detail.value });
  },
  async search() {
    const query = this.data.query.trim();
    const res = await request('/api/memory/' + this.data.coupleId + '/search', {
      method: 'POST',
      data: { query },
    });
    this.setData({ memories: this.decorate(res.memories) });
  },
  openAdd() {
    this.setData({ showAdd: true, value: '' });
  },
  closeAdd() {
    this.setData({ showAdd: false });
  },
  chooseType(e) {
    this.setData({ type: e.currentTarget.dataset.t });
  },
  onValue(e) {
    this.setData({ value: e.detail.value });
  },
  async add() {
    if (!this.data.value.trim()) return;
    try {
      await request('/api/memory/' + this.data.coupleId, {
        method: 'POST',
        data: { type: this.data.type, value: this.data.value.trim() },
      });
      this.setData({ showAdd: false });
      wx.showToast({ title: '已记住', icon: 'success' });
      this.load();
    } catch (e) {
      wx.showToast({ title: (e && e.error) || '保存失败', icon: 'none' });
    }
  },
  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除共同记忆',
      content: '删除需双方确认，确定删除吗？',
      success: async (r) => {
        if (r.confirm) {
          try {
            await request('/api/memory/' + this.data.coupleId + '/' + id, {
              method: 'DELETE',
              data: { both: true },
            });
            this.load();
          } catch (err) {
            wx.showToast({ title: (err && err.error) || '删除失败', icon: 'none' });
          }
        }
      },
    });
  },
});
