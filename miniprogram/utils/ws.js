const app = getApp();

// WebSocket 连接封装：三人群聊实时推送 + 断线重连
function connect(coupleId, userId, onMessage, onOpen) {
  const url = `${app.globalData.wsBase}/ws?coupleId=${coupleId}&userId=${userId}`;
  const task = wx.connectSocket({ url });

  task.onOpen(() => {
    if (onOpen) onOpen();
  });
  task.onMessage((res) => {
    try {
      const data = JSON.parse(res.data);
      onMessage(data);
    } catch (e) {
      // ignore
    }
  });
  task.onClose(() => {
    // 断线重连
    setTimeout(() => connect(coupleId, userId, onMessage, onOpen), 2000);
  });
  task.onError(() => {
    task.close();
  });

  return task;
}

module.exports = { connect };
