/* =========================================================================
   BhoomiShakti Diary — product showcase page (bhoomishakti-diary.html)
   Page-only script. The shared js/script.js still runs the header, leaves
   and scroll reveals; this file only adds the Diary page's own behaviour.
   Nothing is stored and nothing is sent anywhere.
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) document.documentElement.classList.add('js-anim');

  /* -----------------------------------------------------------------------
     1) Regional-language tagline: Hindi → Kannada → Tamil → Telugu →
        Marathi → Malayalam, every 5 seconds, no page reload.
     ----------------------------------------------------------------------- */
  (function rotator() {
    var box = $('[data-rotator]');
    if (!box) return;
    var items = $$('.rt-item', box), dots = $$('.rt-dot', box), pauseBtn = $('[data-rt-pause]', box);
    var i = 0, timer = null, userPaused = false, hoverPaused = false;
    var INTERVAL = 5000;

    function show(n) {
      if (n === i) return;
      var prev = items[i];
      prev.classList.remove('is-on');
      prev.classList.add('is-out');
      prev.setAttribute('aria-hidden', 'true');
      setTimeout(function () { prev.classList.remove('is-out'); }, reduce ? 0 : 900);
      i = (n + items.length) % items.length;
      items[i].classList.add('is-on');
      items[i].removeAttribute('aria-hidden');
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function start() { stop(); if (!userPaused && !hoverPaused && !document.hidden) timer = setInterval(function () { show(i + 1); }, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; }

    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); start(); }); });
    pauseBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Resume tagline rotation' : 'Pause tagline rotation');
      start();
    });
    // pause while the visitor is reading or interacting with it
    box.addEventListener('mouseenter', function () { hoverPaused = true; stop(); });
    box.addEventListener('mouseleave', function () { hoverPaused = false; start(); });
    box.addEventListener('focusin', function () { hoverPaused = true; stop(); });
    box.addEventListener('focusout', function () { hoverPaused = false; start(); });
    document.addEventListener('visibilitychange', start);
    dots[0].setAttribute('aria-current', 'true');
    start();
  })();

  /* -----------------------------------------------------------------------
     2) Hero phone: gentle parallax
     ----------------------------------------------------------------------- */
  (function parallax() {
    var el = $('[data-parallax]');
    if (!el || reduce) return;
    var k = parseFloat(el.getAttribute('data-parallax')) || 0.05, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        el.style.transform = 'translateY(' + Math.min(y * k, 36).toFixed(1) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  })();

  /* -----------------------------------------------------------------------
     3) How it works: a green path through the field, drawn as you scroll
     ----------------------------------------------------------------------- */
  (function howPath() {
    var wrap = $('[data-how]');
    if (!wrap) return;
    var svg = $('.hw-path', wrap), track = $('.hw-track', svg), draw = $('.hw-draw', svg), seed = $('.hw-seed', svg);
    var steps = $$('.hw-step', wrap);
    var total = 0, marks = [], ticking = false;

    function centre(el, box) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }; }
    function build() {
      var box = wrap.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      var pts = steps.map(function (s) { return centre($('.hw-node', s), box); });
      var single = Math.abs(pts[0].x - pts[pts.length - 1].x) < 4 && Math.abs(pts[0].x - pts[1].x) < 4;
      var d = 'M' + pts[0].x + ' ' + pts[0].y, ds = [d];
      for (var k = 1; k < pts.length; k++) {
        var a = pts[k - 1], b = pts[k], dx = b.x - a.x, dy = b.y - a.y, c1, c2;
        if (Math.abs(dy) > Math.abs(dx)) {                // moving down (row change / mobile)
          var w = single ? (k % 2 ? 26 : -26) : (a.x > box.width / 2 ? 90 : -90);
          c1 = [a.x + w, a.y + dy / 3]; c2 = [b.x + w, b.y - dy / 3];
        } else {                                          // moving along a row: a gentle field-path wave
          c1 = [a.x + dx / 3, a.y - 34]; c2 = [b.x - dx / 3, b.y + 34];
        }
        d += ' C' + c1[0] + ' ' + c1[1] + ' ' + c2[0] + ' ' + c2[1] + ' ' + b.x + ' ' + b.y;
        ds.push(d);
      }
      track.setAttribute('d', d);
      draw.setAttribute('d', d);
      total = draw.getTotalLength();
      // length at which each step is reached
      var probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(probe);
      marks = ds.map(function (sub, k) { if (k === 0) return 0; probe.setAttribute('d', sub); return probe.getTotalLength(); });
      svg.removeChild(probe);
      draw.style.strokeDasharray = total + ' ' + total;
      update();
    }
    function update() {
      ticking = false;
      if (!total) return;
      var r = wrap.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.72 - r.top) / (r.height * 0.92)));
      var len = total * p;
      draw.style.strokeDashoffset = (total - len).toFixed(1);
      var pt = draw.getPointAtLength(len);
      seed.setAttribute('cx', pt.x.toFixed(1));
      seed.setAttribute('cy', pt.y.toFixed(1));
      steps.forEach(function (s, k) { s.classList.toggle('on', len >= marks[k] - 10); });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 120); });
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    setTimeout(build, 1200); // after reveal animations settle
  })();

  /* -----------------------------------------------------------------------
     4) A day on the farm (illustrative): records appear as you scroll and
        the sun moves across the sky to the time of the latest record
     ----------------------------------------------------------------------- */
  (function dayTimeline() {
    var box = $('[data-day]');
    if (!box) return;
    var items = $$('.dy-item', box), sun = $('.dy-sun', box), tEl = $('[data-dy-time]', box), cEl = $('[data-dy-count]', box);
    var last = -1, ticking = false;
    function sunAt(hour) {
      var t = Math.max(0, Math.min(1, (hour - 6) / (19 - 6)));
      var x = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 200 + t * t * 370;
      var y = (1 - t) * (1 - t) * 200 + 2 * (1 - t) * t * -10 + t * t * 200;
      sun.setAttribute('cx', x.toFixed(1));
      sun.setAttribute('cy', y.toFixed(1));
    }
    function update() {
      ticking = false;
      var vh = window.innerHeight, n = -1;
      items.forEach(function (it, k) {
        var on = reduce || it.getBoundingClientRect().top < vh * 0.62;
        it.classList.toggle('on', on);
        if (on) n = k;
      });
      var show = Math.max(n, 0);
      if (show !== last) {
        last = show;
        var it = items[show];
        tEl.textContent = it.querySelector('time').textContent.replace(/(AM|PM)$/, ' $1');
        cEl.textContent = (n + 1 > 0 ? n + 1 : 0) + ' of ' + items.length + ' records';
        sunAt(parseFloat(it.getAttribute('data-hour')));
      } else {
        cEl.textContent = (n + 1) + ' of ' + items.length + ' records';
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  /* -----------------------------------------------------------------------
     5) Farm expense story (illustrative): donut + linked list
     ----------------------------------------------------------------------- */
  (function expenses() {
    var box = $('[data-expenses]');
    if (!box) return;
    var vals = box.getAttribute('data-values').split(',').map(Number);
    var cols = box.getAttribute('data-colors').split(',');
    var names = box.getAttribute('data-names').split('|');
    var g = $('[data-ex-arcs]', box), rows = $$('.ex-row', box);
    var R = 70, C = 2 * Math.PI * R, sum = vals.reduce(function (a, b) { return a + b; }, 0), gap = 2;
    var NS = 'http://www.w3.org/2000/svg', off = 0, arcs = [];
    vals.forEach(function (v, k) {
      var len = v / sum * C;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', 100); c.setAttribute('cy', 100); c.setAttribute('r', R);
      c.setAttribute('class', 'ex-arc');
      c.setAttribute('stroke', cols[k]);
      c.setAttribute('stroke-dashoffset', (-off).toFixed(2));
      c.setAttribute('stroke-dasharray', reduce ? (len - gap) + ' ' + (C - len + gap) : '0 ' + C);
      c.setAttribute('data-len', len);
      c.addEventListener('mouseenter', function () { focus(k); });
      c.addEventListener('mouseleave', clear);
      c.addEventListener('click', function () { focus(k); });
      g.appendChild(c);
      arcs.push(c);
      off += len;
    });
    var label = $('[data-ex-label]', box), pct = $('[data-ex-pct]', box);
    var top = vals.indexOf(Math.max.apply(null, vals));
    function setCentre(k) { label.textContent = names[k]; pct.textContent = vals[k] + '%'; pct.style.color = cols[k]; }
    function focus(k) {
      box.classList.add('has-focus');
      arcs.forEach(function (a, j) { a.classList.toggle('on', j === k); });
      rows.forEach(function (r, j) { r.classList.toggle('on', j === k); r.setAttribute('aria-pressed', String(j === k)); });
      setCentre(k);
    }
    function clear() {
      box.classList.remove('has-focus');
      arcs.forEach(function (a) { a.classList.remove('on'); });
      rows.forEach(function (r) { r.classList.remove('on'); r.setAttribute('aria-pressed', 'false'); });
      setCentre(top);
    }
    rows.forEach(function (r, k) {
      r.setAttribute('aria-pressed', 'false');
      r.addEventListener('mouseenter', function () { focus(k); });
      r.addEventListener('mouseleave', clear);
      r.addEventListener('focus', function () { focus(k); });
      r.addEventListener('blur', clear);
      r.addEventListener('click', function () { focus(k); });
    });
    setCentre(top);
    function grow() {
      arcs.forEach(function (a, k) {
        var len = parseFloat(a.getAttribute('data-len'));
        setTimeout(function () { a.setAttribute('stroke-dasharray', (len - gap) + ' ' + (C - len + gap)); }, k * 120);
      });
    }
    if (reduce || !('IntersectionObserver' in window)) { grow(); return; }
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { grow(); o.disconnect(); } }); }, { threshold: 0.3 }).observe(box);
  })();

  /* -----------------------------------------------------------------------
     6) Count-up numbers in the illustrative season summary
     ----------------------------------------------------------------------- */
  (function counters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10), t0 = null;
      if (reduce) { el.textContent = target; return; }
      function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  })();

  /* -----------------------------------------------------------------------
     7) One-tap recording demo (page only — nothing is saved)
     ----------------------------------------------------------------------- */
  (function tryDemo() {
    var box = $('[data-try]');
    if (!box) return;
    var list = $('[data-try-list]', box), count = $('[data-try-n]', box), n = 0;
    $$('[data-act]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var empty = $('.tp-empty', list);
        if (empty) empty.remove();
        var now = new Date();
        var time = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
        var li = document.createElement('li');
        li.innerHTML = '<i class="d-' + b.getAttribute('data-c') + '"><svg class="ico" aria-hidden="true"><use href="#i-' + b.getAttribute('data-ico') + '"></use></svg></i>' +
          '<span><b>' + b.getAttribute('data-act') + '</b><small>' + time + ' · demo record</small></span>';
        list.insertBefore(li, list.firstChild);
        while (list.children.length > 5) list.removeChild(list.lastChild);
        n++;
        count.textContent = n + (n === 1 ? ' record' : ' records');
      });
    });
  })();
})();
