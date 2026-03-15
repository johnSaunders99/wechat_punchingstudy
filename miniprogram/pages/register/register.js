Page({
  data: {
    nickName: '',
    avatarUrl: '',
    role: 'child',
    roleOptions: ['child', 'parent'],
    roleIndex: 0
  },

  onNickInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  onRoleChange(e) {
    const roleIndex = Number(e.detail.value || 0);
    const role = this.data.roleOptions[roleIndex] || 'child';
    this.setData({ roleIndex, role });
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
