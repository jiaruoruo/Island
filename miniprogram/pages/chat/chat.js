const { request } = require('../../utils/request');
const ws = require('../../utils/ws');
const app = getApp();

const ACTIONS = [
  { key: 'memory', label: '记忆', page: '/pages/memory/memory' },
  { key: 'quiz', label: '评测', page: '/pages/quiz/quiz' },
  { key: 'game', label: '游戏', page: '/pages/game/game' },
  { key: 'closet', label: '换装', page: '/pages/closet/closet' },
  { key: 'home', label: '小窝', page: '/pages/home/home' },
  { key: 'profile', label: '会员', page: '/pages/profile/profile' },
];

Page({
  data: {
    coupleId: '',
    couple: null,
    messages: [],
    input: '',
    lastId: '',
    socketOpen: false,
    ACTIONS,
    PERSONA_LABEL: { sweet: '甜妹', sassy: '毒舌', reliable: '靠谱' },
  },
  onLoad(options) {
    this.setData({ coupleId: options.coupleId || '' });
  },
  onShow() {
    this.init();
  },
  onUnload() {
    if (this.socket) this.socket.close();
  },
  async init() {
    const coupleId = this.data.coupleId;
    try {
      const c = await request('/api/couples/' + coupleId);
      this.setData({ couple: c.couple });
      wx.setNavigationBarTitle({ title: c.couple.name });
      const m = await request('/api/chat/' + coupleId + '/messages');
      this.setData({ messages: m.messages });
    } catch (e) {
      /* ignore */
    }
    this.connect();
  },
  connect() {
    if (this.socket) this.socket.close();
    const uid = app.globalData.user ? app.globalData.user.id : '';
    this.socket = ws.connect(
      this.data.coupleId,
      uid,
      (data) => {
        if (data.type === 'message') {
          this.append(data.message);
        } else if (data.type === 'memory') {
          const v = (data.memory && data.memory.value) || '';
          wx.showToast({ title: '已记住：' + v.slice(0, 12), icon: 'none' });
        }
      },
      () => this.setData({ socketOpen: true }),
    );
  },
  append(msg) {
    const list = this.data.messages;
    if (list.some((x) => x.id === msg.id)) return;
    this.setData({ messages: [...list, msg], lastId: 'msg-' + msg.id });
  },
  onInput(e) {
    this.setData({ input: e.detail.value });
  },
  async send() {
    const text = this.data.input.trim();
    if (!text) return;
    this.setData({ input: '' });
    try {
      const res = await request('/api/chat/' + this.data.coupleId + '/messages', {
        method: 'POST',
        data: { text },
      });
      this.append(res.userMessage);
      if (res.octopusMessage) this.append(res.octopusMessage);
    } catch (e) {
      wx.showToast({ title: (e && e.error) || '发送失败', icon: 'none' });
    }
  },
  go(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: page + '?coupleId=' + this.data.coupleId });
  },
});
