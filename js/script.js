/* ==========================================================================
   BHOOMISHAKTI — shared vanilla JavaScript (no libraries, no build step)
   Every module checks for its elements, so one file serves all pages.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isSmall = function () { return window.innerWidth < 700; };
  var icon = function (name) { return '<svg class="ico" aria-hidden="true"><use href="#i-' + name + '"></use></svg>'; };

  doc.documentElement.classList.remove('js-off');

  /* Run fn while el is visible; stop when it leaves the viewport */
  function whenVisible(el, onEnter, onLeave, threshold) {
    if (!('IntersectionObserver' in window)) { onEnter(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) onEnter(); else if (onLeave) onLeave();
      });
    }, { threshold: threshold || 0.25 });
    io.observe(el);
  }

  /* ---------------------------------------------------------------------
     Project data (used by the ecosystem diagram)
     --------------------------------------------------------------------- */
  var PROJECTS = [
    { id: 'ai', name: 'BhoomiShakti AI', short: 'AI', icon: 'brain', color: '#23805A', layer: 'Agriculture Intelligence', href: 'ai.html',
      tag: 'AI is not Artificial Intelligence — it is Agriculture Intelligence.',
      desc: 'Agriculture intelligence, farmer discovery, market information and a direct Demand → Response → Procurement workflow for farmers, industries and agri-startups.' },
    { id: 'agri-digital', name: 'Agri Digital', short: 'Agri Digital', icon: 'store', color: '#2A7F7A', layer: 'Digital Connectivity', href: 'agri-digital.html',
      tag: 'Discover → Learn → Compare → Connect → Get Help → Feedback',
      desc: 'A digital agriculture platform connecting farmers with agricultural businesses, products, services, knowledge and opportunities.' },
    { id: 'seva', name: 'BhoomiShakti Seva', short: 'Seva', icon: 'tractor', color: '#B86B1E', layer: 'Farm Services', href: 'seva.html',
      tag: 'Connecting Farmers, Machines & People.',
      desc: 'A digital booking platform for agricultural machinery, farm labour, loading workers, transport and other farm services.' },
    { id: 'x1', name: 'BhoomiShakti X1', short: 'X1', icon: 'sun', color: '#C98A12', layer: 'Mechanization', href: 'x1.html',
      tag: 'Strength from the Soil, Powered by the Sun.',
      desc: 'A solar-assisted, battery-powered compact ploughing machine for small and marginal farmers and narrow farmland.' },
    { id: 's4', name: 'BhoomiShakti S4', short: 'S4', icon: 'seed', color: '#5E8F2E', layer: 'Seed Sowing', href: 's4.html',
      tag: 'Smart Solar Seed Sower',
      desc: 'A portable, backpack-based solar seed sower with dual pipes, vibration-assisted seed flow, adjustable speed and a solar umbrella for shade.' },
    { id: 'jeevadhara', name: 'JeevaDhara Krishi', short: 'JeevaDhara', icon: 'worm', color: '#7A5230', layer: 'Soil Health', href: 'jeevadhara.html',
      tag: 'Controlled Bio-Nutrition + Mechanized Soil Incorporation',
      desc: 'A controlled bio-nutrient approach using aged manure, compost, soil, cocopeat and diluted urine, mixed into soil with BhoomiShakti X1.' },
    { id: 'jeevadhan', name: 'JeevaDhan', short: 'JeevaDhan', icon: 'recycle', color: '#6B5A2A', layer: 'Renewable Resources', href: 'jeevadhan.html',
      tag: 'Turning Rural Biomass into Renewable Value',
      desc: 'A proposed circular ecosystem that turns cattle biomass into a renewable-energy pathway and digestate for agriculture, with digital records.' },
    { id: 'diary', name: 'BhoomiShakti Diary', short: 'Diary', icon: 'book', color: '#1B6B47', layer: 'Farm Records', href: 'bhoomishakti-diary.html',
      tag: 'Every Farm’s Story, All in One Diary.',
      desc: 'A farmer-focused digital diary concept for recording everyday farm activities, expenses, crop records and seasonal history.' }
  ];

  /* ---------------------------------------------------------------------
     Header: sticky state, dropdown, mobile menu, active link, back to top
     --------------------------------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    var toTop = $('.to-top');
    var onScroll = function () {
      var y = window.scrollY;
      if (header) header.classList.toggle('scrolled', y > 10);
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

    // Dropdown (click + keyboard; hover on fine pointers)
    $$('.dropdown').forEach(function (dd) {
      var btn = $('.nav-link', dd);
      var setOpen = function (open) { dd.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
      btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!dd.classList.contains('open')); });
      if (window.matchMedia('(hover: hover)').matches) {
        var t;
        dd.addEventListener('mouseenter', function () { clearTimeout(t); setOpen(true); });
        dd.addEventListener('mouseleave', function () { t = setTimeout(function () { setOpen(false); }, 180); });
      }
      doc.addEventListener('click', function (e) { if (!dd.contains(e.target)) setOpen(false); });
      dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); btn.focus(); } });
    });

    // Mobile menu
    var burger = $('.burger'), mnav = $('.mobile-nav'), closeBtn = $('.mobile-close');
    if (burger && mnav) {
      var setMenu = function (open) {
        mnav.classList.toggle('open', open);
        doc.body.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        mnav.setAttribute('aria-hidden', String(!open));
        if (open) { setTimeout(function () { closeBtn && closeBtn.focus(); }, 80); } else { burger.focus({ preventScroll: true }); }
      };
      burger.addEventListener('click', function () { setMenu(true); });
      if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
      $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav.classList.contains('open')) setMenu(false); });
    }

    // Active link (home page sections)
    var links = $$('.nav-links a.nav-link[href^="#"]');
    var map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').split('#')[1]; if (id) map[id] = a; });
    var ids = Object.keys(map).filter(function (id) { return doc.getElementById(id); });
    if (ids.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (a) { a.classList.remove('active'); });
            map[e.target.id].classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ids.forEach(function (id) { io.observe(doc.getElementById(id)); });
    }
  }

  /* ---------------------------------------------------------------------
     Leaf motion — natural, calm, lightweight (CSS transforms only)
     <div class="leaf-layer" data-leaves="12" data-leaf-mode="fall|drift" data-leaf-tone="green|earth|gold">
     --------------------------------------------------------------------- */
  var LEAF_PATHS = [
    'M2 26C6 12 17 3 31 2c-1 15-11 25-25 26-1.6 0-3-.3-4-.9Z',
    'M3 27C2 15 12 4 29 3c1 16-8 25-20 25-2.2 0-4-.4-6-1Z',
    'M2 29C11 19 21 9 32 1c-4 13-15 23-30 28Z'
  ];
  var LEAF_TONES = {
    green: ['#6CB85A', '#3E9A57', '#A9D48F', '#2C7D48', '#8BC274'],
    earth: ['#8A6440', '#6CB85A', '#C9AE86', '#A9D48F', '#7A5230'],
    gold: ['#E3A72F', '#6CB85A', '#A9D48F', '#C98A12', '#3E9A57']
  };
  function initLeaves() {
    if (reduceMotion) return;
    $$('.leaf-layer[data-leaves]').forEach(function (layer) {
      var n = parseInt(layer.getAttribute('data-leaves'), 10) || 8;
      if (isSmall()) n = Math.max(3, Math.round(n * 0.5));
      var mode = layer.getAttribute('data-leaf-mode') || 'fall';
      var tones = LEAF_TONES[layer.getAttribute('data-leaf-tone') || 'green'];
      var h = layer.offsetHeight || 700;
      var frag = doc.createDocumentFragment();
      for (var i = 0; i < n; i++) {
        var leaf = doc.createElement('span');
        leaf.className = 'leaf' + (mode === 'drift' ? ' drift' : '');
        var size = 12 + Math.random() * 20;
        var dur = (mode === 'drift' ? 22 : 14) + Math.random() * 14;
        var far = size < 17;
        leaf.style.cssText = [
          mode === 'drift' ? '--top:' + (5 + Math.random() * 80) + '%' : 'left:' + (Math.random() * 105 - 5) + '%',
          '--size:' + size.toFixed(0) + 'px',
          '--dur:' + dur.toFixed(1) + 's',
          '--delay:' + (-Math.random() * dur).toFixed(1) + 's',
          '--dx:' + (60 + Math.random() * 220).toFixed(0) + 'px',
          '--dy:' + (mode === 'drift' ? (Math.random() * 160 - 40) : h + 120).toFixed(0) + 'px',
          '--rot:' + (180 + Math.random() * 360).toFixed(0) + 'deg',
          '--o:' + (far ? 0.35 + Math.random() * 0.2 : 0.55 + Math.random() * 0.35).toFixed(2),
          '--sway:' + (2.8 + Math.random() * 2.6).toFixed(1) + 's',
          far ? 'filter:blur(1px)' : ''
        ].join(';');
        var color = tones[i % tones.length];
        leaf.innerHTML = '<svg viewBox="0 0 34 30" aria-hidden="true"><path d="' + LEAF_PATHS[i % 3] + '" fill="' + color + '"/><path d="M5 27C12 19 20 11 30 4" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none"/></svg>';
        frag.appendChild(leaf);
      }
      layer.appendChild(frag);
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal (IntersectionObserver)
     --------------------------------------------------------------------- */
  function initReveal() {
    var els = $$('.reveal, .layers, .cta-band, [data-draw]');
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
    // Stagger siblings marked with data-stagger
    $$('[data-stagger]').forEach(function (group) {
      $$('.reveal', group).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's'); });
    });
  }

  /* ---------------------------------------------------------------------
     Ecosystem diagram (home)
     --------------------------------------------------------------------- */
  function initEcosystem() {
    var eco = $('#eco');
    if (!eco) return;
    var svg = $('.eco-lines', eco);
    var info = $('#eco-info');
    var nodes = [], paths = [], flows = [];
    var R = 40; // radius in viewBox units (0..100)
    var NS = 'http://www.w3.org/2000/svg';

    var ring = doc.createElementNS(NS, 'circle');
    ring.setAttribute('cx', 50); ring.setAttribute('cy', 50); ring.setAttribute('r', R);
    ring.setAttribute('class', 'eco-ring'); ring.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(ring);

    PROJECTS.forEach(function (p, i) {
      var a = (-90 + i * (360 / PROJECTS.length)) * Math.PI / 180;
      var x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a);
      // organic curve: control point rotated off the straight line
      var ca = a + 0.55;
      var cx = 50 + R * 0.5 * Math.cos(ca), cy = 50 + R * 0.5 * Math.sin(ca);
      var d = 'M50,50 Q' + cx.toFixed(2) + ',' + cy.toFixed(2) + ' ' + x.toFixed(2) + ',' + y.toFixed(2);
      var base = doc.createElementNS(NS, 'path');
      base.setAttribute('d', d); base.setAttribute('class', 'eco-path'); base.setAttribute('vector-effect', 'non-scaling-stroke');
      var flow = doc.createElementNS(NS, 'path');
      flow.setAttribute('d', d); flow.setAttribute('class', 'eco-path flow'); flow.setAttribute('vector-effect', 'non-scaling-stroke');
      flow.style.stroke = p.color;
      svg.appendChild(base); svg.appendChild(flow);
      paths.push(base); flows.push(flow);

      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'eco-node';
      btn.style.left = x + '%'; btn.style.top = y + '%';
      btn.style.setProperty('--nc', p.color);
      btn.setAttribute('aria-label', p.name + ' — ' + p.layer + '. Show details');
      btn.innerHTML = '<span class="bubble">' + icon(p.icon) + '</span><span class="lbl">' + p.short + '</span>';
      eco.appendChild(btn);
      nodes.push(btn);

      var activate = function () { setActive(i, true); };
      btn.addEventListener('mouseenter', activate);
      btn.addEventListener('focus', activate);
      btn.addEventListener('click', function () {
        setActive(i, true);
        var target = doc.getElementById('show-' + p.id);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        else window.location.href = p.href;
      });
    });

    var current = -1, userTouched = false, timer;
    function setActive(i, fromUser) {
      if (fromUser) { userTouched = true; clearInterval(timer); }
      if (i === current) return;
      current = i;
      var p = PROJECTS[i];
      nodes.forEach(function (n, k) { n.classList.toggle('hot', k === i); });
      paths.forEach(function (pa, k) { pa.classList.toggle('hot', k === i); pa.style.stroke = k === i ? p.color : ''; });
      if (info) {
        info.style.setProperty('--nc', p.color);
        info.classList.add('swap');
        setTimeout(function () {
          $('.eco-info-inner', info).innerHTML =
            '<p class="layer">Layer · ' + p.layer + '</p>' +
            '<h3>' + p.name + '</h3>' +
            '<p class="tag">' + p.tag + '</p>' +
            '<p class="desc">' + p.desc + '</p>' +
            '<a class="btn btn-primary" href="' + p.href + '" style="background:' + p.color + '">Explore ' + p.short + ' ' + icon('arrow') + '</a>' +
            '<p class="hint">Hover or tap another node to explore the ecosystem.</p>';
          info.classList.remove('swap');
        }, reduceMotion ? 0 : 200);
      }
    }
    setActive(0);
    if (!reduceMotion) {
      whenVisible(eco, function () {
        if (userTouched) return;
        clearInterval(timer);
        timer = setInterval(function () { setActive((current + 1) % PROJECTS.length); }, 3600);
      }, function () { clearInterval(timer); }, 0.3);
    }
  }

  /* ---------------------------------------------------------------------
     Project filter
     <div class="filter-bar" data-filter-target="#list"> <button data-filter="all">
     items: .filter-item[data-cats="digital services"]
     --------------------------------------------------------------------- */
  function initFilters() {
    $$('.filter-bar').forEach(function (bar) {
      var list = $(bar.getAttribute('data-filter-target'));
      if (!list) return;
      var items = $$('.filter-item', list);
      var empty = $('.filter-empty', list.parentNode);
      var live = $('[data-filter-live]', bar.parentNode);
      $$('.filter-btn', bar).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var f = btn.getAttribute('data-filter');
          $$('.filter-btn', bar).forEach(function (b) { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
          var shown = 0;
          items.forEach(function (it) {
            var match = f === 'all' || (' ' + it.getAttribute('data-cats') + ' ').indexOf(' ' + f + ' ') > -1;
            if (match) shown++;
            it.classList.add('fade');
            setTimeout(function () {
              it.classList.toggle('is-hidden', !match);
              requestAnimationFrame(function () { it.classList.remove('fade'); });
            }, reduceMotion ? 0 : 220);
          });
          if (empty) empty.style.display = shown ? 'none' : 'block';
          if (live) live.textContent = shown + ' project' + (shown === 1 ? '' : 's') + ' shown';
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Step flows (auto-advancing when visible, clickable)
     <div class="flow" data-flow data-sync="#machine">.flow-step[data-caption]
     --------------------------------------------------------------------- */
  function initFlows() {
    $$('[data-flow]').forEach(function (flow) {
      var steps = $$('.flow-step', flow);
      var progress = $('.flow-progress', flow);
      var caption = $(flow.getAttribute('data-caption-target') || '#none');
      var sync = flow.getAttribute('data-sync') ? $(flow.getAttribute('data-sync')) : null;
      var n = steps.length, cur = -1, timer, delay = parseInt(flow.getAttribute('data-delay'), 10) || 2400;
      flow.style.setProperty('--n', n);
      function set(i) {
        cur = i;
        steps.forEach(function (s, k) {
          s.classList.toggle('on', k === i);
          s.classList.toggle('done', k < i);
          s.setAttribute('aria-current', k === i ? 'step' : 'false');
        });
        if (progress) progress.style.width = n > 1 ? 'calc((100% - 100% / ' + n + ') * ' + (i / (n - 1)).toFixed(3) + ')' : '0';
        if (caption) caption.innerHTML = steps[i].getAttribute('data-caption') || '';
        if (sync) sync.setAttribute('data-active', String(i));
      }
      function play() { stop(); if (reduceMotion) return; timer = setInterval(function () { set((cur + 1) % n); }, delay); }
      function stop() { clearInterval(timer); }
      steps.forEach(function (s, k) {
        s.setAttribute('tabindex', '0');
        s.setAttribute('role', 'button');
        s.addEventListener('click', function () { set(k); play(); });
        s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(k); play(); } });
      });
      var wrap = flow.closest('[data-flow-wrap]') || flow.parentNode;
      var prev = $('[data-flow-prev]', wrap), next = $('[data-flow-next]', wrap);
      if (prev) prev.addEventListener('click', function () { set((cur - 1 + n) % n); play(); });
      if (next) next.addEventListener('click', function () { set((cur + 1) % n); play(); });
      set(0);
      whenVisible(flow, play, stop, 0.3);
    });

    // Mini flows in showcase cards (just a gentle highlight loop)
    $$('.mini-flow').forEach(function (mf) {
      var spans = $$('span', mf), i = 0, t;
      if (!spans.length) return;
      spans[0].classList.add('on');
      whenVisible(mf, function () {
        if (reduceMotion) return;
        clearInterval(t);
        t = setInterval(function () { spans.forEach(function (s) { s.classList.remove('on'); }); i = (i + 1) % spans.length; spans[i].classList.add('on'); }, 1300);
      }, function () { clearInterval(t); }, 0.5);
    });
  }

  /* ---------------------------------------------------------------------
     Vertical timeline — stages activate as you scroll
     --------------------------------------------------------------------- */
  function initTimelines() {
    $$('.vtimeline').forEach(function (tl) {
      var items = $$('.vt-item', tl), fill = $('.vt-fill', tl), ticking = false;
      function update() {
        var mid = window.innerHeight * 0.6, active = -1;
        items.forEach(function (it, k) { if (it.getBoundingClientRect().top < mid) active = k; });
        items.forEach(function (it, k) { it.classList.toggle('on', k === active); it.classList.toggle('done', k < active); });
        if (fill && active > -1) {
          var dot = $('.vt-dot', items[active]);
          fill.style.height = (items[active].offsetTop + dot.offsetHeight / 2 - 20) + 'px';
        } else if (fill) fill.style.height = '0px';
        ticking = false;
      }
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* ---------------------------------------------------------------------
     Tabs + accordions (accessible)
     --------------------------------------------------------------------- */
  function initTabs() {
    $$('.tabs').forEach(function (tabs) {
      var btns = $$('[role="tab"]', tabs);
      function select(btn, focus) {
        btns.forEach(function (b) {
          var on = b === btn;
          b.setAttribute('aria-selected', String(on));
          b.tabIndex = on ? 0 : -1;
          var panel = doc.getElementById(b.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) btn.focus();
      }
      btns.forEach(function (b, i) {
        b.addEventListener('click', function () { select(b); });
        b.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') select(btns[(i + 1) % btns.length], true);
          if (e.key === 'ArrowLeft') select(btns[(i - 1 + btns.length) % btns.length], true);
        });
      });
    });
  }
  function initAccordions() {
    $$('.acc').forEach(function (acc) {
      var btn = $('.acc-btn', acc);
      btn.addEventListener('click', function () {
        var open = !acc.classList.contains('open');
        acc.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ---------------------------------------------------------------------
     Project sub-navigation (sticky in-page links)
     --------------------------------------------------------------------- */
  function initSubnav() {
    var sub = $('.subnav');
    if (!sub || !('IntersectionObserver' in window)) return;
    var links = $$('a', sub);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('active', on);
          if (on && sub.scrollWidth > sub.clientWidth) {
            var ul = $('ul', sub);
            ul.scrollTo({ left: a.offsetLeft - 40, behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) { var t = doc.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }

  /* ---------------------------------------------------------------------
     Enquiry forms — front-end only (no backend exists yet)
     --------------------------------------------------------------------- */
  function initForms() {
    $$('form.js-form').forEach(function (form) {
      var status = $('.form-status', form);
      // no past dates for date fields
      $$('input[type="date"]', form).forEach(function (d) { d.min = new Date().toISOString().slice(0, 10); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true, first = null;
        $$('.field', form).forEach(function (f) {
          var input = $('input, select, textarea', f);
          if (!input) return;
          var v = (input.value || '').trim();
          var bad = false;
          if (input.required && !v) bad = true;
          if (!bad && input.type === 'tel' && v && !/^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '').replace(/^(\+91|0)/, ''))) bad = true;
          if (!bad && input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
          f.classList.toggle('invalid', bad);
          input.setAttribute('aria-invalid', String(bad));
          if (bad) { ok = false; if (!first) first = input; }
        });
        if (!ok) { if (first) first.focus(); if (status) { status.className = 'form-status'; } return; }
        var name = (form.elements.name && form.elements.name.value.trim()) || 'there';
        if (status) {
          status.className = 'form-status ok';
          status.textContent = 'Thank you, ' + name + '. Your ' + (form.getAttribute('data-kind') || 'enquiry') +
            ' details are complete. This is a demonstration form — it is not yet connected to a booking or enquiry system, so nothing has been sent.';
        }
        form.reset();
      });
      $$('input, select, textarea', form).forEach(function (input) {
        input.addEventListener('input', function () { var f = input.closest('.field'); if (f) f.classList.remove('invalid'); });
      });
    });
  }

  /* ---------------------------------------------------------------------
     S4 — scroll storytelling + seed-flow particles
     --------------------------------------------------------------------- */
  function initS4() {
    var sower = $('#sower');
    if (!sower) return;
    var parts = $$('.s4p', sower);
    var legend = $$('.sower-legend span', sower);
    var stage = -1;
    function setStage(s) {
      stage = s;
      parts.forEach(function (p) {
        var min = parseInt(p.getAttribute('data-stage'), 10);
        p.classList.toggle('lit', s >= min);
        p.classList.toggle('glow', s === min);
      });
      legend.forEach(function (l, k) { l.classList.toggle('lit', k <= s); });
      seeds.active = s >= 4;
    }

    // Seed particles on canvas, following the path defined by data-seed-path points (viewBox 0..400 x 0..460)
    var canvas = $('canvas', sower), ctx = canvas && canvas.getContext('2d');
    var VB = { w: 400, h: 460 };
    var trunk = [[200, 118], [200, 150], [200, 205], [200, 250]];
    var left = [[200, 250], [165, 290], [140, 340], [128, 400], [124, 440]];
    var right = [[200, 250], [235, 290], [260, 340], [272, 400], [276, 440]];
    var seeds = { list: [], active: false };
    function lerpPath(pts, t) {
      var seg = (pts.length - 1) * t, i = Math.min(pts.length - 2, Math.floor(seg)), f = seg - i;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    function resize() {
      if (!canvas) return;
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var running = false, last = 0, spawnAcc = 0;
    function frame(ts) {
      if (!running) return;
      var dt = Math.min(50, ts - (last || ts)); last = ts;
      var r = canvas.getBoundingClientRect();
      var art = $('.s4-art', sower).getBoundingClientRect();
      var sx = art.width / VB.w, sy = art.height / VB.h, ox = art.left - r.left, oy = art.top - r.top;
      ctx.clearRect(0, 0, r.width, r.height);
      if (seeds.active) {
        spawnAcc += dt;
        while (spawnAcc > 90) { spawnAcc -= 90; seeds.list.push({ t: 0, side: Math.random() < 0.5 ? left : right, j: (Math.random() - 0.5) * 6, v: 0.00018 + (seeds.speed || 3) * 0.00007 + Math.random() * 0.00008 }); }
      }
      seeds.list = seeds.list.filter(function (s) { return s.t < 1.15; });
      seeds.list.forEach(function (s) {
        s.t += s.v * dt;
        var p;
        if (s.t < 0.45) p = lerpPath(trunk, s.t / 0.45);
        else if (s.t <= 1) p = lerpPath(s.side, (s.t - 0.45) / 0.55);
        else { var end = s.side[s.side.length - 1]; p = [end[0] + s.j, end[1] + (s.t - 1) * 120]; }
        var shake = (s.t > 0.2 && s.t < 0.45) ? Math.sin(ts / 25 + s.j) * 2.2 : 0;
        var x = ox + (p[0] + s.j * 0.4 + shake) * sx, y = oy + p[1] * sy;
        ctx.fillStyle = s.t > 1 ? 'rgba(122,82,48,' + (1.15 - s.t) * 6 + ')' : '#B8872B';
        ctx.beginPath(); ctx.ellipse(x, y, 3.2 * sx + .6, 2.2 * sy + .5, 0.6, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    if (canvas && !reduceMotion) {
      resize(); window.addEventListener('resize', resize);
      whenVisible(sower, function () { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } }, function () { running = false; }, 0.05);
    }

    // Scroll steps drive the stage
    var steps = $$('.scrolly-step');
    if (steps.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            steps.forEach(function (s) { s.classList.remove('on'); });
            e.target.classList.add('on');
            setStage(parseInt(e.target.getAttribute('data-step'), 10));
          }
        });
      }, { rootMargin: window.innerWidth < 900 ? '-68% 0px -20% 0px' : '-45% 0px -45% 0px' });
      steps.forEach(function (s) { io.observe(s); });
      setStage(reduceMotion ? 6 : -1);
    } else setStage(6);

    // Speed slider (visual only)
    var speed = $('#s4-speed');
    if (speed) {
      var out = $('#s4-speed-out');
      var labels = ['Slow', 'Gentle', 'Medium', 'Brisk', 'Fast'];
      var apply = function () {
        var v = parseInt(speed.value, 10);
        if (out) out.textContent = labels[v - 1];
        seeds.list.forEach(function (s) { s.v = 0.00018 + v * 0.00007; });
        seeds.speed = v;
      };
      speed.addEventListener('input', apply); apply();
    }
  }

  /* ---------------------------------------------------------------------
     JeevaDhara — composition donut, nitrogen steps, soil toggle
     --------------------------------------------------------------------- */
  function initJeevaDhara() {
    var donut = $('#donut');
    if (donut) {
      var segs = $$('circle.seg', donut), items = $$('.compo-item[data-seg]');
      var C = 2 * Math.PI * 80, offset = 0;
      segs.forEach(function (s) {
        var pct = parseFloat(s.getAttribute('data-pct')) / 100;
        s.setAttribute('stroke-dasharray', '0 ' + C);
        s.setAttribute('stroke-dashoffset', String(-offset * C));
        s.dataset.full = (pct * C - 3).toFixed(2) + ' ' + C;
        offset += pct;
      });
      var draw = function () { segs.forEach(function (s) { s.setAttribute('stroke-dasharray', s.dataset.full); }); };
      if (reduceMotion) draw(); else whenVisible(donut, draw, null, 0.4);
      var center = $('.donut-center', donut);
      var def = center.innerHTML;
      function hot(key, on) {
        segs.forEach(function (s) { s.classList.toggle('hot', on && s.getAttribute('data-seg') === key); });
        items.forEach(function (i) { i.classList.toggle('hot', on && i.getAttribute('data-seg') === key); });
        var seg = segs.filter(function (s) { return s.getAttribute('data-seg') === key; })[0];
        center.innerHTML = on && seg ? '<div><b>' + seg.getAttribute('data-pct') + '%</b><span>' + seg.getAttribute('data-name') + '</span></div>' : def;
      }
      segs.concat(items).forEach(function (el) {
        var key = el.getAttribute('data-seg');
        el.addEventListener('mouseenter', function () { hot(key, true); });
        el.addEventListener('mouseleave', function () { hot(key, false); });
        el.addEventListener('focus', function () { hot(key, true); });
        el.addEventListener('blur', function () { hot(key, false); });
      });
    }

    $$('[data-sequence]').forEach(function (seq) {
      var steps = $$('[data-seq-step]', seq), i = 0, t;
      if (reduceMotion) { steps.forEach(function (s) { s.classList.add('lit'); }); return; }
      whenVisible(seq, function () {
        clearInterval(t);
        steps.forEach(function (s) { s.classList.remove('lit'); });
        i = 0; steps[0].classList.add('lit');
        t = setInterval(function () {
          i++;
          if (i >= steps.length + 2) { steps.forEach(function (s) { s.classList.remove('lit'); }); i = 0; }
          if (steps[i]) steps[i].classList.add('lit');
        }, 1300);
      }, function () { clearInterval(t); steps.forEach(function (s) { s.classList.add('lit'); }); }, 0.35);
    });

    $$('.soil-viz .toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        var viz = b.closest('.soil-viz');
        $$('.toggle button', viz).forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        viz.classList.toggle('base', b.getAttribute('data-view') === 'base');
        var cap = $('.soil-caption'); if (cap) cap.textContent = b.getAttribute('data-caption');
      });
    });
  }

  /* ---------------------------------------------------------------------
     JeevaDhan — circular economy cycle
     --------------------------------------------------------------------- */
  function initCycle() {
    $$('.cycle[data-cycle]').forEach(function (cyc) {
      var steps = JSON.parse(cyc.getAttribute('data-cycle'));
      var detail = $(cyc.getAttribute('data-detail'));
      var svg = $('svg', cyc), NS = 'http://www.w3.org/2000/svg';
      var R = 40, C = 2 * Math.PI * R;
      var track = doc.createElementNS(NS, 'circle');
      track.setAttribute('cx', 50); track.setAttribute('cy', 50); track.setAttribute('r', R); track.setAttribute('class', 'c-track'); track.setAttribute('vector-effect', 'non-scaling-stroke');
      var arc = doc.createElementNS(NS, 'circle');
      arc.setAttribute('cx', 50); arc.setAttribute('cy', 50); arc.setAttribute('r', R); arc.setAttribute('class', 'c-arc');
      arc.setAttribute('transform', 'rotate(-90 50 50)'); arc.setAttribute('stroke-dasharray', '0 ' + C);
      arc.style.transition = 'stroke-dasharray .8s cubic-bezier(.22,1,.36,1)';
      arc.setAttribute('stroke-width', '1.2');
      svg.appendChild(track); svg.appendChild(arc);
      var nodes = steps.map(function (s, i) {
        var a = (-90 + i * 360 / steps.length) * Math.PI / 180;
        var b = doc.createElement('button');
        b.type = 'button'; b.className = 'c-node';
        b.style.left = (50 + R * Math.cos(a)) + '%'; b.style.top = (50 + R * Math.sin(a)) + '%';
        b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + s.t);
        b.innerHTML = '<span class="bubble">' + icon(s.i) + '</span><span class="lbl">' + s.t + '</span>';
        b.addEventListener('click', function () { set(i); play(); });
        cyc.appendChild(b);
        return b;
      });
      var cur = -1, timer;
      function set(i) {
        cur = i;
        nodes.forEach(function (n, k) { n.classList.toggle('on', k === i); n.classList.toggle('done', k < i); });
        arc.setAttribute('stroke-dasharray', (C * (i + 0.001) / steps.length).toFixed(2) + ' ' + C);
        if (detail) {
          detail.innerHTML = '<p class="n">Step ' + String(i + 1).padStart(2, '0') + ' of ' + String(steps.length).padStart(2, '0') + '</p><h3>' + steps[i].t + '</h3><p>' + steps[i].d + '</p>' +
            (steps[i].s ? '<p style="margin-top:14px"><span class="status status-' + steps[i].s + '">' + steps[i].sl + '</span></p>' : '');
        }
      }
      function play() { clearInterval(timer); if (!reduceMotion) timer = setInterval(function () { set((cur + 1) % steps.length); }, 2800); }
      set(0);
      whenVisible(cyc, play, function () { clearInterval(timer); }, 0.3);
    });
  }

  /* ---------------------------------------------------------------------
     Seva — interactive booking demonstration (illustrative example)
     --------------------------------------------------------------------- */
  function initBooking() {
    var box = $('#booking');
    if (!box) return;
    var screen = $('.phone-body', box), title = $('.phone-top b', box), sub = $('.phone-top small', box);
    var steps = $$('.book-step', box);
    var SCREENS = [
      ['Choose a service', '<div class="p-card"><b>What do you need?</b><span class="p-pill">Tractor</span><span class="p-pill">Mini Tractor</span><span class="p-pill">JCB</span><span class="p-pill">Harvester</span><span class="p-pill">Labour</span><span class="p-pill">Transport</span></div><div class="p-card"><b>Selected</b><div class="row"><span>Tractor + Rotavator</span></div></div>'],
      ['Location, date & time', '<div class="p-card"><b>Farm location</b><div class="row"><span>Your village / farm</span></div></div><div class="p-card"><b>Area</b><div class="row"><span>3 acres</span></div></div><div class="p-card"><b>Date & time</b><div class="row"><span>Chosen by the farmer</span></div></div>'],
      ['Nearby providers', '<div class="p-card"><b>Mahindra Tractor · 47 HP</b><div class="row"><span>Rotavator</span><span>4.2 km</span></div><span class="p-pill">Verified</span><span class="p-pill">★ 4.8</span></div><div class="p-card"><b>More providers</b><div class="row"><span>Shown by distance & rating</span></div></div>'],
      ['Verified profile', '<div class="p-card"><b>Provider profile</b><div class="row"><span>Machine & implement details</span></div><div class="row"><span>Photos · verification</span></div></div><div class="p-card"><b>Ratings & reviews</b><div class="row"><span>From completed bookings</span></div></div>'],
      ['Book the service', '<div class="p-card"><b>Booking summary</b><div class="row"><span>Tractor + Rotavator</span></div><div class="row"><span>3 acres · date & time</span></div></div><div class="p-btn">Book now</div>'],
      ['Provider accepts', '<div class="p-card"><b>Request sent</b><div class="row"><span>Waiting for provider</span></div></div><div class="p-card"><b>Accepted ✓</b><div class="row"><span>Provider confirmed the job</span></div></div>'],
      ['Work in progress', '<div class="p-card"><b>Provider arrived</b><div class="row"><span>Work started</span></div></div><div class="p-card"><b>Status</b><div class="row"><span>Rotavation in progress</span></div></div>'],
      ['Payment', '<div class="p-card"><b>Work completed</b><div class="row"><span>Pay the provider</span></div></div><div class="p-card"><b>Payment options</b><span class="p-pill">PhonePe / UPI</span><span class="p-pill">Cash</span></div>'],
      ['Rate & review', '<div class="p-card"><b>How was the service?</b><div class="row"><span>★ ★ ★ ★ ★</span></div></div><div class="p-card"><b>Service history</b><div class="row"><span>Saved for next time</span></div></div>']
    ];
    var cur = -1, timer;
    function set(i) {
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); s.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      title.textContent = SCREENS[i][0];
      sub.textContent = 'Step ' + (i + 1) + ' of ' + SCREENS.length;
      screen.innerHTML = SCREENS[i][1];
    }
    function play() { clearInterval(timer); if (!reduceMotion) timer = setInterval(function () { set((cur + 1) % SCREENS.length); }, 2600); }
    steps.forEach(function (s, k) { s.addEventListener('click', function () { set(k); play(); }); });
    set(0);
    whenVisible(box, play, function () { clearInterval(timer); }, 0.3);
  }

  /* ---------------------------------------------------------------------
     Footer year + boot
     --------------------------------------------------------------------- */
  function boot() {
    initHeader();
    initLeaves();
    initReveal();
    initEcosystem();
    initFilters();
    initFlows();
    initTimelines();
    initTabs();
    initAccordions();
    initSubnav();
    initForms();
    initS4();
    initJeevaDhara();
    initCycle();
    initBooking();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
