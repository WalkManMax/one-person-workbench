/* 一人公司工作台 · 本地优先的可交互原型 */
(function () {
'use strict';

const KEY = 'wb_workbench_v3';
const LEGACY_KEY = 'wb_workbench_v2';
const TODAY = '2026-08-26';
const STATUS_LIST = ['在岗', '出海', '出差', '休假', '值班', '公休', '请假'];
const STATUS_COLORS = {
  '在岗': { fg: '#16803B', bg: '#EAF8F0' }, '出海': { fg: '#014DB2', bg: '#EAF2FF' },
  '出差': { fg: '#B54708', bg: '#FFF4E5' }, '休假': { fg: '#6941C6', bg: '#F3E8FD' },
  '值班': { fg: '#6941C6', bg: '#ECE8FE' }, '公休': { fg: '#7F56D9', bg: '#F3E8FD' },
  '请假': { fg: '#D92D20', bg: '#FFF0F0' }
};
const DEFAULTS = {
  version: 3,
  profile: { loginProvider: '', feishu: { configured: false, destination: '', syncSummary: false, syncReflection: false, lastSync: '' } },
  attendanceUI: { view: 'table', month: '2026-08', status: '全部', search: '' },
  attendance: [
    { id:'a1', date:'2026-08-25', status:'出海', offshoreStart:'10:00', offshoreEnd:'16:30', tripLocation:'深圳南山', tripReason:'拜访两家潜在供应商', summary:'完成供应商拜访，梳理报价与交付周期。', reflection:'下次提前确认会面目标与资料清单。', ts:1 },
    { id:'a2', date:'2026-08-24', status:'出差', tripLocation:'杭州', tripReason:'供应链客户复盘', summary:'完成客户复盘与后续排期。', reflection:'差旅前预留缓冲时间。', ts:2 },
    { id:'a3', date:'2026-08-23', status:'值班', dutyType:'节假日值班', summary:'处理紧急订单咨询，完成交接。', reflection:'完善节假日值班规则。', ts:3 },
    { id:'a4', date:'2026-08-22', status:'在岗', summary:'完成资讯模块筛选交互稿，晚上力量训练45分钟。', reflection:'效率不错，注意护眼。', ts:4 },
    { id:'a5', date:'2026-08-21', status:'请假', tripReason:'个人事务', summary:'已完成请假交接。', reflection:'提前安排工作缓冲。', ts:5 }
  ],
  news: [
    { id:'n1', category:'大模型', title:'GPT-5 正式发布，多模态推理能力大幅提升', desc:'支持原生图像理解、视频时序推理与工具调用。', source:'AI前线', time:'2小时前', starred:false },
    { id:'n2', category:'开源', title:'Llama 4 登顶开源大模型榜单', desc:'Meta 发布 Llama 4 系列，旗舰模型能力继续提升。', source:'开源中国', time:'5小时前', starred:false },
    { id:'n3', category:'应用落地', title:'AI Agent 企业级应用落地率达 67%', desc:'客服与研发成为主要落地场景。', source:'量子位', time:'8小时前', starred:false }
  ],
  newsFilter:'全部',
  hotlist:[
    { id:'h1', title:'AI生成的短视频登上热搜第一', heat:982, picked:false }, { id:'h2', title:'国产AI助手用户量突破1亿', heat:756, picked:false },
    { id:'h3', title:'AI+非遗手工艺短视频走红', heat:634, picked:false }, { id:'h4', title:'AI面试官引发求职者热议', heat:421, picked:false },
    { id:'h5', title:'大模型生成内容版权归属讨论', heat:298, picked:false }
  ],
  topics:[
    { id:'t1', title:'AI 生成短视频如何改变创作生态', angle:'工具对比 + 创作者访谈 + 效率提升数据', tag:'高热度', adopted:false },
    { id:'t2', title:'AI + 非遗：技术与传统的碰撞', angle:'手艺人故事 + AI 辅助流程演示', tag:'上升趋势', adopted:false },
    { id:'t3', title:'AI 面试官：公平还是筛选陷阱', angle:'求职者体验 + HR 视角 + 技术局限分析', tag:'社会议题', adopted:false }
  ],
  fitness:{ water:{cur:6,target:8}, week:[{day:'一',done:true},{day:'二',done:true},{day:'三',done:true},{day:'四',done:true},{day:'五',done:false,today:true},{day:'六',done:false},{day:'日',done:false}], exercises:[{id:'e1',name:'哑铃卧推',sets:'4组 × 12次'},{id:'e2',name:'上斜哑铃推举',sets:'3组 × 10次'},{id:'e3',name:'哑铃侧平举',sets:'3组 × 15次'}], kcal:320, pushOn:true }
};
const NEWS_POOL = [
  {category:'大模型',title:'Claude 4 发布，上下文窗口扩展至 500 万 token',desc:'长文档理解与代码生成能力继续提升。',source:'机器之心'},
  {category:'开源',title:'通义千问开源 Qwen3-235B，中文榜单登顶',desc:'旗舰开源模型在多个中文评测中表现突出。',source:'开源中国'},
  {category:'应用落地',title:'字节豆包企业版上线，接入飞书生态',desc:'企业协作场景进一步扩展。',source:'36氪'}
];
const HOT_POOL = ['AI 短剧生成工具一键出片','国产视频模型开放内测','AI 主播登上带货榜单前三','大模型写网文引发版权争议','AI 数字人直播带货监管新规'];
let DB = load();

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function normalize(data) {
  const d = Object.assign(clone(DEFAULTS), data || {});
  d.profile = Object.assign(clone(DEFAULTS.profile), d.profile || {});
  d.profile.feishu = Object.assign(clone(DEFAULTS.profile.feishu), d.profile.feishu || {});
  d.attendanceUI = Object.assign(clone(DEFAULTS.attendanceUI), d.attendanceUI || {});
  d.attendance = Array.isArray(d.attendance) ? d.attendance.map(r => Object.assign({offshoreStart:'',offshoreEnd:'',tripLocation:'',tripReason:'',dutyType:'',summary:'',reflection:''}, r)) : [];
  d.news = Array.isArray(d.news) ? d.news : [];
  d.hotlist = Array.isArray(d.hotlist) ? d.hotlist : [];
  d.topics = Array.isArray(d.topics) ? d.topics : [];
  d.fitness = Object.assign(clone(DEFAULTS.fitness), d.fitness || {});
  return d;
}
function load(){
  try { const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY); return normalize(raw ? JSON.parse(raw) : DEFAULTS); }
  catch(e){ return clone(DEFAULTS); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(DB)); }
function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function esc(v){ return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function buzz(ms){ if(navigator.vibrate) navigator.vibrate(ms); }
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add('hidden'),2200); }
function formatDate(d){ if(!d) return '—'; const dt=new Date(d+'T12:00:00'); const week=['日','一','二','三','四','五','六'][dt.getDay()]; return `${d.slice(5,7)}月${d.slice(8,10)}日 周${week}`; }
function summaryStatus(r){ return r.summary && r.reflection ? '完整' : r.summary ? '待反思' : '待补充'; }
function recordDetail(r){
  if(r.status==='出海') return `${r.offshoreStart || '—'}–${r.offshoreEnd || '—'}${r.tripLocation ? ' · '+r.tripLocation : ''}`;
  if(r.status==='出差') return `${r.tripLocation || '未填地点'}${r.tripReason ? ' · '+r.tripReason : ''}`;
  if(r.status==='值班') return r.dutyType || '请补充工作日/节假日';
  if(['休假','请假'].includes(r.status)) return r.tripReason || '未填写事由';
  return '—';
}

