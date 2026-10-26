const { request } = require('../../utils/request');
const app = getApp();

const PERSONA = [
  { key: 'sweet', label: '甜妹', color: '#FF7E9D' },
  { key: 'sassy', label: '毒舌', color: '#9B8CFF' },
  { key: 'reliable', label: '靠谱', color: '#4FD1C5' },
];

Page({
  data: {
    couples: [],
    loading: true,
    showCreate: false,
    showJoin: false,
    name: '',
    persona: 'sweet',
    inviteCode: '',
    statusBarHeight: 20,
    PERSONA,
  },
  onLoad() {
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({ statusBarHeight: info.statusBarHeight || 20 });
    } catch (e) {
      /* 使用默认值 */
    }
  },
  onShow() {
    this.load();
  },
  async load() {
    try {
      const res = await request('/api/couples');
      this.setData({ couples: res.couples, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },
  openCreate() {
    this.setData({ showCreate: true });
  },
  closeCreate() {
    this.setData({ showCreate: false });
  },
  onName(e) {
    this.setData({ name: e.detail.value });
  },
  choosePersona(e) {
    this.setData({ persona: e.currentTarget.dataset.p });
  },
  async create() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '给岛起个名字吧', icon: 'none' });
      return;
    }
    try {
      const res = await request('/api/couples', {
        method: 'POST',
        data: { name: this.data.name.trim(), persona: this.data.persona },
      });
      this.setData({ showCreate: false, name: '' });
      wx.showModal({
        title: '小岛建好啦',
        content: '邀请码：' + res.inviteCode + '\n发给 TA 一起登岛',
        showCancel: false,
      });
      this.load();
    } catch (e) {
      wx.showToast({ title: (e && e.error) || '创建失败', icon: 'none' });
    }
  },
  openJoin() {
    this.setData({ showJoin: true });
  },
  closeJoin() {
    this.setData({ showJoin: false });
  },
  onInvite(e) {
    this.setData({ inviteCode: e.detail.value });
  },
  async join() {
    const id = this.data.inviteCode.trim();
    if (!id) return;
    try {
      await request('/api/couples/' + id + '/join', { method: 'POST' });
      this.setData({ showJoin: false, inviteCode: '' });
      wx.showToast({ title: '登岛成功', icon: 'success' });
      this.load();
    } catch (e) {
      wx.showToast({ title: (e && e.error) || '加入失败', icon: 'none' });
    }
  },
  enter(e) {
    const id = e.currentTarget.dataset.id;
    app.globalData.currentCouple = id;
    wx.navigateTo({ url: '/pages/chat/chat?coupleId=' + id });
  },
  addFriend() {
    wx.navigateTo({ url: '/pages/friend/friend' });
  },

  // 底部导航：消息 → 最近小岛的群聊；记忆 → 最近小岛的记忆本；我的 → 个人页
  onTabChange(e) {
    const key = e.detail.key;
    if (key === 'profile') {
      wx.navigateTo({ url: '/pages/profile/profile' });
      return;
    }
    if (!this.data.couples.length) {
      wx.showToast({ title: '先创建一个小岛吧', icon: 'none' });
      return;
    }
    const cid = this.data.couples[0].id;
    if (key === 'chat') {
      wx.navigateTo({ url: '/pages/chat/chat?coupleId=' + cid });
    } else if (key === 'task') {
      wx.navigateTo({ url: '/pages/task/task?coupleId=' + cid });
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
