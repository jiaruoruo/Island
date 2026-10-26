Page({
  data: {
    coupleId: '',
    color: '#FF7E9D',
    accessory: '',
    COLORS: ['#FF7E9D', '#4FD1C5', '#9B8CFF', '#FF9500', '#4FA3FF'],
    ACCS: [
      { key: '', label: '无' },
      { key: 'bow', label: '蝴蝶结' },
      { key: 'hat', label: '小帽子' },
      { key: 'crown', label: '小皇冠' },
    ],
  },
  onLoad(options) {
    const coupleId = options.coupleId || 'default';
    this.setData({ coupleId });
    const saved = wx.getStorageSync('closet_' + coupleId);
    if (saved) this.setData({ color: saved.color, accessory: saved.accessory });
  },
  chooseColor(e) {
    this.setData({ color: e.currentTarget.dataset.c });
  },
  chooseAcc(e) {
    this.setData({ accessory: e.currentTarget.dataset.a });
  },
  save() {
    wx.setStorageSync('closet_' + this.data.coupleId, {
      color: this.data.color,
      accessory: this.data.accessory,
    });
    wx.showToast({ title: '装扮已保存', icon: 'success' });
  },
});