function openModal(title, body, onSave){
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=body;
  const overlay=document.getElementById('modal-overlay'); overlay.classList.remove('hidden');
  document.querySelectorAll('.modal-footer .btn-danger').forEach(x=>x.remove());
  document.getElementById('modal-save').onclick=()=>{ if(onSave()!==false) closeModal(); };
  setTimeout(()=>{ const input=overlay.querySelector('input,textarea,select'); if(input) input.focus(); },80);
}
function closeModal(e){ if(e && e.type==='click' && e.target.id!=='modal-overlay') return; document.getElementById('modal-overlay').classList.add('hidden'); }
window.closeModal=closeModal;

// ---- 考勤：筛选、表格、日程本 ----
function attendanceRecords(){
  const ui=DB.attendanceUI; const q=ui.search.trim().toLowerCase();
  return DB.attendance.filter(r => (!ui.month || r.date.startsWith(ui.month)) && (ui.status==='全部'||r.status===ui.status) && (!q || [r.tripLocation,r.tripReason,r.summary,r.reflection,r.dutyType].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));
}
function renderAttendance(){
  const ui=DB.attendanceUI;
  const monthRecords=DB.attendance.filter(r=>r.date.startsWith(ui.month || '2026-08'));
  const count=s=>monthRecords.filter(r=>r.status===s).length;
  document.getElementById('attendance-stats').innerHTML=[
    ['在岗','本月在岗','#0066CC'],['出海','出海 / 外出','#0B7A75'],['值班','值班（含节假日）','#6941C6'],['休假','休假 / 请假 / 公休','#D92D20']
  ].map(([k,l,c])=>`<div class="stat-card"><span class="stat-value" style="color:${c}">${k==='休假'?count('休假')+count('请假')+count('公休'):count(k)}${k==='出海'?'次':'天'}</span><span class="stat-label">${l}</span></div>`).join('');
  const today=DB.attendance.find(r=>r.date===TODAY);
  document.getElementById('attendance-status-pills').innerHTML=STATUS_LIST.map(s=>`<button class="pill ${today&&today.status===s?'selected':''}" onclick="setTodayStatus('${s}')">${s}</button>`).join('');
  const banner=document.getElementById('attendance-today-banner');
  if(!today){banner.className='today-banner warn';banner.innerHTML=`<span>今日尚未建立考勤记录</span><button class="banner-btn" onclick="openAttendanceForm()">立即登记</button>`;}
  else if(!today.summary || !today.reflection){banner.className='today-banner warn';banner.innerHTML=`<span>今日记录尚缺${!today.summary?'工作小结':''}${!today.summary&&!today.reflection?'和':''}${!today.reflection?'反思':''}</span><button class="banner-btn" onclick="editAttendance('${today.id}')">立即补充</button>`;}
  else {banner.className='today-banner ok';banner.innerHTML=`<span>今日记录已完整 · ${today.status}</span>`;}
  renderAttendanceControls();
  const records=attendanceRecords(); const list=document.getElementById('attendance-list');
  list.innerHTML=ui.view==='calendar'?renderCalendar(records):renderTable(records);
}
function renderAttendanceControls(){
  const ui=DB.attendanceUI; const months=[...new Set(DB.attendance.map(r=>r.date.slice(0,7)).concat(['2026-08']))].sort().reverse();
  const month=document.getElementById('attendance-month-filter'); if(month) month.innerHTML=months.map(m=>`<option value="${m}" ${m===ui.month?'selected':''}>${m.replace('-','年')}月</option>`).join('');
  const status=document.getElementById('attendance-status-filter'); if(status) status.innerHTML=['全部',...STATUS_LIST].map(s=>`<option ${s===ui.status?'selected':''}>${s}</option>`).join('');
  const search=document.getElementById('attendance-search'); if(search && search.value!==ui.search) search.value=ui.search;
}
function renderTable(rows){
  if(!rows.length) return '<div class="empty">没有符合筛选条件的记录</div>';
  const head='<div class="attendance-table-head"><span>日期 / 状态</span><span>关联信息</span><span>小结与反思</span></div>';
  const body=rows.map(r=>{const c=STATUS_COLORS[r.status]; const completeness=summaryStatus(r); return `<button class="attendance-row" onclick="editAttendance('${r.id}')"><div><b>${formatDate(r.date)}</b><span class="tag" style="background:${c.bg};color:${c.fg}">${r.status}${r.status==='值班'&&r.dutyType?' · '+esc(r.dutyType.replace('值班','')):''}</span></div><div class="attendance-detail">${esc(recordDetail(r))}</div><div class="attendance-notes"><span class="note-state ${completeness==='完整'?'complete':'missing'}">${completeness}</span><p>${r.summary?esc(r.summary):'待填写工作小结'}</p><small>${r.reflection?'反思：'+esc(r.reflection):'待填写每日反思'}</small></div></button>`;}).join('');
  return `<div class="attendance-table">${head}${body}</div>`;
}
function renderCalendar(rows){
  if(!rows.length) return '<div class="empty">没有符合筛选条件的记录</div>';
  return rows.map(r=>{const c=STATUS_COLORS[r.status];return `<button class="card agenda-card" onclick="editAttendance('${r.id}')"><div class="record-row"><b>${formatDate(r.date)}</b><span class="tag" style="background:${c.bg};color:${c.fg}">${r.status}</span></div><p class="agenda-detail">${esc(recordDetail(r))}</p><p class="record-note"><b>工作小结：</b>${r.summary?esc(r.summary):'待补充'}</p><p class="record-note"><b>每日反思：</b>${r.reflection?esc(r.reflection):'待补充'}</p></button>`;}).join('');
}
function setAttendanceView(view, button){ DB.attendanceUI.view=view; save(); renderAttendance(); document.querySelectorAll('#attendance-view-toggle .segment').forEach(x=>x.classList.remove('active')); if(button)button.classList.add('active'); }
function setAttendanceMonth(v){DB.attendanceUI.month=v;save();renderAttendance();}
function setAttendanceFilter(v){DB.attendanceUI.status=v;save();renderAttendance();}
function setAttendanceSearch(v){DB.attendanceUI.search=v;renderAttendance();}
function setTodayStatus(status){ let r=DB.attendance.find(x=>x.date===TODAY); if(!r){r={id:uid('a'),date:TODAY,status,summary:'',reflection:'',offshoreStart:'',offshoreEnd:'',tripLocation:'',tripReason:'',dutyType:'',ts:Date.now()};DB.attendance.push(r);toast('已建立今日草稿，请补充小结与反思');}else{r.status=status;toast('今日状态已更新');} save();renderAttendance();buzz(8); }
function specialFields(record={}){ return `<div id="attendance-special-fields">${renderSpecialFields(record.status || '在岗',record)}</div>`; }
function renderSpecialFields(status,r){
  if(status==='出海') return `<div class="form-grid"><div class="form-group"><label>开始时间 *</label><input type="time" id="f-offshore-start" value="${esc(r.offshoreStart)}"></div><div class="form-group"><label>结束时间 *</label><input type="time" id="f-offshore-end" value="${esc(r.offshoreEnd)}"></div></div><div class="form-group"><label>地点</label><input id="f-location" value="${esc(r.tripLocation)}" placeholder="如：深圳南山"></div>`;
  if(status==='出差') return `<div class="form-group"><label>出差地点 *</label><input id="f-location" value="${esc(r.tripLocation)}" placeholder="如：杭州"></div><div class="form-group"><label>出差事由 *</label><input id="f-reason" value="${esc(r.tripReason)}" placeholder="如：供应链客户复盘"></div>`;
  if(status==='值班') return `<div class="form-group"><label>值班类型 *</label><select id="f-duty"><option ${r.dutyType==='工作日值班'?'selected':''}>工作日值班</option><option ${r.dutyType==='节假日值班'?'selected':''}>节假日值班</option></select></div>`;
  if(status==='休假'||status==='请假') return `<div class="form-group"><label>${status}事由</label><input id="f-reason" value="${esc(r.tripReason)}" placeholder="可选填写"></div>`;
  return '<p class="form-hint">当前状态无需补充额外字段。</p>';
}
function attendanceFormBody(r={}){return `<div class="form-group"><label>日期 *</label><input type="date" id="f-date" value="${r.date||TODAY}"></div><div class="form-group"><label>考勤状态 *</label><select id="f-status" onchange="changeAttendanceSpecial(this.value)">${STATUS_LIST.map(s=>`<option value="${s}" ${s===(r.status||'在岗')?'selected':''}>${s}</option>`).join('')}</select></div>${specialFields(r)}<div class="form-group"><label>工作小结 *</label><textarea id="f-summary" rows="3" placeholder="记录今天完成的事项、关键进展与待跟进动作">${esc(r.summary)}</textarea></div><div class="form-group"><label>每日反思 *</label><textarea id="f-reflection" rows="3" placeholder="今天做得好的、需要调整的，以及明日优先事项">${esc(r.reflection)}</textarea></div><p class="form-hint">保存后仅写入本设备；如需同步，请在「数据」中完成飞书授权配置。</p>`;}
function changeAttendanceSpecial(status){ const box=document.getElementById('attendance-special-fields'); if(box) box.innerHTML=renderSpecialFields(status,{}); }
function collectAttendance(r){ const status=document.getElementById('f-status').value; const value=id=>{const el=document.getElementById(id);return el?el.value.trim():'';}; const date=value('f-date'); if(!date){toast('请选择日期');return null;} if(!value('f-summary')||!value('f-reflection')){toast('请完成工作小结和每日反思');return null;} if(status==='出海'&&(!value('f-offshore-start')||!value('f-offshore-end'))){toast('请填写出海开始与结束时间');return null;} if(status==='出差'&&(!value('f-location')||!value('f-reason'))){toast('请填写出差地点和事由');return null;} if(status==='值班'&&!value('f-duty')){toast('请选择值班类型');return null;} return Object.assign(r,{date,status,offshoreStart:value('f-offshore-start'),offshoreEnd:value('f-offshore-end'),tripLocation:value('f-location'),tripReason:value('f-reason'),dutyType:value('f-duty'),summary:value('f-summary'),reflection:value('f-reflection'),ts:Date.now()}); }
function openAttendanceForm(){ openModal('新增考勤记录',attendanceFormBody(),()=>{const r=collectAttendance({id:uid('a')});if(!r)return false;if(DB.attendance.some(x=>x.date===r.date)){toast('该日期已有记录，请直接编辑');return false;}DB.attendance.push(r);save();renderAttendance();toast('记录已保存');buzz(12);}); }
function editAttendance(id){const r=DB.attendance.find(x=>x.id===id);if(!r)return;openModal('编辑考勤记录',attendanceFormBody(r),()=>{const next=collectAttendance(r);if(!next)return false;if(DB.attendance.some(x=>x.id!==id&&x.date===next.date)){toast('该日期已有记录');return false;}save();renderAttendance();toast('已更新记录');buzz(10);});const footer=document.querySelector('.modal-footer');const del=document.createElement('button');del.className='btn-danger';del.textContent='删除';del.onclick=()=>{if(!confirm('确定删除这条记录？'))return;DB.attendance=DB.attendance.filter(x=>x.id!==id);save();renderAttendance();closeModal();toast('已删除');};footer.insertBefore(del,footer.firstChild);}
window.openAttendanceForm=openAttendanceForm;window.editAttendance=editAttendance;window.setTodayStatus=setTodayStatus;window.setAttendanceView=setAttendanceView;window.setAttendanceMonth=setAttendanceMonth;window.setAttendanceFilter=setAttendanceFilter;window.setAttendanceSearch=setAttendanceSearch;window.changeAttendanceSpecial=changeAttendanceSpecial;

