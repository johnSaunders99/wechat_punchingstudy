Page({
  data: {
    nickName: '',
    avatarUrl: '',
    role: 'child'
  },

  onNickInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  onRoleChange(e) {
    this.setData({ role: e.detail.value });
  },

  chooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl });
  },

  async submit() {
    if (!this.data.nickName) return wx.showToast({ title: '请输入昵称', icon: 'none' });
    const db = wx.cloud.database();
    await db.collection('users').add({
      data: {
        nickName: this.data.nickName,
        avatarUrl: this.data.avatarUrl,
        role: this.data.role,
        createTime: new Date()
      }
    });
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
