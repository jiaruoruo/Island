const { request } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    me: null,
    friendCount: 0,
    islandCount: 0,
    showEdit: false,
    editNickname: '',
  },
  onLoad() {
    this.load();
  },
  onShow() {
    this.load();
  },
  async load() {
    try {
      const [meRes, friendsRes, couplesRes] = await Promise.all([
        request('/api/users/me'),
        request('/api/friends'),
        request('/api/couples'),
      ]);
      this.setData({
        me: meRes.user,
        friendCount: (friendsRes.friends || []).length,
        islandCount: (couplesRes.couples || []).length,
      });
    } catch (e) {
      this.setData({ me: app.globalData.user });
    }
  },
  openEdit() {
    this.setData({
      showEdit: true,
      editNickname: (this.data.me && this.data.me.nickname) || '',
    });
  },
  onEditNick(e) {
    this.setData({ editNickname: e.detail.value });
  },
  cancelEdit() {
    this.setData({ showEdit: false });
  },
  noop() {},
  async saveEdit() {
    const nickname = this.data.editNickname.trim();
    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    try {
      const res = await request('/api/users/me', {
        method: 'PUT',
        data: { nickname },
      });
      this.setData({ me: res.user, showEdit: false });
      app.globalData.user = res.user;
      wx.setStorageSync('user', res.user);
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '保存失败', icon: 'none' });
    }
  },
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要返回登录界面吗？',
      success: (r) => {
        if (r.confirm) {
          app.globalData.token = '';
          app.globalData.user = null;
          wx.removeStorageSync('token');
          wx.removeStorageSync('user');
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      },
    });
  },
});