// ---- 数据中心 ----
function openDataCenter(){renderDataCenter();document.getElementById('data-center-overlay').classList.remove('hidden');}
function closeDataCenter(e){if(e&&e.type==='click'&&e.target.id!=='data-center-overlay')return;document.getElementById('data-center-overlay').classList.add('hidden');}
function renderDataCenter(){const f=DB.profile.feishu;const copy=document.getElementById('sync-status-copy');const btn=document.getElementById('feishu-connect-btn');if(f.configured){copy.textContent=`飞书配置待验证 · 目标：${f.destination||'未命名目标'}`;btn.textContent='修改配置';}else{copy.textContent='本地设备存储 · 尚未配置飞书同步';btn.textContent='连接飞书';}}
function openFeishuSetup(){const f=DB.profile.feishu;const body=`<div class="security-callout compact"><strong>飞书同步需要真实应用授权</strong><span>本原型不会保存飞书密码，也不会在未授权时上传任何数据。</span></div><div class="form-group"><label>同步目标名称 *</label><input id="f-feishu-destination" value="${esc(f.destination)}" placeholder="如：个人工作台·考勤多维表格"></div><label class="check-row"><input type="checkbox" id="f-sync-summary" ${f.syncSummary?'checked':''}> 同步工作小结</label><label class="check-row"><input type="checkbox" id="f-sync-reflection" ${f.syncReflection?'checked':''}> 同步每日反思</label><p class="form-hint">下一步接入需提供：飞书应用 App ID、OAuth 回调地址、目标多维表格 app_token 与 table_id。配置仅保存于本机，尚未建立远程连接。</p>`;openModal('配置飞书同步',body,()=>{const dest=document.getElementById('f-feishu-destination').value.trim();if(!dest){toast('请填写同步目标名称');return false;}DB.profile.feishu={configured:true,destination:dest,syncSummary:document.getElementById('f-sync-summary').checked,syncReflection:document.getElementById('f-sync-reflection').checked,lastSync:''};DB.profile.loginProvider='飞书（待 OAuth 授权）';save();renderDataCenter();toast('已保存同步配置，待接入 OAuth 授权');});}
function showWechatInfo(){toast('微信可用于登录；同步仍需单独配置云端与授权范围');}
window.openDataCenter=openDataCenter;window.closeDataCenter=closeDataCenter;window.openFeishuSetup=openFeishuSetup;window.showWechatInfo=showWechatInfo;

