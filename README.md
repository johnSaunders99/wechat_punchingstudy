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


## 部署前必须配置（关键项）

> 你问的“图片存储和登录怎么配”，核心就在这几项。

1. **云开发环境 ID（envId）**
   - 文件：`miniprogram/utils/config.js`
   - 把 `envId: 'your-env-id'` 改为你自己的环境 ID。
   - `app.js` 中 `wx.cloud.init({ env: config.envId })` 会使用该值。

2. **小程序 AppID + 云开发能力开通**
   - 在微信开发者工具中配置你的小程序 AppID（不是测试号就必须真实 AppID）。
   - 控制台开通“云开发”，并确保当前项目绑定到同一个云环境。

3. **云数据库集合与索引**
   - 创建集合：`users`、`checkins`。
   - 推荐索引：
     - `users`: `_openid`（自动）、`role`
     - `checkins`: `timestamp`（降序）、`_openid`、`dateStr`

4. **数据库权限规则（非常关键）**
   - `users`：建议“仅创建者可读写”或按角色精细放开。
   - `checkins`：建议普通用户仅可写自己的数据；家长看全量可通过云函数读取（避免前端直读全量暴露）。
   - 生产环境优先把统计类查询放在云函数侧执行。

5. **云存储（图片）配置**
   - 上传使用 `wx.cloud.uploadFile`，路径格式：`checkins/{openid}/{timestamp}.ext`。
   - 页面展示时用 `wx.cloud.getTempFileURL` 换临时链接。
   - 若要“只保留半年”，部署 `cleanImages` 云函数并启用定时触发器（见 `cloudfunctions/cleanImages/config.json`）。

6. **云函数部署与依赖**
   - 需分别部署：`login`、`exportStats`、`cleanImages`。
   - 每个云函数目录需要安装依赖（最少 `wx-server-sdk`）：
     ```bash
     cd cloudfunctions/login && npm i
     cd ../exportStats && npm i
     cd ../cleanImages && npm i
     ```

7. **登录配置说明（OpenID 获取）**
   - 本方案通过云函数 `login` 的 `cloud.getWXContext()` 获取 `OPENID`，无需外部登录服务器。
   - 首次登录后前端查询 `users`：不存在则进入注册页；存在则写入全局用户态。

8. **用户信息能力（昵称/头像）**
   - 注册页使用 `chooseAvatar`，需基础库与开发者工具版本支持。
   - 昵称用输入框手动填写，避免依赖旧版 `getUserProfile` 授权流程。

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


## 常见问题排查

### 1) `TypeError: Cannot read property 'globalData' of undefined`
该错误通常出现在页面比 `App` 初始化更早读取 `getApp().globalData`。

本项目已做两层防护：
- `getApp({ allowDefault: true })` 防止直接拿到 `undefined`。
- `app.onUserReady(callback)` 等待登录完成后再使用 `userInfo`。

如果你仍遇到该问题，请检查：
- 是否在微信开发者工具里开启了云开发并绑定正确环境。
- `miniprogram/utils/config.js` 中 `envId` 是否正确。
- `login` 云函数是否已成功部署并可调用。

