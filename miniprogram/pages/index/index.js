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
    this.waitForUser().then(() => {
      this.setData({ recordList: [], skip: 0, noMore: false, totalCount: 0 });
      this.loadRecords();
    });
  },

  waitForUser() {
    const app = getApp();
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (app.globalData.userInfo) {
          clearInterval(timer);
          const user = app.globalData.userInfo;
          this.setData({
            isParent: user.role === 'parent',
            canCheckin: user.role === 'child'
          });
          resolve();
        }
      }, 200);
    });
  },

  async loadRecords() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ loading: true });

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
