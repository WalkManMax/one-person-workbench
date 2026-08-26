/* ===== 一人公司工作台 · 交互逻辑 ===== */

// 屏幕切换（带方向感过渡）
const screens = document.querySelectorAll('.screen');
const tabItems = document.querySelectorAll('.tab-item');
const order = ['screen-attendance', 'screen-news', 'screen-hotlist', 'screen-fitness'];
let current = 0;

function switchTab(id, btn) {
  const idx = order.indexOf(id);
  const target = document.getElementById(id);
  const active = document.querySelector('.screen.active');
  if (!target || target === active) return;

  // 方向：从左往右或从右往左
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

  tabItems.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // 轻微触觉反馈（支持的设备）
  if (navigator.vibrate) navigator.vibrate(8);
}

// 胶囊单选
function selectPill(el) {
  const group = el.parentElement;
  group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  if (navigator.vibrate) navigator.vibrate(5);
}

// 开关切换
function toggleSwitch(el) {
  el.classList.toggle('on');
  if (navigator.vibrate) navigator.vibrate(8);
}

// 卡片点击波纹
function tap(el) {
  el.style.transform = 'scale(0.98)';
  setTimeout(() => { el.style.transform = ''; }, 150);
}

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
    tip.style.cssText = 'position:fixed;bottom:76px;left:16px;right:16px;background:rgba(29,29,31,0.9);color:#fff;padding:12px 16px;border-radius:12px;font-size:13px;z-index:999;text-align:center;backdrop-filter:blur(10px);';
    tip.textContent = '点击浏览器「分享」→「添加到主屏幕」，即可像 APP 一样使用';
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 5000);
  }, 1500);
}
