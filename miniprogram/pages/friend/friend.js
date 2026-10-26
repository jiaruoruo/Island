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
    showQr: false,
    qrImage: '',
    qrUid: '',
  },
  onLoad(options) {
    // 开启转发能力：右上角菜单与本页 open-type="share" 按钮可拉起微信好友选择页
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage'],
    });
    this.loadMe();
    this.loadInviteCode();
    this.loadRequests();
    this.loadFriends();
    // 从好友分享的邀请链接进入：自动带入对方的 Island号并搜索
    if (options && options.invite) {
      this.setData({ q: options.invite }, () => {
        this.search();
      });
    }
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
  async myQr() {
    const uid = this.data.me ? this.data.me.uid : '';
    // 已生成过且 Island号未变，直接复用
    if (this.data.qrImage && this.data.qrUid === uid) {
      this.setData({ showQr: true });
      return;
    }
    try {
      wx.showLoading({ title: '生成中…' });
      const res = await request('/api/users/me/qrcode');
      wx.hideLoading();
      this.setData({ showQr: true, qrImage: res.dataUrl, qrUid: res.uid });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.error) || '二维码生成失败', icon: 'none' });
    }
  },
  closeQr() {
    this.setData({ showQr: false });
  },
  saveQr() {
    const img = this.data.qrImage;
    if (!img) {
      wx.showToast({ title: '暂无二维码', icon: 'none' });
      return;
    }
    const base64 = img.replace(/^data:image\/\w+;base64,/, '');
    const filePath = wx.env.USER_DATA_PATH + '/island_qr_' + Date.now() + '.png';
    wx.getFileSystemManager().writeFile({
      filePath,
      data: base64,
      encoding: 'base64',
      success: () => {
        wx.saveImageToPhotosAlbum({
          filePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
        });
      },
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
    });
  },
  // 扫一扫：调起相机，识别小程序生成的邀请二维码并完成加好友
  scan() {
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (r) => {
        const uid = this.parseInvite(r.result);
        if (!uid) {
          wx.showToast({ title: '未识别到 Island 二维码', icon: 'none' });
          return;
        }
        this.setData({ view: 'add' });
        this.addByUid(uid);
      },
      fail: (err) => {
        const msg = String((err && err.errMsg) || '');
        // 用户主动取消：静默返回
        if (msg.indexOf('cancel') >= 0) return;
        if (msg.indexOf('auth') >= 0 || msg.indexOf('deny') >= 0 || msg.indexOf('permission') >= 0) {
          wx.showModal({
            title: '需要相机权限',
            content: '请在设置中允许 Island 使用相机，以便扫描好友二维码',
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) wx.openSetting();
            },
          });
          return;
        }
        wx.showToast({ title: '扫码失败', icon: 'none' });
      },
    });
  },
  // 解析二维码内容：支持 island://uid/xxx、?invite=xxx、纯 Island号
  parseInvite(raw) {
    const s = String(raw || '');
    let m = s.match(/island:\/\/uid\/(\d{4,16})/);
    if (m) return m[1];
    m = s.match(/[?&]invite=(\d{4,16})/);
    if (m) return m[1];
    m = s.match(/(\d{8})/);
    if (m) return m[1];
    return '';
  },
  // 按 Island号搜索并直接发起好友申请
  async addByUid(uid) {
    wx.showLoading({ title: '添加中…' });
    try {
      const res = await request('/api/users/search?q=' + encodeURIComponent(uid));
      const user = res.user;
      if (!user) throw { error: '未找到该用户' };
      if (res.isFriend) {
        wx.hideLoading();
        wx.showToast({ title: '你们已经是好友啦', icon: 'none' });
        this.setData({ q: uid, result: user, searched: true });
        return;
      }
      await request('/api/friends/requests', {
        method: 'POST',
        data: { toUserId: user.id },
      });
      wx.hideLoading();
      wx.showModal({
        title: '好友申请已发送',
        content: '已向 ' + user.nickname + '（Island号 ' + user.uid + '）发送申请，等待对方通过',
        showCancel: false,
        confirmText: '知道了',
      });
      this.setData({ q: '', result: null, searched: false });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: (e && e.error) || '添加失败', icon: 'none' });
    }
  },
  onShareAppMessage() {
    // 邀请链接携带「我的 Island号」，好友点开登录后即可搜索到我
    const code =
      (this.data.me && this.data.me.uid) || this.data.inviteCode || '';
    const nick = (this.data.me && this.data.me.nickname) || '你的好友';
    return {
      title: nick + ' 邀请你加入 Island，一起养一只 AI 小章鱼 🐙',
      path: '/pages/welcome/welcome?invite=' + code,
      imageUrl: '',
    };
  },
});
