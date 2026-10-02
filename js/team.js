/* =========================================================================
   BhoomiShakti — Team page (team.html)
   Everything is read from the HTML, so you only edit team.html:
   names, roles, bios, photos, links, data-domain and data-projects.
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PROJECT_NAMES = { ai: 'BhoomiShakti AI', 'agri-digital': 'Agri Digital', seva: 'Seva', x1: 'X1', s4: 'S4', jeevadhara: 'JeevaDhara', jeevadhan: 'JeevaDhan', diary: 'BhoomiShakti Diary' };
  var PROJECT_COLORS = { ai: '#23805A', 'agri-digital': '#2A7F7A', seva: '#B86B1E', x1: '#C98A12', s4: '#5E8F2E', jeevadhara: '#7A5230', jeevadhan: '#6B5A2A', diary: '#1B6B47' };
  var members = $$('.member');
  var plain = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };

  /* Hide social links that are still "#" so there are no dead links ------- */
  $$('[data-link]').forEach(function (a) { if (!a.getAttribute('href') || a.getAttribute('href') === '#') a.classList.add('is-unset'); });

  /* Hero: roots from founder to every member ------------------------------ */
  (function roots() {
    var box = $('[data-roots]');
    if (!box) return;
    var svg = $('svg', box), f = $('.t-root-f', box), out = '';
    var pos = function (el) { return { x: parseFloat(el.style.getPropertyValue('--x')) * 4, y: parseFloat(el.style.getPropertyValue('--y')) * 3.6 }; };
    var a = pos(f);
    $$('.t-root:not(.t-root-f)', box).forEach(function (m, i) {
      var b = pos(m);
      var c1x = a.x + (b.x - a.x) * 0.1, c1y = a.y + 110, c2x = b.x, c2y = b.y - 80;
      out += '<path pathLength="100" style="--i:' + i + '" d="M' + a.x + ' ' + (a.y + 34) + ' C' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + b.x + ' ' + b.y + '"/>';
    });
    svg.innerHTML = out;
  })();

  /* Founder: quote words fade in one by one ------------------------------- */
  $$('[data-words] p').forEach(function (p) {
    var words = p.textContent.trim().split(/\s+/);
    p.setAttribute('aria-label', p.textContent.trim());
    p.innerHTML = words.map(function (w, i) { return '<span class="w" aria-hidden="true" style="--i:' + i + '">' + w.replace(/</g, '&lt;') + '</span>'; }).join(' ');
  });

  /* Founder: tabs with a sliding underline -------------------------------- */
  $$('[data-ftabs]').forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap), ink = $('.f-ink', wrap);
    function moveInk(t) { ink.style.left = t.offsetLeft + 'px'; ink.style.width = t.offsetWidth + 'px'; }
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      moveInk(t);
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
    var start = function () { moveInk(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]); };
    start();
    window.addEventListener('resize', start);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  });

  /* Founder journey: a stem that grows from milestone to milestone -------- */
  $$('[data-journey]').forEach(function (j) {
    var nodes = $$('.gj-node', j), panel = $('.gj-panel', j), stem = $('.gj-stem', j), cur = -1, timer = null, userTook = false;
    function show(i) {
      cur = i;
      nodes.forEach(function (n, k) {
        n.classList.toggle('grown', k <= i);
        $('.gj-btn', n).setAttribute('aria-pressed', String(k === i));
      });
      var last = nodes.length - 1;
      stem.style.setProperty('--p', (last ? (i / last) * 100 : 100) + '%');
      var tpl = $('template', nodes[i]);
      panel.innerHTML = '<div class="swap">' + tpl.innerHTML + '</div>';
      var b = $('.gj-bud', nodes[i]), pr = panel.getBoundingClientRect(), br = b.getBoundingClientRect();
      panel.style.setProperty('--arrow', Math.max(28, Math.min(pr.width - 28, br.left + br.width / 2 - pr.left)) + 'px');
    }
    function stop() { clearInterval(timer); timer = null; }
    function play() {
      if (reduce || userTook || timer) return;
      timer = setInterval(function () { show((cur + 1) % nodes.length); }, 4500);
    }
    nodes.forEach(function (n, k) {
      $('.gj-btn', n).addEventListener('click', function () { userTook = true; stop(); show(k); });
    });
    show(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) play(); else stop(); }); }, { threshold: 0.35 }).observe(j);
    }
    window.addEventListener('resize', function () { show(cur); });
  });

  /* Team filter by expertise --------------------------------------------- */
  (function filters() {
    var btns = $$('[data-tfilter]'), empty = $('[data-tempty]');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-tfilter'), shown = 0;
        btns.forEach(function (b) { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        members.forEach(function (m) {
          var match = f === 'all' || m.getAttribute('data-domain') === f;
          if (match) shown++;
          m.classList.add('fade');
          setTimeout(function () { m.classList.toggle('is-hidden', !match); requestAnimationFrame(function () { m.classList.remove('fade'); }); }, reduce ? 0 : 200);
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  })();

  /* Gentle 3D tilt on cards (mouse only) ---------------------------------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    members.forEach(function (m) {
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        m.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
      });
      m.addEventListener('pointerleave', function () { m.style.transform = ''; });
    });
  }

  /* Profile dialog -------------------------------------------------------- */
  (function dialog() {
    var dlg = $('[data-mdialog]');
    if (!dlg) return;
    var idx = 0, opener = null;
    var visible = function () { return members.filter(function (m) { return !m.classList.contains('is-hidden'); }); };
    function fill(m) {
      var list = visible(), i = list.indexOf(m);
      idx = i;
      var img = $('.m-photo img', m), dImg = $('[data-md-img]', dlg);
      dImg.src = img.getAttribute('src');
      dImg.alt = img.getAttribute('alt');
      $('[data-md-name]', dlg).textContent = plain($('.m-name', m));
      $('[data-md-role]', dlg).textContent = plain($('.m-role', m));
      $('[data-md-domain]', dlg).textContent = plain($('.m-domain', m));
      $('[data-md-projects]', dlg).innerHTML = $('.m-projects', m).innerHTML;
      var bio = $('[data-md-bio]', dlg);
      bio.innerHTML = '<p class="md-lead">' + $('.m-line', m).innerHTML + '</p>' + $('template.m-bio', m).innerHTML;
      bio.classList.remove('md-swap'); void bio.offsetWidth; bio.classList.add('md-swap');
      $('[data-md-links]', dlg).innerHTML = $('.m-links', m).innerHTML;
      $('[data-md-count]', dlg).textContent = (i + 1) + ' / ' + list.length;
    }
    function open(m) {
      opener = document.activeElement;
      fill(m);
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      $('[data-md-close]', dlg).focus();
    }
    function close() {
      if (dlg.close) dlg.close(); else { dlg.removeAttribute('open'); dlg.dispatchEvent(new Event('close')); }
    }
    dlg.addEventListener('close', function () { document.documentElement.style.overflow = ''; if (opener) opener.focus(); });
    function step(d) { var list = visible(); fill(list[(idx + d + list.length) % list.length]); }
    members.forEach(function (m) {
      $('.m-open', m).addEventListener('click', function () { open(m); });
      $('.m-photo', m).addEventListener('click', function () { open(m); });
      $('.m-photo', m).style.cursor = 'pointer';
    });
    $('[data-md-close]', dlg).addEventListener('click', close);
    $('[data-md-prev]', dlg).addEventListener('click', function () { step(-1); });
    $('[data-md-next]', dlg).addEventListener('click', function () { step(1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(e.target.tagName)) step(1);
      if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(e.target.tagName)) step(-1);
      if (e.key === 'Escape' && !dlg.showModal) close();
    });
  })();

  /* Who builds what: people <-> projects map ------------------------------ */
  (function teamMap() {
    var map = $('[data-tmap]');
    if (!map) return;
    var svg = $('.tmap-lines', map), peopleUl = $('[data-people]', map), hint = $('[data-maphint]');
    var projBtns = $$('.map-p', map);
    var people = [];
    var founder = $('#founder');
    if (founder) {
      people.push({ id: 'founder', name: plain($('.f-wipe', founder)), role: 'Founder', img: $('.f-photo img', founder).getAttribute('src'), projects: founder.getAttribute('data-projects').split(/\s+/), founder: true });
    }
    members.forEach(function (m) {
      people.push({ id: 'm' + m.getAttribute('data-member'), name: plain($('.m-name', m)), role: plain($('.m-role', m)), img: $('.m-photo img', m).getAttribute('src'), projects: (m.getAttribute('data-projects') || '').split(/\s+/).filter(Boolean) });
    });
    peopleUl.innerHTML = people.map(function (p) {
      return '<li><button type="button" class="map-person' + (p.founder ? ' is-founder' : '') + '" data-person="' + p.id + '"><img src="' + p.img + '" alt="" width="44" height="44" loading="lazy"><span><b>' + p.name + '</b><small>' + p.role + '</small></span></button></li>';
    }).join('');
    // avatar stacks (shown on phones)
    projBtns.forEach(function (b) {
      var pid = b.getAttribute('data-p');
      $('.map-avs', b).innerHTML = people.filter(function (p) { return p.projects.indexOf(pid) > -1; }).map(function (p) { return '<img src="' + p.img + '" alt="">'; }).join('');
    });
    var personBtns = $$('.map-person', map);
    var byId = {};
    people.forEach(function (p) { byId[p.id] = p; });
    var locked = null;

    function draw() {
      if (getComputedStyle(svg).display === 'none') return;
      var r = map.getBoundingClientRect(), out = '';
      personBtns.forEach(function (pb) {
        var p = byId[pb.getAttribute('data-person')], a = pb.getBoundingClientRect();
        var x1 = a.right - r.left, y1 = a.top + a.height / 2 - r.top;
        p.projects.forEach(function (pid) {
          var tb = projBtns.filter(function (b) { return b.getAttribute('data-p') === pid; })[0];
          if (!tb) return;
          var t = tb.getBoundingClientRect(), x2 = t.left - r.left, y2 = t.top + t.height / 2 - r.top, mx = (x1 + x2) / 2;
          out += '<path data-a="' + p.id + '" data-b="' + pid + '" style="--lc:' + (PROJECT_COLORS[pid] || '#2C7D48') + '" d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>';
        });
      });
      svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
      svg.innerHTML = out;
      if (locked) focus(locked.type, locked.id);
    }
    function clear() {
      map.classList.remove('has-focus');
      $$('.on', map).forEach(function (el) { el.classList.remove('on'); });
      hint.textContent = 'Select a person or a project.';
    }
    function focus(type, id) {
      clear();
      map.classList.add('has-focus');
      if (type === 'person') {
        var p = byId[id];
        $('[data-person="' + id + '"]', map).classList.add('on');
        p.projects.forEach(function (pid) { var b = $('.map-p[data-p="' + pid + '"]', map); if (b) b.classList.add('on'); });
        $$('path[data-a="' + id + '"]', svg).forEach(function (l) { l.classList.add('on'); });
        hint.textContent = p.name + ' works on: ' + (p.projects.map(function (x) { return PROJECT_NAMES[x] || x; }).join(', ') || 'no projects listed yet') + '.';
      } else {
        $('.map-p[data-p="' + id + '"]', map).classList.add('on');
        var names = [];
        people.forEach(function (p) { if (p.projects.indexOf(id) > -1) { names.push(p.name); $('[data-person="' + p.id + '"]', map).classList.add('on'); } });
        $$('path[data-b="' + id + '"]', svg).forEach(function (l) { l.classList.add('on'); });
        hint.textContent = (PROJECT_NAMES[id] || id) + ' is built by: ' + (names.join(', ') || 'nobody listed yet') + '.';
      }
    }
    function bind(btn, type, id) {
      btn.addEventListener('mouseenter', function () { if (!locked) focus(type, id); });
      btn.addEventListener('mouseleave', function () { if (!locked) clear(); });
      btn.addEventListener('focus', function () { if (!locked) focus(type, id); });
      btn.addEventListener('blur', function () { if (!locked) clear(); });
      btn.addEventListener('click', function () {
        if (locked && locked.type === type && locked.id === id) { locked = null; clear(); btn.setAttribute('aria-pressed', 'false'); return; }
        $$('[aria-pressed]', map).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        locked = { type: type, id: id };
        btn.setAttribute('aria-pressed', 'true');
        focus(type, id);
      });
      btn.setAttribute('aria-pressed', 'false');
    }
    personBtns.forEach(function (b) { bind(b, 'person', b.getAttribute('data-person')); });
    projBtns.forEach(function (b) { bind(b, 'project', b.getAttribute('data-p')); });

    draw();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    // redraw once the section has finished its reveal animation
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { setTimeout(draw, 1000); o.disconnect(); } }); }).observe(map);
    }
  })();
})();
