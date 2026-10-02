/* =========================================================================
   BhoomiShakti — multi-language system (add-on module)
   -------------------------------------------------------------------------
   • Adds the language selector (header dropdown + top of the mobile menu).
   • English is the default. The visitor chooses; nothing is auto-detected.
   • The choice is stored in localStorage as "bhoomishakti_language".
   • Translations live in js/lang/<code>.js as semantic keys, e.g.
       BSL_LANG.hi["nav.home"] = "होम"
     js/lang/en.js holds the English source for every key.
   • Works on existing pages without changing their HTML or scripts:
     text is matched against the English dictionary and swapped in place;
     text that other scripts create later is translated as it appears.
   • To add a language later: create js/lang/<code>.js with the same keys
     and add one line to LANGS below.
   ========================================================================= */
(function () {
  'use strict';
  if (window.__bslLoaded) return;
  window.__bslLoaded = true;

  var STORE_KEY = 'bhoomishakti_language';
  var LANGS = [
    // code, native name, English name, short code, locale for dates
    ['en', 'English', 'English', 'EN', 'en-IN'],
    ['hi', 'हिन्दी', 'Hindi', 'HI', 'hi-IN'],
    ['kn', 'ಕನ್ನಡ', 'Kannada', 'KN', 'kn-IN'],
    ['ta', 'தமிழ்', 'Tamil', 'TA', 'ta-IN'],
    ['te', 'తెలుగు', 'Telugu', 'TE', 'te-IN'],
    ['mr', 'मराठी', 'Marathi', 'MR', 'mr-IN'],
    ['ml', 'മലയാളം', 'Malayalam', 'ML', 'ml-IN']
  ];
  var BY = {}; LANGS.forEach(function (l) { BY[l[0]] = l; });
  // The selector's own labels (shown before any dictionary has loaded).
  var UI = {
    en: ['Language', 'Choose language'], hi: ['भाषा', 'भाषा चुनें'], kn: ['ಭಾಷೆ', 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ'], ta: ['மொழி', 'மொழியைத் தேர்ந்தெடுக்கவும்'],
    te: ['భాష', 'భాషను ఎంచుకోండి'], mr: ['भाषा', 'भाषा निवडा'], ml: ['ഭാഷ', 'ഭാഷ തിരഞ്ഞെടുക്കുക']
  };

  var script = document.currentScript || document.querySelector('script[src*="bhoomishakti-language.js"]');
  var BASE = script ? script.src.replace(/js\/bhoomishakti-language\.js.*$/, '') : '';
  var HARVEST = /[?&]bsl-harvest\b/.test(location.search) || window.__bslHarvest === true;

  var store = {
    get: function () { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) { /* private mode: choice lasts for this page only */ } }
  };
  var saved = store.get();
  var current = BY[saved] ? saved : 'en';

  // stylesheet
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = BASE + 'css/bhoomishakti-language.css';
  document.head.appendChild(link);

  /* =======================================================================
     1) TEXT UNITS — shared by the translator and the dictionary harvester
     ======================================================================= */
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, U: 1, SMALL: 1, SPAN: 1, A: 1, MARK: 1, SUP: 1, SUB: 1, CODE: 1, TIME: 1, ABBR: 1, LABEL: 0 };
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var BRANDS = ['BhoomiShakti', 'BHOOMISHAKTI', 'BhoomiShakti AI', 'BhoomiShakti Agri Digital', 'BhoomiShakti Seva', 'BhoomiShakti X1', 'BhoomiShakti S4',
    'BhoomiShakti JeevaDhara', 'BhoomiShakti JeevaDhan', 'BhoomiShakti Diary', 'BHOOMISHAKTI DIARY', 'BHOOMISHAKTI <t0>DIARY</t0>', 'JeevaDhara Krishi', 'AI', 'Agri Digital',
    'Seva', 'X1', 'S4', 'JeevaDhara', 'JeevaDhan', 'Diary', 'Jeeva<t0>Dhara</t0>', 'Jeeva<t0>Dhan</t0>', 'Agri <t0>Digital</t0>', 'BhoomiShakti <t0>AI</t0>', 'BhoomiShakti <t0>Seva</t0>',
    'BhoomiShakti <t0>X1</t0>', 'BhoomiShakti <t0>S4</t0>', 'WhatsApp', 'Gmail', 'EmailJS', 'PM-KISAN', 'PMFBY', 'eNAM', 'IMD', 'KCC', 'UPI', 'JCB', 'PhonePe / UPI',
    'SIH', 'IoT', 'GPS', 'API', 'Node.js', 'Express.js', 'PostgreSQL', 'English', 'हिन्दी', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు', 'मराठी', 'മലയാളം', 'Open-Meteo.com'];
  var BRANDSET = {}; BRANDS.forEach(function (b) { BRANDSET[b] = 1; });

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function plain(src) { return src.replace(/<\/?t\d+\/?>/g, ''); }
  function skipText(src) {
    var t = norm(plain(src));
    if (t.length < 2 || !/[A-Za-z]/.test(t)) return true;
    if (BRANDSET[src] || BRANDSET[t]) return true;
    t = norm(src.replace(/<\/?t\d+\/?>/g, ' '));                                      // "a@b.in<t0>Email</t0>" is not a bare address
    if (/^(https?:\/\/|www\.)\S+$/i.test(t) || /^\S+@\S+\.\S+$/.test(t)) return true;
    if (/^\[[^\]]*\]$/.test(t)) return true;                                         // owner-filled placeholders e.g. [Member 1 Name]
    if (/^\d{1,2}(:\d{2})?\s?(AM|PM|am|pm)?(\s?–\s?\d{1,2}(:\d{2})?\s?(AM|PM|am|pm))?$/.test(t) || /^(AM|PM)$/.test(t)) return true;
    if (/^(\d{1,2}\s?(AM|PM)\s?–\s?\d{1,2}\s?(AM|PM))(, \d{1,2}\s?(AM|PM)\s?–\s?\d{1,2}\s?(AM|PM))*$/.test(t)) return true;
    if (/^BS-\d{6}-[A-Z0-9]{4}$/.test(t)) return true;
    if (/^[+\d][\d\s-]{6,}$/.test(t)) return true;
    if (/^[A-Z]{1,3}\d?$/.test(t)) return true;                                       // EN, HI, X1 …
    return false;
  }
  function skipEl(el) {
    if (!el || el.nodeType !== 1) return true;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'TEMPLATE' || tag === 'CODE' || tag === 'INPUT') return true;
    if (tag === 'TITLE' && !el.closest('svg')) return true;
    if (el.closest('.rt-item, [data-words], [data-no-translate], [contenteditable="true"], .bsl, [data-pv="from"], [data-ref], .m-name, .md-body [data-md-name], [data-w-name], .w-pick b, .w-pick small')) return true;
    var u = el.closest('.letter-body, .done-summary dd');
    if (u && !fixedText(u)) return true;
    var l = el.closest('[lang]');
    if (l && l !== document.documentElement && !/^en/i.test(l.getAttribute('lang'))) return true;
    return false;
  }
  // Places that normally hold what the user typed. They are translated only while they show the site's own fixed wording.
  var FIXED_ROWS = { 'Topic': 1, 'Reply by': 1 };
  function fixedText(u) {
    if (u.classList.contains('letter-body')) {
      var s = units.get(u), cur = norm(u.textContent);
      return (s && s.out && cur === norm(plain(s.out))) || cur === (EN && EN['contact.preview.messagePlaceholder']);
    }
    var dt = u.previousElementSibling, st = dt && units.get(dt);
    return !!dt && FIXED_ROWS[st ? st.src : norm(dt.textContent)] === 1;
  }
  // Labels and placeholders ON form fields are translated; what the user TYPES (the value) is never touched.
  function skipAttrEl(el) {
    if (!el || el.nodeType !== 1) return true;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') return true;
    if (el.closest('.bsl, [data-no-translate], .rt-item')) return true;
    return false;
  }
  var WIDE = false;                                   // true only while sweeping regional text back to English
  function hasLetters(s) { return (WIDE ? /[A-Za-z\u0900-\u0D7F]/ : /[A-Za-z]/).test(s); }
  function isAtomic(el) { return el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName.toLowerCase() === 'svg' || el.tagName === 'BR' || el.tagName === 'IMG' || el.tagName === 'I' && !el.textContent.trim(); }
  function inlineSimple(el) {
    if (isAtomic(el)) return true;
    if (!INLINE[el.tagName]) return false;
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) return false;
    return true;
  }
  // A "unit" is an element whose direct text plus simple inline children form one sentence.
  function isUnit(el) {
    if (skipEl(el)) return false;
    if (el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName.toLowerCase() !== 'text' && el.tagName.toLowerCase() !== 'tspan' && el.tagName.toLowerCase() !== 'title') return false;
    var letters = false;
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { if (hasLetters(c.data)) letters = true; }
      else if (c.nodeType === 1) { if (!inlineSimple(c)) return false; }
    }
    return letters;
  }
  function serialize(nodes, texts) {
    var out = '', k = 0;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) out += texts[i];
      else if (n.nodeType === 1) { out += isAtomic(n) ? '<t' + k + '/>' : '<t' + k + '>' + texts[i] + '</t' + k + '>'; k++; }
    }
    return norm(out).replace(/\s+(<\/t\d+>)/g, '$1').replace(/(<t\d+>)\s+/g, '$1');
  }
  function snapshot(el) {
    var nodes = Array.prototype.slice.call(el.childNodes).filter(function (n) { return n.nodeType === 1 || n.nodeType === 3; });
    var texts = nodes.map(function (n) { return n.nodeType === 3 ? n.data : (isAtomic(n) ? null : n.textContent); });
    return { nodes: nodes, texts: texts, src: serialize(nodes, texts), out: null, set: null };
  }
  // Walk a subtree and report every translatable unit (elements) and loose text nodes.
  function walk(root, onUnit, onText) {
    if (root.nodeType === 3) { if (root.parentElement && !skipEl(root.parentElement) && hasLetters(root.data)) onText(root); return; }
    if (root.nodeType !== 1 || skipEl(root)) return;
    if (isUnit(root)) { onUnit(root); return; }
    for (var c = root.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { if (hasLetters(c.data)) onText(c); }
      else if (c.nodeType === 1) walk(c, onUnit, onText);
    }
  }
  function attrTargets(root, cb) {
    var list = root.nodeType === 1 ? [root].concat(Array.prototype.slice.call(root.querySelectorAll('[placeholder],[aria-label],[title],[alt]'))) : [];
    list.forEach(function (el) {
      if (skipAttrEl(el)) return;
      ATTRS.forEach(function (a) { if (el.hasAttribute && el.hasAttribute(a)) cb(el, a); });
    });
  }

  /* =======================================================================
     2) DICTIONARY LOOKUP
     ======================================================================= */
  window.BSL_LANG = window.BSL_LANG || {};
  var EN = null, TR = null;          // key -> text
  var exact = {}, shapes = {}, named = [];
  var NUM = /(?<![A-Za-z0-9{])[₹]?[−-]?\d[\d,]*(?:\.\d+)?(?![A-Za-z0-9}])/g;
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function indexEnglish() {
    exact = {}; shapes = {}; named = [];
    Object.keys(EN).forEach(function (key) {
      var t = EN[key];
      if (/\{[a-z]+\}/.test(t)) {
        var names = [];
        var re = '^' + esc(t).replace(/\\\{([a-z]+)\\\}/g, function (m, n) { names.push(n); return '(.+?)'; }) + '$';
        named.push({ key: key, re: new RegExp(re), names: names });
      } else if (/\{\d+\}/.test(t)) shapes[t] = key;
      else exact[t] = key;
    });
  }
  function fill(str, vals) { return str.replace(/\{(\w+)\}/g, function (m, k) { return vals[k] != null ? vals[k] : m; }); }
  var misses = {}, REGIONAL = /[\u0900-\u0D7F]/;
  // brand names, addresses, numbers… are left alone — unless the dictionary has that exact wording
  function skipSrc(src) { return skipText(src) && !exact[src]; }
  function translate(src, depth) {
    var r = translateCore(src, depth);
    if (!r && !depth && TR && src && !skipText(src) && !REGIONAL.test(src)) misses[src] = 1;   // text already in a regional script is not a miss
    return r;
  }
  function translateCore(src, depth) {
    if (!TR || !src) return null;
    var k = exact[src];
    if (k) return TR[k] || null;
    // numbers -> {0}, {1}
    var nums = [], sh = src.replace(NUM, function (m) { nums.push(m); return '{' + (nums.length - 1) + '}'; });
    if (nums.length && shapes[sh] && TR[shapes[sh]]) return fill(TR[shapes[sh]], nums);
    // named templates (names, places, chosen options)
    for (var i = 0; i < named.length; i++) {
      var m = named[i].re.exec(src);
      if (m && TR[named[i].key]) {
        var vals = {};
        named[i].names.forEach(function (n, j) { var v = m[j + 1]; vals[n] = (depth || 0) < 2 ? (translate(v, (depth || 0) + 1) || translateList(v) || v) : v; });
        return fill(TR[named[i].key], vals);
      }
    }
    // text that sits next to an icon (<t0/>Available now): translate the words, keep the icon where it was
    var ic = /^((?:<t\d+\/>)*)([^<]*?)((?:<t\d+\/>)*)$/.exec(src);
    if (ic && (ic[1] || ic[3]) && ic[2] && (depth || 0) < 2) {
      var core = translate(ic[2], (depth || 0) + 1);
      if (core) return ic[1] + core + ic[3];
    }
    // "A · B" pieces
    if ((depth || 0) < 2 && src.indexOf(' · ') > 0) {
      var parts = src.split(' · '), any = false;
      var outp = parts.map(function (p) { var r = translate(p, (depth || 0) + 1) || dateText(p); if (r) any = true; return r || p; });
      if (any) return outp.join(' · ');
    }
    return dateText(src);
  }
  function translateList(v) {
    if (v.indexOf(', ') < 0) return null;
    var any = false, out = v.split(', ').map(function (p) { var r = translate(p, 3); if (r) any = true; return r || p; });
    return any ? out.join(', ') : null;
  }
  var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11, January: 0, February: 1, March: 2, April: 3, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  function dateText(s) {
    if (current === 'en') return null;
    var m = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{1,2}) ([A-Za-z]{3,4})$/.exec(s), loc = BY[current][4];
    try {
      if (m && MONTHS[m[3]] != null) {
        var y = new Date().getFullYear(), d = new Date(y, MONTHS[m[3]], +m[2]);
        if (d < new Date(Date.now() - 200 * 864e5)) d.setFullYear(y + 1);
        return new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
      }
      m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(s);
      if (m && MONTHS[m[2]] != null) return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(+m[3], MONTHS[m[2]], +m[1]));
    } catch (e) { /* ignore */ }
    return null;
  }

  /* =======================================================================
     3) APPLY / RESTORE
     ======================================================================= */
  var units = new Map(), loose = new Map(), attrs = new Map(), svgSizes = new Map();
  var titleOrig = null;
  var applying = false;

  function parseTr(tr) {
    var toks = [], re = /<t(\d+)\/>|<t(\d+)>([\s\S]*?)<\/t\2>/g, last = 0, m;
    while ((m = re.exec(tr))) {
      if (m.index > last) toks.push({ text: tr.slice(last, m.index) });
      toks.push(m[1] != null ? { el: +m[1] } : { el: +m[2], inner: m[3] });
      last = re.lastIndex;
    }
    if (last < tr.length) toks.push({ text: tr.slice(last) });
    return toks;
  }
  function elementList(st) { return st.nodes.filter(function (n) { return n.nodeType === 1; }); }
  function restoreUnit(el, st) {
    st.nodes.forEach(function (n, i) { if (n.nodeType === 3) n.data = st.texts[i]; else if (st.texts[i] != null) n.textContent = st.texts[i]; });
    var same = el.childNodes.length === st.nodes.length && st.nodes.every(function (n, i) { return el.childNodes[i] === n; });
    if (!same) { while (el.firstChild) el.removeChild(el.firstChild); st.nodes.forEach(function (n) { el.appendChild(n); }); }
    st.out = null;
    fitSvgRestore(el);
  }
  // Put a marked-up sentence into an element, re-using the element's own inline children (links, bold words, icons).
  function placeUnit(el, st, tr) {
    var els = elementList(st), toks = parseTr(tr), used = {};
    // safety: every element must still be placed exactly once
    var ok = toks.every(function (t) { return t.text != null || (els[t.el] && !used[t.el] && (used[t.el] = 1)); }) && Object.keys(used).length === els.length;
    if (!ok) return false;
    var kids = [];
    toks.forEach(function (t) {
      if (t.text != null) kids.push(document.createTextNode(t.text));
      else { var n = els[t.el]; if (t.inner != null && !isAtomic(n)) n.textContent = t.inner; kids.push(n); }
    });
    while (el.firstChild) el.removeChild(el.firstChild);
    kids.forEach(function (n) { el.appendChild(n); });
    return true;
  }
  function applyUnit(el) {
    var st = units.get(el);
    if (!st) { st = snapshot(el); units.set(el, st); }
    if (skipSrc(st.src)) return;
    var tr = translate(st.src);
    if (!tr || !placeUnit(el, st, tr)) { if (st.out) restoreUnit(el, st); return; }
    st.out = tr;
    st.set = elementList(st).map(function (n) { return isAtomic(n) ? null : n.textContent; });
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') fitSvg(el);
  }
  function applyLoose(node) {
    var st = loose.get(node);
    if (!st) { st = { orig: node.data, out: null }; loose.set(node, st); }
    var src = norm(st.orig);
    if (skipSrc(src)) return;
    var tr = translate(src);
    if (tr) { var lead = /^\s/.test(st.orig) ? ' ' : '', trail = /\s$/.test(st.orig) ? ' ' : ''; node.data = lead + tr + trail; st.out = node.data; }
    else if (st.out) { node.data = st.orig; st.out = null; }
  }
  function applyAttr(el, a) {
    var m = attrs.get(el); if (!m) { m = {}; attrs.set(el, m); }
    var cur = el.getAttribute(a);
    if (!m[a] || (cur !== m[a].out && cur !== m[a].orig)) m[a] = { orig: cur, out: null };
    var src = norm(m[a].orig);
    if (skipSrc(src)) return;
    var tr = translate(src);
    if (tr) { el.setAttribute(a, tr); m[a].out = tr; } else if (m[a].out) { el.setAttribute(a, m[a].orig); m[a].out = null; }
  }
  function fitSvg(el) {
    try {
      if (!el.getComputedTextLength) return;
      var o = svgSizes.get(el);
      if (!o) { o = { style: el.getAttribute('style'), w: null }; svgSizes.set(el, o); }
      el.setAttribute('style', o.style || '');
      if (o.w == null) return;
      var w = el.getComputedTextLength();
      if (w > o.w * 1.06) {
        var fs = parseFloat(getComputedStyle(el).fontSize) || 14;
        el.style.fontSize = Math.max(fs * 0.62, fs * o.w * 1.06 / w).toFixed(2) + 'px';
      }
    } catch (e) { /* ignore */ }
  }
  function measureSvg(el) {
    if (el.namespaceURI !== 'http://www.w3.org/2000/svg' || !el.getComputedTextLength) return;
    var o = svgSizes.get(el);
    if (!o) { o = { style: el.getAttribute('style'), w: null }; svgSizes.set(el, o); }
    if (o.w == null) { try { o.w = el.getComputedTextLength(); } catch (e) { o.w = 0; } }
  }
  function fitSvgRestore(el) { var o = svgSizes.get(el); if (o) { if (o.style == null) el.removeAttribute('style'); else el.setAttribute('style', o.style); } }

  function translateTree(root) {
    walk(root, function (u) { measureSvg(u); applyUnit(u); }, applyLoose);
    attrTargets(root.nodeType === 1 ? root : root.parentElement || document.body, applyAttr);
  }
  /* Other scripts sometimes COPY text we translated (for example into a pop-up). Those copies are not tracked,
     so before restoring we remember "translated -> English" for everything on the page and sweep the copies back too. */
  function tagOrder(out, src) {
    var map = {}, k = 0, re = /<(\/?)t(\d+)(\/?)>/g;
    var o = out.replace(re, function (m, a, i, b) { if (map[i] == null) map[i] = k++; return '<' + a + 't' + map[i] + b + '>'; });
    return [norm(o).replace(/\s+(<\/t\d+>)/g, '$1').replace(/(<t\d+>)\s+/g, '$1'), src.replace(re, function (m, a, i, b) { return '<' + a + 't' + (map[i] != null ? map[i] : i) + b + '>'; })];
  }
  function sweepBack(pairs) {
    WIDE = true;
    try {
      walk(document.body, function (u) {
        if (!REGIONAL.test(u.textContent)) return;
        var st = snapshot(u), en = pairs[st.src];
        if (en) placeUnit(u, st, en);
      }, function (n) {
        if (!REGIONAL.test(n.data)) return;
        var en = pairs[norm(n.data)];
        if (en) n.data = (/^\s/.test(n.data) ? ' ' : '') + plain(en) + (/\s$/.test(n.data) ? ' ' : '');
      });
      attrTargets(document.body, function (el, a) {
        var v = el.getAttribute(a), en = v && REGIONAL.test(v) && pairs[norm(v)];
        if (en) el.setAttribute(a, plain(en));
      });
    } catch (e) { /* never block the switch */ }
    WIDE = false;
  }
  function restoreAll() {
    var pairs = {}, any = false;
    function pair(out, src) { if (out && src && pairs[out] == null) { pairs[out] = src; any = true; } }
    units.forEach(function (st) { if (st.out) { var p = tagOrder(st.out, st.src); pair(p[0], p[1]); pair(norm(plain(p[0])), plain(p[1])); } });
    loose.forEach(function (st) { if (st.out) pair(norm(st.out), norm(st.orig)); });
    attrs.forEach(function (m) { Object.keys(m).forEach(function (a) { if (m[a].out) pair(norm(m[a].out), norm(m[a].orig)); }); });
    units.forEach(function (st, el) { if (st.out) restoreUnit(el, st); });
    loose.forEach(function (st, n) { if (st.out) { n.data = st.orig; st.out = null; } });
    attrs.forEach(function (m, el) { Object.keys(m).forEach(function (a) { if (m[a].out) { el.setAttribute(a, m[a].orig); m[a].out = null; } }); });
    if (titleOrig != null) document.title = titleOrig;
    if (any) sweepBack(pairs);
  }
  function translateTitle() {
    if (titleOrig == null) titleOrig = document.title;
    var t = translate(norm(titleOrig));
    document.title = t || titleOrig;
  }

  /* ---- watch for text that other scripts add or change ---- */
  var observer = null;
  function unitRootOf(node) {
    var el = node.nodeType === 1 ? node : node.parentElement, best = null;
    for (var i = 0; el && i < 4; i++, el = el.parentElement) {
      var st = units.get(el);
      if ((st && st.out && !skipEl(el)) || isUnit(el)) best = el; else if (best) break;
    }
    return best;
  }
  function onMutations(recs) {
    if (applying || current === 'en' || !TR) return;
    applying = true;
    var seen = new Set();
    recs.forEach(function (r) {
      if (r.type === 'attributes') { if (ATTRS.indexOf(r.attributeName) > -1 && !skipAttrEl(r.target)) applyAttr(r.target, r.attributeName); return; }
      var target = r.target;
      // a tracked sentence that now holds the user's own words is released, never restored over them
      for (var h = target.nodeType === 1 ? target : target.parentElement, d = 0; h && d < 4; d++, h = h.parentElement) {
        if (units.has(h) && skipEl(h)) units.delete(h);
      }
      var root = unitRootOf(target);
      if (root) {
        if (seen.has(root)) return; seen.add(root);
        var st = units.get(root);
        if (st && st.out) {
          // did a script change part of a unit we had translated?
          var els = elementList(st), changed = false, stillOurs = els.every(function (n) { return n.parentNode === root; });
          if (stillOurs) {
            els.forEach(function (n, j) { var idx = st.nodes.indexOf(n); if (!isAtomic(n) && st.set && n.textContent !== st.set[j]) { st.texts[idx] = n.textContent; changed = true; } });
            var curText = Array.prototype.map.call(root.childNodes, function (n) { return n.nodeType === 3 ? n.data : ''; }).join('');
            var ourText = parseTr(st.out).filter(function (t) { return t.text != null; }).map(function (t) { return t.text; }).join('');
            if (!changed && norm(curText) === norm(ourText)) return;
            if (norm(curText) !== norm(ourText)) { units.delete(root); }
            else { st.src = serialize(st.nodes, st.texts); }
          } else units.delete(root);
        } else if (st && !st.out) {
          units.delete(root);
        }
        measureSvg(root); applyUnit(root);
        attrTargets(root, applyAttr);
      } else {
        if (r.type === 'characterData') { var ls = loose.get(r.target); if (ls && r.target.data === ls.out) return; loose.delete(r.target); applyLoose(r.target); return; }
        r.addedNodes && Array.prototype.forEach.call(r.addedNodes, function (n) { if (n.nodeType === 1 || n.nodeType === 3) translateTree(n); });
      }
    });
    observer.takeRecords();
    applying = false;
  }
  function startObserver() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
  }
  function translatePage() {
    applying = true;
    translateTree(document.body);
    translateTitle();
    if (observer) observer.takeRecords();
    applying = false;
    startObserver();
  }

  /* =======================================================================
     4) LOADING DICTIONARIES
     ======================================================================= */
  var loading = {};
  function loadLang(code) {
    if (window.BSL_LANG[code]) return Promise.resolve();
    if (loading[code]) return loading[code];
    loading[code] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = BASE + 'js/lang/' + code + '.js';
      s.onload = function () { window.BSL_LANG[code] ? resolve() : reject(new Error('empty')); };
      s.onerror = function () { delete loading[code]; reject(new Error('load failed: ' + code)); };
      document.head.appendChild(s);
    });
    return loading[code];
  }

  /* =======================================================================
     5) THE SELECTOR (header + mobile menu)
     ======================================================================= */
  var GLOBE = '<svg class="bsl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>';
  var CARET = '<svg class="bsl-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var CHECK = '<svg class="bsl-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var desk = null, mob = null;

  function optionHTML(role) {
    return LANGS.map(function (l) {
      return '<button type="button" class="bsl-opt" role="' + role + '" data-lang="' + l[0] + '" aria-checked="false">' +
        '<span class="bsl-native" lang="' + l[0] + '">' + l[1] + '</span>' + (l[0] === 'en' ? '' : '<span class="bsl-en">' + l[2] + '</span>') + CHECK + '</button>';
    }).join('');
  }
  function buildSelectors() {
    var cta = document.querySelector('.site-header .nav-cta');
    if (cta && !cta.querySelector('.bsl-desk')) {
      desk = document.createElement('div');
      desk.className = 'bsl bsl-desk';
      desk.innerHTML = '<button type="button" class="bsl-btn" aria-haspopup="menu" aria-expanded="false" aria-controls="bsl-menu">' + GLOBE +
        '<span class="bsl-code">EN</span>' + CARET + '</button><div class="bsl-menu" id="bsl-menu" role="menu" hidden>' + optionHTML('menuitemradio') + '</div>';
      cta.insertBefore(desk, cta.firstChild);
      wireDesk();
    }
    var top = document.querySelector('#mobile-nav .mobile-nav-top');
    if (top && !document.querySelector('.bsl-mob')) {
      mob = document.createElement('div');
      mob.className = 'bsl bsl-mob';
      mob.innerHTML = '<p class="bsl-mob-title" id="bsl-mob-title">' + GLOBE + '<span class="bsl-mob-label"></span></p><div class="bsl-grid" role="radiogroup" aria-labelledby="bsl-mob-title">' + optionHTML('radio') + '</div>';
      top.parentNode.insertBefore(mob, top.nextSibling);
      Array.prototype.forEach.call(mob.querySelectorAll('.bsl-opt'), function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-lang')); }); });
      mob.querySelector('.bsl-grid').addEventListener('keydown', function (e) {
        var opts = Array.prototype.slice.call(mob.querySelectorAll('.bsl-opt')), i = opts.indexOf(document.activeElement);
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d && i > -1) { e.preventDefault(); opts[(i + d + opts.length) % opts.length].focus(); }
      });
    }
    syncUI();
  }
  function wireDesk() {
    var btn = desk.querySelector('.bsl-btn'), menu = desk.querySelector('.bsl-menu');
    var opts = function () { return Array.prototype.slice.call(menu.querySelectorAll('.bsl-opt')); };
    function open(focusSel) {
      menu.hidden = false; desk.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      var o = opts(), cur = menu.querySelector('[aria-checked="true"]') || o[0];
      (focusSel === 'last' ? o[o.length - 1] : cur).focus();
    }
    function close(refocus) { menu.hidden = true; desk.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); open('last'); }
    });
    menu.addEventListener('keydown', function (e) {
      var o = opts(), i = o.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); o[(i + 1) % o.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); o[(i - 1 + o.length) % o.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); o[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); o[o.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    opts().forEach(function (b) { b.addEventListener('click', function () { close(true); choose(b.getAttribute('data-lang')); }); });
    document.addEventListener('click', function (e) { if (!desk.contains(e.target)) close(false); });
  }
  function syncUI() {
    var l = BY[current], ui = UI[current] || UI.en;
    if (desk) {
      desk.querySelector('.bsl-code').textContent = l[3];
      var b = desk.querySelector('.bsl-btn');
      b.setAttribute('aria-label', ui[0] + ': ' + l[1] + (l[0] === 'en' ? '' : ' (' + l[2] + ')') + '. ' + ui[1]);
      b.setAttribute('title', ui[1]);
      desk.querySelector('.bsl-menu').setAttribute('aria-label', ui[1]);
    }
    if (mob) mob.querySelector('.bsl-mob-label').textContent = ui[0] + (current === 'en' ? '' : ' · Language');
    document.querySelectorAll('.bsl-opt').forEach(function (o) { o.setAttribute('aria-checked', String(o.getAttribute('data-lang') === current)); });
  }

  /* =======================================================================
     6) NAVBAR FIT — keep the existing menu; switch to the existing hamburger
        menu only when the (possibly longer) labels do not fit.
     ======================================================================= */
  var html = document.documentElement;
  function navFits() {
    var nav = document.querySelector('.site-header .nav'), links = document.querySelector('.nav-links');
    if (!nav || !links || getComputedStyle(links).display === 'none') return true;
    if (nav.scrollWidth > nav.clientWidth + 1) return false;
    var first = links.firstElementChild, last = links.lastElementChild;
    if (first && last && Math.abs(first.getBoundingClientRect().top - last.getBoundingClientRect().top) > 4) return false;
    return Array.prototype.every.call(links.querySelectorAll('.nav-link'), function (a) { return a.scrollHeight <= a.clientHeight + 2 && a.getBoundingClientRect().height < 60; });
  }
  function fitNav() {
    html.classList.remove('bsl-tight', 'bsl-burger');
    if (navFits()) return;
    html.classList.add('bsl-tight');
    if (navFits()) return;
    html.classList.add('bsl-burger');
  }
  /* re-check as the window changes size (at once, and again when the layout has settled) */
  var rz;
  window.addEventListener('resize', function () { fitNav(); clearTimeout(rz); rz = setTimeout(fitNav, 160); });

  /* =======================================================================
     7) CHOOSING A LANGUAGE
     ======================================================================= */
  function setHtmlLang() {
    html.setAttribute('lang', current === 'en' ? 'en' : current);
    html.setAttribute('data-bsl-lang', current);
  }
  function apply() {
    if (current === 'en') {
      applying = true; restoreAll(); if (observer) observer.takeRecords(); applying = false;
      TR = null; setHtmlLang(); syncUI(); fitNav();
      return Promise.resolve();
    }
    html.classList.add('bsl-busy');
    return loadLang('en').then(function () { return loadLang(current); }).then(function () {
      if (!EN) { EN = window.BSL_LANG.en; indexEnglish(); }
      applying = true; restoreAll(); applying = false;
      TR = window.BSL_LANG[current];
      setHtmlLang(); syncUI(); translatePage(); fitNav();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
      setTimeout(fitNav, 600);
    }).catch(function (e) {
      if (window.console) console.warn('[BhoomiShakti language] could not load ' + current + ':', e && e.message);
      current = 'en'; setHtmlLang(); syncUI();
    }).then(function () { html.classList.remove('bsl-busy'); });
  }
  function choose(code) {
    if (!BY[code] || code === current) return;
    current = code;
    store.set(code);
    apply();
  }

  /* =======================================================================
     8) HARVEST MODE (development only): list every translatable unit
     ======================================================================= */
  function regionOf(el) {
    if (el.closest('.site-header')) return 'nav';
    if (el.closest('#mobile-nav')) return 'nav';
    if (el.closest('.site-footer')) return 'footer';
    if (el.closest('.qc')) return 'sidebar';
    if (el.closest('.subnav')) return 'subnav';
    var s = el.closest('section[id], dialog, aside[id], [data-mdialog], form[id]');
    return s ? (s.id || (s.getAttribute('class') || 'main').split(' ')[0]) : 'main';
  }
  window.BSL = {
    version: 1,
    get language() { return current; },
    setLanguage: choose,
    harvest: function (root) {
      var out = [];
      root = root || document.body;
      walk(root, function (u) { var st = snapshot(u); if (!skipText(st.src)) out.push({ t: st.src, kind: 'unit', region: regionOf(u), svg: u.namespaceURI === 'http://www.w3.org/2000/svg' }); },
        function (n) { var t = norm(n.data); if (!skipText(t)) out.push({ t: t, kind: 'text', region: regionOf(n.parentElement) }); });
      attrTargets(root, function (el, a) { var v = norm(el.getAttribute(a)); if (!skipText(v)) out.push({ t: v, kind: 'attr', attr: a, region: regionOf(el) }); });
      return out;
    },
    lookup: function (s) { return translate(s); },
    untranslated: function () { return Object.keys(misses); }
  };

  /* ---- start ---- */
  function start() {
    buildSelectors();
    setHtmlLang();
    fitNav();
    if (!HARVEST && current !== 'en') apply();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
