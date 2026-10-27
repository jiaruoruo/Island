App({
  globalData: {
    // ===== 微信云托管配置 =====
    cloudEnv: 'prod-d6g2qc4i821472162', // 云托管环境 ID
    serviceName: 'island-server', // ← 云托管服务名（部署时保持一致）
    forceCloud: true, // true = 所有环境（含真机调试、模拟器）都走云托管
    useCloud: false, // 运行时自动判定

    // 本地 / 自托管地址（develop 环境或不走云托管时使用）
    baseUrl: 'http://localhost:3000',
    wsBase: 'ws://localhost:3000',
    token: '',
    user: null,
    currentCouple: null,
  },
  onLaunch() {
    try {
      const env = wx.getAccountInfoSync().miniProgram.envVersion;
      const LAN_BASE = 'http://192.168.1.x:3000'; // ← 你电脑的局域网 IP
      const PROD_BASE = 'https://api.yourdomain.com'; // ← 自托管域名（不用云托管时）
      if (env === 'develop') {
        this.globalData.baseUrl = LAN_BASE;
        this.globalData.wsBase = LAN_BASE.replace(/^http/, 'ws');
      } else {
        this.globalData.baseUrl = PROD_BASE;
        this.globalData.wsBase = PROD_BASE.replace(/^https/, 'wss');
      }
      // 体验版/正式版走云托管（免域名、免备案）；真机调试可用 forceCloud 强制
      if (this.globalData.cloudEnv && (env !== 'develop' || this.globalData.forceCloud)) {
        this.globalData.useCloud = true;
      }
      if (this.globalData.cloudEnv && wx.cloud) {
        wx.cloud.init({ env: this.globalData.cloudEnv, traceUser: true });
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
