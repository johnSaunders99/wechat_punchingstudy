Page({
  data: {
    record: null,
    tempUrl: ''
  },

  async onLoad(query) {
    const { id } = query;
    const db = wx.cloud.database();
    const res = await db.collection('checkins').doc(id).get();
    const record = res.data;

    const fileRes = await wx.cloud.getTempFileURL({ fileList: [record.mediaFileID] });
    this.setData({ record, tempUrl: fileRes.fileList[0].tempFileURL });
  }
});
