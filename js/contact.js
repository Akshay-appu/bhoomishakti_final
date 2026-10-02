/* =========================================================================
   BhoomiShakti — Contact page (contact.html)
   Sends the contact form by email using EmailJS (https://www.emailjs.com).
   Plain JavaScript, no build step. Works on GitHub Pages.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     1) EMAILJS SETTINGS — replace the three YOUR_… values with your own.
        EmailJS dashboard:
          • Public key  → Account → General → Public Key
          • Service ID  → Email Services → (your Gmail/Outlook service)
          • Template ID → Email Templates → (the template you create)
        See README.md → "Contact form (EmailJS)" for the template to paste.
     --------------------------------------------------------------------- */
  var EMAILJS = {
    publicKey: 'YOUR_PUBLIC_KEY',
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',     // email that the BhoomiShakti team receives
    autoReplyTemplateId: ''             // optional: confirmation email to the sender (sent only if they give an email)
  };

  /* ---------------------------------------------------------------------
     2) DIRECT CONTACT DETAILS (optional). Leave a value empty to hide it.
        Example: email: 'team@yourdomain.in', phone: '+91 90000 00000'
     --------------------------------------------------------------------- */
  var CONTACT_INFO = {
    email: '',
    phone: '',
    whatsapp: '',       // digits with country code, e.g. '919000000000'
    address: ''
  };

  /* ---------------------------------------------------------------------
     Topic content (hints come from the HTML; starters and subjects here)
     --------------------------------------------------------------------- */
  var SUBJECTS = {
    general: 'General enquiry', ai: 'BhoomiShakti AI enquiry', 'agri-digital': 'Agri Digital enquiry',
    seva: 'Seva service enquiry', x1: 'X1 rental enquiry', s4: 'S4 seed sower enquiry',
    jeevadhara: 'JeevaDhara soil health enquiry', jeevadhan: 'JeevaDhan enquiry', collab: 'Collaboration enquiry'
  };
  var STARTERS = {
    general: ['I would like to know more about BhoomiShakti.', 'Which project fits my farm?', 'I have a question about…'],
    ai: ['I would like a demo of BhoomiShakti AI.', 'How does the demand–response–procurement flow work?', 'Can my FPO use this platform?'],
    'agri-digital': ['I want to connect my business with farmers.', 'How can farmers list their produce?', 'I would like to know about the modules.'],
    seva: ['I need a tractor for ploughing.', 'I need farm labour for harvest.', 'I can offer my machine as a provider.'],
    x1: ['I would like to rent X1 for ploughing my field.', 'Can X1 be used on my soil type?', 'I would like to see an X1 demonstration.'],
    s4: ['I am interested in the S4 seed sower for my crop.', 'Which seeds can S4 sow?', 'I would like to see S4 working.'],
    jeevadhara: ['I want to improve the soil health of my field.', 'How is JeevaDhara prepared and applied?', 'Can JeevaDhara be used with X1?'],
    jeevadhan: ['I have cattle waste / biomass and want to use it.', 'How does the JeevaDhan cycle work?', 'I am interested in a pilot.'],
    collab: ['I would like to mentor the BhoomiShakti team.', 'Our institution is interested in collaborating.', 'I would like to discuss a pilot.']
  };
  var REPLY_LABEL = { email: 'Email', call: 'Phone call', whatsapp: 'WhatsApp' };
  var THEMES = ['theme-ai', 'theme-agri', 'theme-seva', 'theme-x1', 'theme-s4', 'theme-jeevadhara', 'theme-jeevadhan'];
  var GROW_MSG = [
    'Plant the seed: choose a topic.',
    'The seed has sprouted. Add your name.',
    'Growing well. Add your mobile number.',
    'Almost there. Where are you writing from?',
    'One more step: write your message.',
    'Fully grown! Your message is ready to send.'
  ];
  var DRAFT_KEY = 'bhoomishakti-contact-draft';
  var OUTBOX_KEY = 'bhoomishakti-contact-outbox';

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var isConfigured = function () {
    return [EMAILJS.publicKey, EMAILJS.serviceId, EMAILJS.templateId].every(function (v) { return v && v.indexOf('YOUR_') !== 0; });
  };
  var cleanMobile = function (v) { return (v || '').replace(/[\s-]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0)/, ''); };
  var validMobile = function (v) { return /^[6-9]\d{9}$/.test(cleanMobile(v)); };
  var validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
  var makeRef = function () {
    var d = new Date(), abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '';
    for (var i = 0; i < 4; i++) r += abc[Math.floor(Math.random() * abc.length)];
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'BS-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + r;
  };

  var form = $('[data-contact-form]');
  if (!form) return;
  var el = form.elements;
  var doneCard = $('[data-done]');
  var statusBox = $('[data-status]', form);
  var sendBtn = $('.btn-send', form);
  var subjectTouched = false;
  var lastSent = 0;

  /* ---------------------------------------------------------------------
     EmailJS init (SDK is loaded from the CDN before this file)
     --------------------------------------------------------------------- */
  function sdkReady() {
    if (!window.emailjs || !isConfigured()) return false;
    if (!sdkReady.done) {
      window.emailjs.init({ publicKey: EMAILJS.publicKey, blockHeadless: true, limitRate: { id: 'bhoomishakti-contact', throttle: 10000 } });
      sdkReady.done = true;
    }
    return true;
  }
  if (!isConfigured()) console.warn('[BhoomiShakti contact] EmailJS keys are not set. Add them at the top of js/contact.js.');

  /* ---------------------------------------------------------------------
     Direct contact details
     --------------------------------------------------------------------- */
  (function renderDirect() {
    var items = [];
    var ico = function (n) { return '<span class="icon-bubble"><svg class="ico" aria-hidden="true"><use href="#i-' + n + '"></use></svg></span>'; };
    if (CONTACT_INFO.email) items.push('<li><a href="mailto:' + esc(CONTACT_INFO.email) + '">' + ico('mail') + '<span>' + esc(CONTACT_INFO.email) + '<small>Email</small></span></a></li>');
    if (CONTACT_INFO.phone) items.push('<li><a href="tel:' + esc(CONTACT_INFO.phone.replace(/\s/g, '')) + '">' + ico('phone') + '<span>' + esc(CONTACT_INFO.phone) + '<small>Call</small></span></a></li>');
    if (CONTACT_INFO.whatsapp) items.push('<li><a href="https://wa.me/' + esc(CONTACT_INFO.whatsapp.replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + ico('message') + '<span>WhatsApp<small>Opens WhatsApp</small></span></a></li>');
    if (CONTACT_INFO.address) items.push('<li><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONTACT_INFO.address) + '" target="_blank" rel="noopener">' + ico('pin') + '<span>' + esc(CONTACT_INFO.address) + '<small>Open in Maps</small></span></a></li>');
    if (!items.length) return;
    $('[data-direct-list]').innerHTML = items.join('');
    $('[data-direct]').hidden = false;
  })();

  /* ---------------------------------------------------------------------
     Topic: theme colour, hint, extra fields, subject, starters
     --------------------------------------------------------------------- */
  function currentTopic() { var r = $('input[name="topic"]:checked', form); return r ? r.value : ''; }
  function topicLabel() { var r = $('input[name="topic"]:checked', form); return r ? r.getAttribute('data-label') : ''; }

  function applyTopic() {
    var t = currentTopic();
    var chip = t ? $('input[name="topic"]:checked', form).closest('.topic-chip') : null;
    THEMES.forEach(function (c) { document.body.classList.remove(c); });
    if (chip && chip.getAttribute('data-theme')) document.body.classList.add(chip.getAttribute('data-theme'));
    $('[data-topic-hint]').textContent = chip ? chip.getAttribute('data-hint') : 'Choose a topic so your message reaches the right person.';
    $$('.topic-extra', form).forEach(function (box) {
      var on = !!t && box.getAttribute('data-for').split(' ').indexOf(t) > -1;
      box.hidden = !on;
      $$('input, select', box).forEach(function (i) { i.disabled = !on; });
    });
    if (t && (!subjectTouched || !el.subject.value.trim())) { el.subject.value = SUBJECTS[t] || ''; subjectTouched = false; }
    var st = $('[data-starters]');
    st.innerHTML = t ? (STARTERS[t] || []).map(function (s) { return '<button type="button" class="starter">' + esc(s) + '</button>'; }).join('') : '';
    if (t) $('[data-err="topic"]').classList.remove('show-err');
  }

  $('[data-starters]').addEventListener('click', function (e) {
    var b = e.target.closest('.starter');
    if (!b) return;
    var ta = el.message, cur = ta.value.trim();
    ta.value = cur ? cur + ' ' + b.textContent : b.textContent;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    refresh();
  });
  el.subject.addEventListener('input', function () { subjectTouched = true; });

  /* ---------------------------------------------------------------------
     Validation
     --------------------------------------------------------------------- */
  function wantsEmail() { var r = $('input[name="preferred_contact"]:checked', form); return r && r.value === 'email'; }

  var checks = {
    from_name: function (v) { return v.trim().length >= 2; },
    mobile: function (v) { return validMobile(v); },
    from_email: function (v) { v = v.trim(); return v ? validEmail(v) : !wantsEmail(); },
    location: function (v) { return v.trim().length >= 2; },
    message: function (v) { return v.trim().length >= 20; }
  };

  function checkField(name, show) {
    var input = el[name], ok = checks[name](input.value), f = input.closest('.field');
    if (show) { f.classList.toggle('invalid', !ok); input.setAttribute('aria-invalid', String(!ok)); }
    else if (ok) { f.classList.remove('invalid'); input.removeAttribute('aria-invalid'); }
    f.classList.toggle('valid', ok && !!input.value.trim());
    return ok;
  }

  function validateAll() {
    var first = null, ok = true;
    if (!currentTopic()) { ok = false; $('[data-err="topic"]').classList.add('show-err'); first = $('input[name="topic"]', form); }
    Object.keys(checks).forEach(function (n) { if (!checkField(n, true)) { ok = false; if (!first) first = el[n]; } });
    var consentOk = el.consent.checked;
    $('[data-err="consent"]').classList.toggle('show-err', !consentOk);
    if (!consentOk) { ok = false; if (!first) first = el.consent; }
    if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return ok;
  }

  /* ---------------------------------------------------------------------
     Growing plant + live preview + counter
     --------------------------------------------------------------------- */
  var grow = $('[data-grow]');
  function refresh() {
    var done = {
      topic: !!currentTopic(),
      name: checks.from_name(el.from_name.value),
      reach: checks.mobile(el.mobile.value) && checks.from_email(el.from_email.value),
      location: checks.location(el.location.value),
      message: checks.message(el.message.value)
    };
    var n = 0;
    $$('.grow-steps li', grow).forEach(function (li) { var d = done[li.getAttribute('data-g')]; li.classList.toggle('done', d); if (d) n++; });
    var stageBox = $('.grow-stage', grow);
    if (stageBox.getAttribute('data-stage') !== String(n)) {
      stageBox.setAttribute('data-stage', n);
      $$('[data-s]', stageBox).forEach(function (g) { g.classList.toggle('on', +g.getAttribute('data-s') <= n); });
    }
    $('[data-grow-count]').textContent = n + ' / 5';
    $('[data-grow-msg]').textContent = GROW_MSG[n];
    $('[data-mini-bar]').style.width = (n * 20) + '%';
    $('[data-mini-count]').textContent = n + ' / 5';

    // preview
    var name = el.from_name.value.trim(), loc = el.location.value.trim();
    $('[data-pv="topic"]').textContent = topicLabel() || '—';
    $('[data-pv="from"]').textContent = name ? name + (loc ? ' · ' + loc : '') : '—';
    var rc = $('input[name="preferred_contact"]:checked', form);
    $('[data-pv="reply"]').textContent = rc ? REPLY_LABEL[rc.value] : '—';
    var msg = el.message.value.trim(), body = $('[data-pv="message"]');
    body.textContent = msg || 'Your message will appear here as you write…';
    body.classList.toggle('empty', !msg);

    // counter
    var len = el.message.value.length, max = +el.message.getAttribute('maxlength');
    var c = $('[data-counter]');
    c.textContent = len + ' / ' + max;
    c.classList.toggle('near', len > max * 0.9);

    // email label
    $('[data-email-opt]').textContent = wantsEmail() ? '(required for email replies)' : '(optional)';
  }

  /* ---------------------------------------------------------------------
     Draft autosave (this device only)
     --------------------------------------------------------------------- */
  var DRAFT_FIELDS = ['topic', 'role', 'from_name', 'mobile', 'from_email', 'location', 'subject', 'message', 'preferred_contact', 'rental_duration', 'preferred_date', 'crop', 'land_size', 'service_needed'];
  var draftTimer;
  function collect() {
    var o = {};
    DRAFT_FIELDS.forEach(function (n) {
      var f = el[n];
      if (!f) return;
      if (f instanceof RadioNodeList) { var r = $('input[name="' + n + '"]:checked', form); o[n] = r ? r.value : ''; }
      else o[n] = f.value;
    });
    return o;
  }
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      var d = collect(), any = Object.keys(d).some(function (k) { return k !== 'preferred_contact' && d[k]; });
      if (!any) { store.del(DRAFT_KEY); return; }
      d.subjectTouched = subjectTouched;
      if (store.set(DRAFT_KEY, d)) {
        var b = $('[data-draft-badge]');
        b.hidden = false;
        b.lastChild.textContent = 'Draft saved on this device';
      }
    }, 600);
  }
  function fill(d) {
    DRAFT_FIELDS.forEach(function (n) {
      var f = el[n];
      if (!f || d[n] == null) return;
      if (f instanceof RadioNodeList) { var r = $('input[name="' + n + '"][value="' + d[n] + '"]', form); if (r) r.checked = true; }
      else f.value = d[n];
    });
  }
  function restoreDraft() {
    var d = store.get(DRAFT_KEY);
    if (!d) return false;
    fill(d);
    subjectTouched = !!d.subjectTouched;
    var b = $('[data-draft-badge]');
    b.hidden = false;
    b.lastChild.textContent = 'Draft restored';
    return true;
  }

  /* ---------------------------------------------------------------------
     Voice typing (Web Speech API; shown only where supported)
     --------------------------------------------------------------------- */
  (function initVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var box = $('[data-voice]');
    if (!SR || !box) return;
    box.hidden = false;
    var btn = $('.mic-btn', box), lang = $('.voice-lang', box), ta = el.message;
    var rec = null, base = '', listening = false;
    try { var saved = localStorage.getItem('bhoomishakti-voice-lang'); if (saved) lang.value = saved; } catch (e) { /* ignore */ }
    lang.addEventListener('change', function () { try { localStorage.setItem('bhoomishakti-voice-lang', lang.value); } catch (e) { /* ignore */ } if (listening) { stop(); start(); } });

    function set(on) {
      listening = on;
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Stop voice typing' : 'Start voice typing');
    }
    function start() {
      rec = new SR();
      rec.lang = lang.value;
      rec.continuous = true;
      rec.interimResults = true;
      base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
      rec.onresult = function (e) {
        var finalText = '', interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        if (finalText) base += finalText.trim() + ' ';
        ta.value = (base + interim).slice(0, +ta.getAttribute('maxlength'));
        refresh(); saveDraft();
      };
      rec.onerror = function (e) {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') showStatus('info', 'Microphone access was blocked. Allow the microphone in your browser settings, or type your message.');
        else if (e.error === 'network') showStatus('info', 'Voice typing needs an internet connection. You can type your message instead.');
      };
      rec.onend = function () { set(false); ta.value = ta.value.replace(/\s+$/, ''); refresh(); };
      try { rec.start(); set(true); } catch (err) { set(false); }
    }
    function stop() { if (rec) rec.stop(); set(false); }
    btn.addEventListener('click', function () { if (listening) stop(); else { clearStatus(); start(); } });
  })();

  /* ---------------------------------------------------------------------
     Status + success panel
     --------------------------------------------------------------------- */
  function showStatus(kind, text) { statusBox.className = 'c-status is-' + kind; statusBox.textContent = text; }
  function clearStatus() { statusBox.className = 'c-status'; statusBox.textContent = ''; }
  function busy(on) { sendBtn.classList.toggle('is-busy', on); sendBtn.disabled = on; $('.send-label', sendBtn).textContent = on ? 'Sending…' : 'Send message'; }

  function showDone(params, queued) {
    doneCard.classList.toggle('is-queued', !!queued);
    $('[data-done-eyebrow]').textContent = queued ? 'Saved — waiting for internet' : 'Message sent';
    $('[data-done-title]').textContent = queued ? 'Your message will send when you are back online.' : 'Your message is on its way.';
    $('[data-done-text]').textContent = queued
      ? 'You appear to be offline. Your message is saved on this device and will be sent automatically when the connection returns. Keep this page open.'
      : 'Thank you, ' + params.from_name + '. The BhoomiShakti team will reply by ' + params.preferred_contact.toLowerCase() + '. Keep your reference handy if you follow up.';
    $('[data-ref]').textContent = params.reference_id;
    var rows = [['Topic', params.topic], ['Name', params.from_name], ['Mobile', params.mobile], ['Email', params.from_email], ['Location', params.location], ['Reply by', params.preferred_contact], ['Details', params.extra_details]];
    $('[data-summary]').innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    // replay the leaf-plane animation
    var pl = $('.plane-leaf', doneCard), tr = $('.plane-trail', doneCard);
    [pl, tr].forEach(function (n) { n.style.animation = 'none'; void n.getBoundingClientRect(); n.style.animation = ''; });
    $('[data-grow-msg]').textContent = queued ? 'Planted and waiting for rain — it sends when you are online.' : 'Sent! Your message has been planted.';
    form.hidden = true;
    doneCard.hidden = false;
    doneCard.focus({ preventScroll: true });
    doneCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('[data-copy-ref]').addEventListener('click', function () {
    var btn = this, ref = $('[data-ref]').textContent;
    var ok = function () { btn.lastChild.textContent = 'Copied'; setTimeout(function () { btn.lastChild.textContent = 'Copy'; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(ref).then(ok, function () {});
    else { var r = document.createRange(); r.selectNodeContents($('[data-ref]')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); ok(); } catch (e) { /* ignore */ } }
  });

  $('[data-new-msg]').addEventListener('click', function () {
    form.reset();
    subjectTouched = false;
    $$('.field', form).forEach(function (f) { f.classList.remove('invalid', 'valid'); });
    $$('.err', form).forEach(function (e) { e.classList.remove('show-err'); });
    $('[data-draft-badge]').hidden = true;
    clearStatus();
    applyTopic(); refresh();
    doneCard.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------------------------------------------------------------------
     Build the EmailJS template parameters
     --------------------------------------------------------------------- */
  function buildParams() {
    var v = function (n) { return el[n] && !el[n].disabled ? String(el[n].value).trim() : ''; };
    var role = $('input[name="role"]:checked', form);
    var reply = $('input[name="preferred_contact"]:checked', form);
    var extras = [
      ['Rental duration', v('rental_duration')], ['Preferred date', v('preferred_date')],
      ['Crop', v('crop')], ['Land size', v('land_size')], ['Service needed', v('service_needed')]
    ].filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ': ' + x[1]; }).join(' | ');
    var email = v('from_email');
    return {
      reference_id: makeRef(),
      topic: topicLabel(),
      subject: v('subject') || SUBJECTS[currentTopic()] || 'Website enquiry',
      from_name: v('from_name'),
      role: role ? role.value : 'Not specified',
      mobile: '+91 ' + cleanMobile(v('mobile')),
      from_email: email,
      reply_to: email,
      location: v('location'),
      message: v('message'),
      preferred_contact: reply ? REPLY_LABEL[reply.value] : 'Phone call',
      rental_duration: v('rental_duration'),
      preferred_date: v('preferred_date'),
      crop: v('crop'),
      land_size: v('land_size'),
      service_needed: v('service_needed'),
      extra_details: extras,
      submitted_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST',
      page_url: location.href.split('#')[0]
    };
  }

  function sendEmail(params) {
    if (!sdkReady()) return Promise.reject({ status: -1, text: 'not-configured' });
    return window.emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params).then(function (res) {
      if (EMAILJS.autoReplyTemplateId && params.from_email) {
        window.emailjs.send(EMAILJS.serviceId, EMAILJS.autoReplyTemplateId, params).catch(function () { /* confirmation is optional */ });
      }
      return res;
    });
  }

  /* ---------------------------------------------------------------------
     Offline outbox: send queued messages when the connection returns
     --------------------------------------------------------------------- */
  function flushOutbox() {
    var box = store.get(OUTBOX_KEY) || [];
    if (!box.length || !navigator.onLine || !isConfigured() || !window.emailjs) return;
    var p = box[0];
    sendEmail(p).then(function () {
      var rest = (store.get(OUTBOX_KEY) || []).filter(function (x) { return x.reference_id !== p.reference_id; });
      if (rest.length) store.set(OUTBOX_KEY, rest); else store.del(OUTBOX_KEY);
      if (!doneCard.hidden && $('[data-ref]').textContent === p.reference_id) showDone(p, false);
      setTimeout(flushOutbox, 1500);
    }, function () { /* try again next time we come online */ });
  }
  window.addEventListener('online', flushOutbox);

  /* ---------------------------------------------------------------------
     Submit
     --------------------------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();

    // Spam trap: real people never fill this hidden field.
    if (el.company_website.value) { showDone(buildParams(), false); return; }
    if (!validateAll()) { showStatus('error', 'Please check the highlighted fields.'); return; }
    if (Date.now() - lastSent < 30000) { showStatus('info', 'Your previous message was just sent. Please wait a few seconds before sending another.'); return; }

    var params = buildParams();

    if (!isConfigured()) {
      showStatus('info', 'Email sending is not set up yet, so this message was not sent. (Site owner: add your EmailJS keys at the top of js/contact.js.)');
      return;
    }
    if (!navigator.onLine) {
      var box = store.get(OUTBOX_KEY) || [];
      box.push(params);
      if (store.set(OUTBOX_KEY, box)) { store.del(DRAFT_KEY); showDone(params, true); }
      else showStatus('error', 'You are offline and this browser could not save the message. Please try again when you are connected.');
      return;
    }
    if (!window.emailjs) {
      showStatus('error', 'The email service could not load (it may be blocked by your network or an ad blocker). Please try again, or use the direct contact details on this page.');
      return;
    }

    busy(true);
    sendEmail(params).then(function () {
      busy(false);
      lastSent = Date.now();
      store.del(DRAFT_KEY);
      showDone(params, false);
    }, function (err) {
      busy(false);
      var s = err && err.status;
      var msg = s === 429 ? 'Too many messages in a short time. Please wait a moment and try again.'
        : s === 0 || s === undefined ? 'The message could not be sent because of a connection problem. Please check your internet and try again.'
        : 'Sorry, the message could not be sent right now. Please try again, or use the direct contact details on this page.';
      showStatus('error', msg);
      if (window.console) console.error('[BhoomiShakti contact] EmailJS error:', err);
    });
  });

  /* ---------------------------------------------------------------------
     Wire up events and start
     --------------------------------------------------------------------- */
  form.addEventListener('change', function (e) {
    if (e.target.name === 'topic') applyTopic();
    if (e.target.name === 'consent' && e.target.checked) $('[data-err="consent"]').classList.remove('show-err');
    if (e.target.name === 'preferred_contact' && el.from_email.value) checkField('from_email', false);
    refresh(); saveDraft();
  });
  form.addEventListener('input', function (e) {
    var n = e.target.name;
    if (checks[n]) checkField(n, false);
    if (n === 'mobile') e.target.value = e.target.value.replace(/[^\d\s+-]/g, '');
    clearStatus();
    refresh(); saveDraft();
  });
  Object.keys(checks).forEach(function (n) {
    el[n].addEventListener('blur', function () { if (el[n].value.trim()) checkField(n, true); });
  });

  var dateInput = el.preferred_date;
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  restoreDraft();
  var qt = new URLSearchParams(location.search).get('topic');
  if (qt) { var r = $('input[name="topic"][value="' + qt.replace(/[^a-z0-9-]/gi, '') + '"]', form); if (r) r.checked = true; }
  applyTopic();
  // keep a restored custom subject
  var d = store.get(DRAFT_KEY);
  if (d && d.subjectTouched && d.subject) { el.subject.value = d.subject; subjectTouched = true; }
  refresh();
  flushOutbox();
})();
