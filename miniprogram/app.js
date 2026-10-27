App({
  globalData: {
    // ===== 微信云托管配置 =====
    cloudEnv: 'prod-d6g2qc4i821472162', // 云托管环境 ID
    serviceName: 'island-server', // ← 云托管服务名（部署时保持一致）
    forceCloud: true, // true = 真机调试也走云托管（模拟器始终走本地）
    useCloud: false, // 运行时自动判定

    // 本地 / 自托管地址
    baseUrl: 'http://localhost:3000',
    wsBase: 'ws://localhost:3000',
    token: '',
    user: null,
    currentCouple: null,
  },

  // 开发者工具模拟器的 platform 为 devtools，真机为 ios/android
  isDevtools() {
    try {
      if (wx.getSystemInfoSync) {
        const info = wx.getSystemInfoSync();
        if (info.platform) return info.platform === 'devtools';
      }
      if (wx.getDeviceInfo) {
        const d = wx.getDeviceInfo();
        if (d.platform) return d.platform === 'devtools';
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  },

  onLaunch() {
    try {
      const env = wx.getAccountInfoSync().miniProgram.envVersion;
      const isDevtools = this.isDevtools();
      const LAN_BASE = 'http://192.168.1.x:3000'; // ← 真机调试且不走云托管时填电脑局域网 IP
      const PROD_BASE = 'https://api.yourdomain.com'; // ← 自托管域名（不用云托管时）
      const LOCAL_BASE = 'http://localhost:3000'; // 模拟器用的本机后端

      if (isDevtools) {
        // 开发者工具模拟器：始终走本地后端，不走云托管
        this.globalData.baseUrl = LOCAL_BASE;
        this.globalData.wsBase = LOCAL_BASE.replace(/^http/, 'ws');
      } else if (env === 'develop') {
        // 真机调试：forceCloud 时走云托管，否则走局域网
        if (this.globalData.forceCloud && this.globalData.cloudEnv) {
          this.globalData.useCloud = true;
        } else {
          this.globalData.baseUrl = LAN_BASE;
          this.globalData.wsBase = LAN_BASE.replace(/^http/, 'ws');
        }
      } else if (this.globalData.cloudEnv) {
        // 体验版 / 正式版：云托管
        this.globalData.useCloud = true;
      } else {
        this.globalData.baseUrl = PROD_BASE;
        this.globalData.wsBase = PROD_BASE.replace(/^https/, 'wss');
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
