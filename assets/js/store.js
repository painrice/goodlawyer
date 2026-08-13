/* ============================================================
   store.js — 本地数据存储层（localStorage）
   负责：案件 / 文书 / 检索记录 / 期限事件 / 设置 的读写与导入导出
   P0-4: 审计日志链式哈希防篡改
   ============================================================ */
(function(){
  const KEY='lawyer-workbench-v1';
  const TKEY='lawyer-workbench-token';
  const LS=window.localStorage;

  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

  // ---------- token 托管（后端鉴权）----------
  function getToken(){ return LS.getItem(TKEY)||''; }
  function setToken(t){ if(t) LS.setItem(TKEY,t); else LS.removeItem(TKEY); }
  function isAuthed(){ return !!getToken(); }
  function logout(){ setToken(''); }
  function tokenPresent(){ return !!getToken(); }

  // ---------- 后端同步（本地优先，后台推送）----------
  let _ready=false, _syncTimer=null;
  let _lastServerSync=0;
  let _onSyncConflict=null;
  let _localVersion=0;
  let _serverVersion=0;
  let _syncFailCount=0;

  function collections(){
    return {
      cases: state.cases,
      documents: state.documents,
      searches: state.searches,
      events: state.events,
      finances: state.finances,
      messages: state.messages,
      docVersions: state.docVersions,
      settings: state.settings,
      auditLogs: state.auditLogs,
      _localVersion: _localVersion
    };
  }
  function _scheduleSync(){
    if(!_ready || !isAuthed() || !window.Api) return;
    if(_syncTimer) clearTimeout(_syncTimer);
    _syncTimer=setTimeout(()=>{
      _localVersion++;
      window.Api.sync(collections()).then(res=>{
        if(res && res.serverVersion){
          _serverVersion = res.serverVersion;
        }
        _lastServerSync = Date.now();
        _syncFailCount = 0;
      }).catch(e=>{
        _syncFailCount++;
        if(_syncFailCount >= 3 && typeof toast === 'function'){
          toast('数据同步失败（已重试 '+_syncFailCount+' 次），请检查网络连接','err');
        }
        if(_syncFailCount < 5){
          setTimeout(()=>_scheduleSync(), Math.min(1000 * Math.pow(2, _syncFailCount), 30000));
        }
      });
    }, 400);
  }
  function hydrate(data){
    const serverData = data || {};
    // 检测同步冲突：如果本地有未同步的修改且服务端数据时间戳不同
    if(_localVersion > 0 && _onSyncConflict){
      const localModified = _localVersion > (_serverVersion || 0);
      if(localModified && _lastServerSync > 0){
        // 本地有未同步修改，且距离上次同步已超过 5 分钟
        const elapsed = Date.now() - _lastServerSync;
        if(elapsed > 5 * 60 * 1000){
          _onSyncConflict({
            localVersion: _localVersion,
            serverVersion: _serverVersion,
            elapsed: elapsed
          });
        }
      }
    }
    state=Object.assign(defaultState(), serverData);
    // 确保嵌套 settings.ai 不被浅合并吞掉
    state.settings.ai=Object.assign(defaultState().settings.ai, state.settings.ai||{});
    if(!state.settings) state.settings=defaultState().settings;
    ['cases','documents','searches','events','finances','messages','docVersions','auditLogs'].forEach(k=>{ if(!Array.isArray(state[k])) state[k]=[]; });
    _ready=true;
    _lastServerSync = Date.now();
    _serverVersion = serverData._localVersion || 0;
    _localVersion = _serverVersion;
    // 直接写入 localStorage，不触发 _scheduleSync 避免回推
    try {
      LS.setItem(KEY, JSON.stringify(state));
    } catch(e) {
      if(e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('[Store] localStorage 配额已满，bootstrap 数据无法持久化');
      }
    }
  }
  function onSyncConflict(cb){ _onSyncConflict = cb; }
  function getSyncStatus(){
    return {
      lastSync: _lastServerSync,
      localVersion: _localVersion,
      serverVersion: _serverVersion,
      hasUnsynced: _localVersion > _serverVersion
    };
  }

  // ---------- 默认设置 ----------
  function defaultState(){
    return {
      settings:{
        lawyerName:'', firm:'',
        ai:{enabled:false, baseUrl:'', apiKey:'', model:'gpt-4o-mini'}
      },
      cases:[], documents:[], searches:[], events:[],
      finances:[], messages:[], docVersions:[], auditLogs:[]
    };
  }

  // ---------- 读写 ----------
  let state;
  function load(){
    try{
      const raw=LS.getItem(KEY);
      if(raw){ state=Object.assign(defaultState(), JSON.parse(raw)); }
      else {
        state=defaultState();
        // 已登录但本地无数据：不播种，等待 bootstrap 从服务端拉取
        if(!tokenPresent()) seed();
      }
    }catch(e){ state=defaultState(); }
    // 确保嵌套 settings.ai 不被浅合并吞掉（旧版本 settings 无 ai 字段）
    state.settings.ai=Object.assign(defaultState().settings.ai, state.settings.ai||{});
    _ready=true;
    return state;
  }
  function save(){
    try {
      LS.setItem(KEY, JSON.stringify(state));
    } catch(e) {
      if(e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('[Store] localStorage 配额已满，数据可能无法持久化');
        if(typeof toast === 'function') toast('本地存储空间已满，数据仅保存在内存中，请及时导出备份','err');
      }
    }
    _scheduleSync();
  }
  function get(){ return state; }

  // ---------- 演示种子数据 ----------
  function seed(){
    const today=new Date();
    const d=(off)=>{const x=new Date(today);x.setDate(x.getDate()+off);return x.toISOString().slice(0,10)};
    state.cases=[
      {
        id:uid(), title:'张明诉李华民间借贷纠纷', type:'民事', stage:'一审',
        court:'上海市浦东新区人民法院', amount:480000, filingDate:d(-6),
        parties:[
          {role:'原告',name:'张明',isClient:true},
          {role:'被告',name:'李华',isClient:false}
        ],
        background:'2024年3月李华以资金周转为由向张明借款48万元，约定年利率12%，借期一年。到期后李华仅偿还利息，本金及后期利息未还。有借条、转账凭证及微信催款记录。',
        createdAt:d(-6),
        timeline:[
          {date:d(-380),title:'借款发生',desc:'李华出具借条并收到转账48万元'},
          {date:d(-20),title:'催款',desc:'张明通过微信多次催款未果'},
          {date:d(-6),title:'立案',desc:'向浦东法院提交起诉状立案'}
        ],
        evidence:[
          {name:'借条',type:'书证',note:'载明借款金额、利率、期限'},
          {name:'银行转账凭证',type:'书证',note:'48万元转账记录'},
          {name:'微信聊天记录',type:'电子数据',note:'催款及对方承认欠款'}
        ],
        analysis:{elements:'',disputes:'',risks:'',predict:''}
      },
      {
        id:uid(), title:'宏远公司与中建劳动合同争议', type:'民事', stage:'二审',
        court:'北京市第二中级人民法院', amount:0, filingDate:d(-40),
        parties:[
          {role:'上诉人(原审被告)',name:'宏远公司',isClient:true},
          {role:'被上诉人(原审原告)',name:'王某',isClient:false}
        ],
        background:'王某主张违法解除劳动合同赔偿金。一审法院认定公司解除违法，判赔。公司认为解除合法，上诉。争议焦点：解除事由是否充分、程序是否合规。',
        createdAt:d(-40),
        timeline:[
          {date:d(-120),title:'解除劳动关系',desc:'公司单方解除'},
          {date:d(-95),title:'仲裁',desc:'仲裁裁决公司支付赔偿'},
          {date:d(-40),title:'一审',desc:'一审判决公司败诉'},
          {date:d(8),title:'二审开庭',desc:'待开庭'}
        ],
        evidence:[
          {name:'解除通知书',type:'书证',note:'解除理由记载'},
          {name:'员工手册',type:'书证',note:'规章制度依据'}
        ],
        analysis:{elements:'',disputes:'',risks:'',predict:''}
      }
    ];
    // 财务记录
    state.finances=[
      {id:uid(),type:'income',category:'律师费',title:'张某案一审律师费',amount:20000,date:d(-3),caseId:state.cases[0].id,status:'paid',note:'已收到转账'},
      {id:uid(),type:'income',category:'律师费',title:'张某案风险代理费',amount:15000,date:d(30),caseId:state.cases[0].id,status:'pending',note:'判决生效后收取'},
      {id:uid(),type:'expense',category:'诉讼费',title:'张某案诉讼费',amount:4500,date:d(-6),caseId:state.cases[0].id,status:'paid',note:'法院预收'},
      {id:uid(),type:'expense',category:'差旅费',title:'北京差旅',amount:1800,date:d(-40),caseId:state.cases[1].id,status:'paid',note:'二审准备'}
    ];
    // 期限事件（从案件 timeline + 关键节点派生）
    state.events=[
      {id:uid(),caseId:state.cases[0].id,date:d(15),title:'举证期限届满',type:'deadline'},
      {id:uid(),caseId:state.cases[0].id,date:d(22),title:'一审开庭',type:'hearing'},
      {id:uid(),caseId:state.cases[1].id,date:d(8),title:'二审开庭',type:'hearing'},
      {id:uid(),caseId:state.cases[1].id,date:d(-2),title:'上诉状提交',type:'todo'}
    ];
    // 客户协作消息
    state.messages=[
      {id:uid(),caseId:state.cases[0].id,text:'已与当事人确认借款事实，当事人提供了借条原件和转账凭证截图。',from:'me',createdAt:new Date(Date.now()-86400000*3).toISOString()},
      {id:uid(),caseId:state.cases[0].id,text:'好的，请帮我准备起诉材料，尽快立案。',from:'client',createdAt:new Date(Date.now()-86400000*2).toISOString()},
      {id:uid(),caseId:state.cases[1].id,text:'与宏远公司确认解除通知书内容，公司坚持认为解除合法。',from:'me',createdAt:new Date(Date.now()-86400000*5).toISOString()}
    ];
    // 初始文书（含版本）
    state.documents=[
      {id:uid(),title:'民事起诉状（张明诉李华）',type:'民事起诉状',caseId:state.cases[0].id,content:'民事起诉状\n\n原告：张明\n被告：李华\n\n致 上海市浦东新区人民法院：\n\n案由：民间借贷纠纷\n\n一、诉讼请求\n1. 判令被告偿还借款本金48万元；\n2. 判令被告支付逾期利息（以48万为基数，按年利率12%计算）；\n3. 诉讼费由被告承担。',createdAt:d(-1)}
    ];
    // 为初始文书创建版本记录
    state.docVersions=[
      {id:uid(),docId:state.documents[0].id,versionNum:1,title:'民事起诉状（张明诉李华）',type:'民事起诉状',content:state.documents[0].content,caseId:state.cases[0].id,createdAt:d(-1),reason:'初始版本'}
    ];
    save();
  }

  // ---------- CRUD：案件 ----------
  function addCase(obj){
    const c=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10),
      timeline:[],evidence:[],analysis:{elements:'',disputes:'',risks:'',predict:'',nineStep:null}}, obj);
    state.cases.unshift(c);
    addAuditLog('create', 'case', c.id, c.title);
    save(); return c;
  }
  function updateCase(id,obj){
    const i=state.cases.findIndex(c=>c.id===id);
    if(i<0) return null;
    const oldCase = state.cases[i];
    state.cases[i]=Object.assign({},oldCase,obj);
    // 记录变更字段
    const changes = [];
    for(const key in obj){
      if(obj.hasOwnProperty(key) && oldCase[key] !== obj[key]){
        changes.push({field: key, from: oldCase[key], to: obj[key]});
      }
    }
    if(changes.length > 0){
      addAuditLog('update', 'case', id, oldCase.title, changes.length === 1 ? changes[0] : changes);
    }
    save(); return state.cases[i];
  }
  function deleteCase(id){
    const cs = state.cases.find(c=>c.id===id);
    const title = cs ? cs.title : '';
    state.cases=state.cases.filter(c=>c.id!==id);
    state.documents=state.documents.filter(d=>d.caseId!==id);
    state.events=state.events.filter(e=>e.caseId!==id);
    state.finances=state.finances.filter(f=>f.caseId!==id);
    state.messages=state.messages.filter(m=>m.caseId!==id);
    state.searches=state.searches.filter(s=>s.caseId!==id);
    state.docVersions=state.docVersions.filter(v=>v.caseId!==id);
    addAuditLog('delete', 'case', id, title);
    save();
  }
  function getCase(id){ return state.cases.find(c=>c.id===id); }

  // ---------- 利益冲突检查 ----------
  function checkConflict(parties, excludeCaseId){
    if(!parties || !parties.length) return [];
    const conflicts = [];
    const myParties = parties.filter(p => p.name && p.name.trim());
    if(!myParties.length) return [];
    for(const cs of state.cases){
      if(excludeCaseId && cs.id === excludeCaseId) continue;
      if(!cs.parties || !cs.parties.length) continue;
      for(const mp of myParties){
        const mpName = mp.name.trim();
        const isMyClient = mp.isClient;
        for(const op of cs.parties){
          if(!op.name || !op.name.trim()) continue;
          if(mpName === op.name.trim()){
            if(isMyClient !== op.isClient){
              conflicts.push({
                caseId: cs.id,
                caseTitle: cs.title,
                partyName: mpName,
                myRole: isMyClient ? '我方委托人' : '对方当事人',
                otherRole: op.isClient ? '我方委托人' : '对方当事人',
                level: 'high'
              });
            } else {
              conflicts.push({
                caseId: cs.id,
                caseTitle: cs.title,
                partyName: mpName,
                myRole: isMyClient ? '我方委托人' : '对方当事人',
                otherRole: op.isClient ? '我方委托人' : '对方当事人',
                level: 'low'
              });
            }
          }
        }
      }
    }
    return conflicts;
  }

  // ---------- CRUD：文书 ----------
  function addDoc(obj){
    const d=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10)},obj);
    state.documents.unshift(d);
    addAuditLog('create', 'document', d.id, d.title || d.type || '文书');
    // 初始版本
    _saveDocVersion(d, '初始版本');
    save(); return d;
  }
  function updateDoc(id, obj){
    const i=state.documents.findIndex(d=>d.id===id);
    if(i<0) return null;
    const old = state.documents[i];
    state.documents[i]=Object.assign({},old,obj, {updatedAt:new Date().toISOString().slice(0,10)});
    addAuditLog('update','document',id,old.title||old.type||'文书');
    _saveDocVersion(state.documents[i], '编辑更新');
    save(); return state.documents[i];
  }
  function deleteDoc(id){
    const doc = state.documents.find(d=>d.id===id);
    const title = doc ? (doc.title || doc.type || '文书') : '';
    state.documents=state.documents.filter(d=>d.id!==id);
    // 删除关联版本
    state.docVersions=state.docVersions.filter(v=>v.docId!==id);
    addAuditLog('delete', 'document', id, title);
    save();
  }

  // ---------- 文档版本控制 ----------
  function _saveDocVersion(doc, reason){
    const versions = state.docVersions.filter(v=>v.docId===doc.id);
    const version = {
      id: uid(),
      docId: doc.id,
      versionNum: versions.length + 1,
      title: doc.title,
      type: doc.type,
      content: doc.content,
      caseId: doc.caseId,
      createdAt: new Date().toISOString().slice(0,10),
      reason: reason || '保存'
    };
    state.docVersions.unshift(version);
    // 保留最多 20 个版本/文档
    const thisDocVs = state.docVersions.filter(v=>v.docId===doc.id);
    if(thisDocVs.length > 20){
      const toRemove = thisDocVs.slice(20).map(v=>v.id);
      state.docVersions = state.docVersions.filter(v=>!toRemove.includes(v.id));
    }
    return version;
  }
  function getDocVersions(docId){
    return state.docVersions.filter(v=>v.docId===docId).sort((a,b)=>b.versionNum-a.versionNum);
  }
  function restoreDocVersion(versionId){
    const ver = state.docVersions.find(v=>v.id===versionId);
    if(!ver) return null;
    const doc = state.documents.find(d=>d.id===ver.docId);
    if(!doc) return null;
    // 将版本内容写入文书（作为新版本）
    const restored = {
      title: ver.title,
      type: ver.type,
      content: ver.content,
      caseId: ver.caseId,
      updatedAt: new Date().toISOString().slice(0,10)
    };
    return updateDoc(doc.id, restored);
  }

  // ---------- CRUD：检索 ----------
  function addSearch(obj){
    const s=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10)},obj);
    state.searches.unshift(s);
    addAuditLog('create', 'search', s.id, s.query || s.type || '检索');
    save(); return s;
  }
  function deleteSearch(id){
    const search = state.searches.find(s=>s.id===id);
    const title = search ? (search.query || search.type || '检索') : '';
    state.searches=state.searches.filter(s=>s.id!==id);
    addAuditLog('delete', 'search', id, title);
    save();
  }

  // ---------- CRUD：事件 ----------
  function addEvent(obj){
    const e=Object.assign({id:uid()},obj);
    state.events.push(e);
    addAuditLog('create', 'event', e.id, e.title || '事件');
    save(); return e;
  }
  function deleteEvent(id){
    const event = state.events.find(e=>e.id===id);
    const title = event ? (event.title || '事件') : '';
    state.events=state.events.filter(e=>e.id!==id);
    addAuditLog('delete', 'event', id, title);
    save();
  }

  // ---------- CRUD：财务跟踪 ----------
  function addFinance(obj){
    const f=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10)},obj);
    state.finances.unshift(f);
    addAuditLog('create', 'finance', f.id, f.title || f.category || '财务');
    save(); return f;
  }
  function updateFinance(id,obj){
    const i=state.finances.findIndex(f=>f.id===id);
    if(i<0) return null;
    const old = state.finances[i];
    state.finances[i]=Object.assign({},old,obj);
    const changes = [];
    for(const key in obj){
      if(obj.hasOwnProperty(key) && old[key] !== obj[key]){
        changes.push({field:key, from:old[key], to:obj[key]});
      }
    }
    if(changes.length>0) addAuditLog('update','finance',id,old.title||old.category||'财务',changes);
    save(); return state.finances[i];
  }
  function deleteFinance(id){
    const f = state.finances.find(x=>x.id===id);
    const title = f ? (f.title || f.category || '财务') : '';
    state.finances=state.finances.filter(x=>x.id!==id);
    addAuditLog('delete','finance',id,title);
    save();
  }
  function getFinances(caseId){
    if(caseId) return state.finances.filter(f=>f.caseId===caseId);
    return state.finances;
  }

  // ---------- CRUD：客户协作消息 ----------
  function addMessage(obj){
    const m=Object.assign({id:uid(),createdAt:new Date().toISOString()},obj);
    state.messages.unshift(m);
    addAuditLog('create','message',m.id,m.caseId?('案件 '+m.caseId):'消息');
    save(); return m;
  }
  function getMessages(caseId){
    if(caseId) return state.messages.filter(m=>m.caseId===caseId);
    return state.messages;
  }
  function deleteMessage(id){
    const m = state.messages.find(x=>x.id===id);
    state.messages=state.messages.filter(x=>x.id!==id);
    addAuditLog('delete','message',id,m?m.caseId:'');
    save();
  }

  // ---------- 审计日志（P0-4: 链式哈希防篡改）----------
  const MAX_AUDIT_LOGS = 1000;
  let _chainAnchor = null; // 截断后保留的最旧条目的前驱哈希

  function _computeHash(log, prevHash) {
    const data = JSON.stringify({...log, hash: undefined});
    const payload = (prevHash || 'genesis') + '|' + data;
    return (typeof CryptoJS !== 'undefined' && CryptoJS.SHA256) ? CryptoJS.SHA256(payload).toString() : _simpleHash(payload);
  }

  function _simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
      h = h & 0xFFFFFFFF;
    }
    return h.toString(16);
  }

  function _getLastHash() {
    if (!state.auditLogs.length) return _chainAnchor || 'genesis';
    return state.auditLogs[0].hash || 'genesis';
  }

  function addAuditLog(action, entity, entityId, entityTitle, changes){
    const log = {
      id: uid(),
      timestamp: new Date().toISOString(),
      action: action,
      entity: entity,
      entityId: entityId,
      entityTitle: entityTitle || '',
      changes: changes || null
    };
    log.hash = _computeHash(log, _getLastHash());
    state.auditLogs.unshift(log);
    if(state.auditLogs.length > MAX_AUDIT_LOGS){
      // 截断前：保存被移除的最旧条目的 hash 作为锚点
      const removed = state.auditLogs[MAX_AUDIT_LOGS];
      _chainAnchor = removed ? removed.hash : _chainAnchor;
      state.auditLogs = state.auditLogs.slice(0, MAX_AUDIT_LOGS);
    }
    return log;
  }

  function verifyAuditChain() {
    if (state.auditLogs.length === 0) return { valid: true, brokenAt: null };
    const logs = [...state.auditLogs].reverse();
    let lastHash = _chainAnchor || 'genesis';
    for (let i = 0; i < logs.length; i++) {
      const expected = _computeHash(logs[i], lastHash);
      if (logs[i].hash !== expected) {
        return { valid: false, brokenAt: logs[i].id, note: _chainAnchor ? '链已截断，仅验证最近 '+state.auditLogs.length+' 条' : null };
      }
      lastHash = logs[i].hash;
    }
    return { valid: true, brokenAt: null, truncated: !!_chainAnchor };
  }

  function getAuditLogs(filters){
    let logs = state.auditLogs.slice();
    if(filters){
      if(filters.entity) logs = logs.filter(l => l.entity === filters.entity);
      if(filters.action) logs = logs.filter(l => l.action === filters.action);
      if(filters.entityId) logs = logs.filter(l => l.entityId === filters.entityId);
    }
    return logs;
  }

  // ---------- 设置 ----------
  function updateSettings(obj){
    const oldSettings = JSON.parse(JSON.stringify(state.settings));
    state.settings=Object.assign({},state.settings,obj);
    // 记录设置变更
    const changes = [];
    for(const key in obj){
      if(obj.hasOwnProperty(key) && JSON.stringify(oldSettings[key]) !== JSON.stringify(obj[key])){
        changes.push({field: key, from: oldSettings[key], to: obj[key]});
      }
    }
    if(changes.length > 0){
      addAuditLog('update', 'settings', 'settings', '系统设置', changes.length === 1 ? changes[0] : changes);
    }
    save();
  }

  // ---------- 导入导出 ----------
  function exportAll(){ return JSON.stringify(state,null,2); }
  function importAll(json){
    const data=JSON.parse(json);
    if(typeof data!=='object'||data===null||Array.isArray(data))throw new Error('无效的备份格式');
    // 校验必要字段
    ['cases','documents','searches','events','finances','messages','docVersions','auditLogs'].forEach(k=>{
      if(data[k]!==undefined&&!Array.isArray(data[k]))throw new Error('备份字段 '+k+' 格式错误');
    });
    if(data.settings&&typeof data.settings!=='object')throw new Error('备份字段 settings 格式错误');
    state=Object.assign(defaultState(), data);
    state.settings.ai=Object.assign(defaultState().settings.ai, state.settings.ai||{});
    save(); return state;
  }
  function resetAll(){ state=defaultState(); save(); }

  window.Store={
    uid, load, save, get,
    hydrate, collections, isAuthed, getToken, setToken, logout,
    onSyncConflict, getSyncStatus,
    addCase, updateCase, deleteCase, getCase, checkConflict,
    addDoc, deleteDoc,
    addSearch, deleteSearch,
    addEvent, deleteEvent,
    addFinance, updateFinance, deleteFinance, getFinances,
    addMessage, getMessages, deleteMessage,
    getDocVersions, restoreDocVersion,
    updateSettings,
    addAuditLog, getAuditLogs, verifyAuditChain,
    seed,
    exportAll, importAll, resetAll
  };
})();
