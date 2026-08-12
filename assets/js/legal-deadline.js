/* ============================================================
   legal-deadline.js — 法律期限计算模块
   负责：工作日判断、节假日顺延、法定期间计算
   依据：《民事诉讼法》第82-84条、《民法典》第201-204条
   ============================================================ */
(function () {
  // 2024-2026 年法定节假日及调休（含补班日）
  // 数据来源：国务院办公厅公告（每年12月公布次年安排）
  // 注意：每年需根据国务院公告更新此数据
  const HOLIDAYS = new Set([
    // ── 2024 ──
    '2024-01-01', // 元旦
    '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13',
    '2024-02-14', '2024-02-15', '2024-02-16', '2024-02-17', // 春节
    '2024-04-04', '2024-04-05', '2024-04-06', // 清明节
    '2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04', '2024-05-05', // 劳动节
    '2024-06-08', '2024-06-09', '2024-06-10', // 端午节
    '2024-09-15', '2024-09-16', '2024-09-17', // 中秋节
    '2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04',
    '2024-10-05', '2024-10-06', '2024-10-07', // 国庆节
    // ── 2025 ──
    '2025-01-01', // 元旦
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
    '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04', // 春节
    '2025-04-04', '2025-04-05', '2025-04-06', // 清明节
    '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05', // 劳动节
    '2025-05-31', '2025-06-01', '2025-06-02', // 端午节
    '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04',
    '2025-10-05', '2025-10-06', '2025-10-07', // 国庆节（中秋合并）
    // ── 2026（预估，待国务院公告确认后更新）──
    '2026-01-01', '2026-01-02', '2026-01-03', // 元旦
    '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20',
    '2026-02-21', '2026-02-22', '2026-02-23', // 春节
    '2026-04-05', '2026-04-06', '2026-04-07', // 清明节
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05', // 劳动节
    '2026-06-19', '2026-06-20', '2026-06-21', // 端午节
    '2026-09-25', '2026-09-26', '2026-09-27', // 中秋节
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
    '2026-10-05', '2026-10-06', '2026-10-07' // 国庆节
  ]);

  // 补班日（周末但需上班的日期）
  const WORKDAYS = new Set([
    // 2024
    '2024-02-04', '2024-02-18', // 春节调休
    '2024-04-07', '2024-04-28', // 清明、劳动节调休
    '2024-09-14', '2024-09-29', // 中秋、国庆调休
    '2024-10-12',
    // 2025
    '2025-01-26', '2025-02-08', // 春节调休
    '2025-04-27', // 劳动节调休
    // 2026（预估）
    '2026-02-14', '2026-02-15', // 春节调休
    '2026-09-27', '2026-10-10' // 中秋、国庆调休
  ]);

  function toStr(d) {
    if (typeof d === 'string') return d;
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function parseDate(s) {
    if (s instanceof Date) return new Date(s);
    const parts = s.split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  function isWorkday(dateStr) {
    const s = toStr(dateStr);
    if (WORKDAYS.has(s)) return true;
    if (HOLIDAYS.has(s)) return false;
    const d = parseDate(s);
    const dow = d.getDay();
    return dow !== 0 && dow !== 6;
  }

  function isHoliday(dateStr) {
    return !isWorkday(dateStr);
  }

  // 从起始日加 N 个工作日
  function addWorkdays(startDate, days) {
    let cur = parseDate(toStr(startDate));
    let added = 0;
    while (added < days) {
      cur.setDate(cur.getDate() + 1);
      if (isWorkday(cur)) added++;
    }
    return toStr(cur);
  }

  // 法律期间计算（《民事诉讼法》第82条）
  // 期间以日/月/年计算，从次日起算
  // 期间届满日遇节假日顺延至第一个工作日
  function addLegalDays(startDate, days) {
    const start = parseDate(toStr(startDate));
    start.setDate(start.getDate() + days); // 从次日起算 N 日
    // 届满日遇节假日顺延
    while (isHoliday(start)) {
      start.setDate(start.getDate() + 1);
    }
    return toStr(start);
  }

  // 法定常见期间速查
  const LEGAL_PERIODS = {
    '答辩期': { days: 15, note: '被告收到起诉状副本之日起15日内（民诉法第128条）' },
    '举证期限': { days: 15, note: '法院指定的举证期限，不少于15日（民诉法解释第99条）' },
    '上诉期（判决）': { days: 15, note: '判决书送达之日起15日内（民诉法第171条）' },
    '上诉期（裁定）': { days: 10, note: '裁定书送达之日起10日内（民诉法第171条）' },
    '申请执行': { days: 730, note: '2年（民诉法第246条）' },
    '简易程序审限': { days: 90, note: '立案之日起3个月（民诉法第164条）' },
    '普通程序审限': { days: 180, note: '立案之日起6个月（民诉法第152条）' },
    '管辖权异议': { days: 15, note: '提交答辩状期间内提出（民诉法第130条）' },
    '再审申请': { days: 180, note: '判决/裁定生效后6个月内（民诉法第209条）' },
    '诉讼时效（一般）': { days: 1095, note: '3年（民法典第188条）' },
  };

  // 根据起始日期和法定期间名称，计算届满日
  function calcLegalPeriod(startDate, periodName) {
    const p = LEGAL_PERIODS[periodName];
    if (!p) return null;
    return {
      deadline: addLegalDays(startDate, p.days),
      note: p.note,
      name: periodName
    };
  }

  // 计算两个日期之间的工作日数
  function workdaysBetween(startStr, endStr) {
    const start = parseDate(toStr(startStr));
    const end = parseDate(toStr(endStr));
    if (start > end) return -workdaysBetween(endStr, startStr);
    let count = 0;
    const cur = new Date(start);
    while (cur < end) {
      cur.setDate(cur.getDate() + 1);
      if (isWorkday(cur)) count++;
    }
    return count;
  }

  // 获取指定日期之后的下一个工作日
  function nextWorkday(dateStr) {
    const d = parseDate(toStr(dateStr));
    d.setDate(d.getDate() + 1);
    while (!isWorkday(d)) {
      d.setDate(d.getDate() + 1);
    }
    return toStr(d);
  }

  window.LegalDeadline = {
    HOLIDAYS,
    WORKDAYS,
    isWorkday,
    isHoliday,
    addWorkdays,
    addLegalDays,
    calcLegalPeriod,
    workdaysBetween,
    nextWorkday,
    LEGAL_PERIODS
  };
})();
