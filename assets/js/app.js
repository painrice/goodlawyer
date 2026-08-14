/* ============================================================
   app.js — 好律师 · 律师工作台  主逻辑
   路由 + 各功能模块渲染与交互 + AI 引擎接入 + 语音转写 + 文书生成
   方法论来源：GitHub THUYRan/Legal-Skills-Chinese（38 原子+2 复合技能）
   P0-2: AI 输出强制标记 + 核对工作流
   P0-3: 期限计算改用服务端时间
   ============================================================ */
(function(){
'use strict';

/* ---------------- 图标 ---------------- */
const ICONS={
  dashboard:'<path d="M3 13h8V3H3zM13 21h8V3h-8zM3 21h8v-6H3z"/>',
  case:'<path d="M3 7h18v14H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  gavel:'<path d="M14 13l-7 7M3 21h8M14.5 5.5l4 4M12 8l-3 3 5 5 3-3zM16 4l4 4-3 3-4-4z"/>',
  robot:'<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4M9 13h.01M15 13h.01M9 16h6"/>',
  library:'<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3 14-2 .4L14 6z"/>',
  doc:'<path d="M6 2h8l4 4v16H6zM14 2v4h4M9 12h6M9 16h6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h12v17H6a2 2 0 0 0-2 2zM18 3v17"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.4 2.7a7 7 0 0 0-2.2 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3L10 22h4l.4-2.7a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit:'<path d="M4 20h4L18 10l-4-4L4 16zM13 5l4 4"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload:'<path d="M12 21V9M7 14l5-5 5 5M5 21h14"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  check:'<path d="M5 12l5 5L20 6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  alert:'<path d="M12 3l9 16H3zM12 10v4M12 17h.01"/>',
  sparkle:'<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  save:'<path d="M5 3h12l4 4v14H5zM8 3v6h8M8 21v-6h8v6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  chevronRight:'<path d="M9 6l6 6-6 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  file:'<path d="M6 2h8l4 4v16H6zM14 2v4h4"/>',
  brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 1"/>',
  scale:'<path d="M12 3v19M4 7l4-4 4 4M20 7l-4-4-4 4M4 7l4 4H1l3-4zM20 7l-4 4h7l-3-4z"/>'
};
function icon(n,w){const s=w||16;return '<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||'')+'</svg>';}

/* ---------------- 工具 ---------------- */
const $=s=>document.querySelector(s), $a=s=>[...document.querySelectorAll(s)];
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(s){return s?String(s).slice(0,10):'-';}
function daysBetween(a,b){const x=new Date(a),y=new Date(b);return Math.round((x-y)/86400000);}
function toast(msg,type){const w=$('#toastWrap');const t=document.createElement('div');t.className='toast'+(type?' '+type:'');t.textContent=msg;w.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250);},2200);}
function _escHandler(e){if(e.key==='Escape')closeModal();}
function modal(html,w){closeModal();const mask=document.createElement('div');mask.className='modal-mask';mask.id='modalMask';mask.innerHTML='<div class="modal" role="dialog" aria-modal="true" style="'+(w?'width:min('+w+',100%)':'')+'">'+html+'</div>';document.body.appendChild(mask);mask.addEventListener('click',e=>{if(e.target===mask)closeModal();});document.addEventListener('keydown',_escHandler);const firstInput=mask.querySelector('input,textarea,select,button');if(firstInput)firstInput.focus();return mask;}
function closeModal(){const m=$('#modalMask');if(m)m.remove();document.removeEventListener('keydown',_escHandler);}
function download(filename,text){const b=new Blob([text],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;a.click();URL.revokeObjectURL(a.href);}

/* ---------------- P0-3: 服务端时间 ---------------- */
let _serverTimeOffset = 0; // 服务端时间 - 客户端时间（毫秒）
let _serverTimeFetched = false;
async function fetchServerTime(){
  try{
    const t = await Api.getTime();
    const serverNow = new Date(t.now).getTime();
    const clientNow = Date.now();
    _serverTimeOffset = serverNow - clientNow;
    _serverTimeFetched = true;
  }catch(e){
    // 无法连接服务端时降级用本地时间
    _serverTimeOffset = 0;
    _serverTimeFetched = false;
  }
}
function getToday(){
  // 返回服务端日期字符串（YYYY-MM-DD），降级用本地时间
  return new Date(Date.now() + _serverTimeOffset).toISOString().slice(0,10);
}
function daysFromNow(dateStr){
  // 从服务端今天到目标日期的天数
  const target = new Date(dateStr).getTime();
  const today = new Date(getToday() + 'T00:00:00').getTime();
  return Math.round((target - today) / 86400000);
}

/* ---------------- 导航 ---------------- */
const NAV=[
  {label:'工作台',items:[{id:'dashboard',name:'工作台',icon:'dashboard'}]},
  {label:'办案',items:[{id:'cases',name:'案件管理',icon:'case'},{id:'litigation',name:'诉讼中心',icon:'gavel'}]},
  {label:'智能',items:[{id:'assistant',name:'智能辅助',icon:'robot'},{id:'skills',name:'AI 技能库',icon:'library'}]},
  {label:'工具',items:[
    {id:'draft',name:'文书起草',icon:'doc'},
    {id:'case-search',name:'案例检索',icon:'search'},
    {id:'law-search',name:'法条检索',icon:'book'},
    {id:'risk',name:'风险研判',icon:'shield'},
    {id:'voice',name:'语音转写',icon:'mic'}
  ]},
  {label:'实务',items:[
    {id:'finance',name:'财务跟踪',icon:'scale'},
    {id:'collab',name:'客户协作',icon:'user'}
  ]},
  {label:'设置',items:[{id:'settings',name:'个人中心',icon:'settings'}]}
];
const PAGES={
  dashboard:{title:'工作台',crumb:'案件概览与待办'},
  cases:{title:'案件管理',crumb:'在办案件与卷宗'},
  litigation:{title:'诉讼中心',crumb:'日程排期与期限监控'},
  assistant:{title:'智能辅助',crumb:'小律 · 结构化法律分析引擎'},
  skills:{title:'AI 技能库',crumb:'Legal-Skills-Chinese · 40 项法律推理技能'},
  draft:{title:'文书起草',crumb:'常见法律文书模板与生成'},
  'case-search':{title:'案例检索',crumb:'类案检索式构造与报告'},
  'law-search':{title:'法条检索',crumb:'法条定位与效力核验'},
  risk:{title:'风险研判',crumb:'争议焦点与风险矩阵'},
  voice:{title:'语音转写',crumb:'会议/约谈录音转写与纪要'},
  finance:{title:'财务跟踪',crumb:'律师费、费用与付款记录'},
  collab:{title:'客户协作',crumb:'案件关联消息与沟通记录'},
  settings:{title:'个人中心',crumb:'账户、AI 引擎与数据'},
  'case-detail':{title:'案件详情',crumb:'案件详细信息与分析'}
};
const STAGES=['一审','二审','再审','执行','仲裁','其他'];

function buildNav(){
  const nav=$('#nav');
  nav.setAttribute('role','navigation');
  nav.innerHTML=NAV.map(g=>'<div class="nav-group"><div class="label">'+g.label+'</div>'+
    g.items.map(it=>'<div class="nav-item" data-route="'+it.id+'" tabindex="0">'+icon(it.icon)+'<span>'+it.name+'</span></div>').join('')+
    '</div>').join('');
  // badges
  const casesItem=[...nav.querySelectorAll('.nav-item')].find(e=>e.dataset.route==='cases');
  if(casesItem){const b=document.createElement('span');b.className='badge';b.textContent=Store.get().cases.length;casesItem.appendChild(b);}
}
function setActiveNav(route){$a('.nav-item').forEach(e=>e.classList.toggle('active',e.dataset.route===route));}

/* ---------------- 路由 ---------------- */
let curRoute='dashboard', curParam=null;
function router(){
  if(typeof stopRec==='function' && recording) stopRec();
  const h=location.hash.replace(/^#\/?/,'');
  const parts=h.split('/');
  let route=(parts[0]||'dashboard').split('?')[0];
  if(route==='case'&&parts[1]){curRoute='case-detail';curParam=parts[1];}
  else{curRoute=route;curParam=null;}
  if(!PAGES[curRoute]){curRoute='dashboard';}
  const p=PAGES[curRoute];
  $('#pageTitle').textContent=p.title;
  $('#pageCrumb').textContent=p.crumb;
  setActiveNav(route==='case'?'cases':route);
  render();
  $('#content').scrollTop=0;
}
function go(route,param){location.hash='#/'+(param?route+'/'+param:route);}

/* ---------------- 渲染分发 ---------------- */
function render(){
  const c=$('#content');
  const map={dashboard:renderDashboard,cases:renderCases,'case-detail':renderCaseDetail,litigation:renderLitigation,assistant:renderAssistant,skills:renderSkills,draft:renderDraft,'case-search':renderCaseSearch,'law-search':renderLawSearch,risk:renderRisk,voice:renderVoice,finance:renderFinance,collab:renderCollab,settings:renderSettings};
  (map[curRoute]||renderDashboard)(c);
  updateAIStatus();
}

/* ============================================================
   工作台 Dashboard
   ============================================================ */
function renderDashboard(c){
  const st=Store.get();
  const today=getToday();
  const upcoming=st.events.filter(e=>daysFromNow(e.date)>=0&&daysFromNow(e.date)<=14).sort((a,b)=>a.date.localeCompare(b.date));
  const recent=st.cases.slice(0,5);
  c.innerHTML=
   '<div class="grid cols-4" style="margin-bottom:16px">'+
     stat('case','在办案件',st.cases.length,'含 '+st.cases.filter(x=>x.stage==='一审').length+' 件一审')+
     stat('clock','临近期限',upcoming.length,'未来 14 天内')+
     stat('doc','文书草稿',st.documents.length,'已起草文书')+
     stat('search','检索记录',st.searches.length,'案例/法条检索')+
   '</div>'+
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 2">'+
       '<div class="card-h"><h3>快速开始</h3><span class="sub">从高频场景进入</span></div>'+
       '<div class="card-b"><div class="grid cols-4">'+
         quick('case','新建案件','cases')+
         quick('doc','起草文书','draft')+
         quick('search','案例检索','case-search')+
         quick('shield','风险研判','risk')+
       '</div>'+
       '<div class="divider"></div>'+
       '<div class="section-title">'+icon('clock')+' 即将到期 / 开庭</div>'+
       (upcoming.length? '<div class="list">'+upcoming.map(e=>{
          const cs=st.cases.find(x=>x.id===e.caseId);
          const dd=daysFromNow(e.date);
          const cls=e.type==='deadline'?'danger':(e.type==='hearing'?'warn':'');
          const urgent = (e.type==='deadline'||e.type==='hearing') && dd<=3 ? ' ⚠️' : '';
          const nonWd = window.LegalDeadline && !LegalDeadline.isWorkday(e.date) ? ' <span class="small" style="color:var(--red)">（非工作日）</span>' : '';
          return '<div class="list-item" data-act="open-case" data-id="'+e.caseId+'"><div class="li-ic">'+icon('calendar')+'</div>'+
            '<div class="li-main"><b>'+esc(e.title)+'</b><span>'+(cs?esc(cs.title):'')+'</span></div>'+
            '<div class="li-side"><span class="tag '+(cls||'blue')+'">'+(dd===0?'今天':dd+' 天后')+urgent+'</span><br>'+fmtDate(e.date)+nonWd+'</div></div>';
        }).join('') : '<div class="empty">'+icon('check')+'<p>未来 14 天暂无期限安排</p></div>')+
       '</div>'+
     '</div>'+
     '<div class="card">'+
       '<div class="card-h"><h3>最近案件</h3></div>'+
       '<div class="card-b" style="padding:6px 8px">'+
         (recent.length?recent.map(cs=>'<div class="list-item" data-act="open-case" data-id="'+cs.id+'"><div class="li-ic">'+icon('case')+'</div>'+
           '<div class="li-main"><b>'+esc(cs.title)+'</b><span>'+esc(cs.type)+' · '+esc(cs.stage)+' · '+esc(cs.court||'法院未填')+'</span></div>'+
           '<div class="li-side">'+icon('chevronRight')+'</div></div>').join(''):'<div class="empty">'+icon('case')+'<p>还没有案件，点击「新建案件」开始</p></div>')+
       '</div>'+
     '</div>'+
   '</div>'+
   '<div class="card" style="margin-top:16px"><div class="card-h"><h3>AI 推理技能 · 常用入口</h3><span class="sub">来自 Legal-Skills-Chinese</span></div>'+
     '<div class="card-b"><div class="pill-row">'+
       ['case-retrieval','legal-article-retrieval','legal-element-extraction','dispute-issue-identification','legal-risk-assessment','argument-chain-construction','legal-document-summarization','legal-judgment-prediction']
       .map(d=>{const s=skillByDir(d);return s?'<span class="tag blue" style="cursor:pointer" data-act="skill-open" data-dir="'+d+'">'+esc(s.cn)+'</span>':''}).join('')+
     '</div>'+
     '<div class="disclaimer" style="margin-top:14px"><div>'+icon('alert')+'</div><div>本工作台为法律智能辅助工具，所有 AI 生成内容仅供参考，不构成正式法律意见、法院裁判或案件结果承诺。对外提交前请执业律师独立核对事实、证据、法条、金额与期限。</div></div>'+
   '</div></div>';
}
function stat(ic,label,num,meta){return '<div class="stat"><div class="top"><div class="ic">'+icon(ic)+'</div>'+label+'</div><div class="num">'+num+'</div><div class="meta">'+meta+'</div></div>';}
function quick(ic,label,route){return '<div class="list-item" data-act="nav" data-route="'+route+'" style="border:1px solid var(--border);border-radius:10px;margin-bottom:8px"><div class="li-ic">'+icon(ic)+'</div><div class="li-main"><b>'+label+'</b></div><div class="li-side">'+icon('arrowRight')+'</div></div>';}

/* ============================================================
   案件管理
   ============================================================ */
let caseFilter={type:'',stage:'',q:''};
function renderCases(c){
  const st=Store.get();
  let list=st.cases.slice();
  if(caseFilter.type)list=list.filter(x=>x.type===caseFilter.type);
  if(caseFilter.stage)list=list.filter(x=>x.stage===caseFilter.stage);
  if(caseFilter.q){const q=caseFilter.q.toLowerCase();list=list.filter(x=>(x.title+x.court+(x.background||'')).toLowerCase().includes(q));}
  c.innerHTML=
   '<div class="topline"><button class="btn primary" data-act="new-case">'+icon('plus')+' 新建案件</button>'+
     '<select class="select" style="width:140px" id="fType"><option value="">全部类型</option>'+['民事','刑事','行政','执行','仲裁'].map(t=>'<option '+(caseFilter.type===t?'selected':'')+'>'+t+'</option>').join('')+'</select>'+
     '<select class="select" style="width:140px" id="fStage"><option value="">全部阶段</option>'+STAGES.map(t=>'<option '+(caseFilter.stage===t?'selected':'')+'>'+t+'</option>').join('')+'</select>'+
     '<input class="input" style="width:240px" id="fQ" placeholder="搜索标题/法院/背景" value="'+esc(caseFilter.q)+'">'+
     '<div class="spacer" style="flex:1"></div><span class="muted small">共 '+list.length+' 件</span>'+
   '</div>'+
   '<div class="grid cols-3">'+
     (list.length?list.map(cs=>caseCard(cs)).join(''):'<div class="card"><div class="empty">'+icon('case')+'<p>没有匹配的案件</p></div></div>')+
   '</div>';
  $('#fType').onchange=e=>{caseFilter.type=e.target.value;renderCases(c);};
  $('#fStage').onchange=e=>{caseFilter.stage=e.target.value;renderCases(c);};
  $('#fQ').oninput=e=>{caseFilter.q=e.target.value;clearTimeout(window._tq);window._tq=setTimeout(()=>renderCases(c),200);};
}
function caseCard(cs){
  const client=cs.parties.find(p=>p.isClient);
  const opp=cs.parties.filter(p=>!p.isClient).map(p=>p.name).join('、');
  const stageIdx=STAGES.indexOf(cs.stage);
  const prog=stageIdx<0?0:(stageIdx+1)/STAGES.length*100;
  const isShared = cs._shared_role;
  const sharedTag = isShared
    ? '<span class="tag ' + (cs._shared_role === 'editor' ? 'green' : 'amber') + '">共享·' + (cs._shared_role === 'editor' ? '可编辑' : '只读') + '</span>'
    : '';
  return '<div class="card" style="cursor:pointer" data-act="open-case" data-id="'+cs.id+'">'+
    '<div class="card-b">'+
      '<div class="flex between center"><b style="font-size:15px">'+esc(cs.title)+'</b>'+
        '<span class="tag '+(cs.type==='刑事'?'red':(cs.type==='行政'?'amber':'blue'))+'">'+esc(cs.type)+'</span></div>'+
      '<div class="pill-row" style="margin:8px 0"><span class="tag">'+esc(cs.stage)+'</span>'+(cs.amount?'<span class="tag green">标的 '+fmtMoney(cs.amount)+'</span>':'')+'</div>'+
      '<div class="small muted" style="margin:6px 0">法院：'+esc(cs.court||'未填')+'</div>'+
      '<div class="small">我方：'+esc(client?client.name:'-')+'　对方：'+esc(opp||'-')+'</div>'+
      '<div class="progress" style="margin-top:10px"><i style="width:'+prog+'%"></i></div>'+
      '<div class="flex between center" style="margin-top:10px"><span class="small muted">立案 '+fmtDate(cs.filingDate)+'</span>'+
        '<span style="display:flex;gap:6px">' + sharedTag + (isShared&&cs._shared_role==='viewer'?'':'<span class="tag outline" data-act="edit-case" data-id="'+cs.id+'">编辑</span>') + '<span class="tag outline" data-act="del-case" data-id="'+cs.id+'">删除</span></span></div>'+
    '</div></div>';
}
function fmtMoney(n){if(!n)return '0';if(n>=10000)return (n/10000).toFixed(n%10000?1:0)+' 万';return n.toLocaleString();}

function openCaseModal(id){
  const cs=id?Store.getCase(id):null;
  modal(
    '<div class="m-h"><h3>'+(id?'编辑案件':'新建诉讼案件')+'</h3><button class="btn ghost sm" data-act="close-modal">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="disclaimer" style="margin-bottom:14px"><div>'+icon('alert')+'</div><div>请填写清晰、完整的案件事实。涉及敏感个人信息、商业秘密等建议先脱敏。</div></div>'+
      '<div class="field"><label>案件标题<span class="req">*</span></label><input class="input" id="cTitle" value="'+esc(cs?cs.title:'')+'" placeholder="如：张某诉李某民间借贷纠纷"></div>'+
      '<div class="row"><div class="field"><label>案件类型<span class="req">*</span></label><select class="select" id="cType">'+['民事','刑事','行政','执行','仲裁'].map(t=>'<option '+(cs&&cs.type===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div>'+
        '<div class="field"><label>当前阶段<span class="req">*</span></label><select class="select" id="cStage">'+STAGES.map(t=>'<option '+(cs&&cs.stage===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div></div>'+
      '<div class="field"><label>受理法院</label><input class="input" id="cCourt" value="'+esc(cs?cs.court:'')+'" placeholder="如：上海市浦东新区人民法院"></div>'+
      '<div class="row"><div class="field"><label>标的金额（元）</label><input class="input" id="cAmount" type="number" value="'+esc(cs?cs.amount:'')+'" placeholder="0"></div>'+
        '<div class="field"><label>立案/接收日期</label><input class="input" id="cDate" type="date" value="'+esc(cs?cs.filingDate:'')+'"></div></div>'+
      '<div class="field"><label>诉讼参与人</label><div id="partyBox">'+(cs?cs.parties:[]).map((p,i)=>partyRow(p,i)).join('')+'</div><button class="btn sm" data-act="add-party">'+icon('plus')+' 添加参与人</button></div>'+
      '<div class="field"><label>案件背景描述<span class="req">*</span></label><textarea class="textarea" id="cBg" placeholder="提供足够事实，让后续证据分析与诉讼策略更可靠。">'+esc(cs?cs.background:'')+'</textarea></div>'+
    '</div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="save-case" data-id="'+esc(id||'')+'">'+icon('save')+' 保存</button></div>'
  );
  bindParty();
}
function partyRow(p,i){p=p||{role:'原告',name:'',isClient:false};
  return '<div class="row party" data-i="'+i+'" style="margin-bottom:8px">'+
    '<input class="input" style="flex:.8" value="'+esc(p.role)+'" placeholder="角色" data-k="role">'+
    '<input class="input" style="flex:1.4" value="'+esc(p.name)+'" placeholder="姓名/名称" data-k="name">'+
    '<label class="small" style="flex:1;display:flex;gap:5px;align-items:center"><input type="checkbox" data-k="isClient" '+(p.isClient?'checked':'')+'> 我方委托人</label>'+
    '<button class="btn sm danger" data-act="del-party" data-i="'+i+'">'+icon('trash')+'</button></div>';
}
function bindParty(){
  $('#partyBox').onclick=e=>{
    if(e.target.closest('[data-act="del-party"]')){e.target.closest('.party').remove();}
  };
}
function openCase(id){
  // P0-4: 记录"查看案件"审计日志
  if(Store.addAuditLog){
    const cs = Store.getCase(id);
    Store.addAuditLog('view', 'case', id, cs?cs.title:'');
  }
  go('case',id);
}

/* ============================================================
   案件详情
   ============================================================ */
let caseTab='overview', lastCaseId=null;
function renderCaseDetail(c){
  const cs=Store.getCase(curParam);
  if(!cs){c.innerHTML='<div class="empty">'+icon('case')+'<p>案件不存在</p></div>';return;}
  if(lastCaseId!==curParam){caseTab='overview';lastCaseId=curParam;}
  const client=cs.parties.filter(p=>p.isClient).map(p=>p.name).join('、')||'-';
  const others=cs.parties.filter(p=>!p.isClient).map(p=>p.role+' '+p.name).join('；')||'-';
  const tabs=[['overview','概览'],['timeline','时间轴'],['evidence','证据材料'],['analysis','九步法分析'],['docs','文书']];
  const isShared = cs._shared_role;
  const shareBtn = isShared
    ? '<span class="tag ' + (cs._shared_role === 'editor' ? 'green' : 'amber') + '">共享·' + (cs._shared_role === 'editor' ? '可编辑' : '只读') + '</span>'
    : '<button class="btn" data-act="share-case" data-id="'+cs.id+'">'+icon('share')+' 共享</button>';
  c.innerHTML=
    '<div class="topline"><div><b style="font-size:18px">'+esc(cs.title)+'</b> '+
      '<span class="tag '+(cs.type==='刑事'?'red':(cs.type==='行政'?'amber':'blue'))+'">'+esc(cs.type)+'</span> <span class="tag">'+esc(cs.stage)+'</span></div>'+
      '<div class="spacer" style="flex:1"></div>'+
      shareBtn+
      '<button class="btn" data-act="nav" data-route="draft" data-case="'+cs.id+'">'+icon('doc')+' 起草文书</button>'+
      '<button class="btn" data-act="edit-case" data-id="'+cs.id+'">'+icon('edit')+' 编辑</button>'+
      '<button class="btn danger" data-act="del-case" data-id="'+cs.id+'">'+icon('trash')+' 删除</button></div>'+
    '<div class="tabs">'+tabs.map(t=>'<div class="tab '+(caseTab===t[0]?'active':'')+'" data-act="case-tab" data-t="'+t[0]+'">'+t[1]+'</div>').join('')+'</div>'+
    '<div style="padding-top:16px" id="caseTabBody"></div>';
  renderCaseTab(cs);
}
function renderCaseTab(cs){
  const b=$('#caseTabBody');
  if(caseTab==='overview'){
    b.innerHTML='<div class="grid cols-3">'+
      infoCard('基本信息',[
        ['案件类型',cs.type],['当前阶段',cs.stage],['受理法院',cs.court||'未填'],
        ['标的金额',cs.amount?fmtMoney(cs.amount)+' 元':'未填'],['立案日期',fmtDate(cs.filingDate)]
      ])+
      infoCard('参与人',[
        ['我方委托人',cs.parties.filter(p=>p.isClient).map(p=>p.role+' '+p.name).join('、')||'-'],
        ['对方当事人',cs.parties.filter(p=>!p.isClient).map(p=>p.role+' '+p.name).join('、')||'-']
      ])+
      infoCard('背景',[['案件描述',cs.background||'未填写']])+
    '</div>'+
    '<div class="card" style="margin-top:16px"><div class="card-h"><h3>'+icon('sparkle')+' 一句话研判</h3></div><div class="card-b" id="oneLiner"></div></div>';
    $('#oneLiner').innerHTML='<span class="muted">点击下方「九步法分析」标签，按要件审判九步法逐步分析案件。</span>';
  }
  else if(caseTab==='timeline'){
    let tl=cs.timeline.slice().sort((a,b)=>a.date.localeCompare(b.date));
    b.innerHTML='<div class="card"><div class="card-h"><h3>案件时间轴</h3></div><div class="card-b"><div class="tl">'+
      (tl.length?tl.map(e=>'<div class="ev"><div class="d">'+fmtDate(e.date)+'</div><div class="t">'+esc(e.title)+'</div><div class="muted small">'+esc(e.desc||'')+'</div></div>').join(''):
        '<div class="empty">'+icon('clock')+'<p>暂无时间轴节点</p></div>')+
      '</div></div></div>'+
      '<div class="card" style="margin-top:16px"><div class="card-h"><h3>添加节点</h3></div><div class="card-b"><div class="row">'+
        '<input class="input" id="tlDate" type="date"><input class="input" id="tlTitle" placeholder="事件标题">'+
        '</div><textarea class="textarea" id="tlDesc" placeholder="说明（选填）" style="margin-top:10px"></textarea>'+
        '<button class="btn primary" style="margin-top:10px" data-act="add-tl" data-id="'+cs.id+'">'+icon('plus')+' 添加</button></div></div>';
  }
  else if(caseTab==='evidence'){
    const evCats=['全部','书证','物证','电子数据','证人证言','鉴定意见','勘验笔录','其他'];
    const activeCat = window._evCat || '全部';
    let evList = cs.evidence;
    if(activeCat!=='全部') evList = evList.filter(e=>(e.type||'其他')===activeCat);
    b.innerHTML='<div class="card"><div class="card-h"><h3>证据材料（'+cs.evidence.length+'）</h3></div><div class="card-b">'+
      '<div class="pill-row" style="margin-bottom:12px">'+evCats.map(c=>'<span class="tag '+(activeCat===c?'blue':'outline')+'" data-act="ev-cat" data-c="'+c+'">'+c+'</span>').join('')+'</div>'+
      (evList.length?'<div class="list">'+evList.map((e,i)=>{
        const realIdx = cs.evidence.indexOf(e);
        return '<div class="list-item"><div class="li-ic">'+icon('file')+'</div><div class="li-main"><b>'+esc(e.name)+'</b><span>'+esc(e.type||'其他')+' · '+esc(e.note||'')+'</span></div><div class="li-side">'+
          '<span class="tag outline" data-act="edit-ev" data-id="'+cs.id+'" data-i="'+realIdx+'">编辑</span> '+
          '<span class="tag danger" data-act="del-ev" data-id="'+cs.id+'" data-i="'+realIdx+'">删除</span></div></div>';
      }).join('')+'</div>':'<div class="empty">'+icon('file')+'<p>暂无证据材料</p></div>')+
      '<div class="divider"></div><div class="row"><input class="input" id="evName" placeholder="证据名称"><select class="select" id="evTypeSel">'+evCats.filter(c=>c!=='全部').map(c=>'<option>'+c+'</option>').join('')+'</select></div>'+
      '<input class="input" id="evNote" placeholder="证明目的/备注" style="margin-top:10px">'+
      '<button class="btn primary" style="margin-top:10px" data-act="add-ev" data-id="'+cs.id+'">'+icon('plus')+' 添加证据</button></div></div>';
  }
  else if(caseTab==='analysis'){
    renderNineStep(cs, b);
  }
  else if(caseTab==='docs'){
    const docs=Store.get().documents.filter(d=>d.caseId===cs.id);
    b.innerHTML='<div class="card"><div class="card-h"><h3>本案文书（'+docs.length+'）</h3><button class="btn sm primary" data-act="nav" data-route="draft" data-case="'+cs.id+'">'+icon('plus')+' 新建</button></div><div class="card-b">'+
      (docs.length?'<div class="list">'+docs.map(d=>'<div class="list-item" data-act="open-doc" data-id="'+d.id+'"><div class="li-ic">'+icon('doc')+'</div><div class="li-main"><b>'+esc(d.title)+'</b><span>'+esc(d.type)+' · '+fmtDate(d.createdAt)+'</span></div><div class="li-side">'+icon('chevronRight')+'</div></div>').join(''):'<div class="empty">'+icon('doc')+'<p>本案暂无文书</p></div>')+
      '</div></div>';
  }
  if(caseTab==='analysis'){
    bindNineStepEvents(cs);
  }
}
function infoCard(title,rows){
  return '<div class="card"><div class="card-h"><h3>'+title+'</h3></div><div class="card-b">'+
    rows.map(r=>'<div class="kv"><div class="k">'+esc(r[0])+'</div><div class="v">'+esc(r[1])+'</div></div>').join('')+'</div></div>';
}
function analysisBlock(skill,title,val,ph){
  const sk=skillByDir(skill);
  const isAI = val && val.startsWith('🤖 AI 生成 · 待核对');
  const verified = val && val.startsWith('✅ 已核对 · 原AI生成');
  const badge = isAI ? '<span class="tag red ai-badge" data-skill="'+skill+'">🤖 待核对</span>' :
               verified ? '<span class="tag green">✅ 已核对</span>' :
               '<span class="tag blue">'+esc(sk?sk.cn:skill)+'</span>';
  const btn = isAI ? '<button class="btn sm primary ai-verify-btn" data-skill="'+skill+'" style="margin-top:8px">✅ 我核对了</button>' : '';
  const displayVal = (isAI || verified) ? (verified ? val.replace('✅ 已核对 · 原AI生成\n\n','') : val.replace('🤖 AI 生成 · 待核对\n\n','')) : (val||'');
  return '<div class="card"><div class="card-h"><h3>'+icon('brain')+' '+title+'</h3>'+badge+'</div>'+
    '<div class="card-b"><textarea class="textarea" data-analysis="'+skill+'" style="min-height:120px" placeholder="'+esc(ph)+'">'+esc(displayVal)+'</textarea>'+btn+'</div></div>';
}

/* ============================================================
   要件审判九步法 — 引导式分析
   ============================================================ */
function getNineStep(cs){
  if(!cs.analysis) cs.analysis={elements:'',disputes:'',risks:'',predict:'',nineStep:null};
  if(!cs.analysis.nineStep) cs.analysis.nineStep=window.NineStepData?NineStepData.defaultNineStep():{currentStep:1,completedSteps:[]};
  return cs.analysis.nineStep;
}

function renderNineStep(cs, container){
  const SD=window.NineStepData; if(!SD){container.innerHTML='<div class="empty"><p>九步法模块未加载</p></div>';return;}
  const ns=getNineStep(cs);
  const steps=SD.STEPS;
  // Stepper
  let stepperHtml='<div class="stepper">';
  steps.forEach((s,i)=>{
    const cls=ns.completedSteps.includes(s.num)?'done':(ns.currentStep===s.num?'active':'');
    if(i>0) stepperHtml+='<div class="step-connector'+(ns.completedSteps.includes(steps[i-1].num)?' done':'')+'"></div>';
    stepperHtml+='<div class="step-node '+cls+'" data-act="ns-goto" data-step="'+s.num+'"><div class="step-circle">'+(ns.completedSteps.includes(s.num)?'✓':s.num)+'</div><div class="step-label">'+esc(s.short)+'</div></div>';
  });
  stepperHtml+='</div>';
  // Step content
  const stepHtml=renderStep(ns.currentStep, cs, ns, SD);
  container.innerHTML=stepperHtml+'<div class="card"><div class="card-b">'+stepHtml+'</div></div>';
}

function renderStep(num, cs, ns, SD){
  const step=SD.STEPS[num-1];
  let html='<div class="ns-step-title"><span class="tag blue">步骤 '+num+'/9</span> '+esc(step.name)+'</div>';
  html+='<div class="ns-step-desc">'+esc(step.desc)+'</div>';

  if(num===1){
    // Step 1: Import - show case materials
    const parties=(cs.parties||[]).map(p=>p.role+' '+p.name+(p.isClient?' (我方)':'')).join('；')||'未填写';
    const evList=(cs.evidence||[]).map(e=>e.name+' ('+e.type+')').join('；')||'暂无证据';
    html+='<div class="grid cols-3" style="margin-bottom:14px">'+
      '<div class="card"><div class="card-h"><h3>当事人</h3></div><div class="card-b" style="font-size:13px">'+esc(parties)+'</div></div>'+
      '<div class="card"><div class="card-h"><h3>案件背景</h3></div><div class="card-b" style="font-size:13px">'+esc((cs.background||'未填写').slice(0,200))+'</div></div>'+
      '<div class="card"><div class="card-h"><h3>证据材料 ('+(cs.evidence||[]).length+')</h3></div><div class="card-b" style="font-size:13px">'+esc(evList.slice(0,200))+'</div></div>'+
    '</div>';
    html+='<div class="ns-actions"><button class="btn primary" data-act="ns-next" data-id="'+cs.id+'">确认材料完整，下一步 →</button></div>';
    return html;
  }

  if(num===9){
    // Step 9: Law application + draft generation
    const data=ns.lawApplication||[];
    html+=renderStepTable(num, step, data, cs);
    html+='<div class="ns-actions">';
    html+='<button class="btn" data-act="ns-add-row" data-id="'+cs.id+'" data-step="9">'+icon('plus')+' 添加</button>';
    html+='<button class="btn" data-act="ns-ai" data-id="'+cs.id+'" data-step="9">'+icon('robot')+' AI 辅助</button>';
    html+='<button class="btn primary" data-act="ns-gen-draft" data-id="'+cs.id+'" style="margin-left:auto">'+icon('doc')+' 生成文书初稿</button>';
    html+='</div>';
    if(ns.draftContent){
      html+='<div style="margin-top:14px;padding:14px;background:var(--bg-2);border-radius:8px;border:1px solid var(--border)"><div style="font-weight:600;margin-bottom:8px">文书初稿</div><pre style="white-space:pre-wrap;font-size:13px;line-height:1.8;max-height:300px;overflow-y:auto">'+esc(ns.draftContent)+'</pre></div>';
    }
    html+=renderStepNav(cs, ns);
    return html;
  }

  // Steps 2-8: structured table
  const key=step.key;
  const data=ns[key]||[];
  // Special: step 3 has library quick-select
  if(num===3){
    html+='<button class="ns-lib-btn" data-act="ns-show-lib" data-id="'+cs.id+'">从请求权基础库选择</button>';
    html+='<div style="margin-top:10px">'+renderStepTable(num, step, data, cs)+'</div>';
  } else if(num===4){
    html+='<button class="ns-lib-btn" data-act="ns-show-defense-lib" data-id="'+cs.id+'">从抗辩规范库选择</button>';
    html+='<div style="margin-top:10px">'+renderStepTable(num, step, data, cs)+'</div>';
  } else {
    html+=renderStepTable(num, step, data, cs);
  }
  html+='<div class="ns-actions">';
  html+='<button class="btn" data-act="ns-add-row" data-id="'+cs.id+'" data-step="'+num+'">'+icon('plus')+' 添加</button>';
  html+='<button class="btn" data-act="ns-ai" data-id="'+cs.id+'" data-step="'+num+'">'+icon('robot')+' AI 辅助</button>';
  html+='</div>';
  html+=renderStepNav(cs, ns);
  return html;
}

function renderStepTable(num, step, data, cs){
  if(!step.fields) return '';
  const fields=step.fields;
  let html='<div style="overflow-x:auto"><table class="ns-table"><thead><tr>';
  fields.forEach(f=>{html+='<th>'+esc(f.label)+'</th>';});
  html+='<th style="width:40px"></th></tr></thead><tbody>';
  if(data.length===0){
    html+='<tr><td colspan="'+(fields.length+1)+'" style="text-align:center;color:var(--ink-3);padding:20px">暂无数据，点击「添加」或「AI 辅助」</td></tr>';
  }
  data.forEach((row,ri)=>{
    html+='<tr>';
    fields.forEach(f=>{
      const val=row[f.key]||'';
      if(f.type==='select'){
        html+='<td><select data-ns-field="'+f.key+'" data-ns-row="'+ri+'">'+f.options.map(o=>'<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select></td>';
      } else if(f.type==='textarea'){
        html+='<td><textarea data-ns-field="'+f.key+'" data-ns-row="'+ri+'" rows="2">'+esc(f.key==='elements'&&Array.isArray(val)?val.join('\n'):val)+'</textarea></td>';
      } else if(f.type==='number'){
        html+='<td><input type="number" data-ns-field="'+f.key+'" data-ns-row="'+ri+'" value="'+esc(val)+'"></td>';
      } else {
        html+='<td><input data-ns-field="'+f.key+'" data-ns-row="'+ri+'" value="'+esc(val)+'"></td>';
      }
    });
    html+='<td><button class="btn sm danger" data-act="ns-del-row" data-step="'+num+'" data-row="'+ri+'" style="padding:2px 6px">'+icon('trash')+'</button></td>';
    html+='</tr>';
  });
  html+='</tbody></table></div>';
  return html;
}

function renderStepNav(cs, ns){
  let html='<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">';
  if(ns.currentStep>1) html+='<button class="btn" data-act="ns-prev" data-id="'+cs.id+'">← 上一步</button>';
  else html+='<div></div>';
  if(ns.currentStep<9) html+='<button class="btn primary" data-act="ns-next" data-id="'+cs.id+'">下一步 →</button>';
  else html+='<button class="btn primary" data-act="ns-complete" data-id="'+cs.id+'">完成分析</button>';
  html+='</div>';
  return html;
}

function bindNineStepEvents(cs){
  const body=$('#caseTabBody');if(!body)return;
  // Field change handlers
  body.querySelectorAll('[data-ns-field]').forEach(el=>{
    el.onchange=el.oninput=()=>{
      const ns=getNineStep(cs);
      const step=NineStepData.STEPS[ns.currentStep-1];
      const key=step.key;
      const ri=parseInt(el.dataset.nsRow);
      const field=el.dataset.nsField;
      if(!ns[key]) ns[key]=[];
      if(!ns[key][ri]) return;
      let val=el.value;
      if(field==='elements'&&typeof val==='string') val=val.split('\n').filter(Boolean);
      ns[key][ri][field]=val;
      Store.updateCase(cs.id,{analysis:cs.analysis});
    };
  });
}

function nsGotoStep(cs, step){
  const ns=getNineStep(cs);
  ns.currentStep=step;
  Store.updateCase(cs.id,{analysis:cs.analysis});
  renderCaseTab(cs);
}

function nsNextStep(cs){
  const ns=getNineStep(cs);
  if(!ns.completedSteps.includes(ns.currentStep)) ns.completedSteps.push(ns.currentStep);
  if(ns.currentStep<9) ns.currentStep++;
  Store.updateCase(cs.id,{analysis:cs.analysis});
  renderCaseTab(cs);
}

function nsPrevStep(cs){
  const ns=getNineStep(cs);
  if(ns.currentStep>1) ns.currentStep--;
  Store.updateCase(cs.id,{analysis:cs.analysis});
  renderCaseTab(cs);
}

function nsAddRow(cs, stepNum){
  const ns=getNineStep(cs);
  const step=NineStepData.STEPS[stepNum-1];
  if(!step.fields) return;
  const key=step.key;
  if(!ns[key]) ns[key]=[];
  const row={id:Date.now().toString(36)};
  step.fields.forEach(f=>{row[f.key]=f.type==='select'?f.options[0]:'';});
  ns[key].push(row);
  Store.updateCase(cs.id,{analysis:cs.analysis});
  renderCaseTab(cs);
}

function nsDelRow(cs, stepNum, rowIdx){
  const ns=getNineStep(cs);
  const step=NineStepData.STEPS[stepNum-1];
  const key=step.key;
  if(ns[key]) ns[key].splice(rowIdx,1);
  Store.updateCase(cs.id,{analysis:cs.analysis});
  renderCaseTab(cs);
}

async function nsAI(cs, stepNum){
  if(_aiLoading) return;
  const ai=Store.get().settings.ai;
  if(!(ai&&ai.enabled&&ai.baseUrl&&ai.apiKey)){toast('请先在「个人中心」配置 AI 引擎','err');return;}
  const promptFn=NineStepData.AI_PROMPTS[stepNum];
  if(!promptFn){toast('该步骤暂不支持 AI 辅助','err');return;}
  _aiLoading=true;
  toast('AI 正在分析步骤 '+stepNum+'…');
  try{
    const ns=getNineStep(cs);
    const prompt=promptFn(cs, ns);
    const result=await callAI([
      {role:'system',content:'你是资深中国执业律师，精通要件审判九步法。请严格按 JSON 格式输出，不要输出其他内容。'},
      {role:'user',content:prompt}
    ]);
    let parsed;
    try{parsed=JSON.parse(result);}catch(e){
      // Try to extract JSON from the response
      const m=result.match(/\[[\s\S]*\]/);
      if(m) parsed=JSON.parse(m[0]); else throw new Error('AI 返回格式错误');
    }
    if(!Array.isArray(parsed)) parsed=[parsed];
    const step=NineStepData.STEPS[stepNum-1];
    const key=step.key;
    if(key&&key!=='import'){
      ns[key]=parsed.map(row=>{const r={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5)};step.fields.forEach(f=>{r[f.key]=row[f.key]!==undefined?row[f.key]:'';});return r;});
      if(!ns.completedSteps.includes(stepNum)) ns.completedSteps.push(stepNum);
      Store.updateCase(cs.id,{analysis:cs.analysis});
      renderCaseTab(cs);
      toast('AI 已填充步骤 '+stepNum+'，请逐项核对');
    }
  }catch(e){toast('AI 分析失败：'+e.message,'err');}
  finally{_aiLoading=false;}
}

function nsShowLib(cs){
  const lib=NineStepData.CLAIM_BASIS_LIB;
  let html='<div class="m-h"><h3>请求权基础库</h3><button class="btn ghost sm" data-act="close-modal">'+icon('x')+'</button></div><div class="m-b">';
  html+='<div style="font-size:13px;color:var(--ink-3);margin-bottom:12px">选择常用的请求权基础，快速填充到分析中：</div>';
  lib.forEach((item,i)=>{
    html+='<div style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer" data-act="ns-pick-lib" data-idx="'+i+'">';
    html+='<div style="font-weight:600;font-size:13px">'+esc(item.causeOfAction)+' — '+esc(item.law)+' '+esc(item.article)+'</div>';
    html+='<div style="font-size:12px;color:var(--ink-3);margin-top:4px">'+esc(item.content.slice(0,80))+'…</div>';
    html+='<div style="font-size:11px;color:var(--brand);margin-top:4px">要件：'+esc(item.elements.join('、'))+'</div>';
    html+='</div>';
  });
  html+='</div><div class="m-f"><button class="btn" data-act="close-modal">关闭</button></div>';
  modal(html);
}

function nsPickLib(cs, idx){
  const item=NineStepData.CLAIM_BASIS_LIB[idx];if(!item)return;
  const ns=getNineStep(cs);
  if(!ns.claimBasis) ns.claimBasis=[];
  ns.claimBasis.push({id:Date.now().toString(36),causeOfAction:item.causeOfAction,law:item.law,article:item.article,content:item.content,elements:item.elements.join('\n')});
  Store.updateCase(cs.id,{analysis:cs.analysis});
  closeModal();
  renderCaseTab(cs);
  toast('已添加：'+item.law+' '+item.article);
}

function nsShowDefenseLib(cs){
  const lib=NineStepData.DEFENSE_BASIS_LIB;
  let html='<div class="m-h"><h3>抗辩规范库</h3><button class="btn ghost sm" data-act="close-modal">'+icon('x')+'</button></div><div class="m-b">';
  html+='<div style="font-size:13px;color:var(--ink-3);margin-bottom:12px">选择常见的抗辩规范：</div>';
  lib.forEach((item,i)=>{
    html+='<div style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer" data-act="ns-pick-defense" data-idx="'+i+'">';
    html+='<div style="font-weight:600;font-size:13px"><span class="tag amber" style="margin-right:6px">'+esc(item.defenseType)+'</span>'+esc(item.law)+' '+esc(item.article)+'</div>';
    html+='<div style="font-size:12px;color:var(--ink-3);margin-top:4px">'+esc(item.content.slice(0,80))+'…</div>';
    html+='</div>';
  });
  html+='</div><div class="m-f"><button class="btn" data-act="close-modal">关闭</button></div>';
  modal(html);
}

function nsPickDefense(cs, idx){
  const item=NineStepData.DEFENSE_BASIS_LIB[idx];if(!item)return;
  const ns=getNineStep(cs);
  if(!ns.defenseBasis) ns.defenseBasis=[];
  ns.defenseBasis.push({id:Date.now().toString(36),party:'被告',defenseType:item.defenseType,law:item.law,article:item.article,content:item.content});
  Store.updateCase(cs.id,{analysis:cs.analysis});
  closeModal();
  renderCaseTab(cs);
  toast('已添加：'+item.law+' '+item.article);
}

function nsGenDraft(cs){
  const ns=getNineStep(cs);
  const claims=(ns.claims||[]).map(c=>c.description+(c.amount?'（'+fmtMoney(c.amount)+'元）':'')).join('；');
  const basis=(ns.claimBasis||[]).map(b=>b.law+' '+b.article).join('、');
  const elements=(ns.elements||[]).map(e=>e.element+'：'+e.facts+'（'+e.status+'）').join('\n');
  const disputes=(ns.disputes||[]).map(d=>d.issue+'（'+d.type+'）').join('；');
  const findings=(ns.factFindings||[]).map(f=>f.fact+'：'+f.determination).join('；');
  const lawApp=(ns.lawApplication||[]).map(l=>l.element+'：'+l.satisfied+'。'+l.reasoning).join('\n');
  const parties=(cs.parties||[]);
  const plaintiffs=parties.filter(p=>p.role.includes('原告')||p.role.includes('申请人')).map(p=>p.name).join('、');
  const defendants=parties.filter(p=>p.role.includes('被告')||p.role.includes('被申请人')).map(p=>p.name).join('、');

  let draft='民 事 起 诉 状\n\n';
  draft+='原告：'+(plaintiffs||'（原告姓名/名称）')+'\n';
  draft+='被告：'+(defendants||'（被告姓名/名称）')+'\n\n';
  draft+='诉讼请求：\n'+(claims||'（请填写诉讼请求）')+'\n\n';
  draft+='事实与理由：\n'+(cs.background||'（请填写案件事实）')+'\n\n';
  draft+='请求权基础：'+(basis||'（待确定）')+'\n\n';
  draft+='要件分析：\n'+(elements||'（待拆解）')+'\n\n';
  draft+='争议焦点：'+(disputes||'（待归纳）')+'\n\n';
  draft+='事实认定：\n'+(findings||'（待认定）')+'\n\n';
  draft+='法律适用：\n'+(lawApp||'（待判断）')+'\n\n';
  draft+='此致\n'+(cs.court||'（受理法院）')+'\n\n';
  draft+='具状人：\n'+new Date().toISOString().slice(0,10)+'\n';

  ns.draftContent=draft;
  Store.updateCase(cs.id,{analysis:cs.analysis});
  renderCaseTab(cs);
  toast('文书初稿已生成，请核对修改');
}

/* ============================================================
   诉讼中心（日历 + 期限）
   ============================================================ */
let calMonth=null;
function renderLitigation(c){
  const st=Store.get();
  if(!calMonth)calMonth=new Date();
  const y=calMonth.getFullYear(),m=calMonth.getMonth();
  const first=new Date(y,m,1),startDow=(first.getDay()+6)%7;
  const days=new Date(y,m+1,0).getDate();
  const today=getToday();
  let cells='';
  for(let i=0;i<startDow;i++){const dd=new Date(y,m,1-i);cells+='<div class="day other">'+dd.getDate()+'</div>';}
  for(let d=1;d<=days;d++){
    const ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const evs=st.events.filter(e=>e.date===ds);
    const isToday=ds===today;
    cells+='<div class="day'+(isToday?' today':'')+'" data-act="day-evts" data-date="'+ds+'"><div class="dn">'+d+(isToday?' ·今':'')+'</div>'+
      evs.slice(0,3).map(e=>'<div class="evt '+(e.type==='deadline'?'danger':(e.type==='hearing'?'warn':''))+'">'+esc(e.title)+'</div>').join('')+
      (evs.length>3?'<div class="evt">+'+(evs.length-3)+'</div>':'')+'</div>';
  }
  const monthName=y+'年 '+(m+1)+'月';
  // upcoming list
  const upcoming=st.events.filter(e=>daysFromNow(e.date)>=-1).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12);
  c.innerHTML=
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 2"><div class="card-h"><h3>'+icon('calendar')+' 日程安排</h3>'+
       '<div class="spacer" style="flex:1"></div>'+
       '<button class="btn sm" data-act="month-prev" style="transform:scaleX(-1)">'+icon('chevronRight')+'</button>'+
       '<b style="min-width:96px;text-align:center">'+monthName+'</b>'+
       '<button class="btn sm" data-act="month-next">'+icon('chevronRight')+'</button>'+
       '<button class="btn sm primary" data-act="add-event">'+icon('plus')+' 添加</button></div>'+
       '<div class="card-b"><div class="cal">'+
         ['一','二','三','四','五','六','日'].map(d=>'<div class="dow">'+d+'</div>').join('')+cells+
       '</div>'+
       '<div class="disclaimer" style="margin-top:14px"><div>'+icon('alert')+'</div><div>期限监控依据 trial-scheduling-and-deadline-monitoring 技能。举证期限、上诉期限、诉讼时效等法定期间请以法院文书为准，本表仅作提醒。</div></div>'+
     '</div>'+
     '<div class="card"><div class="card-h"><h3>临近节点</h3></div><div class="card-b" style="padding:6px 8px">'+
       (upcoming.length?upcoming.map(e=>{const cs=st.cases.find(x=>x.id===e.caseId);const dd=daysFromNow(e.date);
         const urgent = (e.type==='deadline'||e.type==='hearing') && dd<=3 && dd>=0 ? ' ⚠️' : '';
         return '<div class="list-item" data-act="open-case" data-id="'+e.caseId+'"><div class="li-ic">'+icon(e.type==='hearing'?'gavel':'clock')+'</div><div class="li-main"><b>'+esc(e.title)+'</b><span>'+(cs?esc(cs.title):'')+'</span></div><div class="li-side"><span class="tag '+(e.type==='deadline'?'danger':(e.type==='hearing'?'warn':'blue'))+'">'+(dd<0?'已过期':dd===0?'今天':dd+'天')+urgent+'</span></div></div>';
       }).join(''):'<div class="empty">'+icon('check')+'<p>暂无节点</p></div>')+
     '</div></div>'+
   '</div>';
}

/* ============================================================
   智能辅助（小律） + 结构化工作流
   ============================================================ */
const WORKFLOWS=[
  {id:'facts',name:'案情分析',icon:'brain',desc:'要件提取 → 争议焦点 → 策略',skill:['legal-element-extraction','dispute-issue-identification','deductive-reasoning']},
  {id:'draft',name:'文书起草思路',icon:'doc',desc:'确定文书类型与结构要素',skill:['legal-document-formatting','structured-element-extraction']},
  {id:'case',name:'类案检索式',icon:'search',desc:'构造可执行的检索式',skill:['case-retrieval']},
  {id:'law',name:'法条定位',icon:'book',desc:'定位并核验相关法条',skill:['legal-article-retrieval','legal-norm-validity-check']},
  {id:'risk',name:'风险研判',icon:'shield',desc:'识别与排序风险',skill:['legal-risk-assessment','strategic-risk-prioritization']}
];
let chatLog=[];
function renderAssistant(c){
  c.innerHTML=
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 1"><div class="card-h"><h3>'+icon('sparkle')+' 结构化工作流</h3></div><div class="card-b">'+
       WORKFLOWS.map(w=>'<div class="list-item" data-act="wf-open" data-w="'+w.id+'"><div class="li-ic">'+icon(w.icon)+'</div><div class="li-main"><b>'+w.name+'</b><span>'+w.desc+'</span></div><div class="li-side">'+icon('arrowRight')+'</div></div>').join('')+
       '<div class="divider"></div><div class="small muted">工作流基于 Legal-Skills-Chinese 的复合能力调度主线：<br>事实要素 → 概念理解 → 争议识别 → 法条检索 → 案例检索 → 演绎推理 → 格式适用 → 术语规范</div>'+
     '</div></div>'+
     '<div class="card" style="grid-column:span 2"><div class="chat">'+
       '<div class="chat-log" id="chatLog"></div>'+
       '<div class="chat-in"><textarea id="chatInput" placeholder="描述法律问题，或点上方工作流开始…（Enter 发送）"></textarea>'+
         '<button class="btn primary" data-act="chat-send">'+icon('arrowRight')+'</button></div>'+
     '</div></div>'+
   '</div>';
  renderChat();
  const inp=$('#chatInput');
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();chatSend();}});
}
function renderChat(){
  const log=$('#chatLog');if(!log)return;
  if(!chatLog.length){
    chatLog=[{role:'bot',text:'你好，我是小律 —— 你的法律分析助手。\n\n我可以基于 Legal-Skills-Chinese 技能框架，帮你做要件提取、争议焦点归纳、类案检索式构造、风险评估等结构化分析。\n\n没有配置 AI 密钥时，我会以「分析框架 + 引导式模板」方式辅助你；在「个人中心」配置 OpenAI 兼容接口后，可切换为实时对话。'}];
  }
  log.innerHTML=chatLog.map(m=>'<div class="msg '+(m.role==='me'?'me':'bot')+'"><div class="av">'+(m.role==='me'?'我':'律')+'</div><div class="bubble">'+esc(m.text)+'</div></div>').join('');
  log.scrollTop=log.scrollHeight;
}
let _aiLoading=false;
async function chatSend(){
  if(_aiLoading) return;
  const inp=$('#chatInput');const txt=inp.value.trim();if(!txt)return;
  chatLog.push({role:'me',text:txt});inp.value='';
  if(chatLog.length>200)chatLog=chatLog.slice(-200);
  const ai=Store.get().settings.ai;
  let reply;
  if(ai.enabled&&ai.baseUrl&&ai.apiKey){
    _aiLoading=true;
    const sendBtn=document.querySelector('[data-act="chat-send"]');
    if(sendBtn){sendBtn.disabled=true;sendBtn.innerHTML='⏳';}
    reply='（调用 AI 中…）';chatLog.push({role:'bot',text:reply});renderChat();
    try{
      const r=await callAI([{role:'system',content:'你是资深中国执业律师助理，基于中国大陆成文法提供严谨、结构化的法律分析辅助，不给出绝对结论，提示需执业律师核对。'},{role:'user',content:txt}]);
      chatLog[chatLog.length-1].text=r||'（AI 未返回内容）';
    }catch(e){chatLog[chatLog.length-1].text='AI 调用失败：'+e.message+'。请检查「个人中心」的接口配置与网络/CORS 设置。';}
    finally{_aiLoading=false;if(sendBtn){sendBtn.disabled=false;sendBtn.innerHTML=icon('arrowRight');}}
  }else{
    reply=offlineReply(txt);
    chatLog.push({role:'bot',text:reply});
  }
  renderChat();
}
function offlineReply(txt){
  return '已收到你的问题。在离线模式下，我为你拆解分析路径（基于 Legal-Skills-Chinese）：\n\n1. 事实与要件（legal-element-extraction）：先厘清主体、标的、行为、时间等要件事实。\n2. 争议焦点（dispute-issue-identification）：明确双方分歧的法律争点。\n3. 规范检索（legal-article-retrieval / legal-norm-validity-check）：定位并核验相关法条效力。\n4. 类案参考（case-retrieval）：查找同类裁判要旨（指导性案例应参照）。\n5. 推理与论证（deductive-reasoning / argument-chain-construction）：涵摄并构建论证链。\n6. 风险与预判（legal-risk-assessment / legal-judgment-prediction）：评估风险、预判走向。\n\n建议：使用左侧「结构化工作流」或进入案件「九步法分析」按步骤分析。配置 AI 密钥后可获得实时生成。';
}

/* ============================================================
   AI 技能库
   ============================================================ */
let skillFilter='';
function renderSkills(c){
  const data=window.LEGAL_SKILLS;
  const cats=Object.keys(data.cats);
  let list=data.skills;
  if(skillFilter&&skillFilter!=='all')list=list.filter(s=>s.cat===skillFilter);
  let grid;
  if(skillFilter&&skillFilter!=='all'){
    grid=skillCardsForCat(skillFilter,list);
  }else{
    grid=cats.map(ct=>'<div class="cat-card"><div class="ch"><div class="n">'+ct+'</div><div><b>'+data.cats[ct].name+'</b><span>'+data.cats[ct].en+' · '+list.filter(s=>s.cat===ct).length+' 项</span></div></div><div class="cb">'+
        list.filter(s=>s.cat===ct).map(s=>'<div class="skill-pill" data-act="skill-open" data-dir="'+s.dir+'"><span class="cn">'+esc(s.cn)+'</span>'+(s.compound?'<span class="comp">复合</span>':'')+'</div>').join('')+
      '</div></div>').join('');
  }
  c.innerHTML=
   '<div class="topline"><div class="pill-row">'+
     '<span class="tag '+(!skillFilter||skillFilter==='all'?'blue':'outline')+'" data-act="skill-cat" data-c="all">全部（'+data.skills.length+'）</span>'+
     cats.map(ct=>'<span class="tag '+(skillFilter===ct?'blue':'outline')+'" data-act="skill-cat" data-c="'+ct+'">'+data.cats[ct].name+'</span>').join('')+
   '</div><div class="spacer" style="flex:1"></div>'+
     '<span class="muted small">默认法域：中国大陆成文法 · 案例不具普遍约束力（指导性案例除外）</span></div>'+
   '<div class="cat-grid">'+grid+'</div>'+
   '<div class="disclaimer" style="margin-top:16px"><div>'+icon('alert')+'</div><div>本技能库为辅助工具，不提供法律意见、不构成法律结论、不能替代律师。每项技能输出均应视为供执业人员审阅的草稿。来源：THUYRan/Legal-Skills-Chinese（CC BY-NC-ND 4.0）。</div></div>';
}
function skillCardsForCat(ct,list){
  const data=window.LEGAL_SKILLS;
  return '<div class="cat-card"><div class="ch"><div class="n">'+ct+'</div><div><b>'+data.cats[ct].name+'</b><span>'+data.cats[ct].en+'</span></div></div><div class="cb">'+
    list.map(s=>'<div class="skill-pill" data-act="skill-open" data-dir="'+s.dir+'"><span class="cn">'+esc(s.cn)+'</span>'+(s.compound?'<span class="comp">复合</span>':'')+'</div>').join('')+'</div></div>';
}
function skillByDir(d){const all=window.LEGAL_SKILLS.skills;return all.find(s=>s.dir===d);}
const SKILL_BOUND={
  'case-retrieval':'case-search','legal-article-retrieval':'law-search','legal-norm-validity-check':'law-search',
  'legal-element-extraction':'risk','dispute-issue-identification':'risk','legal-risk-assessment':'risk',
  'legal-document-summarization':'draft','legal-document-formatting':'draft','judgment-document-generation':'draft',
  'legal-judgment-prediction':'risk','argument-chain-construction':'risk'
};
function openSkill(dir){
  const s=skillByDir(dir);if(!s)return;
  const cat=window.LEGAL_SKILLS.cats[s.cat];
  const use=SKILL_BOUND[s.dir];
  modal(
    '<div class="m-h"><h3>'+esc(s.cn)+'</h3>'+(s.compound?'<span class="tag amber">复合能力</span>':'<span class="tag blue">原子能力</span>')+'<button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b">'+
      '<div class="pill-row" style="margin-bottom:10px"><span class="tag">类别 '+s.cat+' · '+esc(cat.name)+'</span><span class="tag outline" style="font-family:monospace">'+esc(s.dir)+'</span></div>'+
      '<div class="field"><label>核心功能</label><div class="code">'+esc(s.core||'—')+'</div></div>'+
      '<div class="field"><label>触发条件（何时使用）</label><div class="report" style="padding:12px">'+esc(s.desc||'—')+'</div></div>'+
      '<div class="field"><label>能力边界</label><div class="report" style="padding:12px">仅作分析辅助，输出需执业律师审核；中国大陆成文法体系下案例无普遍约束力，类比推理在刑法定罪量刑、税法等领域受严格限制。AI 可能出错或遗漏，最终判断由执业人员作出。</div></div>'+
      '<div class="disclaimer"><div>'+icon('alert')+'</div><div>具体步骤、输入/输出格式与法律声明详见原仓库 SKILL.md。本工作台已将该技能接入对应功能模块。</div></div>'+
    '</div>'+
    '<div class="m-f">'+(use?'<button class="btn primary" data-act="skill-use" data-route="'+use+'">在工作台中使用</button>':'')+'<button class="btn" data-act="close-modal">关闭</button></div>'
  );
}

/* ============================================================
   文书起草
   ============================================================ */
const DOC_TEMPLATES={
  complaint:{name:'民事起诉状',fields:[['plaintiff','原告',1],['defendant','被告',1],['court','致送法院',0],['cause','案由',0],['facts','事实与理由',2],['requests','诉讼请求',2],['legalBasis','法律依据',2]],gen:d=>
    '民事起诉状\n\n原告：'+d.plaintiff+'\n被告：'+d.defendant+'\n\n致 '+d.court+'：\n\n'+(d.cause?('案由：'+d.cause+'\n\n'):'')+
    '一、诉讼请求\n'+d.requests+'\n\n二、事实与理由\n'+d.facts+
    (d.legalBasis?('\n\n三、法律依据\n'+d.legalBasis):'')+'\n\n此致\n'+d.court+'\n\n具状人：'+d.plaintiff+'\n'+getToday()},
  defense:{name:'民事答辩状',fields:[['defendant','答辩人',1],['plaintiff','被答辩人',1],['court','审理法院',0],['opinion','答辩意见',2],['facts','事实与理由',2],['legalBasis','法律依据',2]],gen:d=>
    '民事答辩状\n\n答辩人：'+d.defendant+'\n被答辩人：'+d.plaintiff+'\n\n致 '+d.court+'：\n\n答辩人因与被答辩人纠纷一案，提出答辩意见如下：\n\n一、答辩意见\n'+d.opinion+
    '\n\n二、事实与理由\n'+d.facts+(d.legalBasis?('\n\n三、法律依据\n'+d.legalBasis):'')+'\n\n此致\n'+d.court+'\n\n答辩人：'+d.defendant+'\n'+getToday()},
  appeal:{name:'民事上诉状',fields:[['appellant','上诉人',1],['appellee','被上诉人',1],['court','致送法院',0],['requests','上诉请求',2],['reasons','上诉理由',2]],gen:d=>
    '民事上诉状\n\n上诉人：'+d.appellant+'\n被上诉人：'+d.appellee+'\n\n致 '+d.court+'：\n\n上诉请求：\n'+d.requests+'\n\n上诉理由：\n'+d.reasons+'\n\n此致\n'+d.court+'\n\n上诉人：'+d.appellant+'\n'+getToday()},
  agent:{name:'代理词',fields:[['agent','代理人',1],['client','委托人',1],['court','审理法院',0],['opinion','代理意见',2],['facts','事实梳理',2],['legalBasis','法律依据',2]],gen:d=>
    '代 理 词\n\n尊敬的审判长、审判员：\n\n'+d.agent+'接受'+d.client+'的委托，担任其诉讼代理人。现根据事实与法律，发表代理意见如下：\n\n一、事实梳理\n'+d.facts+'\n\n二、代理意见\n'+d.opinion+(d.legalBasis?('\n\n三、法律依据\n'+d.legalBasis):'')+'\n\n以上意见，请合议庭采纳。\n\n代理人：'+d.agent+'\n'+getToday()},
  lawyerLetter:{name:'律师函',fields:[['to','致送对象',1],['client','委托人',1],['matter','委托事项',2],['facts','事实简述',2],['demand','要求与期限',2]],gen:d=>
    '律 师 函\n\n'+d.to+'：\n\n'+d.client+'（下称"委托人"）委托本律师就'+d.matter+'事宜，特致函如下：\n\n一、事实简述\n'+d.facts+'\n\n二、律师意见及要求\n'+d.demand+'\n\n请贵方在收到本函后及时回应，以免扩大损失。\n\n'+d.client+' 授权律师\n'+getToday()},
  opinion:{name:'法律意见书',fields:[['to','致',1],['bg','背景',2],['analysis','分析',2],['conclusion','结论与建议',2]],gen:d=>
    '法 律 意 见 书\n\n'+d.to+'：\n\n就贵方咨询事宜，本律师基于提供材料出具意见如下：\n\n一、背景\n'+d.bg+'\n\n二、法律分析\n'+d.analysis+'\n\n三、结论与建议\n'+d.conclusion+'\n\n（本意见基于有限材料，供参考，不构成正式法律意见。）\n\n出具人：\n'+getToday()},
  contractReview:{name:'合同审查意见',fields:[['contract','合同名称',1],['scope','审查范围',2],['risks','风险条款',2],['suggestions','修改建议',2],['conclusion','总体结论',2]],gen:d=>
    '合 同 审 查 意 见\n\n合同名称：'+d.contract+'\n\n一、审查范围\n'+d.scope+'\n\n二、主要风险条款\n'+d.risks+'\n\n三、修改建议\n'+d.suggestions+'\n\n四、总体结论\n'+d.conclusion+'\n\n（本审查意见基于书面材料，具体条款效力以正式磋商与签署为准。）'},
  replyOpinion:{name:'答辩意见（二审）',fields:[['defendant','答辩人',1],['plaintiff','上诉人',1],['court','审理法院',0],['opinion','答辩意见',2],['reasons','理由',2]],gen:d=>
    '答 辩 意 见\n\n答辩人：'+d.defendant+'\n上诉人：'+d.plaintiff+'\n\n致 '+d.court+'：\n\n针对上诉人的上诉，答辩意见如下：\n\n一、答辩意见\n'+d.opinion+'\n\n二、理由\n'+d.reasons+'\n\n此致\n'+d.court+'\n\n答辩人：'+d.defendant+'\n'+getToday()}
};
let draftTpl=null;
function renderDraft(c){
  const caseId=new URLSearchParams(location.hash.split('?')[1]||'').get('case')||'';
  const st=Store.get();
  c.innerHTML=
   '<div class="grid cols-4">'+
     Object.keys(DOC_TEMPLATES).map(k=>{const t=DOC_TEMPLATES[k];return '<div class="card" style="cursor:pointer" data-act="tpl-open" data-k="'+k+'"><div class="card-b"><div class="flex center gap8"><div class="li-ic" style="background:var(--brand-soft)">'+icon('doc')+'</div><b>'+t.name+'</b></div><div class="small muted" style="margin-top:6px">标准结构 · 可填写生成</div></div></div>';}).join('')+
   '</div>'+
   (caseId?'<div class="disclaimer" style="margin-top:14px"><div>'+icon('info')+'</div><div>已关联案件：'+(st.cases.find(x=>x.id===caseId)?esc(st.cases.find(x=>x.id===caseId).title):'')+'，生成的文书将归入该案。</div></div>':'')+
   '<div class="card" style="margin-top:16px"><div class="card-h"><h3>我的文书（'+st.documents.length+'）</h3></div><div class="card-b">'+
     (st.documents.length?'<div class="list">'+st.documents.map(d=>'<div class="list-item" data-act="open-doc" data-id="'+d.id+'"><div class="li-ic">'+icon('doc')+'</div><div class="li-main"><b>'+esc(d.title)+'</b><span>'+esc(d.type)+' · '+(d.caseId?(st.cases.find(x=>x.id===d.caseId)?esc(st.cases.find(x=>x.id===d.caseId).title):''):'未关联')+'</span></div><div class="li-side">'+fmtDate(d.createdAt)+'</div></div>').join(''):'<div class="empty">'+icon('doc')+'<p>还没有文书，选择上方模板开始起草</p></div>')+
   '</div></div>';
}
function openTemplate(k){
  draftTpl=k;const t=DOC_TEMPLATES[k];
  modal('<div class="m-h"><h3>'+t.name+'</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b">'+
      t.fields.map(f=>{
        if(f[2]===2)return '<div class="field"><label>'+f[1]+'</label><textarea class="textarea" data-f="'+f[0]+'" placeholder="'+f[1]+'"></textarea></div>';
        return '<div class="field"><label>'+f[1]+'</label><input class="input" data-f="'+f[0]+'" placeholder="'+f[1]+'"></div>';
      }).join('')+
    '</div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="gen-doc">'+icon('sparkle')+' 生成文书</button></div>');
}
function genDoc(){
  const t=DOC_TEMPLATES[draftTpl];
  const data={};$a('#modalMask [data-f]').forEach(el=>data[el.dataset.f]=el.value.trim());
  const text=t.gen(data);
  const caseId=new URLSearchParams(location.hash.split('?')[1]||'').get('case')||'';
  modal('<div class="m-h"><h3>'+t.name+' · 预览</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="doc-preview">'+esc(text)+'</div></div>'+
    '<div class="m-f"><button class="btn" data-act="copy-doc">'+icon('copy')+' 复制</button><button class="btn" data-act="download-doc" data-name="'+esc(t.name)+'">'+icon('download')+' 下载</button>'+
      '<button class="btn primary" data-act="save-doc" data-name="'+esc(t.name)+'" data-case="'+esc(caseId)+'">'+icon('save')+' 保存到文书库</button></div>',
    '760px');
  $('#modalMask').dataset.doc=text;
}

/* ============================================================
   案例检索 / 法条检索
   ============================================================ */
function renderCaseSearch(c){
  const st=Store.get();
  c.innerHTML=
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 1"><div class="card-h"><h3>'+icon('search')+' 检索式构造</h3></div><div class="card-b">'+
       '<div class="field"><label>地域</label><input class="input" id="csRegion" placeholder="如：广东省 / 上海市"></div>'+
       '<div class="row"><div class="field"><label>起始年份</label><input class="input" id="csY1" placeholder="2024"></div><div class="field"><label>截止年份</label><input class="input" id="csY2" placeholder="2026"></div></div>'+
       '<div class="field"><label>案件类型</label><input class="input" id="csType" placeholder="如：民间借贷纠纷 / 劳动争议"></div>'+
       '<div class="field"><label>争议焦点 / 关键词</label><textarea class="textarea" id="csKw" placeholder="如：仅有转账记录无借条，借贷关系认定"></textarea></div>'+
       '<div class="field"><label>希望了解的裁判观点</label><input class="input" id="csView" placeholder="如：法院是否支持利息诉求"></div>'+
       '<button class="btn primary" data-act="gen-case-q">'+icon('sparkle')+' 生成检索式</button>'+
       '<div class="disclaimer" style="margin-top:12px"><div>'+icon('alert')+'</div><div>接入北大法宝 MCP（mcp.pkulaw.com）可获取 1.6 亿+ 司法案例真实数据。未接入时，检索式仅作构造示范，案例须标注来源并核验。</div></div>'+
     '</div></div>'+
     '<div class="card" style="grid-column:span 2"><div class="card-h"><h3>检索记录（'+st.searches.filter(s=>s.kind==='case').length+'）</h3></div><div class="card-b">'+
       (st.searches.filter(s=>s.kind==='case').length?'<div class="list">'+st.searches.filter(s=>s.kind==='case').map(s=>'<div class="list-item" data-act="open-search" data-id="'+s.id+'"><div class="li-ic">'+icon('search')+'</div><div class="li-main"><b>'+esc(s.title)+'</b><span>'+esc(s.summary||'')+'</span></div><div class="li-side">'+fmtDate(s.createdAt)+'</div></div>').join(''):'<div class="empty">'+icon('search')+'<p>暂无检索记录</p></div>')+
     '</div></div>'+
   '</div>';
}
function genCaseQuery(){
  const region=$('#csRegion').value.trim(),y1=$('#csY1').value.trim(),y2=$('#csY2').value.trim(),type=$('#csType').value.trim(),kw=$('#csKw').value.trim(),view=$('#csView').value.trim();
  if(!type&&!kw){toast('请至少填写案件类型或关键词','err');return;}
  const qLines=['【类案检索式】'];
  if(region)qLines.push('地域：'+region);
  if(y1||y2)qLines.push('时间：'+(y1||'')+' 至 '+(y2||'')+' 年');
  if(type)qLines.push('案由/类型：'+type);
  if(kw)qLines.push('关键词：'+kw);
  if(view)qLines.push('关注裁判观点：'+view);
  qLines.push('');
  qLines.push('【检索报告模板】');
  qLines.push('参考类型：□ 指导性案例 □ 公报案例 □ 典型案例 □ 普通类案');
  qLines.push('来源与效力层级：（待标注，指导性案例"应当参照"）');
  qLines.push('裁判要旨：（待归纳）');
  qLines.push('与本案相关度：高 / 中 / 低（理由：）');
  qLines.push('附注：案例不具普遍约束力，引用前须核对是否已生效、是否被推翻。');
  const text=qLines.join('\n');
  const s=Store.addSearch({kind:'case',title:(type||kw).slice(0,20),summary:'检索式已生成',report:text});
  toast('已生成并保存检索式');
  openSearch(s.id);
}
function renderLawSearch(c){
  c.innerHTML=
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 1"><div class="card-h"><h3>'+icon('book')+' 法条定位</h3></div><div class="card-b">'+
       '<div class="field"><label>法律问题 / 关键词</label><textarea class="textarea" id="lsQ" placeholder="如：用人单位违法解除，赔偿金如何计算"></textarea></div>'+
       '<div class="field"><label>可能涉及的法律领域</label><input class="input" id="lsArea" placeholder="如：劳动合同法 / 民法典合同编"></div>'+
       '<button class="btn primary" data-act="gen-law-q">'+icon('sparkle')+' 生成检索报告</button>'+
       '<div class="disclaimer" style="margin-top:12px"><div>'+icon('alert')+'</div><div>法条效力核验（legal-norm-validity-check）可识别条号错位、版本过期、虚构条文。接入法宝 MCP 后自动核验。</div></div>'+
     '</div></div>'+
     '<div class="card" style="grid-column:span 2"><div class="card-h"><h3>检索记录</h3></div><div class="card-b">'+
       (Store.get().searches.filter(s=>s.kind==='law').length?'<div class="list">'+Store.get().searches.filter(s=>s.kind==='law').map(s=>'<div class="list-item" data-act="open-search" data-id="'+s.id+'"><div class="li-ic">'+icon('book')+'</div><div class="li-main"><b>'+esc(s.title)+'</b><span>'+esc(s.summary||'')+'</span></div><div class="li-side">'+fmtDate(s.createdAt)+'</div></div>').join(''):'<div class="empty">'+icon('book')+'<p>暂无检索记录</p></div>')+
     '</div></div>'+
   '</div>';
}
function genLawQuery(){
  const q=$('#lsQ').value.trim(),area=$('#lsArea').value.trim();
  if(!q){toast('请描述法律问题','err');return;}
  const lines=['【法条检索报告】','法律问题：'+q,area?('领域：'+area):'','',
    '可能相关法条：（待检索，建议逐条核验效力层级与时效性）',
    '1. 《____》第___条　[待检索]',
    '2. 《____》第___条　[待检索]','',
    '【效力核验清单 · legal-norm-validity-check】',
    '□ 条文现行有效，未被修订/废止',
    '□ 条号、款项目准确，无错位',
    '□ 非虚构条文（AI 生成法条须核验）',
    '□ 特别法优于一般法、新法优于旧法',
    '□ 注明施行日期与发布机关'];
  const s=Store.addSearch({kind:'law',title:q.slice(0,20),summary:'法条核验清单',report:lines.join('\n')});
  toast('已生成检索报告');openSearch(s.id);
}
function openSearch(id){
  const s=Store.get().searches.find(x=>x.id===id);if(!s)return;
  modal('<div class="m-h"><h3>'+(s.kind==='case'?'案例检索式':'法条检索报告')+'</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="report" style="white-space:pre-wrap;font-family:inherit">'+esc(s.report)+'</div></div>'+
    '<div class="m-f"><button class="btn" data-act="copy-doc">'+icon('copy')+' 复制</button><button class="btn danger" data-act="del-search" data-id="'+s.id+'">'+icon('trash')+' 删除</button></div>','720px');
  $('#modalMask').dataset.doc=s.report;
}

/* ============================================================
   风险研判
   ============================================================ */
let riskCaseId='';
function renderRisk(c){
  const st=Store.get();
  const sel=st.cases.length?'<select class="select" style="width:280px" id="riskCase"><option value="">选择案件…</option>'+st.cases.map(x=>'<option value="'+x.id+'" '+(riskCaseId===x.id?'selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select>':'';
  c.innerHTML=
   '<div class="topline"><b style="font-size:15px">'+icon('shield')+' 风险研判工作台</b><div class="spacer" style="flex:1"></div>'+sel+
     (st.cases.length?'<button class="btn primary" data-act="run-risk">'+icon('sparkle')+' 运行风险框架</button>':'')+'</div>'+
   '<div class="disclaimer" style="margin-bottom:14px"><div>'+icon('alert')+'</div><div>基于 legal-risk-assessment、dispute-issue-identification、strategic-risk-prioritization 等技能。以下为结构化草稿，概率/影响评分需结合案件实际由执业律师判定。</div></div>'+
   '<div id="riskBody"></div>';
  if(st.cases.length){
    $('#riskCase').onchange=e=>{riskCaseId=e.target.value;};
  }else{
    $('#riskBody').innerHTML='<div class="empty">'+icon('case')+'<p>请先在「案件管理」创建案件</p></div>';
  }
}
function runRisk(){
  const cs=Store.getCase(riskCaseId);if(!cs){toast('请选择案件','err');return;}
  const a=cs.analysis||{};
  const ns=a.nineStep;
  const risks=[];
  // 基于证据完整性
  const evScore=cs.evidence.length>=3?1:cs.evidence.length>=1?2:3;
  risks.push({name:'举证责任风险',p:evScore,i:3,why:cs.evidence.length>=3?'已有 '+cs.evidence.length+' 份证据':'证据材料仅 '+cs.evidence.length+' 份，需补充关键证据'});
  // 基于期限
  const nearEvents=Store.get().events.filter(e=>e.caseId===cs.id&&daysFromNow(e.date)>=0&&daysFromNow(e.date)<=14);
  const dlScore=nearEvents.length>0?3:1;
  risks.push({name:'时效/期限风险',p:dlScore,i:4,why:nearEvents.length>0?'未来 14 天有 '+nearEvents.length+' 个节点临近':'暂无近期期限'});
  // 基于标的金额
  if(cs.amount>100000){risks.push({name:'对方偿债能力',p:3,i:4,why:'标的金额 '+fmtMoney(cs.amount)+' 元，执行到位率需评估'});}
  // 基于九步法分析数据
  if(ns){
    const unproven=(ns.elements||[]).filter(e=>e.status==='未证明');
    if(unproven.length>0) risks.push({name:'要件举证不足',p:3,i:4,why:unproven.length+' 个要件尚未证明：'+unproven.map(e=>e.element).join('、')});
    const unmet=(ns.lawApplication||[]).filter(l=>l.satisfied==='不满足');
    if(unmet.length>0) risks.push({name:'要件不满足',p:4,i:4,why:unmet.length+' 个要件判断为不满足：'+unmet.map(l=>l.element).join('、')});
    const noBurden=(ns.burdenOfProof||[]).filter(b=>b.status==='未举证');
    if(noBurden.length>0) risks.push({name:'举证责任未完成',p:3,i:3,why:noBurden.length+' 项待证事实尚未举证'});
  } else if(a.risks){
    risks.push({name:'AI 识别的风险项',p:2,i:3,why:'详见案件分析中的风险评估'});
  }
  // 通用风险
  risks.push({name:'法条适用风险',p:2,i:3,why:'法律关系的定性可能存在分歧'});
  risks.push({name:'程序合规风险',p:1,i:2,why:'诉讼主体/管辖等程序事项'});
  // 争议焦点：优先从九步法读取
  const body=$('#riskBody');
  let disputeText='';
  if(ns&&(ns.disputes||[]).length>0){
    disputeText=ns.disputes.map(d=>'【'+d.type+'】'+d.issue+'\n  原告：'+d.plaintiffPos+'\n  被告：'+d.defendantPos+(d.keyEvidence?'\n  关键证据：'+d.keyEvidence:'')).join('\n\n');
  } else if(a.disputes){
    disputeText=a.disputes;
  }
  const disputeCard = disputeText
    ? '<div class="report" style="white-space:pre-wrap">'+esc(disputeText)+'</div>'
    : '<div class="empty" style="padding:10px 0"><div>'+icon('brain')+'</div><p>尚未归纳争议焦点</p></div>'+
      '<div class="small muted" style="margin-bottom:10px">建议先在案件「九步法分析」中归纳争议焦点，生成结果会自动回填到此处。</div>'+
      '<button class="btn primary" data-act="goto-analysis" data-id="'+cs.id+'">'+icon('brain')+' 去归纳争议焦点</button>';
  body.innerHTML=
   '<div class="grid cols-2" style="align-items:start">'+
     '<div class="card"><div class="card-h"><h3>争议焦点</h3></div><div class="card-b">'+disputeCard+'</div></div>'+
     '<div class="card"><div class="card-h"><h3>风险矩阵</h3><span class="sub">概率 × 影响</span></div><div class="card-b">'+
       '<div class="matrix">'+
         '<div class="cell hd">影响＼概率</div><div class="cell hd">低</div><div class="cell hd">中</div><div class="cell hd">高</div><div class="cell hd">极高</div>'+
         matrixRow('低',risks,1)+matrixRow('中',risks,2)+matrixRow('高',risks,3)+matrixRow('极高',risks,4)+
       '</div>'+
       '<div class="small muted" style="margin-top:8px">单元格内为风险项（概率/影响等级 1-4）。</div>'+
     '</div></div>'+
   '</div>'+
   '<div class="card" style="margin-top:16px"><div class="card-h"><h3>风险清单与优先级</h3></div><div class="card-b"><div class="list">'+
     risks.map(r=>{const score=r.p*r.i;const col=score>=12?'danger':(score>=8?'warn':'ok');
       return '<div class="list-item"><div class="li-ic" style="background:var(--'+col+'-soft);color:var(--'+col+')">'+icon('shield')+'</div>'+
         '<div class="li-main"><b>'+esc(r.name)+'</b><span>概率 '+r.p+' · 影响 '+r.i+' · 评分 '+(r.p*r.i)+'（'+lvlText(score)+'）— '+esc(r.why)+'</span></div></div>';}).join('')+
   '</div></div>'+
   '<div class="card" style="margin-top:16px"><div class="card-h"><h3>应对建议（按优先级）</h3></div><div class="card-b"><div class="report">'+
     '<ul>'+risks.slice().sort((a,b)=>(b.p*b.i)-(a.p*a.i)).map((r,i)=>'<li><b>'+(i+1)+'. '+esc(r.name)+'：</b>'+esc(r.why)+'。建议优先补充证据/关注期限/评估执行方案。</li>').join('')+'</ul>'+
   '</div></div>';
}
function matrixRow(label,risks,p){
  let row='<div class="cell hd">'+label+'</div>';
  for(let i=1;i<=4;i++){
    const here=risks.filter(r=>r.p===p&&r.i===i);
    const cls=p*i>=12?'crit':p*i>=8?'high':p*i>=4?'med':'low';
    row+='<div class="cell mx-'+cls+'"><div class="lv">P'+p+'·I'+i+'</div>'+here.map(r=>'<div style="margin-top:3px;font-weight:600">'+esc(r.name)+'</div>').join('')+'</div>';
  }
  return row;
}
function lvlText(s){return s>=12?'极高':s>=8?'高':s>=4?'中':'低';}

/* ============================================================
   语音转写
   ============================================================ */
let recog=null,recording=false,transcript='';
function renderVoice(c){
  const sup=(window.SpeechRecognition||window.webkitSpeechRecognition);
  c.innerHTML=
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 1"><div class="card-h"><h3>'+icon('mic')+' 录音转写</h3></div><div class="card-b" style="text-align:center">'+
       '<div id="recState" style="font-size:13px;color:var(--ink-3);margin-bottom:12px">'+(sup?'准备就绪':'当前浏览器不支持语音识别')+'</div>'+
       '<button class="btn primary" id="recBtn" data-act="voice-toggle" '+(sup?'':'disabled')+'>'+icon('mic')+' 开始录音</button>'+
       '<div class="divider"></div>'+
       '<button class="btn" data-act="voice-summary" '+(sup?'':'disabled')+'>'+icon('brain')+' 生成会谈纪要</button>'+
       '<div class="disclaimer" style="margin-top:12px;text-align:left"><div>'+icon('alert')+'</div><div>语音识别依赖浏览器 Web Speech API（zh-CN），建议在 Chrome/Edge 使用，并允许麦克风权限。敏感内容请事后脱敏。</div></div>'+
     '</div></div>'+
     '<div class="card" style="grid-column:span 2"><div class="card-h"><h3>转写文本</h3><span class="sub" id="recClock"></span></div><div class="card-b">'+
       '<div class="doc-preview" id="transcript" style="min-height:360px">点击「开始录音」后将实时显示转写内容…</div>'+
     '</div></div>'+
   '</div>'+
   '<div class="card hidden" style="margin-top:16px" id="summaryCard"><div class="card-h"><h3>会谈纪要</h3></div><div class="card-b"><div class="report" id="summaryBody"></div></div></div>';
  if(sup){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    recog=new SR();recog.lang='zh-CN';recog.continuous=true;recog.interimResults=true;
    recog.onresult=e=>{
      let txt='';for(let i=0;i<e.results.length;i++)txt+=e.results[i][0].transcript;
      transcript=txt;const el=$('#transcript');if(el)el.textContent=txt;
    };
    recog.onerror=e=>{toast('识别错误：'+e.error,'err');stopRec();};
    recog.onend=()=>{if(recording)try{recog.start();}catch(_){}};
  }
}
function voiceToggle(){
  if(!recog)return;
  if(!recording){try{recog.start();recording=true;transcript='';$('#transcript').textContent='';$('#recBtn').innerHTML=icon('x')+' 停止录音';$('#recState').textContent='录音中…';toast('开始录音');}catch(e){toast('无法启动：'+e.message,'err');}}
  else{stopRec();}
}
function stopRec(){recording=false;try{recog.stop();}catch(_){}$('#recBtn').innerHTML=icon('mic')+' 开始录音';$('#recState').textContent='已停止';}
function voiceSummary(){
  if(!transcript.trim()){toast('暂无可总结的文本','err');return;}
  const lines=transcript.split(/[。！？\n]/).filter(s=>s.trim().length>2);
  const body=$('#summaryBody');if(!body)return;
  $('#summaryCard').classList.remove('hidden');
  // 提取关键词（简单高频词）
  const words=transcript.replace(/[，。、；：！？""''（）\s]/g,' ').split(' ').filter(w=>w.length>=2);
  const freq={};words.forEach(w=>{freq[w]=(freq[w]||0)+1;});
  const keywords=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(e=>e[0]);
  body.innerHTML='<h4>一、会谈要点</h4><ol>'+lines.slice(0,10).map(l=>'<li>'+esc(l.trim())+'</li>').join('')+'</ol>'+
    '<h4>二、高频关键词</h4><div class="pill-row">'+keywords.map(w=>'<span class="tag blue">'+esc(w)+'</span>').join('')+'</div>'+
    '<h4>三、待办 / 跟进事项</h4><ul>'+
      lines.filter(l=>/需要|应当|必须|建议|尽快|下一步|跟进|补充/.test(l)).slice(0,5).map(l=>'<li>'+esc(l.trim())+'</li>').join('')+
      (lines.filter(l=>/需要|应当|必须|建议|尽快|下一步|跟进|补充/.test(l)).length?'':'<li>（请根据会谈要点手动补充）</li>')+
    '</ul>'+
    '<h4>四、风险与提示</h4><ul>'+
      lines.filter(l=>/风险|注意|问题|困难|争议|期限|时效|逾期/.test(l)).slice(0,5).map(l=>'<li>'+esc(l.trim())+'</li>').join('')+
      (lines.filter(l=>/风险|注意|问题|困难|争议|期限|时效|逾期/.test(l)).length?'':'<li>（请结合案件事实评估风险）</li>')+
    '</ul>'+
    '<div class="disclaimer" style="margin-top:10px"><div>'+icon('alert')+'</div><div>纪要为自动摘要草稿，请核对准确性后再使用。</div></div>';
  toast('已生成会谈纪要');
}

/* ============================================================
   财务跟踪
   ============================================================ */
function renderFinance(c){
  const st=Store.get();
  const finances=st.finances;
  // 统计
  const totalIncome=finances.filter(f=>f.type==='income').reduce((s,f)=>s+(parseFloat(f.amount)||0),0);
  const totalExpense=finances.filter(f=>f.type==='expense').reduce((s,f)=>s+(parseFloat(f.amount)||0),0);
  const unpaid=finances.filter(f=>f.type==='income'&&f.status!=='paid');
  const unpaidTotal=unpaid.reduce((s,f)=>s+(parseFloat(f.amount)||0),0);
  c.innerHTML=
   '<div class="grid cols-4" style="margin-bottom:16px">'+
     stat('scale','总收入',fmtMoney(totalIncome),'已确认收入')+
     stat('clock','待收金额',fmtMoney(unpaidTotal),''+unpaid.length+' 笔待收')+
     stat('download','总支出',fmtMoney(totalExpense),'费用与成本')+
     stat('check','净收入',fmtMoney(totalIncome-totalExpense),'收入 - 支出')+
   '</div>'+
   '<div class="card"><div class="card-h"><h3>财务记录</h3><button class="btn sm primary" data-act="add-fin">'+icon('plus')+' 记一笔</button></div><div class="card-b">'+
     (finances.length?'<div class="list">'+finances.map(f=>{
       const cs=st.cases.find(x=>x.id===f.caseId);
       const isIncome=f.type==='income';
       return '<div class="list-item"><div class="li-ic" style="background:'+(isIncome?'var(--ok-soft)':'var(--warn-soft)')+';color:'+(isIncome?'var(--ok)':'var(--warn)')+'">'+(isIncome?icon('download'):icon('upload'))+'</div>'+
         '<div class="li-main"><b>'+esc(f.title)+'</b><span>'+esc(f.category||'')+(cs?' · '+esc(cs.title):'')+' · '+fmtDate(f.date)+'</span></div>'+
         '<div class="li-side"><b style="color:'+(isIncome?'var(--ok)':'var(--warn)')+'">'+(isIncome?'+':'-')+fmtMoney(f.amount)+'</b>'+
           '<br><span class="tag '+(f.status==='paid'?'green':f.status==='pending'?'amber':'outline')+'">'+(f.status==='paid'?'已结清':f.status==='pending'?'待付款':'已确认')+'</span>'+
           '<br><span class="tag outline" data-act="edit-fin" data-id="'+f.id+'">编辑</span> <span class="tag danger" data-act="del-fin" data-id="'+f.id+'">删除</span></div></div>';
     }).join(''):'<div class="empty">'+icon('scale')+'<p>暂无财务记录，点击「记一笔」开始</p></div>')+
   '</div></div>';
}
function addFinModal(id){
  const st=Store.get();
  const f=id?st.finances.find(x=>x.id===id):null;
  modal('<div class="m-h"><h3>'+(id?'编辑':'记录')+'财务</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="row"><div class="field"><label>类型</label><select class="select" id="finType"><option value="income" '+(f&&f.type==='income'?'selected':'')+'>收入（律师费/顾问费等）</option><option value="expense" '+(f&&f.type==='expense'?'selected':'')+'>支出（费用/成本）</option></select></div>'+
      '<div class="field"><label>类别</label><select class="select" id="finCat"><option value="律师费" '+(f&&f.category==='律师费'?'selected':'')+'>律师费</option><option value="诉讼费" '+(f&&f.category==='诉讼费'?'selected':'')+'>诉讼费</option><option value="差旅费" '+(f&&f.category==='差旅费'?'selected':'')+'>差旅费</option><option value="顾问费" '+(f&&f.category==='顾问费'?'selected':'')+'>顾问费</option><option value="其他" '+(f&&f.category==='其他'?'selected':'')+'>其他</option></select></div></div>'+
    '<div class="field"><label>标题/摘要</label><input class="input" id="finTitle" value="'+esc(f?f.title:'')+'" placeholder="如：张某案一审律师费"></div>'+
    '<div class="row"><div class="field"><label>金额（元）</label><input class="input" id="finAmount" type="number" value="'+esc(f?f.amount:'')+'" placeholder="0"></div>'+
      '<div class="field"><label>日期</label><input class="input" id="finDate" type="date" value="'+esc(f?f.date:getToday())+'"></div></div>'+
    '<div class="field"><label>关联案件</label><select class="select" id="finCase"><option value="">不关联</option>'+Store.get().cases.map(c=>'<option value="'+c.id+'" '+(f&&f.caseId===c.id?'selected':'')+'>'+esc(c.title)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>状态</label><select class="select" id="finStatus"><option value="confirmed" '+(f&&f.status==='confirmed'?'selected':'')+'>已确认</option><option value="pending" '+(f&&f.status==='pending'?'selected':'')+'>待付款</option><option value="paid" '+(f&&f.status==='paid'?'selected':'')+'>已结清</option></select></div>'+
    '<div class="field"><label>备注</label><input class="input" id="finNote" value="'+esc(f?f.note||'':'')+'" placeholder="付款方式、发票号等（选填）"></div></div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="save-fin" data-id="'+esc(id||'')+'">'+icon('save')+' 保存</button></div>');
}

/* ============================================================
   客户协作
   ============================================================ */
let collabCaseId='';
function renderCollab(c){
  const st=Store.get();
  const cases=st.cases;
  if(!collabCaseId && cases.length>0) collabCaseId=cases[0].id;
  const msgs=Store.getMessages(collabCaseId);
  const cs=st.cases.find(x=>x.id===collabCaseId);
  c.innerHTML=
   '<div class="grid cols-3" style="align-items:start">'+
     '<div class="card" style="grid-column:span 1"><div class="card-h"><h3>'+icon('case')+' 选择案件</h3></div><div class="card-b">'+
       (cases.length?cases.map(x=>'<div class="list-item '+(collabCaseId===x.id?'active':'')+'" data-act="collab-case" data-id="'+x.id+'"><div class="li-ic">'+icon('case')+'</div><div class="li-main"><b>'+esc(x.title)+'</b><span>'+esc(x.type)+' · '+esc(x.stage)+'</span></div></div>').join(''):'<div class="empty">'+icon('case')+'<p>暂无案件</p></div>')+
     '</div></div>'+
     '<div class="card" style="grid-column:span 2"><div class="card-h"><h3>'+icon('user')+' 沟通记录'+(cs?' · '+esc(cs.title):'')+'</h3></div>'+
       '<div class="card-b"><div class="chat"><div class="chat-log" id="collabLog">'+
         (msgs.length?msgs.map(m=>'<div class="msg '+(m.from==='me'?'me':'bot')+'"><div class="av">'+(m.from==='me'?'我':'客')+'</div><div class="bubble">'+esc(m.text)+'<br><span style="font-size:11px;opacity:.6">'+new Date(m.createdAt).toLocaleString('zh-CN')+'</span></div></div>').join(''):'<div class="empty" style="padding:40px">'+icon('user')+'<p>暂无沟通记录，在下方添加</p></div>')+
       '</div>'+
       '<div class="chat-in"><textarea id="collabInput" placeholder="记录与客户的沟通内容、确认事项、要求等…"></textarea><button class="btn primary" data-act="collab-send">'+icon('arrowRight')+'</button></div>'+
     '</div></div>'+
   '</div>'+
   '<div class="card" style="margin-top:16px"><div class="card-h"><h3>'+icon('info')+' 使用说明</h3></div><div class="card-b">'+
     '<div class="report">客户协作模块用于记录与委托人的沟通内容。每条记录关联到具体案件，方便回溯。<br>提示：此处为本地记录工具，不替代正式的法律沟通留痕。重要事项建议通过书面（函件/邮件）确认。</div>'+
   '</div></div>';
  const log=$('#collabLog');if(log)log.scrollTop=log.scrollHeight;
  const inp=$('#collabInput');if(inp)inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();collabSend();}});
}
function collabSend(){
  const text=$('#collabInput').value.trim();if(!text)return;
  if(!collabCaseId){toast('请先选择案件','err');return;}
  Store.addMessage({caseId:collabCaseId,text,from:'me'});
  $('#collabInput').value='';
  renderCollab($('#content'));toast('已记录');
}

function saveFin(id){
  const title=$('#finTitle').value.trim();
  if(!title){toast('请填写标题','err');return;}
  const amount=parseFloat($('#finAmount').value)||0;
  if(amount<=0){toast('请填写有效金额','err');return;}
  const obj={
    type:$('#finType').value,
    category:$('#finCat').value,
    title:title,
    amount:amount,
    date:$('#finDate').value||getToday(),
    caseId:$('#finCase').value,
    status:$('#finStatus').value,
    note:$('#finNote').value.trim()
  };
  if(id){Store.updateFinance(id,obj);toast('已保存');}
  else{Store.addFinance(obj);toast('已记录');}
  closeModal();renderFinance($('#content'));
}
function delFin(id){
  if(!confirm('确定删除该记录？'))return;
  Store.deleteFinance(id);
  toast('已删除');
  renderFinance($('#content'));
}

/* ============================================================
   个人中心 / 设置
   ============================================================ */
function renderAuditLogs(){
  const logs=Store.getAuditLogs();
  if(!logs.length) return '<div class="empty"><p>暂无操作记录</p></div>';
  const actionLabels={create:'新建',update:'修改',delete:'删除','verify-ai':'核对AI'};
  const entityLabels={case:'案件',document:'文书',search:'检索',event:'事件',finance:'财务',message:'消息',settings:'设置'};
  return '<div class="audit-log-filters" style="margin-bottom:12px">'+
    '<select class="select" id="auditEntityFilter" style="width:120px"><option value="">全部类型</option>'+
    ['case','document','search','event','finance','message','settings'].map(e=>'<option value="'+e+'">'+entityLabels[e]+'</option>').join('')+
    '</select>'+
    '<select class="select" id="auditActionFilter" style="width:120px"><option value="">全部操作</option>'+
    ['create','update','delete'].map(a=>'<option value="'+a+'">'+actionLabels[a]+'</option>').join('')+
    '</select>'+
    '<span class="muted small">共 '+logs.length+' 条记录</span>'+
  '</div>'+
  '<div class="audit-log-table" style="max-height:400px;overflow-y:auto">'+
    '<table class="table"><thead><tr><th>时间</th><th>操作</th><th>类型</th><th>名称</th><th>详情</th></tr></thead><tbody>'+
    logs.slice(0,100).map(log=>{
      const ts=new Date(log.timestamp);
      const timeStr=ts.toLocaleDateString('zh-CN')+' '+ts.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
      const actionClass=log.action==='create'?'green':(log.action==='delete'?'red':'blue');
      let detail='';
      if(log.changes){
        if(Array.isArray(log.changes)){
          detail=log.changes.length+' 项变更';
        } else {
          detail=(log.changes.field||'')+'：'+(typeof log.changes.from==='string'?log.changes.from.slice(0,20):'')+' → '+(typeof log.changes.to==='string'?log.changes.to.slice(0,20):'');
        }
      }
      return '<tr><td class="small">'+timeStr+'</td>'+
        '<td><span class="tag '+actionClass+'">'+actionLabels[log.action]+'</span></td>'+
        '<td>'+entityLabels[log.entity]+'</td>'+
        '<td>'+esc(log.entityTitle||'')+'</td>'+
        '<td class="small muted">'+esc(detail)+'</td></tr>';
    }).join('')+
    '</tbody></table>'+
  '</div>';
}

function renderSettings(c){
  const s=Store.get().settings;
  c.innerHTML=
   '<div class="grid cols-2" style="align-items:start">'+
     '<div class="card"><div class="card-h"><h3>'+icon('user')+' 律师信息</h3></div><div class="card-b">'+
       '<div class="field"><label>姓名 / 称谓</label><input class="input" id="setName" value="'+esc(s.lawyerName)+'" placeholder="如：张律师"></div>'+
       '<div class="field"><label>执业机构</label><input class="input" id="setFirm" value="'+esc(s.firm)+'" placeholder="如：某某律师事务所"></div>'+
       '<button class="btn primary" data-act="save-settings">'+icon('save')+' 保存</button>'+
     '</div></div>'+
     '<div class="card"><div class="card-h"><h3>'+icon('robot')+' AI 引擎（可选）</h3></div><div class="card-b">'+
       '<div class="disclaimer" style="margin-bottom:12px"><div>'+icon('alert')+'</div><div>可选接入任意 OpenAI 兼容接口（如本地 Ollama、硅基流动、OpenAI 等）。密钥仅存于本机浏览器，不会上传。</div></div>'+
       '<label class="flex center gap8" style="margin-bottom:12px"><input type="checkbox" id="aiOn" '+(s.ai.enabled?'checked':'')+'> 启用 AI 实时对话</label>'+
       '<div class="field"><label>接口地址（Base URL）</label><input class="input" id="aiUrl" value="'+esc(s.ai.baseUrl||'')+'" placeholder="https://api.openai.com/v1"></div>'+
       '<div class="field"><label>API Key</label><input class="input" id="aiKey" type="password" value="'+esc(s.ai.apiKey||'')+'" placeholder="sk-..."></div>'+
       '<div class="field"><label>模型</label><input class="input" id="aiModel" value="'+esc(s.ai.model||'gpt-4o-mini')+'" placeholder="gpt-4o-mini"></div>'+
       '<button class="btn primary" data-act="save-ai">'+icon('save')+' 保存并测试</button>'+
     '</div></div>'+
     '<div class="card"><div class="card-h"><h3>'+icon('file')+' 数据管理</h3></div><div class="card-b">'+
       '<p class="small muted" style="margin-bottom:12px">所有案件、文书、检索与设置均保存在本机浏览器 localStorage，不上传云端。</p>'+
       '<div class="flex gap8 wrap"><button class="btn" data-act="export-data">'+icon('download')+' 导出备份</button>'+
         '<label class="btn">'+icon('upload')+' 导入备份<input type="file" id="importFile" accept=".json" style="display:none"></label>'+
         '<button class="btn danger" data-act="reset-data">'+icon('trash')+' 重置演示数据</button></div>'+
     '</div></div>'+
     '<div class="card"><div class="card-h"><h3>'+icon('clock')+' 操作日志</h3><span class="sub">记录所有数据变更</span></div><div class="card-b">'+
       '<div id="auditLogList">'+renderAuditLogs()+'</div>'+
     '</div></div>'+
     '<div class="card"><div class="card-h"><h3>'+icon('alert')+' 免责声明</h3></div><div class="card-b">'+
       '<div class="report" style="white-space:pre-wrap">本工作台为法律智能辅助工具。\n\n所有 AI 生成内容仅供参考，不构成正式法律意见、法院裁判意见或案件结果承诺。在中国境内，案例不具有普遍约束力（最高人民法院指导性案例除外），类比推理在部分领域受严格限制。\n\n对外提交或使用任何内容前，请执业律师独立核对事实、证据、法条、金额、日期、主体及法院信息。涉及重大权益或复杂程序，建议咨询专业律师。</div>'+
     '</div></div>'+
   '</div>';
  const imp=$('#importFile');if(imp)imp.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{Store.importAll(r.result);toast('导入成功，正在刷新');setTimeout(router,200);}catch(err){toast('导入失败：文件格式错误','err');}};r.readAsText(f);};
}
function updateAIStatus(){
  const ai=Store.get().settings.ai;
  const el=$('#aiStatus');const txt=$('#aiStatusTxt');
  if(ai.enabled&&ai.baseUrl&&ai.apiKey){el.classList.add('on');txt.textContent='AI 已连接';}
  else{el.classList.remove('on');txt.textContent='离线引擎';}
}
async function callAI(messages){
  const ai=Store.get().settings.ai;
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),30000);
  try{
    const res=await fetch(ai.baseUrl.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+ai.apiKey},body:JSON.stringify({model:ai.model,messages,temperature:0.3}),signal:ctrl.signal});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const j=await res.json();return j.choices&&j.choices[0]?j.choices[0].message.content:'';
  }catch(e){
    if(e.name==='AbortError')throw new Error('AI 调用超时（30秒）');
    throw e;
  }finally{clearTimeout(timer);}
}

