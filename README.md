# 好律师 · 律师工作台

律师智能工作台：案件管理、法律技能库、AI 辅助分析、文书起草、风险研判。

## 快速启动

```bash
python server.py
```

打开 **http://localhost:8080**，注册一个账号即可使用。全程零依赖，Python 标准库直接跑。

## 技术栈

| 层 | 方案 |
|---|---|
| 后端 | Python 标准库（http.server + sqlite3 + HMAC 鉴权），零 pip install |
| 前端 | 纯静态 SPA（HTML + CSS + 原生 JS），hash 路由，无框架 |
| 持久化 | 服务端 SQLite（按用户账号隔离）+ 浏览器 localStorage（本地缓存） |
| 鉴权 | 自签 HMAC token（类 JWT HS256），7 天有效，密钥自动生成并持久化 |
| 同步 | 本地优先 + 服务端权威（登录拉全量、变更后台推、last-write-wins） |

## 功能模块

- **工作台仪表盘** — 案件统计、临近期限、最近案件、技能快捷入口
- **案件管理** — CRUD + 详情（概览/时间轴/证据/AI 分析/关联文书）
- **诉讼中心** — 月历排期 + 期限监控 + 开庭提醒
- **智能辅助（小律）** — 结构化工学流 + 对话（在线/离线双模式）
- **AI 技能库** — 38 项法律推理技能（Legal-Skills-Chinese），按 7 大类浏览
- **文书起草** — 8 种模板（起诉状/答辩状/上诉状/代理词/律师函/法律意见书/合同审查意见/答辩意见）
- **案例检索** — 检索式构造 + 报告模板
- **法条检索** — 法条定位 + 效力核验清单
- **风险研判** — 风险矩阵（概率×影响）+ 优先级排序 + 应对建议
- **语音转写** — Web Speech API（zh-CN）实时转写 + 会谈纪要生成
- **个人中心** — 律师信息 + AI 引擎配置 + 数据导入导出

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/register` | 注册（username + password） |
| POST | `/api/login` | 登录，返回 token |
| GET | `/api/bootstrap` | 拉取全量数据（需 token） |
| PUT | `/api/sync` | 推送全量数据（需 token） |
| GET | `/api/health` | 健康检查 |

## 参考

- [Legal-Skills-Chinese](https://github.com/THUYRan/Legal-Skills-Chinese)（CC BY-NC-ND 4.0）— 法律推理技能方法论