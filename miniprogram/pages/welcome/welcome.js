const { request } = require('../../utils/request');
const app = getApp();

// 统一提取错误信息（wx 失败对象只有 errMsg，后端错误在 error 里）
function errMsg(e, fallback) {
  const m = e && (e.error || e.errMsg || (e.data && e.data.error));
  return m ? String(m).slice(0, 60) : fallback;
}

function wxLogin() {
  return new Promise((resolve) => {
    wx.login({ success: resolve, fail: () => resolve({}) });
  });
}

Page({
  data: {
    agreed: false,
    logging: false,
    loginMode: 'wechat', // wechat | phone
    phone: '',
    code: '',
    codeCountdown: 0,
  },
  onLoad(options) {
    // 记录好友邀请链接中的 Island号，登录后跳到「添加好友」自动搜索对方
    if (options && options.invite) {
      wx.setStorageSync('pendingInvite', options.invite);
    }
    if (app.globalData.token) {
      wx.reLaunch({ url: '/pages/island/island' });
    }
  },
  onAgree(e) {
    this.setData({ agreed: e.detail.value.includes('agree') });
  },
  switchMode(e) {
    this.setData({ loginMode: e.currentTarget.dataset.mode });
  },
  onPhone(e) {
    this.setData({ phone: e.detail.value });
  },
  onCode(e) {
    this.setData({ code: e.detail.value });
  },

  checkAgreed() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选同意隐私协议', icon: 'none' });
      return false;
    }
    return true;
  },

  // 微信一键登录
  async login() {
    if (!this.checkAgreed()) return;
    this.setData({ logging: true });
    try {
      let deviceCode = wx.getStorageSync('deviceCode');
      if (!deviceCode) {
        deviceCode = 'dev_' + Math.random().toString(36).slice(2);
        wx.setStorageSync('deviceCode', deviceCode);
      }
      const wxRes = await wxLogin();
      const res = await request('/api/auth/login', {
        method: 'POST',
        data: {
          code: wxRes.code || deviceCode,
          deviceCode,
          nickname: '小岛居民',
        },
      });
      this.onLoginSuccess(res);
    } catch (e) {
      console.error('[login]', e);
      wx.showToast({ title: errMsg(e, '登录失败'), icon: 'none' });
    } finally {
      this.setData({ logging: false });
    }
  },

  // 发送验证码
  async sendCode() {
    const phone = this.data.phone.trim();
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    try {
      const res = await request('/api/auth/send-code', {
        method: 'POST',
        data: { phone },
      });
      if (res.devCode) {
        wx.showModal({
          title: '验证码',
          content: '开发模式验证码：' + res.devCode,
          showCancel: false,
        });
      } else {
        wx.showToast({ title: '验证码已发送', icon: 'success' });
      }
      let n = 60;
      this.setData({ codeCountdown: n });
      const timer = setInterval(() => {
        n--;
        if (n <= 0) {
          clearInterval(timer);
          this.setData({ codeCountdown: 0 });
        } else {
          this.setData({ codeCountdown: n });
        }
      }, 1000);
    } catch (e) {
      console.error('[sendCode]', e);
      wx.showToast({ title: errMsg(e, '发送失败'), icon: 'none' });
    }
  },

  // 手机号验证码登录
  async phoneLogin() {
    if (!this.checkAgreed()) return;
    const phone = this.data.phone.trim();
    const code = this.data.code.trim();
    if (!phone || !code) {
      wx.showToast({ title: '请输入手机号和验证码', icon: 'none' });
      return;
    }
    this.setData({ logging: true });
    try {
      const res = await request('/api/auth/login-by-phone', {
        method: 'POST',
        data: { phone, code, nickname: '小岛居民' },
      });
      this.onLoginSuccess(res);
    } catch (e) {
      console.error('[login]', e);
      wx.showToast({ title: errMsg(e, '登录失败'), icon: 'none' });
    } finally {
      this.setData({ logging: false });
    }
  },

  onLoginSuccess(res) {
    app.globalData.token = res.token;
    app.globalData.user = res.user;
    wx.setStorageSync('token', res.token);
    wx.setStorageSync('user', res.user);
    const invite = wx.getStorageSync('pendingInvite');
    if (invite) {
      wx.removeStorageSync('pendingInvite');
      wx.reLaunch({ url: '/pages/friend/friend?invite=' + invite });
      return;
    }
    wx.reLaunch({ url: '/pages/island/island' });
  },
});
