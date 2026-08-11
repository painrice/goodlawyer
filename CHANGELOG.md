# Changelog

## 2026-08-11 — 代码质量与功能修复

### 严重 Bug 修复
1. **案件详情页路由修复** — `case-detail` 未注册到 `PAGES` 对象，导致路由守卫将其重置为 `dashboard`，案件详情页完全无法访问。已将 `case-detail` 添加到 `PAGES`。
2. **日历事件删除修复** — `dayEvents()` 模态框的"删除"标签缺少 `data-act` 属性和事件处理器。已绑定 `del-event` 事件并实现删除确认逻辑。

### 功能改进
3. **语音摘要增强** — 从简单的"取前 8 句"改为：提取高频关键词、基于语义匹配自动识别待办事项和风险提示，生成四段式结构化纪要。
4. **AI 调用超时保护** — `callAI()` 新增 `AbortController` 30 秒超时，避免 UI 永远显示"调用中..."。
5. **剪贴板兼容性** — `copyDoc()` 在 HTTP 环境（`navigator.clipboard` 不可用）时自动降级为 `textarea + execCommand('copy')`。

### 代码质量
6. **移除死代码** — 删除未使用的 `partyCount` 全局变量。
7. **聊天记录上限** — `chatLog` 限制为最近 200 条，防止无限增长导致内存泄漏。
8. **空值安全** — `analysisBlock()` 和 `wfOpen()` 中 `skillByDir()` 调用添加空值检查，避免技能目录名不匹配时崩溃。
9. **`brandLogo` 图标** — 添加 `scale`（天平）图标定义，品牌标识正确显示。

### 数据层修复
10. **`Store.hydrate()` 同步循环修复** — 从服务端 bootstrap 拉取数据后不再触发 `_scheduleSync()` 回推，避免数据反复同步。
11. **导入备份校验** — `importAll()` 新增结构校验，拒绝格式不正确的 JSON，防止破坏应用状态。

### 服务端加固
12. **请求体大小限制** — 新增 10MB 上限，防止恶意客户端发送超大请求耗尽内存。
13. **密钥文件权限** — `secret.txt` 创建时设置 `0o600` 权限，仅文件所有者可读写。
14. **CORS 收紧** — 从 `Access-Control-Allow-Origin: *` 改为基于请求 `Origin` 头动态返回，减少跨域攻击面。
5. **bootstrap 容错** — 数据库中损坏的 JSON 行不再导致整个 bootstrap 崩溃，改为返回空默认值。

### 清理
15. **移除 `output_file`** — 删除仓库中不相关的 130KB tar 归档文件。
