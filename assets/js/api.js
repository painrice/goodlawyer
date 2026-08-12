/* ============================================================
   api.js — 前端与后端通信层
   负责：注册 / 登录 / 拉取全量(bootstrap) / 推送全量(sync) / 服务端时间
   token 由 Store 托管；401 时广播 wb-unauth 事件由 app.js 处理登出
   ============================================================ */
(function () {
  const BASE = "/api";

  async function _req(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    const t = window.Store && window.Store.getToken ? window.Store.getToken() : "";
    if (t) headers["Authorization"] = "Bearer " + t;
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error("无法连接后端服务，请确认 server.py 已启动（默认 http://localhost:8080）");
    }
    let data = {};
    try {
      data = await res.json();
    } catch (_) {}
    if (res.status === 401) {
      if (window.Store) window.Store.logout();
      window.dispatchEvent(new Event("wb-unauth"));
      throw new Error("登录已过期，请重新登录");
    }
    if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
    return data;
  }

  window.Api = {
    register(u, p) {
      return _req("POST", "/register", { username: u, password: p });
    },
    login(u, p) {
      return _req("POST", "/login", { username: u, password: p });
    },
    bootstrap() {
      return _req("GET", "/bootstrap");
    },
    sync(state) {
      return _req("PUT", "/sync", state);
    },
    /**
     * 获取服务端时间（P0-3：期限计算不再依赖客户端本地时间）
     */
    getTime() {
      return _req("GET", "/time");
    },
    /**
     * 共享相关 API
     */
    getShares() {
      return _req("GET", "/shares");
    },
    searchUsers(q) {
      return _req("GET", "/users/search?q=" + encodeURIComponent(q));
    },
    share(username, caseId, role) {
      return _req("POST", "/share", { username, case_id: caseId, role });
    },
    unshare(caseId, username) {
      return _req("DELETE", "/share/" + caseId + "/" + username);
    },
  };
})();