/* ============================================================
   案件 AI 分析（离线框架 + 可选 AI）
   ============================================================ */
function runAnalysis(id){
  const cs=Store.getCase(id);if(!cs)return;
  const a=cs.analysis||{};
  const MARKER = '🤖 AI 生成 · 待核对\n\n';
  a.elements=MARKER+'【法律要件提取 · legal-element-extraction】\n'+
    '主体：'+(cs.parties.map(p=>p.role+' '+p.name).join('；')||'（待填）')+'\n'+
    '客体/标的：'+(cs.amount?('金额 '+fmtMoney(cs.amount)+' 元'):'（待填）')+'\n'+
    '核心事实：'+(cs.background||'（待填）')+'\n'+
    '请将上述事实对照本案法律关系的构成要件逐一归类，标记缺失要件。';
  a.disputes=MARKER+'【争议焦点识别 · dispute-issue-identification】\n'+
    '1. 事实争点：（双方对哪些事实存在分歧？）\n'+
    '2. 法律争点：（法律关系的定性、法条适用有无分歧？）\n'+
    '3. 证据争点：（关键证据的真实性、合法性、关联性争议？）';
  a.risks=MARKER+'【风险评估 · legal-risk-assessment】\n'+
    '· 举证责任：我方是否掌握关键证据？缺失部分如何补强？\n'+
    '· 期限：举证/上诉/诉讼时效是否临近？\n'+
    '· 执行：即便胜诉，对方偿债能力如何？\n'+
    '· 法律适用：定性或法条选择是否存在分歧风险？';
  a.predict=MARKER+'【裁判走向预判 · legal-judgment-prediction】\n'+
    '基于已提取要件与可能类案，初步预判：\n'+
    '· 请求权基础是否成立：\n'+
    '· 抗辩事由是否成立：\n'+
    '· 可能支持的判项范围：\n'+
    '（须结合案例检索与法条核验，须经执业律师判定）';
  Store.updateCase(id,{analysis:a});
  caseTab='analysis';renderCaseTab(cs);
  toast('已生成分析框架，请逐项核对后标记"已核对"');
}
async function aiAnalysis(id){
  if(_aiLoading) return;
  const cs=Store.getCase(id);const ai=Store.get().settings.ai;
  if(!(ai.enabled&&ai.baseUrl&&ai.apiKey)){toast('请先在「个人中心」配置 AI 引擎','err');return;}
  _aiLoading=true;
  const btn=document.querySelector('[data-act="ai-analysis"]');
  if(btn){btn.disabled=true;btn.textContent='AI 生成中…';}
  toast('正在调用 AI 生成…');
  try{
    const r=await callAI([{role:'system',content:'你是资深中国执业律师助理。请严格按以下 JSON 格式输出，不要输出其他内容：{"elements":"法律要件提取","disputes":"争议焦点识别","risks":"风险评估","predict":"裁判走向预判"}。提示：不给出绝对结论，需执业律师核对。'},{role:'user',content:'案件：'+cs.title+'；类型：'+cs.type+'；阶段：'+cs.stage+'；法院：'+cs.court+'；背景：'+cs.background}]);
    const a=cs.analysis||{};
    const MARKER = '🤖 AI 生成 · 待核对\n\n';
    try{
      const parsed=JSON.parse(r);
      if(parsed.elements)a.elements=MARKER+parsed.elements;
      if(parsed.disputes)a.disputes=MARKER+parsed.disputes;
      if(parsed.risks)a.risks=MARKER+parsed.risks;
      if(parsed.predict)a.predict=MARKER+parsed.predict;
    }catch(_){
      // AI 未返回合法 JSON 时，整段内容写入 elements
      a.elements=MARKER+(r||a.elements);
    }
    Store.updateCase(id,{analysis:a});caseTab='analysis';renderCaseTab(cs);toast('AI 生成完成 — 请核对后标记"已核对"');
  }catch(e){toast('AI 调用失败：'+e.message,'err');}
  finally{_aiLoading=false;if(btn){btn.disabled=false;btn.innerHTML=icon('robot')+' 调用 AI 生成';}}
}

