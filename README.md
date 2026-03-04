# 儿童日常行为打卡系统（微信小程序 + 云开发）

本仓库提供一个**纯前端 + 微信云开发**的完整落地方案：
- 小程序端采用 WXML / WXSS / JS。
- 后端能力使用 Cloud Base（云函数、云数据库、云存储、定时触发器）。
- 无需任何外部服务器。

## 项目结构

```text
cloudfunctions/
  ├── login/            # 登录云函数 (获取 OpenID)
  ├── exportStats/      # 统计云函数 (聚合 + 全勤计算)
  └── cleanImages/      # 定时清理过期媒体文件（可选）
miniprogram/
  ├── pages/
  │   ├── index/        # 主页：打卡列表分页加载
  │   ├── checkin/      # 打卡页：拍照/选图 + 选择类型 + 备注
  │   ├── detail/       # 详情页：查看单条记录大图
  │   ├── stats/        # 统计页：报表展示 + 导出 JSON
  │   └── register/     # 新用户注册页（昵称/角色）
  ├── app.js            # 全局登录与身份初始化
  ├── app.json
  └── utils/
      └── date.js       # 时间格式化工具
```

## 数据库集合设计

### 1) users
建议索引：`_openid`（自动）、`role`

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | String | 系统自动生成 |
| _openid | String | 微信用户唯一标识 |
| nickName | String | 昵称 |
| avatarUrl | String | 头像 |
| role | String | `child` / `parent` |
| createTime | Date | 注册时间 |

### 2) checkins
建议索引：`timestamp`（降序）、`_openid`、`dateStr`

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | String | 系统自动生成 |
| _openid | String | 打卡人 OpenID |
| userName | String | 打卡时昵称快照 |
| userAvatar | String | 打卡时头像快照 |
| type | String | `reading`/`sport`/`craft`/`housework` |
| mediaFileID | String | 云存储文件 ID |
| timestamp | Number | 时间戳 |
| dateStr | String | `YYYY-MM-DD` |
| remark | String | 备注，最长 100 字，用于补充说明 |

## 核心流程

1. **身份校验**：`app.js` 调用 `login` 云函数获取 `openid`，查询 `users` 判断是否新用户。
2. **打卡提交**：`checkin` 页面上传媒体到云存储，按类型循环写入 `checkins`。
3. **数据查询**：`index` 分页加载，`detail` 按记录查看媒体。
4. **统计计算**：`stats` 页面调用 `exportStats`，计算分类次数与全勤天数。

## 备注字段规则

- 字段名：`remark`
- 类型：`String`
- 长度：0~100 字
- 用途：记录每次打卡的补充信息（如“今日阅读《昆虫记》20分钟”）

## 定时清理（可选）

`cleanImages` 云函数支持定时删除 180 天前记录：
- 查询过期 `checkins`
- 批量删除 `mediaFileID`
- 删除对应数据库记录

触发器配置见：`cloudfunctions/cleanImages/config.json`
