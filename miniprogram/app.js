App({
  globalData: {
    openid: '',
    userInfo: null,
    isReady: false,
    needRegister: false
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上基础库以支持云开发');
      return;
    }

    wx.cloud.init({
      traceUser: true
    });

    this.checkLogin();
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
        this.globalData.needRegister = true;
        wx.hideLoading();
        wx.nextTick(() => {
          wx.reLaunch({ url: `/pages/register/register?openid=${openid}` });
        });
        return;
      }

      this.globalData.userInfo = userRes.data[0];
      this.globalData.isReady = true;
      this.globalData.needRegister = false;
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
      console.error(error);
    }
  }
});
