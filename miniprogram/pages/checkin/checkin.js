const { toDateStr } = require('../../utils/date');

Page({
  data: {
    types: [
      { id: 'reading', name: '📚 阅读', selected: false },
      { id: 'sport', name: '🏃 运动', selected: false },
      { id: 'craft', name: '✂️ 手工', selected: false },
      { id: 'housework', name: '🧹 家务', selected: false }
    ],
    tempFilePath: '',
    remark: '',
    submitting: false
  },

  toggleType(e) {
    const idx = e.currentTarget.dataset.index;
    const types = this.data.types;
    types[idx].selected = !types[idx].selected;
    this.setData({ types });
  },

  onRemarkInput(e) {
    const remark = (e.detail.value || '').slice(0, 100);
    this.setData({ remark });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ tempFilePath: res.tempFiles[0].tempFilePath });
      }
    });
  },

  async submit() {
    if (this.data.submitting) return;

    const selectedTypes = this.data.types.filter((t) => t.selected).map((t) => t.id);
    if (!selectedTypes.length) return wx.showToast({ title: '请选择打卡项目', icon: 'none' });
    if (!this.data.tempFilePath) return wx.showToast({ title: '请上传图片', icon: 'none' });

    this.setData({ submitting: true });
    wx.showLoading({ title: '上传中...' });

    try {
      const app = getApp();
      const user = app.globalData.userInfo;
      const timestamp = Date.now();
      const dateStr = toDateStr(timestamp);
      const ext = this.data.tempFilePath.split('.').pop();
      const cloudPath = `checkins/${user._openid}/${timestamp}.${ext}`;

      const uploadRes = await wx.cloud.uploadFile({ filePath: this.data.tempFilePath, cloudPath });
      const db = wx.cloud.database();
      await Promise.all(
        selectedTypes.map((type) => db.collection('checkins').add({
          data: {
            _openid: user._openid,
            userName: user.nickName,
            userAvatar: user.avatarUrl,
            type,
            mediaFileID: uploadRes.fileID,
            timestamp,
            dateStr,
            remark: this.data.remark.trim()
          }
        }))
      );

      wx.hideLoading();
      wx.showToast({ title: '打卡成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: `失败：${error.message}`, icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
