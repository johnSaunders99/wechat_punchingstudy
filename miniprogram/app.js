const config = require('./utils/config');

App({
  globalData: {
    openid: '',
    userInfo: null,
    isReady: false
  },

  userReadyCallbacks: [],

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上基础库以支持云开发');
      return;
    }

    wx.cloud.init({
      env: config.envId,
      traceUser: true
    });

    this.checkLogin();
  },

  onUserReady(callback) {
    if (typeof callback !== 'function') return;
    if (this.globalData.userInfo) {
      callback(this.globalData.userInfo);
      return;
    }
    this.userReadyCallbacks.push(callback);
  },

  notifyUserReady(user) {
    while (this.userReadyCallbacks.length) {
      const cb = this.userReadyCallbacks.shift();
      cb && cb(user);
    }
  },

  async checkLogin() {
    wx.showLoading({ title: '登录中...' });

    try {
      const loginRes = await wx.cloud.callFunction({ name: 'login' });
      const openid = loginRes.result.openid;
      this.globalData.openid = openid;

      const db = wx.cloud.database();
      const userRes = await db.collection('users').where({ _openid: openid }).limit(1).get();

      if (!userRes.data.length) {
        wx.hideLoading();
        wx.redirectTo({ url: `/pages/register/register?openid=${openid}` });
        return;
      }

      const user = userRes.data[0];
      this.globalData.userInfo = user;
      this.globalData.isReady = true;
      this.notifyUserReady(user);
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
      console.error(error);
    }
  }
});
