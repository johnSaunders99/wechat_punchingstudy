// 小程序云开发配置
// 请替换为你的云环境 ID（云开发控制台 -> 设置 -> 环境设置）
const config = {
  envId: 'your-env-id',
  collection: {
    users: 'users',
    checkins: 'checkins'
  },
  media: {
    // 仅用于业务策略展示，实际清理由云函数 cleanImages 处理
    keepDays: 180
  }
};

module.exports = config;
