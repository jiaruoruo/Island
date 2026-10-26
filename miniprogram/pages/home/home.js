Page({
  data: {
    coupleId: '',
    scenes: [
      { key: 'cream', label: '奶油岛', css: 'linear-gradient(160deg,#fff5f7,#fde9ee)' },
      { key: 'forest', label: '森系岛', css: 'linear-gradient(160deg,#eafaf7,#d3f0ea)' },
      { key: 'dream', label: '梦境岛', css: 'linear-gradient(160deg,#f3f0ff,#e6e0ff)' },
    ],
    scene: 'cream',
    currentCss: 'linear-gradient(160deg,#fff5f7,#fde9ee)',
    decor: [],
    DECOR: ['🪴', '🛋️', '🖼️', '🐚', '🌙', '🎈', '📚', '🧸'],
  },
  onLoad(options) {
    const coupleId = options.coupleId || 'default';
    this.setData({ coupleId });
    const saved = wx.getStorageSync('home_' + coupleId);
    if (saved) {
      const scene = saved.scene || 'cream';
      const s = this.data.scenes.find((x) => x.key === scene);
      this.setData({
        scene,
        currentCss: s ? s.css : this.data.scenes[0].css,
        decor: saved.decor || [],
      });
    }
  },
  chooseScene(e) {
    const scene = e.currentTarget.dataset.s;
    const s = this.data.scenes.find((x) => x.key === scene);
    this.setData({ scene, currentCss: s ? s.css : this.data.scenes[0].css });
  },
  toggleDecor(e) {
    const d = e.currentTarget.dataset.d;
    let decor = this.data.decor.slice();
    const i = decor.indexOf(d);
    if (i >= 0) decor.splice(i, 1);
    else if (decor.length < 8) decor.push(d);
    this.setData({ decor });
  },
  save() {
    wx.setStorageSync('home_' + this.data.coupleId, {
      scene: this.data.scene,
      decor: this.data.decor,
    });
    wx.showToast({ title: '小窝已布置', icon: 'success' });
  },
});
