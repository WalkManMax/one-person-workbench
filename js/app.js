/* ===== 一人公司工作台 · 可交互逻辑（数据持久化 + CRUD + 渲染） ===== */
/* 数据存 localStorage，刷新不丢；支持 JSON 导出导入备份 */

(function () {
'use strict';

// ===== 配置 =====
const KEY = 'wb_workbench_v2';
const TODAY = '2026-08-26'; // 演示用今日
const STATUS_COLORS = {
  '在岗': { fg: '#34A853', bg: '#E8F5E9' },
  '出海': { fg: '#0066CC', bg: '#E5F0FA' },
  '出差': { fg: '#FF9500', bg: '#FFF4E5' },
  '休假': { fg: '#AF52DE', bg: '#F3E8FD' },
  '值班': { fg: '#5856D6', bg: '#ECE8FE' },
  '公休': { fg: '#AF52DE', bg: '#F3E8FD' },
  '请假': { fg: '#FF3B30', bg: '#FFF0F0' },
};
const STATUS_LIST = ['在岗', '出海', '出差', '休假', '值班'];
const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

// ===== 默认示例数据（含逾期：今日 8/26 未打卡） =====
const DEFAULTS = {
  attendance: [
    { id: 'a1', date: '2026-08-25', status: '在岗', summary: '完成移动端适配设计，同步整理考勤导出字段', reflection: '进度符合预期，明天继续完善交互逻辑', ts: 1 },
    { id: 'a2', date: '2026-08-24', status: '出差', summary: '外出对接供应链客户，晚上补充行业资讯整理', reflection: '客户反馈积极，下周跟进合同签订', ts: 2 },
    { id: 'a3', date: '2026-08-23', status: '公休', summary: '休息日 · 整理下周工作计划', reflection: '合理休息，保持节奏', ts: 3 },
    { id: 'a4', date: '2026-08-22', status: '在岗', summary: '完成资讯模块筛选交互稿，晚上力量训练45分钟', reflection: '效率不错，注意护眼', ts: 4 },
  ],
  news: [
    { id: 'n1', category: '大模型', title: 'GPT-5 正式发布，多模态推理能力大幅提升', desc: 'OpenAI 发布 GPT-5，支持原生图像理解、视频时序推理与工具调用，在 MMLU 基准测试中达到 92.3%。', source: 'AI前线', time: '2小时前', starred: false },
    { id: 'n2', category: '开源', title: 'Llama 4 登顶开源大模型榜单', desc: 'Meta 发布 Llama 4 系列，含 405B 参数旗舰版，在 HellaSwag 与 GSM8K 基准上超越 GPT-4o。', source: '开源中国', time: '5小时前', starred: false },
    { id: 'n3', category: '应用落地', title: 'AI Agent 企业级应用落地率达 67%', desc: '最新调研显示，500 强企业中 67% 已部署 AI Agent，客服与研发为主要落地场景。', source: '量子位', time: '8小时前', starred: false },
  ],
  hotlist: [
    { id: 'h1', title: 'AI生成的短视频登上热搜第一', heat: 982, picked: false },
    { id: 'h2', title: '国产AI助手用户量突破1亿', heat: 756, picked: false },
    { id: 'h3', title: 'AI+非遗手工艺短视频走红', heat: 634, picked: false },
    { id: 'h4', title: 'AI面试官引发求职者热议', heat: 421, picked: false },
    { id: 'h5', title: '大模型生成内容版权归属讨论', heat: 298, picked: false },
  ],
  topics: [
    { id: 't1', title: 'AI 生成短视频如何改变创作生态', angle: '工具对比 + 创作者访谈 + 效率提升数据', tag: '高热度', adopted: false },
    { id: 't2', title: 'AI + 非遗：技术与传统的碰撞', angle: '手艺人故事 + AI 辅助流程演示', tag: '上升趋势', adopted: false },
    { id: 't3', title: 'AI 面试官：公平还是筛选陷阱', angle: '求职者体验 + HR 视角 + 技术局限分析', tag: '社会议题', adopted: false },
  ],
  fitness: {
    water: { cur: 6, target: 8 },
    week: [
      { day: '一', done: true },
      { day: '二', done: true },
      { day: '三', done: true },
      { day: '四', done: true },
      { day: '五', done: false, today: true },
      { day: '六', done: false },
      { day: '日', done: false },
    ],
    exercises: [
      { id: 'e1', name: '哑铃卧推', sets: '4组 × 12次' },
      { id: 'e2', name: '上斜哑铃推举', sets: '3组 × 10次' },
      { id: 'e3', name: '哑铃侧平举', sets: '3组 × 15次' },
    ],
    kcal: 320,
    pushOn: true,
  },
  newsFilter: '全部',
};

// 模拟资讯池（刷新/添加时随机抽取）
const NEWS_POOL = [
  { category: '大模型', title: 'Claude 4 发布，上下文窗口扩展至 500 万 token', desc: 'Anthropic 推出 Claude 4，长文档理解与代码生成能力显著提升。', source: '机器之心' },
  { category: '开源', title: '通义千问开源 Qwen3-235B，中文榜单登顶', desc: '阿里开源 Qwen3 旗舰版，在 C-Eval 与 CMMLU 上领先同参数级模型。', source: '开源中国' },
  { category: '应用落地', title: '字节豆包月活破 1.2 亿，企业版上线', desc: '豆包 App 月活用户达 1.2 亿，同步发布企业版接入飞书生态。', source: '36氪' },
  { category: '大模型', title: 'Gemini 2.0 原生视频生成能力开放', desc: 'Google 开放 Gemini 2.0 视频生成接口，支持文本直接生成 60s 短片。', source: 'AI前线' },
  { category: '应用落地', title: 'AI 编程助手 Cursor 估值破 300 亿', desc: 'Cursor 完成 D 轮融资，企业用户数突破 50 万。', source: '量子位' },
  { category: '开源', title: 'DeepSeek-V3 开源，训练成本仅 557 万美元', desc: 'DeepSeek 开源 V3 模型权重，性能对标 GPT-4o 且训练成本极低。', source: '机器之心' },
];
const NEWS_TIMES = ['10分钟前', '30分钟前', '1小时前', '3小时前', '6小时前', '12小时前'];

// 模拟热榜池
const HOT_POOL = [
  'AI 短剧生成工具一键出片', '国产 Sora 类视频模型开放内测', 'AI 主播登上带货榜单前三',
  '大模型写网文引发版权争议', 'AI 数字人直播带货监管新规', 'AI 一键生成 PPT 工具走红',
  '语音克隆技术引发安全担忧', 'AI 出题改卷进入中小学课堂',
];

// ===== 存储 =====
let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    // 字段补全
    if (!data.attendance) data.attendance = [];
    if (!data.news) data.news = [];
    if (!data.hotlist) data.hotlist = [];
    if (!data.topics) data.topics = [];
    if (!data.fitness) data.fitness = structuredClone(DEFAULTS.fitness);
    if (!data.newsFilter) data.newsFilter = '全部';
    return data;
  } catch (e) {
    return structuredClone(DEFAULTS);
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(DB));
}
function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// ===== 工具：Toast / 振动 =====
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 1800);
}
function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