/**
 * P0-2: 律师核对 AI 输出后标记"已核对"
 * 将前缀从 "🤖 AI 生成 · 待核对" 改为 "✅ 已核对 · 原AI生成"
 * 并记录审计日志
 */
function aiVerify(id, skill){
  const cs = Store.getCase(id);
  if(!cs) return;
  const a = cs.analysis || {};
  const val = a[skill];
  if(!val || !val.startsWith('🤖 AI 生成 · 待核对')){
    toast('无需核对：该字段非 AI 生成或已核对');
    return;
  }
  // 替换前缀
  a[skill] = val.replace('🤖 AI 生成 · 待核对', '✅ 已核对 · 原AI生成');
  Store.updateCase(id, {analysis: a});
  // 审计日志：记录核对操作
  if(Store.addAuditLog){
    Store.addAuditLog('verify-ai', 'case-analysis', id, cs.title + ' · ' + skill);
  }
  renderCaseTab(cs);
  toast('已标记核对完成 ✓');
}

/* ============================================================
   事件委托（全局点击）
   ============================================================ */
let _lastSaveAct='', _lastSaveTime=0;
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const act=el.dataset.act,id=el.dataset.id;
  const SAVE_ACTS=['save-case','save-fin','save-event','save-settings','save-ai','save-edit-doc','gen-doc','save-doc','chat-send','collab-send'];
  if(SAVE_ACTS.includes(act)){
    const now=Date.now();
    if(act===_lastSaveAct && now-_lastSaveTime<500) return;
    _lastSaveAct=act;_lastSaveTime=now;
  }
  switch(act){
    case 'nav':{const r=el.dataset.route;if(el.dataset.case)go(r+'?case='+el.dataset.case);else go(r);break;}
    case 'new-case':openCaseModal(null);break;
    case 'edit-case':openCaseModal(id);break;
    case 'save-case':saveCase(id);break;
    case 'del-case':delCase(id);break;
    case 'open-case':openCase(id);break;
    case 'goto-analysis':lastCaseId=id;caseTab='analysis';go('case',id);break;
    case 'ai-verify':aiVerify(id, el.dataset.skill);break;
    case 'add-party':addPartyRow();break;
    case 'save-case-x':break;
    case 'del-party':break;
    case 'case-tab':caseTab=el.dataset.t;renderCaseDetail($('#content'));break;
    case 'add-tl':addTimeline(id);break;
    case 'add-ev':addEvidence(id);break;
    case 'edit-ev':editEvidence(id,parseInt(el.dataset.i));break;
    case 'save-ev':saveEvidence(id,parseInt(el.dataset.i));break;
    case 'del-ev':delEvidence(id,el.dataset.i);break;
    case 'ev-cat':window._evCat=el.dataset.c;renderCaseTab(Store.getCase(curParam));break;
    case 'run-analysis':runAnalysis(id);break;
    case 'ai-analysis':aiAnalysis(id);break;
    case 'month-prev':calMonth.setMonth(calMonth.getMonth()-1);renderLitigation($('#content'));break;
    case 'month-next':calMonth.setMonth(calMonth.getMonth()+1);renderLitigation($('#content'));break;
    case 'add-event':addEventModal();break;
    case 'day-evts':dayEvents(el.dataset.date);break;
    case 'del-event':delEvent(el.dataset.id,el.dataset.date);break;
    case 'wf-open':wfOpen(el.dataset.w);break;
    case 'chat-send':chatSend();break;
    case 'skill-cat':skillFilter=el.dataset.c;renderSkills($('#content'));break;
    case 'skill-open':openSkill(el.dataset.dir);break;
    case 'skill-use':closeModal();go(el.dataset.route);break;
    case 'tpl-open':openTemplate(el.dataset.k);break;
    case 'gen-doc':genDoc();break;
    case 'copy-doc':copyDoc();break;
    case 'download-doc':downloadDoc(el.dataset.name);break;
    case 'save-doc':saveDoc(el.dataset.name,el.dataset.case);break;
    case 'open-doc':openDoc(id);break;
    case 'view-ver':viewVersion(id);break;
    case 'restore-ver':restoreVersion(id);break;
    case 'edit-doc':editDoc(id);break;
    case 'save-edit-doc':saveEditDoc(id);break;
    case 'gen-case-q':genCaseQuery();break;
    case 'gen-law-q':genLawQuery();break;
    case 'open-search':openSearch(id);break;
    case 'del-search':delSearch(id);break;
    case 'run-risk':runRisk();break;
    case 'voice-toggle':voiceToggle();break;
    case 'voice-summary':voiceSummary();break;
    case 'add-fin':addFinModal(null);break;
    case 'edit-fin':addFinModal(id);break;
    case 'save-fin':saveFin(id);break;
    case 'del-fin':delFin(id);break;
    case 'share-case':openShareModal(id);break;
    case 'share-search':shareSearchUser();break;
    case 'share-add':shareAddUser(el.dataset.username);break;
    case 'unshare':unshareUser(el.dataset.username);break;
    case 'collab-case':collabCaseId=id;renderCollab($('#content'));break;
    case 'collab-send':collabSend();break;
    case 'save-settings':saveSettings();break;
    case 'save-ai':saveAI();break;
    case 'export-data':download('lawyer-workbench-backup.json',Store.exportAll());toast('已导出备份');break;
    case 'reset-data':resetData();break;
    case 'ns-goto':{const cs=Store.getCase(curParam);if(cs)nsGotoStep(cs,parseInt(el.dataset.step));break;}
    case 'ns-next':{const cs=Store.getCase(curParam);if(cs)nsNextStep(cs);break;}
    case 'ns-prev':{const cs=Store.getCase(curParam);if(cs)nsPrevStep(cs);break;}
    case 'ns-add-row':{const cs=Store.getCase(curParam);if(cs)nsAddRow(cs,parseInt(el.dataset.step));break;}
    case 'ns-del-row':{const cs=Store.getCase(curParam);if(cs)nsDelRow(cs,parseInt(el.dataset.step),parseInt(el.dataset.row));break;}
    case 'ns-ai':{const cs=Store.getCase(curParam);if(cs)nsAI(cs,parseInt(el.dataset.step));break;}
    case 'ns-show-lib':{const cs=Store.getCase(curParam);if(cs)nsShowLib(cs);break;}
    case 'ns-show-defense-lib':{const cs=Store.getCase(curParam);if(cs)nsShowDefenseLib(cs);break;}
    case 'ns-pick-lib':{const cs=Store.getCase(curParam);if(cs)nsPickLib(cs,parseInt(el.dataset.idx));break;}
    case 'ns-pick-defense':{const cs=Store.getCase(curParam);if(cs)nsPickDefense(cs,parseInt(el.dataset.idx));break;}
    case 'ns-gen-draft':{const cs=Store.getCase(curParam);if(cs)nsGenDraft(cs);break;}
    case 'ns-complete':{const cs=Store.getCase(curParam);if(cs){const ns=getNineStep(cs);if(!ns.completedSteps.includes(9))ns.completedSteps.push(9);Store.updateCase(cs.id,{analysis:cs.analysis});toast('九步法分析完成！');renderCaseTab(cs);}break;}
    case 'close-modal':closeModal();break;
  }
});

