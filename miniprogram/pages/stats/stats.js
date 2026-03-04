Page({
  data: {
    stats: [],
    loading: false
  },

  async onShow() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'exportStats' });
      this.setData({ stats: res.result.data || [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  exportJson() {
    const content = JSON.stringify(this.data.stats, null, 2);
    wx.setClipboardData({ data: content });
  }
});
