App({
  globalData: {
    // 默认值（本地开发者工具）。运行时按环境自动覆盖，无需手动改这里。
    baseUrl: 'http://localhost:3000',
    wsBase: 'ws://localhost:3000',
    token: '',
    user: null,
    currentCouple: null,
  },
  onLaunch() {
    // 按运行环境自动切换后端地址：
    //   develop  → 开发者工具 / 真机调试：用局域网地址（改下面的 LAN_BASE）
    //   trial    → 体验版：用线上 HTTPS 域名（改下面的 PROD_BASE）
    //   release  → 正式版：同上
    try {
      const env = wx.getAccountInfoSync().miniProgram.envVersion;
      const LAN_BASE = 'http://192.168.1.x:3000';     // ← 改成你电脑的局域网 IP
      const PROD_BASE = 'https://api.yourdomain.com';  // ← 改成你的线上域名
      if (env === 'develop') {
        this.globalData.baseUrl = LAN_BASE;
        this.globalData.wsBase = LAN_BASE.replace(/^http/, 'ws');
      } else {
        this.globalData.baseUrl = PROD_BASE;
        this.globalData.wsBase = PROD_BASE.replace(/^https/, 'wss');
      }
    } catch (e) {
      // 取不到环境信息时保持默认值
    }
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token) {
      this.globalData.token = token;
      this.globalData.user = user || null;
    }
  },
});
