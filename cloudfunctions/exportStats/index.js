const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const usersRes = await db.collection('users').field({ _openid: true, nickName: true, role: true }).get();
    const users = usersRes.data;
    const statsResult = [];

    for (const user of users) {
      const records = await db.collection('checkins').where({ _openid: user._openid }).orderBy('timestamp', 'desc').get();
      const data = records.data;
      const counts = { reading: 0, sport: 0, craft: 0, housework: 0 };
      const dateMap = {};

      data.forEach((item) => {
        if (counts[item.type] !== undefined) counts[item.type] += 1;
        if (!dateMap[item.dateStr]) dateMap[item.dateStr] = new Set();
        dateMap[item.dateStr].add(item.type);
      });

      let perfectDays = 0;
      Object.values(dateMap).forEach((typeSet) => {
        if (typeSet.size === 4) perfectDays += 1;
      });

      statsResult.push({
        nickName: user.nickName,
        role: user.role,
        ...counts,
        totalCount: data.length,
        perfectDays
      });
    }

    return { success: true, data: statsResult };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};