// ===== 模态框 =====
function openModal(title, bodyHTML, onSave) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('hidden');
  // 清理上次的动态按钮（如删除按钮）
  document.querySelectorAll('.modal-footer .btn-danger').forEach(b => b.remove());
  const saveBtn = document.getElementById('modal-save');
  saveBtn.onclick = () => { if (onSave() !== false) closeModal(); };
  setTimeout(() => {
    const firstInput = overlay.querySelector('input, textarea, select');
    if (firstInput) firstInput.focus();
  }, 100);
}
function closeModal(e) {
  if (e && e.target.id !== 'modal-overlay' && e.type === 'click') return;
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ===== 考勤 =====
function renderAttendance() {
  // 统计
  const stats = { '在岗': 0, '出海': 0, '出差': 0, '休假': 0, '值班': 0 };
  DB.attendance.forEach(r => { if (stats[r.status] !== undefined) stats[r.status]++; });
  const statConfig = [
    { key: '在岗', label: '本月在岗', color: '#0066CC' },
    { key: '休假', label: '本月休假', color: '#AF52DE' },
    { key: '出差', label: '本月出差', color: '#FF9500' },
    { key: '值班', label: '本月值班', color: '#5856D6' },
  ];
  document.getElementById('attendance-stats').innerHTML = statConfig.map(s =>
    `<div class="stat-card"><span class="stat-value" style="color:${s.color}">${stats[s.key]}天</span><span class="stat-label">${s.label}</span></div>`
  ).join('');

  // 今日状态胶囊
  const todayRecord = DB.attendance.find(r => r.date === TODAY);
  const todayStatus = todayRecord ? todayRecord.status : null;
  document.getElementById('attendance-status-pills').innerHTML = STATUS_LIST.map(s =>
    `<button class="pill ${todayStatus === s ? 'selected' : ''}" onclick="setTodayStatus('${s}')">${s}</button>`
  ).join('');

  // 今日待办横幅
  const banner = document.getElementById('attendance-today-banner');
  if (!todayRecord) {
    banner.className = 'today-banner warn';
    banner.innerHTML = `<span>今日（${TODAY}）尚未打卡</span><button class="banner-btn" onclick="openAttendanceForm()">立即登记</button>`;
  } else if (!todayRecord.summary) {
    banner.className = 'today-banner warn';
    banner.innerHTML = `<span>今日已打卡但未填写工作小结</span><button class="banner-btn" onclick="editAttendance('${todayRecord.id}')">补填</button>`;
  } else {
    banner.className = 'today-banner ok';
    banner.innerHTML = `<span>今日已打卡 · ${todayRecord.status}</span>`;
  }

  // 记录列表
  const list = document.getElementById('attendance-list');
  if (DB.attendance.length === 0) {
    list.innerHTML = '<div class="empty">暂无记录，点击「添加今日记录」开始</div>';
    return;
  }
  const sorted = [...DB.attendance].sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
  list.innerHTML = sorted.map(r => {
    const c = STATUS_COLORS[r.status] || STATUS_COLORS['在岗'];
    return `<div class="card record-card" onclick="editAttendance('${r.id}')">
      <div class="record-row">
        <span class="record-date">${formatDate(r.date)}</span>
        <span class="tag" style="background:${c.bg};color:${c.fg}">${r.status}</span>
      </div>
      ${r.summary ? `<p class="record-note"><b>小结：</b>${esc(r.summary)}</p>` : ''}
      ${r.reflection ? `<p class="record-note"><b>反思：</b>${esc(r.reflection)}</p>` : ''}
      <div class="card-actions"><span class="action-hint">点击编辑</span></div>
    </div>`;
  }).join('');
}
function formatDate(d) {
  const m = d.slice(5, 7);
  const day = d.slice(8, 10);
  const dt = new Date(d);
  const wk = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];
  return `${m}月${day}日 周${wk}`;
}
function setTodayStatus(s) {
  let r = DB.attendance.find(x => x.date === TODAY);
  if (!r) {
    r = { id: uid('a'), date: TODAY, status: s, summary: '', reflection: '', ts: Date.now() };
    DB.attendance.push(r);
    toast('已创建今日记录');
  } else {
    r.status = s;
  }
  save(); renderAttendance(); buzz(8);
}
function openAttendanceForm() {
  const body = `
    <div class="form-group"><label>日期</label><input type="date" id="f-date" value="${TODAY}"></div>
    <div class="form-group"><label>状态</label>
      <select id="f-status">${STATUS_LIST.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>工作小结</label><textarea id="f-summary" rows="3" placeholder="今天完成了什么、进展如何"></textarea></div>
    <div class="form-group"><label>反思</label><textarea id="f-reflection" rows="2" placeholder="做得好的、待改进的"></textarea></div>
  `;
  openModal('添加考勤记录', body, () => {
    const date = document.getElementById('f-date').value;
    if (!date) { toast('请选择日期'); return false; }
    const existing = DB.attendance.find(r => r.date === date);
    if (existing) { toast('该日期已有记录，请直接编辑'); return false; }
    DB.attendance.push({
      id: uid('a'), date, status: document.getElementById('f-status').value,
      summary: document.getElementById('f-summary').value.trim(),
      reflection: document.getElementById('f-reflection').value.trim(),
      ts: Date.now(),
    });
    save(); renderAttendance(); toast('记录已保存'); buzz(10);
  });
}
function editAttendance(id) {
  const r = DB.attendance.find(x => x.id === id);
  if (!r) return;
  const body = `
    <div class="form-group"><label>日期</label><input type="date" id="f-date" value="${r.date}"></div>
    <div class="form-group"><label>状态</label>
      <select id="f-status">${STATUS_LIST.map(s => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>工作小结</label><textarea id="f-summary" rows="3" placeholder="今天完成了什么、进展如何">${esc(r.summary || '')}</textarea></div>
    <div class="form-group"><label>反思</label><textarea id="f-reflection" rows="2" placeholder="做得好的、待改进的">${esc(r.reflection || '')}</textarea></div>
  `;
  openModal('编辑考勤记录', body, () => {
    r.date = document.getElementById('f-date').value;
    r.status = document.getElementById('f-status').value;
    r.summary = document.getElementById('f-summary').value.trim();
    r.reflection = document.getElementById('f-reflection').value.trim();
    save(); renderAttendance(); toast('已更新'); buzz(10);
  });
  // 增加删除按钮
  const footer = document.querySelector('.modal-footer');
  if (!footer.querySelector('.btn-danger')) {
    const del = document.createElement('button');
    del.className = 'btn-danger';
    del.textContent = '删除';
    del.onclick = () => {
      if (!confirm('确定删除这条记录？')) return;
      DB.attendance = DB.attendance.filter(x => x.id !== id);
      save(); renderAttendance(); closeModal(); toast('已删除'); buzz(15);
    };
    footer.insertBefore(del, footer.firstChild);
  }
}
window.openAttendanceForm = openAttendanceForm;
window.editAttendance = editAttendance;
window.setTodayStatus = setTodayStatus;

