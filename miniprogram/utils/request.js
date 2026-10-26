const app = getApp();

// 统一处理响应：登录失效清理、状态码判定、云托管返回体解析
function finish(statusCode, data, resolve, reject) {
  if (statusCode === 401) {
    // 登录态失效：清除本地登录信息，回到欢迎页重新登录
    app.globalData.token = '';
    app.globalData.user = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('user');
    wx.reLaunch({ url: '/pages/welcome/welcome' });
    reject({ error: '登录已过期，请重新登录' });
    return;
  }
  if (statusCode >= 200 && statusCode < 300) {
    let body = data;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        /* 非 JSON 时保持字符串 */
      }
    }
    resolve(body);
  } else {
    reject(data || { error: '请求失败' });
  }
}

function request(path, options = {}) {
  const g = app.globalData;
  const header = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + (g.token || ''),
  };

  // 云托管：wx.cloud.callContainer（无需域名、无需 ICP 备案）
  // 注意限制：超时 ≤15s，请求体 ≤100K
  if (g.useCloud && wx.cloud && wx.cloud.callContainer) {
    return new Promise((resolve, reject) => {
      wx.cloud.callContainer({
        config: { env: g.cloudEnv },
        path,
        method: options.method || 'GET',
        header,
        data: options.data || {},
        success(res) {
          finish(res.statusCode, res.data, resolve, reject);
        },
        fail(err) {
          reject(err);
        },
      });
    });
  }

  // 本地 / 自托管：wx.request
  return new Promise((resolve, reject) => {
    wx.request({
      url: g.baseUrl + path,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        finish(res.statusCode, res.data, resolve, reject);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

module.exports = { request };
