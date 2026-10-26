const app = getApp();

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + path,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (app.globalData.token || ''),
      },
      success(res) {
        if (res.statusCode === 401) {
          // 登录态失效：清除本地登录信息，回到欢迎页重新登录
          app.globalData.token = '';
          app.globalData.user = null;
          wx.removeStorageSync('token');
          wx.removeStorageSync('user');
          wx.reLaunch({ url: '/pages/welcome/welcome' });
          reject({ error: '登录已过期，请重新登录' });
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res.data || { error: '请求失败' });
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

module.exports = { request };
