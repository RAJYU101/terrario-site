(() => {
  const sheet = document.getElementById('menu-sheet');
  const overlay = document.getElementById('menu-overlay');
  const menuBtn = document.getElementById('menu-open');
  const setMenu = (open) => {
    sheet.hidden = !open; overlay.hidden = !open;
    if (open) header.classList.remove('is-hidden');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menuBtn.querySelector('.menu-icon-open').classList.toggle('hidden', open);
    menuBtn.querySelector('.menu-icon-close').classList.toggle('hidden', !open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(sheet.hidden));
  overlay.addEventListener('click', () => setMenu(false));
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });

  const toast = document.getElementById('toast');
  let timer;
  const notify = (msg) => {
    toast.textContent = msg; toast.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { toast.hidden = true; }, 2200);
  };

  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy, label = btn.dataset.label || '';
      const fallback = () => {
        const scope = btn.closest('div');
        const target = scope && scope.querySelector('.select-all');
        if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        notify(label + 'を選択しました。コピーしてお使いください');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => notify(label + 'をコピーしました'), fallback);
      } else { fallback(); }
    });
  });

  // プランの選択：料金ページで選んだプランを、お問い合わせページのメール欄に引き継ぐ
  const PLAN_KEY = 'terrario-plan';
  const store = {
    get() { try { return sessionStorage.getItem(PLAN_KEY); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(PLAN_KEY, v); } catch (e) {} },
  };
  document.querySelectorAll('[data-plan]').forEach(a => a.addEventListener('click', () => store.set(a.dataset.plan)));
  const select = document.getElementById('plan-select');
  const mail = document.getElementById('mail-link');
  if (select && mail) {
    const updateMail = () => {
      const subject = 'Terrario無料診断の相談';
      const body = 'ご希望のプラン：' + select.value + '\n\nご相談内容：\n';
      mail.href = 'mailto:hisashi@terrario2026.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    };
    const saved = store.get();
    if (saved) for (const o of select.options) if (o.value === saved) select.value = saved;
    select.addEventListener('change', () => { store.set(select.value); updateMail(); });
    updateMail();
  }

  // お問い合わせフォーム：資料請求ボタン（#form-request）から来たときは「資料が欲しい」を選んだ状態で開く
  const formFrame = document.getElementById('contact-form');
  if (formFrame) {
    const applyForm = () => {
      const src = location.hash === '#form-request' ? formFrame.dataset.requestSrc : formFrame.dataset.src;
      if (formFrame.getAttribute('src') !== src) formFrame.setAttribute('src', src);
    };
    applyForm();
    window.addEventListener('hashchange', applyForm);
  }

  // ===== ヘッダーの動き =====
  const header = document.getElementById('site-header');
  const bar = document.getElementById('hdr-progress-bar');
  // スクロール：縮む・ぼかしガラス・読了率・方向で出し入れ
  const HIDE_FROM = 160, DELTA = 8;
  let lastY = Math.max(0, window.scrollY), ticking = false, isHidden = false;
  const setHidden = (v) => { if (v !== isHidden) { isHidden = v; header.classList.toggle('is-hidden', v); } };
  const locked = () => !sheet.hidden || header.matches(':hover') || !!header.querySelector(':focus-visible');
  const update = () => {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    const compact = y > 12;
    if (compact !== header.classList.contains('is-compact')) header.classList.toggle('is-compact', compact);
    const d = y - lastY;
    if (y < HIDE_FROM) { setHidden(false); lastY = y; }
    else if (d > DELTA) { if (!locked()) setHidden(true); lastY = y; }
    else if (d < -DELTA) { setHidden(false); lastY = y; }
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  header.addEventListener('focusin', () => { if (header.querySelector(':focus-visible')) setHidden(false); });
  update();

  // スマホ下部の相談ボタン：ページ下部の相談の帯やフッターが見えているときは隠す
  const sticky = document.getElementById('sticky-cta');
  const ends = [...document.querySelectorAll('.page-cta, footer')];
  if (sticky && ends.length && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      sticky.hidden = seen.size > 0;
    }, { threshold: 0.05 });
    ends.forEach(el => io.observe(el));
  }
})();
