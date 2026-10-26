App({
  globalData: {
    // 本地开发地址；微信开发者工具需勾选「不校验合法域名」
    baseUrl: 'http://localhost:3000',
    wsBase: 'ws://localhost:3000',
    token: '',
    user: null,
    currentCouple: null,
  },
  onLaunch() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token) {
      this.globalData.token = token;
      this.globalData.user = user || null;
    }
  },
});
