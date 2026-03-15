const { toTimeStr } = require('../../utils/date');

Page({
  data: {
    recordList: [],
    skip: 0,
    limit: 20,
    loading: false,
    noMore: false,
    totalCount: 0,
    typeMap: {
      reading: '📚阅读',
      sport: '🏃运动',
      craft: '✂️手工',
      housework: '🧹家务'
    },
    canCheckin: false,
    isParent: false
  },

  onShow() {
    this.waitForUser()
      .then(() => {
        this.setData({ recordList: [], skip: 0, noMore: false, totalCount: 0 });
        this.loadRecords();
      })
      .catch((error) => {
        wx.showToast({ title: error.message || '用户信息未就绪', icon: 'none' });
      });
  },

  waitForUser() {
    const app = getApp({ allowDefault: true });

    return new Promise((resolve, reject) => {
      if (!app || !app.globalData) {
        reject(new Error('应用未初始化，请重启小程序'));
        return;
      }

      if (app.globalData.userInfo) {
        this.applyRole(app.globalData.userInfo);
        resolve();
        return;
      }

      app.onUserReady((user) => {
        this.applyRole(user);
        resolve();
      });

      setTimeout(() => {
        if (!app.globalData.userInfo) {
          reject(new Error('登录超时，请稍后重试'));
        }
      }, 10000);
    });
  },

  applyRole(user) {
    this.setData({
      isParent: user.role === 'parent',
      canCheckin: user.role === 'child'
    });
  },

  async loadRecords() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('checkins')
        .orderBy('timestamp', 'desc')
        .skip(this.data.skip)
        .limit(this.data.limit)
        .get();

      const list = res.data.map((item) => ({ ...item, timeStr: toTimeStr(item.timestamp) }));
      this.setData({
        recordList: [...this.data.recordList, ...list],
        skip: this.data.skip + list.length,
        loading: false,
        noMore: list.length < this.data.limit,
        totalCount: this.data.totalCount + list.length
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  loadMore() {
    this.loadRecords();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  goCheckin() {
    wx.navigateTo({ url: '/pages/checkin/checkin' });
  },

  goStats() {
    wx.navigateTo({ url: '/pages/stats/stats' });
  }
});
