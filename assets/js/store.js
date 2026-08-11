/* ============================================================
   store.js — 本地数据存储层（localStorage）
   负责：案件 / 文书 / 检索记录 / 期限事件 / 设置 的读写与导入导出
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
  function collections(){
    return {
      cases: state.cases,
      documents: state.documents,
      searches: state.searches,
      events: state.events,
      settings: state.settings
    };
  }
  function _scheduleSync(){
    if(!_ready || !isAuthed() || !window.Api) return;
    if(_syncTimer) clearTimeout(_syncTimer);
    _syncTimer=setTimeout(()=>{
      window.Api.sync(collections()).catch(()=>{});
    }, 400);
  }
  function hydrate(data){
    state=Object.assign(defaultState(), data||{});
    // 确保嵌套 settings.ai 不被浅合并吞掉
    state.settings.ai=Object.assign(defaultState().settings.ai, state.settings.ai||{});
    if(!state.settings) state.settings=defaultState().settings;
    ['cases','documents','searches','events'].forEach(k=>{ if(!Array.isArray(state[k])) state[k]=[]; });
    _ready=true;
    save();
  }

  // ---------- 默认设置 ----------
  function defaultState(){
    return {
      settings:{
        lawyerName:'', firm:'',
        ai:{enabled:false, baseUrl:'', apiKey:'', model:'gpt-4o-mini'}
      },
      cases:[], documents:[], searches:[], events:[]
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
    LS.setItem(KEY, JSON.stringify(state));
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
    // 期限事件（从案件 timeline + 关键节点派生）
    state.events=[
      {id:uid(),caseId:state.cases[0].id,date:d(15),title:'举证期限届满',type:'deadline'},
      {id:uid(),caseId:state.cases[0].id,date:d(22),title:'一审开庭',type:'hearing'},
      {id:uid(),caseId:state.cases[1].id,date:d(8),title:'二审开庭',type:'hearing'},
      {id:uid(),caseId:state.cases[1].id,date:d(-2),title:'上诉状提交',type:'todo'}
    ];
    save();
  }

  // ---------- CRUD：案件 ----------
  function addCase(obj){
    const c=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10),
      timeline:[],evidence:[],analysis:{elements:'',disputes:'',risks:'',predict:''}}, obj);
    state.cases.unshift(c); save(); return c;
  }
  function updateCase(id,obj){
    const i=state.cases.findIndex(c=>c.id===id);
    if(i<0) return null;
    state.cases[i]=Object.assign({},state.cases[i],obj); save(); return state.cases[i];
  }
  function deleteCase(id){
    state.cases=state.cases.filter(c=>c.id!==id);
    state.documents=state.documents.filter(d=>d.caseId!==id);
    state.events=state.events.filter(e=>e.caseId!==id);
    save();
  }
  function getCase(id){ return state.cases.find(c=>c.id===id); }

  // ---------- CRUD：文书 ----------
  function addDoc(obj){ const d=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10)},obj); state.documents.unshift(d); save(); return d; }
  function deleteDoc(id){ state.documents=state.documents.filter(d=>d.id!==id); save(); }

  // ---------- CRUD：检索 ----------
  function addSearch(obj){ const s=Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10)},obj); state.searches.unshift(s); save(); return s; }
  function deleteSearch(id){ state.searches=state.searches.filter(s=>s.id!==id); save(); }

  // ---------- CRUD：事件 ----------
  function addEvent(obj){ const e=Object.assign({id:uid()},obj); state.events.push(e); save(); return e; }
  function deleteEvent(id){ state.events=state.events.filter(e=>e.id!==id); save(); }

  // ---------- 设置 ----------
  function updateSettings(obj){ state.settings=Object.assign({},state.settings,obj); save(); }

  // ---------- 导入导出 ----------
  function exportAll(){ return JSON.stringify(state,null,2); }
  function importAll(json){
    const data=JSON.parse(json);
    state=Object.assign(defaultState(), data);
    state.settings.ai=Object.assign(defaultState().settings.ai, state.settings.ai||{});
    save(); return state;
  }
  function resetAll(){ state=defaultState(); save(); }

  window.Store={
    uid, load, save, get,
    hydrate, collections, isAuthed, getToken, setToken, logout,
    addCase, updateCase, deleteCase, getCase,
    addDoc, deleteDoc,
    addSearch, deleteSearch,
    addEvent, deleteEvent,
    updateSettings,
    seed,
    exportAll, importAll, resetAll
  };
})();