/* ---------------- 各类动作实现 ---------------- */
function addPartyRow(){
  const box=$('#partyBox');const i=box.querySelectorAll('.party').length;
  box.insertAdjacentHTML('beforeend',partyRow({role:'原告',name:'',isClient:false},i));
}
function saveCase(id){
  const title=$('#cTitle').value.trim();
  if(!title){toast('请填写案件标题','err');return;}
  const parties=[...$('#partyBox').querySelectorAll('.party')].map(p=>({role:p.querySelector('[data-k=role]').value.trim(),name:p.querySelector('[data-k=name]').value.trim(),isClient:p.querySelector('[data-k=isClient]').checked})).filter(p=>p.name);
  const obj={title,type:$('#cType').value,stage:$('#cStage').value,court:$('#cCourt').value.trim(),
    amount:parseFloat($('#cAmount').value)||0,filingDate:$('#cDate').value||getToday(),
    parties:parties.length?parties:[{role:'原告',name:'',isClient:true}],background:$('#cBg').value.trim()};
  // 利益冲突检查
  const conflicts=Store.checkConflict(obj.parties, id||null);
  const highConflicts=conflicts.filter(c=>c.level==='high');
  if(highConflicts.length>0){
    const msg='⚠️ 利益冲突警告\n\n发现以下当事人与您现有案件存在对立关系：\n\n'+
      highConflicts.map(c=>'· '+c.partyName+'：在「'+c.caseTitle+'」中为'+c.otherRole+'，本案中为'+c.myRole).join('\n')+
      '\n\n请确认是否存在利益冲突。根据律师执业规范，同一律师不得在同一案件中代理双方当事人。';
    if(!confirm(msg)) return;
  } else if(conflicts.length>0){
    const msg='提示：以下当事人在您其他案件中也出现过：\n\n'+
      conflicts.map(c=>'· '+c.partyName+'（'+c.myRole+'）也在「'+c.caseTitle+'」中作为'+c.otherRole).join('\n')+
      '\n\n请留意是否存在关联关系。是否继续保存？';
    if(!confirm(msg)) return;
  }
  if(id){Store.updateCase(id,obj);toast('已保存');closeModal();openCase(id);}
  else{const c=Store.addCase(obj);toast('案件已创建');closeModal();openCase(c.id);}
}
function delCase(id){
  if(!confirm('确定删除该案件及其关联文书、事件？此操作不可撤销。'))return;
  Store.deleteCase(id);toast('已删除');if(curRoute==='case-detail')go('cases');else renderCases($('#content'));buildNav();
}
function addTimeline(id){
  const cs=Store.getCase(id);const date=$('#tlDate').value;const title=$('#tlTitle').value.trim();
  if(!date||!title){toast('请填写日期与标题','err');return;}
  cs.timeline.push({date,title,desc:$('#tlDesc').value.trim()});Store.updateCase(id,{timeline:cs.timeline});
  caseTab='timeline';renderCaseTab(cs);toast('已添加节点');
}
function addEvidence(id){
  const cs=Store.getCase(id);const name=$('#evName').value.trim();
  if(!name){toast('请填写证据名称','err');return;}
  cs.evidence.push({name,type:$('#evTypeSel').value,note:$('#evNote').value.trim()});
  Store.updateCase(id,{evidence:cs.evidence});caseTab='evidence';
  $('#evName').value='';$('#evNote').value='';
  renderCaseTab(cs);toast('已添加证据');
}
function editEvidence(id,i){
  const cs=Store.getCase(id);const e=cs.evidence[i];if(!e)return;
  modal('<div class="m-h"><h3>编辑证据</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="field"><label>证据名称</label><input class="input" id="eEvName" value="'+esc(e.name)+'"></div>'+
    '<div class="field"><label>类型</label><select class="select" id="eEvType">'+['书证','物证','电子数据','证人证言','鉴定意见','勘验笔录','其他'].map(t=>'<option '+(e.type===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>证明目的/备注</label><input class="input" id="eEvNote" value="'+esc(e.note||'')+'"></div></div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="save-ev" data-id="'+id+'" data-i="'+i+'">'+icon('save')+' 保存</button></div>');
}
function saveEvidence(id,i){
  const cs=Store.getCase(id);
  const name=$('#eEvName').value.trim();
  if(!name){toast('请填写证据名称','err');return;}
  cs.evidence[i]={name,type:$('#eEvType').value,note:$('#eEvNote').value.trim()};
  Store.updateCase(id,{evidence:cs.evidence});closeModal();caseTab='evidence';renderCaseTab(cs);toast('已保存');
}
function delEvidence(id,i){
  if(!confirm('确定删除该证据？'))return;
  const cs=Store.getCase(id);cs.evidence.splice(parseInt(i),1);Store.updateCase(id,{evidence:cs.evidence});
  caseTab='evidence';renderCaseTab(cs);
}
function addEventModal(){
  const cases=Store.get().cases;
  const periodOptions=window.LegalDeadline?Object.keys(window.LegalDeadline.LEGAL_PERIODS).map(k=>'<option value="'+k+'">'+k+'</option>').join(''):'';
  modal('<div class="m-h"><h3>添加期限 / 节点</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="field"><label>关联案件</label><select class="select" id="evCase"><option value="">不关联</option>'+cases.map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join('')+'</select></div>'+
    '<div class="row"><div class="field"><label>日期</label><input class="input" id="evDate" type="date"></div><div class="field"><label>类型</label><select class="select" id="evType2"><option value="deadline">期限</option><option value="hearing">开庭</option><option value="todo">待办</option></select></div></div>'+
    '<div id="evWorkdayHint" class="small muted" style="margin:-8px 0 8px"></div>'+
    (periodOptions?'<div class="card" style="background:var(--bg2);border:none;padding:12px;margin-bottom:12px"><div class="small" style="margin-bottom:8px"><b>法定期间速算</b></div>'+
      '<div class="row"><div class="field" style="margin:0"><label class="small">起算日</label><input class="input" id="evCalcStart" type="date" value="'+getToday()+'"></div>'+
      '<div class="field" style="margin:0"><label class="small">期间类型</label><select class="select" id="evCalcPeriod">'+periodOptions+'</select></div></div>'+
      '<button class="btn sm" id="evCalcBtn" style="margin-top:8px">计算届满日</button>'+
      '<div id="evCalcResult" class="small" style="margin-top:6px"></div></div>':'')+
    '<div class="field"><label>标题</label><input class="input" id="evTitle" placeholder="如：举证期限届满"></div></div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="save-event">'+icon('save')+' 保存</button></div>');
  // 日期变更时显示工作日提示
  const dateInput=$('#evDate');
  if(dateInput && window.LegalDeadline){
    dateInput.addEventListener('change',function(){
      const hint=$('#evWorkdayHint');
      if(!hint||!this.value)return;
      const isWd=LegalDeadline.isWorkday(this.value);
      hint.textContent=isWd?'工作日':'非工作日（节假日/周末）';
      hint.style.color=isWd?'':'var(--red)';
    });
  }
  // 法定期间速算按钮
  const calcBtn=$('#evCalcBtn');
  if(calcBtn){
    calcBtn.addEventListener('click',function(){
      const start=$('#evCalcStart').value;
      const period=$('#evCalcPeriod').value;
      if(!start){toast('请选择起算日','err');return;}
      const result=LegalDeadline.calcLegalPeriod(start, period);
      if(!result){toast('无法计算','err');return;}
      const info=LegalDeadline.LEGAL_PERIODS[period];
      const wdCount=LegalDeadline.workdaysBetween(start, result.deadline);
      $('#evCalcResult').innerHTML='<b>届满日：'+result.deadline+'</b>（'+wdCount+' 个工作日）<br><span class="muted">'+info.note+'</span>';
      // 自动填入日期和标题
      $('#evDate').value=result.deadline;
      if(!$('#evTitle').value) $('#evTitle').value=period+'届满';
      // 触发工作日提示
      $('#evDate').dispatchEvent(new Event('change'));
    });
  }
}
function dayEvents(date){
  const evs=Store.get().events.filter(e=>e.date===date);
  modal('<div class="m-h"><h3>'+date+' 的安排</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b">'+(evs.length?evs.map(e=>'<div class="list-item"><div class="li-ic">'+icon(e.type==='hearing'?'gavel':'clock')+'</div><div class="li-main"><b>'+esc(e.title)+'</b><span>'+(e.caseId?(Store.get().cases.find(c=>c.id===e.caseId)?esc(Store.get().cases.find(c=>c.id===e.caseId).title):''):'未关联')+'</span></div><div class="li-side"><span class="tag '+(e.type==='deadline'?'danger':(e.type==='hearing'?'warn':'blue'))+'" data-act="del-event" data-id="'+e.id+'" data-date="'+date+'">删除</span></div></div>').join(''):'<div class="empty">'+icon('calendar')+'<p>当天无安排</p></div>')+'</div>');
}
// save-event handled via delegation? add explicit:
document.addEventListener('click',e=>{if(e.target.closest('[data-act="save-event"]')){const c=$('#evCase').value,date=$('#evDate').value,type=$('#evType2').value,title=$('#evTitle').value.trim();if(!date||!title){toast('请填写日期与标题','err');return;}Store.addEvent({caseId:c,date,type,title});closeModal();renderLitigation($('#content'));toast('已添加');}});

function delEvent(id,date){
  if(!confirm('确定删除该事件？'))return;
  Store.deleteEvent(id);
  closeModal();
  dayEvents(date);
  renderLitigation($('#content'));
  toast('已删除');
}
function wfOpen(w){
  const def=WORKFLOWS.find(x=>x.id===w);if(!def)return;
  const cases=Store.get().cases;
  modal('<div class="m-h"><h3>'+icon(def.icon)+' '+def.name+' · 结构化向导</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="field"><label>关联案件（可选）</label><select class="select" id="wfCase"><option value="">不关联 / 自由输入</option>'+cases.map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>案件事实 / 问题描述</label><textarea class="textarea" id="wfFacts" placeholder="描述案情、主体、争议与诉求…"></textarea></div>'+
    '<div class="disclaimer"><div>'+icon('alert')+'</div><div>调用技能：'+def.skill.map(s=>{const sk=skillByDir(s);return sk?sk.cn:s;}).join(' · ')+'。以下框架离线生成，配置 AI 后可获得实时内容。</div></div>'+
    '</div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="wf-run" data-w="'+w+'">'+icon('sparkle')+' 生成分析框架</button></div>');
}
document.addEventListener('click',e=>{if(e.target.closest('[data-act="wf-run"]'))wfRun(e.target.closest('[data-act="wf-run"]').dataset.w);});
function wfRun(w){
  const facts=$('#wfFacts').value.trim();const cid=$('#wfCase').value;
  if(!facts){toast('请填写事实/问题','err');return;}
  let out='';
  if(w==='facts')out='【案情分析框架】\n1. 事实与要件（legal-element-extraction）：'+facts+'\n   → 按主体/标的/行为/时间归类，标记缺失要件。\n2. 争议焦点（dispute-issue-identification）：归纳事实争点、法律争点、证据争点。\n3. 演绎推理（deductive-reasoning）：大前提(法条)→小前提(要件事实)→结论。\n4. 输出：要件清单 + 争点列表 + 初步策略。';
  else if(w==='draft')out='【文书起草思路】\n1. 结构化要素（structured-element-extraction）：确定文书类型与必备要素。\n2. 格式规范（legal-document-formatting）：标题/当事人/正文/落款。\n3. 术语规范（legal-terminology）：统一法律术语。\n4. 建议前往「文书起草」选择模板填写生成。';
  else if(w==='case')out='【类案检索式】\n案情：'+facts+'\n→ 地域 + 时间段 + 案由 + 关键词 + 关注裁判观点。\n→ 前往「案例检索」构造并保存检索式（可接入北大法宝 MCP 获取真实类案）。';
  else if(w==='law')out='【法条定位】\n问题：'+facts+'\n→ 定位可能法条（legal-article-retrieval），逐条核验效力（legal-norm-validity-check）：是否有效、条号准确、特别法优先。\n→ 前往「法条检索」生成核验清单。';
  else if(w==='risk')out='【风险研判】\n事项：'+facts+'\n→ 识别风险（legal-risk-assessment），评估概率×影响，排序优先级（strategic-risk-prioritization）。\n→ 前往「风险研判」生成风险矩阵。';
  closeModal();
  chatLog.push({role:'me',text:'（'+WORKFLOWS.find(x=>x.id===w).name+'）'+facts});
  chatLog.push({role:'bot',text:out});
  go('assistant');
  setTimeout(renderChat,50);
  toast('已在智能辅助中生成框架');
}

function copyDoc(){
  const t=$('#modalMask').dataset.doc||'';
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(()=>toast('已复制到剪贴板')).catch(fallbackCopy);
  }else{fallbackCopy();}
  function fallbackCopy(){
    const ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;left:-9999px';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');toast('已复制到剪贴板');}catch(_){toast('复制失败，请手动选择复制','err');}
    ta.remove();
  }
}
function downloadDoc(name){const t=$('#modalMask').dataset.doc||'';download((name||'文书')+'.txt',t);toast('已下载');}
function saveDoc(name,caseId){
  const t=$('#modalMask').dataset.doc||'';
  Store.addDoc({title:name+(caseId?'':'（草稿）'),type:name,caseId:caseId||'',content:t});
  toast('已保存到文书库');closeModal();
}
let curDocId=null;
function openDoc(id){
  const d=Store.get().documents.find(x=>x.id===id);if(!d)return;
  curDocId=id;
  const versions=Store.getDocVersions(id);
  modal('<div class="m-h"><h3>'+esc(d.title)+'</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b">'+
      '<div class="doc-preview" id="docPreview">'+esc(d.content)+'</div>'+
      '<div class="divider"></div>'+
      '<div class="section-title">'+icon('clock')+' 版本历史（'+versions.length+'）</div>'+
      '<div class="version-list" id="versionList">'+
        (versions.length?versions.map((v,i)=>'<div class="version-item '+(i===0?'current':'')+'"><div class="v-info"><b>v'+v.versionNum+'</b><span class="muted small">'+esc(v.reason)+' · '+fmtDate(v.createdAt)+'</span></div>'+
          '<div class="v-actions">'+(i>0?'<span class="tag outline" data-act="view-ver" data-id="'+v.id+'">查看</span> <span class="tag blue" data-act="restore-ver" data-id="'+v.id+'">恢复</span>':'<span class="tag green">当前版本</span>')+'</div></div>').join(''):'<div class="empty small">暂无历史版本</div>')+
      '</div>'+
    '</div>'+
    '<div class="m-f"><button class="btn" data-act="copy-doc">'+icon('copy')+' 复制</button><button class="btn" data-act="edit-doc" data-id="'+d.id+'">'+icon('edit')+' 编辑</button><button class="btn danger" data-act="del-doc" data-id="'+d.id+'">'+icon('trash')+' 删除</button></div>','760px');
  $('#modalMask').dataset.doc=d.content;
}
function viewVersion(versionId){
  const ver=Store.getDocVersions(curDocId).find(v=>v.id===versionId);if(!ver)return;
  $('#docPreview').innerHTML='<div style="background:var(--warn-soft);padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:12px">📌 查看历史版本 v'+ver.versionNum+'（'+esc(ver.reason)+' · '+fmtDate(ver.createdAt)+'）— 只读预览</div>'+esc(ver.content);
}
function restoreVersion(versionId){
  if(!confirm('确定恢复到该版本？当前内容将作为新版本保存。'))return;
  const doc=Store.restoreDocVersion(versionId);
  if(doc){toast('已恢复为 v'+Store.getDocVersions(doc.id).length+'（基于历史版本）');closeModal();openDoc(doc.id);}
  else toast('恢复失败','err');
}
function editDoc(id){
  const d=Store.get().documents.find(x=>x.id===id);if(!d)return;
  closeModal();
  modal('<div class="m-h"><h3>编辑文书</h3><button class="btn ghost sm" data-act="close-modal" style="margin-left:auto">'+icon('x')+'</button></div>'+
    '<div class="m-b"><div class="field"><label>标题</label><input class="input" id="eDocTitle" value="'+esc(d.title)+'"></div>'+
    '<div class="field"><label>内容</label><textarea class="textarea" id="eDocContent" style="min-height:300px">'+esc(d.content)+'</textarea></div></div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="save-edit-doc" data-id="'+d.id+'">'+icon('save')+' 保存（生成新版本）</button></div>','760px');
}
function saveEditDoc(id){
  const title=$('#eDocTitle').value.trim();
  const content=$('#eDocContent').value.trim();
  if(!title){toast('请填写标题','err');return;}
  Store.updateDoc(id,{title,content});
  toast('已保存为新版本');closeModal();openDoc(id);
}
document.addEventListener('click',e=>{if(e.target.closest('[data-act="del-doc"]')){const id=e.target.closest('[data-act="del-doc"]').dataset.id;Store.deleteDoc(id);closeModal();toast('已删除');renderDraft($('#content'));}});
function delSearch(id){Store.deleteSearch(id);closeModal();toast('已删除');router();}

