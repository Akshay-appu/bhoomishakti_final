/* =========================================================================
   BhoomiShakti — Quick-contact sidebar (WhatsApp · Call · Email · Google reviews)
   Self-contained add-on: it loads its own stylesheet (css/quick-contact.css)
   and builds its own HTML. Add ONE line before </body> on any page:
       <script src="js/quick-contact.js" defer></script>
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     SETTINGS — fill these in. Leave a value empty ('') to hide that button.
     --------------------------------------------------------------------- */
  var QC = {
    whatsapp: '',            // digits with country code, no + or spaces, e.g. '919876543210'
    phone: '',               // e.g. '+91 98765 43210'
    email: '',               // e.g. 'team@bhoomishakti.in'
    googleReviews: '',       // your Google Business "Ask for reviews" link, e.g. 'https://g.page/r/XXXX/review'
    // Hours shown on the WhatsApp card (India time, 24-hour clock). Set to null to hide the status line.
    hours: { days: [1, 2, 3, 4, 5, 6], open: 9, close: 18 },   // Mon–Sat, 9:00–18:00 IST
    // Preview mode: show buttons even before you add details (they open the Contact page instead).
    showWhenEmpty: true
  };

  /* --------------------------------------------------------------------- */
  if (window.__bsQuickContact) return;
  window.__bsQuickContact = true;

  var script = document.currentScript || document.querySelector('script[src*="quick-contact.js"]');
  var base = script ? script.src.replace(/js\/quick-contact\.js.*$/, '') : '';
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base + 'css/quick-contact.css';
  document.head.appendChild(css);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pageName = (document.querySelector('h1') || {}).textContent || document.title;
  pageName = pageName.replace(/\s+/g, ' ').trim().slice(0, 60);
  var contactPage = base + 'contact.html';
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var ICONS = {
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.5 9.5c0 3 2 5 5 5l1.2-1.2-2-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-2Z" fill="currentColor" stroke="none"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    star: '<path d="M11.5 2.3a.6.6 0 0 1 1 0l2.6 5.4 5.9.8a.6.6 0 0 1 .3 1l-4.3 4.2 1 5.9a.6.6 0 0 1-.8.6L12 17.4l-5.3 2.8a.6.6 0 0 1-.8-.6l1-5.9-4.3-4.2a.6.6 0 0 1 .3-1l5.9-.8Z"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>'
  };
  var svg = function (n) { return '<svg class="qc-ico" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>'; };

  /* Open / closed status from the hours setting (IST) */
  function status() {
    if (!QC.hours) return null;
    var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    var h = now.getHours() + now.getMinutes() / 60;
    var open = QC.hours.days.indexOf(now.getDay()) > -1 && h >= QC.hours.open && h < QC.hours.close;
    var fmt = function (x) { var hh = Math.floor(x), ap = hh >= 12 ? 'PM' : 'AM'; return ((hh + 11) % 12 + 1) + (x % 1 ? ':30' : '') + ' ' + ap; };
    return { open: open, text: open ? 'Available now' : 'Away · replies from ' + fmt(QC.hours.open) + ' IST' };
  }

  var TOPICS = [
    ['X1 rental', 'I would like to enquire about renting BhoomiShakti X1.'],
    ['S4 seed sower', 'I am interested in the BhoomiShakti S4 seed sower.'],
    ['Seva services', 'I need farm services (machinery / labour / transport) through BhoomiShakti Seva.'],
    ['Soil health', 'I would like to know about JeevaDhara for my soil.'],
    ['General', 'I have a question about BhoomiShakti.']
  ];

  var configured = { whatsapp: !!QC.whatsapp, phone: !!QC.phone, email: !!QC.email, reviews: !!QC.googleReviews };
  var items = [];
  if (configured.whatsapp || QC.showWhenEmpty) items.push({ id: 'whatsapp', label: 'Chat on WhatsApp', sub: 'Quick replies', icon: 'chat' });
  if (configured.phone || QC.showWhenEmpty) items.push({ id: 'call', label: 'Call us', sub: QC.phone || 'Talk to the team', icon: 'phone' });
  if (configured.email || QC.showWhenEmpty) items.push({ id: 'email', label: 'Email us', sub: QC.email || 'Write to the team', icon: 'mail' });
  if (configured.reviews || QC.showWhenEmpty) items.push({ id: 'reviews', label: 'Google reviews', sub: 'Rate your experience', icon: 'star' });
  if (!items.length) return;

  /* Build the dock */
  var root = document.createElement('div');
  root.className = 'qc';
  root.setAttribute('role', 'complementary');
  root.setAttribute('aria-label', 'Quick contact');
  root.innerHTML =
    '<button class="qc-fab" type="button" aria-expanded="false" aria-controls="qc-dock" aria-label="Contact options">' + svg('headset') + '<span class="qc-fab-x">' + svg('close') + '</span></button>' +
    '<div class="qc-dock" id="qc-dock">' +
    items.map(function (it, i) {
      return '<button type="button" class="qc-btn qc-' + it.id + '" data-qc="' + it.id + '" style="--i:' + i + '" aria-label="' + it.label + '">' +
        '<span class="qc-circle">' + svg(it.icon) + (it.id === 'whatsapp' ? '<span class="qc-ping" aria-hidden="true"></span>' : '') + '</span>' +
        '<span class="qc-tip" aria-hidden="true"><b>' + it.label + '</b><small>' + esc(it.sub) + '</small></span></button>';
    }).join('') +
    '<button type="button" class="qc-tuck" aria-label="Hide contact buttons" aria-expanded="true">' + svg('chev') + '</button>' +
    '</div>' +
    '<div class="qc-pop" role="dialog" aria-modal="false" aria-labelledby="qc-pop-title" hidden></div>' +
    '<div class="qc-toast" role="status" aria-live="polite"></div>';
  document.body.appendChild(root);

  var fab = root.querySelector('.qc-fab'), dock = root.querySelector('.qc-dock'), pop = root.querySelector('.qc-pop'), toast = root.querySelector('.qc-toast'), tuck = root.querySelector('.qc-tuck');
  var lastBtn = null;

  // Intro animation once per visit; remember tucked state
  if (!reduce) root.classList.add('qc-intro');
  setTimeout(function () { root.classList.remove('qc-intro'); }, 2200);
  if (store.get('bs-qc-tucked') === '1') { root.classList.add('is-tucked'); tuck.setAttribute('aria-expanded', 'false'); tuck.setAttribute('aria-label', 'Show contact buttons'); }
  tuck.addEventListener('click', function () {
    var t = root.classList.toggle('is-tucked');
    tuck.setAttribute('aria-expanded', String(!t));
    tuck.setAttribute('aria-label', t ? 'Show contact buttons' : 'Hide contact buttons');
    store.set('bs-qc-tucked', t ? '1' : '0');
    closePop();
  });

  // Mobile speed-dial
  fab.addEventListener('click', function () {
    var open = !root.classList.contains('is-open');
    root.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
    closePop();
  });
  var mobile = window.matchMedia('(max-width: 760px)');

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  function copy(text) {
    var done = function () { showToast('Copied: ' + text); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () {});
    else { var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } t.remove(); }
  }
  function notSet(what) {
    return '<p class="qc-note">' + what + ' has not been added yet. Meanwhile, you can reach us through the contact form.</p>' +
      '<a class="qc-action" href="' + contactPage + '">Open contact form ' + svg('chev') + '</a>';
  }

  function openPop(kind, btn) {
    lastBtn = btn;
    $all('.qc-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
    var st = status(), html = '';
    if (kind === 'whatsapp') {
      html = '<div class="qc-pop-head qc-wa-head"><span class="qc-avatar">' + svg('chat') + '</span><div><b id="qc-pop-title">BhoomiShakti</b>' +
        (st ? '<small class="qc-status ' + (st.open ? 'on' : '') + '"><i></i>' + st.text + '</small>' : '<small>WhatsApp chat</small>') + '</div></div>' +
        '<div class="qc-chat"><div class="qc-bubble">Namaskara! 🙏 How can we help you with your farm today? Choose a topic or type your message.</div>' +
        '<div class="qc-chips">' + TOPICS.map(function (t, i) { return '<button type="button" data-t="' + i + '">' + t[0] + '</button>'; }).join('') + '</div>' +
        '<form class="qc-compose"><label class="qc-sr" for="qc-msg">Your message</label><textarea id="qc-msg" rows="2" maxlength="500" placeholder="Type your message…"></textarea>' +
        '<button type="submit" aria-label="Send on WhatsApp">' + svg('send') + '</button></form>' +
        (configured.whatsapp ? '<p class="qc-fine">Opens WhatsApp with your message. Nothing is sent until you press send there.</p>' : '<p class="qc-fine">WhatsApp number not added yet — sending opens the contact form.</p>') + '</div>';
    } else if (kind === 'call') {
      html = '<div class="qc-pop-head"><span class="qc-avatar qc-call-bg">' + svg('phone') + '</span><div><b id="qc-pop-title">Call BhoomiShakti</b>' + (st ? '<small class="qc-status ' + (st.open ? 'on' : '') + '"><i></i>' + st.text + '</small>' : '') + '</div></div>' +
        (configured.phone
          ? '<p class="qc-big">' + esc(QC.phone) + '</p><div class="qc-row"><a class="qc-action" href="tel:' + esc(QC.phone.replace(/[^\d+]/g, '')) + '">' + svg('phone') + 'Call now</a><button type="button" class="qc-action ghost" data-copy="' + esc(QC.phone) + '">' + svg('copy') + 'Copy</button></div>'
          : notSet('A phone number'));
    } else if (kind === 'email') {
      var subj = encodeURIComponent('Enquiry from the BhoomiShakti website — ' + pageName);
      var body = encodeURIComponent('Hello BhoomiShakti team,\n\n[Write your message here]\n\nName:\nMobile:\nVillage / District:\n\n(Sent from: ' + location.href.split('#')[0] + ')');
      html = '<div class="qc-pop-head"><span class="qc-avatar qc-mail-bg">' + svg('mail') + '</span><div><b id="qc-pop-title">Email BhoomiShakti</b><small>We reply by email</small></div></div>' +
        (configured.email
          ? '<p class="qc-big qc-email">' + esc(QC.email) + '</p><div class="qc-row"><a class="qc-action" href="mailto:' + esc(QC.email) + '?subject=' + subj + '&body=' + body + '">' + svg('mail') + 'Write email</a>' +
            '<a class="qc-action ghost" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(QC.email) + '&su=' + subj + '&body=' + body + '">Open in Gmail</a>' +
            '<button type="button" class="qc-action ghost" data-copy="' + esc(QC.email) + '">' + svg('copy') + 'Copy</button></div>'
          : notSet('An email address'));
    } else if (kind === 'reviews') {
      html = '<div class="qc-pop-head"><span class="qc-avatar qc-star-bg">' + svg('star') + '</span><div><b id="qc-pop-title">Review BhoomiShakti</b><small>On Google</small></div></div>' +
        '<p class="qc-note">Used X1, S4, Seva or another BhoomiShakti service? Your honest review helps other farmers decide.</p>' +
        '<div class="qc-stars" aria-hidden="true">' + [1, 2, 3, 4, 5].map(function (n) { return '<span style="--n:' + n + '">' + svg('star') + '</span>'; }).join('') + '</div>' +
        (configured.reviews
          ? '<a class="qc-action" target="_blank" rel="noopener" href="' + esc(QC.googleReviews) + '">Write a Google review ' + svg('chev') + '</a>'
          : notSet('The Google review link'));
    }
    pop.innerHTML = '<button type="button" class="qc-pop-x" aria-label="Close">' + svg('close') + '</button>' + html;
    pop.className = 'qc-pop qc-pop-' + kind;
    pop.hidden = false;
    if (mobile.matches) { root.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false'); }
    requestAnimationFrame(function () { pop.classList.add('show'); });

    pop.querySelector('.qc-pop-x').addEventListener('click', function () { closePop(true); });
    $all('[data-copy]', pop).forEach(function (b) { b.addEventListener('click', function () { copy(b.getAttribute('data-copy')); }); });
    if (kind === 'whatsapp') {
      var ta = pop.querySelector('textarea');
      $all('.qc-chips button', pop).forEach(function (c) {
        c.addEventListener('click', function () {
          $all('.qc-chips button', pop).forEach(function (x) { x.classList.toggle('on', x === c); });
          ta.value = TOPICS[+c.getAttribute('data-t')][1];
          ta.focus();
        });
      });
      pop.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = ta.value.trim() || 'Hello BhoomiShakti, I have a question.';
        msg += '\n\n(From the BhoomiShakti website: ' + pageName + ')';
        if (!configured.whatsapp) { location.href = contactPage; return; }
        window.open('https://wa.me/' + QC.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        closePop();
      });
      if (!isTouch) setTimeout(function () { ta.focus(); }, 60);
    } else {
      var first = pop.querySelector('a, button:not(.qc-pop-x)');
      if (first && !isTouch) first.focus();
    }
  }
  function closePop(refocus) {
    if (pop.hidden) return;
    pop.classList.remove('show');
    $all('.qc-btn').forEach(function (b) { b.classList.remove('is-active'); });
    setTimeout(function () { pop.hidden = true; }, reduce ? 0 : 220);
    if (refocus && lastBtn) lastBtn.focus();
  }
  function $all(s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); }

  $all('.qc-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.classList.contains('is-active')) { closePop(); return; }
      openPop(b.getAttribute('data-qc'), b);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!pop.hidden) closePop(true);
      else if (root.classList.contains('is-open')) { root.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
    }
  });
  document.addEventListener('click', function (e) {
    if (!root.contains(e.target)) {
      closePop();
      if (root.classList.contains('is-open')) { root.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false'); }
    }
  });

  // Gentle attention nudge on the WhatsApp button after 12 s (once per session)
  if (!reduce) {
    var nudged = false;
    try { nudged = sessionStorage.getItem('bs-qc-nudge') === '1'; } catch (e) { /* ignore */ }
    if (!nudged) setTimeout(function () {
      var w = root.querySelector('.qc-whatsapp');
      if (w && pop.hidden && !root.classList.contains('is-tucked')) { w.classList.add('nudge'); setTimeout(function () { w.classList.remove('nudge'); }, 3200); }
      try { sessionStorage.setItem('bs-qc-nudge', '1'); } catch (e) { /* ignore */ }
    }, 12000);
  }

  if (!configured.whatsapp && !configured.phone && !configured.email && !configured.reviews && window.console) {
    console.info('[BhoomiShakti] Quick-contact buttons are in preview mode. Add your WhatsApp, phone, email and Google review link at the top of js/quick-contact.js.');
  }
})();