// ---- AI 资讯 ----
function renderNews(){const cats=['全部','大模型','应用落地','开源'];document.getElementById('news-filters').innerHTML=cats.map(c=>`<button class="pill ${DB.newsFilter===c?'selected':''}" onclick="setNewsFilter('${c}')">${c}</button>`).join('');const items=DB.newsFilter==='全部'?DB.news:DB.news.filter(x=>x.category===DB.newsFilter);document.getElementById('news-count').textContent=`${items.length} 条`;document.getElementById('news-starred-count').textContent=`已收藏 ${DB.news.filter(x=>x.starred).length} 条`;const color={'大模型':['#0066CC','#E5F0FA'],'开源':['#16803B','#EAF8F0'],'应用落地':['#B54708','#FFF4E5']};document.getElementById('news-list').innerHTML=items.length?items.map(n=>`<div class="card news-card"><div class="news-meta"><span class="tag" style="color:${color[n.category][0]};background:${color[n.category][1]}">${n.category}</span><span class="news-time">${n.time}</span></div><h3 class="news-title">${esc(n.title)}</h3><p class="news-desc">${esc(n.desc)}</p><div class="news-actions"><span class="news-source">${esc(n.source)}</span><div><button class="btn-text ${n.starred?'active':''}" onclick="toggleNewsStar('${n.id}')">${n.starred?'★ 已收藏':'☆ 收藏'}</button><button class="btn-text danger" onclick="deleteNews('${n.id}')">删除</button></div></div></div>`).join(''):'<div class="empty">暂无资讯</div>';document.getElementById('news-keypoints').innerHTML=DB.news.slice(0,3).map((n,i)=>`<div class="key-point"><span class="dot" style="background:${['#0066CC','#34A853','#FF9500'][i]}"></span>${esc(n.title)}</div>`).join('')||'<div class="empty">暂无要点</div>';}
function setNewsFilter(v){DB.newsFilter=v;save();renderNews();}function toggleNewsStar(id){const n=DB.news.find(x=>x.id===id);if(n){n.starred=!n.starred;save();renderNews();toast(n.starred?'已收藏':'已取消收藏');}}function deleteNews(id){if(confirm('删除这条资讯？')){DB.news=DB.news.filter(x=>x.id!==id);save();renderNews();toast('已删除');}}function refreshNews(){const existing=new Set(DB.news.map(x=>x.title));const found=NEWS_POOL.find(x=>!existing.has(x.title));if(found)DB.news.unshift(Object.assign({id:uid('n'),time:'刚刚',starred:false},found));save();renderNews();toast(found?'已加入 1 条演示资讯':'暂无新资讯');}function openNewsForm(){openModal('添加资讯',`<div class="form-group"><label>分类</label><select id="f-cat"><option>大模型</option><option>应用落地</option><option>开源</option></select></div><div class="form-group"><label>标题 *</label><input id="f-title" placeholder="资讯标题"></div><div class="form-group"><label>摘要</label><textarea id="f-desc" rows="3"></textarea></div><div class="form-group"><label>来源</label><input id="f-source" placeholder="来源"></div>`,()=>{const title=document.getElementById('f-title').value.trim();if(!title){toast('请填写标题');return false;}DB.news.unshift({id:uid('n'),category:document.getElementById('f-cat').value,title,desc:document.getElementById('f-desc').value.trim(),source:document.getElementById('f-source').value.trim()||'手动添加',time:'刚刚',starred:false});save();renderNews();toast('已添加');});}window.setNewsFilter=setNewsFilter;window.toggleNewsStar=toggleNewsStar;window.deleteNews=deleteNews;window.refreshNews=refreshNews;window.openNewsForm=openNewsForm;