function saveSettings(){Store.updateSettings({lawyerName:$('#setName').value.trim(),firm:$('#setFirm').value.trim()});$('#userAvatar').textContent=($('#setName').value.trim()||'律').slice(0,1);toast('已保存');}
async function saveAI(){
  const ai={enabled:$('#aiOn').checked,baseUrl:$('#aiUrl').value.trim(),apiKey:$('#aiKey').value.trim(),model:$('#aiModel').value.trim()||'gpt-4o-mini'};
  Store.updateSettings({ai});updateAIStatus();
  if(ai.enabled&&ai.baseUrl&&ai.apiKey){
    try{const r=await callAI([{role:'user',content:'ping'}]);toast('AI 连接测试成功','ok');}
    catch(err){toast('连接测试失败：'+err.message+'（已保存配置）','err');}
  }else toast('AI 配置已保存（未启用）');
}
function resetData(){if(!confirm('将清空所有数据并恢复演示数据，确认？'))return;Store.resetAll();closeModal();buildNav();router();toast('已重置为演示数据');}

/* ---------------- 认证 ---------------- */
function showAuth(){ const m=$('#authMask'); if(m) m.classList.remove('hidden'); }
function hideAuth(){ const m=$('#authMask'); if(m) m.classList.add('hidden'); }

