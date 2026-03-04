const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async () => {
  const threshold = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const oldRes = await db.collection('checkins').where({ timestamp: _.lt(threshold) }).limit(100).get();
  const oldData = oldRes.data;

  if (!oldData.length) return { success: true, removed: 0 };

  const fileList = oldData.map((item) => item.mediaFileID).filter(Boolean);
  if (fileList.length) {
    await cloud.deleteFile({ fileList });
  }

  await Promise.all(oldData.map((item) => db.collection('checkins').doc(item._id).remove()));

  return { success: true, removed: oldData.length };
};