// ---- 热榜 ----
function renderHotlist(){const rows=[...DB.hotlist].sort((a,b)=>b.heat-a.heat);document.getElementById('hotlist-count').textContent=rows.length;document.getElementById('hotlist-updated').textContent=`更新于 ${new Date().toTimeString().slice(0,5)}`;const colors=['#FF3B30','#FF9500','#FFCC00','#86868B','#86868B'];document.getElementById('hotlist-rows').innerHTML=rows.map((h,i)=>`<div class="rank-row"><span class="rank-num" style="color:${colors[i]}">${i+1}</span><span class="rank-title">${esc(h.title)}</span><span class="rank-heat" style="color:${colors[i]}">${h.heat}万</span><button class="btn-text ${h.picked?'active':''}" onclick="toggleHotPick('${h.id}')">${h.picked?'✓ 已选':'选'}</button></div>`).join('');const adopted=DB.topics.filter(t=>t.adopted).length;document.getElementById('topic-adopted-count').textContent=`已采纳 ${adopted}`;const tag={'高热度':['#FF3B30','#FFF0F0'],'上升趋势':['#FF9500','#FFF4E5'],'社会议题':['#34A853','#E8F5E9']};document.getElementById('topic-list').innerHTML=DB.topics.map(t=>`<div class="card topic-card"><div class="news-meta"><span class="topic-label">选题方向</span><span class="tag" style="color:${tag[t.tag][0]};background:${tag[t.tag][1]}">${t.tag}</span></div><h3 class="news-title">${esc(t.title)}</h3><p class="news-desc">${esc(t.angle)}</p><div class="news-actions"><span></span><button class="btn-text ${t.adopted?'active':''}" onclick="toggleTopicAdopt('${t.id}')">${t.adopted?'✓ 已采纳':'采纳'}</button></div></div>`).join('');}
function toggleHotPick(id){const h=DB.hotlist.find(x=>x.id===id);if(h){h.picked=!h.picked;save();renderHotlist();toast(h.picked?'已标记为选题':'已取消');}}function toggleTopicAdopt(id){const t=DB.topics.find(x=>x.id===id);if(t){t.adopted=!t.adopted;save();renderHotlist();toast(t.adopted?'已采纳该选题':'已取消');}}function refreshHotlist(){DB.hotlist.forEach(h=>h.heat=Math.max(100,Math.round(h.heat*(.85+Math.random()*.3))));const found=HOT_POOL.find(x=>!DB.hotlist.some(h=>h.title===x));if(found)DB.hotlist[Math.floor(Math.random()*DB.hotlist.length)]={id:uid('h'),title:found,heat:300+Math.floor(Math.random()*700),picked:false};save();renderHotlist();toast('榜单已刷新');}window.toggleHotPick=toggleHotPick;window.toggleTopicAdopt=toggleTopicAdopt;window.refreshHotlist=refreshHotlist;