async function startApp(needsBootstrap){
  hideAuth();
  if(needsBootstrap && Store.isAuthed()){
    try{
      const data=await Api.bootstrap();
      Store.hydrate(data);
      const c=Store.collections();
      const empty = c.cases.length===0 && c.documents.length===0 && c.searches.length===0 && c.events.length===0 &&
                    (!c.settings || (!c.settings.lawyerName && !c.settings.firm));
      if(empty){ Store.seed(); toast('已为你载入演示数据并保存到账户'); }
    }catch(e){
      toast('后端连接异常：'+e.message+'（将以本机数据继续）','err');
    }
  }
  const s=Store.get().settings;
  if(s&&s.lawyerName)$('#userAvatar').textContent=s.lawyerName.slice(0,1);
  $('#logoutBtn').style.display='';
  updateAIStatus();
  if(!location.hash)location.hash='#/dashboard'; else router();
}

function wireAuth(){
  let mode='login';
  const switchTab=()=>{
    $('#tabLogin').classList.toggle('active',mode==='login');
    $('#tabReg').classList.toggle('active',mode==='register');
    $('#authSubmit').textContent=mode==='login'?'登录':'注册并进入';
    $('#authErr').textContent='';
  };
  $('#tabLogin').addEventListener('click',()=>{mode='login';switchTab();});
  $('#tabReg').addEventListener('click',()=>{mode='register';switchTab();});
  $('#authSubmit').addEventListener('click',async()=>{
    const u=$('#authUser').value.trim(), p=$('#authPw').value.trim();
    if(!u||!p){ $('#authErr').textContent='请输入用户名和密码'; return; }
    $('#authSubmit').disabled=true;
    try{
      const r = mode==='login' ? await Api.login(u,p) : await Api.register(u,p);
      Store.setToken(r.token);
      await startApp(true);
    }catch(e){ $('#authErr').textContent=e.message; }
    finally{ $('#authSubmit').disabled=false; }
  });
  $('#authPw').addEventListener('keydown',e=>{ if(e.key==='Enter')$('#authSubmit').click(); });
  $('#authUser').addEventListener('keydown',e=>{ if(e.key==='Enter')$('#authPw').focus(); });
  $('#authOffline').addEventListener('click',e=>{ e.preventDefault(); startApp(false); });
  $('#logoutBtn').addEventListener('click',()=>{
    Store.logout(); showAuth();
    $('#authUser').value=''; $('#authPw').value='';
    $('#content').innerHTML=''; $('#logoutBtn').style.display='none';
    toast('已退出登录');
  });
}
function onUnauth(){
  showAuth();
  $('#authErr').textContent='登录已过期，请重新登录';
  $('#content').innerHTML=''; $('#logoutBtn').style.display='none';
}