// ===== AI 资讯 =====
function renderNews() {
  // 筛选
  const cats = ['全部', '大模型', '应用落地', '开源'];
  document.getElementById('news-filters').innerHTML = cats.map(c =>
    `<button class="pill ${DB.newsFilter === c ? 'selected' : ''}" onclick="setNewsFilter('${c}')">${c}</button>`
  ).join('');

  const filtered = DB.newsFilter === '全部' ? DB.news : DB.news.filter(n => n.category === DB.newsFilter);
  document.getElementById('news-count').textContent = `${filtered.length} 条`;
  document.getElementById('news-starred-count').textContent = `已收藏 ${DB.news.filter(n => n.starred).length} 条`;

  const list = document.getElementById('news-list');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty">暂无资讯，点击 ＋ 或「刷新」获取</div>';
  } else {
    list.innerHTML = filtered.map(n => {
      const catColor = { '大模型': { fg: '#0066CC', bg: '#E5F0FA' }, '开源': { fg: '#34A853', bg: '#E8F5E9' }, '应用落地': { fg: '#FF9500', bg: '#FFF4E5' } }[n.category] || { fg: '#86868B', bg: '#F2F2F7' };
      return `<div class="card news-card">
        <div class="news-meta">
          <span class="tag" style="background:${catColor.bg};color:${catColor.fg}">${n.category}</span>
          <span class="news-time">${n.time}</span>
        </div>
        <h3 class="news-title">${esc(n.title)}</h3>
        <p class="news-desc">${esc(n.desc)}</p>
        <div class="news-actions">
          <span class="news-source">${esc(n.source)}</span>
          <div>
            <button class="btn-text ${n.starred ? 'active' : ''}" onclick="toggleNewsStar('${n.id}')">${n.starred ? '★ 已收藏' : '☆ 收藏'}</button>
            <button class="btn-text danger" onclick="deleteNews('${n.id}')">删除</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // 今日要点（取前 3 条标题）
  const kp = document.getElementById('news-keypoints');
  const top3 = DB.news.slice(0, 3);
  const colors = ['#0066CC', '#34A853', '#FF9500'];
  if (top3.length === 0) {
    kp.innerHTML = '<div class="empty">暂无要点</div>';
  } else {
    kp.innerHTML = top3.map((n, i) =>
      `<div class="key-point"><span class="dot" style="background:${colors[i % 3]}"></span>${esc(n.title)}</div>`
    ).join('');
  }
}
function setNewsFilter(c) { DB.newsFilter = c; save(); renderNews(); buzz(5); }
function toggleNewsStar(id) {
  const n = DB.news.find(x => x.id === id);
  if (!n) return;
  n.starred = !n.starred;
  save(); renderNews(); toast(n.starred ? '已收藏' : '已取消收藏'); buzz(5);
}
function deleteNews(id) {
  if (!confirm('删除这条资讯？')) return;
  DB.news = DB.news.filter(x => x.id !== id);
  save(); renderNews(); toast('已删除'); buzz(10);
}
function refreshNews() {
  // 随机抽取 2-3 条新资讯加入
  const newCount = 2 + Math.floor(Math.random() * 2);
  const existingTitles = new Set(DB.news.map(n => n.title));
  let added = 0;
  const pool = [...NEWS_POOL].sort(() => Math.random() - 0.5);
  for (const item of pool) {
    if (added >= newCount) break;
    if (existingTitles.has(item.title)) continue;
    DB.news.unshift({
      id: uid('n'), category: item.category, title: item.title, desc: item.desc,
      source: item.source, time: NEWS_TIMES[Math.floor(Math.random() * NEWS_TIMES.length)],
      starred: false,
    });
    added++;
  }
  save(); renderNews();
  toast(added > 0 ? `已获取 ${added} 条新资讯` : '暂无新资讯'); buzz(10);
}
function openNewsForm() {
  const body = `
    <div class="form-group"><label>分类</label>
      <select id="f-cat"><option>大模型</option><option>应用落地</option><option>开源</option></select>
    </div>
    <div class="form-group"><label>标题</label><input type="text" id="f-title" placeholder="资讯标题"></div>
    <div class="form-group"><label>摘要</label><textarea id="f-desc" rows="3" placeholder="内容摘要"></textarea></div>
    <div class="form-group"><label>来源</label><input type="text" id="f-source" placeholder="来源"></div>
  `;
  openModal('添加资讯', body, () => {
    const title = document.getElementById('f-title').value.trim();
    if (!title) { toast('请填写标题'); return false; }
    DB.news.unshift({
      id: uid('n'), category: document.getElementById('f-cat').value, title,
      desc: document.getElementById('f-desc').value.trim(),
      source: document.getElementById('f-source').value.trim() || '手动添加',
      time: '刚刚', starred: false,
    });
    save(); renderNews(); toast('已添加'); buzz(10);
  });
}
window.setNewsFilter = setNewsFilter;
window.toggleNewsStar = toggleNewsStar;
window.deleteNews = deleteNews;
window.refreshNews = refreshNews;
window.openNewsForm = openNewsForm;

// ===== 抖音热榜 =====
function renderHotlist() {
  // 排序按热度
  const sorted = [...DB.hotlist].sort((a, b) => b.heat - a.heat);
  document.getElementById('hotlist-count').textContent = sorted.length;
  document.getElementById('hotlist-updated').textContent = `更新于 ${new Date().toTimeString().slice(0, 5)}`;

  const rankColors = ['#FF3B30', '#FF9500', '#FFCC00', '#86868B', '#86868B'];
  const rows = document.getElementById('hotlist-rows');
  if (sorted.length === 0) {
    rows.innerHTML = '<div class="empty">榜单为空，点击刷新</div>';
  } else {
    rows.innerHTML = sorted.map((h, i) => {
      const c = rankColors[Math.min(i, 4)];
      return `<div class="rank-row">
        <span class="rank-num" style="color:${c}">${i + 1}</span>
        <span class="rank-title">${esc(h.title)}</span>
        <span class="rank-heat" style="color:${c}">${h.heat}万</span>
        <button class="btn-text ${h.picked ? 'active' : ''}" onclick="toggleHotPick('${h.id}')">${h.picked ? '✓ 已选' : '选'}</button>
      </div>`;
    }).join('');
  }

  // 选题建议
  const adopted = DB.topics.filter(t => t.adopted).length;
  document.getElementById('topic-adopted-count').textContent = `已采纳 ${adopted}`;
  const tagColors = { '高热度': { fg: '#FF3B30', bg: '#FFF0F0' }, '上升趋势': { fg: '#FF9500', bg: '#FFF4E5' }, '社会议题': { fg: '#34A853', bg: '#E8F5E9' } };
  const tl = document.getElementById('topic-list');
  tl.innerHTML = DB.topics.map(t => {
    const c = tagColors[t.tag] || { fg: '#86868B', bg: '#F2F2F7' };
    return `<div class="card topic-card">
      <div class="news-meta">
        <span class="topic-label">选题方向</span>
        <span class="tag" style="background:${c.bg};color:${c.fg}">${t.tag}</span>
      </div>
      <h3 class="news-title">${esc(t.title)}</h3>
      <p class="news-desc">${esc(t.angle)}</p>
      <div class="news-actions">
        <span></span>
        <button class="btn-text ${t.adopted ? 'active' : ''}" onclick="toggleTopicAdopt('${t.id}')">${t.adopted ? '✓ 已采纳' : '采纳'}</button>
      </div>
    </div>`;
  }).join('');
}
function toggleHotPick(id) {
  const h = DB.hotlist.find(x => x.id === id);
  if (!h) return;
  h.picked = !h.picked;
  save(); renderHotlist(); toast(h.picked ? '已标记为选题' : '已取消'); buzz(5);
}
function toggleTopicAdopt(id) {
  const t = DB.topics.find(x => x.id === id);
  if (!t) return;
  t.adopted = !t.adopted;
  save(); renderHotlist(); toast(t.adopted ? '已采纳该选题' : '已取消'); buzz(5);
}
function refreshHotlist() {
  // 随机重排 + 热度浮动
  DB.hotlist.forEach(h => { h.heat = Math.max(100, Math.round(h.heat * (0.8 + Math.random() * 0.4))); });
  // 30% 概率替换一条
  if (Math.random() < 0.6) {
    const existingTitles = new Set(DB.hotlist.map(h => h.title));
    const pool = HOT_POOL.filter(t => !existingTitles.has(t));
    if (pool.length > 0) {
      const replaceIdx = Math.floor(Math.random() * DB.hotlist.length);
      DB.hotlist[replaceIdx] = {
        id: uid('h'), title: pool[Math.floor(Math.random() * pool.length)],
        heat: 300 + Math.floor(Math.random() * 700), picked: false,
      };
    }
  }
  save(); renderHotlist(); toast('榜单已刷新'); buzz(10);
}
window.toggleHotPick = toggleHotPick;
window.toggleTopicAdopt = toggleTopicAdopt;
window.refreshHotlist = refreshHotlist;

// ===== 健身 =====
function renderFitness() {
  const f = DB.fitness;
  // 今日待办
  const todayItem = f.week.find(w => w.today);
  const banner = document.getElementById('fitness-today-banner');
  if (todayItem && !todayItem.done) {
    banner.className = 'today-banner warn';
    banner.innerHTML = `<span>今日（周${todayItem.day}）尚未打卡</span><button class="banner-btn" onclick="toggleTodayCheckin()">立即打卡</button>`;
  } else if (todayItem && todayItem.done) {
    banner.className = 'today-banner ok';
    banner.innerHTML = `<span>今日已打卡 ✓</span>`;
  } else {
    banner.className = 'today-banner hidden';
  }

  // 统计
  const doneCount = f.week.filter(w => w.done).length;
  const stats = [
    { v: `${f.water.cur}/${f.water.target}杯`, l: '今日饮水', c: '#0066CC' },
    { v: `${f.kcal}千卡`, l: '今日消耗', c: '#FF9500' },
    { v: `${doneCount}次`, l: '本周打卡', c: '#34A853' },
    { v: `${doneCount}天`, l: '连续打卡', c: '#AF52DE' },
  ];
  document.getElementById('fitness-stats').innerHTML = stats.map(s =>
    `<div class="stat-card"><span class="stat-value" style="color:${s.c}">${s.v}</span><span class="stat-label">${s.l}</span></div>`
  ).join('');

  // 喝水
  document.getElementById('water-value').textContent = `${f.water.cur}/${f.water.target}杯`;
  document.getElementById('water-text').textContent = `每2小时 · 已喝${f.water.cur}/${f.water.target}杯`;
  document.getElementById('water-fill').style.width = `${Math.min(100, f.water.cur / f.water.target * 100)}%`;

  // 本周打卡
  document.getElementById('week-text').textContent = `已完成 ${doneCount}/7`;
  document.getElementById('week-dots').innerHTML = f.week.map((w, i) =>
    `<div class="week-dot ${w.done ? 'done' : w.today ? 'today' : 'rest'}" onclick="toggleWeek(${i})">${w.day}</div>`
  ).join('');
  document.getElementById('today-checkin-btn').textContent = todayItem && todayItem.done ? '取消今日打卡' : '标记今日已打卡';

  // 训练
  const el = document.getElementById('exercise-list');
  if (f.exercises.length === 0) {
    el.innerHTML = '<div class="empty">暂无训练动作</div>';
  } else {
    el.innerHTML = f.exercises.map(e =>
      `<div class="exercise-row">
        <span>${esc(e.name)}</span>
        <span class="exercise-sets">${esc(e.sets)}</span>
        <button class="btn-text danger" onclick="deleteExercise('${e.id}')">删除</button>
      </div>`
    ).join('');
  }
  document.getElementById('kcal-input').value = f.kcal;

  // 飞书开关
  const sw = document.getElementById('push-switch');
  sw.classList.toggle('on', f.pushOn);
}
function waterAdd(d) {
  const f = DB.fitness;
  f.water.cur = Math.max(0, Math.min(f.water.target, f.water.cur + d));
  save(); renderFitness();
  if (f.water.cur === f.water.target && d > 0) toast('今日饮水目标已达成');
  buzz(8);
}
function toggleWeek(i) {
  const w = DB.fitness.week[i];
  if (w.today) { toggleTodayCheckin(); return; }
  w.done = !w.done;
  save(); renderFitness(); buzz(5);
}
function toggleTodayCheckin() {
  const t = DB.fitness.week.find(w => w.today);
  if (!t) return;
  t.done = !t.done;
  save(); renderFitness();
  toast(t.done ? '今日已打卡' : '已取消打卡'); buzz(10);
}
function updateKcal(v) {
  DB.fitness.kcal = Math.max(0, parseInt(v) || 0);
  save(); renderFitness();
}
function togglePush() {
  DB.fitness.pushOn = !DB.fitness.pushOn;
  save(); renderFitness();
  toast(DB.fitness.pushOn ? '已开启飞书推送' : '已关闭飞书推送'); buzz(10);
}
function openExerciseForm() {
  const body = `
    <div class="form-group"><label>动作名称</label><input type="text" id="f-name" placeholder="如：哑铃卧推"></div>
    <div class="form-group"><label>组数 × 次数</label><input type="text" id="f-sets" placeholder="如：4组 × 12次"></div>
  `;
  openModal('添加训练动作', body, () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { toast('请填写动作名称'); return false; }
    DB.fitness.exercises.push({
      id: uid('e'), name,
      sets: document.getElementById('f-sets').value.trim() || '—',
    });
    save(); renderFitness(); toast('已添加'); buzz(10);
  });
}
function deleteExercise(id) {
  DB.fitness.exercises = DB.fitness.exercises.filter(e => e.id !== id);
  save(); renderFitness(); toast('已删除'); buzz(5);
}
window.waterAdd = waterAdd;
window.toggleWeek = toggleWeek;
window.toggleTodayCheckin = toggleTodayCheckin;
window.updateKcal = updateKcal;
window.togglePush = togglePush;
window.openExerciseForm = openExerciseForm;
window.deleteExercise = deleteExercise;

// ===== 导出 / 导入 =====
function exportJSON() {
  const data = JSON.stringify(DB, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workbench-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('已导出备份'); buzz(10);
}
function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.attendance || !data.fitness) throw new Error('格式不符');
      DB = data;
      if (!DB.newsFilter) DB.newsFilter = '全部';
      save(); renderAll();
      toast('已恢复 ' + (DB.attendance.length + DB.news.length) + ' 条数据');
      buzz(15);
    } catch (err) {
      toast('导入失败：' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
window.exportJSON = exportJSON;
window.importJSON = importJSON;

// ===== 工具：HTML 转义 =====
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== 屏幕切换（保留原方向感过渡） =====
const order = ['screen-attendance', 'screen-news', 'screen-hotlist', 'screen-fitness'];
let current = 0;
function switchTab(id, btn) {
  const idx = order.indexOf(id);
  const target = document.getElementById(id);
  const active = document.querySelector('.screen.active');
  if (!target || target === active) return;
  const dir = idx > current ? 1 : -1;
  current = idx;
  active.classList.remove('active');
  active.classList.toggle('exit-left', dir > 0);
  target.classList.remove('exit-left');
  target.style.transform = `translateX(${dir * 24}px) scale(0.98)`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.add('active');
      target.style.transform = '';
    });
  });
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  buzz(8);
}
window.switchTab = switchTab;
window.closeModal = closeModal;

// ===== 全量渲染 =====
function renderAll() {
  renderAttendance();
  renderNews();
  renderHotlist();
  renderFitness();
}

// ===== 启动 =====
renderAll();

// ===== PWA Service Worker 注册 =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ===== iOS 添加到主屏幕提示 =====
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
if (isIOS && !isStandalone && !sessionStorage.getItem('a2hs-tip-shown')) {
  sessionStorage.setItem('a2hs-tip-shown', '1');
  setTimeout(() => {
    const tip = document.createElement('div');
    tip.className = 'a2hs-tip';
    tip.textContent = '点击浏览器「分享」→「添加到主屏幕」，即可像 APP 一样使用';
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 5000);
  }, 1500);
}

})();
