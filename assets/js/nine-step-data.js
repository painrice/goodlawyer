/* ============================================================
   nine-step-data.js — 要件审判九步法数据层
   请求权基础库 / 抗辩规范库 / 步骤元数据 / AI 提示词
   ============================================================ */
(function(){

const CLAIM_BASIS_LIB = [
  {causeOfAction:'合同纠纷',law:'民法典',article:'第577条',
   content:'当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。',
   elements:['合同成立并生效','对方存在违约行为','我方遭受损失','违约行为与损失之间存在因果关系']},
  {causeOfAction:'合同纠纷',law:'民法典',article:'第509条',
   content:'当事人应当按照约定全面履行自己的义务。当事人应当遵循诚信原则，根据合同的性质、目的和交易习惯履行通知、协助、保密等义务。',
   elements:['合同有效存在','义务内容明确','未履行或履行不符合约定']},
  {causeOfAction:'侵权责任纠纷',law:'民法典',article:'第1165条',
   content:'行为人因过错侵害他人民事权益造成损害的，应当承担侵权责任。依照法律规定推定行为人有过错，其不能证明自己没有过错的，应当承担侵权责任。',
   elements:['侵权行为','损害结果','因果关系','过错']},
  {causeOfAction:'不当得利纠纷',law:'民法典',article:'第985条',
   content:'得利人没有法律根据取得不当利益的，受损失的人可以请求得利人返还取得的利益。',
   elements:['一方获得利益','他方受到损失','获利没有法律根据','获利与损失之间有因果关系']},
  {causeOfAction:'民间借贷纠纷',law:'民法典',article:'第667条',
   content:'借款合同是借款人向贷款人借款，到期返还借款并支付利息的合同。',
   elements:['借贷合意','款项交付','还款期限届满','利息约定（如有）']},
  {causeOfAction:'劳动争议',law:'劳动合同法',article:'第47条',
   content:'经济补偿按劳动者在本单位工作的年限，每满一年支付一个月工资的标准向劳动者支付。六个月以上不满一年的，按一年计算；不满六个月的，向劳动者支付半个月工资的经济补偿。',
   elements:['劳动关系存续','劳动合同解除或终止','工作年限','工资标准']},
  {causeOfAction:'物权保护纠纷',law:'民法典',article:'第235条',
   content:'无权占有不动产或者动产的，权利人可以请求返还原物。',
   elements:['权利人对物享有合法权利','被请求人无权占有','原物仍然存在']},
  {causeOfAction:'离婚纠纷',law:'民法典',article:'第1079条',
   content:'夫妻一方要求离婚的，可以由有关组织进行调解或者直接向人民法院提起离婚诉讼。人民法院审理离婚案件，应当进行调解；如果感情确已破裂，调解无效的，应当准予离婚。',
   elements:['婚姻关系合法有效','感情确已破裂','调解无效']},
];

const DEFENSE_BASIS_LIB = [
  {defenseType:'权利消灭抗辩',law:'民法典',article:'第557条',
   content:'有下列情形之一的，债权债务终止：（一）债务已经履行；（二）债务相互抵销；（三）债务人依法将标的物提存；（四）债权人免除债务…',
   elements:['债务已履行/抵销/提存/免除','债权债务关系终止']},
  {defenseType:'权利消灭抗辩',law:'民法典',article:'第192条',
   content:'诉讼时效期间届满的，义务人可以提出不履行义务的抗辩。',
   elements:['诉讼时效期间已届满','义务人提出时效抗辩']},
  {defenseType:'权利妨碍抗辩',law:'民法典',article:'第143条',
   content:'具备下列条件的民事法律行为有效：（一）行为人具有相应的民事行为能力；（二）意思表示真实；（三）不违反法律、行政法规的强制性规定，不违背公序良俗。',
   elements:['行为人不具备相应行为能力','意思表示不真实','违反法律强制性规定或公序良俗']},
  {defenseType:'权利妨碍抗辩',law:'民法典',article:'第153条',
   content:'违反法律、行政法规的强制性规定的民事法律行为无效。但是，该强制性规定不导致该民事法律行为无效的除外。违背公序良俗的民事法律行为无效。',
   elements:['合同违反法律强制性规定','合同违背公序良俗']},
  {defenseType:'权利排除抗辩',law:'民法典',article:'第181条',
   content:'因正当防卫造成损害的，不承担民事责任。正当防卫超过必要的限度，造成不应有的损害的，正当防卫人应当承担适当的民事责任。',
   elements:['存在不法侵害','防卫行为针对侵害人','防卫未超过必要限度']},
  {defenseType:'权利排除抗辩',law:'民法典',article:'第180条',
   content:'因不可抗力不能履行民事义务的，不承担民事责任。法律另有规定的，依照其规定。不可抗力是不能预见、不能避免且不能克服的客观情况。',
   elements:['存在不可抗力事件','不可抗力导致不能履行义务','不可抗力不能预见、避免、克服']},
];

const STEPS = [
  {num:1, key:'import', name:'导入材料', short:'导入',
   desc:'确认案件基本信息、当事人、证据材料是否完整。',
   fields:null},
  {num:2, key:'claims', name:'固定权利请求', short:'请求',
   desc:'明确原告/申请人的具体诉讼请求，包括请求类型、金额和法律依据。',
   fields:[
     {key:'type',label:'请求类型',type:'select',options:['金钱给付','行为履行','确认之诉','变更之诉','其他']},
     {key:'description',label:'请求内容',type:'input'},
     {key:'amount',label:'金额（元）',type:'number'},
     {key:'basis',label:'法律依据',type:'input'},
   ]},
  {num:3, key:'claimBasis', name:'确定基础规范', short:'基础',
   desc:'确定支持权利请求的请求权基础规范，列出构成要件。',
   fields:[
     {key:'causeOfAction',label:'案由',type:'select',options:['合同纠纷','侵权责任纠纷','不当得利纠纷','民间借贷纠纷','劳动争议','物权保护纠纷','离婚纠纷','其他']},
     {key:'law',label:'法律',type:'input'},
     {key:'article',label:'条文',type:'input'},
     {key:'content',label:'条文内容',type:'textarea'},
     {key:'elements',label:'构成要件（每行一个）',type:'textarea'},
   ]},
  {num:4, key:'defenseBasis', name:'寻找抗辩规范', short:'抗辩',
   desc:'分析对方可能提出的抗辩规范，包括抗辩类型和法律依据。',
   fields:[
     {key:'party',label:'抗辩方',type:'select',options:['被告','原告']},
     {key:'defenseType',label:'抗辩类型',type:'select',options:['权利消灭抗辩','权利妨碍抗辩','权利排除抗辩','其他']},
     {key:'law',label:'法律',type:'input'},
     {key:'article',label:'条文',type:'input'},
     {key:'content',label:'条文内容',type:'textarea'},
   ]},
  {num:5, key:'elements', name:'拆解要件事实', short:'要件',
   desc:'将法律规范的构成要件逐一拆解，对应案件事实和证据。',
   fields:[
     {key:'category',label:'要件类别',type:'input'},
     {key:'element',label:'具体要件',type:'input'},
     {key:'facts',label:'对应事实',type:'textarea'},
     {key:'status',label:'证明状态',type:'select',options:['已证明','未证明','有争议']},
   ]},
  {num:6, key:'disputes', name:'归纳争点', short:'争点',
   desc:'归纳双方的争议焦点，明确事实争点、法律争点和证据争点。',
   fields:[
     {key:'type',label:'争点类型',type:'select',options:['事实争点','法律争点','证据争点']},
     {key:'issue',label:'争点内容',type:'input'},
     {key:'plaintiffPos',label:'原告/申请人立场',type:'input'},
     {key:'defendantPos',label:'被告/被申请人立场',type:'input'},
     {key:'keyEvidence',label:'关键证据',type:'input'},
   ]},
  {num:7, key:'burdenOfProof', name:'分配证明责任', short:'举证',
   desc:'按照「谁主张谁举证」原则，明确各待证事实的举证责任方。',
   fields:[
     {key:'fact',label:'待证事实',type:'input'},
     {key:'party',label:'责任方',type:'select',options:['原告','被告']},
     {key:'evidenceRequired',label:'所需证据',type:'input'},
     {key:'status',label:'举证状态',type:'select',options:['已举证','未举证','举证不足']},
   ]},
  {num:8, key:'factFindings', name:'事实认定', short:'认定',
   desc:'根据证据情况，对各待证事实进行认定。',
   fields:[
     {key:'fact',label:'事实',type:'input'},
     {key:'determination',label:'认定结论',type:'select',options:['认定','不认定','待认定']},
     {key:'basis',label:'认定依据',type:'input'},
     {key:'evidenceSummary',label:'证据综述',type:'textarea'},
   ]},
  {num:9, key:'lawApplication', name:'法律适用', short:'适用',
   desc:'判断各要件是否满足，得出法律适用结论，可生成文书初稿。',
   fields:[
     {key:'element',label:'要件',type:'input'},
     {key:'satisfied',label:'满足度',type:'select',options:['满足','不满足','部分满足']},
     {key:'reasoning',label:'推理说明',type:'textarea'},
   ]},
];

const AI_PROMPTS = {
  2: (cs)=>`你是资深中国民事律师。根据以下案件信息，固定权利请求。
案件：${cs.title}
类型：${cs.type}
当事人：${(cs.parties||[]).map(p=>p.role+' '+p.name).join('；')}
背景：${cs.background||'无'}

请输出 JSON 数组：[{"type":"请求类型(金钱给付/行为履行/确认之诉/变更之诉)","description":"请求内容","amount":金额数字,"basis":"法律依据"}]
只输出 JSON，不要其他内容。`,

  3: (cs,ns)=>`你是资深中国民事律师。根据以下案件信息，确定请求权基础规范。
案件：${cs.title}
类型：${cs.type}
当事人：${(cs.parties||[]).map(p=>p.role+' '+p.name).join('；')}
背景：${cs.background||'无'}
权利请求：${(ns.claims||[]).map(c=>c.description).join('；')||'未填'}

请输出 JSON 数组：[{"causeOfAction":"案由","law":"法律名称","article":"条文号","content":"条文内容","elements":["要件1","要件2"]}]
要求：列出所有可能适用的请求权基础，按优先顺序排列。只输出 JSON。`,

  4: (cs,ns)=>`你是资深中国民事律师。根据以下案件信息，分析对方可能提出的抗辩规范。
案件：${cs.title}
类型：${cs.type}
背景：${cs.background||'无'}
权利请求：${(ns.claims||[]).map(c=>c.description).join('；')||'未填'}
请求权基础：${(ns.claimBasis||[]).map(b=>b.law+b.article).join('；')||'未填'}

请输出 JSON 数组：[{"party":"被告/原告","defenseType":"权利消灭抗辩/权利妨碍抗辩/权利排除抗辩","law":"法律","article":"条文号","content":"条文内容"}]
只输出 JSON。`,

  5: (cs,ns)=>`你是资深中国民事律师。根据以下请求权基础规范，拆解构成要件。
案件：${cs.title}
请求权基础：${(ns.claimBasis||[]).map(b=>b.law+b.article+'：'+(b.elements||'')).join('\n')||'未填'}

请输出 JSON 数组：[{"category":"要件类别","element":"具体要件","facts":"对应本案事实（如有）","status":"已证明/未证明/有争议"}]
将每个请求权基础的构成要件逐一拆解，对应本案事实。只输出 JSON。`,

  6: (cs,ns)=>`你是资深中国民事律师。根据以下案件分析信息，归纳争议焦点。
案件：${cs.title}
背景：${cs.background||'无'}
权利请求：${(ns.claims||[]).map(c=>c.description).join('；')||'未填'}
要件事实：${(ns.elements||[]).map(e=>e.element+'：'+e.facts).join('；')||'未填'}

请输出 JSON 数组：[{"type":"事实争点/法律争点/证据争点","issue":"争点内容","plaintiffPos":"原告立场","defendantPos":"被告立场","keyEvidence":"关键证据"}]
只输出 JSON。`,

  7: (cs,ns)=>`你是资深中国民事律师。根据以下要件事实，分配证明责任。
案件：${cs.title}
要件事实：${(ns.elements||[]).map(e=>e.element+'('+e.status+')').join('；')||'未填'}
争议焦点：${(ns.disputes||[]).map(d=>d.issue).join('；')||'未填'}

请输出 JSON 数组：[{"fact":"待证事实","party":"原告/被告","evidenceRequired":"所需证据","status":"已举证/未举证/举证不足"}]
按照「谁主张谁举证」原则分配。只输出 JSON。`,

  8: (cs,ns)=>`你是资深中国民事律师。根据以下证据和事实情况，进行事实认定。
案件：${cs.title}
证据清单：${(cs.evidence||[]).map(e=>e.name+'('+e.type+')').join('；')||'无'}
待证事实：${(ns.burdenOfProof||[]).map(b=>b.fact+'('+b.party+' '+b.status+')').join('；')||'未填'}

请输出 JSON 数组：[{"fact":"事实","determination":"认定/不认定/待认定","basis":"认定依据","evidenceSummary":"证据综述"}]
只输出 JSON。`,

  9: (cs,ns)=>`你是资深中国民事律师。根据以下分析结果，进行法律适用判断。
案件：${cs.title}
请求权基础：${(ns.claimBasis||[]).map(b=>b.law+b.article).join('；')||'未填'}
要件拆解：${(ns.elements||[]).map(e=>e.element+'('+e.status+')').join('；')||'未填'}
事实认定：${(ns.factFindings||[]).map(f=>f.fact+'('+f.determination+')').join('；')||'未填'}

请输出 JSON 数组：[{"element":"要件","satisfied":"满足/不满足/部分满足","reasoning":"推理说明"}]
对每个要件逐一判断是否满足。只输出 JSON。`,
};

function defaultNineStep(){
  return {currentStep:1,completedSteps:[],claims:[],claimBasis:[],defenseBasis:[],elements:[],disputes:[],burdenOfProof:[],factFindings:[],lawApplication:[],draftContent:''};
}

window.NineStepData = {
  CLAIM_BASIS_LIB,
  DEFENSE_BASIS_LIB,
  STEPS,
  AI_PROMPTS,
  defaultNineStep,
};

})();