/* ---------------- 共享管理 ---------------- */
let _shareSearchTimer = null;
let _shareCaseId = null;
function openShareModal(caseId){
  const cs = Store.getCase(caseId);
  if(!cs){toast('案件不存在','err');return;}
  if(cs._shared_role){toast('该案件为共享案件，无法再次共享','err');return;}
  _shareCaseId = caseId;
  modal(
    '<div class="m-h"><h3>共享案件：'+esc(cs.title)+'</h3><button class="btn ghost sm" data-act="close-modal">'+icon('x')+'</button></div>'+
    '<div class="m-b">'+
      '<div class="field"><label>搜索用户</label><input class="input" id="shareQ" placeholder="输入用户名搜索..."></div>'+
      '<div id="shareResults" class="small muted" style="margin-bottom:12px"></div>'+
      '<div class="field"><label>已共享给</label><div id="shareList" style="min-height:40px"></div></div>'+
    '</div>'+
    '<div class="m-f"><button class="btn" data-act="close-modal">关闭</button></div>'
  );
  loadShareList(caseId);
  $('#shareQ').addEventListener('input', e => {
    clearTimeout(_shareSearchTimer);
    const q = e.target.value.trim();
    if(!q){$('#shareResults').innerHTML='';return;}
    _shareSearchTimer = setTimeout(() => searchShareUser(q), 300);
  });
}
async function searchShareUser(q){
  const box = $('#shareResults');
  box.innerHTML = '<span class="muted">搜索中...</span>';
  try {
    const data = await Api.searchUsers(q);
    if(!data.users || !data.users.length){box.innerHTML='<span class="muted">未找到用户</span>';return;}
    box.innerHTML = data.users.map(u =>
      '<div class="list-item" style="padding:6px 8px"><div class="li-main"><b>'+esc(u.username)+'</b></div>'+
      '<div class="li-side"><button class="btn sm" data-act="share-add" data-uid="'+u.id+'" data-username="'+esc(u.username)+'">添加</button></div></div>'
    ).join('');
  } catch(e){
    box.innerHTML = '<span class="muted">搜索失败：'+esc(e.message)+'</span>';
  }
}
async function shareAddUser(username){
  if(!username){toast('未找到用户名','err');return;}
  const role = confirm('点击「确定」设为可编辑，点击「取消」设为只读') ? 'editor' : 'viewer';
  try {
    await Api.share(username, _shareCaseId, role);
    toast('已共享给 '+username+'（'+(role==='editor'?'可编辑':'只读')+'）');
    loadShareList(_shareCaseId);
    $('#shareResults').innerHTML='';
    $('#shareQ').value='';
  } catch(e){
    toast(e.message,'err');
  }
}
async function loadShareList(caseId){
  const box = $('#shareList');
  box.innerHTML = '<span class="muted">加载中...</span>';
  try {
    const data = await Api.getShares();
    const shares = (data.my_shares || []).filter(s => s.case_id === caseId);
    if(!shares.length){box.innerHTML='<span class="muted">尚未共享给任何人</span>';return;}
    box.innerHTML = shares.map(s =>
      '<div class="list-item" style="padding:6px 8px"><div class="li-main"><b>'+esc(s.username)+'</b>'+
        '<span class="tag '+(s.role==='editor'?'green':'amber')+'" style="margin-left:6px">'+(s.role==='editor'?'可编辑':'只读')+'</span>'+
        '<span class="small muted" style="margin-left:6px">'+esc(s.created_at)+'</span></div>'+
      '<div class="li-side"><button class="btn sm danger" data-act="unshare" data-username="'+esc(s.username)+'">取消共享</button></div></div>'
    ).join('');
  } catch(e){
    box.innerHTML = '<span class="muted">加载失败：'+esc(e.message)+'</span>';
  }
}
async function unshareUser(username){
  if(!confirm('确定取消与 '+username+' 的共享？'))return;
  try {
    await Api.unshare(_shareCaseId, username);
    toast('已取消共享');
    loadShareList(_shareCaseId);
  } catch(e){
    toast(e.message,'err');
  }
}