// ---- 健身 ----
function renderFitness(){const f=DB.fitness;const today=f.week.find(x=>x.today);const banner=document.getElementById('fitness-today-banner');banner.className=`today-banner ${today&&!today.done?'warn':'ok'}`;banner.innerHTML=today&&!today.done?`<span>今日（周${today.day}）尚未打卡</span><button class="banner-btn" onclick="toggleTodayCheckin()">立即打卡</button>`:'<span>今日已打卡 ✓</span>';const done=f.week.filter(x=>x.done).length;document.getElementById('fitness-stats').innerHTML=[['#0066CC',`${f.water.cur}/${f.water.target}杯`,'今日饮水'],['#FF9500',`${f.kcal}千卡`,'今日消耗'],['#34A853',`${done}次`,'本周打卡'],['#AF52DE',`${done}天`,'连续打卡']].map(x=>`<div class="stat-card"><span class="stat-value" style="color:${x[0]}">${x[1]}</span><span class="stat-label">${x[2]}</span></div>`).join('');document.getElementById('water-value').textContent=`${f.water.cur}/${f.water.target}杯`;document.getElementById('water-text').textContent=`每2小时 · 已喝${f.water.cur}/${f.water.target}杯`;document.getElementById('water-fill').style.width=`${f.water.cur/f.water.target*100}%`;document.getElementById('week-text').textContent=`已完成 ${done}/7`;document.getElementById('week-dots').innerHTML=f.week.map((w,i)=>`<button class="week-dot ${w.done?'done':w.today?'today':'rest'}" onclick="toggleWeek(${i})">${w.day}</button>`).join('');document.getElementById('today-checkin-btn').textContent=today&&today.done?'取消今日打卡':'标记今日已打卡';document.getElementById('exercise-list').innerHTML=f.exercises.map(e=>`<div class="exercise-row"><span>${esc(e.name)}</span><span class="exercise-sets">${esc(e.sets)}</span><button class="btn-text danger" onclick="deleteExercise('${e.id}')">删除</button></div>`).join('')||'<div class="empty">暂无训练动作</div>';document.getElementById('kcal-input').value=f.kcal;document.getElementById('push-switch').classList.toggle('on',f.pushOn);}
function waterAdd(d){const w=DB.fitness.water;w.cur=Math.max(0,Math.min(w.target,w.cur+d));save();renderFitness();if(w.cur===w.target&&d>0)toast('今日饮水目标已达成');}function toggleWeek(i){const x=DB.fitness.week[i];if(x.today)return toggleTodayCheckin();x.done=!x.done;save();renderFitness();}function toggleTodayCheckin(){const x=DB.fitness.week.find(x=>x.today);if(x){x.done=!x.done;save();renderFitness();toast(x.done?'今日已打卡':'已取消打卡');}}function updateKcal(v){DB.fitness.kcal=Math.max(0,parseInt(v)||0);save();renderFitness();}function togglePush(){DB.fitness.pushOn=!DB.fitness.pushOn;save();renderFitness();toast(DB.fitness.pushOn?'已开启本地汇总提醒':'已关闭本地汇总提醒');}function openExerciseForm(){openModal('添加训练动作',`<div class="form-group"><label>动作名称 *</label><input id="f-name" placeholder="如：哑铃卧推"></div><div class="form-group"><label>组数 × 次数</label><input id="f-sets" placeholder="如：4组 × 12次"></div>`,()=>{const name=document.getElementById('f-name').value.trim();if(!name){toast('请填写动作名称');return false;}DB.fitness.exercises.push({id:uid('e'),name,sets:document.getElementById('f-sets').value.trim()||'—'});save();renderFitness();toast('已添加');});}function deleteExercise(id){DB.fitness.exercises=DB.fitness.exercises.filter(x=>x.id!==id);save();renderFitness();toast('已删除');}window.waterAdd=waterAdd;window.toggleWeek=toggleWeek;window.toggleTodayCheckin=toggleTodayCheckin;window.updateKcal=updateKcal;window.togglePush=togglePush;window.openExerciseForm=openExerciseForm;window.deleteExercise=deleteExercise;

