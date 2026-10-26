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
    showEdit: false,
    editNickname: '',
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
  goProfile() {
    wx.navigateTo({ url: '/pages/me/me' });
  },
  openEdit() {
    this.setData({
      showEdit: true,
      editNickname: this.data.me ? this.data.me.nickname : '',
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
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: (err && err.error) || '保存失败', icon: 'none' });
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
      wx.showToast({ title: '请输入 Island号或手机号', icon: 'none' });
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
      data: '【Island】邀请你加入，邀请码/Island号：' + code,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },
  myQr() {
    const me = this.data.me;
    wx.showModal({
      title: '我的二维码',
      content: 'Island号：' + (me ? me.uid : '-') + '\n\n让朋友在「添加好友」页搜索你的 Island号即可加你',
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
      title: '邀请你加入 Island，一起养一只 AI 小章鱼 🐙',
      path: '/pages/welcome/welcome?invite=' + code,
      imageUrl: '',
    };
  },
});
