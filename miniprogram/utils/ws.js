const app = getApp();

// WebSocket 连接封装：三人群聊实时推送 + 断线重连
// 云托管走 wx.cloud.connectContainer（免域名/备案），本地走 wx.connectSocket
// 对外统一返回一个具备 send/close 的句柄，避免云托管异步建连导致的空引用
function connect(coupleId, userId, onMessage, onOpen) {
  const g = app.globalData;
  const path = `/ws?coupleId=${coupleId}&userId=${userId}`;

  const handle = {
    _task: null,
    _closed: false,
    send(data) {
      if (this._task && !this._closed) {
        this._task.send({ data });
      }
    },
    close() {
      this._closed = true;
      if (this._task) this._task.close();
    },
  };

  const retry = () => {
    if (handle._closed) return;
    setTimeout(() => connect(coupleId, userId, onMessage, onOpen), 2000);
  };

  const bind = (task) => {
    handle._task = task;
    task.onOpen(() => {
      if (onOpen) onOpen();
    });
    task.onMessage((res) => {
      try {
        onMessage(JSON.parse(res.data));
      } catch (e) {
        // ignore
      }
    });
    task.onClose(() => {
      // 主动关闭不再重连，避免页面卸载后泄漏
      retry();
    });
    task.onError(() => {
      task.close();
    });
  };

  if (g.useCloud && wx.cloud && wx.cloud.connectContainer) {
    // 云托管 WebSocket（基础库 ≥2.21.1）
    const p = wx.cloud.connectContainer({
      config: { env: g.cloudEnv },
      service: g.serviceName,
      path,
    });
    if (p && typeof p.then === 'function') {
      p.then((res) => {
        if (handle._closed && res.socketTask) {
          res.socketTask.close();
          return;
        }
        bind(res.socketTask);
      }).catch(() => retry());
    }
    return handle;
  }

  bind(wx.connectSocket({ url: `${g.wsBase}${path}` }));
  return handle;
}

module.exports = { connect };