/* ---------------- 启动 ---------------- */
function init(){
  $('#brandLogo').innerHTML=icon('scale' in ICONS?'scale':'gavel');
  $('#authLogo').innerHTML=icon('scale' in ICONS?'scale':'gavel');
  Store.load();
  buildNav();
  // 移动端侧边栏折叠
  const menuBtn=$('#menuToggle');
  const overlay=$('#sidebarOverlay');
  if(menuBtn){
    menuBtn.addEventListener('click',()=>{
      document.querySelector('.app').classList.toggle('sidebar-open');
    });
  }
  if(overlay){
    overlay.addEventListener('click',()=>{
      document.querySelector('.app').classList.remove('sidebar-open');
    });
  }
  // 点击导航后在移动端自动收起侧边栏
  $('#nav').addEventListener('click',()=>{
    if(window.innerWidth<=760) document.querySelector('.app').classList.remove('sidebar-open');
  });
  // P0-3: 启动时拉取服务端时间（用于期限计算，失败时降级本地时间）
  if(window.Api) fetchServerTime().catch(()=>{});
  // 同步冲突提示
  if(Store.onSyncConflict){
    Store.onSyncConflict(function(info){
      const mins=Math.round(info.elapsed/60000);
      toast('数据同步提醒：本地有 '+mins+' 分钟未同步的修改，请注意多设备数据一致性','warn');
    });
  }
  // sidebar nav click
  $('#nav').addEventListener('click',e=>{const it=e.target.closest('.nav-item');if(it)go(it.dataset.route);});
  $('#nav').addEventListener('keydown',e=>{if(e.key==='Enter'){const it=e.target.closest('.nav-item');if(it)go(it.dataset.route);}});
  // global search -> simple filter on cases
  $('#globalSearch').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();if(q){
    // 搜索案件
    caseFilter.q=q;
    // 搜索文书
    const st=Store.get();
    const matchDoc=st.documents.find(d=>(d.title+d.type+d.content||'').toLowerCase().includes(q));
    const matchSkill=window.LEGAL_SKILLS.skills.find(s=>(s.cn+s.dir+s.core||'').toLowerCase().includes(q));
    if(matchDoc){go('draft');toast('找到匹配文书：'+matchDoc.title);}
    else if(matchSkill){go('skills');skillFilter='all';setTimeout(()=>openSkill(matchSkill.dir),100);}
    else{go('cases');}
  }else{caseFilter.q='';}});
  updateAIStatus();
  wireAuth();
  window.addEventListener('hashchange',router);
  window.addEventListener('wb-unauth',onUnauth);

  if(Store.isAuthed()){
    startApp(true);          // 已登录：从服务端拉取数据
  } else {
    showAuth();              // 未登录：显示登录/注册遮罩
  }
}
document.addEventListener('DOMContentLoaded',init);
})();