// ---- 导出 / 导入 ----
function download(name,type,content){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function exportJSON(){download(`workbench-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json;charset=utf-8',JSON.stringify(DB,null,2));toast('已导出完整备份');}
function csvCell(v){return `"${String(v||'').replaceAll('"','""')}"`;}
function exportAttendanceCSV(){const columns=['日期','状态','出海开始时间','出海结束时间','出差地点','出差/请假事由','值班类型','工作小结','每日反思'];const lines=[columns.map(csvCell).join(',')].concat([...DB.attendance].sort((a,b)=>b.date.localeCompare(a.date)).map(r=>[r.date,r.status,r.offshoreStart,r.offshoreEnd,r.tripLocation,r.tripReason,r.dutyType,r.summary,r.reflection].map(csvCell).join(',')));download(`attendance-${DB.attendanceUI.month||'all'}.csv`,'text/csv;charset=utf-8','\uFEFF'+lines.join('\n'));toast('已导出考勤 CSV');}
function openExportOptions(){openModal('导出数据',`<p class="form-hint">完整备份包含全部模块数据；CSV 仅包含当前考勤记录字段，方便后续整理。</p>`,()=>{exportAttendanceCSV();});const footer=document.querySelector('.modal-footer');document.getElementById('modal-save').textContent='导出考勤 CSV';const all=document.createElement('button');all.className='btn-ghost';all.textContent='导出完整备份';all.onclick=()=>exportJSON();footer.insertBefore(all,footer.firstChild);}
function importJSON(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=x=>{try{DB=normalize(JSON.parse(x.target.result));save();renderAll();toast('已恢复本地备份');}catch(err){toast('导入失败：文件格式不正确');}};reader.readAsText(file);e.target.value='';}window.exportJSON=exportJSON;window.exportAttendanceCSV=exportAttendanceCSV;window.openExportOptions=openExportOptions;window.importJSON=importJSON;

// ---- 标签与启动 ----
const order=['screen-attendance','screen-news','screen-hotlist','screen-fitness'];let current=0;function switchTab(id,btn){const idx=order.indexOf(id),target=document.getElementById(id),active=document.querySelector('.screen.active');if(!target||target===active)return;const dir=idx>current?1:-1;current=idx;active.classList.remove('active');active.classList.toggle('exit-left',dir>0);target.classList.remove('exit-left');target.style.transform=`translateX(${dir*24}px) scale(.98)`;requestAnimationFrame(()=>requestAnimationFrame(()=>{target.classList.add('active');target.style.transform='';}));document.querySelectorAll('.tab-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');buzz(8);}window.switchTab=switchTab;
function renderAll(){renderAttendance();renderNews();renderHotlist();renderFitness();renderDataCenter();}renderAll();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();