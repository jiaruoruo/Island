const { request } = require('../../utils/request');

Page({
  data: {
    view: 'add', // add | requests
    q: '',
    searched: false,
    result: null,
    me: null,
    requests: [],
    friends: [],
    inviteCode: '',
  },
  onLoad() {
    this.loadMe();
    this.loadInviteCode();
    this.loadRequests();
    this.loadFriends();
  },
  onShow() {
    this.loadRequests();
    this.loadFriends();
  },
  async loadMe() {
    try {
      const res = await request('/api/users/me');
      this.setData({ me: res.user });
    } catch (e) {
      /* ignore */
    }
  },
  async loadInviteCode() {
    try {
      const res = await request('/api/couples');
      if (res.couples && res.couples.length) {
        this.setData({ inviteCode: res.couples[0].inviteCode });
      }
    } catch (e) {
      /* ignore */
    }
  },
  async loadRequests() {
    try {
      const res = await request('/api/friends/requests');
      this.setData({ requests: res.requests });
    } catch (e) {
      /* ignore */
    }
  },
  async loadFriends() {
    try {
      const res = await request('/api/friends');
      this.setData({ friends: res.friends });
    } catch (e) {
      /* ignore */
    }
  },
  switchView(e) {
    this.setData({ view: e.currentTarget.dataset.v });
  },
  onQ(e) {
    this.setData({ q: e.detail.value });
  },
  async search() {
    const q = this.data.q.trim();
    if (!q) {
      wx.showToast({ title: '请输入小岛号或手机号', icon: 'none' });
      return;
    }
    try {
      const res = await request(
        '/api/users/search?q=' + encodeURIComponent(q),
      );
      this.setData({ result: res.user, searched: true });
    } catch (e) {
      this.setData({ result: null, searched: true });
      wx.showToast({ title: (e && e.error) || '未找到该用户', icon: 'none' });
    }
  },
  async sendRequest(e) {
    const toUserId = e.currentTarget.dataset.id;
    try {
      await request('/api/friends/requests', {
        method: 'POST',
        data: { toUserId },
      });
      wx.showToast({ title: '申请已发送', icon: 'success' });
      this.setData({ result: null, searched: false, q: '' });
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '发送失败', icon: 'none' });
    }
  },
  async accept(e) {
    try {
      await request('/api/friends/requests/' + e.currentTarget.dataset.id + '/accept', {
        method: 'POST',
      });
      wx.showToast({ title: '已通过', icon: 'success' });
      this.loadRequests();
      this.loadFriends();
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '操作失败', icon: 'none' });
    }
  },
  async reject(e) {
    try {
      await request('/api/friends/requests/' + e.currentTarget.dataset.id + '/reject', {
        method: 'POST',
      });
      this.loadRequests();
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '操作失败', icon: 'none' });
    }
  },
  copyLink() {
    const code = this.data.inviteCode || (this.data.me && this.data.me.uid) || '';
    if (!code) {
      wx.showToast({ title: '暂无可复制的内容', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: '【小岛】邀请你加入，邀请码/小岛号：' + code,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },
  myQr() {
    const me = this.data.me;
    wx.showModal({
      title: '我的二维码',
      content: '小岛号：' + (me ? me.uid : '-') + '\n\n让朋友在「添加好友」页搜索你的小岛号即可加你',
      showCancel: false,
      confirmText: '知道了',
    });
  },
  scan() {
    wx.scanCode({
      success: (r) => {
        const m = String(r.result || '').match(/\d{8}/);
        if (m) {
          this.setData({ q: m[0], view: 'add' });
          this.search();
        } else {
          wx.showToast({ title: '未识别到小岛号', icon: 'none' });
        }
      },
      fail: () => {},
    });
  },
  onShareAppMessage() {
    const code = this.data.inviteCode || (this.data.me && this.data.me.uid) || '';
    return {
      title: '邀请你加入小岛，一起养一只 AI 小章鱼',
      path: '/pages/welcome/welcome?invite=' + code,
    };
  },
});
