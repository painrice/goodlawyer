// 数据源：GitHub THUYRan/Legal-Skills-Chinese（38 原子 + 2 复合技能，按 7 大类组织）
// 法域：中国大陆成文法。AI 输出仅供参考，不构成法律意见。
window.LEGAL_SKILLS = {
 "cats": {
  "01": {
   "name": "信息检索",
   "en": "Retrieval",
   "desc": "定位法条、案例与法律信息，为后续分析提供权威依据。"
  },
  "02": {
   "name": "事实与要素处理",
   "en": "Facts & Elements",
   "desc": "从材料中提取事实、结构化要件、识别争议焦点并评估证据。"
  },
  "03": {
   "name": "法律解释",
   "en": "Interpretation",
   "desc": "运用体系、目的与规范含义等方法解释法律规范。"
  },
  "04": {
   "name": "法律推理",
   "en": "Reasoning",
   "desc": "演绎、归纳、类比、溯因与反事实等推理，连接事实与规范。"
  },
  "05": {
   "name": "论证组织与评估",
   "en": "Argumentation",
   "desc": "构建论证链、评估强度、挂钩证据并排序战略风险。"
  },
  "06": {
   "name": "风险评估与价值判断",
   "en": "Risk & Value",
   "desc": "识别履约/合规风险、评估论证价值并预测裁判走向。"
  },
  "07": {
   "name": "文书与事务管理",
   "en": "Documents & Ops",
   "desc": "文书格式、摘要、生成、案件生命周期与期限管理。"
  }
 },
 "skills": [
  {
   "dir": "other-legal-retrieval",
   "cn": "其他法律信息检索",
   "cat": "01",
   "core": "检索法律条文与典型案例之外的辅助性法律信息",
   "desc": "当智能体需要检索法律条文、司法解释、典型案例之外的辅助性法律信息时触发此技能。具体包括但不限于：立法背景资料（草案说明、审议报告、立法机关答记者问）、监管案例与行政处罚决定、地方指导意见与会议纪要、部门规章的起草说明与政策解读、行业标准与技术规范、法律实施情况报告、人大常委会执法检查报告、白皮书与政策文件、学术通说与权威教材观点、域外法律比较资料等。当用户问题涉及'为什么这样规定''立法目的是什么''实践中监管部门怎么处理''地方上有什么特殊规定''行业惯例是什么'等语境时，…",
   "compound": false
  },
  {
   "dir": "case-retrieval",
   "cn": "案例检索",
   "cat": "01",
   "core": "查找与当前法律问题相关的类似案例和相关判决",
   "desc": "当用户需要查找与当前法律问题相关的类似案例、相关判决、裁判规则时触发此技能。典型触发场景包括：用户明确要求查找类似案例或判例；需要通过既往裁判支撑法律论点；进行案件预判需要参考同类判决；撰写法律文书需要引用权威案例；分析某一法律问题的司法实践趋势；对比不同法院、不同时期对同一问题的裁判立场。关键词包括但不限于：类似案例、相关判决、判例检索、裁判规则、同类案件、指导性案例、典型案例、司法观点、裁判要旨等。",
   "compound": false
  },
  {
   "dir": "legal-concept-comprehension",
   "cn": "法律概念理解",
   "cat": "01",
   "core": "精准理解法律概念的内涵、外延、构成要件及法律效果，区分不同语境下的含义差异",
   "desc": "什么是XX\"\"如何理解XX\"\n  - 用户要求比较两个法律概念的异同（如\"不当得利与无因管理的区别\"）\n  - 用户给出具体事实，询问是否构成某法律概念（如\"甲误将钱转给乙，是否构成不当得利？",
   "compound": false
  },
  {
   "dir": "legal-norm-validity-check",
   "cn": "法条效力核验",
   "cat": "01",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "legal-article-retrieval",
   "cn": "法条检索",
   "cat": "01",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "dispute-issue-identification",
   "cn": "争议焦点识别",
   "cat": "02",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "legal-element-extraction",
   "cn": "法律要件提取",
   "cat": "02",
   "core": "从非结构化案件叙述中提取法律相关事实，按类型归类，对应到法律构成要件",
   "desc": "客观事实\"\"主观判断\"和\"法律评价\"\n  - 用户要求将提取的事实对应到特定法律关系的构成要件\n  - 用户要求整理案件时间轴或制作事实梳理表\n  - 用户要求将生活语言转化为法律语言（如\"他一直拖着不还\"→\"履行期限届满后未履行",
   "compound": false
  },
  {
   "dir": "structured-element-extraction",
   "cn": "结构化要素提取",
   "cat": "02",
   "core": "将法律问题分解为完整、互斥、可验证的要素清单",
   "desc": "列出要素\"\"逐项分析\"\"检查是否遗漏\"\n  本技能的核心目标是：确保要素提取完整、无遗漏，形成可追溯、可验证的结构化清单，然后才允许进入下一阶段推理。它是法律分析链条中的\"质量闸门",
   "compound": false
  },
  {
   "dir": "evidence-evaluation",
   "cn": "证据评估",
   "cat": "02",
   "core": "评估证据的真实性、合法性、关联性与证明力",
   "desc": "三性",
   "compound": false
  },
  {
   "dir": "systematic-interpretation",
   "cn": "体系解释",
   "cat": "03",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "legal-interpretation-argument",
   "cn": "法律解释论证",
   "cat": "03",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "teleological-interpretation",
   "cn": "目的解释",
   "cat": "03",
   "core": "",
   "desc": "合理\"\"正当\"\"必要\"\"重大",
   "compound": false
  },
  {
   "dir": "Normative-Meaning-Argumentation",
   "cn": "规范含义论证",
   "cat": "03",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "conflict-resolution",
   "cn": "冲突解决（竞合/矛盾）",
   "cat": "04",
   "core": "处理法条竞合、证据矛盾、争点优先级排序",
   "desc": "当AI智能体在法律推理过程中遇到以下情形时触发本技能：(1)多个法律条文均可适用于同一事实（法条竞合）；(2)不同证据之间存在矛盾或不一致（证据矛盾）；(3)案件存在多个争议焦点需要确定审理或分析顺序（争点优先级排序）；(4)不同法律渊源（法律、法规、司法解释、地方性法规等）对同一问题作出不同规定（法源冲突）；(5)当事人主张与法律适用之间存在张力需要协调。本技能是法律推理的核心枢纽能力，几乎所有复杂法律分析都会涉及某种形式的冲突解决。",
   "compound": false
  },
  {
   "dir": "counterfactual-reasoning",
   "cn": "反事实推理",
   "cat": "04",
   "core": "",
   "desc": "当需要评估'如果某一事实/行为/条件不存在或发生改变，法律结果将如何不同'时触发此技能。典型触发场景包括：因果关系认定（若无该行为，损害是否仍会发生）、过错与责任比例划分、损害赔偿范围确定、合同违约损失计算、行政行为合法性假设检验、刑事因果关系中断判断、立法影响评估等。核心方法是构建一个与现实世界仅在目标变量上不同的'反事实世界'，比较两个世界的结果差异，从而得出目标变量对结果的贡献程度。",
   "compound": false
  },
  {
   "dir": "inductive-reasoning",
   "cn": "归纳推理",
   "cat": "04",
   "core": "从具体案例中提炼、抽象出一般性法律规则或裁判规则",
   "desc": "当需要从一个或多个具体案例、判决、事实模式中提炼、总结出一般性法律规则、裁判规则或法律原则时，触发此技能。典型触发场景包括：用户要求从系列案例中归纳裁判要旨、从个案中提炼可推广的法律命题、从多个事实模式中识别共同法律规则、构建类案检索的裁判规则摘要、以及从实务判例中总结司法适用标准。",
   "compound": false
  },
  {
   "dir": "formal-legal-consequence",
   "cn": "形式法律后果",
   "cat": "04",
   "core": "",
   "desc": "我能获得多少赔偿\"\"对方要承担什么责任\"\n  - 用户询问\"这个行为会判几年\"\"罚款多少",
   "compound": false
  },
  {
   "dir": "Legal-Abductive-Reasoning",
   "cn": "法律溯因推理",
   "cat": "04",
   "core": "",
   "desc": "提出可能的法律解释\"、\"生成辩护/起诉假设\"、\"评估证据的多种解读\"或\"基于不完整事实推断最佳解释",
   "compound": false
  },
  {
   "dir": "deductive-reasoning",
   "cn": "演绎推理",
   "cat": "04",
   "core": "",
   "desc": "分析案件逻辑\"、\"验证法律推理\"、\"提取三段论\"、\"梳理案件事实与法条的关系\"或\"判断法律论证的有效性",
   "compound": false
  },
  {
   "dir": "analogical-reasoning",
   "cn": "类比推理",
   "cat": "04",
   "core": "",
   "desc": "参照\"\"比照\"\"类推适用\"某一规范或案例；\n  4. 在法律论证中需要以\"相似案件相似处理",
   "compound": false
  },
  {
   "dir": "strategic-risk-prioritization",
   "cn": "战略风险优先级排序",
   "cat": "05",
   "core": "",
   "desc": "当法律分析中存在多个可能的结论、风险点或争议焦点时，需要对这些风险按照发生概率和影响程度进行系统化排序，以帮助决策者聚焦最关键的风险并合理分配资源。该技能在以下场景触发：(1)法律尽职调查中发现多项合规风险需要排序；(2)诉讼策略制定中需要评估多个不利结论的可能性与后果；(3)交易结构设计中需要识别并排列关键法律障碍；(4)合同审查中发现多个风险条款需要确定修改优先级；(5)监管合规评估中需要对多项违规风险进行分级管理；(6)任何需要在有限资源下对法律风险进行战略性取舍的场景…",
   "compound": false
  },
  {
   "dir": "argument-strength-evaluation",
   "cn": "论证强度评估",
   "cat": "05",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "argument-chain-construction",
   "cn": "论证链构建",
   "cat": "05",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "evidence-argument-chain",
   "cn": "证据-论证链",
   "cat": "05",
   "core": "将证据与论证主张进行系统性对应挂钩，构建完整的证据-主张映射关系",
   "desc": "主张→要件→证据→证明力评估",
   "compound": false
  },
  {
   "dir": "dispute-and-performance-risk",
   "cn": "争议与履约风险",
   "cat": "06",
   "core": "",
   "desc": "是否会产生法律纠纷\"和\"是否存在违约风险",
   "compound": false
  },
  {
   "dir": "internal-compliance-risk-identification",
   "cn": "内部合规风险识别",
   "cat": "06",
   "core": "从制度体系、业务流程、数据隐私三个维度识别企业内部合规缺口",
   "desc": "从制度体系、业务流程、数据隐私三个维度识别企业内部合规缺口",
   "compound": false
  },
  {
   "dir": "judicial-value-judgment",
   "cn": "司法价值判断",
   "cat": "06",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "legal-judgment-prediction",
   "cn": "法律判决预测（复合）",
   "cat": "06",
   "core": "",
   "desc": "",
   "compound": true
  },
  {
   "dir": "legal-risk-assessment",
   "cn": "法律风险评估",
   "cat": "06",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "administrative-value-judgment",
   "cn": "行政价值判断",
   "cat": "06",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "multi-document-summarization",
   "cn": "多文档综合摘要",
   "cat": "07",
   "core": "对多份相关文档进行交叉分析，提取共性、识别冲突、生成综合结论",
   "desc": "对多份相关文档进行交叉分析，提取共性、识别冲突、生成综合结论",
   "compound": false
  },
  {
   "dir": "trial-scheduling-and-deadline-monitoring",
   "cn": "庭审排期与期限监控",
   "cat": "07",
   "core": "",
   "desc": "上诉期限\"\"证据提交期限\"\"送达期限\"\"保全期限",
   "compound": false
  },
  {
   "dir": "case-lifecycle-planning",
   "cn": "案件生命周期规划",
   "cat": "07",
   "core": "",
   "desc": "案件准备\"\"案件准备规划\"\"案件准备时间线\"\"规划案件准备节奏\"\"排开庭",
   "compound": false
  },
  {
   "dir": "legal-document-summarization",
   "cn": "法律文书摘要",
   "cat": "07",
   "core": "对各类法律文书进行类型识别、要素提取、逻辑梳理和结构化输出",
   "desc": "对各类法律文书进行类型识别、要素提取、逻辑梳理和结构化输出",
   "compound": false
  },
  {
   "dir": "legal-document-formatting",
   "cn": "法律文书格式规范",
   "cat": "07",
   "core": "",
   "desc": "起草判决书\"、\"生成裁判文书\"、\"写民事判决书\"、\"写刑事判决书\"、\"根据案卷写文书",
   "compound": false
  },
  {
   "dir": "legal-terminology",
   "cn": "法律术语规范",
   "cat": "07",
   "core": "",
   "desc": "",
   "compound": false
  },
  {
   "dir": "judgment-document-generation",
   "cn": "裁判文书生成（复合）",
   "cat": "07",
   "core": "",
   "desc": "",
   "compound": true
  },
  {
   "dir": "billing-and-litigation-budget",
   "cn": "费用与诉讼预算",
   "cat": "07",
   "core": "管理律师工时、专家费用、调查费用，编制与监控诉讼预算，确保诉讼成本可控",
   "desc": "工作小时\"\"专家费用\"\"调查费用\"\"办案成本\"\"工时单\"\"费用单\"\"预算\"\"成本控制",
   "compound": false
  }
 ]
};
